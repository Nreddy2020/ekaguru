/**
 * @jest-environment node
 */
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

        const response = await GET(req);
        const body = await response.json();

        expect(response.status).toBe(400);
        expect(body.error).toEqual('studentId is required');
    });

    it('should return analytics data when studentId is provided', async () => {
        const studentId = 'student-123';
        const req = new NextRequest(`http://localhost/api/analytics/summary?studentId=${studentId}`);

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
        
        const response = await GET(req);
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(typeof body.studentId).toBe('string');
        expect(typeof body.currentMastery).toBe('number');
        expect(typeof body.fearReduction).toBe('number');
        expect(typeof body.activeStreak).toBe('number');
        expect(Array.isArray(body.masteredTopics)).toBe(true);
        expect(Array.isArray(body.weeklyProgress)).toBe(true);
        expect(Array.isArray(body.recentInsights)).toBe(true);
    });
});
