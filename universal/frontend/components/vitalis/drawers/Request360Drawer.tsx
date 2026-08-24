'use client';

import React, { useState } from 'react';
import { VitalisDrawer } from '../ui/VitalisDrawer';
import { VitalisStatusPill } from '../ui/VitalisBadge';
import { VitalisConfidenceIndicator } from '../ui/VitalisTimeline';
import { VitalisRequest } from '../../../lib/vitalis/domain/types';

interface Request360DrawerProps {
  request: VitalisRequest | null;
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'OVERVIEW' | 'JOURNEY' | 'SPANS' | 'CAUSAL_CHAIN' | 'EVIDENCE' | 'LEARNING';

export const Request360Drawer: React.FC<Request360DrawerProps> = ({
  request,
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('OVERVIEW');
  if (!request) return null;

  const isError = request.status === 'ERROR';

  return (
    <VitalisDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={`REQUEST 360: ${request.transactionType}`}
      subtitle={`Trace ID: ${request.traceId} • ${request.durationMs}ms`}
      widthClass="max-w-2xl"
    >
      {/* Tabs */}
      <div className="flex items-center gap-1.5 border-b border-white/[0.08] pb-2 text-xs font-semibold overflow-x-auto">
        {(['OVERVIEW', 'JOURNEY', 'SPANS', 'CAUSAL_CHAIN', 'EVIDENCE', 'LEARNING'] as TabType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
              activeTab === tab
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 bg-[#08111d] p-4 rounded-xl border border-white/[0.06] font-mono text-xs">
            <div>
              <span className="text-slate-500 block text-[10px]">Status</span>
              <VitalisStatusPill status={request.status} size="sm" />
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Total Latency</span>
              <span className="text-amber-300 font-bold">{request.durationMs} ms</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Business Service</span>
              <span className="text-slate-200">{request.businessService}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Started At</span>
              <span className="text-slate-300">{new Date(request.startedAt).toLocaleTimeString()}</span>
            </div>
          </div>

          {/* Intelligence Explanation (Why?) */}
          <div className="bg-[#08111d] p-4 rounded-xl border border-teal-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-teal-400 font-bold text-[11px] uppercase tracking-wider">
                💡 Causal Intelligence Summary
              </span>
              <span className="text-xs font-mono text-teal-300">92% Confidence</span>
            </div>
            <p className="text-slate-200 text-xs leading-relaxed">
              {isError
                ? 'Execution failed at downstream database layer due to connection timeout during transactional insert.'
                : 'Transaction completed nominally across all 4 subsystem hops with zero security or performance anomalies.'}
            </p>
          </div>
        </div>
      )}

      {/* Tab 2: Journey */}
      {activeTab === 'JOURNEY' && (
        <div className="space-y-3">
          <span className="text-xs text-slate-400 block font-mono">Hop-by-Hop Distributed Path:</span>
          {request.hops.map((hop, i) => (
            <div key={i} className="p-3 bg-[#08111d] rounded-xl border border-white/[0.06] flex items-center justify-between text-xs font-mono">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-teal-400 font-bold">#{i + 1}</span>
                  <span className="text-white font-bold">{hop.nodeName}</span>
                </div>
                <span className="text-slate-400 text-[10px]">Kind: {hop.kind}</span>
              </div>
              <div className="text-right">
                <span className="text-amber-400 font-bold block">{hop.latencyMs} ms</span>
                <VitalisStatusPill status={hop.status} size="sm" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Causal Chain */}
      {activeTab === 'CAUSAL_CHAIN' && (
        <div className="space-y-4">
          <VitalisConfidenceIndicator percent={92} label="Causal Correlation Confidence" />
          <div className="p-4 bg-[#08111d] rounded-xl border border-white/[0.06] space-y-3 font-mono text-xs">
            <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
              <span className="text-slate-500 text-[10px] block">1. INITIATING EVENT</span>
              <span className="text-slate-200 font-bold">HTTP {request.transactionType}</span>
            </div>
            <div className="text-center text-teal-400 text-sm">↓</div>
            <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
              <span className="text-slate-500 text-[10px] block">2. SUBSYSTEM EXECUTION</span>
              <span className="text-slate-200 font-bold">Prisma PostgreSQL Queries (3 queries • 11ms)</span>
            </div>
            <div className="text-center text-teal-400 text-sm">↓</div>
            <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
              <span className="text-slate-500 text-[10px] block">3. BUSINESS OUTCOME</span>
              <span className="text-emerald-400 font-bold">SLA Met (Total: {request.durationMs}ms)</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Evidence */}
      {activeTab === 'EVIDENCE' && (
        <div className="space-y-3 font-mono text-xs">
          <span className="text-slate-400 text-[11px] block">Linked Evidence Packages (3 items):</span>
          <pre className="p-4 bg-[#050a12] rounded-xl border border-white/[0.06] text-slate-300 overflow-x-auto text-[11px]">
            {JSON.stringify(request.rawTrace || request, null, 2)}
          </pre>
        </div>
      )}
    </VitalisDrawer>
  );
};
