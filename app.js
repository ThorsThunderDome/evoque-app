// app.js
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
// CRITICAL FIX: DO NOT export piUser. It creates a stale, null variable.
// Each module will get the fresh user data from sessionStorage when it needs it.

const PI_PAYMENT_FUNCTION_URL = "https://us-central1-evoque-app.cloudfunctions.net/processPiPayment";

try {
    Pi.init({ version: "2.0", sandbox: false });
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
        let detailedMessage = errorData.error || 'Unknown server error';
        if (errorData.details) {
            const detailsString = typeof errorData.details === 'object' ? JSON.stringify(errorData.details) : errorData.details;
            detailedMessage += ` | Details: ${detailsString}`;
        }
        throw new Error(detailedMessage);
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
                const payload = { action: 'approve', paymentId: paymentId };
                callPiPaymentAPI(payload)
                    .then(result => console.log('[APPROVAL] Backend approval successful:', result))
                    .catch(error => {
                        console.error('[APPROVAL] Backend approval failed:', error);
                        alert(`Payment approval failed: ${error.message}.`);
                    });
            },
            onReadyForServerCompletion: (paymentId, txid) => {
                const payload = { action: 'complete', paymentId: paymentId, txid: txid };
                callPiPaymentAPI(payload)
                    .then(result => {
                        console.log('[COMPLETION] Backend completion successful:', result);
                        if (result.success && result.subscription) {
                            const { creatorId, tierId } = result.subscription;
                            const membershipKey = `membership_${creatorId}`;
                            sessionStorage.setItem(membershipKey, JSON.stringify({ tierId }));
                            alert("Payment Completed! Your access has been updated. The page will now refresh.");
                            window.location.reload(); 
                        } else {
                            alert("Payment Completed! Please refresh the page to see your new access.");
                        }
                    })
                    .catch(error => {
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

// --- NEW: Disconnect Function ---
function disconnect() {
    sessionStorage.removeItem('piUser');
    // Clear all membership keys as well
    Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith('membership_')) {
            sessionStorage.removeItem(key);
        }
    });
    window.location.href = 'index.html';
}

// --- NEW: Scroll to Top Logic ---
function initializeScrollToTop() {
    const scrollToTopBtn = document.getElementById('scrollToTopBtn');
    if (!scrollToTopBtn) return;

    // Show or hide the button based on scroll position
    window.onscroll = function() {
        const scrollTrigger = window.innerHeight / 2; // Show button after scrolling half a screen
        if (document.body.scrollTop > scrollTrigger || document.documentElement.scrollTop > scrollTrigger) {
            scrollToTopBtn.style.display = "block";
        } else {
            scrollToTopBtn.style.display = "none";
        }
    };

    // Scroll to the top when the button is clicked
    scrollToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}


// --- Main App Initialization Logic ---
function initializeAppLogic() {
    // --- Theme Toggle ---
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

    // --- Sidebar Toggle ---
    const sidebarToggler = document.getElementById('sidebar-toggler');
    const appContent = document.getElementById('app-content');
    if (sidebarToggler && appContent) {
        sidebarToggler.addEventListener('click', () => appContent.classList.toggle('sidebar-collapsed'));
    }

    // --- Auth Check (Persistent Login) ---
    // This logic correctly uses sessionStorage, so refreshing the page will keep the user logged in.
    const usernameDisplay = document.getElementById('username-display');
    const isAuthPage = window.location.pathname.endsWith('index.html') || window.location.pathname === '/';
    if (!piUser && !isAuthPage) {
        window.location.href = 'index.html';
    } else if (usernameDisplay && piUser) {
        usernameDisplay.textContent = piUser.username;
    }

    // --- Attach Global Listeners ---
    const connectButtons = document.querySelectorAll('.connect-button');
    connectButtons.forEach(button => button.addEventListener('click', authenticateWithPi));
    
    // --- NEW: Attach Disconnect Listener ---
    const disconnectBtn = document.getElementById('disconnect-btn');
    if (disconnectBtn) {
        disconnectBtn.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent the link from navigating
            disconnect();
        });
    }

    // Make functions globally available
    window.createPiPayment = createPiPayment;
    
    // --- NEW: Initialize Scroll to Top Button ---
    initializeScrollToTop();

    // Announce that the app is ready for other scripts
    window.dispatchEvent(new CustomEvent('app-ready'));
}

document.addEventListener('DOMContentLoaded', initializeAppLogic);
