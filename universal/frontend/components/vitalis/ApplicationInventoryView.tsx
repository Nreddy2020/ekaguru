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
    <div className="bg-[#0c1424] border border-slate-800/80 rounded-xl p-5 space-y-4 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span>🗂️</span> Application &amp; Service Inventory
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Discover, track, and monitor health across all registered services, databases, queues, and APIs.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <input
            type="text"
            placeholder="Search service, owner, tier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-[#070e1c] border border-slate-700 text-xs rounded-lg px-3 py-1.5 text-slate-200 placeholder-slate-500 w-52 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-[#070e1c] border border-slate-700 text-xs rounded-lg px-3 py-1.5 text-slate-300 focus:outline-none"
          >
            <option value="ALL">All Types</option>
            <option value="SERVICE">Services</option>
            <option value="DATABASE">Databases</option>
            <option value="STORAGE_BUCKET">Storage</option>
            <option value="QUEUE">Queues</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-[11px] text-slate-400 font-medium bg-[#070e1c]">
              <th className="py-2.5 px-3.5">Name</th>
              <th className="py-2.5 px-2.5">Type</th>
              <th className="py-2.5 px-2.5">Tier</th>
              <th className="py-2.5 px-2.5 text-center">Status</th>
              <th className="py-2.5 px-3">Business Service</th>
              <th className="py-2.5 px-2.5">Version</th>
              <th className="py-2.5 px-3 text-right">P95 Latency</th>
              <th className="py-2.5 px-3.5 text-right">Dependencies</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-500 text-xs font-sans">
                  No inventory items match the current search filter.
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-2.5 px-3.5 font-bold text-slate-200 whitespace-nowrap">
                    {item.name}
                  </td>
                  <td className="py-2.5 px-2.5 text-teal-400 text-[11px] whitespace-nowrap">
                    {item.type}
                  </td>
                  <td className="py-2.5 px-2.5 text-slate-400 text-[11px] whitespace-nowrap">
                    {item.tier}
                  </td>
                  <td className="py-2.5 px-2.5 text-center whitespace-nowrap">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-sans ${
                      item.status === 'HEALTHY'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : item.status === 'DEGRADED'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-300 font-sans text-xs whitespace-nowrap">
                    {item.businessService}
                  </td>
                  <td className="py-2.5 px-2.5 text-slate-400 text-[11px] whitespace-nowrap">
                    {item.version}
                  </td>
                  <td className="py-2.5 px-3 text-right text-amber-400 font-bold whitespace-nowrap">
                    {item.p95LatencyMs} ms
                  </td>
                  <td className="py-2.5 px-3.5 text-right text-slate-400 whitespace-nowrap">
                    {item.dependencyCount}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
