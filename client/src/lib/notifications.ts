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

  async showNotification(options: NotificationOptions, type: NotificationType = 'message', currentUserId?: string, actionUserId?: string): Promise<boolean> {
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

    // Don't show notifications if the current user is the one performing the action (avoid self-spam)
    // Skip this check for test notifications and manual notifications
    if (currentUserId && actionUserId && currentUserId === actionUserId && type !== 'household') {
      console.log('User performed action themselves, skipping notification to avoid spam');
      return false;
    }

    // Don't show notifications if document is focused (user is actively using the app)
    // Skip this check for test notifications
    if (document.hasFocus() && type !== 'household' && !options.tag?.includes('test')) {
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
      console.log('Creating notification:', options.title, notificationOptions);
      
      // Always use regular Notification API for better compatibility
      const notification = new Notification(options.title, notificationOptions);
      
      // Auto-close after 8 seconds
      setTimeout(() => {
        notification.close();
      }, 8000);

      // Handle click events
      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      console.log('Notification created successfully:', options.title);
      return true;
    } catch (error) {
      console.error('Error showing notification:', error);
      return false;
    }
  }

  // Predefined notification types for common app events
  async showMessageNotification(senderName: string, messageContent: string, currentUserId?: string, senderUserId?: string, householdName?: string): Promise<boolean> {
    return this.showNotification({
      title: `New message from ${senderName}`,
      body: householdName ? `${householdName}: ${messageContent}` : messageContent,
      tag: 'message-notification'
    }, 'message', currentUserId, senderUserId);
  }

  async showChoreNotification(title: string, currentUserId?: string, creatorUserId?: string, assignedTo?: string): Promise<boolean> {
    return this.showNotification({
      title: 'New Chore Assigned',
      body: assignedTo ? `${title} - Assigned to ${assignedTo}` : title,
      tag: 'chore-notification'
    }, 'chore', currentUserId, creatorUserId);
  }

  async showExpenseNotification(title: string, amount: number, paidBy: string, currentUserId?: string, creatorUserId?: string): Promise<boolean> {
    return this.showNotification({
      title: 'New Expense Added',
      body: `${title} - $${amount.toFixed(2)} paid by ${paidBy}`,
      tag: 'expense-notification'
    }, 'expense', currentUserId, creatorUserId);
  }

  async showCalendarNotification(title: string, startDate: string, currentUserId?: string, creatorUserId?: string): Promise<boolean> {
    const date = new Date(startDate).toLocaleDateString();
    return this.showNotification({
      title: 'New Calendar Event',
      body: `${title} on ${date}`,
      tag: 'calendar-notification'
    }, 'calendar', currentUserId, creatorUserId);
  }

  // Manual notification capability for admin/manual use
  async showCustomNotification(title: string, body: string, currentUserId?: string): Promise<boolean> {
    return this.showNotification({
      title,
      body,
      tag: 'custom-notification',
      requireInteraction: true
    }, 'household', currentUserId);
  }

  // Household-wide notifications (bypasses user filtering since it's manual)
  async showHouseholdNotification(title: string, body: string): Promise<boolean> {
    return this.showNotification({
      title,
      body,
      tag: 'household-announcement',
      requireInteraction: true,
      vibrate: [200, 100, 200]
    }, 'household');
  }

  // Test notification for debugging
  async showTestNotification(): Promise<boolean> {
    console.log('Starting test notification...');
    
    const hasPermission = await this.requestPermission();
    if (!hasPermission) {
      console.error('Permission denied for notifications');
      return false;
    }

    console.log('Permission granted, showing test notification');

    // Show immediate test notification
    try {
      const success = await this.showNotification({
        title: 'myRoommate Test',
        body: 'Notifications are working! 🎉',
        tag: 'test-notification',
        requireInteraction: false
      }, 'household'); // Use household type to bypass focus/spam checks

      if (success) {
        // Show additional demo notifications with delays
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

        for (let i = 0; i < notifications.length; i++) {
          setTimeout(() => {
            this.showNotification({
              title: notifications[i].title,
              body: notifications[i].body,
              tag: `test-demo-${i}`
            }, 'household'); // Use household type for demo notifications
          }, (i + 1) * 2000);
        }
      }

      return success;
    } catch (error) {
      console.error('Error showing test notification:', error);
      return false;
    }
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