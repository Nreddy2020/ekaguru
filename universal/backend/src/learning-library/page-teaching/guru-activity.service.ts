import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma.service";

export interface GuruActivityEvent {
  at: Date;
  kind: "answer" | "help" | "question" | "navigation";
  actionId: string | null;
  passed: boolean | null;
  confidence: number | null;
  misconception: string | null;
  masteryUpdated: boolean;
  masteryNote: string | null;
  response: string | null;
  feedback: string | null;
}
export interface GuruActivitySession {
  id: string;
  bookId: string;
  physicalPage: number;
  title: string;
  depth: string;
  language: string;
  startedAt: Date;
  lastActivityAt: Date;
  progress: { position: number; total: number; completed: boolean };
  checkpoints: { passed: number; assisted: number; attempts: number };
  questions: number;
  masteryRecorded: number;
  events: GuruActivityEvent[];
}
export interface GuruActivity {
  learnerId: string;
  generatedAt: Date;
  summary: {
    sessions: number;
    pagesPracticed: number;
    checkpointsPassed: number;
    assistedCheckpoints: number;
    attempts: number;
    questionsAsked: number;
    masteryRecorded: number;
    misconceptions: { text: string; count: number }[];
  };
  sessions: GuruActivitySession[];
  explanation: string[];
}

const RECENT_EVENTS_PER_SESSION = 20;

/**
 * Parent-facing, evidence-backed view of what Guru did with a learner.
 * Every number is derived from the idempotent session ledger; nothing is estimated.
 */
@Injectable()
export class GuruActivityService {
  constructor(private readonly prisma: PrismaService) {}

  private classify(result: any): GuruActivityEvent["kind"] {
    if (typeof result?.kind === "string") {
      if (result.kind === "answer") return "answer";
      if (result.kind === "help") return "help";
      if (result.kind === "question") return "question";
      return "navigation";
    }
    // Events recorded before the kind was stored: infer from the assessment shape.
    if (result?.assessment?.kind === "PAGE_EXPLANATION") return "answer";
    if (result?.assessment?.kind === "ASSISTED_PRACTICE") return "help";
    if (Array.isArray(result?.evidenceIds) && result.evidenceIds.length && !result.assessment) return "question";
    return "navigation";
  }

  async forLearner(learnerId: string, limit = 30): Promise<GuruActivity> {
    const sessions = await this.prisma.guruTeachingSession.findMany({
      where: { learnerId },
      orderBy: { updatedAt: "desc" },
      take: Math.min(200, Math.max(1, limit)),
      include: {
        artifact: { select: { bookId: true, physicalPage: true, payload: true } },
        events: { orderBy: { createdAt: "asc" }, select: { createdAt: true, result: true } },
      },
    });
    const misconceptionCounts = new Map<string, number>();
    const pages = new Set<string>();
    const summary = {
      sessions: sessions.length,
      pagesPracticed: 0,
      checkpointsPassed: 0,
      assistedCheckpoints: 0,
      attempts: 0,
      questionsAsked: 0,
      masteryRecorded: 0,
      misconceptions: [] as { text: string; count: number }[],
    };
    const views: GuruActivitySession[] = sessions.map((session) => {
      const plan: any = (session.artifact.payload as any)?.plan || {};
      const total = Array.isArray(plan.actions) ? plan.actions.length : 0;
      const checkpoints = { passed: 0, assisted: 0, attempts: 0 };
      let questions = 0;
      let masteryRecorded = 0;
      pages.add(session.artifact.bookId + ":" + session.artifact.physicalPage);
      const events: GuruActivityEvent[] = session.events.map((event) => {
        const result: any = event.result || {};
        const kind = this.classify(result);
        const assessment = result.assessment || null;
        if (kind === "answer") {
          checkpoints.attempts++;
          if (assessment?.passed) checkpoints.passed++;
          if (assessment?.masteryUpdated) masteryRecorded += Array.isArray(assessment.conceptIds) ? assessment.conceptIds.length : 1;
          if (typeof assessment?.misconception === "string" && assessment.misconception.trim()) {
            const text = assessment.misconception.trim().slice(0, 200);
            misconceptionCounts.set(text, (misconceptionCounts.get(text) || 0) + 1);
          }
        }
        if (kind === "help") checkpoints.assisted++;
        if (kind === "question") questions++;
        return {
          at: event.createdAt,
          kind,
          actionId: typeof result.actionId === "string" ? result.actionId : null,
          passed: typeof assessment?.passed === "boolean" ? assessment.passed : null,
          confidence: typeof assessment?.confidence === "number" ? assessment.confidence : null,
          misconception: typeof assessment?.misconception === "string" ? assessment.misconception.slice(0, 200) : null,
          masteryUpdated: assessment?.masteryUpdated === true,
          masteryNote: typeof assessment?.masteryNote === "string" ? assessment.masteryNote : null,
          response: kind === "answer" || kind === "question" ? (typeof result.response === "string" ? result.response.slice(0, 500) : null) : null,
          feedback: typeof result.feedback === "string" && result.feedback ? result.feedback.slice(0, 500) : null,
        };
      });
      summary.checkpointsPassed += checkpoints.passed;
      summary.assistedCheckpoints += checkpoints.assisted;
      summary.attempts += checkpoints.attempts;
      summary.questionsAsked += questions;
      summary.masteryRecorded += masteryRecorded;
      return {
        id: session.id,
        bookId: session.artifact.bookId,
        physicalPage: session.artifact.physicalPage,
        title: typeof plan.title === "string" ? plan.title : "Page " + session.artifact.physicalPage,
        depth: typeof plan.depth === "string" ? plan.depth : "basis",
        language: typeof plan.language === "string" ? plan.language : "en",
        startedAt: session.createdAt,
        lastActivityAt: session.updatedAt,
        progress: { position: session.cursor + 1, total, completed: total > 0 && session.cursor >= total - 1 },
        checkpoints,
        questions,
        masteryRecorded,
        events: events.filter((e) => e.kind !== "navigation").slice(-RECENT_EVENTS_PER_SESSION),
      };
    });
    summary.pagesPracticed = pages.size;
    summary.misconceptions = [...misconceptionCounts.entries()]
      .map(([text, count]) => ({ text, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    return {
      learnerId,
      generatedAt: new Date(),
      summary,
      sessions: views,
      explanation: [
        "Checkpoints passed count only answers the learner gave independently and Guru judged as meeting the page's rubric.",
        "Assisted checkpoints are ones where the learner asked Guru to teach again with help; they never count as independent understanding.",
        "Mastery recorded counts concept-mastery evidence written by the gated bridge; it stays at zero until curators verify the page's concept mapping and educators approve the teaching depth.",
        "Misconceptions are Guru's stated reading of an answer, kept for you to discuss with your child; they are not labels on the child.",
      ],
    };
  }
}
