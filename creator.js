// creator.js
import { db, piUser, onIncompletePaymentFound } from './app.js';
import { collection, doc, getDoc, getDocs, query, where, orderBy } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

async function handleSubscription(creatorData, tierId, tierName, tierPrice) {
    // REVERTED: piUser is imported.
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
    
    // REVERTED: piUser is imported and used for the sidebar display.
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
        const allTiers = tiersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const tiersListDiv = document.getElementById('tiers-list');
        tiersListDiv.innerHTML = '';
        allTiers.forEach(tier => {
            const tierCard = document.createElement('div');
            tierCard.className = 'tier-card';
            const benefits = tier.description ? tier.description.split(/[\r\n]+/).map(b => `<li>${b}</li>`).join('') : '';
            tierCard.innerHTML = `<h3>${tier.name}</h3><p class="price">${tier.price} π/month</p><ul>${benefits}</ul><button class="btn btn-primary subscribe-btn">Subscribe for ${tier.price} Test-π</button>`;
            tierCard.querySelector('.subscribe-btn').addEventListener('click', () => {
                handleSubscription(creatorData, tier.id, tier.name, tier.price);
            });
            tiersListDiv.appendChild(tierCard);
        });
        
    } catch (error) {
        console.error("Error loading creator page:", error);
        mainContent.innerHTML = "<h1>Error loading page. Please check the console for details.</h1>";
    }
}

window.addEventListener('app-ready', initializeCreatorPage);

