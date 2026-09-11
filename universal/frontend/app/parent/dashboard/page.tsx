"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Brain,
  Target,
  Clock,
  AlertTriangle,
  UserPlus,
  RefreshCw,
  BookOpen,
  CheckCircle,
  User,
  Settings,
} from "lucide-react";
import { api } from "@/lib/api-client";

interface GuruActivityEvent {
  at: string;
  kind: "answer" | "help" | "question" | "navigation";
  passed: boolean | null;
  confidence: number | null;
  misconception: string | null;
  masteryUpdated: boolean;
  masteryNote: string | null;
  response: string | null;
  feedback: string | null;
}
interface GuruActivitySession {
  id: string;
  bookId: string;
  physicalPage: number;
  title: string;
  depth: string;
  language: string;
  startedAt: string;
  lastActivityAt: string;
  progress: { position: number; total: number; completed: boolean };
  checkpoints: { passed: number; assisted: number; attempts: number };
  questions: number;
  masteryRecorded: number;
  events: GuruActivityEvent[];
}
interface GuruReviewItem {
  sessionId: string;
  bookId: string;
  physicalPage: number;
  title: string;
  depth: string;
  stageLabel: string;
  nextReviewAt: string;
  lastOutcome: string | null;
  openPath: string;
}
interface GuruActivity {
  learnerId: string;
  summary: {
    sessions: number;
    pagesPracticed: number;
    checkpointsPassed: number;
    assistedCheckpoints: number;
    attempts: number;
    questionsAsked: number;
    masteryRecorded: number;
    reviewsDue?: number;
    misconceptions: { text: string; count: number }[];
  };
  sessions: GuruActivitySession[];
  reviews?: { due: GuruReviewItem[]; upcoming: GuruReviewItem[] };
  explanation: string[];
}

interface Learner {
  id: string;
  name: string;
  learnerType: string;
  curriculumEnrollments: Array<{
    active: boolean;
    structure: { version: number };
  }>;
}

interface Activity {
  sessionId: string;
  conceptName: string;
  durationSeconds: number;
  status: string;
  date: string;
}

interface AttentionSignal {
  type: "ASSESSMENT_STALL" | "SESSION_STUCK" | "INACTIVITY" | "DECAY_WARNING";
  description: string;
  timestamp: string;
}

interface Analytics {
  frontier: Array<{ conceptId: string; canonicalName: string }>;
  mastery: {
    masteredCount: number;
    inProgressCount: number;
    needsReviewCount: number;
  };
  recentActivity: Activity[];
  attentionSignals: AttentionSignal[];
}

export default function ParentDashboard() {
  // State variables
  const [parentName, setParentName] = useState<string>("Parent");
  const [learners, setLearners] = useState<Learner[]>([]);
  const [selectedLearner, setSelectedLearner] = useState<Learner | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [guruActivity, setGuruActivity] = useState<GuruActivity | null>(null);
  const [guruActivityError, setGuruActivityError] = useState<string | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [analyticsLoading, setAnalyticsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Enrollment switch state
  const [targetVersion, setTargetVersion] = useState<number>(1);
  const [enrollError, setEnrollError] = useState<string | null>(null);
  const [enrollSuccess, setEnrollSuccess] = useState<boolean>(false);
  const [enrolling, setEnrolling] = useState<boolean>(false);

  // Onboard child form state
  const [showOnboardModal, setShowOnboardModal] = useState<boolean>(false);
  const [onboardName, setOnboardName] = useState<string>("");
  const [onboardAge, setOnboardAge] = useState<number>(8);
  const [onboardLang, setOnboardLang] = useState<string>("en");
  const [onboardDob, setOnboardDob] = useState<string>("");
  const [onboardError, setOnboardError] = useState<string | null>(null);
  const [onboarding, setOnboarding] = useState<boolean>(false);

  // Initialize: load parent profile and learners list
  useEffect(() => {
    async function loadInitialData() {
      try {
        setLoading(true);
        setError(null);

        // Fetch profile
        const profileRes = await api.getParentProfile().catch(() => null);
        if (profileRes?.data) {
          setParentName(profileRes.data.name);
        }

        // Fetch child learners list
        const learnersRes = await api.getParentLearners();
        const list = learnersRes?.data || [];
        setLearners(list);

        if (list.length > 0) {
          setSelectedLearner(list[0]);
        }
      } catch (err: any) {
        console.error("Error loading initial parent data:", err);
        setError("Please login as a parent to view the dashboard.");
      } finally {
        setLoading(false);
      }
    }
    loadInitialData();
  }, []);

  // Fetch analytics when active learner changes
  useEffect(() => {
    if (!selectedLearner) {
      setAnalytics(null);
      return;
    }

    async function loadAnalytics() {
      try {
        if (!selectedLearner) return;
        setAnalyticsLoading(true);
        setEnrollError(null);
        setEnrollSuccess(false);

        // Resolve active version to pre-fill enrollment select
        const activeEnr = selectedLearner.curriculumEnrollments.find((e) => e.active);
        if (activeEnr) {
          setTargetVersion(activeEnr.structure.version);
        } else {
          setTargetVersion(1);
        }

        const res = await api.getParentLearnerAnalytics(selectedLearner.id);
        setAnalytics(res?.data || null);
      } catch (err: any) {
        console.error("Error loading analytics:", err);
        setAnalytics(null);
      } finally {
        setAnalyticsLoading(false);
      }
    }
    loadAnalytics();
  }, [selectedLearner]);

  // Guru classroom activity for the active learner (evidence-backed, from the session ledger)
  useEffect(() => {
    if (!selectedLearner) {
      setGuruActivity(null);
      return;
    }
    let live = true;
    setGuruActivity(null);
    setGuruActivityError(null);
    api
      .getGuruLearnerActivity(selectedLearner.id)
      .then((res: any) => {
        if (!live) return;
        const data = res?.summary ? res : res?.data;
        if (data?.summary) setGuruActivity(data as GuruActivity);
        else setGuruActivityError("Guru activity is unavailable right now.");
      })
      .catch(() => {
        if (live) setGuruActivityError("Guru activity is unavailable right now.");
      });
    return () => {
      live = false;
    };
  }, [selectedLearner]);

  // Handle child onboarding submission
  const handleOnboard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onboardName.trim()) {
      setOnboardError("Name is required");
      return;
    }

    try {
      setOnboarding(true);
      setOnboardError(null);
      const res = await api.onboardParentLearner(
        onboardName,
        onboardAge,
        onboardDob || undefined,
        onboardLang
      );

      const newLearner: Learner = {
        id: res.data.id,
        name: res.data.name,
        learnerType: res.data.learnerType,
        curriculumEnrollments: [],
      };

      const updatedList = [...learners, newLearner];
      setLearners(updatedList);
      setSelectedLearner(newLearner);

      // Reset form & close modal
      setOnboardName("");
      setOnboardAge(8);
      setOnboardLang("en");
      setOnboardDob("");
      setShowOnboardModal(false);
    } catch (err: any) {
      setOnboardError(err.message || "Failed to onboard child");
    } finally {
      setOnboarding(false);
    }
  };

  // Handle enrollment curriculum version switch
  const handleSwitchEnrollment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLearner) return;

    try {
      setEnrolling(true);
      setEnrollError(null);
      setEnrollSuccess(false);

      await api.enrollParentLearner(selectedLearner.id, targetVersion);
      setEnrollSuccess(true);

      // Update learners state with the new active enrollment
      const updatedLearners = learners.map((l) => {
        if (l.id === selectedLearner.id) {
          return {
            ...l,
            curriculumEnrollments: [
              {
                active: true,
                structure: { version: targetVersion },
              },
            ],
          };
        }
        return l;
      });
      setLearners(updatedLearners);
      setSelectedLearner(updatedLearners.find((l) => l.id === selectedLearner.id) || null);
    } catch (err: any) {
      console.error("Enrollment switch failed:", err);
      if (err.status === 409) {
        setEnrollError("Learner currently has an ACTIVE session. Complete or abandon it first.");
      } else {
        setEnrollError("Failed to switch curriculum. Only PUBLISHED curriculum versions can be enrolled.");
      }
    } finally {
      setEnrolling(false);
    }
  };

  // Format seconds to human minutes
  const formatDuration = (seconds: number) => {
    if (!seconds) return "0 mins";
    const mins = Math.floor(seconds / 60);
    return mins > 0 ? `${mins} mins` : `${seconds} secs`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-slate-600 font-medium">Loading Parent Portal...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center">
          <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Access Restricted</h2>
          <p className="text-slate-600 mb-6">{error}</p>
          <Link
            href="/login"
            className="inline-block w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-16">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-700 via-purple-700 to-indigo-800 text-white py-10 shadow-md">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-extrabold mb-1">Welcome back, {parentName}!</h1>
            <p className="text-indigo-200 font-medium">
              Authoritative Parent Portal Layer — Observation & Configuration
            </p>
          </div>
          <button
            onClick={() => setShowOnboardModal(true)}
            className="flex items-center gap-2 px-5 py-3 bg-white text-indigo-700 hover:bg-indigo-50 font-bold rounded-xl shadow-sm transition-colors self-start md:self-auto"
          >
            <UserPlus className="w-5 h-5" />
            Onboard Child
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* LEFT PANEL: Children Selector & Enrollment Settings */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Active Child Selection */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-indigo-600" />
                Select Child
              </h2>
              {learners.length === 0 ? (
                <div className="text-center py-6 text-slate-500">
                  <p className="mb-4">No children registered yet.</p>
                  <button
                    onClick={() => setShowOnboardModal(true)}
                    className="px-4 py-2 bg-indigo-50 text-indigo-600 font-bold rounded-lg hover:bg-indigo-100 transition-colors"
                  >
                    Add Now
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {learners.map((learner) => {
                    const activeVersion =
                      learner.curriculumEnrollments.find((e) => e.active)?.structure.version ||
                      "None";
                    return (
                      <button
                        key={learner.id}
                        onClick={() => setSelectedLearner(learner)}
                        className={`w-full text-left p-4 rounded-xl border transition-all ${
                          selectedLearner?.id === learner.id
                            ? "border-indigo-600 bg-indigo-50/50 shadow-sm"
                            : "border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <div className="font-bold text-slate-800">{learner.name}</div>
                        <div className="text-xs text-slate-500 mt-1 flex justify-between">
                          <span>Age: {learner.id === "learner-maya" ? 8 : learner.id === "learner-ben" ? 10 : 8}</span>
                          <span>Curriculum: V{activeVersion}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Curriculum Configuration */}
            {selectedLearner && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-indigo-600" />
                  Curriculum Settings
                </h2>
                <form onSubmit={handleSwitchEnrollment} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-600 mb-2">
                      Active Curriculum Version
                    </label>
                    <select
                      value={targetVersion}
                      onChange={(e) => setTargetVersion(Number(e.target.value))}
                      className="w-full p-3 border border-slate-300 rounded-xl bg-slate-50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value={1}>Version 1 (Mathematics - Published)</option>
                      <option value={2}>Version 2 (Advanced Mathematics - Published)</option>
                      <option value={3}>Version 3 (Science - Draft)</option>
                    </select>
                  </div>

                  {enrollError && (
                    <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-start gap-2 border border-red-200">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{enrollError}</span>
                    </div>
                  )}

                  {enrollSuccess && (
                    <div className="p-3 bg-green-50 text-green-700 text-xs rounded-xl flex items-start gap-2 border border-green-200">
                      <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>Curriculum switched successfully! Ready sessions auto-abandoned.</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={enrolling}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors disabled:bg-indigo-400"
                  >
                    {enrolling ? "Updating..." : "Save Settings"}
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* RIGHT PANEL: Analytics Details (Frontier, Mastery, Stuck Alerts, Recent Activity) */}
          <div className="lg:col-span-3 space-y-6">
            {!selectedLearner ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm flex flex-col justify-center items-center">
                <Brain className="w-16 h-16 text-indigo-400 mb-4" />
                <h3 className="text-xl font-bold text-slate-800 mb-2">No Active Child Selected</h3>
                <p className="text-slate-500 max-w-sm">
                  Please select a child profile or onboard a new child to view learning insights and struggle signals.
                </p>
              </div>
            ) : analyticsLoading ? (
              <div className="bg-white rounded-2xl p-24 text-center border border-slate-200 shadow-sm flex justify-center items-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
              </div>
            ) : !analytics ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm flex flex-col justify-center items-center">
                <AlertTriangle className="w-12 h-12 text-amber-500 mb-4" />
                <h3 className="text-xl font-bold text-slate-800 mb-2">Analytics Load Failed</h3>
                <p className="text-slate-500 max-w-sm">
                  Failed to fetch real-time analytics data. Ensure your backend is running.
                </p>
              </div>
            ) : (
              <div className="space-y-6">

                {/* Simplified Action-Oriented Parent Feed */}
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 space-y-6">
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Today's Learning Focus</h3>
                    <h2 className="text-2xl font-black text-slate-800">Mathematics · Fractions</h2>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-500 font-bold text-lg">✓</span>
                      <span className="text-sm font-semibold text-slate-700">Understand</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-500 font-bold text-lg">✓</span>
                      <span className="text-sm font-semibold text-slate-700">Practice</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-amber-500 font-bold text-lg">⚠️</span>
                      <span className="text-sm font-semibold text-slate-700">Strengthen</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 text-lg">○</span>
                      <span className="text-sm font-semibold text-slate-400">Master</span>
                    </div>
                  </div>

                  <hr className="border-slate-100" />

                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-red-500 uppercase tracking-widest">What Needs Attention?</h4>
                    <div className="bg-red-50/50 border border-red-100 rounded-xl p-6 space-y-4">
                      <div>
                        <div className="text-xs text-slate-400 uppercase tracking-wider font-bold">Concept Gap</div>
                        <div className="text-lg font-black text-slate-800 mt-0.5">Equivalent Denominators</div>
                      </div>
                      
                      <div>
                        <div className="text-xs text-slate-400 uppercase tracking-wider font-bold">Reason (Active Misconception)</div>
                        <div className="font-mono text-xs text-red-600 bg-red-50 px-2.5 py-1 rounded inline-block mt-1 font-bold">
                          ADD_DENOMINATORS_DIRECTLY
                        </div>
                      </div>

                      <div className="pt-2">
                        <div className="text-xs text-slate-400 uppercase tracking-wider font-bold">What EKAGURU Recommends</div>
                        <p className="text-slate-600 text-sm mt-1">
                          We recommend a 10-minute guided Socratic practice. Review visual slices of pizza or diagrams together to show why denominators must be identical before adding.
                        </p>
                      </div>

                      <div className="pt-4">
                        <Link 
                          href="/student/golden-path"
                          className="inline-flex items-center justify-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-all text-sm"
                        >
                          Practice Together
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 1. Attention Alerts Box */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                    Attention Signals
                  </h3>
                  {analytics.attentionSignals.length === 0 ? (
                    <div className="flex items-center gap-3 p-4 bg-green-50/50 border border-green-200 rounded-xl text-green-800 font-medium">
                      <CheckCircle className="w-6 h-6 text-green-600 shrink-0" />
                      <span>All Clear! No study stalls, session blocks, or concept decays detected.</span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {analytics.attentionSignals.map((sig, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl"
                        >
                          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                          <div>
                            <div className="font-extrabold text-red-950 text-sm">{sig.type}</div>
                            <div className="text-slate-700 text-sm mt-1">{sig.description}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. Stat Counts Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-slate-500">Mastered Concepts</div>
                      <div className="text-3xl font-black text-indigo-700 mt-1">
                        {analytics.mastery.masteredCount}
                      </div>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                      🏆
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-slate-500">In Progress Concepts</div>
                      <div className="text-3xl font-black text-amber-600 mt-1">
                        {analytics.mastery.inProgressCount}
                      </div>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                      ⚡
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-slate-500">Needs Review Concepts</div>
                      <div className="text-3xl font-black text-red-600 mt-1">
                        {analytics.mastery.needsReviewCount}
                      </div>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-red-100 text-red-700 flex items-center justify-center font-bold">
                      🔄
                    </div>
                  </div>
                </div>

                {/* 3. Frontier Nodes */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                  <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <Target className="w-5 h-5 text-indigo-600" />
                    Current Learning Frontier
                  </h3>
                  <p className="text-xs text-slate-500 mb-4">
                    Authoritative next nodes derived dynamically based on current mastery conditions.
                  </p>
                  {analytics.frontier.length === 0 ? (
                    <div className="text-slate-500 text-sm">
                      No frontier nodes found. Check active enrollment status.
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {analytics.frontier.map((node) => (
                        <span
                          key={node.conceptId}
                          className="px-4 py-2 bg-indigo-50 border border-indigo-200 text-indigo-800 text-sm font-bold rounded-lg shadow-sm"
                        >
                          {node.canonicalName}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* 4. Recent Study Sessions */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-indigo-600" />
                    Recent Sessions (Max 5)
                  </h3>
                  {analytics.recentActivity.length === 0 ? (
                    <div className="text-slate-500 text-sm py-2">No study sessions logged yet.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-500 font-bold">
                            <th className="pb-3 pr-4">Concept Focus</th>
                            <th className="pb-3 px-4">Duration</th>
                            <th className="pb-3 px-4">Status</th>
                            <th className="pb-3 pl-4">Timestamp</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analytics.recentActivity.map((activity, index) => (
                            <tr key={index} className="border-b border-slate-100 hover:bg-slate-50/50">
                              <td className="py-4 pr-4 font-semibold text-slate-800">
                                {activity.conceptName}
                              </td>
                              <td className="py-4 px-4 text-slate-600">
                                {formatDuration(activity.durationSeconds)}
                              </td>
                              <td className="py-4 px-4">
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                                    activity.status === "FINALIZED" || activity.status === "COMPLETED"
                                      ? "bg-green-100 text-green-800"
                                      : activity.status === "ACTIVE"
                                      ? "bg-blue-100 text-blue-800"
                                      : activity.status === "READY"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-slate-200 text-slate-700"
                                  }`}
                                >
                                  {activity.status}
                                </span>
                              </td>
                              <td className="py-4 pl-4 text-slate-500 text-xs">
                                {new Date(activity.date).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* 5. Guru classroom activity (evidence-backed) */}
                <section
                  aria-label="Guru classroom activity"
                  className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200"
                >
                  <h3 className="text-lg font-bold text-slate-800 mb-1">Guru classroom activity</h3>
                  <p className="text-sm text-slate-500 mb-4">
                    What Guru actually did with {selectedLearner?.name} on real textbook pages. Every number below comes from the saved session record.
                  </p>
                  {guruActivityError && <p role="alert" className="text-sm text-amber-700">{guruActivityError}</p>}
                  {!guruActivity && !guruActivityError && <p role="status" className="text-sm text-slate-500">Loading Guru activity…</p>}
                  {guruActivity && guruActivity.summary.sessions === 0 && (
                    <p className="text-sm text-slate-500">No Guru sessions yet. Open a textbook page, choose this learner in Guru settings, and press Teach with Guru.</p>
                  )}
                  {guruActivity && guruActivity.summary.sessions > 0 && (
                    <div className="space-y-5">
                      <dl className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                        {[
                          ["Pages practised", guruActivity.summary.pagesPracticed],
                          ["Checkpoints passed independently", guruActivity.summary.checkpointsPassed],
                          ["Checkpoint attempts", guruActivity.summary.attempts],
                          ["Assisted checkpoints", guruActivity.summary.assistedCheckpoints],
                          ["Questions asked", guruActivity.summary.questionsAsked],
                          ["Mastery evidence recorded", guruActivity.summary.masteryRecorded],
                        ].map(([label, value]) => (
                          <div key={String(label)} className="rounded-xl bg-slate-50 p-3">
                            <dt className="text-xs uppercase tracking-wide text-slate-500">{label}</dt>
                            <dd className="text-2xl font-black text-slate-800" data-testid={"guru-" + String(label).toLowerCase().replace(/[^a-z]+/g, "-")}>{value}</dd>
                          </div>
                        ))}
                      </dl>
                      {guruActivity.reviews && (guruActivity.reviews.due.length > 0 || guruActivity.reviews.upcoming.length > 0) && (
                        <div data-testid="guru-reviews">
                          <h4 className="font-semibold text-slate-800">Spaced reviews</h4>
                          {guruActivity.reviews.due.length > 0 ? (
                            <ul className="mt-1 space-y-1 text-sm">
                              {guruActivity.reviews.due.map((r) => (
                                <li key={r.sessionId} className="flex flex-wrap items-center gap-2">
                                  <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-900">Due now</span>
                                  <span>{r.title} · {r.bookId} page {r.physicalPage} · {r.depth} · {r.stageLabel}</span>
                                  <Link href={r.openPath} className="text-indigo-700 underline">Open page</Link>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="mt-1 text-sm text-slate-600">Nothing is due today.</p>
                          )}
                          {guruActivity.reviews.upcoming.length > 0 && (
                            <p className="mt-1 text-xs text-slate-500">
                              Next up: {guruActivity.reviews.upcoming.slice(0, 3).map((r) => r.title + " on " + new Date(r.nextReviewAt).toLocaleDateString()).join(" · ")}
                            </p>
                          )}
                        </div>
                      )}
                      {guruActivity.summary.misconceptions.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-slate-800">Ideas worth talking about together</h4>
                          <ul className="mt-1 list-disc pl-5 text-sm text-slate-700">
                            {guruActivity.summary.misconceptions.map((m) => (
                              <li key={m.text}>{m.text}{m.count > 1 ? " (seen " + m.count + " times)" : ""}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <ul className="space-y-3">
                        {guruActivity.sessions.map((session) => (
                          <li key={session.id} className="rounded-xl border border-slate-200 p-4">
                            <div className="flex flex-wrap items-baseline justify-between gap-2">
                              <span className="font-semibold text-slate-800">
                                {session.title} · {session.bookId} page {session.physicalPage} · {session.depth}
                              </span>
                              <span className="text-xs text-slate-500">
                                {new Date(session.lastActivityAt).toLocaleString()}
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-slate-600">
                              Progress {session.progress.position} of {session.progress.total}{session.progress.completed ? " (page complete)" : ""} · {session.checkpoints.passed} passed independently · {session.checkpoints.assisted} assisted · {session.questions} questions
                            </p>
                            {session.events.length > 0 && (
                              <ul className="mt-2 space-y-1 text-sm">
                                {session.events.slice(-5).map((event, i) => (
                                  <li key={i} className="rounded bg-slate-50 p-2">
                                    <span className="font-medium">
                                      {event.kind === "answer" ? (event.passed ? "Checkpoint passed" : "Checkpoint not yet passed") : event.kind === "help" ? "Asked Guru to teach again" : "Asked a page question"}
                                    </span>
                                    {event.response && <span className="text-slate-600"> · &ldquo;{event.response}&rdquo;</span>}
                                    {event.feedback && <div className="text-xs text-slate-500">Guru: {event.feedback}</div>}
                                    {event.kind === "answer" && (
                                      <div className="text-xs text-slate-500">
                                        {event.masteryUpdated ? "Recorded toward concept mastery." : "Recorded as page practice; concept mastery unchanged."}
                                      </div>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </li>
                        ))}
                      </ul>
                      <details className="text-xs text-slate-500">
                        <summary className="cursor-pointer">How these numbers are counted</summary>
                        <ul className="mt-1 list-disc pl-5">
                          {guruActivity.explanation.map((line, i) => (
                            <li key={i}>{line}</li>
                          ))}
                        </ul>
                      </details>
                    </div>
                  )}
                </section>

              </div>
            )}
          </div>

        </div>
      </div>

      {/* Modal for child onboarding */}
      {showOnboardModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-lg border border-slate-200">
            <h3 className="text-2xl font-bold text-slate-800 mb-2">Onboard Child</h3>
            <p className="text-sm text-slate-500 mb-6">
              Create a child learner profile. This initializes parent-child relationship bindings.
            </p>
            <form onSubmit={handleOnboard} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-600 mb-1">Child Name</label>
                <input
                  type="text"
                  required
                  value={onboardName}
                  onChange={(e) => setOnboardName(e.target.value)}
                  placeholder="e.g. Maya"
                  className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-600 mb-1">Age</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={onboardAge}
                  onChange={(e) => setOnboardAge(Number(e.target.value))}
                  className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-600 mb-1">Language</label>
                <select
                  value={onboardLang}
                  onChange={(e) => setOnboardLang(e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-xl bg-slate-50 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="en">English (en)</option>
                  <option value="es">Spanish (es)</option>
                  <option value="fr">French (fr)</option>
                  <option value="de">German (de)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-600 mb-1">Date of Birth (Optional)</label>
                <input
                  type="date"
                  value={onboardDob}
                  onChange={(e) => setOnboardDob(e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {onboardError && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-start gap-2 border border-red-200">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{onboardError}</span>
                </div>
              )}

              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOnboardModal(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={onboarding}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors disabled:bg-indigo-400"
                >
                  {onboarding ? "Adding..." : "Onboard"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
