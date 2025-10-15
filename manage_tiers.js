// manage_tiers.js
import { db, piUser } from './app.js';
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, orderBy, serverTimestamp, onSnapshot } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

const creatorDocRef = doc(db, 'creators', piUser.uid);
const tiersCollectionRef = collection(creatorDocRef, 'tiers');

// --- NEW: Modal elements ---
const deleteModal = document.getElementById('delete-modal');
const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
let tierToDeleteId = null;

// Load sidebar and set up a real-time listener for tiers
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
    
    // Use onSnapshot for real-time updates to the tier list
    const q = query(tiersCollectionRef, orderBy('price'));
    onSnapshot(q, (snapshot) => {
        const tierListDiv = document.getElementById('existing-tiers-list');
        tierListDiv.innerHTML = '';
        if (snapshot.empty) {
            tierListDiv.innerHTML = '<p>You have not created any tiers yet.</p>';
            return;
        }
        snapshot.forEach(doc => {
            renderTier(doc);
        });
    }, (error) => {
        console.error("Error listening to tiers collection:", error);
        document.getElementById('existing-tiers-list').innerHTML = '<p>Error loading tiers. Please try again.</p>';
    });
}

// Renders a single editable tier card
function renderTier(doc) {
    const tierListDiv = document.getElementById('existing-tiers-list');
    const tier = doc.data();
    const tierId = doc.id;
    const tierElement = document.createElement('div');
    tierElement.className = 'tier-item management-card';
    tierElement.setAttribute('data-id', tierId);

    tierElement.innerHTML = `
        <div class="form-group">
            <label>Tier Name</label>
            <input type="text" class="tier-name-input" value="${tier.name}" readonly>
        </div>
        <div class="form-group">
            <label>Monthly Price (π)</label>
            <input type="number" class="tier-price-input" value="${tier.price}" step="0.01" min="0" readonly>
        </div>
        <div class="form-group">
            <label>Benefits (one per line)</label>
            <textarea class="tier-description-input" rows="5" readonly>${tier.description}</textarea>
        </div>
        <div class="form-group">
            <label>Thank-You Note for NFT</label>
            <textarea class="tier-thank-you-input" rows="3" readonly>${tier.thankYouNote || ''}</textarea>
        </div>
        <div class="card-actions">
            <button class="btn btn-secondary edit-btn">Edit</button>
            <button class="btn btn-danger delete-btn">Delete</button>
        </div>
        <p class="status-message"></p>
    `;
    tierListDiv.appendChild(tierElement);
}

// --- Event delegation for Edit, Save, Delete buttons ---
document.getElementById('existing-tiers-list').addEventListener('click', async (e) => {
    const tierCard = e.target.closest('.tier-item');
    if (!tierCard) return;
    const tierId = tierCard.dataset.id;
    const statusEl = tierCard.querySelector('.status-message');

    if (e.target.classList.contains('edit-btn')) {
        toggleEditState(tierCard, true);
        e.target.textContent = 'Save';
        e.target.classList.replace('edit-btn', 'save-btn');
        e.target.classList.replace('btn-secondary', 'btn-primary');
    } 
    else if (e.target.classList.contains('save-btn')) {
        statusEl.textContent = "Saving...";
        const updatedData = {
            name: tierCard.querySelector('.tier-name-input').value,
            price: parseFloat(tierCard.querySelector('.tier-price-input').value),
            description: tierCard.querySelector('.tier-description-input').value,
            thankYouNote: tierCard.querySelector('.tier-thank-you-input').value
        };
        try {
            await updateDoc(doc(tiersCollectionRef, tierId), updatedData);
            statusEl.textContent = "Saved successfully!";
            toggleEditState(tierCard, false);
            e.target.textContent = 'Edit';
            e.target.classList.replace('save-btn', 'edit-btn');
            e.target.classList.replace('btn-primary', 'btn-secondary');
        } catch (error) {
            console.error("Error updating tier:", error);
            statusEl.textContent = "Error saving changes.";
        }
    } 
    else if (e.target.classList.contains('delete-btn')) {
        tierToDeleteId = tierId;
        deleteModal.classList.remove('hidden');
    }
});

function toggleEditState(tierCard, isEditing) {
    tierCard.querySelectorAll('input, textarea').forEach(input => {
        input.readOnly = !isEditing;
    });
}

// --- Modal Logic ---
cancelDeleteBtn.addEventListener('click', () => {
    tierToDeleteId = null;
    deleteModal.classList.add('hidden');
});
confirmDeleteBtn.addEventListener('click', async () => {
    if (!tierToDeleteId) return;
    try {
        await deleteDoc(doc(tiersCollectionRef, tierToDeleteId));
        // The onSnapshot listener will automatically remove the tier from the UI
    } catch (error) {
        console.error("Error deleting tier: ", error);
        alert("Could not delete tier. Please try again.");
    } finally {
        tierToDeleteId = null;
        deleteModal.classList.add('hidden');
    }
});

// --- Create Tier Form Logic (Updated) ---
const createTierForm = document.getElementById('create-tier-form');
createTierForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formStatus = document.getElementById('form-status');
    formStatus.textContent = 'Creating tier...';

    const newTier = {
        name: document.getElementById('tier-name').value,
        price: parseFloat(document.getElementById('tier-price').value),
        description: document.getElementById('tier-description').value,
        thankYouNote: document.getElementById('tier-thank-you').value, // Added field
        createdAt: serverTimestamp()
    };

    try {
        await addDoc(tiersCollectionRef, newTier);
        formStatus.textContent = 'Tier created successfully!';
        createTierForm.reset();
        // No need to call loadTiers() anymore, onSnapshot handles it
    } catch (error) {
        console.error("Error creating tier:", error);
        formStatus.textContent = 'Error creating tier.';
    }
});

initializePage();
