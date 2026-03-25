// FishTrack Africa - Activity Feed & Latest Catches
// Shows recent catches, stats, and hot spots on homepage

document.addEventListener('DOMContentLoaded', async () => {
    // Check if we're on the homepage
    if (!document.getElementById('latest-catches-section')) return;
    
    try {
        // Wait for Firebase to be ready
        await waitForFirebase();
        
        // Load catches - simplified query to avoid index requirement
        // Note: We'll filter out private catches client-side
        const snapshot = await db.collection('catches')
            .orderBy('timestamp', 'desc')
            .limit(100) // Get last 100, filter client-side
            .get();
        
        let catches = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        // Filter out private catches (client-side filtering)
        catches = catches.filter(c => c.privacy !== 'private');
        
        console.log('Loaded', catches.length, 'public/secret catches for activity feed');
        
        // Calculate stats
        updateActivityStats(catches);
        
        // Show latest 10 catches
        renderLatestCatches(catches.slice(0, 10));
        
        // Show biggest catch of the week
        renderBiggestCatch(catches);
        
        // Show hot spots
        renderHotSpots(catches);
        
    } catch (error) {
        console.error('Error loading activity feed:', error);
        
        // Show friendly error message
        const feed = document.getElementById('latest-catches-feed');
        if (feed) {
            feed.innerHTML = 
                '<div style="text-align: center; padding: 40px; color: #e74c3c;">' +
                'Unable to load catches. Please try again later.<br>' +
                '<small style="color: #999; margin-top: 8px; display: block;">If this persists, check your internet connection.</small>' +
                '</div>';
        }
        
        // Reset stats to show zeros instead of dashes
        document.getElementById('total-catches-stat').textContent = '0';
        document.getElementById('week-catches-stat').textContent = '0';
        document.getElementById('active-anglers-stat').textContent = '0';
        document.getElementById('hot-spots-stat').textContent = '0';
    }
});

function waitForFirebase() {
    return new Promise((resolve) => {
        const check = setInterval(() => {
            if (typeof db !== 'undefined') {
                clearInterval(check);
                resolve();
            }
        }, 100);
        
        // Timeout after 10 seconds
        setTimeout(() => {
            clearInterval(check);
            resolve();
        }, 10000);
    });
}

function updateActivityStats(catches) {
    // Total catches
    const totalStat = document.getElementById('total-catches-stat');
    if (totalStat) totalStat.textContent = catches.length || '0';
    
    // This week's catches
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const weekCatches = catches.filter(c => {
        const catchTime = c.timestamp?.toDate() || new Date();
        return catchTime >= oneWeekAgo;
    });
    const weekStat = document.getElementById('week-catches-stat');
    if (weekStat) weekStat.textContent = weekCatches.length || '0';
    
    // Active anglers (unique names)
    const uniqueAnglers = new Set(catches.map(c => c.catcherName).filter(Boolean));
    const anglersStat = document.getElementById('active-anglers-stat');
    if (anglersStat) anglersStat.textContent = uniqueAnglers.size || '0';
    
    // Hot spots (unique locations)
    const uniqueSpots = new Set(catches.map(c => c.locationName).filter(Boolean));
    const spotsStat = document.getElementById('hot-spots-stat');
    if (spotsStat) spotsStat.textContent = uniqueSpots.size || '0';
}

function renderLatestCatches(catches) {
    const feed = document.getElementById('latest-catches-feed');
    
    if (catches.length === 0) {
        feed.innerHTML = '<div style="text-align: center; padding: 40px; color: #999;">No catches yet. Be the first to log a catch!</div>';
        return;
    }
    
    feed.innerHTML = catches.map((catchData, index) => {
        const timeAgo = getTimeAgo(catchData.timestamp?.toDate() || new Date());
        const isSecret = catchData.privacy === 'secret';
        const locationDisplay = isSecret ? `${catchData.locationName || 'Unknown'} 🔒` : `${catchData.locationName || 'Unknown'} 📍`;
        
        return `
            <div class="catch-card" data-catch-index="${index}" style="background: white; border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); display: flex; gap: 20px; align-items: center; cursor: pointer; transition: all 0.2s;" 
                 onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.15)'"
                 onmouseout="this.style.transform=''; this.style.boxShadow='0 2px 8px rgba(0,0,0,0.1)'">
                ${catchData.photo ? 
                    `<img src="${catchData.photo}" class="activity-feed-photo" data-catch-id="${catchData.id}" alt="${catchData.species}">` : 
                    `<div style="width: 100px; height: 100px; background: linear-gradient(135deg, var(--navy-blue) 0%, #2a4060 100%); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 48px; flex-shrink: 0;">🐟</div>`
                }
                <div style="flex: 1; min-width: 0;">
                    <h4 style="font-size: 18px; color: var(--navy-blue); margin: 0 0 8px 0; font-weight: bold;">${catchData.species} - ${catchData.weight}kg</h4>
                    <div style="font-size: 14px; color: #666; margin-bottom: 4px;">${locationDisplay}</div>
                    <div style="font-size: 13px; color: #999;">
                        Caught by <strong>${catchData.catcherName || 'Anonymous'}</strong> • ${timeAgo}
                    </div>
                    ${isSecret ? '<div style="display: inline-block; background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%); color: white; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: bold; margin-top: 8px;">SECRET SPOT</div>' : ''}
                </div>
            </div>
        `;
    }).join('');
    
    // Apply smart aspect ratio detection to activity feed images
    setTimeout(() => {
        document.querySelectorAll('.activity-feed-photo').forEach(img => {
            img.onload = function() {
                const aspectRatio = this.naturalWidth / this.naturalHeight;
                
                if (aspectRatio < 0.9) {
                    // Portrait (vertical) - width < height
                    this.classList.add('portrait');
                } else if (aspectRatio > 0.9 && aspectRatio < 1.1) {
                    // Square
                    this.classList.add('square');
                } else {
                    // Landscape (horizontal)
                    this.classList.add('landscape');
                }
            };
            
            // Trigger onload if image is already cached
            if (img.complete) {
                img.onload();
            }
        });
    }, 100);
    
    // Attach click listeners
    document.querySelectorAll('.catch-card').forEach((card, index) => {
        card.addEventListener('click', () => {
            if (window.catchModal) {
                const catchData = catches[index];
                window.catchModal.open({
                    photoURL: catchData.photo,
                    species: catchData.species,
                    weight: catchData.weight,
                    location: catchData.locationName || 'Unknown',
                    date: catchData.timestamp?.toDate() || new Date(),
                    catcher: catchData.catcherName || 'Anonymous',
                    privacy: catchData.privacy,
                    gps: catchData.location, // GPS coordinates for navigation
                    waterTemp: catchData.waterTemp,
                    tide: catchData.tide,
                    windSpeed: catchData.windSpeed,
                    windDirection: catchData.windDirection,
                    bait: catchData.bait,
                    time: catchData.time
                });
            }
        });
    });
}

function renderBiggestCatch(catches) {
    if (catches.length === 0) return;
    
    // Get catches from this week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const weekCatches = catches.filter(c => {
        const catchTime = c.timestamp?.toDate() || new Date();
        return catchTime >= oneWeekAgo;
    });
    
    if (weekCatches.length === 0) return;
    
    // Find biggest by weight
    const biggest = weekCatches.reduce((max, c) => c.weight > max.weight ? c : max, weekCatches[0]);
    
    const section = document.getElementById('biggest-catch-section');
    const content = document.getElementById('biggest-catch-content');
    
    const isSecret = biggest.privacy === 'secret';
    const locationDisplay = isSecret ? `${biggest.locationName || 'Unknown'} 🔒` : `${biggest.locationName || 'Unknown'} 📍`;
    
    content.innerHTML = `
        ${biggest.photo ? 
            `<img src="${biggest.photo}" class="biggest-catch-photo" alt="${biggest.species}">` : 
            `<div style="width: 150px; height: 150px; background: rgba(255,255,255,0.2); border-radius: 12px; border: 4px solid white; display: flex; align-items: center; justify-content: center; font-size: 64px;">🏆</div>`
        }
        <div style="flex: 1;">
            <h4 style="font-size: 28px; margin: 0 0 8px 0;">${biggest.species} - ${biggest.weight}kg</h4>
            <div style="font-size: 16px; opacity: 0.95; margin-bottom: 4px;">${locationDisplay}</div>
            <div style="font-size: 14px; opacity: 0.9;">Caught by <strong>${biggest.catcherName || 'Anonymous'}</strong></div>
        </div>
    `;
    
    // Make clickable
    content.style.cursor = 'pointer';
    content.style.transition = 'transform 0.2s';
    content.addEventListener('click', () => {
        if (window.catchModal) {
            window.catchModal.open({
                photoURL: biggest.photo,
                species: biggest.species,
                weight: biggest.weight,
                location: biggest.locationName || 'Unknown',
                date: biggest.timestamp?.toDate() || new Date(),
                catcher: biggest.catcherName || 'Anonymous',
                privacy: biggest.privacy,
                gps: biggest.location, // GPS coordinates for navigation
                waterTemp: biggest.waterTemp,
                tide: biggest.tide,
                windSpeed: biggest.windSpeed,
                windDirection: biggest.windDirection,
                bait: biggest.bait,
                time: biggest.time
            });
        }
    });
    content.addEventListener('mouseenter', () => {
        content.style.transform = 'scale(1.02)';
    });
    content.addEventListener('mouseleave', () => {
        content.style.transform = '';
    });
    
    // Apply smart aspect ratio detection to biggest catch image
    setTimeout(() => {
        const img = document.querySelector('.biggest-catch-photo');
        if (img) {
            img.onload = function() {
                const aspectRatio = this.naturalWidth / this.naturalHeight;
                
                if (aspectRatio < 0.9) {
                    // Portrait (vertical)
                    this.classList.add('portrait');
                } else if (aspectRatio > 0.9 && aspectRatio < 1.1) {
                    // Square
                    this.classList.add('square');
                } else {
                    // Landscape (horizontal)
                    this.classList.add('landscape');
                }
            };
            
            // Trigger onload if image is already cached
            if (img.complete) {
                img.onload();
            }
        }
    }, 100);
    
    section.style.display = 'block';
}

function renderHotSpots(catches) {
    const list = document.getElementById('hot-spots-list');
    
    if (catches.length === 0) {
        list.innerHTML = '<div style="text-align: center; padding: 20px; color: #999;">No catches yet</div>';
        return;
    }
    
    // Count catches per location
    const spotCounts = {};
    catches.forEach(c => {
        const location = c.locationName || 'Unknown';
        spotCounts[location] = (spotCounts[location] || 0) + 1;
    });
    
    // Sort by count
    const sorted = Object.entries(spotCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5); // Top 5
    
    list.innerHTML = sorted.map(([location, count], index) => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #eee;">
            <div>
                <div style="font-size: 16px; color: var(--navy-blue); font-weight: bold;">${index + 1}. ${location}</div>
            </div>
            <div style="background: ${index === 0 ? '#e74c3c' : '#f39c12'}; color: white; padding: 6px 12px; border-radius: 20px; font-size: 14px; font-weight: bold;">
                ${count} ${count === 1 ? 'catch' : 'catches'}
            </div>
        </div>
    `).join('');
}

function getTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
}
