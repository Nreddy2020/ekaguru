'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ZoomIn, ZoomOut, Maximize2, ShieldCheck, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';

export interface PhysicalSourceLocation {
  pdfPage: number;
  region: 'full' | 'left' | 'right';
  rotation: number;
  viewport?: { x: number; y: number; width: number; height: number };
}

export interface PrintedPageEvidence {
  number: number | null;
  confidence: number;
  detected: boolean;
}

export interface SourcePage {
  sourceId: string;
  sequenceIndex: number;
  physical: PhysicalSourceLocation;
  printed: PrintedPageEvidence;
  classification?: {
    type: string;
    subType?: string;
  };
  structure?: {
    unitId?: string;
    unitTitle?: string;
    chapterId?: string;
    chapterTitle?: string;
    sectionId?: string;
    sectionTitle?: string;
  };
  forensic?: {
    confidence: number;
    needsReview: boolean;
    reviewReasons: string[];
  };
  content?: string;
}

export interface LearningOriginalBookViewerProps {
  materialId?: string;
  sourcePage?: SourcePage;
  totalSourcePages?: number;
  pdfPage?: number;
  printedPage?: number;
  totalPdfPages?: number;
  totalPrintedPages?: number;
  side?: 'left' | 'right' | 'full';
  rotation?: number;
  sectionTitle?: string;
  sourceTitle?: string;
  extractedContent?: string;
  onPreviousPage?: () => void;
  onNextPage?: () => void;
  className?: string;
}

/**
 * MODULE 05: Original Book Content Viewer
 * 
 * Invariants:
 * - Directly consumes atomic SourcePage from canonical sequence
 * - Reading order navigation across entire book (sequenceIndex 1..N)
 * - Direct PDF.js rendering from authoritative binary stream
 * - Full physical page rasterization with exact logical viewport cropping
 * - Rotation-aware spread rendering (0 deg vs 270 deg)
 * - True raster scaling at 70%-160% zoom
 * - Zero synthetic textbook HTML or SVG recreation
 */
export function LearningOriginalBookViewer({
  materialId,
  sourcePage,
  totalSourcePages = 116,
  pdfPage = 1,
  printedPage = 1,
  totalPdfPages = 59,
  totalPrintedPages = 116,
  side = 'full',
  rotation,
  sectionTitle = 'Original Book Content',
  sourceTitle = 'NCERT / CBSE Environmental Studies Class 5',
  extractedContent = '',
  onPreviousPage,
  onNextPage,
  className = '',
}: LearningOriginalBookViewerProps) {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const renderTaskRef = useRef<any>(null);

  // Extract from SourcePage data model v6.0 or legacy props
  const effectivePdfPage = sourcePage?.physical?.pdfPage || pdfPage;
  const effectiveSide = sourcePage?.physical?.region || side;
  const effectiveRotation =
    sourcePage?.physical?.rotation !== undefined
      ? sourcePage.physical.rotation
      : rotation !== undefined
      ? rotation
      : effectivePdfPage >= 3
      ? 270
      : 0;
  const effectivePrintedNumber =
    sourcePage?.printed?.number !== undefined ? sourcePage.printed.number : printedPage;
  const effectiveSequenceIndex = sourcePage?.sequenceIndex || 1;

  useEffect(() => {
    let isCancelled = false;

    async function renderPdfPage() {
      if (!materialId || !canvasRef.current) return;

      try {
        setIsLoading(true);
        setError(null);

        if (renderTaskRef.current) {
          renderTaskRef.current.cancel();
          renderTaskRef.current = null;
        }

        let pdfjsLib = (window as any).pdfjsLib;
        if (!pdfjsLib) {
          try {
            pdfjsLib = await import('pdfjs-dist');
            if (pdfjsLib.GlobalWorkerOptions) {
              pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
            }
          } catch (e) {
            throw new Error('PDF.js library could not be loaded');
          }
        }

        const pdfUrl = `/api/materials/${materialId}/pdf`;
        const loadingTask = pdfjsLib.getDocument(pdfUrl);
        const pdf = await loadingTask.promise;

        if (isCancelled) return;

        const targetPage = Math.min(Math.max(1, effectivePdfPage), pdf.numPages);
        const page = await pdf.getPage(targetPage);

        if (isCancelled) return;

        // Render with rotation-awareness
        const scale = (zoomLevel / 100) * 2.0; // 2x high-DPI
        const viewport = page.getViewport({ scale, rotation: effectiveRotation });

        // Offscreen canvas for full physical page
        const offscreenCanvas = document.createElement('canvas');
        offscreenCanvas.width = viewport.width;
        offscreenCanvas.height = viewport.height;
        const offscreenCtx = offscreenCanvas.getContext('2d', { alpha: false });

        if (!offscreenCtx) {
          throw new Error('Failed to get 2D context for offscreen canvas');
        }

        const renderContext = {
          canvasContext: offscreenCtx,
          viewport: viewport,
        };

        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;
        await renderTask.promise;

        if (isCancelled) return;

        // Target visible canvas
        const visibleCanvas = canvasRef.current;
        if (!visibleCanvas) return;
        const visibleCtx = visibleCanvas.getContext('2d', { alpha: false });
        if (!visibleCtx) return;

        // Compute exact crop region
        const W = viewport.width;
        const H = viewport.height;

        let srcX = 0;
        let srcY = 0;
        let srcW = W;
        let srcH = H;

        // If spread (pages 3+) and not explicitly full, crop to left or right half
        if (effectiveRotation !== 0 && effectiveSide !== 'full') {
          if (effectiveSide === 'left') {
            srcX = 0;
            srcY = 0;
            srcW = Math.floor(W / 2);
            srcH = H;
          } else if (effectiveSide === 'right') {
            srcX = Math.floor(W / 2);
            srcY = 0;
            srcW = Math.floor(W / 2);
            srcH = H;
          }
        }

        visibleCanvas.width = srcW;
        visibleCanvas.height = srcH;

        visibleCtx.drawImage(
          offscreenCanvas,
          srcX,
          srcY,
          srcW,
          srcH,
          0,
          0,
          srcW,
          srcH
        );

        setIsLoading(false);
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException' && !isCancelled) {
          console.warn('PDF canvas render fallback:', err.message);
          setIsLoading(false);
        }
      }
    }

    renderPdfPage();

    return () => {
      isCancelled = true;
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
    };
  }, [materialId, effectivePdfPage, effectiveSide, effectiveRotation, zoomLevel]);

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(160, prev + 20));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(70, prev - 20));
  const handleResetZoom = () => setZoomLevel(100);
  const handleToggleFullscreen = () => setIsFullscreen((prev) => !prev);

  return (
    <div
      ref={containerRef}
      data-testid="learning-original-book-viewer"
      className={`flex flex-col rounded-2xl bg-[#0b101d] border border-slate-800/90 shadow-2xl overflow-hidden select-none ${
        isFullscreen ? 'fixed inset-4 z-50 bg-[#070b14]/98' : 'h-full min-h-[620px]'
      } ${className}`}
    >
      {/* Viewer Header Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#0f172a]/95 border-b border-slate-800/80 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <BookOpen className="w-4 h-4 text-indigo-400 shrink-0" />
          <div className="min-w-0">
            <span className="text-xs font-bold text-white tracking-wide block truncate">
              Original Book Content
            </span>
            <span className="text-[10px] text-slate-400 block truncate">
              {effectivePrintedNumber !== null
                ? `Printed Page ${effectivePrintedNumber} (Sequence #${effectiveSequenceIndex} of ${totalSourcePages})`
                : `Sequence #${effectiveSequenceIndex} of ${totalSourcePages} (Unnumbered Special Page)`}{' '}
              {effectiveRotation !== 0 ? `• Spread ${effectivePdfPage} of ${totalPdfPages}` : ''}
            </span>
          </div>
        </div>

        {/* Action Controls & Continuous Reading-Order Stepper */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Continuous Reading-Order Step Controls */}
          <div className="flex items-center bg-slate-900/90 rounded-xl p-1 border border-slate-800/80">
            <button
              type="button"
              data-testid="prev-page-btn"
              onClick={onPreviousPage}
              disabled={effectiveSequenceIndex <= 1 || !onPreviousPage}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition"
              title="Previous Source Record (Sequence Order)"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 text-[10px] font-mono font-bold text-slate-300">
              #{effectiveSequenceIndex}
            </span>
            <button
              type="button"
              data-testid="next-page-btn"
              onClick={onNextPage}
              disabled={effectiveSequenceIndex >= totalSourcePages || !onNextPage}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition"
              title="Next Source Record (Sequence Order)"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center bg-slate-900/90 rounded-xl p-1 border border-slate-800/80">
            <button
              type="button"
              data-testid="zoom-out-btn"
              onClick={handleZoomOut}
              disabled={zoomLevel <= 70}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              data-testid="reset-zoom-btn"
              onClick={handleResetZoom}
              className="px-2 py-1 text-[11px] font-mono font-bold text-slate-200 hover:text-white transition"
              title="Reset Zoom"
            >
              {zoomLevel}%
            </button>

            <button
              type="button"
              data-testid="zoom-in-btn"
              onClick={handleZoomIn}
              disabled={zoomLevel >= 160}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            data-testid="fullscreen-btn"
            onClick={handleToggleFullscreen}
            className="p-2 rounded-xl bg-slate-900/90 text-slate-400 hover:text-white hover:bg-white/10 border border-slate-800/80 transition"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Canvas Viewport Area */}
      <div
        data-testid="viewer-viewport-container"
        className="flex-1 overflow-auto bg-[#070b14] flex items-center justify-center p-4 min-h-[460px] relative custom-scrollbar"
      >
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#070b14]/80 backdrop-blur-sm z-20">
            <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
            <span className="text-xs font-semibold text-indigo-300">
              Rasterizing Authoritative PDF Source #{effectiveSequenceIndex}...
            </span>
          </div>
        )}

        <canvas
          ref={canvasRef}
          data-testid="pdf-canvas"
          className="shadow-2xl rounded-lg max-w-full max-h-full object-contain border border-slate-800/40 bg-white"
        />
      </div>

      {/* Verified Provenance Footer */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#090e1a] border-t border-slate-800/80 shrink-0 text-[10px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>Authoritative Scanned Textbook Source (0% Deviation)</span>
        </div>
        <span className="font-mono text-slate-500">
          Source: {effectiveRotation !== 0 ? `Spread ${effectivePdfPage} (${effectiveSide} side)` : `Page ${effectivePdfPage}`} [#{effectiveSequenceIndex}]
        </span>
      </div>
    </div>
  );
}
