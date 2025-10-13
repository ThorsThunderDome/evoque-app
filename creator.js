// creator.js - FINAL, COMPLETE VERSION
import { db, piUser } from './app.js';
// CORRECTED: Removed unused functions like 'where', 'updateDoc', etc.
import { collection, doc, getDoc, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

// This is the main function that will run when the page loads
async function initializeCreatorPage() {
    const creatorId = sessionStorage.getItem('selectedCreatorId');
    const mainContent = document.getElementById('main-content');

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

        // --- Render Creator Header ---
        document.getElementById('creator-name').textContent = creatorData.name;
        document.getElementById('creator-bio').textContent = creatorData.bio;
        document.getElementById('creator-avatar').src = creatorData.profileImage;
        const socialIconsContainer = document.getElementById('social-icons-container');
        if (creatorData.socialLinks) {
            let iconsHTML = '';
            if (creatorData.socialLinks.twitter) iconsHTML += `<a href="${creatorData.socialLinks.twitter}" target="_blank" class="social-icon twitter"></a>`;
            if (creatorData.socialLinks.youtube) iconsHTML += `<a href="${creatorData.socialLinks.youtube}" target="_blank" class="social-icon youtube"></a>`;
            socialIconsContainer.innerHTML = iconsHTML;
        }

        // --- Render Progress Bar ---
        const supporterCount = creatorData.supporterCount || 0;
        if (creatorData.firstSupporterIncentiveActive && supporterCount < 100) {
            document.getElementById('progress-bar-fill').style.width = `${supporterCount}%`;
            document.getElementById('progress-bar-text').textContent = `${supporterCount} / 100`;
        } else {
            document.getElementById('progress-bar-section').classList.add('hidden');
        }

        // --- Render Tiers and Attach Event Listeners ---
        const tiersQuery = query(collection(db, "creators", creatorId, 'tiers'), orderBy('price'));
        const tiersSnapshot = await getDocs(tiersQuery);
        const tiersListDiv = document.getElementById('tiers-list');
        tiersListDiv.innerHTML = '';
        const allTiers = [];
        if (!tiersSnapshot.empty) {
            tiersSnapshot.forEach(tierDoc => {
                const tier = tierDoc.data();
                allTiers.push({ id: tierDoc.id, ...tier });
                const tierCard = document.createElement('div');
                tierCard.className = 'tier-card';
                tierCard.innerHTML = `<h3>${tier.name}</h3><p class="price">${tier.price} π/month</p><ul>${tier.description.split(/[\r\n]+/).map(b => `<li>${b}</li>`).join('')}</ul><button class="btn btn-primary subscribe-btn">Subscribe for ${tier.price} Test-π</button>`;
                
                tierCard.querySelector('.subscribe-btn').addEventListener('click', () => {
                    handleSubscription(creatorData, tierDoc.id, tier.name, tier.price);
                });

                tiersListDiv.appendChild(tierCard);
            });
        }
        
        // --- Logic to check user's access level for posts ---
        const membershipKey = `membership_${creatorId}`;
        const membershipDataString = sessionStorage.getItem(membershipKey);
        const subscribedTierId = membershipDataString ? JSON.parse(membershipDataString).tierId : null;
        let userAccessibleTierIds = [];
        if (subscribedTierId) {
            const subscribedTier = allTiers.find(t => t.id === subscribedTierId);
            if (subscribedTier) {
                userAccessibleTierIds = allTiers.filter(t => t.price <= subscribedTier.price).map(t => t.id);
            }
        }

        // --- Render Posts ---
        const postsQuery = query(collection(db, "posts"), where("creatorId", "==", creatorId), orderBy('createdAt', 'desc'));
        const postsSnapshot = await getDocs(postsQuery);
        const postsFeedDiv = document.getElementById('posts-feed');
        postsFeedDiv.innerHTML = '';
        if (postsSnapshot.empty) {
            postsFeedDiv.innerHTML = "<p>This creator hasn't made any posts yet.</p>";
        } else {
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

        // --- Render Merch ---
        const merchQuery = query(collection(db, "creators", creatorId, 'merch'), orderBy('createdAt', 'desc'));
        const merchSnapshot = await getDocs(merchQuery);
        const merchListDiv = document.getElementById('merch-list');
        merchListDiv.innerHTML = '';
        if (merchSnapshot.empty) {
            merchListDiv.innerHTML = "<p>This creator has no merch for sale yet.</p>";
        } else {
            merchSnapshot.forEach(doc => {
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

        // --- Render Bounty ---
        const bountiesListDiv = document.getElementById('bounties-list');
        bountiesListDiv.innerHTML = '';
        const mockBounty = { title: "My First Music Video", goal: 500, current: 125, supporters: 12 };
        const card = document.createElement('div');
        card.className = 'bounty-card management-card';
        const progress = (mockBounty.current / mockBounty.goal) * 100;
        card.innerHTML = `<h3>${mockBounty.title}</h3><p>Help fund this project! Every contribution gets a special recognition NFT.</p><div class="progress-bar-container"><div class="progress-bar-fill" style="width: ${progress}%;"></div><span class="progress-bar-text">${mockBounty.current} / ${mockBounty.goal} π</span></div><p>${mockBounty.supporters} supporters have contributed so far.</p><button class="btn btn-primary" style="margin-top: 15px;">Contribute (Coming Soon)</button>`;
        bountiesListDiv.appendChild(card);

    } catch (error) {
        console.error("Error loading creator page:", error);
        mainContent.innerHTML = "<h1>Error loading page. Please check the console for details.</h1>";
    }
}

async function handleSubscription(creatorData, tierId, tierName, tierPrice) {
    if (typeof window.createPiPayment !== 'function') {
        alert("Payment script not loaded. Please refresh the page.");
        return;
    }
    try {
        const creatorId = sessionStorage.getItem('selectedCreatorId');
        await window.createPiPayment({
            amount: tierPrice,
            memo: `Subscription to ${creatorData.name} - ${tierName}`,
            metadata: { supporterUid: piUser.uid, creatorUid: creatorId, tierId: tierId }
        });
        alert("Payment flow initiated! Check the Pi App to approve.");
    } catch (error) {
        console.error("Error initiating payment flow:", error);
    }
}

document.addEventListener('DOMContentLoaded', initializeCreatorPage);

