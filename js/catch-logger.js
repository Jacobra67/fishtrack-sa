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
            
            // Show file size info
            const originalSizeKB = Math.round(file.size / 1024);
            const compressedSizeKB = Math.round(photoDataURL.length / 1024);
            console.log(`Photo compressed: ${originalSizeKB}KB → ${compressedSizeKB}KB (${Math.round((1 - compressedSizeKB/originalSizeKB) * 100)}% reduction)`);
        });
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
            waterType: document.getElementById('waterType').value,
            catcherName: document.getElementById('catcherName').value,
            country: document.getElementById('country').value,
            species: document.getElementById('species').value,
            weight: parseFloat(document.getElementById('weight').value),
            length: document.getElementById('length').value ? parseInt(document.getElementById('length').value) : null,
            locationType: document.getElementById('locationType').value,
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
            // Check photo size (Firebase has 1MB document limit)
            const photoSizeKB = Math.round(photoDataURL.length / 1024);
            console.log('Photo size:', photoSizeKB, 'KB');
            
            if (photoSizeKB > 950) {
                // This should rarely happen with compression, but check anyway
                throw new Error(`Photo too large (${photoSizeKB}KB). Maximum 950KB. Please try a different photo or contact support.`);
            }
            
            formData.photo = photoDataURL; // For MVP, store as base64
            // TODO: Later, upload to Firebase Storage for better performance
        }
        
        // Debug: Log form data before saving
        console.log('Attempting to save catch:', {
            catcherName: formData.catcherName,
            country: formData.country,
            species: formData.species,
            weight: formData.weight,
            locationName: formData.locationName,
            hasPhoto: !!formData.photo
        });
        
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
        console.error('Error details:', error.message, error.code);
        
        // Show more specific error message
        let errorMsg = 'Error saving catch. ';
        if (error.code === 'permission-denied') {
            errorMsg += 'Database permission denied. Please contact support.';
        } else if (error.message) {
            errorMsg += error.message;
        } else {
            errorMsg += 'Please try again.';
        }
        
        alert(errorMsg);
        
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
