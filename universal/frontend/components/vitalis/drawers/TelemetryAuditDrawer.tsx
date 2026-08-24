'use client';

import React from 'react';
import { VitalisTelemetryProvenance } from '../../../lib/vitalis/domain/types';

interface TelemetryAuditDrawerProps {
  provenance: VitalisTelemetryProvenance | null;
  isOpen: boolean;
  onClose: () => void;
}

export const TelemetryAuditDrawer: React.FC<TelemetryAuditDrawerProps> = ({
  provenance,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !provenance) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#08101D] border-l border-[#1a2d4c] shadow-2xl h-full flex flex-col justify-between p-6 overflow-y-auto text-slate-200 font-sans space-y-6">
        <div className="space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#1a2d4c] pb-3">
            <div>
              <span className="text-[10px] font-mono text-teal-400 font-bold block uppercase">
                TELEMETRY PROVENANCE &amp; CALCULATION AUDIT
              </span>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono mt-0.5">
                {provenance.metricName}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Metric Value Hero */}
          <div className="p-5 rounded-2xl bg-[#0B1526] border border-[#1a2d4c] space-y-1">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block">
              REPORTED VALUE
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-4xl font-black text-white font-mono">{provenance.value}</span>
              <span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full ${
                provenance.provenance === 'REAL_OBSERVED'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              }`}>
                {provenance.provenance === 'REAL_OBSERVED' ? '● REAL OBSERVED' : '◆ SIMULATED'}
              </span>
            </div>
          </div>

          {/* Audit Metadata Grid */}
          <div className="p-4 rounded-xl bg-[#070E1B] border border-[#14233c] space-y-2.5 text-xs font-mono">
            <div className="flex justify-between border-b border-[#14233c] pb-1.5">
              <span className="text-slate-400">Environment</span>
              <span className="text-white font-bold">{provenance.environment}</span>
            </div>
            <div className="flex justify-between border-b border-[#14233c] pb-1.5">
              <span className="text-slate-400">Source Endpoint</span>
              <span className="text-teal-300 font-bold">{provenance.endpoint}</span>
            </div>
            <div className="flex justify-between border-b border-[#14233c] pb-1.5">
              <span className="text-slate-400">Collection Window</span>
              <span className="text-white">{provenance.collectionWindow}</span>
            </div>
            <div className="flex justify-between border-b border-[#14233c] pb-1.5">
              <span className="text-slate-400">Sample Records Analyzed</span>
              <span className="text-emerald-400 font-bold">{provenance.sampleCount}</span>
            </div>
            <div className="flex justify-between border-b border-[#14233c] pb-1.5">
              <span className="text-slate-400">Mathematical Formula</span>
              <span className="text-slate-200">{provenance.calculationMethod}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Captured At</span>
              <span className="text-slate-300">{provenance.capturedAt} ({provenance.lastUpdatedSecAgo}s ago)</span>
            </div>
          </div>

          {/* Raw Snippet */}
          {provenance.rawRecordsSnippet && (
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block font-bold">
                Raw Telemetry Sample
              </span>
              <pre className="p-3.5 rounded-xl bg-[#040811] border border-[#14233c] text-[11px] font-mono text-teal-300 overflow-x-auto max-h-48">
                {provenance.rawRecordsSnippet}
              </pre>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-[#14233c] hover:bg-[#1c3258] text-white font-bold text-xs transition-colors mt-6"
        >
          Close Telemetry Provenance
        </button>
      </div>
    </div>
  );
};
