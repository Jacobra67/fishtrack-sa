// Map View - Display catches on interactive map with Leaflet.js

let map;
let markersLayer;
let allCatches = [];

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
    
    // Create marker layer group
    markersLayer = L.layerGroup().addTo(map);
    
    console.log('Map initialized');
}

// Get marker color by species
function getMarkerColor(species) {
    return speciesColors[species] || '#95a5a6'; // Default grey
}

// Create custom marker icon
function createMarkerIcon(species) {
    const color = getMarkerColor(species);
    return L.divIcon({
        className: 'custom-marker',
        html: `<div style="
            width: 24px;
            height: 24px;
            background: ${color};
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
    
    // Photo
    if (catchData.photo) {
        html += `<img src="${catchData.photo}" alt="${catchData.species}">`;
    }
    
    // Species
    html += `<h3>${catchData.species}</h3>`;
    
    // Details
    html += '<div class="catch-info">';
    html += `<div><strong>Weight:</strong> ${catchData.weight}kg</div>`;
    if (catchData.length) {
        html += `<div><strong>Length:</strong> ${catchData.length}cm</div>`;
    }
    html += `<div><strong>Location:</strong> ${catchData.locationName}</div>`;
    if (catchData.bait) {
        html += `<div><strong>Bait:</strong> ${catchData.bait}</div>`;
    }
    html += `<div><strong>When:</strong> ${formatDate(catchData.timestamp)}</div>`;
    html += '</div>';
    
    // C&R badge
    if (catchData.released) {
        html += '<div class="catch-released">✓ Catch & Release</div>';
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
            const marker = L.marker(
                [catchData.location.lat, catchData.location.lng],
                { icon: createMarkerIcon(catchData.species) }
            );
            
            marker.bindPopup(createPopupContent(catchData));
            marker.addTo(markersLayer);
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
}

// Start when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
