// manage_tiers.js
import { db, piUser } from './app.js';
import { collection, doc, getDoc, getDocs, addDoc, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

const creatorDocRef = doc(db, 'creators', piUser.uid);
const tiersCollectionRef = collection(creatorDocRef, 'tiers');

// Load sidebar and existing tiers when the page opens
async function initializePage() {
    try {
        const docSnap = await getDoc(creatorDocRef);
        if (docSnap.exists()) {
            const creatorData = docSnap.data();
            document.getElementById('creator-name-sidebar').textContent = creatorData.name;
            document.getElementById('creator-avatar-sidebar').src = creatorData.profileImage;
        }
    } catch (error) {
        console.error("Error loading creator data for sidebar:", error);
    }
    loadTiers();
}

async function loadTiers() {
    const tierListDiv = document.getElementById('existing-tiers-list');
    tierListDiv.innerHTML = '<div class="loader"></div>';
    try {
        const q = query(tiersCollectionRef, orderBy('price'));
        const snapshot = await getDocs(q);
        tierListDiv.innerHTML = '';
        if (snapshot.empty) {
            tierListDiv.innerHTML = '<p>You have not created any tiers yet.</p>';
            return;
        }
        snapshot.forEach(doc => {
            const tier = doc.data();
            const tierElement = document.createElement('div');
            tierElement.className = 'tier-item management-card';
            tierElement.innerHTML = `
                <h3>${tier.name} - ${tier.price} π/month</h3>
                <ul>${tier.description.split(/[\r\n]+/).map(b => `<li>${b}</li>`).join('')}</ul>
            `;
            tierListDiv.appendChild(tierElement);
        });
    } catch (error) {
        console.error("Error loading tiers:", error);
        tierListDiv.innerHTML = '<p>Error loading tiers. Please try again.</p>';
    }
}

const createTierForm = document.getElementById('create-tier-form');
createTierForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formStatus = document.getElementById('form-status');
    formStatus.textContent = 'Creating tier...';

    const newTier = {
        name: document.getElementById('tier-name').value,
        price: parseFloat(document.getElementById('tier-price').value),
        description: document.getElementById('tier-description').value,
        createdAt: serverTimestamp()
    };

    try {
        await addDoc(tiersCollectionRef, newTier);
        formStatus.textContent = 'Tier created successfully!';
        createTierForm.reset();
        loadTiers(); // Refresh the list of tiers
    } catch (error) {
        console.error("Error creating tier:", error);
        formStatus.textContent = 'Error creating tier.';
    }
});

initializePage();