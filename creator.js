// creator.js
import { db, onIncompletePaymentFound } from './app.js';
import { collection, doc, getDoc, getDocs, query, where, orderBy } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

// CRITICAL FIX: DO NOT import piUser here.

async function handleSubscription(creatorData, tierId, tierName, tierPrice) {
    // CRITICAL FIX: Get the fresh piUser object from sessionStorage here.
    const piUser = JSON.parse(sessionStorage.getItem('piUser'));
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

async function initializeCreatorPage() {
    const creatorId = sessionStorage.getItem('selectedCreatorId');
    const mainContent = document.getElementById('main-content');
    // CRITICAL FIX: Get the fresh piUser object from sessionStorage here.
    const piUser = JSON.parse(sessionStorage.getItem('piUser'));

    // This ensures the sidebar always loads its user-specific data
    if (piUser && document.getElementById('username-display')) {
        document.getElementById('username-display').textContent = piUser.username;
    }

    if (!creatorId) {
        mainContent.innerHTML = "<h1>Error: Creator ID not found. Please go back and select a creator.</h1>";
        return;
    }
    
    try {
        const creatorDocRef = doc(db, "creators", creatorId);
        const docSnap = await getDoc(creatorDocRef);

        if (!docSnap.exists()) {
            mainContent.innerHTML = "<h1>Creator not found.</h1>";
            return;
        }

        const creatorData = docSnap.data();

        // This rendering logic is now more robust and will not crash
        const headerImageContainer = document.getElementById('creator-header-image');
        if (headerImageContainer) {
            headerImageContainer.style.backgroundImage = `url(${creatorData.headerImage || ''})`;
        }
        document.getElementById('creator-name').textContent = creatorData.name || 'Creator Name';
        document.getElementById('creator-bio').textContent = creatorData.bio || 'No bio available.';
        document.getElementById('creator-avatar').src = creatorData.profileImage || 'images/default-avatar.png';
        
        const socialIconsContainer = document.getElementById('social-icons-container');
        if (socialIconsContainer) {
            socialIconsContainer.innerHTML = '';
            if (creatorData.socialLinks) {
                if (creatorData.socialLinks.twitter) socialIconsContainer.innerHTML += `<a href="${creatorData.socialLinks.twitter}" target="_blank" class="social-icon twitter"></a>`;
                if (creatorData.socialLinks.youtube) socialIconsContainer.innerHTML += `<a href="${creatorData.socialLinks.youtube}" target="_blank" class="social-icon youtube"></a>`;
            }
        }
        
        const supporterCount = creatorData.supporterCount || 0;
        const progressBarSection = document.getElementById('progress-bar-section');
        if (progressBarSection) {
            if (creatorData.firstSupporterIncentiveActive && supporterCount < 100) {
                progressBarSection.classList.remove('hidden');
                document.getElementById('progress-bar-fill').style.width = `${supporterCount}%`;
                document.getElementById('progress-bar-text').textContent = `${supporterCount} / 100`;
            } else {
                progressBarSection.classList.add('hidden');
            }
        }
        const tiersQuery = query(collection(creatorDocRef, 'tiers'), orderBy('price'));
        const tiersSnapshot = await getDocs(tiersQuery);
        const tiersListDiv = document.getElementById('tiers-list');
        tiersListDiv.innerHTML = '';
        const allTiers = tiersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        allTiers.forEach(tier => {
            const tierCard = document.createElement('div');
            tierCard.className = 'tier-card';
            tierCard.innerHTML = `<h3>${tier.name}</h3><p class="price">${tier.price} π/month</p><ul>${tier.description.split(/[\r\n]+/).map(b => `<li>${b}</li>`).join('')}</ul><button class="btn btn-primary subscribe-btn">Subscribe for ${tier.price} Test-π</button>`;
            tierCard.querySelector('.subscribe-btn').addEventListener('click', () => {
                handleSubscription(creatorData, tier.id, tier.name, tier.price);
            });
            tiersListDiv.appendChild(tierCard);
        });
        
        const membershipKey = `membership_${creatorId}`;
        const membershipDataString = sessionStorage.getItem(membershipKey);
        const subscribedTierId = membershipDataString ? JSON.parse(membershipDataString).tierId : null;
        let userAccessibleTierIds = [];
        if (subscribedTierId) {
            const subscribedTier = allTiers.find(t => t.id === subscribedTierId);
            if (subscribedTier) userAccessibleTierIds = allTiers.filter(t => t.price <= subscribedTier.price).map(t => t.id);
        }

        const postsQuery = query(collection(db, "posts"), where("creatorId", "==", creatorId), orderBy('createdAt', 'desc'));
        const postsSnapshot = await getDocs(postsQuery);
        const postsFeedDiv = document.getElementById('posts-feed');
        postsFeedDiv.innerHTML = postsSnapshot.empty ? "<p>This creator hasn't made any posts yet.</p>" : '';
        
        if (!postsSnapshot.empty) {
            const tierNames = allTiers.reduce((acc, tier) => ({...acc, [tier.id]: tier.name }), {});
            postsSnapshot.forEach(doc => {
                 const post = doc.data();
                const userHasAccess = post.accessibleTiers.some(id => userAccessibleTierIds.includes(id));
                const postCard = document.createElement('div');
                postCard.className = 'post-card';
                let mediaHTML = '';
                if (userHasAccess && post.media && post.media.url) {
                    if (post.media.type === 'image') mediaHTML = `<img src="${post.media.url}" alt="Post image" class="post-media">`;
                    else if (post.media.type === 'audio') mediaHTML = `<audio controls src="${post.media.url}" class="post-media"></audio>`;
                    else if (post.media.type === 'video') mediaHTML = `<video controls src="${post.media.url}" class="post-media"></video>`;
                }
                const contentHTML = userHasAccess 
                    ? `<div class="post-content"><p>${post.content.replace(/\n/g, '<br>')}</p></div>` 
                    : `<div class="post-locked"><p>This post is locked. Subscribe to view.</p></div>`;
                const accessibleTierNames = post.accessibleTiers.map(tierId => tierNames[tierId] || 'A tier').join(', ');
                postCard.innerHTML = `<h3>${post.title}</h3><p class="post-meta">Published on ${new Date(doc.data().createdAt.seconds * 1000).toLocaleDateString()}</p>${mediaHTML}${contentHTML}<div class="post-lock-info">🔒 Unlocks for: ${accessibleTierNames}</div>`;
                postsFeedDiv.appendChild(postCard);
            });
        }

        const merchQuery = query(collection(db, "creators", creatorId, 'merch'), orderBy('createdAt', 'desc'));
        const merchSnapshot = await getDocs(merchQuery);
        const merchListDiv = document.getElementById('merch-list');
        merchListDiv.innerHTML = merchSnapshot.empty ? "<p>This creator has no merch for sale yet.</p>" : '';

        if (!merchSnapshot.empty) {
             merchSnapshot.forEach(doc => {
                const item = doc.data();
                const card = document.createElement('div');
                card.className = 'creator-card merch-card';
                card.innerHTML = `<img src="${item.imageUrl}" alt="${item.name}" class="merch-image"><h3>${item.name}</h3><p>${item.description}</p><a href="${item.storeLink}" target="_blank" class="btn btn-primary">View in Store</a>`;
                merchListDiv.appendChild(card);
            });
        }

        const bountiesListDiv = document.getElementById('bounties-list');
        bountiesListDiv.innerHTML = '';
        const mockBounty = { title: "My First Music Video", goal: 500, current: 125, supporters: 12 };
        const bountyCard = document.createElement('div');
        bountyCard.className = 'bounty-card management-card';
        const progress = (mockBounty.current / mockBounty.goal) * 100;
        bountyCard.innerHTML = `<h3>${mockBounty.title}</h3><p>Help fund this project! Every contribution gets a special recognition NFT.</p><div class="progress-bar-container"><div class="progress-bar-fill" style="width: ${progress}%;"></div><span class="progress-bar-text">${mockBounty.current} / ${mockBounty.goal} π</span></div><p>${mockBounty.supporters} have contributed so far.</p><button class="btn btn-primary" style="margin-top: 15px;">Contribute (Coming Soon)</button>`;
        bountiesListDiv.appendChild(bountyCard);

     } catch (error) {
        console.error("Error loading creator page:", error);
        mainContent.innerHTML = "<h1>Error loading page. Please check the console for details.</h1>";
    }
}

window.addEventListener('app-ready', initializeCreatorPage);



