import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LearningExplanationPanel } from './LearningExplanationPanel';

describe('Module 06: EKAGURU Pedagogical & Knowledge Construction Engine', () => {
  const sampleAnchor = {
    sourceId: 'src-0004',
    sequenceIndex: 4,
    printedPage: 3,
    pdfPage: 3,
    side: 'right' as const,
    snippetText: 'Plants, animals and human beings are living things...',
    confidence: 0.99,
  };

  it('renders grounded concept with provenance badge and source anchor', () => {
    render(
      <LearningExplanationPanel
        sectionId="sec-1-3"
        sectionTitle="1.3 Living Things and How They Grow"
        description="All living things breathe, need food, and grow."
        sourceAnchor={sampleAnchor}
      />
    );

    expect(screen.getByText('EKAGURU Knowledge Layer')).toBeInTheDocument();
    expect(screen.getByText('Living Things and How They Grow')).toBeInTheDocument();
    expect(screen.getByText('Source-Grounded')).toBeInTheDocument();
    expect(screen.getByText('(p. 3)')).toBeInTheDocument();
  });

  it('switches between 3 levels of progressive depth (Understand, In Simple Words, Deep Dive)', () => {
    render(
      <LearningExplanationPanel
        sectionId="sec-1-3"
        sectionTitle="1.3 Living Things and How They Grow"
        description="All living things breathe, need food, and grow."
        sourceAnchor={sampleAnchor}
      />
    );

    // Initial level: Understand
    expect(screen.getByText(/Understanding Living Things/i)).toBeInTheDocument();

    // Switch to Level 2: In Simple Words
    const simpleWordsBtn = screen.getByRole('button', { name: /2. In Simple Words/i });
    fireEvent.click(simpleWordsBtn);
    expect(screen.getByText(/In Simple Everyday Words/i)).toBeInTheDocument();
    expect(screen.getByText(/tiny seed drinks water/i)).toBeInTheDocument();

    // Switch to Level 3: Deep Dive
    const deepDiveBtn = screen.getByRole('button', { name: /3. Deep Dive/i });
    fireEvent.click(deepDiveBtn);
    expect(screen.getByText(/Deep Dive: Cellular Energy & Life Cycles/i)).toBeInTheDocument();
    expect(screen.getByText(/Mechanism:/i)).toBeInTheDocument();
  });

  it('renders grounded real-world scenarios and cognitive skill practice with instant feedback', () => {
    render(
      <LearningExplanationPanel
        sectionId="sec-1-3"
        sectionTitle="1.3 Living Things and How They Grow"
        description="All living things breathe, need food, and grow."
        sourceAnchor={sampleAnchor}
      />
    );

    // Real-world examples
    expect(screen.getByText('From Seed to Sprout on Your Windowsill')).toBeInTheDocument();
    expect(screen.getByText('Why Your Last Year Shoes Feel Tight')).toBeInTheDocument();

    // Practice Question
    const questionText = screen.getByText(/Rohan puts a wooden ruler and a potted bean plant/i);
    expect(questionText).toBeInTheDocument();

    // Click correct option
    const correctOption = screen.getByText(/Only the bean plant will grow because it is a living organism/i);
    fireEvent.click(correctOption);

    // Check feedback
    expect(screen.getByText(/✓ Well Done!/i)).toBeInTheDocument();
  });

  it('records event-based mastery transitions (seen -> understood -> verified)', () => {
    render(
      <LearningExplanationPanel
        sectionId="sec-1-3"
        sectionTitle="1.3 Living Things and How They Grow"
        description="All living things breathe, need food, and grow."
        sourceAnchor={sampleAnchor}
      />
    );

    const verifyBtn = screen.getByRole('button', { name: /Verify Mastery/i });
    fireEvent.click(verifyBtn);

    expect(screen.getByText('verified')).toHaveClass('text-emerald-300');
  });
});
