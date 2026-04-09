"use client";

import React from 'react';
import { TopicViewer } from '@/components/TopicViewer';

export default function ExplorePage() {
    // For now, render TopicViewer with a demo topic id
    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <TopicViewer topicId="kubernetes-architecture" persona="student" />
        </div>
    );
}
