'use client';

import React from 'react';
import { Tag, Target, Sparkles, Download, ChevronRight, HelpCircle, Sliders } from 'lucide-react';

export interface ActionItem {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick?: () => void;
}

export interface LearningRightRailProps {
  conceptTitle?: string;
  chapterTitle?: string;
  sectionTitle?: string;
  bookTitle?: string;
  pageNumber?: number;
  learningOutcome?: string;
  actions?: ActionItem[];
  children?: React.ReactNode;
  className?: string;
}

export function LearningRightRail({
  conceptTitle,
  chapterTitle,
  sectionTitle,
  bookTitle,
  pageNumber,
  learningOutcome,
  actions,
  children,
  className = '',
}: LearningRightRailProps) {
  if (children) {
    return <div className={`flex flex-col gap-4 ${className}`}>{children}</div>;
  }

  const defaultActions: ActionItem[] = [
    {
      id: 'edit-mappings',
      title: 'Edit Mappings',
      description: 'Review and edit concept connections',
      icon: Sliders,
    },
    {
      id: 'add-learning-outcome',
      title: 'Add Learning Outcome',
      description: 'Create new outcomes for this concept',
      icon: Target,
    },
    {
      id: 'generate-questions',
      title: 'Generate Questions',
      description: 'Create practice questions',
      icon: HelpCircle,
    },
    {
      id: 'export-knowledge-layer',
      title: 'Export Knowledge Layer',
      description: 'Download as JSON / CSV',
      icon: Download,
    },
  ];

  const actionItems = actions || defaultActions;

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {/* Actions Card */}
      <div className="p-4 rounded-2xl bg-[#0c1424] border border-slate-800/80 shadow-md">
        <h3 className="text-sm font-bold text-white tracking-wide mb-3">
          Actions
        </h3>

        <div className="flex flex-col gap-2">
          {actionItems.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                type="button"
                onClick={action.onClick}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-[#111c30]/80 hover:bg-[#162540] border border-slate-800/60 hover:border-slate-700/80 transition-all text-left group"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-lg bg-slate-800/70 group-hover:bg-indigo-950/70 border border-slate-700/50 group-hover:border-indigo-500/40 flex items-center justify-center shrink-0 transition-colors">
                    <Icon className="w-4 h-4 text-slate-400 group-hover:text-indigo-300 transition-colors" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-slate-200 group-hover:text-white truncate">
                      {action.title}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">
                      {action.description}
                    </div>
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 shrink-0 ml-2 transition-transform group-hover:translate-x-0.5" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
