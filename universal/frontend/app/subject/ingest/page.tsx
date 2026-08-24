"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "../../../lib/api-client";

function IngestPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const topic = searchParams.get("topic") || "Introduction to AI";
    const [loading, setLoading] = useState(true);
    const [course, setCourse] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchCurriculum = async () => {
            try {
                setError(null);
                // 1. Silent auth if token is missing
                let token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
                if (!token) {
                    const loginRes = await api.login("parent@example.com", "password");
                    token = loginRes.access_token;
                    if (typeof window !== 'undefined') {
                        localStorage.setItem('token', token);
                    }
                }

                // 2. Fetch/Retrieve Learner
                const learnersRes = await api.getLearners();
                let learner = learnersRes.data?.[0];
                if (!learner) {
                    const newLearnerRes = await api.createLearner("Leo", "CHILD");
                    learner = newLearnerRes.data;
                }

                // 3. Generate Curriculum Backbone for topic
                const backboneRes = await api.generateBackbone(topic);
                const structure = backboneRes.data;

                // 4. Map V2 structure to UI course format
                setCourse({
                    name: topic,
                    description: "We've architected a comprehensive journey to master this subject. From basics to expert level.",
                    version: structure.version,
                    learnerId: learner.id,
                    phases: [
                        {
                            name: "Backbone Mastery Path",
                            modules: (structure.nodes || []).map((node: any) => ({
                                title: node.concept?.canonicalName || `Node ${node.sequenceIndex}`
                            }))
                        }
                    ]
                });
            } catch (e: any) {
                console.error(e);
                setError(e.message || "Failed to construct the learning plan.");
            } finally {
                setLoading(false);
            }
        };

        if (topic) fetchCurriculum();
    }, [topic]);

    const handleStart = async () => {
        if (!course) return;
        try {
            setLoading(true);
            // 1. Enroll learner in curriculum version
            await api.enrollLearner(course.learnerId, course.version);

            // 2. Create learning session
            const session = await api.createSession(course.learnerId, course.version, 30);

            // 3. Navigate into the V2 learning flow
            const sAny = session as any;
            router.push(`/student/welcome?sessionId=${sAny?.id || sAny?.data?.id || ''}`);
        } catch (e: any) {
            console.error(e);
            alert("Failed to initialize learning session: " + e.message);
            setLoading(false);
        }
    };

    if (loading || !course) {
        return (
            <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
                {error ? (
                    <div className="text-center">
                        <div className="text-4xl mb-4">❌</div>
                        <h2 className="text-xl font-bold text-red-400">Curriculum Generation Failed</h2>
                        <p className="text-slate-400 mt-2">{error}</p>
                    </div>
                ) : (
                    <>
                        <div className="animate-spin text-4xl mb-4">⚙️</div>
                        <h2 className="text-xl font-bold">Architecting your "{topic}" Master Plan...</h2>
                        <p className="text-slate-400">Consulting Universal Knowledge Base...</p>
                    </>
                )}
            </div>
        );
    }

    return (
        <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gradient-to-br from-[#667EEA] to-[#764BA2] opacity-90 z-0"></div>

            <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

            <div className="relative z-10 w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
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

export default function IngestPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
                <div className="animate-spin text-4xl mb-4">⚙️</div>
                <h2 className="text-xl font-bold">Loading Ingest Plan...</h2>
            </div>
        }>
            <IngestPageContent />
        </Suspense>
    );
}
