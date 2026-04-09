"use client";

import React from "react";

interface StruggleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onHint: () => void;
}

export default function StruggleModal({ isOpen, onClose, onHint }: StruggleModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">

            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>

            {/* Modal Content */}
            <div className="relative bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-bounce-in">

                <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 text-6xl filter drop-shadow-lg">
                    💪
                </div>

                <div className="mt-8 text-center">
                    <h2 className="text-2xl font-black text-slate-800 mb-2">
                        Stuck? That's Good!
                    </h2>
                    <p className="text-slate-600 font-bold mb-6">
                        "Productive Struggle" triggers your brain to grow new connections.
                    </p>

                    <div className="space-y-3">
                        <button
                            onClick={onHint}
                            className="w-full py-3 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 rounded-xl font-black shadow-md hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                        >
                            <span>💡</span> Give me a Hint
                        </button>
                        <button
                            onClick={onClose}
                            className="w-full py-3 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-xl font-bold transition-colors"
                        >
                            Break it down visually
                        </button>
                        <button
                            onClick={onClose}
                            className="text-slate-400 font-bold text-sm mt-2 hover:text-slate-600"
                        >
                            I'll keep trying!
                        </button>
                    </div>
                </div>

            </div>

            <style jsx>{`
                @keyframes bounceIn {
                    0% { transform: scale(0.9); opacity: 0; }
                    60% { transform: scale(1.05); opacity: 1; }
                    100% { transform: scale(1); }
                }
                .animate-bounce-in {
                    animation: bounceIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
                }
            `}</style>
        </div>
    );
}
