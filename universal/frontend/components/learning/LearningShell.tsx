'use client';

import React from 'react';
import { Home, Compass, BookOpen, Network, TrendingUp, Users, Settings } from 'lucide-react';

export interface LearningShellProps {
  header?: React.ReactNode;
  leftRail?: React.ReactNode;
  children?: React.ReactNode;
  rightRail?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function LearningShell({
  header,
  leftRail,
  children,
  rightRail,
  footer,
  className = '',
}: LearningShellProps) {
  return (
    <div
      data-testid="learning-shell"
      className={`h-screen max-h-screen w-screen overflow-hidden bg-[#070b14] text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white ${className}`}
    >
      {/* Top Header Slot */}
      {header && (
        <header
          data-testid="learning-shell-header"
          className="shrink-0 z-40 w-full border-b border-slate-800/80 bg-[#0c1222]/95 backdrop-blur shadow-sm"
        >
          {header}
        </header>
      )}

      {/* Main Studio Body with Far-Left Global Rail */}
      <div
        data-testid="learning-shell-body"
        className="flex-1 min-h-0 flex w-full max-w-[1920px] mx-auto overflow-hidden"
      >
        {/* Far-Left Global Mini Nav Rail */}
        <nav
          data-testid="global-mini-nav"
          className="hidden md:flex flex-col items-center justify-between w-16 shrink-0 py-4 bg-[#080d1a] border-r border-slate-800/80 z-30"
        >
          <div className="flex flex-col items-center gap-5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center font-black text-white text-xs shadow-lg shadow-indigo-600/30">
              EK
            </div>

            <div className="flex flex-col items-center gap-3 pt-2">
              <button title="Home" className="p-2.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition">
                <Home className="w-4 h-4" />
              </button>
              <button title="Learn" className="p-2.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition">
                <Compass className="w-4 h-4" />
              </button>
              <button title="Library" className="p-2.5 rounded-xl bg-indigo-950 text-indigo-300 border border-indigo-500/40 shadow-sm transition">
                <BookOpen className="w-4 h-4" />
              </button>
              <button title="Knowledge Map" className="p-2.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition">
                <Network className="w-4 h-4" />
              </button>
              <button title="My Growth" className="p-2.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition">
                <TrendingUp className="w-4 h-4" />
              </button>
              <button title="For Parents" className="p-2.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition">
                <Users className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex flex-col items-center gap-3">
            <button title="Settings" className="p-2.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition">
              <Settings className="w-4 h-4" />
            </button>
            <div title="Arjun (Grade 5)" className="w-8 h-8 rounded-full bg-emerald-700/80 border border-emerald-500/40 flex items-center justify-center text-emerald-200 text-xs font-bold shadow-sm">
              A
            </div>
          </div>
        </nav>

        {/* Left Book Structure & Content Integrity Rail */}
        {leftRail && (
          <aside
            data-testid="learning-shell-left"
            className="w-full md:w-[280px] lg:w-[300px] xl:w-[320px] shrink-0 border-r border-slate-800/80 bg-[#090e1a] flex flex-col h-full overflow-hidden"
          >
            {leftRail}
          </aside>
        )}

        {/* Center Main Workspace */}
        <main
          data-testid="learning-shell-main"
          className="flex-1 min-w-0 flex flex-col h-full overflow-y-auto bg-[#070b14] p-4 sm:p-5 lg:p-6 gap-4 custom-scrollbar"
        >
          {children}
        </main>

        {/* Right Source Evidence Rail */}
        {rightRail && (
          <aside
            data-testid="learning-shell-right"
            className="hidden lg:flex lg:w-[260px] xl:w-[280px] 2xl:w-[300px] shrink-0 border-l border-slate-800/80 bg-[#090e1a] flex-col h-full overflow-y-auto p-4 custom-scrollbar"
          >
            {rightRail}
          </aside>
        )}
      </div>

      {/* Full-width Progression Footer */}
      {footer && (
        <footer
          data-testid="learning-shell-footer"
          className="shrink-0 z-30 w-full border-t border-slate-800/80 bg-[#0c1222]/95 backdrop-blur"
        >
          {footer}
        </footer>
      )}
    </div>
  );
}

export function LearningMain({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`flex flex-col gap-4 ${className}`}>{children}</div>;
}
