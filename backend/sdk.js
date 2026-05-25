import { onCLS, onLCP, onINP } from "web-vitals"

function sendMetric(metric) {

  fetch("http://localhost:8000/metrics", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(metric)
  })

  console.log("Metric Sent:", metric)

}

onCLS(sendMetric)
onLCP(sendMetric)
onINP(sendMetric)

window.addEventListener("error", (event) => {

  fetch("http://localhost:8000/errors", {
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
