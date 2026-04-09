"use client";

import React from "react";
import Link from "next/link";

export default function TopicView() {

    const lessons = [
        { id: 1, title: "What is AI?", type: "Theory", status: "done", xp: 50 },
        { id: 2, title: "Neural Networks 101", type: "Interactive", status: "current", xp: 100 },
        { id: 3, title: "Data vs Logic", type: "Lab", status: "locked", xp: 150 },
        { id: 4, title: "History of Computing", type: "Theory", status: "locked", xp: 50 },
        { id: 5, title: "Turing Test", type: "Quiz", status: "locked", xp: 75 },
    ];

    return (
        <div className="min-h-screen bg-[#F0FDF4] pb-24 font-sans">

            {/* Sticky Header */}
            <div className="sticky top-0 bg-white/90 backdrop-blur-md z-20 border-b border-green-100 px-4 py-3 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                    <Link href="/student/welcome" className="bg-green-50 p-2 rounded-lg text-green-600 hover:bg-green-100">
                        ←
                    </Link>
                    <h1 className="font-black text-slate-800 text-lg">Introduction to AI</h1>
                </div>

                {/* Progress */}
                <div className="flex items-center gap-3">
                    <div className="flex-1 bg-slate-100 h-3 rounded-full overflow-hidden">
                        <div className="bg-green-500 h-full w-[20%] rounded-full shadow-md shadow-green-200"></div>
                    </div>
                    <span className="text-xs font-black text-green-600">20%</span>
                </div>
            </div>

            {/* Path / Timeline */}
            <div className="max-w-md mx-auto p-6 relative">
                {/* Vertical Line */}
                <div className="absolute left-10 top-0 bottom-0 w-1 bg-green-200 z-0"></div>

                <div className="space-y-8 relative z-10">
                    {lessons.map((lesson, idx) => (
                        <div key={idx} className="flex gap-6 items-start group">

                            {/* Status Node */}
                            <div className="relative pt-1">
                                {lesson.status === "done" && (
                                    <div className="w-8 h-8 rounded-full bg-green-500 border-4 border-[#F0FDF4] flex items-center justify-center text-white text-sm shadow-md">✓</div>
                                )}
                                {lesson.status === "current" && (
                                    <div className="w-8 h-8 rounded-full bg-yellow-400 border-4 border-[#F0FDF4] flex items-center justify-center animate-pulse shadow-lg ring-4 ring-yellow-100">
                                        ▶
                                    </div>
                                )}
                                {lesson.status === "locked" && (
                                    <div className="w-8 h-8 rounded-full bg-slate-200 border-4 border-[#F0FDF4] flex items-center justify-center text-slate-400 text-xs shadow-sm">🔒</div>
                                )}
                            </div>

                            {/* Card content */}
                            <Link href={lesson.status === "locked" ? "#" : "/student/session"} className="flex-1">
                                <div className={`p-4 rounded-2xl border-b-4 transition-transform
                                    ${lesson.status === "current"
                                        ? "bg-white border-yellow-400 shadow-xl scale-[1.03] rotate-[1deg]"
                                        : ""}
                                    ${lesson.status === "done"
                                        ? "bg-green-50 border-green-200 opacity-80"
                                        : ""}
                                    ${lesson.status === "locked"
                                        ? "bg-slate-50 border-slate-200 opacity-60 grayscale"
                                        : "bg-white border-slate-200 hover:border-blue-300 shadow-sm"}
                                `}>
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md
                                             ${lesson.type === "Interactive" ? "bg-purple-100 text-purple-600" : "bg-slate-100 text-slate-500"}
                                        `}>
                                            {lesson.type}
                                        </span>
                                        <span className="text-xs font-bold text-slate-400">XP {lesson.xp}</span>
                                    </div>
                                    <h3 className="font-bold text-slate-800">{lesson.title}</h3>

                                    {lesson.status === "current" && (
                                        <div className="mt-3">
                                            <button className="w-full py-2 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-bold rounded-xl text-sm transition-colors shadow-sm">
                                                START LESSON
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </Link>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
}
