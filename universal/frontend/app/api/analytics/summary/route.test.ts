import { GET } from './route';
import { NextRequest } from 'next/server';
import { NextURL } from 'next/dist/server/web/next-url';

// Mock NextURL
class MockNextURL extends URL {
    constructor(input: string, base?: string | URL) {
        super(input, base);
    }
    get searchParams() {
        return new URLSearchParams(this.search);
    }
}

describe('GET /api/analytics/summary', () => {

    it('should return a 400 error if studentId is not provided', async () => {
        const req = new NextRequest('http://localhost/api/analytics/summary');
        (req as any).nextUrl = new MockNextURL('http://localhost/api/analytics/summary');

        const response = await GET(req);
        const body = await response.json();

        expect(response.status).toBe(400);
        expect(body.error).toEqual('studentId is required');
    });

    it('should return analytics data when studentId is provided', async () => {
        const studentId = 'student-123';
        const req = new NextRequest(`http://localhost/api/analytics/summary?studentId=${studentId}`);
        (req as any).nextUrl = new MockNextURL(`http://localhost/api/analytics/summary?studentId=${studentId}`);

        const response = await GET(req);
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.studentId).toEqual(studentId);
        expect(body).toHaveProperty('currentMastery');
        expect(body).toHaveProperty('fearReduction');
        expect(body).toHaveProperty('weeklyProgress');
        expect(body).toHaveProperty('recentInsights');
    });

    it('should return the correct structure for analytics data', async () => {
        const studentId = 'student-456';
        const req = new NextRequest(`http://localhost/api/analytics/summary?studentId=${studentId}`);
        (req as any).nextUrl = new MockNextURL(`http://localhost/api/analytics/summary?studentId=${studentId}`);
        
        const response = await GET(req);
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body).toEqual(expect.objectContaining({
            studentId: expect.any(String),
            currentMastery: expect.any(Number),
            fearReduction: expect.any(Number),
            activeStreak: expect.any(Number),
            masteredTopics: expect.any(Array),
            weeklyProgress: expect.any(Array),
            recentInsights: expect.any(Array)
        }));
    });
});
