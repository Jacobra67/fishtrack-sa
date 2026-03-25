// FishTrack Africa - Service Worker
// Version 3.5.0 - Network-first for app files, cache-first for assets

const CACHE_NAME = 'fishtrack-v3.5.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/log-catch.html',
  '/map.html',
  '/css/styles.css',
  '/css/tide-wind.css',
  '/css/weight-calculator.css',
  '/css/location-search.css',
  '/css/secret-spot.css',
  '/js/firebase-config.js',
  '/js/catch-logger.js',
  '/js/map.js',
  '/js/tide-wind.js',
  '/js/pwa-install.js',
  '/js/fish-weight-calculator.js',
  '/js/activity-feed.js',
  '/assets/icon-192.png',
  '/assets/icon-512.png',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
];

// Install event - cache assets
self.addEventListener('install', event => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - Network-first for app files, cache-first for assets
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // ALWAYS bypass cache for version.txt (critical for update detection)
  if (url.pathname.includes('version.txt')) {
    event.respondWith(fetch(event.request));
    return;
  }
  
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    // For Firebase and external resources, try network first
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // Network-first strategy for HTML, JS, CSS (always check for updates)
  const isAppFile = url.pathname.match(/\.(html|js|css)$/);
  
  if (isAppFile) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Cache the fresh response
          if (response && response.status === 200 && response.type === 'basic') {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache if network fails (offline)
          console.log('[SW] Network failed, serving from cache:', event.request.url);
          return caches.match(event.request);
        })
    );
  } else {
    // Cache-first for images, fonts, etc. (static assets)
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          if (response) {
            return response;
          }
          return fetch(event.request).then(response => {
            if (response && response.status === 200 && response.type === 'basic') {
              const responseToCache = response.clone();
              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, responseToCache);
              });
            }
            return response;
          });
        })
        .catch(() => {
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        })
    );
  }
});

// Background sync for offline catch logging (future feature)
self.addEventListener('sync', event => {
  console.log('[SW] Background sync:', event.tag);
  if (event.tag === 'sync-catches') {
    event.waitUntil(syncCatches());
  }
});

async function syncCatches() {
  // TODO: Implement offline catch sync
  console.log('[SW] Syncing offline catches...');
}

// Push notifications (future feature)
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'FishTrack Africa';
  const options = {
    body: data.body || 'New fishing activity nearby!',
    icon: '/assets/icon-192.png',
    badge: '/assets/icon-192.png',
    vibrate: [200, 100, 200],
    data: data.url || '/'
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data)
  );
});
