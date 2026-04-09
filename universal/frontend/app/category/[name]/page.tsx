'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen, Clock } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api-client';

export default function CategoryPage() {
    const params = useParams();
    const router = useRouter();
    const categoryName = typeof params.name === 'string'
        ? params.name.charAt(0).toUpperCase() + params.name.slice(1)
        : '';

    const [subjects, setSubjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSubjects = async () => {
            try {
                // In a real app, we would have a filter endpoint
                // For now, we fetch all and filter client-side
                const data = await api.getAllSubjects();
                const filtered = data.filter((s: any) =>
                    s.category.toLowerCase() === (params.name as string).toLowerCase()
                );
                setSubjects(filtered);
            } catch (error) {
                console.error('Failed to fetch subjects:', error);
            } finally {
                setLoading(false);
            }
        };

        if (params.name) {
            fetchSubjects();
        }
    }, [params.name]);

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-4 mb-8"
                >
                    <button
                        onClick={() => router.back()}
                        className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold">{categoryName}</h1>
                        <p className="text-gray-400">Explore subjects in this category</p>
                    </div>
                </motion.div>

                {/* Content */}
                {loading ? (
                    <div className="text-center py-12 text-gray-400">Loading subjects...</div>
                ) : subjects.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {subjects.map((subject, idx) => (
                            <Link key={subject.id} href={`/tutor/${subject.id}`}>
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition-all cursor-pointer group hover:shadow-lg hover:shadow-cyan-500/10 border border-transparent hover:border-cyan-500/20"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-3 bg-gray-700 rounded-lg group-hover:bg-cyan-500/20 group-hover:text-cyan-400 transition-colors">
                                            <BookOpen className="w-6 h-6" />
                                        </div>
                                        {subject.progress > 0 && (
                                            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full border border-green-500/20">
                                                {subject.progress}% Complete
                                            </span>
                                        )}
                                    </div>

                                    <h3 className="text-xl font-bold mb-2 group-hover:text-cyan-400 transition-colors">
                                        {subject.name}
                                    </h3>
                                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                                        {subject.description || 'No description available.'}
                                    </p>

                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <Clock className="w-4 h-4" />
                                        <span>{subject.estimatedTime || '2 hours'}</span>
                                        <span>•</span>
                                        <span>{subject.totalModules || 0} modules</span>
                                    </div>
                                </motion.div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-16 bg-gray-800 rounded-xl"
                    >
                        <div className="text-6xl mb-4">📚</div>
                        <h3 className="text-xl font-bold mb-2">No subjects found</h3>
                        <p className="text-gray-400 mb-6">No subjects available in the {categoryName} category yet.</p>
                        <Link href="/upload">
                            <button className="bg-cyan-500 hover:bg-cyan-600 px-6 py-2 rounded-lg font-semibold transition-colors">
                                Upload a Book
                            </button>
                        </Link>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
