'use client';

import React from 'react';
import { VitalisDrawer } from '../ui/VitalisDrawer';
import { VitalisStatusPill } from '../ui/VitalisBadge';

interface SubsystemDrawerProps {
  subsystem: { name: string; tier: string; score: number; status: string } | null;
  isOpen: boolean;
  onClose: () => void;
}

export const SubsystemDrawer: React.FC<SubsystemDrawerProps> = ({
  subsystem,
  isOpen,
  onClose,
}) => {
  if (!subsystem) return null;

  return (
    <VitalisDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={subsystem.name}
      subtitle={`Tier: ${subsystem.tier} • Health Score: ${subsystem.score}%`}
      widthClass="max-w-xl"
    >
      <div className="space-y-4 font-mono text-xs">
        <div className="flex items-center justify-between p-4 bg-[#08111d] rounded-xl border border-white/[0.06]">
          <div>
            <span className="text-slate-500 text-[10px] block">OPERATIONAL STATUS</span>
            <VitalisStatusPill status={subsystem.status} />
          </div>
          <div className="text-right">
            <span className="text-slate-500 text-[10px] block">SIGNAL FRESHNESS</span>
            <span className="text-emerald-400 font-bold">Live (2s ago)</span>
          </div>
        </div>

        <div className="p-4 bg-[#08111d] rounded-xl border border-white/[0.06] space-y-2 font-sans">
          <h4 className="font-bold text-white text-sm">Telemetry Collectors</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Real-time metrics collected via Prisma query hooks, process memory inspector, and storage I/O verification.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-[#08111d] rounded-lg border border-white/[0.06]">
            <span className="text-slate-500 text-[10px] block">P95 LATENCY</span>
            <span className="text-amber-400 text-sm font-bold">14 ms</span>
          </div>
          <div className="p-3 bg-[#08111d] rounded-lg border border-white/[0.06]">
            <span className="text-slate-500 text-[10px] block">ERROR RATE</span>
            <span className="text-emerald-400 text-sm font-bold">0.00%</span>
          </div>
        </div>
      </div>
    </VitalisDrawer>
  );
};
