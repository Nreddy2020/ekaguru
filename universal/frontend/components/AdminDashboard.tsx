"use client";

import React from 'react';

type Subject = { id: string; name: string; status: string; version: string; };

export default function AdminDashboard({ subjects }: { subjects: Subject[] }) {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PUBLISHED': return 'bg-green-100 text-green-700';
            case 'DRAFT': return 'bg-gray-100 text-gray-700';
            case 'REVIEW': return 'bg-yellow-100 text-yellow-700';
            default: return 'bg-red-100 text-red-700';
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">Content Governance</h2>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold">
                    + New Subject
                </button>
            </div>

            <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                    <tr>
                        <th className="p-4">Subject Name</th>
                        <th className="p-4">Version</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {subjects.map((sub) => (
                        <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
                            <td className="p-4 font-medium text-gray-900">{sub.name}</td>
                            <td className="p-4 text-gray-500 font-mono text-sm">v{sub.version}</td>
                            <td className="p-4">
                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(sub.status)}`}>
                                    {sub.status}
                                </span>
                            </td>
                            <td className="p-4 text-right space-x-2">
                                <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">Edit</button>
                                <button className="text-gray-400 hover:text-red-600 text-sm">Deprecate</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
