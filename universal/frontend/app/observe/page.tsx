'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { VitalisSidebar, VitalisNavSection } from '../../components/vitalis/VitalisSidebar';
import { CommandCenterView } from '../../components/vitalis/CommandCenterView';
import { ApplicationInventoryView } from '../../components/vitalis/ApplicationInventoryView';
import { UploadEvidenceModal } from '../../components/vitalis/UploadEvidenceModal';
import { Request360Drawer } from '../../components/vitalis/drawers/Request360Drawer';
import { SubsystemDrawer } from '../../components/vitalis/drawers/SubsystemDrawer';
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
      <header className="h-18 bg-[#09111f] border-b border-white/[0.1] px-6 sm:px-10 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-4">
          <span className="text-2xl text-[#18D8D0]">◈</span>
          <span className="text-white font-black text-base sm:text-lg tracking-wider font-mono">
            VITALIS OBSERVE
          </span>
          <span className="text-sm text-slate-300 font-medium hidden md:inline pl-3 border-l border-white/[0.15]">
            Universal Observability • Causal Intelligence
          </span>
        </div>

        {/* Search */}
        <div className="hidden lg:flex items-center gap-2.5 bg-[#060A12] border border-white/[0.12] rounded-2xl px-4 py-2 w-96 text-sm text-slate-300 focus-within:border-teal-400 transition-colors">
          <span className="text-slate-400 text-base">⌕</span>
          <input
            type="text"
            placeholder="Search requests, services, incidents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-white placeholder-slate-400 text-sm w-full focus:outline-none font-mono"
          />
          <kbd className="text-xs font-mono text-slate-400 px-2 py-0.5 rounded bg-white/[0.08] font-bold">
            ⌘K
          </kbd>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-3.5">
          <button
            onClick={() => setPresentationMode(!presentationMode)}
            className={`px-3.5 py-2 rounded-2xl text-xs sm:text-sm font-bold border transition-all ${
              presentationMode
                ? 'bg-teal-500/20 text-teal-300 border-teal-500/40 shadow-sm'
                : 'text-slate-300 border-white/[0.12] hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            📺 <span className="hidden lg:inline ml-1">Presentation</span>
          </button>

          <div className="flex items-center rounded-2xl bg-[#060A12] border border-white/[0.12] p-1 text-xs sm:text-sm font-bold">
            <button
              onClick={() => setEnvironment('LAB')}
              className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                environment === 'LAB'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🧪</span>
              <span>LAB LIVE</span>
            </button>
            <button
              onClick={() => setEnvironment('DEMO')}
              className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                environment === 'DEMO'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🎭</span>
              <span>DEMO</span>
            </button>
            <button
              onClick={() => setEnvironment('PRODUCTION')}
              className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                environment === 'PRODUCTION'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🏭</span>
              <span>PROD</span>
            </button>
          </div>

          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-[#060A12] border border-white/[0.12] text-xs sm:text-sm font-bold text-emerald-400 hover:border-white/[0.2] transition-all shadow-sm"
          >
            <span className={`w-2.5 h-2.5 rounded-full ${autoRefresh ? 'bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400' : 'bg-slate-500'}`} />
            <span className="hidden sm:inline">LIVE (3s)</span>
          </button>
        </div>
      </header>

      {/* 2. Global Context Bar */}
      <div className="bg-[#0b1424] border-b border-white/[0.1] px-6 sm:px-10 py-2.5 flex flex-wrap items-center justify-between text-xs sm:text-sm font-mono text-slate-300 gap-4 shrink-0">
        <div className="flex items-center gap-3.5 flex-wrap">
          <span className="text-[#18D8D0] font-black text-sm">
            {environment === 'LAB'
              ? 'LAB · EKAGURU LIVE'
              : environment === 'DEMO'
              ? 'DEMO · ENTERPRISE SIMULATOR'
              : 'PROD · ENTERPRISE CLUSTERS'}
          </span>
          <span className="text-slate-600">•</span>
          <span>Region: <strong className="text-white">Local Node</strong></span>
          <span className="text-slate-600">•</span>
          <span>Services: <strong className="text-white">{inventory.length}</strong></span>
          {selectedRequest?.businessService && (
            <>
              <span className="text-slate-600">•</span>
              <span>Service: <strong className="text-teal-300 font-bold">{selectedRequest.businessService}</strong></span>
            </>
          )}
          {selectedRequest?.transactionType && (
            <>
              <span className="text-slate-600">•</span>
              <span>Focus: <strong className="text-amber-300 font-bold">{selectedRequest.transactionType}</strong></span>
            </>
          )}
        </div>

        <div className="flex items-center gap-4 ml-auto">
          <div className="flex items-center gap-2 bg-[#060A12] px-3 py-1 rounded-xl border border-white/[0.1] text-xs">
            <span>⏱️ Last 15m</span>
          </div>
          <span className="text-emerald-400 font-bold flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400" />
            <span>Nominal</span>
          </span>
        </div>
      </div>

      {/* DEMO Mode Banner */}
      {environment === 'DEMO' && (
        <div className="bg-amber-950/40 border-b border-amber-600/40 px-6 py-2 text-center text-sm text-amber-300 font-bold flex items-center justify-center gap-2">
          <span>⚠️ DEMO MODE ACTIVE</span>
          <span className="font-normal text-amber-200/90">
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

        <main className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-8 w-full">
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
            <div className="space-y-4 w-full">
              <div className="p-8 rounded-3xl bg-[#0d1629] border border-white/[0.12] shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-4 text-sm font-mono">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-white text-lg">Canonical Request Stream</span>
                    <span className="text-slate-400">({requests.length} recorded)</span>
                  </div>
                  <span className="text-teal-400 font-bold">Click row to open Request 360 Sheet</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-white/[0.08] text-slate-400 font-bold bg-[#060A12]/50">
                        <th className="py-3.5 px-4">Started At</th>
                        <th className="py-3.5 px-3">Transaction</th>
                        <th className="py-3.5 px-3 text-center">Status</th>
                        <th className="py-3.5 px-3 text-right">Duration</th>
                        <th className="py-3.5 px-3 text-center">Current Hop</th>
                        <th className="py-3.5 px-4 text-right font-mono">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.06] font-mono">
                      {requests.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-12 text-center text-slate-400 text-sm font-sans">
                            No requests recorded for active environment.
                          </td>
                        </tr>
                      ) : (
                        requests.map((req) => (
                          <tr
                            key={req.id}
                            onClick={() => handleOpenRequest360(req)}
                            className="cursor-pointer hover:bg-white/[0.06] transition-colors"
                          >
                            <td className="py-4 px-4 text-slate-300 text-xs">
                              {new Date(req.startedAt).toLocaleTimeString()}
                            </td>
                            <td className="py-4 px-3 font-bold text-teal-300 text-sm">
                              {req.transactionType}
                            </td>
                            <td className="py-4 px-3 text-center">
                              <VitalisStatusPill status={req.status} size="sm" />
                            </td>
                            <td className="py-4 px-3 text-right text-white font-bold text-sm">
                              {req.durationMs} ms
                            </td>
                            <td className="py-4 px-3 text-center text-slate-200 font-sans text-xs">
                              {req.currentHop}
                            </td>
                            <td className="py-4 px-4 text-right">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenRequest360(req);
                                }}
                                className="px-3.5 py-1.5 rounded-xl bg-teal-500/20 text-teal-300 hover:bg-teal-500/30 text-xs font-bold border border-teal-500/40"
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
