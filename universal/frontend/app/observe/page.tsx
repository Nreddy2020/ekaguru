'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { VitalisSidebar, VitalisNavSection } from '../../components/vitalis/VitalisSidebar';
import { CommandCenterView } from '../../components/vitalis/CommandCenterView';
import { ApplicationInventoryView } from '../../components/vitalis/ApplicationInventoryView';
import { UploadEvidenceModal } from '../../components/vitalis/UploadEvidenceModal';
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
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
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

  const handleCopyEvidence = (req: VitalisRequest) => {
    const pkg = JSON.stringify(
      {
        vitalisRequest: req,
        environment,
        capturedAt: new Date().toISOString(),
      },
      null,
      2
    );
    navigator.clipboard.writeText(pkg);
    setCopyFeedback('Diagnostic Evidence Package copied to clipboard!');
    setTimeout(() => setCopyFeedback(null), 3000);
  };

  return (
    <div className="min-h-screen bg-[#050a14] text-slate-200 font-sans antialiased flex flex-col">
      {/* 1. Master Top Bar: Brand, Environment Switcher, Refresh Controls */}
      <header className="h-14 bg-[#080e1a] border-b border-slate-800/80 px-4 sm:px-6 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <span className="text-xl text-teal-400">◈</span>
            <div className="flex flex-col">
              <span className="text-white font-extrabold text-sm tracking-wider font-mono">
                VITALIS OBSERVE
              </span>
              <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
                Universal Observability • Causal Intelligence
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Environment Mode Switcher (LAB | DEMO | PRODUCTION) */}
          <div className="flex items-center rounded-lg bg-[#050a14] border border-slate-700/80 p-0.5 text-xs font-semibold">
            <button
              onClick={() => setEnvironment('LAB')}
              className={`px-3 py-1 rounded transition-all flex items-center gap-1.5 ${
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
              className={`px-3 py-1 rounded transition-all flex items-center gap-1.5 ${
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
              className={`px-3 py-1 rounded transition-all flex items-center gap-1.5 ${
                environment === 'PRODUCTION'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>🏭</span>
              <span>PROD</span>
            </button>
          </div>

          {/* Live Auto Refresh Status Pill */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="flex items-center gap-2 px-3 py-1 rounded-lg bg-[#050a14] border border-slate-700/80 text-xs font-medium text-emerald-400 hover:border-slate-600 transition-all shadow-sm"
          >
            <span className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
            <span className="hidden sm:inline">LIVE (3s)</span>
          </button>
        </div>
      </header>

      {/* Global Context Bar */}
      <div className="bg-[#070c17] border-b border-slate-800/80 px-4 sm:px-6 py-1.5 flex items-center justify-between text-[11px] font-mono text-slate-400 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-teal-400 font-semibold">
            {environment === 'LAB' ? 'LAB · EKAGURU LIVE' : environment === 'DEMO' ? 'DEMO · ENTERPRISE SIMULATOR' : 'PROD · ENTERPRISE CLUSTERS'}
          </span>
          <span>•</span>
          <span>Region: <strong>Local Node</strong></span>
          <span>•</span>
          <span>Services: <strong>{inventory.length}</strong></span>
        </div>
        <div className="hidden sm:flex items-center gap-3">
          <span>Signals: <strong className="text-slate-300">1,842</strong></span>
          <span>•</span>
          <span>Last observation: <strong className="text-emerald-400">Nominal</strong></span>
        </div>
      </div>

      {/* Mode Banner Indicator if DEMO */}
      {environment === 'DEMO' && (
        <div className="bg-amber-950/40 border-b border-amber-600/40 px-4 py-1.5 text-center text-xs text-amber-300 font-semibold flex items-center justify-center gap-2">
          <span>⚠️ DEMO MODE ACTIVE</span>
          <span className="font-normal text-amber-200/80">
            — Rendering simulated enterprise transaction journey (WebSphere ➔ MQ ➔ DB2 with lock contention RCA).
          </span>
        </div>
      )}

      {/* Copy Toast */}
      {copyFeedback && (
        <div className="m-3 p-3 rounded-lg bg-teal-950/90 border border-teal-500/60 text-teal-200 text-xs font-mono flex items-center justify-between shadow-lg">
          <span>✅ {copyFeedback}</span>
          <button onClick={() => setCopyFeedback(null)} className="text-slate-400 hover:text-white font-bold ml-4">✕</button>
        </div>
      )}

      {/* 2. Main App Body: Grouped Sidebar + Viewport */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <VitalisSidebar
          activeNav={activeNav}
          onSelectNav={setActiveNav}
          activeIncidentsCount={overview?.activeIncidentsCount || 0}
          onOpenUpload={() => setIsUploadOpen(true)}
        />

        {/* Viewport Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {activeNav === 'COMMAND_CENTER' && overview && (
            <CommandCenterView
              overview={overview}
              onInvestigateIncident={() => setActiveNav('EVIDENCE_RCA')}
              onViewAllRequests={() => setActiveNav('LIVE_REQUESTS')}
            />
          )}

          {activeNav === 'APP_INVENTORY' && (
            <ApplicationInventoryView inventory={inventory} />
          )}

          {(activeNav === 'LIVE_REQUESTS' || activeNav === 'REQUEST_JOURNEYS' || activeNav === 'EVIDENCE_RCA') && (
            <div className="space-y-4 max-w-7xl mx-auto">
              {/* Requests Stream Table */}
              <div className="bg-[#0b1322] border border-slate-800/80 rounded-xl overflow-hidden shadow-sm">
                <div className="px-4 py-3 border-b border-slate-800/80 flex items-center justify-between text-xs bg-[#080e1c]">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">Canonical Request Stream</span>
                    <span className="text-xs text-slate-400 font-mono">({requests.length} recorded)</span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-[11px] text-slate-400 font-medium bg-[#050a14]">
                        <th className="py-2.5 px-3.5">Started At</th>
                        <th className="py-2.5 px-2.5">Transaction</th>
                        <th className="py-2.5 px-2.5 text-center">Status</th>
                        <th className="py-2.5 px-3 text-right">Duration</th>
                        <th className="py-2.5 px-3 text-center">Current Hop</th>
                        <th className="py-2.5 px-3.5 text-right font-mono">Trace ID</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {requests.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-500 text-xs font-sans">
                            No requests recorded for active environment.
                          </td>
                        </tr>
                      ) : (
                        requests.map((req) => {
                          const isSelected = selectedRequest?.id === req.id;
                          return (
                            <tr
                              key={req.id}
                              onClick={() => setSelectedRequest(req)}
                              className={`cursor-pointer transition-colors ${
                                isSelected ? 'bg-teal-950/40 border-l-2 border-teal-400' : 'hover:bg-slate-800/40'
                              }`}
                            >
                              <td className="py-2.5 px-3.5 text-slate-400 text-[11px]">
                                {new Date(req.startedAt).toLocaleTimeString()}
                              </td>
                              <td className="py-2.5 px-2.5 font-bold text-teal-300">
                                {req.transactionType}
                              </td>
                              <td className="py-2.5 px-2.5 text-center">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-sans ${
                                  req.status === 'ERROR'
                                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                }`}>
                                  {req.status}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-right text-slate-200">
                                {req.durationMs} ms
                              </td>
                              <td className="py-2.5 px-3 text-center text-slate-300 font-sans text-xs">
                                {req.currentHop}
                              </td>
                              <td className="py-2.5 px-3.5 text-right text-slate-500 text-[11px]">
                                {req.traceId.length > 12 ? `${req.traceId.slice(0, 10)}...` : req.traceId}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Hop-by-Hop Request Journey Visualization */}
              {selectedRequest && (
                <div className="bg-[#0b1322] border border-slate-800/80 rounded-xl p-5 space-y-4 shadow-md">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                        REQUEST JOURNEY: {selectedRequest.transactionType}
                      </h3>
                      <span className="text-xs text-slate-400 font-mono">
                        Trace ID: {selectedRequest.traceId} • Total Duration: {selectedRequest.durationMs} ms
                      </span>
                    </div>
                    <button
                      onClick={() => handleCopyEvidence(selectedRequest)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-semibold border border-slate-700 transition-colors shadow-sm"
                    >
                      📋 Copy Diagnostic Evidence
                    </button>
                  </div>

                  {/* Hop Chain */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    {selectedRequest.hops.map((hop, index) => {
                      const totalDur = Math.max(1, selectedRequest.durationMs);
                      const hopPct = Math.min(100, Math.max(4, Math.round((hop.latencyMs / totalDur) * 100)));
                      return (
                        <div key={hop.nodeId || index} className="p-3.5 rounded-xl bg-[#080e1c] border border-slate-800 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400 font-mono text-[10px]">Hop #{index + 1}</span>
                            <span className={`px-2 py-0.2 rounded text-[10px] font-bold ${
                              hop.status === 'ERROR' ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
                            }`}>
                              {hop.status}
                            </span>
                          </div>

                          <div>
                            <span className="font-bold text-white text-xs block truncate">{hop.nodeName}</span>
                            <span className="text-[10px] text-teal-400 font-mono block mt-0.5">{hop.kind}</span>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between text-[11px] font-mono">
                              <span className="text-slate-500">Latency</span>
                              <span className="text-amber-400 font-bold">{hop.latencyMs} ms</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                              <div
                                style={{ width: `${hopPct}%` }}
                                className={`h-full rounded-full ${hop.status === 'ERROR' ? 'bg-rose-500' : 'bg-teal-400'}`}
                              />
                            </div>
                          </div>

                          {hop.error && (
                            <p className="text-[10px] text-rose-400 font-medium pt-1">
                              Error: {hop.error}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Placeholder for remaining specialized views */}
          {activeNav !== 'COMMAND_CENTER' && activeNav !== 'APP_INVENTORY' && activeNav !== 'LIVE_REQUESTS' && activeNav !== 'REQUEST_JOURNEYS' && activeNav !== 'EVIDENCE_RCA' && (
            <div className="bg-[#0b1322] border border-slate-800/80 rounded-xl p-8 text-center space-y-3 shadow-sm max-w-7xl mx-auto">
              <div className="text-3xl">🏗️</div>
              <h3 className="text-base font-bold text-white">VITALIS Module: {activeNav}</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                This specialized view is mapped to the Canonical Domain Model and will activate in subsequent sprints.
              </p>
              <button
                onClick={() => setActiveNav('COMMAND_CENTER')}
                className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs transition-colors"
              >
                Return to Command Center
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Upload Evidence Modal */}
      <UploadEvidenceModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onEvidenceProcessed={(ev) => {
          console.log('Evidence processed:', ev);
        }}
      />
    </div>
  );
}
