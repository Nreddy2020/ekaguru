"use client";

import React from 'react';
import AdminDashboard from '@/components/AdminDashboard';

const MOCK_SUBJECTS = [
    { id: '1', name: 'Information Theory', version: '1.0.0', status: 'PUBLISHED' },
    { id: '2', name: 'Quantum Mechanics', version: '0.9.0', status: 'DRAFT' },
    { id: '3', name: 'Calculus I', version: '2.1.0', status: 'REVIEW' },
];

export default function AdminPage() {
    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Admin Console</h1>
                        <p className="text-gray-500">Manage subjects, content governance, and quality assurance.</p>
                    </div>
                </div>
                <AdminDashboard subjects={MOCK_SUBJECTS} />
            </div>
        </div>
    );
}
