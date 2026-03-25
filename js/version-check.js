// Version Checker - Auto-detect updates and prompt user to refresh
// Prevents users from being stuck on old cached versions

const CURRENT_VERSION = 'v3.5.0-2026-03-25';
const VERSION_CHECK_INTERVAL = 60000; // Check every 60 seconds
const STORAGE_KEY = 'fishtrack_current_version';

class VersionChecker {
    constructor() {
        this.currentVersion = CURRENT_VERSION;
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
            // Fetch latest version from server (bypass cache)
            const response = await fetch('/version.txt?t=' + Date.now(), {
                cache: 'no-store',
                headers: {
                    'Cache-Control': 'no-cache'
                }
            });
            
            if (!response.ok) {
                console.warn('⚠️ Could not check version (server unreachable)');
                return;
            }
            
            const latestVersion = (await response.text()).trim();
            
            // Compare versions
            if (latestVersion !== this.currentVersion) {
                console.log('🎉 New version available!');
                console.log('   Current:', this.currentVersion);
                console.log('   Latest:', latestVersion);
                
                this.promptUpdate(latestVersion);
            } else {
                console.log('✅ App is up to date:', this.currentVersion);
            }
            
        } catch (error) {
            console.warn('⚠️ Version check failed:', error.message);
        }
    }

    promptUpdate(newVersion) {
        // Show prominent update banner
        this.showUpdateBanner(newVersion);
        
        // Store that an update is available
        localStorage.setItem('fishtrack_update_available', newVersion);
    }

    showUpdateBanner(newVersion) {
        // Check if banner already exists
        if (document.getElementById('updateBanner')) return;
        
        // Create banner HTML
        const banner = document.createElement('div');
        banner.id = 'updateBanner';
        banner.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: linear-gradient(135deg, #00CED1 0%, #008B8B 100%);
            color: white;
            padding: 16px;
            text-align: center;
            font-weight: bold;
            font-size: 16px;
            z-index: 99999;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            cursor: pointer;
            animation: slideDown 0.3s ease;
        `;
        
        banner.innerHTML = `
            <div style="max-width: 600px; margin: 0 auto; display: flex; align-items: center; justify-content: center; gap: 12px;">
                <span style="font-size: 24px;">🔄</span>
                <span>New version available (${newVersion}) - Tap to update!</span>
            </div>
        `;
        
        // Add animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideDown {
                from { transform: translateY(-100%); }
                to { transform: translateY(0); }
            }
        `;
        document.head.appendChild(style);
        
        // Click to reload
        banner.addEventListener('click', () => this.forceUpdate());
        
        // Insert at top of body
        document.body.insertBefore(banner, document.body.firstChild);
        
        console.log('📢 Update banner displayed');
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

// Initialize version checker on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.versionChecker = new VersionChecker();
    });
} else {
    window.versionChecker = new VersionChecker();
}
