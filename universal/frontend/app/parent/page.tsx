"use client";

import React, { useEffect, useState } from 'react';
import { ParentAnalytics } from '@/lib/types/analytics';
import AnalyticsService from '@/lib/services/AnalyticsService';
import StatCard from './components/StatCard';
import FearConfidenceChart from './components/FearConfidenceChart';
import RecentActivity from './components/RecentActivity';

export default function ParentDashboardPage() {
  const [analytics, setAnalytics] = useState<ParentAnalytics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // For V1, fetch analytics for a demo student id
    const studentId = 'demo-student-1';
    AnalyticsService.fetchStudentSummary(studentId)
      .then(setAnalytics)
      .catch((err: unknown) => setError(String(err)));
  }, []);

  if (error) return <div>Error loading dashboard: {error}</div>;
  if (!analytics) return <div>Loading Parent Dashboard...</div>;

  return (
    <main style={{ padding: 20 }}>
      <h1>Parent Dashboard — {analytics.studentId}</h1>
      <section style={{ display: 'flex', gap: 12, marginTop: 12 }}>
        <StatCard title="Current Mastery" value={`${analytics.currentMastery}%`} />
        <StatCard title="Fear Reduction" value={`${analytics.fearReduction}%`} />
        <StatCard title="Active Streak" value={`${analytics.activeStreak} days`} />
      </section>

      <section style={{ marginTop: 24 }}>
        <h2>Fear vs Confidence (Weekly)</h2>
        <FearConfidenceChart data={analytics.weeklyProgress} />
      </section>

      <section style={{ marginTop: 24 }}>
        <h2>Recent Tutor Moments</h2>
        <RecentActivity items={analytics.recentInsights} />
      </section>
    </main>
  );
}
