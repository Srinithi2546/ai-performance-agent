import { onCLS, onLCP, onINP } from "web-vitals"

function sendMetric(metric) {

  fetch("https://ai-performance-agent.onrender.com/metrics", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
  type: metric.type || "web_vital",
  name: metric.name || "",
  value: metric.value || 0,
  rating: metric.rating || "good",
  delta: metric.delta || 0,
  sessionId: metric.sessionId || "unknown",
  url: window.location.href,
  resource: metric.resource || "",
  duration: metric.duration || 0
})
  })

  console.log("Metric Sent:", metric)

}

onCLS(sendMetric)
onLCP(sendMetric)
onINP(sendMetric)

window.addEventListener("error", (event) => {

  fetch("https://ai-performance-agent.onrender.com/errors", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      message: event.message,
      file: event.filename,
      line: event.lineno
    })
  })

  console.log("Error Sent:", event.message)

})
