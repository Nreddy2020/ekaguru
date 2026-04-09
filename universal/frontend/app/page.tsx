'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { BookOpen, Upload } from 'lucide-react';
import { api } from '@/lib/api-client';

const CATEGORIES = [
    { name: 'Technology', icon: '💻', color: 'from-blue-500 to-cyan-500' },
    { name: 'Schooling', icon: '🎓', color: 'from-purple-500 to-pink-500' },
    { name: 'Medical', icon: '🏥', color: 'from-red-500 to-orange-500' },
    { name: 'Mechanical', icon: '⚙️', color: 'from-gray-500 to-slate-500' },
    { name: 'Business', icon: '💼', color: 'from-green-500 to-emerald-500' },
];

export default function HomePage() {
    const [subjects, setSubjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSubjects = async () => {
            try {
                const data = await api.getAllSubjects();
                setSubjects(data);
            } catch (error) {
                console.error('Failed to fetch subjects:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchSubjects();
    }, []);

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6">
            <div className="max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-12"
                >
                    <h1 className="text-4xl font-bold mb-4">Choose Your Learning Path</h1>
                    <p className="text-gray-400">Select a category or upload your own book to start learning</p>
                </motion.div>

                {/* Category Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                    {CATEGORIES.map((category, idx) => (
                        <Link key={category.name} href={`/category/${category.name.toLowerCase()}`}>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition-colors cursor-pointer group h-full"
                            >
                                <div className={`w-16 h-16 rounded-lg bg-gradient-to-br ${category.color} flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform`}>
                                    {category.icon}
                                </div>
                                <h3 className="text-xl font-semibold">{category.name}</h3>
                            </motion.div>
                        </Link>
                    ))}

                    {/* Upload Book Card */}
                    <Link href="/upload">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg p-6 hover:shadow-lg hover:shadow-cyan-500/50 transition-all cursor-pointer group"
                        >
                            <div className="w-16 h-16 rounded-lg bg-white/20 flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform">
                                <Upload className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-semibold">Upload Book</h3>
                            <p className="text-sm text-white/80 mt-2">Start learning from your own materials</p>
                        </motion.div>
                    </Link>
                </div>

                {/* Continue Learning Section */}
                {!loading && subjects.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                    >
                        <h2 className="text-2xl font-bold mb-6">Continue Learning</h2>
                        <div className="space-y-4">
                            {subjects.map((subject) => (
                                <Link key={subject.id} href={`/tutor/${subject.id}`}>
                                    <div className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-colors flex items-center justify-between group">
                                        <div className="flex items-center gap-4">
                                            <BookOpen className="w-6 h-6 text-cyan-400" />
                                            <div>
                                                <h3 className="font-semibold group-hover:text-cyan-400 transition-colors">{subject.name}</h3>
                                                <p className="text-sm text-gray-400">{subject.category || 'General'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="w-32 bg-gray-700 rounded-full h-2">
                                                <div
                                                    className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full"
                                                    style={{ width: `${subject.progress || 0}%` }}
                                                />
                                            </div>
                                            <span className="text-sm text-gray-400">{subject.progress || 0}%</span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </motion.div>
                )}

                {!loading && subjects.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-gray-400 mb-4">No subjects yet. Upload a book to get started!</p>
                        <Link href="/upload">
                            <button className="bg-cyan-500 hover:bg-cyan-600 px-6 py-3 rounded-lg font-semibold">
                                Upload Your First Book
                            </button>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
