import webpush from 'web-push';

// VAPID keys for Web Push Protocol
webpush.setVapidDetails(
  'mailto:contact@myroommate.app',
  'BNUBRCnltmYiEEVwd8KD4lVRp8EJgfuI19XNJD2lki87bZZ6IIrAxWo6u6WjXq3h8FIs6b1RYGX6i33DEZmKNZ0', // public key
  'VpM8rXLUC8KVk4_7GrmfB4hX5FzK7Lv4BnAkx2Dp8Ag' // private key
);

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  actions?: Array<{
    action: string;
    title: string;
  }>;
}

export interface NotificationOptions {
  userId: string;
  householdId?: string;
  type: 'message' | 'chore' | 'expense' | 'calendar' | 'system';
  title: string;
  body: string;
  priority?: 'high' | 'normal' | 'low';
  payload?: any;
  scheduleFor?: Date;
  expiresIn?: number; // minutes
}

// In-memory storage for enterprise reliability (will migrate to database later)
interface StoredSubscription {
  userId: string;
  endpoint: string;
  p256dhKey: string;
  authKey: string;
  lastUsed: Date;
  failureCount: number;
  isActive: boolean;
}

interface QueuedNotification {
  id: string;
  userId: string;
  householdId?: string;
  type: string;
  title: string;
  body: string;
  payload?: any;
  priority: 'high' | 'normal' | 'low';
  attempts: number;
  maxAttempts: number;
  scheduledFor: Date;
  expiresAt: Date;
  status: 'pending' | 'sent' | 'failed' | 'expired';
}

export class EnterpriseNotificationService {
  private static instance: EnterpriseNotificationService;
  private subscriptions = new Map<string, StoredSubscription[]>(); // userId -> subscriptions
  private notificationQueue: QueuedNotification[] = [];
  private isProcessing = false;
  private processingInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.startProcessingQueue();
    this.startCleanupTask();
  }

  static getInstance(): EnterpriseNotificationService {
    if (!EnterpriseNotificationService.instance) {
      EnterpriseNotificationService.instance = new EnterpriseNotificationService();
    }
    return EnterpriseNotificationService.instance;
  }

  // Store push subscription with enterprise-grade reliability
  async storePushSubscription(userId: string, subscription: any): Promise<void> {
    try {
      const { endpoint, keys } = subscription;
      const { p256dh, auth } = keys;

      const userSubscriptions = this.subscriptions.get(userId) || [];
      
      // Check if subscription already exists
      const existingIndex = userSubscriptions.findIndex(sub => sub.endpoint === endpoint);
      
      const storedSubscription: StoredSubscription = {
        userId,
        endpoint,
        p256dhKey: p256dh,
        authKey: auth,
        lastUsed: new Date(),
        failureCount: 0,
        isActive: true
      };

      if (existingIndex !== -1) {
        // Update existing subscription
        userSubscriptions[existingIndex] = storedSubscription;
      } else {
        // Add new subscription
        userSubscriptions.push(storedSubscription);
      }
      
      this.subscriptions.set(userId, userSubscriptions);
    } catch (error) {
      console.error('Error storing push subscription:', error);
      throw error;
    }
  }

  // Queue notification for reliable delivery
  async queueNotification(options: NotificationOptions): Promise<void> {
    try {
      const expiresAt = options.expiresIn 
        ? new Date(Date.now() + options.expiresIn * 60 * 1000)
        : new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours default

      const queuedNotification: QueuedNotification = {
        id: Math.random().toString(36).substring(2, 15),
        userId: options.userId,
        householdId: options.householdId,
        type: options.type,
        title: options.title,
        body: options.body,
        payload: options.payload || {},
        priority: options.priority || 'normal',
        attempts: 0,
        maxAttempts: options.priority === 'high' ? 5 : 3,
        scheduledFor: options.scheduleFor || new Date(),
        expiresAt,
        status: 'pending'
      };

      this.notificationQueue.push(queuedNotification);

      // Trigger immediate processing for high priority notifications
      if (options.priority === 'high') {
        setTimeout(() => this.processQueue(), 100);
      }
    } catch (error) {
      console.error('Error queueing notification:', error);
      throw error;
    }
  }

  // Send notification immediately (bypass queue for critical notifications)
  async sendNotificationImmediate(options: NotificationOptions): Promise<boolean> {
    try {
      const userSubscriptions = this.subscriptions.get(options.userId) || [];
      const activeSubscriptions = userSubscriptions.filter(sub => sub.isActive);

      if (activeSubscriptions.length === 0) {
        return false;
      }

      const payload: PushNotificationPayload = {
        title: options.title,
        body: options.body,
        icon: '/icon-192x192.png',
        badge: '/icon-72x72.png',
        tag: `${options.type}-${Date.now()}`,
        data: {
          type: options.type,
          payload: options.payload,
          url: '/',
          timestamp: Date.now()
        },
        actions: [
          { action: 'open', title: 'Open App' }
        ]
      };

      let sentCount = 0;
      const sendPromises = activeSubscriptions.map(async (sub) => {
        try {
          const pushSubscription = {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dhKey,
              auth: sub.authKey
            }
          };

          await webpush.sendNotification(
            pushSubscription,
            JSON.stringify(payload),
            {
              urgency: 'high', // Always high urgency for immediate delivery
              TTL: 30, // 30 seconds for immediate delivery
              topic: options.type
            }
          );

          // Update last used timestamp and reset failure count
          sub.lastUsed = new Date();
          sub.failureCount = 0;
          
          sentCount++;
          return true;
        } catch (error: any) {
          // Mark subscription as failed if it's invalid
          if (error.statusCode === 410 || error.statusCode === 404) {
            sub.isActive = false;
          } else {
            // Increment failure count
            sub.failureCount += 1;
            if (sub.failureCount >= 3) {
              sub.isActive = false;
            }
          }
          return false;
        }
      });

      await Promise.allSettled(sendPromises);
      return sentCount > 0;
    } catch (error) {
      console.error('Error sending immediate notification:', error);
      return false;
    }
  }

  // Process notification queue with enterprise reliability
  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const now = new Date();
      // Get pending notifications that are ready to send and not expired
      const pendingNotifications = this.notificationQueue.filter(notification => 
        notification.status === 'pending' && 
        notification.scheduledFor <= now &&
        notification.expiresAt > now
      );

      // Sort by priority (high first) then by scheduled time
      pendingNotifications.sort((a, b) => {
        const priorityOrder = { high: 3, normal: 2, low: 1 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        return a.scheduledFor.getTime() - b.scheduledFor.getTime();
      });

      // Process up to 20 notifications per batch
      const batchSize = 20;
      const batch = pendingNotifications.slice(0, batchSize);

      for (const notification of batch) {
        try {
          const success = await this.sendNotificationImmediate({
            userId: notification.userId,
            householdId: notification.householdId,
            type: notification.type as any,
            title: notification.title,
            body: notification.body,
            payload: notification.payload,
            priority: notification.priority
          });

          if (success) {
            notification.status = 'sent';
          } else {
            // Mark as failed if max attempts reached
            notification.attempts += 1;
            if (notification.attempts >= notification.maxAttempts) {
              notification.status = 'failed';
            } else {
              // Retry with exponential backoff
              const retryDelay = Math.min(30000 * Math.pow(2, notification.attempts), 300000); // Max 5 minutes
              notification.scheduledFor = new Date(Date.now() + retryDelay);
            }
          }
        } catch (error) {
          console.error('Error processing notification:', error);
          notification.attempts += 1;
          if (notification.attempts >= notification.maxAttempts) {
            notification.status = 'failed';
          }
        }
      }
    } catch (error) {
      console.error('Error processing notification queue:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  // Start background queue processing
  private startProcessingQueue(): void {
    // Process queue every 10 seconds for real-time delivery
    this.processingInterval = setInterval(() => {
      this.processQueue();
    }, 10000);
  }

  // Cleanup expired notifications and inactive subscriptions
  private startCleanupTask(): void {
    setInterval(async () => {
      try {
        const now = new Date();
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        // Remove expired notifications
        this.notificationQueue = this.notificationQueue.filter(notification => {
          if (notification.expiresAt <= now && notification.status === 'pending') {
            notification.status = 'expired';
            return false;
          }
          return notification.status === 'pending' || notification.expiresAt > thirtyDaysAgo;
        });

        // Clean up inactive subscriptions
        for (const [userId, userSubs] of this.subscriptions.entries()) {
          const activeSubs = userSubs.filter(sub => {
            if (!sub.isActive && sub.lastUsed < thirtyDaysAgo) {
              return false; // Remove very old inactive subscriptions
            }
            return true;
          });
          
          if (activeSubs.length === 0) {
            this.subscriptions.delete(userId);
          } else {
            this.subscriptions.set(userId, activeSubs);
          }
        }
      } catch (error) {
        console.error('Error in cleanup task:', error);
      }
    }, 60000); // Run every minute
  }

  // Unified notification methods for app events
  async sendMessageNotification(userId: string, senderName: string, messageContent: string, householdId?: string): Promise<void> {
    await this.queueNotification({
      userId,
      householdId,
      type: 'message',
      title: `New message from ${senderName}`,
      body: messageContent,
      priority: 'high',
      payload: { senderName, messageContent },
      expiresIn: 60 // 1 hour
    });
  }

  async sendChoreNotification(userId: string, choreTitle: string, assignedBy: string, householdId?: string): Promise<void> {
    await this.queueNotification({
      userId,
      householdId,
      type: 'chore',
      title: 'New chore assigned',
      body: `${choreTitle} - Assigned by ${assignedBy}`,
      priority: 'normal',
      payload: { choreTitle, assignedBy },
      expiresIn: 12 * 60 // 12 hours
    });
  }

  async sendExpenseNotification(userId: string, expenseTitle: string, amount: number, createdBy: string, householdId?: string): Promise<void> {
    await this.queueNotification({
      userId,
      householdId,
      type: 'expense',
      title: 'New expense added',
      body: `${expenseTitle} - $${amount.toFixed(2)} by ${createdBy}`,
      priority: 'normal',
      payload: { expenseTitle, amount, createdBy },
      expiresIn: 6 * 60 // 6 hours
    });
  }

  async sendCalendarNotification(userId: string, eventTitle: string, eventDate: Date, createdBy: string, householdId?: string): Promise<void> {
    await this.queueNotification({
      userId,
      householdId,
      type: 'calendar',
      title: 'New calendar event',
      body: `${eventTitle} - ${eventDate.toLocaleDateString()} by ${createdBy}`,
      priority: 'normal',
      payload: { eventTitle, eventDate: eventDate.toISOString(), createdBy },
      expiresIn: 24 * 60 // 24 hours
    });
  }

  // Get service health status
  getStatus(): {
    isProcessing: boolean;
    queueActive: boolean;
  } {
    return {
      isProcessing: this.isProcessing,
      queueActive: this.processingInterval !== null
    };
  }

  // Graceful shutdown
  async shutdown(): Promise<void> {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
    
    // Process any remaining high priority notifications
    if (!this.isProcessing) {
      await this.processQueue();
    }
  }
}

// Export singleton instance
export const notificationService = EnterpriseNotificationService.getInstance();