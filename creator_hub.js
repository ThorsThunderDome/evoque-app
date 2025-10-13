// creator_hub.js
import { db, piUser } from './app.js';
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

const loader = document.getElementById('loader');
const registrationFormDiv = document.getElementById('creator-registration-form');

async function checkCreatorStatus() {
    if (!piUser || !piUser.uid) {
        loader.innerHTML = "<h1>Error: Could not verify user ID. Please log in again.</h1>";
        return;
    }

    const creatorDocRef = doc(db, 'creators', piUser.uid);
    try {
        const creatorDoc = await getDoc(creatorDocRef);
        if (creatorDoc.exists()) {
            // If they are already a creator, send them to their dashboard
            window.location.href = 'creator_dashboard.html';
        } else {
            // Otherwise, show the registration form
            loader.classList.add('hidden');
            registrationFormDiv.classList.remove('hidden');
        }
    } catch (error) {
        console.error("Error checking creator status:", error);
        loader.innerHTML = "<h1>Error checking creator status. Please try again.</h1>";
    }
}

const registrationForm = document.getElementById('registration-form');
registrationForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formStatus = document.getElementById('form-status');
    formStatus.textContent = "Creating profile...";

    const newCreatorData = {
        name: document.getElementById('creator-name').value,
        bio: document.getElementById('creator-bio').value,
        profileImage: document.getElementById('profile-image').value,
        ownerUid: piUser.uid,
        supporterCount: 0, // Initialize supporter count
        firstSupporterIncentiveActive: true // Default to on
    };

    try {
        await setDoc(doc(db, 'creators', piUser.uid), newCreatorData);
        formStatus.textContent = "Profile created! Redirecting...";
        setTimeout(() => {
            window.location.href = 'creator_dashboard.html';
        }, 2000);
    } catch (error) {
        console.error("Error creating profile:", error);
        formStatus.textContent = "Error: Could not create profile. Please try again.";
    }
});

// Run the main function for this page
checkCreatorStatus();