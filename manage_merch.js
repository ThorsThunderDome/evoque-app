// manage_merch.js - FINAL, COMPLETE VERSION
import { db, piUser, uploadFile } from './app.js';
import { collection, doc, getDoc, getDocs, addDoc, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

function initializeManageMerch() {
    const creatorDocRef = doc(db, 'creators', piUser.uid);
    const merchCollectionRef = collection(creatorDocRef, 'merch');

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
                    card.className = 'creator-card merch-card';
                    card.innerHTML = `
                        <img src="${item.imageUrl}" alt="${item.name}" class="merch-image">
                        <h3>${item.name}</h3>
                        <p>${item.description}</p>
                        <a href="${item.storeLink}" target="_blank" class="btn btn-primary">View in Store</a>
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

        const imageFile = document.getElementById('merch-image-file').files[0];
        if (!imageFile) {
            formStatus.textContent = "Please select a product image.";
            return;
        }

        try {
            const imagePath = `merchImages/${piUser.uid}/${Date.now()}_${imageFile.name}`; // CORRECTED PATH
            const imageUrl = await uploadFile(imageFile, imagePath);

            const newProduct = {
                name: document.getElementById('merch-name').value,
                description: document.getElementById('merch-desc').value,
                imageUrl: imageUrl,
                storeLink: document.getElementById('merch-link').value,
                createdAt: serverTimestamp()
            };
            
            await addDoc(merchCollectionRef, newProduct);
            formStatus.textContent = 'Product added successfully!';
            createMerchForm.reset();
            loadMerch();
        } catch (error) {
            console.error("Error adding product:", error);
            formStatus.textContent = 'Error adding product.';
        }
    });

    loadSidebarData();
    loadMerch();
}

document.addEventListener('DOMContentLoaded', initializeManageMerch);
