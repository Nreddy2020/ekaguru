'use client';

import React from 'react';
import { VitalisTopologyNode } from '../../../lib/vitalis/domain/types';

interface TopologyNodeDrawerProps {
  node: VitalisTopologyNode | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenWhy?: () => void;
}

export const TopologyNodeDrawer: React.FC<TopologyNodeDrawerProps> = ({
  node,
  isOpen,
  onClose,
  onOpenWhy,
}) => {
  if (!isOpen || !node) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#08101D] border-l border-[#1a2d4c] shadow-2xl h-full flex flex-col justify-between p-6 overflow-y-auto text-slate-200 font-sans space-y-6">
        <div className="space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#1a2d4c] pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-teal-400 font-bold text-xs font-mono">{node.tier}</span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                  node.riskLevel === 'NOMINAL'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                }`}>
                  {node.riskLevel}
                </span>
              </div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono mt-0.5">
                {node.name}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
            >
              ✕
            </button>
          </div>

          {/* KPI Metrics Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-3.5 rounded-xl bg-[#0B1526] border border-[#1a2d4c] space-y-1">
              <span className="text-[10px] text-slate-400 block uppercase">Health Score</span>
              <span className="text-2xl font-black text-white">{node.healthScore} / 100</span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#0B1526] border border-[#1a2d4c] space-y-1">
              <span className="text-[10px] text-slate-400 block uppercase">P95 Latency</span>
              <span className="text-2xl font-black text-amber-300">{node.p95LatencyMs} ms</span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#0B1526] border border-[#1a2d4c] space-y-1">
              <span className="text-[10px] text-slate-400 block uppercase">Error Rate</span>
              <span className={`text-lg font-black ${node.errorRatePercent > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {node.errorRatePercent}%
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#0B1526] border border-[#1a2d4c] space-y-1">
              <span className="text-[10px] text-slate-400 block uppercase">Connections / Saturation</span>
              <span className="text-lg font-black text-teal-300">{node.connectionsSaturationPercent}%</span>
            </div>
          </div>

          {/* Recent Change Audit */}
          {node.recentChange && (
            <div className="p-4 rounded-xl bg-[#070E1B] border border-amber-500/30 space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-amber-400 font-bold uppercase">Recent Configuration Change</span>
                <span className="text-slate-500 text-[10px]">{node.recentChange.timestamp}</span>
              </div>
              <p className="text-white font-bold">{node.recentChange.summary}</p>
              <pre className="p-2.5 rounded bg-[#040811] text-[11px] text-teal-300 overflow-x-auto">
                {node.recentChange.diffSnippet}
              </pre>
            </div>
          )}

          {/* Dependent Services */}
          <div className="p-4 rounded-xl bg-[#0B1526] border border-[#1a2d4c] space-y-2 text-xs">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block font-bold">
              Dependent Business Services
            </span>
            <div className="flex flex-wrap gap-1.5">
              {node.dependentServices.map((srv, i) => (
                <span key={i} className="px-2.5 py-1 rounded bg-[#070E1B] border border-[#14233c] text-teal-300 text-xs font-mono font-bold">
                  {srv}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-2 border-t border-[#1a2d4c]">
          <button
            onClick={onOpenWhy}
            className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-xs transition-colors"
          >
            Investigate Why? →
          </button>
          <button
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl bg-[#14233c] hover:bg-[#1c3258] text-white font-bold text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
