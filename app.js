// app.js - FINAL, COMPLETE VERSION (WITH REGION & PAYMENT ID FIX)

// --- All Imports Must Be at the Top ---
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
    // CRITICAL FIX #1: Specify the function's region ('us-central1')
    // This resolves the 400 Bad Request error by telling the client exactly where to send the data.
    const functions = getFunctions(app, 'us-central1'); 
    window.piPayment = httpsCallable(functions, 'piPayment');
    
    Pi.init({ version: "2.0", sandbox: true });
} catch(e) {
    console.error("Initialization failed:", e);
}

// --- Reusable Functions (Available for Import) ---
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

// --- Functions that will be attached to the window object ---
async function authenticateWithPi() {
    const onIncompletePaymentFound = async (payment) => {
        try {
            await window.piPayment({ action: 'complete', paymentId: payment.identifier, txid: payment.transaction.txid });
            alert("Your previous payment was successfully completed!");
        } catch (error) {
            console.error("Failed to complete previous payment.", error);
        }
    };
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
            onReadyForServerApproval: async (paymentId) => {
                // CRITICAL FIX #2: Add a safety check for the paymentId
                console.log("onReadyForServerApproval triggered with paymentId:", paymentId); // For debugging
                if (!paymentId) {
                    console.error("Payment ID is missing in onReadyForServerApproval callback!");
                    alert("Error: Could not get a valid Payment ID from Pi. Please try again.");
                    return; // Stop the function if the ID is invalid
                }
                await window.piPayment({ action: 'approve', paymentId: paymentId });
            },
            onReadyForServerCompletion: async (paymentId, txid) => {
                await window.piPayment({ action: 'complete', paymentId: paymentId, txid: txid });
                alert("Payment Completed! Your access has been updated. Please refresh the page.");
            },
            onCancel: (paymentId) => { alert(`Payment (#${paymentId}) was cancelled.`); },
            onError: (error, payment) => { 
                alert(`An error occurred during payment (#${payment ? payment.identifier : 'N/A'}).`); 
                console.error("Payment Error:", error);
            }
        };
        await Pi.createPayment(paymentData, callbacks);
    } catch (err) {
        console.error("createPiPayment error:", err);
    }
}

// --- Main App Initialization Logic ---
function initializeAppLogic() {
    // Setup Theme Switcher
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

    // Setup Sidebar Toggler
    const sidebarToggler = document.getElementById('sidebar-toggler');
    const appContent = document.getElementById('app-content');
    if (sidebarToggler && appContent) {
        sidebarToggler.addEventListener('click', () => { appContent.classList.toggle('sidebar-collapsed'); });
    }

    // Auth Check & Username Display
    const usernameDisplay = document.getElementById('username-display');
    const isAuthPage = window.location.pathname.endsWith('index.html') || window.location.pathname === '/';
    if (!piUser && !isAuthPage) {
        window.location.href = 'index.html';
    } else if (usernameDisplay && piUser) {
        usernameDisplay.textContent = piUser.username;
    }

    // Attach Event Listeners
    const connectButtons = document.querySelectorAll('.connect-button');
    connectButtons.forEach(button => button.addEventListener('click', authenticateWithPi));
    
    // Make functions globally available
    window.createPiPayment = createPiPayment;
}

// Run the main app logic only when the document is fully loaded.
document.addEventListener('DOMContentLoaded', initializeAppLogic);

