import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { SessionStatus, SessionStepStatus } from '@prisma/client';

@Injectable()
export class SessionLifecycleService {
  private readonly logger = new Logger(SessionLifecycleService.name);

  constructor(private readonly prisma: PrismaService) {}

  async startSession(sessionId: string): Promise<any> {
    const session = await this.prisma.learningSession.findUnique({ where: { id: sessionId } });
    if (!session) throw new NotFoundException(`Session '${sessionId}' not found.`);
    if (session.status !== SessionStatus.READY) {
      throw new BadRequestException(`Session '${sessionId}' cannot be started from status '${session.status}'. Expected READY.`);
    }
    return this.prisma.learningSession.update({
      where: { id: sessionId },
      data: { status: SessionStatus.ACTIVE, startedAt: new Date() },
      include: { targets: { orderBy: { sequenceIndex: 'asc' }, include: { steps: { orderBy: { sequenceIndex: 'asc' } } } } },
    });
  }

  async pauseSession(sessionId: string): Promise<any> {
    const session = await this.prisma.learningSession.findUnique({ where: { id: sessionId } });
    if (!session) throw new NotFoundException(`Session '${sessionId}' not found.`);
    if (session.status !== SessionStatus.ACTIVE) {
      throw new BadRequestException(`Session '${sessionId}' cannot be paused from status '${session.status}'. Expected ACTIVE.`);
    }
    return this.prisma.learningSession.update({
      where: { id: sessionId },
      data: { status: SessionStatus.PAUSED, pausedAt: new Date() },
    });
  }

  async resumeSession(sessionId: string): Promise<any> {
    const session = await this.prisma.learningSession.findUnique({ where: { id: sessionId } });
    if (!session) throw new NotFoundException(`Session '${sessionId}' not found.`);
    if (session.status !== SessionStatus.PAUSED) {
      throw new BadRequestException(`Session '${sessionId}' cannot be resumed from status '${session.status}'. Expected PAUSED.`);
    }
    return this.prisma.learningSession.update({
      where: { id: sessionId },
      data: { status: SessionStatus.ACTIVE, pausedAt: null },
    });
  }

  /**
   * Complete and finalize a session atomically.
   * COMPLETING and COMPLETED are internal transient states; FINALIZED is the sole persisted terminal state.
   * Per approved spec: one transaction, COMMIT → FINALIZED or ROLLBACK → previous state.
   * Idempotent: repeated calls on FINALIZED session return the existing record.
   */
  async completeSession(sessionId: string): Promise<any> {
    const session = await this.prisma.learningSession.findUnique({
      where: { id: sessionId },
      include: { sessionEvidences: true },
    });
    if (!session) throw new NotFoundException(`Session '${sessionId}' not found.`);

    // Idempotent: already finalized
    if (session.status === SessionStatus.FINALIZED) {
      this.logger.log(`Session '${sessionId}' already FINALIZED — returning existing record.`);
      return session;
    }

    if (session.status !== SessionStatus.ACTIVE && session.status !== SessionStatus.PAUSED) {
      throw new BadRequestException(
        `Session '${sessionId}' cannot be completed from status '${session.status}'. Expected ACTIVE or PAUSED.`,
      );
    }

    const now = new Date();
    const startedAt = session.startedAt || session.plannedAt;
    const actualDurationSeconds = Math.floor((now.getTime() - startedAt.getTime()) / 1000);

    return this.prisma.$transaction(async (tx) => {
      // Validate all evidence references are present
      const evidenceKeys = session.sessionEvidences.map((e) => e.evidenceKey);
      if (evidenceKeys.length > 0) {
        const validEvidence = await tx.learningEvidence.findMany({
          where: { evidenceKey: { in: evidenceKeys } },
          select: { evidenceKey: true },
        });
        const validKeys = new Set(validEvidence.map((e) => e.evidenceKey));
        const missing = evidenceKeys.filter((k) => !validKeys.has(k!));
        if (missing.length > 0) {
          throw new BadRequestException(`Session has unresolved evidence keys: ${missing.join(', ')}`);
        }
      }

      // Finalize (COMPLETING → COMPLETED → FINALIZED all in one transaction)
      const finalized = await tx.learningSession.update({
        where: { id: sessionId },
        data: {
          status: SessionStatus.FINALIZED,
          completedAt: now,
          finalizedAt: now,
          actualDurationSeconds,
        },
        include: {
          targets: { orderBy: { sequenceIndex: 'asc' }, include: { steps: { orderBy: { sequenceIndex: 'asc' } } } },
          sessionEvidences: true,
        },
      });

      this.logger.log(`Session '${sessionId}' FINALIZED with ${evidenceKeys.length} evidence records.`);
      return finalized;
    });
  }

  async completeStep(sessionId: string, stepId: string): Promise<any> {
    const step = await this.prisma.sessionStep.findFirst({
      where: { id: stepId, sessionId },
    });
    if (!step) throw new NotFoundException(`Step '${stepId}' not found in session '${sessionId}'.`);

    const session = await this.prisma.learningSession.findUnique({ where: { id: sessionId } });
    if (session?.status === SessionStatus.FINALIZED) {
      throw new BadRequestException(`Cannot modify a FINALIZED session.`);
    }

    return this.prisma.sessionStep.update({
      where: { id: stepId },
      data: { status: SessionStepStatus.COMPLETED, completedAt: new Date() },
    });
  }

  async getStepContent(sessionId: string, stepId: string): Promise<any> {
    const step = await this.prisma.sessionStep.findFirst({
      where: { id: stepId, sessionId },
      include: {
        target: { include: { curriculumNode: { include: { concept: { select: { id: true, canonicalName: true } } } } } },
        learningObjective: { select: { id: true, code: true, complexityLevel: true, bloomTaxonomy: true } },
      },
    });

    if (!step) throw new NotFoundException(`Step '${stepId}' not found in session '${sessionId}'.`);

    // Resolve content references for this step's concept — returns references only, never raw source text
    const concept = step.target?.curriculumNode?.concept;
    if (!concept) return { stepId, contentType: 'NO_CONTENT', contentReference: null };

    // Look up the session's learnerId directly
    const parentSession = await this.prisma.learningSession.findUnique({
      where: { id: sessionId },
      select: { learnerId: true },
    });

    // Find associated learning materials via learnerId chain
    const materials = await this.prisma.learningMaterial.findMany({
      where: { learnerId: parentSession?.learnerId ?? '' },
      select: { id: true, title: true, materialType: true },
      take: 5,
    });

    // Return safe reference metadata — NEVER ContentChunk.content or storageKey
    return {
      stepId: step.id,
      stepType: step.stepType,
      contentType: 'CONCEPT_REFERENCE',
      conceptId: concept.id,
      conceptName: concept.canonicalName,
      learningObjective: step.learningObjective
        ? { id: step.learningObjective.id, code: step.learningObjective.code, complexityLevel: step.learningObjective.complexityLevel }
        : null,
      materialReferences: materials.map((m) => ({ materialId: m.id, title: m.title, materialType: m.materialType })),
    };
  }
}
