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
    const wsUrl = `${protocol}//${host}/ws`;
    
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

  return { sendMessage };
}
