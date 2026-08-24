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
    <div className="space-y-4 w-full pb-8">
      {/* 1. Editorial Greeting (Snug Proportions) */}
      <div className="space-y-1">
        <div className="flex items-center gap-2.5 text-xs font-mono text-slate-300">
          <span className="text-teal-400 font-bold tracking-wider">VITALIS INTELLIGENCE</span>
          <span className="text-slate-600">•</span>
          <span>Last analyzed 2s ago</span>
          <span className="text-slate-600">•</span>
          <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400" />
            <span>Nominal Operations</span>
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Everything is operating normally.
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
          Continuous observation of <strong className="text-white font-mono">{overview.totalRequestsCount}</strong> live transactions across {overview.environment} shows zero active customer-impacting anomalies.
        </p>
      </div>

      {/* 2. Balanced 2-Column Hero Duo (Proportional Card Sizing) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full">
        {/* Left Card: System Health */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#0B1526] border border-[#1a2d4c] shadow-md flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
              SYSTEM HEALTH
            </span>
            <span className="text-[11px] font-bold px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono shadow-xs">
              ● NOMINAL
            </span>
          </div>

          <div className="space-y-1 py-1">
            <div className="flex items-baseline gap-2.5">
              <span className="text-4xl sm:text-5xl font-black text-white tracking-tight font-sans">
                {overview.operationalScore}
              </span>
              <span className="text-lg text-slate-400 font-bold font-mono">/ 100</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 font-medium">
              Operational performance is <strong className="text-emerald-400 font-bold">↑ 2.4% better</strong> than rolling baseline.
            </p>
          </div>

          <div className="pt-3 border-t border-[#1a2d4c] grid grid-cols-3 gap-2 text-xs font-mono">
            <div>
              <span className="text-slate-400 block text-[10px] font-bold">SLA HEALTH</span>
              <span className="text-teal-300 font-bold text-sm mt-0.5 block">{overview.slaPercent}%</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-bold">P95 LATENCY</span>
              <span className="text-white font-bold text-sm mt-0.5 block">{overview.p95LatencyMs} ms</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-bold">TARGET</span>
              <span className="text-slate-200 font-bold text-sm mt-0.5 block">≤ 2.0s</span>
            </div>
          </div>
        </div>

        {/* Right Card: Business Impact */}
        <div className={`p-5 sm:p-6 rounded-2xl border shadow-md flex flex-col justify-between space-y-4 ${
          overview.activeIncidentsCount > 0
            ? 'bg-rose-950/30 border-rose-800'
            : 'bg-[#0B1526] border-[#1a2d4c]'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
              BUSINESS IMPACT
            </span>
            <span className={`text-[11px] font-bold px-3 py-0.5 rounded-full font-mono ${
              overview.activeIncidentsCount > 0
                ? 'bg-rose-500/25 text-rose-200 border border-rose-500/45'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
            }`}>
              {overview.activeIncidentsCount > 0 ? 'ATTENTION REQUIRED' : 'PROTECTED'}
            </span>
          </div>

          <div className="space-y-1 py-1">
            <span className={`text-4xl sm:text-5xl font-black tracking-tight block ${
              overview.activeIncidentsCount > 0 ? 'text-rose-400' : 'text-emerald-400'
            }`}>
              {overview.activeIncidentsCount > 0 ? `${overview.activeIncidentsCount} Active` : 'Protected'}
            </span>
            <p className="text-xs sm:text-sm text-slate-300">
              {overview.activeIncidentsCount > 0
                ? 'Payment processing latency spike affecting live sessions.'
                : 'No customers or revenue pipelines are currently affected.'}
            </p>
          </div>

          <div className="pt-3 border-t border-[#1a2d4c] grid grid-cols-3 gap-2 text-xs font-mono">
            <div>
              <span className="text-slate-400 block text-[10px] font-bold">USERS MONITORED</span>
              <span className="text-white font-bold text-sm mt-0.5 block">12,458</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-bold">FAILED TXNS</span>
              <span className="text-emerald-400 font-bold text-sm mt-0.5 block">{overview.errorCount}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-bold">EXPOSURE</span>
              <span className="text-teal-300 font-bold text-sm mt-0.5 block">₹0.00</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Attention Section Banner */}
      {primaryIncident ? (
        <div className="p-4 sm:p-5 rounded-2xl bg-[#14233c] border border-rose-700/80 space-y-3 shadow-md">
          <div className="flex items-center justify-between border-b border-rose-900/50 pb-2">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-rose-500 animate-pulse" />
              <h2 className="text-sm font-bold text-white">
                🔴 Incident: {primaryIncident.title}
              </h2>
            </div>
            <button
              onClick={() => onInvestigateIncident(primaryIncident)}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-xs transition-colors"
            >
              Investigate Causal Chain →
            </button>
          </div>
          <p className="text-xs text-slate-200">
            Root Cause: {primaryIncident.rca?.summary || 'Database connection saturation.'} (Confidence: {primaryIncident.rca?.confidencePercent || 92}%)
          </p>
        </div>
      ) : (
        <div className="p-3.5 sm:p-4 rounded-xl bg-[#0B1526] border border-[#1a2d4c] flex items-center justify-between text-xs sm:text-sm text-slate-200 shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="text-emerald-400 font-bold text-base">✓</span>
            <span><strong>Attention:</strong> Nothing requires your attention right now. All pipelines operating nominally.</span>
          </div>
          <span className="text-slate-400 font-mono text-[11px] hidden sm:inline font-bold">0 Active Warnings</span>
        </div>
      )}

      {/* 4. Signature Connected Request Journey */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider font-mono">
            Request Journey
          </h2>
          <span className="text-xs font-mono text-slate-300">
            Total execution: <strong className="text-amber-300 font-bold">25 ms</strong>
          </span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-[#0B1526] border border-[#1a2d4c] shadow-md">
          <div className="relative">
            {/* Background connecting rail */}
            <div className="hidden md:block absolute top-6 left-12 right-12 h-0.5 bg-gradient-to-r from-teal-500/40 via-emerald-500/40 to-teal-500/40 z-0" />

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 relative z-10">
              {journeyHops.map((hop, i) => (
                <div
                  key={i}
                  onClick={() => onSelectSubsystem({ name: hop.name, tier: hop.kind, score: 98, status: 'HEALTHY' })}
                  className="p-3 rounded-xl bg-[#070E1B] hover:bg-[#12203c] border border-[#14233c] hover:border-teal-400/60 cursor-pointer space-y-2 transition-all duration-200 shadow-xs group text-left"
                >
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-400 font-bold">#{i + 1}</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-xs shadow-emerald-400 group-hover:scale-125 transition-transform" />
                  </div>
                  <div>
                    <span className="font-bold text-white text-xs block truncate group-hover:text-teal-300 transition-colors">{hop.name}</span>
                    <span className="text-[10px] text-teal-400 font-mono block">{hop.kind}</span>
                  </div>
                  <div className="pt-1.5 border-t border-[#14233c] flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-400 text-[10px]">Latency</span>
                    <span className="text-amber-300 font-bold">{hop.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 5. Ambient Intelligence Feed */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider font-mono">
            Ambient Intelligence
          </h2>
          <button
            onClick={onViewAllRequests}
            className="text-xs text-teal-400 hover:text-teal-300 font-bold"
          >
            Explore Live Telemetry Stream →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <div className="p-4 rounded-xl bg-[#0B1526] border border-[#1a2d4c] space-y-1.5 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="font-bold text-white text-xs sm:text-sm">PostgreSQL Database</span>
              <span className="text-[10px] font-bold text-emerald-400 font-mono ml-auto">NOMINAL</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              PostgreSQL database query latency is operating 18% below baseline at 4ms P95. No connection contention detected.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#0B1526] border border-[#1a2d4c] space-y-1.5 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="font-bold text-white text-xs sm:text-sm">Node.js Memory &amp; Storage</span>
              <span className="text-[10px] font-bold text-emerald-400 font-mono ml-auto">NOMINAL</span>
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
