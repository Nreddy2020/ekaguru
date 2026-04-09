"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";


export default function CreateSubjectPage() {
    const router = useRouter();
    const [topic, setTopic] = useState("");
    const [isDragging, setIsDragging] = useState(false);
    const [loading, setLoading] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleGenerate = () => {
        if (!topic && !file) return;
        setLoading(true);
        // Simulate AI Architecting
        const targetTopic = file ? file.name.replace(/\.pdf$/i, "") : topic;
        setTimeout(() => {
            router.push(`/subject/ingest?topic=${encodeURIComponent(targetTopic)}`);
        }, 1500);
    };

    const handleFile = (selectedFile: File) => {
        // Allow PDF mime type or .pdf extension check
        if (selectedFile && (selectedFile.type === "application/pdf" || selectedFile.name.toLowerCase().endsWith(".pdf"))) {
            setFile(selectedFile);
            setTopic(selectedFile.name.replace(/\.pdf$/i, "")); // Case-insensitive replace
        } else {
            alert("Please upload a PDF file.");
        }
    };

    return (
        <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
            {/* Vibrant Background - Shifted Hue for 'Creation' Mode */}
            <div className="absolute inset-0 bg-gradient-to-tr from-[#8EC5FC] via-[#E0C3FC] to-[#8EC5FC] opacity-90 z-0"></div>

            {/* Decor Elements */}
            <div className="absolute top-20 right-20 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob"></div>
            <div className="absolute bottom-20 left-20 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-2000"></div>

            <div className="relative z-10 w-full max-w-2xl">

                {/* Header */}
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
                        What shall we learn today? 🎩
                    </h1>
                    <p className="text-lg text-slate-700 font-medium">
                        I can generate a world-class curriculum for anything.
                    </p>
                </div>

                {/* Main Card */}
                <div className="bg-white/80 backdrop-blur-xl border-2 border-white rounded-3xl shadow-xl p-8 mb-8 transition-all hover:shadow-2xl">

                    {/* Input Field */}
                    <div className="mb-8">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
                            Option 1: Type a Topic
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                placeholder="e.g. Quantum Physics, Renaissance Art, Python..."
                                className="w-full px-6 py-5 rounded-2xl bg-white border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all text-xl font-bold text-slate-800 placeholder:text-slate-300 shadow-inner"
                            />
                            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-2xl animate-pulse">
                                ✨
                            </div>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="flex items-center gap-4 mb-8 opacity-50">
                        <div className="h-px bg-slate-400 flex-1"></div>
                        <span className="text-sm font-bold text-slate-500">OR</span>
                        <div className="h-px bg-slate-400 flex-1"></div>
                    </div>

                    {/* Upload Zone */}
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-3 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-300 group relative
                            ${isDragging ? "border-blue-500 bg-blue-50 scale-105" : "border-slate-300 hover:border-blue-400 hover:bg-slate-50"}
                            ${file ? "bg-green-50 border-green-400" : ""}
                        `}
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={(e) => {
                            e.preventDefault();
                            setIsDragging(false);
                            if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
                        }}
                    >
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept=".pdf"
                            onChange={(e) => {
                                if (e.target.files?.[0]) handleFile(e.target.files[0]);
                            }}
                        />

                        {file ? (
                            <div className="animate-fade-in-up">
                                <div className="text-5xl mb-2">📄</div>
                                <h3 className="font-bold text-green-700 text-lg">{file.name}</h3>
                                <p className="text-sm text-green-600 font-bold">Ready to ingest!</p>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setFile(null); setTopic(""); }}
                                    className="mt-4 px-4 py-2 bg-white text-red-500 border border-red-200 rounded-xl text-xs font-bold uppercase hover:bg-red-50"
                                >
                                    Remove
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">📚</div>
                                <h3 className="font-bold text-slate-700 text-lg">Drop a Textbook PDF here</h3>
                                <p className="text-sm text-slate-500 mt-1">We'll turn it into a gamified course.</p>
                            </>
                        )}
                    </div>
                </div>

                {/* Generate Button */}
                <button
                    onClick={handleGenerate}
                    disabled={!topic && !file}
                    className={`w-full py-5 rounded-2xl font-black text-xl shadow-xl transition-all duration-300 transform
                        ${topic || file
                            ? "bg-slate-900 text-white hover:scale-[1.02] hover:shadow-2xl hover:bg-black"
                            : "bg-white/50 text-slate-400 cursor-not-allowed"}
                    `}
                >
                    {loading ? (
                        <span className="flex items-center justify-center gap-3">
                            <span className="animate-spin text-2xl">⚙️</span>
                            Architecting Your Path...
                        </span>
                    ) : (
                        "Generate Magic Curriculum 🚀"
                    )}
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
