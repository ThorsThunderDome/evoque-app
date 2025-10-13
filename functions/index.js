const functions = require("firebase-functions");
const axios = require("axios");

// IMPORTANT: Replace this with your actual Pi App API Key
const PI_API_KEY = "v0hzu8zawl5x3vmhp3ikgzqxavgj309av3lqnefdexpathnkkcdfgqm0umiw0lkk"; 
const PI_API_URL = "https://api.minepi.com/v2/payments";

exports.piPayment = functions.https.onCall(async (data, context) => {
  const { action, paymentId, txid } = data;

  if (!action || !paymentId) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Function must be called with 'action' and 'paymentId'."
    );
  }

  // Determine the correct API endpoint (approve or complete)
  const endpoint = `${PI_API_URL}/${paymentId}/${action}`;
  // The body is empty for 'approve', and contains the txid for 'complete'
  const body = action === "complete" ? { txid } : {};

  try {
    console.log(`Sending POST request to: ${endpoint}`);
    const response = await axios.post(endpoint, body, {
      headers: {
        "Authorization": `Key ${PI_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    console.log("Pi API call successful:", response.data);
    return response.data;

  } catch (error) {
    console.error("Pi Network API call failed:", error.message);
    if (error.response && error.response.data) {
      console.error("Error details:", error.response.data);
    }
    throw new functions.https.HttpsError(
      "unknown",
      "An error occurred while processing the Pi payment."
    );
  }
});