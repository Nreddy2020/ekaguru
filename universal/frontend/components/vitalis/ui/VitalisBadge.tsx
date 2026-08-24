'use client';

import React from 'react';

export type VitalisStatusType =
  | 'HEALTHY'
  | 'DEVIATION'
  | 'AT_RISK'
  | 'IMPACTED'
  | 'ANALYZING'
  | 'PREDICTED'
  | 'NO_SIGNAL'
  | 'INFO';

interface VitalisBadgeProps {
  status: VitalisStatusType | string;
  label?: string;
  size?: 'sm' | 'md';
}

export const VitalisStatusPill: React.FC<VitalisBadgeProps> = ({
  status,
  label,
  size = 'md',
}) => {
  const normStatus = status.toUpperCase().replace('-', '_');

  let style = 'bg-slate-800 text-slate-300 border-slate-700';
  let dotColor = 'bg-slate-400';
  let text = label || status;

  if (normStatus === 'HEALTHY' || normStatus === 'OK' || normStatus === 'COMPLIANT' || normStatus === 'SUCCESS') {
    style = 'bg-[#35D39A]/15 text-[#35D39A] border-[#35D39A]/30';
    dotColor = 'bg-[#35D39A] shadow-sm shadow-[#35D39A]/50';
    if (!label) text = 'HEALTHY';
  } else if (normStatus === 'DEVIATION' || normStatus === 'WARNING' || normStatus === 'DEGRADED') {
    style = 'bg-[#F5B942]/15 text-[#F5B942] border-[#F5B942]/30';
    dotColor = 'bg-[#F5B942] shadow-sm shadow-[#F5B942]/50';
    if (!label) text = 'DEVIATION';
  } else if (normStatus === 'IMPACTED' || normStatus === 'CRITICAL' || normStatus === 'ERROR' || normStatus === 'FAILED') {
    style = 'bg-[#FF5C69]/15 text-[#FF5C69] border-[#FF5C69]/30';
    dotColor = 'bg-[#FF5C69] animate-pulse shadow-sm shadow-[#FF5C69]/50';
    if (!label) text = 'IMPACTED';
  } else if (normStatus === 'AT_RISK') {
    style = 'bg-[#F5B942]/20 text-[#F5B942] border-[#F5B942]/40';
    dotColor = 'bg-[#F5B942] animate-pulse';
    if (!label) text = 'AT RISK';
  } else if (normStatus === 'ANALYZING' || normStatus === 'IN_PROGRESS') {
    style = 'bg-[#18D8D0]/15 text-[#18D8D0] border-[#18D8D0]/30';
    dotColor = 'bg-[#18D8D0] animate-pulse';
    if (!label) text = 'ANALYZING';
  } else if (normStatus === 'PREDICTED') {
    style = 'bg-[#9B8CFF]/15 text-[#9B8CFF] border-[#9B8CFF]/30';
    dotColor = 'bg-[#9B8CFF]';
    if (!label) text = 'PREDICTED';
  } else if (normStatus === 'NO_SIGNAL' || normStatus === 'UNKNOWN') {
    style = 'bg-slate-800/80 text-slate-400 border-slate-700';
    dotColor = 'bg-slate-500';
    if (!label) text = 'NO SIGNAL';
  }

  const padding = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-[11px]';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-bold font-mono border uppercase tracking-wider ${padding} ${style}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      <span>{text}</span>
    </span>
  );
};
