// Version Checker v3.1 - FIXED: Prevents infinite reload loops
// Checks version.txt periodically but ONLY reloads once per session

const VERSION_CHECK_INTERVAL = 60000; // Check every 60 seconds (reduced from 30s)
const CURRENT_VERSION_META = document.querySelector('meta[name="app-version"]');
const CURRENT_VERSION = CURRENT_VERSION_META ? CURRENT_VERSION_META.content : null;

console.log('🔍 Version Checker v3.1 (Loop Protection) initialized');
console.log('📋 Current version from meta tag:', CURRENT_VERSION);

class SafeVersionChecker {
    constructor() {
        if (!CURRENT_VERSION) {
            console.warn('⚠️ No app-version meta tag found - update checking disabled');
            return;
        }
        
        this.currentVersion = CURRENT_VERSION;
        this.updatePrompted = false;
        this.checkCount = 0;
        
        // CRITICAL FIX: Check if we just reloaded (prevents infinite loop)
        const justReloaded = sessionStorage.getItem('fishtrack_just_reloaded');
        const reloadTime = sessionStorage.getItem('fishtrack_reload_time');
        
        if (justReloaded === 'true') {
            const timeSinceReload = Date.now() - parseInt(reloadTime || '0');
            
            if (timeSinceReload < 10000) { // Within 10 seconds of reload
                console.log('🛑 LOOP PROTECTION: Just reloaded, skipping version check for 5 minutes');
                sessionStorage.removeItem('fishtrack_just_reloaded');
                
                // Don't check for updates for 5 minutes after a forced reload
                setTimeout(() => {
                    console.log('✅ Loop protection expired, resuming version checks');
                    this.startChecking();
                }, 300000); // 5 minutes
                return;
            }
        }
        
        // Clear reload flags (if we got here, reload was successful)
        sessionStorage.removeItem('fishtrack_just_reloaded');
        sessionStorage.removeItem('fishtrack_reload_time');
        
        // Start normal checking
        this.startChecking();
    }
    
    startChecking() {
        // Listen for service worker updates
        this.listenForSWUpdates();
        
        // Wait 5 seconds before first check (let page fully load)
        setTimeout(() => this.checkForUpdates(), 5000);
        
        // Check every 60 seconds
        setInterval(() => this.checkForUpdates(), VERSION_CHECK_INTERVAL);
        
        // Check when tab becomes visible (but not immediately)
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                console.log('👀 Tab visible - checking for updates in 3s...');
                setTimeout(() => this.checkForUpdates(), 3000);
            }
        });
    }
    
    listenForSWUpdates() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', event => {
                if (event.data && event.data.type === 'SW_UPDATED') {
                    console.log('📢 Service Worker updated! New version:', event.data.version);
                    this.promptUpdate(event.data.version);
                }
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
                console.log('🚨 VERSION MISMATCH - UPDATE AVAILABLE');
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
            console.log('⏭️ Update already prompted this session');
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
            background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
            color: white;
            padding: 20px;
            text-align: center;
            font-weight: bold;
            font-size: 16px;
            z-index: 999999;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
            animation: slideDown 0.4s ease-out;
        `;
        
        banner.innerHTML = `
            <div style="max-width: 600px; margin: 0 auto;">
                <div style="font-size: 36px; margin-bottom: 10px;">🆕</div>
                <div style="font-size: 18px; font-weight: bold; margin-bottom: 8px;">
                    New version available!
                </div>
                <div style="font-size: 15px; opacity: 0.95; margin-bottom: 15px;">
                    Version ${newVersion} is ready
                </div>
                <button id="updateNowBtn" style="
                    background: white;
                    color: #2980b9;
                    border: none;
                    padding: 12px 30px;
                    font-size: 16px;
                    font-weight: bold;
                    border-radius: 8px;
                    cursor: pointer;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                ">
                    Update Now
                </button>
                <button id="updateLaterBtn" style="
                    background: transparent;
                    color: white;
                    border: 2px solid white;
                    padding: 12px 30px;
                    font-size: 16px;
                    font-weight: bold;
                    border-radius: 8px;
                    cursor: pointer;
                    margin-left: 10px;
                ">
                    Later
                </button>
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
        
        // Event listeners
        banner.querySelector('#updateNowBtn').addEventListener('click', () => {
            console.log('👆 User clicked Update Now');
            this.forceUpdate();
        });
        
        banner.querySelector('#updateLaterBtn').addEventListener('click', () => {
            console.log('👆 User clicked Later');
            banner.remove();
            this.updatePrompted = false; // Allow showing again next check
        });
        
        document.body.insertBefore(banner, document.body.firstChild);
        console.log('✅ Update banner shown - user decides when to update');
    }
    
    forceUpdate() {
        console.log('🔄 FORCING UPDATE - Setting reload protection...');
        
        // CRITICAL: Set flag to prevent infinite loop
        sessionStorage.setItem('fishtrack_just_reloaded', 'true');
        sessionStorage.setItem('fishtrack_reload_time', Date.now().toString());
        
        // Clear service worker cache
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
        
        // Show loading message
        document.body.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 100vh; background: #1a2840; color: white; flex-direction: column; font-family: Arial, sans-serif;">
                <div style="font-size: 60px; margin-bottom: 20px;">🔄</div>
                <div style="font-size: 24px; font-weight: bold; margin-bottom: 10px;">Updating...</div>
                <div style="font-size: 16px; opacity: 0.8;">Getting the latest version</div>
            </div>
        `;
        
        // Hard reload (with loop protection in place)
        setTimeout(() => {
            window.location.reload(true);
        }, 500);
    }
}

// Initialize (wait for DOM)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.versionChecker = new SafeVersionChecker();
    });
} else {
    window.versionChecker = new SafeVersionChecker();
}
