/**
 * Enhanced Service Worker for myRoommate PWA
 * Handles all unified notifications: messages, chores, expenses, calendar events
 * Optimized for iOS PWA and cross-platform compatibility
 */

const CACHE_NAME = 'myroommate-v1';
const OFFLINE_URL = '/offline.html';

// Enhanced iOS PWA notification event handling
self.addEventListener('push', function(event) {
  console.log('Push event received');
  
  if (!event.data) {
    console.log('Push event has no data');
    return;
  }

  try {
    const data = event.data.json();
    console.log('Push data:', data);

    // Enhanced notification options for all app events
    const notificationOptions = {
      body: data.body || 'New notification from myRoommate',
      icon: data.icon || '/icon-192x192.png',
      badge: data.badge || '/icon-72x72.png',
      tag: data.tag || `notification-${Date.now()}`,
      data: data.data || {},
      vibrate: data.vibrate || [200, 100, 200],
      requireInteraction: data.requireInteraction || false,
      silent: data.silent || false,
      renotify: true,
      timestamp: Date.now(),
      // iOS PWA specific options
      image: data.image,
      actions: data.actions || []
    };

    // Enhanced actions based on notification type
    if (data.type === 'message') {
      notificationOptions.actions = [
        { action: 'reply', title: 'Reply', icon: '/icon-72x72.png' },
        { action: 'view', title: 'View Chat', icon: '/icon-72x72.png' }
      ];
    } else if (data.type === 'chore') {
      notificationOptions.actions = [
        { action: 'complete', title: 'Mark Done', icon: '/icon-72x72.png' },
        { action: 'view', title: 'View Chores', icon: '/icon-72x72.png' }
      ];
    } else if (data.type === 'expense') {
      notificationOptions.actions = [
        { action: 'settle', title: 'Settle Up', icon: '/icon-72x72.png' },
        { action: 'view', title: 'View Expenses', icon: '/icon-72x72.png' }
      ];
    } else if (data.type === 'calendar') {
      notificationOptions.actions = [
        { action: 'remind', title: 'Set Reminder', icon: '/icon-72x72.png' },
        { action: 'view', title: 'View Calendar', icon: '/icon-72x72.png' }
      ];
    }

    event.waitUntil(
      self.registration.showNotification(data.title || 'myRoommate', notificationOptions)
    );
  } catch (error) {
    console.error('Error parsing push data:', error);
    
    // Fallback notification
    event.waitUntil(
      self.registration.showNotification('myRoommate', {
        body: 'You have a new notification',
        icon: '/icon-192x192.png',
        badge: '/icon-72x72.png',
        tag: 'fallback-notification',
        data: { url: '/' }
      })
    );
  }
});

// Enhanced notification click handling with focus management
self.addEventListener('notificationclick', function(event) {
  console.log('Notification clicked:', event.notification.tag, event.action);
  
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';
  const action = event.action;

  // Handle different notification actions
  let targetUrl = urlToOpen;
  if (action === 'reply' || action === 'view') {
    targetUrl = '/messages';
  } else if (action === 'complete' || action === 'view') {
    targetUrl = '/chores';
  } else if (action === 'settle' || action === 'view') {
    targetUrl = '/expenses';
  } else if (action === 'remind' || action === 'view') {
    targetUrl = '/calendar';
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // Check if app is already open
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes(self.location.origin)) {
          // Focus existing window and navigate
          client.focus();
          client.postMessage({
            type: 'notification-click',
            url: targetUrl,
            action: action,
            data: event.notification.data
          });
          return;
        }
      }
      
      // Open new window if no existing window found
      return clients.openWindow(targetUrl);
    })
  );
});

// Background sync for offline actions
self.addEventListener('sync', function(event) {
  console.log('Background sync:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Handle background sync for offline actions
      handleBackgroundSync()
    );
  }
});

async function handleBackgroundSync() {
  // Implement background sync logic for offline actions
  console.log('Handling background sync');
}

// Enhanced caching strategy
self.addEventListener('install', function(event) {
  console.log('Service Worker installing');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll([
        '/',
        '/manifest.json',
        '/icon-192x192.png',
        '/icon-72x72.png',
        OFFLINE_URL
      ]);
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function(event) {
  console.log('Service Worker activating');
  
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// Network-first caching strategy for API calls
self.addEventListener('fetch', function(event) {
  if (event.request.url.includes('/api/')) {
    // Network-first for API calls
    event.respondWith(
      fetch(event.request).catch(function() {
        return caches.match(OFFLINE_URL);
      })
    );
  } else {
    // Cache-first for static resources
    event.respondWith(
      caches.match(event.request).then(function(response) {
        return response || fetch(event.request);
      })
    );
  }
});

// Handle messages from main thread
self.addEventListener('message', function(event) {
  if (event.data && event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});

console.log('Enhanced Service Worker loaded for myRoommate PWA');