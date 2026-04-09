"use client";

import React from "react";
import Link from "next/link";

export default function SubjectSelection() {

    const subjects = [
        { emoji: "🚀", title: "Space Science", color: "bg-indigo-500", locked: false },
        { emoji: "🎨", title: "Digital Art", color: "bg-pink-500", locked: false },
        { emoji: "🦕", title: "Paleontology", color: "bg-green-500", locked: true },
        { emoji: "➗", title: "Math Magic", color: "bg-yellow-500", locked: true },
        { emoji: "🤖", title: "Robotics", color: "bg-blue-500", locked: true },
        { emoji: "🏰", title: "History", color: "bg-amber-600", locked: true },
    ];

    return (
        <div className="min-h-screen bg-[#F8FAFC] p-4 pb-24">

            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link href="/student/welcome" className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 text-slate-400 hover:text-slate-800 transition-colors">
                    ← Back
                </Link>
                <h1 className="text-2xl font-black text-slate-800">New Adventures</h1>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-2 gap-4">
                {subjects.map((sub, idx) => (
                    <div
                        key={idx}
                        className={`relative rounded-3xl p-6 aspect-square flex flex-col items-center justify-center text-center shadow-lg transform transition-all hover:scale-[1.02] cursor-pointer overflow-hidden
                            ${sub.locked ? "bg-slate-100 grayscale opacity-80" : "bg-white"}
                        `}
                    >
                        {/* Dynamic Background Blob for unlocked items */}
                        {!sub.locked && (
                            <div className={`absolute inset-0 opacity-10 ${sub.color}`}></div>
                        )}

                        <div className="text-5xl mb-3 filter drop-shadow-md">{sub.emoji}</div>
                        <h3 className="font-extrabold text-slate-800 text-lg leading-tight">{sub.title}</h3>

                        {sub.locked && (
                            <div className="absolute top-3 right-3 bg-slate-200 p-2 rounded-full">
                                <span className="text-slate-400 text-sm">🔒</span>
                            </div>
                        )}

                        {!sub.locked && (
                            <button className={`mt-4 px-4 py-2 ${sub.color} text-white rounded-xl text-xs font-black uppercase shadow-md hover:shadow-lg transition-shadow`}>
                                Unlock
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {/* Bottom Nav (Consistent) */}
            <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-xl border border-white/50 shadow-2xl rounded-2xl px-6 py-3 flex gap-8 items-center z-50">
                <Link href="/student/welcome" className="flex flex-col items-center gap-1 text-slate-300 hover:text-blue-600 transition-colors">
                    <span className="text-2xl">🏠</span>
                </Link>
                <Link href="/student/subjects" className="flex flex-col items-center gap-1 text-purple-600">
                    <span className="text-2xl">🗺️</span>
                </Link>
                <Link href="/student/summary" className="flex flex-col items-center gap-1 text-slate-300 hover:text-green-500 transition-colors">
                    <span className="text-2xl">🏆</span>
                </Link>
                <Link href="/parent/dashboard" className="flex flex-col items-center gap-1 text-slate-300 hover:text-orange-500 transition-colors">
                    <span className="text-2xl">👤</span>
                </Link>
            </div>

        </div>
    );
}
