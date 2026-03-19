// PWA Install Prompt
// Handles "Add to Home Screen" functionality

let deferredPrompt;
let installButton;

// Initialize PWA install prompt
function initPWAInstall() {
  // Check if already installed
  if (window.matchMedia('(display-mode: standalone)').matches) {
    console.log('PWA already installed');
    return;
  }

  // Create install button
  createInstallButton();

  // Listen for beforeinstallprompt event
  window.addEventListener('beforeinstallprompt', (e) => {
    console.log('beforeinstallprompt fired');
    e.preventDefault();
    deferredPrompt = e;
    showInstallButton();
  });

  // Listen for app installed event
  window.addEventListener('appinstalled', () => {
    console.log('PWA installed successfully');
    hideInstallButton();
    deferredPrompt = null;
  });
}

// Create the install button UI
function createInstallButton() {
  // Check if button already exists
  if (document.getElementById('pwa-install-btn')) return;

  const installBanner = document.createElement('div');
  installBanner.id = 'pwa-install-banner';
  installBanner.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(135deg, #1a2840 0%, #2a4060 100%);
    color: #e8dcc0;
    padding: 15px 25px;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    z-index: 9999;
    display: none;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    max-width: 90%;
    animation: slideUp 0.3s ease-out;
  `;

  installBanner.innerHTML = `
    <div style="text-align: center;">
      <div style="font-weight: bold; font-size: 16px; margin-bottom: 5px;">📲 Install FishTrack Africa</div>
      <div style="font-size: 13px; opacity: 0.9;">Get the app experience - works offline!</div>
    </div>
    <div style="display: flex; gap: 10px;">
      <button id="pwa-install-btn" style="
        background: #e8dcc0;
        color: #1a2840;
        border: none;
        padding: 10px 20px;
        border-radius: 8px;
        font-weight: bold;
        cursor: pointer;
        font-size: 14px;
      ">Install App</button>
      <button id="pwa-install-dismiss" style="
        background: transparent;
        color: #e8dcc0;
        border: 2px solid #e8dcc0;
        padding: 10px 20px;
        border-radius: 8px;
        font-weight: bold;
        cursor: pointer;
        font-size: 14px;
      ">Not Now</button>
    </div>
  `;

  // Add animation keyframes
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideUp {
      from {
        transform: translateX(-50%) translateY(100px);
        opacity: 0;
      }
      to {
        transform: translateX(-50%) translateY(0);
        opacity: 1;
      }
    }
  `;
  document.head.appendChild(style);

  document.body.appendChild(installBanner);

  // Install button click handler
  document.getElementById('pwa-install-btn').addEventListener('click', async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response: ${outcome}`);
    
    deferredPrompt = null;
    hideInstallButton();
  });

  // Dismiss button click handler
  document.getElementById('pwa-install-dismiss').addEventListener('click', () => {
    hideInstallButton();
    // Remember dismissal (show again in 7 days)
    localStorage.setItem('pwa-install-dismissed', Date.now());
  });

  installButton = installBanner;
}

// Show install button
function showInstallButton() {
  if (!installButton) return;

  // Check if user dismissed recently (within 7 days)
  const dismissed = localStorage.getItem('pwa-install-dismissed');
  if (dismissed) {
    const daysSinceDismissal = (Date.now() - parseInt(dismissed)) / (1000 * 60 * 60 * 24);
    if (daysSinceDismissal < 7) {
      console.log('Install prompt dismissed recently, not showing');
      return;
    }
  }

  installButton.style.display = 'flex';
}

// Hide install button
function hideInstallButton() {
  if (installButton) {
    installButton.style.display = 'none';
  }
}

// Check if running as PWA
function isPWA() {
  return window.matchMedia('(display-mode: standalone)').matches || 
         window.navigator.standalone === true;
}

// Show PWA-specific features when installed
if (isPWA()) {
  console.log('✅ Running as installed PWA');
  document.body.classList.add('pwa-installed');
}

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('✅ Service Worker registered:', registration.scope);
      })
      .catch(error => {
        console.error('❌ Service Worker registration failed:', error);
      });
  });
}

// Initialize install prompt
initPWAInstall();
