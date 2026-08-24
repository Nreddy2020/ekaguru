import { Injectable, Logger } from '@nestjs/common';
import {
  PedagogicalPhase,
  PedagogicalStrategy,
  TutorTurnOutcome,
  BoundedContextMemory,
} from './tutor-turn.types';

@Injectable()
export class ConversationalStateMachineService {
  private readonly logger = new Logger(ConversationalStateMachineService.name);

  /**
   * Evaluates current dialogue state, response outcome, and learner context to select next phase & strategy.
   */
  determineNextPhaseAndStrategy(
    currentPhase: PedagogicalPhase,
    outcome: TutorTurnOutcome | null,
    context: BoundedContextMemory,
    attempts: number,
  ): { nextPhase: PedagogicalPhase; strategy: PedagogicalStrategy } {
    // 1. Initial Entry Point
    if (!outcome) {
      if (context.unmasteredPrerequisites.length > 0) {
        return { nextPhase: 'ORIENTATION', strategy: 'DIRECT_INSTRUCTION' };
      }
      return { nextPhase: 'ORIENTATION', strategy: 'SOCRATIC_QUESTION' };
    }

    // 2. Misconception / Consecutive Failure Override
    if (context.activeMisconceptions.length > 0 || (outcome === 'INCORRECT' && attempts >= 2)) {
      return { nextPhase: 'INSTRUCTION', strategy: 'COUNTER_EXAMPLE' };
    }

    // 3. Phase Transition Logic
    switch (currentPhase) {
      case 'ORIENTATION':
        if (outcome === 'CORRECT' || outcome === 'PARTIAL') {
          return { nextPhase: 'INSTRUCTION', strategy: 'DIRECT_INSTRUCTION' };
        }
        return { nextPhase: 'ORIENTATION', strategy: 'SOCRATIC_QUESTION' };

      case 'INSTRUCTION':
        return { nextPhase: 'SOCRATIC_PROBING', strategy: 'SOCRATIC_QUESTION' };

      case 'SOCRATIC_PROBING':
        if (outcome === 'CORRECT') {
          return { nextPhase: 'SCAFFOLDED_PRACTICE', strategy: 'FADED_WORKED_EXAMPLE' };
        } else if (outcome === 'UNCERTAIN' || outcome === 'NEEDS_CLARIFICATION') {
          return { nextPhase: 'SOCRATIC_PROBING', strategy: 'SOCRATIC_QUESTION' };
        }
        return { nextPhase: 'INSTRUCTION', strategy: 'COUNTER_EXAMPLE' };

      case 'SCAFFOLDED_PRACTICE':
        if (outcome === 'CORRECT') {
          return { nextPhase: 'INDEPENDENT_CHECK', strategy: 'CHECK_FOR_UNDERSTANDING' };
        } else if (outcome === 'PARTIAL') {
          return { nextPhase: 'SCAFFOLDED_PRACTICE', strategy: 'FADED_WORKED_EXAMPLE' };
        }
        return { nextPhase: 'INSTRUCTION', strategy: 'COUNTER_EXAMPLE' };

      case 'INDEPENDENT_CHECK':
        if (outcome === 'CORRECT') {
          return { nextPhase: 'SYNTHESIS', strategy: 'REFLECTIVE_SYNTHESIS' };
        }
        return { nextPhase: 'SCAFFOLDED_PRACTICE', strategy: 'FADED_WORKED_EXAMPLE' };

      case 'SYNTHESIS':
        return { nextPhase: 'SYNTHESIS', strategy: 'REFLECTIVE_SYNTHESIS' };

      default:
        return { nextPhase: 'ORIENTATION', strategy: 'DIRECT_INSTRUCTION' };
    }
  }
}
