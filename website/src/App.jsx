import { useState } from "react"
import "./sdk.js"

const BACKEND_URL = "http://localhost:8000"

async function sendError(data) {
  try {
    await fetch(`${BACKEND_URL}/errors`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        sessionId: window.PulseGuard?.sessionId || "unknown",
        url: window.location.href,
        timestamp: new Date().toISOString(),
        received_at: new Date().toISOString(),
      }),
    })
  } catch (e) {
    // fail silently
  }
}

async function sendMetric(data) {
  try {
    await fetch(`${BACKEND_URL}/metrics`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        sessionId: window.PulseGuard?.sessionId || "unknown",
        url: window.location.href,
        timestamp: new Date().toISOString(),
      }),
    })
  } catch (e) {
    // fail silently
  }
}

// ──────────────────────────────────────────────
// GOOD PERFORMANCE DEMO
// ──────────────────────────────────────────────
function GoodPerformanceDemo({ onBack }) {
  const [apiResult, setApiResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleFastAPI = async () => {
    setLoading(true)
    const start = performance.now()
    try {
      const response = await fetch(`${BACKEND_URL}/`)
      const data = await response.json()
      const duration = performance.now() - start
      setApiResult({ ms: duration.toFixed(0), ok: true })
      await sendMetric({
        name: "API_CALL",
        type: "api",
        resource: `${BACKEND_URL}/`,
        method: "GET",
        status: 200,
        duration,
        success: true,
        rating: duration < 500 ? "good" : "needs-improvement",
      })
    } catch (err) {
      const duration = performance.now() - start
      setApiResult({ ms: duration.toFixed(0), ok: false })
    } finally {
      setLoading(false)
    }
  }

  const handleSendGoodVital = async () => {
    await sendMetric({
      name: "LCP",
      type: "web_vital",
      value: 1.2,
      rating: "good",
      delta: 0.1,
    })
    await sendMetric({
      name: "CLS",
      type: "web_vital",
      value: 0.01,
      rating: "good",
      delta: 0.001,
    })
    await sendMetric({
      name: "INP",
      type: "web_vital",
      value: 60,
      rating: "good",
      delta: 5,
    })
    alert("✅ Sent good performance metrics to dashboard!")
  }

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.demoHeader("good")}>
        <button onClick={onBack} style={styles.backBtn}>← Back</button>
        <div>
          <h1 style={{ fontSize: "2rem", fontWeight: 700, color: "#fff", margin: 0 }}>
            ✅ Good Performance Demo
          </h1>
          <p style={{ color: "rgba(255,255,255,0.75)", margin: "6px 0 0" }}>
            Optimized page — sends healthy metrics to PulseGuard
          </p>
        </div>
      </div>

      <div style={styles.demoBody}>
        {/* Hero image */}
        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>🖼️ Fast Loading Optimized Image</h2>
          <p style={styles.sectionSub}>Small, properly sized image — low LCP impact</p>
          <div style={{ borderRadius: 12, overflow: "hidden", marginTop: 16 }}>
            <img
              src="https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1200&q=70&auto=format"
              alt="Optimized hero"
              style={{ width: "100%", height: 340, objectFit: "cover", display: "block" }}
            />
          </div>
        </section>

        {/* Feature grid */}
        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>🚀 Performance Features</h2>
          <div style={styles.grid4}>
            {[
              { icon: "⚡", title: "Fast LCP", desc: "< 1.2s Largest Contentful Paint" },
              { icon: "📐", title: "Zero CLS", desc: "No layout shifts, stable UI" },
              { icon: "🖱️", title: "Low INP", desc: "< 60ms Interaction to Paint" },
              { icon: "✅", title: "No Errors", desc: "Clean JavaScript execution" },
            ].map((f) => (
              <div key={f.title} style={styles.featureCard}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>{f.icon}</div>
                <h3 style={{ color: "#10B981", fontWeight: 700, fontSize: "1rem", marginBottom: 6 }}>{f.title}</h3>
                <p style={{ color: "#94a3b8", fontSize: "0.85rem" }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Actions */}
        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>🧪 Test Actions</h2>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 16 }}>
            <button
              onClick={handleFastAPI}
              disabled={loading}
              style={{ ...styles.actionBtn, background: "#10B981" }}
            >
              {loading ? "Testing…" : "⚡ Make Fast API Call"}
            </button>
            <button
              onClick={handleSendGoodVital}
              style={{ ...styles.actionBtn, background: "#6366f1" }}
            >
              📊 Send Good Vitals to Dashboard
            </button>
          </div>
          {apiResult && (
            <div style={{
              marginTop: 16, padding: "12px 16px", borderRadius: 8,
              background: apiResult.ok ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
              border: `1px solid ${apiResult.ok ? "#10B981" : "#ef4444"}`,
              color: apiResult.ok ? "#10B981" : "#ef4444",
              fontSize: "0.9rem",
            }}>
              {apiResult.ok ? `✅ API responded in ${apiResult.ms}ms` : `❌ API call failed after ${apiResult.ms}ms`}
            </div>
          )}
        </section>

        <div style={styles.footer("good")}>
          🟢 PulseGuard AI is monitoring this page's performance in real-time →{" "}
          <a href="http://localhost:3000" target="_blank" rel="noreferrer" style={{ color: "#34d399", textDecoration: "underline" }}>
            View Dashboard
          </a>
        </div>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────
// BAD PERFORMANCE DEMO
// ──────────────────────────────────────────────
function BadPerformanceDemo({ onBack }) {
  const [log, setLog] = useState([])
  const [slowLoading, setSlowLoading] = useState(false)

  const addLog = (msg, type = "error") => {
    setLog((prev) => [{ msg, type, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 15))
  }

  const handleJSError = async () => {
    const errMsg = "TypeError: Cannot read properties of undefined (reading 'data')"
    addLog(errMsg, "error")
    await sendError({
      name: "JS_ERROR",
      type: "js_error",
      message: errMsg,
      filename: "App.jsx",
      lineno: 142,
      colno: 18,
      stack: `TypeError: ${errMsg}\n    at BadPerformanceDemo (App.jsx:142:18)\n    at handleJSError (App.jsx:156:5)`,
    })
    alert("⚠️ JavaScript error sent to PulseGuard! Check dashboard Errors tab.")
  }

  const handlePromiseRejection = async () => {
    const errMsg = "Unhandled promise rejection: Network request failed"
    addLog(errMsg, "rejection")
    await sendError({
      name: "UNHANDLED_REJECTION",
      type: "unhandled_rejection",
      message: errMsg,
      stack: `Error: Network request failed\n    at fetchData (api.js:34:7)\n    at async loadDashboard (App.jsx:89:12)`,
    })
    alert("⚠️ Promise rejection sent to PulseGuard! Check dashboard Errors tab.")
  }

  const handleSlowAPI = async () => {
    setSlowLoading(true)
    addLog("Slow API call started (3 second delay)...", "warn")
    const start = performance.now()
    await new Promise((r) => setTimeout(r, 3000))
    const duration = performance.now() - start
    addLog(`Slow API finished: ${duration.toFixed(0)}ms`, "error")
    await sendMetric({
      name: "API_CALL",
      type: "api",
      resource: "https://slow-api.example.com/data",
      method: "GET",
      status: 504,
      duration,
      success: false,
      rating: "poor",
    })
    await sendError({
      name: "API_ERROR",
      type: "api_error",
      message: `API timeout after ${duration.toFixed(0)}ms — Gateway Timeout 504`,
      filename: "api.js",
      lineno: 34,
    })
    setSlowLoading(false)
    alert(`⚠️ Slow API (${duration.toFixed(0)}ms) sent to PulseGuard!`)
  }

  const handleSendBadVitals = async () => {
    await sendMetric({ name: "LCP", type: "web_vital", value: 8.4, rating: "poor", delta: 6.3 })
    await sendMetric({ name: "CLS", type: "web_vital", value: 0.42, rating: "poor", delta: 0.38 })
    await sendMetric({ name: "INP", type: "web_vital", value: 580, rating: "poor", delta: 520 })
    addLog("Sent poor vitals: LCP=8.4s, CLS=0.42, INP=580ms", "error")
    alert("⚠️ Poor performance vitals sent to PulseGuard! Check dashboard Overview.")
  }

  const handleMemoryLeak = async () => {
    const errMsg = "RangeError: Maximum call stack size exceeded (memory leak simulation)"
    addLog(errMsg, "error")
    await sendError({
      name: "MEMORY_ERROR",
      type: "js_error",
      message: errMsg,
      filename: "memory-leak.js",
      lineno: 88,
      colno: 4,
      stack: `RangeError: Maximum call stack size exceeded\n    at leakMemory (memory-leak.js:88:4)\n    at leakMemory (memory-leak.js:88:4)\n    at leakMemory (memory-leak.js:88:4)`,
    })
    alert("⚠️ Memory error sent to PulseGuard!")
  }

  const handleBlockMainThread = async () => {
    addLog("Blocking main thread for 1 second...", "warn")
    const start = Date.now()
    while (Date.now() - start < 1000) { /* block */ }
    addLog("Main thread unblocked — INP will be very high", "error")
    await sendMetric({ name: "INP", type: "web_vital", value: 1200, rating: "poor", delta: 1140 })
    alert("Main thread was blocked for 1s — poor INP metric sent!")
  }

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.demoHeader("bad")}>
        <button onClick={onBack} style={styles.backBtn}>← Back</button>
        <div>
          <h1 style={{ fontSize: "2rem", fontWeight: 700, color: "#fff", margin: 0 }}>
            ❌ Bad Performance Demo
          </h1>
          <p style={{ color: "rgba(255,255,255,0.75)", margin: "6px 0 0" }}>
            Intentional issues — sends errors & poor metrics to PulseGuard
          </p>
        </div>
      </div>

      <div style={styles.demoBody}>
        <div style={styles.grid2}>
          {/* Left: Actions */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            <section style={styles.card}>
              <h2 style={styles.sectionTitle}>⚠️ Trigger Performance Issues</h2>
              <p style={styles.sectionSub}>Each button sends real errors/metrics to the backend & dashboard</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
                <button onClick={handleSendBadVitals} style={{ ...styles.actionBtn, background: "#dc2626" }}>
                  📉 Send Poor Web Vitals (LCP, CLS, INP)
                </button>
                <button onClick={handleJSError} style={{ ...styles.actionBtn, background: "#b91c1c" }}>
                  🔴 Trigger JavaScript Error
                </button>
                <button onClick={handlePromiseRejection} style={{ ...styles.actionBtn, background: "#92400e" }}>
                  🟡 Trigger Promise Rejection
                </button>
                <button
                  onClick={handleSlowAPI}
                  disabled={slowLoading}
                  style={{ ...styles.actionBtn, background: "#c2410c" }}
                >
                  {slowLoading ? "⏳ Waiting 3s…" : "🐢 Slow API Call (3s timeout)"}
                </button>
                <button onClick={handleMemoryLeak} style={{ ...styles.actionBtn, background: "#7f1d1d" }}>
                  💾 Simulate Memory Leak Error
                </button>
                <button onClick={handleBlockMainThread} style={{ ...styles.actionBtn, background: "#78350f" }}>
                  🧱 Block Main Thread (1s — poor INP)
                </button>
              </div>
            </section>

            {/* Huge image for LCP */}
            <section style={styles.card}>
              <h2 style={styles.sectionTitle}>🖼️ Huge Unoptimized Image</h2>
              <p style={styles.sectionSub}>Large 4K image — impacts LCP severely</p>
              <div style={{ borderRadius: 12, overflow: "hidden", marginTop: 16, border: "2px solid #dc2626" }}>
                <img
                  src="https://picsum.photos/1600/900?random=99"
                  alt="Unoptimized large image"
                  style={{ width: "100%", display: "block", maxHeight: 280, objectFit: "cover" }}
                />
              </div>
            </section>
          </div>

          {/* Right: Live error log */}
          <section style={{ ...styles.card, display: "flex", flexDirection: "column" }}>
            <h2 style={styles.sectionTitle}>🔴 Live Error Feed</h2>
            <p style={styles.sectionSub}>Errors appearing here are also sent to the dashboard</p>
            <div style={{
              flex: 1,
              marginTop: 16,
              background: "#0f0f0f",
              borderRadius: 10,
              padding: 12,
              fontFamily: "monospace",
              fontSize: "0.78rem",
              overflowY: "auto",
              maxHeight: 480,
              minHeight: 200,
            }}>
              {log.length === 0 ? (
                <p style={{ color: "#475569", padding: 8 }}>No errors yet — trigger one above ↑</p>
              ) : (
                log.map((l, i) => (
                  <div key={i} style={{
                    padding: "6px 8px",
                    marginBottom: 6,
                    borderRadius: 6,
                    background: l.type === "warn" ? "rgba(234,179,8,0.08)" : "rgba(239,68,68,0.08)",
                    borderLeft: `3px solid ${l.type === "warn" ? "#eab308" : "#ef4444"}`,
                    color: l.type === "warn" ? "#fde68a" : "#fca5a5",
                  }}>
                    <span style={{ color: "#64748b", marginRight: 8 }}>{l.time}</span>
                    {l.msg}
                  </div>
                ))
              )}
            </div>
            <div style={{ marginTop: 12, fontSize: "0.8rem", color: "#64748b" }}>
              💡 Open{" "}
              <a href="http://localhost:3000" target="_blank" rel="noreferrer" style={{ color: "#f87171" }}>
                Dashboard → Errors tab
              </a>{" "}
              to see these in real-time
            </div>
          </section>
        </div>

        <div style={styles.footer("bad")}>
          🔴 PulseGuard AI is tracking all performance issues on this page →{" "}
          <a href="http://localhost:3000" target="_blank" rel="noreferrer" style={{ color: "#f87171", textDecoration: "underline" }}>
            View Dashboard
          </a>
        </div>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────
// HOME SELECTOR
// ──────────────────────────────────────────────
function HomeSelector({ onSelect }) {
  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
    }}>
      {/* Logo / Brand */}
      <div style={{ textAlign: "center", marginBottom: 48 }}>
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 14,
          marginBottom: 20,
        }}>
          <div style={{
            width: 56, height: 56,
            borderRadius: 16,
            background: "linear-gradient(135deg, #a855f7, #ec4899)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 28, boxShadow: "0 0 32px rgba(168,85,247,0.5)",
          }}>
            ⚡
          </div>
          <h1 style={{
            fontSize: "2.2rem", fontWeight: 800, color: "#fff",
            letterSpacing: "-0.5px", margin: 0,
          }}>
            PulseGuard <span style={{
              background: "linear-gradient(90deg,#a855f7,#ec4899)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>AI</span>
          </h1>
        </div>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "1.1rem", maxWidth: 480, margin: "0 auto" }}>
          Frontend Performance Monitoring · Web Vitals · Error Tracking · AI Analysis
        </p>
      </div>

      {/* Demo cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 24,
        maxWidth: 1000,
        width: "100%",
      }}>
        {/* Good Demo */}
        <button
          onClick={() => onSelect("good")}
          style={{
            background: "rgba(16,185,129,0.08)",
            border: "2px solid rgba(16,185,129,0.3)",
            borderRadius: 20,
            padding: "36px 28px",
            cursor: "pointer",
            textAlign: "left",
            transition: "all 0.2s",
            color: "inherit",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(16,185,129,0.16)"; e.currentTarget.style.borderColor = "#10B981"; e.currentTarget.style.transform = "translateY(-4px)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(16,185,129,0.08)"; e.currentTarget.style.borderColor = "rgba(16,185,129,0.3)"; e.currentTarget.style.transform = "translateY(0)"; }}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <h2 style={{ color: "#10B981", fontSize: "1.3rem", fontWeight: 700, marginBottom: 10 }}>
            Good Performance
          </h2>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.9rem", lineHeight: 1.6 }}>
            Optimized images, fast API calls, zero errors. Sends healthy metrics — LCP &lt; 2s, CLS ≈ 0.01, INP &lt; 100ms.
          </p>
          <div style={{ marginTop: 20, display: "flex", gap: 8, flexWrap: "wrap" }}>
            {["LCP: Good", "CLS: Good", "INP: Good"].map(t => (
              <span key={t} style={{ background: "rgba(16,185,129,0.2)", color: "#34d399", padding: "4px 12px", borderRadius: 100, fontSize: "0.75rem", fontWeight: 600 }}>{t}</span>
            ))}
          </div>
        </button>

        {/* Bad Demo */}
        <button
          onClick={() => onSelect("bad")}
          style={{
            background: "rgba(220,38,38,0.08)",
            border: "2px solid rgba(220,38,38,0.3)",
            borderRadius: 20,
            padding: "36px 28px",
            cursor: "pointer",
            textAlign: "left",
            transition: "all 0.2s",
            color: "inherit",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(220,38,38,0.16)"; e.currentTarget.style.borderColor = "#dc2626"; e.currentTarget.style.transform = "translateY(-4px)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(220,38,38,0.08)"; e.currentTarget.style.borderColor = "rgba(220,38,38,0.3)"; e.currentTarget.style.transform = "translateY(0)"; }}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>❌</div>
          <h2 style={{ color: "#ef4444", fontSize: "1.3rem", fontWeight: 700, marginBottom: 10 }}>
            Bad Performance
          </h2>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.9rem", lineHeight: 1.6 }}>
            Huge images, slow API, JS errors, memory leaks. Sends poor metrics and real errors to the dashboard.
          </p>
          <div style={{ marginTop: 20, display: "flex", gap: 8, flexWrap: "wrap" }}>
            {["LCP: Poor", "CLS: Poor", "JS Errors"].map(t => (
              <span key={t} style={{ background: "rgba(220,38,38,0.2)", color: "#f87171", padding: "4px 12px", borderRadius: 100, fontSize: "0.75rem", fontWeight: 600 }}>{t}</span>
            ))}
          </div>
        </button>

        {/* Original Website */}
        <button
          onClick={() => onSelect("original")}
          style={{
            background: "rgba(59,130,246,0.08)",
            border: "2px solid rgba(59,130,246,0.3)",
            borderRadius: 20,
            padding: "36px 28px",
            cursor: "pointer",
            textAlign: "left",
            transition: "all 0.2s",
            color: "inherit",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(59,130,246,0.16)"; e.currentTarget.style.borderColor = "#3b82f6"; e.currentTarget.style.transform = "translateY(-4px)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(59,130,246,0.08)"; e.currentTarget.style.borderColor = "rgba(59,130,246,0.3)"; e.currentTarget.style.transform = "translateY(0)"; }}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>🏫</div>
          <h2 style={{ color: "#3b82f6", fontSize: "1.3rem", fontWeight: 700, marginBottom: 10 }}>
            Original Website
          </h2>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.9rem", lineHeight: 1.6 }}>
            Panimalar Engineering College website. Full page tracked by PulseGuard Dashboard.
          </p>
          <div style={{ marginTop: 20, display: "flex", gap: 8, flexWrap: "wrap" }}>
            {["Full Page", "Real Content", "Live Tracking"].map(t => (
              <span key={t} style={{ background: "rgba(59,130,246,0.2)", color: "#60a5fa", padding: "4px 12px", borderRadius: 100, fontSize: "0.75rem", fontWeight: 600 }}>{t}</span>
            ))}
          </div>
        </button>
      </div>

      {/* Info strip */}
      <div style={{
        marginTop: 40,
        padding: "16px 28px",
        background: "rgba(255,255,255,0.05)",
        borderRadius: 14,
        border: "1px solid rgba(255,255,255,0.1)",
        display: "flex",
        alignItems: "center",
        gap: 12,
        maxWidth: 720,
        width: "100%",
      }}>
        <span style={{ fontSize: 22 }}>💡</span>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.88rem", margin: 0 }}>
          Open the <a href="http://localhost:3000" target="_blank" rel="noreferrer" style={{ color: "#a78bfa", textDecoration: "none", fontWeight: 600 }}>PulseGuard Dashboard at localhost:3000</a> side-by-side to watch metrics and errors update in real-time as you interact with either demo.
        </p>
      </div>

      {/* Service status */}
      <div style={{ marginTop: 28, display: "flex", gap: 24 }}>
        {[
          { label: "Backend API", port: "8000", color: "#10B981" },
          { label: "Website", port: "5173", color: "#6366f1" },
          { label: "Dashboard", port: "3000", color: "#a855f7" },
        ].map(s => (
          <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 8, color: "rgba(255,255,255,0.5)", fontSize: "0.82rem" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.color, boxShadow: `0 0 6px ${s.color}` }} />
            {s.label} :{s.port}
          </div>
        ))}
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────
// SHARED STYLES
// ──────────────────────────────────────────────
const styles = {
  page: {
    minHeight: "100vh",
    background: "#0d1117",
    color: "#e2e8f0",
    fontFamily: "'Inter', system-ui, sans-serif",
  },
  demoHeader: (variant) => ({
    display: "flex",
    alignItems: "center",
    gap: 20,
    padding: "20px 32px",
    background: variant === "good"
      ? "linear-gradient(90deg, #064e3b, #065f46)"
      : variant === "bad"
      ? "linear-gradient(90deg, #7f1d1d, #991b1b)"
      : "linear-gradient(90deg, #1e3a8a, #1e40af)",
    borderBottom: `2px solid ${variant === "good" ? "#10B981" : variant === "bad" ? "#dc2626" : "#3b82f6"}`,
    position: "sticky",
    top: 0,
    zIndex: 10,
  }),
  backBtn: {
    padding: "8px 16px",
    background: "rgba(255,255,255,0.15)",
    border: "1px solid rgba(255,255,255,0.3)",
    borderRadius: 8,
    color: "#fff",
    cursor: "pointer",
    fontSize: "0.88rem",
    fontWeight: 600,
    whiteSpace: "nowrap",
  },
  demoBody: {
    maxWidth: 1100,
    margin: "0 auto",
    padding: "32px 24px",
    display: "flex",
    flexDirection: "column",
    gap: 24,
  },
  card: {
    background: "#161b22",
    border: "1px solid #30363d",
    borderRadius: 16,
    padding: "28px",
  },
  sectionTitle: {
    fontSize: "1.1rem",
    fontWeight: 700,
    color: "#f1f5f9",
    marginBottom: 4,
  },
  sectionSub: {
    fontSize: "0.85rem",
    color: "#64748b",
    marginTop: 4,
  },
  grid4: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 16,
    marginTop: 20,
  },
  grid2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 24,
  },
  featureCard: {
    background: "#0d1117",
    border: "1px solid #30363d",
    borderRadius: 12,
    padding: "20px 16px",
    textAlign: "center",
  },
  actionBtn: {
    padding: "12px 20px",
    fontSize: "0.9rem",
    fontWeight: 600,
    color: "#fff",
    border: "none",
    borderRadius: 10,
    cursor: "pointer",
    width: "100%",
    textAlign: "left",
    letterSpacing: "0.01em",
    transition: "opacity 0.15s",
  },
  footer: (variant) => ({
    padding: "16px 20px",
    background: variant === "good" ? "rgba(16,185,129,0.06)" : "rgba(220,38,38,0.06)",
    border: `1px solid ${variant === "good" ? "rgba(16,185,129,0.2)" : "rgba(220,38,38,0.2)"}`,
    borderRadius: 12,
    color: "rgba(255,255,255,0.6)",
    fontSize: "0.88rem",
  }),
}

// ──────────────────────────────────────────────
// ROOT APP
// ──────────────────────────────────────────────
// ──────────────────────────────────────────────
// ORIGINAL COLLEGE WEBSITE
// ──────────────────────────────────────────────
function OriginalWebsite({ onBack }) {
  return (
    <div style={{ position: "relative", width: "100%", height: "100vh" }}>
      {/* Floating back button */}
      <button
        onClick={onBack}
        style={{
          position: "fixed",
          top: 12,
          left: 12,
          zIndex: 1000,
          padding: "8px 18px",
          background: "rgba(26, 75, 140, 0.9)",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(255,255,255,0.3)",
          borderRadius: 8,
          color: "#fff",
          cursor: "pointer",
          fontSize: "0.88rem",
          fontWeight: 600,
          boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
          transition: "all 0.2s",
        }}
        onMouseEnter={e => { e.currentTarget.style.background = "rgba(13, 43, 90, 0.95)"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "rgba(26, 75, 140, 0.9)"; }}
      >
        ← Back to PulseGuard
      </button>
      <iframe
        src="/panimalar.html"
        style={{
          width: "100%",
          height: "100%",
          border: "none",
          background: "#fff",
        }}
        title="Panimalar Engineering Website"
      />
    </div>
  )
}

export default function App() {
  const [page, setPage] = useState("selector")

  if (page === "good") return <GoodPerformanceDemo onBack={() => setPage("selector")} />
  if (page === "bad") return <BadPerformanceDemo onBack={() => setPage("selector")} />
  if (page === "original") return <OriginalWebsite onBack={() => setPage("selector")} />
  return <HomeSelector onSelect={setPage} />
}
