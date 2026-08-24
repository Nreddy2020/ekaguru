'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { VitalisSidebar, VitalisNavSection } from '../../components/vitalis/VitalisSidebar';
import { CommandCenterView } from '../../components/vitalis/CommandCenterView';
import { ApplicationInventoryView } from '../../components/vitalis/ApplicationInventoryView';
import { UploadEvidenceModal } from '../../components/vitalis/UploadEvidenceModal';
import { Request360Drawer } from '../../components/vitalis/drawers/Request360Drawer';
import { SubsystemDrawer } from '../../components/vitalis/drawers/SubsystemDrawer';
import { VitalisContextHeader } from '../../components/vitalis/ui/VitalisContextHeader';
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
} from '../../lib/vitalis/domain/types';

export default function VitalisObservePage() {
  const [environment, setEnvironment] = useState<VitalisEnvironment>('LAB');
  const [activeNav, setActiveNav] = useState<VitalisNavSection>('COMMAND_CENTER');
  const [overview, setOverview] = useState<VitalisCommandCenterOverview | null>(null);
  const [requests, setRequests] = useState<VitalisRequest[]>([]);
  const [inventory, setInventory] = useState<VitalisInventoryItem[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<VitalisRequest | null>(null);
  const [selectedSubsystem, setSelectedSubsystem] = useState<{ name: string; tier: string; score: number; status: string } | null>(null);
  const [isRequestDrawerOpen, setIsRequestDrawerOpen] = useState(false);
  const [isSubsystemDrawerOpen, setIsSubsystemDrawerOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [presentationMode, setPresentationMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

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

  return (
    <div className="min-h-screen bg-[#060A12] text-[#F4F7FA] font-sans antialiased flex flex-col selection:bg-teal-500 selection:text-black">
      {/* 1. Master Top Bar */}
      <header className="h-16 bg-[#08101D]/70 backdrop-blur-xl border-b border-white/[0.06] px-5 sm:px-8 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-xl text-[#18D8D0]">◈</span>
          <span className="text-white font-extrabold text-sm tracking-wider font-mono">
            VITALIS OBSERVE
          </span>
          <span className="text-xs text-slate-400 font-normal hidden sm:inline pl-2 border-l border-white/[0.08]">
            Universal Observability • Causal Intelligence
          </span>
        </div>

        {/* Search */}
        <div className="hidden md:flex items-center gap-2 bg-white/[0.03] border border-white/[0.08] rounded-xl px-3.5 py-1.5 w-80 text-xs text-slate-400 focus-within:border-teal-500 transition-colors">
          <span className="text-slate-500">⌕</span>
          <input
            type="text"
            placeholder="Search requests, services, incidents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-slate-200 placeholder-slate-500 text-xs w-full focus:outline-none font-mono"
          />
          <kbd className="text-[10px] font-mono text-slate-500 px-1.5 py-0.5 rounded bg-white/[0.04]">
            ⌘K
          </kbd>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setPresentationMode(!presentationMode)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              presentationMode
                ? 'bg-teal-500/20 text-teal-300 border-teal-500/40 shadow-sm'
                : 'text-slate-400 border-white/[0.08] hover:text-slate-200'
            }`}
          >
            📺 <span className="hidden lg:inline ml-1">Presentation</span>
          </button>

          <div className="flex items-center rounded-xl bg-white/[0.03] border border-white/[0.08] p-0.5 text-xs font-semibold">
            <button
              onClick={() => setEnvironment('LAB')}
              className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                environment === 'LAB'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>🧪</span>
              <span>LAB LIVE</span>
            </button>
            <button
              onClick={() => setEnvironment('DEMO')}
              className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                environment === 'DEMO'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>🎭</span>
              <span>DEMO</span>
            </button>
            <button
              onClick={() => setEnvironment('PRODUCTION')}
              className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                environment === 'PRODUCTION'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>🏭</span>
              <span>PROD</span>
            </button>
          </div>

          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs font-medium text-emerald-400 hover:border-white/[0.16] transition-all shadow-sm"
          >
            <span className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
            <span className="hidden sm:inline">LIVE (3s)</span>
          </button>
        </div>
      </header>

      {/* 2. Global Context Header */}
      <VitalisContextHeader
        environment={environment}
        servicesCount={inventory.length}
        activeService={selectedRequest?.businessService}
        activeRequest={selectedRequest?.transactionType}
      />

      {/* DEMO Mode Banner */}
      {environment === 'DEMO' && (
        <div className="bg-amber-950/40 border-b border-amber-600/40 px-4 py-2 text-center text-xs text-amber-300 font-semibold flex items-center justify-center gap-2">
          <span>⚠️ DEMO MODE ACTIVE</span>
          <span className="font-normal text-amber-200/80">
            — Rendering simulated enterprise transaction journey (WebSphere ➔ MQ ➔ DB2 with lock contention RCA).
          </span>
        </div>
      )}

      {/* Presentation Mode Editorial Storytelling */}
      {presentationMode ? (
        <div className="flex-1 p-10 max-w-4xl mx-auto flex flex-col justify-center items-center text-center space-y-10 animate-in fade-in duration-300">
          <div className="space-y-3">
            <span className="text-teal-400 font-mono text-xs font-bold uppercase tracking-widest">
              VITALIS CAUSAL STORY
            </span>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
              {environment === 'DEMO' ? 'Payment Processing Incident' : 'Operational System Status'}
            </h1>
          </div>

          <div className="grid grid-cols-3 gap-6 w-full">
            <div className="p-8 rounded-3xl bg-[#0c1424]/80 backdrop-blur-xl border border-white/[0.08] space-y-2">
              <span className="text-xs text-slate-400 font-mono">OPERATIONAL HEALTH</span>
              <span className="text-6xl font-extrabold text-white font-mono block">{overview?.operationalScore || 100}</span>
              <span className="text-xs text-emerald-400">Nominal Telemetry</span>
            </div>
            <div className="p-8 rounded-3xl bg-[#0c1424]/80 backdrop-blur-xl border border-white/[0.08] space-y-2">
              <span className="text-xs text-slate-400 font-mono">SLA COMPLIANCE</span>
              <span className="text-6xl font-extrabold text-teal-300 font-mono block">{overview?.slaPercent || 100}%</span>
              <span className="text-xs text-teal-400">Target ≤ 2.0s</span>
            </div>
            <div className="p-8 rounded-3xl bg-[#0c1424]/80 backdrop-blur-xl border border-white/[0.08] space-y-2">
              <span className="text-xs text-slate-400 font-mono">ACTIVE RISKS</span>
              <span className="text-6xl font-extrabold text-emerald-400 font-mono block">0</span>
              <span className="text-xs text-slate-400">Protected Architecture</span>
            </div>
          </div>

          <button
            onClick={() => setPresentationMode(false)}
            className="px-6 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-lg transition-all"
          >
            Exit Presentation Mode
          </button>
        </div>
      ) : (
        /* Standard iPadOS Workspace Layout */
        <div className="flex flex-1 overflow-hidden">
          <VitalisSidebar
            activeNav={activeNav}
            onSelectNav={setActiveNav}
            activeIncidentsCount={overview?.activeIncidentsCount || 0}
            onOpenUpload={() => setIsUploadOpen(true)}
          />

          <main className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-8">
            {activeNav === 'COMMAND_CENTER' && overview && (
              <CommandCenterView
                overview={overview}
                onInvestigateIncident={() => setActiveNav('EVIDENCE_RCA')}
                onViewAllRequests={() => setActiveNav('LIVE_REQUESTS')}
                onSelectSubsystem={handleSelectSubsystem}
              />
            )}

            {activeNav === 'APP_INVENTORY' && (
              <ApplicationInventoryView inventory={inventory} />
            )}

            {(activeNav === 'LIVE_REQUESTS' || activeNav === 'REQUEST_JOURNEYS') && (
              <div className="space-y-4 max-w-6xl mx-auto">
                <div className="p-7 rounded-3xl bg-[#0c1424]/80 backdrop-blur-xl border border-white/[0.08] shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-base">Canonical Request Stream</span>
                      <span className="text-slate-400">({requests.length} recorded)</span>
                    </div>
                    <span className="text-teal-400 font-semibold">Click row to open Request 360 Sheet</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-white/[0.06] text-slate-400 font-medium">
                          <th className="py-3 px-4">Started At</th>
                          <th className="py-3 px-3">Transaction</th>
                          <th className="py-3 px-3 text-center">Status</th>
                          <th className="py-3 px-3 text-right">Duration</th>
                          <th className="py-3 px-3 text-center">Current Hop</th>
                          <th className="py-3 px-4 text-right font-mono">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.04] font-mono">
                        {requests.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-slate-500 text-xs font-sans">
                              No requests recorded for active environment.
                            </td>
                          </tr>
                        ) : (
                          requests.map((req) => (
                            <tr
                              key={req.id}
                              onClick={() => handleOpenRequest360(req)}
                              className="cursor-pointer hover:bg-white/[0.04] transition-colors"
                            >
                              <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                                {new Date(req.startedAt).toLocaleTimeString()}
                              </td>
                              <td className="py-3.5 px-3 font-bold text-teal-300">
                                {req.transactionType}
                              </td>
                              <td className="py-3.5 px-3 text-center">
                                <VitalisStatusPill status={req.status} size="sm" />
                              </td>
                              <td className="py-3.5 px-3 text-right text-white font-bold">
                                {req.durationMs} ms
                              </td>
                              <td className="py-3.5 px-3 text-center text-slate-300 font-sans text-xs">
                                {req.currentHop}
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenRequest360(req);
                                  }}
                                  className="px-3 py-1 rounded-xl bg-teal-500/15 text-teal-300 hover:bg-teal-500/25 text-[11px] font-bold border border-teal-500/30"
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
      )}

      {/* Floating iPad Sheets / Drawers */}
      <Request360Drawer
        request={selectedRequest}
        isOpen={isRequestDrawerOpen}
        onClose={() => setIsRequestDrawerOpen(false)}
      />

      <SubsystemDrawer
        subsystem={selectedSubsystem}
        isOpen={isSubsystemDrawerOpen}
        onClose={() => setIsSubsystemDrawerOpen(false)}
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
