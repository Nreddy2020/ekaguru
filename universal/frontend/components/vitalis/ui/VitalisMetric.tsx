'use client';

import React from 'react';

interface VitalisMetricProps {
  label: string;
  value: string | number;
  unit?: string;
  statusText?: string;
  statusType?: 'HEALTHY' | 'DEVIATION' | 'AT_RISK' | 'IMPACTED';
  trend?: string;
  trendPositive?: boolean;
  subtext?: string;
  sparkline?: number[];
}

export const VitalisMetric: React.FC<VitalisMetricProps> = ({
  label,
  value,
  unit,
  statusText,
  statusType = 'HEALTHY',
  trend,
  trendPositive = true,
  subtext,
  sparkline = [40, 50, 45, 60, 55, 70, 65, 80],
}) => {
  return (
    <div className="bg-[#0b1422] border border-white/[0.08] rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col justify-between space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          {label}
        </span>
        {statusText && (
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono ${
              statusType === 'HEALTHY'
                ? 'bg-[#35D39A]/15 text-[#35D39A] border border-[#35D39A]/30'
                : statusType === 'IMPACTED'
                ? 'bg-[#FF5C69]/15 text-[#FF5C69] border border-[#FF5C69]/30 animate-pulse'
                : 'bg-[#F5B942]/15 text-[#F5B942] border border-[#F5B942]/30'
            }`}
          >
            {statusText}
          </span>
        )}
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-3xl sm:text-4xl font-extrabold text-[#F4F7FA] font-mono tracking-tight">
          {value}
        </span>
        {unit && <span className="text-xs text-slate-400 font-mono">{unit}</span>}
      </div>

      {/* Sparkline & Subtext Footer */}
      <div className="flex items-center justify-between text-xs pt-2 border-t border-white/[0.06]">
        {trend ? (
          <span
            className={`text-[11px] font-semibold flex items-center gap-1 ${
              trendPositive ? 'text-[#35D39A]' : 'text-[#FF5C69]'
            }`}
          >
            {trend}
          </span>
        ) : (
          <span className="text-[11px] text-slate-400">{subtext || 'Nominal telemetry'}</span>
        )}

        {/* Minimalist Micro Sparkline */}
        <div className="flex items-end gap-1 h-3.5">
          {sparkline.map((val, i) => (
            <div
              key={i}
              style={{ height: `${Math.max(20, Math.min(100, val))}%` }}
              className="w-1 bg-[#18D8D0]/60 rounded-full"
            />
          ))}
        </div>
      </div>
    </div>
  );
};
