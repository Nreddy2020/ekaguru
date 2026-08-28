import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LearningExplanationPanel } from './LearningExplanationPanel';

describe('Module 06.0: Pedagogical Runtime & Knowledge Intelligence Engine', () => {
  const sampleAnchor = {
    sourceId: 'src-0011',
    sequenceIndex: 11,
    printedPage: 10,
    pdfPage: 6,
    side: 'left' as const,
    snippetText: 'The heart pumps blood to the whole body.',
    confidence: 1.0,
  };

  it('renders grounded Knowledge Unit with Archetype and Deterministic Reason', () => {
    render(
      <LearningExplanationPanel
        sectionId="sec-2-10"
        sectionTitle="2.10 Heart, Lungs, Stomach & Kidneys"
        sourceAnchor={sampleAnchor}
      />
    );

    expect(screen.getByText('EKAGURU Pedagogical Runtime')).toBeInTheDocument();
    expect(screen.getByText('NORMAL_CHAPTER')).toBeInTheDocument();
    expect(screen.getByText(/Circulatory System: The Heart as a Pump/i)).toBeInTheDocument();
    expect(screen.getByText(/Why am I seeing this?/i)).toBeInTheDocument();
  });

  it('triggers misconception remediation mode when choosing functional confusion trap', () => {
    render(
      <LearningExplanationPanel
        sectionId="sec-2-10"
        sectionTitle="2.10 Heart, Lungs, Stomach & Kidneys"
        sourceAnchor={sampleAnchor}
      />
    );

    // Initial state: Socratic Step WHAT
    expect(screen.getByText(/Which internal organ is responsible for pumping blood/i)).toBeInTheDocument();

    // Click Misconception Option: The Lungs
    const lungsOption = screen.getByRole('button', { name: /The Lungs/i });
    fireEvent.click(lungsOption);

    // Should switch to Misconception Remediation Mode
    expect(screen.getByText(/Targeted Misconception Remediation/i)).toBeInTheDocument();
    expect(screen.getByText(/Remember: your lungs take in fresh air/i)).toBeInTheDocument();
    expect(screen.getByText(/Verification Challenge:/i)).toBeInTheDocument();
  });

  it('collects empirical hands-on observational evidence (pulse experiment)', () => {
    render(
      <LearningExplanationPanel
        sectionId="sec-2-10"
        sectionTitle="2.10 Heart, Lungs, Stomach & Kidneys"
        sourceAnchor={sampleAnchor}
      />
    );

    expect(screen.getByText('Hands-on Pulse & Heart Rate Experiment')).toBeInTheDocument();

    const submitBtn = screen.getByRole('button', { name: /Submit Observational Evidence/i });
    fireEvent.click(submitBtn);

    expect(screen.getByText(/✓ Excellent observational evidence!/i)).toBeInTheDocument();
  });

  it('displays mathematical mastery scores across Recall, Application, and Reasoning with zero fake verify buttons', () => {
    render(
      <LearningExplanationPanel
        sectionId="sec-2-10"
        sectionTitle="2.10 Heart, Lungs, Stomach & Kidneys"
        sourceAnchor={sampleAnchor}
      />
    );

    expect(screen.getByText('Empirical Mastery Status')).toBeInTheDocument();
    expect(screen.getByText('Recall (≥80%)')).toBeInTheDocument();
    expect(screen.getByText('Application (≥70%)')).toBeInTheDocument();
    expect(screen.getByText('Reasoning (≥70%)')).toBeInTheDocument();

    // Verify there is NO fake "Verify Mastery" button
    expect(screen.queryByRole('button', { name: /^Verify Mastery$/i })).not.toBeInTheDocument();
  });
});
