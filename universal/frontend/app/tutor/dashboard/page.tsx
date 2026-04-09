'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';
import { BookOpen, Map, Star, Award, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

export default function StudentDashboard() {
    const router = useRouter();
    // In a real app, this would come from a global store or context
    const [bookStructure, setBookStructure] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Simulating fetching the recently analyzed book
        // In production, this would fetch the user's active course
        const stored = localStorage.getItem('lastAnalysis');
        if (stored) {
            try {
                setBookStructure(JSON.parse(stored));
            } catch (e) {
                console.error('Failed to parse stored book', e);
            }
        }
    }, []);

    if (loading) {
        return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Loading your learning map...</div>;
    }

    if (!bookStructure) {
        return (
            <div className="min-h-screen bg-gray-900 text-white p-6 flex flex-col items-center justify-center">
                <BookOpen className="w-16 h-16 text-cyan-500 mb-4" />
                <h2 className="text-2xl font-bold">No Active Learning Journey</h2>
                <p className="text-gray-400 mt-2">Upload a book to start your adventure!</p>
                <a href="/upload" className="mt-6 px-6 py-3 bg-cyan-500 rounded-lg font-semibold hover:bg-cyan-600">Go to Upload</a>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between"
                >
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            <Map className="text-purple-400" />
                            Your Learning Map
                        </h1>
                        <p className="text-gray-400 mt-1">Exploring: <span className="text-cyan-400 font-medium">{bookStructure.title || 'Your Book'}</span></p>
                    </div>
                    <div className="px-4 py-2 bg-purple-500/10 text-purple-400 rounded-lg border border-purple-500/20 text-sm font-medium">
                        Level 1 Explorer
                    </div>
                </motion.div>

                {/* Adventure Map / Chapter List */}
                <div className="grid gap-6">
                    {bookStructure.chapters?.length === 0 && (
                        <div className="text-center p-8 border border-gray-700 rounded-xl bg-gray-800/50">
                            <p className="text-gray-400">No chapters were identified in this document.</p>
                        </div>
                    )}
                    {bookStructure.chapters?.map((chapter: any, idx: number) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden hover:border-cyan-500/50 transition-colors"
                        >
                            <div className="p-6">
                                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-full bg-cyan-900 text-cyan-400 flex items-center justify-center text-sm border border-cyan-500/30">
                                        {idx + 1}
                                    </span>
                                    {chapter.title}
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {chapter.topics?.length === 0 && (
                                        <p className="text-sm text-gray-500 col-span-full">No topics found in this chapter.</p>
                                    )}
                                    {chapter.topics?.map((topic: any, tIdx: number) => (
                                        <div
                                            key={tIdx}
                                            onClick={() => router.push(`/tutor/lesson/${encodeURIComponent(topic.title)}`)}
                                            className="bg-gray-900/50 p-4 rounded-lg hover:bg-gray-700/50 cursor-pointer group transition-all transform hover:-translate-y-1"
                                        >
                                            <div className="flex justify-between items-start mb-2">

                                                <h4 className="font-medium text-gray-200 group-hover:text-cyan-400 transition-colors">{topic.title}</h4>
                                                <Star className="w-4 h-4 text-gray-600 group-hover:text-yellow-400 transition-colors" />
                                            </div>
                                            <p className="text-xs text-gray-500 line-clamp-2">{topic.contentPreview || 'Tap to start learning this concept...'}</p>
                                            <div className="mt-3 flex items-center text-xs text-cyan-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                                Start Lesson <ArrowRight className="w-3 h-3 ml-1" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}
