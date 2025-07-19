import { useEffect, useRef } from 'react';

interface UseWebSocketProps {
  onMessage?: (data: any) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onStatusChange?: (status: 'connecting' | 'connected' | 'disconnected') => void;
  enabled?: boolean;
  userId?: string;
  householdId?: string;
  conversationId?: string | null;
}

export function useWebSocket({ 
  onMessage, 
  onConnect, 
  onDisconnect, 
  onStatusChange,
  enabled = true,
  userId, 
  householdId,
  conversationId 
}: UseWebSocketProps = {}) {
  const ws = useRef<WebSocket | null>(null);
  const connectionSent = useRef(false);

  useEffect(() => {
    if (!enabled || !userId) {
      console.log('WebSocket not connecting:', { enabled, userId: !!userId });
      return;
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws`;
    
    console.log('WebSocket attempting to connect to:', wsUrl, 'for user:', userId);
    
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
        console.log('WebSocket connected to:', wsUrl);
        connectionSent.current = false;
        
        // Send connection info for user caching
        if (userId && !connectionSent.current) {
          const connectMessage = {
            type: 'connect',
            userId,
            householdId: householdId || null,
            conversationId: conversationId || null,
          };
          console.log('Sending connect message:', connectMessage);
          ws.current?.send(JSON.stringify(connectMessage));
          connectionSent.current = true;
        }
        
        onConnect?.();
        onStatusChange?.('connected');
        
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
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.current.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason, 'attempts:', reconnectAttempts);
        connectionSent.current = false;
        onDisconnect?.();
        onStatusChange?.('disconnected');

        // Auto-reconnect unless manually closed or max attempts reached
        if (!isManualClose && reconnectAttempts < maxReconnectAttempts) {
          reconnectAttempts++;
          // Progressive backoff: start fast, slow down over time
          const baseDelay = event.code === 1006 ? 500 : 1000;
          const delay = Math.min(baseDelay * Math.pow(1.5, reconnectAttempts - 1), 10000);
          
          console.log(`Reconnecting in ${delay}ms... (attempt ${reconnectAttempts}/${maxReconnectAttempts})`);
          reconnectTimeout = setTimeout(() => {
            connect();
          }, delay);
        } else if (reconnectAttempts >= maxReconnectAttempts) {
          console.error('Max WebSocket reconnection attempts reached. Please refresh the page.');
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
          householdId,
          conversationId 
        });
        onDisconnect?.();
        onStatusChange?.('disconnected');
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
  }, [userId, householdId, conversationId, enabled]);

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
