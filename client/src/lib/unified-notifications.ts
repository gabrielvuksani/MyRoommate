/**
 * Unified Enterprise Notification System for myRoommate
 * Handles ALL app notifications: messages, chores, expenses, calendar events
 * Works seamlessly in PWA, browser, background, and foreground states
 */

import { queryClient } from './queryClient';

export interface UnifiedNotificationPayload {
  type: 'message' | 'chore' | 'expense' | 'calendar' | 'household';
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: {
    type: string;
    id?: string;
    householdId?: string;
    url: string;
    [key: string]: any;
  };
  userId: string;
  householdId?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  silent?: boolean;
  vibrate?: number[];
  requireInteraction?: boolean;
}

export interface NotificationSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

class UnifiedNotificationService {
  private static instance: UnifiedNotificationService;
  private swRegistration: ServiceWorkerRegistration | null = null;
  private pushSubscription: PushSubscription | null = null;
  private isSubscribed = false;
  private retryCount = 0;
  private maxRetries = 5;
  private retryDelay = 1000; // Start with 1 second
  private isInitializing = false;

  private constructor() {
    this.initializeService();
  }

  static getInstance(): UnifiedNotificationService {
    if (!UnifiedNotificationService.instance) {
      UnifiedNotificationService.instance = new UnifiedNotificationService();
    }
    return UnifiedNotificationService.instance;
  }

  private async initializeService(): Promise<void> {
    if (this.isInitializing) return;
    this.isInitializing = true;

    try {
        // Check if service worker and notifications are supported
      if (typeof navigator === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.log('Service Worker or Push messaging not supported');
        return;
      }

      // Register service worker with enhanced iOS PWA support
      await this.registerServiceWorker();
      
      // Set up push notifications if permission granted
      if (Notification.permission === 'granted') {
        await this.setupPushNotifications();
      }

      this.isInitializing = false;
    } catch (error) {
      console.error('Failed to initialize notification service:', error);
      this.isInitializing = false;
      
      // Retry with exponential backoff if not at max retries
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        const delay = this.retryDelay * Math.pow(2, this.retryCount - 1);
        setTimeout(() => this.initializeService(), delay);
      }
    }
  }

  private async registerServiceWorker(): Promise<void> {
    try {
      // Enhanced service worker registration with update handling
      this.swRegistration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none' // Always check for updates
      });

      // Handle service worker updates
      this.swRegistration.addEventListener('updatefound', () => {
        const newWorker = this.swRegistration!.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker available, skip waiting and reload
              newWorker.postMessage({ action: 'skipWaiting' });
            }
          });
        }
      });

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'notification-click') {
          // Handle notification clicks
          this.handleNotificationClick(event.data);
        }
      });

      // Wait for service worker to be ready and controlling the page
      await navigator.serviceWorker.ready;
      
      // Ensure service worker is controlling the page (critical for iOS PWA)
      if (!navigator.serviceWorker.controller) {
        // If no controller, reload to get the service worker to control the page
        window.location.reload();
        return;
      }

      console.log('Service Worker registered and controlling page');
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      throw error;
    }
  }

  private async setupPushNotifications(): Promise<void> {
    if (!this.swRegistration) {
      throw new Error('Service Worker not registered');
    }

    try {
      // Check for existing subscription
      this.pushSubscription = await this.swRegistration.pushManager.getSubscription();
      
      if (!this.pushSubscription) {
        // Create new subscription
        const subscription = await this.swRegistration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(
            'BNxVjzHNfQ7gW6fE8a9O1V2cB3pL4sT8kJ6mR9nA5wQ7xM2vE3gH8sL9pK4tF6bN8mR5wA3eT7yJ1cF9gL2sK6nP9'
          )
        });
        
        this.pushSubscription = subscription;
      }

      // Send subscription to server
      await this.sendSubscriptionToServer(this.pushSubscription);
      this.isSubscribed = true;
      this.retryCount = 0; // Reset retry count on success
      
    } catch (error) {
      console.error('Failed to set up push notifications:', error);
      throw error;
    }
  }

  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    try {
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          userAgent: navigator.userAgent,
          timestamp: Date.now()
        }),
      });

      if (!response.ok) {
        throw new Error(`Subscription failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('Push subscription successful:', result.message);
    } catch (error) {
      console.error('Failed to send subscription to server:', error);
      throw error;
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  private handleNotificationClick(data: any): void {
    // Focus the window when notification is clicked
    if (typeof window === 'undefined') {
      // Running in service worker context
      return;
    }
    
    // Focus window if minimized
    if (document.hidden) {
      window.focus();
    }
    
    // Navigate to the relevant page
    if (data.url) {
      window.location.href = data.url;
    }
  }

  // Public API for requesting notification permission
  async requestPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      await this.setupPushNotifications();
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        await this.setupPushNotifications();
        return true;
      }
    }

    return false;
  }

  // Unified notification sender for ALL app events
  async sendNotification(payload: UnifiedNotificationPayload): Promise<boolean> {
    try {
      // Only show notifications if app is in background or user is not focused
      const shouldShowNotification = document.hidden || !document.hasFocus();
      
      if (!shouldShowNotification && !payload.requireInteraction) {
        // App is in foreground, just invalidate relevant queries for real-time updates
        this.invalidateQueries(payload.type);
        return true;
      }

      // Check if notifications are supported and permitted
      if (typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') {
        console.log('Notifications not available or not permitted');
        return false;
      }

      // Create unified notification options
      const notificationOptions: NotificationOptions = {
        body: payload.body,
        icon: payload.icon || '/icon-192x192.png',
        badge: payload.badge || '/icon-72x72.png',
        tag: payload.tag || `${payload.type}-${Date.now()}`,
        data: payload.data || {},
        silent: payload.silent || false,
        requireInteraction: payload.requireInteraction || payload.priority === 'urgent',
        renotify: true,
        timestamp: Date.now()
      };

      // Show notification through service worker for background support
      if (this.swRegistration) {
        await this.swRegistration.showNotification(payload.title, notificationOptions);
      } else {
        // Fallback to regular notification
        new Notification(payload.title, notificationOptions);
      }

      // Always invalidate queries for real-time data updates
      this.invalidateQueries(payload.type);
      
      return true;
    } catch (error) {
      console.error('Failed to send notification:', error);
      return false;
    }
  }

  private invalidateQueries(type: string): void {
    // Invalidate relevant React Query caches based on notification type
    switch (type) {
      case 'message':
        queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
        break;
      case 'chore':
        queryClient.invalidateQueries({ queryKey: ['/api/chores'] });
        break;
      case 'expense':
        queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
        queryClient.invalidateQueries({ queryKey: ['/api/balance'] });
        break;
      case 'calendar':
        queryClient.invalidateQueries({ queryKey: ['/api/calendar'] });
        break;
      case 'household':
        queryClient.invalidateQueries({ queryKey: ['/api/households/current'] });
        break;
    }
  }

  // Convenience methods for each notification type
  async sendMessageNotification(senderName: string, message: string, householdName?: string): Promise<boolean> {
    return this.sendNotification({
      type: 'message',
      title: `💬 ${senderName}`,
      body: message.length > 100 ? message.substring(0, 100) + '...' : message,
      tag: 'new-message',
      data: {
        type: 'message',
        url: '/messages'
      },
      userId: 'current',
      priority: 'high',
      vibrate: [200, 100, 200]
    });
  }

  async sendChoreNotification(choreTitle: string, assignedBy: string, isCompletion = false): Promise<boolean> {
    return this.sendNotification({
      type: 'chore',
      title: isCompletion ? `✅ Chore Completed` : `📋 New Chore Assigned`,
      body: isCompletion ? `${assignedBy} completed: ${choreTitle}` : `${assignedBy} assigned you: ${choreTitle}`,
      tag: 'chore-update',
      data: {
        type: 'chore',
        url: '/chores'
      },
      userId: 'current',
      priority: 'normal',
      vibrate: [100, 50, 100]
    });
  }

  async sendExpenseNotification(expenseTitle: string, amount: number, createdBy: string): Promise<boolean> {
    return this.sendNotification({
      type: 'expense',
      title: `💰 New Expense Added`,
      body: `${createdBy} added "${expenseTitle}" for $${amount.toFixed(2)}`,
      tag: 'expense-added',
      data: {
        type: 'expense',
        url: '/expenses'
      },
      userId: 'current',
      priority: 'normal',
      vibrate: [150, 75, 150]
    });
  }

  async sendCalendarNotification(eventTitle: string, createdBy: string, eventDate: string): Promise<boolean> {
    return this.sendNotification({
      type: 'calendar',
      title: `📅 New Event Added`,
      body: `${createdBy} added "${eventTitle}" on ${eventDate}`,
      tag: 'calendar-event',
      data: {
        type: 'calendar',
        url: '/calendar'
      },
      userId: 'current',
      priority: 'normal',
      vibrate: [100, 100, 100]
    });
  }

  // Get notification status
  getStatus(): {
    supported: boolean;
    permission: NotificationPermission;
    subscribed: boolean;
    serviceWorkerReady: boolean;
  } {
    return {
      supported: 'Notification' in window && 'serviceWorker' in navigator,
      permission: 'Notification' in window ? Notification.permission : 'denied',
      subscribed: this.isSubscribed,
      serviceWorkerReady: !!this.swRegistration
    };
  }

  // Test notification function
  async sendTestNotification(): Promise<boolean> {
    return this.sendNotification({
      type: 'message',
      title: '🧪 Test Notification',
      body: 'myRoommate notifications are working perfectly! This test includes messages, chores, expenses, and calendar events.',
      tag: 'test-notification',
      data: {
        type: 'test',
        url: '/'
      },
      userId: 'current',
      priority: 'normal',
      requireInteraction: true,
      vibrate: [200, 100, 200, 100, 200]
    });
  }
}

// Export singleton instance
export const unifiedNotificationService = UnifiedNotificationService.getInstance();