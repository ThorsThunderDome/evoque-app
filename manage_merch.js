// manage_merch.js
import { db, piUser } from './app.js';
import { collection, doc, getDoc, getDocs, addDoc, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

const creatorDocRef = doc(db, 'creators', piUser.uid);
const merchCollectionRef = collection(creatorDocRef, 'merch');

// Fetch creator data for sidebar
async function loadSidebarData() {
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

async function loadMerch() {
    const merchListDiv = document.getElementById('existing-merch-list');
    merchListDiv.innerHTML = '<div class="loader"></div>';
    try {
        const q = query(merchCollectionRef, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        merchListDiv.innerHTML = '';
        if (snapshot.empty) {
            merchListDiv.innerHTML = '<p>You have not added any products yet.</p>';
        } else {
            snapshot.forEach(doc => {
                const item = doc.data();
                const card = document.createElement('div');
                card.className = 'creator-card'; // Reuse style
                card.innerHTML = `
                    <img src="${item.imageUrl}" alt="${item.name}" class="creator-avatar">
                    <h3>${item.name}</h3>
                    <p>${item.description}</p>
                `;
                merchListDiv.appendChild(card);
            });
        }
    } catch (error) {
        console.error("Error loading merch:", error);
        merchListDiv.innerHTML = '<p>Error loading products. Please try again.</p>';
    }
}

const createMerchForm = document.getElementById('create-merch-form');
createMerchForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formStatus = document.getElementById('form-status');
    formStatus.textContent = 'Adding product...';
    const newProduct = {
        name: document.getElementById('merch-name').value,
        description: document.getElementById('merch-desc').value,
        imageUrl: document.getElementById('merch-image').value,
        storeLink: document.getElementById('merch-link').value,
        createdAt: serverTimestamp()
    };
    try {
        await addDoc(merchCollectionRef, newProduct);
        formStatus.textContent = 'Product added successfully!';
        createMerchForm.reset();
        loadMerch(); // Refresh the list
    } catch (error) {
        console.error("Error adding product:", error);
        formStatus.textContent = 'Error adding product.';
    }
});

// Run all page-load functions
loadSidebarData();
loadMerch();