// creator.js - PLACEHOLDER VERSION FOR VIDEO
import { db } from './app.js';
// We are no longer using live Firestore queries on this page
// import { collection, doc, getDoc, getDocs, query, where } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

// This function can remain as it is for demonstration purposes.
async function handleSubscription(creatorData, tierId, tierName, tierPrice) {
    const piUser = JSON.parse(sessionStorage.getItem('piUser'));
    if (!piUser) {
        alert("Please connect your wallet first by logging in again.");
        return;
    }
    try {
        const creatorId = sessionStorage.getItem('selectedCreatorId');
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

// All render functions are preserved but will now receive placeholder data.
function renderPosts(postDocs, userAccessLevel) {
    const feed = document.getElementById('posts-feed');
    feed.innerHTML = '';
    if (postDocs.length === 0) {
        feed.innerHTML = '<p>This creator has not made any posts yet.</p>';
        return;
    }
    // Sort posts by date here to avoid index issues
    postDocs.sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);

    let visiblePosts = 0;
    postDocs.forEach(postDoc => {
        const post = postDoc; // Data is already clean
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
    merchDocs.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'merch-card management-card';
        itemElement.innerHTML = `
            <img src="${item.imageUrl || 'https://placehold.co/600x400/7E57C2/FFFFFF?text=Merch'}" alt="${item.name}" class="merch-image">
            <h3>${item.name}</h3>
            <p class="price">${item.price} π</p>
            <p>${item.description || ''}</p>
            <button class="btn btn-primary" style="margin-top:auto;">View Details</button>
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
    bountyDocs.forEach(bounty => {
        const bountyElement = document.createElement('div');
        bountyElement.className = 'bounty-card management-card';
        bountyElement.innerHTML = `
            <h3>${bounty.title}</h3>
            <p>${bounty.description}</p>
            <div class="bounty-reward">Reward: ${bounty.reward} π</div>
            <button class="btn btn-secondary" style="margin-top:15px;">Submit Work</button>
        `;
        list.appendChild(bountyElement);
    });
}


// --- REWRITTEN LOGIC USING PLACEHOLDERS ---
async function initializeCreatorPage() {
    const mainContent = document.getElementById('main-content');
    const currentUser = JSON.parse(sessionStorage.getItem('piUser'));

    // Sidebar logic remains the same
    if (currentUser && document.getElementById('username-display')) {
        document.getElementById('username-display').textContent = currentUser.username;
    }

    try {
        // --- STEP 1: DEFINE ALL PLACEHOLDER DATA ---
        const placeholderCreator = {
            name: "Placeholder Creator",
            bio: "This is a placeholder bio for the video presentation. All data on this page is for demonstration purposes.",
            profileImage: "https://placehold.co/150x150/512DA8/FFFFFF?text=Creator",
            headerImage: "https://placehold.co/1200x400/1E1E1E/FFFFFF?text=+"
        };

        const placeholderTiers = [
            { id: 'tier1', name: 'Bronze Supporter', price: 5, description: 'Access to supporter-only posts.\nYour name in the credits.' },
            { id: 'tier2', name: 'Silver Supporter', price: 10, description: 'All Bronze benefits.\nEarly access to content.' },
            { id: 'tier3', name: 'Gold Supporter', price: 25, description: 'All Silver benefits.\nExclusive monthly Q&A.' }
        ].sort((a, b) => a.price - b.price);

        const placeholderPosts = [
            { title: 'Welcome to the Community!', content: 'Thank you for supporting my work. Here is some content that is available to everyone.', tierRequired: 0, createdAt: { seconds: Date.now() / 1000 - 86400 } },
            { title: 'Exclusive Behind-the-Scenes', content: 'This is some exclusive content available only to Bronze Supporters and above.', tierRequired: 5, tierName: 'Bronze', createdAt: { seconds: Date.now() / 1000 - 172800 } },
            { title: 'Secret Project Update (Gold Tier Only)', content: 'This is top-secret content only for my most dedicated Gold Supporters. Thank you!', tierRequired: 25, tierName: 'Gold', createdAt: { seconds: Date.now() / 1000 } }
        ];

        const placeholderMerch = [
            { name: 'Official Logo Tee', price: 20, description: 'High-quality cotton t-shirt.', imageUrl: 'https://placehold.co/600x400/9575CD/FFFFFF?text=T-Shirt' },
            { name: 'Signed Poster', price: 15, description: 'A limited edition signed poster.', imageUrl: 'https://placehold.co/600x400/7E57C2/FFFFFF?text=Poster' }
        ];
        
        const placeholderBounties = [
            { title: 'Design a New Logo', description: 'Submit your best design for a new channel logo.', reward: 100 }
        ];

        // --- Step 2: Determine user access level (using placeholder tiers) ---
        let subscribedTierId = null;
        let userAccessLevel = 0;
        // This part is left dynamic to show the subscribe/subscribed states correctly
        if (currentUser) {
            const membershipKey = `membership_${sessionStorage.getItem('selectedCreatorId')}`;
            const membershipData = JSON.parse(sessionStorage.getItem(membershipKey));
            if(membershipData) {
                subscribedTierId = membershipData.tierId;
                const subscribedTier = placeholderTiers.find(t => t.id === subscribedTierId);
                if (subscribedTier) {
                    userAccessLevel = parseFloat(subscribedTier.price);
                }
            }
        }
        
        // --- Step 3: Render all page components with placeholder data ---
        document.getElementById('creator-header-image').style.backgroundImage = `url(${placeholderCreator.headerImage})`;
        document.getElementById('creator-name').textContent = placeholderCreator.name;
        document.getElementById('creator-bio').textContent = placeholderCreator.bio;
        document.getElementById('creator-avatar').src = placeholderCreator.profileImage;
        
        const tiersListDiv = document.getElementById('tiers-list');
        tiersListDiv.innerHTML = '';
        placeholderTiers.forEach(tier => {
            const tierCard = document.createElement('div');
            tierCard.className = 'tier-card';
            if (tier.id === subscribedTierId) { tierCard.classList.add('subscribed'); }
            const benefits = tier.description.split(/[\r\n]+/).map(b => `<li>${b}</li>`).join('');
            
            let buttonHtml = `<button class="btn btn-primary subscribe-btn">Subscribe</button>`;
            if (tier.id === subscribedTierId) {
                buttonHtml = `<button class="btn btn-success" disabled>Current Tier</button>`;
            } else if (userAccessLevel > 0 && userAccessLevel >= tier.price) {
                 buttonHtml = `<button class="btn btn-secondary" disabled>Included</button>`;
            }
            
            tierCard.innerHTML = `<h3>${tier.name}</h3><p class="price">${tier.price} π/month</p><ul>${benefits}</ul>${buttonHtml}`;
            
            if (!tierCard.querySelector('button').disabled) {
                tierCard.querySelector('.subscribe-btn').addEventListener('click', () => handleSubscription(placeholderCreator, tier.id, tier.name, tier.price));
            }
            
            tiersListDiv.appendChild(tierCard);
        });
        
        renderPosts(placeholderPosts, userAccessLevel);
        renderMerch(placeholderMerch, userAccessLevel);
        renderBounties(placeholderBounties, userAccessLevel);

    } catch (error) {
        // This catch block is now unlikely to be triggered
        console.error("Error rendering placeholder page:", error);
        mainContent.innerHTML = `<h1>An unexpected error occurred.</h1>`;
    }
}

// Ensure the main app is ready before running the page logic
window.addEventListener('app-ready', initializeCreatorPage);

