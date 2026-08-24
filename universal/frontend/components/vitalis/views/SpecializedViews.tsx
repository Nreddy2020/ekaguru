'use client';

import React from 'react';
import { VitalisCard, VitalisPanel } from '../ui/VitalisCard';
import { VitalisStatusPill } from '../ui/VitalisBadge';
import { VitalisConfidenceIndicator, VitalisTimeline } from '../ui/VitalisTimeline';

// 1. Topology & Dependencies View
export const TopologyView: React.FC = () => {
  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      <VitalisCard>
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 mb-4">
          <div>
            <h2 className="text-base font-bold text-white">⌘ Topology &amp; Service Dependency Map</h2>
            <p className="text-xs text-slate-400 mt-0.5">Real-time discovered architecture and failure propagation paths.</p>
          </div>
          <span className="text-xs font-mono text-emerald-400 font-bold">5 Active Nodes</span>
        </div>

        {/* Visual Map */}
        <div className="p-8 bg-[#050a12] rounded-xl border border-white/[0.06] flex flex-col items-center space-y-6">
          <div className="p-3.5 rounded-xl bg-[#0b1422] border border-teal-500/40 text-center w-56 shadow-md">
            <span className="text-[10px] text-teal-400 font-mono block">FRONTEND</span>
            <span className="font-bold text-white text-sm">Browser / Client</span>
            <span className="text-xs text-emerald-400 block font-mono mt-1">● 99% SLA</span>
          </div>

          <span className="text-teal-400 font-mono text-sm">↓ (12 req/s)</span>

          <div className="p-3.5 rounded-xl bg-[#0b1422] border border-white/[0.1] text-center w-64 shadow-md">
            <span className="text-[10px] text-teal-400 font-mono block">APPLICATION</span>
            <span className="font-bold text-white text-sm">NestJS Backend Core</span>
            <span className="text-xs text-emerald-400 block font-mono mt-1">● 98% Health (45ms)</span>
          </div>

          <span className="text-teal-400 font-mono text-sm">↙ &emsp; ↓ &emsp; ↘</span>

          <div className="grid grid-cols-3 gap-4 w-full max-w-2xl">
            <div className="p-3.5 rounded-xl bg-[#0b1422] border border-white/[0.08] text-center">
              <span className="text-[10px] text-teal-400 font-mono block">DATA</span>
              <span className="font-bold text-white text-xs">PostgreSQL (Prisma)</span>
              <span className="text-[11px] text-emerald-400 font-mono block mt-1">● 96% (14ms)</span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#0b1422] border border-white/[0.08] text-center">
              <span className="text-[10px] text-teal-400 font-mono block">STORAGE</span>
              <span className="font-bold text-white text-xs">LocalStorageProvider</span>
              <span className="text-[11px] text-emerald-400 font-mono block mt-1">● 95% (6ms)</span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#0b1422] border border-white/[0.08] text-center">
              <span className="text-[10px] text-teal-400 font-mono block">COGNITIVE</span>
              <span className="font-bold text-white text-xs">M2 Intelligence Engine</span>
              <span className="text-[11px] text-emerald-400 font-mono block mt-1">● 94% (820ms)</span>
            </div>
          </div>
        </div>
      </VitalisCard>
    </div>
  );
};

// 2. Performance Intelligence View
export const PerformanceView: React.FC = () => {
  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      <div className="grid grid-cols-4 gap-3">
        <VitalisPanel><span className="text-slate-400 text-xs block">P50 Latency</span><span className="text-2xl font-bold text-white font-mono mt-1 block">8 ms</span></VitalisPanel>
        <VitalisPanel><span className="text-slate-400 text-xs block">P95 Latency</span><span className="text-2xl font-bold text-teal-300 font-mono mt-1 block">25 ms</span></VitalisPanel>
        <VitalisPanel><span className="text-slate-400 text-xs block">P99 Latency</span><span className="text-2xl font-bold text-amber-300 font-mono mt-1 block">42 ms</span></VitalisPanel>
        <VitalisPanel><span className="text-slate-400 text-xs block">Throughput</span><span className="text-2xl font-bold text-emerald-400 font-mono mt-1 block">428 req/s</span></VitalisPanel>
      </div>

      <VitalisCard>
        <h3 className="font-bold text-white text-sm mb-2">Execution Breakdown by Tier</h3>
        <div className="space-y-3 font-mono text-xs">
          <div><div className="flex justify-between text-slate-300 mb-1"><span>HTTP Controller</span><span>32% (8ms)</span></div><div className="h-2 bg-slate-800 rounded-full overflow-hidden"><div style={{ width: '32%' }} className="h-full bg-teal-400" /></div></div>
          <div><div className="flex justify-between text-slate-300 mb-1"><span>Prisma PostgreSQL</span><span>28% (7ms)</span></div><div className="h-2 bg-slate-800 rounded-full overflow-hidden"><div style={{ width: '28%' }} className="h-full bg-emerald-400" /></div></div>
          <div><div className="flex justify-between text-slate-300 mb-1"><span>Storage IO</span><span>16% (4ms)</span></div><div className="h-2 bg-slate-800 rounded-full overflow-hidden"><div style={{ width: '16%' }} className="h-full bg-amber-400" /></div></div>
        </div>
      </VitalisCard>
    </div>
  );
};

// 3. Business Impact View
export const BusinessImpactView: React.FC = () => {
  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      <div className="grid grid-cols-4 gap-3">
        <VitalisPanel><span className="text-slate-400 text-xs block">Impacted Users</span><span className="text-2xl font-bold text-white font-mono mt-1 block">0</span></VitalisPanel>
        <VitalisPanel><span className="text-slate-400 text-xs block">Failed Txns</span><span className="text-2xl font-bold text-emerald-400 font-mono mt-1 block">0</span></VitalisPanel>
        <VitalisPanel><span className="text-slate-400 text-xs block">Revenue Risk</span><span className="text-2xl font-bold text-white font-mono mt-1 block">₹0.00</span></VitalisPanel>
        <VitalisPanel><span className="text-slate-400 text-xs block">SLA Compliance</span><span className="text-2xl font-bold text-teal-300 font-mono mt-1 block">100%</span></VitalisPanel>
      </div>

      <VitalisCard>
        <h3 className="font-bold text-white text-sm mb-2">Business Service Risk Assessment</h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          Zero SLA violations detected across Learning Library, Identity Auth, and Cognitive Ingestion services.
        </p>
      </VitalisCard>
    </div>
  );
};

// 4. Change Intelligence View
export const ChangeIntelligenceView: React.FC = () => {
  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      <VitalisCard>
        <h2 className="text-base font-bold text-white mb-1">⇄ Change Intelligence &amp; Correlation Timeline</h2>
        <p className="text-xs text-slate-400 mb-4">Correlate configuration diffs, schema updates, and deployments with latency changes.</p>
        <VitalisTimeline
          events={[
            {
              time: '01:05:00',
              title: 'Prisma Telemetry Middleware Deployed',
              description: 'Activated automatic database span collection across all Learner and Content models.',
              type: 'CHANGE',
              source: 'PRISMA_MIDDLEWARE',
            },
            {
              time: '01:02:00',
              title: 'Observe Traffic Filtering Activated',
              description: 'Separated internal dashboard polling from application requests.',
              type: 'ACTION',
              source: 'OBSERVE_CORE',
            },
          ]}
        />
      </VitalisCard>
    </div>
  );
};

// 5. Evidence & RCA View
export const EvidenceRcaView: React.FC = () => {
  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      <VitalisCard>
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 mb-4">
          <div>
            <h2 className="text-base font-bold text-white">◉ Root-Cause Intelligence &amp; Evidence Graph</h2>
            <p className="text-xs text-slate-400 mt-0.5">Automated causal diagnosis from multi-source correlated telemetry.</p>
          </div>
          <VitalisConfidenceIndicator percent={96} />
        </div>

        <div className="p-4 bg-[#050a12] rounded-xl border border-teal-500/30 space-y-2">
          <div className="text-xs font-bold text-teal-300 uppercase tracking-wide">Nominal Runtime State</div>
          <p className="text-xs text-slate-300 leading-relaxed">
            All 428 recorded requests executed with zero root-cause failures. Database connection pool, heap memory, and storage I/O are operating within nominal thresholds.
          </p>
        </div>
      </VitalisCard>
    </div>
  );
};

// 6. Predictive Risk View
export const PredictiveRiskView: React.FC = () => {
  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      <VitalisCard>
        <h2 className="text-base font-bold text-white mb-1">◇ Predictive Risk &amp; Early Warning Radar</h2>
        <p className="text-xs text-slate-400 mb-4">Forecast resource saturation and SLA degradation before outages occur.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
          <VitalisPanel><span className="text-slate-400 block text-[10px]">HEAP SATURATION</span><span className="text-emerald-400 font-bold">Stable (72% utilized)</span><span className="text-slate-500 text-[10px] block mt-1">Runway: &gt; 48 hours</span></VitalisPanel>
          <VitalisPanel><span className="text-slate-400 block text-[10px]">DB CONNECTION POOL</span><span className="text-emerald-400 font-bold">Low Load (8 / 20)</span><span className="text-slate-500 text-[10px] block mt-1">Saturation Risk: LOW</span></VitalisPanel>
          <VitalisPanel><span className="text-slate-400 block text-[10px]">STORAGE CAPACITY</span><span className="text-emerald-400 font-bold">64% Capacity</span><span className="text-slate-500 text-[10px] block mt-1">Runway: 120 days</span></VitalisPanel>
        </div>
      </VitalisCard>
    </div>
  );
};

// 7. What-If Simulation View
export const WhatIfView: React.FC = () => {
  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      <VitalisCard>
        <h2 className="text-base font-bold text-white mb-1">✦ What-If Failure Injection &amp; Blast Radius Simulator</h2>
        <p className="text-xs text-slate-400 mb-4">Simulate component degradation and calculate projected business risk.</p>
        <div className="p-4 bg-[#050a12] rounded-xl border border-white/[0.06] space-y-3 font-mono text-xs">
          <div className="flex gap-2">
            {['PostgreSQL Outage', 'Storage Degraded', 'M2 Engine Timeout'].map((sc, i) => (
              <button key={i} className="px-3 py-1.5 rounded-lg bg-[#0b1422] border border-white/[0.1] text-slate-300 hover:text-white hover:border-teal-500">
                {sc}
              </button>
            ))}
          </div>
          <p className="text-slate-400 text-xs font-sans">
            Select a failure scenario above to calculate propagation paths, affected services, and recovery runbooks.
          </p>
        </div>
      </VitalisCard>
    </div>
  );
};

// 8. Continuous Learning View
export const ContinuousLearningView: React.FC = () => {
  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      <VitalisCard>
        <h2 className="text-base font-bold text-white mb-1">◎ Continuous Learning &amp; Prevention Memory</h2>
        <p className="text-xs text-slate-400 mb-4">Organizational intelligence linking past incidents to validated prevention rules.</p>
        <div className="p-4 bg-[#08111d] rounded-xl border border-white/[0.06] space-y-2 font-mono text-xs">
          <div className="flex justify-between text-teal-300 font-bold">
            <span>KA-EKAGURU-PRISMA-001</span>
            <span>Applied 12 times</span>
          </div>
          <p className="text-slate-300 font-sans text-xs">
            Automatic child span nesting with AsyncLocalStorage context ensures asynchronous queries never lose trace correlation.
          </p>
        </div>
      </VitalisCard>
    </div>
  );
};
