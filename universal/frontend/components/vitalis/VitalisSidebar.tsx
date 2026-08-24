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
      groupName: 'OVERVIEW',
      items: [{ id: 'COMMAND_CENTER', label: 'Command Center', icon: '◉' }],
    },
    {
      groupName: 'OBSERVE',
      items: [
        { id: 'LIVE_REQUESTS', label: 'Live Requests', icon: '⚡' },
        { id: 'REQUEST_JOURNEYS', label: 'Request Journeys', icon: '◎' },
      ],
    },
    {
      groupName: 'ENVIRONMENT',
      items: [
        { id: 'APP_INVENTORY', label: 'Application Inventory', icon: '▦' },
        { id: 'TOPOLOGY', label: 'Topology Map', icon: '⌘' },
      ],
    },
    {
      groupName: 'HEALTH & IMPACT',
      items: [
        { id: 'PERFORMANCE', label: 'Performance', icon: '◒' },
        { id: 'HEALTH', label: 'Subsystem Health', icon: '♥' },
        { id: 'BUSINESS_IMPACT', label: 'Business Impact', icon: '◈' },
        { id: 'ERRORS', label: 'Errors & Anomalies', icon: '△', badge: activeIncidentsCount },
        { id: 'CAPACITY', label: 'Capacity Intelligence', icon: '◌' },
      ],
    },
    {
      groupName: 'INTELLIGENCE',
      items: [
        { id: 'EVIDENCE_RCA', label: 'Evidence & RCA', icon: '⌕' },
        { id: 'CHANGE_INTELLIGENCE', label: 'Change Timeline', icon: '⇄' },
        { id: 'PREDICTIVE_RISK', label: 'Predictive Risk', icon: '◇' },
        { id: 'WHAT_IF', label: 'What-If Simulation', icon: '✦' },
        { id: 'CONTINUOUS_LEARNING', label: 'Continuous Learning', icon: '∞' },
      ],
    },
    {
      groupName: 'ACTION & REPORT',
      items: [
        { id: 'CONDITIONS_ALERTS', label: 'Conditions & Alerts', icon: '◇' },
        { id: 'ACTIONS_RUNBOOKS', label: 'Actions & Runbooks', icon: '⚙' },
        { id: 'EXECUTIVE_REPORTS', label: 'Executive Reports', icon: '▤' },
      ],
    },
  ];

  return (
    <aside className="w-72 bg-[#09111f] border-r border-white/[0.1] p-5 flex flex-col justify-between h-full overflow-y-auto shrink-0 select-none">
      <div className="space-y-6">
        {/* Upload Action */}
        <button
          onClick={onOpenUpload}
          className="w-full py-3.5 px-4 rounded-2xl bg-teal-500/20 border border-teal-500/40 text-teal-300 font-bold text-sm flex items-center justify-center gap-2.5 hover:bg-teal-500/30 transition-all shadow-md"
        >
          <span className="text-lg">＋</span>
          <span>Upload Evidence</span>
        </button>

        {/* Navigation Groups */}
        <div className="space-y-6">
          {navGroups.map((group) => (
            <div key={group.groupName} className="space-y-1.5">
              <div className="text-xs font-extrabold text-slate-400 uppercase tracking-widest px-3">
                {group.groupName}
              </div>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = activeNav === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onSelectNav(item.id)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-semibold transition-all text-left ${
                        isActive
                          ? 'bg-teal-500/25 text-teal-300 font-bold border border-teal-500/40 shadow-sm'
                          : 'text-slate-300 hover:bg-white/[0.06] hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`text-base ${isActive ? 'text-teal-400 font-bold' : 'text-slate-400'}`}>
                          {item.icon}
                        </span>
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-500/25 text-rose-300 border border-rose-500/40 font-mono">
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
      <div className="pt-5 border-t border-white/[0.1] text-xs text-slate-400 space-y-1.5 px-2">
        <div className="text-teal-400 font-bold flex items-center gap-2 text-sm">
          <span>🔒</span>
          <span>Safe Observation</span>
        </div>
        <p className="text-xs text-slate-400 leading-snug">PII automatically masked before canonical indexing.</p>
      </div>
    </aside>
  );
};
