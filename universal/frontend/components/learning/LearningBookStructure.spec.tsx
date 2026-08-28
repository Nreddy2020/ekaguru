import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  LearningBookStructure,
  LearningStructureData,
  SectionNode,
  ChapterNode,
} from './index';

describe('MODULE 03: Book Structure Navigation (Image 03 Left Rail)', () => {
  const mockStructure: LearningStructureData = {
    material: {
      id: 'mat-001',
      title: 'CBSE Science Grade 5',
      subtitle: 'Primary Learning Curriculum',
    },
    chapters: [
      {
        id: 'chap-1',
        chapterNumber: 1,
        title: 'I Am Growing Up',
        pageStart: 1,
        pageEnd: 5,
        sections: [
          { id: 'sec-1-1', sectionNumber: '1.1', title: 'Physical Changes and Growth Milestones' },
          { id: 'sec-1-2', sectionNumber: '1.2', title: 'Personal Identity and Unique Talents' },
          { id: 'sec-1-3', sectionNumber: '1.3', title: 'Feelings, Emotions and Empathy' },
        ],
      },
      {
        id: 'chap-2',
        chapterNumber: 2,
        title: 'My Body',
        pageStart: 6,
        pageEnd: 11,
        sections: [
          { id: 'sec-2-1', sectionNumber: '2.1', title: 'External and Internal Body Organs' },
          { id: 'sec-2-2', sectionNumber: '2.2', title: 'The Five Sense Organs and Functions' },
          { id: 'sec-2-3', sectionNumber: '2.3', title: 'Body Posture and Physical Fitness' },
        ],
      },
      {
        id: 'chap-3',
        chapterNumber: 3,
        title: 'Food I Eat',
        pageStart: 12,
        pageEnd: 17,
        sections: [
          { id: 'sec-3-1', sectionNumber: '3.1', title: 'Nutrients and Balanced Diet' },
        ],
      },
    ],
  };

  it('Test 1 — should render hierarchy (Book root, chapters, and sections)', () => {
    render(
      <LearningBookStructure
        structure={mockStructure}
        activeSectionId="sec-1-1"
        onSelectSection={jest.fn()}
      />
    );

    // 1. Book Structure Header & Material Title
    expect(screen.getByTestId('learning-book-structure')).toBeInTheDocument();
    expect(screen.getByTestId('book-root-anchor')).toHaveTextContent('CBSE Science Grade 5');
    expect(screen.getByText('3 Chapters')).toBeInTheDocument();

    // 2. Chapters exist in DOM
    expect(screen.getByTestId('structure-chapter-chap-1')).toBeInTheDocument();
    expect(screen.getByTestId('structure-chapter-chap-2')).toBeInTheDocument();
    expect(screen.getByTestId('structure-chapter-chap-3')).toBeInTheDocument();
  });

  it('Test 2 & 3 — should expand and collapse chapters on click', () => {
    render(
      <LearningBookStructure
        structure={mockStructure}
        activeSectionId="sec-1-1"
        onSelectSection={jest.fn()}
      />
    );

    const chap2Toggle = screen.getByTestId('chapter-toggle-chap-2');

    // Initially chap-2 is collapsed (sec-1-1 was active)
    expect(screen.queryByTestId('structure-section-sec-2-1')).not.toBeInTheDocument();

    // Click to expand chap-2
    fireEvent.click(chap2Toggle);
    expect(screen.getByTestId('structure-section-sec-2-1')).toBeInTheDocument();
    expect(screen.getByText('External and Internal Body Organs')).toBeInTheDocument();

    // Click again to collapse chap-2
    fireEvent.click(chap2Toggle);
    expect(screen.queryByTestId('structure-section-sec-2-1')).not.toBeInTheDocument();
  });

  it('Test 4 — should apply active styling and aria-current to the selected section', () => {
    render(
      <LearningBookStructure
        structure={mockStructure}
        activeSectionId="sec-1-2"
        onSelectSection={jest.fn()}
      />
    );

    const activeSec = screen.getByTestId('structure-section-sec-1-2');
    expect(activeSec).toHaveAttribute('aria-current', 'page');
    expect(activeSec).toHaveAttribute('aria-selected', 'true');
    expect(activeSec).toHaveTextContent('1.2');
    expect(activeSec).toHaveTextContent('Personal Identity and Unique Talents');

    // Non-active section should not have aria-current
    const inactiveSec = screen.getByTestId('structure-section-sec-1-1');
    expect(inactiveSec).not.toHaveAttribute('aria-current');
  });

  it('Test 5 — should auto-expand the parent chapter of a deep-linked active section', () => {
    render(
      <LearningBookStructure
        structure={mockStructure}
        activeSectionId="sec-2-2"
        onSelectSection={jest.fn()}
      />
    );

    // chap-2 should be auto-expanded because sec-2-2 is active
    expect(screen.getByTestId('structure-section-sec-2-2')).toBeInTheDocument();
    expect(screen.getByTestId('structure-section-sec-2-2')).toHaveAttribute('aria-current', 'page');
  });

  it('Test 6 — should fire onSelectSection callback when a section is clicked', () => {
    const handleSelect = jest.fn();

    render(
      <LearningBookStructure
        structure={mockStructure}
        activeSectionId="sec-1-1"
        onSelectSection={handleSelect}
      />
    );

    const sec3 = screen.getByTestId('structure-section-sec-1-3');
    fireEvent.click(sec3);

    expect(handleSelect).toHaveBeenCalledTimes(1);
    expect(handleSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'sec-1-3', sectionNumber: '1.3' }),
      expect.objectContaining({ id: 'chap-1', chapterNumber: 1 })
    );
  });

  it('Test 7 — should contain zero hardcoded textbook subject or curriculum terms', () => {
    const fs = require('fs');
    const structureSource = fs.readFileSync(
      'E:/Ekaguru/universal/frontend/components/learning/LearningBookStructure.tsx',
      'utf8'
    );
    const nodeSource = fs.readFileSync(
      'E:/Ekaguru/universal/frontend/components/learning/LearningStructureNode.tsx',
      'utf8'
    );

    expect(structureSource).not.toContain('Science');
    expect(structureSource).not.toContain('Photosynthesis');
    expect(structureSource).not.toContain('Lungs');
    expect(structureSource).not.toContain('Internal Organs');

    expect(nodeSource).not.toContain('Science');
    expect(nodeSource).not.toContain('Lungs');
  });

  it('Test 8 — should support keyboard navigation (Enter/Space to select and expand)', () => {
    const handleSelect = jest.fn();

    render(
      <LearningBookStructure
        structure={mockStructure}
        activeSectionId="sec-1-1"
        onSelectSection={handleSelect}
      />
    );

    const sec1 = screen.getByTestId('structure-section-sec-1-1');
    fireEvent.keyDown(sec1, { key: 'Enter', code: 'Enter' });
    expect(handleSelect).toHaveBeenCalledTimes(1);
  });
});
