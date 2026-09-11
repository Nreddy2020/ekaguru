import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Request,
  Res,
  UseGuards,
} from "@nestjs/common";
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from "class-validator";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { LearningLibraryAuthGuard } from "../learning-library-auth.guard";
import { PageEvidenceService } from "./page-evidence.service";
import { GuruPlannerService, publicGuruPlan } from "./guru-planner.service";
import { GuruModelService } from "./guru-model.service";
import { GuruSessionService, GuruEventInput } from "./guru-session.service";
import { DEPTHS, Depth } from "./guru-plan.schema";
import { GuruUsageService } from "./guru-usage.service";
import { GuruMasteryBridgeService } from "./guru-mastery-bridge.service";
import { GuruGenerationQueueService } from "./guru-generation-queue.service";
import { EVIDENCE_JOB_PREFIX, PageEvidenceQueueService } from "./page-evidence-queue.service";
import { GuruActivityService } from "./guru-activity.service";
import { GuruLearnerContextService } from "./guru-learner-context.service";
import { Query } from "@nestjs/common";

export class GuruPreferencesDto {
  @IsIn(DEPTHS) depth: Depth = "basis";
  @IsString() @Matches(/^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/) language = "en";
  @IsOptional() @IsInt() @Min(4) @Max(120) age?: number;
}
export class StartSessionDto {
  @IsOptional() @IsString() @Matches(/^[A-Za-z0-9_-]{1,120}$/) learnerId?: string;
}
export class GuruEventDto implements GuruEventInput {
  @IsString() @Matches(/^[A-Za-z0-9_-]{8,100}$/) requestId: string;
  @IsInt() @Min(0) revision: number;
  @IsIn(["next", "back", "restart", "answer", "help", "question"])
  kind: GuruEventInput["kind"];
  @IsOptional() @IsString() @MaxLength(6000) answer?: string;
}
@Controller("api/v2")
export class GuruController {
  constructor(
    private readonly evidence: PageEvidenceService,
    private readonly planner: GuruPlannerService,
    private readonly model: GuruModelService,
    private readonly sessions: GuruSessionService,
    private readonly usage: GuruUsageService,
    private readonly bridge: GuruMasteryBridgeService,
    private readonly queue: GuruGenerationQueueService,
    private readonly activity: GuruActivityService,
    private readonly learnerContext: GuruLearnerContextService,
    private readonly evidenceQueue: PageEvidenceQueueService,
  ) {}
  @Get("guru/capabilities") capabilities() {
    return {
      reasoningAvailable: this.model.configured,
      sourceReadingAvailable: true,
      masteryBridge: this.bridge.enabled ? "enabled" : "disabled",
      dailyLimits: {
        lessons: this.usage.lessonLimit,
        queries: this.usage.queryLimit,
      },
    };
  }
  @Get("guru/usage")
  @UseGuards(JwtAuthGuard)
  usageSummary(@Request() req: any) {
    return this.usage.summary(req.user.userId);
  }
  @Post("textbooks/:bookId/pages/:page/lesson")
  @UseGuards(JwtAuthGuard)
  async builtin(
    @Param("bookId") bookId: string,
    @Param("page") page: string,
    @Body() prefs: GuruPreferencesDto,
    @Request() req: any,
    @Res({ passthrough: true }) res: any,
    @Query("regenerate") regenerate?: string,
    @Query("cachedOnly") cachedOnly?: string,
  ) {
    return this.plan(await this.evidence.builtin(bookId, page, { performOcr: false }), prefs, req.user, res, regenerate === "1", cachedOnly === "1");
  }
  @Post("learning-materials/:materialId/pages/:page/lesson")
  @UseGuards(JwtAuthGuard, LearningLibraryAuthGuard)
  async material(
    @Param("materialId") id: string,
    @Param("page") page: string,
    @Body() prefs: GuruPreferencesDto,
    @Request() req: any,
    @Res({ passthrough: true }) res: any,
    @Query("regenerate") regenerate?: string,
    @Query("cachedOnly") cachedOnly?: string,
  ) {
    return this.plan(await this.evidence.material(id, page, { performOcr: false }), prefs, req.user, res, regenerate === "1", cachedOnly === "1");
  }
  /**
   * A cached lesson answers immediately (200). Otherwise the request never waits on the
   * model: a durable job is queued or reused and returned with 202 for the client to poll.
   * With cachedOnly the answer is the cached lesson or 204, and nothing is queued: the client
   * uses it to teach from another depth this page already has while the requested one prepares.
   */
  async plan(source: any, prefs: GuruPreferencesDto, user: any, res: any, regenerate = false, cachedOnly = false) {
    // The page's text has not been read yet: no lesson can exist, so the reading job is what the client waits for.
    if (source.status === "PENDING") {
      if (cachedOnly) {
        res?.status?.(204);
        return undefined;
      }
      const job = await this.evidenceQueue.enqueue(
        { bookId: source.bookId, physicalPage: source.physicalPage, sourceHash: source.sourceHash },
        user,
      );
      res?.status?.(202);
      return { job };
    }
    // A lesson from an earlier teaching blueprint keeps serving until the learner asks to regenerate.
    const cached = await this.planner.cached(source, prefs, !regenerate);
    if (cached) return { ...cached, plan: publicGuruPlan(cached.plan) };
    if (cachedOnly) {
      res?.status?.(204);
      return undefined;
    }
    const job = await this.queue.enqueue(source, prefs, user);
    if (job.status === "DONE") {
      const ready = await this.planner.cached(source, prefs);
      if (ready) return { ...ready, plan: publicGuruPlan(ready.plan) };
    }
    res?.status?.(202);
    return { job };
  }
  /** What Guru knows about an owned learner before a page: prior pages, known concepts, suggested depth. */
  @Get("guru/learners/:learnerId/context")
  @UseGuards(JwtAuthGuard, LearningLibraryAuthGuard)
  learnerContextFor(@Param("learnerId") learnerId: string, @Query("bookId") bookId?: string) {
    return this.learnerContext.forLearner(learnerId, typeof bookId === "string" && /^[A-Za-z0-9_-]{1,120}$/.test(bookId) ? bookId : null);
  }
  /** Parent-facing activity for an owned learner; the guard resolves learnerId ownership. */
  @Get("guru/learners/:learnerId/activity")
  @UseGuards(JwtAuthGuard, LearningLibraryAuthGuard)
  learnerActivity(@Param("learnerId") learnerId: string) {
    return this.activity.forLearner(learnerId);
  }
  @Get("guru/jobs/:id")
  @UseGuards(JwtAuthGuard)
  job(@Param("id") id: string, @Request() req: any) {
    return id.startsWith(EVIDENCE_JOB_PREFIX) ? this.evidenceQueue.status(id, req.user) : this.queue.status(id, req.user);
  }
  @Post("guru/lessons/:artifactId/sessions")
  @UseGuards(JwtAuthGuard)
  start(
    @Param("artifactId") id: string,
    @Body() body: StartSessionDto,
    @Request() req: any,
  ) {
    return this.sessions.start(id, req.user, body?.learnerId);
  }
  @Get("guru/sessions/:id")
  @UseGuards(JwtAuthGuard)
  read(@Param("id") id: string, @Request() req: any) {
    return this.sessions.read(id, req.user);
  }
  @Post("guru/sessions/:id/events")
  @UseGuards(JwtAuthGuard)
  event(
    @Param("id") id: string,
    @Body() input: GuruEventDto,
    @Request() req: any,
  ) {
    return this.sessions.event(id, input, req.user);
  }
}
