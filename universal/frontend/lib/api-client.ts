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
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    if (options?.headers) {
        if (options.headers instanceof Headers) {
            options.headers.forEach((value, key) => {
                headers[key] = value;
            });
        } else if (Array.isArray(options.headers)) {
            options.headers.forEach(([key, value]) => {
                headers[key] = value;
            });
        } else {
            Object.assign(headers, options.headers);
        }
    }

    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        throw new APIError(response.status, await response.text());
    }

    return response.json();
}

export const api = {
    // Auth & V2 APIs
    login: (email: string, password: string) =>
        apiCall<{ access_token: string; user: any }>('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        }),

    // Parent Portal V2 APIs
    getParentProfile: () =>
        apiCall<{ data: any }>('/api/v2/parent/profile'),

    getParentLearners: () =>
        apiCall<{ data: any[] }>('/api/v2/parent/learners'),

    onboardParentLearner: (name: string, age: number, dateOfBirth?: string, preferredLanguage?: string) =>
        apiCall<{ data: any }>('/api/v2/parent/learners', {
            method: 'POST',
            body: JSON.stringify({ name, age, dateOfBirth, preferredLanguage }),
        }),

    updateParentLearner: (learnerId: string, name?: string, preferredLanguage?: string) =>
        apiCall<{ data: any }>(`/api/v2/parent/learners/${learnerId}`, {
            method: 'PATCH',
            body: JSON.stringify({ name, preferredLanguage }),
        }),

    enrollParentLearner: (learnerId: string, structureVersion: number) =>
        apiCall<{ data: any }>(`/api/v2/parent/learners/${learnerId}/enroll`, {
            method: 'POST',
            body: JSON.stringify({ structureVersion }),
        }),

    getParentLearnerAnalytics: (learnerId: string) =>
        apiCall<{ data: any }>(`/api/v2/parent/learners/${learnerId}/analytics`),

    getLearners: () =>
        apiCall<{ data: any[] }>('/api/v2/learners'),

    getLearner: (id: string) =>
        apiCall<{ data: any }>(`/api/v2/learners/${id}`),

    getLearnerMastery: (learnerId: string) =>
        apiCall<{ data: any[] }>(`/api/v2/mastery/learner/${learnerId}`),

    createLearner: (name: string, learnerType: string) =>
        apiCall<{ data: any }>('/api/v2/learners', {
            method: 'POST',
            body: JSON.stringify({ name, learnerType }),
        }),

    generateBackbone: (domain: string) =>
        apiCall<{ data: any }>('/api/v2/curriculum/generate-backbone', {
            method: 'POST',
            body: JSON.stringify({ domain }),
        }),

    enrollLearner: (learnerId: string, structureVersion: number) =>
        apiCall<{ data: any }>('/api/v2/curriculum/enroll', {
            method: 'POST',
            body: JSON.stringify({ learnerId, structureVersion }),
        }),

    createSession: (learnerId: string, structureVersion: number, timeBudgetMinutes: number) =>
        apiCall<any>('/api/v2/sessions', {
            method: 'POST',
            body: JSON.stringify({ learnerId, structureVersion, timeBudgetMinutes }),
        }),

    getLearnerSessions: (learnerId: string) =>
        apiCall<{ data: any[] }>(`/api/v2/sessions/learner/${learnerId}`),

    getSession: (sessionId: string) =>
        apiCall<{ data: any }>(`/api/v2/sessions/${sessionId}`),

    startSession: (sessionId: string) =>
        apiCall<any>(`/api/v2/sessions/${sessionId}/start`, { method: 'POST' }),

    pauseSession: (sessionId: string) =>
        apiCall<any>(`/api/v2/sessions/${sessionId}/pause`, { method: 'POST' }),

    resumeSession: (sessionId: string) =>
        apiCall<any>(`/api/v2/sessions/${sessionId}/resume`, { method: 'POST' }),

    completeSession: (sessionId: string) =>
        apiCall<any>(`/api/v2/sessions/${sessionId}/complete`, { method: 'POST' }),

    getStepContent: (sessionId: string, stepId: string) =>
        apiCall<{ data: any }>(`/api/v2/sessions/${sessionId}/steps/${stepId}/content`),

    completeStep: (sessionId: string, stepId: string) =>
        apiCall<any>(`/api/v2/sessions/${sessionId}/steps/${stepId}/complete`, { method: 'POST' }),

    getAssessmentInstance: (sessionId: string, instanceId: string) =>
        apiCall<{ data: any }>(`/api/v2/sessions/${sessionId}/assessments/${instanceId}`),

    submitAssessmentResponse: (sessionId: string, instanceId: string, response: any) =>
        apiCall<{ data: any }>(`/api/v2/sessions/${sessionId}/assessments/${instanceId}/respond`, {
            method: 'POST',
            body: JSON.stringify({ response }),
        }),

    getFrontier: (learnerId: string, structureVersion: number) =>
        apiCall<{ data: { frontierNodes: any[] } }>(`/api/v2/curriculum/frontier/${learnerId}/${structureVersion}`),

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
