// creator_hub.js - FINAL, COMPLETE VERSION
import { db, piUser, uploadFile } from './app.js';
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

function initializeCreatorHub() {
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
                window.location.href = 'creator_dashboard.html';
            } else {
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

        const imageFile = document.getElementById('profile-image-file').files[0];
        if (!imageFile) {
            formStatus.textContent = "Please select a profile image.";
            return;
        }

        try {
            const imagePath = `profileImages/${piUser.uid}/${imageFile.name}`; // CORRECTED PATH
            const imageUrl = await uploadFile(imageFile, imagePath);

            const newCreatorData = {
                name: document.getElementById('creator-name').value,
                bio: document.getElementById('creator-bio').value,
                profileImage: imageUrl,
                ownerUid: piUser.uid,
                supporterCount: 0,
                firstSupporterIncentiveActive: true
            };

            await setDoc(doc(db, 'creators', piUser.uid), newCreatorData);
            formStatus.textContent = "Profile created! Redirecting...";
            setTimeout(() => {
                window.location.href = 'creator_dashboard.html';
            }, 2000);
        } catch (error) {
            console.error("Error creating profile:", error);
            formStatus.textContent = "Error: Could not create profile.";
        }
    });

    checkCreatorStatus();
}

document.addEventListener('DOMContentLoaded', initializeCreatorHub);
