// explore.js - UPDATED WITH TIER-LOCKING LOGIC
import { db } from './app.js';
import { collection, getDocs, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

// This function remains unchanged.
function createPostCard(post, isUnlocked) {
    const postCard = document.createElement('div');
    postCard.className = 'feed-post-card';
    const postDate = post.createdAt ? new Date(post.createdAt.seconds * 1000).toLocaleDateString() : 'Just now';

    let contentHTML = '';
    if (isUnlocked) {
        contentHTML = `<p>${post.content.substring(0, 250)}...</p>`;
    } else {
        contentHTML = `
            <div class="post-preview-locked">
                <p>${post.content.substring(0, 150)}</p>
                <div class="lock-overlay">
                    🔒 Subscribe to view this post
                </div>
            </div>
        `;
    }

    postCard.innerHTML = `
        <div class="post-header">
            <img src="${post.creatorImage || 'images/default-avatar.png'}" alt="${post.creatorName}" class="post-creator-avatar">
            <div>
                <a href="#" class="post-creator-name" data-id="${post.creatorId}">${post.creatorName}</a>
                <p class="post-meta">${postDate}</p>
            </div>
        </div>
        <div class="post-body">
            <h3>${post.title}</h3>
            ${contentHTML}
        </div>
        <div class="post-footer">
            <a href="#" class="btn btn-secondary view-creator-btn" data-id="${post.creatorId}">View Profile & Subscribe</a>
        </div>
    `;
    return postCard;
}

// This function remains unchanged.
function initializeShowcaseScroller() {
    const showcaseContainer = document.querySelector('.creator-showcase');
    if (!showcaseContainer) return;
    const scrollWrapper = showcaseContainer.querySelector('.horizontal-scroll');
    const scrollLeftBtn = showcaseContainer.querySelector('.scroll-arrow.left');
    const scrollRightBtn = showcaseContainer.querySelector('.scroll-arrow.right');
    if (!scrollWrapper || !scrollLeftBtn || !scrollRightBtn) return;
    const checkScrollPosition = () => {
        if (scrollWrapper.scrollWidth <= scrollWrapper.clientWidth) {
            scrollLeftBtn.style.opacity = '0'; right.style.opacity = '0';
            scrollLeftBtn.style.pointerEvents = 'none'; right.style.pointerEvents = 'none';
            return;
        }
        const maxScrollLeft = scrollWrapper.scrollWidth - scrollWrapper.clientWidth;
        scrollLeftBtn.style.opacity = scrollWrapper.scrollLeft > 10 ? '1' : '0';
        scrollLeftBtn.style.pointerEvents = scrollWrapper.scrollLeft > 10 ? 'auto' : 'none';
        scrollRightBtn.style.opacity = scrollWrapper.scrollLeft < maxScrollLeft - 10 ? '1' : '0';
        scrollRightBtn.style.pointerEvents = scrollWrapper.scrollLeft < maxScrollLeft - 10 ? 'auto' : 'none';
    };
    scrollLeftBtn.addEventListener('click', () => scrollWrapper.scrollBy({ left: -300, behavior: 'smooth' }));
    scrollRightBtn.addEventListener('click', () => scrollWrapper.scrollBy({ left: 300, behavior: 'smooth' }));
    scrollWrapper.addEventListener('scroll', checkScrollPosition);
    setTimeout(checkScrollPosition, 200);
}

// --- THIS ENTIRE FUNCTION HAS BEEN REBUILT ---
async function buildExploreFeed() {
    const subscribedContainer = document.getElementById('subscribed-posts-container');
    const showcaseContainer = document.getElementById('creator-showcase-container');
    const discoverContainer = document.getElementById('discover-posts-container');
    subscribedContainer.innerHTML = '<div class="loader"></div>';
    discoverContainer.innerHTML = '<div class="loader"></div>';

    try {
        // 1. Get user's subscriptions and subscribed creator IDs from sessionStorage
        const userMemberships = {};
        const subscribedCreatorIds = [];
        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key.startsWith('membership_')) {
                const creatorId = key.split('_')[1];
                subscribedCreatorIds.push(creatorId);
                userMemberships[creatorId] = JSON.parse(sessionStorage.getItem(key));
            }
        }

        // 2. Fetch all tiers for ONLY the creators the user is subscribed to
        const creatorsTiers = {};
        const tierPromises = subscribedCreatorIds.map(id => {
            const tiersQuery = query(collection(db, "creators", id, 'tiers'));
            return getDocs(tiersQuery).then(snapshot => {
                creatorsTiers[id] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            });
        });
        await Promise.all(tierPromises);

        // 3. Fetch all posts and creators for the showcase
        const postsQuery = query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(30));
        const creatorsQuery = query(collection(db, "creators"), limit(10));
        const [postsSnapshot, creatorsSnapshot] = await Promise.all([getDocs(postsQuery), getDocs(creatorsQuery)]);

        // 4. Process all posts, separating them into subscribed and discover feeds
        const subscribedPosts = [];
        const discoverPosts = [];
        postsSnapshot.forEach(doc => {
            const post = { id: doc.id, ...doc.data() };
            if (subscribedCreatorIds.includes(post.creatorId)) {
                subscribedPosts.push(post);
            } else {
                discoverPosts.push(post);
            }
        });
        
        // 5. Render the "Subscribed" feed with the correct lock logic
        subscribedContainer.innerHTML = '';
        if (subscribedPosts.length === 0) {
            subscribedContainer.innerHTML = "<p>Posts from your subscribed creators will appear here.</p>";
        } else {
            subscribedPosts.forEach(post => {
                // --- THIS IS THE NEW TIER-CHECKING LOGIC ---
                const creatorId = post.creatorId;
                const membership = userMemberships[creatorId];
                const allTiersForCreator = creatorsTiers[creatorId] || [];
                let isUnlocked = false;

                if (membership && allTiersForCreator.length > 0) {
                    const subscribedTier = allTiersForCreator.find(t => t.id === membership.tierId);
                    if (subscribedTier) {
                        const userAccessibleTierIds = allTiersForCreator
                            .filter(t => t.price <= subscribedTier.price)
                            .map(t => t.id);
                        isUnlocked = post.accessibleTiers.some(id => userAccessibleTierIds.includes(id));
                    }
                }
                // --- END OF NEW LOGIC ---

                subscribedContainer.appendChild(createPostCard(post, isUnlocked));
            });
        }

        // 6. Build the creator showcase (this logic is unchanged)
        const creators = [];
        creatorsSnapshot.forEach(doc => creators.push({ id: doc.id, ...doc.data() }));
        if (creators.length > 0) {
            const showcase = document.createElement('div');
            showcase.className = 'creator-showcase';
            let showcaseHTML = `<h2>Discover Creators</h2><div class="horizontal-scroll-wrapper"><button class="scroll-arrow left" aria-label="Scroll Left"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg></button><div class="horizontal-scroll">`;
            creators.forEach(creator => {
                const bioPreview = creator.bio ? creator.bio.substring(0, 50) + '...' : 'No bio available.';
                showcaseHTML += `<div class="creator-card showcase-card" data-id="${creator.id}"><img src="${creator.profileImage || 'images/default-avatar.png'}" alt="${creator.name}" class="creator-avatar"><h3>${creator.name}</h3><p>${bioPreview}</p></div>`;
            });
            showcaseHTML += `</div><button class="scroll-arrow right" aria-label="Scroll Right"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg></button></div>`;
            showcase.innerHTML = showcaseHTML;
            showcaseContainer.appendChild(showcase);
            initializeShowcaseScroller();
        }

        // 7. Render the "Discover" feed (this logic is unchanged)
        discoverContainer.innerHTML = '';
        if (discoverPosts.length === 0) {
            discoverContainer.innerHTML = "<p>No other posts to discover right now.</p>";
        } else {
            discoverPosts.forEach(post => discoverContainer.appendChild(createPostCard(post, false)));
        }
        
        // 8. Attach event listeners (this logic is unchanged)
        document.querySelectorAll('.view-creator-btn, .post-creator-name, .showcase-card').forEach(button => {
            button.addEventListener('click', (event) => {
                event.preventDefault();
                const creatorId = event.target.closest('[data-id]').dataset.id;
                sessionStorage.setItem('selectedCreatorId', creatorId);
                window.location.href = 'creator.html';
            });
        });

     } catch (error) {
        console.error("Error building explore feed: ", error);
        discoverContainer.innerHTML = "<p>Could not load discover feed. Please try again later.</p>";
        subscribedContainer.innerHTML = "<p>Could not load subscriptions. Please try again later.</p>";
     }
}

window.addEventListener('app-ready', buildExploreFeed);

