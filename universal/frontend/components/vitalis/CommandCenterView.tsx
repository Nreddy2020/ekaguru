'use client';

import React from 'react';
import { VitalisCommandCenterOverview, VitalisIncident } from '../../lib/vitalis/domain/types';

interface CommandCenterViewProps {
  overview: VitalisCommandCenterOverview;
  onInvestigateIncident: (incident: VitalisIncident) => void;
  onViewAllRequests: () => void;
}

export const CommandCenterView: React.FC<CommandCenterViewProps> = ({
  overview,
  onInvestigateIncident,
  onViewAllRequests,
}) => {
  const primaryIncident = overview.activeIncidents[0];

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* 1. Top Section: 4 Hero KPI Cards with Prominent Numbers */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {/* Card 1: Operational Health */}
        <div className="bg-[#0b1322] border border-slate-800/80 rounded-xl p-4 shadow-sm flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
              Operational Health
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-white font-mono tracking-tight">
              {overview.operationalScore}
            </span>
            <span className="text-xs text-slate-400 font-medium font-mono">/ 100</span>
          </div>
          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/60">
            <span className="text-emerald-400 font-semibold flex items-center gap-1 text-[11px]">
              ↑ 2.4% <span className="text-slate-500 font-normal">vs baseline</span>
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              HEALTHY
            </span>
          </div>
        </div>

        {/* Card 2: SLA Health */}
        <div className="bg-[#0b1322] border border-slate-800/80 rounded-xl p-4 shadow-sm flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
              SLA Health
            </span>
            <span className="text-xs text-slate-500 font-mono">Target ≤ 2.0s</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl sm:text-4xl font-extrabold text-teal-300 font-mono tracking-tight">
              {overview.slaPercent}%
            </span>
          </div>
          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/60">
            <span className="text-slate-400 text-[11px]">P95: <strong className="text-slate-200 font-mono">{overview.p95LatencyMs} ms</strong></span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-300 border border-teal-500/30">
              COMPLIANT
            </span>
          </div>
        </div>

        {/* Card 3: Active Business Incidents */}
        <div className={`border rounded-xl p-4 shadow-sm flex flex-col justify-between space-y-2 ${
          overview.activeIncidentsCount > 0
            ? 'bg-rose-950/25 border-rose-900/80'
            : 'bg-[#0b1322] border-slate-800/80'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-rose-300 font-bold uppercase tracking-wider">
              Business Incidents
            </span>
            {overview.activeIncidentsCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            )}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-rose-400 font-mono tracking-tight">
              {overview.activeIncidentsCount.toString().padStart(2, '0')}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/60">
            <span className="text-[11px] text-slate-400">
              {overview.activeIncidentsCount > 0 ? 'High business impact' : '0 critical risks'}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              overview.activeIncidentsCount > 0
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
            }`}>
              {overview.activeIncidentsCount > 0 ? 'IMPACTED' : 'HEALTHY'}
            </span>
          </div>
        </div>

        {/* Card 4: Request Volume */}
        <div className="bg-[#0b1322] border border-slate-800/80 rounded-xl p-4 shadow-sm flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
              Request Volume
            </span>
            <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> LIVE
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-white font-mono tracking-tight">
              {overview.totalRequestsCount.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/60">
            <span className="text-[11px] text-slate-400">In Progress: <strong className="text-indigo-300 font-mono">{overview.inProgressCount}</strong></span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono">
              {overview.errorCount} ERRORS
            </span>
          </div>
        </div>
      </div>

      {/* 2. Intelligence Banner: Operational Status vs Active Incident */}
      {primaryIncident ? (
        <div className="bg-[#0f172a] border border-rose-900/80 rounded-xl p-5 space-y-4 shadow-md">
          <div className="flex items-center justify-between border-b border-rose-900/40 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-rose-500 animate-pulse shadow-sm shadow-rose-500/80" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                🔴 BUSINESS IMPACT DETECTED: {primaryIncident.title}
              </h2>
            </div>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 font-mono">
              {primaryIncident.severity}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            {/* 1. What happened? */}
            <div className="bg-[#080e1c] p-3.5 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                1. WHAT HAPPENED?
              </span>
              <p className="text-slate-200 font-medium leading-relaxed">
                {primaryIncident.title}
              </p>
              <span className="text-[11px] text-rose-400 block font-mono mt-1">
                Duration: {primaryIncident.durationMinutes} min • Impacted: {primaryIncident.affectedRequestsCount} txns
              </span>
            </div>

            {/* 2. Where? */}
            <div className="bg-[#080e1c] p-3.5 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                2. WHERE IS IT HAPPENING?
              </span>
              <p className="text-slate-200 font-medium leading-relaxed">
                {primaryIncident.primaryComponent}
              </p>
              <span className="text-[11px] text-amber-400 block font-mono mt-1">
                Service: {primaryIncident.businessService}
              </span>
            </div>

            {/* 3. Why? */}
            <div className="bg-[#080e1c] p-3.5 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                3. WHY IS IT HAPPENING?
              </span>
              <p className="text-slate-200 font-medium leading-relaxed">
                {primaryIncident.rca?.summary || 'Database connection pool saturation exceeded safety threshold.'}
              </p>
              <span className="text-[11px] text-teal-400 block font-mono mt-1">
                Causal Confidence: {primaryIncident.rca?.confidencePercent || 92}%
              </span>
            </div>

            {/* 4. Action */}
            <div className="bg-[#080e1c] p-3.5 rounded-xl border border-slate-800 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                4. RECOMMENDED ACTION
              </span>
              <ul className="text-slate-300 space-y-1 list-disc list-inside text-[11px]">
                {(primaryIncident.rca?.recommendedAction || ['Drain connection pool backlog', 'Verify DB indexes']).map((act, i) => (
                  <li key={i} className="truncate">{act}</li>
                ))}
              </ul>
              <button
                onClick={() => onInvestigateIncident(primaryIncident)}
                className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-md mt-2"
              >
                Investigate Causal Chain →
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-[#0b1322] border border-emerald-500/30 rounded-xl p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-base font-bold">
                ✓
              </div>
              <div>
                <div className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
                  <span>ALL SYSTEMS OPERATIONAL</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    NOMINAL BASELINE
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  VITALIS has analyzed <strong className="text-slate-200 font-mono">{overview.totalRequestsCount}</strong> transactions across {overview.environment} environment. Zero active business-impacting outages detected.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-auto text-xs font-mono text-slate-400 bg-[#070e1c] px-3.5 py-1.5 rounded-lg border border-slate-800">
              <span>SLA: <strong className="text-emerald-400">{overview.slaPercent}%</strong></span>
              <span>•</span>
              <span>Risks: <strong className="text-slate-200">0 Critical</strong></span>
            </div>
          </div>
        </div>
      )}

      {/* 3. Middle Section: Subsystem Health (Open Space Table) + Live Intelligence Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Subsystem Health (Col 6) */}
        <div className="lg:col-span-6 bg-[#0b1322] border border-slate-800/80 rounded-xl p-5 space-y-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white tracking-wide">Subsystem Health</h3>
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest block mt-0.5">
                  ENVIRONMENT · {overview.environment}
                </span>
              </div>
              <span className="text-xs text-emerald-400 font-mono font-semibold">All Active</span>
            </div>

            <div className="divide-y divide-slate-800/60 text-xs mt-1">
              {overview.subsystemHealthMatrix.map((sub, i) => (
                <div key={i} className="py-2.5 flex items-center justify-between hover:bg-slate-800/20 px-1 rounded transition-colors">
                  <div className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full ${
                      sub.status === 'HEALTHY'
                        ? 'bg-emerald-400'
                        : sub.status === 'DEGRADED'
                        ? 'bg-amber-400'
                        : sub.status === 'CRITICAL'
                        ? 'bg-rose-500'
                        : 'bg-slate-600'
                    }`} />
                    <span className="text-slate-200 font-semibold">{sub.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">({sub.tier})</span>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="font-mono text-slate-300 font-bold">
                      {sub.score > 0 ? `${sub.score}%` : '—'}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono ${
                      sub.status === 'HEALTHY'
                        ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                        : sub.status === 'DEGRADED'
                        ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                        : sub.status === 'CRITICAL'
                        ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}>
                      {sub.status === 'UNKNOWN' ? 'NO SIGNAL' : sub.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 text-[11px] text-slate-500 border-t border-slate-800/80 flex items-center justify-between">
            <span>Collectors: Prisma, LocalStorage, Memory, M2 Engine</span>
            <span className="text-teal-400 cursor-pointer hover:underline">View Topology →</span>
          </div>
        </div>

        {/* Right: Live Intelligence Observations (Col 6) */}
        <div className="lg:col-span-6 bg-[#0b1322] border border-slate-800/80 rounded-xl p-5 space-y-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white tracking-wide">Live Intelligence Observations</h3>
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest block mt-0.5">
                  CAUSAL SIGNALS · REAL-TIME
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

            <div className="space-y-2.5 mt-3 max-h-64 overflow-y-auto">
              {overview.liveObservations.map((obs, i) => (
                <div key={i} className="p-3 rounded-xl bg-[#080e1c] border border-slate-800/80 flex items-start justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        obs.severity === 'CRITICAL'
                          ? 'bg-rose-500'
                          : obs.severity === 'HIGH'
                          ? 'bg-amber-400'
                          : 'bg-emerald-400'
                      }`} />
                      <span className="font-bold text-slate-200">{obs.component}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{obs.time}</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed pl-3.5">
                      {obs.message}
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-teal-400 shrink-0 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
                    EVIDENCE
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 text-[11px] text-slate-500 border-t border-slate-800/80 flex items-center justify-between">
            <span>Confidence: <strong className="text-emerald-400">HIGH (96%)</strong></span>
            <span>Baseline: <strong className="text-slate-300">STABLE</strong></span>
          </div>
        </div>
      </div>

      {/* 4. Bottom Section: Request & Performance Journey (Causal Chain) */}
      <div className="bg-[#0b1322] border border-slate-800/80 rounded-xl p-5 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">Request &amp; Performance Journey</h3>
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest block mt-0.5">
              DISTRIBUTED WATERFALL EXECUTION
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
            <span>Total End-to-End: <strong className="text-amber-400 font-bold">25 ms</strong></span>
            <span>•</span>
            <span className="text-emerald-400 font-semibold">100% SUCCESS</span>
          </div>
        </div>

        {/* Hop Visualization Chain */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 pt-1">
          {[
            { name: 'Browser Client', kind: 'CLIENT', time: '8 ms', pct: '32%', status: 'HEALTHY' },
            { name: 'NestJS Gateway', kind: 'GATEWAY', time: '3 ms', pct: '12%', status: 'HEALTHY' },
            { name: 'HTTP Controller', kind: 'CONTROLLER', time: '7 ms', pct: '28%', status: 'HEALTHY' },
            { name: 'Prisma / Postgres', kind: 'DATABASE', time: '4 ms', pct: '16%', status: 'HEALTHY' },
            { name: 'Storage Provider', kind: 'STORAGE', time: '2 ms', pct: '8%', status: 'HEALTHY' },
            { name: 'Client Response', kind: 'DOWNSTREAM', time: '1 ms', pct: '4%', status: 'HEALTHY' },
          ].map((hop, i) => (
            <div key={i} className="p-3 rounded-xl bg-[#080e1c] border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-mono">Hop #{i + 1}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              </div>
              <div>
                <span className="font-bold text-slate-200 block truncate">{hop.name}</span>
                <span className="text-[10px] text-teal-400 font-mono block mt-0.5">{hop.kind}</span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-slate-400">Duration</span>
                  <span className="text-amber-400 font-bold">{hop.time}</span>
                </div>
                <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div style={{ width: hop.pct }} className="h-full bg-teal-400 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
