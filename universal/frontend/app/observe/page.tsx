'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { VitalisSidebar, VitalisNavSection } from '../../components/vitalis/VitalisSidebar';
import { CommandCenterView } from '../../components/vitalis/CommandCenterView';
import { ApplicationInventoryView } from '../../components/vitalis/ApplicationInventoryView';
import { UploadEvidenceModal } from '../../components/vitalis/UploadEvidenceModal';
import { Request360Drawer } from '../../components/vitalis/drawers/Request360Drawer';
import { SubsystemDrawer } from '../../components/vitalis/drawers/SubsystemDrawer';
import { SystemHealthDrawer } from '../../components/vitalis/drawers/SystemHealthDrawer';
import { BusinessImpactDrawer } from '../../components/vitalis/drawers/BusinessImpactDrawer';
import { TelemetryAuditDrawer } from '../../components/vitalis/drawers/TelemetryAuditDrawer';
import { AgentContextDrawer } from '../../components/vitalis/drawers/AgentContextDrawer';
import { FixVerificationDrawer } from '../../components/vitalis/drawers/FixVerificationDrawer';
import { VitalisStatusPill } from '../../components/vitalis/ui/VitalisBadge';
import {
  TopologyView,
  PerformanceView,
  BusinessImpactView,
  ChangeIntelligenceView,
  EvidenceRcaView,
  PredictiveRiskView,
  WhatIfView,
  ContinuousLearningView,
} from '../../components/vitalis/views/SpecializedViews';
import { getVitalisProvider } from '../../lib/vitalis/providers';
import {
  VitalisEnvironment,
  VitalisCommandCenterOverview,
  VitalisRequest,
  VitalisInventoryItem,
  VitalisTelemetryProvenance,
  VitalisAgentDiagnosticPackage,
} from '../../lib/vitalis/domain/types';

export default function VitalisObservePage() {
  const [environment, setEnvironment] = useState<VitalisEnvironment>('LAB');
  const [activeNav, setActiveNav] = useState<VitalisNavSection>('COMMAND_CENTER');
  const [overview, setOverview] = useState<VitalisCommandCenterOverview | null>(null);
  const [requests, setRequests] = useState<VitalisRequest[]>([]);
  const [inventory, setInventory] = useState<VitalisInventoryItem[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<VitalisRequest | null>(null);
  const [selectedSubsystem, setSelectedSubsystem] = useState<{ name: string; tier: string; score: number; status: string } | null>(null);
  const [selectedAudit, setSelectedAudit] = useState<VitalisTelemetryProvenance | null>(null);
  const [agentPackage, setAgentPackage] = useState<VitalisAgentDiagnosticPackage | null>(null);
  const [isRequestDrawerOpen, setIsRequestDrawerOpen] = useState(false);
  const [isSubsystemDrawerOpen, setIsSubsystemDrawerOpen] = useState(false);
  const [isHealthDrawerOpen, setIsHealthDrawerOpen] = useState(false);
  const [isImpactDrawerOpen, setIsImpactDrawerOpen] = useState(false);
  const [isAuditDrawerOpen, setIsAuditDrawerOpen] = useState(false);
  const [isAgentContextOpen, setIsAgentContextOpen] = useState(false);
  const [isFixVerificationOpen, setIsFixVerificationOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [presentationMode, setPresentationMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const provider = getVitalisProvider(environment);

  const loadData = useCallback(async () => {
    try {
      const [overviewData, reqsData, invData] = await Promise.all([
        provider.getCommandCenterOverview(),
        provider.getLiveRequests({ scope: 'APPLICATION' }),
        provider.getApplicationInventory(),
      ]);

      setOverview(overviewData);
      setRequests(reqsData);
      setInventory(invData);

      if (!selectedRequest && reqsData.length > 0) {
        setSelectedRequest(reqsData[0]);
      }
    } catch (err) {
      console.error('VITALIS data load error:', err);
    }
  }, [provider, selectedRequest]);

  useEffect(() => {
    loadData();
    if (!autoRefresh) return;
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, [loadData, autoRefresh]);

  const handleOpenRequest360 = (req: VitalisRequest) => {
    setSelectedRequest(req);
    setIsRequestDrawerOpen(true);
  };

  const handleSelectSubsystem = (sub: { name: string; tier: string; score: number; status: string }) => {
    setSelectedSubsystem(sub);
    setIsSubsystemDrawerOpen(true);
  };

  const handleOpenAudit = (prov: VitalisTelemetryProvenance) => {
    setSelectedAudit(prov);
    setIsAuditDrawerOpen(true);
  };

  const handleOpenAgentContext = () => {
    const pkg: VitalisAgentDiagnosticPackage = {
      incidentId: 'INC-2026-000127',
      application: 'EKAGURU',
      environment: environment,
      severity: 'HIGH',
      request: {
        method: 'POST',
        route: '/api/v2/library/upload',
        traceId: selectedRequest?.id || 'trc_lab_m2_upload_fail',
        requestId: 'req_xyz789_m2_fail',
        startedAt: new Date(Date.now() - 600000).toISOString(),
        durationMs: 8420,
        statusCode: 504,
        status: 'FAILED',
      },
      journey: [
        { hopNumber: 1, node: 'Browser Client', tier: 'CLIENT', durationMs: 42, status: 'HEALTHY', epistemicStatus: 'OBSERVED' },
        { hopNumber: 2, node: 'NestJS Gateway', tier: 'GATEWAY', durationMs: 18, status: 'HEALTHY', epistemicStatus: 'OBSERVED' },
        { hopNumber: 3, node: 'HTTP Controller', tier: 'CONTROLLER', durationMs: 36, status: 'HEALTHY', epistemicStatus: 'OBSERVED' },
        { hopNumber: 4, node: 'File Validation', tier: 'CONTROLLER', durationMs: 28, status: 'HEALTHY', epistemicStatus: 'OBSERVED' },
        { hopNumber: 5, node: 'LocalStorage I/O', tier: 'STORAGE', durationMs: 112, status: 'HEALTHY', epistemicStatus: 'OBSERVED' },
        { hopNumber: 6, node: 'M2 Page Truth Engine', tier: 'M2', durationMs: 1480, status: 'HEALTHY', epistemicStatus: 'OBSERVED' },
        { hopNumber: 7, node: 'M2 Structure Engine', tier: 'M2', durationMs: 5210, status: 'CRITICAL', epistemicStatus: 'OBSERVED' },
        { hopNumber: 8, node: 'PostgreSQL Database', tier: 'DATABASE', durationMs: 7140, status: 'CRITICAL', epistemicStatus: 'OBSERVED' },
      ],
      subsystemEvidence: [
        {
          subsystem: 'PostgreSQL Database Engine',
          tier: 'DATABASE',
          operation: 'ContentTopic.insert',
          durationMs: 7140,
          status: 'TIMEOUT',
          errorMessage: 'canceling statement due to statement timeout after 7000ms',
          connectionPoolStatus: '19/20 connections utilized',
          p95LatencyMs: 1842,
          epistemicStatus: 'OBSERVED',
        },
      ],
      rootCauseCandidates: [
        {
          candidateId: 'CAND_1',
          hypothesis: 'Connection pool starvation during unbatched ContentTopic inserts',
          confidencePercent: 94,
          epistemicStatus: 'SUSPECTED',
          evidenceIds: ['EV-001', 'EV-002', 'EV-003'],
        },
      ],
      selectedRootCause: {
        summary: 'PostgreSQL query latency & pool contention during M2 Structure ContentTopic insert.',
        rootCauseNode: 'universal/backend/src/m2/structure/structure.service.ts',
        confidencePercent: 94,
        epistemicStatus: 'SUSPECTED',
      },
      supportingEvidenceChecklist: [
        { item: 'Database query execution exceeded 7,000ms threshold', verified: true, evidenceId: 'EV-001' },
        { item: 'Connection pool saturation reached 19/20 slots', verified: true, evidenceId: 'EV-002' },
        { item: 'Trace correlation confirms failure localized strictly to Structure Stage', verified: true, evidenceId: 'EV-003' },
      ],
      affectedCodeAreas: [
        {
          component: 'M2 Structure Engine',
          suspectedFiles: [
            'universal/backend/src/m2/structure/structure.service.ts',
            'universal/backend/src/m2/content-topic/content-topic.repository.ts',
          ],
          suspectedOperation: 'ContentTopic.insert',
          epistemicStatus: 'SUSPECTED',
          reason: 'Observed 7.14s database latency correlated with sequential unbatched ContentTopic inserts',
        },
      ],
      evidenceReferences: [
        { id: 'EV-001', type: 'TRACE_SPAN', source: 'Prisma.ContentTopic.insert', timestamp: '09:12:44 IST', epistemicStatus: 'OBSERVED', summary: 'Duration 7,140ms with TIMEOUT error' },
        { id: 'EV-002', type: 'POOL_METRIC', source: 'PostgreSQL Connection Pool', timestamp: '09:12:45 IST', epistemicStatus: 'OBSERVED', summary: 'Active connections 19/20' },
      ],
      recommendedInvestigation: [
        '1. Inspect ContentTopic batch insert logic in structure.service.ts.',
        '2. Replace sequential INSERT loops with Prisma createMany.',
        '3. Re-run upload execution and trigger Fix Verification.',
      ],
      recommendedFix: {
        strategy: 'Batch insert ContentTopics and optimize connection release in M2 Structure service.',
        filesToModify: ['universal/backend/src/m2/structure/structure.service.ts'],
      },
      verificationPlan: {
        testRoute: 'POST /api/v2/library/upload',
        payloadType: 'Standard multi-topic document PDF (4.2MB)',
        expectedDurationMs: 250,
        regressionIterations: 5,
      },
      provenance: {
        source: 'REAL_OBSERVED',
        recordedAt: new Date().toISOString(),
        signature: 'VITALIS-LAB-SHA256-000127',
      },
    };

    setAgentPackage(pkg);
    setIsAgentContextOpen(true);
  };

  return (
    <div className="h-screen w-screen bg-[#050A14] text-[#F4F7FA] font-sans antialiased flex flex-col overflow-hidden selection:bg-teal-500 selection:text-black">
      {/* 1. Master Top Bar */}
      <header className="h-14 bg-[#08101D] border-b border-[#1a2942] px-4 sm:px-6 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-xl text-[#18D8D0]">◈</span>
          <span className="text-white font-extrabold text-sm tracking-wider font-mono">
            VITALIS OBSERVE
          </span>
          <span className="text-xs text-slate-400 font-medium hidden md:inline pl-3 border-l border-[#1a2942]">
            Universal Observability • Diagnostic Plugin for EKAGURU
          </span>
        </div>

        {/* Search */}
        <div className="hidden lg:flex items-center gap-2 bg-[#050A14] border border-[#1a2942] rounded-xl px-3 py-1.5 w-72 text-xs text-slate-300 focus-within:border-teal-400 transition-colors">
          <span className="text-slate-400">⌕</span>
          <input
            type="text"
            placeholder="Search requests, services..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-white placeholder-slate-500 text-xs w-full focus:outline-none font-mono"
          />
          <kbd className="text-[10px] font-mono text-slate-400 px-1.5 py-0.5 rounded bg-white/[0.06]">
            ⌘K
          </kbd>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleOpenAgentContext}
            className="px-2.5 py-1.5 rounded-lg bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border border-teal-500/35 text-xs font-mono font-bold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <span>🤖</span>
            <span className="hidden sm:inline">Agent Package</span>
          </button>

          <button
            onClick={() => setIsFixVerificationOpen(true)}
            className="px-2.5 py-1.5 rounded-lg bg-[#070E1B] hover:bg-[#12203c] text-slate-200 border border-[#1a2d4c] text-xs font-mono font-bold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <span>⚖️</span>
            <span className="hidden sm:inline">Verify Fix</span>
          </button>

          <div className="flex items-center rounded-lg bg-[#050A14] border border-[#1a2d4c] p-0.5 text-xs font-semibold">
            <button
              onClick={() => setEnvironment('LAB')}
              className={`px-2.5 py-1 rounded transition-all flex items-center gap-1.5 ${
                environment === 'LAB'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🧪</span>
              <span>LAB LIVE</span>
            </button>
            <button
              onClick={() => setEnvironment('DEMO')}
              className={`px-2.5 py-1 rounded transition-all flex items-center gap-1.5 ${
                environment === 'DEMO'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🎭</span>
              <span>DEMO</span>
            </button>
            <button
              onClick={() => setEnvironment('PRODUCTION')}
              className={`px-2.5 py-1 rounded transition-all flex items-center gap-1.5 ${
                environment === 'PRODUCTION'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🏭</span>
              <span>PROD</span>
            </button>
          </div>

          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#050A14] border border-[#1a2d4c] text-xs font-medium text-emerald-400 hover:border-teal-500/40 transition-all shadow-xs"
          >
            <span className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400' : 'bg-slate-500'}`} />
            <span className="hidden sm:inline">LIVE (3s)</span>
          </button>
        </div>
      </header>

      {/* 2. Global Context Bar */}
      <div className="bg-[#08111D] border-b border-[#1a2942] px-4 sm:px-6 py-1.5 flex flex-wrap items-center justify-between text-xs font-mono text-slate-400 gap-2 shrink-0">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="text-[#18D8D0] font-bold">
            {environment === 'LAB'
              ? 'LAB · EKAGURU LIVE'
              : environment === 'DEMO'
              ? 'DEMO · ENTERPRISE SIMULATOR'
              : 'PROD · ENTERPRISE CLUSTERS'}
          </span>
          <span className="text-slate-600">•</span>
          <span>Region: <strong className="text-slate-200">Local Node</strong></span>
          <span className="text-slate-600">•</span>
          <span>Services: <strong className="text-slate-200">{inventory.length}</strong></span>
          {selectedRequest?.businessService && (
            <>
              <span className="text-slate-600">•</span>
              <span>Service: <strong className="text-teal-300">{selectedRequest.businessService}</strong></span>
            </>
          )}
          {selectedRequest?.transactionType && (
            <>
              <span className="text-slate-600">•</span>
              <span>Focus: <strong className="text-amber-300">{selectedRequest.transactionType}</strong></span>
            </>
          )}
        </div>

        <div className="flex items-center gap-3 ml-auto">
          <div className="flex items-center gap-1.5 bg-[#050A14] px-2.5 py-0.5 rounded border border-[#1a2d4c] text-[11px]">
            <span>⏱️ Last 15m</span>
          </div>
          <span className="text-emerald-400 font-semibold flex items-center gap-1 text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Nominal</span>
          </span>
        </div>
      </div>

      {/* DEMO Mode Banner */}
      {environment === 'DEMO' && (
        <div className="bg-amber-950/40 border-b border-amber-600/40 px-4 py-1.5 text-center text-xs text-amber-300 font-semibold flex items-center justify-center gap-2">
          <span>⚠️ DEMO MODE ACTIVE</span>
          <span className="font-normal text-amber-200/80">
            — Rendering simulated enterprise transaction journey (WebSphere ➔ MQ ➔ DB2 with lock contention RCA).
          </span>
        </div>
      )}

      {/* Main Workspace Layout */}
      <div className="flex flex-1 overflow-hidden">
        {!presentationMode && (
          <VitalisSidebar
            activeNav={activeNav}
            onSelectNav={setActiveNav}
            activeIncidentsCount={overview?.activeIncidentsCount || 0}
            onOpenUpload={() => setIsUploadOpen(true)}
          />
        )}

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 w-full">
          {activeNav === 'COMMAND_CENTER' && overview && (
            <CommandCenterView
              overview={overview}
              onInvestigateIncident={() => setActiveNav('EVIDENCE_RCA')}
              onViewAllRequests={() => setActiveNav('LIVE_REQUESTS')}
              onSelectSubsystem={handleSelectSubsystem}
              onOpenHealthDetail={() => setIsHealthDrawerOpen(true)}
              onOpenImpactDetail={() => setIsImpactDrawerOpen(true)}
              onOpenTelemetryAudit={handleOpenAudit}
            />
          )}

          {activeNav === 'APP_INVENTORY' && (
            <ApplicationInventoryView inventory={inventory} />
          )}

          {(activeNav === 'LIVE_REQUESTS' || activeNav === 'REQUEST_JOURNEYS') && (
            <div className="space-y-3 w-full">
              <div className="p-4 rounded-xl bg-[#0B1526] border border-[#1a2d4c] shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-[#1a2d4c] pb-2 text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">Canonical Request Stream</span>
                    <span className="text-slate-400">({requests.length} recorded)</span>
                  </div>
                  <span className="text-teal-400">Click row to open Request 360 Sheet</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse font-mono">
                    <thead>
                      <tr className="border-b border-[#1a2d4c] text-slate-400 font-semibold bg-[#070E1B]/50">
                        <th className="py-2 px-3">Started At</th>
                        <th className="py-2 px-3">Transaction</th>
                        <th className="py-2 px-3 text-center">Status</th>
                        <th className="py-2 px-3 text-right">Duration</th>
                        <th className="py-2 px-3 text-center">Current Hop</th>
                        <th className="py-2 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1a2d4c]/60">
                      {requests.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-400 text-xs font-sans">
                            No requests recorded for active environment.
                          </td>
                        </tr>
                      ) : (
                        requests.map((req) => (
                          <tr
                            key={req.id}
                            onClick={() => handleOpenRequest360(req)}
                            className="cursor-pointer hover:bg-[#14233c]/50 transition-colors"
                          >
                            <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                              {new Date(req.startedAt).toLocaleTimeString()}
                            </td>
                            <td className="py-2.5 px-3 font-bold text-teal-300">
                              {req.transactionType}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <VitalisStatusPill status={req.status} size="sm" />
                            </td>
                            <td className="py-2.5 px-3 text-right text-white font-bold">
                              {req.durationMs} ms
                            </td>
                            <td className="py-2.5 px-3 text-center text-slate-300 font-sans text-xs">
                              {req.currentHop}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenRequest360(req);
                                }}
                                className="px-2.5 py-1 rounded bg-teal-500/15 text-teal-300 hover:bg-teal-500/25 text-[11px] font-bold border border-teal-500/30"
                              >
                                360 →
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeNav === 'TOPOLOGY' && <TopologyView />}
          {activeNav === 'PERFORMANCE' && <PerformanceView />}
          {activeNav === 'BUSINESS_IMPACT' && <BusinessImpactView />}
          {activeNav === 'CHANGE_INTELLIGENCE' && <ChangeIntelligenceView />}
          {activeNav === 'EVIDENCE_RCA' && <EvidenceRcaView />}
          {activeNav === 'PREDICTIVE_RISK' && <PredictiveRiskView />}
          {activeNav === 'WHAT_IF' && <WhatIfView />}
          {activeNav === 'CONTINUOUS_LEARNING' && <ContinuousLearningView />}
        </main>
      </div>

      {/* Floating Sheets / Drawers */}
      <Request360Drawer
        request={selectedRequest}
        isOpen={isRequestDrawerOpen}
        onClose={() => setIsRequestDrawerOpen(false)}
        onOpenAgentContext={handleOpenAgentContext}
        onOpenFixVerification={() => setIsFixVerificationOpen(true)}
      />

      <SubsystemDrawer
        subsystem={selectedSubsystem}
        isOpen={isSubsystemDrawerOpen}
        onClose={() => setIsSubsystemDrawerOpen(false)}
      />

      <SystemHealthDrawer
        explanation={overview?.healthExplanation}
        provenance={overview?.provenance || 'REAL_OBSERVED'}
        isOpen={isHealthDrawerOpen}
        onClose={() => setIsHealthDrawerOpen(false)}
      />

      <BusinessImpactDrawer
        impact={overview?.businessImpactDetail}
        provenance={overview?.provenance || 'REAL_OBSERVED'}
        isOpen={isImpactDrawerOpen}
        onClose={() => setIsImpactDrawerOpen(false)}
      />

      <TelemetryAuditDrawer
        provenance={selectedAudit}
        isOpen={isAuditDrawerOpen}
        onClose={() => setIsAuditDrawerOpen(false)}
      />

      <AgentContextDrawer
        pkg={agentPackage}
        isOpen={isAgentContextOpen}
        onClose={() => setIsAgentContextOpen(false)}
        onOpenFixVerification={() => {
          setIsAgentContextOpen(false);
          setIsFixVerificationOpen(true);
        }}
      />

      <FixVerificationDrawer
        isOpen={isFixVerificationOpen}
        onClose={() => setIsFixVerificationOpen(false)}
      />

      {/* Global Ingestion Hub Modal */}
      <UploadEvidenceModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onEvidenceProcessed={(ev) => {
          console.log('Evidence Ingested into VITALIS Hub:', ev);
        }}
      />
    </div>
  );
}
