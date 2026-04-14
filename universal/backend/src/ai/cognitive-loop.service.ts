import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';

export interface SessionState {
    sessionId: string;
    studentId: string;
    concept: string;
    currentPhase: 'observe' | 'diagnose' | 'struggle' | 'explain' | 'reflect' | 'transfer' | 'master';
    diagnosis?: string;
    struggleCount: number;
    confidence: number;
    startedAt: Date;
}

@Injectable()
export class CognitiveLoopService {
    private readonly logger = new Logger(CognitiveLoopService.name);
    private httpService: HttpService;
    private orchestratorUrl = process.env.ORCHESTRATOR_URL || 'http://localhost:8001';

    constructor(private httpService: HttpService) { }

    async startSession(studentId: string, concept: string): Promise<SessionState> {
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const state: SessionState = {
            sessionId,
            studentId,
            concept,
            currentPhase: 'observe',
            struggleCount: 0,
            confidence: 0,
            startedAt: new Date()
        };

        this.activeSessions.set(sessionId, state);
        this.logger.log(`Started cognitive session ${sessionId} for student ${studentId}, concept: ${concept}`);

        // Try to call orchestrator
        try {
            const response = await this.callOrchestrator({
                student_id: studentId,
                concept_id: concept,
                current_state: 'unknown'
            });
            this.logger.log(`Orchestrator response: ${JSON.stringify(response)}`);
        } catch (error) {
            this.logger.warn('Orchestrator not available, using in-memory fallback');
        }

        return state;
    }

    private async callOrchestrator(data: any): Promise<any> {
        try {
            const response = await this.httpService.axiosRef.post(
                `${this.orchestratorUrl}/orchestrate`,
                data,
                { timeout: 10000 }
            );
            return response.data;
        } catch (error) {
            this.logger.warn(`Orchestrator call failed: ${error}`);
            throw error;
        }
    }

    async getSession(sessionId: string): Promise<SessionState | null> {
        return this.activeSessions.get(sessionId) || null;
    }

    async processStudentResponse(sessionId: string, response: string): Promise<{ nextPhase: string; content: any }> {
        const session = this.activeSessions.get(sessionId);
        if (!session) {
            throw new Error(`Session ${sessionId} not found`);
        }

        this.logger.log(`Processing response in phase ${session.currentPhase}`);

        // Try orchestrator first
        try {
            const orchResponse = await this.callOrchestrator({
                student_id: session.studentId,
                concept_id: session.concept,
                response: response,
                current_state: session.currentPhase
            });
            
            if (orchResponse && orchResponse.next_state) {
                session.currentPhase = orchResponse.next_state as any;
                return {
                    nextPhase: orchResponse.next_state,
                    content: { phase: orchResponse.next_state, sessionId, agent: orchResponse.next_agent }
                };
            }
        } catch (error) {
            this.logger.warn('Orchestrator unavailable, using fallback transitions');
        }

        // Fallback: Simple transitions
        const transitions: Record<string, string> = {
            'observe': 'diagnose',
            'diagnose': 'struggle',
            'struggle': 'explain',
            'explain': 'reflect',
            'reflect': 'transfer',
            'transfer': 'master'
        };

        const nextPhase = transitions[session.currentPhase] || session.currentPhase;
        session.currentPhase = nextPhase as any;

        if (nextPhase === 'struggle') {
            session.struggleCount++;
        }

        return {
            nextPhase,
            content: { phase: nextPhase, sessionId }
        };
    }

    async endSession(sessionId: string): Promise<void> {
        this.activeSessions.delete(sessionId);
        this.logger.log(`Ended session ${sessionId}`);
    }

    async getActiveSessions(): Promise<SessionState[]> {
        return Array.from(this.activeSessions.values());
    }
}
