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
        getGuruLearnerActivity: jest.fn().mockResolvedValue({
            learnerId: 'learner-1',
            summary: { sessions: 1, pagesPracticed: 1, checkpointsPassed: 1, assistedCheckpoints: 1, attempts: 2, questionsAsked: 0, masteryRecorded: 0, misconceptions: [{ text: 'Banks give money away for free', count: 1 }] },
            sessions: [{ id: 's1', bookId: 'evs-class-5', physicalPage: 46, title: 'Places in a Neighbourhood', depth: 'basis', language: 'en', startedAt: '2026-09-11T08:00:00Z', lastActivityAt: '2026-09-11T08:09:00Z', progress: { position: 6, total: 17, completed: false }, checkpoints: { passed: 1, assisted: 1, attempts: 2 }, questions: 0, masteryRecorded: 0, events: [{ at: '2026-09-11T08:02:00Z', kind: 'answer', passed: true, confidence: 1, misconception: null, masteryUpdated: false, masteryNote: 'bridge-disabled', response: 'Vegetables and medicines.', feedback: "That's right!" }] }],
            reviews: { due: [{ sessionId: 's1', bookId: 'evs-class-5', physicalPage: 46, title: 'Places in a Neighbourhood', depth: 'basis', stageLabel: 'partial', nextReviewAt: '2026-09-10T08:00:00Z', lastOutcome: 'INDEPENDENT', openPath: '/library/evs-class-5?page=46' }], upcoming: [] },
            explanation: ['Checkpoints passed count only answers the learner gave independently.'],
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

describe('ParentDashboard Guru activity', () => {
    beforeEach(() => {
        window.localStorage.setItem('token', 'mock-parent-token');
        window.localStorage.setItem('user', JSON.stringify({ role: 'PARENT', name: 'Leo' }));
    });
    it('shows evidence-backed Guru activity for the selected learner', async () => {
        render(<ParentDashboard />);
        await screen.findByText('Guru classroom activity');
        expect(await screen.findByTestId('guru-checkpoints-passed-independently')).toHaveTextContent('1');
        expect(screen.getByTestId('guru-assisted-checkpoints')).toHaveTextContent('1');
        expect(screen.getAllByText(/Places in a Neighbourhood · evs-class-5 page 46 · basis/).length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText(/Banks give money away for free/)).toBeInTheDocument();
        expect(screen.getByText(/Recorded as page practice; concept mastery unchanged/)).toBeInTheDocument();
        expect(screen.getByTestId('guru-reviews')).toHaveTextContent('Due now');
        expect(screen.getByRole('link', { name: 'Open page' })).toHaveAttribute('href', '/library/evs-class-5?page=46');
    });
});
