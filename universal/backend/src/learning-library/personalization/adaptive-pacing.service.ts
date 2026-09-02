import { Injectable, Logger } from '@nestjs/common';
import { PedagogicalDepth } from './diagnostic-assessment.service';

export interface PacingAdjustmentResult {
  previousDepth: PedagogicalDepth;
  newDepth: PedagogicalDepth;
  action: 'ADVANCE' | 'MAINTAIN' | 'REMEDIATE';
  consecutiveCorrectStreak: number;
  consecutiveIncorrectStreak: number;
  reason: string;
}

@Injectable()
export class AdaptivePacingEngineService {
  private readonly logger = new Logger(AdaptivePacingEngineService.name);

  private readonly depthHierarchy: PedagogicalDepth[] = ['basis', 'developing', 'proficient', 'advanced', 'deep'];

  public evaluateDepthAdjustment(
    currentDepth: PedagogicalDepth,
    consecutiveCorrect: number,
    consecutiveIncorrect: number,
    hintsRequested: number = 0
  ): PacingAdjustmentResult {
    const currentIndex = this.depthHierarchy.indexOf(currentDepth);

    // Rule 1: Remediation Drop (2 consecutive wrong answers OR 1 wrong + >= 2 hints)
    if (consecutiveIncorrect >= 2 || (consecutiveIncorrect >= 1 && hintsRequested >= 2)) {
      if (currentIndex > 0) {
        const newDepth = this.depthHierarchy[currentIndex - 1];
        return {
          previousDepth: currentDepth,
          newDepth,
          action: 'REMEDIATE',
          consecutiveCorrectStreak: 0,
          consecutiveIncorrectStreak: consecutiveIncorrect,
          reason: `Struggling on ${currentDepth}: dynamic remediation drop to ${newDepth} with increased scaffolding.`,
        };
      }
    }

    // Rule 2: Advancement Promotion (3 consecutive correct answers without hints)
    if (consecutiveCorrect >= 3 && hintsRequested === 0) {
      if (currentIndex < this.depthHierarchy.length - 1) {
        const newDepth = this.depthHierarchy[currentIndex + 1];
        return {
          previousDepth: currentDepth,
          newDepth,
          action: 'ADVANCE',
          consecutiveCorrectStreak: consecutiveCorrect,
          consecutiveIncorrectStreak: 0,
          reason: `Mastery demonstrated on ${currentDepth}: dynamic promotion to ${newDepth} for deeper analytical challenge.`,
        };
      }
    }

    // Rule 3: Maintain current depth
    return {
      previousDepth: currentDepth,
      newDepth: currentDepth,
      action: 'MAINTAIN',
      consecutiveCorrectStreak: consecutiveCorrect,
      consecutiveIncorrectStreak: consecutiveIncorrect,
      reason: `Continuing at current optimal depth ${currentDepth}.`,
    };
  }
}
