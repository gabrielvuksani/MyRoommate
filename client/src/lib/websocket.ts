/**
 * Enterprise WebSocket connection manager for myRoommate
 * Handles real-time updates, intelligent reconnection, and PWA offline support
 */

import { queryClient } from './queryClient';
import React from 'react';

export interface WebSocketMessage {
  type: 'message_created' | 'chore_updated' | 'expense_created' | 'calendar_updated' | 'household_updated';
  data: any;
  householdId?: string;
  userId?: string;
  timestamp: number;
}

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';

export class WebSocketManager {
  private static instance: WebSocketManager;
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectInterval = 1000; // Start with 1 second
  private maxReconnectInterval = 30000; // Max 30 seconds
  private reconnectTimer: NodeJS.Timeout | null = null;
  private pingTimer: NodeJS.Timeout | null = null;
  private lastPong = Date.now();
  private connectionStatus: ConnectionStatus = 'disconnected';
  private listeners: Set<(status: ConnectionStatus) => void> = new Set();
  private isOnline = navigator.onLine;
  private householdId: string | null = null;

  private constructor() {
    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
    
    // Listen for page visibility changes (PWA focus/background)
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
  }

  static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager();
    }
    return WebSocketManager.instance;
  }

  connect(householdId: string): void {
    this.householdId = householdId;
    
    if (!this.isOnline) {
      this.setStatus('disconnected');
      return;
    }

    if (this.ws?.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    this.setStatus('connecting');
    this.cleanup();

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      this.ws = new WebSocket(wsUrl);
      this.setupEventHandlers();
    } catch (error) {
      console.error('WebSocket connection failed:', error);
      this.scheduleReconnect();
    }
  }

  private setupEventHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.setStatus('connected');
      this.reconnectAttempts = 0;
      this.reconnectInterval = 1000;
      
      // Join household room
      if (this.householdId) {
        this.send({
          type: 'join_household',
          householdId: this.householdId
        });
      }
      
      this.startHeartbeat();
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        if (message.type === 'pong') {
          this.lastPong = Date.now();
          return;
        }
        
        this.handleMessage(message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    this.ws.onclose = (event) => {
      console.log('WebSocket closed:', event.code, event.reason);
      this.setStatus('disconnected');
      this.stopHeartbeat();
      
      // Don't reconnect if it was a clean close (user logout, etc.)
      if (event.code !== 1000 && this.isOnline) {
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.setStatus('disconnected');
    };
  }

  private handleMessage(message: WebSocketMessage): void {
    // Only process messages for our household
    if (message.householdId && message.householdId !== this.householdId) {
      return;
    }

    // Invalidate relevant React Query caches based on message type
    switch (message.type) {
      case 'message_created':
        queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
        break;
      case 'chore_updated':
        queryClient.invalidateQueries({ queryKey: ['/api/chores'] });
        break;
      case 'expense_created':
        queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
        queryClient.invalidateQueries({ queryKey: ['/api/balance'] });
        break;
      case 'calendar_updated':
        queryClient.invalidateQueries({ queryKey: ['/api/calendar'] });
        break;
      case 'household_updated':
        queryClient.invalidateQueries({ queryKey: ['/api/households/current'] });
        break;
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached');
      this.setStatus('disconnected');
      return;
    }

    this.setStatus('reconnecting');
    this.reconnectAttempts++;
    
    // Exponential backoff with jitter
    const jitter = Math.random() * 1000;
    const delay = Math.min(this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1), this.maxReconnectInterval) + jitter;
    
    this.reconnectTimer = setTimeout(() => {
      if (this.householdId) {
        this.connect(this.householdId);
      }
    }, delay);
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    
    this.pingTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        // Check if we received a pong recently
        if (Date.now() - this.lastPong > 35000) { // 35 seconds timeout
          console.log('WebSocket ping timeout, reconnecting...');
          this.ws.close();
          return;
        }
        
        this.send({ type: 'ping' });
      }
    }, 25000); // Send ping every 25 seconds
  }

  private stopHeartbeat(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  private send(data: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  private cleanup(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    this.stopHeartbeat();
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  private setStatus(status: ConnectionStatus): void {
    this.connectionStatus = status;
    this.listeners.forEach(listener => listener(status));
  }

  private handleOnline(): void {
    this.isOnline = true;
    if (this.householdId) {
      this.connect(this.householdId);
    }
  }

  private handleOffline(): void {
    this.isOnline = false;
    this.setStatus('disconnected');
    this.cleanup();
  }

  private handleVisibilityChange(): void {
    if (document.visibilityState === 'visible' && this.isOnline && this.householdId) {
      // App became visible - ensure connection is alive
      if (this.ws?.readyState !== WebSocket.OPEN) {
        this.connect(this.householdId);
      }
    }
  }

  // Public API
  getStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  onStatusChange(listener: (status: ConnectionStatus) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  disconnect(): void {
    this.householdId = null;
    this.cleanup();
    this.setStatus('disconnected');
  }

  // Send a message (for chat)
  sendMessage(content: string): void {
    this.send({
      type: 'send_message',
      content,
      householdId: this.householdId
    });
  }
}

// React hook for using WebSocket connection
export function useWebSocket(householdId?: string) {
  const [status, setStatus] = React.useState<ConnectionStatus>('disconnected');
  const wsManager = WebSocketManager.getInstance();

  React.useEffect(() => {
    if (householdId) {
      wsManager.connect(householdId);
    } else {
      wsManager.disconnect();
    }

    const unsubscribe = wsManager.onStatusChange(setStatus);
    setStatus(wsManager.getStatus());

    return () => {
      unsubscribe();
    };
  }, [householdId, wsManager]);

  return {
    status,
    sendMessage: wsManager.sendMessage.bind(wsManager)
  };
}