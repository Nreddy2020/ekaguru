import React, { useState, useEffect } from 'react';
import { Layers, BookOpen, Sparkles, Activity, FileCheck, Award } from 'lucide-react';
import { LearningStructureNode, ChapterNode } from './LearningStructureNode';
import { SectionNode } from './LearningStructureSection';

export interface CurriculumItem {
  id: string;
  type: 'chapter' | 'special' | 'assessment' | 'test';
  subType?: 'art' | 'fitness';
  title: string;
  chapterNumber?: number;
  printedPage?: number;
  startPrintedPage?: number;
  endPrintedPage?: number;
  pdfPage?: number;
  side?: 'left' | 'right' | 'full';
  sections?: SectionNode[];
  content?: string;
  resolvedSource?: any;
}

export interface UnitNode {
  id: string;
  unitNumber: number;
  title: string;
  items?: CurriculumItem[];
  chapters?: ChapterNode[];
}

export interface LearningStructureData {
  material?: {
    id: string;
    title: string;
    subtitle?: string;
  };
  units?: UnitNode[];
  chapters?: ChapterNode[];
}

export interface LearningBookStructureProps {
  structure?: LearningStructureData;
  activeSectionId?: string;
  onSelectSection: (section: any, chapter: any) => void;
  className?: string;
}

export function LearningBookStructure({
  structure,
  activeSectionId,
  onSelectSection,
  className = '',
}: LearningBookStructureProps) {
  const chapters = structure?.chapters || [];
  const units = structure?.units || [];

  const [expandedChapterIds, setExpandedChapterIds] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    if (activeSectionId && chapters.length > 0) {
      const parentChap = chapters.find((c) =>
        c?.sections && c.sections.some((s) => s?.id === activeSectionId)
      );
      if (parentChap) {
        initial.add(parentChap.id);
      } else if (chapters.length > 0) {
        initial.add(chapters[0].id);
      }
    } else if (chapters.length > 0) {
      initial.add(chapters[0].id);
    }
    return initial;
  });

  useEffect(() => {
    if (activeSectionId && chapters.length > 0) {
      const parentChap = chapters.find((c) =>
        c?.sections && c.sections.some((s) => s?.id === activeSectionId)
      );
      if (parentChap) {
        setExpandedChapterIds((prev) => new Set(prev).add(parentChap.id));
      }
    }
  }, [activeSectionId, chapters]);

  const handleToggleChapter = (chapterId: string) => {
    setExpandedChapterIds((prev) => {
      const next = new Set(prev);
      if (next.has(chapterId)) {
        next.delete(chapterId);
      } else {
        next.add(chapterId);
      }
      return next;
    });
  };

  const isTocActive = activeSectionId === 'toc-index';

  const handleSelectToc = () => {
    const tocSection = {
      id: 'toc-index',
      sourceIndex: 1,
      startSourceIndex: 1,
      sectionNumber: 'TOC',
      title: 'Table of Contents & Book Index',
      pageStart: 1,
      pageEnd: 1,
      printedPage: 1,
      side: 'full',
      resolvedSource: { pdfPage: 1, printedPage: 1, side: 'full', rotation: 0 },
    };
    const tocChapter = {
      id: 'chap-toc',
      sourceIndex: 1,
      startSourceIndex: 1,
      chapterNumber: 0,
      title: 'Table of Contents',
      sections: [tocSection],
    };
    onSelectSection(tocSection, tocChapter);
  };

  const handleSelectSpecial = (item: any, unitTitle: string) => {
    const sIndex =
      item.startSequenceIndex ??
      item.sequenceIndex ??
      item.startSourceIndex ??
      item.sourceIndex ??
      (item.printedPage !== undefined ? (item.printedPage === 1 ? 2 : item.printedPage + 1) : 1);

    const specialSection = {
      id: item.id,
      sequenceIndex: sIndex,
      startSequenceIndex: sIndex,
      sourceIndex: sIndex,
      startSourceIndex: sIndex,
      sectionNumber: item.type === 'special' ? '★' : item.type === 'assessment' ? '📝' : '📋',
      title: item.title,
      printedPage: item.printedPage,
      pageStart: item.pdfPage,
      side: item.side || 'full',
      content: item.content,
      resolvedSource: item.resolvedSource,
    };
    const parentChap = {
      id: item.id,
      sequenceIndex: sIndex,
      startSequenceIndex: sIndex,
      sourceIndex: sIndex,
      startSourceIndex: sIndex,
      chapterNumber: 0,
      title: item.title,
      unitTitle,
      sections: [specialSection],
    };
    onSelectSection(specialSection, parentChap);
  };

  return (
    <div
      data-testid="learning-book-structure"
      className={`flex flex-col gap-3 select-none ${className}`}
    >
      {/* Sidebar Header */}
      <div
        data-testid="book-root-anchor"
        className="flex items-center justify-between pb-2.5 border-b border-slate-800/80"
      >
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-black uppercase tracking-wider text-slate-300">
            {structure?.material?.title || 'Book Index & Structure'}
          </span>
        </div>
        <span className="text-[11px] font-semibold text-slate-500">
          {chapters.length || 18} Chapters
        </span>
      </div>

      {/* Direct Table of Contents / Index Root Item */}
      <button
        type="button"
        onClick={handleSelectToc}
        className={`w-full text-left flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all select-none border ${
          isTocActive
            ? 'bg-indigo-950/90 text-indigo-200 border-indigo-500/60 shadow-sm shadow-indigo-950/60'
            : 'bg-slate-900/50 hover:bg-slate-800/60 text-slate-300 border-slate-800/60 hover:border-slate-700'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <BookOpen className={`w-4 h-4 ${isTocActive ? 'text-indigo-400' : 'text-amber-400'}`} />
          <span>📖 Table of Contents (Index)</span>
        </div>
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
          p. 1
        </span>
      </button>

      {/* Hierarchy: Units, Chapters, Specials, and Assessments */}
      <div className="flex flex-col gap-4 mt-1" role="tree" aria-label="Book Structure Hierarchy">
        {units.length > 0 ? (
          units.map((unit) => {
            const items = unit.items || (unit.chapters || []).map((c: any) => ({ ...c, type: 'chapter' }));
            const chapterCount = items.filter((it: any) => it.type === 'chapter').length;

            return (
              <div key={unit.id} className="flex flex-col gap-2">
                <div className="px-2 py-1 bg-slate-900/40 rounded-lg border border-slate-800/40 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400/90">
                    {unit.title}
                  </span>
                  <span className="text-[9px] font-mono text-slate-500">
                    {chapterCount} chap
                  </span>
                </div>

                <div className="flex flex-col gap-1.5 pl-1">
                  {items.map((item: any) => {
                    if (item.type === 'chapter') {
                      return (
                        <LearningStructureNode
                          key={item.id}
                          chapter={item}
                          isExpanded={expandedChapterIds.has(item.id)}
                          activeSectionId={activeSectionId}
                          onToggle={handleToggleChapter}
                          onSelectSection={(sec) => onSelectSection(sec, item)}
                        />
                      );
                    }

                    // Render Special / Assessment / Test item
                    const isSpecialActive = activeSectionId === item.id;
                    const isArt = item.subType === 'art';
                    const isFitness = item.subType === 'fitness';
                    const isAssessment = item.type === 'assessment' || item.type === 'test';

                    const Icon = isArt ? Sparkles : isFitness ? Activity : isAssessment ? Award : FileCheck;
                    const iconColor = isArt ? 'text-purple-400' : isFitness ? 'text-emerald-400' : 'text-amber-400';

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectSpecial(item, unit.title)}
                        className={`w-full text-left flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all select-none border ${
                          isSpecialActive
                            ? 'bg-indigo-950/80 text-white font-bold border-indigo-500/50 shadow-sm shadow-indigo-950/50'
                            : 'bg-slate-900/30 hover:bg-slate-800/50 text-slate-300 border-slate-800/40 hover:border-slate-700/60'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <Icon className={`w-3.5 h-3.5 shrink-0 ${iconColor}`} />
                          <span className="truncate flex-1">
                            {item.title}
                          </span>
                        </div>
                        {item.printedPage && (
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded shrink-0">
                            p. {item.printedPage}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col gap-1.5">
            {chapters.map((chapter) => (
              <LearningStructureNode
                key={chapter.id}
                chapter={chapter}
                isExpanded={expandedChapterIds.has(chapter.id)}
                activeSectionId={activeSectionId}
                onToggle={handleToggleChapter}
                onSelectSection={(sec) => onSelectSection(sec, chapter)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
