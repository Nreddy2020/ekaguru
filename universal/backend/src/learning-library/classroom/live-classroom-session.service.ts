import { Injectable, Logger, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { MultiTenantSchoolService } from '../tenancy/multi-tenant-school.service';
import { MultiTenantSecurityService, TenantContext } from '../tenancy/multi-tenant-security.service';
import { ConceptMasteryEngineService } from '../personalization/concept-mastery.service';

export type LiveSessionStatus = 'CREATED' | 'LIVE' | 'PAUSED' | 'ENDED';
export type PollStatus = 'DRAFT' | 'OPEN' | 'CLOSED' | 'REVEALED';

export interface ClassroomPoll {
  pollId: string;
  question: string;
  options: string[];
  correctOptionIndex?: number;
  conceptId?: string;
  status: PollStatus;
  responses: Map<string, number>; // studentId -> selectedOptionIndex
  createdAt: string;
}

export interface LiveClassroomSessionRecord {
  sessionId: string;
  districtId: string;
  schoolId: string;
  sectionId: string;
  teacherId: string;
  bookId: string;
  chapterNumber: number;
  status: LiveSessionStatus;
  currentStep: number;
  totalSteps: number;
  currentDepth: string;
  activePoll: ClassroomPoll | null;
  raisedHandsQueue: { studentId: string; studentName: string; raisedAt: string }[];
  spotlightedStudent: { studentId: string; studentName: string; spotlightedAt: string } | null;
  connectedStudents: Set<string>;
  lastServerSequence: number;
  processedIdempotencyKeys: Set<string>;
  createdAt: string;
  startedAt?: string;
  endedAt?: string;
}

export interface LiveClassroomEvent {
  eventId: string;
  eventType: string;
  schemaVersion: string;
  districtId: string;
  schoolId: string;
  sectionId: string;
  sessionId: string;
  actorId: string;
  actorRole: 'TEACHER' | 'STUDENT' | 'SYSTEM' | 'PRINCIPAL' | 'DISTRICT_ADMIN';
  serverSequence: number;
  occurredAt: string;
  idempotencyKey?: string;
  payload: any;
}

@Injectable()
export class LiveClassroomSessionService {
  private readonly logger = new Logger(LiveClassroomSessionService.name);

  private sessions: Map<string, LiveClassroomSessionRecord> = new Map();
  private eventLog: Map<string, LiveClassroomEvent[]> = new Map(); // sessionId -> events

  constructor(
    private readonly schoolService: MultiTenantSchoolService,
    private readonly securityService: MultiTenantSecurityService,
    private readonly masteryEngine: ConceptMasteryEngineService
  ) {}

  // 1. Create Live Session (Teacher Authoritative)
  public createSession(
    context: TenantContext,
    sectionId: string,
    bookId: string,
    chapterNumber: number,
    totalSteps: number = 4
  ): LiveClassroomSessionRecord {
    this.securityService.validateSectionAccess(context, sectionId);
    if (context.role !== 'TEACHER') {
      throw new ForbiddenException('Only authorized teachers can create live classroom sessions');
    }

    const sessionId = `live-session-${sectionId}-${Date.now()}`;
    const session: LiveClassroomSessionRecord = {
      sessionId,
      districtId: context.districtId,
      schoolId: context.schoolId,
      sectionId,
      teacherId: context.callerId,
      bookId,
      chapterNumber,
      status: 'CREATED',
      currentStep: 1,
      totalSteps,
      currentDepth: 'basis',
      activePoll: null,
      raisedHandsQueue: [],
      spotlightedStudent: null,
      connectedStudents: new Set(),
      lastServerSequence: 100,
      processedIdempotencyKeys: new Set(),
      createdAt: new Date().toISOString(),
    };

    this.sessions.set(sessionId, session);
    this.eventLog.set(sessionId, []);

    this.recordEvent(session, context.callerId, 'TEACHER', 'SESSION_CREATED', {
      bookId,
      chapterNumber,
      totalSteps,
    });

    return session;
  }

  // 2. Start / Pause / Resume / End Lifecycle
  public updateSessionStatus(
    context: TenantContext,
    sessionId: string,
    newStatus: LiveSessionStatus,
    idempotencyKey?: string
  ): LiveClassroomSessionRecord {
    const session = this.getValidatedSession(context, sessionId);
    if (context.role !== 'TEACHER' || context.callerId !== session.teacherId) {
      throw new ForbiddenException('Only the session teacher can alter session lifecycle');
    }

    if (idempotencyKey && session.processedIdempotencyKeys.has(idempotencyKey)) {
      return session; // Idempotent return
    }

    // Valid state transitions
    if (newStatus === 'LIVE' && (session.status === 'CREATED' || session.status === 'PAUSED')) {
      session.status = 'LIVE';
      if (!session.startedAt) session.startedAt = new Date().toISOString();
    } else if (newStatus === 'PAUSED' && session.status === 'LIVE') {
      session.status = 'PAUSED';
    } else if (newStatus === 'ENDED' && session.status !== 'ENDED') {
      session.status = 'ENDED';
      session.endedAt = new Date().toISOString();
    } else {
      throw new BadRequestException(`Invalid session transition from ${session.status} to ${newStatus}`);
    }

    if (idempotencyKey) session.processedIdempotencyKeys.add(idempotencyKey);

    const eventType =
      newStatus === 'LIVE'
        ? session.startedAt === session.endedAt ? 'SESSION_RESUMED' : 'SESSION_STARTED'
        : newStatus === 'PAUSED'
        ? 'SESSION_PAUSED'
        : 'SESSION_ENDED';

    this.recordEvent(session, context.callerId, 'TEACHER', eventType, { status: newStatus }, idempotencyKey);
    return session;
  }

  // 3. Step Synchronization (Step 1..4)
  public setStep(
    context: TenantContext,
    sessionId: string,
    targetStep: number,
    idempotencyKey?: string
  ): LiveClassroomSessionRecord {
    const session = this.getValidatedSession(context, sessionId);
    if (context.role !== 'TEACHER' || context.callerId !== session.teacherId) {
      throw new ForbiddenException('Only the session teacher can change classroom steps');
    }
    if (session.status !== 'LIVE') {
      throw new BadRequestException('Cannot change steps when session is not LIVE');
    }

    if (idempotencyKey && session.processedIdempotencyKeys.has(idempotencyKey)) {
      return session;
    }

    if (targetStep < 1 || targetStep > session.totalSteps) {
      throw new BadRequestException(`Step ${targetStep} is out of bounds [1..${session.totalSteps}]`);
    }

    session.currentStep = targetStep;
    if (idempotencyKey) session.processedIdempotencyKeys.add(idempotencyKey);

    this.recordEvent(session, context.callerId, 'TEACHER', 'STEP_CHANGED', { step: targetStep }, idempotencyKey);
    return session;
  }

  // 4. Live Polling (Publish -> Response -> Close -> Reveal)
  public publishPoll(
    context: TenantContext,
    sessionId: string,
    question: string,
    options: string[],
    correctOptionIndex?: number,
    conceptId?: string
  ): ClassroomPoll {
    const session = this.getValidatedSession(context, sessionId);
    if (context.role !== 'TEACHER' || context.callerId !== session.teacherId) {
      throw new ForbiddenException('Only the teacher can publish polls');
    }
    if (session.status !== 'LIVE') {
      throw new BadRequestException('Cannot publish poll in non-LIVE session');
    }

    const poll: ClassroomPoll = {
      pollId: `poll-${Date.now()}`,
      question,
      options,
      correctOptionIndex,
      conceptId,
      status: 'OPEN',
      responses: new Map(),
      createdAt: new Date().toISOString(),
    };

    session.activePoll = poll;
    this.recordEvent(session, context.callerId, 'TEACHER', 'POLL_PUBLISHED', {
      pollId: poll.pollId,
      question,
      options,
      conceptId,
    });

    return poll;
  }

  public recordPollResponse(
    context: TenantContext,
    sessionId: string,
    pollId: string,
    selectedOptionIndex: number,
    idempotencyKey?: string
  ): { recorded: boolean; totalResponses: number } {
    const session = this.getValidatedSession(context, sessionId);
    if (context.role !== 'STUDENT') {
      throw new ForbiddenException('Only enrolled students can submit poll responses');
    }
    if (!session.connectedStudents.has(context.callerId)) {
      throw new ForbiddenException('Student must be joined in the live session to answer');
    }
    if (!session.activePoll || session.activePoll.pollId !== pollId || session.activePoll.status !== 'OPEN') {
      throw new BadRequestException('Poll is not currently open for responses');
    }

    if (idempotencyKey && session.processedIdempotencyKeys.has(idempotencyKey)) {
      return { recorded: true, totalResponses: session.activePoll.responses.size };
    }

    // Record or update response (one vote per student invariant)
    session.activePoll.responses.set(context.callerId, selectedOptionIndex);
    if (idempotencyKey) session.processedIdempotencyKeys.add(idempotencyKey);

    // If poll is linked to an M3.3 concept, update BKT mastery seamlessly!
    if (session.activePoll.conceptId && session.activePoll.correctOptionIndex !== undefined) {
      const isCorrect = selectedOptionIndex === session.activePoll.correctOptionIndex;
      this.masteryEngine.updateConceptMastery(
        context.callerId,
        session.activePoll.conceptId,
        'Classroom Poll Concept',
        isCorrect
      );
    }

    this.recordEvent(
      session,
      context.callerId,
      'STUDENT',
      'POLL_RESPONSE_RECORDED',
      { pollId, selectedOptionIndex },
      idempotencyKey
    );

    return { recorded: true, totalResponses: session.activePoll.responses.size };
  }

  public closePoll(context: TenantContext, sessionId: string): ClassroomPoll {
    const session = this.getValidatedSession(context, sessionId);
    if (context.role !== 'TEACHER' || context.callerId !== session.teacherId) {
      throw new ForbiddenException('Only the teacher can close polls');
    }
    if (!session.activePoll) throw new NotFoundException('No active poll found');

    session.activePoll.status = 'CLOSED';
    this.recordEvent(session, context.callerId, 'TEACHER', 'POLL_CLOSED', { pollId: session.activePoll.pollId });
    return session.activePoll;
  }

  public revealPoll(context: TenantContext, sessionId: string): { distribution: Record<number, number>; totalVotes: number } {
    const session = this.getValidatedSession(context, sessionId);
    if (context.role !== 'TEACHER' || context.callerId !== session.teacherId) {
      throw new ForbiddenException('Only the teacher can reveal poll results');
    }
    if (!session.activePoll) throw new NotFoundException('No active poll found');

    session.activePoll.status = 'REVEALED';

    const distribution: Record<number, number> = {};
    for (let i = 0; i < session.activePoll.options.length; i++) distribution[i] = 0;
    for (const optIdx of session.activePoll.responses.values()) {
      distribution[optIdx] = (distribution[optIdx] || 0) + 1;
    }

    this.recordEvent(session, context.callerId, 'TEACHER', 'POLL_REVEALED', {
      pollId: session.activePoll.pollId,
      distribution,
      totalVotes: session.activePoll.responses.size,
    });

    return { distribution, totalVotes: session.activePoll.responses.size };
  }

  // 5. Hand-Raise & Spotlight
  public raiseHand(context: TenantContext, sessionId: string): boolean {
    const session = this.getValidatedSession(context, sessionId);
    if (context.role !== 'STUDENT') throw new ForbiddenException('Only students can raise hands');

    const student = this.schoolService.getStudent(context.callerId);
    if (!student) throw new NotFoundException('Student profile not found');

    const alreadyRaised = session.raisedHandsQueue.some((h) => h.studentId === context.callerId);
    if (!alreadyRaised) {
      session.raisedHandsQueue.push({
        studentId: context.callerId,
        studentName: student.displayName,
        raisedAt: new Date().toISOString(),
      });
      this.recordEvent(session, context.callerId, 'STUDENT', 'HAND_RAISED', { studentName: student.displayName });
    }
    return true;
  }

  public spotlightStudent(context: TenantContext, sessionId: string, targetStudentId: string): boolean {
    const session = this.getValidatedSession(context, sessionId);
    if (context.role !== 'TEACHER' || context.callerId !== session.teacherId) {
      throw new ForbiddenException('Only the teacher can spotlight students');
    }

    const student = this.schoolService.getStudent(targetStudentId);
    if (!student) throw new NotFoundException('Target student not found');

    session.spotlightedStudent = {
      studentId: targetStudentId,
      studentName: student.displayName,
      spotlightedAt: new Date().toISOString(),
    };

    // Remove from queue
    session.raisedHandsQueue = session.raisedHandsQueue.filter((h) => h.studentId !== targetStudentId);

    this.recordEvent(session, context.callerId, 'TEACHER', 'STUDENT_SPOTLIGHTED', {
      studentId: targetStudentId,
      studentName: student.displayName,
    });

    return true;
  }

  public clearSpotlight(context: TenantContext, sessionId: string): boolean {
    const session = this.getValidatedSession(context, sessionId);
    if (context.role !== 'TEACHER' || context.callerId !== session.teacherId) {
      throw new ForbiddenException('Only the teacher can clear spotlight');
    }

    session.spotlightedStudent = null;
    this.recordEvent(session, context.callerId, 'TEACHER', 'SPOTLIGHT_CLEARED', {});
    return true;
  }

  // 6. Student Presence & Reconnection Snapshot
  public joinSession(context: TenantContext, sessionId: string): LiveClassroomSessionRecord {
    const session = this.getValidatedSession(context, sessionId);
    session.connectedStudents.add(context.callerId);
    this.recordEvent(session, context.callerId, context.role, 'PRESENCE_JOINED', { callerId: context.callerId });
    return session;
  }

  public getSessionSnapshot(context: TenantContext, sessionId: string, lastSeenSequence: number = 0) {
    const session = this.getValidatedSession(context, sessionId);
    const events = this.eventLog.get(sessionId) || [];
    const missedEvents = events.filter((e) => e.serverSequence > lastSeenSequence);

    return {
      session: {
        sessionId: session.sessionId,
        status: session.status,
        currentStep: session.currentStep,
        totalSteps: session.totalSteps,
        currentDepth: session.currentDepth,
        activePoll: session.activePoll
          ? {
              pollId: session.activePoll.pollId,
              question: session.activePoll.question,
              options: session.activePoll.options,
              status: session.activePoll.status,
              totalVotes: session.activePoll.responses.size,
            }
          : null,
        spotlightedStudent: session.spotlightedStudent,
        raisedHandsCount: session.raisedHandsQueue.length,
        connectedStudentsCount: session.connectedStudents.size,
        lastServerSequence: session.lastServerSequence,
      },
      missedEvents,
    };
  }

  // Validation Helper
  public getValidatedSession(context: TenantContext, sessionId: string): LiveClassroomSessionRecord {
    const session = this.sessions.get(sessionId);
    if (!session || session.schoolId !== context.schoolId || session.districtId !== context.districtId) {
      this.logger.warn(`[TENANT VIOLATION] Session '${sessionId}' not found in school '${context.schoolId}'`);
      throw new NotFoundException(`Live session '${sessionId}' not found`);
    }
    return session;
  }

  private recordEvent(
    session: LiveClassroomSessionRecord,
    actorId: string,
    actorRole: 'TEACHER' | 'STUDENT' | 'SYSTEM' | 'PRINCIPAL' | 'DISTRICT_ADMIN',
    eventType: string,
    payload: any,
    idempotencyKey?: string
  ): LiveClassroomEvent {
    session.lastServerSequence++;
    const event: LiveClassroomEvent = {
      eventId: `evt-${session.sessionId}-${session.lastServerSequence}`,
      eventType,
      schemaVersion: '1.0',
      districtId: session.districtId,
      schoolId: session.schoolId,
      sectionId: session.sectionId,
      sessionId: session.sessionId,
      actorId,
      actorRole,
      serverSequence: session.lastServerSequence,
      occurredAt: new Date().toISOString(),
      idempotencyKey,
      payload,
    };

    const log = this.eventLog.get(session.sessionId) || [];
    log.push(event);
    this.eventLog.set(session.sessionId, log);

    return event;
  }
}
