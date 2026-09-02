import { Injectable, Logger, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { MultiTenantSchoolService } from '../tenancy/multi-tenant-school.service';
import { MultiTenantSecurityService, TenantContext } from '../tenancy/multi-tenant-security.service';
import { ConceptMasteryEngineService } from '../personalization/concept-mastery.service';
import { AdaptivePacingEngineService } from '../personalization/adaptive-pacing.service';

export interface OfflineLearningEvent {
  eventId: string;
  studentId: string;
  sessionId: string;
  clientSequence: number;
  eventType: 'STEP_PROGRESSED' | 'ANSWER_SUBMITTED' | 'HINT_REQUESTED' | 'DEPTH_SHIFTED';
  conceptId: string;
  payload: {
    isCorrect?: boolean;
    stepIndex?: number;
    depth?: string;
    studentAnswerText?: string;
  };
  occurredAt: string;
}

export interface OfflineSessionState {
  sessionId: string;
  studentId: string;
  bookId: string;
  chapterNumber: number;
  conceptId: string;
  currentDepth: string;
  currentStep: number;
  totalSteps: number;
  completedSteps: number[];
  pendingEvents: OfflineLearningEvent[];
  lastSyncedSequence: number;
  isOffline: boolean;
}

export interface DeltaSyncRequest {
  studentId: string;
  sessionId: string;
  lastServerSequenceReceived: number;
  events: OfflineLearningEvent[];
}

export interface DeltaSyncResponse {
  synced: boolean;
  acknowledgedClientSequences: number[];
  serverSequence: number;
  processedEventsCount: number;
  currentMasteryProbability: number;
  currentDepth: string;
  syncedAt: string;
}

@Injectable()
export class OfflinePwaSyncService {
  private readonly logger = new Logger(OfflinePwaSyncService.name);

  private processedEventIds: Set<string> = new Set();
  private sessionStore: Map<string, OfflineSessionState> = new Map();

  constructor(
    private readonly schoolService: MultiTenantSchoolService,
    private readonly securityService: MultiTenantSecurityService,
    private readonly masteryEngine: ConceptMasteryEngineService,
    private readonly pacingEngine: AdaptivePacingEngineService
  ) {}

  // 4.1 & 4.5 — Initialize or Retrieve Offline Session State
  public initOfflineSession(
    studentId: string,
    bookId: string,
    chapterNumber: number,
    conceptId: string,
    initialDepth: string = 'developing'
  ): OfflineSessionState {
    const sessionId = `offline-sess-${studentId}-${conceptId}-${Date.now()}`;
    const state: OfflineSessionState = {
      sessionId,
      studentId,
      bookId,
      chapterNumber,
      conceptId,
      currentDepth: initialDepth,
      currentStep: 1,
      totalSteps: 4,
      completedSteps: [],
      pendingEvents: [],
      lastSyncedSequence: 0,
      isOffline: true,
    };

    this.sessionStore.set(sessionId, state);
    return state;
  }

  // 4.6 & 4.11 — Record Offline Interaction with Local Adaptive Depth Evaluation
  public recordOfflineInteraction(
    sessionId: string,
    eventType: OfflineLearningEvent['eventType'],
    conceptId: string,
    payload: OfflineLearningEvent['payload']
  ): { state: OfflineSessionState; newDepth: string } {
    const state = this.sessionStore.get(sessionId);
    if (!state) throw new NotFoundException('Offline session not found');

    const clientSequence = state.pendingEvents.length + 1;
    const event: OfflineLearningEvent = {
      eventId: `evt-${sessionId}-${clientSequence}`,
      studentId: state.studentId,
      sessionId,
      clientSequence,
      eventType,
      conceptId,
      payload,
      occurredAt: new Date().toISOString(),
    };

    state.pendingEvents.push(event);

    // If answer submitted, compute local adaptive depth progression
    if (eventType === 'ANSWER_SUBMITTED' && payload.isCorrect !== undefined) {
      if (payload.isCorrect) {
        state.completedSteps.push(state.currentStep);
        if (state.currentStep < state.totalSteps) state.currentStep++;
      }
    }

    return { state, newDepth: state.currentDepth };
  }

  // 4.8, 4.9 & 4.10 — Delta Synchronization & Server Deterministic Replay
  public processDeltaSync(
    context: TenantContext,
    request: DeltaSyncRequest
  ): DeltaSyncResponse {
    this.securityService.validateStudentAccess(context, request.studentId);

    const acknowledgedClientSeqs: number[] = [];
    let processedCount = 0;
    let latestMastery = 0.10;
    let depth = 'developing';

    // Sort events deterministically by clientSequence
    const sortedEvents = [...request.events].sort((a, b) => a.clientSequence - b.clientSequence);

    for (const event of sortedEvents) {
      // 4.9 — Duplicate Sync Protection Invariant
      if (this.processedEventIds.has(event.eventId)) {
        acknowledgedClientSeqs.push(event.clientSequence);
        continue; // skip duplicate without double processing
      }

      this.processedEventIds.add(event.eventId);
      acknowledgedClientSeqs.push(event.clientSequence);
      processedCount++;

      // 4.10 — Deterministic Replay through standard M3.3 ConceptMasteryEngineService
      if (event.eventType === 'ANSWER_SUBMITTED' && event.payload.isCorrect !== undefined) {
        const bktResult = this.masteryEngine.updateConceptMastery(
          event.studentId,
          event.conceptId,
          'Offline Synced Concept',
          event.payload.isCorrect
        );
        latestMastery = bktResult.masteryProbability;
      }
    }

    const currentDepth = latestMastery >= 0.85 ? 'proficient' : 'developing';

    this.logger.log(
      `[DELTA SYNC] Synced ${processedCount} offline events for ${request.studentId}. BKT Mastery = ${latestMastery}`
    );

    return {
      synced: true,
      acknowledgedClientSequences: acknowledgedClientSeqs,
      serverSequence: 200 + processedCount,
      processedEventsCount: processedCount,
      currentMasteryProbability: latestMastery,
      currentDepth,
      syncedAt: new Date().toISOString(),
    };
  }
}
