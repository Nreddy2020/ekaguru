import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PedagogicalDepth } from './diagnostic-assessment.service';
import { AdaptivePacingEngineService } from './adaptive-pacing.service';
import { GroundedSocraticTutorService, MisconceptionDiagnosis } from './grounded-socratic-tutor.service';
import { PersonalizedArtifactSelectorService, SelectedArtifactBundle } from './personalized-artifact-selector.service';
import { LearnerProfileService } from './learner-profile.service';
import { ConceptMasteryEngineService } from './concept-mastery.service';
import { TeachingPackageRecord } from '../ai-factory/content-factory.service';
import { CanonicalEvidencePack } from '../knowledge/canonical-evidence-pack.service';

export interface ActiveSessionRecord {
  sessionId: string;
  studentId: string;
  bookId: string;
  chapterNumber: number;
  currentStepIndex: number;
  totalSteps: number;
  currentDepth: PedagogicalDepth;
  consecutiveCorrect: number;
  consecutiveIncorrect: number;
  hintsUsedCount: number;
  activeArtifacts?: SelectedArtifactBundle;
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED';
  interactionHistory: {
    stepIndex: number;
    conceptId: string;
    studentAnswer: string;
    isCorrect: boolean;
    misconception?: MisconceptionDiagnosis;
    depthAtStep: PedagogicalDepth;
    timestamp: string;
  }[];
  startedAt: string;
  updatedAt: string;
}

@Injectable()
export class AdaptiveSessionManagerService {
  private readonly logger = new Logger(AdaptiveSessionManagerService.name);
  private activeSessions: Map<string, ActiveSessionRecord> = new Map();

  constructor(
    private readonly profileService: LearnerProfileService,
    private readonly pacingEngine: AdaptivePacingEngineService,
    private readonly socraticTutor: GroundedSocraticTutorService,
    private readonly artifactSelector: PersonalizedArtifactSelectorService,
    private readonly masteryEngine: ConceptMasteryEngineService
  ) {}

  public startSession(
    studentId: string,
    bookId: string,
    chapterNumber: number,
    initialDepth: PedagogicalDepth = 'developing'
  ): ActiveSessionRecord {
    const sessionId = `session-${studentId}-${bookId}-ch${chapterNumber}-${Date.now()}`;
    const session: ActiveSessionRecord = {
      sessionId,
      studentId,
      bookId,
      chapterNumber,
      currentStepIndex: 1,
      totalSteps: 4,
      currentDepth: initialDepth,
      consecutiveCorrect: 0,
      consecutiveIncorrect: 0,
      hintsUsedCount: 0,
      status: 'ACTIVE',
      interactionHistory: [],
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.activeSessions.set(sessionId, session);
    this.logger.log(`Started learning session ${sessionId} for ${studentId} at depth '${initialDepth}'`);
    return session;
  }

  public processStudentStep(
    sessionId: string,
    conceptId: string,
    conceptName: string,
    studentAnswer: string,
    isCorrect: boolean,
    evidencePack: CanonicalEvidencePack,
    teachingPackage: TeachingPackageRecord,
    usedHint: boolean = false
  ): { session: ActiveSessionRecord; misconception?: MisconceptionDiagnosis } {
    const session = this.activeSessions.get(sessionId);
    if (!session) throw new NotFoundException(`Session ${sessionId} not found`);

    if (usedHint) session.hintsUsedCount++;

    // 1. Misconception Diagnosis
    let misconception: MisconceptionDiagnosis | undefined;
    if (!isCorrect) {
      misconception = this.socraticTutor.diagnoseAnswer(conceptId, studentAnswer, evidencePack);
      session.consecutiveIncorrect++;
      session.consecutiveCorrect = 0;
    } else {
      session.consecutiveCorrect++;
      session.consecutiveIncorrect = 0;
    }

    // 2. Update BKT Concept Mastery
    this.masteryEngine.updateConceptMastery(session.studentId, conceptId, conceptName, isCorrect);

    // 3. Dynamic Depth Pacing
    const pacing = this.pacingEngine.evaluateDepthAdjustment(
      session.currentDepth,
      session.consecutiveCorrect,
      session.consecutiveIncorrect,
      usedHint ? 1 : 0
    );
    session.currentDepth = pacing.newDepth;

    // 4. Select Personalized Artifacts for current step
    const profile = this.profileService.getOrCreateProfile(session.studentId);
    session.activeArtifacts = this.artifactSelector.selectPersonalizedArtifacts(
      teachingPackage,
      profile,
      session.currentDepth
    );

    // Record Step History
    session.interactionHistory.push({
      stepIndex: session.currentStepIndex,
      conceptId,
      studentAnswer,
      isCorrect,
      misconception,
      depthAtStep: session.currentDepth,
      timestamp: new Date().toISOString(),
    });

    if (session.currentStepIndex < session.totalSteps) {
      session.currentStepIndex++;
    } else {
      session.status = 'COMPLETED';
      this.profileService.recordLessonCompleted(session.studentId, `${session.bookId}-ch${session.chapterNumber}`);
    }

    session.updatedAt = new Date().toISOString();
    return { session, misconception };
  }

  public getSession(sessionId: string): ActiveSessionRecord {
    const session = this.activeSessions.get(sessionId);
    if (!session) throw new NotFoundException(`Session ${sessionId} not found`);
    return session;
  }
}
