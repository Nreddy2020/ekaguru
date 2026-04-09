"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";

const AVATARS = [
    { id: "hero", emoji: "🦸", name: "The Hero", color: "bg-blue-500" },
    { id: "wizard", emoji: "🧙", name: "The Wizard", color: "bg-purple-500" },
    { id: "explorer", emoji: "🤠", name: "The Explorer", color: "bg-amber-500" },
    { id: "cyber", emoji: "🤖", name: "The Cyber", color: "bg-cyan-500" },
];

const STARTER_QUESTS = [
    { id: "robotics", emoji: "🤖", title: "Build Robots", desc: "Learn engineering & AI" },
    { id: "space", emoji: "🚀", title: "Conquer Space", desc: "Astrophysics & Rockets" },
    { id: "code", emoji: "💻", title: "Master Code", desc: "Python & Hacking" },
    { id: "money", emoji: "💰", title: "Get Rich", desc: "Finance & Investing" },
];

type Avatar = { id: string; emoji: string; name: string; color: string };
type Quest = { id: string; emoji: string; title: string; desc: string };

export default function OnboardingPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [selectedAvatar, setSelectedAvatar] = useState<Avatar | null>(null);
    const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);

    const handleNext = () => {
        if (step === 1 && selectedAvatar) setStep(2);
        else if (step === 2 && selectedQuest) {
            // "Warp" to the dynamic route
            router.push(`/subject/ingest?topic=${encodeURIComponent(selectedQuest.title)}`);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center overflow-hidden relative">

            {/* Ambient Background */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-800 via-slate-950 to-black z-0"></div>

            <div className="relative z-10 w-full max-w-4xl px-6 text-center">

                {/* Step Indicator */}
                <div className="flex justify-center gap-2 mb-8">
                    <div className={`h-2 w-16 rounded-full transition-all ${step >= 1 ? "bg-white" : "bg-white/20"}`}></div>
                    <div className={`h-2 w-16 rounded-full transition-all ${step >= 2 ? "bg-white" : "bg-white/20"}`}></div>
                </div>

                <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.5 }}
                >
                    {step === 1 ? (
                        <>
                            <h1 className="text-4xl md:text-6xl font-black mb-4">CHOOSE YOUR AVATAR</h1>
                            <p className="text-slate-400 text-xl mb-12">Who will you be in this universe?</p>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
                                {AVATARS.map((avatar) => (
                                    <button
                                        key={avatar.id}
                                        onClick={() => setSelectedAvatar(avatar)}
                                        className={`group relative p-6 rounded-3xl border-2 transition-all duration-300 ${selectedAvatar?.id === avatar.id
                                                ? "border-white bg-white/10 scale-105 shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                                                : "border-white/10 hover:border-white/50 hover:bg-white/5"
                                            }`}
                                    >
                                        <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">{avatar.emoji}</div>
                                        <div className="font-bold text-lg">{avatar.name}</div>
                                    </button>
                                ))}
                            </div>
                        </>
                    ) : (
                        <>
                            <h1 className="text-4xl md:text-6xl font-black mb-4">SELECT YOUR FIRST QUEST</h1>
                            <p className="text-slate-400 text-xl mb-12">What superpower do you want to unlock?</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                                {STARTER_QUESTS.map((quest) => (
                                    <button
                                        key={quest.id}
                                        onClick={() => setSelectedQuest(quest)}
                                        className={`group relative p-6 rounded-3xl border-2 transition-all duration-300 ${selectedQuest?.id === quest.id
                                                ? "border-emerald-500 bg-emerald-500/10 scale-105 shadow-[0_0_30px_rgba(16,185,129,0.3)]"
                                                : "border-white/10 hover:border-emerald-500/50 hover:bg-white/5"
                                            }`}
                                    >
                                        <div className="text-5xl mb-4 group-hover:rotate-12 transition-transform">{quest.emoji}</div>
                                        <div className="font-black text-xl mb-1">{quest.title}</div>
                                        <div className="text-sm text-slate-400">{quest.desc}</div>
                                    </button>
                                ))}
                            </div>

                            <div className="text-slate-500 text-sm font-bold">
                                OR <Link href="/subject/create" className="text-white hover:text-emerald-400 underline decoration-2 underline-offset-4 ml-2">Type your own topic</Link>
                            </div>
                        </>
                    )}
                </motion.div>

                {/* Continue Action */}
                <div className="mt-12 h-20">
                    {(step === 1 && selectedAvatar) || (step === 2 && selectedQuest) ? (
                        <motion.button
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            onClick={handleNext}
                            className="px-16 py-4 bg-white text-black font-black text-2xl rounded-full hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,255,0.5)] transition-all"
                        >
                            {step === 1 ? "CONFIRM AVATAR" : "START GAME 🚀"}
                        </motion.button>
                    ) : null}
                </div>

            </div>
        </div>
    );
}
