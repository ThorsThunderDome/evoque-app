const functions = require("firebase-functions");
const axios = require("axios");
const admin = require("firebase-admin");

admin.initializeApp();

// The key is now loaded from process.env, which is populated by the .env file during deployment.
const PI_API_KEY = process.env.PI_API_KEY;

const PI_API_URL = "https://api.pi.network/v2";

exports.processPiPayment = functions.https.onRequest(async (req, res) => {
    const allowedOrigin = "https://evoque-app-production.up.railway.app";
    res.set('Access-Control-Allow-Origin', allowedOrigin);

    if (req.method === 'OPTIONS') {
        res.set('Access-Control-Allow-Methods', 'POST');
        res.set('Access-Control-Allow-Headers', 'Content-Type');
        res.set('Access-Control-Max-Age', '3600');
        return res.status(204).send('');
    }

    // Check if the key was loaded successfully.
    if (!PI_API_KEY) {
        console.error("FATAL ERROR: PI_API_KEY is not defined in the environment.");
        return res.status(500).json({ error: "Server configuration error. API key is missing." });
    }
    
    const headers = { "Authorization": `Key ${PI_API_KEY}` };

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { action, paymentId, txid } = req.body;
        functions.logger.info(`Received request:`, { action, paymentId, txid });

        if (!action || !paymentId) {
            functions.logger.error("Missing action or paymentId", { body: req.body });
            return res.status(400).json({ error: "Function must be called with 'action' and 'paymentId'." });
        }

let response;
        if (action === 'approve') {
            response = await axios.post(`${PI_API_URL}/payments/${paymentId}/approve`, {}, { headers });
            return res.status(200).json({ success: true, data: response.data });
        } else if (action === 'complete') {
            if (!txid) return res.status(400).json({ error: "txid is required for completion." });
            response = await axios.post(`${PI_API_URL}/payments/${paymentId}/complete`, { txid }, { headers });
            return res.status(200).json({ success: true, data: response.data });
        } else {
            return res.status(400).json({ error: 'Invalid action specified.' });
        }
    } catch (error) {
        const errorMessage = error.response ? error.response.data : error.message;
        return res.status(500).json({ error: 'An internal server error occurred.', details: errorMessage });
    }
});