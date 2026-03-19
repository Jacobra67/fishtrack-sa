// FishTrack Africa - Service Worker
// Version 1.3.0

const CACHE_NAME = 'fishtrack-v1.3';
const urlsToCache = [
  '/',
  '/index.html',
  '/log-catch.html',
  '/map.html',
  '/css/styles.css',
  '/css/tide-wind.css',
  '/js/firebase-config.js',
  '/js/catch-logger.js',
  '/js/map.js',
  '/js/tide-wind.js',
  '/js/pwa-install.js',
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

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    // For Firebase and external resources, try network first
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          console.log('[SW] Serving from cache:', event.request.url);
          return response;
        }

        console.log('[SW] Fetching from network:', event.request.url);
        return fetch(event.request).then(response => {
          // Don't cache if not a success response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });

          return response;
        });
      })
      .catch(() => {
        // Fallback for offline HTML pages
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      })
  );
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
