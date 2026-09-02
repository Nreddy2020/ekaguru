import { Injectable, Logger } from '@nestjs/common';
import { LlmService } from '../ai/llm.service';

export interface Parent {
    id: string;
    email: string;
    name: string;
    consentGiven: boolean;
    consentDate?: Date;
    children: Child[];
}

export interface Child {
    id: string;
    parentId: string;
    name: string;
    age: number;
    progress?: ChildProgress;
}

export interface ChildProgress {
    currentMastery: number;
    fearIndex: number;
    confidence: number;
    streakDays: number;
    lastActive: Date;
}

export interface ConsentRecord {
    parentId: string;
    consented: boolean;
    timestamp: Date;
}

@Injectable()
export class UserService {
    private readonly logger = new Logger(UserService.name);
    private parents = new Map<string, Parent>();
    private children = new Map<string, Child>();
    private childProgress = new Map<string, ChildProgress>();
    private sessions = new Map<string, any[]>();
    private consentRecords = new Map<string, ConsentRecord>();

    constructor(private llmService: LlmService) {
        this.initializeMockData();
    }

    private initializeMockData() {
        const parentId = 'parent-001';
        const defaultParent: Parent = {
            id: parentId,
            email: 'demo@ekaguru.com',
            name: 'Demo Parent',
            consentGiven: true,
            consentDate: new Date('2026-01-15'),
            children: []
        };
        this.parents.set(parentId, defaultParent);
        this.parents.set('parent@example.com', defaultParent);

        const childId = 'child-001';
        this.children.set(childId, {
            id: childId,
            parentId,
            name: 'Arjun',
            age: 10
        });
        defaultParent.children.push(this.children.get(childId)!);

        this.childProgress.set(childId, {
            currentMastery: 45,
            fearIndex: 3.5,
            confidence: 7.2,
            streakDays: 5,
            lastActive: new Date()
        });

        this.sessions.set(childId, [
            { concept: 'Velocity', phase: 'master', status: 'completed', date: '2026-04-10' },
            { concept: 'Acceleration', phase: 'transfer', status: 'completed', date: '2026-04-12' },
            { concept: 'Force', phase: 'explain', status: 'active', date: '2026-04-15' }
        ]);
    }

    async createParent(email: string, name: string): Promise<Parent> {
        const id = `parent_${Date.now()}`;
        const parent: Parent = { id, email, name, consentGiven: false, children: [] };
        this.parents.set(id, parent);
        return parent;
    }

    async getParent(id: string): Promise<Parent | null> {
        return this.parents.get(id) || null;
    }

    async getParentByEmail(email: string): Promise<Parent | null> {
        if (email === 'demo@ekaguru.com' || email === 'parent@example.com' || email === 'admin@ekaguru.com') {
            return this.parents.get('parent-001') || null;
        }
        for (const parent of this.parents.values()) {
            if (parent.email === email) return parent;
        }
        return null;
    }

    async addChild(parentId: string, name: string, age: number): Promise<Child | null> {
        const parent = this.parents.get(parentId);
        if (!parent) return null;

        const id = `child_${Date.now()}`;
        const child: Child = { id, parentId, name, age };
        this.children.set(id, child);
        parent.children.push(child);

        this.childProgress.set(id, {
            currentMastery: 0,
            fearIndex: 5.0,
            confidence: 5.0,
            streakDays: 0,
            lastActive: new Date()
        });

        return child;
    }

    async getChild(id: string): Promise<Child | null> {
        return this.children.get(id) || null;
    }

    async getChildren(parentId: string): Promise<Child[]> {
        const parent = this.parents.get(parentId);
        return parent?.children || [];
    }

    async getChildProgress(childId: string): Promise<ChildProgress | null> {
        return this.childProgress.get(childId) || null;
    }

    async updateChildProgress(childId: string, updates: Partial<ChildProgress>): Promise<ChildProgress | null> {
        const progress = this.childProgress.get(childId);
        if (!progress) return null;

        Object.assign(progress, updates, { lastActive: new Date() });
        return progress;
    }

    async getChildSessions(childId: string): Promise<any[]> {
        return this.sessions.get(childId) || [];
    }

    async recordConsent(parentId: string, consented: boolean): Promise<ConsentRecord> {
        const record: ConsentRecord = {
            parentId,
            consented,
            timestamp: new Date()
        };
        this.consentRecords.set(parentId, record);

        const parent = this.parents.get(parentId);
        if (parent) {
            parent.consentGiven = consented;
            parent.consentDate = consented ? new Date() : undefined;
        }

        return record;
    }

    async getConsentStatus(parentId: string): Promise<ConsentRecord | null> {
        return this.consentRecords.get(parentId) || null;
    }

    async getFearConfidenceTrend(childId: string, days: number = 7): Promise<{ date: string; fearIndex: number; confidence: number }[]> {
        const trend = [];
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            trend.push({
                date: date.toISOString().split('T')[0],
                fearIndex: Math.max(1, 5 - (i * 0.3) + (Math.random() * 0.5)),
                confidence: Math.min(10, 4 + (i * 0.4) + (Math.random() * 0.5))
            });
        }
        return trend;
    }

    async getParentAnalytics(parentId: string): Promise<any> {
        const parent = this.parents.get(parentId);
        if (!parent) return null;

        const childrenData = await Promise.all(
            parent.children.map(async child => {
                const progress = this.childProgress.get(child.id);
                const sessions = this.sessions.get(child.id) || [];
                const trend = await this.getFearConfidenceTrend(child.id);

                return {
                    child: { id: child.id, name: child.name, age: child.age },
                    progress: progress || { currentMastery: 0, fearIndex: 5, confidence: 5, streakDays: 0 },
                    recentSessions: sessions.slice(-5),
                    fearConfidenceTrend: trend
                };
            })
        );

        return {
            parent: { id: parent.id, name: parent.name, email: parent.email },
            children: childrenData,
            consentStatus: parent.consentGiven
        };
    }
}
