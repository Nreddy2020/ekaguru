import React from 'react';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import LibraryPage from './page';

// Mock Next.js Link component
jest.mock('next/link', () => {
    return ({ children, href }: { children: React.ReactNode, href: string }) => {
        return <a href={href}>{children}</a>;
    };
});

// Mock api-client
const mockGetLearners = jest.fn();
const mockGetLearningMaterials = jest.fn();
const mockGetLearningMaterialStatus = jest.fn();
const mockRetryLearningMaterial = jest.fn();

jest.mock('../../lib/api-client', () => ({
    api: {
        login: jest.fn().mockResolvedValue({ access_token: 'mock-token' }),
        getLearners: () => mockGetLearners(),
        getLearningMaterials: (params: any) => mockGetLearningMaterials(params),
        getLearningMaterialStatus: (id: string) => mockGetLearningMaterialStatus(id),
        retryLearningMaterial: (id: string) => mockRetryLearningMaterial(id),
    }
}));

describe('LibraryPage', () => {
    const mockLearner = { id: 'learner-123', name: 'Arjun', grade: 'Grade 5' };
    const mockMaterials = [
        {
            id: 'mat-1',
            title: 'Science Textbook',
            subjectName: 'Science',
            processingStatus: 'READY',
            chaptersCount: 5,
            topicsCount: 20,
            conceptsCount: 45,
            progress: 100,
        }
    ];

    beforeEach(() => {
        jest.clearAllMocks();
        mockGetLearners.mockResolvedValue({ data: [mockLearner] });
        mockGetLearningMaterials.mockResolvedValue({
            items: mockMaterials,
            pagination: { page: 1, pageSize: 8, totalItems: 1, totalPages: 1 }
        });
    });

    it('renders the header and materials correctly', async () => {
        render(<LibraryPage />);
        
        expect(screen.getByRole('heading', { level: 1, name: 'Library' })).toBeInTheDocument();
        expect(screen.getByText('Your learning materials and resources')).toBeInTheDocument();
        expect(await screen.findByText('Science Textbook')).toBeInTheDocument();
        expect((await screen.findAllByText('Ready'))[0]).toBeInTheDocument();
        expect(await screen.findByText('Chapters')).toBeInTheDocument();
    });
});
