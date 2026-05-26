/**
 * API Service for Dashboard
 * Handles all communication with PulseGuard Backend
 */

const API_URL = "https://ai-performance-agent.onrender.com"

export const api = {
  // Get dashboard data
  async getDashboard() {
    try {
      const response = await fetch(`${API_URL}/dashboard`)
      if (!response.ok) throw new Error("Failed to fetch dashboard")
      return await response.json()
    } catch (error) {
      console.error("Dashboard API Error:", error)
      return null
    }
  },

  // Get deployment analysis
  async getDeployments() {
    try {
      const response = await fetch(`${API_URL}/deployments`)
      if (!response.ok) throw new Error("Failed to fetch deployments")
      return await response.json()
    } catch (error) {
      console.error("Deployments API Error:", error)
      return null
    }
  },

  // Get backend health
  async getHealth() {
    try {
      const response = await fetch(`${API_URL}/`)
      if (!response.ok) throw new Error("Backend unavailable")
      return await response.json()
    } catch (error) {
      console.error("Health check error:", error)
      return null
    }
  },
}

/**
 * WebSocket Manager
 * Handles real-time updates from backend
 */
export class WebSocketManager {
  constructor(onMessage) {
    this.ws = null
    this.onMessage = onMessage
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectDelay = 2000
  }

  connect() {
    try {
      const wsUrl = `ws://ai-performance-agent.onrender.com/ws`
      console.log("Connecting to WebSocket:", wsUrl)
      
      this.ws = new WebSocket(wsUrl)
      
      this.ws.onopen = () => {
        console.log("✅ WebSocket connected")
        this.reconnectAttempts = 0
        // Send ping to keep connection alive
        this.keepAlive()
      }
      
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          this.onMessage(data)
        } catch (error) {
          console.error("Failed to parse WebSocket message:", error)
        }
      }
      
      this.ws.onerror = (error) => {
        console.error("WebSocket error:", error)
      }
      
      this.ws.onclose = () => {
        console.log("❌ WebSocket disconnected")
        this.attemptReconnect()
      }
    } catch (error) {
      console.error("WebSocket connection error:", error)
      this.attemptReconnect()
    }
  }

  keepAlive() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send("ping")
      setTimeout(() => this.keepAlive(), 30000) // Ping every 30s
    }
  }

  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      console.log(`Reconnecting... Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`)
      setTimeout(() => this.connect(), this.reconnectDelay)
    } else {
      console.error("Max reconnection attempts reached")
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN
  }
}
