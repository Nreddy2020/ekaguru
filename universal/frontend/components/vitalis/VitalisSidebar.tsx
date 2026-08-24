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
  | 'EXECUTIVE_REPORTS'
  | 'UPLOAD_EVIDENCE';

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
      groupName: 'COMMAND',
      items: [{ id: 'COMMAND_CENTER', label: 'Command Center', icon: '◉' }],
    },
    {
      groupName: 'REQUEST',
      items: [
        { id: 'LIVE_REQUESTS', label: 'Live Requests', icon: '⚡' },
        { id: 'REQUEST_JOURNEYS', label: 'Request Journeys', icon: '◇' },
      ],
    },
    {
      groupName: 'ENVIRONMENT',
      items: [
        { id: 'APP_INVENTORY', label: 'Application Inventory', icon: '▦' },
        { id: 'TOPOLOGY', label: 'Topology & Dependencies', icon: '⛓' },
      ],
    },
    {
      groupName: 'HEALTH',
      items: [
        { id: 'PERFORMANCE', label: 'Performance', icon: '◒' },
        { id: 'HEALTH', label: 'Subsystem Health', icon: '♥' },
        { id: 'ERRORS', label: 'Errors & Anomalies', icon: '△', badge: activeIncidentsCount },
        { id: 'CAPACITY', label: 'Capacity Intelligence', icon: '◔' },
      ],
    },
    {
      groupName: 'IMPACT',
      items: [
        { id: 'BUSINESS_IMPACT', label: 'Business Impact', icon: '◈' },
        { id: 'CHANGE_INTELLIGENCE', label: 'Change Intelligence', icon: '⇄' },
        { id: 'COMPATIBILITY', label: 'Compatibility Matrix', icon: '⧉' },
        { id: 'SECURITY', label: 'Security & Safe Data', icon: '🔒' },
      ],
    },
    {
      groupName: 'INTELLIGENCE',
      items: [
        { id: 'EVIDENCE_RCA', label: 'Evidence & RCA', icon: '◉' },
        { id: 'PREDICTIVE_RISK', label: 'Predictive Risk', icon: '◇' },
        { id: 'WHAT_IF', label: 'What-If Simulation', icon: '⌁' },
        { id: 'CONTINUOUS_LEARNING', label: 'Continuous Learning', icon: '◎' },
      ],
    },
    {
      groupName: 'ACTION',
      items: [
        { id: 'CONDITIONS_ALERTS', label: 'Conditions & Alerts', icon: '◇' },
        { id: 'ACTIONS_RUNBOOKS', label: 'Actions & Runbooks', icon: '⚙' },
      ],
    },
    {
      groupName: 'REPORTING',
      items: [{ id: 'EXECUTIVE_REPORTS', label: 'Executive Reports', icon: '▤' }],
    },
  ];

  return (
    <aside className="w-60 bg-[#080e1a] border-r border-slate-800/80 p-3.5 flex flex-col justify-between h-full overflow-y-auto shrink-0 select-none">
      <div className="space-y-4">
        {/* Quick Upload Action */}
        <button
          onClick={onOpenUpload}
          className="w-full py-2.5 px-3 rounded-lg bg-teal-500/15 border border-teal-500/40 text-teal-300 font-semibold text-xs flex items-center justify-center gap-2 hover:bg-teal-500/25 transition-all shadow-sm"
        >
          <span className="text-sm">＋</span>
          <span>Upload Evidence</span>
        </button>

        {/* Grouped Navigation */}
        <div className="space-y-3.5">
          {navGroups.map((group) => (
            <div key={group.groupName} className="space-y-1">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2.5 pt-0.5">
                {group.groupName}
              </div>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = activeNav === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onSelectNav(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all text-left ${
                        isActive
                          ? 'bg-teal-500/20 text-teal-300 border-l-2 border-teal-400 font-semibold shadow-sm pl-2.5'
                          : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`text-xs ${isActive ? 'text-teal-400' : 'text-slate-500'}`}>
                          {item.icon}
                        </span>
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 font-mono">
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
      <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-500 space-y-1">
        <div className="text-teal-400 font-semibold flex items-center gap-1.5 text-xs">
          <span>🔒</span>
          <span>Safe Observation</span>
        </div>
        <p className="leading-tight text-[10px] text-slate-400">PII auto-redacted before canonical indexing.</p>
      </div>
    </aside>
  );
};
