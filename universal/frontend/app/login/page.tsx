"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const router = useRouter();
    const [consent, setConsent] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleLogin = () => {
        if (!consent) return;
        setLoading(true);
        // Mimic login delay with a playful loading state
        setTimeout(() => {
            router.push("/parent/child-setup");
        }, 800);
    };

    return (
        <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
            {/* Vibrant Background Gradient (Ref 76/79 inspired) */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#FFDEE9] via-[#B5FFFC] to-[#D4FC79] opacity-80 z-0"></div>

            {/* Animated Decor Circles */}
            <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
            <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-32 left-20 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>

            {/* Glassmorphism Card */}
            <div className="relative z-10 bg-white/60 backdrop-blur-xl border border-white/50 rounded-3xl shadow-2xl w-full max-w-md p-8 md:p-10 transform transition-all hover:scale-[1.01]">

                {/* Brand Header */}
                <div className="text-center mb-8">
                    <div className="inline-block p-3 rounded-2xl bg-gradient-to-tr from-blue-500 to-teal-400 shadow-lg mb-4">
                        <span className="text-3xl">🚀</span>
                    </div>
                    <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight mb-2">
                        Welcome to Ekaguru
                    </h1>
                    <p className="text-slate-600 font-medium">
                        Your AI-Powered Learning Adventure
                    </p>
                </div>

                {/* Login Section */}
                <div className="space-y-6">
                    <div className="bg-white/50 rounded-2xl p-6 border border-white/60">
                        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 text-center">
                            Start Your Journey
                        </h2>

                        {/* Google Button - Vibrant Style */}
                        <button
                            onClick={handleLogin}
                            disabled={!consent || loading}
                            className={`w-full group relative flex items-center justify-center gap-3 py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 transform
                                ${consent
                                    ? "bg-slate-900 text-white shadow-lg shadow-slate-300/50 hover:bg-slate-800 hover:-translate-y-1 active:translate-y-0"
                                    : "bg-slate-200 text-slate-400 cursor-not-allowed"}
                            `}
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <span className="animate-spin text-2xl">✨</span>
                                    Loading Universe...
                                </span>
                            ) : (
                                <>
                                    <svg className="w-5 h-5 transition-transform group-hover:rotate-12" viewBox="0 0 24 24">
                                        <path
                                            fill="currentColor"
                                            d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"
                                        />
                                    </svg>
                                    <span>Continue with Google</span>
                                </>
                            )}
                        </button>
                    </div>

                    {/* Fun Consent Toggle */}
                    <div
                        className="flex items-start gap-4 p-4 rounded-xl cursor-pointer transition-colors hover:bg-white/40"
                        onClick={() => setConsent(!consent)}
                    >
                        <div className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${consent ? "bg-green-500 border-green-500" : "border-slate-400"}`}>
                            {consent && <span className="text-white text-xs font-bold">✓</span>}
                        </div>
                        <div className="text-sm text-slate-600 leading-relaxed select-none">
                            <span className="font-bold text-slate-800">Mission Briefing:</span> I verify that I am the <strong>Parent/Guardian</strong>. I understand Ekaguru uses <strong>Generative AI</strong> to craft custom curriculums.
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-8 text-center">
                    <p className="text-xs text-slate-500 font-medium">
                        © 2026 Ekaguru Inc. • <Link href="#" className="underline decoration-slate-400 hover:text-slate-800">Privacy</Link>
                    </p>
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
                .animation-delay-4000 {
                    animation-delay: 4s;
                }
            `}</style>
        </div>
    );
}
