import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { LearningOriginalBookViewer } from './LearningOriginalBookViewer';

describe('MODULE 05: Original Book Content Viewer', () => {
  it('renders viewer header with printed page and spread information', () => {
    render(
      <LearningOriginalBookViewer
        materialId="test-mat"
        pdfPage={7}
        printedPage={10}
        totalPdfPages={59}
        totalPrintedPages={118}
        side="left"
        sectionTitle="2.2 Heart, Lungs, Stomach & Kidneys"
      />
    );

    expect(screen.getByText(/Original Book Content/i)).toBeInTheDocument();
    expect(screen.getByText(/Printed Page 10/i)).toBeInTheDocument();
  });

  it('renders canvas element with pdf-canvas testid', () => {
    render(
      <LearningOriginalBookViewer
        materialId="test-mat"
        pdfPage={7}
        printedPage={10}
        totalPdfPages={59}
        totalPrintedPages={118}
        side="left"
      />
    );

    expect(screen.getByTestId('pdf-canvas')).toBeInTheDocument();
  });

  it('handles zoom in, zoom out, and reset zoom controls', () => {
    render(
      <LearningOriginalBookViewer
        materialId="test-mat"
        pdfPage={7}
        printedPage={10}
        totalPdfPages={59}
        totalPrintedPages={118}
        side="left"
        sectionTitle="2.2 Heart, Lungs, Stomach & Kidneys"
      />
    );

    const zoomInBtn = screen.getByTestId('zoom-in-btn');
    const zoomOutBtn = screen.getByTestId('zoom-out-btn');
    const resetBtn = screen.getByTestId('reset-zoom-btn');

    expect(screen.getByText('100%')).toBeInTheDocument();

    fireEvent.click(zoomInBtn);
    expect(screen.getByText('120%')).toBeInTheDocument();

    fireEvent.click(zoomOutBtn);
    expect(screen.getByText('100%')).toBeInTheDocument();

    fireEvent.click(zoomInBtn);
    fireEvent.click(zoomInBtn);
    expect(screen.getByText('140%')).toBeInTheDocument();

    fireEvent.click(resetBtn);
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('allows toggling fullscreen mode', () => {
    render(
      <LearningOriginalBookViewer
        materialId="test-mat"
        pdfPage={7}
        printedPage={10}
        totalPdfPages={59}
        totalPrintedPages={118}
        side="left"
        sectionTitle="2.2 Heart, Lungs, Stomach & Kidneys"
      />
    );

    const fullscreenBtn = screen.getByTestId('fullscreen-btn');
    const viewer = screen.getByTestId('learning-original-book-viewer');

    expect(viewer.className).not.toContain('fixed inset-4');

    fireEvent.click(fullscreenBtn);
    expect(viewer.className).toContain('fixed inset-4');

    fireEvent.click(fullscreenBtn);
    expect(viewer.className).not.toContain('fixed inset-4');
  });

  it('renders verified footnote indicating exact textbook source with printed page number', () => {
    render(
      <LearningOriginalBookViewer
        materialId="test-mat"
        pdfPage={7}
        printedPage={10}
        totalPdfPages={59}
        totalPrintedPages={118}
        side="left"
        sectionTitle="2.2 Heart, Lungs, Stomach & Kidneys"
        sourceTitle="MY BODY & LIVING WORLD (EVS Class 5) – NCERT"
      />
    );

    expect(screen.getByText(/Authoritative Scanned Textbook Source/i)).toBeInTheDocument();
    expect(screen.getByText(/Spread 7 \(left side\)/i)).toBeInTheDocument();
  });
});
