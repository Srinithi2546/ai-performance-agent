"use client"

import { useEffect, useState } from "react"
import {
  LayoutDashboard,
  Activity,
  AlertTriangle,
  Brain,
  Wifi,
  Server,
} from "lucide-react"

import { motion } from "framer-motion"

import {
  MetricCard,
  AIInsights,
  ErrorTable,
  APIStats,
} from "@/components/MetricsCard"

import { api } from "@/lib/api"

export default function Dashboard() {

  const [activePage, setActivePage] = useState("Overview")
  const [isLoaded, setIsLoaded] = useState(false)

  const [summary, setSummary] = useState(null)
  const [metrics, setMetrics] = useState({})
  const [errors, setErrors] = useState([])
  const [aiAnalysis, setAiAnalysis] = useState("Analyzing frontend telemetry...")
  const [apiStats, setApiStats] = useState({})
  const [deployment, setDeployment] = useState(null)

  // ============================================
  // Initial Loader
  // ============================================

  useEffect(() => {

    const timer = setTimeout(() => {
      setIsLoaded(true)
    }, 1000)

    return () => clearTimeout(timer)

  }, [])

  // ============================================
  // Poll Backend Every 3 Seconds
  // ============================================

  useEffect(() => {

    if (!isLoaded) return

    fetchDashboardData()
    fetchDeploymentData()

    const interval = setInterval(() => {

      fetchDashboardData()

      if (activePage === "Deployments") {
        fetchDeploymentData()
      }

    }, 3000)

    return () => clearInterval(interval)

  }, [isLoaded, activePage])

  // ============================================
  // Fetch Dashboard
  // ============================================

  async function fetchDashboardData() {

    try {

      const data = await api.getDashboard()

      if (data) {

        setSummary(data.summary || null)

        setMetrics(data.metrics || {})

        setErrors(data.errors || [])

        setAiAnalysis(
          data.ai_analysis || "No AI analysis available"
        )

        setApiStats(
          data.metrics?.api_stats || {}
        )
      }

    } catch (error) {

      console.error("Dashboard fetch error:", error)
    }
  }

  // ============================================
  // Fetch Deployments
  // ============================================

  async function fetchDeploymentData() {

    try {

      const data = await api.getDeployments()

      if (data) {
        setDeployment(data)
      }

    } catch (error) {

      console.error("Deployment fetch error:", error)
    }
  }

  // ============================================
  // Loading Screen
  // ============================================

  if (!isLoaded) {

    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 text-white">

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-6"
        >

          <div className="flex gap-2">

            {[0, 150, 300].map((delay) => (
              <span
                key={delay}
                className="h-3 w-3 rounded-full bg-purple-500 animate-bounce"
                style={{ animationDelay: `${delay}ms` }}
              />
            ))}

          </div>

          <p className="text-slate-400">
            Initializing PulseGuard...
          </p>

        </motion.div>

      </div>
    )
  }

  // ============================================
  // Metrics
  // ============================================

  const vitals = {
    lcp: summary?.lcp?.value
      ? Number(summary.lcp.value).toFixed(2)
      : "—",

    lcpRating: summary?.lcp?.rating,

    cls: summary?.cls?.value
      ? Number(summary.cls.value).toFixed(3)
      : "—",

    clsRating: summary?.cls?.rating,

    inp: summary?.inp?.value
      ? Number(summary.inp.value).toFixed(0)
      : "—",

    inpRating: summary?.inp?.rating,
  }

  // ============================================
  // Sidebar Menu
  // ============================================

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

      {/* Sidebar */}

      <aside className="w-64 border-r border-slate-700 bg-slate-900/50 p-6">

        <div className="mb-8">

          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            PulseGuard AI
          </h1>

          <p className="text-xs text-slate-400 mt-1">
            Frontend Monitor
          </p>

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

      </aside>

      {/* Main Content */}

      <main className="flex-1 p-8">

        <div className="mb-8">

          <h1 className="text-4xl font-bold mb-2">
            {activePage}
          </h1>

          <p className="text-slate-400">

            {activePage === "Overview" &&
              "Real-time frontend performance monitoring"}

            {activePage === "Metrics" &&
              "Detailed web vital metrics and trends"}

            {activePage === "Errors" &&
              "JavaScript errors and runtime issues"}

            {activePage === "AI Insights" &&
              "AI-powered performance analysis"}

            {activePage === "Deployments" &&
              "Deployment tracking and regression analysis"}

            {activePage === "Demo" &&
              "Live demo monitoring"}

          </p>

        </div>

        {/* Overview */}

        {activePage === "Overview" && (

          <div className="space-y-6">

            <div className="grid grid-cols-3 gap-6">

              <MetricCard
                name="LCP"
                value={vitals.lcp}
                rating={vitals.lcpRating}
                unit="s"
              />

              <MetricCard
                name="CLS"
                value={vitals.cls}
                rating={vitals.clsRating}
                unit=""
              />

              <MetricCard
                name="INP"
                value={vitals.inp}
                rating={vitals.inpRating}
                unit="ms"
              />

            </div>

            <div className="grid grid-cols-2 gap-6">

              <APIStats stats={apiStats} />

              <ErrorTable errors={errors} />

            </div>

            <AIInsights analysis={aiAnalysis} />

          </div>
        )}

        {/* Metrics */}

        {activePage === "Metrics" && (

          <div className="space-y-6">

            <APIStats stats={apiStats} />

          </div>
        )}

        {/* Errors */}

        {activePage === "Errors" && (

          <ErrorTable errors={errors} />

        )}

        {/* AI */}

        {activePage === "AI Insights" && (

          <AIInsights analysis={aiAnalysis} />

        )}

        {/* Deployments */}

        {activePage === "Deployments" && deployment && (

          <div className="space-y-6">

            <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">

              <h2 className="text-xl font-bold mb-4">
                Deployment Analysis
              </h2>

              <p>
                Version: {deployment.deployment?.version}
              </p>

              <p>
                Risk Level: {deployment.risk_level}
              </p>

            </div>

          </div>
        )}

        {/* Demo */}

        {activePage === "Demo" && (

          <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">

            <h2 className="text-xl font-bold mb-4">
              Demo App
            </h2>

            <iframe
              src="https://ai-performance-agent-9ny2.vercel.app"
              title="PulseGuard Demo"
              className="w-full rounded-lg border border-slate-700"
              style={{ minHeight: "800px" }}
            />

          </div>
        )}

      </main>

    </div>
  )
}
