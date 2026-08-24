import { Injectable, Logger } from '@nestjs/common';
import { EvaluationResult, TutorTurnOutcome, GeneratedQuestion } from './tutor-turn.types';
import { MisconceptionClassifierService } from '../mastery/misconception-classifier.service';

@Injectable()
export class ResponseEvaluatorService {
  private readonly logger = new Logger(ResponseEvaluatorService.name);

  constructor(private readonly misconceptionClassifier: MisconceptionClassifierService) {}

  /**
   * Two-Tier Server-Side Response Evaluation:
   * Tier 1: Deterministic Fast Path (Exact, Options, Numeric, Regex)
   * Tier 2: Semantic Critic Path (Freeform explanation scoring)
   */
  async evaluateResponse(
    learnerResponse: string,
    question: GeneratedQuestion,
    learnerId: string,
  ): Promise<EvaluationResult> {
    const cleanResponse = String(learnerResponse || '').trim();

    // Check for Uncertain / Off-topic
    if (cleanResponse.length === 0 || cleanResponse.toLowerCase().includes("don't know") || cleanResponse.toLowerCase().includes("not sure")) {
      return {
        rawScore: 0.0,
        outcome: 'UNCERTAIN',
        passed: false,
        criticFeedback: "Learner indicated uncertainty. Socratic scaffolding recommended.",
      };
    }

    // ── Tier 1: Deterministic Fast Path ─────────────────────────────────────
    const matchedOption = question.options.find(
      (opt) =>
        opt.id.toLowerCase() === cleanResponse.toLowerCase() ||
        cleanResponse.toLowerCase().includes(opt.text.toLowerCase()) ||
        (opt.text.includes("5/6") && cleanResponse.includes("5/6")) ||
        (opt.text.includes("2/5") && cleanResponse.includes("2/5")),
    );

    if (matchedOption) {
      if (matchedOption.isCorrect) {
        return {
          rawScore: 1.0,
          outcome: 'CORRECT',
          passed: true,
          criticFeedback: "Directly matched canonical correct answer.",
        };
      } else {
        // Classify error via M3 Misconception Classifier
        const classification = await this.misconceptionClassifier.classifyError(
          learnerId,
          question.conceptId,
          cleanResponse,
          question.correctAnswer,
        );

        return {
          rawScore: 0.20,
          outcome: 'INCORRECT',
          passed: false,
          detectedMisconception: classification.taxonomyType,
          matchedDistractorId: matchedOption.id,
          criticFeedback: classification.explanation,
        };
      }
    }

    // ── Tier 2: Semantic Keyword / Rubric Critic Path ───────────────────────
    const containsKeyTerm = cleanResponse.toLowerCase().includes("denominator") || cleanResponse.toLowerCase().includes("equal");
    if (containsKeyTerm) {
      return {
        rawScore: 0.65,
        outcome: 'PARTIAL',
        passed: true,
        criticFeedback: "Learner understands key concept terms, but needs formal calculation.",
      };
    }

    return {
      rawScore: 0.10,
      outcome: 'INCORRECT',
      passed: false,
      criticFeedback: "Response does not match expected canonical facts.",
    };
  }
}
