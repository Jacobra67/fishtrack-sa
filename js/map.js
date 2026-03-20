// Map View - Display catches on interactive map with Leaflet.js

let map;
let markersLayer;
let allCatches = [];
let currentFilter = 'all'; // 'all', 'saltwater', 'freshwater'

// Species color mapping
const speciesColors = {
    'Galjoen': '#2ecc71',
    'Steenbras': '#3498db',
    'Kabeljou': '#e74c3c',
    'Mosselkraker': '#9b59b6',
    'Rock Cod': '#1abc9c',
    'Blacktail': '#34495e',
    'Bronze Whaler': '#95a5a6',
    'Spotted Gully': '#7f8c8d',
    'Copper Shark': '#95a5a6',
    'Smooth-Hound': '#bdc3c7',
    'Elf': '#f39c12',
    'Garrick': '#e67e22',
    'Springer': '#d35400',
    'Snoek': '#c0392b',
    'Eagle Ray': '#8e44ad',
    'Blue Stingray': '#2980b9'
};

// Initialize map
function initMap() {
    // Create map centered on South Africa coastline
    map = L.map('map').setView([-33.5, 20.0], 7);
    
    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18
    }).addTo(map);
    
    // Create marker cluster group
    markersLayer = L.markerClusterGroup({
        maxClusterRadius: 60, // Cluster markers within 60px
        spiderfyOnMaxZoom: true, // Spread out markers when fully zoomed
        showCoverageOnHover: false, // Don't show cluster bounds on hover
        zoomToBoundsOnClick: true, // Zoom in when clicking cluster
        iconCreateFunction: function(cluster) {
            const count = cluster.getChildCount();
            let size = 'small';
            let clusterClass = 'marker-cluster-small';
            
            if (count > 20) {
                size = 'large';
                clusterClass = 'marker-cluster-large';
            } else if (count > 10) {
                size = 'medium';
                clusterClass = 'marker-cluster-medium';
            }
            
            return L.divIcon({
                html: `<div><span>${count}</span></div>`,
                className: 'marker-cluster ' + clusterClass,
                iconSize: L.point(40, 40)
            });
        }
    }).addTo(map);
    
    console.log('Map initialized with clustering');
}

// Get marker color by species
function getMarkerColor(species) {
    return speciesColors[species] || '#95a5a6'; // Default grey
}

// Create custom marker icon
function createMarkerIcon(species, waterType) {
    // Use different base colors for saltwater vs freshwater
    let baseColor;
    if (waterType === 'Freshwater') {
        baseColor = '#27ae60'; // Green for freshwater
    } else {
        baseColor = getMarkerColor(species); // Species-specific color for saltwater
    }
    
    return L.divIcon({
        className: 'custom-marker',
        html: `<div style="
            width: 24px;
            height: 24px;
            background: ${baseColor};
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        "></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -12]
    });
}

// Format date
function formatDate(timestamp) {
    if (!timestamp) return 'Unknown';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
}

// Create popup content for catch
function createPopupContent(catchData) {
    let html = '<div class="catch-popup">';
    
    // Photo (clickable)
    if (catchData.photo) {
        html += `<img src="${catchData.photo}" alt="${catchData.species}" class="catch-photo-clickable" data-catch-id="${catchData.id}" style="cursor: pointer;">`;
    }
    
    // Species
    html += `<h3>${catchData.species}</h3>`;
    
    // Secret Spot Badge
    if (catchData.privacy === 'secret') {
        html += `<div style="background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%); color: white; padding: 6px 12px; border-radius: 8px; margin-bottom: 10px; text-align: center; font-size: 12px; font-weight: bold;">🔒 SECRET SPOT - Exact location hidden (~2km area)</div>`;
    }
    
    // Catcher name (if available)
    if (catchData.catcherName) {
        html += `<div class="catcher-name">🎣 Caught by <strong>${catchData.catcherName}</strong></div>`;
    }
    
    // Details
    html += '<div class="catch-info">';
    if (catchData.waterType) {
        const waterIcon = catchData.waterType === 'Freshwater' ? '💧' : '🌊';
        html += `<div><strong>Water:</strong> ${waterIcon} ${catchData.waterType}</div>`;
    }
    if (catchData.country) {
        html += `<div><strong>Country:</strong> ${catchData.country}</div>`;
    }
    html += `<div><strong>Weight:</strong> ${catchData.weight}kg</div>`;
    if (catchData.length) {
        html += `<div><strong>Length:</strong> ${catchData.length}cm</div>`;
    }
    if (catchData.locationType) {
        html += `<div><strong>Location Type:</strong> ${catchData.locationType}</div>`;
    }
    html += `<div><strong>Location:</strong> ${catchData.locationName}</div>`;
    if (catchData.bait) {
        html += `<div><strong>Bait/Lure:</strong> ${catchData.bait}</div>`;
    }
    // Conditions data (if available)
    if (catchData.waterTemp || catchData.tide || catchData.wind) {
        html += '<div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #eee;">';
        if (catchData.waterTemp) {
            html += `<div><strong>Water Temp:</strong> ${catchData.waterTemp}°C</div>`;
        }
        if (catchData.tide) {
            html += `<div><strong>Tide:</strong> ${catchData.tide}</div>`;
        }
        if (catchData.wind) {
            html += `<div><strong>Wind:</strong> ${catchData.wind}</div>`;
        }
        html += '</div>';
    }
    html += `<div><strong>When:</strong> ${formatDate(catchData.timestamp)}</div>`;
    html += '</div>';
    
    // C&R badge
    if (catchData.released) {
        html += '<div class="catch-released">✓ Catch & Release</div>';
    }
    
    // Edit/Delete buttons (only shown if user is owner)
    // Check if this catch belongs to current user (simple localStorage check for now)
    const currentUser = localStorage.getItem('fishtrack_user_name');
    if (currentUser && catchData.catcherName === currentUser) {
        html += `
            <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #eee; display: flex; gap: 8px;">
                <button class="catch-action-btn edit-btn" data-catch-id="${catchData.id}" style="flex: 1; background: #3498db; color: white; border: none; padding: 8px 12px; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer;">
                    ✏️ Edit
                </button>
                <button class="catch-action-btn delete-btn" data-catch-id="${catchData.id}" style="flex: 1; background: #e74c3c; color: white; border: none; padding: 8px 12px; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer;">
                    🗑️ Delete
                </button>
            </div>
        `;
    }
    
    html += '</div>';
    return html;
}

// Add catch markers to map
function displayCatches(catches) {
    // Clear existing markers
    markersLayer.clearLayers();
    
    // Add markers for each catch
    catches.forEach(catchData => {
        if (catchData.location && catchData.location.lat && catchData.location.lng) {
            // Filter by water type if needed
            if (currentFilter !== 'all') {
                if (currentFilter === 'saltwater' && catchData.waterType !== 'Saltwater') return;
                if (currentFilter === 'freshwater' && catchData.waterType !== 'Freshwater') return;
            }
            
            // SECRET SPOT MODE: Show circle instead of exact pin
            if (catchData.privacy === 'secret') {
                const circle = L.circle(
                    [catchData.location.lat, catchData.location.lng],
                    {
                        radius: 2000, // 2km radius
                        color: '#f39c12',
                        fillColor: '#f39c12',
                        fillOpacity: 0.15,
                        weight: 3,
                        dashArray: '10, 5',
                        className: 'secret-spot-circle'
                    }
                );
                
                circle.bindPopup(createPopupContent(catchData));
                circle.addTo(markersLayer);
            } else {
                // Normal marker for public/private catches
                const marker = L.marker(
                    [catchData.location.lat, catchData.location.lng],
                    { icon: createMarkerIcon(catchData.species, catchData.waterType) }
                );
                
                marker.bindPopup(createPopupContent(catchData));
                marker.addTo(markersLayer);
            }
        }
    });
    
    // Update catch count
    document.getElementById('catchCount').textContent = catches.length;
    
    console.log(`Displayed ${catches.length} catches on map`);
}

// Filter catches based on current filter selections
function filterCatches() {
    const speciesFilter = document.getElementById('speciesFilter').value;
    const timeFilter = document.getElementById('timeFilter').value;
    
    let filtered = allCatches.filter(c => c.privacy === 'public'); // Only show public catches
    
    // Filter by species
    if (speciesFilter !== 'all') {
        filtered = filtered.filter(c => c.species === speciesFilter);
    }
    
    // Filter by time
    if (timeFilter !== 'all') {
        const now = new Date();
        const cutoff = new Date();
        
        if (timeFilter === 'today') {
            cutoff.setHours(0, 0, 0, 0);
        } else if (timeFilter === 'week') {
            cutoff.setDate(now.getDate() - 7);
        } else if (timeFilter === 'month') {
            cutoff.setMonth(now.getMonth() - 1);
        }
        
        filtered = filtered.filter(c => {
            const catchDate = c.timestamp.toDate ? c.timestamp.toDate() : new Date(c.timestamp);
            return catchDate >= cutoff;
        });
    }
    
    displayCatches(filtered);
}

// Load catches from Firebase
async function loadCatches() {
    try {
        const snapshot = await db.collection('catches')
            .limit(500) // Limit to recent 500 catches
            .get();
        
        allCatches = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        console.log(`Loaded ${allCatches.length} catches from Firebase`);
        
        // Apply filters and display
        filterCatches();
        
    } catch (error) {
        console.error('Error loading catches:', error);
        alert('Error loading catches. Please refresh the page.');
    }
}

// Initialize everything
async function init() {
    try {
        // Initialize map
        initMap();
        
        // Load catches
        await loadCatches();
    } catch (error) {
        console.error('Initialization error:', error);
    } finally {
        // Always hide loading overlay
        document.getElementById('loadingOverlay').classList.add('hidden');
    }
    
    // Set up filter listeners
    document.getElementById('waterTypeFilter').addEventListener('change', function() {
        currentFilter = this.value;
        filterCatches();
    });
    document.getElementById('speciesFilter').addEventListener('change', filterCatches);
    document.getElementById('timeFilter').addEventListener('change', filterCatches);
    document.getElementById('refreshBtn').addEventListener('click', loadCatches);
    
    // Real-time updates (listen for new catches)
    db.collection('catches').onSnapshot((snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
                const newCatch = { id: change.doc.id, ...change.doc.data() };
                
                // Check if not already in array (initial load)
                if (!allCatches.find(c => c.id === newCatch.id)) {
                    allCatches.unshift(newCatch); // Add to beginning
                    filterCatches(); // Refresh display
                    console.log('New catch added:', newCatch.species);
                }
            }
        });
    });
    
    // Handle photo clicks (open lightbox)
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('catch-photo-clickable')) {
            const catchId = e.target.dataset.catchId;
            const catchData = allCatches.find(c => c.id === catchId);
            if (catchData && catchData.photo && typeof photoLightbox !== 'undefined') {
                photoLightbox.open(catchData.photo, catchData);
            }
        }
    });
    
    // Handle edit button clicks
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('edit-btn') || e.target.closest('.edit-btn')) {
            const btn = e.target.classList.contains('edit-btn') ? e.target : e.target.closest('.edit-btn');
            const catchId = btn.dataset.catchId;
            editCatch(catchId);
        }
    });
    
    // Handle delete button clicks
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-btn') || e.target.closest('.delete-btn')) {
            const btn = e.target.classList.contains('delete-btn') ? e.target : e.target.closest('.delete-btn');
            const catchId = btn.dataset.catchId;
            deleteCatch(catchId);
        }
    });
}

// Edit catch function
function editCatch(catchId) {
    const catchData = allCatches.find(c => c.id === catchId);
    if (!catchData) {
        alert('Catch not found');
        return;
    }
    
    // For now, redirect to log-catch page with edit parameter
    // Later we can create a dedicated edit modal
    window.location.href = `log-catch.html?edit=${catchId}`;
}

// Delete catch function
async function deleteCatch(catchId) {
    const catchData = allCatches.find(c => c.id === catchId);
    if (!catchData) {
        alert('Catch not found');
        return;
    }
    
    // Confirm deletion
    const confirmed = confirm(
        `Delete this catch?\n\n` +
        `${catchData.species} (${catchData.weight}kg)\n` +
        `Caught by ${catchData.catcherName}\n\n` +
        `This action cannot be undone.`
    );
    
    if (!confirmed) return;
    
    try {
        // Delete from Firebase
        await db.collection('catches').doc(catchId).delete();
        
        // Remove from local array
        allCatches = allCatches.filter(c => c.id !== catchId);
        
        // Refresh map
        filterCatches();
        
        alert('Catch deleted successfully');
        console.log('Catch deleted:', catchId);
        
    } catch (error) {
        console.error('Delete error:', error);
        alert('Failed to delete catch. Please try again.');
    }
}

// Start when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
