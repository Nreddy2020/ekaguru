'use client';

import React, { useState } from 'react';
import { ZoomIn, ZoomOut, Maximize2, RotateCw, CheckCircle2, FileText, ChevronLeft, ChevronRight } from 'lucide-react';

export interface BookPageViewerProps {
  pageNumber: number;
  totalPages: number;
  pdfUrl?: string;
  className?: string;
  onOpenFullPage?: () => void;
  onPageChange?: (newPage: number) => void;
  compact?: boolean;
}

export function BookPageViewer({
  pageNumber,
  totalPages,
  pdfUrl,
  className = '',
  onOpenFullPage,
  onPageChange,
  compact = false,
}: BookPageViewerProps) {
  const [zoom, setZoom] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);
  const [imageLoaded, setImageLoaded] = useState<boolean>(true);

  // Direct high-resolution original page scan from the uploaded physical PDF
  const imgSrc = `/textbooks/evs-class-5/page-${pageNumber}.png`;

  return (
    <div
      data-testid="book-page-viewer"
      className={`flex flex-col bg-[#070b14] border-2 border-amber-900/50 rounded-2xl overflow-hidden shadow-2xl relative select-none ${className}`}
    >
      {/* Top PDF Controls Toolbar */}
      <div className="h-9 px-3 bg-[#0d1424] border-b border-slate-800/80 flex items-center justify-between text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-md bg-rose-600 text-white font-black text-[10px] flex items-center justify-center shadow">
            PDF
          </span>
          <span className="text-[11px] font-mono text-slate-300 font-bold">
            Page {pageNumber} of {totalPages}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setZoom((z) => Math.max(60, z - 15))}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[10px] font-mono text-slate-400 w-9 text-center">{zoom}%</span>
          <button
            onClick={() => setZoom((z) => Math.min(180, z + 15))}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setRotation((r) => (r + 90) % 360)}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition"
            title="Rotate Page"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
          {onOpenFullPage && (
            <button
              onClick={onOpenFullPage}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition ml-1"
              title="Full Page High-Res Inspector"
            >
              <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
            </button>
          )}
        </div>
      </div>

      {/* 100% REAL SCANNED ORIGINAL PAGE CANVAS */}
      <div className="p-2 overflow-y-auto bg-[#141b2a] flex flex-col items-center justify-center min-h-[380px] max-h-[440px] custom-scrollbar relative">
        <div
          style={{
            transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
            transformOrigin: 'center center',
            transition: 'transform 0.15s ease-out',
          }}
          className="max-w-full flex items-center justify-center"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imgSrc}
            alt={`Original Textbook Page ${pageNumber}`}
            className="w-full max-h-[400px] object-contain rounded-lg shadow-2xl border border-slate-700/80 bg-white"
            onLoad={() => setImageLoaded(true)}
            onError={(e) => {
              // fallback gracefully if needed
              setImageLoaded(false);
            }}
          />
        </div>
      </div>

      {/* Bottom Verification Status */}
      <div className="px-3 py-1.5 bg-[#0a0f1d] border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400 font-sans">
        <span className="flex items-center gap-1 text-emerald-400 font-bold">
          <CheckCircle2 className="w-3 h-3" /> Original Scanned Page
        </span>
        <span className="font-mono text-slate-500">Immutable Source • 59 Pages</span>
      </div>
    </div>
  );
}
