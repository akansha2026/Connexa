type Listener<T = any> = (data: T) => void;

export class WebSocketManager {
  private socket: WebSocket | null = null;
  private readonly url: string;
  private readonly listeners: Map<string, Set<Listener>> = new Map();

  private readonly reconnectInterval = 3000;
  private shouldReconnect = true;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;

  constructor(url: string) {
    this.url = url;
  }

  connect() {
    if (this.socket && this.socket.readyState === WebSocket.CONNECTING) {
      console.warn("WebSocket connection already in progress");
      return;
    }

    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      console.warn("WebSocket already connected");
      return;
    }

    this.socket = new WebSocket(this.url);

    this.socket.addEventListener("open", () => {
      console.log("WebSocket connected");
      this.reconnectAttempts = 0; // Reset on successful connection
      this.emit(WebSocketEvents.CONNECTED, null);
    });

    this.socket.addEventListener("message", (event) => {
      this.handleMessage(event);
    });

    this.socket.addEventListener("close", (event) => {
      console.warn(`WebSocket disconnected: ${event.code} - ${event.reason}`);
      this.emit(WebSocketEvents.DISCONNECTED, { code: event.code, reason: event.reason });
      this.socket = null;
      
      if (this.shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        this.emit(WebSocketEvents.RECONNECTING, { 
          attempt: this.reconnectAttempts, 
          maxAttempts: this.maxReconnectAttempts 
        });
        setTimeout(() => this.connect(), this.reconnectInterval);
      } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error("Max reconnection attempts reached");
        this.emit(WebSocketEvents.ERROR, new Error("Max reconnection attempts reached"));
      }
    });

    this.socket.addEventListener("error", (err) => {
      console.error("WebSocket error:", err);
      this.emit(WebSocketEvents.ERROR, err);
    });
  }

  disconnect() {
    this.shouldReconnect = false;
    this.reconnectAttempts = 0;
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  send<T>(type: WebSocketEvents, data: T): boolean {
    if (this.socket?.readyState === WebSocket.OPEN) {
      try {
        this.socket.send(JSON.stringify({ type, content: data }));
        return true;
      } catch (error) {
        console.error("Failed to send message:", error);
        this.emit(WebSocketEvents.ERROR, error);
        return false;
      }
    } else {
      console.warn(`WebSocket not connected, unable to send ${type}`);
      return false;
    }
  }

  on(event: string, listener: Listener) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
  }

  off(event: string, listener: Listener) {
    this.listeners.get(event)?.delete(listener);
    
    // Clean up empty listener sets
    if (this.listeners.get(event)?.size === 0) {
      this.listeners.delete(event);
    }
  }

  // Remove all listeners (useful for cleanup)
  removeAllListeners(event?: string) {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }

  private emit(event: string, data: any) {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach((listener) => {
        try {
          listener(data);
        } catch (error) {
          console.error(`Error in listener for event ${event}:`, error);
        }
      });
    }
  }

  private handleMessage(event: MessageEvent) {
    try {
      const { type, content } = JSON.parse(event.data);

      if (!type) {
        console.warn("Received message without type");
        return;
      }

      this.emit(type, content);
    } catch (err) {
      console.error("Failed to parse message", err);
      this.emit(WebSocketEvents.ERROR, err);
    }
  }

  public isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  public getConnectionState(): 'connecting' | 'open' | 'closing' | 'closed' {
    if (!this.socket) return 'closed';

    switch (this.socket.readyState) {
      case WebSocket.CONNECTING: return 'connecting';
      case WebSocket.OPEN: return 'open';
      case WebSocket.CLOSING: return 'closing';
      case WebSocket.CLOSED: return 'closed';
      default: return 'closed';
    }
  }

  // Simple stats for debugging
  public getStats() {
    return {
      connected: this.isConnected(),
      reconnectAttempts: this.reconnectAttempts,
      listenersCount: this.listeners.size,
    };
  }
}

// Support environment variables but keep it simple
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080";
export const ws = new WebSocketManager(WS_URL);

export enum WebSocketEvents {
  // User activity
  TYPING_STOP = "TYPING_STOP",
  TYPING_START = "TYPING_START",
  USER_ONLINE = "USER_ONLINE",
  USER_OFFLINE = "USER_OFFLINE",

  // Messages
  NEW_MESSAGE = "NEW_MESSAGE",
  MESSAGE_EDITED = "MESSAGE_EDITED",
  MESSAGE_DELETED = "MESSAGE_DELETED",
  MESSAGE_DELIVERED = "MESSAGE_DELIVERED",
  MESSAGE_SEEN = "MESSAGE_SEEN",

  // Errors / system
  ERROR = "ERROR",
  CONNECTED = "CONNECTED",
  DISCONNECTED = "DISCONNECTED",
  RECONNECTING = "RECONNECTING",
}