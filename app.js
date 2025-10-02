document.addEventListener('DOMContentLoaded', () => {
    const connectButton = document.getElementById('pi-connect-btn');
    const authStatus = document.getElementById('auth-status');

    // **IMPORTANT**: Fill in your Firebase config here
         const firebaseConfig = {
  apiKey: "AIzaSyAJpReP6wVK925owZPC2U3J-Lv1fT7QKI4",
  authDomain: "evoque-app.firebaseapp.com",
  projectId: "evoque-app",
  storageBucket: "evoque-app.firebasestorage.app",
  messagingSenderId: "790735748571",
  appId: "1:790735748571:web:1938b35b04ef1c3a92fbfe",
  measurementId: "G-DG6WWPYQ3Z"
};
    try {
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
    } catch(e) {
        console.error("Firebase init failed on index.html", e);
        authStatus.textContent = "Error initializing. Please refresh.";
        authStatus.classList.remove('hidden');
    }
    
    try {
        Pi.init({ version: "2.0", sandbox: true });
    } catch (err) {
        console.error("Pi SDK initialization failed:", err);
        authStatus.textContent = "Pi SDK failed to load. Please refresh.";
        authStatus.classList.remove('hidden');
    }

    async function authenticateWithPi() {
        authStatus.textContent = 'Authenticating...';
        authStatus.classList.remove('hidden');
        try {
            const scopes = ['username', 'payments'];
            const onIncompletePaymentFound = (payment) => { console.log('Incomplete payment found:', payment); };
            const authResult = await Pi.authenticate(scopes, onIncompletePaymentFound);
            
            sessionStorage.setItem('piUser', JSON.stringify(authResult.user));

            authStatus.textContent = `Welcome, ${authResult.user.username}! Redirecting...`;
            window.location.href = 'dashboard.html';
        } catch (err) {
            authStatus.textContent = `Authentication failed: ${err.message || err}. Please try again.`;
        }
    }

    if (connectButton) {
        connectButton.addEventListener('click', authenticateWithPi);
    }
});
