// FishTrack Africa - Service Worker
// Auto-generated version - DO NOT EDIT MANUALLY
const CACHE_VERSION = 'v3.6.0-shareable-catches'; // Updated on each deploy
const CACHE_NAME = `fishtrack-${CACHE_VERSION}`;

const urlsToCache = [
  '/',
  '/index.html',
  '/log-catch.html',
  '/map.html',
  '/my-logbook.html',
  '/css/style.css',
  '/css/tide-wind.css',
  '/css/logger.css',
  '/css/weight-calculator.css',
  '/css/location-search.css',
  '/css/secret-spot.css',
  '/css/photo-editor.css',
  '/css/logbook.css',
  '/css/catch-modal.css',
  '/js/firebase-config.js',
  '/js/catch-logger.js',
  '/js/map.js',
  '/js/tide-wind.js',
  '/js/pwa-install.js',
  '/js/fish-weight-calculator.js',
  '/js/activity-feed.js',
  '/js/catch-modal.js',
  '/js/logbook.js',
  '/js/version-check.js',
  '/assets/logo-final-v2.png',
  '/assets/icon-192.png',
  '/assets/icon-512.png'
];

// Install event - cache assets IMMEDIATELY
self.addEventListener('install', event => {
  console.log(`[SW] Installing new version: ${CACHE_VERSION}`);
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('[SW] Skip waiting - activate immediately!');
        return self.skipWaiting(); // Force immediate activation
      })
  );
});

// Activate event - clean up old caches and take control IMMEDIATELY
self.addEventListener('activate', event => {
  console.log(`[SW] Activating new version: ${CACHE_VERSION}`);
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] 🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] ✅ Claiming all clients - force reload!');
      return self.clients.claim(); // Take control of all pages immediately
    }).then(() => {
      // Notify all clients to reload
      return self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          console.log('[SW] 📢 Notifying client to reload:', client.url);
          client.postMessage({
            type: 'SW_UPDATED',
            version: CACHE_VERSION
          });
        });
      });
    })
  );
});

// Listen for messages from pages (manual update check)
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] Received SKIP_WAITING message - activating now!');
    self.skipWaiting();
  }
});

// Fetch event - Smart caching strategy
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // CRITICAL: NEVER cache version.txt or sw.js
  if (url.pathname.includes('version.txt') || url.pathname.includes('sw.js')) {
    console.log('[SW] Bypassing cache for:', url.pathname);
    event.respondWith(
      fetch(event.request, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      })
    );
    return;
  }
  
  // Skip cross-origin requests (Firebase, external CDNs)
  if (!event.request.url.startsWith(self.location.origin)) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // Network-first for HTML, JS, CSS (always get latest)
  const isAppFile = url.pathname.match(/\.(html|js|css)$/);
  
  if (isAppFile) {
    event.respondWith(
      fetch(event.request, {
        cache: 'reload' // Force cache bypass
      })
        .then(response => {
          // Cache the fresh response
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache if offline
          console.log('[SW] Offline - serving from cache:', event.request.url);
          return caches.match(event.request);
        })
    );
  } else {
    // Cache-first for images, fonts (static assets)
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          if (response) {
            // Serve from cache, but update in background
            fetch(event.request).then(freshResponse => {
              if (freshResponse && freshResponse.status === 200) {
                caches.open(CACHE_NAME).then(cache => {
                  cache.put(event.request, freshResponse);
                });
              }
            }).catch(() => {});
            return response;
          }
          
          // Not in cache, fetch from network
          return fetch(event.request).then(response => {
            if (response && response.status === 200) {
              const responseToCache = response.clone();
              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, responseToCache);
              });
            }
            return response;
          });
        })
    );
  }
});

console.log(`[SW] Service Worker loaded - Version: ${CACHE_VERSION}`);
