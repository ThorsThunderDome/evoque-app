// creator.js
import { db, piUser, onIncompletePaymentFound } from './app.js';
import { collection, doc, getDoc, getDocs, query, where, orderBy } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

// handleSubscription function remains correct and unchanged
async function handleSubscription(creatorData, tierId, tierName, tierPrice) {
    if (!piUser) {
        alert("Please connect your wallet first by logging in again.");
        return;
    }
    try {
        const scopes = ['username', 'payments'];
        await Pi.authenticate(scopes, onIncompletePaymentFound);
        const creatorId = sessionStorage.getItem('selectedCreatorId');
        await window.createPiPayment({
            amount: tierPrice,
            memo: `Subscription to ${creatorData.name} - ${tierName}`,
            metadata: { supporterUid: piUser.uid, creatorUid: creatorId, tierId: tierId }
        });
    } catch (error) {
        console.error("Payment process failed:", error);
        alert("Could not complete the payment process. Please try again.");
    }
}

// --- COMPLETELY REWRITTEN AND SIMPLIFIED INITIALIZE FUNCTION ---
async function initializeCreatorPage() {
    const creatorId = sessionStorage.getItem('selectedCreatorId');
    const mainContent = document.getElementById('main-content');
    
    // This correctly handles the sidebar user display
    if (piUser && document.getElementById('username-display')) {
        document.getElementById('username-display').textContent = piUser.username;
    }

    if (!creatorId) {
        mainContent.innerHTML = "<h1>Error: Creator ID not found. Please select a creator.</h1>";
        return;
    }

    try {
        // --- Step 1: Fetch all primary data in parallel for speed ---
        const creatorDocRef = doc(db, "creators", creatorId);
        const tiersQuery = query(collection(creatorDocRef, 'tiers'), orderBy('price'));
        const postsQuery = query(collection(db, 'posts'), where('creatorId', '==', creatorId), orderBy('createdAt', 'desc'));
        // Add merch and bounties queries here when they are ready
        
        const [creatorSnap, tiersSnap, postsSnap] = await Promise.all([
            getDoc(creatorDocRef),
            getDocs(tiersQuery),
            getDocs(postsSnap)
        ]);

        if (!creatorSnap.exists()) {
            mainContent.innerHTML = "<h1>Creator not found.</h1>";
            return;
        }

        // --- Step 2: Render all content using the fetched data ---
        const creatorData = creatorSnap.data();

        // Render Header
        document.getElementById('creator-header-image').style.backgroundImage = `url(${creatorData.headerImage || ''})`;
        document.getElementById('creator-name').textContent = creatorData.name || 'Creator Name';
        document.getElementById('creator-bio').textContent = creatorData.bio || 'No bio available.';
        document.getElementById('creator-avatar').src = creatorData.profileImage || 'images/default-avatar.png';
        
        // Render Social Icons
        const socialIconsContainer = document.getElementById('social-icons-container');
        socialIconsContainer.innerHTML = '';
        if (creatorData.socialLinks) {
            if (creatorData.socialLinks.twitter) socialIconsContainer.innerHTML += `<a href="${creatorData.socialLinks.twitter}" target="_blank" class="social-icon twitter"></a>`;
            if (creatorData.socialLinks.youtube) socialIconsContainer.innerHTML += `<a href="${creatorData.socialLinks.youtube}" target="_blank" class="social-icon youtube"></a>`;
        }
        
        // Render Tiers
        const tiersListDiv = document.getElementById('tiers-list');
        tiersListDiv.innerHTML = '';
        if (tiersSnap.empty) {
            tiersListDiv.innerHTML = '<p>This creator has not set up any tiers yet.</p>';
        } else {
            tiersSnap.forEach(tierDoc => {
                const tier = { id: tierDoc.id, ...tierDoc.data() };
                const tierCard = document.createElement('div');
                tierCard.className = 'tier-card';
                const benefits = tier.description ? tier.description.split(/[\r\n]+/).map(b => `<li>${b}</li>`).join('') : '';
                tierCard.innerHTML = `<h3>${tier.name}</h3><p class="price">${tier.price} π/month</p><ul>${benefits}</ul><button class="btn btn-primary subscribe-btn">Subscribe</button>`;
                tierCard.querySelector('.subscribe-btn').addEventListener('click', () => handleSubscription(creatorData, tier.id, tier.name, tier.price));
                tiersListDiv.appendChild(tierCard);
            });
        }
        
        // Render Posts, Merch, Bounties (using placeholder for now)
        document.getElementById('posts-feed').innerHTML = '<p>No posts from this creator yet.</p>';
        document.getElementById('merch-list').innerHTML = '<p>No merch from this creator yet.</p>';
        document.getElementById('bounties-list').innerHTML = '<p>No active bounties from this creator.</p>';
        // When post logic is ready, it will replace the placeholder above.

    } catch (error) {
        console.error("Error loading creator page:", error);
        mainContent.innerHTML = "<h1>Error loading page. Please check the console for details.</h1>";
    }
}

window.addEventListener('app-ready', initializeCreatorPage);

