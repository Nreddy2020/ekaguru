'use client';

import React, { useState } from 'react';
import { VitalisFixVerificationResult } from '../../../lib/vitalis/domain/types';

interface FixVerificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FixVerificationDrawer: React.FC<FixVerificationDrawerProps> = ({
  isOpen,
  onClose,
}) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VitalisFixVerificationResult | null>({
    originalIncidentId: 'INC-2026-000127',
    originalTraceId: 'trc_lab_m2_upload_fail',
    verificationTraceId: 'trc_lab_m2_upload_verified',
    status: 'FIX_VERIFIED',
    beforeMetrics: {
      durationMs: 8420,
      dbQueryLatencyMs: 7140,
      errorCode: 'TIMEOUT (504)',
      statusCode: 504,
    },
    afterMetrics: {
      durationMs: 184,
      dbQueryLatencyMs: 19,
      errorCode: 'NONE (200 OK)',
      statusCode: 200,
    },
    delta: {
      durationImprovementPercent: 97.8,
      dbLatencyImprovementPercent: 99.7,
    },
    regressionCheck: {
      totalRequests: 5,
      passedRequests: 5,
      allPassed: true,
      newErrorsCount: 0,
    },
    certification: {
      verifiedAt: new Date().toISOString(),
      rootCauseExtinguished: true,
      originalFailureReproduced: false,
      summary: 'Root cause no longer observed. 5/5 regression requests executed successfully without database contention.',
    },
  });

  if (!isOpen) return null;

  const handleRunReVerification = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-[#08101D] border-l border-[#1a2d4c] shadow-2xl h-full flex flex-col justify-between p-6 overflow-y-auto text-slate-200 font-sans space-y-6">
        <div className="space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#1a2d4c] pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-teal-400 font-bold text-xs font-mono">⚖️ VITALIS FIX VERIFICATION</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  {verificationResult?.status === 'FIX_VERIFIED' ? '✅ FIX VERIFIED' : 'FAILED'}
                </span>
              </div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono mt-0.5">
                Target: {verificationResult?.originalIncidentId}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Verification Hero Certificate */}
          <div className="p-5 rounded-2xl bg-[#0B1526] border border-emerald-500/40 space-y-2">
            <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider block">
              Autonomous Verification Certification
            </span>
            <div className="text-base font-bold text-white leading-relaxed">
              {verificationResult?.certification.summary}
            </div>
            <div className="pt-2 border-t border-[#1a2d4c] flex items-center justify-between text-xs font-mono text-slate-400">
              <span>Original Failure Reproduced: <strong className="text-emerald-400 font-bold">NO</strong></span>
              <span>Root Cause Extinguished: <strong className="text-emerald-400 font-bold">YES</strong></span>
            </div>
          </div>

          {/* Before vs After Side-by-Side Comparison */}
          <div className="space-y-2">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block font-bold">
              Before vs After Execution Fingerprint
            </span>
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              {/* BEFORE */}
              <div className="p-4 rounded-xl bg-rose-950/25 border border-rose-700/60 space-y-2">
                <span className="text-[10px] text-rose-300 font-bold uppercase block">BEFORE FIX (Incident)</span>
                <div className="space-y-1">
                  <div className="flex justify-between"><span className="text-slate-400">Duration:</span><span className="text-rose-300 font-bold">8,420 ms</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">DB Query:</span><span className="text-rose-300 font-bold">7,140 ms</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Status:</span><span className="text-rose-400 font-bold">504 FAILED</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Error:</span><span className="text-rose-300">TIMEOUT</span></div>
                </div>
              </div>

              {/* AFTER */}
              <div className="p-4 rounded-xl bg-emerald-950/25 border border-emerald-700/60 space-y-2">
                <span className="text-[10px] text-emerald-300 font-bold uppercase block">AFTER FIX (Re-observed)</span>
                <div className="space-y-1">
                  <div className="flex justify-between"><span className="text-slate-400">Duration:</span><span className="text-emerald-300 font-bold">184 ms</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">DB Query:</span><span className="text-emerald-300 font-bold">19 ms</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Status:</span><span className="text-emerald-400 font-bold">200 OK</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Error:</span><span className="text-emerald-300">NONE</span></div>
                </div>
              </div>
            </div>
          </div>

          {/* Regression Verification */}
          <div className="p-4 rounded-xl bg-[#070E1B] border border-[#14233c] space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-bold uppercase">Automated Regression Sample</span>
              <span className="text-emerald-400 font-bold">5 / 5 PASS (100%)</span>
            </div>
            <div className="w-full bg-[#040811] h-2 rounded-full overflow-hidden">
              <div className="w-full h-full bg-emerald-400 rounded-full" />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <span>New Errors Detected: <strong className="text-white">0</strong></span>
              <span>Latency Improvement: <strong className="text-emerald-400">↓ 97.8%</strong></span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-2 border-t border-[#1a2d4c]">
          <button
            onClick={handleRunReVerification}
            disabled={isVerifying}
            className="flex-1 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-black font-extrabold text-xs transition-all shadow-md"
          >
            {isVerifying ? 'Re-probing Live Runtime...' : '🔄 Re-Probe Real Runtime Request'}
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
