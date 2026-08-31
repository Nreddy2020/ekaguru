'use client';

import React from 'react';

export interface UniversalKnowledgeUniverseStudioProps {
  bookTitle?: string;
  chapterTitle?: string;
  printedPage?: number;
  className?: string;
}

export function UniversalKnowledgeUniverseStudio({
  className = '',
}: UniversalKnowledgeUniverseStudioProps) {
  return (
    <div
      data-testid="universal-knowledge-universe-studio"
      className={`w-full min-h-[85vh] bg-slate-950 rounded-2xl border border-slate-800/80 p-8 flex flex-col items-center justify-center text-slate-400 ${className}`}
    >
      <div className="flex flex-col items-center gap-3 text-center max-w-md">
        <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 text-xl">
          ✨
        </div>
        <h2 className="text-base font-bold text-slate-200">Workspace Cleared & Ready</h2>
        <p className="text-xs text-slate-400">
          Awaiting your exact layout and component instructions.
        </p>
      </div>
    </div>
  );
}
