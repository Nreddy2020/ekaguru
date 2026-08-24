'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface TraceSpan {
  spanId: string;
  traceId: string;
  name: string;
  kind: string;
  startTimeMs: number;
  durationMs?: number;
  status: string;
  errorMessage?: string;
}

interface RequestTrace {
  traceId: string;
  requestId: string;
  clientPlatform: string;
  clientRoute?: string;
  httpMethod: string;
  httpUrl: string;
  httpStatus?: number;
  startTimeIso: string;
  startTimeMs: number;
  durationMs?: number;
  status: 'OK' | 'ERROR' | 'IN_PROGRESS';
  spans: TraceSpan[];
}

interface TelemetryStatistics {
  totalRequests: number;
  successCount: number;
  errorCount: number;
  avgDurationMs: number;
  p50DurationMs: number;
  p95DurationMs: number;
  errorRatePercent: number;
  activeTracesCount: number;
}

interface SystemHealthReport {
  timestamp: string;
  status: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';
  backend: {
    status: 'UP' | 'DOWN';
    uptimeSeconds: number;
    nodeVersion: string;
    pid: number;
  };
  database: {
    status: 'UP' | 'DOWN';
    latencyMs?: number;
    error?: string;
  };
  memory: {
    status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
    heapUsedMb: number;
    heapTotalMb: number;
    percentUsed: number;
  };
  storage: {
    status: 'ACCESSIBLE' | 'DEGRADED';
    uploadDirectory: string;
    writable: boolean;
  };
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:20000';

export default function ObserveDashboard() {
  const [traces, setTraces] = useState<RequestTrace[]>([]);
  const [statistics, setStatistics] = useState<TelemetryStatistics | null>(null);
  const [health, setHealth] = useState<SystemHealthReport | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'ERRORS' | 'SLOW' | 'UPLOAD' | 'TUTOR'>('ALL');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [loading, setLoading] = useState(true);
  const [selectedTrace, setSelectedTrace] = useState<RequestTrace | null>(null);

  const fetchData = useCallback(async () => {
    try {
      // 1. Fetch Health
      const healthRes = await fetch(`${API_BASE}/api/v2/observe/health`);
      if (healthRes.ok) {
        const healthData = await healthRes.json();
        setHealth(healthData);
      }

      // 2. Fetch Traces & Statistics
      const tracesRes = await fetch(`${API_BASE}/api/v2/observe/traces?limit=100`);
      if (tracesRes.ok) {
        const json = await tracesRes.json();
        setTraces(json.data || []);
        setStatistics(json.statistics || null);
      }
    } catch (err) {
      console.error('Observe telemetry fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    if (!autoRefresh) return;
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [fetchData, autoRefresh]);

  // Filtered requests
  const filteredTraces = traces.filter((t) => {
    if (filter === 'ERRORS' && t.status !== 'ERROR' && (!t.httpStatus || t.httpStatus < 400)) return false;
    if (filter === 'SLOW' && (!t.durationMs || t.durationMs < 1000)) return false;
    if (filter === 'UPLOAD' && !t.httpUrl.toLowerCase().includes('upload')) return false;
    if (filter === 'TUTOR' && !t.httpUrl.toLowerCase().includes('tutor') && !t.httpUrl.toLowerCase().includes('session')) return false;
    if (searchKeyword) {
      const kw = searchKeyword.toLowerCase();
      const matchUrl = t.httpUrl.toLowerCase().includes(kw);
      const matchId = t.traceId.toLowerCase().includes(kw);
      const matchMethod = t.httpMethod.toLowerCase().includes(kw);
      if (!matchUrl && !matchId && !matchMethod) return false;
    }
    return true;
  });

  // Recent errors for problem alert section
  const errorTraces = traces.filter((t) => t.status === 'ERROR' || (t.httpStatus && t.httpStatus >= 400));
  const slowCount = traces.filter((t) => (t.durationMs || 0) >= 1000).length;

  const getFormatRoute = (url: string) => {
    if (url.includes('/upload')) return 'Book Upload';
    if (url.includes('/tutor')) return 'Tutor Interaction';
    if (url.includes('/sessions')) return 'Learning Session';
    if (url.includes('/learning-materials')) return 'Learning Library';
    if (url.includes('/auth')) return 'Authentication';
    if (url.includes('/observe')) return 'Observe Telemetry';
    return url;
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans p-6">
      {/* Top Cockpit Header */}
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between pb-6 border-b border-slate-800 gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-2xl">🔭</span>
              <h1 className="text-2xl font-bold tracking-tight text-white">EKAGURU OBSERVE</h1>
              <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">
                Diagnostic Cockpit
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Deterministic runtime telemetry, progressive diagnosis, and automated health checks.
            </p>
          </div>

          {/* Subsystem Health Status Bar */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs">
              <span className={`w-2.5 h-2.5 rounded-full ${health?.status === 'HEALTHY' ? 'bg-emerald-400 animate-pulse' : health?.status === 'DEGRADED' ? 'bg-amber-400' : 'bg-rose-500'}`} />
              <span className="font-semibold text-slate-200">
                {health?.status === 'HEALTHY' ? 'System Healthy' : health?.status === 'DEGRADED' ? 'Degraded Performance' : 'System Issues Detected'}
              </span>
            </div>

            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
              <span className="px-2 py-1 rounded bg-slate-800/80 border border-slate-700/60">DB: {health?.database.status || 'UP'}</span>
              <span className="px-2 py-1 rounded bg-slate-800/80 border border-slate-700/60">Mem: {health?.memory.percentUsed || 0}%</span>
              <span className="px-2 py-1 rounded bg-slate-800/80 border border-slate-700/60">Storage: {health?.storage.status || 'OK'}</span>
            </div>

            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                autoRefresh
                  ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
              }`}
            >
              {autoRefresh ? '⚡ Live (3s)' : '⏸ Paused'}
            </button>
          </div>
        </header>

        {/* Level 1: Metric Cards Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-4">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Requests</span>
            <div className="text-3xl font-bold text-white mt-1">{statistics?.totalRequests || traces.length}</div>
            <span className="text-xs text-slate-500 mt-1 block">In 5k Ring Buffer</span>
          </div>

          <div className={`border rounded-xl p-4 ${
            (statistics?.errorCount || errorTraces.length) > 0
              ? 'bg-rose-950/30 border-rose-800/60 text-rose-300'
              : 'bg-slate-800/60 border-slate-700/80 text-emerald-400'
          }`}>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Errors Recorded</span>
            <div className="text-3xl font-bold mt-1">
              {(statistics?.errorCount !== undefined ? statistics.errorCount : errorTraces.length)}
            </div>
            <span className="text-xs text-slate-400 mt-1 block">
              {statistics?.errorRatePercent ? `${statistics.errorRatePercent}% error rate` : 'Zero errors active'}
            </span>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-4">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Avg Latency</span>
            <div className="text-3xl font-bold text-white mt-1">
              {statistics?.avgDurationMs || 0} <span className="text-base font-normal text-slate-400">ms</span>
            </div>
            <span className="text-xs text-slate-500 mt-1 block">p50: {statistics?.p50DurationMs || 0}ms</span>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-4">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Slow Requests</span>
            <div className="text-3xl font-bold text-amber-400 mt-1">
              {slowCount}
            </div>
            <span className="text-xs text-slate-500 mt-1 block">p95: {statistics?.p95DurationMs || 0}ms (&gt;1s)</span>
          </div>
        </div>

        {/* 🔴 Level 1 Fresher Alert: Problems Needing Attention */}
        {errorTraces.length > 0 && (
          <div className="bg-rose-950/40 border border-rose-800/80 rounded-xl p-5 shadow-lg shadow-rose-950/20">
            <div className="flex items-center gap-2 text-rose-400 font-semibold text-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
              <span>Problems Needing Attention ({errorTraces.length})</span>
            </div>

            <div className="mt-3 space-y-2">
              {errorTraces.slice(0, 3).map((errTrace) => {
                const errorSpan = errTrace.spans.find((s) => s.status === 'ERROR') || errTrace.spans[0];
                return (
                  <div
                    key={errTrace.traceId}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-slate-900/90 rounded-lg border border-rose-900/60 gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          {errTrace.httpStatus || 500}
                        </span>
                        <span className="font-semibold text-slate-200 text-sm">
                          {getFormatRoute(errTrace.httpUrl)}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">({errTrace.httpUrl})</span>
                      </div>
                      <p className="text-xs text-rose-300/90 mt-1">
                        Reason: {errorSpan?.errorMessage || 'Execution failure detected on server endpoint.'}
                      </p>
                    </div>

                    <button
                      onClick={() => setSelectedTrace(errTrace)}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg bg-rose-600 hover:bg-rose-500 text-white transition-colors self-start sm:self-auto"
                    >
                      View Problem &rarr;
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick Filter Pills & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {(['ALL', 'ERRORS', 'SLOW', 'UPLOAD', 'TUTOR'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  filter === f
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-slate-800/80 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                }`}
              >
                {f === 'ALL' && 'All Requests'}
                {f === 'ERRORS' && `🔴 Errors Only (${errorTraces.length})`}
                {f === 'SLOW' && `⏱ Slow (&gt;1s) (${slowCount})`}
                {f === 'UPLOAD' && '📁 Uploads'}
                {f === 'TUTOR' && '🎓 Tutor'}
              </button>
            ))}
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Search trace ID, route, method..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="bg-slate-800/90 border border-slate-700 text-xs rounded-lg px-3 py-1.5 text-slate-200 placeholder-slate-500 w-full sm:w-64 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Live Requests Stream Table */}
        <div className="bg-slate-800/50 border border-slate-700/80 rounded-xl overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-slate-700/80 flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
            <span>Recent Live Requests ({filteredTraces.length})</span>
            <span>{loading ? 'Refreshing...' : 'Real-time telemetry'}</span>
          </div>

          <div className="divide-y divide-slate-800/80">
            {filteredTraces.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-sm">
                No requests matching the selected filter in the telemetry buffer.
              </div>
            ) : (
              filteredTraces.map((trace) => {
                const isError = trace.status === 'ERROR' || (trace.httpStatus && trace.httpStatus >= 400);
                const isSlow = (trace.durationMs || 0) >= 1000;

                return (
                  <div
                    key={trace.traceId}
                    onClick={() => setSelectedTrace(trace)}
                    className="flex items-center justify-between p-4 hover:bg-slate-800/80 transition-colors cursor-pointer text-sm"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Status Icon */}
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                        isError ? 'bg-rose-500 shadow-sm shadow-rose-500' : isSlow ? 'bg-amber-400' : 'bg-emerald-400'
                      }`} />

                      {/* Route & Method */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-200">
                            {getFormatRoute(trace.httpUrl)}
                          </span>
                          <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-slate-700/60 text-slate-300">
                            {trace.httpMethod}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 font-mono truncate mt-0.5">
                          {trace.httpUrl}
                        </p>
                      </div>
                    </div>

                    {/* Right side: Status, Duration, Timestamp */}
                    <div className="flex items-center gap-4 shrink-0">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded font-mono ${
                        isError
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}>
                        {trace.httpStatus || (isError ? 500 : 200)}
                      </span>

                      <span className={`text-xs font-medium font-mono ${
                        isSlow ? 'text-amber-400 font-bold' : 'text-slate-300'
                      }`}>
                        {trace.durationMs !== undefined ? `${trace.durationMs}ms` : '—'}
                      </span>

                      <span className="text-xs text-slate-500 font-mono hidden md:inline">
                        {new Date(trace.startTimeMs).toLocaleTimeString()}
                      </span>

                      <span className="text-slate-400 text-xs hover:text-white">&rarr;</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Level 2 & 3: Request 360 Modal Detail (Progressive Disclosure) */}
        {selectedTrace && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[85vh] overflow-y-auto p-6 space-y-5 shadow-2xl">
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-700">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded font-mono ${
                      selectedTrace.status === 'ERROR'
                        ? 'bg-rose-500/20 text-rose-300'
                        : 'bg-emerald-500/20 text-emerald-300'
                    }`}>
                      {selectedTrace.httpStatus || 200}
                    </span>
                    <h2 className="text-lg font-bold text-white">
                      {selectedTrace.httpMethod} {selectedTrace.httpUrl}
                    </h2>
                  </div>
                  <p className="text-xs text-slate-400 font-mono mt-1">Trace ID: {selectedTrace.traceId}</p>
                </div>

                <button
                  onClick={() => setSelectedTrace(null)}
                  className="px-3 py-1 text-xs rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200"
                >
                  ✕ Close
                </button>
              </div>

              {/* Level 1: Fresher Diagnostic Summary */}
              <div className={`p-4 rounded-xl border ${
                selectedTrace.status === 'ERROR'
                  ? 'bg-rose-950/40 border-rose-800/80 text-rose-200'
                  : 'bg-emerald-950/30 border-emerald-800/60 text-emerald-200'
              }`}>
                <span className="text-xs font-bold uppercase tracking-wider block">
                  {selectedTrace.status === 'ERROR' ? '🔴 Diagnostic Finding' : '🟢 Request Execution Summary'}
                </span>
                <p className="text-sm mt-1">
                  {selectedTrace.status === 'ERROR'
                    ? selectedTrace.spans.find((s) => s.errorMessage)?.errorMessage || 'Request encountered an unexpected server error during execution.'
                    : `Request completed successfully in ${selectedTrace.durationMs || 0}ms across ${selectedTrace.spans.length} span(s).`}
                </p>
              </div>

              {/* Level 2: Component Breakdown & Spans */}
              <div>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Execution Spans ({selectedTrace.spans.length})
                </h3>
                <div className="space-y-2">
                  {selectedTrace.spans.map((span) => (
                    <div
                      key={span.spanId}
                      className="p-3 bg-slate-900/80 rounded-lg border border-slate-700/60 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-200">{span.name}</span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono text-[10px]">
                            {span.kind}
                          </span>
                        </div>
                        {span.errorMessage && (
                          <p className="text-rose-400 font-mono text-[11px] mt-1">{span.errorMessage}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="font-mono text-slate-300">{span.durationMs || 1}ms</span>
                        <span className={`block font-semibold text-[10px] ${
                          span.status === 'ERROR' ? 'text-rose-400' : 'text-emerald-400'
                        }`}>
                          {span.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Level 3: Raw Scrubbed Trace JSON for Experts */}
              <details className="text-xs bg-slate-900/90 rounded-lg p-3 border border-slate-700/60">
                <summary className="cursor-pointer font-mono text-slate-400 hover:text-slate-200">
                  Level 3: Inspect Raw Scrubbed Telemetry JSON
                </summary>
                <pre className="mt-2 p-2 bg-black/50 rounded text-slate-300 overflow-x-auto font-mono text-[11px]">
                  {JSON.stringify(selectedTrace, null, 2)}
                </pre>
              </details>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
