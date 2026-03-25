// Catch Detail Page - Load and display a single catch
console.log('🔍 Catch detail page loaded');

let catchMap;
let catchData;

// Get catch ID from URL
const urlParams = new URLSearchParams(window.location.search);
const catchId = urlParams.get('id');

console.log('Catch ID from URL:', catchId);

if (!catchId) {
    showError('No catch ID provided');
} else {
    loadCatch(catchId);
}

async function loadCatch(id) {
    try {
        // Wait for Firebase
        let attempts = 0;
        while (typeof db === 'undefined' && attempts < 50) {
            await new Promise(r => setTimeout(r, 100));
            attempts++;
        }
        
        if (typeof db === 'undefined') {
            throw new Error('Firebase not loaded');
        }
        
        console.log('📡 Loading catch from Firebase...');
        
        const doc = await db.collection('catches').doc(id).get();
        
        if (!doc.exists) {
            showError('Catch not found');
            return;
        }
        
        catchData = doc.data();
        catchData.id = doc.id;
        
        console.log('✅ Catch loaded:', catchData);
        
        // Check privacy
        if (catchData.privacy === 'private') {
            showError('This catch is private');
            return;
        }
        
        // Populate page
        populateCatch(catchData);
        initMap(catchData);
        setupShareButtons(catchData);
        updateMetaTags(catchData);
        
        // Hide loading, show content
        document.getElementById('loading').style.display = 'none';
        document.getElementById('catchContent').style.display = 'block';
        
    } catch (error) {
        console.error('❌ Error loading catch:', error);
        showError('Failed to load catch: ' + error.message);
    }
}

function populateCatch(data) {
    console.log('📝 Populating catch data...');
    
    // Hero section
    document.getElementById('catchSpecies').textContent = data.species || 'Unknown Species';
    document.getElementById('catchLocation').textContent = `📍 ${data.locationName || 'Unknown Location'}, ${data.country || ''}`;
    
    // Photo
    const photoEl = document.getElementById('catchPhoto');
    if (data.photo) {
        photoEl.src = data.photo;
        photoEl.alt = `${data.species} caught by ${data.catcherName}`;
        
        // Click to open full size
        photoEl.addEventListener('click', () => {
            window.open(data.photo, '_blank');
        });
    } else {
        photoEl.src = 'assets/placeholder-fish.jpg';
    }
    
    // Meta items
    document.getElementById('catchWeight').textContent = data.weight ? `${data.weight} kg` : 'Not recorded';
    document.getElementById('catchLength').textContent = data.length ? `${data.length} cm` : 'Not recorded';
    document.getElementById('catchDate').textContent = formatDate(data.catchDate || data.timestamp);
    document.getElementById('catchCatcher').textContent = data.catcherName || 'Anonymous';
    
    // Secret spot notice
    if (data.privacy === 'secret') {
        document.getElementById('secretSpotNotice').style.display = 'block';
    }
    
    // Detailed info
    const detailsHTML = buildDetailsHTML(data);
    document.getElementById('catchDetails').innerHTML = detailsHTML;
    
    // Update page title
    document.title = `${data.species} - ${data.weight}kg - FishTrack Africa`;
}

function buildDetailsHTML(data) {
    let html = '';
    
    // Water type
    if (data.waterType) {
        const icon = data.waterType === 'Saltwater' ? '🌊' : '💧';
        html += detailRow(icon, 'Water Type', data.waterType);
    }
    
    // Location type
    if (data.locationType) {
        html += detailRow('🏖️', 'Location Type', data.locationType);
    }
    
    // Bait
    if (data.bait) {
        html += detailRow('🪝', 'Bait/Lure', data.bait);
    }
    
    // Conditions
    if (data.tide) {
        html += detailRow('🌊', 'Tide', data.tide);
    }
    
    if (data.wind) {
        html += detailRow('💨', 'Wind', data.wind);
    }
    
    if (data.waterTemp) {
        html += detailRow('🌡️', 'Water Temp', data.waterTemp + '°C');
    }
    
    // Released
    if (data.released) {
        html += detailRow('🐟', 'Released', 'Yes - Catch & Release');
    }
    
    // Social link
    if (data.socialLink) {
        const platform = getSocialPlatform(data.socialLink);
        html += detailRow('🎥', 'Watch Video', `<a href="${data.socialLink}" target="_blank" style="color: var(--ocean-blue); font-weight: bold;">View on ${platform} →</a>`);
    }
    
    return html || '<p style="color: #999; text-align: center; padding: 20px;">No additional details recorded</p>';
}

function detailRow(icon, label, value) {
    return `
        <div class="detail-row">
            <span class="icon">${icon}</span>
            <span class="label">${label}:</span>
            <span class="value">${value}</span>
        </div>
    `;
}

function getSocialPlatform(url) {
    if (!url) return 'Social Media';
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes('tiktok.com')) return 'TikTok';
    if (lowerUrl.includes('instagram.com')) return 'Instagram';
    if (lowerUrl.includes('facebook.com') || lowerUrl.includes('fb.com')) return 'Facebook';
    if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) return 'YouTube';
    return 'Social Media';
}

function initMap(data) {
    const mapEl = document.getElementById('catchMap');
    
    if (!data.location || !data.location.lat) {
        mapEl.innerHTML = '<p style="text-align: center; padding: 50px; color: #999;">No GPS location recorded</p>';
        return;
    }
    
    const lat = data.location.lat;
    const lng = data.location.lng;
    
    // Create map
    catchMap = L.map('catchMap').setView([lat, lng], 13);
    
    // Add tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(catchMap);
    
    // Add marker or circle (depending on privacy)
    if (data.privacy === 'secret') {
        // Show approximate area (2km circle)
        L.circle([lat, lng], {
            color: '#f39c12',
            fillColor: '#f39c12',
            fillOpacity: 0.2,
            radius: 2000
        }).addTo(catchMap).bindPopup('🔒 Secret Spot - Approximate area');
    } else {
        // Show exact pin
        L.marker([lat, lng]).addTo(catchMap)
            .bindPopup(`📍 ${data.species} caught here`);
    }
    
    console.log('✅ Map initialized');
}

function setupShareButtons(data) {
    const currentUrl = window.location.href;
    const shareText = `Check out this ${data.species} (${data.weight}kg) caught by ${data.catcherName} on FishTrack Africa!`;
    
    // Facebook share
    document.getElementById('shareFacebook').addEventListener('click', () => {
        const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`;
        window.open(fbUrl, '_blank', 'width=600,height=400');
    });
    
    // WhatsApp share
    document.getElementById('shareWhatsApp').addEventListener('click', () => {
        const waUrl = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + currentUrl)}`;
        window.open(waUrl, '_blank');
    });
    
    // Copy link
    document.getElementById('copyLink').addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(currentUrl);
            const btn = document.getElementById('copyLink');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<span>✅</span> Link Copied!';
            btn.style.background = '#27ae60';
            
            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.style.background = '';
            }, 2000);
        } catch (err) {
            // Fallback for older browsers
            prompt('Copy this link:', currentUrl);
        }
    });
    
    console.log('✅ Share buttons initialized');
}

function updateMetaTags(data) {
    const currentUrl = window.location.href;
    const title = `${data.species} - ${data.weight}kg caught by ${data.catcherName}`;
    const description = `${data.species} (${data.weight}kg) caught at ${data.locationName}, ${data.country}. View on FishTrack Africa!`;
    const imageUrl = data.photo || `${window.location.origin}/assets/logo-final-v2.png`;
    
    // Update Open Graph tags
    document.getElementById('og-url').content = currentUrl;
    document.getElementById('og-title').content = title;
    document.getElementById('og-description').content = description;
    document.getElementById('og-image').content = imageUrl;
    
    // Update Twitter tags
    document.getElementById('twitter-url').content = currentUrl;
    document.getElementById('twitter-title').content = title;
    document.getElementById('twitter-description').content = description;
    document.getElementById('twitter-image').content = imageUrl;
    
    // Update standard meta
    document.querySelector('meta[name="description"]').content = description;
    
    console.log('✅ Meta tags updated for social sharing');
}

function formatDate(timestamp) {
    if (!timestamp) return 'Unknown date';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString('en-ZA', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

function showError(message) {
    console.error('❌', message);
    document.getElementById('loading').style.display = 'none';
    document.getElementById('error').style.display = 'block';
}

console.log('✅ Catch detail script initialized');
