'use client';

import { motion } from 'framer-motion';

const personas = [
    { id: 'kid', label: 'Kid', icon: '👶' },
    { id: 'student', label: 'Student', icon: '🎓' },
    { id: 'pro', label: 'Pro', icon: '💼' },
    { id: 'architect', label: 'Architect', icon: '🏗️' },
    { id: 'professor', label: 'Professor', icon: '👨‍🏫' },
];

interface PersonaToggleProps {
    selected: string;
    onChange: (persona: string) => void;
}

export function PersonaToggle({ selected, onChange }: PersonaToggleProps) {
    return (
        <div className="flex gap-2 p-1 bg-gray-800 rounded-lg flex-wrap">
            {personas.map(persona => (
                <motion.button
                    key={persona.id}
                    onClick={() => onChange(persona.id)}
                    className={`px-4 py-2 rounded-md transition-all flex items-center gap-2 ${selected === persona.id
                            ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/50'
                            : 'text-gray-400 hover:text-white hover:bg-gray-700'
                        }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <span>{persona.icon}</span>
                    <span className="font-semibold text-sm">{persona.label}</span>
                </motion.button>
            ))}
        </div>
    );
}
