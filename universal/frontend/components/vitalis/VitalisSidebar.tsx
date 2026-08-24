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
    <aside className="w-60 bg-[#08101D] border-r border-[#1a2942] p-3 flex flex-col justify-between h-[calc(100vh-3.5rem)] overflow-y-auto shrink-0 select-none space-y-4">
      <div className="space-y-4">
        {/* Upload Action */}
        <button
          onClick={onOpenUpload}
          className="w-full py-2.5 px-3 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-300 font-bold text-xs flex items-center justify-center gap-2 hover:bg-teal-500/25 transition-all shadow-sm"
        >
          <span className="text-sm font-bold">＋</span>
          <span>Upload Evidence</span>
        </button>

        {/* Navigation Groups */}
        <div className="space-y-4">
          {navGroups.map((group) => (
            <div key={group.groupName} className="space-y-1">
              <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-2.5">
                {group.groupName}
              </div>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = activeNav === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onSelectNav(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all text-left ${
                        isActive
                          ? 'bg-teal-500/20 text-teal-300 font-bold border border-teal-500/35 shadow-xs'
                          : 'text-slate-300 hover:bg-white/[0.05] hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`text-sm ${isActive ? 'text-teal-400 font-bold' : 'text-slate-400'}`}>
                          {item.icon}
                        </span>
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-rose-500/25 text-rose-300 border border-rose-500/40 font-mono">
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

      {/* Footer Status */}
      <div className="pt-3 pb-1 border-t border-white/[0.08] text-[11px] text-slate-400 space-y-1 px-1">
        <div className="text-teal-400 font-bold flex items-center gap-1.5">
          <span>🔒</span>
          <span>Safe Observation</span>
        </div>
        <p className="text-[10px] text-slate-400 leading-snug">PII auto-masked before canonical indexing.</p>
      </div>
    </aside>
  );
};
