"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

const EMOJI_MAP: Record<string, string> = {
    "quantum": "⚛️", "art": "🎨", "rocket": "🚀", "python": "🐍", "robot": "🤖",
    "kubernetes": "☸️", "openshift": "🔴", "docker": "🐳", "ai": "🤖", "ml": "🧠",
    "default": "📚"
};

const COLOR_PALETTE = [
    "from-blue-600 to-cyan-500",
    "from-purple-600 to-pink-500",
    "from-orange-600 to-red-500",
    "from-green-600 to-emerald-500",
    "from-indigo-600 to-purple-500",
    "from-red-600 to-pink-500",
    "from-yellow-600 to-orange-500",
];

function getEmojiForSubject(name: string): string {
    const lowerName = name.toLowerCase();
    for (const [key, emoji] of Object.entries(EMOJI_MAP)) {
        if (lowerName.includes(key)) return emoji;
    }
    return EMOJI_MAP.default;
}

export default function StudentHomePage() {
    const [subjects, setSubjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSubjects = async () => {
            try {
                const res = await fetch("http://localhost:3001/subjects");
                if (res.ok) {
                    const data = await res.json();
                    // Transform backend data to match UI expectations
                    const transformed = data.map((subject: any, idx: number) => ({
                        id: subject.id,
                        title: subject.name,
                        emoji: getEmojiForSubject(subject.name),
                        level: 1,
                        progress: 0,
                        color: COLOR_PALETTE[idx % COLOR_PALETTE.length],
                        locked: false
                    }));
                    setSubjects(transformed);
                }
            } catch (error) {
                console.error("Failed to fetch subjects:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchSubjects();
    }, []);
    return (
        <div className="min-h-screen bg-black text-white overflow-x-hidden font-sans">

            {/* Header: The Player HUD */}
            <div className="fixed top-0 left-0 w-full z-50 p-6 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
                <div className="pointer-events-auto flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-yellow-400 to-orange-500 border-2 border-white/20 shadow-[0_0_20px_rgba(234,179,8,0.5)]"></div>
                    <div>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Player Level 12</div>
                        <div className="font-black text-xl">The Cyber Hero</div>
                    </div>
                </div>

                <div className="pointer-events-auto flex items-center gap-6">
                    <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10 backdrop-blur-md">
                        <span className="text-2xl animate-pulse">🔥</span>
                        <span className="font-black text-orange-500">7 Day Streak</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10 backdrop-blur-md">
                        <span className="text-xl">🪙</span>
                        <span className="font-black text-yellow-400">2,450 XP</span>
                    </div>
                </div>
            </div>

            {/* Main Content: The Quest Map (Horizontal Scroll) */}
            <div className="relative min-h-screen flex items-center pl-20 overflow-x-auto hide-scrollbar">

                {/* Connection Line */}
                <div className="absolute top-1/2 left-0 w-[200vw] h-1 bg-white/10 -z-10 transform -translate-y-1/2"></div>

                <div className="flex gap-12 px-12 pt-20 pb-20">

                    {/* Add New Quest Button */}
                    <Link href="/subject/create" className="group relative w-64 h-96 flex-shrink-0 flex items-center justify-center rounded-3xl border-4 border-dashed border-white/20 hover:border-white/50 hover:bg-white/5 transition-all cursor-pointer">
                        <div className="text-center">
                            <div className="text-6xl mb-4 opacity-50 group-hover:scale-125 transition-transform">➕</div>
                            <div className="font-bold text-slate-400 group-hover:text-white">New Quest</div>
                        </div>
                    </Link>

                    {/* Loading State */}
                    {loading && (
                        <div className="flex items-center justify-center w-64 h-96">
                            <div className="text-center">
                                <div className="text-4xl animate-spin mb-4">⚙️</div>
                                <div className="text-slate-400 font-bold">Loading Quests...</div>
                            </div>
                        </div>
                    )}

                    {/* Empty State */}
                    {!loading && subjects.length === 0 && (
                        <div className="flex items-center justify-center w-96 h-96">
                            <div className="text-center">
                                <div className="text-6xl mb-4">🎯</div>
                                <h3 className="text-xl font-bold text-white mb-2">No Quests Yet!</h3>
                                <p className="text-slate-400">Click the + button to create your first learning journey.</p>
                            </div>
                        </div>
                    )}

                    {/* Quest Cards */}
                    {!loading && subjects.map((sub: any, idx: number) => (
                        <motion.div
                            key={sub.id}
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="relative w-72 h-[28rem] flex-shrink-0"
                        >
                            <Link href={sub.locked ? "#" : "/student/topics"} className={`block h-full w-full relative group perspective-1000 cursor-pointer ${sub.locked ? "grayscale opacity-50 cursor-not-allowed" : ""}`}>

                                {/* Card Body */}
                                <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${sub.color} p-1 shadow-2xl transition-transform duration-500 group-hover:-translate-y-4 group-hover:rotate-1`}>
                                    <div className="h-full w-full bg-black/40 backdrop-blur-sm rounded-[1.3rem] p-6 flex flex-col justify-between border border-white/10">

                                        {/* Top */}
                                        <div className="flex justify-between items-start">
                                            <div className="text-5xl drop-shadow-lg">{sub.emoji}</div>
                                            <div className="px-3 py-1 bg-black/50 rounded-full text-xs font-bold border border-white/10">
                                                LVL {sub.level}
                                            </div>
                                        </div>

                                        {/* Core */}
                                        <div>
                                            <h3 className="text-2xl font-black leading-tight mb-2 drop-shadow-md">{sub.title}</h3>
                                            <div className="w-full bg-black/50 h-2 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full bg-white transition-all duration-1000 ease-out`}
                                                    style={{ width: `${sub.progress}%` }}
                                                ></div>
                                            </div>
                                            <div className="text-right text-xs font-bold mt-2 text-white/70">{sub.progress}% Mastery</div>
                                        </div>

                                        {/* Action */}
                                        <div className="mt-4">
                                            <button className="w-full py-3 bg-white text-black font-black rounded-xl hover:bg-slate-200 transition-colors">
                                                {sub.locked ? "LOCKED 🔒" : "CONTINUE ▶"}
                                            </button>
                                        </div>

                                    </div>
                                </div>

                                {/* Glow Effect */}
                                <div className={`absolute -inset-4 bg-gradient-to-br ${sub.color} opacity-0 group-hover:opacity-30 blur-2xl transition-opacity duration-500 -z-10`}></div>

                            </Link>
                        </motion.div>
                    ))}

                </div>
            </div>

            {/* Floating Navigation Bar (Bottom) */}
            <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 px-8 py-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full flex gap-8 z-50 shadow-2xl">
                <Link href="#" className="text-2xl hover:scale-125 transition-transform text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400">🏠</Link>
                <Link href="#" className="text-2xl hover:scale-125 transition-transform opacity-50 hover:opacity-100">🗺️</Link>
                <Link href="#" className="text-2xl hover:scale-125 transition-transform opacity-50 hover:opacity-100">🏆</Link>
                <Link href="#" className="text-2xl hover:scale-125 transition-transform opacity-50 hover:opacity-100">👤</Link>
            </div>

            <style jsx>{`
                .hide-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .perspective-1000 {
                    perspective: 1000px;
                }
            `}</style>
        </div>
    );
}
