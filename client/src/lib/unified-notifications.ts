/**
 * Unified Notification System
 * Handles both PWA push notifications and web browser notifications
 * Based on environment detection and user preferences
 */

import { pwaDetection, PWAEnvironment } from './pwa-detection';

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

export interface NotificationSettings {
  enabled: boolean;
  types: {
    message: boolean;
    chore: boolean;
    expense: boolean;
    calendar: boolean;
    household: boolean;
  };
}

export class UnifiedNotificationService {
  private static instance: UnifiedNotificationService;
  private permission: NotificationPermission = 'default';
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;
  private pushSubscription: PushSubscription | null = null;
  private settings: NotificationSettings;

  private constructor() {
    this.settings = this.loadSettings();
    this.checkPermission();
    this.initializeForEnvironment();
  }

  static getInstance(): UnifiedNotificationService {
    if (!UnifiedNotificationService.instance) {
      UnifiedNotificationService.instance = new UnifiedNotificationService();
    }
    return UnifiedNotificationService.instance;
  }

  private loadSettings(): NotificationSettings {
    const saved = localStorage.getItem('notification-settings');
    return saved ? JSON.parse(saved) : {
      enabled: true,
      types: {
        message: true,
        chore: true,
        expense: true,
        calendar: true,
        household: true
      }
    };
  }

  private saveSettings(): void {
    localStorage.setItem('notification-settings', JSON.stringify(this.settings));
  }

  private checkPermission(): void {
    if ('Notification' in window) {
      this.permission = Notification.permission;
    }
  }

  private async initializeForEnvironment(): Promise<void> {
    const strategy = pwaDetection.getNotificationStrategy();
    
    if (strategy === 'pwa') {
      await this.initializePWANotifications();
    } else if (strategy === 'web') {
      // Web notifications are ready when permission is granted
      console.log('Web notification strategy active');
    } else {
      console.log('No notification support for this environment');
    }
  }

  private async initializePWANotifications(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        this.serviceWorkerRegistration = await navigator.serviceWorker.register('/sw.js', {
          updateViaCache: 'none'
        });
        
        await navigator.serviceWorker.ready;
        
        if (!navigator.serviceWorker.controller) {
          window.location.reload();
          return;
        }
        
        await this.setupPushSubscription();
      } catch (error) {
        console.error('Failed to initialize PWA notifications:', error);
      }
    }
  }

  private async setupPushSubscription(): Promise<void> {
    if (!this.serviceWorkerRegistration) return;

    try {
      // Check if already subscribed
      this.pushSubscription = await this.serviceWorkerRegistration.pushManager.getSubscription();
      
      if (this.pushSubscription) {
        await this.sendSubscriptionToServer(this.pushSubscription);
        return;
      }

      // Create new subscription if permission is granted
      if (this.permission === 'granted') {
        await this.subscribeToPush();
      }
    } catch (error) {
      console.error('Failed to setup push subscription:', error);
    }
  }

  private async subscribeToPush(): Promise<boolean> {
    if (!this.serviceWorkerRegistration) return false;

    try {
      // Unsubscribe from any existing subscription first
      const existingSubscription = await this.serviceWorkerRegistration.pushManager.getSubscription();
      if (existingSubscription) {
        await existingSubscription.unsubscribe();
      }

      // Create fresh push subscription
      this.pushSubscription = await this.serviceWorkerRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          'BNUBRCnltmYiEEVwd8KD4lVRp8EJgfuI19XNJD2lki87bZZ6IIrAxWo6u6WjXq3h8FIs6b1RYGX6i33DEZmKNZ0'
        )
      });

      await this.sendSubscriptionToServer(this.pushSubscription);
      return true;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return false;
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
        body: JSON.stringify(subscription.toJSON())
      });

      if (!response.ok) {
        throw new Error(`Failed to send subscription: ${response.status}`);
      }
    } catch (error) {
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

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
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
      
      if (result === 'granted') {
        // Set up push subscription for PWA after permission granted
        const strategy = pwaDetection.getNotificationStrategy();
        if (strategy === 'pwa') {
          await this.subscribeToPush();
        }
      }
      
      return result === 'granted';
    } catch (error) {
      return false;
    }
  }

  async showNotification(options: NotificationOptions, type: NotificationType = 'message'): Promise<boolean> {
    // Check if notifications are enabled
    if (!this.settings.enabled || !this.settings.types[type]) {
      return false;
    }

    // Check if notifications are supported
    if (!('Notification' in window)) {
      return false;
    }

    // Check permission
    if (this.permission !== 'granted') {
      return false;
    }

    const strategy = pwaDetection.getNotificationStrategy();
    
    if (strategy === 'none') {
      return false; // No notification support for mobile browsers
    }

    const notificationOptions: NotificationOptions = {
      icon: '/icon-192x192.png',
      badge: '/icon-72x72.png',
      tag: options.tag || `myroommate-${type}`,
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
      if (strategy === 'pwa' && this.serviceWorkerRegistration) {
        // Use service worker for PWA
        await this.serviceWorkerRegistration.showNotification(options.title, notificationOptions);
      } else if (strategy === 'web') {
        // Use Web Notification API for browsers
        const notification = new Notification(options.title, notificationOptions);
        
        // Auto-close after 5 seconds for web notifications
        setTimeout(() => {
          notification.close();
        }, 5000);

        notification.onclick = () => {
          window.focus();
          notification.close();
        };
      }
      
      return true;
    } catch (error) {
      console.error('Error showing notification:', error);
      return false;
    }
  }

  // Predefined notification methods
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

  // Settings management
  getSettings(): NotificationSettings {
    return { ...this.settings };
  }

  updateSettings(newSettings: Partial<NotificationSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    this.saveSettings();
  }

  updateTypeSettings(type: NotificationType, enabled: boolean): void {
    this.settings.types[type] = enabled;
    this.saveSettings();
  }

  // Environment and capability information
  getEnvironmentInfo(): {
    strategy: 'pwa' | 'web' | 'none';
    environment: PWAEnvironment;
    permission: NotificationPermission;
    canRequest: boolean;
    isSetup: boolean;
    isMobile: boolean;
    isStandalone: boolean;
    supportLevel: 'full' | 'partial' | 'none';
    requiresInstall: boolean;
  } {
    const env = pwaDetection.getEnvironment();
    const strategy = pwaDetection.getNotificationStrategy();
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    
    return {
      strategy,
      environment: env,
      permission: this.permission,
      canRequest: this.permission === 'default' && strategy !== 'none',
      isSetup: this.permission === 'granted' && (strategy !== 'pwa' || this.pushSubscription !== null),
      isMobile,
      isStandalone,
      supportLevel: this.getNotificationSupportLevel(),
      requiresInstall: isMobile && !isStandalone && strategy === 'none'
    };
  }
  
  private getNotificationSupportLevel(): 'full' | 'partial' | 'none' {
    const strategy = pwaDetection.getNotificationStrategy();
    
    if (strategy === 'pwa' && this.permission === 'granted') {
      return 'full'; // Can receive notifications even when closed
    } else if (strategy === 'web' && this.permission === 'granted') {
      return 'partial'; // Can receive notifications while browser is open
    }
    return 'none';
  }

  // Test functionality
  async testNotification(): Promise<boolean> {
    const hasPermission = await this.requestPermission();
    if (!hasPermission) return false;

    return this.showNotification({
      title: 'Test Notification',
      body: 'Your notifications are working perfectly!',
      tag: 'test-notification'
    }, 'household');
  }
}

// Export singleton instance
export const unifiedNotifications = UnifiedNotificationService.getInstance();