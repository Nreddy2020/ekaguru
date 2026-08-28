'use client';

import React from 'react';
import { CheckCircle2, BookOpen, Layers, Bookmark, ShieldCheck, Info } from 'lucide-react';

export interface LearningSectionBannerProps {
  sectionTitle?: string;
  sectionNumber?: string;
  bookTitle?: string;
  chapterTitle?: string;
  pageNumber?: number;
  confidence?: string;
  lastVerified?: string;
}

export function LearningSectionBanner({
  sectionTitle = 'Lungs',
  sectionNumber = '2.1',
  bookTitle = 'NCERT EVS Grade 5',
  chapterTitle = '2. Internal Organs',
  pageNumber = 18,
  confidence = 'High (96%)',
  lastVerified = 'Today, 10:24 AM',
}: LearningSectionBannerProps) {
  return (
    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 p-5 rounded-2xl bg-[#0c1424] border border-slate-800/80 shadow-md">
      {/* Left Info Column */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Section {sectionNumber}: {sectionTitle}
          </h1>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/90 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 shadow-sm">
            <CheckCircle2 className="w-3.5 h-3.5" /> Verified from Book
          </span>
        </div>

        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
          This content is copied from your book. EKAGURU only adds structured explanations, examples and practice after the original book content.
        </p>

        {/* Metadata Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#131c2e] border border-slate-700/60 text-xs">
            <BookOpen className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-slate-400">Source:</span>
            <span className="font-semibold text-slate-200">{bookTitle}</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#131c2e] border border-slate-700/60 text-xs">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-slate-400">Chapter:</span>
            <span className="font-semibold text-slate-200">{chapterTitle}</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#131c2e] border border-slate-700/60 text-xs">
            <Bookmark className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400">Book Page:</span>
            <span className="font-bold text-amber-300">{pageNumber}</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#131c2e] border border-slate-700/60 text-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400">Confidence:</span>
            <span className="font-semibold text-emerald-300">{confidence}</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#131c2e] border border-slate-700/60 text-xs text-slate-400">
            <span>Last Verified:</span>
            <span className="font-medium text-slate-300">{lastVerified}</span>
          </div>
        </div>
      </div>

      {/* Right Callout: Why Source Accuracy Matters */}
      <div className="xl:max-w-xs p-4 rounded-xl bg-[#111c30] border border-slate-700/60 text-xs space-y-1.5">
        <div className="flex items-center gap-1.5 text-indigo-300 font-bold">
          <Info className="w-4 h-4 text-indigo-400" />
          <span>Why source accuracy matters</span>
        </div>
        <p className="text-slate-300 text-[11px] leading-relaxed">
          Every concept shown here is traceable to the exact location in your textbook.
        </p>
        <button type="button" className="text-indigo-400 hover:text-indigo-300 text-[11px] font-semibold underline">
          Learn more
        </button>
      </div>
    </div>
  );
}
