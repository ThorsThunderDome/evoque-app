// my_supporters.js
import { db } from './app.js';
import { collection, doc, getDoc, getDocs, query, where, onSnapshot, orderBy } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

const tableBody = document.getElementById('supporters-table-body');

async function initializePage() {
    // --- FIX: Get piUser AFTER the app is ready ---
    const piUser = JSON.parse(sessionStorage.getItem('piUser'));
    if (!piUser || !piUser.uid) {
        console.error("My Supporters Error: User not found in session.");
        tableBody.innerHTML = '<tr><td colspan="4">Could not load supporters. Please log in.</td></tr>';
        return;
    }

    tableBody.innerHTML = '<tr><td colspan="4"><div class="loader"></div></td></tr>';
    const creatorDocRef = doc(db, 'creators', piUser.uid);
    
    try {
        const docSnap = await getDoc(creatorDocRef);
        if (docSnap.exists()) {
            const creatorData = docSnap.data();
            document.getElementById('creator-name-sidebar').textContent = creatorData.name;
            document.getElementById('creator-avatar-sidebar').src = creatorData.profileImage || 'images/default-avatar.png';
        }

        const supportersQuery = query(collection(db, 'subscriptions'), where('creatorUid', '==', piUser.uid), orderBy('createdAt', 'desc'));

        onSnapshot(supportersQuery, async (snapshot) => {
            if (snapshot.empty) {
                tableBody.innerHTML = '<tr><td colspan="4">You have no supporters yet.</td></tr>';
                return;
            }

            // --- FIX: Used getDocs on a collection, which is correct ---
            const tiersSnapshot = await getDocs(collection(creatorDocRef, 'tiers'));
            const tierInfo = {};
            tiersSnapshot.forEach(tierDoc => {
                tierInfo[tierDoc.id] = tierDoc.data();
            });
            
            const supporterIds = snapshot.docs.map(doc => doc.data().supporterUid);
            const userDocsPromises = supporterIds.map(id => getDoc(doc(db, 'users', id)));
            const userDocs = await Promise.all(userDocsPromises);
            const usernames = {};
            userDocs.forEach(userDoc => {
                if(userDoc.exists()) {
                    usernames[userDoc.id] = userDoc.data().username;
                }
            });

            tableBody.innerHTML = '';
            snapshot.docs.forEach((doc, index) => {
                const subscription = doc.data();
                const row = document.createElement('tr');
                const currentTierInfo = tierInfo[subscription.tierId] || { name: 'Unknown Tier', price: 0 };
                const price = typeof currentTierInfo.price === 'number' ? currentTierInfo.price.toFixed(2) : 'N/A';
                
                row.innerHTML = `
                    <td>#${index + 1}</td>
                    <td>${usernames[subscription.supporterUid] || 'Anonymous'}</td>
                    <td>${currentTierInfo.name}</td>
                    <td>${price}</td>
                `;
                tableBody.appendChild(row);
            });

        }, (error) => {
            console.error("Error listening to supporters list:", error);
            tableBody.innerHTML = '<tr><td colspan="4">Error loading supporters. Please try again.</td></tr>';
        });
        
    } catch (error) {
        console.error("Error initializing supporters page:", error);
        tableBody.innerHTML = '<tr><td colspan="4">An unexpected error occurred. Please check the console.</td></tr>';
    }
}

window.addEventListener('app-ready', initializePage);

