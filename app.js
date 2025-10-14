// app.js - FINAL VERSION (WITH FETCH)

// --- All Imports ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-storage.js";

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyAJpReP6wVK925owZPC2U3J-Lv1fT7QKI4",
  authDomain: "evoque-app.firebaseapp.com",
  projectId: "evoque-app",
  storageBucket: "evoque-app.firebasestorage.app",
  messagingSenderId: "790735748571",
  appId: "1:790735748571:web:1938b35b04ef1c3a92fbfe",
  measurementId: "G-DG6WWPYQ3Z"
};

// --- Global Variables & Initialization ---
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const piUser = JSON.parse(sessionStorage.getItem('piUser'));
const PI_PAYMENT_FUNCTION_URL = "https://us-central1-evoque-app.cloudfunctions.net/piPayment";

try {
    Pi.init({ version: "2.0", sandbox: true });
} catch(e) {
    console.error("Pi.init failed:", e);
}

// --- Reusable Functions ---
export async function uploadFile(file, path) {
  if (!file) return null;
  const storageRef = ref(storage, path);
  try {
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
  } catch (error) {
    console.error("File upload failed:", error);
    throw new Error("File upload failed.");
  }
}

async function callPiPaymentAPI(payload) {
    const response = await fetch(PI_PAYMENT_FUNCTION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}` }));
        throw new Error(errorData.error || errorData.message);
    }
    return response.json();
}

export const onIncompletePaymentFound = async (payment) => {
    try {
        await callPiPaymentAPI({ action: 'complete', paymentId: payment.identifier, txid: payment.transaction.txid });
        alert("Your previous payment was successfully completed!");
    } catch (error) {
        console.error("Failed to complete previous payment.", error);
    }
};

async function authenticateWithPi() {
    try {
        const scopes = ['username', 'payments'];
        const authResult = await Pi.authenticate(scopes, onIncompletePaymentFound);
        sessionStorage.setItem('piUser', JSON.stringify(authResult.user));
        window.location.href = 'dashboard.html';
    } catch (err) {
        console.error("Authentication failed:", err);
    }
}

async function createPiPayment(paymentDetails) {
    try {
        const paymentData = {
            amount: paymentDetails.amount,
            memo: paymentDetails.memo,
            metadata: paymentDetails.metadata
        };

        const callbacks = {
            onReadyForServerApproval: (paymentId) => {
                console.log(`[APPROVAL] Received paymentId: ${paymentId}`);
                const payload = { action: 'approve', paymentId: paymentId };
                console.log('[APPROVAL] Sending payload to backend via fetch:', payload);

                callPiPaymentAPI(payload)
                    .then((result) => console.log('[APPROVAL] Backend approval successful:', result))
                    .catch((error) => {
                        console.error('[APPROVAL] Backend approval failed:', error);
                        alert(`Payment approval failed: ${error.message}.`);
                    });
            },
            onReadyForServerCompletion: (paymentId, txid) => {
                console.log(`[COMPLETION] Received paymentId: ${paymentId}, txid: ${txid}`);
                const payload = { action: 'complete', paymentId: paymentId, txid: txid };
                console.log('[COMPLETION] Sending payload to backend via fetch:', payload);

                callPiPaymentAPI(payload)
                    .then((result) => {
                        console.log('[COMPLETION] Backend completion successful:', result);
                        alert("Payment Completed! Your access has been updated. Please refresh the page.");
                    })
                    .catch((error) => {
                        console.error('[COMPLETION] Backend completion failed:', error);
                        alert(`Payment completion failed: ${error.message}.`);
                    });
            },
            onCancel: (paymentId) => alert(`Payment (#${paymentId}) was cancelled.`),
            onError: (error) => alert(`An error occurred during payment: ${error.message}.`)
        };
        await Pi.createPayment(paymentData, callbacks);
    } catch (err) {
        console.error("createPiPayment error:", err);
        throw err;
    }
}

// --- Main App Initialization Logic ---
function initializeAppLogic() {
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        const applyTheme = (theme) => {
            document.documentElement.setAttribute('data-theme', theme);
            themeToggle.checked = theme === 'dark';
            localStorage.setItem('theme', theme);
        };
        const currentTheme = localStorage.getItem('theme') || 'dark';
        applyTheme(currentTheme);
        themeToggle.addEventListener('change', function() { applyTheme(this.checked ? 'dark' : 'light'); });
    }
    const sidebarToggler = document.getElementById('sidebar-toggler');
    const appContent = document.getElementById('app-content');
    if (sidebarToggler && appContent) {
        sidebarToggler.addEventListener('click', () => appContent.classList.toggle('sidebar-collapsed'));
    }

    const usernameDisplay = document.getElementById('username-display');
    const isAuthPage = window.location.pathname.endsWith('index.html') || window.location.pathname === '/';
    if (!piUser && !isAuthPage) {
        window.location.href = 'index.html';
    } else if (usernameDisplay && piUser) {
        usernameDisplay.textContent = piUser.username;
    }

    const connectButtons = document.querySelectorAll('.connect-button');
    connectButtons.forEach(button => button.addEventListener('click', authenticateWithPi));
    
    window.createPiPayment = createPiPayment;
    window.dispatchEvent(new CustomEvent('app-ready'));
}

document.addEventListener('DOMContentLoaded', initializeAppLogic);