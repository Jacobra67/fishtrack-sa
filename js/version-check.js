// Version Checker - Auto-detect updates and prompt user to refresh
// Prevents users from being stuck on old cached versions
// Fixed: Reads version from HTML meta tag (less cached than JS)

const VERSION_CHECK_INTERVAL = 60000; // Check every 60 seconds
const STORAGE_KEY = 'fishtrack_current_version';

class VersionChecker {
    constructor() {
        // Read version from HTML meta tag (survives JS caching!)
        const metaVersion = document.querySelector('meta[name="app-version"]');
        this.currentVersion = metaVersion ? metaVersion.content : null;
        
        // If no meta tag found, disable version checking
        if (!this.currentVersion) {
            console.warn('⚠️ Version meta tag not found - version checking disabled');
            console.warn('   Add <meta name="app-version" content="vX.X.X"> to HTML <head>');
            return; // Don't init if we can't detect version
        }
        
        console.log('🔍 Version Checker v2.1 - Reading from meta tag');
        console.log('   Current version:', this.currentVersion);
        
        this.init();
    }

    async init() {
        console.log('🔍 Version Checker initialized. Current:', this.currentVersion);
        
        // Check on page load
        await this.checkForUpdates();
        
        // Check periodically (every 60 seconds)
        setInterval(() => this.checkForUpdates(), VERSION_CHECK_INTERVAL);
        
        // Check when tab becomes visible (user returns to app)
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.checkForUpdates();
            }
        });
    }

    async checkForUpdates() {
        try {
            console.log('🔄 Checking for updates...');
            
            // Fetch latest version from server (AGGRESSIVE cache bypass)
            const timestamp = Date.now();
            const response = await fetch(`/version.txt?v=${timestamp}`, {
                cache: 'no-store',
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            });
            
            if (!response.ok) {
                console.warn('⚠️ Could not check version (server returned', response.status, ')');
                return;
            }
            
            const latestVersion = (await response.text()).trim();
            
            console.log('📊 Version comparison:');
            console.log('   HTML meta tag:', this.currentVersion);
            console.log('   Server version.txt:', latestVersion);
            
            // Compare versions
            if (latestVersion !== this.currentVersion) {
                console.log('🚨 VERSION MISMATCH DETECTED!');
                console.log('   You are on:', this.currentVersion);
                console.log('   Latest is:', latestVersion);
                
                this.promptUpdate(latestVersion);
            } else {
                console.log('✅ Versions match - app is up to date');
            }
            
        } catch (error) {
            console.error('❌ Version check failed:', error);
        }
    }

    promptUpdate(newVersion) {
        // Only show banner once per session
        if (this.updatePrompted) {
            console.log('⏭️ Update already prompted this session, skipping...');
            return;
        }
        
        this.updatePrompted = true;
        
        // Show prominent update banner
        this.showUpdateBanner(newVersion);
        
        // Store that an update is available
        localStorage.setItem('fishtrack_update_available', newVersion);
    }

    showUpdateBanner(newVersion) {
        // Check if banner already exists
        if (document.getElementById('updateBanner')) return;
        
        console.log('🚨 SHOWING UPDATE BANNER');
        
        // Create banner HTML
        const banner = document.createElement('div');
        banner.id = 'updateBanner';
        banner.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: linear-gradient(135deg, #ff7043 0%, #f4511e 100%);
            color: white;
            padding: 20px;
            text-align: center;
            font-weight: bold;
            font-size: 18px;
            z-index: 99999;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            cursor: pointer;
            animation: slideDown 0.3s ease;
        `;
        
        let countdown = 10;
        banner.innerHTML = `
            <div style="max-width: 600px; margin: 0 auto;">
                <div style="font-size: 32px; margin-bottom: 8px;">🔄</div>
                <div style="font-size: 18px; margin-bottom: 8px;">
                    New version available (${newVersion})
                </div>
                <div style="font-size: 14px; opacity: 0.9;">
                    Tap to update now • Auto-updating in <span id="countdown">${countdown}</span>s
                </div>
            </div>
        `;
        
        // Add animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideDown {
                from { transform: translateY(-100%); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
        
        // Click to reload immediately
        banner.addEventListener('click', () => this.forceUpdate());
        
        // Auto-reload after 10 seconds
        const countdownEl = banner.querySelector('#countdown');
        const interval = setInterval(() => {
            countdown--;
            if (countdownEl) countdownEl.textContent = countdown;
            
            if (countdown <= 0) {
                clearInterval(interval);
                console.log('⏰ Auto-updating now...');
                this.forceUpdate();
            }
        }, 1000);
        
        // Insert at top of body
        document.body.insertBefore(banner, document.body.firstChild);
        
        console.log('📢 Update banner displayed - Auto-reload in 10s');
    }

    forceUpdate() {
        console.log('🔄 Forcing update - Clearing cache and reloading...');
        
        // Clear service worker cache
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(registrations => {
                registrations.forEach(registration => {
                    registration.unregister();
                    console.log('🗑️ Service worker unregistered');
                });
            });
        }
        
        // Clear localStorage version flag
        localStorage.removeItem('fishtrack_update_available');
        
        // Hard reload (bypass cache)
        window.location.reload(true);
    }
}

// Initialize version checker ONLY after DOM is fully loaded
function initVersionChecker() {
    // Small delay to ensure meta tags are parsed
    setTimeout(() => {
        window.versionChecker = new VersionChecker();
    }, 100);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initVersionChecker);
} else {
    initVersionChecker();
}
