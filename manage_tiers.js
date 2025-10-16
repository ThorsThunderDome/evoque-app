// manage_tiers.js
import { db } from './app.js';
import { collection, doc, getDoc, addDoc, updateDoc, deleteDoc, serverTimestamp, onSnapshot, query } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

const deleteModal = document.getElementById('delete-modal');
const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
let tierToDeleteId = null;

function renderTier(tierListDiv, tierData) {
    const tierElement = document.createElement('div');
    tierElement.className = 'tier-item management-card';
    tierElement.setAttribute('data-id', tierData.id);
    tierElement.innerHTML = `
        <div class="form-group"><label>Tier Name</label><input type="text" class="tier-name-input" value="${tierData.name}" readonly></div>
        <div class="form-group"><label>Monthly Price (π)</label><input type="number" class="tier-price-input" value="${tierData.price}" step="0.01" min="0" readonly></div>
        <div class="form-group"><label>Benefits (one per line)</label><textarea class="tier-description-input" rows="5" readonly>${tierData.description}</textarea></div>
        <div class="form-group"><label>Thank-You Note for NFT</label><textarea class="tier-thank-you-input" rows="3" readonly>${tierData.thankYouNote || ''}</textarea></div>
        <div class="card-actions">
            <button class="btn btn-secondary edit-btn">Edit</button>
            <button class="btn btn-danger delete-btn">Delete</button>
        </div>
        <p class="status-message"></p>
    `;
    tierListDiv.appendChild(tierElement);
}

function toggleEditState(tierCard, isEditing) {
    tierCard.querySelectorAll('input, textarea').forEach(input => {
        input.readOnly = !isEditing;
        if(isEditing) input.classList.add('editable');
        else input.classList.remove('editable');
    });
    const editBtn = tierCard.querySelector('.edit-btn, .save-btn');
    if (isEditing) {
        editBtn.textContent = 'Save';
        editBtn.classList.replace('edit-btn', 'save-btn');
        editBtn.classList.replace('btn-secondary', 'btn-primary');
    } else {
        editBtn.textContent = 'Edit';
        editBtn.classList.replace('save-btn', 'edit-btn');
        editBtn.classList.replace('btn-primary', 'btn-secondary');
    }
}

async function initializePage() {
    const piUser = JSON.parse(sessionStorage.getItem('piUser'));
    if (!piUser || !piUser.uid) {
        document.getElementById('existing-tiers-list').innerHTML = '<p>Could not load page. Please log in.</p>';
        return;
    }

    const creatorDocRef = doc(db, 'creators', piUser.uid);
    const tiersCollectionRef = collection(creatorDocRef, 'tiers');

    try {
        const docSnap = await getDoc(creatorDocRef);
        if (docSnap.exists()) {
            const creatorData = docSnap.data();
            document.getElementById('creator-name-sidebar').textContent = creatorData.name;
            document.getElementById('creator-avatar-sidebar').src = creatorData.profileImage || 'images/default-avatar.png';
        }
    } catch (error) { console.error("Error loading sidebar data:", error); }
    
    const q = query(tiersCollectionRef);
    onSnapshot(q, (snapshot) => {
        const tierListDiv = document.getElementById('existing-tiers-list');
        tierListDiv.innerHTML = '';
        if (snapshot.empty) {
            tierListDiv.innerHTML = '<p>You have not created any tiers yet.</p>';
        } else {
            const tiers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            tiers.sort((a, b) => a.price - b.price);
            tiers.forEach(tierData => renderTier(tierListDiv, tierData));
        }
    }, (error) => {
        console.error("Error listening to tiers:", error);
        document.getElementById('existing-tiers-list').innerHTML = `<p>Error loading tiers. Please try again.</p>`;
    });

    const createTierForm = document.getElementById('create-tier-form');
    createTierForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formStatus = document.getElementById('form-status');
        formStatus.textContent = 'Creating...';
        
        try {
            await addDoc(tiersCollectionRef, {
                name: document.getElementById('tier-name').value,
                price: parseFloat(document.getElementById('tier-price').value),
                description: document.getElementById('tier-description').value,
                thankYouNote: document.getElementById('tier-thank-you').value,
                createdAt: serverTimestamp()
            });
            formStatus.textContent = 'Tier created successfully!';
            createTierForm.reset();
        } catch (error) {
            console.error("Error creating tier:", error);
            formStatus.textContent = 'Error creating tier. Check security rules.';
        }
    });

    document.getElementById('existing-tiers-list').addEventListener('click', async (e) => {
        const tierCard = e.target.closest('.tier-item');
        if (!tierCard) return;
        const tierId = tierCard.dataset.id;
        const statusEl = tierCard.querySelector('.status-message');

        if (e.target.classList.contains('edit-btn')) {
            toggleEditState(tierCard, true);
        } 
        else if (e.target.classList.contains('save-btn')) {
            statusEl.textContent = "Saving...";
            try {
                await updateDoc(doc(tiersCollectionRef, tierId), {
                    name: tierCard.querySelector('.tier-name-input').value,
                    price: parseFloat(tierCard.querySelector('.tier-price-input').value),
                    description: tierCard.querySelector('.tier-description-input').value,
                    thankYouNote: tierCard.querySelector('.tier-thank-you-input').value
                });
                statusEl.textContent = "Saved!";
                setTimeout(() => statusEl.textContent = "", 2000);
                toggleEditState(tierCard, false);
            } catch (error) {
                console.error("Error updating tier:", error);
                statusEl.textContent = "Error saving.";
            }
        } 
        else if (e.target.classList.contains('delete-btn')) {
            tierToDeleteId = tierId;
            deleteModal.classList.remove('hidden');
        }
    });

    cancelDeleteBtn.addEventListener('click', () => {
        tierToDeleteId = null;
        deleteModal.classList.add('hidden');
    });

    confirmDeleteBtn.addEventListener('click', async () => {
        if (!tierToDeleteId) return;
        try {
            await deleteDoc(doc(tiersCollectionRef, tierToDeleteId));
        } catch (error) {
            console.error("Error deleting tier:", error);
            alert("Could not delete tier.");
        } finally {
            tierToDeleteId = null;
            deleteModal.classList.add('hidden');
        }
    });
}

window.addEventListener('app-ready', initializePage);

