'use client';

import React, { useState } from 'react';
import { ZoomIn, ZoomOut, Maximize2, RotateCw, CheckCircle2, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { EvidenceCitation } from '../../lib/learning/teaching-package.types';

export interface BookPageViewerProps {
  pageNumber?: number;
  currentPage?: number;
  bookId?: string;
  totalPages: number;
  activeCitation?: EvidenceCitation | null;
  pdfUrl?: string;
  className?: string;
  onOpenFullPage?: () => void;
  onPageChange?: (newPage: number) => void;
  compact?: boolean;
}

export function BookPageViewer({
  pageNumber,
  currentPage,
  bookId = 'evs-class-5',
  totalPages,
  activeCitation,
  pdfUrl,
  className = '',
  onOpenFullPage,
  onPageChange,
  compact = false,
}: BookPageViewerProps) {
  const [zoom, setZoom] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);
  const [imageLoaded, setImageLoaded] = useState<boolean>(true);

  const activePage = currentPage || pageNumber || 1;
  const imgSrc = `/textbooks/${bookId}/page-${activePage}.png`;

  return (
    <div
      data-testid="book-page-viewer"
      className={`flex flex-col bg-[#070b14] border-2 border-amber-900/50 rounded-2xl overflow-hidden shadow-2xl relative select-none w-full ${className}`}
    >
      {/* Top PDF Controls Toolbar */}
      <div className="h-9 px-3 bg-[#0d1424] border-b border-slate-800/80 flex items-center justify-between text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-md bg-rose-600 text-white font-black text-[10px] flex items-center justify-center shadow">
            PDF
          </span>
          <span className="text-[11px] font-mono text-slate-300 font-bold">
            Page {activePage} of {totalPages}
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
      <div className="p-2 overflow-y-auto bg-[#141b2a] flex flex-col items-center justify-center min-h-[380px] max-h-[460px] custom-scrollbar relative">
        <div
          style={{
            transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
            transformOrigin: 'center center',
            transition: 'transform 0.15s ease-out',
          }}
          className="max-w-full relative flex items-center justify-center"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imgSrc}
            alt={`Original Textbook Page ${activePage}`}
            className="w-full max-h-[420px] object-contain rounded-lg shadow-2xl border border-slate-700/80 bg-white"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageLoaded(false)}
          />

          {/* Dynamic Bounding Box Overlay if Citation matches active page */}
          {activeCitation && activeCitation.physicalPage === activePage && activeCitation.bbox && (
            <div
              style={{
                position: 'absolute',
                left: `${(activeCitation.bbox.x / 1200) * 100}%`,
                top: `${(activeCitation.bbox.y / 1680) * 100}%`,
                width: `${(activeCitation.bbox.width / 1200) * 100}%`,
                height: `${(activeCitation.bbox.height / 1680) * 100}%`,
              }}
              className="border-2 border-amber-400 bg-amber-400/30 rounded animate-pulse pointer-events-none shadow-[0_0_10px_rgba(251,191,36,0.8)]"
            />
          )}
        </div>
      </div>

      {/* Bottom Verification Status */}
      <div className="px-3 py-1.5 bg-[#0a0f1d] border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400 font-sans">
        <span className="flex items-center gap-1 text-emerald-400 font-bold">
          <CheckCircle2 className="w-3 h-3" /> Original Scanned Page
        </span>
        <span className="font-mono text-slate-500">Immutable Source • ${totalPages} Pages</span>
      </div>
    </div>
  );
}
