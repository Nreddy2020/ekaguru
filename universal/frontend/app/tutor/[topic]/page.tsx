'use client';

import { useState } from 'react';
import { PersonaToggle } from '@/components/PersonaToggle';
import { TopicViewer } from '@/components/TopicViewer';
import { AskTutor } from '@/components/AskTutor';
import { VisualPanel } from '@/components/VisualPanel';

export default function TutorPage({ params }: { params: { topic: string } }) {
    const [persona, setPersona] = useState('student');

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 min-h-screen bg-gray-900">
            {/* Main Content - 2/3 width on desktop */}
            <div className="lg:col-span-2 p-4 md:p-6 overflow-y-auto">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-white mb-4">Topic: {params.topic}</h1>
                    <PersonaToggle selected={persona} onChange={setPersona} />
                </div>

                <TopicViewer topicId={params.topic} persona={persona} />
                <AskTutor topicId={params.topic} />
            </div>

            {/* Visual Panel - 1/3 width on desktop */}
            <div className="lg:border-l border-gray-800">
                <VisualPanel topicId={params.topic} />
            </div>
        </div>
    );
}
