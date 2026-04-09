import { NextRequest, NextResponse } from 'next/server';

// Mock API endpoint for analytics data
// In production, this would connect to the actual TutorService
export async function GET(request: NextRequest) {
    try {
        const studentId = request.nextUrl.searchParams.get('studentId');

        if (!studentId) {
            return NextResponse.json({ error: 'studentId is required' }, { status: 400 });
        }
        
        // In a real implementation, this would call the TutorService
        // For now, we'll return mock data that matches the interface
        
        const analytics = {
            studentId,
            currentMastery: 68,
            fearReduction: 45,
            activeStreak: 4,
            masteredTopics: ["Pods", "ReplicaSets", "Deployments Basics", "Services"],
            weeklyProgress: [
                { day: 'Mon', fearIndex: 8, confidence: 2, topicsCovered: 1 },
                { day: 'Tue', fearIndex: 7, confidence: 3, topicsCovered: 1 },
                { day: 'Wed', fearIndex: 5, confidence: 5, topicsCovered: 2 },
                { day: 'Thu', fearIndex: 3, confidence: 7, topicsCovered: 3 },
                { day: 'Fri', fearIndex: 2, confidence: 8, topicsCovered: 2 },
                { day: 'Sat', fearIndex: 2, confidence: 9, topicsCovered: 1 },
                { day: 'Sun', fearIndex: 1, confidence: 9, topicsCovered: 0 }
            ],
            recentInsights: [
                {
                    id: '1',
                    type: 'struggle' as const,
                    message: 'Struggled with "Service Mesh" concepts initially. Detected hesitation in responses.',
                    date: '2025-01-20T10:30:00Z',
                    relatedTopic: 'Networking'
                },
                {
                    id: '2',
                    type: 'pattern' as const,
                    message: 'Switched to "Kid Mode" explanation. Immediate understanding verified by follow-up quiz.',
                    date: '2025-01-20T10:35:00Z',
                    relatedTopic: 'Networking'
                },
                {
                    id: '3',
                    type: 'success' as const,
                    message: 'Mastered "Pod Lifecycle". Can now explain "CrashLoopBackOff" correctly.',
                    date: '2025-01-21T14:15:00Z',
                    relatedTopic: 'Pods'
                },
                {
                    id: '4',
                    type: 'success' as const,
                    message: 'Completed Kubernetes Architecture module with 95% accuracy.',
                    date: '2025-01-22T09:45:00Z',
                    relatedTopic: 'Architecture'
                }
            ]
        };

        return NextResponse.json(analytics, { status: 200 });
    } catch (error) {
        console.error('Error fetching analytics:', error);
        return NextResponse.json(
            { error: 'Failed to fetch analytics data' }, 
            { status: 500 }
        );
    }
}
