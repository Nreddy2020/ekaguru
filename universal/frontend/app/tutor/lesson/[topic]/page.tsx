'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, BookOpen, CheckCircle, PlayCircle, MessageSquare } from 'lucide-react';

export default function LessonPage() {
    const router = useRouter();
    const params = useParams();
    const topicId = decodeURIComponent(params.topic as string);

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6">
            <div className="max-w-4xl mx-auto">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Map
                </button>

                <div className="bg-gray-800 rounded-xl p-8 border border-gray-700">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-cyan-900/50 rounded-lg flex items-center justify-center">
                            <BookOpen className="w-6 h-6 text-cyan-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">{topicId}</h1>
                            <p className="text-gray-400">Lesson Module 1</p>
                        </div>
                    </div>

                    <div className="prose prose-invert max-w-none">
                        <div className="bg-gray-900/50 p-6 rounded-lg mb-8">
                            <h3 className="text-lg font-semibold text-white mb-4">Core Concepts</h3>
                            <ul className="space-y-3 text-gray-300">
                                <li className="flex items-start gap-3">
                                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                    <span>Understanding the fundamental principles of {topicId}.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                    <span>Analyzing real-world applications and case studies.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                    <span>Mastering the implementation details.</span>
                                </li>
                            </ul>
                        </div>

                        <h3 className="text-xl font-bold mb-4">Interactive Explanation</h3>
                        <p className="text-gray-300 leading-relaxed mb-6">
                            This topic explores the critical aspects of {topicId} within the broader context of the subject.
                            We will break down the complexity into manageable parts, starting with the basic definition
                            and moving towards advanced usage patterns.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                            <button className="flex items-center justify-center gap-3 p-4 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold transition-colors">
                                <PlayCircle className="w-5 h-5" /> Start Video Lesson
                            </button>
                            <button className="flex items-center justify-center gap-3 p-4 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition-colors">
                                <MessageSquare className="w-5 h-5" /> Ask AI Tutor
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
