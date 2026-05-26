/**
 * API Service for Dashboard
 * PulseGuard AI
 */

const API_URL = "https://ai-performance-agent.onrender.com"

/* ============================================
   API METHODS
============================================ */

export const api = {

  // ============================================
  // Dashboard Data
  // ============================================

  async getDashboard() {

    try {

      const response = await fetch(
        `${API_URL}/dashboard`
      )

      if (!response.ok) {
        throw new Error("Failed to fetch dashboard")
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

  // ============================================
  // Deployment Data
  // ============================================

  async getDeployments() {

    try {

      const response = await fetch(
        `${API_URL}/deployments`
      )

      if (!response.ok) {
        throw new Error("Failed to fetch deployments")
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

  // ============================================
  // Health Check
  // ============================================

  async getHealth() {

    try {

      const response = await fetch(
        `${API_URL}/`
      )

      if (!response.ok) {
        throw new Error("Backend unavailable")
      }

      return await response.json()

    } catch (error) {

      console.error(
        "Health check error:",
        error
      )

      return null
    }
  },
}

/* ============================================
   SIMPLE POLLING MANAGER
============================================ */

export class PollingManager {

  constructor(callback, interval = 3000) {

    this.callback = callback

    this.interval = interval

    this.timer = null
  }

  // ============================================
  // START POLLING
  // ============================================

  connect() {

    this.fetchData()

    this.timer = setInterval(() => {

      this.fetchData()

    }, this.interval)
  }

  // ============================================
  // FETCH DASHBOARD
  // ============================================

  async fetchData() {

    try {

      const data = await api.getDashboard()

      if (data && this.callback) {

        this.callback({
          type: "dashboard",
          data,
        })
      }

    } catch (error) {

      console.error(
        "Polling error:",
        error
      )
    }
  }

  // ============================================
  // STOP POLLING
  // ============================================

  disconnect() {

    if (this.timer) {

      clearInterval(this.timer)

      this.timer = null
    }
  }

  // ============================================
  // STATUS
  // ============================================

  isConnected() {

    return this.timer !== null
  }
}
