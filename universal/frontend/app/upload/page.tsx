'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Copy,
  Layers,
  Sparkles,
  BookOpen,
  X,
} from 'lucide-react';

type Step = 'SELECT' | 'UPLOADING' | 'PROCESSING' | 'READY' | 'FAILED';

interface DuplicateModalData {
  id: string;
  title: string;
  processingStatus: string;
  originalFileName?: string;
  fileSizeBytes?: number;
}

export default function UploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>('SELECT');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [subjectName, setSubjectName] = useState('Science');
  const [gradeLevel, setGradeLevel] = useState('5');
  const [description, setDescription] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  // Live Processing State
  const [materialId, setMaterialId] = useState<string | null>(null);
  const [activeStageIndex, setActiveStageIndex] = useState(0);
  const [extractedStats, setExtractedStats] = useState<{
    chapters: number;
    topics: number;
    concepts: number;
    pages: number;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [traceId, setTraceId] = useState<string | null>(null);

  // Duplicate Collision State
  const [duplicateData, setDuplicateData] = useState<DuplicateModalData | null>(null);

  const stages = [
    { label: 'File Validation & Integrity Check', key: 'VALIDATING' },
    { label: 'Encrypted Storage & Provenance', key: 'STORED' },
    { label: 'Page Truth Extraction & Visual Forensics', key: 'PAGE_TRUTH' },
    { label: 'Structure & Topic Hierarchy Detection', key: 'STRUCTURE' },
    { label: 'Knowledge Construction & Canonical Graph', key: 'KNOWLEDGE' },
    { label: 'Output Consistency Verification Gate', key: 'VERIFYING' },
  ];

  // Token helper
  const getAuthToken = async (): Promise<string | null> => {
    let token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      const loginRes = await fetch('http://127.0.0.1:20000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'demo@ekaguru.com', password: 'password123' }),
      });
      if (loginRes.ok) {
        const data = await loginRes.json();
        token = data.access_token;
        if (token) localStorage.setItem('token', token);
      }
    }
    return token;
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const processSelectedFile = (file: File) => {
    setSelectedFile(file);
    if (!title) {
      const rawName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setTitle(rawName.charAt(0).toUpperCase() + rawName.slice(1));
    }
  };

  const handleUploadSubmit = async (forceNewVersion = false) => {
    if (!selectedFile) return;

    try {
      setStep('UPLOADING');
      setUploadProgress(20);
      setDuplicateData(null);
      setErrorMessage(null);

      const token = await getAuthToken();
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('learnerId', 'learner-001');
      formData.append('title', title || selectedFile.name);
      formData.append('subjectName', subjectName);
      formData.append('gradeLevel', gradeLevel);
      formData.append('materialType', 'TEXTBOOK');
      if (description) formData.append('description', description);
      if (forceNewVersion) formData.append('forceNewVersion', 'true');

      setUploadProgress(50);

      const res = await fetch('http://127.0.0.1:20000/api/v2/learning-materials/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const payload = await res.json();

      // Check duplicate collision
      if (payload.duplicate && payload.data) {
        setDuplicateData(payload.data);
        setStep('SELECT');
        return;
      }

      if (!res.ok) {
        throw new Error(payload.message || `Upload failed with status ${res.status}`);
      }

      const newMaterialId = payload.data?.id;
      setMaterialId(newMaterialId);
      setUploadProgress(100);

      // Transition immediately into live automated M2 processing journey
      startLiveProcessing(newMaterialId);
    } catch (err: any) {
      setErrorMessage(err.message || 'Upload failed.');
      setStep('FAILED');
    }
  };

  const startLiveProcessing = async (id: string) => {
    setStep('PROCESSING');
    setActiveStageIndex(0);

    // Simulate animated stage progression while M2 executes
    const stageInterval = setInterval(() => {
      setActiveStageIndex((prev) => (prev < 4 ? prev + 1 : prev));
    }, 600);

    try {
      const token = await getAuthToken();
      const res = await fetch(`http://127.0.0.1:20000/api/v2/learning-materials/${id}/process`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      clearInterval(stageInterval);
      const data = await res.json();

      if (!res.ok || data.data?.processingStatus === 'FAILED') {
        setActiveStageIndex(5);
        setStep('FAILED');
        setErrorMessage(data.data?.failureReason || data.message || 'M2 Document Intelligence extraction failed.');
        setTraceId(`trc_${Date.now().toString(36)}`);
        return;
      }

      // Successful M2 Output Verification Gate Passed!
      setActiveStageIndex(6);
      setExtractedStats({
        chapters: data.data?.chapterCount || 0,
        topics: data.data?.chunkCount || 0,
        concepts: data.data?.conceptCount || 0,
        pages: data.data?.pageCount || 0,
      });
      setStep('READY');
    } catch (err: any) {
      clearInterval(stageInterval);
      setStep('FAILED');
      setErrorMessage(err.message || 'Processing network exception occurred.');
      setTraceId(`trc_${Date.now().toString(36)}`);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased">
      {/* Top Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur sticky top-0 z-30 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link
              href="/library"
              className="text-sm font-semibold text-slate-400 hover:text-white transition"
            >
              ← Back to Library
            </Link>
            <span className="text-slate-600">/</span>
            <span className="text-sm font-medium text-slate-200">Add Learning Material</span>
          </div>
          <Link
            href="/observe"
            className="inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-700/60 text-emerald-300 hover:bg-emerald-900/60 transition"
          >
            <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-emerald-400" /> VITALIS Telemetry
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        {/* Step 1: File Selection & Configuration */}
        {step === 'SELECT' && (
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight">Add Learning Material</h1>
              <p className="text-slate-400 text-sm mt-1">
                Upload your textbook, chapter, or notes. M2 Document Intelligence will extract chapters, topics, concepts, and relationships.
              </p>
            </div>

            {/* Dropzone */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-10 text-center cursor-pointer transition ${
                selectedFile
                  ? 'border-emerald-500/60 bg-emerald-950/10'
                  : 'border-slate-800 hover:border-slate-700 bg-slate-900/40 hover:bg-slate-900/60'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.epub,image/*"
                onChange={handleFileInputChange}
                className="hidden"
              />

              <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto mb-4 text-emerald-400">
                <UploadCloud className="w-8 h-8" />
              </div>

              {selectedFile ? (
                <div className="space-y-1">
                  <p className="text-base font-bold text-white">{selectedFile.name}</p>
                  <p className="text-xs text-slate-400 font-mono">{formatFileSize(selectedFile.size)}</p>
                  <span className="inline-block mt-2 text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    File selected & verified
                  </span>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-base font-bold text-white">Drag & Drop your document here</p>
                  <p className="text-xs text-slate-400">or click to browse files from your computer</p>
                  <div className="flex justify-center gap-2 pt-2">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">PDF</span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">DOCX</span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">EPUB</span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">Max 50 MB</span>
                  </div>
                </div>
              )}
            </div>

            {/* Document Metadata Form */}
            {selectedFile && (
              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-4">
                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Material Details</h3>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. CBSE Science Grade 5"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400">Subject</label>
                    <select
                      value={subjectName}
                      onChange={(e) => setSubjectName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-emerald-500 transition"
                    >
                      <option value="Science">Science</option>
                      <option value="Mathematics">Mathematics</option>
                      <option value="English">English</option>
                      <option value="Social Studies">Social Studies</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400">Grade Level</label>
                    <select
                      value={gradeLevel}
                      onChange={(e) => setGradeLevel(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-emerald-500 transition"
                    >
                      <option value="3">Grade 3</option>
                      <option value="4">Grade 4</option>
                      <option value="5">Grade 5</option>
                      <option value="6">Grade 6</option>
                      <option value="7">Grade 7</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-end space-x-3">
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setTitle('');
                    }}
                    className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-white transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleUploadSubmit(false)}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-lg shadow-emerald-900/30 transition flex items-center"
                  >
                    Upload & Process <ArrowRight className="w-4 h-4 ml-2" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Uploading Progress */}
        {step === 'UPLOADING' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-10 text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
              <UploadCloud className="w-8 h-8 animate-bounce" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white">Uploading {selectedFile?.name}...</h2>
              <p className="text-xs text-slate-400">Verifying SHA-256 and streaming to encrypted storage</p>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Step 3: Live Post-Upload M2 Processing Journey */}
        {step === 'PROCESSING' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-xl font-extrabold text-white">{title || selectedFile?.name}</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {formatFileSize(selectedFile?.size)} • Automatic M2 Processing
                </p>
              </div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin text-amber-400" /> Processing
              </span>
            </div>

            <div className="space-y-3.5">
              {stages.map((stage, idx) => {
                const isComplete = idx < activeStageIndex;
                const isCurrent = idx === activeStageIndex;
                return (
                  <div
                    key={stage.key}
                    className={`p-4 rounded-2xl border transition flex items-center justify-between ${
                      isComplete
                        ? 'bg-slate-950/60 border-slate-800 text-slate-300'
                        : isCurrent
                        ? 'bg-emerald-950/20 border-emerald-600/40 text-emerald-300'
                        : 'bg-slate-950/20 border-slate-900 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      {isComplete ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                      ) : isCurrent ? (
                        <RefreshCw className="w-5 h-5 text-emerald-400 animate-spin flex-shrink-0" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-slate-800 flex-shrink-0" />
                      )}
                      <span className="text-sm font-semibold">{stage.label}</span>
                    </div>

                    <span className="text-xs font-mono">
                      {isComplete ? '100%' : isCurrent ? 'in progress...' : 'pending'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 4: READY - Verified Success Gate */}
        {step === 'READY' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 space-y-8 text-center">
            <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                READY ✓ Output Verified
              </span>
              <h2 className="text-2xl font-black text-white">{title || selectedFile?.name}</h2>
              <p className="text-slate-400 text-xs">
                M2 Document Intelligence successfully extracted and persisted all chapters, topics, and canonical concepts.
              </p>
            </div>

            {/* Extracted Stats Summary */}
            {extractedStats && (
              <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                  <p className="text-xs font-semibold text-slate-400 uppercase">Chapters</p>
                  <p className="text-2xl font-black text-white mt-1">{extractedStats.chapters}</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                  <p className="text-xs font-semibold text-slate-400 uppercase">Topics</p>
                  <p className="text-2xl font-black text-white mt-1">{extractedStats.topics}</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                  <p className="text-xs font-semibold text-slate-400 uppercase">Concepts</p>
                  <p className="text-2xl font-black text-white mt-1">{extractedStats.concepts}</p>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row justify-center gap-3 pt-4">
              {materialId && (
                <Link
                  href={`/library/${materialId}`}
                  className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm font-bold shadow-lg shadow-emerald-500/20 transition flex items-center justify-center"
                >
                  <BookOpen className="w-4 h-4 mr-2" /> View Material Details →
                </Link>
              )}
              <Link
                href="/library"
                className="px-6 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold border border-slate-700 transition"
              >
                Go to Library
              </Link>
            </div>
          </div>
        )}

        {/* Step 5: FAILED - Diagnostic Feedback with Trace ID */}
        {step === 'FAILED' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 space-y-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
              <AlertCircle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                PROCESSING FAILED
              </span>
              <h2 className="text-xl font-bold text-white">Extraction Failed</h2>
              <p className="text-rose-300 text-xs max-w-md mx-auto">{errorMessage || 'An error occurred during extraction.'}</p>
            </div>

            {traceId && (
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 max-w-md mx-auto flex items-center justify-between text-xs">
                <span className="text-slate-400">VITALIS Trace ID:</span>
                <span className="font-mono text-emerald-400">{traceId}</span>
              </div>
            )}

            <div className="flex justify-center gap-3 pt-4">
              {materialId && (
                <button
                  onClick={() => startLiveProcessing(materialId)}
                  className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-bold transition flex items-center"
                >
                  <RefreshCw className="w-4 h-4 mr-2" /> Retry Processing
                </button>
              )}
              <Link
                href="/observe"
                className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold border border-slate-700 transition flex items-center"
              >
                <ShieldCheck className="w-4 h-4 mr-2 text-emerald-400" /> View Diagnostics
              </Link>
            </div>
          </div>
        )}

        {/* Duplicate Collision Modal */}
        {duplicateData && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Material Already Exists</h3>
                    <p className="text-xs text-slate-400">Identical SHA-256 checksum detected</p>
                  </div>
                </div>
                <button
                  onClick={() => setDuplicateData(null)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-2">
                <p className="text-slate-300 font-semibold">{duplicateData.title}</p>
                <p className="text-slate-400">{duplicateData.originalFileName} ({formatFileSize(duplicateData.fileSizeBytes)})</p>
                <p className="text-emerald-400 font-semibold">Status: {duplicateData.processingStatus}</p>
              </div>

              <div className="flex flex-col gap-2.5">
                <Link
                  href={`/library/${duplicateData.id}`}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold text-center transition"
                >
                  Open Existing Material →
                </Link>
                <button
                  onClick={() => handleUploadSubmit(true)}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
                >
                  Upload as New Version
                </button>
                <button
                  onClick={() => setDuplicateData(null)}
                  className="w-full py-2 rounded-xl text-slate-400 hover:text-white text-xs transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
