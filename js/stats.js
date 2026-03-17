// FishTrack SA - Live Stats
// Updates landing page stats from Firebase

// Placeholder for now (will connect Firebase later)
// For demo, we'll use static data that looks live

function updateStats() {
    // Simulate live data
    const totalCatches = 247 + Math.floor(Math.random() * 10);
    const todayHotspot = `${Math.floor(Math.random() * 15) + 10} Galjoen`;
    
    document.getElementById('totalCatches').textContent = totalCatches;
    document.getElementById('todayHotspot').textContent = todayHotspot;
}

// Update stats on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateStats);
} else {
    updateStats();
}

// Refresh stats every 30 seconds
setInterval(updateStats, 30000);
