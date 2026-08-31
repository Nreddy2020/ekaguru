import React from 'react';
import { ChevronRight, Folder, BookOpen } from 'lucide-react';
import { LearningStructureSection, SectionNode } from './LearningStructureSection';

export interface ChapterNode {
  id: string;
  chapterNumber: number;
  unitNumber?: number;
  title: string;
  pageStart?: number;
  pageEnd?: number;
  startPrintedPage?: number;
  endPrintedPage?: number;
  sections: SectionNode[];
}

export interface LearningStructureNodeProps {
  chapter: ChapterNode;
  isExpanded: boolean;
  activeSectionId?: string;
  onToggle: (chapterId: string) => void;
  onSelectSection: (section: SectionNode, chapter: ChapterNode) => void;
  className?: string;
}

/**
 * MODULE 03: Chapter Group Node
 * Renders an expandable chapter node with its child sections and page index range.
 */
export function LearningStructureNode({
  chapter,
  isExpanded,
  activeSectionId,
  onToggle,
  onSelectSection,
  className = '',
}: LearningStructureNodeProps) {
  const hasSections = chapter.sections && chapter.sections.length > 0;
  const containsActive = hasSections && chapter.sections.some((s) => s.id === activeSectionId);

  const startPage = chapter.startPrintedPage ?? chapter.pageStart;
  const endPage = chapter.endPrintedPage ?? chapter.pageEnd;

  return (
    <div
      role="treeitem"
      data-testid={`structure-chapter-${chapter.id}`}
      aria-expanded={isExpanded}
      className={`flex flex-col gap-1 rounded-xl transition-colors ${className}`}
    >
      {/* Chapter Accordion Trigger */}
      <button
        type="button"
        data-testid={`chapter-toggle-${chapter.id}`}
        aria-controls={`chapter-sections-${chapter.id}`}
        aria-expanded={isExpanded}
        onClick={() => onToggle(chapter.id)}
        className={`w-full text-left flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all select-none ${
          containsActive
            ? 'bg-white/10 text-white border border-white/10'
            : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <BookOpen
            className={`w-4 h-4 shrink-0 ${
              containsActive ? 'text-indigo-400' : 'text-slate-500'
            }`}
          />
          {(() => {
            const cleanTitle = chapter.title.replace(new RegExp('^' + chapter.chapterNumber + '\\.\\s*'), '');
            return (
              <>
                <span className="shrink-0 text-slate-400 font-semibold">{chapter.chapterNumber}.</span>
                <span className="truncate">{cleanTitle}</span>
              </>
            );
          })()}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {startPage !== undefined && (
            <span className="text-[10px] font-mono text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded">
              p. {startPage}{endPage ? `–${endPage}` : ''}
            </span>
          )}

          {/* Expand / Collapse Chevron */}
          <ChevronRight
            data-testid="chapter-chevron"
            className={`w-4 h-4 text-slate-500 shrink-0 transition-transform duration-200 ${
              isExpanded ? 'rotate-90 text-indigo-400' : ''
            }`}
          />
        </div>
      </button>

      {/* Child Sections Tree */}
      {isExpanded && hasSections && (
        <div
          id={`chapter-sections-${chapter.id}`}
          role="group"
          data-testid="chapter-sections"
          className="flex flex-col gap-1 pl-4 pr-1 py-1 border-l-2 border-slate-800/80 ml-4 animate-in fade-in slide-in-from-top-1 duration-150"
        >
          {chapter.sections.map((section) => (
            <LearningStructureSection
              key={section.id}
              section={section}
              isActive={section.id === activeSectionId}
              onSelect={(sec) => onSelectSection(sec, chapter)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
