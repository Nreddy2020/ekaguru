"use client";

import React, { useState, useEffect } from "react";
import { BookOpen, CheckCircle, HelpCircle, ArrowRight, RefreshCw, Layers, ShieldAlert, Sparkles } from "lucide-react";
import { api } from "../../../lib/api-client";

export default function GoldenPathPrototype() {
  // Navigation states: 1 = Welcome, 2 = Learner Setup, 3 = Curriculum, 4 = Frontier, 5 = Teach Me (Socratic), 6 = Mastery
  const [currentStep, setCurrentStep] = useState<number>(1);
  
  // Design system parameters
  const [ageMode, setAgeMode] = useState<"young" | "older">("young");
  const [language, setLanguage] = useState<string>("English");
  
  // Interactive Socratic simulation states
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [hintLevel, setHintLevel] = useState<number>(0);
  const [misconceptionAlert, setMisconceptionAlert] = useState<boolean>(false);
  const [attempts, setAttempts] = useState<number>(0);

  // Backend Integration States
  const [learner, setLearner] = useState<any>(null);
  const [frontierNodes, setFrontierNodes] = useState<any[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [tutorStatement, setTutorStatement] = useState<string>("");
  const [tutorOptions, setTutorOptions] = useState<string[]>([]);
  const [nbaReason, setNbaReason] = useState<any>(null);
  const [errorAlert, setErrorAlert] = useState<string | null>(null);

  // ULM explainable reason metadata fallback
  const nextBestActionExplain = nbaReason || {
    action: "REMEDIATION",
    target: "frac-addition-unlike",
    reason: {
      type: "MISCONCEPTION",
      code: "ADD_DENOMINATORS_DIRECTLY",
      evidenceCount: attempts
    }
  };

  // Initialize and resolve active session via real API
  const initializeTutor = async () => {
    try {
      setErrorAlert(null);
      const learnersRes = await api.getLearners();
      const currentLearner = learnersRes.data?.[0];
      if (currentLearner) {
        setLearner(currentLearner);
        // Find or create session
        const sessionsRes = await api.getLearnerSessions(currentLearner.id);
        let active = (sessionsRes.data || []).find(
          (s: any) => s.status === "READY" || s.status === "ACTIVE" || s.status === "PAUSED"
        );
        if (!active) {
          const enroll = currentLearner.curriculumEnrollments?.[0];
          const ver = enroll?.structure?.version ?? 1;
          const sessionRes = await api.createSession(currentLearner.id, ver, 30);
          active = sessionRes.data || sessionRes;
        }
        
        // Start the NestJS session lifecycle
        await fetch(`http://localhost:20000/api/v2/sessions/${active.id}/start`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        setSessionId(active.id);
        
        // Start Socratic Tutor session
        const startRes = await fetch(`http://localhost:20000/api/v2/sessions/${active.id}/tutor/start`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const startData = await startRes.json();
        const tutor = startData.data || startData;
        setTutorStatement(tutor.statement);
        setTutorOptions(tutor.options || []);
      }
    } catch (e) {
      console.warn("API fallback: using local pedagogical simulator", e);
      setErrorAlert("Network Error: Backend Socratic Tutor service is offline. Running in local simulation mode.");
      
      // Fallback defaults
      setTutorStatement(ageMode === "young" 
        ? "Let's work through this problem together. We want to add these two fractions."
        : "Let's evaluate the addition of these two fractions with unlike denominators."
      );
      setTutorOptions([
        "5/6 (Convert to common denominator)",
        "2/5 (Add numerators and denominators directly)",
        "3/6 (Convert first fraction only)"
      ]);
    }
  };

  const loadFrontier = async () => {
    try {
      setErrorAlert(null);
      const learnersRes = await api.getLearners();
      const currentLearner = learnersRes.data?.[0];
      if (currentLearner) {
        setLearner(currentLearner);
        const enroll = currentLearner.curriculumEnrollments?.[0];
        const ver = enroll?.structure?.version ?? 1;
        const frontierRes = await api.getFrontier(currentLearner.id, ver);
        setFrontierNodes(frontierRes.data?.frontierNodes || []);
      }
    } catch (e) {
      console.warn("Frontier load fallback:", e);
      setErrorAlert("Network Error: Backend frontier calculator is offline. Using fallback concepts roadmap.");
      setFrontierNodes([
        { concept: { canonicalName: "Numbers & Base 10" }, status: "mastered" },
        { concept: { canonicalName: "Fractions Basics" }, status: "mastered" },
        { concept: { canonicalName: "Equivalent Fractions" }, status: "mastered" },
        { concept: { canonicalName: "Adding Fractions" }, status: "active", desc: "Your Next Step: unlike denominators." },
        { concept: { canonicalName: "Fraction Problems" }, status: "locked" },
      ]);
    }
  };

  useEffect(() => {
    if (currentStep === 4) {
      loadFrontier();
    }
    if (currentStep === 5) {
      initializeTutor();
    }
  }, [currentStep]);

  const handleSaveSetup = async () => {
    try {
      const learnersRes = await api.getLearners();
      const currentLearner = learnersRes.data?.[0];
      if (currentLearner) {
        await api.updateParentLearner(currentLearner.id, currentLearner.name, language === "English" ? "en" : language.toLowerCase());
      }
      setCurrentStep(3);
    } catch (e) {
      console.warn("Failed to save learner setup, transitioning anyway", e);
      setErrorAlert("Network Error: Unable to save profile configuration to database.");
      setCurrentStep(3);
    }
  };

  const handleSelectCurriculum = async (boardName: string) => {
    try {
      const learnersRes = await api.getLearners();
      const currentLearner = learnersRes.data?.[0];
      if (currentLearner) {
        // Enrolling them in the CBSE version 10001
        await api.enrollLearner(currentLearner.id, 10001);
      }
      setCurrentStep(4);
    } catch (e) {
      console.warn("Failed to save enrollment, transitioning anyway", e);
      setErrorAlert("Network Error: Unable to save curriculum selection to database.");
      setCurrentStep(4);
    }
  };

  const handleSelectAnswer = async (ans: string) => {
    setSelectedAnswer(ans);
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);

    if (sessionId) {
      try {
        const response = await fetch(`http://localhost:20000/api/v2/sessions/${sessionId}/tutor/respond`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ response: ans, attempts: newAttempts })
        });
        const data = await response.json();
        const tutor = data.data || data;

        setTutorStatement(tutor.statement);
        if (tutor.detectedMisconception) {
          setMisconceptionAlert(true);
        } else if (tutor.nextBestAction === "REMEDIATION") {
          setMisconceptionAlert(false);
          setNbaReason(tutor.nbaReason);
        } else {
          setMisconceptionAlert(false);
        }
      } catch (e) {
        console.error("Failed to submit response to backend tutor:", e);
        setErrorAlert("Network Error: Socratic Tutor is offline. Input not graded.");
      }
    } else {
      // Offline fallback logic
      if (ans === "2/5") {
        setMisconceptionAlert(true);
      } else if (ans === "5/6") {
        setMisconceptionAlert(false);
      } else {
        setMisconceptionAlert(false);
      }
    }
  };

  const handleRequestHint = async () => {
    const nextLevel = hintLevel < 3 ? hintLevel + 1 : 1;
    setHintLevel(nextLevel);

    if (sessionId) {
      try {
        const response = await fetch(`http://localhost:20000/api/v2/sessions/${sessionId}/tutor/hint`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ level: nextLevel })
        });
        const data = await response.json();
        const tutor = data.data || data;
        setTutorStatement(tutor.statement);
      } catch (e) {
        console.error("Failed to request hint from backend tutor:", e);
        setErrorAlert("Network Error: Tutor hint service is offline.");
      }
    }
  };

  const handleResetSimulator = () => {
    setSelectedAnswer(null);
    setHintLevel(0);
    setMisconceptionAlert(false);
    setAttempts(0);
    setNbaReason(null);
    if (sessionId) {
      initializeTutor();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans transition-colors duration-300">
      
      {/* HUD Header */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-black text-white tracking-wider text-sm">
            EK
          </div>
          <span className="font-extrabold tracking-tight text-lg text-white">EKAGURU</span>
        </div>
        
        <div className="flex items-center gap-4 text-sm">
          <div className="flex gap-2 bg-slate-900 p-1 rounded-lg border border-slate-800">
            <button 
              onClick={() => setAgeMode("young")}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${ageMode === "young" ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-slate-200"}`}
            >
              Young Learner Mode
            </button>
            <button 
              onClick={() => setAgeMode("older")}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${ageMode === "older" ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-slate-200"}`}
            >
              Older Learner Mode
            </button>
          </div>

          <span className="px-3 py-1 bg-slate-900 rounded-full border border-slate-800 font-semibold text-slate-300">
            Step {currentStep} / 6
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-12 flex flex-col justify-center">

        {errorAlert && (
          <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center gap-3 text-amber-400 text-sm">
            <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0" />
            <span className="font-semibold">{errorAlert}</span>
          </div>
        )}

        {/* STEP 1: WELCOME SCREEN */}
        {currentStep === 1 && (
          <div className="space-y-8 max-w-xl mx-auto text-center">
            <div className="w-16 h-16 bg-indigo-600/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto">
              <Sparkles className="w-8 h-8 text-indigo-500" />
            </div>
            
            <div className="space-y-3">
              <h1 className="text-4xl font-extrabold tracking-tight text-white">Welcome to EKAGURU</h1>
              <p className="text-slate-400 text-lg leading-relaxed">
                An intelligent, calm, and distraction-free learning experience that understands how you learn.
              </p>
            </div>

            <button
              onClick={() => setCurrentStep(2)}
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg transition-all"
            >
              Enter Learner Setup <ArrowRight className="ml-2 w-5 h-5" />
            </button>
          </div>
        )}

        {/* STEP 2: LEARNER SETUP */}
        {currentStep === 2 && (
          <div className="max-w-md mx-auto space-y-8 w-full">
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white">Configure Profile Settings</h2>
              <p className="text-slate-400 text-sm">Settings are persisted securely in the Universal Learner Model.</p>
            </div>

            <div className="space-y-6">
              {/* Age adaptive selector */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Learner Age Target
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setAgeMode("young")}
                    className={`p-4 rounded-xl border text-left transition-all ${ageMode === "young" ? "border-indigo-600 bg-indigo-600/10 text-white" : "border-slate-800 hover:border-slate-700"}`}
                  >
                    <div className="font-bold">Age 7 - 11</div>
                    <div className="text-xs text-slate-400 mt-1">Simpler language & larger touch targets.</div>
                  </button>
                  <button
                    onClick={() => setAgeMode("older")}
                    className={`p-4 rounded-xl border text-left transition-all ${ageMode === "older" ? "border-indigo-600 bg-indigo-600/10 text-white" : "border-slate-800 hover:border-slate-700"}`}
                  >
                    <div className="font-bold">Age 12 - 15</div>
                    <div className="text-xs text-slate-400 mt-1">Structured views & symbolic math notation.</div>
                  </button>
                </div>
              </div>

              {/* Language selection */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Language Layer
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 font-bold focus:outline-none focus:border-indigo-600"
                >
                  <option value="English">English</option>
                  <option value="Hindi">Hindi (हिंदी)</option>
                  <option value="Telugu">Telugu (తెలుగు)</option>
                  <option value="Tamil">Tamil (தமிழ்)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4">
              <button onClick={() => setCurrentStep(1)} className="text-slate-400 hover:text-slate-200 font-semibold">
                Back
              </button>
              <button
                onClick={handleSaveSetup}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg transition-all"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: CURRICULUM SELECTION */}
        {currentStep === 3 && (
          <div className="max-w-xl mx-auto space-y-8 w-full">
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white">Select Study Curriculum</h2>
              <p className="text-slate-400 text-sm">Subject boundaries align to regional board standards.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {["CBSE Mathematics", "NCERT Mathematics", "IB Mathematics"].map((board) => (
                <div 
                  key={board}
                  className="p-5 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col justify-between hover:border-slate-700 transition-all cursor-pointer"
                  onClick={() => handleSelectCurriculum(board)}
                >
                  <div>
                    <div className="w-10 h-10 rounded-lg bg-indigo-600/10 flex items-center justify-center mb-4">
                      <BookOpen className="w-5 h-5 text-indigo-500" />
                    </div>
                    <div className="font-extrabold text-white text-lg leading-tight">{board}</div>
                    <div className="text-xs text-slate-500 mt-1">Grade 5 Framework</div>
                  </div>
                  <button className="mt-6 text-xs font-bold text-indigo-500 hover:text-indigo-400 flex items-center gap-1">
                    Select Path <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 4: LEARNING FRONTIER */}
        {currentStep === 4 && (
          <div className="max-w-xl mx-auto space-y-8 w-full">
            <div className="flex justify-between items-start border-b border-slate-900 pb-4">
              <div>
                <h2 className="text-2xl font-black text-white">Your Learning Path</h2>
                <p className="text-slate-400 text-sm">Universal Learner Model frontier roadmap.</p>
              </div>
              <div className="px-3 py-1 bg-emerald-600/10 text-emerald-500 rounded-full border border-emerald-500/20 text-xs font-bold">
                82% Completed
              </div>
            </div>

            {/* Vertical concept path */}
            <div className="space-y-6">
              {frontierNodes.map((node, idx) => {
                const name = node.concept?.canonicalName || node.name || "Concept";
                const status = node.status || "active";
                const desc = node.desc || (status === "active" ? "Your Next Step: unlike denominators." : "");
                
                return (
                  <div key={name} className="flex gap-4 items-start relative">
                    {/* Vertical lines connecting nodes */}
                    {idx < frontierNodes.length - 1 && (
                      <div className={`absolute left-5 top-8 w-[2px] h-10 ${status === "mastered" ? "bg-emerald-600" : "bg-slate-800"}`} />
                    )}
                    
                    {/* Status Indicator circle */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                      status === "mastered" 
                        ? "border-emerald-600 bg-emerald-600/10 text-emerald-500" 
                        : status === "active"
                        ? "border-indigo-600 bg-indigo-600/10 text-indigo-400 animate-pulse"
                        : "border-slate-800 bg-slate-900 text-slate-500"
                    }`}>
                      {status === "mastered" ? <CheckCircle className="w-5 h-5" /> : idx + 1}
                    </div>

                    <div className="flex-1 pt-1.5">
                      <div className="flex justify-between items-center">
                        <span className={`font-bold ${status === "mastered" ? "text-slate-400 line-through" : status === "active" ? "text-white text-lg" : "text-slate-600"}`}>
                          {name}
                        </span>
                        {status === "active" && (
                          <button
                            onClick={() => setCurrentStep(5)}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-sm shadow-md transition-all"
                          >
                            TEACH ME
                          </button>
                        )}
                      </div>
                      {desc && <p className="text-xs text-slate-400 mt-1">{desc}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 5: TEACH ME (SIGNATURE EXPERIENCE) */}
        {currentStep === 5 && (
          <div className="space-y-8 w-full max-w-2xl mx-auto">
            {/* active step indicator */}
            <div className="flex items-center justify-between text-sm text-slate-400 border-b border-slate-900 pb-4">
              <span>Fractions · Adding Unlike Denominators</span>
              <span className="font-medium text-indigo-400">Arjun (Grade 5)</span>
            </div>

            {/* Socratic workspace wrapper */}
            <div className={`border-2 rounded-2xl bg-slate-900 p-8 shadow-2xl transition-all duration-300 ${
              misconceptionAlert ? "border-amber-500" : "border-slate-800"
            }`}>
              
              {/* Socratic Statement */}
              <div className="space-y-6">
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                    EKAGURU Tutor
                  </div>
                  
                  {/* Dynamic Socratic Tutor statement */}
                  <p className="text-white text-lg leading-relaxed">
                    {tutorStatement || "Let's work through this problem together. We want to add these two fractions."}
                  </p>
                </div>

                {/* Mathematical Hero Section */}
                <div className="bg-slate-950/80 rounded-xl p-8 border border-slate-800 flex justify-center items-center">
                  <div className="text-2xl font-mono text-white tracking-widest text-center">
                    {ageMode === "young" ? (
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col items-center">
                          <span>1</span>
                          <span className="border-t border-slate-500 w-6 my-1"></span>
                          <span>2</span>
                        </div>
                        <span>+</span>
                        <div className="flex flex-col items-center">
                          <span>1</span>
                          <span className="border-t border-slate-500 w-6 my-1"></span>
                          <span>3</span>
                        </div>
                      </div>
                    ) : (
                      <span>1/2 + 1/3 = ?</span>
                    )}
                  </div>
                </div>

                {/* Socratic interaction option grid */}
                <div className="space-y-3 pt-4">
                  {(tutorOptions.length > 0 
                    ? tutorOptions.map((opt) => ({ label: opt, val: opt.includes("5/6") ? "5/6" : opt.includes("2/5") ? "2/5" : "3/6" }))
                    : [
                        { label: "5/6 (Convert to common denominator)", val: "5/6" },
                        { label: "2/5 (Add numerators and denominators directly)", val: "2/5" },
                        { label: "3/6 (Convert first fraction only)", val: "3/6" },
                      ]
                  ).map((opt) => (
                    <button
                      key={opt.val}
                      onClick={() => handleSelectAnswer(opt.val)}
                      className={`w-full text-left p-4 rounded-xl border transition-all ${
                        selectedAnswer === opt.val
                          ? opt.val === "5/6"
                            ? "bg-emerald-600/10 border-emerald-500 text-white font-bold"
                            : "bg-amber-600/10 border-amber-500 text-white font-bold"
                          : "bg-slate-950/40 border-slate-800 text-slate-300 hover:bg-slate-950/80 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span>{opt.label}</span>
                        {selectedAnswer === opt.val && (
                          <span className="text-xs font-bold uppercase tracking-wider">
                            {opt.val === "5/6" ? "Correct" : "Misconception"}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Socratic hints drawer */}
                <div className="flex flex-wrap justify-between items-center pt-6 border-t border-slate-800">
                  <div className="flex gap-2">
                    <button
                      onClick={handleRequestHint}
                      className="px-4 py-2 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-lg text-xs font-bold text-slate-400 hover:text-white"
                    >
                      💡 Request Clue {hintLevel > 0 && `(Level ${hintLevel})`}
                    </button>
                    {(selectedAnswer || hintLevel > 0) && (
                      <button
                        onClick={handleResetSimulator}
                        className="px-3 py-2 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-lg text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" /> Reset Simulator
                      </button>
                    )}
                  </div>

                  {selectedAnswer === "5/6" ? (
                    <button
                      onClick={() => setCurrentStep(6)}
                      className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center gap-2"
                    >
                      Celebrate Mastery <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <span className="text-xs text-slate-500 font-medium">
                      Select correct option to advance
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* explainable NBA reasoning card */}
            {attempts > 0 && (
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 font-mono text-xs">
                <div className="text-slate-400 font-bold mb-2 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-400" /> Explainable Next Best Action Metadata:
                </div>
                <pre className="text-indigo-400">{JSON.stringify(nextBestActionExplain, null, 2)}</pre>
              </div>
            )}
          </div>
        )}

        {/* STEP 6: MASTERY CELEBRATION */}
        {currentStep === 6 && (
          <div className="max-w-md mx-auto space-y-8 text-center w-full">
            <div className="w-16 h-16 bg-emerald-600/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-500 font-bold text-2xl">
              ✓
            </div>

            <div className="space-y-3">
              <h2 className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Milestone Achieved</h2>
              <h1 className="text-3xl font-black text-white">Fractions Mastered</h1>
              <p className="text-slate-400 text-sm leading-relaxed max-w-sm mx-auto">
                You can now confidently:
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-left space-y-3 max-w-sm mx-auto">
              {[
                "Compare fractions visually using slices.",
                "Identify equivalent denominators.",
                "Add fractions with like denominators.",
              ].map((point) => (
                <div key={point} className="flex gap-3 items-center text-sm">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span className="text-slate-300">{point}</span>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <div className="text-xs text-slate-500 font-medium">
                Next: Adding fractions with unlike denominators.
              </div>

              <div className="flex gap-4 max-w-sm mx-auto">
                <button
                  onClick={() => {
                    handleResetSimulator();
                    setCurrentStep(4);
                  }}
                  className="flex-1 py-3 border border-slate-800 hover:border-slate-700 text-slate-300 font-bold rounded-xl transition-all"
                >
                  Return to Path
                </button>
                <button
                  onClick={() => {
                    handleResetSimulator();
                    setCurrentStep(1);
                  }}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all"
                >
                  Restart Loop
                </button>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Footer Navigation Controls */}
      <footer className="border-t border-slate-900 px-6 py-4 bg-slate-950 flex justify-between items-center text-xs text-slate-500">
        <span>© 2026 EKAGURU. Educational Access Layer.</span>
        <div className="flex gap-4">
          <button onClick={() => setCurrentStep(1)} className="hover:text-slate-300">Welcome</button>
          <button onClick={() => setCurrentStep(2)} className="hover:text-slate-300">Setup</button>
          <button onClick={() => setCurrentStep(4)} className="hover:text-slate-300">Frontier</button>
          <button onClick={() => setCurrentStep(5)} className="hover:text-slate-300">Tutor</button>
        </div>
      </footer>

    </div>
  );
}
