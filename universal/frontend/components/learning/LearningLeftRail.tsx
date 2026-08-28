'use client';

import React from 'react';
import { BookOpen, Eye } from 'lucide-react';

export interface LearningLeftRailProps {
  children?: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  bookTitle?: string;
  subjectGrade?: string;
  className?: string;
}

export function LearningLeftRail({
  children,
  header,
  footer,
  bookTitle = 'MY BODY',
  subjectGrade = 'Environmental Studies Class 5',
  className = '',
}: LearningLeftRailProps) {
  return (
    <div
      data-testid="learning-left-rail"
      className={`flex flex-col h-full justify-between bg-[#090e1a] text-slate-200 select-none ${className}`}
    >
      {/* Book Cover Identity Card */}
      <div className="p-3.5 border-b border-slate-800/80 bg-[#0b1222]">
        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#111a2e] border border-slate-700/60 shadow-sm">
          <div className="w-10 h-13 rounded-lg bg-gradient-to-br from-emerald-600 via-teal-700 to-indigo-800 flex flex-col justify-between p-1.5 shadow-md shrink-0">
            <BookOpen className="w-3.5 h-3.5 text-white/90" />
            <span className="text-[7px] font-black text-emerald-200 uppercase tracking-tighter">CBSE</span>
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-bold text-slate-100 truncate">{bookTitle}</h4>
            <p className="text-[10px] text-slate-400 truncate">{subjectGrade}</p>
            <div className="flex items-center gap-1 mt-1 text-[10px] font-semibold text-indigo-300">
              <Eye className="w-3 h-3" />
              <span>Preview Book</span>
            </div>
          </div>
        </div>
      </div>

      {header && (
        <div data-testid="learning-left-rail-header" className="shrink-0">
          {header}
        </div>
      )}

      {/* Middle Scrollable Section: Book Structure Tree */}
      <div
        data-testid="learning-left-rail-content"
        className="flex-1 overflow-y-auto min-h-0 custom-scrollbar p-3"
      >
        {children}
      </div>

      {/* Bottom Pinned Footer: Content Integrity */}
      {footer && (
        <div
          data-testid="learning-left-rail-footer"
          className="shrink-0 border-t border-slate-800/80 bg-[#0c1424] p-3"
        >
          {footer}
        </div>
      )}
    </div>
  );
}
