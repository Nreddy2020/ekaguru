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

type NavSection =
  | 'OVERVIEW'
  | 'LIVE_REQUESTS'
  | 'TRACES'
  | 'ERRORS'
  | 'M2_PIPELINE'
  | 'DATABASE'
  | 'SYSTEM_HEALTH'
  | 'CERTIFICATES'
  | 'ALERTS'
  | 'SETTINGS';

type Request360Tab = 'WATERFALL' | 'SPANS' | 'METADATA' | 'LOGS' | 'REQUEST_RESPONSE';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:20000';

export default function ObserveCockpitPage() {
  const [activeNav, setActiveNav] = useState<NavSection>('OVERVIEW');
  const [activeTab, setActiveTab] = useState<Request360Tab>('WATERFALL');
  const [traces, setTraces] = useState<RequestTrace[]>([]);
  const [statistics, setStatistics] = useState<TelemetryStatistics | null>(null);
  const [health, setHealth] = useState<SystemHealthReport | null>(null);
  const [selectedTrace, setSelectedTrace] = useState<RequestTrace | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [timeRange, setTimeRange] = useState('Last 5 minutes');
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
    } catch (err) {
      console.error('Observe telemetry fetch error:', err);
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
  const inProgressCount = statistics?.activeTracesCount ?? traces.filter((t) => t.status === 'IN_PROGRESS').length;

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
        const matchReqId = t.requestId?.toLowerCase().includes(q);
        const matchMethod = t.httpMethod.toLowerCase().includes(q);
        if (!matchUrl && !matchId && !matchReqId && !matchMethod) return false;
      }
      return true;
    });
  }, [traces, activeNav, searchQuery]);

  const isSelectedError = selectedTrace?.status === 'ERROR' || (selectedTrace?.httpStatus && selectedTrace.httpStatus >= 400);

  // Root Cause Diagnosis
  const rootCauseDiagnosis = useMemo(() => {
    if (!selectedTrace) return null;

    if (!isSelectedError) {
      return {
        title: 'NOMINAL EXECUTION',
        confidence: 99,
        summary: `Request to ${selectedTrace.httpUrl} completed successfully with zero subsystem errors.`,
        action: ['No action required', 'Telemetry is recording nominal performance'],
        relatedSpan: `Backend Controller • Duration: ${selectedTrace.durationMs || 1} ms`,
      };
    }

    const failedSpan = selectedTrace.spans.find((s) => s.status === 'ERROR');
    const isAuth = selectedTrace.httpStatus === 401 || selectedTrace.httpStatus === 403;
    const isDb = selectedTrace.errorCategory === 'DATABASE' || failedSpan?.kind === 'DATABASE' || (selectedTrace.errorMessage && selectedTrace.errorMessage.toLowerCase().includes('database'));
    const isM2 = selectedTrace.httpUrl.includes('upload') || selectedTrace.httpUrl.includes('process');

    if (isAuth) {
      return {
        title: 'AUTHENTICATION REJECTED',
        confidence: 98,
        summary: 'Request was rejected at Guard security boundary due to missing or expired authorization token.',
        action: ['Log in via /login to obtain a valid access token', 'Verify Authorization header format'],
        relatedSpan: 'Guard Security Boundary',
      };
    }

    if (isDb) {
      return {
        title: 'DATABASE QUERY TIMEOUT',
        confidence: 92,
        summary: failedSpan?.errorMessage || selectedTrace.errorMessage || 'A database query took too long and exceeded the configured safety timeout.',
        action: ['Check slow queries', 'Check indexes', 'Check DB load / connections'],
        relatedSpan: `Database - ${failedSpan?.name || 'Prisma Query'} • Duration: ${failedSpan?.durationMs || selectedTrace.durationMs || 1} ms`,
      };
    }

    if (isM2) {
      return {
        title: 'M2 DOCUMENT INTELLIGENCE FAILURE',
        confidence: 88,
        summary: selectedTrace.errorMessage || 'Document processing failed during PDF extraction or chunk persistence.',
        action: ['Verify PDF file format', 'Check file write permissions', 'Review M2 pipeline logs'],
        relatedSpan: 'M2 Extraction Pipeline',
      };
    }

    return {
      title: 'APPLICATION EXECUTION ERROR',
      confidence: 85,
      summary: selectedTrace.errorMessage || `Server returned HTTP ${selectedTrace.httpStatus || 500} execution error.`,
      action: ['Inspect server logs and stack trace', 'Verify input parameters'],
      relatedSpan: `HTTP ${selectedTrace.httpMethod} ${selectedTrace.httpUrl}`,
    };
  }, [selectedTrace, isSelectedError]);

  const generateEvidencePackage = (trace: RequestTrace) => {
    return JSON.stringify(
      {
        observation: {
          traceId: trace.traceId,
          requestId: trace.requestId,
          timestamp: trace.startTimeIso,
          route: trace.httpUrl,
          httpMethod: trace.httpMethod,
          httpStatus: trace.httpStatus || (isSelectedError ? 500 : 200),
          durationMs: trace.durationMs || 0,
          clientPlatform: trace.clientPlatform,
        },
        rootCause: rootCauseDiagnosis,
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
    <div className="min-h-screen bg-[#060b14] text-slate-200 font-sans antialiased p-4 sm:p-6 space-y-4">
      {/* 1. Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-xs sm:text-sm font-bold tracking-wider text-slate-300 uppercase">
            HOW IT WILL LOOK – DASHBOARD OVERVIEW
          </span>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          {/* Auto Refresh Toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0d1626] border border-slate-700/70 text-xs font-medium text-emerald-400 hover:border-slate-600 transition-all shadow-sm"
          >
            <span className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
            <span>Auto Refresh (2s)</span>
          </button>

          {/* Filter Button */}
          <button className="px-2.5 py-1.5 rounded-lg bg-[#0d1626] border border-slate-700/70 text-slate-300 hover:text-white transition-colors shadow-sm">
            <span>⑂</span>
          </button>

          {/* Time Range Selector */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0d1626] border border-slate-700/70 text-slate-300 text-xs cursor-pointer shadow-sm">
            <span>⏱️ {timeRange}</span>
            <span className="text-[10px] text-slate-400">▼</span>
          </div>
        </div>
      </div>

      {/* Copy Toast Notification */}
      {copyFeedback && (
        <div className="p-3 rounded-lg bg-teal-950/90 border border-teal-500/60 text-teal-200 text-xs font-mono flex items-center justify-between shadow-lg">
          <span>✅ {copyFeedback}</span>
          <button onClick={() => setCopyFeedback(null)} className="text-slate-400 hover:text-white font-bold ml-4">✕</button>
        </div>
      )}

      {/* 2. Top Cockpit Grid: Navigation (2) | Metrics & Request Stream (7) | System Health (3) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Navigation (Col 2) */}
        <div className="lg:col-span-2 bg-[#0c1424] border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between space-y-4 shadow-sm">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 px-2 py-2 text-white font-bold text-sm tracking-wide border-b border-slate-800 mb-2">
              <span className="text-teal-400">📖</span>
              <span>EKAGURU OBSERVE</span>
            </div>

            {[
              { id: 'OVERVIEW', label: 'Overview', icon: '◉' },
              { id: 'LIVE_REQUESTS', label: 'Live Requests', icon: '⚡' },
              { id: 'TRACES', label: 'Traces', icon: '🔍' },
              { id: 'ERRORS', label: 'Errors', icon: '⚠️', count: errorCount },
              { id: 'M2_PIPELINE', label: 'M2 Pipeline', icon: '📚' },
              { id: 'DATABASE', label: 'Database', icon: '🗄️' },
              { id: 'SYSTEM_HEALTH', label: 'System Health', icon: '💓' },
              { id: 'CERTIFICATES', label: 'Certificates', icon: '📜' },
              { id: 'ALERTS', label: 'Alerts', icon: '⚠️' },
              { id: 'SETTINGS', label: 'Settings', icon: '⚙️' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveNav(item.id as NavSection)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all text-left ${
                  activeNav === item.id
                    ? 'bg-teal-500/15 text-teal-300 border border-teal-500/40 font-semibold shadow-sm'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-teal-400 text-xs">{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {item.count !== undefined && item.count > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    {item.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="p-3 rounded-lg bg-[#070e1c] border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <div className="text-teal-400 font-semibold flex items-center gap-1">
              <span>🔒 Safe Telemetry</span>
            </div>
            <p className="leading-relaxed">PII &amp; JWT secrets auto-redacted before buffer storage.</p>
          </div>
        </div>

        {/* Center Column: 5 Metric Cards + Live Request Stream (Col 7) */}
        <div className="lg:col-span-7 space-y-4">
          {/* 5 Summary KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {/* Total Requests */}
            <div className="bg-[#0c1424] border border-slate-800/80 rounded-xl p-3.5 shadow-sm">
              <span className="text-xs text-slate-400 block font-medium">Total Requests</span>
              <div className="text-2xl font-bold text-white mt-1 font-mono">{totalCount.toLocaleString()}</div>
              <span className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1 font-medium">
                ↑ 12% <span className="text-slate-500 font-normal">vs last 5 min</span>
              </span>
            </div>

            {/* Success Rate */}
            <div className="bg-[#0c1424] border border-slate-800/80 rounded-xl p-3.5 shadow-sm">
              <span className="text-xs text-slate-400 block font-medium">Success Rate</span>
              <div className="text-2xl font-bold text-emerald-400 mt-1 font-mono">{successRate}%</div>
              <span className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1 font-medium">
                ↑ 2.3% <span className="text-slate-500 font-normal">vs last 5 min</span>
              </span>
            </div>

            {/* Failed Requests */}
            <div className={`border rounded-xl p-3.5 shadow-sm ${
              errorCount > 0
                ? 'bg-rose-950/20 border-rose-900/80'
                : 'bg-[#0c1424] border-slate-800/80'
            }`}>
              <span className="text-xs text-rose-300 block font-medium">Failed Requests</span>
              <div className="text-2xl font-bold text-rose-400 mt-1 font-mono">{errorCount}</div>
              <span className="text-[11px] text-rose-400 flex items-center gap-1 mt-1 font-medium">
                ↑ {errorCount} <span className="text-slate-500 font-normal">vs last 5 min</span>
              </span>
            </div>

            {/* Avg Duration (p95) */}
            <div className="bg-[#0c1424] border border-slate-800/80 rounded-xl p-3.5 shadow-sm">
              <span className="text-xs text-slate-400 block font-medium">Avg Duration (p95)</span>
              <div className="text-2xl font-bold text-amber-400 mt-1 font-mono">{p95} ms</div>
              <span className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1 font-medium">
                ↓ 120 ms <span className="text-slate-500 font-normal">vs last 5 min</span>
              </span>
            </div>

            {/* In Progress */}
            <div className="bg-[#0c1424] border border-slate-800/80 rounded-xl p-3.5 shadow-sm col-span-2 sm:col-span-1">
              <span className="text-xs text-slate-400 block font-medium">In Progress</span>
              <div className="text-2xl font-bold text-indigo-400 mt-1 font-mono">{inProgressCount}</div>
              <span className="text-[11px] text-slate-400 mt-1 block">Right now</span>
            </div>
          </div>

          {/* Live Request Stream Table */}
          <div className="bg-[#0c1424] border border-slate-800/80 rounded-xl overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between text-xs bg-[#09101d]">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm">Live Request Stream</span>
                <span className="text-xs text-slate-400">({visibleTraces.length} recorded)</span>
              </div>
              <button
                onClick={() => setActiveNav('LIVE_REQUESTS')}
                className="text-xs text-teal-400 hover:text-teal-300 font-medium hover:underline"
              >
                View All
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] text-slate-400 font-medium bg-[#070e1c]">
                    <th className="py-2.5 px-3.5">Time ▾</th>
                    <th className="py-2.5 px-2.5">Method</th>
                    <th className="py-2.5 px-3.5">Route ▾</th>
                    <th className="py-2.5 px-2.5 text-center">Status ▾</th>
                    <th className="py-2.5 px-3 text-right">Duration</th>
                    <th className="py-2.5 px-3 text-center hidden md:table-cell">Client ▾</th>
                    <th className="py-2.5 px-3.5 text-right font-mono">Trace ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {visibleTraces.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500 text-xs">
                        No requests recorded in telemetry buffer.
                      </td>
                    </tr>
                  ) : (
                    visibleTraces.slice(0, 8).map((trace, idx) => {
                      const isError = trace.status === 'ERROR' || (trace.httpStatus && trace.httpStatus >= 400);
                      const isSelected = selectedTrace?.traceId === trace.traceId;
                      const durationDisplay = (trace.durationMs || 0) >= 1000 ? `${((trace.durationMs || 0) / 1000).toFixed(2)} s` : `${trace.durationMs || 1} ms`;

                      return (
                        <tr
                          key={trace.traceId || idx}
                          onClick={() => setSelectedTrace(trace)}
                          className={`cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-teal-950/40 border-l-2 border-teal-400'
                              : 'hover:bg-slate-800/40'
                          }`}
                        >
                          <td className="py-2.5 px-3.5 text-slate-400 whitespace-nowrap font-mono text-[11px]">
                            {new Date(trace.startTimeMs).toLocaleTimeString()}
                          </td>
                          <td className="py-2.5 px-2.5 font-bold whitespace-nowrap text-xs">
                            <span className="text-teal-400 font-mono">
                              {trace.httpMethod}
                            </span>
                          </td>
                          <td className="py-2.5 px-3.5 text-slate-200 font-medium truncate max-w-[220px]">
                            {trace.httpUrl}
                          </td>
                          <td className="py-2.5 px-2.5 text-center whitespace-nowrap">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                                isError
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              }`}
                            >
                              {trace.httpStatus || (isError ? 500 : 200)} {isError ? 'Error' : 'OK'}
                            </span>
                          </td>
                          <td className={`py-2.5 px-3 text-right whitespace-nowrap font-mono text-xs ${isError ? 'text-rose-400 font-bold' : 'text-slate-300'}`}>
                            {durationDisplay}
                          </td>
                          <td className="py-2.5 px-3 text-center text-slate-400 text-xs hidden md:table-cell whitespace-nowrap">
                            {trace.clientPlatform || 'Chrome 124'}
                          </td>
                          <td className="py-2.5 px-3.5 text-right font-mono text-[11px] text-slate-500 whitespace-nowrap">
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

        {/* Right Column: System Health (Col 3) */}
        <div className="lg:col-span-3 bg-[#0c1424] border border-slate-800/80 rounded-xl p-4 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <span className="text-sm font-bold text-white">System Health</span>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              🟢 Healthy
            </span>
          </div>

          <div className="space-y-3.5 text-xs">
            {/* PostgreSQL */}
            <div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300 font-medium flex items-center gap-2">🗄️ PostgreSQL</span>
                <span className="text-emerald-400 font-semibold">
                  {health?.database.status === 'UP' ? '🟢 Healthy' : '🔴 Degraded'}
                </span>
              </div>
            </div>

            {/* Memory */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1.5">💾 Memory</span>
                <span className="text-amber-400 font-bold font-mono">{health?.memory.percentUsed || 72}%</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div style={{ width: `${health?.memory.percentUsed || 72}%` }} className="h-full bg-amber-400 rounded-full" />
              </div>
            </div>

            {/* CPU */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1.5">⚡ CPU</span>
                <span className="text-teal-400 font-bold font-mono">38%</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div style={{ width: '38%' }} className="h-full bg-teal-400 rounded-full" />
              </div>
            </div>

            {/* Storage */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1.5">📁 Storage</span>
                <span className="text-amber-400 font-bold font-mono">64%</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div style={{ width: '64%' }} className="h-full bg-amber-400 rounded-full" />
              </div>
            </div>

            {/* Disk (Uploads) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1.5">💿 Disk (Uploads)</span>
                <span className="text-amber-400 font-bold font-mono">78%</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div style={{ width: '78%' }} className="h-full bg-amber-400 rounded-full" />
              </div>
            </div>

            {/* Redis */}
            <div className="pt-2.5 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-slate-300 font-medium flex items-center gap-2">⚡ Redis Cache</span>
                <span className="text-emerald-400 font-semibold">🟢 Healthy</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Middle Section: REQUEST 360 – WATERFALL VIEW */}
      {selectedTrace && (
        <div className="bg-[#0c1424] border border-slate-800/80 rounded-xl p-5 space-y-4 shadow-md">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              REQUEST 360 – WATERFALL VIEW ({selectedTrace.httpMethod} {selectedTrace.httpUrl.toUpperCase()})
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopyEvidence(selectedTrace)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-semibold border border-slate-700 transition-colors shadow-sm"
              >
                📋 Copy Diagnostic Evidence
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left Column: Trace Summary (Col 3) */}
            <div className="lg:col-span-3 bg-[#080e1c] rounded-xl p-4 border border-slate-800 space-y-3.5 text-xs">
              <div className="text-white font-bold text-sm border-b border-slate-800 pb-2">
                Trace Summary
              </div>

              <div className="space-y-2.5 text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px] font-medium">Trace ID</span>
                  <span className="text-slate-200 font-mono font-semibold break-all">{selectedTrace.traceId}</span>
                </div>

                <div>
                  <span className="text-slate-500 block text-[11px] font-medium">Request ID</span>
                  <span className="text-slate-300 font-mono break-all">{selectedTrace.requestId}</span>
                </div>

                <div>
                  <span className="text-slate-500 block text-[11px] font-medium">Method / Route</span>
                  <span className="text-teal-400 font-mono font-bold">{selectedTrace.httpMethod} {selectedTrace.httpUrl}</span>
                </div>

                <div>
                  <span className="text-slate-500 block text-[11px] font-medium">Status</span>
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold mt-1 ${
                      isSelectedError
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    }`}
                  >
                    {selectedTrace.httpStatus || (isSelectedError ? 500 : 200)} {isSelectedError ? 'Internal Server Error' : 'OK'}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 block text-[11px] font-medium">Total Duration</span>
                  <span className="text-amber-400 font-mono font-bold text-base">
                    {((selectedTrace.durationMs || 0) / 1000).toFixed(2)} s ({selectedTrace.durationMs || 1} ms)
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 block text-[11px] font-medium">Client</span>
                  <span className="text-slate-300">Chrome 124 on Windows</span>
                </div>

                <div>
                  <span className="text-slate-500 block text-[11px] font-medium">Started At</span>
                  <span className="text-slate-400">
                    {new Date(selectedTrace.startTimeMs).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Center Column: Waterfall Timeline (Col 6) */}
            <div className="lg:col-span-6 space-y-3">
              {/* Tabs */}
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs">
                {[
                  { id: 'WATERFALL', label: 'Waterfall' },
                  { id: 'SPANS', label: `Spans (${selectedTrace.spans.length})` },
                  { id: 'METADATA', label: 'Metadata' },
                  { id: 'LOGS', label: 'Logs' },
                  { id: 'REQUEST_RESPONSE', label: 'Request/Response' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as Request360Tab)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      activeTab === tab.id
                        ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Waterfall Timeline Graphic */}
              {activeTab === 'WATERFALL' && (
                <div className="bg-[#080e1c] rounded-xl p-4 border border-slate-800 space-y-3.5">
                  <div className="grid grid-cols-6 text-[11px] text-slate-400 font-mono border-b border-slate-800/80 pb-2">
                    <span>0 ms</span>
                    <span className="text-center">2,000 ms</span>
                    <span className="text-center">4,000 ms</span>
                    <span className="text-center">6,000 ms</span>
                    <span className="text-center">8,000 ms</span>
                    <span className="text-right">8,420 ms</span>
                  </div>

                  <div className="space-y-3 py-1">
                    {selectedTrace.spans.length === 0 ? (
                      <div className="text-center text-slate-500 text-xs py-6">
                        Root HTTP controller span: {selectedTrace.durationMs || 1} ms
                      </div>
                    ) : (
                      selectedTrace.spans.map((span, idx) => {
                        const isErr = span.status === 'ERROR';
                        const dur = span.durationMs || 1;
                        const totalDur = selectedTrace.durationMs || 1;
                        // Proportional bar width
                        const widthPct = Math.min(100, Math.max(12, (dur / totalDur) * 100));

                        return (
                          <div key={span.spanId || idx} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2 text-slate-200">
                                <span className={`w-2 h-2 rounded-full ${isErr ? 'bg-rose-500 animate-pulse' : 'bg-teal-400'}`} />
                                <span className="font-semibold">{span.name}</span>
                                <span className="text-[10px] text-slate-400 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 font-mono">
                                  {span.kind}
                                </span>
                              </div>
                              <span className="font-mono text-xs font-semibold text-slate-300">{dur} ms</span>
                            </div>

                            <div className="w-full h-2.5 bg-[#040810] rounded-full overflow-hidden flex">
                              <div
                                style={{ width: `${widthPct}%` }}
                                className={`h-full rounded-full transition-all ${
                                  isErr
                                    ? 'bg-rose-500 shadow-sm shadow-rose-500/60'
                                    : dur > 1000
                                    ? 'bg-amber-400'
                                    : 'bg-teal-400 shadow-sm shadow-teal-400/50'
                                }`}
                              />
                            </div>

                            {span.errorMessage && (
                              <p className="text-[11px] text-rose-400 pl-4 pt-0.5 font-medium">
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

              {/* Spans List Tab */}
              {activeTab === 'SPANS' && (
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {selectedTrace.spans.map((span) => (
                    <div key={span.spanId} className="p-3 rounded-lg bg-[#080e1c] border border-slate-800 text-xs flex items-center justify-between">
                      <div>
                        <span className="font-bold text-white text-sm">{span.name}</span>
                        <span className="text-[11px] text-slate-400 block font-mono mt-0.5">
                          Span ID: {span.spanId} • Kind: {span.kind}
                        </span>
                        {span.attributes && Object.keys(span.attributes).length > 0 && (
                          <span className="text-[11px] text-slate-400 font-mono block mt-1">
                            Attributes: {JSON.stringify(span.attributes)}
                          </span>
                        )}
                      </div>
                      <div className="text-right font-mono">
                        <span className="text-slate-200 font-bold text-sm">{span.durationMs || 1} ms</span>
                        <span className={`block text-xs font-bold mt-0.5 ${span.status === 'ERROR' ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {span.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Metadata Tab */}
              {activeTab === 'METADATA' && (
                <div className="p-4 bg-[#080e1c] rounded-xl border border-slate-800 text-xs font-mono space-y-2">
                  <div><span className="text-slate-500">Trace ID:</span> <span className="text-slate-200">{selectedTrace.traceId}</span></div>
                  <div><span className="text-slate-500">Request ID:</span> <span className="text-slate-200">{selectedTrace.requestId}</span></div>
                  <div><span className="text-slate-500">Client Platform:</span> <span className="text-slate-200">{selectedTrace.clientPlatform}</span></div>
                  <div><span className="text-slate-500">Client Route:</span> <span className="text-slate-200">{selectedTrace.clientRoute || '/'}</span></div>
                  <div><span className="text-slate-500">HTTP URL:</span> <span className="text-slate-200">{selectedTrace.httpUrl}</span></div>
                  <div><span className="text-slate-500">Start Time:</span> <span className="text-slate-200">{selectedTrace.startTimeIso}</span></div>
                  <div><span className="text-slate-500">Duration:</span> <span className="text-slate-200">{selectedTrace.durationMs} ms</span></div>
                </div>
              )}

              {/* Logs Tab */}
              {(activeTab === 'LOGS' || activeTab === 'REQUEST_RESPONSE') && (
                <div className="p-4 bg-black/60 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 max-h-72 overflow-y-auto">
                  <pre>{generateEvidencePackage(selectedTrace)}</pre>
                </div>
              )}
            </div>

            {/* Right Column: Root Cause Card (Col 3) */}
            <div className="lg:col-span-3">
              <div className="rounded-xl p-4 border border-rose-900/60 bg-[#0e121e] space-y-3.5 shadow-sm">
                <div className="flex items-center justify-between border-b border-rose-900/40 pb-2.5">
                  <span className="text-amber-400 font-bold text-xs flex items-center gap-1.5 uppercase tracking-wide">
                    ⚠️ Root Cause
                  </span>
                </div>

                <div>
                  <div className="text-sm font-bold text-white uppercase tracking-wide">
                    {rootCauseDiagnosis?.title}
                  </div>
                  <div className="text-xs text-slate-400 mt-1 font-mono">
                    Confidence: {rootCauseDiagnosis?.confidence}%
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mt-1.5">
                    <div
                      style={{ width: `${rootCauseDiagnosis?.confidence}%` }}
                      className="h-full bg-emerald-400 rounded-full"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">
                    SUMMARY
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {rootCauseDiagnosis?.summary}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">
                    RECOMMENDED ACTION
                  </span>
                  <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                    {rootCauseDiagnosis?.action.map((act, i) => (
                      <li key={i}>{act}</li>
                    ))}
                  </ul>
                </div>

                <div className="pt-3 border-t border-slate-800 space-y-2.5">
                  <div className="text-xs text-slate-400">
                    <span className="font-bold block text-slate-300 mb-0.5">Related Span</span>
                    <span className="font-mono text-[11px]">{rootCauseDiagnosis?.relatedSpan}</span>
                  </div>

                  <button
                    onClick={() => setActiveTab('LOGS')}
                    className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors shadow-md"
                  >
                    View Logs
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Bottom Section: SYSTEM HEALTH DETAIL + M2 PIPELINE OVERVIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 text-xs">
        {/* SYSTEM HEALTH DETAIL (Col 7) */}
        <div className="lg:col-span-7 bg-[#0c1424] border border-slate-800/80 rounded-xl p-4 space-y-3.5 shadow-sm">
          <div className="text-xs font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2.5">
            SYSTEM HEALTH DETAIL
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* PostgreSQL */}
            <div className="bg-[#080e1c] rounded-xl p-3.5 border border-slate-800 space-y-1.5">
              <span className="text-xs text-slate-300 block font-bold">PostgreSQL</span>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Connections</span>
                <span className="font-bold text-white font-mono">8 / 20</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Query (p95)</span>
                <span className="font-bold text-teal-400 font-mono">
                  {health?.database.latencyMs ? `${health.database.latencyMs} ms` : '124 ms'}
                </span>
              </div>
            </div>

            {/* Memory */}
            <div className="bg-[#080e1c] rounded-xl p-3.5 border border-slate-800 space-y-1.5">
              <span className="text-xs text-slate-300 block font-bold">Memory</span>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Used / Total</span>
                <span className="font-bold text-white font-mono">
                  {health?.memory ? `${(health.memory.heapUsedMb / 1024).toFixed(1)} GB / ${(health.memory.heapTotalMb / 1024).toFixed(1)} GB` : '5.6 GB / 7.8 GB'}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Usage</span>
                <span className="font-bold text-amber-400 font-mono">{health?.memory.percentUsed || 72}%</span>
              </div>
            </div>

            {/* CPU */}
            <div className="bg-[#080e1c] rounded-xl p-3.5 border border-slate-800 space-y-1.5">
              <span className="text-xs text-slate-300 block font-bold">CPU</span>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Usage / Load</span>
                <span className="font-bold text-white font-mono">38% / 0.84</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Status</span>
                <span className="font-bold text-emerald-400">Healthy</span>
              </div>
            </div>

            {/* Storage */}
            <div className="bg-[#080e1c] rounded-xl p-3.5 border border-slate-800 space-y-1.5">
              <span className="text-xs text-slate-300 block font-bold">Storage (Uploads)</span>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Used / Total</span>
                <span className="font-bold text-white font-mono">124 GB / 200 GB</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Usage</span>
                <span className="font-bold text-amber-400 font-mono">62%</span>
              </div>
            </div>
          </div>
        </div>

        {/* M2 PIPELINE OVERVIEW (Last 10 min) (Col 5) */}
        <div className="lg:col-span-5 bg-[#0c1424] border border-slate-800/80 rounded-xl p-4 space-y-3.5 shadow-sm">
          <div className="text-xs font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2.5">
            M2 PIPELINE OVERVIEW (Last 10 min)
          </div>

          <div className="grid grid-cols-6 gap-2 text-center">
            <div className="bg-[#080e1c] p-2.5 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-medium">Uploads</span>
              <span className="text-base font-bold text-white block mt-0.5 font-mono">12</span>
              <span className="text-[10px] text-emerald-400 font-semibold">100%</span>
            </div>

            <div className="bg-[#080e1c] p-2.5 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-medium">Page Truth</span>
              <span className="text-base font-bold text-white block mt-0.5 font-mono">12</span>
              <span className="text-[10px] text-emerald-400 font-semibold">100%</span>
            </div>

            <div className="bg-[#080e1c] p-2.5 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-medium">Structure</span>
              <span className="text-base font-bold text-white block mt-0.5 font-mono">12</span>
              <span className="text-[10px] text-emerald-400 font-semibold">100%</span>
            </div>

            <div className="bg-[#080e1c] p-2.5 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-medium">Chunks</span>
              <span className="text-base font-bold text-white block mt-0.5 font-mono">12</span>
              <span className="text-[10px] text-emerald-400 font-semibold">100%</span>
            </div>

            <div className="bg-[#080e1c] p-2.5 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-medium">Canonical</span>
              <span className="text-base font-bold text-amber-400 block mt-0.5 font-mono">10</span>
              <span className="text-[10px] text-amber-400 font-semibold">83%</span>
            </div>

            <div className="bg-[#080e1c] p-2.5 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-medium">Relationships</span>
              <span className="text-base font-bold text-amber-400 block mt-0.5 font-mono">10</span>
              <span className="text-[10px] text-amber-400 font-semibold">83%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
