// Service Worker for myRoommate PWA
// Handles background push notifications, caching, and offline functionality

const CACHE_NAME = 'myroommate-v2'; // Updated for unified notification system
const STATIC_CACHE_URLS = [
  '/',
  '/auth',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-72x72.png'
];

// Install event - cache static resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_CACHE_URLS))
      .then(() => self.skipWaiting())
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
    }).then(() => self.clients.claim())
  );
});

// Push event - handle background push notifications
self.addEventListener('push', (event) => {
  let notificationData = {};
  
  try {
    if (event.data) {
      notificationData = event.data.json();
    }
  } catch (error) {
    console.error('Failed to parse push data:', error);
    notificationData = {
      title: 'myRoommate',
      body: 'You have a new notification',
      icon: '/icon-192x192.png'
    };
  }

  // Enhanced notification options for unified system
  const options = {
    body: notificationData.body || 'You have a new notification',
    icon: notificationData.icon || '/icon-192x192.png',
    badge: notificationData.badge || '/icon-72x72.png',
    tag: notificationData.tag || `myroommate-${Date.now()}`,
    data: {
      timestamp: Date.now(),
      type: notificationData.type || 'general',
      url: '/', // Always open to home page
      ...notificationData.data
    },
    requireInteraction: notificationData.requireInteraction || false,
    vibrate: notificationData.vibrate || [200, 100, 200],
    silent: notificationData.silent || false,
    renotify: true,
    timestamp: Date.now(),
    dir: 'ltr',
    lang: 'en'
  };

  // Show notification
  event.waitUntil(
    self.registration.showNotification(
      notificationData.title || 'myRoommate',
      options
    )
  );
});

// Notification click event - handle user interaction
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event.notification.tag);
  
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  // Focus or open the app when notification is clicked
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        // Try to focus existing window
        for (const client of clients) {
          if (client.url.includes(self.location.origin)) {
            return client.focus();
          }
        }
        
        // Open new window if none exists
        return self.clients.openWindow('/');
      })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Background sync:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Handle offline actions when coming back online
      handleBackgroundSync()
    );
  }
});

// Message event - handle messages from main app
self.addEventListener('message', (event) => {
  console.log('Service Worker received message:', event.data);
  
  if (event.data && event.data.type === 'CACHE_CLEAR') {
    // Clear caches when requested
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }
});

// Helper function for background sync
async function handleBackgroundSync() {
  try {
    // This could handle queued actions like messages, chores, etc.
    console.log('Handling background sync...');
    
    // You could store offline actions in IndexedDB and replay them here
    // For now, we'll just log that sync is happening
    
    return Promise.resolve();
  } catch (error) {
    console.error('Background sync failed:', error);
    throw error;
  }
}

// Fetch event - handle network requests with cache fallback
self.addEventListener('fetch', (event) => {
  // Only handle GET requests for performance
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and non-http requests
  if (!event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
      .catch(() => {
        // Fallback for offline scenarios
        if (event.request.destination === 'document') {
          return caches.match('/');
        }
      })
  );
});

console.log('Service Worker loaded and ready for push notifications');