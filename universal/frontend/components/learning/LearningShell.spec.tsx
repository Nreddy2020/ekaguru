import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LearningShell, LearningLeftRail, LearningMain, LearningRightRail } from './index';

describe('MODULE 01: Application Learning Shell (Image 01 Layout)', () => {
  it('should render the full three-column learning studio layout with header and footer', () => {
    render(
      <LearningShell
        header={<div data-testid="custom-header">Header Content</div>}
        leftRail={
          <LearningLeftRail footer={<div data-testid="left-footer">Integrity Card</div>}>
            <div data-testid="book-tree">Book Structure Tree</div>
          </LearningLeftRail>
        }
        rightRail={
          <LearningRightRail>
            <div data-testid="evidence-panel">Source Evidence Panel</div>
          </LearningRightRail>
        }
        footer={<div data-testid="custom-footer">Navigation Footer</div>}
      >
        <LearningMain>
          <div data-testid="viewer-area">Original Book Viewer</div>
          <div data-testid="explanation-area">EKAGURU Explanation</div>
        </LearningMain>
      </LearningShell>
    );

    // 1. Shell container exists
    const shell = screen.getByTestId('learning-shell');
    expect(shell).toBeInTheDocument();

    // 2. Header rendered in top slot
    expect(screen.getByTestId('learning-shell-header')).toBeInTheDocument();
    expect(screen.getByTestId('custom-header')).toHaveTextContent('Header Content');

    // 3. Left rail rendered in left slot
    const leftAside = screen.getByTestId('learning-shell-left');
    expect(leftAside).toBeInTheDocument();
    expect(screen.getByTestId('book-tree')).toHaveTextContent('Book Structure Tree');
    expect(screen.getByTestId('left-footer')).toHaveTextContent('Integrity Card');

    // 4. Center main area rendered
    const mainArea = screen.getByTestId('learning-shell-main');
    expect(mainArea).toBeInTheDocument();
    expect(screen.getByTestId('viewer-area')).toHaveTextContent('Original Book Viewer');
    expect(screen.getByTestId('explanation-area')).toHaveTextContent('EKAGURU Explanation');

    // 5. Right rail rendered in right slot
    const rightAside = screen.getByTestId('learning-shell-right');
    expect(rightAside).toBeInTheDocument();
    expect(screen.getByTestId('evidence-panel')).toHaveTextContent('Source Evidence Panel');

    // 6. Footer rendered in bottom slot
    expect(screen.getByTestId('learning-shell-footer')).toBeInTheDocument();
    expect(screen.getByTestId('custom-footer')).toHaveTextContent('Navigation Footer');
  });

  it('should render gracefully when optional rails are omitted', () => {
    render(
      <LearningShell>
        <div data-testid="simple-content">Solo Content</div>
      </LearningShell>
    );

    expect(screen.getByTestId('learning-shell')).toBeInTheDocument();
    expect(screen.getByTestId('learning-shell-main')).toBeInTheDocument();
    expect(screen.queryByTestId('learning-shell-left')).not.toBeInTheDocument();
    expect(screen.queryByTestId('learning-shell-right')).not.toBeInTheDocument();
    expect(screen.queryByTestId('learning-shell-header')).not.toBeInTheDocument();
    expect(screen.queryByTestId('learning-shell-footer')).not.toBeInTheDocument();
  });

  it('should contain zero hardcoded textbook subject or curriculum terms', () => {
    const fs = require('fs');
    const shellSource = fs.readFileSync('E:/Ekaguru/universal/frontend/components/learning/LearningShell.tsx', 'utf8');

    // Verify domain agnosticism
    expect(shellSource).not.toContain('Science');
    expect(shellSource).not.toContain('CBSE');
    expect(shellSource).not.toContain('Chapter 1');
    expect(shellSource).not.toContain('Photosynthesis');
    expect(shellSource).not.toContain('About Me');
  });
});
