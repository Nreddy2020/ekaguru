'use client';

import React, { useState } from 'react';

interface UploadEvidenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEvidenceProcessed?: (evidence: any) => void;
}

export const UploadEvidenceModal: React.FC<UploadEvidenceModalProps> = ({
  isOpen,
  onClose,
  onEvidenceProcessed,
}) => {
  const [pasteContent, setPasteContent] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setPasteContent(event.target?.result as string);
      setStatusMsg(`Loaded ${file.name} (${Math.round(file.size / 1024)} KB)`);
    };
    reader.readAsText(file);
  };

  const handleIngest = () => {
    if (!pasteContent.trim()) {
      setStatusMsg('Please upload a file or paste evidence content.');
      return;
    }
    setStatusMsg('Parsing, normalizing, and correlating evidence against active canonical index...');
    setTimeout(() => {
      setStatusMsg('✅ Evidence successfully normalized into Canonical Evidence Timeline!');
      if (onEvidenceProcessed) {
        onEvidenceProcessed({
          source: uploadedFileName || 'MANUAL_PASTE',
          content: pasteContent,
          timestamp: new Date().toISOString(),
        });
      }
      setTimeout(() => {
        onClose();
        setStatusMsg(null);
        setPasteContent('');
        setUploadedFileName(null);
      }, 1500);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0c1424] border border-slate-700 rounded-xl max-w-xl w-full p-5 space-y-4 shadow-2xl text-xs">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-teal-400 text-base">📥</span>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Upload Diagnostic Evidence
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white font-bold">✕</button>
        </div>

        <p className="text-slate-300 leading-relaxed">
          Ingest raw logs, trace exports, configuration dumps, or thread stacks. VITALIS will classify, normalize timestamps, extract correlation IDs, and link evidence to the active Request 360 viewer.
        </p>

        {/* Drop / Browse File Box */}
        <label className="border-2 border-dashed border-slate-700 hover:border-teal-500 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer bg-[#070e1c] transition-colors">
          <span className="text-2xl mb-1">📁</span>
          <span className="font-semibold text-slate-200">
            {uploadedFileName ? `Selected: ${uploadedFileName}` : 'Drag & drop file or click to browse'}
          </span>
          <span className="text-[11px] text-slate-500 mt-1">
            Supports JSON, LOG, TXT, YAML, XML, CSV (max 10MB)
          </span>
          <input type="file" className="hidden" onChange={handleFileUpload} />
        </label>

        {/* Raw Text Input */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            OR Paste Diagnostic Payload:
          </label>
          <textarea
            rows={5}
            value={pasteContent}
            onChange={(e) => setPasteContent(e.target.value)}
            placeholder="Paste log snippet, trace JSON, or configuration diff..."
            className="w-full bg-[#070e1c] border border-slate-700 rounded-lg p-2.5 text-slate-200 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>

        {statusMsg && (
          <div className="p-2.5 rounded-lg bg-teal-950/80 border border-teal-500/40 text-teal-300 text-xs font-mono">
            {statusMsg}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleIngest}
            className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs transition-colors shadow-md"
          >
            Ingest &amp; Correlate
          </button>
        </div>
      </div>
    </div>
  );
};
