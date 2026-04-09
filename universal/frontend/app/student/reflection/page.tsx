"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ReflectionPage() {
    const router = useRouter();
    const [thought, setThought] = useState("");
    const [loading, setLoading] = useState(false);

    const handleFinish = () => {
        if (!thought) return;
        setLoading(true);
        setTimeout(() => {
            router.push("/student/summary");
        }, 1000);
    };

    return (
        <div className="min-h-screen bg-[#F0FDF4] relative overflow-hidden flex items-center justify-center p-4">
            {/* Calming Green/Blue Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#E0F2FE] to-[#DCFCE7] opacity-90 z-0"></div>

            <div className="relative z-10 w-full max-w-lg">

                <div className="text-center mb-10">
                    <div className="text-6xl mb-4 animate-bounce">🤔</div>
                    <h1 className="text-3xl font-black text-slate-800 mb-2">
                        Pause & Reflect
                    </h1>
                    <p className="text-slate-600 font-bold">
                        Cognitive Science Fact: Reflecting helps you learn 2x faster!
                    </p>
                </div>

                <div className="bg-white rounded-3xl p-8 shadow-xl border border-white/50">
                    <label className="block text-sm font-black text-slate-500 uppercase tracking-widest mb-4">
                        One thing I learned today was...
                    </label>

                    <textarea
                        value={thought}
                        onChange={(e) => setThought(e.target.value)}
                        placeholder="e.g. I learned that neurons are like decision makers..."
                        className="w-full h-40 p-5 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-green-400 focus:bg-white focus:ring-4 focus:ring-green-100 outline-none transition-all text-lg font-medium text-slate-700 placeholder:text-slate-400 resize-none mb-6"
                    ></textarea>

                    <button
                        onClick={handleFinish}
                        disabled={!thought}
                        className={`w-full py-4 rounded-xl font-black text-lg shadow-lg transition-all transform
                            ${thought
                                ? "bg-green-500 text-white hover:bg-green-600 hover:-translate-y-1 hover:shadow-xl"
                                : "bg-slate-200 text-slate-400 cursor-not-allowed"}
                        `}
                    >
                        {loading ? "Saving Core Memory..." : "Save Reflection →"}
                    </button>
                </div>

            </div>

        </div>
    );
}
