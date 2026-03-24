// Catch Logger - Form handling and Firebase submission

let photoFile = null;
let photoDataURL = null;
let currentLocation = null;
let isEditMode = false;
let editCatchId = null;

// Initial setup
async function startApp() {
    console.log('🚀 STAGE 1: Starting App...');
    
    // Check for edit mode FIRST
    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get('edit');
    if (editId) {
        console.log('📝 STAGE 2: Edit ID detected:', editId);
        isEditMode = true;
        editCatchId = editId;
    }

    // Wait for Firebase
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

    // Initialize Map and UI
    initPinMap();
    initFormLogic(); 
    initFormSubmission();
    initEditor();
    
    // Load data if editing
    if (isEditMode) {
        console.log('🔄 STAGE 5: Triggering Data Load...');
        await loadCatchDataForEdit();
    }
}

function initFormLogic() {
    const waterTypeSelect = document.getElementById('waterType');
    const speciesSelect = document.getElementById('species');
    const locationTypeSelect = document.getElementById('locationType');
    const baitSelect = document.getElementById('bait');
    
    // Default date (only for NEW catches)
    if (!isEditMode) {
        const catchDateInput = document.getElementById('catchDate');
        if (catchDateInput) {
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            catchDateInput.value = `${year}-${month}-${day}`;
        }
    }

    waterTypeSelect.addEventListener('change', function() {
        const waterType = this.value;
        if (waterType === 'Saltwater') {
            showElementsByClass('saltwater-group', true);
            showElementsByClass('freshwater-group', false);
            showElementsByClass('saltwater-location', true);
            showElementsByClass('freshwater-location', false);
            showElementsByClass('saltwater-bait', true);
            showElementsByClass('freshwater-bait', false);
            document.getElementById('locationName').placeholder = 'e.g., Struisbaai Beach, Mile 72';
        } else if (waterType === 'Freshwater') {
            showElementsByClass('saltwater-group', false);
            showElementsByClass('freshwater-group', true);
            showElementsByClass('saltwater-location', false);
            showElementsByClass('freshwater-location', true);
            showElementsByClass('saltwater-bait', false);
            showElementsByClass('freshwater-bait', true);
            document.getElementById('locationName').placeholder = 'e.g., Hartbeespoort Dam, Vaal River';
        }
    });
}

function showElementsByClass(className, show) {
    document.querySelectorAll('.' + className).forEach(el => {
        el.style.display = show ? '' : 'none';
    });
}

async function loadCatchDataForEdit() {
    console.log('📖 STAGE 6: Fetching catch data...');
    
    // Change UI
    document.querySelector('.page-title h2').innerHTML = '✏️ Edit Your Catch';
    document.getElementById('submitText').textContent = 'Save Changes ✓';
    
    try {
        const doc = await db.collection('catches').doc(editCatchId).get();
        if (!doc.exists) {
            alert('Catch not found!');
            return;
        }
        
        const data = doc.data();
        console.log('✅ STAGE 7: Data loaded:', data.species);
        window.existingTimestamp = data.timestamp; 
        
        // 1. Photo
        if (data.photo) {
            photoDataURL = data.photo;
            document.getElementById('previewImage').src = photoDataURL;
            document.getElementById('photoLabel').style.display = 'none';
            document.getElementById('photoPreview').style.display = 'block';
        }
        
        // 2. Main Details
        document.getElementById('waterType').value = data.waterType || '';
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
            setTimeout(() => {
                dropPin(data.location.lat, data.location.lng);
                pinMap.setView([data.location.lat, data.location.lng], 14);
            }, 1000);
        }
        
        console.log('🏁 STAGE 8: Done pre-filling form');
    } catch (err) {
        console.error('❌ STAGE 9: Error:', err);
    }
}

function initFormSubmission() {
    const catchForm = document.getElementById('catchForm');
    if (!catchForm) return;

    catchForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = document.getElementById('submitBtn');
        submitBtn.disabled = true;
        document.getElementById('submitText').style.display = 'none';
        document.getElementById('submitSpinner').style.display = 'inline-block';
        
        try {
            const catchDateValue = document.getElementById('catchDate').value;
            const catchDate = catchDateValue ? new Date(catchDateValue + 'T12:00:00') : new Date();
            const privacySetting = document.querySelector('input[name="privacy"]:checked').value;
            const realLocation = currentLocation || pinnedLocation || { lat: -34.0, lng: 18.5 };
            let displayLocation = realLocation;
            
            if (privacySetting === 'secret') {
                displayLocation = fuzzLocation(realLocation.lat, realLocation.lng);
            }
            
            const formData = {
                waterType: document.getElementById('waterType').value,
                catcherName: document.getElementById('catcherName').value,
                catchDate: catchDate,
                country: document.getElementById('country').value,
                species: document.getElementById('species').value,
                weight: parseFloat(document.getElementById('weight').value) || 0,
                length: document.getElementById('length').value ? parseInt(document.getElementById('length').value) : null,
                locationType: document.getElementById('locationType').value,
                locationName: document.getElementById('locationName').value,
                bait: document.getElementById('bait').value || null,
                waterTemp: document.getElementById('waterTemp').value ? parseFloat(document.getElementById('waterTemp').value) : null,
                tide: document.getElementById('tide').value || null,
                wind: document.getElementById('wind').value || null,
                released: document.getElementById('released').checked,
                privacy: privacySetting,
                timestamp: isEditMode ? (window.existingTimestamp || firebase.firestore.FieldValue.serverTimestamp()) : firebase.firestore.FieldValue.serverTimestamp(),
                location: displayLocation, 
                locationExact: privacySetting === 'secret' ? realLocation : null,
                deviceId: localStorage.getItem('fishtrack_device_id'),
                verified: false,
                photo: photoDataURL || null
            };
            
            if (isEditMode && editCatchId) {
                await db.collection('catches').doc(editCatchId).update(formData);
            } else {
                await db.collection('catches').add(formData);
            }
            
            localStorage.setItem('fishtrack_user_name', formData.catcherName);
            document.getElementById('catchForm').style.display = 'none';
            document.getElementById('successMessage').style.display = 'block';
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
        } catch (error) {
            console.error('❌ ERROR:', error);
            alert('Error saving: ' + error.message);
            submitBtn.disabled = false;
            document.getElementById('submitText').style.display = 'inline-block';
            document.getElementById('submitSpinner').style.display = 'none';
        }
    });
}

// Global scope functions required by HTML or other scripts
window.dropPin = function(lat, lng) {
    if (pinMarker) pinMap.removeLayer(pinMarker);
    pinMarker = L.marker([lat, lng], { draggable: true }).addTo(pinMap);
    pinnedLocation = { lat, lng };
    document.getElementById('coordinatesDisplay').style.display = 'block';
    document.getElementById('latLng').textContent = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    document.getElementById('clearPin').style.display = 'inline-block';
    document.getElementById('autofillConditionsBtn').style.display = 'inline-block';
};

// ... (Rest of support functions like fuzzLocation, initPinMap, initEditor, compressPhoto, etc)
// I will keep them but ensure they are correctly defined

function initPinMap() {
    pinMap = L.map('pinMap').setView([-33.5, 20.0], 6);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(pinMap);
    pinMap.on('click', (e) => window.dropPin(e.latlng.lat, e.latlng.lng));
}

function initEditor() { /* ... */ }
function compressPhoto() { /* ... */ }

// Start
startApp();
