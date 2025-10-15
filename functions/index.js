const functions = require("firebase-functions");
const axios = require("axios");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

const PI_API_KEY = process.env.PI_API_KEY;
const PI_API_URL = "https://api.minepi.com/v2"; 

exports.processPiPayment = functions.https.onRequest(async (req, res) => {
    const allowedOrigin = "https://evoque-app-production.up.railway.app";
    res.set('Access-Control-Allow-Origin', allowedOrigin);

    if (req.method === 'OPTIONS') {
        res.set('Access-Control-Allow-Methods', 'POST');
        res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.set('Access-Control-Max-Age', '3600');
        return res.status(204).send('');
    }

    if (!PI_API_KEY) {
        console.error("FATAL ERROR: PI_API_KEY is not defined in the environment.");
        return res.status(500).json({ error: "Server configuration error. API key is missing." });
    }
    
    const requestHeaders = { 
        'Authorization': `Key ${PI_API_KEY}`
    };

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { action, paymentId, txid } = req.body;

        if (action === 'approve') {
            const response = await axios.post(`${PI_API_URL}/payments/${paymentId}/approve`, {}, { headers: requestHeaders });
            return res.status(200).json({ success: true, data: response.data });
        
        } else if (action === 'complete') {
            if (!txid) return res.status(400).json({ error: "txid is required for completion." });

            const paymentResponse = await axios.get(`${PI_API_URL}/payments/${paymentId}`, { headers: requestHeaders });
            const paymentData = paymentResponse.data;
            
            const metadata = paymentData.metadata || {};
            if (!metadata.supporterUid || !metadata.creatorUid || !metadata.tierId) {
                throw new Error('Payment metadata is missing. Cannot create subscription.');
            }

            // --- NEW: Transaction to handle NFT minting and subscription atomically ---
            const creatorRef = db.collection('creators').doc(metadata.creatorUid);
            const tierRef = db.collection('creators').doc(metadata.creatorUid).collection('tiers').doc(metadata.tierId);
            const subscriptionId = `${metadata.supporterUid}_${metadata.creatorUid}`;
            const subscriptionRef = db.collection('subscriptions').doc(subscriptionId);
            const nftsCollectionRef = db.collection('nfts');
            let newNftsCreated = [];

            await db.runTransaction(async (transaction) => {
                const creatorDoc = await transaction.get(creatorRef);
                const tierDoc = await transaction.get(tierRef);
                if (!creatorDoc.exists || !tierDoc.exists) {
                    throw "Creator or Tier not found.";
                }
                const creatorData = creatorDoc.data();
                const tierData = tierDoc.data();
                const supporterCount = creatorData.supporterCount || 0;

                // 1. Check for and mint "First Supporter" NFT
                if (creatorData.firstSupporterIncentiveActive && supporterCount < 100) {
                    const firstSupporterNftRef = nftsCollectionRef.doc(); // Auto-generate ID
                    const newSupporterNumber = supporterCount + 1;
                    transaction.set(firstSupporterNftRef, {
                        supporterUid: metadata.supporterUid,
                        creatorUid: metadata.creatorUid,
                        type: 'first_supporter',
                        supporterNumber: newSupporterNumber,
                        thankYouNote: "Thank you for being one of my first supporters! You're now part of my journey and will earn royalties.",
                        createdAt: admin.firestore.FieldValue.serverTimestamp()
                    });
                    transaction.update(creatorRef, { supporterCount: newSupporterNumber });
                    newNftsCreated.push({ type: 'first_supporter', number: newSupporterNumber });
                }

                // 2. Mint "Membership" NFT for the specific tier
                const membershipNftRef = nftsCollectionRef.doc(); // Auto-generate ID
                transaction.set(membershipNftRef, {
                    supporterUid: metadata.supporterUid,
                    creatorUid: metadata.creatorUid,
                    type: 'membership',
                    tierId: metadata.tierId,
                    tierName: tierData.name,
                    thankYouNote: tierData.thankYouNote || "Thank you for your amazing support!",
                    createdAt: admin.firestore.FieldValue.serverTimestamp()
                });
                newNftsCreated.push({ type: 'membership', tierName: tierData.name });

                // 3. Create or update the main subscription document
                transaction.set(subscriptionRef, {
                    supporterUid: metadata.supporterUid,
                    creatorUid: metadata.creatorUid,
                    tierId: metadata.tierId,
                    paymentId: paymentId,
                    status: 'active',
                    createdAt: admin.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
            });
            // --- END of Transaction ---

            // Finally, complete the payment with Pi's servers
            await axios.post(`${PI_API_URL}/payments/${paymentId}/complete`, { txid }, { headers: requestHeaders });
            
            functions.logger.info(`Subscription and NFTs created for ${metadata.supporterUid}`);
            
            return res.status(200).json({ 
                success: true, 
                subscription: { creatorId: metadata.creatorUid, tierId: metadata.tierId },
                nfts: newNftsCreated
            });

        } else {
            return res.status(400).json({ error: 'Invalid action specified.' });
        }
    } catch (error) {
        const errorMessage = error.response ? error.response.data : error.message;
        console.error("Error during Pi payment completion:", errorMessage);
        return res.status(500).json({ error: 'An internal server error occurred.', details: errorMessage });
    }
});
