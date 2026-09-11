import { Injectable, Logger } from "@nestjs/common";
import { createHash } from "crypto";
import { MasteryCalculatorService } from "../mastery/mastery-calculator.service";
import { GuruConceptMappingService } from "./guru-concept-mapping.service";
import { GuruEvaluationService } from "./evaluation/guru-evaluation.service";

export interface BridgeInput {
  sessionId: string;
  requestId: string;
  learnerId: string | null | undefined;
  artifact: {
    id: string;
    bookId: string;
    physicalPage: number;
    sourceHash: string;
    depth: string;
    language: string;
  };
  action: { id: string; evidenceIds: string[] };
  assessment: {
    criteriaMet: boolean[];
    confidence: number;
    passed: boolean;
    misconception: string | null;
  };
  response: string;
}
export type BridgeReason =
  | "recorded"
  | "bridge-disabled"
  | "no-learner"
  | "no-verified-mapping"
  | "evaluation-gate"
  | "ledger-error";
export interface BridgeResult {
  masteryUpdated: boolean;
  conceptIds: string[];
  reason: BridgeReason;
}

/**
 * The only path from a Guru page checkpoint to canonical mastery.
 * Every gate is explicit: server flag, a real learner, a curator-verified concept
 * mapping, and an educator-approved evaluation corpus for that depth and language.
 * Evidence keys are deterministic so network retries never double count.
 */
@Injectable()
export class GuruMasteryBridgeService {
  private readonly logger = new Logger(GuruMasteryBridgeService.name);
  constructor(
    private readonly mapping: GuruConceptMappingService,
    private readonly evaluation: GuruEvaluationService,
    private readonly mastery: MasteryCalculatorService,
  ) {}

  get enabled() {
    return (process.env.GURU_MASTERY_BRIDGE || "").trim() === "enabled";
  }

  static evidenceKey(sessionId: string, requestId: string, conceptId: string) {
    return createHash("sha256")
      .update("guru-page|" + sessionId + "|" + requestId + "|" + conceptId)
      .digest("hex");
  }

  async record(input: BridgeInput): Promise<BridgeResult> {
    const none = (reason: BridgeReason): BridgeResult => ({
      masteryUpdated: false,
      conceptIds: [],
      reason,
    });
    if (!this.enabled) return none("bridge-disabled");
    if (!input.learnerId) return none("no-learner");
    const conceptIds = await this.mapping.verifiedConceptIds(input.artifact.id);
    if (!conceptIds.length) return none("no-verified-mapping");
    if (
      !(await this.evaluation.isDepthApproved(
        input.artifact.depth,
        input.artifact.language,
      ))
    )
      return none("evaluation-gate");
    const met = input.assessment.criteriaMet.filter(Boolean).length;
    const total = Math.max(1, input.assessment.criteriaMet.length);
    const rawScore = Number(
      (
        Math.min(1, Math.max(0, input.assessment.confidence)) *
        (met / total)
      ).toFixed(4),
    );
    const outcome = input.assessment.passed
      ? "CORRECT"
      : rawScore >= 0.5
        ? "PARTIAL"
        : "INCORRECT";
    try {
      for (const conceptId of conceptIds) {
        await this.mastery.recordEvidence({
          evidenceKey: GuruMasteryBridgeService.evidenceKey(
            input.sessionId,
            input.requestId,
            conceptId,
          ),
          learnerId: input.learnerId,
          conceptId,
          rawScore,
          evidenceType: "EXPLANATION",
          outcome,
          misconception: input.assessment.misconception || undefined,
          response: input.response.slice(0, 6000),
          reasoning: "Guru page checkpoint " + input.action.id,
          sourceReference: {
            kind: "GURU_PAGE_CHECKPOINT",
            artifactId: input.artifact.id,
            bookId: input.artifact.bookId,
            physicalPage: input.artifact.physicalPage,
            sourceHash: input.artifact.sourceHash,
            actionId: input.action.id,
            evidenceIds: input.action.evidenceIds,
            depth: input.artifact.depth,
            language: input.artifact.language,
            confidence: input.assessment.confidence,
            criteriaMet: input.assessment.criteriaMet,
          },
          observedAt: new Date().toISOString(),
        });
      }
    } catch (error: any) {
      // The learner's checkpoint progress must not depend on the ledger write.
      this.logger.error(
        "Mastery ledger write failed for session " +
          input.sessionId +
          ": " +
          (error?.message || error),
      );
      return none("ledger-error");
    }
    return { masteryUpdated: true, conceptIds, reason: "recorded" };
  }
}
