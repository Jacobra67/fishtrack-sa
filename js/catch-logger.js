// Catch Logger - Form handling and Firebase submission

let photoFile = null;
let photoDataURL = null;
let currentLocation = null;

// Get user's location on page load
if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
        (position) => {
            currentLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            console.log('Location captured:', currentLocation);
        },
        (error) => {
            console.warn('Location access denied:', error);
            // Continue without location - user can still submit
        }
    );
}

// Photo upload handling
const photoInput = document.getElementById('photoInput');
const photoLabel = document.getElementById('photoLabel');
const photoPreview = document.getElementById('photoPreview');
const previewImage = document.getElementById('previewImage');
const changePhotoBtn = document.getElementById('changePhoto');

photoInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        photoFile = file;
        
        // Create preview
        const reader = new FileReader();
        reader.onload = (event) => {
            photoDataURL = event.target.result;
            previewImage.src = photoDataURL;
            photoLabel.style.display = 'none';
            photoPreview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
});

changePhotoBtn.addEventListener('click', () => {
    photoInput.click();
});

// ===== MAP PIN DROP FUNCTIONALITY =====

let pinMap = null;
let pinMarker = null;
let pinnedLocation = null;

// Initialize pin-drop map
function initPinMap() {
    // Create map centered on South Africa
    pinMap = L.map('pinMap').setView([-33.5, 20.0], 6);
    
    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 18
    }).addTo(pinMap);
    
    // Handle map click to drop pin
    pinMap.on('click', (e) => {
        dropPin(e.latlng.lat, e.latlng.lng);
    });
    
    console.log('Pin map initialized');
}

// Drop pin at coordinates
function dropPin(lat, lng) {
    // Remove existing marker if any
    if (pinMarker) {
        pinMap.removeLayer(pinMarker);
    }
    
    // Create new marker
    pinMarker = L.marker([lat, lng], {
        draggable: true,
        icon: L.icon({
            iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41]
        })
    }).addTo(pinMap);
    
    // Update pinned location
    pinnedLocation = { lat, lng };
    currentLocation = { lat, lng }; // Update current location to use pin
    
    // Show coordinates
    document.getElementById('coordinatesDisplay').style.display = 'block';
    document.getElementById('latLng').textContent = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    
    // Show clear button
    document.getElementById('clearPin').style.display = 'inline-block';
    
    // Handle marker drag
    pinMarker.on('dragend', (e) => {
        const pos = e.target.getLatLng();
        dropPin(pos.lat, pos.lng);
    });
    
    console.log('Pin dropped:', lat, lng);
}

// Use current location button
document.getElementById('useCurrentLocation').addEventListener('click', () => {
    if (navigator.geolocation) {
        // Show loading state
        const btn = document.getElementById('useCurrentLocation');
        const originalText = btn.innerHTML;
        btn.innerHTML = '⏳ Getting location...';
        btn.disabled = true;
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                
                // Drop pin at current location
                dropPin(lat, lng);
                
                // Center map on location
                pinMap.setView([lat, lng], 12);
                
                // Reset button
                btn.innerHTML = originalText;
                btn.disabled = false;
                
                console.log('Used current location:', lat, lng);
            },
            (error) => {
                console.error('Geolocation error:', error);
                alert('Could not get your location. Please drop a pin manually on the map.');
                
                // Reset button
                btn.innerHTML = originalText;
                btn.disabled = false;
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    } else {
        alert('Geolocation not supported by your browser. Please drop a pin manually.');
    }
});

// Clear pin button
document.getElementById('clearPin').addEventListener('click', () => {
    if (pinMarker) {
        pinMap.removeLayer(pinMarker);
        pinMarker = null;
    }
    
    pinnedLocation = null;
    currentLocation = null;
    
    document.getElementById('coordinatesDisplay').style.display = 'none';
    document.getElementById('clearPin').style.display = 'none';
    
    console.log('Pin cleared');
});

// Initialize map when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPinMap);
} else {
    initPinMap();
}

// Form submission
const catchForm = document.getElementById('catchForm');
const submitBtn = document.getElementById('submitBtn');
const submitText = document.getElementById('submitText');
const submitSpinner = document.getElementById('submitSpinner');
const successMessage = document.getElementById('successMessage');

catchForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Disable submit button
    submitBtn.disabled = true;
    submitText.style.display = 'none';
    submitSpinner.style.display = 'inline-block';
    
    try {
        // Get form data
        const formData = {
            species: document.getElementById('species').value,
            weight: parseFloat(document.getElementById('weight').value),
            length: document.getElementById('length').value ? parseInt(document.getElementById('length').value) : null,
            locationName: document.getElementById('locationName').value,
            bait: document.getElementById('bait').value || null,
            released: document.getElementById('released').checked,
            privacy: document.querySelector('input[name="privacy"]:checked').value,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            location: currentLocation || { lat: -34.0, lng: 18.5 }, // Default to Cape Town if no GPS
            verified: false
        };
        
        // Upload photo to Firebase Storage if provided
        if (photoDataURL) {
            formData.photo = photoDataURL; // For MVP, store as base64
            // TODO: Later, upload to Firebase Storage for better performance
        }
        
        // Save to Firestore
        const docRef = await db.collection('catches').add(formData);
        
        console.log('Catch logged with ID:', docRef.id);
        
        // Show success message
        catchForm.style.display = 'none';
        successMessage.style.display = 'block';
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
    } catch (error) {
        console.error('Error logging catch:', error);
        alert('Error saving catch. Please try again.');
        
        // Re-enable submit button
        submitBtn.disabled = false;
        submitText.style.display = 'inline-block';
        submitSpinner.style.display = 'none';
    }
});

// Log another catch button
document.getElementById('logAnother')?.addEventListener('click', () => {
    // Reset form
    catchForm.reset();
    photoFile = null;
    photoDataURL = null;
    photoLabel.style.display = 'block';
    photoPreview.style.display = 'none';
    
    // Show form, hide success message
    successMessage.style.display = 'none';
    catchForm.style.display = 'block';
    
    // Re-enable submit
    submitBtn.disabled = false;
    submitText.style.display = 'inline-block';
    submitSpinner.style.display = 'none';
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
});
