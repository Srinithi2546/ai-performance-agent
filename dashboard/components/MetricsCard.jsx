"use client"

import { useState, useEffect } from "react"
import { Activity, AlertTriangle, TrendingUp } from "lucide-react"

/**
 * MetricCard Component
 * Displays individual Web Vital metrics with status indicator
 */
export function MetricCard({ name, value, rating, delta, unit = "ms" }) {
  const getRatingColor = () => {
    switch (rating) {
      case "good":
        return "text-green-400 bg-green-500/10"
      case "needs-improvement":
        return "text-yellow-400 bg-yellow-500/10"
      case "poor":
        return "text-red-400 bg-red-500/10"
      default:
        return "text-gray-400 bg-gray-500/10"
    }
  }

  const getStatusIcon = () => {
    if (delta <= 0) return "↓"
    if (delta < 0.1) return "→"
    return "↑"
  }

  return (
    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-lg p-6 hover:border-slate-600 transition-all">
      <div className="flex items-center justify-between mb-3">
        <span className="text-slate-400 text-sm font-medium">{name}</span>
        <Activity className="w-4 h-4 text-slate-500" />
      </div>
      
      <div className="flex items-end justify-between">
        <div>
          <div className="text-3xl font-bold text-white">
            {typeof value === "number" ? value.toFixed(1) : value || "—"}
          </div>
          <span className="text-slate-500 text-xs">{unit}</span>
        </div>
        
        <div className="text-right">
          <div className={`px-2 py-1 rounded text-xs font-semibold ${getRatingColor()}`}>
            {rating ? rating.toUpperCase() : "N/A"}
          </div>
          {delta !== undefined && (
            <div className="text-xs text-slate-400 mt-1">
              <span className={delta <= 0 ? "text-green-400" : "text-red-400"}>
                {getStatusIcon()} {Math.abs(delta).toFixed(2)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * AI Insights Card
 * Displays AI-generated performance insights
 */
export function AIInsights({ analysis, loading = false }) {
  const parseAnalysis = (text) => {
    if (!text) return {};
    const parsed = {};
    // Regex matches KEY|| followed by anything until the next KEY|| or end of string
    const regex = /([A-Z_]+)\|\|([\s\S]*?)(?=(?:\n[A-Z_]+)\|\||$)/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
      parsed[match[1].trim()] = match[2].trim();
    }
    
    // Fallback if regex didn't catch anything due to poor formatting
    if (Object.keys(parsed).length === 0) {
      return { RAW_CONTENT: text };
    }
    return parsed;
  };

  const getSeverityColor = (severity) => {
    if (!severity) return 'bg-slate-700';
    const lower = severity.toLowerCase();
    if (lower.includes('critical') || lower.includes('severe')) return 'bg-red-600';
    if (lower.includes('high') || lower.includes('warning')) return 'bg-amber-600';
    if (lower.includes('medium')) return 'bg-yellow-600';
    return 'bg-green-600';
  };

  const getSeverityText = (severity) => {
    if (!severity) return '—';
    const lower = severity.toLowerCase();
    if (lower.includes('critical') || lower.includes('severe')) return '⚠️ CRITICAL';
    if (lower.includes('high') || lower.includes('warning')) return '⚠️ HIGH';
    if (lower.includes('medium')) return '⚡ MEDIUM';
    return '✅ GOOD';
  };

  const data = parseAnalysis(analysis);
  const hasParsedData = Object.keys(data).length > 0;

  return (
    <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/50 shadow-xl rounded-xl p-6 space-y-6">
      <div className="flex items-center gap-3 mb-2 border-b border-slate-700/50 pb-4">
        <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(168,85,247,0.8)]" />
        <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
          PulseGuard AI Analysis
        </h3>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="h-4 bg-slate-800 rounded w-full animate-pulse" />
          <div className="h-4 bg-slate-800 rounded w-5/6 animate-pulse" />
          <div className="h-4 bg-slate-800 rounded w-4/6 animate-pulse" />
        </div>
      ) : data.RAW_CONTENT ? (
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <p className="text-slate-300 whitespace-pre-wrap font-mono text-sm leading-relaxed">{data.RAW_CONTENT}</p>
        </div>
      ) : hasParsedData ? (
        <div className="space-y-6">
          {/* Header Row: Severity & Score */}
          <div className="flex flex-wrap gap-4 items-center">
            {data.SEVERITY && (
              <div className={`${getSeverityColor(data.SEVERITY)} text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-lg`}>
                {getSeverityText(data.SEVERITY)}
              </div>
            )}
            {(data.PERFORMANCE_SCORE || data.CONFIDENCE) && (
              <div className="bg-blue-900/50 border border-blue-500/30 text-blue-300 px-4 py-1.5 rounded-full text-sm font-bold">
                📊 Score: {data.PERFORMANCE_SCORE || data.CONFIDENCE}
              </div>
            )}
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Summary */}
            {data.SUMMARY && (
              <div className="md:col-span-2 bg-slate-800/40 border border-slate-700/40 rounded-lg p-4">
                <h4 className="text-purple-400 text-xs font-bold uppercase tracking-wider mb-2">Executive Summary</h4>
                <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">{data.SUMMARY}</p>
              </div>
            )}

            {/* Impact */}
            {data.IMPACT && (
              <div className="bg-slate-800/40 border border-slate-700/40 rounded-lg p-4">
                <h4 className="text-pink-400 text-xs font-bold uppercase tracking-wider mb-2">User Impact</h4>
                <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{data.IMPACT}</p>
              </div>
            )}

            {/* Root Cause */}
            {data.ROOT_CAUSE && (
              <div className="bg-slate-800/40 border border-slate-700/40 rounded-lg p-4">
                <h4 className="text-orange-400 text-xs font-bold uppercase tracking-wider mb-2">Root Cause Analysis</h4>
                <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{data.ROOT_CAUSE}</p>
              </div>
            )}
          </div>

          {/* Web Vitals Specifics */}
          {(data.LCP_INSIGHT || data.CLS_INSIGHT || data.INP_INSIGHT) && (
            <div>
              <h4 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-3">Core Web Vitals Breakdown</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {data.LCP_INSIGHT && (
                  <div className="bg-slate-800/40 border border-slate-700/40 rounded-lg p-4 border-t-2 border-t-blue-500">
                    <div className="text-blue-400 text-sm font-bold mb-2">LCP Insight</div>
                    <p className="text-slate-300 text-xs leading-relaxed whitespace-pre-wrap">{data.LCP_INSIGHT}</p>
                  </div>
                )}
                {data.CLS_INSIGHT && (
                  <div className="bg-slate-800/40 border border-slate-700/40 rounded-lg p-4 border-t-2 border-t-emerald-500">
                    <div className="text-emerald-400 text-sm font-bold mb-2">CLS Insight</div>
                    <p className="text-slate-300 text-xs leading-relaxed whitespace-pre-wrap">{data.CLS_INSIGHT}</p>
                  </div>
                )}
                {data.INP_INSIGHT && (
                  <div className="bg-slate-800/40 border border-slate-700/40 rounded-lg p-4 border-t-2 border-t-amber-500">
                    <div className="text-amber-400 text-sm font-bold mb-2">INP Insight</div>
                    <p className="text-slate-300 text-xs leading-relaxed whitespace-pre-wrap">{data.INP_INSIGHT}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actionable Fixes */}
          {(data.SUGGESTED_FIX || data.QUICK_WINS) && (
            <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-lg p-5">
              <h4 className="text-emerald-400 text-sm font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
                <span>⚡</span> Actionable Recommendations
              </h4>
              <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                {data.SUGGESTED_FIX || data.QUICK_WINS}
              </div>
            </div>
          )}

        </div>
      ) : (
        <div className="flex items-center justify-center p-8 bg-slate-800/20 rounded-lg border border-slate-700/30 border-dashed">
          <p className="text-slate-400 text-sm font-medium">Awaiting telemetry data to generate AI insights...</p>
        </div>
      )}
    </div>
  )
}

/**
 * Error Table Component
 * Shows recent JavaScript errors and API failures
 */
export function ErrorTable({ errors = [] }) {
  const getErrorIcon = (type) => {
    switch (type) {
      case "js_error":
        return "🔴"
      case "api_error":
        return "🟠"
      case "unhandled_rejection":
        return "🟡"
      default:
        return "⚪"
    }
  }

  return (
    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <AlertTriangle className="w-5 h-5 text-red-400" />
        <h3 className="text-lg font-semibold text-white">Recent Errors</h3>
        <span className="ml-auto text-sm text-slate-400">{errors.length} errors</span>
      </div>
      
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {errors.length === 0 ? (
          <p className="text-slate-400 text-sm">No errors detected</p>
        ) : (
          errors.slice(0, 10).map((error, idx) => (
            <div key={idx} className="bg-slate-900/50 border border-slate-700/30 rounded p-3 text-xs">
              <div className="flex items-start gap-2">
                <span className="text-lg mt-0.5">{getErrorIcon(error.type)}</span>
                <div className="flex-1">
                  <div className="text-slate-200 font-mono truncate">
                    {error.message || error.name || "Unknown error"}
                  </div>
                  {error.filename && (
                    <div className="text-slate-500 text-xs mt-1">
                      {error.filename}:{error.lineno}
                    </div>
                  )}
                  <div className="text-slate-600 text-xs mt-1">
                    {new Date(error.received_at).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

/**
 * Status Badge Component
 */
export function StatusBadge({ status, label }) {
  const statusColors = {
    good: "bg-green-500/20 text-green-400 border-green-500/30",
    warning: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    critical: "bg-red-500/20 text-red-400 border-red-500/30",
    stable: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    improved: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  }

  const color = statusColors[status] || statusColors.stable

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${color}`}>
      {label || status}
    </span>
  )
}

/**
 * API Stats Component
 */
export function APIStats({ stats = {} }) {
  return (
    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-blue-400" />
        API Performance
      </h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-slate-400 text-xs mb-1">Total Calls</div>
          <div className="text-2xl font-bold text-white">{stats.total_calls || 0}</div>
        </div>
        <div>
          <div className="text-slate-400 text-xs mb-1">Success Rate</div>
          <div className="text-2xl font-bold text-green-400">
            {stats.success_rate ? stats.success_rate.toFixed(0) : 100}%
          </div>
        </div>
        <div>
          <div className="text-slate-400 text-xs mb-1">Avg Duration</div>
          <div className="text-2xl font-bold text-white">
            {stats.avg_duration_ms ? stats.avg_duration_ms.toFixed(0) : 0}ms
          </div>
        </div>
        <div>
          <div className="text-slate-400 text-xs mb-1">Failures</div>
          <div className="text-2xl font-bold text-red-400">{stats.failed_calls || 0}</div>
        </div>
      </div>
    </div>
  )
}

/**
 * Loading Skeleton
 */
export function CardSkeleton() {
  return (
    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-lg p-6 animate-pulse">
      <div className="h-4 bg-slate-700/50 rounded w-1/3 mb-4" />
      <div className="h-8 bg-slate-700/50 rounded w-1/2 mb-4" />
      <div className="h-3 bg-slate-700/50 rounded w-3/4" />
    </div>
  )
}
