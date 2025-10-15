// my_supporters.js
import { db, piUser } from './app.js';
import { collection, doc, getDoc, getDocs, query, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

const tableBody = document.getElementById('supporters-table-body');

async function initializePage() {
    tableBody.innerHTML = '<tr><td colspan="4"><div class="loader"></div></td></tr>';
    const creatorDocRef = doc(db, 'creators', piUser.uid);
    
    try {
        // Load sidebar info once
        const docSnap = await getDoc(creatorDocRef);
        if (docSnap.exists()) {
            const creatorData = docSnap.data();
            document.getElementById('creator-name-sidebar').textContent = creatorData.name;
            document.getElementById('creator-avatar-sidebar').src = creatorData.profileImage;
        }

        // --- NEW: Real-time listener for supporters ---
        const supportersQuery = query(collection(db, 'subscriptions'), where('creatorUid', '==', piUser.uid), orderBy('createdAt', 'desc'));

        onSnapshot(supportersQuery, async (snapshot) => {
            if (snapshot.empty) {
                tableBody.innerHTML = '<tr><td colspan="4">You have no supporters yet.</td></tr>';
                return;
            }

            // Fetch all tier names and prices to display in the table
            const tiersSnapshot = await getDocs(collection(creatorDocRef, 'tiers'));
            const tierInfo = {};
            tiersSnapshot.forEach(tierDoc => {
                tierInfo[tierDoc.id] = tierDoc.data();
            });
            
            // To get supporter usernames, we need to fetch user profiles
            const supporterIds = snapshot.docs.map(doc => doc.data().supporterUid);
            const userDocs = await Promise.all(supporterIds.map(id => getDoc(doc(db, 'users', id))));
            const usernames = {};
            userDocs.forEach(userDoc => {
                if(userDoc.exists()) {
                    usernames[userDoc.id] = userDoc.data().username;
                }
            });

            tableBody.innerHTML = '';
            let supporterCounter = 0;
            snapshot.forEach(doc => {
                const subscription = doc.data();
                supporterCounter++;
                const row = document.createElement('tr');
                const currentTierInfo = tierInfo[subscription.tierId] || { name: 'Unknown Tier', price: 0 };

                row.innerHTML = `
                    <td>#${supporterCounter}</td>
                    <td>${usernames[subscription.supporterUid] || 'Anonymous'}</td>
                    <td>${currentTierInfo.name}</td>
                    <td>${(currentTierInfo.price).toFixed(2)}</td>
                `;
                tableBody.appendChild(row);
            });

        }, (error) => {
            console.error("Error listening to supporters list:", error);
            tableBody.innerHTML = '<tr><td colspan="4">Error loading supporters. Please try again.</td></tr>';
        });
        
    } catch (error) {
        console.error("Error initializing supporters page:", error);
        tableBody.innerHTML = '<tr><td colspan="4">An unexpected error occurred.</td></tr>';
    }
}

initializePage();
