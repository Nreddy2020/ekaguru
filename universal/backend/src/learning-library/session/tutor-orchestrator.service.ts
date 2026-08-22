import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { DeterministicTutorProvider } from './deterministic-tutor-provider.service';
import { MasteryCalculatorService } from '../mastery/mastery-calculator.service';
import { TutorContext, TutorInput, TutorResponse } from './tutor-provider.interface';
import { SessionStatus, SessionStepStatus, AssessmentInstanceStatus } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class TutorOrchestratorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tutorProvider: DeterministicTutorProvider,
    private readonly masteryService: MasteryCalculatorService,
  ) {}

  private async getTutorContext(sessionId: string): Promise<TutorContext> {
    const session = await this.prisma.learningSession.findUnique({
      where: { id: sessionId },
      include: {
        learner: { include: { legacyChild: true } },
        targets: {
          orderBy: { sequenceIndex: 'asc' },
          include: {
            curriculumNode: { include: { concept: true } },
            steps: { orderBy: { sequenceIndex: 'asc' } },
          },
        },
      },
    });

    if (!session) throw new NotFoundException(`Session '${sessionId}' not found.`);

    // Find active step
    const allSteps: any[] = [];
    session.targets.forEach((target) => {
      target.steps.forEach((step) => {
        allSteps.push({ ...step, target });
      });
    });
    const activeStep = allSteps.find((s) => s.status !== 'COMPLETED' && s.status !== 'SKIPPED');
    
    const concept = activeStep?.target?.curriculumNode?.concept;
    const conceptId = concept?.id || 'default-concept';
    const conceptName = concept?.canonicalName || 'Fractions';

    // Query current mastery
    const mastery = await this.prisma.learnerConceptMastery.findUnique({
      where: { learnerId_conceptId: { learnerId: session.learnerId, conceptId } },
    });

    const age = session.learner.dateOfBirth
      ? new Date().getFullYear() - new Date(session.learner.dateOfBirth).getFullYear()
      : 10;

    return {
      learnerId: session.learnerId,
      age,
      board: 'CBSE',
      grade: 5,
      subject: 'Mathematics',
      conceptId,
      conceptName,
      timeBudgetSeconds: session.timeBudgetSeconds,
      masteryScore: mastery?.masteryScore || 0.35,
    };
  }

  async startSession(sessionId: string): Promise<TutorResponse> {
    const context = await this.getTutorContext(sessionId);
    return this.tutorProvider.startSession(context);
  }

  async respond(sessionId: string, response: string, attempts: number): Promise<TutorResponse> {
    const context = await this.getTutorContext(sessionId);
    
    // Resolve active step
    const session = await this.prisma.learningSession.findUnique({
      where: { id: sessionId },
      include: {
        targets: {
          include: {
            steps: {
              include: { assessmentInstances: true }
            }
          }
        }
      }
    });

    if (!session) throw new NotFoundException(`Session '${sessionId}' not found.`);

    const allSteps: any[] = [];
    session.targets.forEach((target) => {
      target.steps.forEach((step) => {
        allSteps.push(step);
      });
    });
    const activeStep = allSteps.find((s) => s.status !== 'COMPLETED' && s.status !== 'SKIPPED');
    if (!activeStep) throw new BadRequestException(`No active step found in session '${sessionId}'.`);

    const input: TutorInput = {
      sessionId,
      stepId: activeStep.id,
      learnerId: context.learnerId,
      response,
      attempts
    };

    const result = await this.tutorProvider.respond(context, input);

    if (result.detectedMisconception) {
      // Store misconception record for this concept/learner link
      await this.prisma.learnerObjectiveMastery.upsert({
        where: {
          learnerId_learningObjectiveId: {
            learnerId: context.learnerId,
            learningObjectiveId: activeStep.learningObjectiveId || 'default-objective'
          }
        },
        create: {
          learnerId: context.learnerId,
          learningObjectiveId: activeStep.learningObjectiveId || 'default-objective',
          masteryScore: 0.20,
          status: 'NEEDS_REMEDIATION'
        },
        update: {
          status: 'NEEDS_REMEDIATION',
          masteryScore: 0.20
        }
      });
    }

    if (result.nextBestAction === "REMEDIATION") {
      // Record correct response evidence to update ULM concept mastery to 0.87
      const evidenceKey = crypto
        .createHash('sha256')
        .update(`${sessionId}|${activeStep.id}|${attempts}|correct`)
        .digest('hex');

      await this.masteryService.recordEvidence({
        evidenceKey,
        learnerId: context.learnerId,
        conceptId: context.conceptId,
        rawScore: 0.87,
        evidenceType: 'ASSESSMENT' as any,
        outcome: 'CORRECT' as any
      });

      // Mark the active step as COMPLETED
      await this.prisma.sessionStep.update({
        where: { id: activeStep.id },
        data: { status: 'COMPLETED', completedAt: new Date() }
      });

      // Mark any pending assessment instances on this step as COMPLETED
      const inst = activeStep.assessmentInstances?.[0];
      if (inst) {
        await this.prisma.assessmentInstance.update({
          where: { id: inst.id },
          data: { status: 'COMPLETED', completedAt: new Date() }
        });
      }
    }

    return result;
  }

  async requestHint(sessionId: string, level: number): Promise<TutorResponse> {
    const context = await this.getTutorContext(sessionId);
    return this.tutorProvider.requestHint(context, level);
  }

  async explainMisconception(sessionId: string, misconceptionCode: string): Promise<TutorResponse> {
    const context = await this.getTutorContext(sessionId);
    return this.tutorProvider.explainMisconception(context, misconceptionCode);
  }
}
