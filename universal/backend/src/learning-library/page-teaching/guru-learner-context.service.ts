import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { DEPTHS, Depth } from "./guru-plan.schema";
import { stageLabel } from "./guru-review.policy";

export interface PriorPage {
  bookId: string;
  physicalPage: number;
  title: string;
  depth: string;
  lastOutcome: string | null;
  stageLabel: string;
  completedAt: Date | null;
}
export interface LearnerContext {
  learnerId: string | null;
  bookId: string | null;
  recommendedDepth: Depth | null;
  recommendationReason: string | null;
  priorPages: PriorPage[];
  knownConcepts: string[];
  misconceptions: string[];
  /** Plain-language line the board can show before the lesson starts. */
  note: string;
}

const EMPTY: LearnerContext = {
  learnerId: null,
  bookId: null,
  recommendedDepth: null,
  recommendationReason: null,
  priorPages: [],
  knownConcepts: [],
  misconceptions: [],
  note: "",
};

/**
 * What Guru knows about this learner before teaching a page, derived only from the ledger:
 * pages already practised in the same book, how those runs went, canonical concepts with
 * recorded mastery, and misconceptions Guru stated on earlier answers.
 * It costs no model calls and never labels the learner; it lets the teacher connect.
 */
@Injectable()
export class GuruLearnerContextService {
  constructor(private readonly prisma: PrismaService) {}

  async forLearner(learnerId: string | null | undefined, bookId?: string | null): Promise<LearnerContext> {
    if (!learnerId) return { ...EMPTY, bookId: bookId ?? null };
    const sessions = await this.prisma.guruTeachingSession.findMany({
      where: { learnerId, ...(bookId ? { artifact: { bookId } } : {}) },
      orderBy: { updatedAt: "desc" },
      take: 12,
      include: {
        artifact: { select: { bookId: true, physicalPage: true, payload: true } },
        events: { orderBy: { createdAt: "desc" }, take: 20, select: { result: true } },
      },
    });
    const priorPages: PriorPage[] = sessions
      .filter((s) => s.completedAt)
      .map((s) => {
        const plan: any = (s.artifact.payload as any)?.plan || {};
        return {
          bookId: s.artifact.bookId,
          physicalPage: s.artifact.physicalPage,
          title: typeof plan.title === "string" ? plan.title : "Page " + s.artifact.physicalPage,
          depth: typeof plan.depth === "string" ? plan.depth : "basis",
          lastOutcome: s.lastReviewOutcome ?? null,
          stageLabel: stageLabel(s.reviewStage ?? 0),
          completedAt: s.completedAt,
        };
      })
      .slice(0, 6);
    const misconceptions: string[] = [];
    for (const s of sessions)
      for (const e of s.events) {
        const text = (e.result as any)?.assessment?.misconception;
        if (typeof text === "string" && text.trim() && !misconceptions.includes(text.trim()))
          misconceptions.push(text.trim().slice(0, 200));
        if (misconceptions.length >= 5) break;
      }
    const masteries = await this.prisma.learnerConceptMastery.findMany({
      where: { learnerId, status: { in: ["MASTERED", "IN_PROGRESS"] } },
      orderBy: { masteryScore: "desc" },
      take: 8,
      include: { concept: { select: { canonicalName: true } } },
    });
    const knownConcepts = masteries.map((m) => m.concept.canonicalName);

    let recommendedDepth: Depth | null = null;
    let recommendationReason: string | null = null;
    const latest = priorPages[0];
    if (latest && (DEPTHS as readonly string[]).includes(latest.depth)) {
      const index = DEPTHS.indexOf(latest.depth as Depth);
      if (latest.lastOutcome === "INDEPENDENT" && index < DEPTHS.length - 1) {
        recommendedDepth = DEPTHS[index + 1];
        recommendationReason =
          "The last page in this book was completed independently at " + latest.depth + ", so the next depth is suggested.";
      } else {
        recommendedDepth = latest.depth as Depth;
        recommendationReason =
          latest.lastOutcome === "ASSISTED"
            ? "The last page needed help at " + latest.depth + ", so the same depth is suggested."
            : "Continuing at the depth used on the last page.";
      }
    }
    const note = [
      priorPages.length
        ? "You have already worked through " +
          priorPages
            .slice(0, 3)
            .map((p) => "page " + p.physicalPage + " (" + p.title + ")")
            .join(", ") +
          "."
        : "",
      knownConcepts.length ? "Ideas you have practised: " + knownConcepts.slice(0, 4).join(", ") + "." : "",
      misconceptions.length ? "Worth watching today: " + misconceptions[0] : "",
    ]
      .filter(Boolean)
      .join(" ");
    return {
      learnerId,
      bookId: bookId ?? null,
      recommendedDepth,
      recommendationReason,
      priorPages,
      knownConcepts,
      misconceptions,
      note,
    };
  }
}
