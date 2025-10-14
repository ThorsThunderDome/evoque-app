const functions = require("firebase-functions");
const axios = require("axios");
const admin = require("firebase-admin");
const https = require('https');
const crypto = require('crypto');

// WORKAROUND for SSL handshake issues with some servers/proxies
// This tells Node.js to be more flexible with its encryption negotiation.
https.globalAgent.options.secureOptions = crypto.constants.SSL_OP_LEGACY_SERVER_CONNECT;

admin.initializeApp();

const PI_API_KEY = process.env.PI_API_KEY;
const PI_API_URL_BY_IP = "https://104.18.1.135/v2"; 

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
        'Authorization': `Key ${PI_API_KEY}`,
        'Host': 'api.pi.network'
    };

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { action, paymentId, txid } = req.body;
        let response;

        if (action === 'approve') {
            response = await axios.post(`${PI_API_URL_BY_IP}/payments/${paymentId}/approve`, {}, { headers: requestHeaders });
            return res.status(200).json({ success: true, data: response.data });
        } else if (action === 'complete') {
            if (!txid) return res.status(400).json({ error: "txid is required for completion." });
            response = await axios.post(`${PI_API_URL_BY_IP}/payments/${paymentId}/complete`, { txid }, { headers: requestHeaders });
            return res.status(200).json({ success: true, data: response.data });
        } else {
            return res.status(400).json({ error: 'Invalid action specified.' });
        }
    } catch (error) {
        const errorMessage = error.response ? error.response.data : error.message;
        console.error("Error during Pi API call:", errorMessage);
        return res.status(500).json({ error: 'An internal server error occurred.', details: errorMessage });
    }
});