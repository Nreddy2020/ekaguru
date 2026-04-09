'use client';

import { useState } from 'react';
import { Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api-client';

interface AskTutorProps {
    topicId: string;
}

export function AskTutor({ topicId }: AskTutorProps) {
    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAsk = async () => {
        if (!question.trim()) return;

        setLoading(true);
        try {
            const response = await api.askQuestion(topicId, question);
            setAnswer(response.answer);
        } catch (error) {
            console.error('Failed to ask question:', error);
            setAnswer('Sorry, I encountered an error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mt-8 space-y-4">
            <div className="flex gap-2">
                <input
                    className="flex-1 p-3 rounded-lg bg-gray-800 border border-gray-700 focus:border-cyan-500 focus:outline-none text-white placeholder-gray-500"
                    placeholder="Ask your tutor anything about this topic..."
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAsk()}
                />
                <button
                    onClick={handleAsk}
                    disabled={loading || !question.trim()}
                    className="bg-cyan-500 hover:bg-cyan-600 px-6 py-3 rounded-lg transition-colors font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? (
                        <span className="animate-spin">⏳</span>
                    ) : (
                        <Send className="w-4 h-4" />
                    )}
                    Ask
                </button>
            </div>

            <AnimatePresence>
                {answer && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="p-4 bg-gray-800 rounded-lg border border-gray-700"
                    >
                        <p className="text-xs text-cyan-400 font-semibold mb-2">Tutor:</p>
                        <p className="text-white leading-relaxed">{answer}</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
