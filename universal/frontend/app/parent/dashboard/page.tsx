"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { StatCard } from "@/components/analytics/StatCard";
import { FearConfidenceChart } from "@/components/analytics/FearConfidenceChart";
import { InsightFeed } from "@/components/analytics/InsightFeed";
import { TopicMap } from "@/components/analytics/TopicMap";
import { Brain, TrendingUp, Target, Calendar, Award } from 'lucide-react';
import { api, ParentAnalytics } from "@/lib/api-client";

export default function ParentDashboard() {
    const [analytics, setAnalytics] = useState<ParentAnalytics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch real analytics data from the "Brain"
        const fetchAnalytics = async () => {
            try {
                // Call the Live Backend (Port 20000)
                const data = await api.getStudentAnalytics('student-123'); // Using fixed ID for demo
                setAnalytics(data);
            } catch (error) {
                console.error('Error fetching analytics:', error);
                // Fallback only if API fails hard
                setAnalytics(null);
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-slate-600">Loading learning insights...</p>
                </div>
            </div>
        );
    }

    if (!analytics) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-slate-600">Unable to load analytics data.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 relative overflow-hidden">

            {/* Trust-First Header */}
            <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 text-white py-12">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-bold mb-2">Leo's Learning Journey</h1>
                            <p className="text-blue-100">Trust-First Analytics: Fear Reduction & Mastery Progress</p>
                        </div>
                        <div className="flex gap-4">
                            <div className="bg-white/10 backdrop-blur-sm px-6 py-3 rounded-xl">
                                <div className="text-sm text-blue-100 uppercase font-bold">Active Streak</div>
                                <div className="text-2xl font-black">{analytics.activeStreak} Days</div>
                            </div>
                            <div className="bg-white/10 backdrop-blur-sm px-6 py-3 rounded-xl">
                                <div className="text-sm text-blue-100 uppercase font-bold">Mastery Level</div>
                                <div className="text-2xl font-black">{analytics.currentMastery}%</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 -mt-8 relative z-10">

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <StatCard
                        title="Fear Index"
                        value={`${Math.round(analytics.weeklyProgress[analytics.weeklyProgress.length - 1].fearIndex)}/10`}
                        subValue="Current Level"
                        icon={Brain}
                        color="text-red-400"
                    />
                    <StatCard
                        title="Confidence Growth"
                        value={`${analytics.fearReduction}%`}
                        subValue="Fear Reduction"
                        icon={TrendingUp}
                        color="text-green-400"
                    />
                    <StatCard
                        title="Mastery Progress"
                        value={`${analytics.currentMastery}%`}
                        subValue="Topics Mastered"
                        icon={Target}
                        color="text-blue-400"
                    />
                    <StatCard
                        title="Weekly Topics"
                        value={analytics.weeklyProgress.reduce((acc, day) => acc + day.topicsCovered, 0).toString()}
                        subValue="Sessions Completed"
                        icon={Calendar}
                        color="text-purple-400"
                    />
                </div>

                {/* Main Dashboard Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column: Charts & Insights */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Fear vs Confidence Chart */}
                        <FearConfidenceChart data={analytics.weeklyProgress} />

                        {/* Recent Insights */}
                        <InsightFeed insights={analytics.recentInsights} />

                    </div>

                    {/* Right Column: Topic Map & Actions */}
                    <div className="space-y-8">

                        {/* Topic Mastery Map */}
                        <TopicMap masteredTopics={analytics.masteredTopics} />

                        {/* Quick Actions */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <Award className="w-5 h-5 text-yellow-500" />
                                Parent Actions
                            </h3>
                            <div className="space-y-3">
                                <Link href="/student/session" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors text-slate-700 font-bold border border-slate-200">
                                    <span className="w-8 h-8 rounded-lg bg-green-100 text-green-600 flex items-center justify-center">▶</span>
                                    Join Live Session
                                </Link>
                                <Link href="/student/summary" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors text-slate-700 font-bold border border-slate-200">
                                    <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">📊</span>
                                    Detailed Report
                                </Link>
                                <Link href="/subject/create" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors text-slate-700 font-bold border border-slate-200">
                                    <span className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">+</span>
                                    Add New Topic
                                </Link>
                                <Link href="/tutor/dashboard" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors text-slate-700 font-bold border border-slate-200">
                                    <span className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">🛡️</span>
                                    Switch to Student Mode
                                </Link>
                            </div>
                        </div>

                        {/* Weekly Summary */}
                        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white">
                            <h3 className="text-lg font-bold mb-4">Weekly Summary</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-300">Best Day</span>
                                    <span className="font-bold text-green-400">
                                        {analytics.weeklyProgress.reduce((best, current) =>
                                            current.confidence > best.confidence ? current : best
                                        ).day}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-300">Topics This Week</span>
                                    <span className="font-bold text-blue-400">
                                        {analytics.weeklyProgress.reduce((acc, day) => acc + day.topicsCovered, 0)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-300">Fear Reduction</span>
                                    <span className="font-bold text-red-400">
                                        {analytics.fearReduction}%
                                    </span>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
