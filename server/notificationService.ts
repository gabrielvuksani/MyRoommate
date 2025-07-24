import webpush from 'web-push';
import { IStorage } from './storage';

// Configure web-push with VAPID keys
webpush.setVapidDetails(
  'mailto:notifications@myroommate.app',
  'BNUBRCnltmYiEEVwd8KD4lVRp8EJgfuI19XNJD2lki87bZZ6IIrAxWo6u6WjXq3h8FIs6b1RYGX6i33DEZmKNZ0',
  'wTGTRZLzI_Hq7FONxnCKOBL3f3fKuNcpb-nQpQRUHcI'
);

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  expirationTime?: number;
  userId: string;
  timestamp: number;
}

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  type: 'message' | 'chore' | 'expense' | 'calendar' | 'household' | 'test';
  url?: string;
}

export class UnifiedNotificationService {
  private subscriptions: Map<string, PushSubscription> = new Map();
  private storage: IStorage;

  constructor(storage: IStorage) {
    this.storage = storage;
  }

  // Store push subscription
  async storeSubscription(userId: string, subscription: any): Promise<void> {
    if (!subscription || !subscription.endpoint || !subscription.keys) {
      throw new Error('Invalid subscription format');
    }

    this.subscriptions.set(userId, {
      ...subscription,
      userId,
      timestamp: Date.now()
    });
  }

  // Remove subscription
  async removeSubscription(userId: string): Promise<void> {
    this.subscriptions.delete(userId);
  }

  // Send notification to a single user
  async sendNotificationToUser(userId: string, payload: NotificationPayload): Promise<boolean> {
    const subscription = this.subscriptions.get(userId);
    if (!subscription) {
      return false;
    }

    try {
      // Send with high urgency for instant delivery
      await webpush.sendNotification(subscription, JSON.stringify(payload), {
        urgency: 'high',
        TTL: 86400, // 24 hours
        topic: payload.type
      });
      return true;
    } catch (error: any) {
      // Handle invalid subscriptions
      if (error.statusCode === 410 || error.statusCode === 404) {
        this.subscriptions.delete(userId);
      }
      return false;
    }
  }

  // Send notification to all household members except sender
  async sendNotificationToHousehold(
    householdId: string, 
    senderId: string, 
    payload: NotificationPayload
  ): Promise<void> {
    const members = await this.storage.getHouseholdMembers(householdId);
    
    // Send to all members except the sender
    const promises = members
      .filter(member => member.userId !== senderId)
      .map(member => this.sendNotificationToUser(member.userId, payload));
    
    await Promise.allSettled(promises);
  }

  // Unified notification handlers for different types
  async notifyNewMessage(
    householdId: string,
    senderId: string,
    senderName: string,
    messageContent: string,
    householdName: string
  ): Promise<void> {
    const payload: NotificationPayload = {
      title: `${senderName}`,
      body: messageContent.substring(0, 100),
      icon: '/icon-192x192.png',
      badge: '/icon-72x72.png',
      tag: `message-${Date.now()}`,
      type: 'message',
      data: {
        householdId,
        householdName,
        url: '/messages'
      }
    };

    await this.sendNotificationToHousehold(householdId, senderId, payload);
  }

  async notifyChoreAssignment(
    householdId: string,
    assignerId: string,
    assigneeId: string,
    assigneeName: string,
    choreTitle: string
  ): Promise<void> {
    const payload: NotificationPayload = {
      title: 'New Chore Assigned',
      body: `${choreTitle} has been assigned to ${assigneeName}`,
      icon: '/icon-192x192.png',
      badge: '/icon-72x72.png',
      tag: `chore-${Date.now()}`,
      type: 'chore',
      data: {
        householdId,
        url: '/chores'
      }
    };

    // Only notify the assignee
    await this.sendNotificationToUser(assigneeId, payload);
  }

  async notifyChoreCompletion(
    householdId: string,
    completerId: string,
    completerName: string,
    choreTitle: string
  ): Promise<void> {
    const payload: NotificationPayload = {
      title: 'Chore Completed',
      body: `${completerName} completed: ${choreTitle}`,
      icon: '/icon-192x192.png',
      badge: '/icon-72x72.png',
      tag: `chore-complete-${Date.now()}`,
      type: 'chore',
      data: {
        householdId,
        url: '/chores'
      }
    };

    await this.sendNotificationToHousehold(householdId, completerId, payload);
  }

  async notifyNewExpense(
    householdId: string,
    creatorId: string,
    creatorName: string,
    expenseTitle: string,
    amount: number
  ): Promise<void> {
    const payload: NotificationPayload = {
      title: 'New Expense Added',
      body: `${creatorName} added: ${expenseTitle} ($${amount.toFixed(2)})`,
      icon: '/icon-192x192.png',
      badge: '/icon-72x72.png',
      tag: `expense-${Date.now()}`,
      type: 'expense',
      data: {
        householdId,
        url: '/expenses'
      }
    };

    await this.sendNotificationToHousehold(householdId, creatorId, payload);
  }

  async notifyNewCalendarEvent(
    householdId: string,
    creatorId: string,
    creatorName: string,
    eventTitle: string,
    eventDate: Date
  ): Promise<void> {
    const payload: NotificationPayload = {
      title: 'New Event Added',
      body: `${creatorName} added: ${eventTitle} on ${eventDate.toLocaleDateString()}`,
      icon: '/icon-192x192.png',
      badge: '/icon-72x72.png',
      tag: `calendar-${Date.now()}`,
      type: 'calendar',
      data: {
        householdId,
        url: '/calendar'
      }
    };

    await this.sendNotificationToHousehold(householdId, creatorId, payload);
  }

  // Get all active subscriptions
  getActiveSubscriptions(): Map<string, PushSubscription> {
    return this.subscriptions;
  }

  // Clean up expired subscriptions
  cleanupExpiredSubscriptions(): void {
    const now = Date.now();
    const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);

    for (const [userId, subscription] of this.subscriptions.entries()) {
      if (subscription.timestamp < oneWeekAgo) {
        this.subscriptions.delete(userId);
      }
    }
  }
}