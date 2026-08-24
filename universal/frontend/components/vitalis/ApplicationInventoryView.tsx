'use client';

import React, { useState } from 'react';
import { VitalisInventoryItem } from '../../lib/vitalis/domain/types';

interface ApplicationInventoryViewProps {
  inventory: VitalisInventoryItem[];
}

export const ApplicationInventoryView: React.FC<ApplicationInventoryViewProps> = ({ inventory }) => {
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');

  const filtered = inventory.filter((item) => {
    if (selectedType !== 'ALL' && item.type !== selectedType) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        item.businessService.toLowerCase().includes(q) ||
        item.owner.toLowerCase().includes(q) ||
        item.tier.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="bg-[#0b1322] border border-slate-800/80 rounded-xl p-5 space-y-5 shadow-sm max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base">▦</span>
            <h2 className="text-base font-bold text-white tracking-wide">
              Application &amp; Service Inventory
            </h2>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-300 border border-teal-500/30">
              {inventory.length} Registered Assets
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Enterprise registry of active services, database nodes, storage providers, and cognitive intelligence pipelines.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <input
            type="text"
            placeholder="Search service, owner, tier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-[#070e1c] border border-slate-700 text-xs rounded-lg px-3 py-1.5 text-slate-200 placeholder-slate-500 w-52 focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono"
          />
          <div className="flex items-center rounded-lg bg-[#070e1c] border border-slate-700 p-0.5 text-xs">
            {['ALL', 'SERVICE', 'DATABASE', 'STORAGE_BUCKET'].map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedType(tab)}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${
                  selectedType === tab
                    ? 'bg-teal-500/20 text-teal-300 font-bold border border-teal-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab === 'ALL' ? 'All Assets' : tab === 'STORAGE_BUCKET' ? 'Storage' : tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Asset Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((item) => (
          <div key={item.id} className="p-4 rounded-xl bg-[#080e1c] border border-slate-800 space-y-3 shadow-sm hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="font-bold text-slate-200 text-sm">{item.name}</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-mono">
                {item.status}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-[11px] font-mono bg-[#050a14] p-2.5 rounded-lg border border-slate-800/60">
              <div>
                <span className="text-slate-500 block text-[10px]">Tier</span>
                <span className="text-teal-400 font-semibold">{item.tier}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Version</span>
                <span className="text-slate-300 font-semibold">{item.version}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">P95 Latency</span>
                <span className="text-amber-400 font-semibold">{item.p95LatencyMs} ms</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1 text-slate-400 font-sans">
              <span>Service: <strong className="text-slate-300">{item.businessService}</strong></span>
              <span>Owner: <strong className="text-slate-300">{item.owner}</strong></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
