// dashboard.js
import { db } from './app.js';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

const membershipsGrid = document.getElementById('memberships-grid');
membershipsGrid.innerHTML = '<div class="loader"></div>';
let subsFound = 0;

async function loadDashboard() {
    for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key.startsWith('membership_')) {
            subsFound++;
            if (subsFound === 1) membershipsGrid.innerHTML = '';
            
            const creatorId = key.split('_')[1];
            const membershipData = JSON.parse(sessionStorage.getItem(key));
            const tierId = membershipData.tierId;
            const supporterNumber = membershipData.number;

            try {
                const creatorDoc = await getDoc(doc(db, 'creators', creatorId));
                const tierDoc = await getDoc(doc(db, 'creators', creatorId, 'tiers', tierId));

                if (creatorDoc.exists() && tierDoc.exists()) {
                    const creator = creatorDoc.data();
                    const tier = tierDoc.data();
                    const card = document.createElement('div');
                    card.className = 'creator-card';
                    card.innerHTML = `
                        <img src="${creator.profileImage}" alt="${creator.name}" class="creator-avatar">
                        <h3>${creator.name}</h3>
                        <p><strong>Your Tier:</strong> ${tier.name}</p>
                        <div class="card-actions">
                            <button class="btn btn-secondary view-creator-btn" data-id="${creatorId}">Visit Page</button>
                            <button class="btn btn-primary nft-dropdown-btn" data-id="${creatorId}">My NFTs ▼</button>
                        </div>
                        <div class="nft-dropdown-content hidden"></div>
                    `;
                    membershipsGrid.appendChild(card);

                    card.querySelector('.view-creator-btn').addEventListener('click', (e) => {
                        sessionStorage.setItem('selectedCreatorId', e.target.dataset.id);
                        window.location.href = 'creator.html';
                    });

                    card.querySelector('.nft-dropdown-btn').addEventListener('click', (event) => {
                        const content = event.target.closest('.creator-card').querySelector('.nft-dropdown-content');
                        const isHidden = content.classList.toggle('hidden');
                        event.target.innerHTML = isHidden ? 'My NFTs ▼' : 'My NFTs ▲';

                        if (!isHidden && content.innerHTML === '') {
                            const nfts = [{ name: 'Membership NFT', tier: tier.name }];
                            if (supporterNumber) {
                                nfts.push({ name: `First Supporter Badge #${supporterNumber}`, date: 'Oct 2025' });
                            }
                            let nftHtml = '<ul>';
                            nfts.forEach(nft => {
                                nftHtml += `<li><strong>${nft.name}</strong><br><small>${nft.tier || `Earned: ${nft.date}`}</small></li>`;
                            });
                            nftHtml += '</ul>';
                            content.innerHTML = nftHtml;
                        }
                    });
                }
            } catch (error) { console.error("Error fetching subscription details", error); }
        }
    }
    
    if (subsFound === 0) {
        membershipsGrid.innerHTML = '<p>You are not subscribed to any creators yet.</p>';
    }
    
    const royaltiesListDiv = document.getElementById('royalties-list');
    const mockRoyalties = [
        { creatorName: "Aria Synth", potentialEarnings: 12.50 },
        { creatorName: "Pixel Pioneers", potentialEarnings: 4.20 }
    ];
    if (mockRoyalties.length > 0) {
        let royaltiesHTML = '';
        mockRoyalties.forEach(royalty => {
            royaltiesHTML += `
                <div class="royalty-item">
                    <span>Earnings from <strong>${royalty.creatorName}</strong></span>
                    <span class="royalty-amount">+${royalty.potentialEarnings.toFixed(2)} π</span>
                </div>
            `;
        });
        royaltiesListDiv.innerHTML = royaltiesHTML;
    } else {
        royaltiesListDiv.innerHTML = "<p>You are not yet earning royalties from any creators.</p>";
    }
}

loadDashboard();