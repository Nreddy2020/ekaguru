// API client for EKAGURU.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:20000';

class APIError extends Error {
    constructor(public status: number, message: string) {
        super(message);
        this.name = 'APIError';
    }
}

export interface WeeklyStat {
    day: string;
    fearIndex: number;
    confidence: number;
    topicsCovered: number;
}

export interface Insight {
    id: string;
    type: 'success' | 'struggle' | 'pattern';
    message: string;
    date: string;
    relatedTopic?: string;
}

export interface ParentAnalytics {
    studentId: string;
    currentMastery: number;
    fearReduction: number;
    activeStreak: number;
    weeklyProgress: WeeklyStat[];
    recentInsights: Insight[];
    masteredTopics: string[];
}

async function apiCall<T>(
    endpoint: string,
    options?: RequestInit
): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
        },
    });

    if (!response.ok) {
        throw new APIError(response.status, await response.text());
    }

    return response.json();
}

export const api = {
    // Tutor APIs
    getTopic: (topicId: string) =>
        apiCall(`/tutor/topic/${topicId}`),

    getPersonaExplanation: (topicId: string, persona: string) =>
        apiCall(`/tutor/explain/${topicId}?persona=${persona}`),

    askQuestion: (topicId: string, question: string) =>
        apiCall<{ answer: string; isOutOfScope?: boolean }>(
            '/tutor/ask',
            {
                method: 'POST',
                body: JSON.stringify({ topicId, question }),
            }
        ),

    getLearningGuidance: (topicId: string) =>
        apiCall(`/tutor/guide/${topicId}`),

    getStudentAnalytics: (studentId: string) =>
        apiCall<ParentAnalytics>(`/tutor/analytics/${studentId}`),

    // Subject APIs
    getAllSubjects: () => apiCall<any[]>('/subjects'),

    createSubject: (name: string, category: string) =>
        apiCall('/subjects', {
            method: 'POST',
            body: JSON.stringify({ name, category }),
        }),

    // Book Upload
    uploadBook: async (file: File, onProgress?: (progress: number) => void) => {
        const formData = new FormData();
        formData.append('file', file);

        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();

            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable && onProgress) {
                    onProgress((e.loaded / e.total) * 100);
                }
            });

            xhr.addEventListener('load', () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve(JSON.parse(xhr.responseText));
                } else {
                    reject(new APIError(xhr.status, xhr.responseText));
                }
            });

            xhr.addEventListener('error', () => reject(new Error('Upload failed')));

            xhr.open('POST', `${API_BASE_URL}/upload/book`);
            xhr.send(formData);
        });
    },
};
