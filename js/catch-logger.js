// Catch Logger - Complete Unified Script
// Handles Logging, Editing, Map Selection, and Photo Optimization

let photoFile = null;
let photoDataURL = null;
let currentLocation = null;
let isEditMode = false;
let editCatchId = null;

let pinMap = null;
let pinMarker = null;
let pinnedLocation = null;

// ==========================================
// 🚀 APP INITIALIZATION
// ==========================================

async function startApp() {
    console.log('🚀 STAGE 1: Starting Unified App...');
    
    // 1. Determine Mode
    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get('edit');
    if (editId) {
        isEditMode = true;
        editCatchId = editId;
        console.log('📝 Edit Mode enabled for:', editId);
    }

    // 2. Wait for Firebase
    let attempts = 0;
    while (typeof db === 'undefined' && attempts < 50) {
        await new Promise(r => setTimeout(r, 100));
        attempts++;
    }
    
    if (typeof db === 'undefined') {
        console.error('❌ Firebase DB not found!');
        return;
    }

    // 3. Initialize Everything
    initPinMap();
    initFormLogic(); 
    initFormSubmission();
    initPhotoHandlers();
    
    // 4. Load Data if Editing
    if (isEditMode) {
        await loadCatchDataForEdit();
    }
}

// ==========================================
// 📸 PHOTO HANDLING
// ==========================================

function initPhotoHandlers() {
    const photoInput = document.getElementById('photoInput');
    const changePhotoBtn = document.getElementById('changePhoto');
    const editPhotoBtn = document.getElementById('editPhoto');

    photoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            photoFile = file;
            compressPhoto(file, (compressedDataURL) => {
                photoDataURL = compressedDataURL;
                document.getElementById('previewImage').src = photoDataURL;
                document.getElementById('photoLabel').style.display = 'none';
                document.getElementById('photoPreview').style.display = 'block';
                
                // Auto-open editor for new photos
                if (window.photoEditor) {
                    setTimeout(() => window.photoEditor.open(photoDataURL), 500);
                }
            });
        }
    });

    changePhotoBtn.addEventListener('click', () => {
        photoInput.value = '';
        photoInput.click();
    });

    editPhotoBtn?.addEventListener('click', () => {
        if (photoDataURL && window.photoEditor) {
            window.photoEditor.open(photoDataURL);
        }
    });
}

function compressPhoto(file, callback) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            const MAX_WIDTH = 1200;
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            
            if (width > MAX_WIDTH) {
                height = Math.round(height * MAX_WIDTH / width);
                width = MAX_WIDTH;
            }
            
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            callback(canvas.toDataURL('image/jpeg', 0.85));
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// ==========================================
// 📍 MAP & LOCATION
// ==========================================

function initPinMap() {
    pinMap = L.map('pinMap').setView([-33.5, 20.0], 6);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
    }).addTo(pinMap);
    
    pinMap.on('click', (e) => dropPin(e.latlng.lat, e.latlng.lng));
}

function dropPin(lat, lng) {
    if (pinMarker) pinMap.removeLayer(pinMarker);
    
    pinMarker = L.marker([lat, lng], {
        draggable: true,
        icon: L.icon({
            iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41]
        })
    }).addTo(pinMap);
    
    pinnedLocation = { lat, lng };
    currentLocation = { lat, lng };
    
    document.getElementById('coordinatesDisplay').style.display = 'block';
    document.getElementById('latLng').textContent = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    document.getElementById('clearPin').style.display = 'inline-block';
    document.getElementById('autofillConditionsBtn').style.display = 'inline-block';
    
    pinMarker.on('dragend', (e) => {
        const pos = e.target.getLatLng();
        dropPin(pos.lat, pos.lng);
    });
}

// ==========================================
// 📝 FORM LOGIC & EDITING
// ==========================================

function initFormLogic() {
    const waterTypeSelect = document.getElementById('waterType');
    
    if (!isEditMode) {
        const catchDateInput = document.getElementById('catchDate');
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0];
        if (catchDateInput) catchDateInput.value = dateStr;
    }

    waterTypeSelect.addEventListener('change', function() {
        const isSalt = this.value === 'Saltwater';
        document.querySelectorAll('.saltwater-group, .saltwater-location, .saltwater-bait').forEach(el => el.style.display = isSalt ? '' : 'none');
        document.querySelectorAll('.freshwater-group, .freshwater-location, .freshwater-bait').forEach(el => el.style.display = isSalt ? 'none' : '');
        document.getElementById('locationName').placeholder = isSalt ? 'e.g. Struisbaai Beach' : 'e.g. Vaal River';
    });
}

async function loadCatchDataForEdit() {
    document.querySelector('.page-title h2').innerHTML = '✏️ Edit Your Catch';
    document.getElementById('submitText').textContent = 'Save Changes ✓';
    
    try {
        const doc = await db.collection('catches').doc(editCatchId).get();
        if (!doc.exists) return;
        
        const data = doc.data();
        window.existingTimestamp = data.timestamp; 
        
        // Populate Photo
        if (data.photo) {
            photoDataURL = data.photo;
            document.getElementById('previewImage').src = photoDataURL;
            document.getElementById('photoLabel').style.display = 'none';
            document.getElementById('photoPreview').style.display = 'block';
        }
        
        // Populate Details
        const fields = ['waterType', 'catcherName', 'country', 'species', 'weight', 'length', 'locationType', 'locationName', 'bait', 'waterTemp', 'tide', 'wind'];
        fields.forEach(f => {
            const el = document.getElementById(f);
            if (el) el.value = data[f] || '';
        });
        
        document.getElementById('waterType').dispatchEvent(new Event('change'));
        document.getElementById('released').checked = !!data.released;
        
        if (data.catchDate) {
            const date = data.catchDate.toDate ? data.catchDate.toDate() : new Date(data.catchDate);
            document.getElementById('catchDate').value = date.toISOString().split('T')[0];
        }
        
        const privacyRadio = document.querySelector(`input[name="privacy"][value="${data.privacy || 'public'}"]`);
        if (privacyRadio) privacyRadio.checked = true;
        
        // Populate Map Location
        if (data.location && data.location.lat) {
            const lat = data.location.lat;
            const lng = data.location.lng;
            // Force pin placement
            setTimeout(() => {
                dropPin(lat, lng);
                pinMap.setView([lat, lng], 14);
            }, 800);
        }
    } catch (err) {
        console.error('Error loading data:', err);
    }
}

function initFormSubmission() {
    const catchForm = document.getElementById('catchForm');
    catchForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('🎯 FORM SUBMITTED - Starting save process...');
        console.log('Mode:', isEditMode ? 'EDIT' : 'NEW');
        console.log('Edit ID:', editCatchId);
        
        const submitBtn = document.getElementById('submitBtn');
        submitBtn.disabled = true;
        document.getElementById('submitText').style.display = 'none';
        document.getElementById('submitSpinner').style.display = 'inline-block';
        
        try {
            console.log('Step 1: Building form data...');
            const privacy = document.querySelector('input[name="privacy"]:checked').value;
            const realLoc = pinnedLocation || { lat: -34.0, lng: 18.5 };
            
            console.log('Privacy:', privacy);
            console.log('Location:', realLoc);
            console.log('Photo exists:', !!photoDataURL);
            
            const formData = {
                waterType: document.getElementById('waterType').value,
                catcherName: document.getElementById('catcherName').value,
                catchDate: new Date(document.getElementById('catchDate').value + 'T12:00:00'),
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
                privacy: privacy,
                timestamp: isEditMode ? (window.existingTimestamp || firebase.firestore.FieldValue.serverTimestamp()) : firebase.firestore.FieldValue.serverTimestamp(),
                location: privacy === 'secret' ? fuzzLocation(realLoc.lat, realLoc.lng) : realLoc,
                locationExact: privacy === 'secret' ? realLoc : null,
                deviceId: localStorage.getItem('fishtrack_device_id'),
                photo: photoDataURL || null,
                verified: false
            };
            
            console.log('Step 2: Form data built:', formData);
            
            if (isEditMode) {
                console.log('Step 3: UPDATING existing catch:', editCatchId);
                console.log('Using merge: true to preserve existing data');
                
                const docRef = db.collection('catches').doc(editCatchId);
                await docRef.set(formData, { merge: true });
                
                console.log('✅ UPDATE COMPLETE - Verifying...');
                
                // Verify the write
                const updated = await docRef.get();
                if (updated.exists) {
                    console.log('✅ VERIFIED - Document exists after update');
                    console.log('Updated location:', updated.data().location);
                } else {
                    console.error('❌ VERIFICATION FAILED - Document missing after update!');
                }
            } else {
                console.log('Step 3: CREATING new catch');
                const docRef = await db.collection('catches').add(formData);
                console.log('✅ CREATION COMPLETE - ID:', docRef.id);
            }
            
            console.log('Step 4: Saving user name to localStorage');
            localStorage.setItem('fishtrack_user_name', formData.catcherName);
            
            console.log('Step 5: Showing success message');
            
            if (isEditMode) {
                // Redirect back to logbook after edit
                console.log('Step 6: Redirecting to logbook...');
                alert('✅ Changes saved successfully!');
                window.location.href = 'my-logbook.html';
            } else {
                // Show success message for new catch
                document.getElementById('catchForm').style.display = 'none';
                document.getElementById('successMessage').style.display = 'block';
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
            
            console.log('🎉 SAVE COMPLETE!');
            
        } catch (error) {
            console.error('❌ SAVE ERROR:', error);
            console.error('Error name:', error.name);
            console.error('Error message:', error.message);
            console.error('Error code:', error.code);
            console.error('Full error:', JSON.stringify(error, null, 2));
            
            alert('ERROR SAVING CATCH:\n\n' + error.message + '\n\nCheck console (F12) for details.');
            
            submitBtn.disabled = false;
            document.getElementById('submitText').style.display = 'inline-block';
            document.getElementById('submitSpinner').style.display = 'none';
        }
    });
}

function fuzzLocation(lat, lng) {
    const fuzz = 0.018; 
    return { lat: lat + (Math.random() - 0.5) * 2 * fuzz, lng: lng + (Math.random() - 0.5) * 2 * fuzz, fuzzy: true };
}

// Start the app
startApp();
