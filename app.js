document.addEventListener('DOMContentLoaded', () => {
    // --- 1. INITIALIZE PI SDK & FIREBASE ---
    const connectButton = document.getElementById('pi-connect-btn');
    const authStatus = document.getElementById('auth-status');

    // **IMPORTANT**: PASTE YOUR FIREBASE CONFIGURATION OBJECT HERE
        const firebaseConfig = {
            apiKey: "AIzaSyAJpReP6wVK925owZPC2U3J-Lv1fT7QKI4",
            authDomain: "evoque-app.firebaseapp.com",
            projectId: "evoque-app",
            storageBucket: "evoque-app.firebasestorage.app",
            messagingSenderId: "790735748571",
            appId: "1:790735748571:web:1938b35b04ef1c3a92fbfe",
            measurementId: "G-DG6WWPYQ3Z"
        };

    // Initialize Firebase
    try {
        if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY") {
            firebase.initializeApp(firebaseConfig);
            console.log("Firebase Initialized Successfully.");
        } else {
            console.warn("Firebase config is a placeholder. Please replace it with your actual config.");
        }
    } catch (e) {
        console.error("Firebase initialization failed:", e);
    }
    
    // Initialize Pi SDK
    try {
        Pi.init({ version: "2.0", sandbox: true });
        console.log("Pi SDK Initialized.");
    } catch (err) {
        console.error("Pi SDK initialization failed:", err);
        authStatus.textContent = "Pi SDK failed to load. Please refresh.";
        authStatus.classList.remove('hidden');
    }

    // --- 2. AUTHENTICATION LOGIC ---
    async function authenticateWithPi() {
        authStatus.textContent = 'Authenticating...';
        authStatus.classList.remove('hidden');
        
        try {
            const scopes = ['username', 'payments'];
            const authResult = await Pi.authenticate(scopes, onIncompletePaymentFound);
            
            console.log("Authentication successful. User data received:", authResult.user);
            
            // Store user data in sessionStorage to access on other pages
            sessionStorage.setItem('piUser', JSON.stringify(authResult.user));
            console.log("User data stored in sessionStorage.");

            authStatus.textContent = `Welcome, ${authResult.user.username}! Redirecting...`;

            console.log("Redirecting to dashboard.html...");
            // Redirect to the dashboard page after successful login
            window.location.href = 'dashboard.html';

        } catch (err) {
            console.error("Authentication failed:", err);
            authStatus.textContent = `Authentication failed: ${err.message || err}. Please try again.`;
        }
    }

    function onIncompletePaymentFound(payment) {
        console.log("Incomplete payment found:", payment);
        // Here you would typically handle the incomplete payment
        // For now, we'll just log it.
    };

    // --- 3. EVENT LISTENERS ---
    if (connectButton) {
        connectButton.addEventListener('click', authenticateWithPi);
    } else {
        console.error("Connect button not found.");
    }

});
