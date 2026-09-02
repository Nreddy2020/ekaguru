import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ParentDashboard from './page';

jest.mock('next/link', () => {
    return ({ children, href }: { children: React.ReactNode, href: string }) => {
        return <a href={href}>{children}</a>;
    };
});

jest.mock('../../../lib/api-client', () => ({
    api: {
        getParentProfile: jest.fn().mockResolvedValue({ data: { name: 'Leo 🦁' } }),
        getParentLearners: jest.fn().mockResolvedValue({
            data: [
                {
                    id: 'learner-1',
                    name: 'Arjun',
                    learnerType: 'PRIMARY',
                    curriculumEnrollments: [{ active: true, structure: { version: 1 } }]
                }
            ]
        }),
        getParentLearnerAnalytics: jest.fn().mockResolvedValue({
            data: {
                frontier: [{ conceptId: 'c1', canonicalName: 'Introduction to AI' }],
                mastery: { masteredCount: 10, inProgressCount: 5, needsReviewCount: 2 },
                recentActivity: [],
                attentionSignals: [],
            }
        }),
    }
}));

describe('ParentDashboard', () => {
    beforeEach(() => {
        window.localStorage.setItem('token', 'mock-parent-token');
        window.localStorage.setItem('user', JSON.stringify({ role: 'PARENT', name: 'Leo' }));
    });

    it('should render the main heading with parent name', async () => {
        render(<ParentDashboard />);
        const heading = await screen.findByRole('heading', { name: /Welcome back, Leo 🦁!/i });
        expect(heading).toBeInTheDocument();
    });

    it('should render the child selection card', async () => {
        render(<ParentDashboard />);
        expect(await screen.findByText('Select Child')).toBeInTheDocument();
        expect(await screen.findByText('Arjun')).toBeInTheDocument();
    });

    it('should render the curriculum settings card', async () => {
        render(<ParentDashboard />);
        expect(await screen.findByText('Curriculum Settings')).toBeInTheDocument();
        expect(await screen.findByText('Save Settings')).toBeInTheDocument();
    });

    it('should render the onboard child button', async () => {
        render(<ParentDashboard />);
        expect(await screen.findByText('Onboard Child')).toBeInTheDocument();
    });
});
