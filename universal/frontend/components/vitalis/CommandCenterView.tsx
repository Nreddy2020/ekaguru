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
    <div className="space-y-6 max-w-7xl mx-auto pb-8">
      {/* LEVEL 1: SYSTEM STATE (Hero Numbers 40–48px) */}
      <div className="bg-[#0B1422] border border-white/[0.08] rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-4 mb-6">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block font-mono">
              LEVEL 1 · SYSTEM STATE
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-0.5">
              Operational Health &amp; Performance
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50 animate-pulse" />
            <span className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-wider">
              {overview.activeIncidentsCount > 0 ? 'ATTENTION REQUIRED' : 'ALL SYSTEMS NOMINAL'}
            </span>
          </div>
        </div>

        {/* 3 Large Hero Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Pillar 1: Operational Health */}
          <div className="space-y-2 p-5 rounded-2xl bg-[#08111D] border border-white/[0.06]">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block font-mono">
              OPERATIONAL HEALTH
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-black text-white font-mono tracking-tight">
                {overview.operationalScore}
              </span>
              <span className="text-sm text-slate-400 font-mono">/ 100</span>
            </div>
            <div className="flex items-center gap-2 pt-2 border-t border-white/[0.06] text-xs">
              <span className="text-emerald-400 font-bold">↑ 2.4%</span>
              <span className="text-slate-400">vs nominal baseline</span>
            </div>
          </div>

          {/* Pillar 2: SLA Health */}
          <div className="space-y-2 p-5 rounded-2xl bg-[#08111D] border border-white/[0.06]">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block font-mono">
              SLA HEALTH
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-black text-teal-300 font-mono tracking-tight">
                {overview.slaPercent}%
              </span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-white/[0.06] text-xs">
              <span className="text-slate-400">P95: <strong className="text-white font-mono">{overview.p95LatencyMs} ms</strong></span>
              <span className="text-teal-400 font-bold font-mono">TARGET ≤ 2.0s</span>
            </div>
          </div>

          {/* Pillar 3: Business Impact */}
          <div className={`space-y-2 p-5 rounded-2xl border ${
            overview.activeIncidentsCount > 0
              ? 'bg-rose-950/20 border-rose-900/60'
              : 'bg-[#08111D] border-white/[0.06]'
          }`}>
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block font-mono">
              BUSINESS IMPACT
            </span>
            <div className="flex items-baseline gap-2">
              <span className={`text-4xl sm:text-5xl font-black font-mono tracking-tight ${
                overview.activeIncidentsCount > 0 ? 'text-rose-400' : 'text-emerald-400'
              }`}>
                {overview.activeIncidentsCount > 0 ? `${overview.activeIncidentsCount} ACTIVE` : 'NONE'}
              </span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-white/[0.06] text-xs">
              <span className="text-slate-400">
                {overview.activeIncidentsCount > 0 ? 'SLA breach detected' : '0 critical risks detected'}
              </span>
              <span className={`font-mono font-bold ${overview.activeIncidentsCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {overview.activeIncidentsCount > 0 ? 'HIGH SEVERITY' : 'PROTECTED'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* LEVEL 2: ATTENTION FIRST BANNER */}
      {primaryIncident ? (
        <div className="bg-[#101B2A] border border-rose-900/80 rounded-3xl p-6 sm:p-7 space-y-4 shadow-lg">
          <div className="flex items-center justify-between border-b border-rose-900/40 pb-3">
            <div className="flex items-center gap-3">
              <span className="w-3.5 h-3.5 rounded-full bg-rose-500 animate-pulse shadow-sm shadow-rose-500" />
              <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                🔴 ATTENTION REQUIRED: {primaryIncident.title}
              </h2>
            </div>
            <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
              {primaryIncident.severity}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <div className="bg-[#08111D] p-4 rounded-xl border border-white/[0.06] space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-mono">1. WHAT HAPPENED</span>
              <p className="text-slate-200 font-medium">{primaryIncident.title}</p>
              <span className="text-[11px] text-rose-400 font-mono block pt-1">Affected: {primaryIncident.affectedRequestsCount} txns</span>
            </div>
            <div className="bg-[#08111D] p-4 rounded-xl border border-white/[0.06] space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-mono">2. WHERE</span>
              <p className="text-slate-200 font-medium">{primaryIncident.primaryComponent}</p>
              <span className="text-[11px] text-amber-400 font-mono block pt-1">Service: {primaryIncident.businessService}</span>
            </div>
            <div className="bg-[#08111D] p-4 rounded-xl border border-white/[0.06] space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-mono">3. WHY</span>
              <p className="text-slate-200 font-medium">{primaryIncident.rca?.summary || 'Connection saturation.'}</p>
              <span className="text-[11px] text-teal-400 font-mono block pt-1">Confidence: {primaryIncident.rca?.confidencePercent || 92}%</span>
            </div>
            <div className="bg-[#08111D] p-4 rounded-xl border border-white/[0.06] flex flex-col justify-between space-y-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-mono">4. ACTION</span>
              <button
                onClick={() => onInvestigateIncident(primaryIncident)}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all font-mono"
              >
                Investigate Causal Chain →
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-[#0B1422] border border-emerald-500/30 rounded-3xl p-6 sm:p-7 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-xl font-bold">
                ✓
              </div>
              <div>
                <div className="text-base sm:text-lg font-bold text-white tracking-wide flex items-center gap-2.5">
                  <span>EVERYTHING IS OPERATING NORMALLY</span>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                    NOMINAL
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  VITALIS has analyzed <strong className="text-white font-mono">{overview.totalRequestsCount}</strong> transactions across {overview.environment}. Zero business-impacting anomalies detected.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono text-slate-400 bg-[#08111D] px-4 py-2 rounded-xl border border-white/[0.06] self-start sm:self-auto">
              <span>SLA: <strong className="text-emerald-400">{overview.slaPercent}%</strong></span>
              <span>•</span>
              <span>Risks: <strong className="text-slate-200">0 Critical</strong></span>
            </div>
          </div>
        </div>
      )}

      {/* LEVEL 3: SIGNATURE REQUEST & PERFORMANCE JOURNEY */}
      <div className="bg-[#0B1422] border border-white/[0.08] rounded-3xl p-6 sm:p-8 space-y-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.06] pb-4">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block font-mono">
              LEVEL 3 · DISTRIBUTED EXECUTION
            </span>
            <h3 className="text-lg font-bold text-white tracking-tight mt-0.5">
              Live Request &amp; Performance Journey
            </h3>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
            <span>Total Duration: <strong className="text-amber-300 font-bold">25 ms</strong></span>
            <span>•</span>
            <span className="text-emerald-400 font-semibold">100% SUCCESS RATE</span>
          </div>
        </div>

        {/* Horizontal Hop Visualizer */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3.5 pt-2">
          {[
            { name: 'Browser Client', kind: 'CLIENT', time: '8 ms', pct: '32%', status: 'HEALTHY' },
            { name: 'NestJS Gateway', kind: 'GATEWAY', time: '3 ms', pct: '12%', status: 'HEALTHY' },
            { name: 'HTTP Controller', kind: 'CONTROLLER', time: '7 ms', pct: '28%', status: 'HEALTHY' },
            { name: 'Prisma / Postgres', kind: 'DATABASE', time: '4 ms', pct: '16%', status: 'HEALTHY' },
            { name: 'Storage Provider', kind: 'STORAGE', time: '2 ms', pct: '8%', status: 'HEALTHY' },
            { name: 'Client Response', kind: 'DOWNSTREAM', time: '1 ms', pct: '4%', status: 'HEALTHY' },
          ].map((hop, i) => (
            <div
              key={i}
              onClick={() => onSelectSubsystem({ name: hop.name, tier: hop.kind, score: 98, status: 'HEALTHY' })}
              className="p-4 rounded-2xl bg-[#08111D] border border-white/[0.06] hover:border-teal-500/40 cursor-pointer space-y-2.5 transition-all shadow-sm"
            >
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-500 text-[10px]">Hop #{i + 1}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              </div>
              <div>
                <span className="font-bold text-white text-xs block truncate">{hop.name}</span>
                <span className="text-[10px] text-teal-400 font-mono block mt-0.5">{hop.kind}</span>
              </div>
              <div className="space-y-1 pt-1">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-slate-400">Duration</span>
                  <span className="text-amber-300 font-bold">{hop.time}</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div style={{ width: hop.pct }} className="h-full bg-teal-400 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* LEVEL 4: SUBSYSTEM HEALTH & LIVE INTELLIGENCE FEED */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Subsystem Health */}
        <div className="lg:col-span-6 bg-[#0B1422] border border-white/[0.08] rounded-3xl p-6 space-y-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Subsystem Health</h3>
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest font-mono block mt-0.5">
                  CLICK SUBSYSTEM TO INSPECT TELEMETRY
                </span>
              </div>
              <span className="text-xs text-emerald-400 font-mono font-semibold">5 Active</span>
            </div>

            <div className="divide-y divide-white/[0.04] text-xs mt-2">
              {overview.subsystemHealthMatrix.map((sub, i) => (
                <div
                  key={i}
                  onClick={() => onSelectSubsystem(sub)}
                  className="py-3 px-2 flex items-center justify-between hover:bg-white/[0.04] rounded-xl cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full ${
                      sub.status === 'HEALTHY' ? 'bg-emerald-400' : 'bg-slate-600'
                    }`} />
                    <span className="text-slate-200 font-semibold text-xs">{sub.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono">({sub.tier})</span>
                  </div>

                  <div className="flex items-center gap-4 font-mono">
                    <span className="text-slate-200 font-bold">{sub.score > 0 ? `${sub.score}%` : '—'}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      {sub.status === 'UNKNOWN' ? 'NO SIGNAL' : sub.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-500">
            <span>Collectors: Prisma, LocalStorage, Heap</span>
            <span className="text-teal-400 font-semibold cursor-pointer hover:underline">View Topology →</span>
          </div>
        </div>

        {/* Right: Live Intelligence Feed */}
        <div className="lg:col-span-6 bg-[#0B1422] border border-white/[0.08] rounded-3xl p-6 space-y-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Live Intelligence Observations</h3>
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest font-mono block mt-0.5">
                  MULTI-SOURCE CAUSAL STREAM
                </span>
              </div>
              <button
                onClick={onViewAllRequests}
                className="text-xs text-teal-400 hover:text-teal-300 font-semibold flex items-center gap-1"
              >
                <span>Live Stream</span>
                <span>→</span>
              </button>
            </div>

            <div className="space-y-3 mt-3 max-h-64 overflow-y-auto">
              {overview.liveObservations.map((obs, i) => (
                <div key={i} className="p-3.5 rounded-2xl bg-[#08111D] border border-white/[0.06] flex items-start justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span className="font-bold text-white">{obs.component}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{obs.time}</span>
                    </div>
                    <p className="text-slate-300 text-xs pl-4">{obs.message}</p>
                  </div>
                  <span className="text-[10px] font-mono text-teal-300 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20 shrink-0">
                    EVIDENCE
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-500">
            <span>Correlation Confidence: <strong className="text-emerald-400 font-mono">96% HIGH</strong></span>
            <span>Baseline: <strong className="text-white font-mono">STABLE</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};
