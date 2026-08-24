'use client';

import React from 'react';

export interface VitalisTimelineEventItem {
  time: string;
  title: string;
  description: string;
  type: 'CHANGE' | 'DEVIATION' | 'INCIDENT' | 'EVIDENCE' | 'ACTION';
  source?: string;
  confidencePercent?: number;
}

interface VitalisTimelineProps {
  events: VitalisTimelineEventItem[];
}

export const VitalisTimeline: React.FC<VitalisTimelineProps> = ({ events }) => {
  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-white/[0.1]">
      {events.map((ev, i) => {
        let dotColor = 'bg-[#18D8D0]';
        if (ev.type === 'CHANGE') dotColor = 'bg-[#54A8FF]';
        if (ev.type === 'DEVIATION') dotColor = 'bg-[#F5B942]';
        if (ev.type === 'INCIDENT') dotColor = 'bg-[#FF5C69] animate-pulse';
        if (ev.type === 'ACTION') dotColor = 'bg-[#35D39A]';

        return (
          <div key={i} className="relative space-y-1">
            {/* Timeline Dot */}
            <span
              className={`absolute -left-6 top-1.5 w-3 h-3 rounded-full border-2 border-[#0b1422] ${dotColor}`}
            />

            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400 font-semibold">{ev.time}</span>
              {ev.source && (
                <span className="text-[10px] text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
                  {ev.source}
                </span>
              )}
            </div>

            <div className="font-bold text-[#F4F7FA] text-sm">{ev.title}</div>
            <p className="text-xs text-slate-300 leading-relaxed">{ev.description}</p>
          </div>
        );
      })}
    </div>
  );
};

export const VitalisConfidenceIndicator: React.FC<{ percent: number; label?: string }> = ({
  percent,
  label = 'RCA Confidence',
}) => {
  return (
    <div className="space-y-1.5 font-mono">
      <div className="flex justify-between text-xs">
        <span className="text-slate-400 uppercase tracking-wider text-[11px]">{label}</span>
        <span className="text-teal-300 font-bold">{percent}%</span>
      </div>
      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
        <div
          style={{ width: `${percent}%` }}
          className="h-full bg-gradient-to-r from-teal-400 to-emerald-400 rounded-full shadow-sm"
        />
      </div>
    </div>
  );
};
