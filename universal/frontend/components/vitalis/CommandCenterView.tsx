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
    <div className="space-y-4">
      {/* 1. Top KPI Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Operational Health */}
        <div className="bg-[#0c1424] border border-slate-800/80 rounded-xl p-4 shadow-sm">
          <span className="text-xs text-slate-400 block font-medium">Operational Score</span>
          <div className="text-3xl font-bold text-white mt-1 font-mono flex items-center gap-2">
            <span>{overview.operationalScore}</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              / 100
            </span>
          </div>
          <span className="text-[11px] text-emerald-400 mt-1 block">
            ↑ Nominal Subsystem Health
          </span>
        </div>

        {/* SLA Compliance */}
        <div className="bg-[#0c1424] border border-slate-800/80 rounded-xl p-4 shadow-sm">
          <span className="text-xs text-slate-400 block font-medium">SLA Compliance</span>
          <div className="text-3xl font-bold text-teal-400 mt-1 font-mono">
            {overview.slaPercent}%
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Target: 99.0%
          </span>
        </div>

        {/* Active Incidents */}
        <div className={`border rounded-xl p-4 shadow-sm ${
          overview.activeIncidentsCount > 0
            ? 'bg-rose-950/20 border-rose-900/80'
            : 'bg-[#0c1424] border-slate-800/80'
        }`}>
          <span className="text-xs text-rose-300 block font-medium">Active Incidents</span>
          <div className="text-3xl font-bold text-rose-400 mt-1 font-mono">
            {overview.activeIncidentsCount}
          </div>
          <span className="text-[11px] text-rose-400 mt-1 block">
            {overview.activeIncidentsCount > 0 ? 'Requires immediate action' : 'Zero active outages'}
          </span>
        </div>

        {/* Total Volume */}
        <div className="bg-[#0c1424] border border-slate-800/80 rounded-xl p-4 shadow-sm">
          <span className="text-xs text-slate-400 block font-medium">Total Requests</span>
          <div className="text-3xl font-bold text-white mt-1 font-mono">
            {overview.totalRequestsCount.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            P95: {overview.p95LatencyMs} ms
          </span>
        </div>
      </div>

      {/* 2. Primary Active Incident Card (Progressive 4-Question Framework) */}
      {primaryIncident ? (
        <div className="bg-[#0e1422] border border-rose-900/80 rounded-xl p-5 space-y-4 shadow-md">
          <div className="flex items-center justify-between border-b border-rose-900/40 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                ACTIVE INCIDENT: {primaryIncident.title}
              </h2>
            </div>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 font-mono">
              {primaryIncident.severity}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            {/* Q1: WHAT happened? */}
            <div className="bg-[#080d1a] p-3.5 rounded-lg border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                1. WHAT HAPPENED?
              </span>
              <p className="text-slate-200 font-medium leading-relaxed">
                {primaryIncident.title}
              </p>
              <span className="text-[11px] text-rose-400 block font-mono mt-1">
                Duration: {primaryIncident.durationMinutes} min
              </span>
            </div>

            {/* Q2: WHERE is it happening? */}
            <div className="bg-[#080d1a] p-3.5 rounded-lg border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                2. WHERE IS IT HAPPENING?
              </span>
              <p className="text-slate-200 font-medium leading-relaxed">
                {primaryIncident.primaryComponent}
              </p>
              <span className="text-[11px] text-amber-400 block font-mono mt-1">
                Service: {primaryIncident.businessService}
              </span>
            </div>

            {/* Q3: WHY is it happening? */}
            <div className="bg-[#080d1a] p-3.5 rounded-lg border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                3. WHY IS IT HAPPENING?
              </span>
              <p className="text-slate-200 font-medium leading-relaxed">
                {primaryIncident.rca?.summary || 'Execution timeout in downstream database connection.'}
              </p>
              <span className="text-[11px] text-teal-400 block font-mono mt-1">
                Confidence: {primaryIncident.rca?.confidencePercent || 90}%
              </span>
            </div>

            {/* Q4: WHAT should I do? */}
            <div className="bg-[#080d1a] p-3.5 rounded-lg border border-slate-800 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                4. RECOMMENDED ACTION
              </span>
              <ul className="text-slate-300 space-y-1 list-disc list-inside text-[11px]">
                {(primaryIncident.rca?.recommendedAction || ['Inspect logs and slow query parameters']).map((act, i) => (
                  <li key={i} className="truncate">{act}</li>
                ))}
              </ul>
              <div className="pt-2 flex gap-2">
                <button
                  onClick={() => onInvestigateIncident(primaryIncident)}
                  className="w-full py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-sm"
                >
                  Investigate RCA
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-[#0c1424] border border-slate-800/80 rounded-xl p-6 text-center space-y-2 shadow-sm">
          <div className="text-2xl">🟢</div>
          <h3 className="text-base font-bold text-white">All Systems Operating Nominally</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Zero active incidents or subsystem degradations detected. Real-time telemetry is recording continuous SLA compliance.
          </p>
        </div>
      )}

      {/* 3. Subsystem Health Matrix & Live Observations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Subsystem Health Matrix (Col 7) */}
        <div className="lg:col-span-7 bg-[#0c1424] border border-slate-800/80 rounded-xl p-4 space-y-3 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 text-xs">
            <span className="font-bold text-white uppercase tracking-wider">Subsystem Health Matrix</span>
            <span className="text-slate-400">Environment: <strong className="text-teal-400">{overview.environment}</strong></span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {overview.subsystemHealthMatrix.map((sub, i) => (
              <div key={i} className="p-3 rounded-lg bg-[#080d1a] border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-200 font-semibold truncate">{sub.name}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                    sub.status === 'HEALTHY'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : sub.status === 'DEGRADED'
                      ? 'bg-amber-500/20 text-amber-300'
                      : sub.status === 'CRITICAL'
                      ? 'bg-rose-500/20 text-rose-300'
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    {sub.status}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  Tier: {sub.tier} • Score: {sub.score > 0 ? `${sub.score}%` : 'N/A'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Observations Feed (Col 5) */}
        <div className="lg:col-span-5 bg-[#0c1424] border border-slate-800/80 rounded-xl p-4 space-y-3 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 text-xs">
            <span className="font-bold text-white uppercase tracking-wider">Live Observations Feed</span>
            <button
              onClick={onViewAllRequests}
              className="text-teal-400 hover:text-teal-300 text-xs font-semibold"
            >
              View Requests →
            </button>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto text-xs">
            {overview.liveObservations.length === 0 ? (
              <div className="text-slate-500 text-center py-6">No observation events recorded.</div>
            ) : (
              overview.liveObservations.map((obs, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-[#080d1a] border border-slate-800 flex items-start gap-2.5">
                  <span className="text-slate-500 font-mono text-[11px] whitespace-nowrap mt-0.5">{obs.time}</span>
                  <div className="space-y-0.5">
                    <span className="text-slate-200 font-medium block leading-tight">{obs.message}</span>
                    <span className="text-[10px] text-slate-400 font-mono block">Component: {obs.component}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
