"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  Brain,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  Globe,
  GitCommit,
  Activity,
  ShieldAlert,
  LayoutDashboard,
  Bell,
  Settings,
  Server,
  ArrowLeft,
  RefreshCw,
  Cpu,
  BarChart3,
  Layers,
} from "lucide-react"

/* ─── Constants ─── */

const STATUS_COLORS = {
  Critical:  { text: "text-red-400",    bg: "bg-red-500/10",    border: "border-red-500/30",    badge: "bg-red-500/20 text-red-400",    bar: "from-red-600 to-red-400" },
  Warning:   { text: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/30", badge: "bg-yellow-500/20 text-yellow-400", bar: "from-yellow-600 to-yellow-400" },
  Improved:  { text: "text-green-400",  bg: "bg-green-500/10",  border: "border-green-500/30",  badge: "bg-green-500/20 text-green-400",  bar: "from-green-600 to-emerald-400" },
  Stable:    { text: "text-blue-400",   bg: "bg-blue-500/10",   border: "border-blue-500/30",   badge: "bg-blue-500/20 text-blue-400",   bar: "from-blue-600 to-blue-400" },
  "No Data": { text: "text-gray-400",   bg: "bg-gray-500/10",   border: "border-gray-500/30",   badge: "bg-gray-500/20 text-gray-400",   bar: "from-gray-600 to-gray-400" },
}

const TIMELINE_COLORS = {
  info:    { dot: "bg-blue-400",   glow: "shadow-blue-400/50",   text: "text-blue-300",    icon: Clock },
  success: { dot: "bg-green-400",  glow: "shadow-green-400/50",  text: "text-green-300",   icon: CheckCircle },
  warning: { dot: "bg-yellow-400", glow: "shadow-yellow-400/50", text: "text-yellow-300",  icon: AlertTriangle },
  error:   { dot: "bg-red-400",    glow: "shadow-red-400/50",    text: "text-red-300",     icon: AlertTriangle },
  ai:      { dot: "bg-purple-400", glow: "shadow-purple-400/50", text: "text-purple-300",  icon: Brain },
}

const RISK_COLORS = {
  Low:      { text: "text-green-400",  bg: "bg-green-500/10",  border: "border-green-500/30",  pulse: "bg-green-400",  shadow: "shadow-green-500/20" },
  Warning:  { text: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/30", pulse: "bg-yellow-400", shadow: "shadow-yellow-500/20" },
  Critical: { text: "text-red-400",    bg: "bg-red-500/10",    border: "border-red-500/30",    pulse: "bg-red-400",    shadow: "shadow-red-500/20" },
}

const MENU_ITEMS = [
  { icon: LayoutDashboard, label: "Overview",    href: "/" },
  { icon: Activity,        label: "Metrics",     href: "/metrics" },
  { icon: AlertTriangle,   label: "Errors",      href: "/" },
  { icon: Brain,           label: "AI Insights", href: "/" },
  { icon: Server,          label: "Deployments", href: "/deployments" },
  { icon: Bell,            label: "Alerts",      href: "/" },
  { icon: Settings,        label: "Settings",    href: "/" },
]

/* ─── Helpers ─── */

function formatMetricValue(name, val) {
  if (val === null || val === undefined) return "--"
  if (name === "LCP")    return `${Number(val).toFixed(2)}s`
  if (name === "CLS")    return Number(val).toFixed(3)
  if (name === "INP")    return `${Number(val).toFixed(0)}ms`
  return val
}

function getDeltaPercent(name, before, after) {
  if (!after || !before) return 0
  const pct = ((after - before) / before) * 100
  return Math.min(Math.abs(pct), 100)
}

function DeltaBadge({ delta, name }) {
  if (delta === null || delta === undefined) return <span className="text-gray-500 text-xs">--</span>
  const isGood = delta <= 0
  const formatted =
    name === "LCP"    ? `${Math.abs(delta).toFixed(2)}s`
    : name === "CLS" ? Math.abs(delta).toFixed(3)
    : name === "INP" ? `${Math.abs(delta).toFixed(0)}ms`
    : Math.abs(delta)
  return (
    <span className={`flex items-center gap-1 font-mono text-sm font-semibold ${isGood ? "text-green-400" : "text-red-400"}`}>
      {isGood ? <TrendingDown size={13} /> : <TrendingUp size={13} />}
      {isGood ? "−" : "+"}{formatted}
    </span>
  )
}

/* ─── Sidebar ─── */

function Sidebar({ router }) {
  const current = "/deployments"
  return (
    <aside className="w-[260px] shrink-0 border-r border-white/10 bg-[#0B1120] flex flex-col p-6">
      {/* Logo */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-1">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Activity size={14} className="text-white" />
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            PulseGuard AI
          </h1>
        </div>
        <p className="text-xs text-gray-500 ml-9">Frontend Reliability Monitor</p>
      </div>

      {/* Nav */}
      <nav className="space-y-1.5 flex-1">
        {MENU_ITEMS.map((item) => {
          const Icon = item.icon
          const active = current === item.href
          return (
            <motion.div
              key={item.label}
              whileHover={{ scale: 1.02, x: 2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push(item.href)}
              className={`
                flex items-center gap-3 rounded-xl px-4 py-3 cursor-pointer transition-all duration-200
                ${active
                  ? "bg-purple-600/25 border border-purple-500/40 text-purple-300 shadow-[0_0_20px_rgba(124,58,237,0.15)]"
                  : "text-gray-400 hover:bg-white/5 hover:text-gray-200 border border-transparent"}
              `}
            >
              <Icon size={18} className={active ? "text-purple-400" : ""} />
              <span className="text-sm font-medium">{item.label}</span>
              {active && (
                <div className="ml-auto h-1.5 w-1.5 rounded-full bg-purple-400" />
              )}
            </motion.div>
          )
        })}
      </nav>

      {/* Live Status Widget */}
      <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
        <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Live Target</p>
        <p className="font-semibold text-white text-sm">localhost:5173</p>
        <div className="flex items-center gap-2">
          <div className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
          </div>
          <span className="text-xs text-green-400 font-medium">Monitoring Active</span>
        </div>
        <div className="h-px bg-white/10" />
        <p className="text-xs text-gray-500">Deployment: <span className="text-purple-300 font-mono">v2.1.4</span></p>
      </div>
    </aside>
  )
}

/* ─── Metric Progress Card ─── */

function MetricCompareCard({ row, index }) {
  const style = STATUS_COLORS[row.status] || STATUS_COLORS["No Data"]
  const pct   = getDeltaPercent(row.metric, row.before, row.after)
  const isWorse = row.delta > 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 + index * 0.08 }}
      className={`rounded-2xl border ${style.border} ${style.bg} backdrop-blur-xl p-5 space-y-4`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`text-lg font-black ${style.text}`}>{row.metric}</span>
          <span className="text-xs text-gray-500">
            {row.metric === "LCP" && "Largest Contentful Paint"}
            {row.metric === "CLS" && "Cumulative Layout Shift"}
            {row.metric === "INP" && "Interaction to Next Paint"}
            {row.metric === "errors" && "JavaScript Errors"}
          </span>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${style.badge}`}>
          {row.status}
        </span>
      </div>

      {/* Before / After */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-white/5 p-3 text-center">
          <p className="text-xs text-gray-500 mb-1">Before</p>
          <p className="font-mono font-bold text-gray-200 text-lg">{formatMetricValue(row.metric, row.before)}</p>
        </div>
        <div className={`rounded-xl ${isWorse ? "bg-red-500/10" : "bg-green-500/10"} p-3 text-center`}>
          <p className="text-xs text-gray-500 mb-1">After</p>
          <p className={`font-mono font-bold text-lg ${style.text}`}>{formatMetricValue(row.metric, row.after)}</p>
        </div>
      </div>

      {/* Progress bar showing regression magnitude */}
      <div>
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
          <span>Δ Change</span>
          <DeltaBadge delta={row.delta} name={row.metric} />
        </div>
        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.9, delay: 0.4 + index * 0.1, ease: "easeOut" }}
            className={`h-full rounded-full bg-gradient-to-r ${style.bar}`}
          />
        </div>
      </div>
    </motion.div>
  )
}

/* ─── Main Page ─── */

export default function DeploymentsPage() {
  const router      = useRouter()
  const [data, setData]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [lastRefresh, setLastRefresh] = useState(null)
  const [aiExpanded, setAiExpanded]   = useState(false)
  const [refreshing, setRefreshing]   = useState(false)
  const intervalRef = useRef(null)

  const fetchData = async (manual = false) => {
    if (manual) setRefreshing(true)
    try {
      const res  = await fetch("http://localhost:8000/deployments")
      const json = await res.json()
      setData(json)
      setLastRefresh(new Date())
      setLoading(false)
    } catch (e) {
      console.error("Failed to fetch deployment data:", e)
    } finally {
      if (manual) setTimeout(() => setRefreshing(false), 600)
    }
  }

  useEffect(() => {
    fetchData()
    intervalRef.current = setInterval(() => fetchData(), 5000)
    return () => clearInterval(intervalRef.current)
  }, [])

  /* ── Loading screen ── */
  if (loading) {
    return (
      <div className="min-h-screen bg-[#070B14] text-white flex">
        <Sidebar router={router} />
        <div className="flex-1 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-6"
          >
            <div className="relative">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center">
                <Brain size={28} className="text-purple-400" />
              </div>
              <div className="absolute inset-0 rounded-2xl bg-purple-500/10 animate-pulse" />
            </div>
            <div className="flex gap-2">
              {[0, 150, 300].map(d => (
                <span key={d} className="h-2.5 w-2.5 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: `${d}ms` }} />
              ))}
            </div>
            <p className="text-gray-400 text-sm">Loading deployment intelligence...</p>
          </motion.div>
        </div>
      </div>
    )
  }

  const {
    deployment,
    comparison,
    risk_level,
    ai_analysis,
    incidents,
    rollback_recommended,
    rollback_score
  } = data

  const riskStyle = RISK_COLORS[risk_level] || RISK_COLORS["Low"]

  return (
    <div className="min-h-screen bg-[#070B14] text-white flex">

      {/* ── SIDEBAR ── */}
      <Sidebar router={router} />

      {/* ── MAIN ── */}
      <main className="flex-1 overflow-y-auto">

        {/* ── ROLLBACK EMERGENCY BANNER ── */}
        <AnimatePresence>
          {rollback_recommended && (
            <motion.div
              initial={{ opacity: 0, y: -60 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -60 }}
              className="sticky top-0 z-30 border-b border-red-500/40 bg-red-950/80 backdrop-blur-xl px-8 py-3 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-red-400 animate-pulse" />
                <ShieldAlert size={18} className="text-red-400" />
                <p className="text-sm font-semibold text-red-300">
                  Critical regression detected in <span className="font-mono text-red-400">{deployment.version}</span>
                  <span className="text-red-200 font-normal"> — PulseGuard AI recommends immediate rollback</span>
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 rounded-xl bg-red-500 hover:bg-red-400 px-4 py-2 text-sm font-bold text-white transition-colors"
              >
                <RotateCcw size={14} />
                Rollback Now
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="p-8 space-y-8 max-w-[1400px] mx-auto">

          {/* ── PAGE HEADER ── */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start justify-between"
          >
            <div>
              <div className="flex items-center gap-3 mb-3">
                <button
                  onClick={() => router.push("/")}
                  className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
                >
                  <ArrowLeft size={12} />
                  Dashboard
                </button>
                <span className="text-gray-700">/</span>
                <span className="text-xs text-purple-400">Deployments</span>
              </div>
              <h1 className="text-4xl font-black bg-gradient-to-r from-purple-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
                Deployment Intelligence
              </h1>
              <p className="mt-2 text-gray-400 text-sm">
                AI-powered release monitoring, regression detection &amp; rollback intelligence
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Last refresh */}
              <div className="text-xs text-gray-600">
                {lastRefresh && <>Last updated {lastRefresh.toLocaleTimeString()}</>}
              </div>

              {/* Manual refresh */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => fetchData(true)}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs text-gray-300 hover:bg-white/10 transition-all"
              >
                <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
                Refresh
              </motion.button>

              {/* Risk Badge */}
              <div className={`rounded-xl border ${riskStyle.border} ${riskStyle.bg} px-5 py-3 text-center shadow-xl ${riskStyle.shadow}`}>
                <p className="text-xs text-gray-500 mb-1">Regression Risk</p>
                <div className="flex items-center gap-2">
                  <div className="relative flex h-2 w-2">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${riskStyle.pulse} opacity-75`} />
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${riskStyle.pulse}`} />
                  </div>
                  <span className={`font-bold ${riskStyle.text}`}>{risk_level}</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── DEPLOYMENT HERO CARD ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-3xl border border-purple-500/30 bg-gradient-to-br from-purple-500/10 via-[#0B1120] to-pink-500/5 backdrop-blur-xl p-8 shadow-[0_0_80px_rgba(124,58,237,0.15)] relative overflow-hidden"
          >
            {/* Background glow orb */}
            <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

            <div className="relative flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold">Active Deployment</p>
                <h2 className="text-6xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  {deployment.version}
                </h2>
                <p className="text-sm text-gray-500">
                  {deployment.environment} · {deployment.region}
                </p>
              </div>

              <div className="flex flex-wrap gap-3 justify-end">
                {[
                  { label: "Deployed At",    value: deployment.deployed_at,  icon: Clock,      accent: "text-blue-400",   border: "border-blue-500/30",   bg: "bg-blue-500/10" },
                  { label: "Commit",         value: deployment.commit,        icon: GitCommit,  accent: "text-purple-400", border: "border-purple-500/30", bg: "bg-purple-500/10", mono: true },
                  { label: "Deploy Status",  value: deployment.status,        icon: CheckCircle,accent: "text-green-400",  border: "border-green-500/30",  bg: "bg-green-500/10" },
                  { label: "Environment",    value: deployment.environment,   icon: Globe,      accent: "text-cyan-400",   border: "border-cyan-500/30",   bg: "bg-cyan-500/10" },
                  { label: "Region",         value: deployment.region,        icon: Cpu,        accent: "text-orange-400", border: "border-orange-500/30", bg: "bg-orange-500/10" },
                  { label: "AI Status",      value: risk_level === "Low" ? "No Regression" : `${risk_level} Risk`,
                                                                               icon: Brain,      accent: riskStyle.text,   border: riskStyle.border,       bg: riskStyle.bg },
                ].map((stat, i) => {
                  const Icon = stat.icon
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 + i * 0.06 }}
                      className={`rounded-2xl border ${stat.border} ${stat.bg} px-4 py-3 min-w-[110px]`}
                    >
                      <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
                      <div className={`flex items-center gap-1.5 ${stat.accent}`}>
                        <Icon size={13} />
                        <p className={`font-semibold text-sm ${stat.mono ? "font-mono" : ""}`}>{stat.value}</p>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </motion.div>

          {/* ── METRIC COMPARE CARDS ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-2 mb-5">
              <BarChart3 size={18} className="text-purple-400" />
              <h2 className="text-xl font-semibold">Before vs After Deployment</h2>
              <span className="ml-auto text-xs text-gray-600">Baseline → Live telemetry</span>
            </div>
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
              {comparison.map((row, i) => (
                <MetricCompareCard key={row.metric} row={row} index={i} />
              ))}
            </div>
          </motion.div>

          {/* ── 3-COLUMN SECTION: Timeline | Regression | Incidents ── */}
          <div className="grid grid-cols-3 gap-6">

            {/* ── DEPLOYMENT TIMELINE ── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6"
            >
              <h2 className="text-base font-semibold mb-6 flex items-center gap-2">
                <Clock size={16} className="text-purple-400" />
                Deployment Timeline
              </h2>
              <div className="relative">
                {deployment.timeline.map((event, i) => {
                  const style = TIMELINE_COLORS[event.type] || TIMELINE_COLORS.info
                  const Icon  = style.icon
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.35 + i * 0.08 }}
                      className="flex gap-4"
                    >
                      <div className="flex flex-col items-center">
                        <div className={`h-3 w-3 rounded-full mt-1 flex-shrink-0 ${style.dot} shadow-md ${style.glow}`} />
                        {i < deployment.timeline.length - 1 && (
                          <div className="w-px flex-1 bg-white/10 my-1.5" />
                        )}
                      </div>
                      <div className="pb-5">
                        <p className="text-xs text-gray-600 font-mono">{event.time}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Icon size={12} className={style.text} />
                          <p className={`text-sm font-medium ${style.text}`}>{event.event}</p>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>

            {/* ── REGRESSION DETECTION ── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className={`rounded-2xl border backdrop-blur-xl p-6 ${
                risk_level === "Critical"
                  ? "border-red-500/40 bg-red-500/5 shadow-[0_0_50px_rgba(239,68,68,0.1)]"
                  : risk_level === "Warning"
                  ? "border-yellow-500/30 bg-yellow-500/5"
                  : "border-green-500/30 bg-green-500/5"
              }`}
            >
              <div className="flex items-center gap-2 mb-5">
                <ShieldAlert size={16} className={riskStyle.text} />
                <h2 className="text-base font-semibold">Regression Engine</h2>
                <span className={`ml-auto rounded-full px-2.5 py-0.5 text-xs font-bold ${STATUS_COLORS[risk_level]?.badge || STATUS_COLORS["No Data"].badge}`}>
                  {risk_level}
                </span>
              </div>

              <p className="text-sm text-gray-400 leading-relaxed mb-4">
                Monitoring post-deploy performance delta for <span className="text-purple-300 font-semibold font-mono">{deployment.version}</span>
              </p>

              <div className="space-y-3">
                {comparison.map((c, i) => {
                  const s = STATUS_COLORS[c.status] || STATUS_COLORS["No Data"]
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 + i * 0.07 }}
                      className={`rounded-xl border ${s.border} ${s.bg} px-4 py-3 flex items-center justify-between`}
                    >
                      <div>
                        <p className={`text-sm font-semibold ${s.text}`}>{c.metric}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {c.metric === "LCP"    && "Page load speed"}
                          {c.metric === "CLS"    && "Visual stability"}
                          {c.metric === "INP"    && "Interaction latency"}
                          {c.metric === "errors" && "JS error rate"}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${s.badge}`}>{c.status}</span>
                        <div className="mt-1">
                          <DeltaBadge delta={c.delta} name={c.metric} />
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>

            {/* ── INCIDENT CORRELATION ── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6"
            >
              <h2 className="text-base font-semibold mb-5 flex items-center gap-2">
                <Zap size={16} className="text-yellow-400" />
                Incident Correlation
              </h2>

              {incidents.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-green-500/10 border border-green-500/30 flex items-center justify-center">
                    <CheckCircle size={20} className="text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-green-400 font-semibold">All Clear</p>
                    <p className="text-xs text-gray-500 mt-1">No incidents correlated with {deployment.version}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {incidents.map((inc, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.45 + i * 0.08 }}
                      className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <AlertTriangle size={14} className="text-red-400" />
                        <p className="text-sm text-red-300 font-medium">{inc.incident}</p>
                      </div>
                      <span className="rounded-full bg-purple-500/20 px-2.5 py-0.5 text-xs text-purple-300 font-mono">
                        {inc.version}
                      </span>
                    </motion.div>
                  ))}

                  <p className="text-xs text-gray-600 text-center mt-2">
                    {incidents.length} incident{incidents.length !== 1 ? "s" : ""} traced to {deployment.version}
                  </p>
                </div>
              )}
            </motion.div>
          </div>

          {/* ── AI ANALYSIS PANEL ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="rounded-3xl border border-purple-500/30 bg-[#0C0F1E] backdrop-blur-xl p-8 shadow-[0_0_80px_rgba(124,58,237,0.12)] relative overflow-hidden"
          >
            {/* Glow orb */}
            <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

            <div className="relative flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-purple-500/30 to-pink-500/20 border border-purple-500/30 flex items-center justify-center">
                  <Brain size={20} className="text-purple-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">AI Deployment Analysis</h2>
                  <p className="text-xs text-gray-500">Powered by PulseGuard Copilot · llama-3.1-8b</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 rounded-full bg-purple-500/10 border border-purple-500/20 px-4 py-1.5 text-xs text-purple-300">
                  <div className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-pulse" />
                  Live Analysis
                </div>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setAiExpanded(!aiExpanded)}
                  className="text-xs text-purple-400 hover:text-purple-200 transition-colors border border-purple-500/20 rounded-lg px-3 py-1.5 bg-purple-500/10"
                >
                  {aiExpanded ? "Collapse ↑" : "Expand ↓"}
                </motion.button>
              </div>
            </div>

            <div
              className={`rounded-2xl border border-purple-500/20 bg-purple-500/5 p-6 whitespace-pre-wrap text-sm leading-7 text-gray-300 transition-all duration-500 ${
                aiExpanded ? "max-h-none" : "max-h-52 overflow-hidden"
              }`}
            >
              {ai_analysis || "Awaiting telemetry data to begin AI analysis. Send metrics via the SDK to trigger regression analysis..."}
            </div>

            {!aiExpanded && (
              <div className="mt-3 text-center">
                <button
                  onClick={() => setAiExpanded(true)}
                  className="text-xs text-purple-400 hover:text-purple-200 transition-colors"
                >
                  Show full analysis ↓
                </button>
              </div>
            )}
          </motion.div>

          {/* ── ROLLBACK RECOMMENDATION ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className={`rounded-3xl border backdrop-blur-xl p-8 relative overflow-hidden ${
              rollback_recommended
                ? "border-red-500/40 bg-red-950/20 shadow-[0_0_60px_rgba(239,68,68,0.12)]"
                : "border-green-500/30 bg-green-950/10"
            }`}
          >
            <div className={`absolute -top-10 -right-10 h-40 w-40 rounded-full blur-3xl pointer-events-none ${
              rollback_recommended ? "bg-red-500/10" : "bg-green-500/10"
            }`} />

            <div className="relative flex items-start gap-8">
              {/* Left: recommendation text */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`h-10 w-10 rounded-2xl flex items-center justify-center border ${
                    rollback_recommended
                      ? "bg-red-500/20 border-red-500/40"
                      : "bg-green-500/20 border-green-500/40"
                  }`}>
                    <RotateCcw size={18} className={rollback_recommended ? "text-red-400" : "text-green-400"} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">Rollback Recommendation</h2>
                    <p className="text-xs text-gray-500">AI-evaluated deployment safety</p>
                  </div>
                </div>

                <div className={`rounded-2xl border p-5 mb-5 ${
                  rollback_recommended
                    ? "border-red-500/20 bg-red-500/10"
                    : "border-green-500/20 bg-green-500/10"
                }`}>
                  <p className={`font-bold text-base mb-2 ${rollback_recommended ? "text-red-400" : "text-green-400"}`}>
                    {rollback_recommended ? "⚠️ Rollback Immediately" : "✅ Deployment Stable — No Rollback Needed"}
                  </p>
                  <p className="text-sm text-gray-300 leading-relaxed">
                    {rollback_recommended
                      ? `Critical performance regressions detected across multiple metrics in ${deployment.version}. Estimated ${rollback_score}% performance restoration upon rollback to previous stable release.`
                      : `Deployment ${deployment.version} shows acceptable performance metrics. All Core Web Vitals remain within safe thresholds.`
                    }
                  </p>
                </div>

                {rollback_recommended && (
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 px-6 py-3 font-bold text-white shadow-[0_0_30px_rgba(239,68,68,0.3)] transition-all"
                  >
                    <RotateCcw size={16} />
                    Initiate Rollback
                  </motion.button>
                )}
              </div>

              {/* Right: recovery score */}
              <div className="w-56 shrink-0">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center">
                  <Layers size={18} className="mx-auto text-gray-500 mb-3" />
                  <p className="text-xs text-gray-500 mb-2">Estimated Recovery</p>
                  <p className={`text-5xl font-black mb-4 ${rollback_recommended ? "text-red-400" : "text-green-400"}`}>
                    {rollback_score}<span className="text-2xl">%</span>
                  </p>
                  <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${rollback_score}%` }}
                      transition={{ duration: 1.2, delay: 0.6, ease: "easeOut" }}
                      className={`h-full rounded-full ${
                        rollback_recommended
                          ? "bg-gradient-to-r from-red-600 to-orange-400"
                          : "bg-gradient-to-r from-green-600 to-emerald-400"
                      }`}
                    />
                  </div>
                  <p className="text-xs text-gray-600 mt-3 leading-relaxed">
                    performance restoration upon rollback
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </main>
    </div>
  )
}
