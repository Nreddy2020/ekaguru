"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ChildSetupPage() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const avatars = ["👩‍🚀", "🦁", "🎨", "🤖", "🦕", "🦸", "🧚", "🐵"];

    const handleContinue = () => {
        if (!name || !selectedAvatar) return;
        setLoading(true);
        setTimeout(() => {
            router.push("/subject/create"); // Navigate to Subject Creation
        }, 1000);
    };

    return (
        <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
            {/* Same Vibrant Background as Login for Consistency */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#FFDEE9] via-[#B5FFFC] to-[#D4FC79] opacity-80 z-0"></div>

            {/* Decor Blobs */}
            <div className="absolute top-10 left-10 w-64 h-64 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
            <div className="absolute bottom-10 right-10 w-64 h-64 bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

            {/* Main Card */}
            <div className="relative z-10 bg-white/70 backdrop-blur-xl border border-white/50 rounded-3xl shadow-2xl w-full max-w-lg p-8 md:p-10 transform transition-all">

                {/* Progress Indicator */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex gap-2">
                        <div className="h-2 w-8 bg-slate-800 rounded-full"></div>
                        <div className="h-2 w-2 bg-slate-300 rounded-full"></div>
                        <div className="h-2 w-2 bg-slate-300 rounded-full"></div>
                    </div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Step 1 of 3</span>
                </div>

                <div className="text-center mb-8">
                    <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight mb-2">
                        Who is Learning?
                    </h1>
                    <p className="text-slate-600">
                        Create a profile for your child to personalize their journey.
                    </p>
                </div>

                {/* Avatar Selection */}
                <div className="mb-8">
                    <label className="block text-sm font-bold text-slate-700 mb-3 uppercase tracking-wide">Choose an Avatar</label>
                    <div className="grid grid-cols-4 gap-4">
                        {avatars.map((avatar) => (
                            <button
                                key={avatar}
                                onClick={() => setSelectedAvatar(avatar)}
                                className={`text-3xl w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-200 border-2
                                    ${selectedAvatar === avatar
                                        ? "bg-white border-blue-500 shadow-md scale-110"
                                        : "bg-white/40 border-transparent hover:bg-white hover:scale-105"}
                                `}
                            >
                                {avatar}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Name Input */}
                <div className="mb-8 space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Child's Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Maya"
                            className="w-full px-5 py-4 rounded-xl bg-white/60 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all text-lg font-bold text-slate-800 placeholder:text-slate-400"
                        />
                    </div>
                </div>

                {/* Continue Button */}
                <button
                    onClick={handleContinue}
                    disabled={!name || !selectedAvatar || loading}
                    className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all duration-300 transform
                        ${name && selectedAvatar
                            ? "bg-slate-900 text-white hover:bg-slate-800 hover:-translate-y-1 hover:shadow-xl"
                            : "bg-slate-200 text-slate-400 cursor-not-allowed"}
                    `}
                >
                    {loading ? "Creating Profile..." : "Create Profile →"}
                </button>

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
