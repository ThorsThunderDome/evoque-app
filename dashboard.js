// dashboard.js
import { db, piUser } from './app.js';
import { collection, doc, getDoc, getDocs, query, where, onSnapshot } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

const membershipsGrid = document.getElementById('memberships-grid');
const nftModal = document.getElementById('nft-modal');
const nftModalClose = document.getElementById('nft-modal-close');

function showNftModal(nftData, creatorData) {
    document.getElementById('nft-modal-image').src = creatorData.profileImage || 'images/default-avatar.png';
    document.getElementById('nft-modal-creator-name').textContent = creatorData.name;
    document.getElementById('nft-modal-mint-date').textContent = new Date(nftData.createdAt.seconds * 1000).toLocaleDateString();
    document.getElementById('nft-modal-thank-you-note').textContent = nftData.thankYouNote;

    const supporterNumBadge = document.getElementById('nft-modal-supporter-number');
    const incentiveDetails = document.getElementById('nft-modal-incentive-details');

    if (nftData.type === 'first_supporter') {
        document.getElementById('nft-modal-title').textContent = 'First Supporter Badge';
        supporterNumBadge.textContent = `#${nftData.supporterNumber}`;
        supporterNumBadge.classList.remove('hidden');
        incentiveDetails.classList.remove('hidden');
    } else {
        document.getElementById('nft-modal-title').textContent = `Membership NFT: ${nftData.tierName}`;
        supporterNumBadge.classList.add('hidden');
        incentiveDetails.classList.add('hidden');
    }
    nftModal.classList.remove('hidden');
}

nftModalClose.addEventListener('click', () => nftModal.classList.add('hidden'));
nftModal.addEventListener('click', (e) => {
    if (e.target === nftModal) {
        nftModal.classList.add('hidden');
    }
});

async function loadDashboard() {
    membershipsGrid.innerHTML = '<div class="loader"></div>';
    
    // Listen for subscriptions in real-time
    const subscriptionsQuery = query(collection(db, 'subscriptions'), where('supporterUid', '==', piUser.uid));
    
    onSnapshot(subscriptionsQuery, async (snapshot) => {
        if (snapshot.empty) {
            membershipsGrid.innerHTML = '<p>You have not subscribed to any creators yet.</p>';
            return;
        }

        membershipsGrid.innerHTML = '';
        for (const doc of snapshot.docs) {
            const subscription = doc.data();
            const creatorId = subscription.creatorUid;
            
            try {
                const creatorDoc = await getDoc(doc(db, 'creators', creatorId));
                if (!creatorDoc.exists()) continue;

                const creator = creatorDoc.data();
                const card = document.createElement('div');
                card.className = 'creator-card';
                card.innerHTML = `
                    <img src="${creator.profileImage || 'images/default-avatar.png'}" alt="${creator.name}" class="creator-avatar">
                    <h3>${creator.name}</h3>
                    <div class="card-actions">
                        <button class="btn btn-secondary view-creator-btn" data-id="${creatorId}">Visit Page</button>
                        <button class="btn btn-primary nft-dropdown-btn" data-id="${creatorId}">My NFTs ▼</button>
                    </div>
                    <div class="nft-dropdown-content hidden"><ul><div class="loader-small"></div></ul></div>
                `;
                membershipsGrid.appendChild(card);

                card.querySelector('.view-creator-btn').addEventListener('click', (e) => {
                    sessionStorage.setItem('selectedCreatorId', e.target.dataset.id);
                    window.location.href = 'creator.html';
                });

                card.querySelector('.nft-dropdown-btn').addEventListener('click', async (event) => {
                    const content = event.target.closest('.creator-card').querySelector('.nft-dropdown-content');
                    const isHidden = content.classList.toggle('hidden');
                    event.target.innerHTML = isHidden ? 'My NFTs ▼' : 'My NFTs ▲';

                    if (!isHidden && !content.dataset.loaded) {
                        const nftsQuery = query(collection(db, 'nfts'), where('supporterUid', '==', piUser.uid), where('creatorUid', '==', creatorId));
                        const nftsSnapshot = await getDocs(nftsQuery);
                        
                        let nftHtml = '<ul>';
                        if (nftsSnapshot.empty) {
                            nftHtml += '<li>No NFTs found.</li>';
                        } else {
                            nftsSnapshot.forEach(nftDoc => {
                                const nft = { id: nftDoc.id, ...nftDoc.data() };
                                const title = nft.type === 'first_supporter' ? `First Supporter #${nft.supporterNumber}` : `Membership: ${nft.tierName}`;
                                nftHtml += `<li class="nft-item" data-nft-id="${nft.id}"><strong>${title}</strong><br><small>Minted: ${new Date(nft.createdAt.seconds * 1000).toLocaleDateString()}</small></li>`;
                            });
                        }
                        nftHtml += '</ul>';
                        content.innerHTML = nftHtml;
                        content.dataset.loaded = "true";

                        // Add click listeners to the new NFT items
                        content.querySelectorAll('.nft-item').forEach(item => {
                            item.addEventListener('click', () => {
                                const nftId = item.dataset.nftId;
                                const clickedNft = nftsSnapshot.docs.find(d => d.id === nftId).data();
                                showNftModal(clickedNft, creator);
                            });
                        });
                    }
                });
            } catch (error) { console.error("Error fetching subscription details", error); }
        }
    });
}

// Mock Royalties - this can be developed later
const royaltiesListDiv = document.getElementById('royalties-list');
royaltiesListDiv.innerHTML = "<p>You are not yet earning royalties from any creators.</p>";

window.addEventListener('app-ready', loadDashboard);