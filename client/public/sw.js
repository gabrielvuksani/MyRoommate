// Service Worker for myRoommate PWA
const CACHE_NAME = 'myroommate-v1';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/src/main.tsx',
  '/src/index.css'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Handle theme changes and cache clearing for PWA
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'THEME_CHANGED') {
    // Update any cached theme-related resources
    const theme = event.data.theme;
    console.log('Service Worker: Theme changed to', theme);
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    // Clear all caches when refresh is requested (works for both PWA and website)
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            console.log('Service Worker: Clearing cache', cacheName);
            return caches.delete(cacheName);
          })
        );
      }).then(() => {
        console.log('Service Worker: All caches cleared');
        // Force service worker to skip waiting and become active
        return self.skipWaiting();
      }).then(() => {
        // Claim all clients to ensure immediate cache clearing
        return self.clients.claim();
      }).catch((error) => {
        console.error('Service Worker: Cache clearing failed', error);
      })
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // If app is already open, focus it
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        
        // If app is not open, open it
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
  );
});

// Handle push notifications (for future server-sent notifications)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      vibrate: [200, 100, 200],
      data: data.data || {},
      requireInteraction: false,
      tag: data.tag || 'myroommate-notification'
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});