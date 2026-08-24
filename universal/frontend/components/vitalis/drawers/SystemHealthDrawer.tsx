'use client';

import React from 'react';
import { VitalisHealthExplanation, VitalisProvenance } from '../../../lib/vitalis/domain/types';

interface SystemHealthDrawerProps {
  explanation?: VitalisHealthExplanation;
  provenance: VitalisProvenance;
  isOpen: boolean;
  onClose: () => void;
}

export const SystemHealthDrawer: React.FC<SystemHealthDrawerProps> = ({
  explanation,
  provenance,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !explanation) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#08101D] border-l border-[#1a2d4c] shadow-2xl h-full flex flex-col justify-between p-6 overflow-y-auto text-slate-200">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#1a2d4c] pb-3">
            <div className="flex items-center gap-2.5">
              <span className="text-xl text-teal-400">♥</span>
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  System Health Explanation
                </h2>
                <div className="flex items-center gap-2 text-[10px] font-mono mt-0.5">
                  {provenance === 'REAL_OBSERVED' ? (
                    <span className="text-emerald-400 font-bold">● REAL OBSERVED EVIDENCE</span>
                  ) : (
                    <span className="text-amber-400 font-bold">◆ SIMULATED EVIDENCE</span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Big Score Hero */}
          <div className="p-5 rounded-2xl bg-[#0B1526] border border-[#1a2d4c] space-y-2">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block">
              CANONICAL HEALTH SCORE
            </span>
            <div className="flex items-baseline gap-3">
              <span className="text-5xl font-black text-white font-sans tracking-tight">
                {explanation.overallScore}
              </span>
              <span className="text-xl text-slate-400 font-bold font-mono">/ 100</span>
              <span className={`ml-auto px-3 py-0.5 rounded-full text-xs font-bold font-mono ${
                explanation.status === 'NOMINAL'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
              }`}>
                ● {explanation.status}
              </span>
            </div>
          </div>

          {/* Why is this score X? */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Why is this score {explanation.overallScore}?
            </h3>
            <div className="p-4 rounded-xl bg-[#070E1B] border border-[#14233c] space-y-2 text-xs">
              {explanation.reasons.map((r, i) => (
                <div key={i} className="flex items-start gap-2 text-slate-200">
                  <span>{r}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 4 Dimension Breakdown */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Dimension Scores
            </h3>
            <div className="space-y-2.5">
              {explanation.dimensions.map((dim, i) => (
                <div key={i} className="p-3.5 rounded-xl bg-[#0B1526] border border-[#1a2d4c] space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">{dim.name}</span>
                    <span className="font-mono font-bold text-teal-300">{dim.score} / 100</span>
                  </div>
                  <div className="w-full bg-[#040811] h-1.5 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${dim.score}%` }}
                      className={`h-full rounded-full ${dim.score >= 90 ? 'bg-emerald-400' : dim.score >= 70 ? 'bg-amber-400' : 'bg-rose-400'}`}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span>{dim.description}</span>
                    <span>{dim.signalsCount} signals</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Scoring Philosophy */}
          <div className="p-3.5 rounded-xl bg-[#050A14] border border-[#14233c] text-[11px] text-slate-400 space-y-1">
            <span className="text-teal-400 font-bold block">Scoring Algorithm</span>
            <p className="leading-relaxed">{explanation.scoringPhilosophy}</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-[#14233c] hover:bg-[#1c3258] text-white font-bold text-xs transition-colors mt-6"
        >
          Close Health Inspector
        </button>
      </div>
    </div>
  );
};
