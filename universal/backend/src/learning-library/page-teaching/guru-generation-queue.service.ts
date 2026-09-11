import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { GuruPlannerService, GuruPreferences } from "./guru-planner.service";
import { GuruUsageService } from "./guru-usage.service";
import { PageEvidenceService } from "./page-evidence.service";
import { DAILY_QUOTA_MESSAGE } from "./guru-model.service";

export type GuruJobStatus = "QUEUED" | "RUNNING" | "DONE" | "FAILED";
export interface GuruJobView {
  id: string;
  status: GuruJobStatus;
  stage: string;
  artifactId: string;
  attempts: number;
  error: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const BUILTIN = ["evs-class-5", "maths-class-5", "science-class-6", "social-class-5"];

/**
 * Durable lesson generation.
 * A request never waits on the model: it either returns a cached lesson or a job.
 * Jobs are claimed with compare-and-swap so several backend processes can share the
 * table; stale RUNNING jobs are re-queued after a restart; attempts are bounded.
 */
@Injectable()
export class GuruGenerationQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(GuruGenerationQueueService.name);
  private timer: NodeJS.Timeout | null = null;
  private running = 0;
  constructor(
    private readonly prisma: PrismaService,
    private readonly planner: GuruPlannerService,
    private readonly evidence: PageEvidenceService,
    private readonly usage: GuruUsageService,
  ) {}

  get concurrency() {
    const raw = Number(process.env.GURU_WORKER_CONCURRENCY);
    return Number.isFinite(raw) && raw >= 0 && raw <= 16 ? Math.floor(raw) : 1;
  }
  get maxAttempts() {
    const raw = Number(process.env.GURU_JOB_MAX_ATTEMPTS);
    return Number.isFinite(raw) && raw >= 1 && raw <= 5 ? Math.floor(raw) : 2;
  }
  get staleMinutes() {
    const raw = Number(process.env.GURU_JOB_STALE_MINUTES);
    return Number.isFinite(raw) && raw >= 1 && raw <= 240 ? Math.floor(raw) : 15;
  }
  get workerEnabled() {
    if (process.env.GURU_WORKER === "disabled") return false;
    return process.env.NODE_ENV !== "test" || process.env.GURU_WORKER === "enabled";
  }

  onModuleInit() {
    if (!this.workerEnabled || this.concurrency === 0) return;
    this.recoverStale().catch((e) => this.logger.warn("Stale job recovery failed: " + e?.message));
    this.timer = setInterval(() => {
      this.tick().catch((e) => this.logger.warn("Worker tick failed: " + e?.message));
    }, 2000);
    this.timer.unref?.();
  }
  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  private view(job: any): GuruJobView {
    return {
      id: job.id,
      status: job.status,
      stage: job.stage,
      artifactId: job.artifactId,
      attempts: job.attempts,
      error: job.error ?? null,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    };
  }

  /** Returns a DONE view when the lesson already exists, an existing live job, or a new queued job. */
  async enqueue(source: any, preferences: GuruPreferences, user: any): Promise<GuruJobView> {
    const artifactId = this.planner.artifactIdFor(source, preferences);
    const existingArtifact = await this.prisma.guruLessonArtifact.findUnique({
      where: { id: artifactId },
      select: { id: true, createdAt: true },
    });
    if (existingArtifact)
      return {
        id: "artifact:" + artifactId,
        status: "DONE",
        stage: "done",
        artifactId,
        attempts: 0,
        error: null,
        createdAt: existingArtifact.createdAt,
        updatedAt: existingArtifact.createdAt,
      };
    const live = await this.prisma.guruLessonJob.findFirst({
      where: { artifactId, status: { in: ["QUEUED", "RUNNING"] } },
      orderBy: { createdAt: "asc" },
    });
    if (live) return this.view(live);
    // Budget is reserved once per new job, not per poll.
    await this.usage.reserve(user?.userId, "lessons");
    const job = await this.prisma.guruLessonJob.create({
      data: {
        artifactId,
        bookId: source.bookId,
        physicalPage: source.physicalPage,
        sourceHash: source.sourceHash,
        depth: preferences.depth,
        language: preferences.language,
        age: preferences.age ?? null,
        requestedBy: user?.userId || "unknown",
      },
    });
    return this.view(job);
  }

  async status(jobId: string, user: any): Promise<GuruJobView> {
    if (jobId.startsWith("artifact:")) {
      const artifact = await this.prisma.guruLessonArtifact.findUnique({
        where: { id: jobId.slice("artifact:".length) },
        select: { id: true, createdAt: true },
      });
      if (!artifact) throw new NotFoundException("Lesson unavailable");
      return {
        id: jobId,
        status: "DONE",
        stage: "done",
        artifactId: artifact.id,
        attempts: 0,
        error: null,
        createdAt: artifact.createdAt,
        updatedAt: artifact.createdAt,
      };
    }
    const job = await this.prisma.guruLessonJob.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException("Job unavailable");
    if (job.requestedBy !== user?.userId && user?.role !== "ADMIN")
      throw new ForbiddenException();
    return this.view(job);
  }

  /** Re-queue RUNNING jobs whose worker died; fail those out of attempts. */
  async recoverStale(): Promise<number> {
    const cutoff = new Date(Date.now() - this.staleMinutes * 60000);
    const stale = await this.prisma.guruLessonJob.findMany({
      where: { status: "RUNNING", startedAt: { lt: cutoff } },
    });
    for (const job of stale) {
      const exhausted = job.attempts >= this.maxAttempts;
      await this.prisma.guruLessonJob.updateMany({
        where: { id: job.id, status: "RUNNING" },
        data: exhausted
          ? { status: "FAILED", stage: "failed", error: "Worker did not finish; attempts exhausted", finishedAt: new Date() }
          : { status: "QUEUED", stage: "queued", error: "Worker did not finish; re-queued" },
      });
    }
    return stale.length;
  }

  /** One scheduler pass: claim up to the free concurrency and run each claimed job. */
  async tick(): Promise<void> {
    while (this.running < this.concurrency) {
      const claimed = await this.claim();
      if (!claimed) return;
      this.running++;
      this.run(claimed)
        .catch((e) => this.logger.error("Job " + claimed.id + " crashed: " + e?.message))
        .finally(() => {
          this.running--;
        });
    }
  }

  /** Compare-and-swap claim: only one process can move a job from QUEUED to RUNNING. */
  async claim(): Promise<any | null> {
    const candidate = await this.prisma.guruLessonJob.findFirst({
      where: { status: "QUEUED" },
      orderBy: { createdAt: "asc" },
    });
    if (!candidate) return null;
    const changed = await this.prisma.guruLessonJob.updateMany({
      where: { id: candidate.id, status: "QUEUED" },
      data: { status: "RUNNING", stage: "starting", startedAt: new Date(), attempts: { increment: 1 }, error: null },
    });
    if (changed.count !== 1) return null;
    return { ...candidate, status: "RUNNING", attempts: candidate.attempts + 1 };
  }

  private async setStage(jobId: string, stage: string) {
    await this.prisma.guruLessonJob.updateMany({ where: { id: jobId, status: "RUNNING" }, data: { stage } });
  }

  async run(job: any): Promise<void> {
    try {
      await this.setStage(job.id, "evidence");
      const source = BUILTIN.includes(job.bookId)
        ? await this.evidence.builtin(job.bookId, String(job.physicalPage))
        : await this.evidence.material(job.bookId, String(job.physicalPage));
      if (source.sourceHash !== job.sourceHash)
        throw Object.assign(new Error("The page source changed since the lesson was requested; open the page again."), { permanent: true });
      const preferences: GuruPreferences = {
        depth: job.depth,
        language: job.language,
        ...(job.age ? { age: job.age } : {}),
      };
      const payload: any = await this.planner.build(source, preferences, undefined, (stage) =>
        this.setStage(job.id, stage).catch(() => {}),
      );
      await this.prisma.$transaction([
        this.prisma.guruLessonJob.updateMany({
          where: { id: job.id, status: "RUNNING" },
          data: { status: "DONE", stage: "done", finishedAt: new Date(), error: null },
        }),
        // Evaluation cases waiting for exactly this lesson are linked without a second generation.
        this.prisma.guruEvaluationCase.updateMany({
          where: { bookId: job.bookId, physicalPage: job.physicalPage, depth: job.depth, language: job.language, artifactId: null },
          data: { artifactId: payload.plan.id, sourceHash: source.sourceHash },
        }),
      ]);
    } catch (error: any) {
      const message = String(error?.message || error).slice(0, 500);
      const permanent =
        error?.permanent === true ||
        message === DAILY_QUOTA_MESSAGE ||
        /Invalid Guru plan|extraction review|malformed|needs extraction review/i.test(message);
      const exhausted = job.attempts >= this.maxAttempts;
      this.logger.warn("Job " + job.id + " attempt " + job.attempts + " failed: " + message);
      await this.prisma.guruLessonJob.updateMany({
        where: { id: job.id, status: "RUNNING" },
        data:
          permanent || exhausted
            ? { status: "FAILED", stage: "failed", error: message, finishedAt: new Date() }
            : { status: "QUEUED", stage: "queued", error: message },
      });
    }
  }
}
