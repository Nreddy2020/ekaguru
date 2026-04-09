'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api-client';

interface TopicViewerProps {
    topicId: string;
    persona: string;
}

export function TopicViewer({ topicId, persona }: TopicViewerProps) {
    const [content, setContent] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchContent = async () => {
            setLoading(true);
            try {
                const res = await api.getPersonaExplanation(topicId, persona);
                setContent(res);
            } catch (error) {
                console.error('Failed to fetch content:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchContent();
    }, [topicId, persona]);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="animate-spin text-4xl">⚙️</div>
            </div>
        );
    }

    if (!content) {
        return (
            <div className="text-center p-12 text-gray-400">
                <p>No content available</p>
            </div>
        );
    }

    return (
        <motion.div
            key={`${topicId}-${persona}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-6 mt-6"
        >
            <section>
                <h2 className="text-xl font-bold text-cyan-400 mb-3">What it is</h2>
                <p className="text-gray-300 leading-relaxed">{content.whatItIs}</p>
            </section>

            <section>
                <h2 className="text-xl font-bold text-cyan-400 mb-3">Why it exists</h2>
                <p className="text-gray-300 leading-relaxed">{content.whyItExists}</p>
            </section>

            <section>
                <h2 className="text-xl font-bold text-cyan-400 mb-3">How it works</h2>
                <ol className="list-decimal list-inside space-y-2 text-gray-300">
                    {content.howItWorks?.map((step: string, idx: number) => (
                        <li key={idx}>{step}</li>
                    ))}
                </ol>
            </section>

            <section>
                <h2 className="text-xl font-bold text-cyan-400 mb-3">Key Components</h2>
                <ul className="list-disc list-inside space-y-2 text-gray-300">
                    {content.keyComponents?.map((component: string, idx: number) => (
                        <li key={idx}>{component}</li>
                    ))}
                </ul>
            </section>
        </motion.div>
    );
}
