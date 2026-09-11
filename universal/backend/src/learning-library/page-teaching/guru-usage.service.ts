import { HttpException, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma.service";

export type GuruUsageKind = "lessons" | "queries";

/**
 * Per-account daily model usage ledger.
 * A reservation is taken only when a paid model call is about to happen
 * (cache misses, learner questions, assessed answers). Cached lessons are free.
 * Limits are server configuration; a limit of 0 disables that kind of call.
 */
@Injectable()
export class GuruUsageService {
  constructor(private readonly prisma: PrismaService) {}

  private limit(name: string, fallback: number) {
    const raw = process.env[name];
    if (raw === undefined || raw.trim() === "") return fallback;
    const value = Number(raw);
    return Number.isFinite(value) && value >= 0 ? Math.floor(value) : fallback;
  }
  get lessonLimit() {
    return this.limit("GURU_DAILY_LESSON_LIMIT", 20);
  }
  get queryLimit() {
    return this.limit("GURU_DAILY_QUERY_LIMIT", 200);
  }
  day(now = new Date()) {
    return now.toISOString().slice(0, 10);
  }

  async summary(userId: string) {
    const row = await this.prisma.guruModelUsage.findUnique({
      where: { userId_day: { userId, day: this.day() } },
    });
    return {
      day: this.day(),
      lessons: {
        used: row?.lessons ?? 0,
        limit: this.lessonLimit,
        remaining: Math.max(0, this.lessonLimit - (row?.lessons ?? 0)),
      },
      queries: {
        used: row?.queries ?? 0,
        limit: this.queryLimit,
        remaining: Math.max(0, this.queryLimit - (row?.queries ?? 0)),
      },
    };
  }

  /** Atomically reserve one unit; throws 429 when the daily limit is reached. */
  async reserve(userId: string, kind: GuruUsageKind): Promise<void> {
    if (!userId) throw new HttpException("Sign in to use Guru reasoning.", 401);
    const limit = kind === "lessons" ? this.lessonLimit : this.queryLimit;
    const day = this.day();
    const exhausted = () =>
      new HttpException(
        kind === "lessons"
          ? "Daily Guru lesson limit reached for this account. Source reading remains available; try again tomorrow."
          : "Daily Guru question limit reached for this account. Source reading remains available; try again tomorrow.",
        429,
      );
    if (limit <= 0) throw exhausted();
    const attempt = async () =>
      this.prisma.guruModelUsage.updateMany({
        where: { userId, day, [kind]: { lt: limit } },
        data: { [kind]: { increment: 1 } },
      });
    let changed = await attempt();
    if (changed.count === 0) {
      const existing = await this.prisma.guruModelUsage.findUnique({
        where: { userId_day: { userId, day } },
      });
      if (existing) throw exhausted();
      try {
        await this.prisma.guruModelUsage.create({
          data: { userId, day, lessons: 0, queries: 0 },
        });
      } catch (error: any) {
        // A concurrent request created the row first; fall through to the update.
        if (error?.code !== "P2002") throw error;
      }
      changed = await attempt();
      if (changed.count === 0) throw exhausted();
    }
  }
}
