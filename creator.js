// creator.js
import { db, piUser, onIncompletePaymentFound } from './app.js';
import { collection, doc, getDoc, getDocs, query, where, orderBy } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

// handleSubscription function remains correct
async function handleSubscription(creatorData, tierId, tierName, tierPrice) {
    if (!piUser) {
        alert("Please connect your wallet first by logging in again.");
        return;
    }
    try {
        const scopes = ['username', 'payments'];
        await window.Pi.authenticate(scopes, onIncompletePaymentFound);
        const creatorId = sessionStorage.getItem('selectedCreatorId');
        await window.createPiPayment({
            amount: parseFloat(tierPrice),
            memo: `Subscription to ${creatorData.name} - ${tierName}`,
            metadata: { supporterUid: piUser.uid, creatorUid: creatorId, tierId: tierId }
        });
    } catch (error) {
        console.error("Payment process failed:", error);
        alert("Could not complete the payment process. Please try again.");
    }
}

// All individual render functions (renderPosts, renderMerch, etc.) are correct.

// --- UPDATED INITIALIZE FUNCTION ---
async function initializeCreatorPage() {
    const creatorId = sessionStorage.getItem('selectedCreatorId');
    const mainContent = document.getElementById('main-content');
    
    if (piUser && document.getElementById('username-display')) {
        document.getElementById('username-display').textContent = piUser.username;
    }

    if (!creatorId) {
        mainContent.innerHTML = "<h1>Error: Creator ID not found. Please select a creator.</h1>";
        return;
    }

    try {
        // --- Step 1: Fetch all primary creator data in parallel ---
        const creatorDocRef = doc(db, "creators", creatorId);
        const tiersQuery = query(collection(creatorDocRef, 'tiers'), orderBy('price'));
        const postsQuery = query(collection(db, 'posts'), where('creatorId', '==', creatorId), orderBy('createdAt', 'desc'));
        // We will add Merch and Bounties later to keep this fix focused
        
        const [creatorSnap, tiersSnap, postsSnap] = await Promise.all([
            getDoc(creatorDocRef),
            getDocs(tiersQuery),
            getDocs(postsQuery)
        ]);

        if (!creatorSnap.exists()) {
            mainContent.innerHTML = "<h1>Creator not found.</h1>";
            return;
        }
        
        const creatorData = creatorSnap.data();
        const tiers = tiersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // --- Step 2: Securely check for the user's subscription ---
        let userSubscription = null;
        let subscribedTierId = null;
        let userAccessLevel = 0;

        if (piUser) {
            // THIS IS THE FIX: We now query the public 'subscriptions' collection.
            const subsQuery = query(collection(db, 'subscriptions'), 
                where('supporterUid', '==', piUser.uid), 
                where('creatorUid', '==', creatorId)
            );
            const subsSnapshot = await getDocs(subsQuery);
            if (!subsSnapshot.empty) {
                userSubscription = subsSnapshot.docs[0].data();
                subscribedTierId = userSubscription.tierId;
                const subscribedTier = tiers.find(t => t.id === subscribedTierId);
                if (subscribedTier) {
                    userAccessLevel = parseFloat(subscribedTier.price);
                }
            }
        }

        // --- Step 3: Render all page components ---
        document.getElementById('creator-header-image').style.backgroundImage = `url(${creatorData.headerImage || ''})`;
        document.getElementById('creator-name').textContent = creatorData.name || 'Creator Name';
        document.getElementById('creator-bio').textContent = creatorData.bio || 'No bio available.';
        document.getElementById('creator-avatar').src = creatorData.profileImage || 'images/default-avatar.png';
        
        const tiersListDiv = document.getElementById('tiers-list');
        tiersListDiv.innerHTML = '';
        if (tiers.length === 0) {
            tiersListDiv.innerHTML = '<p>This creator has not set up any tiers yet.</p>';
        } else {
            tiers.forEach(tier => {
                const tierCard = document.createElement('div');
                tierCard.className = 'tier-card';
                if (tier.id === subscribedTierId) tierCard.classList.add('subscribed');
                const benefits = tier.description ? tier.description.split(/[\r\n]+/).map(b => `<li>${b}</li>`).join('') : '';
                
                let buttonHtml = `<button class="btn btn-primary subscribe-btn">Subscribe</button>`;
                if (tier.id === subscribedTierId) {
                    buttonHtml = `<button class="btn btn-success" disabled>Current Tier</button>`;
                } else if (userAccessLevel > 0 && userAccessLevel >= tier.price) {
                     buttonHtml = `<button class="btn btn-secondary" disabled>Included</button>`;
                }
                
                tierCard.innerHTML = `<h3>${tier.name}</h3><p class="price">${tier.price} π/month</p><ul>${benefits}</ul>${buttonHtml}`;
                if (!tierCard.querySelector('button').disabled) {
                    tierCard.querySelector('.subscribe-btn').addEventListener('click', () => handleSubscription(creatorData, tier.id, tier.name, tier.price));
                }
                tiersListDiv.appendChild(tierCard);
            });
        }
        
        // This will call the existing renderPosts function which is correct.
        renderPosts(postsSnap, userAccessLevel);
        document.getElementById('merch-list').innerHTML = '<p>No merch from this creator yet.</p>';
        document.getElementById('bounties-list').innerHTML = '<p>No active bounties from this creator.</p>';

    } catch (error) {
        console.error("Error loading creator page:", error);
        mainContent.innerHTML = `<h1>Error loading page.</h1><p>There was a problem fetching the creator's data. Please try again later.</p>`;
    }
}


// --- These render functions are correct and remain unchanged ---
function renderPosts(postsSnap, userAccessLevel) {
    const feed = document.getElementById('posts-feed');
    feed.innerHTML = '';
    if (postsSnap.empty) {
        feed.innerHTML = '<p>This creator has not made any posts yet.</p>';
        return;
    }
    postsSnap.forEach(postDoc => {
        const post = postDoc.data();
        const requiredAccessLevel = post.tierRequired ? parseFloat(post.tierRequired) : 0;
        const postElement = document.createElement('div');
        postElement.className = 'post-card';
        if (userAccessLevel >= requiredAccessLevel) {
            postElement.innerHTML = `<h3>${post.title}</h3><p>${post.content}</p>`;
        } else {
            postElement.classList.add('locked');
            postElement.innerHTML = `<h3><span class="lock-icon">🔒</span> This post is locked</h3><p>Subscribe to a higher tier to view.</p>`;
        }
        feed.appendChild(postElement);
    });
}

window.addEventListener('app-ready', initializeCreatorPage);

