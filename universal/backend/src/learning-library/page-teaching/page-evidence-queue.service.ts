import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { BUILTIN_BOOKS, PageEvidenceService } from "./page-evidence.service";

export interface EvidenceJobView {
  id: string;
  status: "QUEUED" | "RUNNING" | "DONE" | "FAILED";
  stage: string;
  artifactId: string;
  attempts: number;
  error: string | null;
  createdAt: Date;
  updatedAt: Date;
  bookId: string;
  physicalPage: number;
}
export interface EvidenceIdentity {
  bookId: string;
  physicalPage: number;
  sourceHash: string;
}
export const EVIDENCE_JOB_PREFIX = "evidence:";

/**
 * Durable first-time page reading.
 * A request that finds no stored text for a page revision returns the scan with status PENDING
 * and a job; this worker runs OCR once per revision and persists the text. Claims use
 * compare-and-swap so several backend processes can share the table; stale RUNNING jobs are
 * re-queued after a restart; attempts are bounded. No provider budget is involved: OCR is local.
 */
@Injectable()
export class PageEvidenceQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PageEvidenceQueueService.name);
  private timer: NodeJS.Timeout | null = null;
  private running = 0;
  constructor(
    private readonly prisma: PrismaService,
    private readonly evidence: PageEvidenceService,
  ) {}

  get concurrency() {
    const raw = Number(process.env.GURU_OCR_WORKER_CONCURRENCY);
    return Number.isFinite(raw) && raw >= 0 && raw <= 8 ? Math.floor(raw) : 1;
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
    this.recoverStale().catch((e) => this.logger.warn("Stale evidence job recovery failed: " + e?.message));
    this.timer = setInterval(() => {
      this.tick().catch((e) => this.logger.warn("Evidence worker tick failed: " + e?.message));
    }, 2000);
    this.timer.unref?.();
  }
  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  private view(job: any): EvidenceJobView {
    return {
      id: EVIDENCE_JOB_PREFIX + job.id,
      status: job.status,
      stage: job.stage,
      artifactId: "",
      attempts: job.attempts,
      error: job.error ?? null,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      bookId: job.bookId,
      physicalPage: job.physicalPage,
    };
  }

  /** A DONE view when the text is already stored, an existing live job, or a new queued job. */
  async enqueue(identity: EvidenceIdentity, user?: any): Promise<EvidenceJobView> {
    const stored = await this.prisma.guruPageEvidence.findUnique({
      where: { bookId_physicalPage_sourceHash: identity },
      select: { id: true, createdAt: true },
    });
    if (stored)
      return {
        id: EVIDENCE_JOB_PREFIX + "stored:" + stored.id,
        status: "DONE",
        stage: "done",
        artifactId: "",
        attempts: 0,
        error: null,
        createdAt: stored.createdAt,
        updatedAt: stored.createdAt,
        bookId: identity.bookId,
        physicalPage: identity.physicalPage,
      };
    const live = await this.prisma.guruEvidenceJob.findFirst({
      where: { ...identity, status: { in: ["QUEUED", "RUNNING"] } },
      orderBy: { createdAt: "asc" },
    });
    if (live) return this.view(live);
    const job = await this.prisma.guruEvidenceJob.create({
      data: { ...identity, requestedBy: user?.userId || "anonymous" },
    });
    return this.view(job);
  }

  /** Readable by the requester, an ADMIN, or anyone when it was requested anonymously (public built-in pages). */
  async status(jobId: string, user: any): Promise<EvidenceJobView> {
    const id = jobId.startsWith(EVIDENCE_JOB_PREFIX) ? jobId.slice(EVIDENCE_JOB_PREFIX.length) : jobId;
    if (id.startsWith("stored:")) {
      const stored = await this.prisma.guruPageEvidence.findUnique({ where: { id: id.slice("stored:".length) } });
      if (!stored) throw new NotFoundException("Page text unavailable");
      return {
        id: EVIDENCE_JOB_PREFIX + id,
        status: "DONE",
        stage: "done",
        artifactId: "",
        attempts: 0,
        error: null,
        createdAt: stored.createdAt,
        updatedAt: stored.createdAt,
        bookId: stored.bookId,
        physicalPage: stored.physicalPage,
      };
    }
    const job = await this.prisma.guruEvidenceJob.findUnique({ where: { id } });
    if (!job) throw new NotFoundException("Job unavailable");
    if (job.requestedBy !== "anonymous" && job.requestedBy !== user?.userId && user?.role !== "ADMIN")
      throw new ForbiddenException();
    return this.view(job);
  }

  async recoverStale(): Promise<number> {
    const cutoff = new Date(Date.now() - this.staleMinutes * 60000);
    const stale = await this.prisma.guruEvidenceJob.findMany({
      where: { status: "RUNNING", startedAt: { lt: cutoff } },
    });
    for (const job of stale) {
      const exhausted = job.attempts >= this.maxAttempts;
      await this.prisma.guruEvidenceJob.updateMany({
        where: { id: job.id, status: "RUNNING" },
        data: exhausted
          ? { status: "FAILED", stage: "failed", error: "Worker did not finish; attempts exhausted", finishedAt: new Date() }
          : { status: "QUEUED", stage: "queued", error: "Worker did not finish; re-queued" },
      });
    }
    return stale.length;
  }

  async tick(): Promise<void> {
    while (this.running < this.concurrency) {
      const claimed = await this.claim();
      if (!claimed) return;
      this.running++;
      this.run(claimed)
        .catch((e) => this.logger.error("Evidence job " + claimed.id + " crashed: " + e?.message))
        .finally(() => {
          this.running--;
        });
    }
  }

  async claim(): Promise<any | null> {
    const candidate = await this.prisma.guruEvidenceJob.findFirst({
      where: { status: "QUEUED" },
      orderBy: { createdAt: "asc" },
    });
    if (!candidate) return null;
    const changed = await this.prisma.guruEvidenceJob.updateMany({
      where: { id: candidate.id, status: "QUEUED" },
      data: { status: "RUNNING", stage: "ocr", startedAt: new Date(), attempts: { increment: 1 }, error: null },
    });
    if (changed.count !== 1) return null;
    return { ...candidate, status: "RUNNING", stage: "ocr", attempts: candidate.attempts + 1 };
  }

  async run(job: any): Promise<void> {
    try {
      const page = String(job.physicalPage);
      const evidence = BUILTIN_BOOKS.includes(job.bookId)
        ? await this.evidence.builtin(job.bookId, page, { performOcr: true })
        : await this.evidence.material(job.bookId, page, { performOcr: true });
      if (evidence.sourceHash !== job.sourceHash)
        throw Object.assign(new Error("The page source changed since reading was requested; open the page again."), { permanent: true });
      if (evidence.status === "PENDING")
        throw new Error("Page reading produced no text; retrying.");
      await this.prisma.guruEvidenceJob.updateMany({
        where: { id: job.id, status: "RUNNING" },
        data: { status: "DONE", stage: "done", finishedAt: new Date(), error: null },
      });
    } catch (error: any) {
      const message = String(error?.message || error).slice(0, 500);
      const permanent = error?.permanent === true || error?.status === 404 || error?.status === 400;
      const exhausted = job.attempts >= this.maxAttempts;
      this.logger.warn("Evidence job " + job.id + " attempt " + job.attempts + " failed: " + message);
      await this.prisma.guruEvidenceJob.updateMany({
        where: { id: job.id, status: "RUNNING" },
        data:
          permanent || exhausted
            ? { status: "FAILED", stage: "failed", error: message, finishedAt: new Date() }
            : { status: "QUEUED", stage: "queued", error: message },
      });
    }
  }
}
