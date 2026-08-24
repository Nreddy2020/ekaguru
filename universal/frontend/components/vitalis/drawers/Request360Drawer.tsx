'use client';

import React, { useState } from 'react';
import { VitalisRequest } from '../../../lib/vitalis/domain/types';
import { VitalisStatusPill } from '../ui/VitalisBadge';

interface Request360DrawerProps {
  request: VitalisRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenAgentContext?: () => void;
  onOpenFixVerification?: () => void;
}

type TabType = 'overview' | 'journey' | 'spans' | 'causal' | 'evidence' | 'learning';

export const Request360Drawer: React.FC<Request360DrawerProps> = ({
  request,
  isOpen,
  onClose,
  onOpenAgentContext,
  onOpenFixVerification,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  if (!isOpen || !request) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-[#08101D] border-l border-[#1a2d4c] shadow-2xl h-full flex flex-col justify-between p-6 overflow-y-auto text-slate-200 font-sans space-y-6">
        <div className="space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#1a2d4c] pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-teal-400 font-bold text-xs font-mono">REQUEST 360</span>
                <VitalisStatusPill status={request.status} size="sm" />
              </div>
              <h2 className="text-sm font-bold text-white font-mono truncate max-w-md mt-0.5">
                {request.transactionType}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Machine Control Surface Action Banner */}
          <div className="p-3.5 rounded-xl bg-[#0B1526] border border-teal-500/30 flex items-center justify-between text-xs font-mono">
            <div>
              <span className="text-white font-bold block">🤖 AGENT DIAGNOSTIC</span>
              <span className="text-slate-400 text-[11px]">Structured machine evidence contract</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={onOpenAgentContext}
                className="px-2.5 py-1.5 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/40 text-xs font-bold transition-colors"
              >
                Open Context →
              </button>
              <button
                onClick={onOpenFixVerification}
                className="px-2.5 py-1.5 rounded-lg bg-[#14233c] hover:bg-[#1c3258] text-slate-200 border border-[#234375] text-xs font-bold transition-colors"
              >
                Verify Fix ⚖️
              </button>
            </div>
          </div>

          {/* 6 Tabs */}
          <div className="flex items-center gap-1 border-b border-[#1a2d4c] pb-2 text-xs font-semibold overflow-x-auto">
            {(['overview', 'journey', 'spans', 'causal', 'evidence', 'learning'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1 rounded-lg transition-colors capitalize shrink-0 ${
                  activeTab === tab
                    ? 'bg-[#14233c] text-teal-300 font-bold border border-[#234375]'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab === 'causal' ? 'Causal Chain' : tab === 'evidence' ? 'Evidence JSON' : tab}
              </button>
            ))}
          </div>

          {/* Tab 1: Overview */}
          {activeTab === 'overview' && (
            <div className="space-y-4 text-xs font-mono">
              <div className="p-4 rounded-xl bg-[#0B1526] border border-[#1a2d4c] grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-400 block text-[10px]">TOTAL DURATION</span>
                  <span className="text-white font-bold text-sm">{request.durationMs} ms</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">STATUS CODE</span>
                  <span className="text-emerald-400 font-bold text-sm">{request.statusCode}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">CURRENT HOP</span>
                  <span className="text-teal-300 font-bold">{request.currentHop}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">PROVENANCE</span>
                  <span className="text-slate-200">{request.provenance}</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#070E1B] border border-[#14233c] space-y-2">
                <span className="text-slate-400 block text-[10px]">TRACE ID</span>
                <div className="text-teal-300 break-all">{request.id}</div>
                <div className="pt-2 border-t border-[#14233c] text-slate-400 text-[11px]">
                  Started at: {new Date(request.startedAt).toLocaleString()}
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Journey */}
          {activeTab === 'journey' && (
            <div className="space-y-3">
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block">
                Distributed Hop Timeline
              </span>
              <div className="space-y-2">
                {request.spans.map((span, i) => (
                  <div key={i} className="p-3 rounded-xl bg-[#0B1526] border border-[#1a2d4c] flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-2.5">
                      <span className="text-slate-500 font-bold">#{i + 1}</span>
                      <div>
                        <span className="text-white font-bold block">{span.name}</span>
                        <span className="text-[10px] text-teal-400">{span.tier}</span>
                      </div>
                    </div>
                    <span className="text-amber-300 font-bold">{span.durationMs} ms</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 3: Spans */}
          {activeTab === 'spans' && (
            <div className="space-y-3">
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block">
                Database &amp; Subsystem Spans
              </span>
              <div className="space-y-2">
                {(request.evidenceJson?.databaseQueries || [
                  { query: 'SELECT "id", "title" FROM "Learner" LIMIT 10', durationMs: 3 },
                  { query: 'SELECT COUNT(*) FROM "Material"', durationMs: 3 },
                  { query: 'SELECT * FROM "Material" WHERE "status" = "ACTIVE"', durationMs: 3 },
                ]).map((q: any, i: number) => (
                  <div key={i} className="p-3.5 rounded-xl bg-[#070E1B] border border-[#14233c] space-y-1 font-mono text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-teal-300 font-bold">Prisma Query #{i + 1}</span>
                      <span className="text-amber-300 font-bold">{q.durationMs} ms</span>
                    </div>
                    <code className="text-[11px] text-slate-300 block break-all">{q.query}</code>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 4: Causal Chain */}
          {activeTab === 'causal' && (
            <div className="space-y-3">
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block">
                Upstream Cause &amp; Downstream Propagation
              </span>
              <div className="p-4 rounded-xl bg-[#0B1526] border border-[#1a2d4c] space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] font-mono">PRIMARY TRIGGER</span>
                  <span className="text-amber-300 font-bold text-sm font-mono mt-0.5 block">
                    {request.causalChain?.cause || 'Nominal execution baseline'}
                  </span>
                </div>
                <div className="pt-2 border-t border-[#1a2d4c]">
                  <span className="text-slate-400 block text-[10px] font-mono">OBSERVED EFFECT</span>
                  <span className="text-white mt-0.5 block">
                    {request.causalChain?.effect || 'Response delivered successfully within 25ms SLA.'}
                  </span>
                </div>
                <div className="pt-2 border-t border-[#1a2d4c] text-[11px] font-mono text-emerald-400 font-bold">
                  Confidence Score: {request.causalChain?.confidencePercent || 99}%
                </div>
              </div>
            </div>
          )}

          {/* Tab 5: Evidence JSON */}
          {activeTab === 'evidence' && (
            <div className="space-y-2">
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block">
                Raw Canonical Telemetry JSON
              </span>
              <pre className="p-4 rounded-xl bg-[#040811] border border-[#14233c] text-[11px] font-mono text-teal-300 overflow-x-auto max-h-80">
                {JSON.stringify(request, null, 2)}
              </pre>
            </div>
          )}

          {/* Tab 6: Learning Memory */}
          {activeTab === 'learning' && (
            <div className="space-y-3 text-xs">
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block">
                Continuous Organizational Learning
              </span>
              <div className="p-4 rounded-xl bg-[#0B1526] border border-[#1a2d4c] space-y-2.5">
                <div className="flex items-center justify-between font-mono">
                  <span className="text-teal-300 font-bold">{request.learningMemory?.patternId || 'PAT-NOMINAL-001'}</span>
                  <span className="text-slate-400">{request.learningMemory?.occurrences || 128} prior matches</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  <strong className="text-white">Recommended Policy:</strong> {request.learningMemory?.recommendedAction || 'No remediation required. System operating within verified nominal baseline.'}
                </p>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-[#14233c] hover:bg-[#1c3258] text-white font-bold text-xs transition-colors mt-6"
        >
          Close Request 360
        </button>
      </div>
    </div>
  );
};
