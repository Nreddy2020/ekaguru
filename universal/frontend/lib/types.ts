// TypeScript type definitions for EKAGURU.

export interface Topic {
    id: string;
    subjectId: string;
    title: string;
    content: {
        whatItIs: string;
        whyItExists: string;
        howItWorks: string[];
        keyComponents: string[];
        examples: string[];
    };
}

export interface PersonaExplanation {
    topicId: string;
    persona: 'kid' | 'student' | 'pro' | 'architect' | 'professor';
    explanation: string;
}

export interface TutorResponse {
    answer: string;
    isOutOfScope: boolean;
    relatedTopics?: string[];
}

export interface Subject {
    id: string;
    name: string;
    category: string;
    progress: number;
    phases: Phase[];
}

export interface Phase {
    name: string;
    level: 'beginner' | 'intermediate' | 'advanced';
    modules: Module[];
}

export interface Module {
    title: string;
    topics: string[];
}

export interface Message {
    role: 'user' | 'tutor';
    content: string;
    timestamp: Date;
}

export interface BookUploadResult {
    subjectId: string;
    chaptersCount: number;
    topicsCount: number;
}
