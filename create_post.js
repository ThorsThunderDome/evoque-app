// create_post.js
import { db, piUser } from './app.js';
import { collection, doc, getDoc, getDocs, addDoc, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

const creatorDocRef = doc(db, 'creators', piUser.uid);
let creatorData = {};

async function initializePage() {
    try {
        const docSnap = await getDoc(creatorDocRef);
        if (docSnap.exists()) {
            creatorData = docSnap.data();
            document.getElementById('creator-name-sidebar').textContent = creatorData.name;
            document.getElementById('creator-avatar-sidebar').src = creatorData.profileImage;
        }
    } catch (error) { console.error("Could not load creator data", error); }

    const tiersCollectionRef = collection(creatorDocRef, 'tiers');
    const tierOptionsDiv = document.getElementById('tier-access-options');
    try {
        const q = query(tiersCollectionRef, orderBy('price'));
        const snapshot = await getDocs(q);
        tierOptionsDiv.innerHTML = '';
        if (snapshot.empty) {
            tierOptionsDiv.innerHTML = '<p>You must create at least one tier first.</p>';
        } else {
            snapshot.forEach(doc => {
                const tier = doc.data();
                const option = document.createElement('div');
                option.className = 'checkbox-group';
                option.innerHTML = `<input type="checkbox" id="${doc.id}" name="tiers" value="${doc.id}"><label for="${doc.id}">${tier.name}</label>`;
                tierOptionsDiv.appendChild(option);
            });
        }
    } catch (error) { tierOptionsDiv.innerHTML = '<p>Could not load tiers.</p>'; }
}

const createPostForm = document.getElementById('create-post-form');
createPostForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formStatus = document.getElementById('form-status');
    formStatus.textContent = 'Publishing...';

    const selectedTiers = Array.from(document.querySelectorAll('input[name="tiers"]:checked')).map(cb => cb.value);
    if (selectedTiers.length === 0) {
        formStatus.textContent = 'Please select at least one tier.';
        return;
    }

    const mediaType = document.getElementById('media-type').value;
    const mediaUrl = document.getElementById('media-url').value;

    const newPost = {
        title: document.getElementById('post-title').value,
        content: document.getElementById('post-content').value,
        media: { type: mediaType, url: mediaUrl },
        accessibleTiers: selectedTiers,
        createdAt: serverTimestamp(),
        creatorId: piUser.uid,
        creatorName: creatorData.name,
        creatorImage: creatorData.profileImage
    };

    try {
        await addDoc(collection(db, 'posts'), newPost);
        formStatus.textContent = 'Post published!';
        createPostForm.reset();
        setTimeout(() => formStatus.textContent = '', 3000);
    } catch (error) {
        console.error("Error creating post:", error);
        formStatus.textContent = 'Error publishing post.';
    }
});

initializePage();