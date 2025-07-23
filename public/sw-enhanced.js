// Enhanced Service Worker for myRoommate PWA
// Handles persistent background push notifications with maximum reliability

const CACHE_NAME = 'myroommate-v2';
const NOTIFICATION_URL_MAP = {
  'message': '/messages',
  'chore': '/chores', 
  'expense': '/expenses',
  'calendar': '/calendar',
  'household': '/'
};

// Enhanced notification display with immediate processing
self.addEventListener('push', (event) => {
  let notificationData = {};
  
  try {
    if (event.data) {
      notificationData = event.data.json();
    }
  } catch (error) {
    notificationData = {
      title: 'myRoommate',
      body: 'You have a new notification',
      icon: '/icon-192x192.png'
    };
  }

  const options = {
    body: notificationData.body || 'You have a new notification',
    icon: notificationData.icon || '/icon-192x192.png',
    badge: '/icon-72x72.png',
    tag: `notification-${Date.now()}`, // Unique tag for each notification
    data: {
      url: NOTIFICATION_URL_MAP[notificationData.type] || '/',
      timestamp: Date.now(),
      ...notificationData.data
    },
    requireInteraction: true,
    vibrate: [300, 100, 300],
    silent: false,
    renotify: true,
    persistent: true,
    actions: [
      {
        action: 'open',
        title: 'Open App'
      }
    ]
  };

  // Force immediate notification display with Promise.resolve
  event.waitUntil(
    Promise.resolve().then(() => 
      self.registration.showNotification(
        notificationData.title || 'myRoommate',
        options
      )
    )
  );
});

// Enhanced notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        // Try to focus existing window
        for (const client of clients) {
          if (client.url.includes(self.location.origin)) {
            client.postMessage({ type: 'NAVIGATE', url: targetUrl });
            return client.focus();
          }
        }
        
        // Open new window if none exists
        return self.clients.openWindow(targetUrl);
      })
  );
});

// Install and activate with improved reliability
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(['/']))
      .then(() => self.skipWaiting())
  );
});

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

// Background sync for maximum reliability
self.addEventListener('sync', (event) => {
  if (event.tag === 'push-subscription-sync') {
    event.waitUntil(syncPushSubscription());
  }
});

// Periodic subscription validation
async function syncPushSubscription() {
  try {
    const subscription = await self.registration.pushManager.getSubscription();
    if (subscription) {
      // Send subscription to server to ensure it's still valid
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription)
      });
    }
  } catch (error) {
    // Silent fail for background sync
  }
}

// Keep service worker alive with periodic ping
setInterval(() => {
  // Ping to keep service worker active
}, 29000); // Every 29 seconds (just under 30s timeout)