'use client';

import React from 'react';
import { VitalisBusinessImpactDetail, VitalisProvenance } from '../../../lib/vitalis/domain/types';

interface BusinessImpactDrawerProps {
  impact?: VitalisBusinessImpactDetail;
  provenance: VitalisProvenance;
  isOpen: boolean;
  onClose: () => void;
}

export const BusinessImpactDrawer: React.FC<BusinessImpactDrawerProps> = ({
  impact,
  provenance,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !impact) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#08101D] border-l border-[#1a2d4c] shadow-2xl h-full flex flex-col justify-between p-6 overflow-y-auto text-slate-200">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#1a2d4c] pb-3">
            <div className="flex items-center gap-2.5">
              <span className="text-xl text-teal-400">◈</span>
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Business Impact Analysis
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

          {/* Hero State */}
          <div className={`p-5 rounded-2xl border space-y-2 ${
            impact.status === 'PROTECTED'
              ? 'bg-[#0B1526] border-[#1a2d4c]'
              : 'bg-rose-950/30 border-rose-800'
          }`}>
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block">
              STATUS
            </span>
            <div className="flex items-baseline justify-between">
              <span className={`text-3xl font-black tracking-tight ${
                impact.status === 'PROTECTED' ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {impact.status}
              </span>
              <span className="text-xs font-mono text-teal-300 font-bold">
                {impact.slaCompliancePercent}% SLA Adherence
              </span>
            </div>
            <p className="text-xs text-slate-300 pt-1 leading-relaxed">
              {impact.summary}
            </p>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-2 gap-3 font-mono text-xs">
            <div className="p-3.5 rounded-xl bg-[#070E1B] border border-[#14233c] space-y-1">
              <span className="text-[10px] text-slate-400 block font-bold uppercase">Monitored Users</span>
              <span className="text-lg font-black text-white block">
                {impact.monitoredUsers !== undefined ? impact.monitoredUsers.toLocaleString() : 'Live Sample'}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#070E1B] border border-[#14233c] space-y-1">
              <span className="text-[10px] text-slate-400 block font-bold uppercase">Failed Txns</span>
              <span className={`text-lg font-black block ${
                (impact.failedTransactions || 0) > 0 ? 'text-rose-400' : 'text-emerald-400'
              }`}>
                {impact.failedTransactions !== undefined ? impact.failedTransactions : 0}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#070E1B] border border-[#14233c] space-y-1 col-span-2">
              <span className="text-[10px] text-slate-400 block font-bold uppercase">Estimated Financial Exposure</span>
              <span className="text-xl font-black text-teal-300 block">
                {impact.estimatedFinancialExposure || '₹0.00'}
              </span>
            </div>
          </div>

          {/* Provenance note */}
          <div className="p-3.5 rounded-xl bg-[#050A14] border border-[#14233c] text-[11px] text-slate-400 space-y-1">
            <span className="text-teal-400 font-bold block">Telemetry Source</span>
            <p className="leading-relaxed">{impact.sourceNote}</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-[#14233c] hover:bg-[#1c3258] text-white font-bold text-xs transition-colors mt-6"
        >
          Close Impact Inspector
        </button>
      </div>
    </div>
  );
};
