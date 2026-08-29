import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LearningExplanationPanel } from './LearningExplanationPanel';

describe('Module 06.1: EKAGURU Learner Experience Engine & Studio Inspector', () => {
  const sampleAnchor = {
    sourceId: 'src-0011',
    sequenceIndex: 11,
    printedPage: 10,
    pdfPage: 6,
    side: 'left' as const,
    snippetText: 'The heart pumps blood to the whole body.',
    confidence: 1.0,
  };

  it('renders child-friendly learning journey with discovery stages', () => {
    render(
      <LearningExplanationPanel
        sectionId="sec-2-10"
        sectionTitle="2.10 Heart, Lungs, Stomach & Kidneys"
        sourceAnchor={sampleAnchor}
      />
    );

    expect(screen.getByText(/EKAGURU Education Engine/i)).toBeInTheDocument();
    expect(screen.getByText(/Meet the Idea/i)).toBeInTheDocument();
    expect(screen.getByText(/Which internal organ is responsible for pumping blood/i)).toBeInTheDocument();
    expect(screen.getByText('🌱 Your Understanding')).toBeInTheDocument();
  });

  it('allows toggling between Learner Experience, Knowledge Universe, and Teacher/Studio Inspector', () => {
    render(
      <LearningExplanationPanel
        sectionId="sec-2-10"
        sectionTitle="2.10 Heart, Lungs, Stomach & Kidneys"
        sourceAnchor={sampleAnchor}
      />
    );

    // Click Studio toggle
    const studioBtn = screen.getByRole('button', { name: /Studio/i });
    fireEvent.click(studioBtn);

    expect(screen.getByText(/Pedagogical Reason:/i)).toBeInTheDocument();
    expect(screen.getByText(/NORMAL_CHAPTER/i)).toBeInTheDocument();

    // Click Universe toggle
    const universeBtn = screen.getByRole('button', { name: /Universe/i });
    fireEvent.click(universeBtn);

    expect(screen.getByText(/EKAGURU Knowledge Universe/i)).toBeInTheDocument();
  });

  it('handles empathetic misconception remediation with visual organ contrast', () => {
    render(
      <LearningExplanationPanel
        sectionId="sec-2-10"
        sectionTitle="2.10 Heart, Lungs, Stomach & Kidneys"
        sourceAnchor={sampleAnchor}
      />
    );

    // Click Misconception Option: The Lungs
    const lungsOption = screen.getByRole('button', { name: /The Lungs/i });
    fireEvent.click(lungsOption);

    expect(screen.getByText(/💭 Interesting Thinking! Let's Explore This Mix-up/i)).toBeInTheDocument();
    expect(screen.getAllByText(/The Heart/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/The Lungs/i).length).toBeGreaterThan(0);
  });

  it('runs interactive pulse experiment and updates learner understanding', () => {
    render(
      <LearningExplanationPanel
        sectionId="sec-2-10"
        sectionTitle="2.10 Heart, Lungs, Stomach & Kidneys"
        sourceAnchor={sampleAnchor}
      />
    );

    expect(screen.getByText(/Let's Investigate Your Heart!/i)).toBeInTheDocument();

    const submitBtn = screen.getByRole('button', { name: /Record My Experiment Results/i });
    fireEvent.click(submitBtn);

    expect(screen.getByText(/✓ Excellent observational evidence!/i)).toBeInTheDocument();
  });
});
