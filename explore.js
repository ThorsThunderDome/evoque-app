// explore.js - UPDATED WITH SCROLLER ARROWS
import { db } from './app.js';
import { collection, getDocs, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

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
            <img src="${post.creatorImage}" alt="${post.creatorName}" class="post-creator-avatar">
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

// --- NEW: Function to initialize the horizontal scroller arrows ---
function initializeShowcaseScroller() {
    const showcaseContainer = document.querySelector('.creator-showcase');
    if (!showcaseContainer) return;

    const scrollWrapper = showcaseContainer.querySelector('.horizontal-scroll');
    const scrollLeftBtn = showcaseContainer.querySelector('.scroll-arrow.left');
    const scrollRightBtn = showcaseContainer.querySelector('.scroll-arrow.right');

    if (!scrollWrapper || !scrollLeftBtn || !scrollRightBtn) return;

    const checkScrollPosition = () => {
        const maxScrollLeft = scrollWrapper.scrollWidth - scrollWrapper.clientWidth;
        // Hide left arrow if at the beginning
        scrollLeftBtn.style.opacity = scrollWrapper.scrollLeft > 10 ? '1' : '0';
        scrollLeftBtn.style.pointerEvents = scrollWrapper.scrollLeft > 10 ? 'auto' : 'none';

        // Hide right arrow if at the end
        scrollRightBtn.style.opacity = scrollWrapper.scrollLeft < maxScrollLeft - 10 ? '1' : '0';
        scrollRightBtn.style.pointerEvents = scrollWrapper.scrollLeft < maxScrollLeft - 10 ? 'auto' : 'none';
    };

    scrollLeftBtn.addEventListener('click', () => {
        scrollWrapper.scrollBy({ left: -300, behavior: 'smooth' });
    });

    scrollRightBtn.addEventListener('click', () => {
        scrollWrapper.scrollBy({ left: 300, behavior: 'smooth' });
    });

    // Check position on initial load and on scroll
    scrollWrapper.addEventListener('scroll', checkScrollPosition);
    // Use a small timeout to ensure the DOM is fully rendered before the initial check
    setTimeout(checkScrollPosition, 200);
}


async function buildExploreFeed() {
    const subscribedContainer = document.getElementById('subscribed-posts-container');
    const showcaseContainer = document.getElementById('creator-showcase-container');
    const discoverContainer = document.getElementById('discover-posts-container');
    subscribedContainer.innerHTML = '<div class="loader"></div>';
    discoverContainer.innerHTML = '<div class="loader"></div>';

    try {
        const subscribedCreatorIds = [];
        for (let i = 0; i < sessionStorage.length; i++) {
            if (sessionStorage.key(i).startsWith('membership_')) {
                subscribedCreatorIds.push(sessionStorage.key(i).split('_')[1]);
            }
        }
        const postsQuery = query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(30));
        const creatorsQuery = query(collection(db, "creators"), limit(10));
        const [postsSnapshot, creatorsSnapshot] = await Promise.all([getDocs(postsQuery), getDocs(creatorsSnapshot)]);

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
        
        subscribedContainer.innerHTML = '';
        if (subscribedPosts.length === 0) {
            subscribedContainer.innerHTML = "<p>Posts from your subscribed creators will appear here.</p>";
        } else {
            subscribedPosts.forEach(post => {
                const postCard = createPostCard(post, true);
                subscribedContainer.appendChild(postCard);
            });
        }

        const creators = [];
        creatorsSnapshot.forEach(doc => creators.push({ id: doc.id, ...doc.data() }));
        if (creators.length > 0) {
            const showcase = document.createElement('div');
            showcase.className = 'creator-showcase';
            
            // --- UPDATED: Added a wrapper and arrow buttons to the HTML structure ---
            let showcaseHTML = `
                <h2>Discover Creators</h2>
                <div class="horizontal-scroll-wrapper">
                    <button class="scroll-arrow left" aria-label="Scroll Left">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                    </button>
                    <div class="horizontal-scroll">`;
            
            creators.sort(() => 0.5 - Math.random()).slice(0, 5).forEach(creator => {
                showcaseHTML += `<div class="creator-card showcase-card" data-id="${creator.id}"><img src="${creator.profileImage}" alt="${creator.name}" class="creator-avatar"><h3>${creator.name}</h3><p>${creator.bio.substring(0, 50)}...</p></div>`;
            });
            
            showcaseHTML += `
                    </div>
                    <button class="scroll-arrow right" aria-label="Scroll Right">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                    </button>
                </div>`;
            
            showcase.innerHTML = showcaseHTML;
            showcaseContainer.appendChild(showcase);
            
            // --- NEW: Call the initializer function after creating the showcase ---
            initializeShowcaseScroller();
        }

        discoverContainer.innerHTML = '';
        if (discoverPosts.length === 0) {
            discoverContainer.innerHTML = "<p>No other posts to discover right now.</p>";
        } else {
            discoverPosts.forEach(post => {
                const postCard = createPostCard(post, false);
                discoverContainer.appendChild(postCard);
            });
        }
        
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
    }
}

buildExploreFeed();
