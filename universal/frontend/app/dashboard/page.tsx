"use client";

import React from 'react';
import ProgressDashboard from '@/components/ProgressDashboard';

const MOCK_DATA = {
    totalXp: 1250,
    streakDay: 5,
    completedTopics: 8,
    skills: {
        "Fractions": 0.85,
        "Decimals": 0.60,
        "Geometry": 0.45,
        "Algebra": 0.10
    }
};

export default function DashboardPage() {
    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Student Dashboard</h1>
                        <p className="text-gray-500">Track your learning velocity and mastery.</p>
                    </div>
                </div>
                <ProgressDashboard data={MOCK_DATA} />
            </div>
        </div>
    );
}
