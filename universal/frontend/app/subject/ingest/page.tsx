"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

export default function IngestPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const topic = searchParams.get("topic") || "Introduction to AI";
    const [loading, setLoading] = useState(true);
    const [course, setCourse] = useState<any>(null);

    useEffect(() => {
        const fetchCurriculum = async () => {
            try {
                // Call the Real Backend
                const res = await fetch("http://localhost:3001/subjects", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: topic, category: "Tech" })
                });

                if (!res.ok) throw new Error("Failed to generate");

                const data = await res.json();
                setCourse(data.data); // data.data contains the { name, phases }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        if (topic) fetchCurriculum();
    }, [topic]);

    const handleStart = () => {
        // In a real app, we'd navigate to the first topic
        router.push("/student/welcome");
    };

    if (loading || !course) {
        return (
            <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
                <div className="animate-spin text-4xl mb-4">⚙️</div>
                <h2 className="text-xl font-bold">Architecting your "{topic}" Master Plan...</h2>
                <p className="text-slate-400">Consulting Universal Knowledge Base...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
            {/* Richer/Darker Gradient for 'Deep Content' */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#667EEA] to-[#764BA2] opacity-90 z-0"></div>

            {/* Decor Elements */}
            <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

            <div className="relative z-10 w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 items-start">

                {/* Left Col: Course Summary Card */}
                <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/50">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-4 bg-blue-100 rounded-2xl text-4xl">🤖</div>
                        <div>
                            <h1 className="text-2xl font-extrabold text-slate-900">{course.name}</h1>
                            <div className="flex gap-3 mt-1 text-sm font-bold text-slate-500">
                                <span className="flex items-center gap-1">⏱️ ~20h</span>
                                <span className="flex items-center gap-1 text-amber-500">⚡ 5000 XP</span>
                            </div>
                        </div>
                    </div>

                    <p className="text-slate-600 mb-8 leading-relaxed">
                        {course.description || "We've architected a comprehensive journey to master this subject. From basics to expert level."}
                    </p>

                    <button
                        onClick={handleStart}
                        className="w-full py-4 rounded-xl font-black text-lg bg-slate-900 text-white shadow-xl hover:bg-slate-800 hover:-translate-y-1 transition-all"
                    >
                        Start Learning Journey →
                    </button>

                    <div className="mt-4 text-center">
                        <button className="text-sm font-bold text-slate-400 hover:text-slate-600">
                            Edit Curriculum (Advanced)
                        </button>
                    </div>
                </div>

                {/* Right Col: Curriculum Tree */}
                <div className="space-y-4">
                    <h2 className="text-white font-bold text-xl mb-4 ml-2 opacity-90">Proposed Curriculum Path</h2>

                    {course.phases?.map((phase: any, idx: number) => (
                        <div key={idx} className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/20 transition-transform hover:scale-[1.02]">
                            <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs">{idx + 1}</span>
                                {phase.name}
                            </h3>
                            <ul className="space-y-2 pl-8 border-l-2 border-slate-200 ml-3">
                                {phase.modules?.map((mod: any, mIdx: number) => (
                                    <li key={mIdx} className="text-slate-600 font-medium text-sm flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                                        {mod.title}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

            </div>

            <style jsx global>{`
                @keyframes blob {
                    0% { transform: translate(0px, 0px) scale(1); }
                    33% { transform: translate(30px, -50px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.9); }
                    100% { transform: translate(0px, 0px) scale(1); }
                }
                .animate-blob {
                    animation: blob 7s infinite;
                }
                .animation-delay-2000 {
                    animation-delay: 2s;
                }
            `}</style>
        </div>
    );
}
