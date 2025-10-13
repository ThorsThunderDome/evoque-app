// my_supporters.js
import { db, piUser } from './app.js';
import { collection, doc, getDoc, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

const tableBody = document.getElementById('supporters-table-body');
tableBody.innerHTML = '<tr><td colspan="4"><div class="loader"></div></td></tr>';

async function loadSupporters() {
    try {
        const creatorDocRef = doc(db, 'creators', piUser.uid);
        const docSnap = await getDoc(creatorDocRef);
        if (docSnap.exists()) {
            const creatorData = docSnap.data();
            document.getElementById('creator-name-sidebar').textContent = creatorData.name;
            document.getElementById('creator-avatar-sidebar').src = creatorData.profileImage;
        }

        const supportersQuery = query(collection(creatorDocRef, 'supporters'), orderBy('subscribedAt', 'desc'));
        const snapshot = await getDocs(supportersQuery);

        tableBody.innerHTML = '';
        if (snapshot.empty) {
            tableBody.innerHTML = '<tr><td colspan="4">You have no supporters yet.</td></tr>';
        } else {
            // We need to fetch all tier names first to display them in the table
            const tiersSnapshot = await getDocs(collection(creatorDocRef, 'tiers'));
            const tierNames = {};
            tiersSnapshot.forEach(tierDoc => {
                tierNames[tierDoc.id] = tierDoc.data().name;
            });
            const tierPrices = {};
            tiersSnapshot.forEach(tierDoc => {
                tierPrices[tierDoc.id] = tierDoc.data().price;
            });

            snapshot.forEach(doc => {
                const supporter = doc.data();
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${supporter.supporterNumber ? `#${supporter.supporterNumber}` : '-'}</td>
                    <td>${supporter.supporterUsername}</td>
                    <td>${tierNames[supporter.tierId] || 'Unknown Tier'}</td>
                    <td>${(tierPrices[supporter.tierId] || 0).toFixed(2)}</td>
                `;
                tableBody.appendChild(row);
            });
        }
    } catch (error) {
        console.error("Error fetching supporters list:", error);
        tableBody.innerHTML = '<tr><td colspan="4">Error loading supporters. Please try again.</td></tr>';
    }
}

loadSupporters();