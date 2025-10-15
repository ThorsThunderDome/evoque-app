// creator.js
import { db, piUser, onIncompletePaymentFound } from './app.js';
import { collection, doc, getDoc, getDocs, query, where, orderBy } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

/**
 * Handles the Pi payment process for a subscription.
 */
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
            amount: parseFloat(tierPrice), // Ensure price is a float
            memo: `Subscription to ${creatorData.name} - ${tierName}`,
            metadata: { supporterUid: piUser.uid, creatorUid: creatorId, tierId: tierId }
        });
    } catch (error) {
        console.error("Payment process failed:", error);
        alert("Could not complete the payment process. Please try again.");
    }
}

/**
 * Renders the creator's posts, showing only what the supporter has access to.
 * @param {QuerySnapshot} postsSnap - The snapshot of post documents.
 * @param {number} userAccessLevel - The price of the supporter's tier (0 if not subscribed).
 */
function renderPosts(postsSnap, userAccessLevel) {
    const feed = document.getElementById('posts-feed');
    feed.innerHTML = '';
    if (postsSnap.empty) {
        feed.innerHTML = '<p>This creator has not made any posts yet.</p>';
        return;
    }

    let visiblePosts = 0;
    postsSnap.forEach(postDoc => {
        const post = postDoc.data();
        const requiredAccessLevel = post.tierRequired ? parseFloat(post.tierRequired) : 0;

        const postElement = document.createElement('div');
        postElement.className = 'post-card';

        if (userAccessLevel >= requiredAccessLevel) {
            visiblePosts++;
            postElement.innerHTML = `
                <h3>${post.title}</h3>
                <p>${post.content}</p>
                ${post.imageUrl ? `<img src="${post.imageUrl}" alt="Post image" style="max-width: 100%; border-radius: 8px; margin-top: 10px;">` : ''}
                <small>Posted on: ${new Date(post.createdAt.seconds * 1000).toLocaleDateString()}</small>
            `;
        } else {
            postElement.classList.add('locked');
            postElement.innerHTML = `
                <h3><span class="lock-icon">🔒</span> This post is locked</h3>
                <p>This post is available for supporters in the ${post.tierName || 'higher'} tier and above.</p>
                <small>Required Tier Price: ${requiredAccessLevel} π</small>
            `;
        }
        feed.appendChild(postElement);
    });

    if (visiblePosts === 0 && !postsSnap.empty) {
        feed.insertAdjacentHTML('afterbegin', '<p>Subscribe to one of the tiers to view posts from this creator.</p>');
    }
}

/**
 * Renders the creator's merch, checking for tier-specific access.
 * @param {QuerySnapshot} merchSnap - The snapshot of merch documents.
 * @param {number} userAccessLevel - The supporter's access level.
 */
function renderMerch(merchSnap, userAccessLevel) {
    const list = document.getElementById('merch-list');
    list.innerHTML = '';
    if (merchSnap.empty) {
        list.innerHTML = '<p>This creator has no merchandise available yet.</p>';
        return;
    }

    merchSnap.forEach(merchDoc => {
        const item = merchDoc.data();
        const requiredAccessLevel = item.tierRequired ? parseFloat(item.tierRequired) : 0;

        const itemElement = document.createElement('div');
        itemElement.className = 'merch-card'; // Use a consistent class name

        if (userAccessLevel >= requiredAccessLevel) {
            itemElement.innerHTML = `
                <img src="${item.imageUrl || 'images/default-merch.png'}" alt="${item.name}">
                <h3>${item.name}</h3>
                <p class="price">${item.price} π</p>
                <button class="btn btn-secondary">View Details</button>
            `;
        } else {
            itemElement.classList.add('locked');
            itemElement.innerHTML = `
                <div class="locked-overlay">
                    <span class="lock-icon">🔒</span>
                    <p>Available for ${item.tierName || 'higher'} tier</p>
                </div>
                <img src="${item.imageUrl || 'images/default-merch.png'}" alt="${item.name}">
                <h3>${item.name}</h3>
                <p class="price">${item.price} π</p>
            `;
        }
        list.appendChild(itemElement);
    });
}

/**
 * Renders the creator's bounties, checking for tier-specific access.
 * @param {QuerySnapshot} bountiesSnap - The snapshot of bounty documents.
 * @param {number} userAccessLevel - The supporter's access level.
 */
function renderBounties(bountiesSnap, userAccessLevel) {
    const list = document.getElementById('bounties-list');
    list.innerHTML = '';
    if (bountiesSnap.empty) {
        list.innerHTML = '<p>This creator has no active bounties.</p>';
        return;
    }

    bountiesSnap.forEach(bountyDoc => {
        const bounty = bountyDoc.data();
        const requiredAccessLevel = bounty.tierRequired ? parseFloat(bounty.tierRequired) : 0;
        
        const bountyElement = document.createElement('div');
        bountyElement.className = 'bounty-card'; // Use a consistent class name

        if (userAccessLevel >= requiredAccessLevel) {
            bountyElement.innerHTML = `
                <h3>${bounty.title}</h3>
                <p>${bounty.description}</p>
                <div class="bounty-reward">Reward: ${bounty.reward} π</div>
                <button class="btn btn-secondary">Submit Work</button>
            `;
        } else {
             bountyElement.classList.add('locked');
             bountyElement.innerHTML = `
                <h3><span class="lock-icon">🔒</span> ${bounty.title}</h3>
                <p>This bounty is available for supporters in the ${bounty.tierName || 'higher'} tier and above.</p>
                <div class="bounty-reward">Reward: ${bounty.reward} π</div>
            `;
        }
        list.appendChild(bountyElement);
    });
}


/**
 * Initializes the entire creator profile page.
 */
async function initializeCreatorPage() {
    const creatorId = sessionStorage.getItem('selectedCreatorId');
    const mainContent = document.getElementById('main-content');
    
    if (piUser && document.getElementById('username-display')) {
        document.getElementById('username-display').textContent = piUser.username;
    }

    if (!creatorId) {
        mainContent.innerHTML = "<h1>Error: Creator ID not found. Please go back and select a creator.</h1>";
        return;
    }

    try {
        // --- Step 1: Check for the current user's subscription status ---
        let userSubscription = null;
        if (piUser) {
            const subscriptionRef = doc(db, "creators", creatorId, "supporters", piUser.uid);
            const subscriptionSnap = await getDoc(subscriptionRef);
            if (subscriptionSnap.exists()) {
                userSubscription = subscriptionSnap.data();
            }
        }

        // --- Step 2: Fetch all creator data in parallel ---
        const creatorDocRef = doc(db, "creators", creatorId);
        const tiersQuery = query(collection(creatorDocRef, 'tiers'), orderBy('price'));
        const postsQuery = query(collection(db, 'posts'), where('creatorId', '==', creatorId), orderBy('createdAt', 'desc'));
        // --- CORRECTED QUERIES for merch and bounties ---
        const merchQuery = query(collection(db, 'merch'), where('creatorId', '==', creatorId), orderBy('price'));
        const bountiesQuery = query(collection(db, 'bounties'), where('creatorId', '==', creatorId), orderBy('reward', 'desc'));

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
        const tiers = tiersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Determine the user's access level (based on tier price). 0 if not subscribed.
        let userAccessLevel = 0;
        let subscribedTierId = null;
        if (userSubscription) {
            subscribedTierId = userSubscription.tierId;
            const subscribedTier = tiers.find(t => t.id === subscribedTierId);
            if (subscribedTier) {
                userAccessLevel = parseFloat(subscribedTier.price);
            }
        }

        // --- Step 3: Render all page components ---
        // Render Header
        document.getElementById('creator-header-image').style.backgroundImage = `url(${creatorData.headerImage || ''})`;
        document.getElementById('creator-name').textContent = creatorData.name || 'Creator Name';
        document.getElementById('creator-bio').textContent = creatorData.bio || 'No bio available.';
        document.getElementById('creator-avatar').src = creatorData.profileImage || 'images/default-avatar.png';
        
        // Render Tiers
        const tiersListDiv = document.getElementById('tiers-list');
        tiersListDiv.innerHTML = '';
        if (tiers.length === 0) {
            tiersListDiv.innerHTML = '<p>This creator has not set up any tiers yet.</p>';
        } else {
            tiers.forEach(tier => {
                const tierCard = document.createElement('div');
                tierCard.className = 'tier-card';
                if (tier.id === subscribedTierId) {
                    tierCard.classList.add('subscribed'); // Add a class for styling the current tier
                }
                const benefits = tier.description ? tier.description.split(/[\r\n]+/).map(b => `<li>${b}</li>`).join('') : '';
                
                let buttonHtml = `<button class="btn btn-primary subscribe-btn">Subscribe</button>`;
                if (tier.id === subscribedTierId) {
                    buttonHtml = `<button class="btn btn-success" disabled>Current Tier</button>`;
                } else if (userAccessLevel > tier.price) {
                     buttonHtml = `<button class="btn btn-secondary" disabled>Included in your Tier</button>`;
                }
                
                tierCard.innerHTML = `<h3>${tier.name}</h3><p class="price">${tier.price} π/month</p><ul>${benefits}</ul>${buttonHtml}`;
                
                if (!tierCard.querySelector('button').disabled) {
                    tierCard.querySelector('.subscribe-btn').addEventListener('click', () => handleSubscription(creatorData, tier.id, tier.name, tier.price));
                }
                
                tiersListDiv.appendChild(tierCard);
            });
        }
        
        // Render content based on user's access level
        renderPosts(postsSnap, userAccessLevel);
        renderMerch(merchSnap, userAccessLevel);
        renderBounties(bountiesSnap, userAccessLevel);

    } catch (error) {
        console.error("Error loading creator page:", error);
        mainContent.innerHTML = "<h1>Error loading page. Please check the console for details.</h1>";
    }
}

// Ensure the page initializes after the app (and piUser) is ready
window.addEventListener('app-ready', initializeCreatorPage);

