const functions = require("firebase-functions");
const axios = require("axios");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore(); // Initialize Firestore

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
        let response;

        if (action === 'approve') {
            response = await axios.post(`${PI_API_URL}/payments/${paymentId}/approve`, {}, { headers: requestHeaders });
            return res.status(200).json({ success: true, data: response.data });
        
        } else if (action === 'complete') {
            if (!txid) return res.status(400).json({ error: "txid is required for completion." });

            // First, get the payment details from Pi to retrieve our metadata
            const paymentResponse = await axios.get(`${PI_API_URL}/payments/${paymentId}`, { headers: requestHeaders });
            const paymentData = paymentResponse.data;
            
            const metadata = paymentData.metadata || {};
            if (!metadata.supporterUid || !metadata.creatorUid || !metadata.tierId) {
                throw new Error('Payment metadata is missing. Cannot create subscription.');
            }
            
            // Now, complete the payment with Pi's servers
            await axios.post(`${PI_API_URL}/payments/${paymentId}/complete`, { txid }, { headers: requestHeaders });
            
            // --- NEW LOGIC: Save the subscription to Firestore ---
            const subscriptionData = {
                supporterUid: metadata.supporterUid,
                creatorUid: metadata.creatorUid,
                tierId: metadata.tierId,
                paymentId: paymentId,
                status: 'active',
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            };
            
            // Use a consistent document ID for the subscription
            const subscriptionId = `${subscriptionData.supporterUid}_${subscriptionData.creatorUid}`;
            await db.collection('subscriptions').doc(subscriptionId).set(subscriptionData, { merge: true });
            
            functions.logger.info(`Subscription created/updated for ${subscriptionData.supporterUid}`, subscriptionData);
            
            // Return the necessary data to the frontend so it can update its state
            return res.status(200).json({ 
                success: true, 
                subscription: {
                    creatorId: subscriptionData.creatorUid,
                    tierId: subscriptionData.tierId
                }
            });

        } else {
            return res.status(400).json({ error: 'Invalid action specified.' });
        }
    } catch (error) {
        const errorMessage = error.response ? error.response.data : error.message;
        console.error("Error during Pi API call:", errorMessage);
        return res.status(500).json({ error: 'An internal server error occurred.', details: errorMessage });
    }
});