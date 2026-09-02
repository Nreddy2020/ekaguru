'use client';

import React from 'react';
import { VitalisEnvironment } from '../../../lib/vitalis/domain/types';

interface VitalisContextHeaderProps {
  environment: VitalisEnvironment;
  region?: string;
  servicesCount?: number;
  activeService?: string;
  activeRequest?: string;
  timeRange?: string;
  onSelectTimeRange?: (range: string) => void;
}

export const VitalisContextHeader: React.FC<VitalisContextHeaderProps> = ({
  environment,
  region = 'Local Node',
  servicesCount = 4,
  activeService,
  activeRequest,
  timeRange = 'Last 15m',
  onSelectTimeRange,
}) => {
  return (
    <div className="bg-[#08111d] border-b border-white/[0.06] px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between text-xs font-mono text-slate-400 gap-3 shrink-0">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-[#18D8D0] font-bold">
          {environment === 'LAB'
            ? 'LAB · EKAGURU LIVE'
            : environment === 'DEMO'
            ? 'DEMO · ENTERPRISE SIMULATOR'
            : 'PROD · ENTERPRISE CLUSTERS'}
        </span>
        <span>•</span>
        <span>Region: <strong className="text-slate-200">{region}</strong></span>
        <span>•</span>
        <span>Services: <strong className="text-slate-200">{servicesCount}</strong></span>
        {activeService && (
          <>
            <span>•</span>
            <span>Service: <strong className="text-teal-300">{activeService}</strong></span>
          </>
        )}
        {activeRequest && (
          <>
            <span>•</span>
            <span>Focus: <strong className="text-amber-300">{activeRequest}</strong></span>
          </>
        )}
      </div>

      <div className="flex items-center gap-3 ml-auto">
        <div className="flex items-center gap-2 bg-[#050a12] px-2.5 py-1 rounded-lg border border-white/[0.06] text-[11px]">
          <span>⏱️ {timeRange}</span>
        </div>
        <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Nominal</span>
        </span>
      </div>
    </div>
  );
};
