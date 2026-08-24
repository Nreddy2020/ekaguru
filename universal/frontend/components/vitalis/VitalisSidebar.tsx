'use client';

import React from 'react';

export type VitalisNavSection =
  | 'COMMAND_CENTER'
  | 'LIVE_REQUESTS'
  | 'REQUEST_JOURNEYS'
  | 'APP_INVENTORY'
  | 'TOPOLOGY'
  | 'PERFORMANCE'
  | 'HEALTH'
  | 'ERRORS'
  | 'CAPACITY'
  | 'BUSINESS_IMPACT'
  | 'CHANGE_INTELLIGENCE'
  | 'COMPATIBILITY'
  | 'SECURITY'
  | 'EVIDENCE_RCA'
  | 'PREDICTIVE_RISK'
  | 'WHAT_IF'
  | 'CONTINUOUS_LEARNING'
  | 'CONDITIONS_ALERTS'
  | 'ACTIONS_RUNBOOKS'
  | 'EXECUTIVE_REPORTS';

interface VitalisSidebarProps {
  activeNav: VitalisNavSection;
  onSelectNav: (nav: VitalisNavSection) => void;
  activeIncidentsCount?: number;
  onOpenUpload: () => void;
}

interface NavItem {
  id: VitalisNavSection;
  label: string;
  icon: string;
  badge?: number;
}

interface NavGroup {
  groupName: string;
  items: NavItem[];
}

export const VitalisSidebar: React.FC<VitalisSidebarProps> = ({
  activeNav,
  onSelectNav,
  activeIncidentsCount = 0,
  onOpenUpload,
}) => {
  const navGroups: NavGroup[] = [
    {
      groupName: 'Overview',
      items: [{ id: 'COMMAND_CENTER', label: 'Command Center', icon: '◉' }],
    },
    {
      groupName: 'Observe',
      items: [
        { id: 'LIVE_REQUESTS', label: 'Live Requests', icon: '↗' },
        { id: 'REQUEST_JOURNEYS', label: 'Request Journeys', icon: '◎' },
      ],
    },
    {
      groupName: 'Environment',
      items: [
        { id: 'APP_INVENTORY', label: 'Application Inventory', icon: '▦' },
        { id: 'TOPOLOGY', label: 'Topology Map', icon: '⌘' },
      ],
    },
    {
      groupName: 'Health & Impact',
      items: [
        { id: 'PERFORMANCE', label: 'Performance', icon: '◒' },
        { id: 'HEALTH', label: 'Subsystem Health', icon: '♥' },
        { id: 'BUSINESS_IMPACT', label: 'Business Impact', icon: '◈' },
        { id: 'ERRORS', label: 'Errors & Anomalies', icon: '△', badge: activeIncidentsCount },
        { id: 'CAPACITY', label: 'Capacity', icon: '◌' },
      ],
    },
    {
      groupName: 'Intelligence',
      items: [
        { id: 'EVIDENCE_RCA', label: 'Evidence & RCA', icon: '⌕' },
        { id: 'CHANGE_INTELLIGENCE', label: 'Change Timeline', icon: '⇄' },
        { id: 'PREDICTIVE_RISK', label: 'Predictive Risk', icon: '◇' },
        { id: 'WHAT_IF', label: 'What-If Simulation', icon: '✦' },
        { id: 'CONTINUOUS_LEARNING', label: 'Continuous Learning', icon: '∞' },
      ],
    },
    {
      groupName: 'Action',
      items: [
        { id: 'CONDITIONS_ALERTS', label: 'Conditions & Alerts', icon: '◇' },
        { id: 'ACTIONS_RUNBOOKS', label: 'Actions & Runbooks', icon: '⚙' },
        { id: 'EXECUTIVE_REPORTS', label: 'Executive Reports', icon: '▤' },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-[#08101D]/70 backdrop-blur-xl border-r border-white/[0.06] p-4 flex flex-col justify-between h-full overflow-y-auto shrink-0 select-none">
      <div className="space-y-6">
        {/* Upload Hub Pill */}
        <button
          onClick={onOpenUpload}
          className="w-full py-3 px-4 rounded-2xl bg-teal-500/10 border border-teal-500/25 text-teal-300 font-semibold text-xs flex items-center justify-center gap-2 hover:bg-teal-500/20 transition-all shadow-sm"
        >
          <span className="text-base font-bold">＋</span>
          <span className="tracking-wide">Upload Evidence</span>
        </button>

        {/* Navigation Groups */}
        <div className="space-y-5">
          {navGroups.map((group) => (
            <div key={group.groupName} className="space-y-1">
              <div className="text-[11px] font-semibold text-slate-400 px-3 tracking-tight">
                {group.groupName}
              </div>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = activeNav === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onSelectNav(item.id)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition-all text-left ${
                        isActive
                          ? 'bg-teal-500/15 text-teal-300 font-semibold shadow-xs'
                          : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`text-sm ${isActive ? 'text-teal-400' : 'text-slate-500'}`}>
                          {item.icon}
                        </span>
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-mono">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Safe Telemetry Status */}
      <div className="pt-4 border-t border-white/[0.06] text-xs text-slate-500 space-y-1 px-1">
        <div className="text-teal-400 font-semibold flex items-center gap-1.5 text-xs">
          <span>🔒</span>
          <span>Safe Observation</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-snug">PII auto-masked before canonical indexing.</p>
      </div>
    </aside>
  );
};
