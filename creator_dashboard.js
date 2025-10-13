// creator_dashboard.js
import { db, piUser } from './app.js';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

async function loadCreatorData() {
    // Defensive check to ensure piUser and uid are available
    if (!piUser || !piUser.uid) {
        document.getElementById('main-content').innerHTML = "<h1>Error: Could not verify user ID. Please log in again.</h1>";
        return;
    }

    try {
        const creatorDocRef = doc(db, 'creators', piUser.uid);
        const docSnap = await getDoc(creatorDocRef);

        if (docSnap.exists()) {
            const creatorData = docSnap.data();
            document.getElementById('creator-name-main').textContent = creatorData.name;
            document.getElementById('creator-name-sidebar').textContent = creatorData.name;
            document.getElementById('creator-avatar-sidebar').src = creatorData.profileImage;
        } else {
            // If no creator profile exists for this user, send them to the registration page.
            window.location.href = 'creator_hub.html';
        }
    } catch (error) {
        console.error("Error fetching creator data:", error);
        document.getElementById('main-content').innerHTML = "<h1>Error loading your creator profile.</h1>";
    }
}

// Run the main function for this page
loadCreatorData();