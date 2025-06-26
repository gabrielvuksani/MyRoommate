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
      };

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessage?.(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.current.onclose = () => {
        console.log('WebSocket disconnected');
        connectionSent.current = false;
        onDisconnect?.();

        // Auto-reconnect unless manually closed
        if (!isManualClose) {
          // Exponential backoff for reconnection
          const delay = Math.min(1000 * Math.pow(2, connectionSent.current ? 0 : 1), 10000);
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
      ws.current?.close();
      connectionSent.current = false;
    };
  }, [userId, householdId]);

  const sendMessage = (message: any) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not ready, queuing message');
    }
  };

  return { sendMessage };
}
