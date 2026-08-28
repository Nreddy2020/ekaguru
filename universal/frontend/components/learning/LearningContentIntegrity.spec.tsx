import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  LearningContentIntegrity,
  LearningIntegrityItem,
  IntegrityCheck,
  computeOverallIntegrity,
  LearningShell,
  LearningLeftRail,
  LearningBookStructure,
} from './index';

describe('MODULE 04: Content Integrity Panel (Image 04 Layout)', () => {
  const verifiedChecks: IntegrityCheck[] = [
    { id: 'orig-text', label: 'Original text copied from book', status: 'VERIFIED' },
    { id: 'images', label: 'Images from book', status: 'VERIFIED' },
    { id: 'page-num', label: 'Page number verified', status: 'VERIFIED' },
    { id: 'no-dev', label: 'No deviation from source', status: 'VERIFIED' },
  ];

  it('Test 01 — should render all checks as VERIFIED with 100% Truth badge', () => {
    render(<LearningContentIntegrity checks={verifiedChecks} />);

    expect(screen.getByTestId('learning-content-integrity')).toBeInTheDocument();
    expect(screen.getByText('Content Integrity')).toBeInTheDocument();
    expect(screen.getByTestId('overall-badge-verified')).toHaveTextContent('100% Truth');

    const icons = screen.getAllByTestId('integrity-icon-verified');
    expect(icons).toHaveLength(4);

    expect(screen.getByText('Original text copied from book')).toBeInTheDocument();
    expect(screen.getByText('Images from book')).toBeInTheDocument();
    expect(screen.getByText('Page number verified')).toBeInTheDocument();
    expect(screen.getByText('No deviation from source')).toBeInTheDocument();
  });

  it('Test 02 — should deterministically propagate FAILED status when one check fails', () => {
    const checksWithFailure: IntegrityCheck[] = [
      { id: 'orig-text', label: 'Original text copied from book', status: 'VERIFIED' },
      { id: 'images', label: 'Images from book', status: 'FAILED', detail: 'Missing diagram OCR' },
      { id: 'page-num', label: 'Page number verified', status: 'VERIFIED' },
      { id: 'no-dev', label: 'No deviation from source', status: 'VERIFIED' },
    ];

    expect(computeOverallIntegrity(checksWithFailure)).toBe('FAILED');

    render(<LearningContentIntegrity checks={checksWithFailure} />);

    expect(screen.getByTestId('overall-badge-failed')).toHaveTextContent('Failed');
    expect(screen.getByTestId('integrity-icon-failed')).toBeInTheDocument();
    expect(screen.getByText('Missing diagram OCR')).toBeInTheDocument();
  });

  it('Test 03 — should deterministically propagate WARNING/UNKNOWN status', () => {
    const checksWithUnknown: IntegrityCheck[] = [
      { id: 'orig-text', label: 'Original text copied from book', status: 'VERIFIED' },
      { id: 'images', label: 'Images from book', status: 'UNKNOWN' },
      { id: 'page-num', label: 'Page number verified', status: 'VERIFIED' },
    ];

    expect(computeOverallIntegrity(checksWithUnknown)).toBe('UNKNOWN');

    render(<LearningContentIntegrity checks={checksWithUnknown} />);
    expect(screen.getByTestId('overall-badge-warning')).toHaveTextContent('Check Needed');
    expect(screen.getByTestId('integrity-icon-unknown')).toBeInTheDocument();
  });

  it('Test 04 & 05 — should render arbitrary dynamic checks with zero textbook hardcoding', () => {
    const dynamicChecks: IntegrityCheck[] = [
      { id: 'c1', label: 'Cryptographic SHA-256 Hash Matched', status: 'VERIFIED' },
      { id: 'c2', label: 'Zero Hallucination Proof Verified', status: 'VERIFIED' },
    ];

    render(<LearningContentIntegrity checks={dynamicChecks} title="Source Truth Verification" />);

    expect(screen.getByText('Source Truth Verification')).toBeInTheDocument();
    expect(screen.getByText('Cryptographic SHA-256 Hash Matched')).toBeInTheDocument();
    expect(screen.getByText('Zero Hallucination Proof Verified')).toBeInTheDocument();

    const fs = require('fs');
    const integritySource = fs.readFileSync(
      'E:/Ekaguru/universal/frontend/components/learning/LearningContentIntegrity.tsx',
      'utf8'
    );
    const itemSource = fs.readFileSync(
      'E:/Ekaguru/universal/frontend/components/learning/LearningIntegrityItem.tsx',
      'utf8'
    );

    expect(integritySource).not.toContain('Science');
    expect(integritySource).not.toContain('CBSE');
    expect(integritySource).not.toContain('Lungs');
    expect(itemSource).not.toContain('Science');
  });

  it('Test 06 — should provide accessible semantics and status labels', () => {
    render(<LearningContentIntegrity checks={verifiedChecks} />);

    const list = screen.getByTestId('integrity-checks-list');
    expect(list).toHaveAttribute('aria-label', 'Content Integrity Checks');

    const icons = screen.getAllByLabelText('Status: Verified');
    expect(icons).toHaveLength(4);
  });

  it('Test 07 — should integrate cleanly into LearningLeftRail footer alongside BookStructure', () => {
    const mockStructure = {
      material: { id: 'm1', title: 'Mathematics Grade 5' },
      chapters: [{ id: 'ch1', chapterNumber: 1, title: 'Numbers', sections: [] }],
    };

    render(
      <LearningShell
        leftRail={
          <LearningLeftRail footer={<LearningContentIntegrity checks={verifiedChecks} />}>
            <LearningBookStructure
              structure={mockStructure}
              onSelectSection={jest.fn()}
            />
          </LearningLeftRail>
        }
      >
        <div>Main Content</div>
      </LearningShell>
    );

    expect(screen.getByTestId('learning-left-rail')).toBeInTheDocument();
    expect(screen.getByTestId('learning-book-structure')).toBeInTheDocument();
    expect(screen.getByTestId('learning-content-integrity')).toBeInTheDocument();
  });
});
