// Version Checker v3.0 - Aggressive Update Detection
// Checks version.txt every 30 seconds and forces reload on mismatch

const VERSION_CHECK_INTERVAL = 30000; // Check every 30 seconds (aggressive)
const CURRENT_VERSION_META = document.querySelector('meta[name="app-version"]');
const CURRENT_VERSION = CURRENT_VERSION_META ? CURRENT_VERSION_META.content : null;

console.log('🔍 Version Checker v3.0 initialized');
console.log('📋 Current version from meta tag:', CURRENT_VERSION);

class AggressiveVersionChecker {
    constructor() {
        if (!CURRENT_VERSION) {
            console.warn('⚠️ No app-version meta tag found - update checking disabled');
            return;
        }
        
        this.currentVersion = CURRENT_VERSION;
        this.updatePrompted = false;
        this.checkCount = 0;
        
        // Listen for service worker updates
        this.listenForSWUpdates();
        
        // Check immediately on load
        setTimeout(() => this.checkForUpdates(), 2000);
        
        // Check every 30 seconds
        setInterval(() => this.checkForUpdates(), VERSION_CHECK_INTERVAL);
        
        // Check when tab becomes visible
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                console.log('👀 Tab visible - checking for updates...');
                this.checkForUpdates();
            }
        });
        
        // Check on focus
        window.addEventListener('focus', () => {
            console.log('🔍 Window focused - checking for updates...');
            this.checkForUpdates();
        });
    }
    
    listenForSWUpdates() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', event => {
                if (event.data && event.data.type === 'SW_UPDATED') {
                    console.log('📢 Service Worker updated! New version:', event.data.version);
                    this.forceUpdate();
                }
            });
            
            // Check for waiting service worker
            navigator.serviceWorker.ready.then(registration => {
                if (registration.waiting) {
                    console.log('⏳ Service worker waiting - activating now!');
                    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                }
                
                // Listen for new service workers
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    console.log('🆕 New service worker found - installing...');
                    
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            console.log('✅ New service worker installed - reloading!');
                            newWorker.postMessage({ type: 'SKIP_WAITING' });
                            setTimeout(() => this.forceUpdate(), 1000);
                        }
                    });
                });
            });
        }
    }
    
    async checkForUpdates() {
        this.checkCount++;
        
        try {
            console.log(`🔄 Version check #${this.checkCount}`);
            
            // Aggressive cache bypass
            const timestamp = Date.now();
            const random = Math.random();
            const response = await fetch(`/version.txt?v=${timestamp}&r=${random}`, {
                method: 'GET',
                cache: 'no-store',
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            });
            
            if (!response.ok) {
                console.warn('⚠️ Version check failed:', response.status);
                return;
            }
            
            const latestVersion = (await response.text()).trim();
            
            console.log('📊 Version comparison:');
            console.log('   Current:', this.currentVersion);
            console.log('   Latest:', latestVersion);
            
            if (latestVersion !== this.currentVersion) {
                console.log('🚨 VERSION MISMATCH - UPDATE NEEDED!');
                this.promptUpdate(latestVersion);
            } else {
                console.log('✅ Up to date');
            }
            
        } catch (error) {
            console.error('❌ Version check error:', error);
        }
    }
    
    promptUpdate(newVersion) {
        if (this.updatePrompted) {
            console.log('⏭️ Update already prompted');
            return;
        }
        
        this.updatePrompted = true;
        console.log('📢 SHOWING UPDATE BANNER');
        this.showUpdateBanner(newVersion);
    }
    
    showUpdateBanner(newVersion) {
        // Remove existing banner
        const existing = document.getElementById('updateBanner');
        if (existing) existing.remove();
        
        // Create banner
        const banner = document.createElement('div');
        banner.id = 'updateBanner';
        banner.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
            color: white;
            padding: 20px;
            text-align: center;
            font-weight: bold;
            font-size: 16px;
            z-index: 999999;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
            cursor: pointer;
            animation: slideDown 0.4s ease-out;
        `;
        
        let countdown = 5;
        banner.innerHTML = `
            <div style="max-width: 600px; margin: 0 auto;">
                <div style="font-size: 36px; margin-bottom: 10px;">🔄</div>
                <div style="font-size: 20px; font-weight: bold; margin-bottom: 8px;">
                    New version available!
                </div>
                <div style="font-size: 15px; opacity: 0.95; margin-bottom: 12px;">
                    ${newVersion} → Tap to update now
                </div>
                <div style="font-size: 14px; opacity: 0.9;">
                    Auto-updating in <span id="countdown" style="font-weight: bold; font-size: 18px;">${countdown}</span>s
                </div>
            </div>
        `;
        
        // Animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideDown {
                from { transform: translateY(-100%); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
        
        // Click to update
        banner.addEventListener('click', () => {
            console.log('👆 User clicked update banner');
            this.forceUpdate();
        });
        
        // Countdown
        const countdownEl = banner.querySelector('#countdown');
        const interval = setInterval(() => {
            countdown--;
            if (countdownEl) countdownEl.textContent = countdown;
            
            if (countdown <= 0) {
                clearInterval(interval);
                console.log('⏰ Countdown finished - forcing update');
                this.forceUpdate();
            }
        }, 1000);
        
        document.body.insertBefore(banner, document.body.firstChild);
        console.log('✅ Update banner shown - auto-reload in 5s');
    }
    
    forceUpdate() {
        console.log('🔄 FORCING UPDATE - Clearing everything and reloading...');
        
        // Unregister all service workers
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(registrations => {
                registrations.forEach(reg => {
                    console.log('🗑️ Unregistering service worker');
                    reg.unregister();
                });
            });
        }
        
        // Clear all caches
        if ('caches' in window) {
            caches.keys().then(names => {
                names.forEach(name => {
                    console.log('🗑️ Deleting cache:', name);
                    caches.delete(name);
                });
            });
        }
        
        // Clear localStorage update flag
        localStorage.removeItem('fishtrack_update_available');
        
        // Show loading message
        document.body.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 100vh; background: #1a2840; color: white; flex-direction: column; font-family: Arial, sans-serif;">
                <div style="font-size: 60px; margin-bottom: 20px;">🔄</div>
                <div style="font-size: 24px; font-weight: bold; margin-bottom: 10px;">Updating...</div>
                <div style="font-size: 16px; opacity: 0.8;">Getting the latest version</div>
            </div>
        `;
        
        // Hard reload
        setTimeout(() => {
            window.location.reload(true);
        }, 500);
    }
}

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.versionChecker = new AggressiveVersionChecker();
    });
} else {
    window.versionChecker = new AggressiveVersionChecker();
}
