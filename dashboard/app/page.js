"use client"

import { useEffect, useState, useRef } from "react"
import {
  LayoutDashboard,
  Activity,
  AlertTriangle,
  Brain,
  Zap,
  TrendingUp,
  Wifi,
  Server,
  CheckCircle,
} from "lucide-react"
import { motion } from "framer-motion"
import { MetricCard, AIInsights, ErrorTable, APIStats, CardSkeleton } from "@/components/MetricsCard"
import { api, PollingManager } from "@/lib/api"

export default function Dashboard() {
  const [activePage, setActivePage] = useState("Overview")
  const [isLoaded, setIsLoaded] = useState(false)
  const [showNotification, setShowNotification] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState("")
  const wsRef = useRef(null)
  
  // Dashboard state
  const [summary, setSummary] = useState(null)
  const [metrics, setMetrics] = useState({})
  const [errors, setErrors] = useState([])
  const [aiAnalysis, setAiAnalysis] = useState("Analyzing frontend telemetry...")
  const [apiStats, setApiStats] = useState({})
  const [deployment, setDeployment] = useState(null)

  // Initialize on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 1000)
    return () => clearTimeout(timer)
  }, [])

  // Setup data fetching and WebSocket
  useEffect(() => {
    if (!isLoaded) return
    
    // Initial fetch
    fetchDashboardData()
    fetchDeploymentData()
    
    // Setup WebSocket
    setupWebSocket()
    
    // Poll every 3 seconds
    const pollInterval = setInterval(() => {
      fetchDashboardData()
      if (activePage === "Deployments") {
        fetchDeploymentData()
      }
    }, 3000)
    
    return () => {
      clearInterval(pollInterval)
      if (wsRef.current) {
        wsRef.current.disconnect()
      }
    }
  }, [isLoaded, activePage])

  async function fetchDashboardData() {
    const data = await api.getDashboard()
    if (data) {
      setSummary(data.summary)
      setMetrics(data.metrics || {})
      setErrors(data.errors || [])
      setAiAnalysis(data.ai_analysis || "Analyzing...")
      setApiStats(data.metrics?.api_stats || {})
    }
  }

  async function fetchDeploymentData() {
    const data = await api.getDeployments()
    if (data) {
      setDeployment(data)
    }
  }

  function setupWebSocket() {
    wsRef.current = new PollingManager((data) => {
      switch (data.type) {
        case "metric":
          setSummary(data.summary)
          showNotificationMessage(`📊 Metric: ${data.data.name}`)
          break
        case "error":
          setErrors((prev) => [data.data, ...prev].slice(0, 50))
          showNotificationMessage(`⚠️ Error: ${data.data.message}`)
          break
        case "analysis":
          setAiAnalysis(data.data.analysis)
          showNotificationMessage("🤖 AI analysis complete")
          break
        default:
          break
      }
    })
    wsRef.current.connect()
  }

  function showNotificationMessage(message) {
    setNotificationMessage(message)
    setShowNotification(true)
    setTimeout(() => setShowNotification(false), 3000)
  }

  if (!isLoaded) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 text-white">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-6">
          <div className="flex gap-2">
            {[0, 150, 300].map((delay) => (
              <span
                key={delay}
                className="h-3 w-3 rounded-full bg-purple-500 animate-bounce"
                style={{ animationDelay: `${delay}ms` }}
              />
            ))}
          </div>
          <p className="text-slate-400">Initializing PulseGuard...</p>
        </motion.div>
      </div>
    )
  }

  const getRecentVitals = () => {
    const vitals = summary?.lcp || {}
    return {
      lcp: vitals.value ? vitals.value.toFixed(2) : "—",
      lcpRating: vitals.rating,
      cls: summary?.cls?.value ? summary.cls.value.toFixed(3) : "—",
      clsRating: summary?.cls?.rating,
      inp: summary?.inp?.value ? summary.inp.value.toFixed(0) : "—",
      inpRating: summary?.inp?.rating,
    }
  }

  const vitals = getRecentVitals()

  const menuItems = [
    { icon: LayoutDashboard, label: "Overview" },
    { icon: Activity, label: "Metrics" },
    { icon: AlertTriangle, label: "Errors" },
    { icon: Brain, label: "AI Insights" },
    { icon: Server, label: "Deployments" },
    { icon: Wifi, label: "Demo" },
  ]

  return (
    <div className="flex min-h-screen bg-slate-950 text-white">
      {/* Notification Toast */}
      {showNotification && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-800 border border-slate-700 rounded-lg px-6 py-3 shadow-lg"
        >
          {notificationMessage}
        </motion.div>
      )}

      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-700 bg-slate-900/50 p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            PulseGuard AI
          </h1>
          <p className="text-xs text-slate-400 mt-1">Frontend Monitor</p>
        </div>

        <nav className="space-y-2">
          {menuItems.map((item) => (
            <motion.button
              key={item.label}
              whileHover={{ x: 4 }}
              onClick={() => setActivePage(item.label)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                activePage === item.label
                  ? "bg-purple-600/30 border border-purple-500/50 text-purple-200"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              <item.icon size={20} />
              {item.label}
            </motion.button>
          ))}
        </nav>

        <div className="mt-8 p-4 rounded-lg border border-slate-700 bg-slate-800/50">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-slate-400">Live Monitoring</span>
          </div>
          <p className="text-sm font-mono text-slate-300">localhost:5173</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">{activePage}</h1>
          <p className="text-slate-400">
            {activePage === "Overview" && "Real-time frontend performance monitoring"}
            {activePage === "Metrics" && "Detailed web vital metrics and trends"}
            {activePage === "Errors" && "JavaScript errors and runtime issues"}
            {activePage === "AI Insights" && "AI-powered performance analysis"}
            {activePage === "Deployments" && "Deployment tracking and regression analysis"}
            {activePage === "Demo" && "Live demo page with performance metrics"}
          </p>
        </div>

        {/* Overview Page */}
        {activePage === "Overview" && (
          <div className="space-y-6">
            {/* Web Vitals Cards */}
            <div className="grid grid-cols-3 gap-6">
              <MetricCard name="LCP" value={vitals.lcp} rating={vitals.lcpRating} unit="s" />
              <MetricCard name="CLS" value={vitals.cls} rating={vitals.clsRating} unit="" />
              <MetricCard name="INP" value={vitals.inp} rating={vitals.inpRating} unit="ms" />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-6">
              <APIStats stats={apiStats} />
              <ErrorTable errors={errors} />
            </div>

            {/* AI Insights */}
            <AIInsights analysis={aiAnalysis} />
          </div>
        )}

        {/* Metrics Page */}
        {activePage === "Metrics" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Web Vitals Trend</h3>
                <div className="space-y-4">
                  {[
                    { name: "LCP", value: vitals.lcp, unit: "s", status: vitals.lcpRating },
                    { name: "CLS", value: vitals.cls, unit: "", status: vitals.clsRating },
                    { name: "INP", value: vitals.inp, unit: "ms", status: vitals.inpRating },
                  ].map((metric) => (
                    <div key={metric.name} className="flex justify-between items-center">
                      <span className="text-slate-400">{metric.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold">{metric.value} {metric.unit}</span>
                        <span className="text-xs px-2 py-1 rounded bg-slate-700 text-slate-300">
                          {metric.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <APIStats stats={apiStats} />
            </div>
          </div>
        )}

        {/* Errors Page */}
        {activePage === "Errors" && (
          <div>
            <ErrorTable errors={errors} />
          </div>
        )}

        {/* AI Insights Page */}
        {activePage === "AI Insights" && (
          <div>
            <AIInsights analysis={aiAnalysis} />
          </div>
        )}

        {/* Deployments Page */}
        {activePage === "Deployments" && deployment && (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Deployment Info</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-400 text-sm">Version</p>
                  <p className="text-white font-semibold">{deployment.deployment?.version}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Risk Level</p>
                  <p className="text-white font-semibold">{deployment.risk_level}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-lg p-6">
                <h4 className="text-white font-semibold mb-4">Metric Comparison</h4>
                <div className="space-y-3">
                  {deployment.comparison?.map((comp) => (
                    <div key={comp.metric} className="flex justify-between items-center">
                      <span className="text-slate-400">{comp.metric}</span>
                      <div className="flex gap-3 text-sm">
                        <span className="text-slate-300">{comp.before}</span>
                        <span className="text-slate-500">→</span>
                        <span className="text-slate-300">{comp.after}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-lg p-6">
                <h4 className="text-white font-semibold mb-4">AI Analysis</h4>
                <p className="text-slate-300 text-sm">{deployment.ai_analysis}</p>
              </div>
            </div>
          </div>
        )}

        {/* Demo Page */}
        {activePage === "Demo" && (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">PulseGuard AI Demo</h3>
              <p className="text-slate-400 text-sm mb-4">Interactive demo showing performance monitoring in action. This demo sends metrics to the dashboard below.</p>
              <iframe
                src="http://localhost:5173"
                title="PulseGuard AI Demo"
                className="w-full h-screen border border-slate-700 rounded-lg"
                style={{ minHeight: "800px" }}
              />
            </div>

            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Static Content</h3>
              <p className="text-slate-400 text-sm mb-4">Static HTML pages from the website project.</p>
              <iframe
                src="http://localhost:5173/index.html"
                title="Static Content"
                className="w-full border border-slate-700 rounded-lg"
                style={{ minHeight: "600px" }}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
