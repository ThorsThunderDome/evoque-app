let db;
let piUser;

document.addEventListener('DOMContentLoaded', () => {
    console.log("Checkpoint 1: DOMContentLoaded event fired.");

    try {
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
        console.log("Checkpoint 2: User session handled successfully.");
    } catch (error) {
        console.error("CRITICAL ERROR AT CHECKPOINT 2:", error);
        return;
    }

    try {
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
        console.log("Checkpoint 3: Firebase initialized successfully.");
    } catch (error) {
        console.error("CRITICAL ERROR AT CHECKPOINT 3 (Firebase Init):", error);
        return;
    }

    try {
        const sidebarToggler = document.getElementById('sidebar-toggler');
        const appContent = document.getElementById('app-content');
        if (sidebarToggler && appContent) {
            sidebarToggler.addEventListener('click', () => {
                appContent.classList.toggle('sidebar-collapsed');
            });
        }
        console.log("Checkpoint 4: Sidebar toggler set up successfully.");
    } catch (error) {
        console.error("CRITICAL ERROR AT CHECKPOINT 4:", error);
        return;
    }

    const path = window.location.pathname;
    console.log("Checkpoint 5: Router is starting. Current path:", path);
    
    if (path.includes('dashboard.html')) initDashboard();
    else if (path.includes('explore.html')) initExplorePage();
    else if (path.includes('creator.html')) initCreatorPage();
    else if (path.includes('creator_hub.html')) initCreatorHub();
    else if (path.includes('creator_dashboard.html')) initCreatorDashboard();
    else if (path.includes('manage_tiers.html')) initManageTiers();
    else if (path.includes('create_post.html')) initCreatePost();
    else if (path.includes('my_supporters.html')) initMySupporters();

    console.log("Checkpoint 6: Router has finished.");
});
