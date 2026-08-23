"use client";

import React from "react";
import { 
  Home, 
  GraduationCap, 
  BookOpen, 
  GitFork, 
  TrendingUp, 
  Users, 
  Trophy, 
  MessageSquare 
} from 'lucide-react';

const ButterflyLogo = () => (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Left Wing */}
        <path d="M15 16C15 16 9 8 5 12C2 15 3 21 8 22C12 23 15 16 15 16Z" fill="url(#butterfly_grad_left)" opacity="0.85" />
        <path d="M15 16C15 16 10 22 7 20C4 18 5 13 8 12C11 11 15 16 15 16Z" fill="url(#butterfly_grad_left_lower)" opacity="0.75" />
        {/* Right Wing */}
        <path d="M17 16C17 16 23 8 27 12C30 15 29 21 24 22C20 23 17 16 17 16Z" fill="url(#butterfly_grad_right)" opacity="0.85" />
        <path d="M17 16C17 16 22 22 25 20C28 18 27 13 24 12C21 11 17 16 17 16Z" fill="url(#butterfly_grad_right_lower)" opacity="0.75" />
        {/* Antennae and Body */}
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

export default function HomePage() {
    const navItems = [
        { name: "Home", icon: Home, active: true },
        { name: "Learn", icon: GraduationCap, active: false },
        { name: "Library", icon: BookOpen, active: false },
        { name: "Knowledge Map", icon: GitFork, active: false },
        { name: "My Growth", icon: TrendingUp, active: false },
        { name: "For Parents", icon: Users, active: false },
        { name: "Achievements", icon: Trophy, active: false },
        { name: "Messages", icon: MessageSquare, active: false }
    ];

    return (
        <div className="min-h-screen bg-[#03050c] text-white flex">
            {/* Sidebar */}
            <aside className="w-64 bg-[#050814] border-r border-white/5 flex flex-col p-4 shrink-0">
                {/* Logo Area */}
                <div className="flex items-center gap-3 px-3 py-4 mb-6">
                    <ButterflyLogo />
                    <span className="text-xl font-bold tracking-[0.14em] text-white select-none">
                        EKAGURU
                    </span>
                </div>

                {/* Navigation Items */}
                <nav className="flex-1 space-y-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <div
                                key={item.name}
                                className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all select-none cursor-pointer ${
                                    item.active
                                        ? "bg-[#1d1b54] text-white font-semibold border border-purple-500/10 shadow-lg shadow-indigo-950/20"
                                        : "text-slate-400 hover:text-white hover:bg-white/5"
                                }`}
                            >
                                <Icon className={`w-5 h-5 shrink-0 ${item.active ? "text-purple-400" : "text-slate-400"}`} />
                                <span className="text-sm tracking-wide">{item.name}</span>
                            </div>
                        );
                    })}
                </nav>
            </aside>

            {/* Main Clean Content Area */}
            <main className="flex-1 bg-[#03050c] p-10 flex flex-col justify-center items-center">
                {/* Clean area representing the workspace */}
            </main>
        </div>
    );
}
