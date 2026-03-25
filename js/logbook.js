// My Logbook - Personal Fishing Diary
// Shows only catches logged by this user (based on localStorage ownership)

let allUserCatches = [];
let filteredCatches = [];
let currentView = 'grid'; // 'grid' or 'list'

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🎣 Initializing My Logbook...');
    
    try {
        // Wait for Firebase
        await waitForFirebase();
        
        // Load user's catches
        await loadUserCatches();
        
        // Setup event listeners
        setupEventListeners();
        
    } catch (error) {
        console.error('Error loading logbook:', error);
        showError('Unable to load your logbook. Please check your connection and try again.');
    }
});

function waitForFirebase() {
    return new Promise((resolve) => {
        const check = setInterval(() => {
            if (typeof db !== 'undefined') {
                clearInterval(check);
                resolve();
            }
        }, 100);
        setTimeout(() => {
            clearInterval(check);
            resolve();
        }, 10000);
    });
}

async function loadUserCatches() {
    try {
        // Get user's device ID (used to track ownership)
        const deviceId = getUserDeviceId();
        
        console.log('📱 Device ID:', deviceId);
        
        // Load all catches (limit to 200 for performance)
        const snapshot = await db.collection('catches')
            .orderBy('timestamp', 'desc')
            .limit(200)
            .get();
        
        // Check current user name from localStorage
        const currentUserName = localStorage.getItem('fishtrack_user_name');
        console.log('👤 Checking for user name:', currentUserName);
        
        // Filter to only catches from this device OR matching name
        allUserCatches = snapshot.docs
            .map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    // Ensure numeric weight for stats
                    weight: parseFloat(data.weight) || 0
                };
            })
            .filter(catchData => {
                // 1. Check device ID
                const isMyDevice = catchData.deviceId === deviceId;
                
                // 2. Check local ownership list
                const isOwned = isOwnedCatch(catchData.id);
                
                // 3. Check matching name (case-insensitive)
                const isMyName = currentUserName && 
                    catchData.catcherName && 
                    catchData.catcherName.toLowerCase().trim() === currentUserName.toLowerCase().trim();
                
                return isMyDevice || isOwned || isMyName;
            });
        
        console.log(`✅ Found ${allUserCatches.length} matches for you`);
        
        // If still 0, check if we're on the same domain
        if (allUserCatches.length === 0 && !currentUserName) {
            console.warn('⚠️ No name found in settings. Ask user to set their name.');
        }
        
        // Initial display
        filteredCatches = [...allUserCatches];
        updateStats();
        renderCatches();
        
    } catch (error) {
        console.error('Error loading catches:', error);
        throw error;
    }
}

function getUserDeviceId() {
    // Get or create device ID
    let deviceId = localStorage.getItem('fishtrack_device_id');
    if (!deviceId) {
        // Try to get existing ID from production domain if possible, or create new
        deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('fishtrack_device_id', deviceId);
        
        // FOR TESTING: If logbook is empty, offer to link old data
        console.log('🆕 New device ID created for staging');
    }
    return deviceId;
}

function isOwnedCatch(catchId) {
    // Check if catch ID is in owned catches list
    const ownedCatches = JSON.parse(localStorage.getItem('fishtrack_owned_catches') || '[]');
    return ownedCatches.includes(catchId);
}

function updateStats() {
    // Total catches
    document.getElementById('totalCatches').textContent = allUserCatches.length;
    
    // Biggest catch
    if (allUserCatches.length > 0) {
        const biggest = allUserCatches.reduce((max, c) => 
            (c.weight || 0) > (max.weight || 0) ? c : max
        , allUserCatches[0]);
        document.getElementById('biggestCatch').textContent = 
            biggest.weight ? `${biggest.weight}kg ${biggest.species}` : '-';
    } else {
        document.getElementById('biggestCatch').textContent = '-';
    }
    
    // Unique species
    const uniqueSpecies = new Set(allUserCatches.map(c => c.species));
    document.getElementById('speciesCount').textContent = uniqueSpecies.size;
    
    // Unique locations
    const uniqueLocations = new Set(allUserCatches.map(c => c.locationName).filter(Boolean));
    document.getElementById('locationsCount').textContent = uniqueLocations.size;
}

function renderCatches() {
    const grid = document.getElementById('catchesGrid');
    const emptyState = document.getElementById('emptyState');
    
    if (filteredCatches.length === 0) {
        grid.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    
    grid.style.display = 'grid';
    emptyState.style.display = 'none';
    
    grid.className = currentView === 'list' ? 'catches-grid list-view' : 'catches-grid';
    
    grid.innerHTML = filteredCatches.map(catchData => {
        const privacyClass = `privacy-${catchData.privacy || 'public'}`;
        const privacyLabel = {
            'public': '🌍 Public',
            'secret': '🔒 Secret Spot',
            'private': '🔐 Private'
        }[catchData.privacy] || '🌍 Public';
        
        const timeAgo = getTimeAgo(catchData.timestamp?.toDate() || new Date());
        
        return `
            <div class="catch-card-logbook" data-catch-id="${catchData.id}">
                ${catchData.photo ? 
                    `<img src="${catchData.photo}" class="catch-card-photo" alt="${catchData.species}">` :
                    `<div class="catch-card-photo placeholder">🐟</div>`
                }
                <div class="catch-card-content">
                    <div class="catch-card-header">
                        <div class="catch-card-species">${catchData.species}</div>
                        <div class="catch-card-weight">${catchData.weight ? `${catchData.weight}kg` : 'Weight not recorded'}</div>
                    </div>
                    <div class="catch-card-privacy ${privacyClass}">${privacyLabel}</div>
                    <div class="catch-card-meta">
                        <div class="catch-card-meta-item">
                            <span class="icon">📍</span>
                            <span>${catchData.locationName || 'Unknown location'}</span>
                        </div>
                        <div class="catch-card-meta-item">
                            <span class="icon">📅</span>
                            <span>${timeAgo}</span>
                        </div>
                        ${catchData.bait ? `
                        <div class="catch-card-meta-item">
                            <span class="icon">🎣</span>
                            <span>${catchData.bait}</span>
                        </div>
                        ` : ''}
                    </div>
                    <div class="catch-card-actions">
                        <button class="catch-action-btn btn-view" onclick="viewCatch('${catchData.id}')">
                            👁️ View
                        </button>
                        <button class="catch-action-btn btn-edit" onclick="editCatch('${catchData.id}')">
                            ✏️ Edit
                        </button>
                        <button class="catch-action-btn btn-delete" onclick="deleteCatch('${catchData.id}')">
                            🗑️ Delete
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function setupEventListeners() {
    // Search
    document.getElementById('searchInput').addEventListener('input', (e) => {
        applyFilters();
    });
    
    // Privacy filter
    document.getElementById('filterPrivacy').addEventListener('change', (e) => {
        applyFilters();
    });
    
    // Sort
    document.getElementById('sortBy').addEventListener('change', (e) => {
        applyFilters();
    });
    
    // View toggle
    document.getElementById('viewToggle').addEventListener('click', () => {
        currentView = currentView === 'grid' ? 'list' : 'grid';
        document.getElementById('viewIcon').textContent = currentView === 'grid' ? '📋' : '🔲';
        document.getElementById('viewText').textContent = currentView === 'grid' ? 'List View' : 'Grid View';
        renderCatches();
    });
}

function applyFilters() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const privacyFilter = document.getElementById('filterPrivacy').value;
    const sortBy = document.getElementById('sortBy').value;
    
    // Filter
    filteredCatches = allUserCatches.filter(catchData => {
        // Search filter
        const matchesSearch = !searchTerm || 
            catchData.species.toLowerCase().includes(searchTerm) ||
            (catchData.locationName || '').toLowerCase().includes(searchTerm) ||
            (catchData.bait || '').toLowerCase().includes(searchTerm);
        
        // Privacy filter
        const matchesPrivacy = privacyFilter === 'all' || 
            (catchData.privacy || 'public') === privacyFilter;
        
        return matchesSearch && matchesPrivacy;
    });
    
    // Sort
    if (sortBy === 'newest') {
        filteredCatches.sort((a, b) => (b.timestamp?.toDate() || 0) - (a.timestamp?.toDate() || 0));
    } else if (sortBy === 'oldest') {
        filteredCatches.sort((a, b) => (a.timestamp?.toDate() || 0) - (b.timestamp?.toDate() || 0));
    } else if (sortBy === 'biggest') {
        filteredCatches.sort((a, b) => (b.weight || 0) - (a.weight || 0));
    } else if (sortBy === 'species') {
        filteredCatches.sort((a, b) => a.species.localeCompare(b.species));
    }
    
    renderCatches();
}

function viewCatch(catchId) {
    const catchData = allUserCatches.find(c => c.id === catchId);
    if (!catchData) return;
    
    if (window.catchModal) {
        window.catchModal.open({
            photoURL: catchData.photo,
            species: catchData.species,
            weight: catchData.weight,
            location: catchData.locationName || 'Unknown',
            date: catchData.timestamp?.toDate() || new Date(),
            catcher: catchData.catcherName || 'You',
            privacy: catchData.privacy,
            gps: catchData.location, // GPS coordinates for navigation
            waterTemp: catchData.waterTemp,
            tide: catchData.tide,
            windSpeed: catchData.windSpeed,
            windDirection: catchData.windDirection,
            bait: catchData.bait,
            time: catchData.time
        });
    }
}

function editCatch(catchId) {
    const catchData = allUserCatches.find(c => c.id === catchId);
    if (!catchData) {
        alert('Catch not found');
        return;
    }
    
    // Redirect to log-catch page with edit parameter
    window.location.href = `log-catch.html?edit=${catchId}`;
}

function deleteCatch(catchId) {
    const catchData = allUserCatches.find(c => c.id === catchId);
    if (!catchData) return;
    
    const confirmed = confirm(
        `Delete ${catchData.species} (${catchData.weight}kg)?\n\n` +
        `This will permanently remove this catch from your logbook and the map. This action cannot be undone.`
    );
    
    if (confirmed) {
        performDelete(catchId);
    }
}

async function performDelete(catchId) {
    try {
        // Delete from Firebase
        await db.collection('catches').doc(catchId).delete();
        
        // Remove from local data
        allUserCatches = allUserCatches.filter(c => c.id !== catchId);
        filteredCatches = filteredCatches.filter(c => c.id !== catchId);
        
        // Remove from owned catches list
        const ownedCatches = JSON.parse(localStorage.getItem('fishtrack_owned_catches') || '[]');
        const updatedOwned = ownedCatches.filter(id => id !== catchId);
        localStorage.setItem('fishtrack_owned_catches', JSON.stringify(updatedOwned));
        
        // Update display
        updateStats();
        renderCatches();
        
        console.log('✅ Catch deleted:', catchId);
        
    } catch (error) {
        console.error('Error deleting catch:', error);
        alert('Failed to delete catch. Please try again.');
    }
}

function getTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return date.toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' });
}

function showError(message) {
    const grid = document.getElementById('catchesGrid');
    grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
            <div style="font-size: 64px; margin-bottom: 20px;">⚠️</div>
            <h3 style="color: #f44336; margin-bottom: 15px;">Error Loading Logbook</h3>
            <p style="color: #666; margin-bottom: 30px;">${message}</p>
            <button onclick="location.reload()" class="cta-button">Try Again</button>
        </div>
    `;
}
