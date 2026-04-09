"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import StruggleModal from "../../../components/StruggleModal";

export default function TutorSession() {

    const [step, setStep] = useState(0);
    const [messages, setMessages] = useState<{ role: "u" | "ai", text: string }[]>([]);
    const [showModal, setShowModal] = useState(false);

    // Fake Script
    const script = [
        "Welcome to Neural Networks! 🧠 Ready to build a brain?",
        "First, imagine a single neuron. It takes inputs, weighs them, and fires giving an output.",
        "It's just like making a decision: 'Should I eat pizza?' 🍕 (Hunger + Taste > Cost)",
        "Now, connect millions of these... and you get ChatGPT!",
    ];

    useEffect(() => {
        // Initial Message
        if (step === 0 && messages.length === 0) {
            setTimeout(() => {
                setMessages([{ role: "ai", text: script[0] }]);
            }, 500);
        }
    }, [step, messages.length]);

    const handleNext = () => {
        const nextStep = step + 1;
        if (nextStep < script.length) {
            setStep(nextStep);
            setMessages(prev => [...prev, { role: "ai", text: script[nextStep] }]);
        } else {
            // End of Session - For demo, loop or stop
        }
    };

    const handleHint = () => {
        setShowModal(false);
        setMessages(prev => [...prev, { role: "ai", text: "Hint: Think of the neuron as a little gatekeeper. It only opens the gate if enough people push!" }]);
    };

    return (
        <div className="min-h-screen bg-[#FDF2F8] relative overflow-hidden font-sans flex flex-col">

            <StruggleModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onHint={handleHint}
            />

            {/* Top Bar */}
            <div className="bg-white/80 backdrop-blur-md p-4 flex items-center justify-between border-b border-pink-100 sticky top-0 z-50">
                <Link href="/student/topics" className="text-2xl text-slate-400 hover:text-slate-800">×</Link>
                <div className="flex-1 max-w-xs mx-4">
                    <div className="bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                            className="bg-pink-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${((step + 1) / script.length) * 100}%` }}
                        ></div>
                    </div>
                </div>
                <div className="font-black text-pink-500 text-sm">XP 125</div>
            </div>

            {/* Chat / Content Area */}
            <div className="flex-1 overflow-y-auto p-4 pb-32 space-y-6">

                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex gap-4 ${msg.role === "u" ? "flex-row-reverse" : ""} animate-fade-in-up`}>
                        {msg.role === "ai" && (
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-3xl border-2 border-white shadow-sm shrink-0">
                                👩‍🏫
                            </div>
                        )}
                        <div className={`p-4 rounded-2xl max-w-[80%] shadow-sm text-lg leading-relaxed
                            ${msg.role === "ai"
                                ? "bg-white text-slate-800 rounded-tl-none border border-slate-100"
                                : "bg-blue-600 text-white rounded-tr-none"}
                        `}>
                            {msg.text}
                        </div>
                    </div>
                ))}

                {/* Visual Aid (Mock) */}
                {step >= 1 && (
                    <div className="mx-16 bg-white rounded-2xl p-4 border-2 border-slate-100 shadow-sm animate-fade-in-up">
                        <div className="bg-slate-50 h-32 rounded-xl flex items-center justify-center border border-dashed border-slate-300 text-slate-400 font-bold">
                            [ DIAGRAM: NEURON INPUTS ]
                        </div>
                    </div>
                )}

            </div>

            {/* Bottom Controls */}
            <div className="fixed bottom-0 left-0 w-full bg-white p-4 border-t border-slate-100 shadow-2xl safe-area-pb">
                {/* Help Trigger */}
                <div className="max-w-xl mx-auto flex justify-end mb-2">
                    <button
                        onClick={() => setShowModal(true)}
                        className="text-xs font-bold text-slate-400 hover:text-pink-500 flex items-center gap-1 transition-colors"
                    >
                        💪 I'm Stuck (Productive Struggle)
                    </button>
                </div>

                <div className="max-w-xl mx-auto flex items-center gap-4">
                    <input
                        type="text"
                        placeholder="Ask a question..."
                        className="flex-1 bg-slate-100 border-none rounded-2xl px-5 py-4 font-bold text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-pink-400 outline-none"
                    />
                    <button
                        onClick={handleNext}
                        className="bg-pink-500 hover:bg-pink-600 text-white rounded-2xl px-8 py-4 font-black shadow-lg hover:translate-y-[-2px] active:translate-y-0 transition-all"
                    >
                        CONTINUE
                    </button>
                </div>
            </div>

            <style jsx global>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up {
                    animation: fadeInUp 0.5s ease-out forwards;
                }
            `}</style>
        </div>
    );
}
