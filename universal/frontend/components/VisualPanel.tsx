'use client';

import { motion } from 'framer-motion';
import { Play, Code } from 'lucide-react';

interface VisualPanelProps {
    topicId: string;
}

export function VisualPanel({ topicId }: VisualPanelProps) {
    return (
        <div className="p-6 bg-gray-800 border-l border-gray-700 space-y-6">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-gray-900 rounded-lg p-4"
            >
                <h3 className="text-sm font-semibold text-gray-400 mb-3">Architecture Diagram</h3>
                <div className="bg-gray-950 rounded p-4 min-h-[200px] flex items-center justify-center">
                    {/* Mermaid diagram will render here */}
                    <div className="text-gray-600 text-sm">Diagram loading...</div>
                </div>
            </motion.div>

            <div className="space-y-3">
                <button className="w-full flex items-center gap-3 p-3 bg-gray-900 hover:bg-gray-700 rounded-lg transition-colors">
                    <Play className="w-5 h-5 text-cyan-400" />
                    <span className="text-sm font-medium">Watch Video Tutorial</span>
                </button>

                <button className="w-full flex items-center gap-3 p-3 bg-gray-900 hover:bg-gray-700 rounded-lg transition-colors">
                    <Code className="w-5 h-5 text-cyan-400" />
                    <span className="text-sm font-medium">View Code Example</span>
                </button>
            </div>
        </div>
    );
}
