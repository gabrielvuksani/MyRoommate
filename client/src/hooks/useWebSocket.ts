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
    if (!userId || !householdId) {

      return;
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws`;
    

    
    let reconnectTimeout: NodeJS.Timeout;
    let heartbeatInterval: NodeJS.Timeout;
    let isManualClose = false;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 10;

    const connect = () => {
      if (ws.current?.readyState === WebSocket.OPEN) {
        return;
      }

      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {

        connectionSent.current = false;
        
        // Send connection info for user caching
        if (userId && householdId && !connectionSent.current) {
          const connectMessage = {
            type: 'connect',
            userId,
            householdId,
          };

          ws.current?.send(JSON.stringify(connectMessage));
          connectionSent.current = true;
        }
        
        onConnect?.();
        
        // Reset reconnect attempts on successful connection
        reconnectAttempts = 0;
        
        // Start heartbeat to keep connection alive in deployment
        heartbeatInterval = setInterval(() => {
          if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({ type: 'ping' }));
          }
        }, 25000); // Send ping every 25 seconds for better deployment reliability
      };

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessage?.(data);
        } catch (error) {

        }
      };

      ws.current.onclose = (event) => {
        connectionSent.current = false;
        onDisconnect?.();

        // Auto-reconnect unless manually closed or max attempts reached
        if (!isManualClose && reconnectAttempts < maxReconnectAttempts) {
          reconnectAttempts++;
          // Progressive backoff: start fast, slow down over time
          const baseDelay = event.code === 1006 ? 500 : 1000;
          const delay = Math.min(baseDelay * Math.pow(1.5, reconnectAttempts - 1), 10000);
          
          reconnectTimeout = setTimeout(() => {
            connect();
          }, delay);
        }
      };

      ws.current.onerror = (error) => {
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
      } catch (error) {
        // Silent error handling
      }
    } else {
      // Message will be lost but WebSocket will auto-reconnect via useEffect
    }
  };

  return { sendMessage, websocket: ws.current };
}
