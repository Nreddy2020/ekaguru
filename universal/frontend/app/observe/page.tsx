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

type NavSection = 'OVERVIEW' | 'LIVE_REQUESTS' | 'ERRORS' | 'TRACES' | 'DATABASE' | 'M2_PIPELINE' | 'SYSTEM_HEALTH';
type DetailsTab = 'WATERFALL' | 'SPANS' | 'METADATA' | 'EVIDENCE_PACKAGE';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:20000';

export default function ObserveCockpitPage() {
  const [activeNav, setActiveNav] = useState<NavSection>('OVERVIEW');
  const [activeTab, setActiveTab] = useState<DetailsTab>('WATERFALL');
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
          // Default selection: pick newest trace or first error
          const errorTrace = traceList.find((t) => t.status === 'ERROR' || (t.httpStatus && t.httpStatus >= 400));
          return errorTrace || traceList[0] || null;
        });
      }
      setApiError(null);
    } catch (err: any) {
      setApiError(err?.message || 'Telemetry service connection unavailable');
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

  // Derived real metrics
  const totalCount = statistics?.totalRequests ?? traces.length;
  const errorCount = statistics?.errorCount ?? traces.filter((t) => t.status === 'ERROR' || (t.httpStatus && t.httpStatus >= 400)).length;
  const successRate = totalCount > 0 ? (((totalCount - errorCount) / totalCount) * 100).toFixed(1) : '100.0';
  const p95 = statistics?.p95DurationMs ?? (traces.length > 0 ? Math.max(...traces.map((t) => t.durationMs || 0)) : 0);
  const activeCount = statistics?.activeTracesCount ?? traces.filter((t) => t.status === 'IN_PROGRESS').length;

  // Filtered requests
  const visibleTraces = useMemo(() => {
    return traces.filter((t) => {
      if (activeNav === 'ERRORS' && t.status !== 'ERROR' && (!t.httpStatus || t.httpStatus < 400)) return false;
      if (activeNav === 'M2_PIPELINE' && !t.httpUrl.toLowerCase().includes('upload') && !t.httpUrl.toLowerCase().includes('process')) return false;
      if (activeNav === 'DATABASE' && !t.spans.some((s) => s.kind === 'DATABASE')) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchUrl = t.httpUrl.toLowerCase().includes(q);
        const matchId = t.traceId.toLowerCase().includes(q);
        const matchReq = t.requestId?.toLowerCase().includes(q);
        const matchMethod = t.httpMethod.toLowerCase().includes(q);
        if (!matchUrl && !matchId && !matchReq && !matchMethod) return false;
      }
      return true;
    });
  }, [traces, activeNav, searchQuery]);

  // Fresher diagnosis generator for selected trace
  const diagnosis = useMemo(() => {
    if (!selectedTrace) return null;
    const isError = selectedTrace.status === 'ERROR' || (selectedTrace.httpStatus && selectedTrace.httpStatus >= 400);

    if (!isError) {
      return {
        isError: false,
        what: `Request to ${selectedTrace.httpUrl} completed successfully.`,
        where: 'Application & Subsystems Nominal',
        why: 'All database queries and controller handlers responded within safety thresholds with 0 errors.',
        action: 'No action required. Telemetry reflects nominal operational health.',
      };
    }

    const failedSpan = selectedTrace.spans.find((s) => s.status === 'ERROR');
    const isAuth = selectedTrace.httpStatus === 401 || selectedTrace.httpStatus === 403;
    const isDb = selectedTrace.errorCategory === 'DATABASE' || failedSpan?.kind === 'DATABASE' || (selectedTrace.errorMessage && selectedTrace.errorMessage.toLowerCase().includes('database'));
    const isM2 = selectedTrace.httpUrl.includes('upload') || selectedTrace.httpUrl.includes('process');

    if (isAuth) {
      return {
        isError: true,
        what: 'Authentication required or session expired.',
        where: 'Guard Security Boundary',
        why: 'The request was rejected because an authentication token was missing, malformed, or expired.',
        action: 'Log in again via /login to obtain a valid access token.',
      };
    }

    if (isDb) {
      return {
        isError: true,
        what: 'Database operation timed out or failed.',
        where: `Database (${failedSpan?.name || 'PostgreSQL'})`,
        why: failedSpan?.errorMessage || selectedTrace.errorMessage || 'Query exceeded database safety timeout threshold.',
        action: 'Check slow queries, PostgreSQL connection pool capacity, and table indexing.',
      };
    }

    if (isM2) {
      return {
        isError: true,
        what: 'Document intelligence processing failed.',
        where: 'M2 Processing Engine',
        why: selectedTrace.errorMessage || 'PDF extraction or chunking encountered an unexpected error.',
        action: 'Inspect PDF structure, verify upload size, and review M2 worker logs.',
      };
    }

    return {
      isError: true,
      what: `Request failed with HTTP ${selectedTrace.httpStatus || 500}.`,
      where: 'Application Backend',
      why: selectedTrace.errorMessage || 'Server returned an unhandled execution exception.',
      action: 'Inspect application stack trace and verify request payload parameters.',
    };
  }, [selectedTrace]);

  // Evidence package generator
  const generateEvidencePackage = (trace: RequestTrace) => {
    return JSON.stringify(
      {
        observation: {
          traceId: trace.traceId,
          requestId: trace.requestId,
          timestamp: trace.startTimeIso,
          route: trace.httpUrl,
          httpMethod: trace.httpMethod,
          httpStatus: trace.httpStatus || 200,
          durationMs: trace.durationMs || 0,
          clientPlatform: trace.clientPlatform,
        },
        diagnosis: {
          status: trace.status,
          category: trace.errorCategory || 'APPLICATION',
          message: trace.errorMessage || null,
        },
        realSubsystemSpans: trace.spans.map((s) => ({
          name: s.name,
          kind: s.kind,
          durationMs: s.durationMs || 0,
          status: s.status,
          attributes: s.attributes,
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
    setCopyFeedback('Diagnostic Evidence Package copied to clipboard!');
    setTimeout(() => setCopyFeedback(null), 3000);
  };

  return (
    <div className="min-h-screen bg-[#070d18] text-slate-100 font-sans flex flex-col antialiased selection:bg-teal-500/30 selection:text-white p-4 sm:p-5 space-y-4">
      {/* 1. Production Top Header */}
      <header className="bg-[#0b1424] border border-slate-800/90 rounded-xl px-5 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3 shadow-md font-mono">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-teal-400 font-bold text-base sm:text-lg">🔭 EKAGURU OBSERVE</span>
            <span className="text-slate-400 text-xs sm:text-sm font-normal">
              — Understand every request, find problems, and fix them.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end md:self-auto text-xs">
          {/* Status Badge */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-700">
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
                : 'Critical'}
            </span>
          </div>

          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1 font-semibold rounded-lg border transition-all flex items-center gap-1.5 ${
              autoRefresh
                ? 'bg-teal-500/15 border-teal-500/40 text-teal-300 shadow-sm'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${autoRefresh ? 'bg-teal-400 animate-ping' : 'bg-slate-500'}`} />
            {autoRefresh ? 'Live Refresh (2s)' : 'Paused'}
          </button>
        </div>
      </header>

      {/* Copy Toast */}
      {copyFeedback && (
        <div className="p-3 rounded-lg bg-teal-950/80 border border-teal-500/60 text-teal-200 text-xs font-mono flex items-center justify-between shadow-lg">
          <span>✅ {copyFeedback}</span>
          <button onClick={() => setCopyFeedback(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono">
        <div className="bg-[#0b1424] border border-slate-800/90 rounded-xl p-3.5">
          <span className="text-[11px] text-slate-400 block">Total Requests</span>
          <div className="text-xl font-bold text-white mt-1">{totalCount}</div>
          <span className="text-[10px] text-slate-500 block mt-0.5">In telemetry buffer</span>
        </div>

        <div className="bg-[#0b1424] border border-slate-800/90 rounded-xl p-3.5">
          <span className="text-[11px] text-slate-400 block">Success Rate</span>
          <div className="text-xl font-bold text-emerald-400 mt-1">{successRate}%</div>
          <span className="text-[10px] text-emerald-400 block mt-0.5">Nominal</span>
        </div>

        <div className={`border rounded-xl p-3.5 ${
          errorCount > 0
            ? 'bg-rose-950/20 border-rose-900/80'
            : 'bg-[#0b1424] border-slate-800/90'
        }`}>
          <span className={`text-[11px] block ${errorCount > 0 ? 'text-rose-300' : 'text-slate-400'}`}>
            Failed Requests
          </span>
          <div className={`text-xl font-bold mt-1 ${errorCount > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
            {errorCount}
          </div>
          <span className="text-[10px] text-slate-500 block mt-0.5">
            {errorCount > 0 ? 'Requires attention' : '0 errors'}
          </span>
        </div>

        <div className="bg-[#0b1424] border border-slate-800/90 rounded-xl p-3.5">
          <span className="text-[11px] text-slate-400 block">Avg Duration (p95)</span>
          <div className="text-xl font-bold text-teal-400 mt-1">{p95} ms</div>
          <span className="text-[10px] text-slate-500 block mt-0.5">Calculated p95</span>
        </div>

        <div className="bg-[#0b1424] border border-slate-800/90 rounded-xl p-3.5 col-span-2 sm:col-span-1">
          <span className="text-[11px] text-slate-400 block">Active Requests</span>
          <div className="text-xl font-bold text-indigo-400 mt-1">{activeCount}</div>
          <span className="text-[10px] text-slate-500 block mt-0.5">Executing now</span>
        </div>
      </div>

      {/* 3. Main Workspace: Navigation | Request Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Navigation (Col 2) */}
        <div className="lg:col-span-2 bg-[#0b1424] border border-slate-800/90 rounded-xl p-3 flex flex-col justify-between space-y-4 font-mono shadow-sm">
          <div className="space-y-1">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2 py-1">
              Navigation
            </div>

            {[
              { id: 'OVERVIEW', label: 'Overview', icon: '◉' },
              { id: 'LIVE_REQUESTS', label: 'Live Requests', icon: '⚡' },
              { id: 'ERRORS', label: 'Errors', icon: '⚠️', count: errorCount },
              { id: 'TRACES', label: 'Traces', icon: '🔍' },
              { id: 'DATABASE', label: 'Database', icon: '🗄️' },
              { id: 'M2_PIPELINE', label: 'M2 Pipeline', icon: '📚' },
              { id: 'SYSTEM_HEALTH', label: 'System Health', icon: '💓' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveNav(item.id as NavSection)}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-all text-left ${
                  activeNav === item.id
                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 font-semibold'
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

          <div className="p-2.5 rounded-lg bg-[#070e1a] border border-slate-800 text-[10px] text-slate-400 space-y-1">
            <div className="text-teal-400 font-bold">🔒 Safe Telemetry</div>
            <p>PII, JWT tokens, and private learner data are scrubbed before storage.</p>
          </div>
        </div>

        {/* Center Request Stream (Col 10) */}
        <div className="lg:col-span-10 space-y-4">
          <div className="bg-[#0b1424] border border-slate-800/90 rounded-xl overflow-hidden shadow-sm font-mono">
            <div className="px-4 py-2.5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs bg-[#09101b]">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white">Live Request Stream</span>
                <span className="text-[10px] text-slate-500">({visibleTraces.length} recorded)</span>
              </div>

              <div className="relative">
                <input
                  type="text"
                  placeholder="Search trace ID, route, method..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-[#070e1a] border border-slate-700 text-[11px] rounded px-2.5 py-1 text-slate-200 placeholder-slate-500 w-full sm:w-64 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] text-slate-400 uppercase tracking-wider bg-[#070e1a]/60">
                    <th className="py-2 px-3">Time</th>
                    <th className="py-2 px-2">Method</th>
                    <th className="py-2 px-3">Route</th>
                    <th className="py-2 px-2 text-center">Status</th>
                    <th className="py-2 px-2 text-right">Duration</th>
                    <th className="py-2 px-3 text-center hidden md:table-cell">Client</th>
                    <th className="py-2 px-3 text-right">Trace ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {loading && traces.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-slate-500">
                        Loading live telemetry stream...
                      </td>
                    </tr>
                  ) : visibleTraces.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-slate-500 space-y-1">
                        <div>No matching requests in telemetry buffer.</div>
                      </td>
                    </tr>
                  ) : (
                    visibleTraces.slice(0, 8).map((trace) => {
                      const isError = trace.status === 'ERROR' || (trace.httpStatus && trace.httpStatus >= 400);
                      const isSelected = selectedTrace?.traceId === trace.traceId;
                      const durationDisplay = (trace.durationMs || 0) >= 1000 ? `${((trace.durationMs || 0) / 1000).toFixed(2)} s` : `${trace.durationMs || 1} ms`;

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
                          <td className="py-2 px-3 text-slate-400 whitespace-nowrap text-[11px]">
                            {new Date(trace.startTimeMs).toLocaleTimeString()}
                          </td>
                          <td className="py-2 px-2 font-bold whitespace-nowrap text-[11px]">
                            <span className="text-teal-400 font-mono">
                              {trace.httpMethod}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-slate-200 font-semibold truncate max-w-[240px]">
                            {trace.httpUrl}
                          </td>
                          <td className="py-2 px-2 text-center whitespace-nowrap">
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
                          <td className="py-2 px-2 text-right whitespace-nowrap text-[11px] text-slate-300">
                            {durationDisplay}
                          </td>
                          <td className="py-2 px-3 text-center text-slate-400 text-[11px] hidden md:table-cell whitespace-nowrap">
                            {trace.clientPlatform || 'browser'}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-[10px] text-slate-500 whitespace-nowrap">
                            {trace.traceId.length > 12 ? `${trace.traceId.slice(0, 10)}...` : trace.traceId}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* 4. REQUEST 360: Fresher-First Progressive Disclosure */}
      {selectedTrace && (
        <div className="bg-[#0b1424] border border-slate-800/90 rounded-xl p-4 sm:p-5 space-y-4 shadow-md font-mono">
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
                  Trace ID: {selectedTrace.traceId} • Request ID: {selectedTrace.requestId} • Duration: {selectedTrace.durationMs || 1} ms
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                onClick={() => handleCopyEvidence(selectedTrace)}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-semibold border border-slate-700 transition-colors"
              >
                📋 Copy Diagnostic Evidence
              </button>
              <button
                onClick={() => setSelectedTrace(null)}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Level 1: Fresher-Friendly Diagnostic Summary Box */}
          {diagnosis && (
            <div className={`p-4 rounded-xl border text-xs space-y-2 ${
              diagnosis.isError
                ? 'bg-rose-950/30 border-rose-900/80 text-rose-200'
                : 'bg-emerald-950/20 border-emerald-900/60 text-slate-200'
            }`}>
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <span className="font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  {diagnosis.isError ? '🔴 Problem Diagnosis' : '🟢 Operational Status'}
                </span>
                <span className="text-[10px] text-slate-400">Where: {diagnosis.where}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                <div>
                  <span className="text-slate-400 font-semibold block text-[10px] uppercase">What happened?</span>
                  <p className="text-white font-medium mt-0.5">{diagnosis.what}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block text-[10px] uppercase">Why?</span>
                  <p className="mt-0.5">{diagnosis.why}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block text-[10px] uppercase">What should I do?</span>
                  <p className="text-teal-300 font-medium mt-0.5">{diagnosis.action}</p>
                </div>
              </div>
            </div>
          )}

          {/* Level 2 & 3 Tabs */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-1 border-b border-slate-800 text-xs">
              {[
                { id: 'WATERFALL', label: 'Subsystem Waterfall' },
                { id: 'SPANS', label: `Raw Spans (${selectedTrace.spans.length})` },
                { id: 'METADATA', label: 'Metadata' },
                { id: 'EVIDENCE_PACKAGE', label: 'Evidence Package' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as DetailsTab)}
                  className={`px-3 py-1.5 rounded-t-lg transition-all ${
                    activeTab === tab.id
                      ? 'bg-teal-500/20 text-teal-300 border-b-2 border-teal-400 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Subsystem Waterfall View (Real data only) */}
            {activeTab === 'WATERFALL' && (
              <div className="bg-[#080e18] p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800/80 pb-2">
                  <span>Subsystem Execution Journey</span>
                  <span>Total: {selectedTrace.durationMs || 1} ms</span>
                </div>

                <div className="space-y-2.5">
                  {selectedTrace.spans.map((span, idx) => {
                    const isErr = span.status === 'ERROR';
                    const dur = span.durationMs || 1;
                    const totalDur = selectedTrace.durationMs || 1;
                    const widthPct = Math.min(100, Math.max(8, (dur / totalDur) * 100));

                    return (
                      <div key={span.spanId || idx} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${isErr ? 'bg-rose-500' : 'bg-emerald-400'}`} />
                            <span className="font-bold text-slate-200">{span.name}</span>
                            <span className="text-[10px] text-slate-500 px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800">
                              {span.kind}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 font-mono">
                            <span className={`${isErr ? 'text-rose-400 font-bold' : 'text-slate-300'}`}>
                              {dur} ms
                            </span>
                            <span>{isErr ? '🔴' : '✓'}</span>
                          </div>
                        </div>

                        <div className="w-full h-2 bg-[#050910] rounded-full overflow-hidden flex">
                          <div
                            style={{ width: `${widthPct}%` }}
                            className={`h-full rounded-full ${
                              isErr ? 'bg-rose-500 shadow-sm shadow-rose-500/50' : 'bg-teal-400 shadow-sm shadow-teal-400/40'
                            }`}
                          />
                        </div>

                        {span.errorMessage && (
                          <div className="text-[11px] text-rose-400 pl-4 pt-0.5">
                            Error: {span.errorMessage}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Raw Spans List */}
            {activeTab === 'SPANS' && (
              <div className="space-y-2">
                {selectedTrace.spans.map((span) => (
                  <div key={span.spanId} className="p-3 rounded-lg bg-[#080e18] border border-slate-800 text-xs flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white flex items-center gap-2">
                        <span>{span.name}</span>
                        <span className="text-[10px] text-slate-500 bg-slate-900 px-1.5 py-0.2 rounded border border-slate-800">
                          {span.kind}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 block mt-0.5">Span ID: {span.spanId}</span>
                      {span.attributes && Object.keys(span.attributes).length > 0 && (
                        <div className="text-[10px] text-slate-400 mt-1 font-mono">
                          Attributes: {JSON.stringify(span.attributes)}
                        </div>
                      )}
                      {span.errorMessage && (
                        <span className="text-[10px] text-rose-400 block mt-0.5">Error: {span.errorMessage}</span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-slate-200 font-bold block">{span.durationMs || 1} ms</span>
                      <span className={`text-[10px] font-bold ${span.status === 'ERROR' ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {span.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Metadata Tab */}
            {activeTab === 'METADATA' && (
              <div className="p-4 bg-[#080e18] rounded-xl border border-slate-800 text-xs space-y-2 font-mono">
                <div><span className="text-slate-500">Trace ID:</span> <span className="text-slate-200">{selectedTrace.traceId}</span></div>
                <div><span className="text-slate-500">Request ID:</span> <span className="text-slate-200">{selectedTrace.requestId}</span></div>
                <div><span className="text-slate-500">Client Platform:</span> <span className="text-slate-200">{selectedTrace.clientPlatform}</span></div>
                <div><span className="text-slate-500">Client Route:</span> <span className="text-slate-200">{selectedTrace.clientRoute || '/'}</span></div>
                <div><span className="text-slate-500">HTTP URL:</span> <span className="text-slate-200">{selectedTrace.httpUrl}</span></div>
                <div><span className="text-slate-500">Start Time:</span> <span className="text-slate-200">{selectedTrace.startTimeIso}</span></div>
                <div><span className="text-slate-500">Duration:</span> <span className="text-slate-200">{selectedTrace.durationMs} ms</span></div>
              </div>
            )}

            {/* Evidence Package Tab */}
            {activeTab === 'EVIDENCE_PACKAGE' && (
              <div className="space-y-2">
                <pre className="p-4 bg-black/60 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-72">
                  {generateEvidencePackage(selectedTrace)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
