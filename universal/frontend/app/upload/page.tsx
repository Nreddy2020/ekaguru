'use client';

import { useState } from 'react';
import { Upload, CheckCircle, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api-client';
import { useRouter } from 'next/navigation';

interface UploadResult {
    structure?: unknown;
}

export default function UploadPage() {
    const router = useRouter();
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<any>(null);

    const validateFile = (file: File): string | null => {
        const maxSize = 50 * 1024 * 1024; // 50MB
        const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/epub+zip'];

        if (file.size > maxSize) {
            return 'File size must be less than 50MB';
        }

        if (!allowedTypes.includes(file.type) && !file.name.match(/\.(pdf|docx|epub)$/i)) {
            return 'Only PDF, DOCX, and EPUB files are supported';
        }

        return null;
    };

    const handleFileSelect = (selectedFile: File) => {
        const validationError = validateFile(selectedFile);
        if (validationError) {
            setError(validationError);
            return;
        }

        setFile(selectedFile);
        setError(null);
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        setError(null);

        try {
            const response = await api.uploadBook(file, setProgress) as UploadResult;
            setResult(response);
            // Store for dashboard
            if (typeof window !== 'undefined') {
                localStorage.setItem('lastAnalysis', JSON.stringify(response.structure));
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6">
            <div className="max-w-3xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <p className="text-sm font-bold uppercase tracking-[0.18em] text-teal-200 mb-3">Learning Library</p>
                    <h1 className="text-4xl font-bold mb-4">Add learning material</h1>
                    <p className="text-gray-400">Transform a learning source into a structured experience. PDF, DOCX and EPUB are available today; image and note ingestion follow in the next phase.</p>
                </motion.div>

                <div className="space-y-6">
                    <div
                        className="border-2 border-dashed border-gray-700 rounded-lg p-12 text-center hover:border-cyan-500 transition-colors cursor-pointer"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                            e.preventDefault();
                            const droppedFile = e.dataTransfer.files[0];
                            if (droppedFile) handleFileSelect(droppedFile);
                        }}
                        onClick={() => document.getElementById('file-input')?.click()}
                    >
                        <Upload className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                        <p className="text-xl font-semibold mb-2">Drop learning material here</p>
                        <p className="text-gray-400 mb-2">or click to browse</p>
                        <p className="text-sm text-gray-500">PDF, DOCX, EPUB (max 50MB)</p>
                    </div>

                    <input
                        id="file-input"
                        type="file"
                        accept=".pdf,.docx,.epub"
                        className="hidden"
                        onChange={(e) => {
                            const selectedFile = e.target.files?.[0];
                            if (selectedFile) handleFileSelect(selectedFile);
                        }}
                    />

                    {file && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-gray-800 rounded-lg p-6"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <span className="font-medium">{file.name}</span>
                                <span className="text-sm text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                            </div>

                            {uploading && (
                                <div className="space-y-2">
                                    <div className="w-full bg-gray-700 rounded-full h-2">
                                        <div
                                            className="bg-cyan-500 h-2 rounded-full transition-all"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                    <p className="text-sm text-gray-400">Uploading... {Math.round(progress)}%</p>
                                </div>
                            )}

                            {!uploading && !result && (
                                <button
                                    onClick={handleUpload}
                                    className="w-full mt-2 bg-cyan-500 hover:bg-cyan-600 py-3 rounded-lg font-semibold transition-colors"
                                >
                                    Analyze material
                                </button>
                            )}
                        </motion.div>
                    )}

                    {error && !result && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="bg-red-900/20 border border-red-500 rounded-lg p-4 flex items-center gap-3"
                        >
                            <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                            <p className="text-red-500">
                                {(() => {
                                    try {
                                        const parsed = JSON.parse(error);
                                        return parsed.message || parsed.error || error;
                                    } catch {
                                        return error;
                                    }
                                })()}
                            </p>
                        </motion.div>
                    )}

                    {result && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-green-900/20 border border-green-500 rounded-lg p-6"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <CheckCircle className="w-6 h-6 text-green-500" />
                                <div>
                                    <p className="text-green-500 font-semibold text-lg">Learning material analysed</p>
                                    <p className="text-gray-400 text-sm">
                                        Target Audience: {
                                            result.structure?.chapters?.[0]?.topics?.[0]?.difficulty === 'beginner'
                                                ? 'Beginner Friendly'
                                                : 'Technical/Advanced'
                                        }
                                    </p>
                                </div>
                            </div>

                            <div className="bg-gray-900/50 rounded-lg p-4 mb-6 border border-gray-700 max-h-60 overflow-y-auto">
                                <h3 className="text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wide">Knowledge Graph Preview</h3>
                                <ul className="space-y-3">
                                    {result.structure?.chapters?.map((chapter: any, idx: number) => (
                                        <li key={idx}>
                                            <p className="font-semibold text-cyan-400">{chapter.title}</p>
                                            <ul className="pl-4 mt-1 border-l-2 border-gray-700">
                                                {chapter.topics?.map((topic: any, tIdx: number) => (
                                                    <li key={tIdx} className="text-sm text-gray-300 py-0.5 flex justify-between">
                                                        <span>{topic.title}</span>
                                                        {topic.diagramDescription && (
                                                            <span className="text-xs px-2 rounded-full bg-purple-500/20 text-purple-400">Diagram</span>
                                                        )}
                                                    </li>
                                                ))}
                                            </ul>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="flex gap-4 text-sm text-gray-400 mb-6">
                                <span>📚 {result.structure?.chapters?.length || 0} Chapters</span>
                                <span>💡 {result.structure?.chapters?.reduce((acc: number, ch: any) => acc + (ch.topics?.length || 0), 0) || 0} Topics</span>
                                <span>📄 {result.structure?.metadata?.pageCount || 0} Pages</span>
                            </div>

                            <button
                                onClick={() => router.push(`/library`)}
                                className="w-full bg-cyan-500 hover:bg-cyan-600 py-3 rounded-lg font-semibold transition-colors"
                            >
                                Return to Learning Library →
                            </button>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
}
