import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  LearningShell,
  LearningHeader,
  LearningBreadcrumbs,
  BreadcrumbItem,
} from './index';

describe('MODULE 02: EKAGURU Header + Breadcrumb (Image 02 Layout)', () => {
  const sampleBreadcrumbs: BreadcrumbItem[] = [
    { label: 'Library', href: '/library' },
    { label: 'CBSE Science Grade 5', href: '/library/mat-1' },
    { label: 'Unit 1: About Me', href: '/library/mat-1?unit=1' },
    { label: 'Chapter 1: I Am Growing Up', href: '/library/mat-1?chapter=1' },
    { label: '1.1 Physical Changes and Growth Milestones', active: true },
  ];

  describe('LearningBreadcrumbs Component', () => {
    it('should render breadcrumbs sequence with chevron separators', () => {
      render(<LearningBreadcrumbs items={sampleBreadcrumbs} />);

      const nav = screen.getByTestId('learning-breadcrumbs');
      expect(nav).toBeInTheDocument();

      // Check all labels
      expect(screen.getByText('Library')).toBeInTheDocument();
      expect(screen.getByText('CBSE Science Grade 5')).toBeInTheDocument();
      expect(screen.getByText('Unit 1: About Me')).toBeInTheDocument();
      expect(screen.getByText('Chapter 1: I Am Growing Up')).toBeInTheDocument();
      expect(screen.getByText('1.1 Physical Changes and Growth Milestones')).toBeInTheDocument();

      // Separators check (4 separators for 5 items)
      const separators = screen.getAllByTestId('breadcrumb-separator');
      expect(separators).toHaveLength(4);

      // Active leaf item
      const current = screen.getByTestId('breadcrumb-current');
      expect(current).toHaveTextContent('1.1 Physical Changes and Growth Milestones');
      expect(current).toHaveAttribute('aria-current', 'page');
    });

    it('should render nothing when items array is empty', () => {
      const { container } = render(<LearningBreadcrumbs items={[]} />);
      expect(container).toBeEmptyDOMElement();
    });
  });

  describe('LearningHeader Component', () => {
    it('should render header with brand, breadcrumbs, status badge, and controls', () => {
      const onToggle = jest.fn();
      const onBack = jest.fn();

      render(
        <LearningHeader
          brandName="EKAGURU"
          breadcrumbs={sampleBreadcrumbs}
          status="READY"
          learnerMode={true}
          onToggleLearnerMode={onToggle}
          onBack={onBack}
          notificationCount={2}
          userProfile={{ name: 'Arjun Kumar', role: 'Student' }}
        />
      );

      // 1. Header container
      expect(screen.getByTestId('learning-header')).toBeInTheDocument();

      // 2. Brand
      expect(screen.getByTestId('header-brand')).toHaveTextContent('EKAGURU');

      // 3. Status badge for READY
      expect(screen.getByTestId('header-status-ready')).toHaveTextContent('Source Verified');

      // 4. Learner mode button
      const learnerToggle = screen.getByTestId('header-learner-mode-toggle');
      expect(learnerToggle).toHaveTextContent('View as Learner');
      fireEvent.click(learnerToggle);
      expect(onToggle).toHaveBeenCalledTimes(1);

      // 5. Back button
      const backBtn = screen.getByTestId('header-back-button');
      fireEvent.click(backBtn);
      expect(onBack).toHaveBeenCalledTimes(1);

      // 6. User Profile Initials
      expect(screen.getByTestId('header-user-avatar')).toHaveTextContent('AR');

      // 7. Notification badge
      expect(screen.getByTestId('notification-badge')).toBeInTheDocument();
    });

    it('should render PROCESSING and FAILED status badges accurately', () => {
      const { rerender } = render(
        <LearningHeader
          breadcrumbs={sampleBreadcrumbs}
          status="PROCESSING"
        />
      );
      expect(screen.getByTestId('header-status-processing')).toHaveTextContent('Processing Truth');

      rerender(
        <LearningHeader
          breadcrumbs={sampleBreadcrumbs}
          status="FAILED"
        />
      );
      expect(screen.getByTestId('header-status-failed')).toHaveTextContent('Verification Failed');
    });

    it('should integrate seamlessly into Module 01 LearningShell', () => {
      render(
        <LearningShell
          header={
            <LearningHeader
              brandName="EKAGURU"
              breadcrumbs={sampleBreadcrumbs}
              status="READY"
            />
          }
        >
          <div data-testid="test-child">Child Content</div>
        </LearningShell>
      );

      expect(screen.getByTestId('learning-shell')).toBeInTheDocument();
      expect(screen.getByTestId('learning-shell-header')).toBeInTheDocument();
      expect(screen.getByTestId('learning-header')).toBeInTheDocument();
      expect(screen.getByTestId('test-child')).toBeInTheDocument();
    });

    it('should contain zero hardcoded textbook subject or curriculum terms', () => {
      const fs = require('fs');
      const headerSource = fs.readFileSync(
        'E:/Ekaguru/universal/frontend/components/learning/LearningHeader.tsx',
        'utf8'
      );
      const breadcrumbsSource = fs.readFileSync(
        'E:/Ekaguru/universal/frontend/components/learning/LearningBreadcrumbs.tsx',
        'utf8'
      );

      // Verify domain agnosticism
      expect(headerSource).not.toContain('Science');
      expect(headerSource).not.toContain('Chapter 2');
      expect(headerSource).not.toContain('Lungs');
      expect(headerSource).not.toContain('Photosynthesis');

      expect(breadcrumbsSource).not.toContain('Science');
      expect(breadcrumbsSource).not.toContain('My Body');
    });
  });
});
