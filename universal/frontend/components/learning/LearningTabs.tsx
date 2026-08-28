'use client';

import React, { useState } from 'react';

export function LearningTabs() {
  const [activeTab, setActiveTab] = useState<'book' | 'extra' | 'examples' | 'practice' | 'related' | 'summary'>('book');

  const tabs = [
    { id: 'book', label: 'Book Content' },
    { id: 'extra', label: 'Extra Explanations' },
    { id: 'examples', label: 'Examples' },
    { id: 'practice', label: 'Practice' },
    { id: 'related', label: 'Related Concepts' },
    { id: 'summary', label: 'Quick Summary' },
  ];

  return (
    <div className="flex items-center gap-2 border-b border-slate-800 overflow-x-auto pb-px">
      {tabs.map((t) => {
        const isActive = activeTab === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id as any)}
            className={`px-4 py-2 text-xs font-semibold transition-colors border-b-2 whitespace-nowrap ${
              isActive
                ? 'text-emerald-400 border-emerald-400 bg-emerald-950/20'
                : 'text-slate-400 border-transparent hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
