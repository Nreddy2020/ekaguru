'use client';

import React, { useState } from 'react';
import { DEMO_ENTERPRISE_SCENARIOS } from '../../../lib/vitalis/providers/demo-provider';
import { VitalisScenario, VitalisCausalStep } from '../../../lib/vitalis/domain/types';
import { CausalEvidenceDrawer } from '../drawers/CausalEvidenceDrawer';

export const EvidenceRcaView: React.FC = () => {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('SCENARIO_6_LOCK_CONTENTION');
  const [selectedStep, setSelectedStep] = useState<VitalisCausalStep | null>(null);
  const [isEvidenceOpen, setIsEvidenceOpen] = useState(false);

  const scenario = DEMO_ENTERPRISE_SCENARIOS.find((s) => s.id === selectedScenarioId) || DEMO_ENTERPRISE_SCENARIOS[5];

  const handleOpenEvidence = (step: VitalisCausalStep) => {
    setSelectedStep(step);
    setIsEvidenceOpen(true);
  };

  return (
    <div className="space-y-5 max-w-6xl mx-auto pb-10 text-slate-200">
      {/* 1. Header & Scenario Switcher */}
      <div className="p-5 rounded-2xl bg-[#0B1526] border border-[#1a2d4c] space-y-3">
        <div className="flex items-center justify-between border-b border-[#1a2d4c] pb-2">
          <div>
            <span className="text-[10px] font-mono text-teal-400 font-bold block uppercase">
              VITALIS CAUSAL STORY ENGINE
            </span>
            <h1 className="text-lg font-bold text-white tracking-tight">
              Evidence &amp; Root Cause Analysis
            </h1>
          </div>
          <span className="text-xs font-mono font-bold text-amber-300">
            Confidence: {scenario.rca.confidencePercent}% HIGH
          </span>
        </div>

        {/* 6 Scenario Switcher Pills */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-mono text-slate-400 block">Select Scenario:</span>
          <div className="flex flex-wrap gap-2">
            {DEMO_ENTERPRISE_SCENARIOS.map((sc) => (
              <button
                key={sc.id}
                onClick={() => setSelectedScenarioId(sc.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold font-mono transition-all ${
                  selectedScenarioId === sc.id
                    ? 'bg-teal-500/25 text-teal-300 border border-teal-500/50 shadow-sm'
                    : 'bg-[#070E1B] text-slate-400 border border-[#14233c] hover:text-white'
                }`}
              >
                #{sc.scenarioNumber} {sc.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Causal Story Chain (Step by Step) */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
          Causal Propagation Chain (Why Did This Happen?)
        </h2>

        <div className="space-y-3">
          {scenario.causalStory.map((step, idx) => (
            <div
              key={step.id}
              onClick={() => handleOpenEvidence(step)}
              className="p-4 rounded-xl bg-[#0B1526] hover:bg-[#0e1b32] border border-[#1a2d4c] hover:border-teal-400/60 cursor-pointer shadow-sm transition-all group space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-[#14233c] text-teal-300">
                    STEP {step.stepNumber}
                  </span>
                  <span className="font-bold text-white text-xs sm:text-sm">{step.nodeName}</span>
                  <span className="text-[10px] font-mono text-teal-400">({step.tier})</span>
                </div>
                <span className="text-xs text-teal-400 font-mono font-bold group-hover:underline">
                  View Evidence →
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-[#070E1B] border border-[#14233c]">
                  <span className="text-[10px] text-slate-400 block font-mono">CHANGE / SIGNAL</span>
                  <span className="font-bold text-amber-300 font-mono mt-0.5 block">{step.changeOrSignal}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#070E1B] border border-[#14233c]">
                  <span className="text-[10px] text-slate-400 block font-mono">OBSERVED EFFECT</span>
                  <span className="text-slate-200 mt-0.5 block">{step.observedEffect}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Root Cause Conclusion & Action Card */}
      <div className="p-5 rounded-2xl bg-indigo-950/30 border border-indigo-700/60 space-y-3">
        <span className="text-xs font-mono text-indigo-300 font-bold uppercase tracking-wider block">
          ROOT CAUSE CONCLUSION
        </span>
        <h3 className="text-base font-bold text-white">
          {scenario.rca.summary}
        </h3>
        <div className="p-3 rounded-xl bg-[#070E1B] border border-[#14233c] text-xs font-mono text-emerald-400">
          <strong>Recommended Remediation:</strong> {scenario.rca.recommendedAction}
        </div>
      </div>

      {/* Floating Evidence Sheet */}
      <CausalEvidenceDrawer
        step={selectedStep}
        isOpen={isEvidenceOpen}
        onClose={() => setIsEvidenceOpen(false)}
      />
    </div>
  );
};

export const TopologyView: React.FC = () => (
  <div className="p-6 rounded-2xl bg-[#0B1526] border border-[#1a2d4c] text-slate-200 space-y-4 max-w-5xl mx-auto">
    <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
      Enterprise Topology Map
    </h2>
    <p className="text-xs text-slate-300">
      Live distributed service dependency graph connecting Client ➔ Gateway ➔ WebSphere ➔ MQ ➔ PostgreSQL/DB2.
    </p>
  </div>
);

export const PerformanceView: React.FC = () => (
  <div className="p-6 rounded-2xl bg-[#0B1526] border border-[#1a2d4c] text-slate-200 space-y-4 max-w-5xl mx-auto">
    <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
      Subsystem Performance Analytics
    </h2>
    <p className="text-xs text-slate-300">
      Real-time latency percentiles, throughput rates, and database query profiling across all tiers.
    </p>
  </div>
);

export const BusinessImpactView: React.FC = () => (
  <div className="p-6 rounded-2xl bg-[#0B1526] border border-[#1a2d4c] text-slate-200 space-y-4 max-w-5xl mx-auto">
    <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
      Business Impact &amp; SLA Compliance
    </h2>
    <p className="text-xs text-slate-300">
      Conversion funnel risk, monitored user sessions, and estimated financial exposure calculations.
    </p>
  </div>
);

export const ChangeIntelligenceView: React.FC = () => (
  <div className="p-6 rounded-2xl bg-[#0B1526] border border-[#1a2d4c] text-slate-200 space-y-4 max-w-5xl mx-auto">
    <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
      Change Timeline &amp; Configuration Diffs
    </h2>
    <p className="text-xs text-slate-300">
      Chronological audit trail of deployments, parameter alterations, and environment configuration changes.
    </p>
  </div>
);

export const PredictiveRiskView: React.FC = () => (
  <div className="p-6 rounded-2xl bg-[#0B1526] border border-[#1a2d4c] text-slate-200 space-y-4 max-w-5xl mx-auto">
    <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
      Predictive Risk &amp; Anomaly Detection
    </h2>
    <p className="text-xs text-slate-300">
      Early-warning horizon forecasts for thread pool saturation, memory exhaust, and certificate expiry.
    </p>
  </div>
);

export const WhatIfView: React.FC = () => (
  <div className="p-6 rounded-2xl bg-[#0B1526] border border-[#1a2d4c] text-slate-200 space-y-4 max-w-5xl mx-auto">
    <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
      What-If Simulation Engine
    </h2>
    <p className="text-xs text-slate-300">
      Simulate configuration modifications and traffic surges before deploying changes to production.
    </p>
  </div>
);

export const ContinuousLearningView: React.FC = () => (
  <div className="p-6 rounded-2xl bg-[#0B1526] border border-[#1a2d4c] text-slate-200 space-y-4 max-w-5xl mx-auto">
    <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
      Continuous Organizational Learning
    </h2>
    <p className="text-xs text-slate-300">
      Memory index capturing historical incident patterns, verified root causes, and runbook remediation efficacy.
    </p>
  </div>
);
