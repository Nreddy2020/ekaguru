import { Injectable, Logger } from '@nestjs/common';

export interface SessionRecording {
    id: string;
    sessionId: string;
    childId: string;
    concept: string;
    events: RecordingEvent[];
    startedAt: Date;
    endedAt?: Date;
    duration?: number;
    masteryScore?: number;
}

export interface RecordingEvent {
    timestamp: number;
    type: 'response' | 'hint' | 'phase_change' | 'struggle' | 'mastery';
    phase: string;
    content: string;
    metadata?: Record<string, any>;
}

@Injectable()
export class SessionRecordingService {
    private readonly logger = new Logger(SessionRecordingService.name);
    private recordings = new Map<string, SessionRecording>();
    private currentSessions = new Map<string, RecordingEvent[]>();

    startRecording(sessionId: string, childId: string, concept: string): SessionRecording {
        const recording: SessionRecording = {
            id: `rec_${Date.now()}`,
            sessionId,
            childId,
            concept,
            events: [],
            startedAt: new Date()
        };
        
        this.recordings.set(sessionId, recording);
        this.currentSessions.set(sessionId, []);
        
        this.logger.log(`Started recording session ${sessionId}`);
        return recording;
    }

    addEvent(sessionId: string, event: Omit<RecordingEvent, 'timestamp'>): void {
        const events = this.currentSessions.get(sessionId);
        if (!events) {
            this.logger.warn(`No active recording for session ${sessionId}`);
            return;
        }

        const recording = this.recordings.get(sessionId);
        events.push({
            ...event,
            timestamp: Date.now(),
            phase: recording?.events.length ? recording.events[recording.events.length - 1].phase : 'observe'
        });
    }

    endRecording(sessionId: string, masteryScore?: number): SessionRecording | null {
        const recording = this.recordings.get(sessionId);
        if (!recording) {
            return null;
        }

        const events = this.currentSessions.get(sessionId);
        recording.events = events || [];
        recording.endedAt = new Date();
        recording.duration = Math.floor((recording.endedAt.getTime() - recording.startedAt.getTime()) / 1000);
        recording.masteryScore = masteryScore;

        this.currentSessions.delete(sessionId);
        this.logger.log(`Ended recording session ${sessionId}, duration: ${recording.duration}s`);

        return recording;
    }

    getRecording(sessionId: string): SessionRecording | null {
        return this.recordings.get(sessionId) || null;
    }

    getRecordingsByChild(childId: string): SessionRecording[] {
        const results: SessionRecording[] = [];
        for (const recording of this.recordings.values()) {
            if (recording.childId === childId) {
                results.push(recording);
            }
        }
        return results.sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
    }

    getRecentRecordings(limit: number = 10): SessionRecording[] {
        return Array.from(this.recordings.values())
            .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
            .slice(0, limit);
    }
}
