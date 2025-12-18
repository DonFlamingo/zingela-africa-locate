/**
 * Traccar WebSocket Client
 * 
 * Connects to Traccar WebSocket endpoint for real-time updates:
 * wss://<traccar-server>/api/socket
 * 
 * Handles:
 * - positions: Real-time position updates
 * - devices: Device status changes
 * - events: Alert/event notifications
 * 
 * NOTE: In production, this should be proxied through a backend WebSocket
 * to handle authentication and connection management securely.
 */

import type { Device, Position, Alert, TraccarConfig } from '../models/types';

type WebSocketMessageType = 'positions' | 'devices' | 'events';

interface WebSocketMessage {
  [key: string]: any;
}

type MessageHandler = (data: any) => void;

class TraccarWebSocketClient {
  private ws: WebSocket | null = null;
  private config: TraccarConfig | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private handlers: Map<WebSocketMessageType, Set<MessageHandler>> = new Map();
  private isConnecting = false;

  /**
   * Initialize WebSocket connection
   */
  connect(config: TraccarConfig): void {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    this.config = config;
    this.isConnecting = true;

    try {
      // Convert http/https to ws/wss
      const wsUrl = config.serverUrl
        .replace(/^http:/, 'ws:')
        .replace(/^https:/, 'wss:')
        .replace(/\/$/, '') + '/api/socket';

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('Traccar WebSocket connected');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.isConnecting = false;
      };

      this.ws.onclose = () => {
        console.log('Traccar WebSocket disconnected');
        this.isConnecting = false;
        this.attemptReconnect();
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.isConnecting = false;
      this.attemptReconnect();
    }
  }

  /**
   * Attempt to reconnect with exponential backoff
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    if (!this.config) {
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    setTimeout(() => {
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      this.connect(this.config!);
    }, delay);
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(message: WebSocketMessage): void {
    // Traccar WebSocket sends different message types
    if (message.positions) {
      this.notifyHandlers('positions', message.positions);
    }
    if (message.devices) {
      this.notifyHandlers('devices', message.devices);
    }
    if (message.events) {
      this.notifyHandlers('events', message.events);
    }
  }

  /**
   * Notify all handlers for a message type
   */
  private notifyHandlers(type: WebSocketMessageType, data: any): void {
    const handlers = this.handlers.get(type);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in ${type} handler:`, error);
        }
      });
    }
  }

  /**
   * Subscribe to position updates
   */
  onPositions(handler: (positions: Position[]) => void): () => void {
    return this.subscribe('positions', handler);
  }

  /**
   * Subscribe to device updates
   */
  onDevices(handler: (devices: Device[]) => void): () => void {
    return this.subscribe('devices', handler);
  }

  /**
   * Subscribe to event/alert updates
   */
  onEvents(handler: (events: Alert[]) => void): () => void {
    return this.subscribe('events', handler);
  }

  /**
   * Generic subscribe method
   */
  private subscribe(type: WebSocketMessageType, handler: MessageHandler): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler);

    // Return unsubscribe function
    return () => {
      const handlers = this.handlers.get(type);
      if (handlers) {
        handlers.delete(handler);
      }
    };
  }

  /**
   * Disconnect WebSocket
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.handlers.clear();
    this.config = null;
    this.reconnectAttempts = 0;
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

// Export singleton instance
export const traccarWebSocket = new TraccarWebSocketClient();

