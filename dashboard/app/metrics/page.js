"use client"

import { useEffect, useState } from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend
} from "recharts"
import { motion } from "framer-motion"

export default function MetricsPage() {
  const [metrics, setMetrics] = useState([])
  const [history, setHistory] = useState([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("http://localhost:8000/dashboard")
        const data = await res.json()
        const m = data.metrics || []
        setMetrics(m)

        // Build history snapshot for chart
        setHistory(prev => {
          const snapshot = {
            time: new Date().toLocaleTimeString(),
          }
          m.forEach(metric => {
            snapshot[metric.name] = Number(metric.value)
          })
          const updated = [...prev, snapshot]
          return updated.slice(-20) // keep last 20 snapshots
        })
      } catch (err) {
        console.error("Failed to fetch metrics:", err)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 2000)
    return () => clearInterval(interval)
  }, [])

  const lcp = metrics.find(m => m.name === "LCP")
  const cls = metrics.find(m => m.name === "CLS")
  const inp = metrics.find(m => m.name === "INP")

  const cards = [
    {
      title: "Largest Contentful Paint",
      subtitle: "LCP",
      value: lcp ? `${Number(lcp.value).toFixed(2)}s` : "--",
      raw: lcp ? Number(lcp.value) : null,
      thresholds: { good: 2.5, poor: 4 },
      unit: "s",
    },
    {
      title: "Cumulative Layout Shift",
      subtitle: "CLS",
      value: cls ? Number(cls.value).toFixed(3) : "--",
      raw: cls ? Number(cls.value) : null,
      thresholds: { good: 0.1, poor: 0.25 },
      unit: "",
    },
    {
      title: "Interaction to Next Paint",
      subtitle: "INP",
      value: inp ? `${Number(inp.value).toFixed(0)}ms` : "--",
      raw: inp ? Number(inp.value) : null,
      thresholds: { good: 200, poor: 500 },
      unit: "ms",
    },
  ]

  const getStatus = (raw, thresholds) => {
    if (raw === null) return { label: "No Data", color: "text-gray-400", bg: "bg-gray-500/20 border-gray-500/30" }
    if (raw <= thresholds.good) return { label: "Good", color: "text-green-400", bg: "bg-green-500/10 border-green-500/30" }
    if (raw <= thresholds.poor) return { label: "Needs Improvement", color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/30" }
    return { label: "Poor", color: "text-red-400", bg: "bg-red-500/10 border-red-500/30" }
  }

  const COLORS = {
    LCP: "#7C3AED",
    CLS: "#EC4899",
    INP: "#F59E0B",
  }

  const chartData = history.filter(h =>
    Object.keys(h).some(k => k !== "time" && typeof h[k] !== "undefined")
  )

  return (
    <div className="min-h-screen bg-[#070B14] text-white p-8">
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold">Metrics</h1>
        <p className="mt-2 text-gray-400">Live Core Web Vitals from your frontend</p>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-3 gap-6">
        {cards.map((card, index) => {
          const status = getStatus(card.raw, card.thresholds)
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              whileHover={{ y: -4 }}
              className={`rounded-2xl border ${status.bg} backdrop-blur-xl p-6 shadow-xl`}
            >
              <p className="text-sm text-gray-400">{card.title}</p>
              <div className="flex items-end gap-2 mt-4">
                <h2 className={`text-5xl font-bold ${status.color}`}>{card.value}</h2>
                <span className="text-sm text-gray-500 mb-1">{card.subtitle}</span>
              </div>
              <div className={`mt-4 inline-block rounded-full px-3 py-1 text-xs font-medium ${status.color} bg-white/10`}>
                {status.label}
              </div>
              <div className="mt-4 space-y-1 text-xs text-gray-500">
                <p>✅ Good: ≤ {card.thresholds.good}{card.unit}</p>
                <p>⚠️ Needs Improvement: ≤ {card.thresholds.poor}{card.unit}</p>
                <p>❌ Poor: &gt; {card.thresholds.poor}{card.unit}</p>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* LIVE CHART */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="mt-8 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6"
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Live Metrics History</h2>
          <div className="rounded-lg bg-white/5 px-4 py-2 text-sm text-gray-400">
            Last {history.length} snapshots
          </div>
        </div>

        {chartData.length === 0 ? (
          <div className="flex h-[300px] items-center justify-center text-gray-500">
            Waiting for metrics data...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData.filter(m => typeof m.value !== "undefined")}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="time" stroke="#666" tick={{ fontSize: 11 }} />
              <YAxis stroke="#666" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: "#0B1120", border: "1px solid #ffffff20", borderRadius: "8px" }}
                labelStyle={{ color: "#aaa" }}
              />
              <Legend />
              {["LCP", "CLS", "INP"].map(name => (
                <Line
                  key={name}
                  type="monotone"
                  dataKey={name}
                  stroke={COLORS[name]}
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </motion.div>

      {/* RAW METRICS TABLE */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="mt-8 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6"
      >
        <h2 className="mb-6 text-2xl font-semibold">Raw Metric Readings</h2>
        {metrics.length === 0 ? (
          <p className="text-gray-500">No metrics received yet. Make sure the SDK is loaded on your website.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-gray-400">
                  <th className="pb-3 pr-8">Metric</th>
                  <th className="pb-3 pr-8">Value</th>
                  <th className="pb-3 pr-8">Rating</th>
                  <th className="pb-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {metrics.map((m, i) => {
                  const val = Number(m.value)
                  const thresholds = m.name === "LCP" ? { good: 2.5, poor: 4 }
                    : m.name === "CLS" ? { good: 0.1, poor: 0.25 }
                    : { good: 200, poor: 500 }
                  const status = getStatus(val, thresholds)
                  return (
                    <tr key={i} className="py-3">
                      <td className="py-3 pr-8 font-semibold text-purple-300">{m.name}</td>
                      <td className="py-3 pr-8 font-mono">{isNaN(val) ? m.value : val.toFixed(3)}</td>
                      <td className={`py-3 pr-8 ${status.color}`}>{status.label}</td>
                      <td className="py-3 text-gray-500">{new Date().toLocaleTimeString()}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  )
}
