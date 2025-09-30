// This is the final, corrected main.js file
let db;
let piUser;

document.addEventListener('DOMContentLoaded', () => {
    const piUserString = sessionStorage.getItem('piUser');
    if (!piUserString && window.location.pathname !== '/index.html' && window.location.pathname !== '/') {
        window.location.href = 'index.html';
        return;
    }
    piUser = JSON.parse(piUserString);

    if (document.getElementById('username-display') && piUser) {
        document.getElementById('username-display').textContent = piUser.username;
    }

    // Make sure your firebaseConfig is correct here
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

    const sidebarToggler = document.getElementById('sidebar-toggler');
    const appContent = document.getElementById('app-content');
    if (sidebarToggler && appContent) {
        sidebarToggler.addEventListener('click', () => {
            appContent.classList.toggle('sidebar-collapsed');
        });
    }

    const path = window.location.pathname;
    if (path.includes('dashboard.html')) initDashboard();
    else if (path.includes('explore.html')) initExplorePage();
    else if (path.includes('creator.html')) initCreatorPage();
    else if (path.includes('creator_hub.html')) initCreatorHub();
    else if (path.includes('creator_dashboard.html')) initCreatorDashboard();
    else if (path.includes('manage_tiers.html')) initManageTiers();
    else if (path.includes('create_post.html')) initCreatePost();
    else if (path.includes('my_supporters.html')) initMySupporters();
});
