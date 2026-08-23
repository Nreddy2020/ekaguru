"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { 
  Home, 
  GraduationCap, 
  BookOpen, 
  GitFork, 
  TrendingUp, 
  Users, 
  Trophy, 
  MessageSquare,
  Plus,
  Search,
  LayoutGrid,
  List as ListIcon,
  ChevronDown,
  ArrowRight,
  Book,
  FileText,
  Boxes,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  Clock,
  AlertTriangle,
  X
} from 'lucide-react';
import { api, LearningMaterial, LearningMaterialStage } from "../../lib/api-client";

// Precision 84x115px Custom SVG book covers matching target illustration compositions
const ScienceCover = () => (
    <svg width="84" height="115" viewBox="0 0 84 115" fill="none" xmlns="http://www.w3.org/2000/svg" className="rounded-lg shrink-0 border border-white/5 shadow-md">
        <rect width="84" height="115" rx="6" fill="url(#sci_bg)" />
        <path d="M0 115C15 112 30 112 84 115V115H0V115Z" fill="#047857" />
        <circle cx="58" cy="42" r="9" fill="#FDE047" opacity="0.15" />
        <path d="M42 92V66" stroke="#F59E0B" strokeWidth="4.5" strokeLinecap="round" />
        <circle cx="42" cy="52" r="16" fill="#10B981" />
        <circle cx="31" cy="44" r="12" fill="#059669" />
        <circle cx="53" cy="48" r="11" fill="#34D399" />
        <rect x="8" y="12" width="68" height="14" rx="3" fill="white" fillOpacity="0.15" />
        <text x="42" y="21" fill="white" fontSize="8" fontWeight="900" textAnchor="middle" letterSpacing="0.08em">SCIENCE</text>
        <defs>
            <linearGradient id="sci_bg" x1="0" y1="0" x2="84" y2="115" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#1E3A8A" />
                <stop offset="100%" stopColor="#0D9488" />
            </linearGradient>
        </defs>
    </svg>
);

const MathCover = () => (
    <svg width="84" height="115" viewBox="0 0 84 115" fill="none" xmlns="http://www.w3.org/2000/svg" className="rounded-lg shrink-0 border border-white/5 shadow-md">
        <rect width="84" height="115" rx="6" fill="url(#math_bg)" />
        <circle cx="56" cy="44" r="8" fill="#FBBF24" opacity="0.35" />
        <polygon points="22,82 42,42 62,82" fill="#FBBF24" opacity="0.85" />
        <polygon points="12,82 22,72 56,72 66,82" fill="#3B82F6" opacity="0.6" />
        <circle cx="42" cy="71" r="7.5" fill="#EF4444" opacity="0.95" />
        <rect x="8" y="12" width="68" height="14" rx="3" fill="white" fillOpacity="0.15" />
        <text x="42" y="21" fill="white" fontSize="6.5" fontWeight="900" textAnchor="middle" letterSpacing="0.06em">MATHEMATICS</text>
        <defs>
            <linearGradient id="math_bg" x1="0" y1="0" x2="84" y2="115" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#4C1D95" />
                <stop offset="100%" stopColor="#2563EB" />
            </linearGradient>
        </defs>
    </svg>
);

const EnglishCover = () => (
    <svg width="84" height="115" viewBox="0 0 84 115" fill="none" xmlns="http://www.w3.org/2000/svg" className="rounded-lg shrink-0 border border-white/5 shadow-md">
        <rect width="84" height="115" rx="6" fill="url(#eng_bg)" />
        <text x="42" y="74" fill="#A5B4FC" fontSize="46" fontFamily="Georgia, serif" fontWeight="black" textAnchor="middle" opacity="0.95">“</text>
        <rect x="8" y="12" width="68" height="18" rx="3" fill="white" fillOpacity="0.15" />
        <text x="42" y="21" fill="white" fontSize="8.5" fontWeight="900" textAnchor="middle" letterSpacing="0.08em">ENGLISH</text>
        <text x="42" y="27" fill="white" fontSize="7" fontWeight="900" textAnchor="middle" letterSpacing="0.08em">GRAMMAR</text>
        <defs>
            <linearGradient id="eng_bg" x1="0" y1="0" x2="84" y2="115" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#065F46" />
                <stop offset="100%" stopColor="#0891B2" />
            </linearGradient>
        </defs>
    </svg>
);

const SocialCover = () => (
    <svg width="84" height="115" viewBox="0 0 84 115" fill="none" xmlns="http://www.w3.org/2000/svg" className="rounded-lg shrink-0 border border-white/5 shadow-md">
        <rect width="84" height="115" rx="6" fill="url(#soc_bg)" />
        <path d="M22 84V56C22 46 32 42 42 42C52 42 62 46 62 56V84" stroke="#FDBA74" strokeWidth="3" strokeLinecap="round" />
        <path d="M30 84V70H54V84" fill="#78350F" stroke="#FDBA74" strokeWidth="2" />
        <path d="M42 42V32" stroke="#FDBA74" strokeWidth="2.5" />
        <circle cx="42" cy="30" r="2.5" fill="#FFE259" />
        <rect x="8" y="12" width="68" height="16" rx="3" fill="white" fillOpacity="0.15" />
        <text x="42" y="21" fill="white" fontSize="8.5" fontWeight="900" textAnchor="middle" letterSpacing="0.08em">OUR</text>
        <text x="42" y="27" fill="white" fontSize="7.5" fontWeight="900" textAnchor="middle" letterSpacing="0.06em">HERITAGE</text>
        <defs>
            <linearGradient id="soc_bg" x1="0" y1="0" x2="84" y2="115" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#78350F" />
                <stop offset="100%" stopColor="#D97706" />
            </linearGradient>
        </defs>
    </svg>
);

const HindiCover = () => (
    <svg width="84" height="115" viewBox="0 0 84 115" fill="none" xmlns="http://www.w3.org/2000/svg" className="rounded-lg shrink-0 border border-white/5 shadow-md">
        <rect width="84" height="115" rx="6" fill="url(#hindi_bg)" />
        <circle cx="42" cy="62" r="13" fill="#F87171" opacity="0.65" />
        <path d="M28 80C31 70 53 70 56 80" stroke="#FEE2E2" strokeWidth="2.5" />
        <rect x="8" y="12" width="68" height="18" rx="3" fill="white" fillOpacity="0.15" />
        <text x="42" y="21" fill="white" fontSize="9" fontWeight="900" textAnchor="middle" letterSpacing="0.08em">HINDI</text>
        <text x="42" y="27" fill="white" fontSize="6.5" fontWeight="900" textAnchor="middle" letterSpacing="0.06em">SULABH BHARATI</text>
        <defs>
            <linearGradient id="hindi_bg" x1="0" y1="0" x2="84" y2="115" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#991B1B" />
                <stop offset="100%" stopColor="#DC2626" />
            </linearGradient>
        </defs>
    </svg>
);

const WorkbookCover = () => (
    <svg width="84" height="115" viewBox="0 0 84 115" fill="none" xmlns="http://www.w3.org/2000/svg" className="rounded-lg shrink-0 border border-white/5 shadow-md">
        <rect width="84" height="115" rx="6" fill="url(#work_bg)" />
        <text x="42" y="70" fill="#FDE047" fontSize="18" fontWeight="black" textAnchor="middle">+</text>
        <text x="24" y="85" fill="#FDE047" fontSize="18" fontWeight="black" textAnchor="middle">×</text>
        <text x="60" y="85" fill="#FDE047" fontSize="18" fontWeight="black" textAnchor="middle">÷</text>
        <rect x="8" y="10" width="68" height="20" rx="3" fill="white" fillOpacity="0.15" />
        <text x="42" y="19" fill="white" fontSize="7.5" fontWeight="900" textAnchor="middle" letterSpacing="0.06em">WORKBOOK</text>
        <text x="42" y="26" fill="white" fontSize="6" fontWeight="900" textAnchor="middle" letterSpacing="0.05em">MATHEMATICS</text>
        <defs>
            <linearGradient id="work_bg" x1="0" y1="0" x2="84" y2="115" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#B91C1C" />
                <stop offset="100%" stopColor="#EA580C" />
            </linearGradient>
        </defs>
    </svg>
);

const LabCover = () => (
    <svg width="84" height="115" viewBox="0 0 84 115" fill="none" xmlns="http://www.w3.org/2000/svg" className="rounded-lg shrink-0 border border-white/5 shadow-md">
        <rect width="84" height="115" rx="6" fill="url(#lab_bg)" />
        <path d="M35 48H49M38 48V56L28 72C25 78 31 84 42 84C53 84 59 78 56 72L46 56V48" stroke="#C7D2FE" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="8" y="10" width="68" height="20" rx="3" fill="white" fillOpacity="0.15" />
        <text x="42" y="19" fill="white" fontSize="8" fontWeight="900" textAnchor="middle" letterSpacing="0.08em">SCIENCE</text>
        <text x="42" y="26" fill="white" fontSize="6.5" fontWeight="900" textAnchor="middle" letterSpacing="0.06em">LAB MANUAL</text>
        <defs>
            <linearGradient id="lab_bg" x1="0" y1="0" x2="84" y2="115" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#312E81" />
                <stop offset="100%" stopColor="#4F46E5" />
            </linearGradient>
        </defs>
    </svg>
);

const ButterflyLogo = () => (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M15 16C15 16 9 8 5 12C2 15 3 21 8 22C12 23 15 16 15 16Z" fill="url(#bf_grad_left)" opacity="0.85" />
        <path d="M15 16C15 16 10 22 7 20C4 18 5 13 8 12C11 11 15 16 15 16Z" fill="url(#bf_grad_left_lower)" opacity="0.75" />
        <path d="M17 16C17 16 23 8 27 12C30 15 29 21 24 22C20 23 17 16 17 16Z" fill="url(#bf_grad_right)" opacity="0.85" />
        <path d="M17 16C17 16 22 22 25 20C28 18 27 13 24 12C21 11 17 16 17 16Z" fill="url(#bf_grad_right_lower)" opacity="0.75" />
        <path d="M16 8V24" stroke="#FFE259" strokeWidth="2" strokeLinecap="round" />
        <circle cx="16" cy="6" r="2" fill="#FFA07A" />
        <path d="M16 10C16 10 14 6 12 7" stroke="#FFE259" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M16 10C16 10 18 6 20 7" stroke="#FFE259" strokeWidth="1.5" strokeLinecap="round" />
        <defs>
            <linearGradient id="bf_grad_left" x1="5" y1="12" x2="15" y2="22" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#ec4899" />
                <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
            <linearGradient id="bf_grad_left_lower" x1="7" y1="12" x2="15" y2="20" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
            <linearGradient id="bf_grad_right" x1="27" y1="12" x2="17" y2="22" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#ec4899" />
                <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
            <linearGradient id="bf_grad_right_lower" x1="25" y1="12" x2="17" y2="20" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
        </defs>
    </svg>
);

const BoyAvatar = () => (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="rounded-full">
        <circle cx="16" cy="16" r="16" fill="#FDE047" />
        <circle cx="16" cy="13" r="6" fill="#FDBA74" />
        <path d="M8 27C8 22 12 18 16 18C20 18 24 22 24 27" fill="#3B82F6" />
        <circle cx="14" cy="12" r="1.5" fill="#1E293B" />
        <circle cx="18" cy="12" r="1.5" fill="#1E293B" />
        <path d="M14 16C14 16 15 17 16 17C17 17 18 16 18 16" stroke="#1E293B" strokeWidth="1" strokeLinecap="round" />
    </svg>
);

export default function LibraryPage() {
    const [activeFilter, setActiveFilter] = useState<'All' | 'Ready' | 'Processing' | 'Failed'>('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [materials, setMaterials] = useState<LearningMaterial[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeLearner, setActiveLearner] = useState<any>(null);
    const [pollingTimedOut, setPollingTimedOut] = useState(false);
    const [selectedFailedMaterial, setSelectedFailedMaterial] = useState<LearningMaterial | null>(null);
    const [isRetrying, setIsRetrying] = useState(false);
    const [retryError, setRetryError] = useState<string | null>(null);
    const [pagination, setPagination] = useState({
        page: 1,
        pageSize: 8,
        totalItems: 0,
        totalPages: 1
    });

    const [page, setPage] = useState(1);
    const activeRequestToken = useRef<number>(0);

    const navItems = [
        { name: "Home", icon: Home, active: false, href: "/home" },
        { name: "Learn", icon: GraduationCap, active: false, href: "/learn" },
        { name: "Library", icon: BookOpen, active: true, href: "/library" },
        { name: "Knowledge Map", icon: GitFork, active: false, href: "/knowledge-map" },
        { name: "My Growth", icon: TrendingUp, active: false, href: "/growth" },
        { name: "For Parents", icon: Users, active: false, href: "/parent/dashboard" },
        { name: "Achievements", icon: Trophy, active: false, href: "/home" },
        { name: "Messages", icon: MessageSquare, active: false, href: "/home" }
    ];

    // Initialize Active Learner Profile
    useEffect(() => {
        const loadLearner = async () => {
            try {
                const res = await api.getLearners();
                if (res.data && res.data.length > 0) {
                    setActiveLearner(res.data[0]);
                } else {
                    setError("No active learner profile found.");
                    setLoading(false);
                }
            } catch (err: any) {
                console.error("Failed to load active learner:", err);
                setError(err.message || "Failed to authenticate. Please make sure you are logged in.");
                setLoading(false);
            }
        };
        loadLearner();
    }, []);

    // Main fetch handler
    const fetchMaterials = async (isPollUpdate = false) => {
        if (!activeLearner) return;

        const requestToken = ++activeRequestToken.current;

        try {
            if (!isPollUpdate) setLoading(true);

            // Map UI filter to backend enum values
            let processingStatusParam: string | undefined = undefined;
            if (activeFilter === 'Ready') {
                processingStatusParam = 'READY';
            } else if (activeFilter === 'Processing') {
                processingStatusParam = 'UPLOADED,VALIDATING,STORED,EXTRACTING,STRUCTURING,CONCEPT_MAPPING,INDEXING';
            } else if (activeFilter === 'Failed') {
                processingStatusParam = 'FAILED';
            }

            const res = await api.getLearningMaterials({
                learnerId: activeLearner.id,
                processingStatus: processingStatusParam,
                search: searchQuery || undefined,
                page,
                pageSize: 8
            });

            // Protect against stale requests
            if (requestToken !== activeRequestToken.current) return;

            setMaterials(res.items || []);
            setPagination(res.pagination || { page: 1, pageSize: 8, totalItems: 0, totalPages: 1 });
            setError(null);
        } catch (err: any) {
            console.error("Error loading library materials:", err);
            setError("Unable to load your library right now.");
        } finally {
            if (requestToken === activeRequestToken.current) {
                if (!isPollUpdate) setLoading(false);
            }
        }
    };

    // Trigger fetch on query, page or learner changes
    useEffect(() => {
        fetchMaterials();
    }, [activeLearner, activeFilter, page]);

    // Search query debouncer
    useEffect(() => {
        const timer = setTimeout(() => {
            setPage(1);
            fetchMaterials();
        }, 300); // 300ms debounce
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Centralized Status Polling Timer
    useEffect(() => {
        let isMounted = true;
        let pollTimer: NodeJS.Timeout | null = null;
        let elapsedMs = 0;
        const TIMEOUT_LIMIT_MS = 180000; // 3 minutes

        const processingIds = materials
            .filter(m => [
                'UPLOADED', 'VALIDATING', 'STORED', 'EXTRACTING', 
                'STRUCTURING', 'CONCEPT_MAPPING', 'INDEXING'
            ].includes(m.processingStatus))
            .map(m => m.id);

        if (processingIds.length === 0) {
            return;
        }

        const runStatusPolling = async () => {
            if (elapsedMs >= TIMEOUT_LIMIT_MS) {
                if (isMounted) setPollingTimedOut(true);
                if (pollTimer) clearInterval(pollTimer);
                return;
            }

            try {
                const results = await Promise.all(
                    processingIds.map(id => api.getLearningMaterialStatus(id))
                );

                if (!isMounted) return;

                let hasChanged = false;
                const updatedMaterials = materials.map(m => {
                    const statusUpdate = results.find(r => r.id === m.id);
                    if (statusUpdate && (
                        statusUpdate.status !== m.processingStatus ||
                        statusUpdate.progress !== m.progress
                    )) {
                        hasChanged = true;
                        return {
                            ...m,
                            processingStatus: statusUpdate.status as any,
                            progress: statusUpdate.progress,
                            stage: statusUpdate.stage,
                            failureReason: statusUpdate.failureReason || undefined,
                        };
                    }
                    return m;
                });

                if (hasChanged) {
                    setMaterials(updatedMaterials);
                    const hasTerminalTransition = results.some(r => ['READY', 'FAILED'].includes(r.status));
                    if (hasTerminalTransition) {
                        fetchMaterials(true);
                    }
                }

                elapsedMs += 3000;
            } catch (err) {
                console.error("Background status polling check failed:", err);
            }
        };

        pollTimer = setInterval(runStatusPolling, 3000);

        // Visibility Sync
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                fetchMaterials();
                elapsedMs = 0;
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            isMounted = false;
            if (pollTimer) clearInterval(pollTimer);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [materials]);

    // UI cover resolver matching illustration templates
    const renderCover = (material: LearningMaterial) => {
        const subject = (material.subjectName || '').toLowerCase();
        if (subject.includes('sci')) return <ScienceCover />;
        if (subject.includes('math') || subject.includes('algebra') || subject.includes('geom')) return <MathCover />;
        if (subject.includes('eng')) return <EnglishCover />;
        if (subject.includes('soc') || subject.includes('hist') || subject.includes('geo')) return <SocialCover />;
        if (subject.includes('hin')) return <HindiCover />;
        if (subject.includes('work')) return <WorkbookCover />;
        if (subject.includes('lab')) return <LabCover />;
        return <ScienceCover />;
    };

    // UI processing status label mapper
    const getStageLabel = (stage: LearningMaterialStage | string) => {
        switch (stage) {
            case 'UPLOAD': return 'Upload Complete';
            case 'EXTRACTING': return 'Extracting Content';
            case 'STRUCTURING': return 'Analyzing Structure';
            case 'KNOWLEDGE_GRAPH': return 'Building Knowledge Graph';
            case 'FINALIZING': return 'Finalizing Library Item';
            case 'COMPLETE': return 'Complete';
            case 'FAILED': return 'Failed';
            default: return 'Upload Complete';
        }
    };

    // Failure modal retry triggers
    const handleRetry = async (materialId: string) => {
        setIsRetrying(true);
        setRetryError(null);
        try {
            const res = await api.retryLearningMaterial(materialId);
            if (res.data) {
                setSelectedFailedMaterial(null);
                fetchMaterials(true);
                setPollingTimedOut(false);
            }
        } catch (err: any) {
            console.error("Retry dispatch API call failed:", err);
            setRetryError(err.message || "We couldn't schedule this retry request. Please try again.");
        } finally {
            setIsRetrying(false);
        }
    };

    // Human readable size formatter
    const formatBytes = (bytes?: number) => {
        if (!bytes) return "0 KB";
        const k = 1024;
        const dm = 1;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    };

    const handleFilterClick = (filter: 'All' | 'Ready' | 'Processing' | 'Failed') => {
        setActiveFilter(filter);
        setPage(1);
    };

    return (
        <div className="min-h-screen bg-[#03050c] text-white flex overflow-x-hidden">
            {/* Sidebar (Fixed 220px Width) */}
            <aside className="w-[220px] min-w-[220px] bg-[#050814] border-r border-white/5 flex flex-col p-4 shrink-0 h-screen fixed top-0 left-0 justify-between z-10">
                <div>
                    <div className="flex items-center gap-3 px-3 py-4 mb-6">
                        <ButterflyLogo />
                        <span className="text-xl font-bold tracking-[0.14em] text-white select-none">
                            EKAGURU
                        </span>
                    </div>

                    <nav className="space-y-1">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    aria-label={`Navigate to ${item.name}`}
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

                <div className="px-2 py-3 border-t border-white/5 mt-auto">
                    <div className="flex items-center justify-between bg-white/[0.02] border border-white/5 rounded-2xl p-3 cursor-pointer hover:bg-white/[0.04] transition">
                        <div className="flex items-center gap-3">
                            <BoyAvatar />
                            <div className="text-left">
                                <span className="block text-sm font-bold text-white leading-none">Arjun</span>
                                <span className="block text-[10px] text-slate-500 mt-1.5 font-semibold">Grade 5</span>
                            </div>
                        </div>
                        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                    </div>
                </div>
            </aside>

            {/* Main Library Workspace */}
            <div className="flex-1 ml-[220px] flex flex-col min-h-screen bg-[#03050c]">
                <main className="w-full px-[27px] py-10 flex flex-col justify-between flex-1">
                    <div>
                        {/* Header */}
                        <div className="flex items-center justify-between mb-10">
                            <div className="flex items-center gap-5">
                                <div className="w-16 h-16 rounded-2xl bg-indigo-600/15 border border-indigo-500/25 flex items-center justify-center shadow-inner shrink-0">
                                    <BookOpen className="w-8 h-8 text-indigo-400" />
                                </div>
                                <div className="text-left">
                                    <h1 className="text-[40px] font-black text-white tracking-tight leading-tight">Library</h1>
                                    <p className="text-[18px] text-slate-400 mt-1">Your learning materials and resources</p>
                                </div>
                            </div>

                            <Link href="/library/add" aria-label="Add new material">
                                <span className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#6366f1] hover:bg-[#5558e6] text-white font-bold h-[48px] px-6 shadow-lg shadow-indigo-950/30 transition-all text-[16px] cursor-pointer">
                                    <Plus className="w-5 h-5" /> Add Material
                                </span>
                            </Link>
                        </div>

                        {/* Filter & Search Bar */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                            <div className="flex items-center gap-3 flex-wrap">
                                <button 
                                    onClick={() => handleFilterClick('All')}
                                    aria-label="Filter all materials"
                                    className={`flex items-center gap-2.5 rounded-xl h-[48px] px-5 text-[16px] font-semibold border transition ${
                                        activeFilter === 'All'
                                            ? "border-indigo-500 bg-[#1d1b54]/30 text-white"
                                            : "border-white/5 bg-[#050814] text-slate-400 hover:text-white"
                                    }`}
                                >
                                    <LayoutGrid className="w-5 h-5 text-purple-400" /> All Materials
                                </button>
                                <button 
                                    onClick={() => handleFilterClick('Ready')}
                                    aria-label="Filter ready materials"
                                    className={`flex items-center gap-2.5 rounded-xl h-[48px] px-5 text-[16px] font-semibold border transition ${
                                        activeFilter === 'Ready'
                                            ? "border-indigo-500 bg-[#1d1b54]/30 text-white"
                                            : "border-white/5 bg-[#050814] text-slate-400 hover:text-white"
                                    }`}
                                >
                                    <CheckSquare className="w-5 h-5 text-emerald-500" /> Ready
                                </button>
                                <button 
                                    onClick={() => handleFilterClick('Processing')}
                                    aria-label="Filter processing materials"
                                    className={`flex items-center gap-2.5 rounded-xl h-[48px] px-5 text-[16px] font-semibold border transition ${
                                        activeFilter === 'Processing'
                                            ? "border-indigo-500 bg-[#1d1b54]/30 text-white"
                                            : "border-white/5 bg-[#050814] text-slate-400 hover:text-white"
                                    }`}
                                >
                                    <Clock className="w-5 h-5 text-amber-500" /> Processing
                                </button>
                                <button 
                                    onClick={() => handleFilterClick('Failed')}
                                    aria-label="Filter failed materials"
                                    className={`flex items-center gap-2.5 rounded-xl h-[48px] px-5 text-[16px] font-semibold border transition ${
                                        activeFilter === 'Failed'
                                            ? "border-indigo-500 bg-[#1d1b54]/30 text-white"
                                            : "border-white/5 bg-[#050814] text-slate-400 hover:text-white"
                                    }`}
                                >
                                    <AlertTriangle className="w-5 h-5 text-red-500" /> Failed
                                </button>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search materials..."
                                        aria-label="Search learning resources"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="bg-[#050814] border border-white/5 rounded-xl px-4 h-[48px] pr-10 text-[16px] text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-[333px] transition-all"
                                    />
                                    <Search className="w-5 h-5 text-slate-400 absolute right-3.5 top-3.5" />
                                </div>

                                <div className="flex bg-[#050814] border border-white/5 rounded-xl p-1 shrink-0 h-[48px] items-center">
                                    <button 
                                        aria-label="Switch to grid view"
                                        className="p-2 rounded-lg bg-[#1d1b54] text-purple-400 border border-purple-500/10"
                                    >
                                        <LayoutGrid className="w-5 h-5" />
                                    </button>
                                    <button 
                                        disabled
                                        aria-label="Switch to list view"
                                        className="p-2 rounded-lg text-slate-600 cursor-not-allowed"
                                    >
                                        <ListIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Error Alert Box */}
                        {error && (
                            <div className="mb-8 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <AlertTriangle className="w-5 h-5 shrink-0" />
                                    <p className="text-[15px] font-medium">{error}</p>
                                </div>
                                <button 
                                    onClick={() => fetchMaterials()}
                                    className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-white rounded-lg text-sm font-semibold transition"
                                >
                                    Try Again
                                </button>
                            </div>
                        )}

                        {/* Skeletons Loading Grid */}
                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[24px]">
                                {[1, 2, 3, 4].map(idx => (
                                    <div key={idx} className="bg-white/[0.02] border border-white/5 rounded-2xl p-[18px] h-[328px] animate-pulse flex flex-col justify-between">
                                        <div className="flex gap-4">
                                            <div className="w-[84px] h-[115px] bg-white/5 rounded-lg shrink-0" />
                                            <div className="flex-1 space-y-3 py-1">
                                                <div className="h-5 bg-white/5 rounded w-4/5" />
                                                <div className="h-4 bg-white/5 rounded w-2/5" />
                                                <div className="h-7 bg-white/5 rounded-full w-20" />
                                            </div>
                                        </div>
                                        <div className="border-t border-white/5 my-4" />
                                        <div className="h-10 bg-white/5 rounded w-full my-2" />
                                        <div className="h-8 bg-white/5 rounded w-1/2" />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <>
                                {/* Empty State: No items exist */}
                                {materials.length === 0 && searchQuery === "" && activeFilter === "All" ? (
                                    <div className="flex flex-col justify-center items-center py-20 border border-dashed border-white/5 rounded-2xl bg-white/[0.01]">
                                        <BookOpen className="w-16 h-16 text-slate-600 mb-4" />
                                        <p className="text-[17px] text-slate-400 mb-6 font-medium">Your library is empty. Upload your first resource to start.</p>
                                        <Link href="/library/add">
                                            <span className="inline-flex items-center gap-2 px-6 h-[48px] bg-[#6366f1] hover:bg-[#5558e6] text-white font-bold rounded-xl shadow-lg transition-all cursor-pointer">
                                                <Plus className="w-5 h-5" /> Add Material
                                            </span>
                                        </Link>
                                    </div>
                                ) : materials.length === 0 ? (
                                    /* Empty State: Search/Filters yield no results */
                                    <div className="flex flex-col justify-center items-center py-20 border border-dashed border-white/5 rounded-2xl bg-white/[0.01]">
                                        <Search className="w-16 h-16 text-slate-600 mb-4" />
                                        <p className="text-[17px] text-slate-400 mb-3 font-medium">No materials match your search parameters. Try clearing your filters.</p>
                                        <button 
                                            onClick={() => {
                                                setSearchQuery('');
                                                setActiveFilter('All');
                                            }}
                                            className="text-indigo-400 hover:text-indigo-300 font-bold underline text-sm"
                                        >
                                            Reset Search & Filters
                                        </button>
                                    </div>
                                ) : (
                                    /* Active Cards Grid */
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[24px]">
                                        {materials.map((item) => (
                                            <div key={item.id} className="bg-[#050814] border border-white/5 rounded-2xl p-[18px] flex flex-col justify-between hover:border-white/10 transition-all w-full h-[328px] shadow-lg">
                                                <div className="flex flex-col justify-between flex-1">
                                                    <div className="flex gap-3.5 items-start">
                                                        {renderCover(item)}
                                                        <div className="text-left flex-1 min-w-0">
                                                            <div className="flex justify-between items-start">
                                                                <h2 className="text-[19px] font-bold text-white tracking-tight leading-snug line-clamp-2 pr-1">{item.title}</h2>
                                                            </div>
                                                            <span className="block text-[14px] text-slate-400 mt-1 font-semibold tracking-wide">
                                                                CBSE • Grade 5 {item.originalFileName ? `• ${formatBytes(item.fileSizeBytes)}` : ''}
                                                            </span>
                                                            <div className="mt-2.5">
                                                                {item.processingStatus === 'READY' && (
                                                                    <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[13px] font-bold h-[32px] px-3.5 rounded-full">
                                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Ready
                                                                    </span>
                                                                )}
                                                                {['UPLOADED', 'VALIDATING', 'STORED', 'EXTRACTING', 'STRUCTURING', 'CONCEPT_MAPPING', 'INDEXING'].includes(item.processingStatus) && (
                                                                    <span className="inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[13px] font-bold h-[32px] px-3.5 rounded-full">
                                                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" /> Processing
                                                                    </span>
                                                                )}
                                                                {item.processingStatus === 'FAILED' && (
                                                                    <span className="inline-flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 text-red-400 text-[13px] font-bold h-[32px] px-3.5 rounded-full">
                                                                        <span className="w-1.5 h-1.5 rounded-full bg-red-400" /> Failed
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="border-t border-white/5 my-3.5" />

                                                    <div className="flex-1 flex flex-col justify-center">
                                                        {item.processingStatus === 'READY' && (
                                                            <div className="grid grid-cols-3 gap-1 text-center items-center">
                                                                <div className="text-center">
                                                                    <div className="flex items-center justify-center gap-1.5 text-white font-bold text-[19px] leading-none">
                                                                        <Book className="w-5 h-5 text-indigo-400" />
                                                                        <span>{item.chaptersCount || 0}</span>
                                                                    </div>
                                                                    <span className="text-[13px] text-slate-500 block mt-1.5 font-semibold">Chapters</span>
                                                                </div>
                                                                <div className="text-center">
                                                                    <div className="flex items-center justify-center gap-1.5 text-white font-bold text-[19px] leading-none">
                                                                        <FileText className="w-5 h-5 text-emerald-400" />
                                                                        <span>{item.topicsCount || 0}</span>
                                                                    </div>
                                                                    <span className="text-[13px] text-slate-500 block mt-1.5 font-semibold">Topics</span>
                                                                </div>
                                                                <div className="text-center">
                                                                    <div className="flex items-center justify-center gap-1.5 text-white font-bold text-[19px] leading-none">
                                                                        <Boxes className="w-5 h-5 text-amber-400" />
                                                                        <span>{item.conceptsCount || 0}</span>
                                                                    </div>
                                                                    <span className="text-[13px] text-slate-500 block mt-1.5 font-semibold">Concepts</span>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {['UPLOADED', 'VALIDATING', 'STORED', 'EXTRACTING', 'STRUCTURING', 'CONCEPT_MAPPING', 'INDEXING'].includes(item.processingStatus) && (
                                                            <div className="py-1 text-left w-full">
                                                                <div className="w-full bg-[#03050c] rounded-full h-[8px] border border-white/5 overflow-hidden mb-2">
                                                                    <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${item.progress}%` }} />
                                                                </div>
                                                                {pollingTimedOut ? (
                                                                    <span className="text-[12px] text-slate-400 block font-medium leading-normal">
                                                                        Processing is taking longer than expected. We'll continue processing in the background.
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-[13px] text-slate-400 block font-medium leading-none">
                                                                        {getStageLabel(item.stage)}... {item.progress}%
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}

                                                        {item.processingStatus === 'FAILED' && (
                                                            <div className="py-1 text-left">
                                                                <p className="text-[14px] text-slate-400 leading-normal">Couldn't analyze this material.</p>
                                                                <button 
                                                                    onClick={() => setSelectedFailedMaterial(item)}
                                                                    aria-label="View retry options and error message"
                                                                    className="inline-block mt-1 text-[13px] font-semibold text-purple-400 hover:text-purple-300 cursor-pointer underline"
                                                                >
                                                                    View Error
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div>
                                                    <div className="border-t border-white/5 mb-1" />
                                                    <div 
                                                        aria-disabled="true"
                                                        className="h-[64px] flex items-center justify-between text-slate-600 cursor-not-allowed select-none"
                                                    >
                                                        <span className="text-[15px] font-bold tracking-wider uppercase">View Details</span>
                                                        <ArrowRight className="w-5 h-5" />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        {/* Add New Material matched height card */}
                                        {activeFilter === 'All' && page === 1 && (
                                            <div className="border border-dashed border-indigo-500/20 bg-[#050814]/30 rounded-2xl p-[18px] flex flex-col justify-between text-center h-[328px] shadow-lg w-full">
                                                <div className="flex-1 flex flex-col justify-center items-center">
                                                    <div className="w-12 h-12 rounded-full bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center mb-4">
                                                        <Plus className="w-6 h-6 text-indigo-400" />
                                                    </div>
                                                    <h2 className="text-[19px] font-bold text-white tracking-tight">Add New Material</h2>
                                                    <p className="text-xs text-slate-400 mt-2 max-w-[200px] leading-relaxed">
                                                        Upload a textbook, PDF or any learning resource
                                                    </p>
                                                </div>
                                                <Link href="/library/add" aria-label="Add new material">
                                                    <span className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#6366f1] hover:bg-[#5558e6] text-white font-bold h-[44px] text-[15px] shadow-md shadow-indigo-950/20 transition-all mt-auto cursor-pointer">
                                                        <Plus className="w-4 h-4" /> Add Material
                                                    </span>
                                                </Link>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Pagination Footer */}
                    {!loading && materials.length > 0 && (
                        <div className="border-t border-white/5 pt-6 mt-10 flex items-center justify-between select-none">
                            <span className="text-[16px] text-slate-500 font-medium">
                                Showing {((page - 1) * 8) + 1}–{Math.min(page * 8, pagination.totalItems)} of {pagination.totalItems} materials
                            </span>
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    aria-label="Go to previous page"
                                    className={`p-2.5 rounded-lg border border-white/5 transition ${
                                        page === 1 
                                            ? 'bg-[#050814] text-slate-600 cursor-not-allowed' 
                                            : 'bg-[#050814] text-slate-400 hover:text-white cursor-pointer'
                                    }`}
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <button className="w-11 h-11 rounded-lg bg-[#1d1b54] text-purple-400 font-semibold border border-purple-500/10 flex items-center justify-center text-[16px] shadow-inner">
                                    {page}
                                </button>
                                <button 
                                    onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                                    disabled={page === pagination.totalPages}
                                    aria-label="Go to next page"
                                    className={`p-2.5 rounded-lg border border-white/5 transition ${
                                        page === pagination.totalPages 
                                            ? 'bg-[#050814] text-slate-600 cursor-not-allowed' 
                                            : 'bg-[#050814] text-slate-400 hover:text-white cursor-pointer'
                                    }`}
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {/* Error Detail / Retry Overlay Dialog Modal */}
            {selectedFailedMaterial && (
                <div 
                    role="dialog"
                    aria-modal="true"
                    aria-label="Material Error Ingestion Details"
                    className="fixed inset-0 bg-[#03050c]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
                >
                    <div className="bg-[#050814] border border-white/10 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
                        <button 
                            onClick={() => setSelectedFailedMaterial(null)}
                            aria-label="Close dialog"
                            className="absolute right-4 top-4 text-slate-400 hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        
                        <div className="flex items-center gap-3.5 mb-5 text-red-500">
                            <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                            <div className="text-left">
                                <h3 className="text-xl font-bold text-white">Ingestion Failure</h3>
                                <p className="text-xs text-red-400 mt-0.5">Could not process &apos;{selectedFailedMaterial.title}&apos;</p>
                            </div>
                        </div>

                        <div className="bg-[#03050c] border border-white/5 rounded-xl p-4 mb-6 text-left">
                            <span className="text-xs text-slate-500 block mb-1 font-semibold uppercase tracking-wider">Root Cause Analysis</span>
                            <p className="text-[14px] text-slate-300 leading-relaxed font-mono">
                                {selectedFailedMaterial.failureReason || "We couldn't parse this document. The file type or format is unsupported."}
                            </p>
                        </div>

                        {retryError && (
                            <div className="mb-4 text-xs text-red-400 bg-red-500/15 border border-red-500/25 p-3 rounded-lg text-left">
                                {retryError}
                            </div>
                        )}

                        <div className="flex gap-3 justify-end">
                            <button 
                                onClick={() => setSelectedFailedMaterial(null)}
                                className="px-5 h-[44px] rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-sm font-semibold transition"
                            >
                                Close
                            </button>
                            <button 
                                onClick={() => handleRetry(selectedFailedMaterial.id)}
                                disabled={isRetrying}
                                className="px-5 h-[44px] rounded-xl bg-[#6366f1] hover:bg-[#5558e6] disabled:bg-indigo-500/50 disabled:cursor-not-allowed text-white text-sm font-bold shadow-md shadow-indigo-950/20 transition flex items-center gap-2"
                            >
                                {isRetrying ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Scheduling...
                                    </>
                                ) : (
                                    "Retry Ingestion"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
