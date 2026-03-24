// Photo Editor & Cropper Logic
class PhotoEditor {
    constructor() {
        this.cropper = null;
        this.originalImage = null;
        this.modal = document.getElementById('photoEditorModal');
        this.canvas = document.getElementById('editorCanvas');
        this.initEventListeners();
    }

    initEventListeners() {
        document.getElementById('rotateLeft').onclick = () => this.rotate(-90);
        document.getElementById('rotateRight').onclick = () => this.rotate(90);
        document.getElementById('cancelEdit').onclick = () => this.close();
        document.getElementById('closeEditor').onclick = () => this.close();
        document.getElementById('doneEdit').onclick = () => this.save();
    }

    open(imageSrc) {
        this.modal.style.display = 'flex';
        const img = new Image();
        img.onload = () => {
            this.originalImage = img;
            this.initCropper(img);
        };
        img.src = imageSrc;
    }

    initCropper(img) {
        if (this.cropper) {
            this.cropper.destroy();
        }

        // We use Cropper.js if available, otherwise fallback to simple canvas preview
        if (typeof Cropper !== 'undefined') {
            const imageElement = document.createElement('img');
            imageElement.src = img.src;
            imageElement.style.maxWidth = '100%';
            
            const container = document.querySelector('.editor-canvas-container');
            container.innerHTML = '';
            container.appendChild(imageElement);

            this.cropper = new Cropper(imageElement, {
                aspectRatio: NaN, // Free crop
                viewMode: 1,
                autoCropArea: 0.8,
                responsive: true,
                restore: false,
                guides: true,
                center: true,
                highlight: false,
                cropBoxMovable: true,
                cropBoxResizable: true,
                toggleDragModeOnDblclick: false,
            });
        } else {
            // Fallback: Just draw on canvas
            const ctx = this.canvas.getContext('2d');
            this.canvas.width = img.width;
            this.canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
        }
    }

    rotate(degree) {
        if (this.cropper) {
            this.cropper.rotate(degree);
        }
    }

    save() {
        let finalImageData;
        if (this.cropper) {
            finalImageData = this.cropper.getCroppedCanvas({
                maxWidth: 2048,
                maxHeight: 2048,
                fillColor: '#fff',
                imageSmoothingEnabled: true,
                imageSmoothingQuality: 'high',
            }).toDataURL('image/jpeg', 0.85);
        } else {
            finalImageData = this.canvas.toDataURL('image/jpeg', 0.85);
        }

        // Update main preview in logger
        const previewImage = document.getElementById('previewImage');
        if (previewImage) {
            previewImage.src = finalImageData;
            // Also store for form submission
            window.editedPhotoData = finalImageData;
        }

        this.close();
    }

    close() {
        if (this.cropper) {
            this.cropper.destroy();
            this.cropper = null;
        }
        this.modal.style.display = 'none';
    }
}

// Initialize
window.photoEditor = new PhotoEditor();
