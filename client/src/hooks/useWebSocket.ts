import { useEffect, useRef } from 'react';

interface UseWebSocketProps {
  onMessage?: (data: any) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  userId?: string;
  householdId?: string;
}

export function useWebSocket({ onMessage, onConnect, onDisconnect, userId, householdId }: UseWebSocketProps = {}) {
  const ws = useRef<WebSocket | null>(null);
  const connectionSent = useRef(false);

  useEffect(() => {
    if (!userId || !householdId) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    // Handle both development and production environments
    const host = window.location.host;
    // In production, ensure we use the full domain for WebSocket connections
    const wsUrl = process.env.NODE_ENV === 'production' || window.location.protocol === 'https:' 
      ? `${protocol}//${host}/ws`
      : `${protocol}//${host}/ws`;
    
    let reconnectTimeout: NodeJS.Timeout;
    let heartbeatInterval: NodeJS.Timeout;
    let isManualClose = false;

    const connect = () => {
      if (ws.current?.readyState === WebSocket.OPEN) {
        return;
      }

      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log('WebSocket connected to:', wsUrl);
        connectionSent.current = false;
        
        // Send connection info for user caching
        if (userId && householdId && !connectionSent.current) {
          const connectMessage = {
            type: 'connect',
            userId,
            householdId,
          };
          console.log('Sending connect message:', connectMessage);
          ws.current?.send(JSON.stringify(connectMessage));
          connectionSent.current = true;
        }
        
        onConnect?.();
        
        // Start heartbeat to keep connection alive in deployment
        heartbeatInterval = setInterval(() => {
          if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000); // Send ping every 30 seconds
      };

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Handle server-side notifications
          if (data.type === 'notification') {
            console.log('Received server notification:', data.data);
            
            // Show browser notification if available
            if ('Notification' in window && Notification.permission === 'granted') {
              const appIcon = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 72 72'%3E%3Crect width='72' height='72' rx='16' fill='url(%23gradient)'/%3E%3Cdefs%3E%3ClinearGradient id='gradient' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%2334d399'/%3E%3Cstop offset='100%25' style='stop-color:%2306b6d4'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cg transform='translate(12,12) scale(2,2)' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'/%3E%3Cpolyline points='9 22 9 12 15 12 15 22'/%3E%3C/g%3E%3C/svg%3E";
              
              new Notification(data.data.title, {
                body: data.data.body,
                icon: appIcon,
                badge: appIcon,
                tag: `server-notification-${Date.now()}`,
                requireInteraction: false,
                silent: false
              });
            }
          }
          
          onMessage?.(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.current.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        connectionSent.current = false;
        onDisconnect?.();

        // Auto-reconnect unless manually closed
        if (!isManualClose) {
          // Immediate reconnection for deployment reliability
          const delay = event.code === 1006 ? 500 : 2000; // Fast reconnect for unexpected closures
          console.log(`Reconnecting in ${delay}ms...`);
          reconnectTimeout = setTimeout(() => {
            connect();
          }, delay);
        }
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        console.error('WebSocket URL:', wsUrl);
        console.error('Connection details:', { 
          protocol, 
          host, 
          readyState: ws.current?.readyState,
          userId,
          householdId 
        });
        onDisconnect?.();
      };
    };

    connect();

    return () => {
      isManualClose = true;
      clearTimeout(reconnectTimeout);
      clearInterval(heartbeatInterval);
      ws.current?.close();
      connectionSent.current = false;
    };
  }, [userId, householdId]);

  const sendMessage = (message: any) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      try {
        const messageStr = JSON.stringify(message);
        ws.current.send(messageStr);
        console.log('Message sent successfully:', message.type);
      } catch (error) {
        console.error('Error sending WebSocket message:', error);
      }
    } else {
      console.warn('WebSocket not ready, state:', ws.current?.readyState);
      // Message will be lost but WebSocket will auto-reconnect via useEffect
    }
  };

  return { sendMessage, websocket: ws.current };
}
