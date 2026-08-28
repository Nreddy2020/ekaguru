'use client';

import React from 'react';
import { CheckCircle2, ArrowRight } from 'lucide-react';

export function LearningBottomNav() {
  return (
    <div className="h-14 px-6 flex items-center justify-between bg-[#0c1424] border-t border-slate-800/80 text-xs font-semibold text-slate-300">
      <div className="flex items-center gap-2 text-emerald-400">
        <CheckCircle2 className="w-4 h-4 shrink-0" />
        <span>This section has been verified for accuracy. You can now explore additional explanations and practice.</span>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          className="px-4 py-2 rounded-xl bg-[#131c2e] hover:bg-[#1a263d] text-slate-300 border border-slate-700/60 transition-colors"
        >
          Back to Chapter
        </button>
        <button
          type="button"
          className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold flex items-center gap-1.5 shadow-md transition-colors"
        >
          <span>Continue to Next Section</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
