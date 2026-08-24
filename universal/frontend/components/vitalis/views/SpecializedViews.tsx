'use client';

import React, { useState } from 'react';
import { DEMO_ENTERPRISE_SCENARIOS } from '../../../lib/vitalis/providers/demo-provider';
import {
  VitalisScenario,
  VitalisCausalStep,
  VitalisTopologyNode,
  VitalisTopologyEdge,
  VitalisPredictiveRisk,
  VitalisWhatIfResult,
  VitalisKnowledgeArtifact,
  VitalisWhyItem,
} from '../../../lib/vitalis/domain/types';
import { CausalEvidenceDrawer } from '../drawers/CausalEvidenceDrawer';
import { WhyEngineDrawer } from '../drawers/WhyEngineDrawer';
import { TopologyNodeDrawer } from '../drawers/TopologyNodeDrawer';

// ============================================================================
// 1. Evidence & RCA View
// ============================================================================
export const EvidenceRcaView: React.FC = () => {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('SCENARIO_6_LOCK_CONTENTION');
  const [selectedStep, setSelectedStep] = useState<VitalisCausalStep | null>(null);
  const [isEvidenceOpen, setIsEvidenceOpen] = useState(false);
  const [isWhyOpen, setIsWhyOpen] = useState(false);

  const scenario = DEMO_ENTERPRISE_SCENARIOS.find((s) => s.id === selectedScenarioId) || DEMO_ENTERPRISE_SCENARIOS[5];

  const whyItem: VitalisWhyItem = {
    id: `why_${scenario.id}`,
    title: `Incident: ${scenario.name}`,
    what: scenario.description,
    where: scenario.rca.rootCauseNode,
    when: '09:12:43 IST',
    why: scenario.rca.summary,
    intelligenceState: 'EXPLAINED',
    provenance: 'SIMULATED',
    confidence: {
      totalPercent: scenario.rca.confidencePercent,
      rating: 'HIGH',
      factors: [
        { name: 'Configuration Change Audit', weightPoints: 25, description: 'Direct DB2 MAXLOCKS alteration record' },
        { name: 'Temporal Timestamp Alignment', weightPoints: 20, description: 'Events align within 120s of change' },
        { name: 'Lock Wait Metric Correlation', weightPoints: 20, description: 'Table X-Lock wait count jumped +847%' },
        { name: 'DB2 Query Latency Spike', weightPoints: 15, description: 'Database response increased 420ms -> 3.5s' },
        { name: 'WebSphere Thread Saturation', weightPoints: 7, description: 'Worker pool exceeded 92% utilization' },
        { name: 'MQ Queue Growth Cascade', weightPoints: 5, description: 'Queue depth climbed to 1,214' },
      ],
    },
    evidenceItems: scenario.causalStory.map((s) => ({
      title: s.evidenceTitle,
      type: s.evidenceType,
      snippet: s.evidenceSnippet,
      timestamp: s.timestamp,
    })),
    propagationChain: scenario.causalStory.map((s) => ({
      step: s.stepNumber,
      node: s.nodeName,
      effect: s.observedEffect,
    })),
    impact: {
      service: scenario.businessImpact.impactedService || 'PaymentGateway',
      usersAffected: scenario.businessImpact.monitoredUsers,
      failedTxns: scenario.businessImpact.failedTransactions,
      exposure: scenario.businessImpact.estimatedFinancialExposure,
    },
    recommendedAction: {
      title: scenario.rca.recommendedAction,
      runbookId: scenario.rca.runbookId || 'RB-DB2-042',
      risk: 'LOW',
      rollbackAvailable: true,
      approvalRequired: true,
    },
  };

  return (
    <div className="space-y-5 max-w-6xl mx-auto pb-10 text-slate-200">
      {/* Header & Scenario Switcher */}
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
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsWhyOpen(true)}
              className="px-3 py-1 rounded-lg bg-teal-500/20 text-teal-300 border border-teal-500/40 text-xs font-mono font-bold hover:bg-teal-500/30 transition-colors"
            >
              Universal Why? →
            </button>
            <span className="text-xs font-mono font-bold text-amber-300">
              Confidence: {scenario.rca.confidencePercent}% HIGH
            </span>
          </div>
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

      {/* Causal Propagation Chain */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
          Causal Propagation Chain (Why Did This Happen?)
        </h2>

        <div className="space-y-3">
          {scenario.causalStory.map((step) => (
            <div
              key={step.id}
              onClick={() => {
                setSelectedStep(step);
                setIsEvidenceOpen(true);
              }}
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

      {/* Root Cause Conclusion & Action Card */}
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

      {/* Drawers */}
      <CausalEvidenceDrawer
        step={selectedStep}
        isOpen={isEvidenceOpen}
        onClose={() => setIsEvidenceOpen(false)}
      />

      <WhyEngineDrawer
        item={whyItem}
        isOpen={isWhyOpen}
        onClose={() => setIsWhyOpen(false)}
      />
    </div>
  );
};

// ============================================================================
// 2. Topology Intelligence View
// ============================================================================
export const TopologyView: React.FC = () => {
  const [selectedNode, setSelectedNode] = useState<VitalisTopologyNode | null>(null);
  const [isNodeDrawerOpen, setIsNodeDrawerOpen] = useState(false);

  const nodes: VitalisTopologyNode[] = [
    {
      id: 'node_f5',
      name: 'F5 BIG-IP Load Balancer',
      tier: 'LOAD_BALANCER',
      healthScore: 98,
      p95LatencyMs: 3,
      errorRatePercent: 0,
      connectionsSaturationPercent: 42,
      riskLevel: 'NOMINAL',
      intelligenceState: 'NOMINAL',
      dependentServices: ['Payment Ingress', 'API Gateway'],
      inboundEdges: [],
      outboundEdges: ['node_ihs'],
    },
    {
      id: 'node_ihs',
      name: 'IBM HTTP Server (IHS)',
      tier: 'WEB_SERVER',
      healthScore: 96,
      p95LatencyMs: 4,
      errorRatePercent: 0,
      connectionsSaturationPercent: 54,
      riskLevel: 'NOMINAL',
      intelligenceState: 'NOMINAL',
      dependentServices: ['Edge Reverse Proxy'],
      inboundEdges: ['node_f5'],
      outboundEdges: ['node_websphere'],
    },
    {
      id: 'node_websphere',
      name: 'IBM WebSphere App Server',
      tier: 'APP_SERVER',
      healthScore: 48,
      p95LatencyMs: 2800,
      errorRatePercent: 12.4,
      connectionsSaturationPercent: 92,
      riskLevel: 'CRITICAL',
      intelligenceState: 'DEVIATING',
      dependentServices: ['Payment Core', 'Checkout Services'],
      recentChange: {
        timestamp: '09:10:00 IST',
        summary: 'Thread pool max limit adjusted to 100',
        diffSnippet: '<threadPool id="default" maxThreads="100" />',
      },
      inboundEdges: ['node_ihs'],
      outboundEdges: ['node_mq', 'node_db2'],
    },
    {
      id: 'node_mq',
      name: 'IBM MQ Message Queue',
      tier: 'MESSAGE_QUEUE',
      healthScore: 68,
      p95LatencyMs: 1400,
      errorRatePercent: 4.2,
      connectionsSaturationPercent: 78,
      riskLevel: 'DEGRADED',
      intelligenceState: 'CORRELATED',
      dependentServices: ['Payment Settlement Messaging'],
      inboundEdges: ['node_websphere'],
      outboundEdges: [],
    },
    {
      id: 'node_db2',
      name: 'IBM DB2 Enterprise Database',
      tier: 'DATABASE',
      healthScore: 24,
      p95LatencyMs: 4120,
      errorRatePercent: 18.5,
      connectionsSaturationPercent: 88,
      riskLevel: 'CRITICAL',
      intelligenceState: 'EXPLAINED',
      dependentServices: ['Payment Records', 'Customer Ledger'],
      recentChange: {
        timestamp: '09:12:43 IST',
        summary: 'DB2_MAX_LOCKS reduced from 120,000 to 50,000',
        diffSnippet: 'UPDATE DBM CFG USING MAXLOCKS 50000;',
      },
      inboundEdges: ['node_websphere'],
      outboundEdges: [],
    },
  ];

  const handleOpenNode = (node: VitalisTopologyNode) => {
    setSelectedNode(node);
    setIsNodeDrawerOpen(true);
  };

  return (
    <div className="space-y-5 max-w-6xl mx-auto pb-10 text-slate-200">
      <div className="p-5 rounded-2xl bg-[#0B1526] border border-[#1a2d4c] space-y-1">
        <span className="text-[10px] font-mono text-teal-400 font-bold block uppercase">
          VITALIS TOPOLOGY INTELLIGENCE
        </span>
        <h1 className="text-lg font-bold text-white tracking-tight">
          Environment-Centric Distributed Topology Graph
        </h1>
        <p className="text-xs text-slate-300">
          Interactive dependency mesh carrying live health percentiles, connection saturation, and recent change diffs.
        </p>
      </div>

      <div className="p-6 rounded-2xl bg-[#0B1526] border border-[#1a2d4c] space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {nodes.map((node) => (
            <div
              key={node.id}
              onClick={() => handleOpenNode(node)}
              className={`p-4 rounded-xl border cursor-pointer transition-all hover:scale-[1.01] space-y-2.5 shadow-sm ${
                node.riskLevel === 'CRITICAL'
                  ? 'bg-rose-950/25 border-rose-700/80 hover:border-rose-500'
                  : node.riskLevel === 'DEGRADED'
                  ? 'bg-amber-950/20 border-amber-600/70 hover:border-amber-400'
                  : 'bg-[#070E1B] border-[#14233c] hover:border-teal-400/60'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-teal-400">{node.tier}</span>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                  node.riskLevel === 'CRITICAL'
                    ? 'bg-rose-500/25 text-rose-300 border border-rose-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                }`}>
                  {node.healthScore} / 100
                </span>
              </div>
              <h3 className="text-sm font-bold text-white">{node.name}</h3>
              <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">P95: <strong className="text-amber-300">{node.p95LatencyMs} ms</strong></span>
                <span className="text-teal-400 text-[11px] font-bold">Inspect Node →</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <TopologyNodeDrawer
        node={selectedNode}
        isOpen={isNodeDrawerOpen}
        onClose={() => setIsNodeDrawerOpen(false)}
      />
    </div>
  );
};

// ============================================================================
// 3. Predictive Risk View
// ============================================================================
export const PredictiveRiskView: React.FC = () => {
  const risks: VitalisPredictiveRisk[] = [
    {
      id: 'risk_threads',
      title: 'WebSphere Thread Pool Saturation Forecast',
      category: 'THREAD_POOL',
      provenance: 'REAL_OBSERVED',
      currentValue: '78% (78 / 100)',
      baselineValue: '61%',
      trend: 'UP',
      predictedBreachTime: '~18 minutes',
      confidencePercent: 91,
      riskLevel: 'HIGH',
      businessService: 'Payment Processing',
      recommendedAction: 'Scale WebSphere worker thread pool to 150 or drain MQ queue consumers.',
      provenanceNote: 'Derived from live telemetry collection window (428 samples over 15 min).',
      sampleCount: 428,
      windowMinutes: 15,
    },
    {
      id: 'risk_cert',
      title: 'IHS Ingress TLS Certificate Expiration',
      category: 'CERTIFICATE',
      provenance: 'REAL_OBSERVED',
      currentValue: 'Valid (SHA256-RSA)',
      baselineValue: 'Active',
      trend: 'STABLE',
      predictedBreachTime: '19 days (Expires 05-Sep-2026)',
      confidencePercent: 100,
      riskLevel: 'HIGH',
      businessService: 'Payment Gateway Ingress',
      recommendedAction: 'Execute Runbook RB-SEC-019: Rotate Ingress TLS Certificate via ACM.',
      provenanceNote: 'Direct cryptographic audit of public key expiration metadata.',
    },
    {
      id: 'risk_queue',
      title: 'IBM MQ Inbound Queue Depth Capacity Limit',
      category: 'CAPACITY',
      provenance: 'SIMULATED',
      currentValue: '1,214 pending messages',
      baselineValue: '< 100',
      trend: 'UP',
      predictedBreachTime: '~42 minutes (Limit: 5,000)',
      confidencePercent: 94,
      riskLevel: 'CRITICAL',
      businessService: 'Payment Settlement Broker',
      recommendedAction: 'Increase WebSphere consumer thread concurrency to drain backlogged queue.',
      provenanceNote: 'Simulated queue accumulation trajectory based on active DB2 lock wait rates.',
    },
  ];

  return (
    <div className="space-y-5 max-w-6xl mx-auto pb-10 text-slate-200">
      <div className="p-5 rounded-2xl bg-[#0B1526] border border-[#1a2d4c] space-y-1">
        <span className="text-[10px] font-mono text-teal-400 font-bold block uppercase">
          VITALIS PREDICTIVE RISK ENGINE
        </span>
        <h1 className="text-lg font-bold text-white tracking-tight">
          Early-Warning Horizon &amp; Capacity Risk Forecasting
        </h1>
        <p className="text-xs text-slate-300">
          Autonomous trajectory extrapolation anticipating subsystem saturation, certificate expiry, and threshold breaches before customer impact occurs.
        </p>
      </div>

      <div className="space-y-4">
        {risks.map((risk) => (
          <div
            key={risk.id}
            className="p-5 rounded-2xl bg-[#0B1526] border border-[#1a2d4c] space-y-3 shadow-md"
          >
            <div className="flex items-center justify-between border-b border-[#1a2d4c] pb-2.5">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                  risk.riskLevel === 'CRITICAL'
                    ? 'bg-rose-500/25 text-rose-300 border border-rose-500/40'
                    : 'bg-amber-500/25 text-amber-300 border border-amber-500/40'
                }`}>
                  ● {risk.riskLevel} RISK
                </span>
                <span className="text-sm font-bold text-white">{risk.title}</span>
              </div>
              <span className={`text-xs font-mono font-bold ${
                risk.provenance === 'REAL_OBSERVED' ? 'text-emerald-400' : 'text-amber-400'
              }`}>
                {risk.provenance === 'REAL_OBSERVED' ? '● REAL OBSERVED' : '◆ SIMULATED'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
              <div className="p-3 rounded-xl bg-[#070E1B] border border-[#14233c]">
                <span className="text-[10px] text-slate-400 block">CURRENT VALUE</span>
                <span className="text-white font-bold text-sm mt-0.5 block">{risk.currentValue}</span>
              </div>
              <div className="p-3 rounded-xl bg-[#070E1B] border border-[#14233c]">
                <span className="text-[10px] text-slate-400 block">PREDICTED BREACH</span>
                <span className="text-amber-300 font-bold text-sm mt-0.5 block">{risk.predictedBreachTime}</span>
              </div>
              <div className="p-3 rounded-xl bg-[#070E1B] border border-[#14233c]">
                <span className="text-[10px] text-slate-400 block">CONFIDENCE</span>
                <span className="text-emerald-400 font-bold text-sm mt-0.5 block">{risk.confidencePercent}% HIGH</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#050A14] border border-[#14233c] text-xs text-slate-300 space-y-1">
              <div><strong className="text-white">Recommended Action:</strong> {risk.recommendedAction}</div>
              <div className="text-[10px] text-slate-400 font-mono">Provenance: {risk.provenanceNote}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// 4. What-If Simulation View (Sandboxed Isolation)
// ============================================================================
export const WhatIfView: React.FC = () => {
  const [proposedLocks, setProposedLocks] = useState<string>('50000');
  const [simulationResult, setSimulationResult] = useState<VitalisWhatIfResult | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const handleSimulate = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setSimulationResult({
        parameterName: 'DB2_MAX_LOCKS',
        currentValue: '120000',
        proposedValue: proposedLocks,
        blastRadius: proposedLocks === '50000' ? 'HIGH' : 'LOW',
        predictedLockContentionDelta: proposedLocks === '50000' ? '+847%' : '-92%',
        predictedLatencyDelta: proposedLocks === '50000' ? '+734% (1.17s -> 8.64s)' : '25 ms (Nominal)',
        predictedThreadSaturation: proposedLocks === '50000' ? '92% Saturated' : '18% Nominal',
        predictedQueueBacklog: proposedLocks === '50000' ? '1,214 Pending Messages' : '0 Messages',
        predictedFailuresCount: proposedLocks === '50000' ? 1545 : 0,
        predictedFinancialExposure: proposedLocks === '50000' ? '₹12.5 Lakhs' : '₹0.00',
        safetyNote: 'Sandboxed simulation result only. Zero changes executed to production runtime.',
      });
      setIsSimulating(false);
    }, 600);
  };

  return (
    <div className="space-y-5 max-w-6xl mx-auto pb-10 text-slate-200">
      <div className="p-5 rounded-2xl bg-[#0B1526] border border-[#1a2d4c] space-y-1">
        <span className="text-[10px] font-mono text-teal-400 font-bold block uppercase">
          VITALIS WHAT-IF SIMULATION ENGINE
        </span>
        <h1 className="text-lg font-bold text-white tracking-tight">
          Sandboxed Parameter Impact &amp; Blast Radius Simulation
        </h1>
        <p className="text-xs text-slate-300">
          Simulate configuration alterations, thread pool adjustments, and capacity modifications in total safety before requesting production approvals.
        </p>
      </div>

      {/* Parameter Control */}
      <div className="p-5 rounded-2xl bg-[#0B1526] border border-[#1a2d4c] space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
          <div>
            <span className="text-slate-400 block text-[10px]">PARAMETER NAME</span>
            <span className="text-white font-bold text-sm">DB2_MAX_LOCKS</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">CURRENT VALUE</span>
            <span className="text-emerald-400 font-bold text-sm">120000</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">PROPOSED VALUE</span>
            <select
              value={proposedLocks}
              onChange={(e) => setProposedLocks(e.target.value)}
              className="mt-1 w-full p-2 rounded-lg bg-[#070E1B] border border-[#14233c] text-white text-xs font-mono focus:border-teal-400"
            >
              <option value="50000">50000 (Incident Trigger)</option>
              <option value="120000">120000 (Baseline Nominal)</option>
              <option value="200000">200000 (High Concurrency)</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleSimulate}
          disabled={isSimulating}
          className="w-full py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-black font-extrabold text-xs transition-all shadow-md"
        >
          {isSimulating ? 'Computing Causal Simulation...' : '▶ SIMULATE IMPACT'}
        </button>
      </div>

      {/* Simulation Result */}
      {simulationResult && (
        <div className="p-5 rounded-2xl bg-[#0B1526] border border-teal-500/40 space-y-4 animate-in fade-in duration-300">
          <div className="flex items-center justify-between border-b border-[#1a2d4c] pb-2">
            <span className="text-xs font-mono text-teal-300 font-bold uppercase">
              Predicted Outcome
            </span>
            <span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded ${
              simulationResult.blastRadius === 'HIGH'
                ? 'bg-rose-500/25 text-rose-300 border border-rose-500/40'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
            }`}>
              BLAST RADIUS: {simulationResult.blastRadius}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono">
            <div className="p-3 rounded-xl bg-[#070E1B] border border-[#14233c]">
              <span className="text-[10px] text-slate-400 block">LOCK CONTENTION</span>
              <span className="text-amber-300 font-bold text-sm mt-0.5 block">{simulationResult.predictedLockContentionDelta}</span>
            </div>
            <div className="p-3 rounded-xl bg-[#070E1B] border border-[#14233c]">
              <span className="text-[10px] text-slate-400 block">DB2 LATENCY</span>
              <span className="text-white font-bold text-sm mt-0.5 block">{simulationResult.predictedLatencyDelta}</span>
            </div>
            <div className="p-3 rounded-xl bg-[#070E1B] border border-[#14233c]">
              <span className="text-[10px] text-slate-400 block">THREAD SATURATION</span>
              <span className="text-rose-400 font-bold text-sm mt-0.5 block">{simulationResult.predictedThreadSaturation}</span>
            </div>
            <div className="p-3 rounded-xl bg-[#070E1B] border border-[#14233c]">
              <span className="text-[10px] text-slate-400 block">MQ BACKLOG</span>
              <span className="text-white font-bold text-sm mt-0.5 block">{simulationResult.predictedQueueBacklog}</span>
            </div>
            <div className="p-3 rounded-xl bg-[#070E1B] border border-[#14233c]">
              <span className="text-[10px] text-slate-400 block">PAYMENT FAILURES</span>
              <span className="text-rose-400 font-bold text-sm mt-0.5 block">{simulationResult.predictedFailuresCount}</span>
            </div>
            <div className="p-3 rounded-xl bg-[#070E1B] border border-[#14233c]">
              <span className="text-[10px] text-slate-400 block">EXPOSURE</span>
              <span className="text-teal-300 font-bold text-sm mt-0.5 block">{simulationResult.predictedFinancialExposure}</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#040811] border border-[#14233c] text-[11px] text-slate-400 font-mono">
            🛡️ <strong>Safety Enforcement:</strong> {simulationResult.safetyNote}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 5. Continuous Learning Knowledge Base View
// ============================================================================
export const ContinuousLearningView: React.FC = () => {
  const artifacts: VitalisKnowledgeArtifact[] = [
    {
      id: 'KA-DB2-LOCK-CONTENTION-001',
      patternName: 'DB2 MAXLOCKS Inadvertent Reduction',
      category: 'DATABASE_CONFIGURATION',
      observedSymptom: 'Abrupt jump in Table X-Lock escalations and query duration spike to 3.5s.',
      rootCauseSummary: 'DB2 MAXLOCKS reduced from 120,000 to 50,000 causing exclusive table lock contention.',
      impactChain: 'DB2 Latency ➔ WebSphere Thread Pool Saturation ➔ MQ Queue Accumulation ➔ Payment Failures',
      resolutionRunbook: 'Runbook RB-DB2-042: Restore DB2_MAX_LOCKS to 120,000.',
      preventionGuardrail: 'Enforce DB2 configuration alteration approval workflow in CI/CD.',
      detectionRule: 'Trigger alert when DB2 Table Lock Wait > 500ms for 3 consecutive intervals.',
      confidencePercent: 92,
      historicalOccurrences: 4,
      createdAt: '2026-08-20',
    },
    {
      id: 'KA-NET-MTU-MISMATCH-002',
      patternName: 'Network Interface MTU Boundary Mismatch',
      category: 'NETWORK_INFRASTRUCTURE',
      observedSymptom: 'TCP retransmissions jump +340% between F5 and IHS web tier.',
      rootCauseSummary: 'Core switch MTU set to 1400 bytes while F5 ingress set to 1500 bytes.',
      impactChain: 'Packet fragmentation ➔ Ingress TCP retransmissions ➔ Connection timeout spikes',
      resolutionRunbook: 'Runbook RB-NET-014: Standardize Interface MTU to 1500 bytes.',
      preventionGuardrail: 'Validate MTU consistency across all ingress switch trunks during deployment.',
      detectionRule: 'Alert when TCP fragmentation rate > 2% of total ingress packet volume.',
      confidencePercent: 96,
      historicalOccurrences: 2,
      createdAt: '2026-08-15',
    },
  ];

  return (
    <div className="space-y-5 max-w-6xl mx-auto pb-10 text-slate-200">
      <div className="p-5 rounded-2xl bg-[#0B1526] border border-[#1a2d4c] space-y-1">
        <span className="text-[10px] font-mono text-teal-400 font-bold block uppercase">
          VITALIS CONTINUOUS ORGANIZATIONAL LEARNING
        </span>
        <h1 className="text-lg font-bold text-white tracking-tight">
          Knowledge Base &amp; Verified Causal Pattern Memory
        </h1>
        <p className="text-xs text-slate-300">
          Autonomous institutional memory capturing verified incidents, validated causal chains, resolution efficacy, and prevention guardrails.
        </p>
      </div>

      <div className="space-y-4">
        {artifacts.map((art) => (
          <div key={art.id} className="p-5 rounded-2xl bg-[#0B1526] border border-[#1a2d4c] space-y-3 shadow-md">
            <div className="flex items-center justify-between border-b border-[#1a2d4c] pb-2">
              <div>
                <span className="text-[10px] font-mono text-teal-400 font-bold block">{art.id}</span>
                <h3 className="text-sm font-bold text-white mt-0.5">{art.patternName}</h3>
              </div>
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                {art.historicalOccurrences} Historical Matches ({art.confidencePercent}% Confidence)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-[#070E1B] border border-[#14233c] space-y-1">
                <span className="text-[10px] font-mono text-slate-400 block">OBSERVED SYMPTOM</span>
                <p className="text-slate-200">{art.observedSymptom}</p>
              </div>
              <div className="p-3 rounded-xl bg-[#070E1B] border border-[#14233c] space-y-1">
                <span className="text-[10px] font-mono text-slate-400 block">ROOT CAUSE CONCLUSION</span>
                <p className="text-amber-300 font-medium">{art.rootCauseSummary}</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#050A14] border border-[#14233c] text-xs font-mono space-y-1 text-emerald-400">
              <div><strong>Resolution:</strong> {art.resolutionRunbook}</div>
              <div className="text-slate-400"><strong>Prevention Guardrail:</strong> {art.preventionGuardrail}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

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
      Change Timeline &amp; Correlation Score (0.92 HIGH)
    </h2>
    <div className="p-4 rounded-xl bg-[#070E1B] border border-[#14233c] space-y-3 text-xs font-mono">
      <div className="flex items-center justify-between border-b border-[#14233c] pb-2">
        <span className="text-amber-300 font-bold">09:12:43 IST</span>
        <span className="text-slate-300">DB2 Configuration Altered (DB2_MAX_LOCKS 120000 ➔ 50000)</span>
      </div>
      <div className="flex items-center justify-between border-b border-[#14233c] pb-2">
        <span className="text-amber-300 font-bold">09:18:00 IST</span>
        <span className="text-slate-300">Lock Wait Contention Begins Escalation (+847%)</span>
      </div>
      <div className="flex items-center justify-between border-b border-[#14233c] pb-2">
        <span className="text-amber-300 font-bold">09:25:00 IST</span>
        <span className="text-slate-300">DB2 P95 Latency Deviates (420ms ➔ 3.5s)</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-rose-400 font-bold">09:34:00 IST</span>
        <span className="text-rose-200 font-bold">Incident Triggered: 1,545 Checkout Failures</span>
      </div>
    </div>
  </div>
);
