import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

export type MisconceptionTaxonomy =
  | 'CONCEPTUAL_MISUNDERSTANDING' // Type A
  | 'PREREQUISITE_DEFICIT'         // Type B
  | 'COMPUTATIONAL_SLIP'          // Type C
  | 'LINGUISTIC_AMBIGUITY'        // Type D
  | 'UNATTRIBUTED_ERROR';         // Default conservative attribution

export interface ErrorClassificationResult {
  taxonomyType: MisconceptionTaxonomy;
  confidence: number;
  identifiedPattern?: string;
  recommendedIntervention: 'REFUTATIONAL_COUNTER_EXAMPLE' | 'PREREQUISITE_ROLLBACK' | 'GENTLE_REPROMPT' | 'SOCRATIC_CLARIFICATION';
  explanation: string;
}

@Injectable()
export class MisconceptionClassifierService {
  private readonly logger = new Logger(MisconceptionClassifierService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Conservative Misconception Attribution:
   * A single incorrect response defaults to UNATTRIBUTED_ERROR.
   * Specific taxonomy (Type A-D) is only attributed after consistent pattern convergence.
   */
  async classifyError(
    learnerId: string,
    conceptId: string,
    responsePayload: string,
    expectedAnswer?: string,
  ): Promise<ErrorClassificationResult> {
    // 1. Fetch historical unmastered attempts on this concept for pattern convergence
    const historicalErrors = await this.prisma.learningEvidence.findMany({
      where: {
        learnerId,
        conceptId,
        outcome: { in: ['INCORRECT', 'PARTIAL'] },
      },
      orderBy: { observedAt: 'desc' },
      take: 5,
    });

    const response = (responsePayload || '').trim().toLowerCase();
    const expected = (expectedAnswer || '').trim().toLowerCase();

    // 2. Slip / Computational Error Check (Typos, small numeric arithmetic offset)
    const isSmallLengthDiff = Math.abs(response.length - expected.length) <= 2;
    const isNumericSlip = !isNaN(Number(response)) && !isNaN(Number(expected)) && Math.abs(Number(response) - Number(expected)) <= 2;

    if (isNumericSlip || (isSmallLengthDiff && response.slice(0, 3) === expected.slice(0, 3))) {
      return {
        taxonomyType: 'COMPUTATIONAL_SLIP',
        confidence: 0.85,
        identifiedPattern: 'Minor arithmetic or typographical slip',
        recommendedIntervention: 'GENTLE_REPROMPT',
        explanation: 'The student understands the underlying principle but made a minor clerical or calculation slip.',
      };
    }

    // 3. Conservative Gating: If this is the FIRST failure on this concept, return UNATTRIBUTED_ERROR
    if (historicalErrors.length === 0) {
      return {
        taxonomyType: 'UNATTRIBUTED_ERROR',
        confidence: 0.50,
        recommendedIntervention: 'SOCRATIC_CLARIFICATION',
        explanation: 'Initial incorrect attempt; insufficient evidence to attribute a specific misconception.',
      };
    }

    // 4. Pattern Convergence for Type A (Conceptual) vs Type B (Prerequisite)
    const similarHistoricalResponses = historicalErrors.filter(
      (h) => h.response && h.response.toLowerCase() === response,
    );

    if (similarHistoricalResponses.length >= 1) {
      // Repeated identical wrong response establishes a persistent conceptual misunderstanding
      return {
        taxonomyType: 'CONCEPTUAL_MISUNDERSTANDING',
        confidence: 0.90,
        identifiedPattern: "Repeated confusion pattern: '" + response + "'",
        recommendedIntervention: 'REFUTATIONAL_COUNTER_EXAMPLE',
        explanation: 'Repeated response indicates an active mental model confusion.',
      };
    }

    // 5. Default to UNATTRIBUTED_ERROR with gentle prompt
    return {
      taxonomyType: 'UNATTRIBUTED_ERROR',
      confidence: 0.60,
      recommendedIntervention: 'SOCRATIC_CLARIFICATION',
      explanation: 'Error recorded as evidence; continuing observation before attributing taxonomy.',
    };
  }
}
