// app.js - FINAL VERSION (WITH INITIALIZATION EVENT)

// --- All Imports ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-functions.js";
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

try {
    const functions = getFunctions(app, 'us-central1'); 
    window.piPayment = httpsCallable(functions, 'piPayment');
    Pi.init({ version: "2.0", sandbox: true });
} catch(e) {
    console.error("Initialization failed:", e);
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

export const onIncompletePaymentFound = async (payment) => {
    try {
        await window.piPayment({ action: 'complete', paymentId: payment.identifier, txid: payment.transaction.txid });
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

// app.js

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
                if (!paymentId || typeof paymentId !== 'string') {
                    console.error('[APPROVAL] Invalid or missing paymentId from Pi SDK.', paymentId);
                    alert('A critical error occurred: The payment process returned an invalid ID.');
                    return;
                }

                const payload = { action: 'approve', paymentId: paymentId };
                console.log('[APPROVAL] Sending payload to backend:', payload);

                window.piPayment(payload)
                    .then((result) => {
                        console.log('[APPROVAL] Backend approval successful:', result);
                    })
                    .catch((error) => {
                        console.error('[APPROVAL] Backend approval failed. Full Error:', error);
                        alert(`Payment approval failed: ${error.message}. Please check the console for details.`);
                    });
            },
            onReadyForServerCompletion: (paymentId, txid) => {
                console.log(`[COMPLETION] Received paymentId: ${paymentId} with txid: ${txid}`);
                const payload = { action: 'complete', paymentId: paymentId, txid: txid };
                console.log('[COMPLETION] Sending payload to backend:', payload);

                window.piPayment(payload)
                    .then((result) => {
                        console.log('[COMPLETION] Backend completion successful:', result);
                        alert("Payment Completed! Your access has been updated. Please refresh the page.");
                    })
                    .catch((error) => {
                        console.error('[COMPLETION] Backend completion failed. Full Error:', error);
                        alert(`Payment completion failed: ${error.message}. Please check the console for details.`);
                    });
            },
            onCancel: (paymentId) => {
                console.warn(`[CANCEL] Payment (#${paymentId}) was cancelled by the user.`);
                alert(`Payment (#${paymentId}) was cancelled.`);
            },
            onError: (error, payment) => {
                console.error('[ERROR] An SDK-level error occurred during payment.', { error, payment });
                alert(`An error occurred during the payment process. See console for details.`);
            }
        };

        await Pi.createPayment(paymentData, callbacks);

    } catch (err) {
        console.error("A fatal error occurred in createPiPayment:", err);
        throw err;
    }
}

// --- Main App Initialization Logic ---
function initializeAppLogic() {
    // Setup UI
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        const applyTheme = (theme) => {
            if (theme === 'light') { document.documentElement.setAttribute('data-theme', 'light'); themeToggle.checked = false; } 
            else { document.documentElement.removeAttribute('data-theme'); themeToggle.checked = true; }
            localStorage.setItem('theme', theme);
        };
        const currentTheme = localStorage.getItem('theme') || 'dark';
        applyTheme(currentTheme);
        themeToggle.addEventListener('change', function() { applyTheme(this.checked ? 'dark' : 'light'); });
    }
    const sidebarToggler = document.getElementById('sidebar-toggler');
    const appContent = document.getElementById('app-content');
    if (sidebarToggler && appContent) {
        sidebarToggler.addEventListener('click', () => { appContent.classList.toggle('sidebar-collapsed'); });
    }

    // Auth Check
    const usernameDisplay = document.getElementById('username-display');
    const isAuthPage = window.location.pathname.endsWith('index.html') || window.location.pathname === '/';
    if (!piUser && !isAuthPage) {
        window.location.href = 'index.html';
    } else if (usernameDisplay && piUser) {
        usernameDisplay.textContent = piUser.username;
    }

    // Attach Global Listeners
    const connectButtons = document.querySelectorAll('.connect-button');
    connectButtons.forEach(button => button.addEventListener('click', authenticateWithPi));
    
    // Make functions globally available
    window.createPiPayment = createPiPayment;
    
    // CRITICAL FIX: Announce that the app is ready for other scripts
    window.dispatchEvent(new CustomEvent('app-ready'));
}

// Run the main app logic when the document is ready.
document.addEventListener('DOMContentLoaded', initializeAppLogic);

