"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "../../../lib/api-client";
import { motion } from "framer-motion";

const EMOJI_MAP: Record<string, string> = {
    "fractions": "🍕", "addition": "➕", "multiplication": "✖️", "division": "➗",
    "algebra": "📐", "geometry": "📏", "ai": "🤖", "neural": "🧠", "default": "📚"
};

const COLOR_PALETTE = [
    "from-blue-600 to-cyan-500",
    "from-purple-600 to-pink-500",
    "from-orange-600 to-red-500",
    "from-green-600 to-emerald-500",
    "from-indigo-600 to-purple-500",
];

function getEmojiForConcept(name: string): string {
    const lowerName = name.toLowerCase();
    for (const [key, emoji] of Object.entries(EMOJI_MAP)) {
        if (lowerName.includes(key)) return emoji;
    }
    return EMOJI_MAP.default;
}

function StudentWelcomeContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const querySessionId = searchParams.get("sessionId");

    const [learner, setLearner] = useState<any>(null);
    const [activeSession, setActiveSession] = useState<any>(null);
    const [frontierNodes, setFrontierNodes] = useState<any[]>([]);
    const [masteredCount, setMasteredCount] = useState<number>(0);
    const [structureVersion, setStructureVersion] = useState<number | null>(null);
    const [timeBudget, setTimeBudget] = useState<number>(30);

    const [noLearner, setNoLearner] = useState(false);
    const [noEnrollment, setNoEnrollment] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                setError(null);

                // 1. Authenticate / Resolve Learner Profile via JWT principal
                const learnersRes = await api.getLearners();
                const currentLearner = learnersRes.data?.[0];
                if (!currentLearner) {
                    setNoLearner(true);
                    setLoading(false);
                    return;
                }
                setLearner(currentLearner);

                // 2. Fetch Active Enrollment
                const activeEnrollment = currentLearner.curriculumEnrollments?.[0];
                if (!activeEnrollment) {
                    setNoEnrollment(true);
                    setLoading(false);
                    return;
                }
                const version = activeEnrollment.structure.version;
                setStructureVersion(version);

                // 3. Fetch Authoritative Mastery
                const masteryRes = await api.getLearnerMastery(currentLearner.id);
                const masteredList = (masteryRes.data || []).filter((cm: any) => cm.status === "MASTERED");
                setMasteredCount(masteredList.length);

                // 4. Resolve Active or Paused Session
                let sessionToUse: any = null;

                if (querySessionId) {
                    try {
                        const sessionRes = await api.getSession(querySessionId);
                        if (sessionRes.data && sessionRes.data.status !== "FINALIZED") {
                            sessionToUse = sessionRes.data;
                        }
                    } catch (e) {
                        console.error("Failed to load query session:", e);
                    }
                }

                if (!sessionToUse) {
                    const sessionsRes = await api.getLearnerSessions(currentLearner.id);
                    const active = (sessionsRes.data || []).find(
                        (s: any) => s.status === "READY" || s.status === "ACTIVE" || s.status === "PAUSED"
                    );
                    if (active) {
                        sessionToUse = active;
                    }
                }
                setActiveSession(sessionToUse);

                // 5. Fetch Authoritative Frontier Nodes via dynamic version
                const frontierRes = await api.getFrontier(currentLearner.id, version);
                setFrontierNodes(frontierRes.data?.frontierNodes || []);
            } catch (err: any) {
                console.error("Failed to load dashboard data:", err);
                setError(err.message || "Failed to load learner dashboard data.");
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [querySessionId]);

    const handleStartSession = async () => {
        if (!learner || structureVersion === null) return;
        try {
            setLoading(true);
            const sessionRes = await api.createSession(learner.id, structureVersion, timeBudget);
            const newSession = sessionRes.data || sessionRes;
            router.push(`/student/session?sessionId=${newSession.id}`);
        } catch (err: any) {
            console.error(err);
            alert("Failed to initialize session: " + err.message);
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
                <div className="animate-spin text-4xl mb-4">⚙️</div>
                <h2 className="text-xl font-bold">Synchronizing Learner Profile...</h2>
                <p className="text-slate-400">Loading dynamic frontier path...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
                <div className="text-5xl mb-4">⚠️</div>
                <h2 className="text-xl font-bold text-red-400">Unable to load Dashboard</h2>
                <p className="text-slate-400 mt-2">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-6 px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold transition-colors"
                >
                    Retry Connection
                </button>
            </div>
        );
    }

    if (noLearner) {
        return (
            <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
                <div className="text-6xl mb-4">👤</div>
                <h2 className="text-2xl font-black text-white">No Active Learner Found</h2>
                <p className="text-slate-400 mt-2 max-w-md">
                    We couldn't resolve a valid learner profile linked to your user account. Please contact your parent to set up your student profile.
                </p>
                <Link href="/login">
                    <button className="mt-6 px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-slate-200 transition-all">
                        Return to Login
                    </button>
                </Link>
            </div>
        );
    }

    if (noEnrollment) {
        return (
            <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
                <div className="text-6xl mb-4">📚</div>
                <h2 className="text-2xl font-black text-white">Not Enrolled Yet</h2>
                <p className="text-slate-400 mt-2 max-w-md">
                    Welcome, {learner?.name}! You are not currently enrolled in any curriculum subjects. Please ask your parent to assign or enroll you in a subject path.
                </p>
                <Link href="/subject/explore">
                    <button className="mt-6 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all">
                        Explore Subjects
                    </button>
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white overflow-x-hidden font-sans">
            {/* Header: Dynamic Player HUD */}
            <div className="fixed top-0 left-0 w-full z-50 p-6 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-yellow-400 to-orange-500 border-2 border-white/20 shadow-[0_0_20px_rgba(234,179,8,0.5)]"></div>
                    <div>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Learner</div>
                        <div className="font-black text-xl">{learner?.name}</div>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10 backdrop-blur-md">
                        <span className="text-xl">🏆</span>
                        <span className="font-black text-yellow-400">{masteredCount} Concepts Mastered</span>
                    </div>
                </div>
            </div>

            {/* Main Content: Dynamic Quest Map */}
            <div className="relative min-h-screen flex flex-col justify-center items-center px-6 pt-24 pb-20">
                <div className="max-w-4xl w-full text-center mb-12">
                    <h1 className="text-4xl font-extrabold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                        Universal Curriculum Journey
                    </h1>
                    <p className="text-slate-400 max-w-xl mx-auto">
                        Your learning path adjusts automatically as you master concepts. View your active targets below.
                    </p>
                </div>

                <div className="w-full max-w-4xl bg-slate-900/40 border border-white/10 rounded-3xl p-8 backdrop-blur-md">
                    {activeSession ? (
                        /* Active Session Prompt */
                        <div className="text-center py-6">
                            <div className="text-5xl mb-4">⚡</div>
                            <h2 className="text-2xl font-bold mb-2">Active Session In Progress</h2>
                            <p className="text-slate-400 mb-6 max-w-md mx-auto">
                                You have an open learning session. Continue now to complete your current steps and update your frontier.
                            </p>
                            <Link href={`/student/session?sessionId=${activeSession.id}`}>
                                <button className="px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-black rounded-2xl shadow-lg transform hover:-translate-y-1 transition-all">
                                    RESUME ACTIVE SESSION ▶
                                </button>
                            </Link>
                        </div>
                    ) : (
                        /* Dynamic Frontier Roadmap */
                        <div>
                            <h2 className="text-xl font-bold mb-6 text-left flex items-center gap-2">
                                <span className="text-teal-400">🎯</span> Current Frontier Targets
                            </h2>
                            {frontierNodes.length === 0 ? (
                                <div className="text-center py-8">
                                    <div className="text-5xl mb-4">🎉</div>
                                    <h3 className="text-lg font-bold">Curriculum Fully Mastered!</h3>
                                    <p className="text-slate-400 mt-1">You have completed all sequenced topics in this curriculum version.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                    {frontierNodes.map((node: any, idx: number) => {
                                        const conceptName = node.concept?.canonicalName || `Concept Node ${node.sequenceIndex}`;
                                        const color = COLOR_PALETTE[idx % COLOR_PALETTE.length];
                                        return (
                                            <div
                                                key={node.id}
                                                className={`relative rounded-2xl bg-gradient-to-br ${color} p-0.5 shadow-xl`}
                                            >
                                                <div className="bg-slate-950 rounded-[0.9rem] p-6 h-full flex flex-col justify-between">
                                                    <div>
                                                        <div className="flex justify-between items-start mb-4">
                                                            <span className="text-4xl">{getEmojiForConcept(conceptName)}</span>
                                                            <span className="px-3 py-1 bg-white/5 rounded-full text-xs font-bold text-slate-400 border border-white/5">
                                                                Target Node
                                                            </span>
                                                        </div>
                                                        <h3 className="text-xl font-extrabold text-white mb-2 leading-tight">
                                                            {conceptName}
                                                        </h3>
                                                        <p className="text-sm text-slate-400">
                                                            Grade Band: {node.gradeBand || "PRIMARY"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {frontierNodes.length > 0 && (
                                <div className="border-t border-white/10 pt-8 mt-8 max-w-md mx-auto flex flex-col items-center">
                                    <div className="w-full mb-6">
                                        <label className="block text-sm font-bold text-slate-400 uppercase tracking-wider mb-2 text-center">
                                            ⏱️ Session Time Budget
                                        </label>
                                        <select
                                            value={timeBudget}
                                            onChange={(e) => setTimeBudget(parseInt(e.target.value, 10))}
                                            className="w-full bg-slate-900 border border-white/20 rounded-xl px-4 py-3 text-white font-bold focus:outline-none focus:border-teal-400 transition-colors"
                                        >
                                            <option value={15}>15 Minutes (Micro session)</option>
                                            <option value={30}>30 Minutes (Standard session)</option>
                                            <option value={45}>45 Minutes (Focus session)</option>
                                            <option value={60}>60 Minutes (Deep study session)</option>
                                        </select>
                                    </div>

                                    <button
                                        onClick={handleStartSession}
                                        className="px-10 py-4 bg-gradient-to-r from-teal-400 to-emerald-500 hover:from-teal-500 hover:to-emerald-600 text-slate-950 font-black rounded-2xl shadow-xl transform hover:-translate-y-1 transition-all"
                                    >
                                        START TODAY'S SESSION ▶
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Floating Navigation Bar */}
            <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 px-8 py-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full flex gap-8 z-50 shadow-2xl">
                <Link href="/student/welcome" className="text-2xl hover:scale-125 transition-transform text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400">🏠</Link>
                <Link href="#" className="text-2xl hover:scale-125 transition-transform opacity-50 hover:opacity-100">🗺️</Link>
                <Link href="#" className="text-2xl hover:scale-125 transition-transform opacity-50 hover:opacity-100">🏆</Link>
            </div>
        </div>
    );
}

export default function StudentWelcomePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
                <div className="animate-spin text-4xl mb-4">⚙️</div>
                <h2 className="text-xl font-bold">Loading Quest Map...</h2>
            </div>
        }>
            <StudentWelcomeContent />
        </Suspense>
    );
}
