// Catch Detail Modal
class CatchModal {
    constructor() {
        this.createModal();
        this.attachEventListeners();
    }

    createModal() {
        // Create modal HTML
        const modalHTML = `
            <div class="catch-modal-overlay" id="catchModal">
                <div class="catch-modal">
                    <button class="catch-modal-close" id="modalClose">&times;</button>
                    <img class="catch-modal-photo" id="modalPhoto" src="" alt="Catch Photo">
                    <div class="catch-modal-content">
                        <div class="catch-modal-header">
                            <h2 class="catch-modal-species" id="modalSpecies"></h2>
                            <div class="catch-modal-weight" id="modalWeight"></div>
                            <div class="catch-modal-meta" id="modalMeta"></div>
                        </div>
                        
                        <div class="catch-modal-details" id="modalDetails"></div>
                        
                        <div class="catch-modal-actions">
                            <button class="catch-modal-btn catch-modal-btn-like" id="modalLike">
                                ❤️ Like <span id="likeCount">(0)</span>
                            </button>
                            <button class="catch-modal-btn catch-modal-btn-comment" id="modalComment">
                                💬 Comment <span id="commentCount">(0)</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Append to body
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    attachEventListeners() {
        const modal = document.getElementById('catchModal');
        const closeBtn = document.getElementById('modalClose');
        const likeBtn = document.getElementById('modalLike');
        const commentBtn = document.getElementById('modalComment');

        // Close on X button
        closeBtn.addEventListener('click', () => this.close());

        // Close on overlay click (outside modal)
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.close();
            }
        });

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('active')) {
                this.close();
            }
        });

        // Like button (placeholder)
        likeBtn.addEventListener('click', () => {
            alert('❤️ Like feature coming soon! This will let you like catches and show your appreciation to fellow anglers.');
        });

        // Comment button (placeholder)
        commentBtn.addEventListener('click', () => {
            alert('💬 Comment feature coming soon! This will let you share tips, ask questions, and connect with other anglers.');
        });
    }

    open(catchData) {
        const modal = document.getElementById('catchModal');
        
        // Populate modal with catch data
        this.populateModal(catchData);
        
        // Show modal
        modal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    close() {
        const modal = document.getElementById('catchModal');
        modal.classList.remove('active');
        document.body.style.overflow = ''; // Restore scrolling
    }

    populateModal(catchData) {
        // Photo
        const modalPhoto = document.getElementById('modalPhoto');
        modalPhoto.src = catchData.photoURL || 'assets/placeholder-fish.jpg';
        modalPhoto.alt = `${catchData.species} caught by ${catchData.catcher}`;

        // Species
        document.getElementById('modalSpecies').textContent = catchData.species;

        // Weight
        document.getElementById('modalWeight').textContent = catchData.weight ? 
            `${catchData.weight} kg` : 'Weight not recorded';

        // Meta info (location, date, catcher)
        const metaHTML = `
            <div class="catch-modal-meta-item">
                <span class="icon">📍</span>
                <span><span class="label">Location:</span> ${catchData.location || 'Unknown'}</span>
            </div>
            <div class="catch-modal-meta-item">
                <span class="icon">📅</span>
                <span><span class="label">Date:</span> ${this.formatDate(catchData.date)}</span>
            </div>
            <div class="catch-modal-meta-item">
                <span class="icon">🎣</span>
                <span><span class="label">Caught by:</span> ${catchData.catcher || 'Anonymous'}</span>
            </div>
            ${catchData.privacy === 'secret' ? '<div class="secret-spot-badge">🤫 SECRET SPOT</div>' : ''}
        `;
        document.getElementById('modalMeta').innerHTML = metaHTML;

        // Detailed conditions (if available)
        let detailsHTML = '';
        if (catchData.waterTemp || catchData.tide || catchData.windSpeed || catchData.bait) {
            detailsHTML = '<h3>Conditions & Details</h3><div class="catch-modal-details-grid">';
            
            if (catchData.waterTemp) {
                detailsHTML += `
                    <div class="catch-modal-detail-item">
                        <span class="label">Water Temp</span>
                        <span class="value">🌡️ ${catchData.waterTemp}°C</span>
                    </div>
                `;
            }
            
            if (catchData.tide) {
                detailsHTML += `
                    <div class="catch-modal-detail-item">
                        <span class="label">Tide</span>
                        <span class="value">🌊 ${catchData.tide}</span>
                    </div>
                `;
            }
            
            if (catchData.windSpeed) {
                detailsHTML += `
                    <div class="catch-modal-detail-item">
                        <span class="label">Wind</span>
                        <span class="value">💨 ${catchData.windSpeed} km/h ${catchData.windDirection || ''}</span>
                    </div>
                `;
            }
            
            if (catchData.bait) {
                detailsHTML += `
                    <div class="catch-modal-detail-item">
                        <span class="label">Bait/Lure</span>
                        <span class="value">🎣 ${catchData.bait}</span>
                    </div>
                `;
            }

            if (catchData.time) {
                detailsHTML += `
                    <div class="catch-modal-detail-item">
                        <span class="label">Time</span>
                        <span class="value">🕐 ${catchData.time}</span>
                    </div>
                `;
            }
            
            detailsHTML += '</div>';
        }
        
        document.getElementById('modalDetails').innerHTML = detailsHTML || 
            '<p style="opacity: 0.6; font-style: italic;">No additional details recorded for this catch.</p>';
    }

    formatDate(dateString) {
        if (!dateString) return 'Unknown date';
        
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        
        return date.toLocaleDateString('en-ZA', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    }
}

// Initialize modal on page load
let catchModal;
document.addEventListener('DOMContentLoaded', () => {
    catchModal = new CatchModal();
    console.log('✅ Catch modal initialized');
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CatchModal };
}
