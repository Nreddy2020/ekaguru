'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Home, 
  GraduationCap, 
  BookOpen, 
  GitFork, 
  TrendingUp, 
  Users, 
  Trophy, 
  MessageSquare,
  Upload,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  FileText,
  ChevronDown
} from 'lucide-react';
import { api, LearningMaterial } from '../../lib/api-client';

const ButterflyLogo = () => (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M15 16C15 16 9 8 5 12C2 15 3 21 8 22C12 23 15 16 15 16Z" fill="url(#butterfly_grad_left)" opacity="0.85" />
        <path d="M15 16C15 16 10 22 7 20C4 18 5 13 8 12C11 11 15 16 15 16Z" fill="url(#butterfly_grad_left_lower)" opacity="0.75" />
        <path d="M17 16C17 16 23 8 27 12C30 15 29 21 24 22C20 23 17 16 17 16Z" fill="url(#butterfly_grad_right)" opacity="0.85" />
        <path d="M17 16C17 16 22 22 25 20C28 18 27 13 24 12C21 11 17 16 17 16Z" fill="url(#butterfly_grad_right_lower)" opacity="0.75" />
        <path d="M16 8V24" stroke="#FFE259" strokeWidth="2" strokeLinecap="round" />
        <circle cx="16" cy="6" r="2" fill="#FFA07A" />
        <path d="M16 10C16 10 14 6 12 7" stroke="#FFE259" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M16 10C16 10 18 6 20 7" stroke="#FFE259" strokeWidth="1.5" strokeLinecap="round" />
        <defs>
            <linearGradient id="butterfly_grad_left" x1="5" y1="12" x2="15" y2="22" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#ec4899" />
                <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
            <linearGradient id="butterfly_grad_left_lower" x1="7" y1="12" x2="15" y2="20" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
            <linearGradient id="butterfly_grad_right" x1="27" y1="12" x2="17" y2="22" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#ec4899" />
                <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
            <linearGradient id="butterfly_grad_right_lower" x1="25" y1="12" x2="17" y2="20" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
        </defs>
    </svg>
);

const BoyAvatar = () => (
    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-500 to-rose-400 p-[1.5px] shrink-0">
        <div className="w-full h-full rounded-full bg-[#0a0f24] flex items-center justify-center text-xs font-bold text-amber-300">
            👦🏽
        </div>
    </div>
);

export default function UploadPage() {
    const [file, setFile] = useState<File | null>(null);
    const [title, setTitle] = useState('');
    const [subjectName, setSubjectName] = useState('Science');
    const [gradeLevel, setGradeLevel] = useState(5);
    const [activeLearner, setActiveLearner] = useState<any>(null);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [statusStage, setStatusStage] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<any>(null);

    const navItems = [
        { name: "Home", icon: Home, active: false, href: "/library" },
        { name: "Learn", icon: GraduationCap, active: false, href: "/learn" },
        { name: "Library", icon: BookOpen, active: true, href: "/library" },
        { name: "Knowledge Map", icon: GitFork, active: false, href: "/knowledge-map" },
        { name: "My Growth", icon: TrendingUp, active: false, href: "/growth" },
        { name: "For Parents", icon: Users, active: false, href: "/parent/dashboard" },
        { name: "Achievements", icon: Trophy, active: false, href: "/library" },
        { name: "Messages", icon: MessageSquare, active: false, href: "/library" },
    ];

    useEffect(() => {
        const initProfile = async () => {
            try {
                let token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
                if (!token) {
                    const loginRes = await api.login('demo@ekaguru.com', 'password123');
                    if (loginRes.access_token && typeof window !== 'undefined') {
                        localStorage.setItem('token', loginRes.access_token);
                    }
                }
                const res = await api.getLearners();
                if (res.data && res.data.length > 0) {
                    setActiveLearner(res.data[0]);
                }
            } catch (err: any) {
                console.error('Failed to init profile:', err);
            }
        };
        initProfile();
    }, []);

    const handleFileSelect = (selectedFile: File) => {
        const maxSize = 50 * 1024 * 1024;
        if (selectedFile.size > maxSize) {
            setError('File size exceeds maximum 50MB limit.');
            return;
        }
        setFile(selectedFile);
        if (!title) {
            setTitle(selectedFile.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
        }
        setError(null);
    };

    const handleUploadAndProcess = async () => {
        if (!file) {
            setError('Please select a file to upload.');
            return;
        }

        setUploading(true);
        setError(null);
        setProgress(10);
        setStatusStage('Validating & Uploading Document...');

        try {
            const learnerId = activeLearner?.id || 'learner-default-001';
            const uploadRes = await api.uploadLearningMaterial(
                file,
                {
                    learnerId,
                    title: title.trim() || file.name,
                    subjectName,
                    gradeLevel,
                    materialType: 'TEXTBOOK',
                },
                (prog) => setProgress(Math.min(prog, 60)),
            ) as any;

            const materialId = uploadRes?.data?.id;
            setProgress(70);
            setStatusStage('Triggering M2 Page Truth & Structure Pipeline...');

            if (materialId) {
                try {
                    await api.processLearningMaterial(materialId);
                } catch (procErr: any) {
                    console.log('Background processing running or queued:', procErr?.message);
                }
            }

            setProgress(100);
            setStatusStage('Processing Completed Successfully!');
            setResult(uploadRes?.data);
        } catch (err: any) {
            setError(err?.message || 'Upload failed. Check VITALIS Observability for detailed trace.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#03050c] text-white flex overflow-x-hidden">
            {/* 1. Left Side Pane (Fixed 220px Width) */}
            <aside className="w-[220px] min-w-[220px] bg-[#050814] border-r border-white/5 flex flex-col p-4 shrink-0 h-screen fixed top-0 left-0 justify-between z-10">
                <div>
                    {/* Brand Logo */}
                    <div className="flex items-center gap-3 px-3 py-4 mb-6">
                        <ButterflyLogo />
                        <span className="text-xl font-bold tracking-[0.14em] text-white select-none">
                            EKAGURU
                        </span>
                    </div>

                    {/* Nav Items */}
                    <nav className="space-y-1">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all select-none ${
                                        item.active
                                            ? "bg-[#1d1b54] text-white font-semibold border border-purple-500/10 shadow-lg shadow-indigo-950/20"
                                            : "text-slate-400 hover:text-white hover:bg-white/5"
                                    }`}
                                >
                                    <Icon className={`w-5 h-5 shrink-0 ${item.active ? "text-purple-400" : "text-slate-400"}`} />
                                    <span className="text-sm tracking-wide">{item.name}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                {/* Bottom Active User Card */}
                <div className="px-2 py-3 border-t border-white/5 mt-auto">
                    <div className="flex items-center justify-between bg-white/[0.02] border border-white/5 rounded-2xl p-3 cursor-pointer hover:bg-white/[0.04] transition">
                        <div className="flex items-center gap-3">
                            <BoyAvatar />
                            <div className="text-left">
                                <span className="block text-sm font-bold text-white leading-none">
                                    {activeLearner?.name || 'Arjun'}
                                </span>
                                <span className="block text-[10px] text-slate-500 mt-1.5 font-semibold">
                                    Grade {activeLearner?.grade || 5}
                                </span>
                            </div>
                        </div>
                        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                    </div>
                </div>
            </aside>

            {/* 2. Main Right Workspace (Offset by 220px) */}
            <div className="flex-1 ml-[220px] flex flex-col min-h-screen bg-[#03050c]">
                <main className="w-full px-8 lg:px-12 py-10 max-w-4xl">
                    <div className="space-y-6">
                    <div>
                        <Link href="/library" className="text-xs font-mono text-teal-300 hover:underline">
                            ← Back to Library
                        </Link>
                        <h1 className="text-3xl font-black text-white tracking-tight mt-2">
                            Add Learning Material
                        </h1>
                        <p className="text-sm text-slate-400 mt-1">
                            Upload a textbook chapter, worksheet, or notes to automatically extract concepts and structure through the M2 Pipeline.
                        </p>
                    </div>

                    {/* Form Controls */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-mono text-slate-400 block mb-1">MATERIAL TITLE</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g. NCERT Science Chapter 1 - Food"
                                className="w-full bg-[#070E1B] border border-[#1a2d4c] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-teal-400 font-sans"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-mono text-slate-400 block mb-1">SUBJECT</label>
                            <select
                                value={subjectName}
                                onChange={(e) => setSubjectName(e.target.value)}
                                className="w-full bg-[#070E1B] border border-[#1a2d4c] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-teal-400 font-sans"
                            >
                                <option value="Science">Science</option>
                                <option value="Mathematics">Mathematics</option>
                                <option value="Social Studies">Social Studies</option>
                                <option value="English">English</option>
                            </select>
                        </div>
                    </div>

                    {/* Dropzone */}
                    <div
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                            e.preventDefault();
                            if (e.dataTransfer.files[0]) handleFileSelect(e.dataTransfer.files[0]);
                        }}
                        onClick={() => document.getElementById('file-upload-input')?.click()}
                        className="p-10 rounded-2xl border-2 border-dashed border-[#1a2d4c] hover:border-teal-400/60 bg-[#070E1B] text-center cursor-pointer transition-all space-y-3"
                    >
                        <input
                            id="file-upload-input"
                            type="file"
                            accept=".pdf,.docx,.epub,.png,.jpg,.jpeg"
                            className="hidden"
                            onChange={(e) => {
                                if (e.target.files?.[0]) handleFileSelect(e.target.files[0]);
                            }}
                        />
                        <div className="w-14 h-14 rounded-2xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center mx-auto text-teal-300">
                            <Upload className="w-7 h-7" />
                        </div>
                        {file ? (
                            <div>
                                <div className="text-sm font-bold text-white flex items-center justify-center gap-2">
                                    <FileText className="w-4 h-4 text-teal-400" />
                                    {file.name}
                                </div>
                                <div className="text-xs text-slate-400 mt-0.5">
                                    {(file.size / (1024 * 1024)).toFixed(2)} MB • Ready to process
                                </div>
                            </div>
                        ) : (
                            <div>
                                <div className="text-sm font-bold text-white">
                                    Drop your document here, or <span className="text-teal-400 underline">browse</span>
                                </div>
                                <div className="text-xs text-slate-400 mt-1">
                                    Supports PDF, DOCX, EPUB, PNG, JPG (Max 50MB)
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Progress Bar & Status */}
                    {uploading && (
                        <div className="p-4 rounded-xl bg-[#0B1526] border border-[#1a2d4c] space-y-2">
                            <div className="flex items-center justify-between text-xs font-mono">
                                <span className="text-teal-300 font-bold">{statusStage}</span>
                                <span className="text-white font-bold">{progress}%</span>
                            </div>
                            <div className="w-full h-2 bg-[#040811] rounded-full overflow-hidden">
                                <div className="h-full bg-teal-400 transition-all duration-300" style={{ width: `${progress}%` }} />
                            </div>
                        </div>
                    )}

                    {/* Error Box */}
                    {error && (
                        <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-600/50 flex items-start gap-3 text-xs text-rose-300">
                            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                            <div>
                                <strong className="font-bold block text-white">Upload Error</strong>
                                {error}
                            </div>
                        </div>
                    )}

                    {/* Success Outcome */}
                    {result && (
                        <div className="p-5 rounded-2xl bg-emerald-950/25 border border-emerald-500/40 space-y-3">
                            <div className="flex items-center gap-2.5">
                                <CheckCircle className="w-5 h-5 text-emerald-400" />
                                <span className="text-sm font-bold text-white">
                                    Material Created &amp; Processing Initiated!
                                </span>
                            </div>
                            <p className="text-xs text-slate-300 font-sans">
                                Material <strong className="text-white">"{result.title}"</strong> has been saved and queued for M2 Structure extraction.
                            </p>
                            <div className="pt-2 flex items-center gap-3">
                                <Link
                                    href="/library"
                                    className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-black font-bold text-xs transition-colors shadow-sm"
                                >
                                    View in Library →
                                </Link>
                                <Link
                                    href="/observe"
                                    className="px-4 py-2 rounded-xl bg-[#070E1B] hover:bg-[#14233c] text-teal-300 border border-teal-500/40 text-xs font-mono font-bold transition-colors"
                                >
                                    Inspect Trace in VITALIS ◈
                                </Link>
                            </div>
                        </div>
                    )}

                    {/* Action Button */}
                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                        <span className="text-xs text-slate-500 flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4 text-teal-400" />
                            Monitored natively by VITALIS Causal Intelligence
                        </span>
                        <button
                            onClick={handleUploadAndProcess}
                            disabled={uploading || !file}
                            className="px-6 py-2.5 rounded-xl bg-[#6366f1] hover:bg-[#5558e6] disabled:opacity-50 text-white font-bold text-sm transition-all shadow-md flex items-center gap-2"
                        >
                            {uploading ? 'Processing...' : 'Upload & Process Material →'}
                        </button>
                    </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
