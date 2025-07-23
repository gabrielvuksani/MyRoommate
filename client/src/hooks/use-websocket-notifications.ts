import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { notificationService } from '@/lib/notifications';
import { formatDisplayName } from '@/lib/nameUtils';

interface WebSocketNotificationMessage {
  type: 'notification';
  notificationType: 'message' | 'chore' | 'expense' | 'calendar';
  data: {
    title: string;
    body: string;
    householdName?: string;
    userId?: string;
    fromUser?: {
      firstName?: string;
      lastName?: string;
    };
  };
}

interface UseWebSocketNotificationsProps {
  user: any;
  household: any;
  enabled: boolean;
}

export function useWebSocketNotifications({ user, household, enabled }: UseWebSocketNotificationsProps) {
  const wsRef = useRef<WebSocket | null>(null);
  const queryClient = useQueryClient();
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 10;

  const connect = () => {
    if (!enabled || !user?.id || !household?.id || wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws-notifications`;
    
    console.log('Connecting to WebSocket notifications:', wsUrl);
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket notifications connected');
      reconnectAttempts.current = 0;
      
      // Send authentication and subscription info
      ws.send(JSON.stringify({
        type: 'authenticate',
        userId: user.id,
        householdId: household.id
      }));
    };

    ws.onmessage = async (event) => {
      try {
        const message: WebSocketNotificationMessage = JSON.parse(event.data);
        
        if (message.type === 'notification') {
          const { notificationType, data } = message;
          
          // Skip notifications from current user
          if (data.userId === user.id) {
            return;
          }

          // Show appropriate notification based on type
          switch (notificationType) {
            case 'message':
              const userName = formatDisplayName(
                data.fromUser?.firstName || null, 
                data.fromUser?.lastName || null
              );
              await notificationService.showNotification({
                title: `${userName} in ${data.householdName || ''}`,
                body: data.body,
                icon: '/icon-192x192.png',
                tag: 'message'
              });
              break;
              
            case 'chore':
              await notificationService.showNotification({
                title: `${data.title} - ${data.householdName || ''}`,
                body: data.body,
                icon: '/icon-192x192.png',
                tag: 'chore'
              });
              break;
              
            case 'expense':
              await notificationService.showNotification({
                title: `${data.title} - ${data.householdName || ''}`,
                body: data.body,
                icon: '/icon-192x192.png',
                tag: 'expense'
              });
              break;
              
            case 'calendar':
              await notificationService.showNotification({
                title: `${data.title} - ${data.householdName || ''}`,
                body: data.body,
                icon: '/icon-192x192.png',
                tag: 'calendar'
              });
              break;
          }
          
          // Invalidate relevant queries to update UI
          switch (notificationType) {
            case 'message':
              queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
              break;
            case 'chore':
              queryClient.invalidateQueries({ queryKey: ["/api/chores"] });
              break;
            case 'expense':
              queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
              queryClient.invalidateQueries({ queryKey: ["/api/balance"] });
              break;
            case 'calendar':
              queryClient.invalidateQueries({ queryKey: ["/api/calendar"] });
              break;
          }
        }
      } catch (error) {
        console.error('Error processing WebSocket notification:', error);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket notifications disconnected');
      wsRef.current = null;
      
      // Attempt to reconnect with exponential backoff
      if (enabled && reconnectAttempts.current < maxReconnectAttempts) {
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
        reconnectAttempts.current++;
        
        console.log(`Attempting to reconnect notifications in ${delay}ms (attempt ${reconnectAttempts.current})`);
        
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, delay);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket notification error:', error);
    };
  };

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    reconnectAttempts.current = 0;
  };

  useEffect(() => {
    if (enabled && user?.id && household?.id) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, user?.id, household?.id]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  return {
    isConnected: wsRef.current?.readyState === WebSocket.OPEN,
    reconnectAttempts: reconnectAttempts.current
  };
}