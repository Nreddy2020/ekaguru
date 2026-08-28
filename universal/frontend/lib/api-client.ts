// API client for EKAGURU with OBS-001 Client Trace Propagation
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:20000';

export class APIError extends Error {
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

export type LearningMaterialStage = 'UPLOAD' | 'EXTRACTING' | 'STRUCTURING' | 'KNOWLEDGE_GRAPH' | 'FINALIZING' | 'COMPLETE' | 'FAILED';

export interface LearningMaterial {
    id: string;
    title: string;
    description?: string;
    materialType: 'TEXTBOOK' | 'PDF' | 'IMAGE' | 'NOTE' | 'WORKSHEET' | 'ASSIGNMENT' | 'WEB_RESOURCE' | 'VIDEO';
    status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED' | 'DELETED';
    processingStatus: 'UPLOADED' | 'VALIDATING' | 'STORED' | 'EXTRACTING' | 'STRUCTURING' | 'CONCEPT_MAPPING' | 'INDEXING' | 'READY' | 'FAILED';
    subjectName?: string;
    gradeLevel?: string;
    language?: string;
    originalFileName?: string;
    fileSizeBytes?: number;
    failureReason?: string;
    progress: number;
    stage: LearningMaterialStage;
    chaptersCount?: number;
    topicsCount?: number;
    conceptsCount?: number;
    createdAt: string;
    updatedAt: string;
}

export interface LearningMaterialListResponse {
    items: LearningMaterial[];
    pagination: {
        page: number;
        pageSize: number;
        totalItems: number;
        totalPages: number;
    };
}

// ── OBS-001 Trace Helpers ──────────────────────────────────────────────────
export function generateClientTraceId(): string {
    const ts = Date.now().toString(36);
    const rand = Math.random().toString(16).slice(2, 10);
    return `trc_${ts}_${rand}`;
}

export function generateClientRequestId(): string {
    const ts = Date.now().toString(36);
    const rand = Math.random().toString(16).slice(2, 8);
    return `req_${ts}_${rand}`;
}

export function getClientRoute(): string {
    if (typeof window !== 'undefined' && window.location) {
        return window.location.pathname || '/';
    }
    return '/';
}

/**
 * Sends a lightweight client span asynchronously without blocking application flow.
 */
export async function sendClientSpanSafely(
    traceId: string,
    requestId: string,
    spanName: string,
    endpoint: string,
    status: 'OK' | 'ERROR',
    errorMessage?: string,
): Promise<void> {
    if (typeof window === 'undefined') return;
    try {
        const spanPayload = {
            traceId,
            spans: [
                {
                    spanId: `spn_client_${Date.now().toString(36)}`,
                    traceId,
                    requestId,
                    name: spanName,
                    kind: 'CLIENT' as const,
                    startTimeMs: Date.now(),
                    status,
                    attributes: {
                        endpoint,
                        platform: 'browser',
                        route: getClientRoute(),
                    },
                    errorMessage,
                },
            ],
        };

        fetch(`${API_BASE_URL}/api/v2/observe/client-spans`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(spanPayload),
            keepalive: true,
        }).catch(() => {
            // Fail-safe: ignore reporting errors
        });
    } catch {
        // Fail-safe: never throw from telemetry reporter
    }
}

async function apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const traceId = (options as any)?.traceId || generateClientTraceId();
    const requestId = generateClientRequestId();
    const clientRoute = getClientRoute();

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-trace-id': traceId,
        'x-request-id': requestId,
        'x-client-platform': 'browser',
        'x-client-route': clientRoute,
    };

    if (options.headers) {
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

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers,
        });

        if (!response.ok) {
            const errorText = await response.text();
            sendClientSpanSafely(traceId, requestId, 'Browser.FetchError', endpoint, 'ERROR', `HTTP ${response.status}`);
            throw new APIError(response.status, errorText);
        }

        return response.json();
    } catch (err: any) {
        if (!(err instanceof APIError)) {
            sendClientSpanSafely(traceId, requestId, 'Browser.NetworkFailure', endpoint, 'ERROR', err?.message || 'Network error');
        }
        throw err;
    }
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

    createLearner: (name: string, role = 'CHILD') =>
        apiCall<{ data: any }>('/api/v2/parent/learners', {
            method: 'POST',
            body: JSON.stringify({ name, age: 10, preferredLanguage: 'en' }),
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

    enrollLearner: (learnerId: string, structureVersion: number) =>
        apiCall<{ data: any }>(`/api/v2/parent/learners/${learnerId}/enroll`, {
            method: 'POST',
            body: JSON.stringify({ structureVersion }),
        }),

    getParentLearnerAnalytics: (learnerId: string) =>
        apiCall<{ data: any }>(`/api/v2/parent/learners/${learnerId}/analytics`),

    getParentLearnerMastery: (learnerId: string) =>
        apiCall<{ data: any }>(`/api/v2/parent/learners/${learnerId}/mastery`),

    getLearnerMastery: (learnerId: string) =>
        apiCall<{ data: any }>(`/api/v2/parent/learners/${learnerId}/mastery`),

    getParentLearnerInterventions: (learnerId: string) =>
        apiCall<{ data: any[] }>(`/api/v2/parent/learners/${learnerId}/interventions`),

    getParentLearnerEvidence: (learnerId: string, limit?: number) =>
        apiCall<{ data: any[] }>(`/api/v2/parent/learners/${learnerId}/evidence${limit ? `?limit=${limit}` : ''}`),

    getLearnerWeeklyRetention: (learnerId: string) =>
        apiCall<{ data: any }>(`/api/v2/parent/learners/${learnerId}/retention/weekly`),

    getLearnerFrontier: (learnerId: string) =>
        apiCall<{ data: any }>(`/api/v2/parent/learners/${learnerId}/frontier`),

    getFrontier: (learnerId: string, version = 1) =>
        apiCall<{ data: any }>(`/api/v2/parent/learners/${learnerId}/frontier?version=${version}`),

    getLearnerPrerequisites: (learnerId: string, conceptId: string) =>
        apiCall<{ data: any }>(`/api/v2/parent/learners/${learnerId}/concepts/${conceptId}/prerequisites`),

    // Student & Phase 2.8 Session APIs
    getLearners: () =>
        apiCall<{ data: any[] }>('/api/v2/parent/learners'),

    generateBackbone: (topic: string) =>
        apiCall<{ data: any }>('/api/v2/curriculum/backbone', {
            method: 'POST',
            body: JSON.stringify({ topic }),
        }),

    getCurriculumStructures: () =>
        apiCall<{ data: any[] }>('/api/v2/curriculum/structures'),

    getCurriculumGraph: (structureId: string) =>
        apiCall<{ data: any }>(`/api/v2/curriculum/structures/${structureId}/graph`),

    getLearnerSessions: (learnerId: string) =>
        apiCall<{ data: any[] }>(`/api/v2/sessions?learnerId=${learnerId}`),

    createSession: (learnerId: string, structureId: string | number, timeBudgetSeconds: number) =>
        apiCall<{ data: any }>('/api/v2/sessions', {
            method: 'POST',
            body: JSON.stringify({ learnerId, structureId: String(structureId), timeBudgetSeconds }),
        }),

    getSessionState: (sessionId: string) =>
        apiCall<{ data: any }>(`/api/v2/sessions/${sessionId}`),

    getSession: (sessionId: string) =>
        apiCall<{ data: any }>(`/api/v2/sessions/${sessionId}`),

    startSession: (sessionId: string) =>
        apiCall<{ data: any }>(`/api/v2/sessions/${sessionId}/start`, { method: 'POST' }),

    pauseSession: (sessionId: string) =>
        apiCall<{ data: any }>(`/api/v2/sessions/${sessionId}/pause`, { method: 'POST' }),

    resumeSession: (sessionId: string) =>
        apiCall<{ data: any }>(`/api/v2/sessions/${sessionId}/resume`, { method: 'POST' }),

    completeSession: (sessionId: string) =>
        apiCall<{ data: any }>(`/api/v2/sessions/${sessionId}/complete`, { method: 'POST' }),

    abandonSession: (sessionId: string) =>
        apiCall<{ data: any }>(`/api/v2/sessions/${sessionId}/abandon`, { method: 'POST' }),

    getStepContent: (sessionId: string, stepId: string) =>
        apiCall<{ data: any }>(`/api/v2/sessions/${sessionId}/steps/${stepId}/content`),

    startStep: (sessionId: string, stepId: string) =>
        apiCall<{ data: any }>(`/api/v2/sessions/${sessionId}/steps/${stepId}/start`, {
            method: 'POST',
        }),

    completeStep: (sessionId: string, stepId: string) =>
        apiCall<{ data: any }>(`/api/v2/sessions/${sessionId}/steps/${stepId}/complete`, {
            method: 'POST',
        }),

    skipStep: (sessionId: string, stepId: string) =>
        apiCall<{ data: any }>(`/api/v2/sessions/${sessionId}/steps/${stepId}/skip`, {
            method: 'POST',
        }),

    getAssessmentInstance: (sessionId: string, instanceId: string) =>
        apiCall<{ data: any }>(`/api/v2/sessions/${sessionId}/assessments/${instanceId}`),

    submitAssessmentResponse: (sessionId: string, instanceId: string, responsePayload: any) =>
        apiCall<{ data: any }>(`/api/v2/sessions/${sessionId}/assessments/${instanceId}/respond`, {
            method: 'POST',
            body: JSON.stringify({ responsePayload }),
        }),

    // M4 Runtime Tutor APIs
    startTutorTurn: (sessionId: string) =>
        apiCall<any>(`/api/v2/sessions/${sessionId}/tutor/start`, {
            method: 'POST',
        }),

    respondTutorTurn: (sessionId: string, response: string, turnIndex = 1) =>
        apiCall<any>(`/api/v2/sessions/${sessionId}/tutor/respond`, {
            method: 'POST',
            body: JSON.stringify({ response, turnIndex }),
        }),

    requestTutorHint: (sessionId: string, level = 1) =>
        apiCall<any>(`/api/v2/sessions/${sessionId}/tutor/hint`, {
            method: 'POST',
            body: JSON.stringify({ level }),
        }),

    explainMisconception: (sessionId: string, misconceptionCode: string) =>
        apiCall<any>(`/api/v2/sessions/${sessionId}/tutor/misconception`, {
            method: 'POST',
            body: JSON.stringify({ misconceptionCode }),
        }),

    askQuestion: (topicId: string, question: string) =>
        apiCall<{ answer: string }>('/tutor/ask', {
            method: 'POST',
            body: JSON.stringify({ topicId, question }),
        }),

    getPersonaExplanation: (topicId: string, persona: string) =>
        apiCall<any>(`/tutor/explanation?topicId=${topicId}&persona=${persona}`),

    // Learning Library V2 Material APIs
    getLearningMaterials: (params: {
        learnerId?: string;
        processingStatus?: string;
        search?: string;
        page?: number;
        pageSize?: number;
    } = {}) => {
        const queryParams = new URLSearchParams();
        if (params.learnerId) queryParams.append('learnerId', params.learnerId);
        if (params.processingStatus) queryParams.append('processingStatus', params.processingStatus);
        if (params.search) queryParams.append('search', params.search);
        if (params.page) queryParams.append('page', params.page.toString());
        if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
        return apiCall<LearningMaterialListResponse>(`/api/v2/learning-materials?${queryParams.toString()}`);
    },

    getLearningMaterialStatus: (id: string) =>
        apiCall<{ id: string; status: string; stage: LearningMaterialStage; progress: number; failureReason: string | null }>(`/api/v2/learning-materials/${id}/status`),

    retryLearningMaterial: (id: string) =>
        apiCall<{ data: LearningMaterial }>(`/api/v2/learning-materials/${id}/retry`, {
            method: 'POST',
        }),

    // Subject APIs
    getAllSubjects: () => apiCall<any[]>('/subjects'),

    createSubject: (name: string, category: string) =>
        apiCall('/subjects', {
            method: 'POST',
            body: JSON.stringify({ name, category }),
        }),

    // Learning Material Upload with Trace Headers & M2 Pipeline
    uploadLearningMaterial: async (
        file: File,
        dto: { learnerId: string; title: string; subjectName?: string; gradeLevel?: number; materialType?: string },
        onProgress?: (progress: number) => void,
    ) => {
        const traceId = generateClientTraceId();
        const requestId = generateClientRequestId();
        const clientRoute = getClientRoute();

        const formData = new FormData();
        formData.append('file', file);
        formData.append('learnerId', dto.learnerId);
        formData.append('title', dto.title);
        if (dto.subjectName) formData.append('subjectName', dto.subjectName);
        if (dto.gradeLevel) formData.append('gradeLevel', dto.gradeLevel.toString());
        if (dto.materialType) formData.append('materialType', dto.materialType);

        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable && onProgress) {
                    onProgress(Math.round((e.loaded / e.total) * 100));
                }
            });

            xhr.addEventListener('load', () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve(JSON.parse(xhr.responseText));
                } else {
                    sendClientSpanSafely(traceId, requestId, 'Browser.UploadError', '/api/v2/learning-materials/upload', 'ERROR', `HTTP ${xhr.status}`);
                    reject(new APIError(xhr.status, xhr.responseText));
                }
            });

            xhr.addEventListener('error', () => {
                sendClientSpanSafely(traceId, requestId, 'Browser.UploadNetworkError', '/api/v2/learning-materials/upload', 'ERROR', 'XHR Network Upload Error');
                reject(new Error('Upload failed'));
            });

            xhr.open('POST', `${API_BASE_URL}/api/v2/learning-materials/upload`);
            if (token) {
                xhr.setRequestHeader('Authorization', `Bearer ${token}`);
            }
            xhr.setRequestHeader('x-trace-id', traceId);
            xhr.setRequestHeader('x-request-id', requestId);
            xhr.setRequestHeader('x-client-platform', 'browser');
            xhr.setRequestHeader('x-client-route', clientRoute);
            xhr.send(formData);
        });
    },

    processLearningMaterial: (id: string) =>
        apiCall<{ data: any }>(`/api/v2/learning-materials/${id}/process`, {
            method: 'POST',
        }),
};
