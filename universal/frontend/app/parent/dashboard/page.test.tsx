import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ParentDashboard from './page';

// Mock Next.js Link component
jest.mock('next/link', () => {
    return ({ children, href }: { children: React.ReactNode, href: string }) => {
        return <a href={href}>{children}</a>;
    };
});

describe('ParentDashboard', () => {
    it('should render the main heading', () => {
        render(<ParentDashboard />);
        const heading = screen.getByRole('heading', { name: /Welcome, Leo 🦁/i });
        expect(heading).toBeInTheDocument();
    });

    it('should render the streak and total XP cards', () => {
        render(<ParentDashboard />);
        
        const streakLabel = screen.getByText(/Streak/i);
        const streakValue = screen.getByText(/5 Days/i);
        expect(streakLabel).toBeInTheDocument();
        expect(streakValue).toBeInTheDocument();

        const xpLabel = screen.getByText(/Total XP/i);
        const xpValue = screen.getByText(/1,250/i);
        expect(xpLabel).toBeInTheDocument();
        expect(xpValue).toBeInTheDocument();
    });

    it('should render the current focus section', () => {
        render(<ParentDashboard />);
        const focusHeading = screen.getByRole('heading', { name: /Introduction to AI/i });
        expect(focusHeading).toBeInTheDocument();

        const continueButton = screen.getByRole('link', { name: /Continue Learning/i });
        expect(continueButton).toBeInTheDocument();
        expect(continueButton).toHaveAttribute('href', '/student/session');
    });

    it('should render the "Up Next" section with two items', () => {
        render(<ParentDashboard />);
        const upNextItems = screen.getAllByRole('heading', { level: 4 });
        expect(upNextItems).toHaveLength(2);
        expect(upNextItems[0]).toHaveTextContent('Neural Networks 101');
        expect(upNextItems[1]).toHaveTextContent('Data vs Logic');
    });

    it('should render the quick actions section', () => {
        render(<ParentDashboard />);
        const createSubjectLink = screen.getByRole('link', { name: /Create New Subject/i });
        const adjustDifficultyLink = screen.getByRole('link', { name: /Adjust Difficulty/i });
        const viewReportLink = screen.getByRole('link', { name: /View Full Report/i });

        expect(createSubjectLink).toBeInTheDocument();
        expect(adjustDifficultyLink).toBeInTheDocument();
        expect(viewReportLink).toBeInTheDocument();
    });
});
