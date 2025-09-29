document.addEventListener('DOMContentLoaded', () => {
    // --- 1. SETUP AND AUTHENTICATION ---
    const piUserString = sessionStorage.getItem('piUser');
    if (!piUserString && window.location.pathname !== '/index.html' && window.location.pathname !== '/') {
        window.location.href = 'index.html';
        return;
    }
    const piUser = JSON.parse(piUserString);
    if (document.getElementById('username-display') && piUser) {
        document.getElementById('username-display').textContent = piUser.username;
    }

    // --- 2. FIREBASE INITIALIZATION ---
    const firebaseConfig = {
            apiKey: "AIzaSyAJpReP6wVK925owZPC2U3J-Lv1fT7QKI4",
            authDomain: "evoque-app.firebaseapp.com",
            projectId: "evoque-app",
            storageBucket: "evoque-app.firebasestorage.app",
            messagingSenderId: "790735748571",
            appId: "1:790735748571:web:1938b35b04ef1c3a92fbfe",
            measurementId: "G-DG6WWPYQ3Z"
        };

    if (!firebase.apps.length) { firebase.initializeApp(firebaseConfig); }
    const db = firebase.firestore();

    // --- 3. SIDEBAR TOGGLE ---
    const sidebarToggler = document.getElementById('sidebar-toggler');
    const appContent = document.getElementById('app-content');
    if (sidebarToggler && appContent) {
        sidebarToggler.addEventListener('click', () => {
            appContent.classList.toggle('sidebar-collapsed');
        });
    }

    // --- 4. PAGE-SPECIFIC LOGIC ROUTER ---
    // This block checks which page we're on and calls the correct function.
    const path = window.location.pathname;
    if (path.includes('dashboard.html')) {
        initDashboard(db, piUser);
    } else if (path.includes('explore.html')) {
        initExplorePage(db, piUser);
    } else if (path.includes('creator.html')) {
        initCreatorPage(db, piUser);
    } else if (path.includes('creator_hub.html')) {
        initCreatorHub(db, piUser);
    } else if (path.includes('creator_dashboard.html')) {
        initCreatorDashboard(db, piUser);
    } else if (path.includes('manage_tiers.html')) {
        initManageTiers(db, piUser);
    } else if (path.includes('create_post.html')) {
        initCreatePost(db, piUser);
    } else if (path.includes('my_supporters.html')) {
        initMySupporters(db, piUser);
    }
});
