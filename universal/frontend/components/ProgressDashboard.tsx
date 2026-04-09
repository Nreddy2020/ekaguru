"use client";

import React from 'react';

// Module 8: Analytics
type ProgressData = {
    totalXp: number;
    streakDay: number;
    completedTopics: number;
    skills: Record<string, number>;
};

export default function ProgressDashboard({ data }: { data: ProgressData }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Main Stats */}
            <StatCard label="Total XP" value={data.totalXp.toLocaleString()} icon="✨" color="bg-yellow-100 text-yellow-700" />
            <StatCard label="Day Streak" value={`${data.streakDay} Days`} icon="🔥" color="bg-orange-100 text-orange-700" />
            <StatCard label="Topics Mastered" value={data.completedTopics} icon="📚" color="bg-blue-100 text-blue-700" />

            {/* Skill Radar (Simple Bar for MVP) */}
            <div className="md:col-span-3 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Skill Proficiency</h3>
                <div className="space-y-4">
                    {Object.entries(data.skills).map(([skill, level]) => (
                        <div key={skill}>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="font-medium text-gray-700">{skill}</span>
                                <span className="text-gray-500">{Math.round(level * 100)}%</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-blue-600 rounded-full transition-all duration-1000"
                                    style={{ width: `${level * 100}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function StatCard({ label, value, icon, color }: { label: string, value: string | number, icon: string, color: string }) {
    return (
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center space-x-4">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${color}`}>
                {icon}
            </div>
            <div>
                <div className="text-sm text-gray-500 font-medium">{label}</div>
                <div className="text-2xl font-bold text-gray-900">{value}</div>
            </div>
        </div>
    );
}
