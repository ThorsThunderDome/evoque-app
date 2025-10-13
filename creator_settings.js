// creator_settings.js
import { db, piUser } from './app.js';
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

// --- Page-Specific Logic ---
const creatorDocRef = doc(db, 'creators', piUser.uid);
const incentiveToggle = document.getElementById('incentive-toggle');
const incentiveStatus = document.getElementById('incentive-status');
const editProfileForm = document.getElementById('edit-profile-form');
const creatorNameInput = document.getElementById('creator-name');
const creatorBioInput = document.getElementById('creator-bio');
const editFormStatus = document.getElementById('edit-form-status');
const socialLinksForm = document.getElementById('social-links-form');
const twitterInput = document.getElementById('link-twitter');
const youtubeInput = document.getElementById('link-youtube');
const socialFormStatus = document.getElementById('social-form-status');

async function loadSettings() {
    try {
        const docSnap = await getDoc(creatorDocRef);
        if (docSnap.exists()) {
            const creatorData = docSnap.data();
            document.getElementById('creator-name-sidebar').textContent = creatorData.name;
            document.getElementById('creator-avatar-sidebar').src = creatorData.profileImage;

            // Incentive Toggle Logic
            incentiveToggle.checked = creatorData.firstSupporterIncentiveActive;
            if (creatorData.firstSupporterIncentiveActive === false) {
                incentiveToggle.disabled = true;
                incentiveStatus.textContent = "This setting is permanently off.";
            }

            // Pre-fill the edit form
            creatorNameInput.value = creatorData.name;
            creatorBioInput.value = creatorData.bio;
            
            // Pre-fill social links
            if (creatorData.socialLinks) {
                twitterInput.value = creatorData.socialLinks.twitter || '';
                youtubeInput.value = creatorData.socialLinks.youtube || '';
            }
        }
    } catch (error) {
        console.error("Error loading creator data", error);
    }
}

incentiveToggle.addEventListener('change', async (e) => {
    const newValue = e.target.checked;
    incentiveStatus.textContent = "Updating...";
    try {
        await updateDoc(creatorDocRef, { firstSupporterIncentiveActive: newValue });
        incentiveStatus.textContent = "Setting updated successfully!";
        if (newValue === false) {
            incentiveToggle.disabled = true;
            incentiveStatus.textContent = "This setting has been permanently turned off.";
        }
    } catch (error) {
        incentiveStatus.textContent = "Error updating setting. Please try again.";
        e.target.checked = !newValue; // Revert toggle on failure
    }
});

editProfileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    editFormStatus.textContent = "Saving...";
    const updatedData = {
        name: creatorNameInput.value,
        bio: creatorBioInput.value
    };
    try {
        await updateDoc(creatorDocRef, updatedData);
        editFormStatus.textContent = "Profile updated successfully!";
        document.getElementById('creator-name-sidebar').textContent = updatedData.name;
    } catch (error) {
        console.error("Error updating profile: ", error);
        editFormStatus.textContent = "Error updating profile. Please try again.";
    }
});

socialLinksForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    socialFormStatus.textContent = "Saving...";
    const socialLinksData = {
        twitter: twitterInput.value,
        youtube: youtubeInput.value
    };
    try {
        await updateDoc(creatorDocRef, { socialLinks: socialLinksData });
        socialFormStatus.textContent = "Social links updated successfully!";
    } catch (error) {
        socialFormStatus.textContent = "Error updating links. Please try again.";
    }
});

loadSettings();