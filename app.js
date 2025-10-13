// app.js - UPDATED VERSION

// Import functions from the Firebase SDKs
// Add getStorage to this line
import { getStorage } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-storage.js"; 
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-functions.js";

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

// --- Global Variables ---
// We initialize these here so all other scripts can use them.
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app); // <-- ADD THIS LINE
export const piUser = JSON.parse(sessionStorage.getItem('piUser'));

// --- Initialize Pi and Firebase Functions ---
try {
    const functions = getFunctions(app);
    window.piPayment = httpsCallable(functions, 'piPayment');
    Pi.init({ version: "2.0", sandbox: true });
} catch(e) {
    console.error("Initialization failed:", e);
}

// --- Common UI Logic ---
function setupCommonUI() {
    // Theme Switcher
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

    // Sidebar Toggler
    const sidebarToggler = document.getElementById('sidebar-toggler');
    const appContent = document.getElementById('app-content');
    if (sidebarToggler && appContent) {
        sidebarToggler.addEventListener('click', () => { appContent.classList.toggle('sidebar-collapsed'); });
    }

    // Username Display and Auth Check
    const usernameDisplay = document.getElementById('username-display');
    const isAuthPage = window.location.pathname.endsWith('index.html') || window.location.pathname === '/';
    if (!piUser && !isAuthPage) {
        window.location.href = 'index.html';
    } else if (usernameDisplay && piUser) {
        usernameDisplay.textContent = piUser.username;
    }
}
// Run the UI setup logic as soon as the DOM is ready
document.addEventListener('DOMContentLoaded', setupCommonUI);


// --- Reusable Functions ---

/**
     * This function is required by the Pi SDK.
     * It handles payments that were started but not completed.
     * We use it to call our backend to complete the transaction.
     */
    const onIncompletePaymentFound = async (payment) => {
        console.log("Incomplete payment found:", payment);
        try {
            await window.piPayment({ 
                action: 'complete', 
                paymentId: payment.identifier, 
                txid: payment.transaction.txid 
            });
            alert("Your previous payment was successfully completed!");
        } catch (error) {
            console.error("Failed to complete previous payment.", error);
            alert("There was an issue completing your previous payment. Please check your transaction history.");
        }
    };
    import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-storage.js";

/**
 * Uploads a file to Firebase Storage and returns the download URL.
 * @param {File} file The file to upload.
 * @param {string} path The path where the file should be stored (e.g., 'profileImages/userId').
 * @returns {Promise<string>} The public URL of the uploaded file.
 */
export async function uploadFile(file, path) {
  if (!file) return null;
  const storageRef = ref(storage, path);
  try {
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error("File upload failed:", error);
    throw new Error("File upload failed.");
  }
}
    /**
 * Authenticates the user with the Pi App.
 */
async function authenticateWithPi() {
    const authStatus = document.getElementById('auth-status');
    if (authStatus) {
        authStatus.textContent = 'Authenticating... Please check the Pi App.';
        authStatus.classList.remove('hidden');
    }
    try {
        const scopes = ['username', 'payments'];
        const authResult = await Pi.authenticate(scopes, onIncompletePaymentFound);
        
        sessionStorage.setItem('piUser', JSON.stringify(authResult.user));
        window.location.href = 'dashboard.html';
    } catch (err) {
        console.error("Authentication failed:", err);
        if (authStatus) {
            authStatus.textContent = `Authentication failed. Please try again.`;
        }
    }
}

/**
 * Creates a new Pi payment.
 */
async function createPiPayment() {
    try {
        const paymentData = {
            amount: 1.00,
            memo: "Subscription to My Creator Page",
            metadata: { userId: 'user123', plan: 'premium' }
        };
        
        const callbacks = {
            onReadyForServerApproval: async (paymentId) => {
                await window.piPayment({ action: 'approve', paymentId: paymentId });
            },
            onReadyForServerCompletion: async (paymentId, txid) => {
                await window.piPayment({ action: 'complete', paymentId: paymentId, txid: txid });
            },
            onCancel: (paymentId) => {
                alert("Payment was cancelled.");
            },
            onError: (error, payment) => {
                alert("An error occurred during payment.");
                console.error("Payment Error:", error);
            }
        };

        await Pi.createPayment(paymentData, callbacks);

    } catch (err) {
        alert("Failed to create payment.");
        console.error("createPayment error:", err);
    }
}
// --- Event Listeners ---
// We need to make sure these elements exist before adding listeners.

// For the main login page (index.html)
const connectButtons = document.querySelectorAll('.connect-button');
if (connectButtons.length > 0) {
    connectButtons.forEach(button => {
        button.addEventListener('click', authenticateWithPi);
    });
}

// For pages with a payment button (e.g., dashboard.html)
const payButton = document.getElementById('pay-button');
if (payButton) {
  payButton.addEventListener('click', createPiPayment);
}
