// Service Worker for myRoommate PWA
// Handles background push notifications, caching, and offline functionality

const CACHE_NAME = 'myroommate-enterprise-v1';
const STATIC_CACHE_URLS = [
  '/',
  '/auth',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png'
];

// Enhanced iOS compatibility and background sync
const isIOSDevice = /iPad|iPhone|iPod/.test(self.navigator.userAgent || '');
let notificationPermissionGranted = false;

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

// Enhanced push event handler for iOS background notifications
self.addEventListener('push', (event) => {
  let notificationData = {};
  
  try {
    if (event.data) {
      notificationData = event.data.json();
    }
  } catch (error) {
    // Fallback notification
    notificationData = {
      title: 'myRoommate',
      body: 'You have a new notification',
      icon: '/icon-192x192.png'
    };
  }

  // Enhanced iOS-compatible notification options
  const options = {
    body: notificationData.body || 'You have a new notification',
    icon: notificationData.icon || '/icon-192x192.png',
    badge: notificationData.badge || '/icon-72x72.png',
    tag: notificationData.tag || `notification-${Date.now()}`,
    data: notificationData.data || { url: '/' },
    requireInteraction: true,
    silent: false,
    renotify: true,
    timestamp: Date.now(),
    dir: 'ltr',
    lang: 'en',
    actions: notificationData.actions || [
      {
        action: 'open',
        title: 'Open App',
        icon: '/icon-72x72.png'
      }
    ]
  };

  // iOS-specific enhancements
  if (isIOSDevice) {
    options.vibrate = [200, 100, 200];
    options.requireInteraction = true;
    // Force immediate display on iOS
    options.tag = `ios-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  } else {
    options.vibrate = [300, 100, 300, 100, 300];
  }

  // Enhanced promise handling for iOS reliability
  event.waitUntil(
    new Promise((resolve, reject) => {
      // Force immediate notification display
      self.registration.showNotification(
        notificationData.title || 'myRoommate',
        options
      ).then(() => {
        // Keep service worker alive for iOS
        setTimeout(resolve, 100);
      }).catch((error) => {
        console.error('Notification display failed:', error);
        resolve(); // Don't fail the entire event
      });
    })
  );
});

// Enhanced notification click handler for iOS PWA compatibility
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const notificationData = event.notification.data || {};
  const urlToOpen = notificationData.url || '/';
  const action = event.action;

  // Skip if dismiss action
  if (action === 'dismiss') {
    return;
  }

  event.waitUntil(
    (async () => {
      try {
        // Get all window clients
        const windowClients = await self.clients.matchAll({ 
          type: 'window', 
          includeUncontrolled: true 
        });

        // iOS-specific handling for PWA focus
        if (isIOSDevice) {
          // On iOS, always try to focus existing client first
          for (const client of windowClients) {
            if (client.url.includes(self.location.origin)) {
              try {
                await client.focus();
                // Send navigation message to existing client
                client.postMessage({
                  type: 'NOTIFICATION_CLICKED',
                  data: notificationData,
                  action: action,
                  url: urlToOpen
                });
                return;
              } catch (error) {
                console.error('Focus failed on iOS:', error);
              }
            }
          }
        } else {
          // Standard handling for other platforms
          for (const client of windowClients) {
            if (client.url.includes(self.location.origin)) {
              try {
                await client.focus();
                return;
              } catch (error) {
                console.error('Focus failed:', error);
              }
            }
          }
        }
        
        // If no existing window or focus failed, open new window
        if (self.clients.openWindow) {
          try {
            const newClient = await self.clients.openWindow(urlToOpen);
            // Send notification data to new window after it loads
            if (newClient) {
              setTimeout(() => {
                newClient.postMessage({
                  type: 'NOTIFICATION_CLICKED',
                  data: notificationData,
                  action: action,
                  url: urlToOpen
                });
              }, 1500); // Wait longer for client to fully load
            }
          } catch (error) {
            console.error('Failed to open window:', error);
            // Fallback - try to open root
            try {
              await self.clients.openWindow('/');
            } catch (fallbackError) {
              console.error('Fallback window open failed:', fallbackError);
            }
          }
        }
      } catch (error) {
        console.error('Notification click handler error:', error);
      }
    })()
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