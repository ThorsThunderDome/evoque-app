// This is main.js - our new shared script for all pages

// --- Global variables for Firebase ---
let db;

document.addEventListener('DOMContentLoaded', () => {
    console.log("main.js loaded.");

    // --- 1. HANDLE USER AUTHENTICATION (Runs on every page) ---
    const userDisplay = document.getElementById('username-display');
    const piUserString = sessionStorage.getItem('piUser');

    if (!piUserString && window.location.pathname !== '/index.html' && window.location.pathname !== '/') {
        // If not logged in AND not on the login page, redirect to login
        window.location.href = 'index.html';
        return;
    }
    
    const piUser = JSON.parse(piUserString);
    if (userDisplay && piUser) {
        userDisplay.textContent = piUser.username;
    }

    // --- 2. INITIALIZE FIREBASE (Runs on every page) ---
    // Remember to fill this in!
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
    console.log("Firebase initialized in main.js.");


    // --- 3. HANDLE SIDEBAR TOGGLE (Runs on every page) ---
    const sidebarToggler = document.getElementById('sidebar-toggler');
    const sidebar = document.getElementById('sidebar');

    if (sidebarToggler && sidebar) {
        sidebarToggler.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
        });
        console.log("Sidebar toggler is active.");
    }
});
