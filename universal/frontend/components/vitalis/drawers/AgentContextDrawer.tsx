'use client';

import React, { useState } from 'react';
import { VitalisAgentDiagnosticPackage } from '../../../lib/vitalis/domain/types';

interface AgentContextDrawerProps {
  pkg: VitalisAgentDiagnosticPackage | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenFixVerification?: () => void;
}

export const AgentContextDrawer: React.FC<AgentContextDrawerProps> = ({
  pkg,
  isOpen,
  onClose,
  onOpenFixVerification,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !pkg) return null;

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(pkg, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-[#08101D] border-l border-[#1a2d4c] shadow-2xl h-full flex flex-col justify-between p-6 overflow-y-auto text-slate-200 font-sans space-y-6">
        <div className="space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#1a2d4c] pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-teal-400 font-bold text-xs font-mono">🤖 AGENT DIAGNOSTIC PACKAGE</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  {pkg.incidentId}
                </span>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">● REAL EVIDENCE</span>
              </div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono mt-0.5">
                {pkg.application} • {pkg.request.route} ({pkg.request.statusCode} FAILED)
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Quick Copy Banner */}
          <div className="p-3.5 rounded-xl bg-[#0B1526] border border-teal-500/40 flex items-center justify-between">
            <span className="text-xs text-slate-300">
              Formatted for direct injection into AI coding/engineering agent prompts.
            </span>
            <button
              onClick={handleCopyJson}
              className="px-3 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-black font-extrabold text-xs font-mono transition-all shadow-sm"
            >
              {copied ? '✓ COPIED JSON' : '📋 COPY AGENT PACKAGE'}
            </button>
          </div>

          {/* Root Cause & Affected Code Areas */}
          <div className="p-4 rounded-xl bg-[#070E1B] border border-amber-500/40 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-amber-400 font-bold uppercase">
                SELECTED ROOT CAUSE ({pkg.selectedRootCause.epistemicStatus})
              </span>
              <span className="text-[10px] font-mono text-emerald-400 font-bold">
                {pkg.selectedRootCause.confidencePercent}% Confidence
              </span>
            </div>
            <p className="text-sm font-bold text-white leading-relaxed">
              {pkg.selectedRootCause.summary}
            </p>
            <div className="pt-2 border-t border-[#14233c] space-y-1 font-mono text-[11px]">
              <span className="text-slate-400 block font-bold">Suspected Code Location:</span>
              {pkg.affectedCodeAreas.map((area, i) => (
                <div key={i} className="p-2 rounded bg-[#040811] text-teal-300">
                  <div className="font-bold text-white">{area.component} ➔ {area.suspectedOperation}</div>
                  <div className="text-slate-400 mt-0.5">{area.suspectedFiles.join(', ')}</div>
                  <div className="text-amber-300 text-[10px] mt-0.5">{area.reason}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Supporting Evidence Checklist */}
          <div className="space-y-2 text-xs font-mono">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">
              Supporting Evidence References
            </span>
            <div className="space-y-1.5">
              {pkg.supportingEvidenceChecklist.map((item, idx) => (
                <div key={idx} className="p-2.5 rounded-lg bg-[#070E1B] border border-[#14233c] flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#14233c] text-teal-300 font-bold">{item.evidenceId}</span>
                  <span className="text-slate-200 truncate">{item.item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended Investigation Steps */}
          <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-700/60 space-y-2 text-xs">
            <span className="text-[10px] font-mono text-indigo-300 font-bold uppercase tracking-wider block">
              Recommended Investigation Steps for Agent
            </span>
            <div className="space-y-1 font-mono text-[11px] text-slate-200">
              {pkg.recommendedInvestigation.map((step, i) => (
                <div key={i} className="leading-relaxed">{step}</div>
              ))}
            </div>
          </div>

          {/* Raw JSON Preview */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block font-bold">
              Machine Evidence Contract (JSON Payload)
            </span>
            <pre className="p-4 rounded-xl bg-[#040811] border border-[#14233c] text-[11px] font-mono text-teal-300 overflow-x-auto max-h-60 leading-relaxed">
              {JSON.stringify(pkg, null, 2)}
            </pre>
          </div>
        </div>

        <div className="flex gap-2 pt-2 border-t border-[#1a2d4c]">
          <button
            onClick={onOpenFixVerification}
            className="flex-1 py-2.5 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/40 font-bold text-xs transition-colors"
          >
            ⚖️ Verify Agent Fix →
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
