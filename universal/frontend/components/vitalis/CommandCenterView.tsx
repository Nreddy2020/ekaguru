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

  const journeyHops = [
    { name: 'Browser Client', kind: 'CLIENT', time: '8 ms', status: 'HEALTHY' },
    { name: 'NestJS Gateway', kind: 'GATEWAY', time: '3 ms', status: 'HEALTHY' },
    { name: 'HTTP Controller', kind: 'CONTROLLER', time: '7 ms', status: 'HEALTHY' },
    { name: 'Prisma / Postgres', kind: 'DATABASE', time: '4 ms', status: 'HEALTHY' },
    { name: 'LocalStorage', kind: 'STORAGE', time: '2 ms', status: 'HEALTHY' },
    { name: 'Client Response', kind: 'DOWNSTREAM', time: '1 ms', status: 'HEALTHY' },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* 1. Editorial Header & Greeting */}
      <div className="space-y-1.5 pt-2">
        <div className="flex items-center gap-2.5 text-xs font-mono text-slate-300">
          <span className="text-teal-400 font-bold tracking-wider">VITALIS INTELLIGENCE</span>
          <span className="text-slate-600">•</span>
          <span>Last analyzed 2s ago</span>
          <span className="text-slate-600">•</span>
          <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50 animate-pulse" />
            <span>Nominal Operations</span>
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Everything is operating normally.
        </h1>
        <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-3xl">
          Continuous observation of <strong className="text-white font-mono">{overview.totalRequestsCount}</strong> live transactions across {overview.environment} shows zero active customer-impacting anomalies.
        </p>
      </div>

      {/* 2. Hero Asymmetric State Duo */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Hero: System Health (7 Cols) */}
        <div className="md:col-span-7 p-7 sm:p-9 rounded-3xl bg-[#0c1527]/90 backdrop-blur-2xl border border-white/[0.1] shadow-xl flex flex-col justify-between space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-widest font-mono">
              SYSTEM HEALTH
            </span>
            <span className="text-xs font-bold px-3.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono shadow-sm">
              ● NOMINAL
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex items-baseline gap-3">
              <span className="text-6xl sm:text-7xl font-black text-white tracking-tight font-sans">
                {overview.operationalScore}
              </span>
              <span className="text-xl text-slate-400 font-semibold font-mono">/ 100</span>
            </div>
            <p className="text-sm sm:text-base text-slate-200 font-medium">
              Operational performance is <strong className="text-emerald-400 font-semibold">↑ 2.4% better</strong> than rolling baseline.
            </p>
          </div>

          <div className="pt-5 border-t border-white/[0.08] flex items-center justify-between text-xs sm:text-sm text-slate-300">
            <span>SLA Health: <strong className="text-teal-300 font-mono font-bold">{overview.slaPercent}%</strong></span>
            <span>P95 Latency: <strong className="text-white font-mono font-bold">{overview.p95LatencyMs} ms</strong></span>
            <span>Target: <strong className="text-slate-200 font-mono">≤ 2.0s</strong></span>
          </div>
        </div>

        {/* Right Hero: Business Impact (5 Cols) */}
        <div className={`md:col-span-5 p-7 sm:p-9 rounded-3xl border shadow-xl flex flex-col justify-between space-y-6 ${
          overview.activeIncidentsCount > 0
            ? 'bg-rose-950/40 border-rose-800/80'
            : 'bg-[#0c1527]/90 backdrop-blur-2xl border-white/[0.1]'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-widest font-mono">
              BUSINESS IMPACT
            </span>
            <span className={`text-xs font-bold px-3.5 py-1 rounded-full font-mono ${
              overview.activeIncidentsCount > 0
                ? 'bg-rose-500/25 text-rose-300 border border-rose-500/50'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
            }`}>
              {overview.activeIncidentsCount > 0 ? 'ATTENTION REQUIRED' : 'PROTECTED'}
            </span>
          </div>

          <div className="space-y-2">
            <span className={`text-4xl sm:text-5xl font-black tracking-tight block ${
              overview.activeIncidentsCount > 0 ? 'text-rose-400' : 'text-emerald-400'
            }`}>
              {overview.activeIncidentsCount > 0 ? `${overview.activeIncidentsCount} Active` : 'Protected'}
            </span>
            <p className="text-xs sm:text-sm text-slate-200">
              {overview.activeIncidentsCount > 0
                ? 'Payment processing latency spike affecting transactions.'
                : 'No customers or revenue pipelines are currently affected.'}
            </p>
          </div>

          <div className="pt-5 border-t border-white/[0.08] grid grid-cols-2 gap-4 text-xs sm:text-sm font-mono">
            <div>
              <span className="text-slate-400 block text-[11px] uppercase tracking-wider">MONITORED USERS</span>
              <span className="text-white font-bold text-base">12,458</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px] uppercase tracking-wider">FAILED TXNS</span>
              <span className="text-emerald-400 font-bold text-base">{overview.errorCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Attention Section Banner */}
      {primaryIncident ? (
        <div className="p-6 sm:p-7 rounded-3xl bg-[#121c2e] border border-rose-900/80 space-y-4 shadow-lg">
          <div className="flex items-center justify-between border-b border-rose-900/40 pb-3">
            <div className="flex items-center gap-3">
              <span className="w-3.5 h-3.5 rounded-full bg-rose-500 animate-pulse" />
              <h2 className="text-base sm:text-lg font-bold text-white">
                🔴 Incident: {primaryIncident.title}
              </h2>
            </div>
            <button
              onClick={() => onInvestigateIncident(primaryIncident)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-colors"
            >
              Investigate Causal Chain →
            </button>
          </div>
          <p className="text-sm text-slate-200">
            Root Cause: {primaryIncident.rca?.summary || 'Database connection saturation.'} (Confidence: {primaryIncident.rca?.confidencePercent || 92}%)
          </p>
        </div>
      ) : (
        <div className="p-5 sm:p-6 rounded-2xl bg-[#0c1527]/70 border border-white/[0.08] flex items-center justify-between text-xs sm:text-sm text-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-emerald-400 font-bold text-lg">✓</span>
            <span><strong>Attention:</strong> Nothing requires your attention right now. All pipelines operating nominally.</span>
          </div>
          <span className="text-slate-400 font-mono text-xs hidden sm:inline">0 Active Warnings</span>
        </div>
      )}

      {/* 4. Signature Connected Request Journey */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white tracking-tight">Request Journey</h2>
          <span className="text-xs sm:text-sm font-mono text-slate-300">
            Total execution: <strong className="text-amber-300 font-bold">25 ms</strong>
          </span>
        </div>

        <div className="p-7 sm:p-8 rounded-3xl bg-[#0c1527]/90 backdrop-blur-2xl border border-white/[0.1] shadow-xl space-y-6">
          {/* Horizontal execution chain with luminous connector */}
          <div className="relative">
            {/* Background connecting rail */}
            <div className="hidden md:block absolute top-7 left-12 right-12 h-0.5 bg-gradient-to-r from-teal-500/40 via-emerald-500/40 to-teal-500/40 z-0" />

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 relative z-10">
              {journeyHops.map((hop, i) => (
                <div
                  key={i}
                  onClick={() => onSelectSubsystem({ name: hop.name, tier: hop.kind, score: 98, status: 'HEALTHY' })}
                  className="p-4 rounded-2xl bg-[#08101d] hover:bg-[#0e1b32] border border-white/[0.08] hover:border-teal-400/60 cursor-pointer space-y-3 transition-all duration-200 shadow-sm group text-left"
                >
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400 font-bold">#{i + 1}</span>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-xs shadow-emerald-400/80 group-hover:scale-125 transition-transform" />
                  </div>
                  <div>
                    <span className="font-bold text-white text-xs sm:text-sm block truncate group-hover:text-teal-300 transition-colors">{hop.name}</span>
                    <span className="text-[11px] text-teal-400 font-mono font-semibold block mt-0.5">{hop.kind}</span>
                  </div>
                  <div className="pt-1.5 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400 text-[11px]">Latency</span>
                    <span className="text-amber-300 font-bold">{hop.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 5. Ambient Intelligence Feed */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white tracking-tight">Ambient Intelligence</h2>
          <button
            onClick={onViewAllRequests}
            className="text-xs sm:text-sm text-teal-400 hover:text-teal-300 font-semibold"
          >
            Explore Live Telemetry Stream →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="p-6 rounded-3xl bg-[#0c1527]/90 backdrop-blur-2xl border border-white/[0.1] space-y-2.5 shadow-sm">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-xs shadow-emerald-400/60" />
              <span className="font-bold text-white text-sm">PostgreSQL Database</span>
              <span className="text-xs text-emerald-400 font-mono font-semibold ml-auto">Nominal</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
              PostgreSQL database query latency is operating 18% below baseline at 4ms P95. No connection contention detected.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-[#0c1527]/90 backdrop-blur-2xl border border-white/[0.1] space-y-2.5 shadow-sm">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-xs shadow-emerald-400/60" />
              <span className="font-bold text-white text-sm">Node.js Memory &amp; Storage</span>
              <span className="text-xs text-emerald-400 font-mono font-semibold ml-auto">Nominal</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
              Process heap memory utilization is healthy at 72% (45MB). Local storage directory read/write verified.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
