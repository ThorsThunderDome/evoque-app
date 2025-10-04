import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getFirestore, collection, doc, getDoc, getDocs, orderBy, query, setDoc, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

let db;
let piUser;

document.addEventListener('DOMContentLoaded', () => {
    const piUserString = sessionStorage.getItem('piUser');
    if (!piUserString && !window.location.pathname.endsWith('index.html') && !window.location.pathname.endsWith('/')) {
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
        const app = initializeApp(firebaseConfig);
        db = getFirestore(app);
    } catch(e) {
        alert("CRITICAL ERROR: Could not connect to the database.");
        return;
    }

    const sidebarToggler = document.getElementById('sidebar-toggler');
    const appContent = document.getElementById('app-content');
    if (sidebarToggler && appContent) {
        sidebarToggler.addEventListener('click', () => {
            appContent.classList.toggle('sidebar-collapsed');
        });
    }

    const path = window.location.pathname;
    if (path.includes('dashboard.html')) initDashboard({ db, piUser, collection, doc, getDoc });
    else if (path.includes('explore.html')) initExplorePage({ db, piUser, collection, getDocs, query });
    else if (path.includes('creator.html')) initCreatorPage({ db, piUser, collection, doc, getDoc, getDocs, query, orderBy });
    else if (path.includes('creator_hub.html')) initCreatorHub({ db, piUser, collection, doc, getDoc, setDoc });
    else if (path.includes('creator_dashboard.html')) initCreatorDashboard({ db, piUser, collection, doc, getDoc });
    else if (path.includes('manage_tiers.html')) initManageTiers({ db, piUser, collection, doc, addDoc, getDocs, query, orderBy, serverTimestamp });
    else if (path.includes('create_post.html')) initCreatePost({ db, piUser, collection, doc, addDoc, getDocs, query, orderBy, serverTimestamp });
    else if (path.includes('my_supporters.html')) initMySupporters({ db, piUser, collection, doc, getDoc });
});