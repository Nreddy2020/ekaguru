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
  ) {
    return this.plan(await this.evidence.builtin(bookId, page), prefs, req.user, res);
  }
  @Post("learning-materials/:materialId/pages/:page/lesson")
  @UseGuards(JwtAuthGuard, LearningLibraryAuthGuard)
  async material(
    @Param("materialId") id: string,
    @Param("page") page: string,
    @Body() prefs: GuruPreferencesDto,
    @Request() req: any,
    @Res({ passthrough: true }) res: any,
  ) {
    return this.plan(await this.evidence.material(id, page), prefs, req.user, res);
  }
  /**
   * A cached lesson answers immediately (200). Otherwise the request never waits on the
   * model: a durable job is queued or reused and returned with 202 for the client to poll.
   */
  private async plan(source: any, prefs: GuruPreferencesDto, user: any, res: any) {
    const cached = await this.planner.cached(source, prefs);
    if (cached) return { ...cached, plan: publicGuruPlan(cached.plan) };
    const job = await this.queue.enqueue(source, prefs, user);
    if (job.status === "DONE") {
      const ready = await this.planner.cached(source, prefs);
      if (ready) return { ...ready, plan: publicGuruPlan(ready.plan) };
    }
    res?.status?.(202);
    return { job };
  }
  @Get("guru/jobs/:id")
  @UseGuards(JwtAuthGuard)
  job(@Param("id") id: string, @Request() req: any) {
    return this.queue.status(id, req.user);
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
