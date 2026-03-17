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
