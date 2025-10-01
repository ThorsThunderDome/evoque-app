let db;
let piUser;

document.addEventListener('DOMContentLoaded', () => {
    // --- User session logic (no changes here) ---
    const piUserString = sessionStorage.getItem('piUser');
    if (!piUserString && !window.location.pathname.endsWith('index.html') && window.location.pathname !== '/') {
        window.location.href = 'index.html';
        return;
    }
    if (piUserString) {
        piUser = JSON.parse(piUserString);
    }
    const userDisplay = document.getElementById('username-display');
    if (userDisplay && piUser) {
        userDisplay.textContent = piUser.username;
    }

    // --- UPDATED FIREBASE INITIALIZATION WITH ERROR CHECK ---
    try {
        // Double-check that this config is a perfect copy from your Firebase Console
             const firebaseConfig = {
  apiKey: "AIzaSyAJpReP6wVK925owZPC2U3J-Lv1fT7QKI4",
  authDomain: "evoque-app.firebaseapp.com",
  projectId: "evoque-app",
  storageBucket: "evoque-app.firebasestorage.app",
  messagingSenderId: "790735748571",
  appId: "1:790735748571:web:1938b35b04ef1c3a92fbfe",
  measurementId: "G-DG6WWPYQ3Z"
};
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        db = firebase.firestore();
    } catch (error) {
        // If this alert box appears, the firebaseConfig object is wrong.
        alert("CRITICAL ERROR: Firebase initialization failed. Please double-check your firebaseConfig in main.js. Error: " + error.message);
        return; // Stop all other code from running
    }
    
    // --- Sidebar and Page Router logic (no changes here) ---
    const sidebarToggler = document.getElementById('sidebar-toggler');
    const appContent = document.getElementById('app-content');
    if (sidebarToggler && appContent) {
        sidebarToggler.addEventListener('click', () => {
            appContent.classList.toggle('sidebar-collapsed');
        });
    }

    const path = window.location.pathname;
    if (path.includes('dashboard.html')) initDashboard();
     else if (path.includes('explore.html')) {
        alert("main.js is about to call initExplorePage()"); 
        initExplorePage();
     }
    else if (path.includes('creator.html')) initCreatorPage();
    else if (path.includes('creator_hub.html')) initCreatorHub();
    else if (path.includes('creator_dashboard.html')) initCreatorDashboard();
    else if (path.includes('manage_tiers.html')) initManageTiers();
    else if (path.includes('create_post.html')) initCreatePost();
    else if (path.includes('my_supporters.html')) initMySupporters();
});
