/**
 * PulseGuard API Service
 * Production Ready Version
 * Uses polling instead of WebSocket
 */

const API_URL = "https://ai-performance-agent.onrender.com"

export const api = {
  // =========================================
  // Dashboard Data
  // =========================================
  async getDashboard() {
    try {
      const response = await fetch(
        `${API_URL}/dashboard`
      )

      if (!response.ok) {
        throw new Error(
          `Dashboard Error: ${response.status}`
        )
      }

      return await response.json()

    } catch (error) {
      console.error(
        "Dashboard API Error:",
        error
      )

      return null
    }
  },

  // =========================================
  // Deployment Analysis
  // =========================================
  async getDeployments() {
    try {
      const response = await fetch(
        `${API_URL}/deployments`
      )

      if (!response.ok) {
        throw new Error(
          `Deployment Error: ${response.status}`
        )
      }

      return await response.json()

    } catch (error) {
      console.error(
        "Deployments API Error:",
        error
      )

      return null
    }
  },

  // =========================================
  // Health Check
  // =========================================
  async getHealth() {
    try {
      const response = await fetch(
        `${API_URL}/`
      )

      if (!response.ok) {
        throw new Error(
          `Health Error: ${response.status}`
        )
      }

      return await response.json()

    } catch (error) {
      console.error(
        "Health Check Error:",
        error
      )

      return null
    }
  },
}

/**
 * =========================================
 * Polling Manager
 * Replaces WebSocket
 * =========================================
 */

export class PollingManager {
  constructor(onUpdate) {
    this.onUpdate = onUpdate
    this.interval = null
    this.isRunning = false
  }

  // =========================================
  // Start Polling
  // =========================================
  start() {
    if (this.isRunning) return

    this.isRunning = true

    console.log(
      "🚀 Starting dashboard polling..."
    )

    // Initial fetch
    this.fetchUpdates()

    // Poll every 3 seconds
    this.interval = setInterval(() => {
      this.fetchUpdates()
    }, 3000)
  }

  // =========================================
  // Fetch Updates
  // =========================================
  async fetchUpdates() {
    try {
      const dashboardData =
        await api.getDashboard()

      const deploymentData =
        await api.getDeployments()

      this.onUpdate({
        dashboard: dashboardData,
        deployments: deploymentData,
      })

    } catch (error) {
      console.error(
        "Polling Error:",
        error
      )
    }
  }

  // =========================================
  // Stop Polling
  // =========================================
  stop() {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }

    this.isRunning = false

    console.log(
      "🛑 Polling stopped"
    )
  }

  // =========================================
  // Status
  // =========================================
  isConnected() {
    return this.isRunning
  }
}
