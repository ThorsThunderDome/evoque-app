// creator.js - Reverted to stable, live-data version
import { db } from './app.js';
import { collection, doc, getDoc, getDocs, query, where } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

// This function does not need to change.
async function handleSubscription(creatorData, tierId, tierName, tierPrice) {
    const piUser = JSON.parse(sessionStorage.getItem('piUser'));
    if (!piUser) {
        alert("Please connect your wallet first by logging in again.");
        return;
    }
    try {
        const creatorId = sessionStorage.getItem('selectedCreatorId');
        // The onIncompletePaymentFound function is handled by the Pi SDK via app.js
        const scopes = ['username', 'payments'];
        await window.Pi.authenticate(scopes, window.onIncompletePaymentFound); 
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

// All three render functions are correct and have been preserved for consistency.
function renderPosts(postDocs, userAccessLevel) {
    const feed = document.getElementById('posts-feed');
    feed.innerHTML = '';
    if (postDocs.length === 0) {
        feed.innerHTML = '<p>This creator has not made any posts yet.</p>';
        return;
    }
    // Sort posts by date here to avoid index issues
    postDocs.sort((a, b) => b.data().createdAt.seconds - a.data().createdAt.seconds);

    let visiblePosts = 0;
    postDocs.forEach(postDoc => {
        const post = postDoc.data();
        const requiredAccessLevel = post.tierRequired ? parseFloat(post.tierRequired) : 0;
        const tierName = post.tierName || 'a higher';

        const postElement = document.createElement('div');
        postElement.className = 'post-card';

        if (userAccessLevel >= requiredAccessLevel) {
            visiblePosts++;
            postElement.innerHTML = `
                <h3>${post.title}</h3>
                <p>${post.content}</p>
                ${post.imageUrl ? `<img src="${post.imageUrl}" alt="Post image" class="post-image">` : ''}
                <small>Posted on: ${new Date(post.createdAt.seconds * 1000).toLocaleDateString()}</small>
            `;
        } else {
            postElement.classList.add('post-locked');
            postElement.innerHTML = `
                <h3><span class="lock-icon">🔒</span> This post is locked</h3>
                <p>This post is available for supporters in the ${tierName} tier and above.</p>
            `;
        }
        feed.appendChild(postElement);
    });

    if (visiblePosts === 0 && postDocs.length > 0) {
        feed.insertAdjacentHTML('afterbegin', '<p>Subscribe to one of the tiers to view posts from this creator.</p>');
    }
}

function renderMerch(merchDocs, userAccessLevel) {
    const list = document.getElementById('merch-list');
    list.innerHTML = '';
    if (merchDocs.length === 0) {
        list.innerHTML = '<p>This creator has no merchandise available yet.</p>';
        return;
    }
    merchDocs.forEach(merchDoc => {
        const item = merchDoc.data();
        const itemElement = document.createElement('div');
        itemElement.className = 'merch-card management-card'; // Added management-card for consistent styling
        itemElement.innerHTML = `
            <img src="${item.imageUrl || 'images/default-merch.png'}" alt="${item.name}" class="merch-image">
            <h3>${item.name}</h3>
            <p class="price">${item.price} π</p>
            <p>${item.description || ''}</p>
            <button class="btn btn-primary" style="margin-top:auto;">View Details (Coming Soon)</button>
        `;
        list.appendChild(itemElement);
    });
}

function renderBounties(bountyDocs, userAccessLevel) {
    const list = document.getElementById('bounties-list');
    list.innerHTML = '';
    if (bountyDocs.length === 0) {
        list.innerHTML = '<p>This creator has no active bounties.</p>';
        return;
    }
    bountyDocs.forEach(bountyDoc => {
        const bounty = bountyDoc.data();
        const bountyElement = document.createElement('div');
        bountyElement.className = 'bounty-card management-card'; // Consistent styling
        bountyElement.innerHTML = `
            <h3>${bounty.title}</h3>
            <p>${bounty.description}</p>
            <div class="bounty-reward">Reward: ${bounty.reward} π</div>
            <button class="btn btn-secondary" style="margin-top:15px;">Submit Work (Coming Soon)</button>
        `;
        list.appendChild(bountyElement);
    });
}


// --- REVERTED AND ROBUST INITIALIZATION LOGIC ---
async function initializeCreatorPage() {
    const creatorId = sessionStorage.getItem('selectedCreatorId');
    const mainContent = document.getElementById('main-content');
    const currentUser = JSON.parse(sessionStorage.getItem('piUser'));

    if (currentUser && document.getElementById('username-display')) {
        document.getElementById('username-display').textContent = currentUser.username;
    }

    if (!creatorId) {
        mainContent.innerHTML = "<h1>Error: Creator ID not found. Please go back and select a creator.</h1>";
        return;
    }

    try {
        // Step 1: Fetch all primary creator data in parallel
        const creatorDocRef = doc(db, "creators", creatorId);
        // --- FIX: Removed orderBy from queries to prevent index errors ---
        const tiersQuery = query(collection(creatorDocRef, 'tiers'));
        const postsQuery = query(collection(db, 'posts'), where('creatorId', '==', creatorId));
        const merchQuery = query(collection(db, 'merch'), where('creatorId', '==', creatorId));
        const bountiesQuery = query(collection(db, 'bounties'), where('creatorId', '==', creatorId));

        const [creatorSnap, tiersSnap, postsSnap, merchSnap, bountiesSnap] = await Promise.all([
            getDoc(creatorDocRef),
            getDocs(tiersQuery),
            getDocs(postsQuery),
            getDocs(merchQuery),
            getDocs(bountiesQuery)
        ]);

        if (!creatorSnap.exists()) {
            mainContent.innerHTML = "<h1>Creator not found.</h1>";
            return;
        }
        
        const creatorData = creatorSnap.data();
        // --- FIX: Manually sort tiers by price in the browser ---
        const tiers = tiersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a, b) => a.price - b.price);
        
        // --- Step 2: Securely check for the user's subscription ---
        let subscribedTierId = null;
        let userAccessLevel = 0;
        if (currentUser) {
            // This query is allowed by the new rules
            const subsQuery = query(collection(db, 'subscriptions'), 
                where('supporterUid', '==', currentUser.uid), 
                where('creatorUid', '==', creatorId)
            );
            const subsSnapshot = await getDocs(subsQuery);
            if (!subsSnapshot.empty) {
                const userSubscription = subsSnapshot.docs[0].data();
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
                if (tier.id === subscribedTierId) { tierCard.classList.add('subscribed'); }
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
        
        renderPosts(postsSnap.docs, userAccessLevel);
        renderMerch(merchSnap.docs, userAccessLevel);
        renderBounties(bountiesSnap.docs, userAccessLevel);

    } catch (error) {
        console.error("Error loading creator page:", error);
        mainContent.innerHTML = `<h1>Error loading page.</h1><p>There was a problem fetching the creator's data. Please try again later.</p>`;
    }
}

// Ensure the main app is ready before running the page logic
window.addEventListener('app-ready', initializeCreatorPage);

