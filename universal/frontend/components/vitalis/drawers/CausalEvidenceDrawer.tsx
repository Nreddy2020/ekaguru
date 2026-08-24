'use client';

import React from 'react';
import { VitalisCausalStep } from '../../../lib/vitalis/domain/types';

interface CausalEvidenceDrawerProps {
  step: VitalisCausalStep | null;
  isOpen: boolean;
  onClose: () => void;
}

export const CausalEvidenceDrawer: React.FC<CausalEvidenceDrawerProps> = ({
  step,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !step) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-[#08101D] border-l border-[#1a2d4c] shadow-2xl h-full flex flex-col justify-between p-6 overflow-y-auto text-slate-200">
        <div className="space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#1a2d4c] pb-3">
            <div>
              <span className="text-[10px] font-mono text-teal-400 font-bold block">
                STEP #{step.stepNumber} • {step.tier}
              </span>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                {step.nodeName} Evidence
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Change & Observed Effect */}
          <div className="p-4 rounded-xl bg-[#0B1526] border border-[#1a2d4c] space-y-2">
            <span className="text-[10px] text-slate-400 uppercase font-mono block font-bold">Signal / Change</span>
            <div className="text-sm font-bold text-amber-300 font-mono">{step.changeOrSignal}</div>
            <p className="text-xs text-slate-300 pt-1 leading-relaxed">
              <strong className="text-white">Observed Effect:</strong> {step.observedEffect}
            </p>
          </div>

          {/* Verifiable Artifact Snippet */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-white font-bold">{step.evidenceTitle}</span>
              <span className="text-emerald-400 font-bold">{step.confidencePercent}% Confidence</span>
            </div>
            <pre className="p-4 rounded-xl bg-[#040811] border border-[#14233c] text-xs font-mono text-teal-300 overflow-x-auto whitespace-pre-wrap leading-relaxed">
              {step.evidenceSnippet}
            </pre>
          </div>

          <div className="p-3.5 rounded-xl bg-[#050A14] border border-[#14233c] text-[11px] text-slate-400 space-y-1">
            <span className="text-slate-300 font-bold block">Artifact Integrity</span>
            <p>Timestamp: {step.timestamp} • Type: {step.evidenceType} • Verified by VITALIS Canonical Parser.</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-[#14233c] hover:bg-[#1c3258] text-white font-bold text-xs transition-colors mt-6"
        >
          Close Evidence Viewer
        </button>
      </div>
    </div>
  );
};
