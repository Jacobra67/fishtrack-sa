// Catch Logger - Form handling and Firebase submission

let photoFile = null;
let photoDataURL = null;
let currentLocation = null;

// Water Type Toggle Handler
document.addEventListener('DOMContentLoaded', () => {
    const waterTypeSelect = document.getElementById('waterType');
    const speciesSelect = document.getElementById('species');
    const locationTypeSelect = document.getElementById('locationType');
    const baitSelect = document.getElementById('bait');
    
    // Set today's date as default for catch date
    const catchDateInput = document.getElementById('catchDate');
    if (catchDateInput) {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        catchDateInput.value = `${year}-${month}-${day}`;
    }
    
    // Show hint for auto-fill conditions (button is hidden until pin is dropped)
    const autofillHint = document.getElementById('autofillHint');
    if (autofillHint) {
        autofillHint.style.display = 'block';
    }
    
    waterTypeSelect.addEventListener('change', function() {
        const waterType = this.value;
        
        if (waterType === 'Saltwater') {
            // Show saltwater options, hide freshwater
            showElementsByClass('saltwater-group', true);
            showElementsByClass('freshwater-group', false);
            showElementsByClass('saltwater-location', true);
            showElementsByClass('freshwater-location', false);
            showElementsByClass('saltwater-bait', true);
            showElementsByClass('freshwater-bait', false);
            
            // Update placeholder
            document.getElementById('locationName').placeholder = 'e.g., Struisbaai Beach, Mile 72';
        } else if (waterType === 'Freshwater') {
            // Show freshwater options, hide saltwater
            showElementsByClass('saltwater-group', false);
            showElementsByClass('freshwater-group', true);
            showElementsByClass('saltwater-location', false);
            showElementsByClass('freshwater-location', true);
            showElementsByClass('saltwater-bait', false);
            showElementsByClass('freshwater-bait', true);
            
            // Update placeholder
            document.getElementById('locationName').placeholder = 'e.g., Hartbeespoort Dam, Vaal River';
        }
        
        // Reset dependent fields
        speciesSelect.value = '';
        locationTypeSelect.value = '';
        baitSelect.value = '';
    });
    
    function showElementsByClass(className, show) {
        const elements = document.querySelectorAll('.' + className);
        elements.forEach(el => {
            el.style.display = show ? '' : 'none';
        });
    }
    
    // Weight Calculator Logic
    const lengthInput = document.getElementById('length');
    const weightInput = document.getElementById('weight');
    const calculateWeightBtn = document.getElementById('calculateWeightBtn');
    const weightEstimateNotice = document.getElementById('weightEstimateNotice');
    
    // Show/hide calculate button based on species and length
    function updateCalculateButton() {
        const species = speciesSelect.value;
        const length = lengthInput.value;
        
        if (species && length && length > 0 && hasWeightFormula(species)) {
            calculateWeightBtn.style.display = 'block';
        } else {
            calculateWeightBtn.style.display = 'none';
        }
    }
    
    // Listen for changes
    speciesSelect.addEventListener('change', updateCalculateButton);
    lengthInput.addEventListener('input', updateCalculateButton);
    
    // Calculate weight when button clicked
    calculateWeightBtn.addEventListener('click', () => {
        const species = speciesSelect.value;
        const length = parseFloat(lengthInput.value);
        
        if (!species || !length) {
            alert('Please select a species and enter length first');
            return;
        }
        
        const estimatedWeight = calculateFishWeight(species, length);
        
        if (estimatedWeight === null) {
            alert('Weight calculation not available for this species');
            return;
        }
        
        // Fill weight field
        weightInput.value = estimatedWeight;
        
        // Show estimate notice
        weightEstimateNotice.style.display = 'block';
        
        // Hide notice after 5 seconds
        setTimeout(() => {
            weightEstimateNotice.style.display = 'none';
        }, 5000);
        
        console.log(`Calculated weight for ${species} (${length}cm): ${estimatedWeight}kg`);
    });
});

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
const editPhotoBtn = document.getElementById('editPhoto');

photoInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        photoFile = file;
        
        // Compress and resize photo
        compressPhoto(file, (compressedDataURL) => {
            photoDataURL = compressedDataURL;
            previewImage.src = photoDataURL;
            photoLabel.style.display = 'none';
            photoPreview.style.display = 'block';
            
            // NEW: Automatically open editor if it's a new photo
            if (window.photoEditor) {
                setTimeout(() => {
                    window.photoEditor.open(photoDataURL);
                }, 500);
            }
            
            // Show file size info
            const originalSizeKB = Math.round(file.size / 1024);
            const compressedSizeKB = Math.round(photoDataURL.length / 1024);
            console.log(`Photo compressed: ${originalSizeKB}KB → ${compressedSizeKB}KB (${Math.round((1 - compressedSizeKB/originalSizeKB) * 100)}% reduction)`);
        });
    }
});

// Manual edit button
editPhotoBtn?.addEventListener('click', () => {
    if (photoDataURL && window.photoEditor) {
        window.photoEditor.open(photoDataURL);
    }
});

// Compress photo to reduce file size (max 1200px width, 85% quality)
function compressPhoto(file, callback) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            // Calculate new dimensions (max 1200px width, maintain aspect ratio)
            const MAX_WIDTH = 1200;
            const MAX_HEIGHT = 1200;
            let width = img.width;
            let height = img.height;
            
            if (width > height) {
                if (width > MAX_WIDTH) {
                    height = Math.round(height * MAX_WIDTH / width);
                    width = MAX_WIDTH;
                }
            } else {
                if (height > MAX_HEIGHT) {
                    width = Math.round(width * MAX_HEIGHT / height);
                    height = MAX_HEIGHT;
                }
            }
            
            // Create canvas and draw resized image
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            
            // Use better image smoothing
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            
            ctx.drawImage(img, 0, 0, width, height);
            
            // Convert to compressed JPEG (85% quality)
            const compressedDataURL = canvas.toDataURL('image/jpeg', 0.85);
            
            callback(compressedDataURL);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

changePhotoBtn.addEventListener('click', () => {
    photoInput.value = ''; // Reset input so same photo can be re-selected
    photoInput.click();
});

// ===== PHOTO EDITOR FUNCTIONALITY =====

let editorCanvas = null;
let editorCtx = null;
let currentImage = null;
let rotation = 0;

const photoEditorModal = document.getElementById('photoEditorModal');
const editPhotoBtn = document.getElementById('editPhoto');
const closeEditorBtn = document.getElementById('closeEditor');
const cancelEditBtn = document.getElementById('cancelEdit');
const doneEditBtn = document.getElementById('doneEdit');
const rotateLeftBtn = document.getElementById('rotateLeft');
const rotateRightBtn = document.getElementById('rotateRight');

// Initialize editor canvas
function initEditor() {
    editorCanvas = document.getElementById('editorCanvas');
    editorCtx = editorCanvas.getContext('2d');
}

// Open photo editor
editPhotoBtn?.addEventListener('click', () => {
    if (!photoDataURL) return;
    
    // Load image into editor
    const img = new Image();
    img.onload = () => {
        currentImage = img;
        rotation = 0;
        drawImageOnCanvas();
        photoEditorModal.style.display = 'flex';
    };
    img.src = photoDataURL;
});

// Draw image on canvas with current rotation
function drawImageOnCanvas() {
    if (!currentImage) return;
    
    const maxWidth = 500;
    const maxHeight = 400;
    
    let width = currentImage.width;
    let height = currentImage.height;
    
    // Scale to fit canvas
    if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
    }
    
    // Swap dimensions if rotated 90 or 270 degrees
    if (rotation === 90 || rotation === 270) {
        editorCanvas.width = height;
        editorCanvas.height = width;
    } else {
        editorCanvas.width = width;
        editorCanvas.height = height;
    }
    
    // Clear canvas
    editorCtx.clearRect(0, 0, editorCanvas.width, editorCanvas.height);
    
    // Save context
    editorCtx.save();
    
    // Move to center
    editorCtx.translate(editorCanvas.width / 2, editorCanvas.height / 2);
    
    // Rotate
    editorCtx.rotate((rotation * Math.PI) / 180);
    
    // Draw image centered
    editorCtx.drawImage(
        currentImage,
        -width / 2,
        -height / 2,
        width,
        height
    );
    
    // Restore context
    editorCtx.restore();
}

// Rotate left (counter-clockwise)
rotateLeftBtn.addEventListener('click', () => {
    rotation = (rotation - 90 + 360) % 360;
    drawImageOnCanvas();
});

// Rotate right (clockwise)
rotateRightBtn.addEventListener('click', () => {
    rotation = (rotation + 90) % 360;
    drawImageOnCanvas();
});

// Close editor (cancel)
closeEditorBtn.addEventListener('click', () => {
    photoEditorModal.style.display = 'none';
});

cancelEditBtn.addEventListener('click', () => {
    photoEditorModal.style.display = 'none';
});

// Done editing - save edited photo
doneEditBtn.addEventListener('click', () => {
    // Get edited image as data URL (compressed to 85% quality)
    photoDataURL = editorCanvas.toDataURL('image/jpeg', 0.85);
    
    // Update preview
    previewImage.src = photoDataURL;
    
    // Close editor
    photoEditorModal.style.display = 'none';
    
    const sizeKB = Math.round(photoDataURL.length / 1024);
    console.log('Photo edited and saved. Size:', sizeKB, 'KB');
});

// Initialize editor on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEditor);
} else {
    initEditor();
}

// ===== MAP PIN DROP FUNCTIONALITY =====

let pinMap = null;
let pinMarker = null;
let pinnedLocation = null;

// Secret Spot: Fuzz location to protect exact GPS
function fuzzLocation(lat, lng) {
    // Add random offset +/- 2km (roughly 0.018 degrees)
    const fuzzFactor = 0.018; // ~2km
    const randomLat = (Math.random() - 0.5) * 2 * fuzzFactor;
    const randomLng = (Math.random() - 0.5) * 2 * fuzzFactor;
    
    return {
        lat: lat + randomLat,
        lng: lng + randomLng,
        fuzzy: true // Flag to indicate this is a fuzzy location
    };
}

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
    
    // Show auto-fill button (once pin is dropped)
    const autofillBtn = document.getElementById('autofillConditionsBtn');
    const autofillHint = document.getElementById('autofillHint');
    if (autofillBtn) {
        autofillBtn.style.display = 'inline-block';
        autofillBtn.disabled = false;
        autofillHint.style.display = 'none'; // Hide hint once pin is dropped
    }
    
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

// Auto-fill Conditions Button
document.getElementById('autofillConditionsBtn')?.addEventListener('click', async () => {
    const btn = document.getElementById('autofillConditionsBtn');
    
    // Check if pin is dropped
    if (!pinnedLocation) {
        alert('Please drop a pin on the map first');
        return;
    }
    
    // Get water type
    const waterType = document.getElementById('waterType').value;
    if (!waterType) {
        alert('Please select water type (Saltwater or Freshwater) first');
        return;
    }
    
    // Show loading state
    btn.classList.add('loading');
    btn.disabled = true;
    btn.textContent = '⏳ Fetching...';
    
    try {
        // Fetch conditions using the auto-fill API
        const conditions = await fetchConditions(
            pinnedLocation.lat, 
            pinnedLocation.lng, 
            waterType
        );
        
        // Fill in the fields
        if (conditions.waterTemp) {
            document.getElementById('waterTemp').value = conditions.waterTemp;
        }
        
        if (conditions.tide && waterType === 'Saltwater') {
            document.getElementById('tide').value = conditions.tide;
        } else if (waterType === 'Freshwater') {
            document.getElementById('tide').value = 'N/A';
        }
        
        if (conditions.wind) {
            document.getElementById('wind').value = conditions.wind;
        }
        
        // Success feedback
        btn.classList.remove('loading');
        btn.textContent = '✓ Filled!';
        btn.style.background = 'linear-gradient(135deg, #27ae60 0%, #229954 100%)';
        
        // Reset button after 2 seconds
        setTimeout(() => {
            btn.textContent = '🔄 Auto-fill';
            btn.disabled = false;
        }, 2000);
        
        console.log('Conditions auto-filled:', conditions);
        
    } catch (error) {
        console.error('Auto-fill error:', error);
        btn.classList.remove('loading');
        btn.textContent = '❌ Failed';
        btn.disabled = false;
        
        setTimeout(() => {
            btn.textContent = '🔄 Auto-fill';
        }, 2000);
        
        alert('Could not fetch conditions. Please enter manually.');
    }
});

// Popular Fishing Spots (Quick Jump)
const popularSpotButtons = document.querySelectorAll('.popular-spot-btn');

popularSpotButtons.forEach(button => {
    button.addEventListener('click', () => {
        const lat = parseFloat(button.dataset.lat);
        const lon = parseFloat(button.dataset.lon);
        const name = button.dataset.name;
        
        // Drop pin at popular spot
        dropPin(lat, lon);
        
        // Center and zoom map
        pinMap.setView([lat, lon], 14);
        
        // Auto-fill location name
        document.getElementById('locationName').value = name;
        
        console.log('Jumped to popular spot:', name, lat, lon);
    });
});

// Location Search Functionality (Geocoding)
const locationSearchInput = document.getElementById('locationSearch');
const searchLocationBtn = document.getElementById('searchLocationBtn');
const searchResultsDiv = document.getElementById('searchResults');

// Search on button click
searchLocationBtn.addEventListener('click', searchLocation);

// Search on Enter key
locationSearchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        searchLocation();
    }
});

async function searchLocation() {
    const query = locationSearchInput.value.trim();
    
    if (!query) {
        alert('Please enter a location to search');
        return;
    }
    
    // Show loading state
    searchResultsDiv.style.display = 'block';
    searchResultsDiv.innerHTML = '<div class="search-loading">Searching</div>';
    searchLocationBtn.disabled = true;
    searchLocationBtn.textContent = 'Searching...';
    
    try {
        // Use Nominatim (OpenStreetMap geocoding) - FREE, no API key needed
        // Bias results to South Africa
        const url = `https://nominatim.openstreetmap.org/search?` +
            `q=${encodeURIComponent(query)}&` +
            `format=json&` +
            `limit=5&` +
            `countrycodes=za,na&` + // South Africa + Namibia
            `addressdetails=1`;
        
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'FishTrack Africa (fishtrack-sa.netlify.app)' // Required by Nominatim
            }
        });
        
        if (!response.ok) {
            throw new Error('Search failed');
        }
        
        const results = await response.json();
        
        if (results.length === 0) {
            searchResultsDiv.innerHTML = '<div class="search-no-results">No locations found. Try "Hartbeespoort Dam" or "Struisbaai Beach"</div>';
            return;
        }
        
        // Display results
        let html = '';
        results.forEach(result => {
            const name = result.name || result.display_name.split(',')[0];
            const address = result.display_name;
            
            html += `
                <div class="search-result-item" data-lat="${result.lat}" data-lon="${result.lon}">
                    <div class="search-result-name">${name}</div>
                    <div class="search-result-address">${address}</div>
                </div>
            `;
        });
        
        searchResultsDiv.innerHTML = html;
        
        // Handle result clicks
        searchResultsDiv.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('click', () => {
                const lat = parseFloat(item.dataset.lat);
                const lon = parseFloat(item.dataset.lon);
                
                // Drop pin at selected location
                dropPin(lat, lon);
                
                // Center and zoom map
                pinMap.setView([lat, lon], 14);
                
                // Hide results
                searchResultsDiv.style.display = 'none';
                searchResultsDiv.innerHTML = '';
                
                // Clear search input
                locationSearchInput.value = '';
                
                console.log('Selected location:', lat, lon);
            });
        });
        
    } catch (error) {
        console.error('Location search error:', error);
        searchResultsDiv.innerHTML = '<div class="search-error">Search failed. Please try again or drop a pin manually.</div>';
    } finally {
        // Reset button
        searchLocationBtn.disabled = false;
        searchLocationBtn.textContent = 'Search';
    }
}

// Initialize form submission handler when DOM is ready
function initFormSubmission() {
    console.log('--- INITIALIZING FORM SUBMISSION ---');
    const catchForm = document.getElementById('catchForm');
    // ... rest of function
}

// CRITICAL: Ensure edit mode runs AFTER Firebase and all scripts are loaded
async function startApp() {
    console.log('🚀 STAGE 1: Starting App...');
    
    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get('edit');
    if (editId) {
        console.log('📝 STAGE 2: Edit ID detected:', editId);
        isEditMode = true;
        editCatchId = editId;
    }

    let attempts = 0;
    while (typeof db === 'undefined' && attempts < 50) {
        await new Promise(r => setTimeout(r, 100));
        attempts++;
    }
    
    if (typeof db === 'undefined') {
        console.error('❌ STAGE 3: Firebase Failed');
        return;
    }

    console.log('✅ STAGE 4: Firebase Ready');
    initPinMap();
    initFormLogic(); 
    initFormSubmission();
    initEditor();
    
    if (isEditMode) {
        console.log('🔄 STAGE 5: Triggering Data Load...');
        await checkForEditMode();
    }
}

// ... existing code ...

async function checkForEditMode() {
    console.log('📖 STAGE 6: Entering checkForEditMode');
    if (editCatchId) {
        // Change UI immediately
        const title = document.querySelector('.page-title h2');
        if (title) title.innerHTML = '✏️ Edit Your Catch';
        
        const btn = document.getElementById('submitText');
        if (btn) btn.textContent = 'Save Changes ✓';
        
        try {
            console.log('📡 STAGE 7: Fetching from DB...');
            const doc = await db.collection('catches').doc(editCatchId).get();
            if (!doc.exists) {
                console.error('❌ STAGE 8: Document not found');
                alert('Catch not found!');
                return;
            }
            
            const data = doc.data();
            console.log('✅ STAGE 9: Data received, populating form...');
            window.existingTimestamp = data.timestamp; 
            populateFormForEdit(data);
            console.log('🏁 STAGE 10: Population Complete');
            
        } catch (error) {
            console.error('❌ STAGE 11: DB Error:', error);
            alert('Error loading catch data.');
        }
    }
}

function populateFormForEdit(data) {
    // 1. Photo
    if (data.photo) {
        photoDataURL = data.photo;
        previewImage.src = photoDataURL;
        photoLabel.style.display = 'none';
        photoPreview.style.display = 'block';
    }
    
    // 2. Details
    document.getElementById('waterType').value = data.waterType || '';
    // Trigger water type change logic
    document.getElementById('waterType').dispatchEvent(new Event('change'));
    
    document.getElementById('catcherName').value = data.catcherName || '';
    document.getElementById('country').value = data.country || '';
    document.getElementById('species').value = data.species || '';
    document.getElementById('weight').value = data.weight || '';
    document.getElementById('length').value = data.length || '';
    document.getElementById('locationType').value = data.locationType || '';
    document.getElementById('locationName').value = data.locationName || '';
    document.getElementById('bait').value = data.bait || '';
    document.getElementById('waterTemp').value = data.waterTemp || '';
    document.getElementById('tide').value = data.tide || '';
    document.getElementById('wind').value = data.wind || '';
    document.getElementById('released').checked = !!data.released;
    
    // 3. Date
    if (data.catchDate) {
        const date = data.catchDate.toDate ? data.catchDate.toDate() : new Date(data.catchDate);
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        document.getElementById('catchDate').value = `${y}-${m}-${d}`;
    }
    
    // 4. Privacy
    const privacyRadio = document.querySelector(`input[name="privacy"][value="${data.privacy || 'public'}"]`);
    if (privacyRadio) privacyRadio.checked = true;
    
    // 5. Map Pin
    if (data.location && data.location.lat) {
        // Wait a bit for map to be ready
        setTimeout(() => {
            if (typeof dropPin === 'function') {
                dropPin(data.location.lat, data.location.lng);
                pinMap.setView([data.location.lat, data.location.lng], 14);
            }
        }, 1000);
    }
}

// Debug: Test Firebase connection on page load
console.log('Testing Firebase connection...');
db.collection('catches').limit(1).get()
    .then((snapshot) => {
        console.log('✓ Firebase connection OK. Catches count:', snapshot.size);
    })
    .catch((err) => {
        console.error('✗ Firebase connection ERROR:', err);
        alert('WARNING: Cannot connect to Firebase. Check console for details.');
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
