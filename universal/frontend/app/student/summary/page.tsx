"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Confetti from "react-confetti"; // Note: Might need install, sticking to CSS for now to be safe, or just render conditional
// Actually, let's use CSS confetti or simple bubbles to avoid dependency issues for now.

export default function SummaryPage() {
    const [xp, setXp] = useState(0);

    useEffect(() => {
        // Animate XP
        let current = 0;
        const target = 150;
        const interval = setInterval(() => {
            current += 5;
            if (current >= target) {
                current = target;
                clearInterval(interval);
            }
            setXp(current);
        }, 20);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen bg-[#FFFBEB] relative overflow-hidden flex items-center justify-center p-4">

            {/* Celebration Background */}
            <div className="absolute inset-0 bg-gradient-to-tr from-[#FEF3C7] via-[#FFF1F2] to-[#FEF3C7] opacity-90 z-0"></div>

            {/* CSS Confetti (Simple Blobs) */}
            <div className="absolute top-1/4 left-1/4 w-4 h-4 bg-red-400 rounded-full animate-ping"></div>
            <div className="absolute top-1/3 right-1/4 w-6 h-6 bg-blue-400 rounded-full animate-ping animation-delay-500"></div>
            <div className="absolute bottom-1/3 left-1/3 w-5 h-5 bg-green-400 rounded-full animate-ping animation-delay-1000"></div>


            <div className="relative z-10 w-full max-w-md text-center">

                <div className="mb-6 transform transition-all hover:scale-110 duration-500">
                    <span className="text-8xl filter drop-shadow-xl">🎉</span>
                </div>

                <h1 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">
                    Session Complete!
                </h1>
                <p className="text-slate-600 font-bold text-lg mb-10">
                    You're getting smarter every day.
                </p>

                {/* Rewards Card */}
                <div className="bg-white rounded-3xl p-8 shadow-2xl border border-orange-100 mb-8 transform hover:scale-[1.02] transition-transform">
                    <div className="flex justify-center items-center gap-4 mb-4">
                        <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">
                            +{xp}
                        </div>
                        <div className="text-2xl font-black text-orange-400">XP</div>
                    </div>

                    <div className="bg-orange-50 rounded-xl p-4 flex items-center justify-between border border-orange-100">
                        <span className="font-bold text-slate-600">Daily Streak</span>
                        <span className="font-black text-orange-500">🔥 5 Days</span>
                    </div>
                </div>

                {/* Primary Action */}
                <Link href="/student/welcome" className="block w-full py-5 rounded-2xl bg-slate-900 text-white font-black text-xl shadow-xl hover:bg-slate-800 hover:-translate-y-1 transition-all">
                    Return to Home 🏠
                </Link>

            </div>
        </div>
    );
}
