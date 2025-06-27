/**
 * Cross-platform notification service for myRoommate
 * Supports PWA (iOS/Android) and web browsers (desktop/mobile)
 */

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  requireInteraction?: boolean;
  vibrate?: number[];
  silent?: boolean;
}

export type NotificationType = 'message' | 'chore' | 'expense' | 'calendar' | 'household';

export class NotificationService {
  private static instance: NotificationService;
  private permission: NotificationPermission = 'default';
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;

  private constructor() {
    this.checkPermission();
    this.registerServiceWorker();
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  private checkPermission(): void {
    if ('Notification' in window) {
      this.permission = Notification.permission;
    }
  }

  private async registerServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        this.serviceWorkerRegistration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered for notifications');
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (this.permission === 'granted') {
      return true;
    }

    if (this.permission === 'denied') {
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      this.permission = result;
      return result === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  getPermissionStatus(): NotificationPermission {
    return this.permission;
  }

  async showNotification(options: NotificationOptions, type: NotificationType = 'message'): Promise<boolean> {
    // Check if notifications are supported
    if (!('Notification' in window)) {
      console.warn('Notifications not supported');
      return false;
    }

    // Check permission
    if (this.permission !== 'granted') {
      console.warn('Notification permission not granted');
      return false;
    }

    // Don't show notifications if document is focused (user is actively using the app)
    if (document.hasFocus()) {
      console.log('Document has focus, skipping notification');
      return false;
    }

    const notificationOptions: NotificationOptions = {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: `myroommate-${type}`,
      requireInteraction: false,
      vibrate: [200, 100, 200],
      ...options,
      data: {
        type,
        timestamp: Date.now(),
        ...options.data
      }
    };

    try {
      // Use service worker for PWA if available
      if (this.serviceWorkerRegistration) {
        await this.serviceWorkerRegistration.showNotification(options.title, notificationOptions);
        console.log('Notification shown via Service Worker');
      } else {
        // Fallback to regular notification for web browsers
        const notification = new Notification(options.title, notificationOptions);
        
        // Auto-close after 5 seconds for non-PWA notifications
        setTimeout(() => {
          notification.close();
        }, 5000);

        // Handle click events for regular notifications
        notification.onclick = () => {
          window.focus();
          notification.close();
        };

        console.log('Notification shown via Web API');
      }
      return true;
    } catch (error) {
      console.error('Error showing notification:', error);
      return false;
    }
  }

  // Predefined notification types for common app events
  async showMessageNotification(senderName: string, messageContent: string, householdName?: string): Promise<boolean> {
    return this.showNotification({
      title: `New message from ${senderName}`,
      body: householdName ? `${householdName}: ${messageContent}` : messageContent,
      tag: 'message-notification'
    }, 'message');
  }

  async showChoreNotification(title: string, assignedTo?: string): Promise<boolean> {
    return this.showNotification({
      title: 'New Chore Assigned',
      body: assignedTo ? `${title} - Assigned to ${assignedTo}` : title,
      tag: 'chore-notification'
    }, 'chore');
  }

  async showExpenseNotification(title: string, amount: number, paidBy: string): Promise<boolean> {
    return this.showNotification({
      title: 'New Expense Added',
      body: `${title} - $${amount.toFixed(2)} paid by ${paidBy}`,
      tag: 'expense-notification'
    }, 'expense');
  }

  async showCalendarNotification(title: string, startDate: string): Promise<boolean> {
    const date = new Date(startDate).toLocaleDateString();
    return this.showNotification({
      title: 'New Calendar Event',
      body: `${title} on ${date}`,
      tag: 'calendar-notification'
    }, 'calendar');
  }

  async showHouseholdNotification(title: string, body: string): Promise<boolean> {
    return this.showNotification({
      title,
      body,
      tag: 'household-notification',
      requireInteraction: true
    }, 'household');
  }

  // Test notification for debugging
  async showTestNotification(): Promise<boolean> {
    const hasPermission = await this.requestPermission();
    if (!hasPermission) {
      return false;
    }

    const notifications = [
      {
        title: 'New Message',
        body: 'Hey! Can you pick up groceries on your way home?',
        type: 'message' as NotificationType
      },
      {
        title: 'Chore Reminder',
        body: 'Kitchen cleaning is due today',
        type: 'chore' as NotificationType
      },
      {
        title: 'Expense Added',
        body: 'Groceries - $47.82 paid by Alex',
        type: 'expense' as NotificationType
      }
    ];

    // Show notifications with delays
    for (let i = 0; i < notifications.length; i++) {
      setTimeout(() => {
        this.showNotification({
          title: notifications[i].title,
          body: notifications[i].body,
          tag: `test-${i}`
        }, notifications[i].type);
      }, i * 2000);
    }

    return true;
  }

  // Clear all notifications
  async clearAllNotifications(): Promise<void> {
    if (this.serviceWorkerRegistration) {
      const notifications = await this.serviceWorkerRegistration.getNotifications();
      notifications.forEach(notification => notification.close());
    }
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance();