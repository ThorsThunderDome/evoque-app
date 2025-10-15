// creator_settings.js
import { db, piUser, uploadFile } from './app.js'; // Import uploadFile
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

// --- Page-Specific Logic ---
const creatorDocRef = doc(db, 'creators', piUser.uid);

// --- NEW: Image upload elements ---
const profileImageInput = document.getElementById('profile-image-input');
const profileImagePreview = document.getElementById('profile-image-preview');
const saveProfileImageBtn = document.getElementById('save-profile-image-btn');
const profileImageStatus = document.getElementById('profile-image-status');
let selectedProfileFile = null;

const headerImageInput = document.getElementById('header-image-input');
const headerImagePreview = document.getElementById('header-image-preview');
const saveHeaderImageBtn = document.getElementById('save-header-image-btn');
const headerImageStatus = document.getElementById('header-image-status');
let selectedHeaderFile = null;

// --- Existing elements ---
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
            // Update image previews and sidebar avatar with existing images
            profileImagePreview.src = creatorData.profileImage || 'images/default-avatar.png';
            document.getElementById('creator-avatar-sidebar').src = creatorData.profileImage || 'images/default-avatar.png';
            headerImagePreview.src = creatorData.headerImage || 'images/default-header.png';
            
            incentiveToggle.checked = creatorData.firstSupporterIncentiveActive;
            if (creatorData.firstSupporterIncentiveActive === false) {
                incentiveToggle.disabled = true;
                incentiveStatus.textContent = "This setting is permanently off.";
            }

            creatorNameInput.value = creatorData.name;
            creatorBioInput.value = creatorData.bio;
            
            if (creatorData.socialLinks) {
                twitterInput.value = creatorData.socialLinks.twitter || '';
                youtubeInput.value = creatorData.socialLinks.youtube || '';
            }
        }
    } catch (error) {
        console.error("Error loading creator data", error);
    }
}

// --- NEW: Image Preview Logic ---
profileImageInput.addEventListener('change', (e) => {
    selectedProfileFile = e.target.files[0];
    if (selectedProfileFile) {
        profileImagePreview.src = URL.createObjectURL(selectedProfileFile);
    }
});

headerImageInput.addEventListener('change', (e) => {
    selectedHeaderFile = e.target.files[0];
    if (selectedHeaderFile) {
        headerImagePreview.src = URL.createObjectURL(selectedHeaderFile);
    }
});

// --- NEW: Generic Image Upload Handler ---
async function handleImageUpload(file, statusElement, storagePath, firestoreField) {
    if (!file) {
        statusElement.textContent = "Please choose a file first.";
        return;
    }
    statusElement.textContent = "Uploading...";
    try {
        const imageUrl = await uploadFile(file, storagePath);
        await updateDoc(creatorDocRef, { [firestoreField]: imageUrl });
        statusElement.textContent = "Image updated successfully!";
        // Update sidebar avatar if profile image was changed
        if (firestoreField === 'profileImage') {
             document.getElementById('creator-avatar-sidebar').src = imageUrl;
        }
    } catch (error) {
        console.error(`Error uploading ${firestoreField}:`, error);
        statusElement.textContent = "Upload failed. Please try again.";
    }
}

saveProfileImageBtn.addEventListener('click', () => {
    const filePath = `creators/${piUser.uid}/profileImage.jpg`;
    handleImageUpload(selectedProfileFile, profileImageStatus, filePath, 'profileImage');
});

saveHeaderImageBtn.addEventListener('click', () => {
    const filePath = `creators/${piUser.uid}/headerImage.jpg`;
    handleImageUpload(selectedHeaderFile, headerImageStatus, filePath, 'headerImage');
});


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