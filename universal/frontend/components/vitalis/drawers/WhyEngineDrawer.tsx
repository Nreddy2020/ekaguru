'use client';

import React from 'react';
import { VitalisWhyItem } from '../../../lib/vitalis/domain/types';

interface WhyEngineDrawerProps {
  item: VitalisWhyItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSimulateAction?: () => void;
}

export const WhyEngineDrawer: React.FC<WhyEngineDrawerProps> = ({
  item,
  isOpen,
  onClose,
  onSimulateAction,
}) => {
  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-[#08101D] border-l border-[#1a2d4c] shadow-2xl h-full flex flex-col justify-between p-6 overflow-y-auto text-slate-200 font-sans space-y-6">
        <div className="space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#1a2d4c] pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-teal-400 font-bold text-xs font-mono">VITALIS WHY? ENGINE</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-500/15 text-teal-300 border border-teal-500/30">
                  {item.intelligenceState}
                </span>
                {item.provenance === 'REAL_OBSERVED' ? (
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">● REAL</span>
                ) : (
                  <span className="text-[10px] font-mono text-amber-400 font-bold">◆ SIMULATED</span>
                )}
              </div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono mt-0.5">
                {item.title}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
            >
              ✕
            </button>
          </div>

          {/* 1. WHAT & WHERE & WHEN */}
          <div className="p-4 rounded-xl bg-[#0B1526] border border-[#1a2d4c] space-y-2 text-xs font-mono">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-slate-400 block text-[10px]">WHERE (NODE / TIER)</span>
                <span className="text-white font-bold">{item.where}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">WHEN (TRIGGER TIME)</span>
                <span className="text-teal-300 font-bold">{item.when}</span>
              </div>
            </div>
            <div className="pt-2 border-t border-[#1a2d4c]">
              <span className="text-slate-400 block text-[10px]">WHAT HAPPENED</span>
              <p className="text-slate-200 font-sans mt-0.5 leading-relaxed">{item.what}</p>
            </div>
          </div>

          {/* 2. WHY THIS HAPPENED (Primary Suspected Cause) */}
          <div className="p-4 rounded-xl bg-[#070E1B] border border-amber-500/30 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-wider">
                PRIMARY SUSPECTED CAUSE
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                {item.confidence.totalPercent}% CONFIDENCE ({item.confidence.rating})
              </span>
            </div>
            <p className="text-sm font-bold text-white leading-relaxed">
              {item.why}
            </p>
          </div>

          {/* 3. TRANSPARENT CONFIDENCE BREAKDOWN */}
          <div className="p-4 rounded-xl bg-[#0B1526] border border-[#1a2d4c] space-y-2 text-xs">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block font-bold">
              Evidence Weighting Breakdown
            </span>
            <div className="space-y-1.5 font-mono">
              {item.confidence.factors.map((factor, i) => (
                <div key={i} className="flex items-center justify-between text-[11px] p-1.5 rounded bg-[#070E1B] border border-[#14233c]">
                  <span className="text-slate-300 truncate">{factor.name}</span>
                  <span className="text-teal-300 font-bold">+{factor.weightPoints}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 4. PROPAGATION PATH */}
          <div className="space-y-2 text-xs">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block font-bold">
              Causal Propagation Path
            </span>
            <div className="space-y-1.5">
              {item.propagationChain.map((p) => (
                <div key={p.step} className="p-2.5 rounded-lg bg-[#070E1B] border border-[#14233c] flex items-center gap-2.5 font-mono text-[11px]">
                  <span className="px-1.5 py-0.5 rounded bg-[#14233c] text-teal-300 font-bold">
                    #{p.step}
                  </span>
                  <span className="text-white font-bold">{p.node}</span>
                  <span className="text-slate-500">➔</span>
                  <span className="text-slate-300 truncate">{p.effect}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 5. RECOMMENDED ACTION & SAFETY */}
          <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-700/60 space-y-3 text-xs">
            <span className="text-[10px] font-mono text-indigo-300 font-bold uppercase tracking-wider block">
              Recommended Remediation Action
            </span>
            <div className="font-bold text-white text-sm">
              {item.recommendedAction.title}
            </div>
            <div className="grid grid-cols-3 gap-2 text-[10px] font-mono">
              <div className="p-2 rounded bg-[#070E1B]">
                <span className="text-slate-400 block">RISK</span>
                <span className="text-emerald-400 font-bold">{item.recommendedAction.risk}</span>
              </div>
              <div className="p-2 rounded bg-[#070E1B]">
                <span className="text-slate-400 block">ROLLBACK</span>
                <span className="text-teal-300 font-bold">{item.recommendedAction.rollbackAvailable ? 'YES' : 'NO'}</span>
              </div>
              <div className="p-2 rounded bg-[#070E1B]">
                <span className="text-slate-400 block">APPROVAL</span>
                <span className="text-amber-300 font-bold">{item.recommendedAction.approvalRequired ? 'REQUIRED' : 'AUTO'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-2 border-t border-[#1a2d4c]">
          <button
            onClick={onSimulateAction}
            className="flex-1 py-2.5 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/40 font-bold text-xs transition-colors"
          >
            Simulate in What-If →
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
