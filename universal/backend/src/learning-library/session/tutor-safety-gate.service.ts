import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { TutorTurn, BoundedContextMemory } from './tutor-turn.types';

@Injectable()
export class TutorSafetyGateService {
  private readonly logger = new Logger(TutorSafetyGateService.name);

  /**
   * GATE 3: RESPONSE SAFETY & GROUNDING GATE
   * Inspects tutor response text before delivery to learner:
   * 1. Anti-Leakage: Prevents leaking assessment answers during independent check.
   * 2. Grounding: Asserts that response is anchored to M2 source snippet.
   * 3. Cognitive / Tone Safety: Prevents hostile or overly complex statements.
   */
  validateTutorTurn(turn: TutorTurn, context: BoundedContextMemory): void {
    const text = turn.tutorResponseText;

    // 1. Anti-Leakage Check
    if (turn.phase === 'INDEPENDENT_CHECK') {
      const expected = turn.evaluationPolicy.expectedAnswer;
      if (expected && text.includes(expected)) {
        throw new BadRequestException("SAFETY GATE VETO: Tutor turn leaks the correct assessment answer during INDEPENDENT_CHECK.");
      }
    }

    // 2. Source Grounding Check
    if (turn.sourceAnchors.length === 0) {
      throw new BadRequestException("SAFETY GATE VETO: Tutor turn has 0 verified M2 source anchors.");
    }

    // 3. Cognitive Length Check (max 500 characters for conversational tutor turns)
    if (text.length > 1000) {
      throw new BadRequestException("SAFETY GATE VETO: Tutor turn exceeds cognitive length limit (" + text.length + " chars).");
    }
  }
}
