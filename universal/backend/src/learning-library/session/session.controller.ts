import {
  Controller, Get, Post, Body, Param, Request,
  HttpCode, HttpStatus, NotFoundException, ForbiddenException, BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { SessionPlannerService, CreateSessionDto } from './session-planner.service';
import { SessionLifecycleService } from './session-lifecycle.service';
import { AssessmentEngineService, SubmitResponseDto } from './assessment-engine.service';
import { AssessmentType, ScoringMethod } from '@prisma/client';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { LearningLibraryAuthGuard } from '../learning-library-auth.guard';

import { TutorOrchestratorService } from './tutor-orchestrator.service';

@Controller('api/v2')
@UseGuards(JwtAuthGuard, LearningLibraryAuthGuard)
export class SessionController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly planner: SessionPlannerService,
    private readonly lifecycle: SessionLifecycleService,
    private readonly assessmentEngine: AssessmentEngineService,
    private readonly tutorOrchestrator: TutorOrchestratorService,
  ) {}

  // ── Principal Authorization ────────────────────────────────────────────────

  private async checkPrincipalAccess(req: any, targetLearnerId: string): Promise<void> {
    if (!req.user) throw new ForbiddenException('User context missing');
    const role = req.user.role || 'STUDENT';
    const principalSub = req.user.sub;

    if (role === 'ADMIN') return;

    if (role === 'STUDENT') {
      if (principalSub !== targetLearnerId) {
        throw new ForbiddenException(`Student '${principalSub}' cannot access learner '${targetLearnerId}'.`);
      }
      return;
    }

    if (role === 'PARENT') {
      // DB-based parent-child relationship check (consistent with Phase 2.7 correction)
      const learner = await this.prisma.learner.findFirst({
        where: { id: targetLearnerId, legacyChild: { parentId: principalSub } },
      });
      if (!learner) {
        throw new ForbiddenException(
          `Parent '${principalSub}' is not authorized to access learner '${targetLearnerId}': no verified parent-child link.`,
        );
      }
      return;
    }

    throw new ForbiddenException('Access denied.');
  }

  private async getSessionAndCheckAccess(req: any, sessionId: string): Promise<any> {
    const session = await this.prisma.learningSession.findUnique({ where: { id: sessionId } });
    if (!session) throw new NotFoundException(`Session '${sessionId}' not found.`);
    await this.checkPrincipalAccess(req, session.learnerId);
    return session;
  }

  // ── Session APIs ───────────────────────────────────────────────────────────

  @Post('sessions')
  @HttpCode(HttpStatus.CREATED)
  async createSession(@Body() dto: CreateSessionDto, @Request() req: any) {
    await this.checkPrincipalAccess(req, dto.learnerId);
    const session = await this.planner.createSession(dto);
    return { data: session };
  }

  @Get('sessions/:sessionId')
  async getSession(@Param('sessionId') sessionId: string, @Request() req: any) {
    const session = await this.getSessionAndCheckAccess(req, sessionId);
    const full = await this.prisma.learningSession.findUnique({
      where: { id: sessionId },
      include: {
        targets: {
          orderBy: { sequenceIndex: 'asc' },
          include: {
            curriculumNode: { select: { id: true, sequenceIndex: true, gradeBand: true, concept: { select: { id: true, canonicalName: true } } } },
            steps: { orderBy: { sequenceIndex: 'asc' }, include: { learningObjective: { select: { id: true, code: true, complexityLevel: true } } } },
          },
        },
        sessionEvidences: { select: { evidenceKey: true, createdAt: true } },
      },
    });
    return { data: full };
  }

  @Get('sessions/learner/:learnerId')
  async getLearnerSessions(@Param('learnerId') learnerId: string, @Request() req: any) {
    await this.checkPrincipalAccess(req, learnerId);
    const sessions = await this.prisma.learningSession.findMany({
      where: { learnerId },
      orderBy: { plannedAt: 'desc' },
      select: {
        id: true, status: true, timeBudgetSeconds: true, actualDurationSeconds: true,
        plannedAt: true, startedAt: true, finalizedAt: true,
        _count: { select: { targets: true, sessionEvidences: true } },
      },
    });
    return { data: sessions };
  }

  @Post('sessions/:sessionId/start')
  @HttpCode(HttpStatus.OK)
  async startSession(@Param('sessionId') sessionId: string, @Request() req: any) {
    await this.getSessionAndCheckAccess(req, sessionId);
    const result = await this.lifecycle.startSession(sessionId);
    return { data: result };
  }

  @Post('sessions/:sessionId/pause')
  @HttpCode(HttpStatus.OK)
  async pauseSession(@Param('sessionId') sessionId: string, @Request() req: any) {
    await this.getSessionAndCheckAccess(req, sessionId);
    const result = await this.lifecycle.pauseSession(sessionId);
    return { data: result };
  }

  @Post('sessions/:sessionId/resume')
  @HttpCode(HttpStatus.OK)
  async resumeSession(@Param('sessionId') sessionId: string, @Request() req: any) {
    await this.getSessionAndCheckAccess(req, sessionId);
    const result = await this.lifecycle.resumeSession(sessionId);
    return { data: result };
  }

  @Post('sessions/:sessionId/complete')
  @HttpCode(HttpStatus.OK)
  async completeSession(@Param('sessionId') sessionId: string, @Request() req: any) {
    await this.getSessionAndCheckAccess(req, sessionId);
    const result = await this.lifecycle.completeSession(sessionId);
    return { data: result };
  }

  // ── Step APIs ──────────────────────────────────────────────────────────────

  @Post('sessions/:sessionId/steps/:stepId/complete')
  @HttpCode(HttpStatus.OK)
  async completeStep(
    @Param('sessionId') sessionId: string,
    @Param('stepId') stepId: string,
    @Request() req: any,
  ) {
    await this.getSessionAndCheckAccess(req, sessionId);
    const result = await this.lifecycle.completeStep(sessionId, stepId);
    return { data: result };
  }

  @Get('sessions/:sessionId/steps/:stepId/content')
  async getStepContent(
    @Param('sessionId') sessionId: string,
    @Param('stepId') stepId: string,
    @Request() req: any,
  ) {
    await this.getSessionAndCheckAccess(req, sessionId);
    const result = await this.lifecycle.getStepContent(sessionId, stepId);
    return { data: result };
  }

  // ── Assessment APIs ────────────────────────────────────────────────────────

  @Get('sessions/:sessionId/assessments/:assessmentId')
  async getAssessment(
    @Param('sessionId') sessionId: string,
    @Param('assessmentId') assessmentId: string,
    @Request() req: any,
  ) {
    await this.getSessionAndCheckAccess(req, sessionId);
    const result = await this.assessmentEngine.getAssessmentInstance(sessionId, assessmentId);
    return { data: result };
  }

  @Post('sessions/:sessionId/assessments/:assessmentId/respond')
  @HttpCode(HttpStatus.OK)
  async submitAssessment(
    @Param('sessionId') sessionId: string,
    @Param('assessmentId') assessmentId: string,
    @Body() dto: SubmitResponseDto,
    @Request() req: any,
  ) {
    await this.getSessionAndCheckAccess(req, sessionId);

    // Reject any client-supplied mastery fields
    const body = dto as any;
    if (body.rawScore !== undefined || body.masteryScore !== undefined || body.status !== undefined || body.confidence !== undefined) {
      throw new BadRequestException('Client-supplied rawScore, masteryScore, status, or confidence are not permitted. Server computes all mastery fields.');
    }

    const result = await this.assessmentEngine.submitResponse(sessionId, assessmentId, dto);
    return { data: result };
  }

  // ── Assessment Specification APIs (ADMIN only) ─────────────────────────────

  @Post('assessments/specifications')
  @HttpCode(HttpStatus.CREATED)
  async createSpecification(
    @Body() body: {
      learningObjectiveId: string;
      assessmentType: AssessmentType;
      difficulty: number;
      scoringMethod: ScoringMethod;
      passThreshold: number;
      configuration: any;
      version: number;
    },
    @Request() req: any,
  ) {
    if (!req.user || req.user.role !== 'ADMIN') {
      throw new ForbiddenException('Only ADMIN can create AssessmentSpecifications.');
    }

    const objective = await this.prisma.learningObjective.findUnique({ where: { id: body.learningObjectiveId } });
    if (!objective) throw new NotFoundException(`LearningObjective '${body.learningObjectiveId}' not found.`);

    const spec = await this.prisma.assessmentSpecification.create({
      data: {
        learningObjectiveId: body.learningObjectiveId,
        assessmentType: body.assessmentType,
        difficulty: body.difficulty ?? 1,
        scoringMethod: body.scoringMethod ?? ScoringMethod.EXACT_MATCH,
        passThreshold: body.passThreshold ?? 0.75,
        configuration: body.configuration,
        version: body.version ?? 1,
        active: true,
      },
    });

    return { data: spec };
  }

  @Get('assessments/specifications')
  async listSpecifications(@Request() req: any) {
    if (!req.user || req.user.role !== 'ADMIN') {
      throw new ForbiddenException('Only ADMIN can list AssessmentSpecifications.');
    }
    const specs = await this.prisma.assessmentSpecification.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, learningObjectiveId: true, assessmentType: true,
        difficulty: true, scoringMethod: true, passThreshold: true,
        version: true, active: true, createdAt: true,
      },
    });
    return { data: specs };
  }

  @Get('assessments/specifications/:id')
  async getSpecification(@Param('id') id: string, @Request() req: any) {
    if (!req.user || req.user.role !== 'ADMIN') {
      throw new ForbiddenException('Only ADMIN can view AssessmentSpecifications.');
    }
    const spec = await this.prisma.assessmentSpecification.findUnique({ where: { id } });
    if (!spec) throw new NotFoundException(`AssessmentSpecification '${id}' not found.`);
    return { data: spec };
  }

  // ── Socratic Tutor APIs ───────────────────────────────────────────────────

  @Post('sessions/:sessionId/tutor/start')
  @HttpCode(HttpStatus.OK)
  async startTutorSession(@Param('sessionId') sessionId: string, @Request() req: any) {
    await this.getSessionAndCheckAccess(req, sessionId);
    const result = await this.tutorOrchestrator.startSession(sessionId);
    return { data: result };
  }

  @Post('sessions/:sessionId/tutor/respond')
  @HttpCode(HttpStatus.OK)
  async submitTutorResponse(
    @Param('sessionId') sessionId: string,
    @Body() body: { response: string; attempts?: number },
    @Request() req: any,
  ) {
    await this.getSessionAndCheckAccess(req, sessionId);
    const result = await this.tutorOrchestrator.respond(sessionId, body.response, body.attempts ?? 1);
    return { data: result };
  }

  @Post('sessions/:sessionId/tutor/hint')
  @HttpCode(HttpStatus.OK)
  async requestTutorHint(
    @Param('sessionId') sessionId: string,
    @Body() body: { level: number },
    @Request() req: any,
  ) {
    await this.getSessionAndCheckAccess(req, sessionId);
    const result = await this.tutorOrchestrator.requestHint(sessionId, body.level);
    return { data: result };
  }

  @Post('sessions/:sessionId/tutor/misconception')
  @HttpCode(HttpStatus.OK)
  async explainTutorMisconception(
    @Param('sessionId') sessionId: string,
    @Body() body: { misconceptionCode: string },
    @Request() req: any,
  ) {
    await this.getSessionAndCheckAccess(req, sessionId);
    const result = await this.tutorOrchestrator.explainMisconception(sessionId, body.misconceptionCode);
    return { data: result };
  }
}
