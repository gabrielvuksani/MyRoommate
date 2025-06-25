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
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log('WebSocket connected');
      
      // Send connection info immediately for user caching
      if (userId && householdId && !connectionSent.current) {
        ws.current?.send(JSON.stringify({
          type: 'connect',
          userId,
          householdId,
        }));
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
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      ws.current?.close();
      connectionSent.current = false;
    };
  }, [onMessage, onConnect, onDisconnect, userId, householdId]);

  const sendMessage = (message: any) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not ready, queuing message');
    }
  };

  return { sendMessage };
}
