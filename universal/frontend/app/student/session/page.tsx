"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "../../../lib/api-client";
import StruggleModal from "../../../components/StruggleModal";

function TutorSessionContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const sessionId = searchParams.get("sessionId");

    const [session, setSession] = useState<any>(null);
    const [activeStep, setActiveStep] = useState<any>(null);
    const [stepContent, setStepContent] = useState<any>(null);
    const [assessmentInstance, setAssessmentInstance] = useState<any>(null);
    const [selectedAnswer, setSelectedAnswer] = useState<string>("");
    const [feedback, setFeedback] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showStruggleModal, setShowStruggleModal] = useState(false);

    // Fetch complete session details
    const refreshSessionData = async () => {
        if (!sessionId) {
            setError("Session ID is missing.");
            setLoading(false);
            return;
        }

        try {
            const res = await api.getSession(sessionId);
            const sessionData = res.data || res;
            setSession(sessionData);

            if (sessionData.status === "FINALIZED") {
                router.push("/student/welcome");
                return;
            }

            // Extract all steps in order of sequence
            const allSteps: any[] = [];
            (sessionData.targets || []).forEach((target: any) => {
                (target.steps || []).forEach((step: any) => {
                    allSteps.push({ ...step, target });
                });
            });

            // Find first incomplete step
            const active = allSteps.find(s => s.status !== "COMPLETED" && s.status !== "SKIPPED");
            setActiveStep(active || null);

            // Fetch active step contents
            if (active) {
                setStepContent(null);
                setAssessmentInstance(null);
                setSelectedAnswer("");
                setFeedback(null);

                if (active.stepType === "READ" || active.stepType === "PRACTICE") {
                    const contentRes = await api.getStepContent(sessionId, active.id);
                    setStepContent(contentRes.data || contentRes);
                } else if (active.stepType === "ASSESS") {
                    const instance = active.assessmentInstances?.[0] || active.assessmentInstance;
                    if (instance) {
                        const instRes = await api.getAssessmentInstance(sessionId, instance.id);
                        setAssessmentInstance(instRes.data || instRes);
                    }
                }
            }
        } catch (err: any) {
            console.error("Failed to load session details:", err);
            setError(err.message || "Failed to load active learning session.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshSessionData();
    }, [sessionId]);

    const handleStartSession = async () => {
        if (!sessionId) return;
        try {
            setLoading(true);
            await api.startSession(sessionId);
            await refreshSessionData();
        } catch (err: any) {
            console.error(err);
            alert("Failed to start session: " + err.message);
            setLoading(false);
        }
    };

    const handlePauseSession = async () => {
        if (!sessionId) return;
        try {
            setLoading(true);
            await api.pauseSession(sessionId);
            await refreshSessionData();
        } catch (err: any) {
            console.error(err);
            alert("Failed to pause session: " + err.message);
            setLoading(false);
        }
    };

    const handleResumeSession = async () => {
        if (!sessionId) return;
        try {
            setLoading(true);
            await api.resumeSession(sessionId);
            await refreshSessionData();
        } catch (err: any) {
            console.error(err);
            alert("Failed to resume session: " + err.message);
            setLoading(false);
        }
    };

    const handleCompleteStep = async () => {
        if (!activeStep || !sessionId) return;
        try {
            setLoading(true);
            await api.completeStep(sessionId, activeStep.id);
            await refreshSessionData();
        } catch (err: any) {
            console.error(err);
            alert("Failed to complete step: " + err.message);
            setLoading(false);
        }
    };

    const handleSubmitAssessment = async () => {
        if (!activeStep || !assessmentInstance || !selectedAnswer || !sessionId) return;
        try {
            setLoading(true);
            const res = await api.submitAssessmentResponse(sessionId, assessmentInstance.instanceId, selectedAnswer);
            const result = res.data || res;

            if (result.passed) {
                setFeedback("✅ Correct! Marking step complete...");
                setTimeout(async () => {
                    await api.completeStep(sessionId, activeStep.id);
                    await refreshSessionData();
                }, 1500);
            } else {
                setFeedback("❌ Incorrect. The assessment is completed.");
                setLoading(false);
            }
        } catch (err: any) {
            console.error(err);
            alert("Failed to submit response: " + err.message);
            setLoading(false);
        }
    };

    const handleFinalizeSession = async () => {
        if (!sessionId) return;
        try {
            setLoading(true);
            await api.completeSession(sessionId);
            router.push("/student/welcome");
        } catch (err: any) {
            console.error(err);
            alert("Failed to finalize session: " + err.message);
            setLoading(false);
        }
    };

    if (loading && !session) {
        return (
            <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
                <div className="animate-spin text-4xl mb-4">⚙️</div>
                <h2 className="text-xl font-bold">Synchronizing Session...</h2>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
                <div className="text-5xl mb-4">⚠️</div>
                <h2 className="text-xl font-bold text-red-400">Failed to load session</h2>
                <p className="text-slate-400 mt-2">{error}</p>
                <Link href="/student/welcome">
                    <button className="mt-6 px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold transition-colors">
                        Return to Dashboard
                    </button>
                </Link>
            </div>
        );
    }

    // Explicit READY State Screen
    if (session?.status === "READY") {
        return (
            <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
                <div className="text-6xl mb-6">🚀</div>
                <h2 className="text-3xl font-black mb-2">Your Learning Session is Ready</h2>
                <p className="text-slate-400 max-w-md mb-8">
                    Session Duration Budget: {session.timeBudgetSeconds / 60} Minutes. Prepare your study space, click below to start, and begin learning.
                </p>
                <button
                    onClick={handleStartSession}
                    className="px-10 py-4 bg-gradient-to-r from-teal-400 to-emerald-500 hover:from-teal-500 hover:to-emerald-600 text-slate-950 font-black rounded-2xl shadow-xl transform hover:-translate-y-1 transition-all"
                >
                    START LEARNING SESSION ▶
                </button>
            </div>
        );
    }

    // Explicit PAUSED State Screen
    if (session?.status === "PAUSED") {
        return (
            <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
                <div className="text-6xl mb-6">⏸️</div>
                <h2 className="text-3xl font-black mb-2">Session Paused</h2>
                <p className="text-slate-400 max-w-md mb-8">
                    Your session progress has been saved. You can take a break and resume whenever you're ready to continue.
                </p>
                <button
                    onClick={handleResumeSession}
                    className="px-10 py-4 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-black rounded-2xl shadow-xl transform hover:-translate-y-1 transition-all"
                >
                    RESUME LEARNING SESSION ▶
                </button>
            </div>
        );
    }

    // Flat list of steps for progress bar
    const stepsList: any[] = [];
    (session?.targets || []).forEach((t: any) => {
        (t.steps || []).forEach((s: any) => {
            stepsList.push(s);
        });
    });
    const completedStepsCount = stepsList.filter(s => s.status === "COMPLETED" || s.status === "SKIPPED").length;
    const progressPercent = stepsList.length > 0 ? (completedStepsCount / stepsList.length) * 100 : 0;

    return (
        <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col">
            <StruggleModal
                isOpen={showStruggleModal}
                onClose={() => setShowStruggleModal(false)}
                onHint={() => {
                    setShowStruggleModal(false);
                    setFeedback("💡 Hint: Read the safe reference instructions carefully.");
                }}
            />

            {/* Top HUD */}
            <div className="bg-slate-900/80 backdrop-blur-md p-4 flex items-center justify-between border-b border-white/10 sticky top-0 z-50">
                <Link href="/student/welcome" className="text-2xl text-slate-400 hover:text-white">×</Link>
                <div className="flex-1 max-w-xs mx-4">
                    <div className="bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                            className="bg-pink-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${progressPercent}%` }}
                        ></div>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={handlePauseSession}
                        className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold text-slate-300 border border-white/10 transition-colors"
                    >
                        ⏸️ PAUSE
                    </button>
                    <div className="font-black text-pink-500 text-sm">
                        {completedStepsCount} / {stepsList.length} Steps
                    </div>
                </div>
            </div>

            {/* Main Interactive Workspace */}
            <div className="flex-1 max-w-2xl w-full mx-auto p-6 flex flex-col justify-center pb-32">
                {activeStep ? (
                    <div className="space-y-8 animate-fade-in-up">
                        {/* Step Category Card */}
                        <div className="bg-slate-900 border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4">
                                <span className="px-3 py-1 bg-white/5 rounded-full text-xs font-bold text-slate-400 border border-white/5">
                                    {activeStep.stepType}
                                </span>
                            </div>

                            <div className="mb-6">
                                <div className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">
                                    Active Target Concept
                                </div>
                                <h2 className="text-2xl font-black text-white">
                                    {stepContent?.conceptName || "Evaluating Concept..."}
                                </h2>
                            </div>

                            {/* READ / PRACTICE Panel */}
                            {(activeStep.stepType === "READ" || activeStep.stepType === "PRACTICE") && (
                                <div className="space-y-6">
                                    <div className="p-4 bg-slate-950 rounded-2xl border border-white/5">
                                        <h3 className="font-bold text-slate-300 mb-2">Instructions</h3>
                                        <p className="text-slate-400 leading-relaxed">
                                            Focus on mastering this concept. Utilize any provided documentation details aligned to this topic.
                                        </p>
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            onClick={handleCompleteStep}
                                            className="px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-black rounded-2xl shadow-lg transition-all"
                                        >
                                            COMPLETE & CONTINUE ▶
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* ASSESS Panel */}
                            {activeStep.stepType === "ASSESS" && assessmentInstance && (
                                <div className="space-y-6">
                                    <div className="p-4 bg-slate-950 rounded-2xl border border-white/5">
                                        <h3 className="font-bold text-slate-300 mb-4">
                                            Question: {assessmentInstance.configuration?.question || "Read the question below."}
                                        </h3>
                                        <div className="space-y-3">
                                            {(assessmentInstance.configuration?.options || []).map((opt: string) => (
                                                <button
                                                    key={opt}
                                                    onClick={() => {
                                                        if (!feedback) setSelectedAnswer(opt);
                                                    }}
                                                    disabled={!!feedback}
                                                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                                                        selectedAnswer === opt
                                                            ? "bg-pink-500/20 border-pink-500 text-white font-bold"
                                                            : "bg-slate-900 border-white/5 text-slate-300 hover:bg-white/5"
                                                    } ${feedback ? "opacity-60 cursor-not-allowed" : ""}`}
                                                >
                                                    {opt}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {feedback && (
                                        <div className={`p-4 rounded-xl text-center font-bold ${feedback.includes("Correct") ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                                            {feedback}
                                        </div>
                                    )}

                                    <div className="flex justify-between items-center mt-6">
                                        <button
                                            onClick={() => setShowStruggleModal(true)}
                                            className="text-xs font-bold text-slate-400 hover:text-pink-500 transition-colors"
                                        >
                                            💡 Productive Struggle Aid
                                        </button>

                                        {feedback && feedback.includes("Incorrect") ? (
                                            <button
                                                onClick={handleCompleteStep}
                                                className="px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-black rounded-2xl shadow-lg transition-all"
                                            >
                                                CONTINUE ▶
                                            </button>
                                        ) : (
                                            <button
                                                onClick={handleSubmitAssessment}
                                                disabled={!selectedAnswer || !!feedback}
                                                className="px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 text-white font-black rounded-2xl shadow-lg transition-all"
                                            >
                                                SUBMIT ANSWER
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    /* Finalization State */
                    <div className="text-center space-y-6 animate-fade-in-up">
                        <div className="text-7xl">🏁</div>
                        <h2 className="text-3xl font-black">All Steps Complete!</h2>
                        <p className="text-slate-400 max-w-md mx-auto">
                            You've completed every step in this learning session. Finalize the session now to update your concept mastery and unlock the next frontier nodes.
                        </p>
                        <button
                            onClick={handleFinalizeSession}
                            className="px-10 py-4 bg-gradient-to-r from-teal-400 to-emerald-500 hover:from-teal-500 hover:to-emerald-600 text-slate-950 font-black rounded-2xl shadow-2xl transition-all transform hover:-translate-y-1"
                        >
                            FINALIZE SESSION & ADVANCE ▶
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function TutorSession() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
                <div className="animate-spin text-4xl mb-4">⚙️</div>
                <h2 className="text-xl font-bold">Initializing Player Workspace...</h2>
            </div>
        }>
            <TutorSessionContent />
        </Suspense>
    );
}
