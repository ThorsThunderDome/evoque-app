// manage_bounties.js
import { db, piUser } from './app.js';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

// Fetch creator data for sidebar
async function loadSidebarData() {
    const creatorDocRef = doc(db, 'creators', piUser.uid);
    try {
        const docSnap = await getDoc(creatorDocRef);
        if (docSnap.exists()) {
            const creatorData = docSnap.data();
            document.getElementById('creator-name-sidebar').textContent = creatorData.name;
            document.getElementById('creator-avatar-sidebar').src = creatorData.profileImage;
        }
    } catch (error) {
        console.error("Error fetching creator data for sidebar:", error);
    }
}

// --- Placeholder Logic for Bounties ---
const bountiesListDiv = document.getElementById('existing-bounties-list');
const mockBounty = {
    title: "My First Music Video",
    goal: 500,
    current: 125,
    supporters: 12
};

function loadBounties() {
    bountiesListDiv.innerHTML = '';
    const card = document.createElement('div');
    card.className = 'bounty-card';
    const progress = (mockBounty.current / mockBounty.goal) * 100;
    card.innerHTML = `
        <h3>${mockBounty.title}</h3>
        <p><strong>Goal:</strong> ${mockBounty.goal} π</p>
        <div class="progress-bar-container">
            <div class="progress-bar-fill" style="width: ${progress}%;"></div>
            <span class="progress-bar-text">${mockBounty.current} / ${mockBounty.goal} π</span>
        </div>
        <p>${mockBounty.supporters} supporters so far</p>
    `;
    bountiesListDiv.appendChild(card);
}

const createBountyForm = document.getElementById('create-bounty-form');
createBountyForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const formStatus = document.getElementById('form-status');
    formStatus.textContent = 'Bounty created successfully! (Placeholder)';
    createBountyForm.reset();
    setTimeout(() => formStatus.textContent = '', 3000);
});

// Run all page-load functions
loadSidebarData();
loadBounties();