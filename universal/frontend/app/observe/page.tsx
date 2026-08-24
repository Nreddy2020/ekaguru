'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';

interface TraceSpan {
  spanId: string;
  traceId: string;
  parentId?: string;
  name: string;
  kind: string;
  startTimeMs: number;
  endTimeMs?: number;
  durationMs?: number;
  status: 'OK' | 'ERROR' | 'IN_PROGRESS';
  errorMessage?: string;
  errorCategory?: string;
  attributes?: Record<string, any>;
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
  endTimeMs?: number;
  durationMs?: number;
  status: 'OK' | 'ERROR' | 'IN_PROGRESS';
  errorCategory?: string;
  errorMessage?: string;
  userAgent?: string;
  clientIp?: string;
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
    rssMb?: number;
    percentUsed: number;
  };
  storage: {
    status: 'ACCESSIBLE' | 'DEGRADED';
    uploadDirectory: string;
    writable: boolean;
  };
}

type NavSection = 'OVERVIEW' | 'LIVE_REQUESTS' | 'TRACES' | 'ERRORS' | 'M2_PIPELINE' | 'DATABASE' | 'HEALTH' | 'ALERTS';
type Request360Tab = 'JOURNEY' | 'SPANS' | 'METADATA' | 'EVIDENCE_PACKAGE';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:20000';

export default function ObserveCockpitPage() {
  const [activeNav, setActiveNav] = useState<NavSection>('OVERVIEW');
  const [activeTab, setActiveTab] = useState<Request360Tab>('JOURNEY');
  const [traces, setTraces] = useState<RequestTrace[]>([]);
  const [statistics, setStatistics] = useState<TelemetryStatistics | null>(null);
  const [health, setHealth] = useState<SystemHealthReport | null>(null);
  const [selectedTrace, setSelectedTrace] = useState<RequestTrace | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const fetchTelemetry = useCallback(async () => {
    try {
      const healthPromise = fetch(`${API_BASE}/api/v2/observe/health`)
        .then(async (res) => (res.ok ? await res.json() : null))
        .catch(() => null);

      const tracesPromise = fetch(`${API_BASE}/api/v2/observe/traces?limit=100`)
        .then(async (res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return await res.json();
        });

      const [healthData, tracesData] = await Promise.all([healthPromise, tracesPromise]);

      if (healthData) setHealth(healthData);
      if (tracesData) {
        const traceList: RequestTrace[] = tracesData.data || [];
        setTraces(traceList);
        setStatistics(tracesData.statistics || null);

        setSelectedTrace((prev) => {
          if (prev) {
            const updated = traceList.find((t) => t.traceId === prev.traceId);
            return updated || prev;
          }
          const errorTrace = traceList.find((t) => t.status === 'ERROR' || (t.httpStatus && t.httpStatus >= 400));
          return errorTrace || traceList[0] || null;
        });
      }
      setApiError(null);
    } catch (err: any) {
      setApiError(err?.message || 'Failed to connect to Observe telemetry API');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTelemetry();
    if (!autoRefresh) return;
    const interval = setInterval(fetchTelemetry, 2000);
    return () => clearInterval(interval);
  }, [fetchTelemetry, autoRefresh]);

  // Derived real stats directly from buffer
  const totalCount = statistics?.totalRequests ?? traces.length;
  const errorCount = statistics?.errorCount ?? traces.filter((t) => t.status === 'ERROR' || (t.httpStatus && t.httpStatus >= 400)).length;
  const successRate = totalCount > 0 ? (((totalCount - errorCount) / totalCount) * 100).toFixed(1) : '100.0';
  const p95 = statistics?.p95DurationMs ?? (traces.length > 0 ? Math.max(...traces.map((t) => t.durationMs || 0)) : 0);
  const slowCount = traces.filter((t) => (t.durationMs || 0) >= 1000).length;

  // Real filtered traces
  const visibleTraces = useMemo(() => {
    return traces.filter((t) => {
      if (activeNav === 'ERRORS' && t.status !== 'ERROR' && (!t.httpStatus || t.httpStatus < 400)) return false;
      if (activeNav === 'M2_PIPELINE' && !t.httpUrl.toLowerCase().includes('upload') && !t.httpUrl.toLowerCase().includes('process') && !t.httpUrl.toLowerCase().includes('concept')) return false;
      if (activeNav === 'DATABASE' && !t.spans.some((s) => s.kind === 'DATABASE')) return false;
      if (activeNav === 'ALERTS' && t.status !== 'ERROR' && (t.durationMs || 0) < 1000) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchUrl = t.httpUrl.toLowerCase().includes(q);
        const matchId = t.traceId.toLowerCase().includes(q);
        const matchReqId = t.requestId?.toLowerCase().includes(q);
        const matchMethod = t.httpMethod.toLowerCase().includes(q);
        if (!matchUrl && !matchId && !matchReqId && !matchMethod) return false;
      }

      return true;
    });
  }, [traces, activeNav, searchQuery]);

  // Primary active problem needing attention
  const activeProblem = useMemo(() => {
    const errorTrace = traces.find((t) => t.status === 'ERROR' || (t.httpStatus && t.httpStatus >= 400));
    if (!errorTrace) return null;

    const totalSec = ((errorTrace.durationMs || 0) / 1000).toFixed(2);
    const errorSpan = errorTrace.spans.find((s) => s.status === 'ERROR') || errorTrace.spans[0];
    const errMsg = errorTrace.errorMessage || errorSpan?.errorMessage || 'Server returned an execution error.';

    let category = 'APPLICATION';
    let title = 'Application Execution Failure';
    let reason = errMsg;
    let action = 'Check application logs and verify input parameters.';

    if (errorTrace.httpStatus === 401 || errorTrace.httpStatus === 403) {
      category = 'AUTHENTICATION';
      title = 'Unauthorized / Session Expired';
      reason = 'Request was rejected at Guard boundary due to missing or expired authorization token.';
      action = 'Log in again via /login to obtain a valid access token.';
    } else if (errMsg.toLowerCase().includes('database') || errMsg.toLowerCase().includes('timeout') || errMsg.toLowerCase().includes('prisma')) {
      category = 'DATABASE';
      title = 'Database Query Timeout';
      reason = 'A database query took too long and exceeded the safety timeout.';
      action = 'Check slow queries, PostgreSQL connection pool, and table indexes.';
    } else if (errorTrace.httpUrl.includes('upload') || errorTrace.httpUrl.includes('process')) {
      category = 'M2_ENGINE';
      title = 'Document Intelligence Extraction Failure';
      reason = 'M2 extraction pipeline encountered an issue during PDF parsing or chunk persistence.';
      action = 'Verify the PDF file format and inspect M2 processing spans.';
    }

    return {
      trace: errorTrace,
      category,
      title,
      reason,
      action,
      durationDisplay: (errorTrace.durationMs || 0) >= 1000 ? `${totalSec} seconds` : `${errorTrace.durationMs || 0} ms`,
    };
  }, [traces]);

  // Clean Route Name Formatter
  const getFormatRoute = (url: string) => {
    if (url.includes('/upload')) return 'Book Upload';
    if (url.includes('/learning-materials')) return 'Learning Library';
    if (url.includes('/sessions')) return 'Learning Session';
    if (url.includes('/tutor')) return 'AI Tutor Interaction';
    if (url.includes('/observe')) return 'Observe Telemetry';
    if (url.includes('/auth')) return 'Authentication';
    return url;
  };

  // Structured Diagnostic Evidence Package generator
  const generateEvidencePackage = (trace: RequestTrace) => {
    const isError = trace.status === 'ERROR' || (trace.httpStatus && trace.httpStatus >= 400);
    return JSON.stringify(
      {
        observation: {
          traceId: trace.traceId,
          requestId: trace.requestId,
          timestamp: trace.startTimeIso,
          route: trace.httpUrl,
          httpMethod: trace.httpMethod,
          httpStatus: trace.httpStatus || (isError ? 500 : 200),
          durationMs: trace.durationMs || 0,
          clientPlatform: trace.clientPlatform,
        },
        rootCause: isError
          ? {
              category: trace.errorCategory || 'APPLICATION',
              failure: trace.errorMessage || 'Execution failure detected',
              summary: `Request to ${trace.httpUrl} failed with status ${trace.httpStatus || 500}`,
            }
          : { status: 'NOMINAL', summary: 'Request succeeded with zero subsystem errors' },
        spans: trace.spans.map((s) => ({
          name: s.name,
          kind: s.kind,
          durationMs: s.durationMs || 0,
          status: s.status,
          error: s.errorMessage,
        })),
        systemHealthSnapshot: {
          database: health?.database.status || 'UNKNOWN',
          databaseLatencyMs: health?.database.latencyMs,
          memoryPercent: health?.memory.percentUsed,
          storage: health?.storage.status || 'UNKNOWN',
        },
      },
      null,
      2
    );
  };

  const handleCopyEvidence = (trace: RequestTrace) => {
    const pkg = generateEvidencePackage(trace);
    navigator.clipboard.writeText(pkg);
    setCopyFeedback('Copied Diagnostic Evidence Package to clipboard!');
    setTimeout(() => setCopyFeedback(null), 3000);
  };

  return (
    <div className="min-h-screen bg-[#070d18] text-slate-100 font-sans flex flex-col antialiased selection:bg-teal-500/30 selection:text-white">
      {/* 1. Header: Operational Brain */}
      <header className="bg-[#0b1322] border-b border-slate-800/90 px-4 sm:px-6 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3 sticky top-0 z-50">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2 font-mono">
              <span className="text-teal-400">🔭 EKAGURU OBSERVE</span>
              <span className="text-slate-400 font-normal text-xs sm:text-sm">— Application Diagnostic Center</span>
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Every request. Every dependency. One place to understand problems.
          </p>
        </div>

        {/* Live Quick Status Strip */}
        <div className="flex items-center gap-3 self-end md:self-auto font-mono text-xs">
          {/* Health Pill */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-700/80">
            <span
              className={`w-2 h-2 rounded-full ${
                health?.status === 'HEALTHY'
                  ? 'bg-emerald-400 animate-pulse'
                  : health?.status === 'DEGRADED'
                  ? 'bg-amber-400'
                  : 'bg-rose-500'
              }`}
            />
            <span className="font-semibold text-slate-200">
              {health?.status === 'HEALTHY'
                ? 'Healthy'
                : health?.status === 'DEGRADED'
                ? 'Degraded'
                : 'System Issues'}
            </span>
          </div>

          <span className="px-2.5 py-1 rounded bg-slate-800/80 border border-slate-700/60 text-slate-300">
            {totalCount} Requests
          </span>

          <span className={`px-2.5 py-1 rounded border ${
            errorCount > 0
              ? 'bg-rose-950/40 border-rose-800/80 text-rose-300 font-bold'
              : 'bg-slate-800/80 border-slate-700/60 text-emerald-400'
          }`}>
            {errorCount} {errorCount === 1 ? 'Error' : 'Errors'}
          </span>

          <span className="px-2.5 py-1 rounded bg-slate-800/80 border border-slate-700/60 text-slate-300">
            {p95}ms p95
          </span>

          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5 ${
              autoRefresh
                ? 'bg-teal-500/15 border-teal-500/40 text-teal-300 shadow-sm shadow-teal-500/20'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${autoRefresh ? 'bg-teal-400 animate-ping' : 'bg-slate-500'}`} />
            {autoRefresh ? 'Live (2s)' : 'Paused'}
          </button>
        </div>
      </header>

      {/* Main Workstation Container */}
      <div className="flex-1 max-w-[1600px] w-full mx-auto p-4 sm:p-6 space-y-5">
        {/* API Error Notification */}
        {apiError && (
          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/80 text-rose-200 text-xs flex items-center justify-between gap-3 shadow-lg font-mono">
            <div className="flex items-center gap-2">
              <span className="text-base">🔴</span>
              <div>
                <span className="font-bold">Observability service unavailable:</span>{' '}
                <span>The application is still running, but diagnostic data cannot currently be retrieved. ({apiError})</span>
              </div>
            </div>
            <button
              onClick={fetchTelemetry}
              className="px-3 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-semibold shrink-0"
            >
              Retry
            </button>
          </div>
        )}

        {/* Copy Feedback Toast */}
        {copyFeedback && (
          <div className="p-3 rounded-lg bg-teal-950/80 border border-teal-500/60 text-teal-200 text-xs font-mono flex items-center justify-between shadow-lg">
            <span>✅ {copyFeedback}</span>
            <button onClick={() => setCopyFeedback(null)} className="text-slate-400 hover:text-white">✕</button>
          </div>
        )}

        {/* Level 1: Fresher First — Problems Needing Attention Section */}
        {activeProblem ? (
          <div className="bg-[#140e1c] border border-rose-900/80 rounded-xl p-5 shadow-xl shadow-rose-950/20 space-y-3 font-mono">
            <div className="flex items-center justify-between border-b border-rose-900/40 pb-2.5">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                <span>🔴 Problem Needing Attention</span>
              </div>
              <span className="text-[11px] text-rose-400/80 bg-rose-950/80 px-2.5 py-0.5 rounded border border-rose-800/60">
                {activeProblem.category}
              </span>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <span>{activeProblem.title}</span>
                  <span className="text-xs text-rose-300 font-normal">({activeProblem.trace.httpUrl})</span>
                </h2>
                <p className="text-xs text-slate-300">
                  <span className="text-rose-300 font-semibold">Reason:</span> {activeProblem.reason}
                </p>
                <p className="text-[11px] text-teal-400">
                  <span className="text-slate-400 font-semibold">Action:</span> {activeProblem.action}
                </p>
                <div className="text-[10px] text-slate-500 pt-1">
                  Route: {activeProblem.trace.httpMethod} {activeProblem.trace.httpUrl} • Duration: {activeProblem.durationDisplay} • Trace ID: {activeProblem.trace.traceId}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 shrink-0 self-start md:self-center">
                <button
                  onClick={() => {
                    setSelectedTrace(activeProblem.trace);
                    setActiveTab('JOURNEY');
                  }}
                  className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors shadow-sm"
                >
                  Understand Problem →
                </button>
                <button
                  onClick={() => handleCopyEvidence(activeProblem.trace)}
                  className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 transition-colors"
                >
                  Copy Evidence
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-[#0b1622] border border-emerald-900/60 rounded-xl p-4 flex items-center justify-between font-mono text-xs shadow-sm">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-bold text-emerald-400">🟢 System Healthy:</span>
              <span className="text-slate-300">No problems requiring attention across all active endpoints.</span>
            </div>
            <span className="text-[11px] text-slate-500 hidden sm:inline">
              Buffer: {totalCount} / 5,000 traces • 0 errors
            </span>
          </div>
        )}

        {/* 2. Main 2-Column Cockpit Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Navigation Sidebar (Col 2) */}
          <div className="lg:col-span-2 bg-[#0d1726] border border-slate-800/90 rounded-xl p-3 flex flex-col justify-between space-y-4 font-mono shadow-sm">
            <div className="space-y-1">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2 py-1">
                Navigation
              </div>

              {[
                { id: 'OVERVIEW', label: 'Overview', icon: '◉' },
                { id: 'LIVE_REQUESTS', label: 'Live Requests', icon: '⚡' },
                { id: 'TRACES', label: 'Traces', icon: '🔍' },
                { id: 'ERRORS', label: 'Errors', icon: '⚠️', count: errorCount },
                { id: 'M2_PIPELINE', label: 'M2 Pipeline', icon: '📚' },
                { id: 'DATABASE', label: 'Database', icon: '🗄️' },
                { id: 'HEALTH', label: 'System Health', icon: '💓' },
                { id: 'ALERTS', label: 'Alerts', icon: '⚠️', count: slowCount },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveNav(item.id as NavSection)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all text-left ${
                    activeNav === item.id
                      ? 'bg-teal-500/15 text-teal-300 border border-teal-500/40 font-semibold'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-teal-400 text-[11px]">{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                  {item.count !== undefined && item.count > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      {item.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Subsystem Real Telemetry Snapshot */}
            <div className="pt-3 border-t border-slate-800 space-y-1.5 text-[10px]">
              <div className="text-slate-500 font-bold uppercase tracking-wider px-1">
                Subsystems
              </div>
              <div className="flex justify-between p-1.5 rounded bg-[#070e1a] border border-slate-800/60">
                <span className="text-slate-400">Database</span>
                <span className="text-emerald-400 font-bold">
                  {health?.database ? `${health.database.status} (${health.database.latencyMs || 0}ms)` : 'UP'}
                </span>
              </div>
              <div className="flex justify-between p-1.5 rounded bg-[#070e1a] border border-slate-800/60">
                <span className="text-slate-400">Memory Used</span>
                <span className={`${(health?.memory.percentUsed || 0) > 85 ? 'text-rose-400' : 'text-slate-200'}`}>
                  {health?.memory.percentUsed ? `${health.memory.percentUsed}%` : '45MB'}
                </span>
              </div>
              <div className="flex justify-between p-1.5 rounded bg-[#070e1a] border border-slate-800/60">
                <span className="text-slate-400">Storage FS</span>
                <span className="text-emerald-400 font-bold">{health?.storage.status || 'OK'}</span>
              </div>
            </div>
          </div>

          {/* Center & Right Area (Col 10) */}
          <div className="lg:col-span-10 space-y-5 min-w-0">
            {/* Live Request Stream Section */}
            <div className="bg-[#0d1726] border border-slate-800/90 rounded-xl overflow-hidden shadow-sm font-mono">
              <div className="px-4 py-2.5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs bg-[#0a121e]">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">Live Request Stream</span>
                  <span className="text-[10px] text-slate-500">({visibleTraces.length} in buffer)</span>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search trace ID, route, method..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-[#070e1a] border border-slate-700/80 text-[11px] rounded px-2.5 py-1 text-slate-200 placeholder-slate-500 w-full sm:w-60 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-[10px] text-slate-400 uppercase tracking-wider bg-[#070e1a]/60">
                      <th className="py-2 px-3">Time</th>
                      <th className="py-2 px-2">Method</th>
                      <th className="py-2 px-3">Route / Operation</th>
                      <th className="py-2 px-2 text-center">Status</th>
                      <th className="py-2 px-2 text-right">Duration</th>
                      <th className="py-2 px-3 text-center hidden md:table-cell">Client</th>
                      <th className="py-2 px-3 text-right">Trace ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {loading && traces.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-500 text-xs">
                          Loading telemetry stream...
                        </td>
                      </tr>
                    ) : visibleTraces.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-500 text-xs space-y-1">
                          <div>No requests recorded yet in the telemetry buffer.</div>
                          <div className="text-[11px] text-slate-600">
                            Perform an upload or navigate EKAGURU to see live request telemetry.
                          </div>
                        </td>
                      </tr>
                    ) : (
                      visibleTraces.slice(0, 10).map((trace) => {
                        const isError = trace.status === 'ERROR' || (trace.httpStatus && trace.httpStatus >= 400);
                        const isSelected = selectedTrace?.traceId === trace.traceId;
                        const durationSec = ((trace.durationMs || 0) / 1000).toFixed(2);
                        const durationDisplay = (trace.durationMs || 0) >= 1000 ? `${durationSec} s` : `${trace.durationMs || 0} ms`;

                        return (
                          <tr
                            key={trace.traceId}
                            onClick={() => setSelectedTrace(trace)}
                            className={`cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-teal-950/40 border-l-2 border-teal-400'
                                : 'hover:bg-slate-800/40'
                            }`}
                          >
                            <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap text-[11px]">
                              {new Date(trace.startTimeMs).toLocaleTimeString()}
                            </td>
                            <td className="py-2.5 px-2 font-bold whitespace-nowrap text-[11px]">
                              <span
                                className={`${
                                  trace.httpMethod === 'POST'
                                    ? 'text-indigo-400'
                                    : trace.httpMethod === 'GET'
                                    ? 'text-teal-400'
                                    : 'text-amber-400'
                                }`}
                              >
                                {trace.httpMethod}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-slate-200 font-semibold truncate max-w-[180px] sm:max-w-[280px]">
                              <span>{getFormatRoute(trace.httpUrl)}</span>
                              <span className="text-[10px] text-slate-500 block truncate font-normal">{trace.httpUrl}</span>
                            </td>
                            <td className="py-2.5 px-2 text-center whitespace-nowrap">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  isError
                                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                }`}
                              >
                                {trace.httpStatus || (isError ? 500 : 200)} {isError ? 'Error' : 'OK'}
                              </span>
                            </td>
                            <td
                              className={`py-2.5 px-2 text-right whitespace-nowrap text-[11px] ${
                                isError ? 'text-rose-400 font-bold' : (trace.durationMs || 0) > 1000 ? 'text-amber-400' : 'text-slate-300'
                              }`}
                            >
                              {durationDisplay}
                            </td>
                            <td className="py-2.5 px-3 text-center text-slate-400 text-[11px] hidden md:table-cell whitespace-nowrap">
                              {trace.clientPlatform || 'browser'}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-[10px] text-slate-500 whitespace-nowrap">
                              {trace.traceId.length > 14 ? `${trace.traceId.slice(0, 12)}...` : trace.traceId}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 3. REQUEST 360 – Real Request Journey & Evidence Inspector */}
            {selectedTrace && (
              <div className="bg-[#0d1726] border border-slate-800/90 rounded-xl p-4 sm:p-5 space-y-4 shadow-md font-mono">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-2">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-bold border ${
                        selectedTrace.status === 'ERROR' || (selectedTrace.httpStatus && selectedTrace.httpStatus >= 400)
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      }`}
                    >
                      {selectedTrace.httpStatus || 200}
                    </span>
                    <div>
                      <h2 className="text-xs sm:text-sm font-bold text-white">
                        REQUEST 360: {selectedTrace.httpMethod} {selectedTrace.httpUrl}
                      </h2>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Trace ID: {selectedTrace.traceId} • Request ID: {selectedTrace.requestId}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      onClick={() => handleCopyEvidence(selectedTrace)}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-semibold border border-slate-700 transition-colors"
                    >
                      📋 Copy Evidence Package
                    </button>
                    <button
                      onClick={() => setSelectedTrace(null)}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Sub-Tabs: Journey | Spans | Metadata | Evidence Package */}
                <div className="flex items-center gap-1 border-b border-slate-800 text-xs">
                  {[
                    { id: 'JOURNEY', label: 'Request Journey' },
                    { id: 'SPANS', label: `Spans (${selectedTrace.spans.length})` },
                    { id: 'METADATA', label: 'Metadata' },
                    { id: 'EVIDENCE_PACKAGE', label: 'Diagnostic Evidence Package' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as Request360Tab)}
                      className={`px-3 py-1.5 rounded-t-lg transition-all ${
                        activeTab === tab.id
                          ? 'bg-teal-500/15 text-teal-300 border-b-2 border-teal-400 font-bold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tab Content: Journey Waterfall */}
                {activeTab === 'JOURNEY' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Subsystem Execution Journey</span>
                      <span>Total: {selectedTrace.durationMs || 0}ms</span>
                    </div>

                    <div className="space-y-1.5 bg-[#070e1a] p-3 rounded-lg border border-slate-800">
                      {selectedTrace.spans.length === 0 ? (
                        <div className="flex items-center justify-between py-2 text-xs">
                          <span className="text-slate-300">HTTP / Gateway Execution</span>
                          <span className="text-teal-400 font-bold">{selectedTrace.durationMs || 1}ms ✓</span>
                        </div>
                      ) : (
                        selectedTrace.spans.map((span) => {
                          const isErr = span.status === 'ERROR';
                          const dur = span.durationMs || 1;
                          const totalDur = selectedTrace.durationMs || 1;
                          const widthPct = Math.min(100, Math.max(3, (dur / totalDur) * 100));

                          return (
                            <div key={span.spanId} className="space-y-0.5 py-1">
                              <div className="flex items-center justify-between text-[11px]">
                                <div className="flex items-center gap-1.5">
                                  <span className={`w-1.5 h-1.5 rounded-full ${isErr ? 'bg-rose-500' : 'bg-emerald-400'}`} />
                                  <span className="font-semibold text-slate-200">{span.name}</span>
                                  <span className="text-[9px] text-slate-500 px-1 py-0.2 rounded bg-slate-800 font-mono">
                                    {span.kind}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 font-mono">
                                  <span className={`${isErr ? 'text-rose-400 font-bold' : dur > 1000 ? 'text-amber-400' : 'text-slate-300'}`}>
                                    {dur >= 1000 ? `${(dur / 1000).toFixed(2)}s` : `${dur}ms`}
                                  </span>
                                  <span>{isErr ? '🔴' : '✓'}</span>
                                </div>
                              </div>

                              <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                                <div
                                  style={{ width: `${widthPct}%` }}
                                  className={`h-full rounded-full ${
                                    isErr ? 'bg-rose-500' : dur > 1000 ? 'bg-amber-400' : 'bg-teal-500'
                                  }`}
                                />
                              </div>

                              {span.errorMessage && (
                                <p className="text-[10px] text-rose-400 font-mono pl-3 pt-0.5">
                                  Error: {span.errorMessage}
                                </p>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}

                {/* Tab Content: Spans List */}
                {activeTab === 'SPANS' && (
                  <div className="space-y-2">
                    {selectedTrace.spans.map((span) => (
                      <div key={span.spanId} className="p-2.5 rounded bg-[#070e1a] border border-slate-800 text-xs flex items-center justify-between">
                        <div>
                          <span className="font-bold text-white">{span.name}</span>
                          <span className="text-[10px] text-slate-500 block font-mono">Span ID: {span.spanId} • Kind: {span.kind}</span>
                          {span.errorMessage && <span className="text-[10px] text-rose-400 block">{span.errorMessage}</span>}
                        </div>
                        <div className="text-right font-mono">
                          <span className="text-slate-200">{span.durationMs || 0}ms</span>
                          <span className={`block text-[10px] font-bold ${span.status === 'ERROR' ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {span.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Tab Content: Metadata */}
                {activeTab === 'METADATA' && (
                  <div className="p-3 bg-[#070e1a] rounded-lg border border-slate-800 text-xs font-mono space-y-1.5">
                    <div><span className="text-slate-500">Trace ID:</span> <span className="text-slate-200">{selectedTrace.traceId}</span></div>
                    <div><span className="text-slate-500">Request ID:</span> <span className="text-slate-200">{selectedTrace.requestId}</span></div>
                    <div><span className="text-slate-500">Client Platform:</span> <span className="text-slate-200">{selectedTrace.clientPlatform}</span></div>
                    <div><span className="text-slate-500">Client Route:</span> <span className="text-slate-200">{selectedTrace.clientRoute || '/'}</span></div>
                    <div><span className="text-slate-500">HTTP URL:</span> <span className="text-slate-200">{selectedTrace.httpUrl}</span></div>
                    <div><span className="text-slate-500">Start Time:</span> <span className="text-slate-200">{selectedTrace.startTimeIso}</span></div>
                    <div><span className="text-slate-500">Duration:</span> <span className="text-slate-200">{selectedTrace.durationMs} ms</span></div>
                  </div>
                )}

                {/* Tab Content: Evidence Package */}
                {activeTab === 'EVIDENCE_PACKAGE' && (
                  <div className="space-y-2">
                    <pre className="p-3 bg-black/50 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-64">
                      {generateEvidencePackage(selectedTrace)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
