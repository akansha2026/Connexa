type Listener = (data: unknown) => void

export class WebSocketManager {
  private socket: WebSocket | null = null
  private url: string
  private listeners: Map<string, Listener> = new Map()

  private reconnectInterval = 3000
  private shouldReconnect = true

  constructor(url: string) {
    this.url = url
  }

  connect() {
    if (this.socket) {
      console.warn("WebSocket already connected")
      return
    }

    this.socket = new WebSocket(this.url)

    this.socket.addEventListener("open", () => {
      console.log("WebSocket connected")
    })

    this.socket.addEventListener("message", (event) => {
      this.handleMessage(event)
    })

    this.socket.addEventListener("close", () => {
      console.warn("WebSocket disconnected")
      this.socket = null
      if (this.shouldReconnect) {
        setTimeout(() => this.connect(), this.reconnectInterval)
      }
    })

    this.socket.addEventListener("error", (err) => {
      console.error("WebSocket error:", err)
      this.socket?.close()
    })
  }

  disconnect() {
    this.shouldReconnect = false
    if (this.socket) {
      this.socket.close()
      this.socket = null
    }
  }

  send(type: WebSocketEvents, data: unknown) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        type,
        content: data
      }))
    } else {
      console.warn("WebSocket not connected, unable to send")
    }
  }

  // Add or replace the listener for the given event
  on(event: string, listener: Listener) {
    this.listeners.set(event, listener)
  }

  // Remove the listener for the given event
  off(event: string) {
    this.listeners.delete(event)
  }

  private handleMessage(event: MessageEvent) {
    try {
      const message = JSON.parse(event.data)
      const { type, content } = message

      if (!type) {
        console.warn("Received message without type")
        return
      }

      const listener = this.listeners.get(type)
      if (listener) {
        listener(content)
      } else {
        console.warn(`No listener found for event type: ${type}`)
      }
    } catch (err) {
      console.error("Failed to parse message", err)
    }
  }
}

export const ws = new WebSocketManager("http://localhost:8080")

export enum WebSocketEvents{
    USER_TYPING = "USER_TYPING",
    NEW_MESSAGE = "NEW_MESSAGE",
    ERROR = "ERROR"
}

