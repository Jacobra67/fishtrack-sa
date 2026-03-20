// Photo Lightbox - Click to enlarge and download

class PhotoLightbox {
    constructor() {
        this.lightbox = null;
        this.init();
    }
    
    init() {
        // Create lightbox HTML
        const lightboxHTML = `
            <div id="photoLightbox" class="photo-lightbox">
                <button class="lightbox-close" onclick="photoLightbox.close()">×</button>
                <div class="lightbox-image-container">
                    <img id="lightboxImage" class="lightbox-image" src="" alt="Catch Photo">
                    <div class="lightbox-controls">
                        <button class="lightbox-btn" onclick="photoLightbox.download()" title="Download">
                            💾
                        </button>
                        <button class="lightbox-btn" onclick="photoLightbox.share()" title="Share">
                            📤
                        </button>
                    </div>
                </div>
                <div class="lightbox-info" id="lightboxInfo"></div>
            </div>
        `;
        
        // Add to body
        document.body.insertAdjacentHTML('beforeend', lightboxHTML);
        this.lightbox = document.getElementById('photoLightbox');
        
        // Close on background click
        this.lightbox.addEventListener('click', (e) => {
            if (e.target === this.lightbox) {
                this.close();
            }
        });
        
        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.lightbox.classList.contains('active')) {
                this.close();
            }
        });
        
        console.log('Photo lightbox initialized');
    }
    
    open(imageUrl, catchData) {
        const img = document.getElementById('lightboxImage');
        const info = document.getElementById('lightboxInfo');
        
        // Set image
        img.src = imageUrl;
        this.currentImageUrl = imageUrl;
        this.catchData = catchData;
        
        // Set info
        if (catchData) {
            info.textContent = `${catchData.species} • ${catchData.weight}kg • ${catchData.catcherName || 'Unknown'}`;
        } else {
            info.textContent = '';
        }
        
        // Show lightbox
        this.lightbox.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent scrolling
    }
    
    close() {
        this.lightbox.classList.remove('active');
        document.body.style.overflow = ''; // Restore scrolling
    }
    
    async download() {
        try {
            // Fetch the image
            const response = await fetch(this.currentImageUrl);
            const blob = await response.blob();
            
            // Create download link
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            
            // Generate filename
            const filename = this.catchData 
                ? `fishtrack-${this.catchData.species.toLowerCase().replace(/\s/g, '-')}-${Date.now()}.jpg`
                : `fishtrack-catch-${Date.now()}.jpg`;
            
            a.download = filename;
            a.click();
            
            // Clean up
            URL.revokeObjectURL(url);
            
            console.log('Photo downloaded:', filename);
            
        } catch (error) {
            console.error('Download error:', error);
            alert('Could not download photo. Please try long-pressing the image to save.');
        }
    }
    
    async share() {
        if (navigator.share) {
            try {
                // Fetch image as blob
                const response = await fetch(this.currentImageUrl);
                const blob = await response.blob();
                const file = new File([blob], 'catch.jpg', { type: 'image/jpeg' });
                
                await navigator.share({
                    title: this.catchData ? `${this.catchData.species} - FishTrack Africa` : 'My Catch',
                    text: this.catchData 
                        ? `${this.catchData.weight}kg ${this.catchData.species} caught by ${this.catchData.catcherName}!`
                        : 'Check out this catch!',
                    files: [file]
                });
                
                console.log('Photo shared');
                
            } catch (error) {
                if (error.name !== 'AbortError') {
                    console.error('Share error:', error);
                    this.fallbackShare();
                }
            }
        } else {
            this.fallbackShare();
        }
    }
    
    fallbackShare() {
        // Copy URL to clipboard
        const shareUrl = `https://fishtrack-sa.netlify.app`;
        navigator.clipboard.writeText(shareUrl).then(() => {
            alert('FishTrack URL copied to clipboard! Share with your fishing buddies 🎣');
        }).catch(() => {
            alert('Sharing not supported on this device.');
        });
    }
}

// Initialize lightbox on page load
let photoLightbox;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        photoLightbox = new PhotoLightbox();
    });
} else {
    photoLightbox = new PhotoLightbox();
}

// Helper function to make images clickable
function makeImageClickable(imgElement, catchData) {
    imgElement.style.cursor = 'pointer';
    imgElement.addEventListener('click', () => {
        photoLightbox.open(imgElement.src, catchData);
    });
}
