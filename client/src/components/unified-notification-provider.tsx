/**
 * Unified Notification Provider for myRoommate
 * Automatically initializes notifications on user login
 * Provides notification context throughout the app
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { unifiedNotificationService } from '@/lib/unified-notifications';

interface NotificationContextType {
  permissionStatus: NotificationPermission | 'unsupported';
  isSubscribed: boolean;
  requestPermission: () => Promise<boolean>;
  getStatus: () => {
    supported: boolean;
    permission: NotificationPermission;
    subscribed: boolean;
    serviceWorkerReady: boolean;
  };
  sendTestNotification: () => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function UnifiedNotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | 'unsupported'>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);

  // Initialize notifications when user logs in
  useEffect(() => {
    if (user) {
      initializeNotifications();
    }
  }, [user]);

  const initializeNotifications = async () => {
    try {
      // Check if notifications are supported
      if (typeof window === 'undefined' || !('Notification' in window)) {
        setPermissionStatus('unsupported');
        return;
      }

      setPermissionStatus(Notification.permission);

      // Auto-request permission and setup if user is logged in
      if (Notification.permission === 'default') {
        const granted = await requestPermission();
        if (granted) {
          setIsSubscribed(true);
        }
      } else if (Notification.permission === 'granted') {
        // Set up push notifications if permission already granted
        const granted = await unifiedNotificationService.requestPermission();
        setIsSubscribed(granted);
      }
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
    }
  };

  const requestPermission = async (): Promise<boolean> => {
    try {
      const granted = await unifiedNotificationService.requestPermission();
      setPermissionStatus(Notification.permission);
      setIsSubscribed(granted);
      return granted;
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return false;
    }
  };

  const getStatus = () => {
    return unifiedNotificationService.getStatus();
  };

  const sendTestNotification = async (): Promise<boolean> => {
    try {
      return await unifiedNotificationService.sendTestNotification();
    } catch (error) {
      console.error('Failed to send test notification:', error);
      return false;
    }
  };

  const contextValue: NotificationContextType = {
    permissionStatus,
    isSubscribed,
    requestPermission,
    getStatus,
    sendTestNotification
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications(): NotificationContextType {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a UnifiedNotificationProvider');
  }
  return context;
}