// app.js

// --- Firebase Initialization ---
// IMPORTANT: Replace with your actual Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAJpReP6wVK925owZPC2U3J-Lv1fT7QKI4",
  authDomain: "evoque-app.firebaseapp.com",
  projectId: "evoque-app",
  storageBucket: "evoque-app.firebasestorage.app",
  messagingSenderId: "790735748571",
  appId: "1:790735748571:web:1938b35b04ef1c3a92fbfe",
  measurementId: "G-DG6WWPYQ3Z"
};


import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithCustomToken } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, serverTimestamp, updateDoc } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let piUser = null; // This will hold the authenticated user object

// --- Pi SDK Initialization ---
window.Pi.init({ version: "2.0", sandbox: true });

// --- Core Authentication Flow ---
async function authenticateWithPi() {
    try {
        const scopes = ['username', 'payments'];
        const user = await window.Pi.authenticate(scopes, onIncompletePaymentFound);
        if (user && user.auth_token) {
            // Sign in to Firebase with the custom token from Pi
            const credential = await signInWithCustomToken(auth, user.auth_token);
            // The onAuthStateChanged listener below will handle the rest
            console.log("Firebase sign-in successful.");
        }
    } catch (err) {
        console.error("Pi authentication failed:", err);
        // Handle failed authentication, e.g., show a message to the user
    }
}

// Listener for Firebase Auth state changes
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // User is signed in.
        piUser = user; // Set the global piUser object
        console.log("Firebase user authenticated:", piUser.uid);

        // Check if user exists in Firestore, if not, create them
        const userRef = doc(db, "users", piUser.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            await setDoc(userRef, {
                username: user.username, // Assuming username comes from Pi auth
                createdAt: serverTimestamp(),
                uid: piUser.uid
            });
            console.log("New user profile created in Firestore.");
        } else {
             console.log("Existing user found in Firestore.");
        }

        // IMPORTANT: Dispatch a custom event to notify all other scripts that authentication is complete.
        // All other pages will wait for this event before fetching data.
        window.dispatchEvent(new CustomEvent('app-ready'));
        
        // Update UI elements that are common across all pages
        updateCommonUI(piUser.username);

    } else {
        // User is signed out.
        piUser = null;
        console.log("User is signed out.");
        updateCommonUI(null);
    }
});

// --- Incomplete Payment Handling ---
// This function needs to be globally accessible
async function onIncompletePaymentFound(payment) {
    console.log("Incomplete payment found:", payment);
    try {
        // Example: Update your Firestore database to mark the subscription as complete
        const { supporterUid, creatorUid, tierId } = payment.metadata;
        const supporterRef = doc(db, "creators", creatorUid, "supporters", supporterUid);
        await setDoc(supporterRef, {
            tierId: tierId,
            subscribedAt: serverTimestamp(),
            paymentId: payment.identifier
        }, { merge: true });
        console.log("Subscription recorded for incomplete payment.");
        // Potentially redirect or show a success message
    } catch (error) {
        console.error("Failed to process incomplete payment:", error);
    }
}

// --- UI Helper Functions ---
function updateCommonUI(username) {
    const usernameDisplay = document.getElementById('username-display');
    if (usernameDisplay) {
        usernameDisplay.textContent = username || 'Not logged in';
    }
    // Add logic for login/logout buttons if they exist in your sidebar
}


// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    // Attempt to authenticate when the app loads
    authenticateWithPi();

    // Sidebar toggler for mobile view
    const sidebarToggler = document.getElementById('sidebar-toggler');
    const appContent = document.getElementById('app-content');
    if (sidebarToggler && appContent) {
        sidebarToggler.addEventListener('click', () => {
            appContent.classList.toggle('sidebar-collapsed');
        });
    }

    // Scroll to top button
    const scrollToTopBtn = document.getElementById("scrollToTopBtn");
    if (scrollToTopBtn) {
        window.onscroll = function() {
            if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
                scrollToTopBtn.style.display = "block";
            } else {
                scrollToTopBtn.style.display = "none";
            }
        };
        scrollToTopBtn.addEventListener('click', () => {
            document.body.scrollTop = 0;
            document.documentElement.scrollTop = 0;
        });
    }
});


// Export necessary variables and functions for other modules to use
export { db, auth, piUser, onIncompletePaymentFound };
