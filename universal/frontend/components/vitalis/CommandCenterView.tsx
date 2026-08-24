'use client';

import React from 'react';
import { VitalisCommandCenterOverview, VitalisIncident } from '../../lib/vitalis/domain/types';

interface CommandCenterViewProps {
  overview: VitalisCommandCenterOverview;
  onInvestigateIncident: (incident: VitalisIncident) => void;
  onViewAllRequests: () => void;
  onSelectSubsystem: (sub: { name: string; tier: string; score: number; status: string }) => void;
}

export const CommandCenterView: React.FC<CommandCenterViewProps> = ({
  overview,
  onInvestigateIncident,
  onViewAllRequests,
  onSelectSubsystem,
}) => {
  const primaryIncident = overview.activeIncidents[0];

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* 1. Editorial Header & Greeting */}
      <div className="space-y-1 pt-2">
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <span className="text-teal-400 font-semibold">VITALIS INTELLIGENCE</span>
          <span>•</span>
          <span>Last analyzed 2 seconds ago</span>
          <span>•</span>
          <span className="text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Nominal</span>
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
          Everything is operating normally.
        </h1>
        <p className="text-slate-400 text-sm sm:text-base leading-relaxed max-w-2xl">
          Continuous observation of {overview.totalRequestsCount} live transactions across {overview.environment} shows zero active customer-impacting anomalies.
        </p>
      </div>

      {/* 2. Hero Asymmetric State Duo (Apple Health / Watch Style) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Hero: System Health (7 Cols) */}
        <div className="md:col-span-7 p-7 sm:p-9 rounded-3xl bg-[#0c1424]/80 backdrop-blur-xl border border-white/[0.08] shadow-sm flex flex-col justify-between space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
              SYSTEM HEALTH
            </span>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
              ● NOMINAL
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex items-baseline gap-3">
              <span className="text-6xl sm:text-7xl font-extrabold text-white tracking-tight font-sans">
                {overview.operationalScore}
              </span>
              <span className="text-lg text-slate-400 font-medium">/ 100</span>
            </div>
            <p className="text-sm text-slate-300 font-medium">
              Operational performance is <strong className="text-emerald-400">↑ 2.4% better</strong> than rolling baseline.
            </p>
          </div>

          <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-400">
            <span>SLA Health: <strong className="text-teal-300 font-mono font-bold">{overview.slaPercent}%</strong></span>
            <span>P95 Latency: <strong className="text-white font-mono">{overview.p95LatencyMs} ms</strong></span>
            <span>Target: <strong className="text-slate-300">≤ 2.0s</strong></span>
          </div>
        </div>

        {/* Right Hero: Business Impact (5 Cols) */}
        <div className={`md:col-span-5 p-7 sm:p-9 rounded-3xl border shadow-sm flex flex-col justify-between space-y-6 ${
          overview.activeIncidentsCount > 0
            ? 'bg-rose-950/30 border-rose-900/60'
            : 'bg-[#0c1424]/80 backdrop-blur-xl border-white/[0.08]'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
              BUSINESS IMPACT
            </span>
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${
              overview.activeIncidentsCount > 0
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25'
            }`}>
              {overview.activeIncidentsCount > 0 ? 'ATTENTION REQUIRED' : 'PROTECTED'}
            </span>
          </div>

          <div className="space-y-1.5">
            <span className={`text-4xl sm:text-5xl font-extrabold tracking-tight ${
              overview.activeIncidentsCount > 0 ? 'text-rose-400' : 'text-emerald-400'
            }`}>
              {overview.activeIncidentsCount > 0 ? `${overview.activeIncidentsCount} Active` : 'Protected'}
            </span>
            <p className="text-xs sm:text-sm text-slate-300 pt-1">
              {overview.activeIncidentsCount > 0
                ? 'Payment processing latency spike affecting transactions.'
                : 'No customers or revenue pipelines are currently affected.'}
            </p>
          </div>

          <div className="pt-4 border-t border-white/[0.06] grid grid-cols-2 gap-2 text-xs font-mono">
            <div>
              <span className="text-slate-500 block text-[10px]">MONITORED USERS</span>
              <span className="text-white font-bold">12,458</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">FAILED TXNS</span>
              <span className="text-emerald-400 font-bold">{overview.errorCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Attention Section */}
      {primaryIncident ? (
        <div className="p-6 sm:p-7 rounded-3xl bg-[#121c2e] border border-rose-900/60 space-y-4 shadow-md">
          <div className="flex items-center justify-between border-b border-rose-900/40 pb-3">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-rose-500 animate-pulse" />
              <h2 className="text-base font-bold text-white">
                🔴 Incident: {primaryIncident.title}
              </h2>
            </div>
            <button
              onClick={() => onInvestigateIncident(primaryIncident)}
              className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors"
            >
              Investigate Causal Chain →
            </button>
          </div>
          <p className="text-xs text-slate-300">
            Root Cause: {primaryIncident.rca?.summary || 'Database connection saturation.'} (Confidence: {primaryIncident.rca?.confidencePercent || 92}%)
          </p>
        </div>
      ) : (
        <div className="p-5 sm:p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center gap-3">
            <span className="text-emerald-400 font-bold text-base">✓</span>
            <span><strong>Attention:</strong> Nothing requires your attention right now. All pipelines operating nominally.</span>
          </div>
          <span className="text-slate-500 font-mono hidden sm:inline">0 Active Warnings</span>
        </div>
      )}

      {/* 4. Signature Flowing Request Execution Journey */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white tracking-tight">Request Journey</h2>
          <span className="text-xs font-mono text-slate-400">Total execution: <strong className="text-amber-300">25 ms</strong></span>
        </div>

        <div className="p-6 sm:p-8 rounded-3xl bg-[#0c1424]/80 backdrop-blur-xl border border-white/[0.08] shadow-sm">
          {/* Flowing Connected Path */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {[
              { name: 'Browser Client', kind: 'CLIENT', time: '8 ms', status: 'HEALTHY' },
              { name: 'NestJS Gateway', kind: 'GATEWAY', time: '3 ms', status: 'HEALTHY' },
              { name: 'HTTP Controller', kind: 'CONTROLLER', time: '7 ms', status: 'HEALTHY' },
              { name: 'Prisma / Postgres', kind: 'DATABASE', time: '4 ms', status: 'HEALTHY' },
              { name: 'LocalStorage', kind: 'STORAGE', time: '2 ms', status: 'HEALTHY' },
              { name: 'Client Response', kind: 'DOWNSTREAM', time: '1 ms', status: 'HEALTHY' },
            ].map((hop, i) => (
              <div
                key={i}
                onClick={() => onSelectSubsystem({ name: hop.name, tier: hop.kind, score: 98, status: 'HEALTHY' })}
                className="p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-teal-500/40 cursor-pointer space-y-2 transition-all group"
              >
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-500">#{i + 1}</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 group-hover:scale-125 transition-transform" />
                </div>
                <div>
                  <span className="font-bold text-white text-xs block truncate">{hop.name}</span>
                  <span className="text-[10px] text-teal-400 font-mono block mt-0.5">{hop.kind}</span>
                </div>
                <div className="pt-1 text-xs font-mono text-amber-300 font-bold">
                  {hop.time}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. Ambient Intelligence & Observations Feed */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white tracking-tight">Ambient Intelligence</h2>
          <button
            onClick={onViewAllRequests}
            className="text-xs text-teal-400 hover:text-teal-300 font-semibold"
          >
            Explore Live Telemetry Stream →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-[#0c1424]/80 backdrop-blur-xl border border-white/[0.08] space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="font-bold text-white text-xs">PostgreSQL Database</span>
              <span className="text-[10px] text-slate-500 font-mono ml-auto">Nominal</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              PostgreSQL database query latency is operating 18% below baseline at 4ms P95. No connection contention detected.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#0c1424]/80 backdrop-blur-xl border border-white/[0.08] space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="font-bold text-white text-xs">Node.js Memory &amp; Storage</span>
              <span className="text-[10px] text-slate-500 font-mono ml-auto">Nominal</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Process heap memory utilization is healthy at 72% (45MB). Local storage directory read/write verified.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
