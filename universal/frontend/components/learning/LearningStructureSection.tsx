import React from 'react';
import { CheckCircle2, FileText } from 'lucide-react';

export interface SectionNode {
  id: string;
  sectionNumber: string;
  title: string;
  pageStart?: number;
  pageEnd?: number;
  printedPage?: number;
  isCompleted?: boolean;
}

export interface LearningStructureSectionProps {
  section: SectionNode;
  isActive: boolean;
  onSelect: (section: SectionNode) => void;
  className?: string;
}

/**
 * MODULE 03: Section / Topic Leaf Node
 * Renders an individual section within an expanded chapter with single numbering and printed page index tag.
 */
export function LearningStructureSection({
  section,
  isActive,
  onSelect,
  className = '',
}: LearningStructureSectionProps) {
  const handleClick = () => {
    onSelect(section);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(section);
    }
  };

  const pageIndex = section.printedPage ?? section.pageStart;

  // Clean title to avoid duplicate numbering (e.g. "1.1 1.1 Living Things" -> "Living Things")
  const escapedNumber = (section.sectionNumber || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const cleanTitle = section.title.replace(new RegExp('^' + escapedNumber + '\\s*'), '');

  return (
    <button
      type="button"
      role="treeitem"
      data-testid={`structure-section-${section.id}`}
      aria-selected={isActive}
      aria-current={isActive ? 'page' : undefined}
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`w-full text-left flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all select-none group ${
        isActive
          ? 'bg-indigo-950/80 text-white font-bold border border-indigo-500/50 shadow-sm shadow-indigo-950/50'
          : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
      } ${className}`}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <FileText
          className={`w-3.5 h-3.5 shrink-0 ${
            isActive ? 'text-indigo-400' : 'text-slate-600 group-hover:text-slate-400'
          }`}
        />
        {section.sectionNumber && (
          <span className={`shrink-0 ${isActive ? 'text-indigo-300 font-black' : 'text-slate-500'}`}>
            {section.sectionNumber}
          </span>
        )}
        <span className="truncate flex-1">{cleanTitle}</span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {pageIndex !== undefined && (
          <span
            className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md ${
              isActive
                ? 'bg-indigo-500/30 text-indigo-200 border border-indigo-500/40'
                : 'bg-slate-800/80 text-slate-400 group-hover:text-slate-300'
            }`}
          >
            p. {pageIndex}
          </span>
        )}

        {/* Completion or Active Check Indicator */}
        {(section.isCompleted || isActive) && (
          <CheckCircle2
            className={`w-3.5 h-3.5 shrink-0 ${
              isActive
                ? 'text-emerald-400 drop-shadow-[0_0_6px_rgba(52,211,153,0.4)]'
                : 'text-emerald-500/70'
            }`}
          />
        )}
      </div>
    </button>
  );
}
