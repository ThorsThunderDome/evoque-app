// creator.js
import { db, piUser } from './app.js';
import { collection, doc, getDoc, getDocs, query, where, orderBy, updateDoc, increment, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

const creatorId = sessionStorage.getItem('selectedCreatorId');

if (!creatorId) {
    document.getElementById('main-content').innerHTML = "<h1>Error: Creator ID not found.</h1>";
} else {
    const creatorDocRef = doc(db, "creators", creatorId);

    // This function now uses the createPiPayment from app.js
    async function handleSubscription(creatorData, tierId, tierName, tierPrice) {
        if (!window.createPiPayment) {
            alert("Payment script not loaded.");
            return;
        }

        // We will pass the specific tier info to the payment function
        await window.createPiPayment({
            amount: tierPrice,
            memo: `Subscription to ${creatorData.name} - ${tierName}`,
            metadata: {
                supporterUid: piUser.uid,
                creatorUid: creatorId,
                tierId: tierId,
            }
        });

        // After a successful payment, we save the subscription record.
        // NOTE: The Pi SDK's onReadyForServerCompletion callback should trigger this.
        // For now, we'll add it here as a placeholder for the full flow.
        try {
            let newSupporterNumber = null;
            if (creatorData.firstSupporterIncentiveActive && (creatorData.supporterCount || 0) < 100) {
                const currentCount = creatorData.supporterCount || 0;
                newSupporterNumber = currentCount + 1;
                await updateDoc(creatorDocRef, { supporterCount: increment(1) });
            }

            const supporterRecord = {
                supporterUid: piUser.uid,
                supporterUsername: piUser.username,
                tierId: tierId,
                subscribedAt: serverTimestamp()
            };
            await addDoc(collection(creatorDocRef, 'supporters'), supporterRecord);

            const membershipKey = `membership_${creatorId}`;
            const membershipData = { tierId: tierId, number: newSupporterNumber };
            sessionStorage.setItem(membershipKey, JSON.stringify(membershipData));

            alert(`Subscription successful! You are supporter #${newSupporterNumber || 'N/A'}. Refresh the page to see your new access.`);
        } catch (error) {
            console.error("Error saving subscription record:", error);
            alert("Payment was successful, but there was an error saving your subscription. Please contact support.");
        }
    }
    try {
            const docSnap = await getDoc(creatorDocRef);
            if (docSnap.exists()) {
                const creatorData = docSnap.data();
                document.getElementById('creator-name').textContent = creatorData.name;
                document.getElementById('creator-bio').textContent = creatorData.bio;
               
                // ADD THIS NEW BLOCK
                const socialIconsContainer = document.getElementById('social-icons-container');
                if (creatorData.socialLinks) {
                    let iconsHTML = '';
                    if (creatorData.socialLinks.twitter) {
                        iconsHTML += `<a href="${creatorData.socialLinks.twitter}" target="_blank" class="social-icon twitter"></a>`;
                    }
                    if (creatorData.socialLinks.youtube) {
                        iconsHTML += `<a href="${creatorData.socialLinks.youtube}" target="_blank" class="social-icon youtube"></a>`;
                    }
                    socialIconsContainer.innerHTML = iconsHTML;
                }
                document.getElementById('creator-avatar').src = creatorData.profileImage;

                // Progress Bar Logic
                const supporterCount = creatorData.supporterCount || 0;
                if (creatorData.firstSupporterIncentiveActive && supporterCount < 100) {
                    document.getElementById('progress-bar-fill').style.width = `${supporterCount}%`;
                    document.getElementById('progress-bar-text').textContent = `${supporterCount} / 100`;
                } else {
                    document.getElementById('progress-bar-section').classList.add('hidden');
                }

                const tiersQuery = query(collection(db, "creators", creatorId, 'tiers'), orderBy('price'));
                const tiersSnapshot = await getDocs(tiersQuery);
                const tiersListDiv = document.getElementById('tiers-list');
                tiersListDiv.innerHTML = '';
                const allTiers = [];

                if (!tiersSnapshot.empty) {
                    tiersSnapshot.forEach(doc => {
                        const tier = doc.data();
                        allTiers.push({ id: doc.id, name: tier.name, price: tier.price, description: tier.description });
                        const tierCard = document.createElement('div');
                        tierCard.className = 'tier-card';
                        tierCard.innerHTML = `<h3>${tier.name}</h3><p class="price">${tier.price} π/month</p><ul>${tier.description.split(/[\r\n]+/).map(b => `<li>${b}</li>`).join('')}</ul><button class="btn btn-primary subscribe-btn">Subscribe for ${tier.price} Test-π</button>`;
                        tierCard.querySelector('.subscribe-btn').addEventListener('click', () => {
                            handleSubscription(creatorData, doc.id, tier.name, tier.price);
                        });
                        tiersListDiv.appendChild(tierCard);
                    });
                }

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

                // CORRECTED v9 POSTS QUERY
                const postsQuery = query(collection(db, "posts"), where("creatorId", "==", creatorId), orderBy('createdAt', 'desc'));
                const postsSnapshot = await getDocs(postsQuery);
                const postsFeedDiv = document.getElementById('posts-feed');
                postsFeedDiv.innerHTML = '';

                if (postsSnapshot.empty) {
                    postsFeedDiv.innerHTML = "<p>This creator hasn't made any posts yet.</p>";
                } else {
                    postsSnapshot.forEach(doc => {
                        const post = doc.data();
                        let mediaHTML = '';
                        if (post.media && post.media.url) {
                            if (post.media.type === 'image') mediaHTML = `<img src="${post.media.url}" alt="Post image" class="post-media">`;
                            else if (post.media.type === 'audio') mediaHTML = `<audio controls src="${post.media.url}" class="post-media"></audio>`;
                            else if (post.media.type === 'video') mediaHTML = `<video controls src="${post.media.url}" class="post-media"></video>`;
                        }
                        const tierNames = allTiers.reduce((acc, tier) => ({...acc, [tier.id]: tier.name }), {});
                        const accessibleTierNames = post.accessibleTiers.map(tierId => tierNames[tierId] || 'A tier').join(', ');
                        const userHasAccess = post.accessibleTiers.some(id => userAccessibleTierIds.includes(id));
                        let contentHTML = userHasAccess ? `<div class="post-content"><p>${post.content}</p></div>` : `<div class="post-locked"><p>This post is locked. Subscribe to view.</p></div>`;
                        const postCard = document.createElement('div');
                        postCard.className = 'post-card';
                        postCard.innerHTML = `<h3>${post.title}</h3><p class="post-meta">Published on ${new Date(doc.data().createdAt.seconds * 1000).toLocaleDateString()}</p>${mediaHTML}${contentHTML}<div class="post-lock-info">🔒 Unlocks for: ${accessibleTierNames}</div>`;
                        postsFeedDiv.appendChild(postCard);
                    });
                }
            } else {
                document.getElementById('main-content').innerHTML = "<h1>Creator not found.</h1>";
            }
                 // --- NEW: Fetch and render Merch ---
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
                    card.className = 'creator-card merch-card'; // Add a new class for styling
                    card.innerHTML = `
                        <img src="${item.imageUrl}" alt="${item.name}" class="merch-image">
                        <h3>${item.name}</h3>
                        <p>${item.description}</p>
                        <a href="${item.storeLink}" target="_blank" class="btn btn-primary">View in Store</a>
                    `;
                    merchListDiv.appendChild(card);
                });
            }
            // --- NEW: Render Placeholder Bounty ---
            const bountiesListDiv = document.getElementById('bounties-list');
            const mockBounty = {
                title: "My First Music Video",
                goal: 500,
                current: 125,
                supporters: 12
            };
            
            const card = document.createElement('div');
            card.className = 'bounty-card management-card'; // Reuse style
            const progress = (mockBounty.current / mockBounty.goal) * 100;
            card.innerHTML = `
                <h3>${mockBounty.title}</h3>
                <p>Help fund this project! Every contribution gets a special recognition NFT.</p>
                <div class="progress-bar-container">
                    <div class="progress-bar-fill" style="width: ${progress}%;"></div>
                    <span class="progress-bar-text">${mockBounty.current} / ${mockBounty.goal} π</span>
                </div>
                <p>${mockBounty.supporters} supporters have contributed so far.</p>
                <button class="btn btn-primary" style="margin-top: 15px;">Contribute (Coming Soon)</button>
            `;
            bountiesListDiv.appendChild(card);


        } catch (error) {
            console.error("Error fetching creator page:", error);
            document.getElementById('main-content').innerHTML = "<h1>Error loading page. Please check the console.</h1>";
        }
    }
