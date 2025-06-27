interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
  silent?: boolean;
}

class NotificationService {
  private isSupported: boolean;
  private permission: NotificationPermission = 'default';

  constructor() {
    this.isSupported = 'Notification' in window && 'serviceWorker' in navigator;
    if (this.isSupported) {
      this.permission = Notification.permission;
    }
  }

  async requestPermission(): Promise<boolean> {
    if (!this.isSupported) {
      console.warn('Notifications not supported in this browser');
      return false;
    }

    if (this.permission === 'granted') {
      return true;
    }

    if (this.permission === 'denied') {
      console.warn('Notification permission was denied');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  async sendNotification(options: NotificationOptions): Promise<boolean> {
    if (!this.isSupported) {
      console.warn('Notifications not supported');
      return false;
    }

    if (this.permission !== 'granted') {
      const granted = await this.requestPermission();
      if (!granted) {
        return false;
      }
    }

    try {
      // Use service worker if available (better for PWA)
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        if (registration && registration.showNotification) {
          await registration.showNotification(options.title, {
            body: options.body,
            icon: options.icon || '/favicon.ico',
            badge: options.badge || '/favicon.ico',
            tag: options.tag || 'myroommate-notification',
            requireInteraction: options.requireInteraction || false,
            silent: options.silent || false,
            data: {
              timestamp: Date.now(),
              app: 'myRoommate'
            }
          } as any);
          return true;
        }
      }

      // Fallback to basic notification
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/favicon.ico',
        tag: options.tag || 'myroommate-notification',
        requireInteraction: options.requireInteraction || false,
        silent: options.silent || false
      });

      // Auto-close after 5 seconds unless requireInteraction is true
      if (!options.requireInteraction) {
        setTimeout(() => {
          notification.close();
        }, 5000);
      }

      return true;
    } catch (error) {
      console.error('Error sending notification:', error);
      return false;
    }
  }

  getPermissionStatus(): NotificationPermission {
    return this.permission;
  }

  isNotificationSupported(): boolean {
    return this.isSupported;
  }

  // Test notifications for different scenarios
  async sendTestNotification(): Promise<boolean> {
    return this.sendNotification({
      title: '🏠 myRoommate Test',
      body: 'Notifications are working perfectly! You\'ll get updates for messages, chores, and expenses.',
      requireInteraction: false
    });
  }

  async sendMessageNotification(senderName: string, message: string): Promise<boolean> {
    return this.sendNotification({
      title: `💬 ${senderName}`,
      body: message.length > 100 ? `${message.substring(0, 100)}...` : message,
      tag: 'new-message',
      requireInteraction: false
    });
  }

  async sendChoreNotification(title: string, assignee?: string): Promise<boolean> {
    return this.sendNotification({
      title: '✅ Chore Update',
      body: assignee ? `${assignee} completed: ${title}` : `New chore assigned: ${title}`,
      tag: 'chore-update',
      requireInteraction: false
    });
  }

  async sendExpenseNotification(title: string, amount: number, paidBy: string): Promise<boolean> {
    return this.sendNotification({
      title: '💰 New Expense',
      body: `${paidBy} paid $${amount.toFixed(2)} for ${title}`,
      tag: 'expense-update',
      requireInteraction: false
    });
  }
}

export const notificationService = new NotificationService();