import { onCLS, onLCP, onINP } from "web-vitals"

/**
 * PulseGuard AI - Frontend Performance Monitoring SDK
 * Monitors Web Vitals, JavaScript errors, and API failures
 */

const BACKEND_URL = "http://localhost:8000"
const SESSION_ID = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
const NAMESPACE = "[PulseGuard]"

// Track API performance
const apiMetrics = []
const originalFetch = window.fetch

/**
 * Intercept fetch calls to track API performance and failures
 */
window.fetch = function (...args) {
  const startTime = performance.now()
  const [resource, config] = args
  
  return originalFetch
    .apply(this, args)
    .then((response) => {
      const duration = performance.now() - startTime
      
      // Track successful API calls
      sendMetric({
        name: "API_CALL",
        type: "api",
        resource: typeof resource === "string" ? resource : resource.url,
        method: config?.method || "GET",
        status: response.status,
        duration,
        timestamp: Date.now(),
        success: response.ok,
      })
      
      console.log(`${NAMESPACE} API: ${config?.method || "GET"} ${resource} - ${response.status} (${duration.toFixed(0)}ms)`)
      return response
    })
    .catch((error) => {
      const duration = performance.now() - startTime
      
      // Track failed API calls
      sendMetric({
        name: "API_ERROR",
        type: "api_error",
        resource: typeof resource === "string" ? resource : resource.url,
        method: config?.method || "GET",
        error: error.message,
        duration,
        timestamp: Date.now(),
        success: false,
      })
      
      console.error(`${NAMESPACE} API Error: ${resource}`, error)
      throw error
    })
}

/**
 * Send metric to backend
 */
function sendMetric(data) {
  const payload = {
    ...data,
    sessionId: SESSION_ID,
    url: window.location.href,
    userAgent: navigator.userAgent,
    timestamp: data.timestamp || Date.now(),
  }

  try {
    navigator.sendBeacon(
      `${BACKEND_URL}/metrics`,
      JSON.stringify(payload)
    ) || 
    fetch(`${BACKEND_URL}/metrics`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {}) // Fail silently to not interrupt user's app
  } catch (e) {
    console.warn(`${NAMESPACE} Failed to send metric`, e)
  }
}

/**
 * Track Web Vitals - Core Performance Metrics
 */
function handleVital(metric) {
  // Skip INP=0 — those are meaningless pre-interaction baselines
  if (metric.name === "INP" && metric.value === 0) return

  console.log(`${NAMESPACE} Web Vital: ${metric.name} = ${metric.value} (${metric.rating})`)
  
  sendMetric({
    name: metric.name,
    type: "web_vital",
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
    id: metric.id,
  }) 
}

// Enable continuous reporting of INP
onCLS(handleVital, { reportAllChanges: true })
onLCP(handleVital, { reportAllChanges: true })
onINP(handleVital, { reportAllChanges: true })

/**
 * Capture uncaught JavaScript errors
 */
window.addEventListener("error", (event) => {
  console.error(`${NAMESPACE} Runtime Error:`, event.message)
  
  sendMetric({
    name: "JS_ERROR",
    type: "js_error",
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    stack: event.error?.stack,
  })
})

/**
 * Capture unhandled promise rejections
 */
window.addEventListener("unhandledrejection", (event) => {
  console.error(`${NAMESPACE} Unhandled Rejection:`, event.reason)
  
  sendMetric({
    name: "UNHANDLED_REJECTION",
    type: "unhandled_rejection",
    message: event.reason?.message || String(event.reason),
    stack: event.reason?.stack,
  })
})

/**
 * Track page visibility and performance
 */
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    sendMetric({
      name: "PAGE_HIDDEN",
      type: "page_event",
      timestamp: Date.now(),
    })
  } else {
    sendMetric({
      name: "PAGE_VISIBLE",
      type: "page_event",
      timestamp: Date.now(),
    })
  }
})

/**
 * Track page unload for session completion
 */
window.addEventListener("beforeunload", () => {
  sendMetric({
    name: "SESSION_END",
    type: "session",
    sessionId: SESSION_ID,
  })
})

// Log SDK initialization
console.log(`${NAMESPACE} SDK initialized - Session: ${SESSION_ID}`)

// Export for manual tracking if needed
window.PulseGuard = {
  sendMetric,
  sessionId: SESSION_ID,
  trackCustomEvent: (name, data) => {
    sendMetric({
      name: `CUSTOM_${name}`,
      type: "custom",
      ...data,
    })
  },
}
