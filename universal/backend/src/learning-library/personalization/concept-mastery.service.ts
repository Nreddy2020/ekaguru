import { Injectable, Logger } from '@nestjs/common';
import { LearnerProfileService } from './learner-profile.service';

export type MasteryState = 'UNEXPLORED' | 'ACQUIRING' | 'MASTERED' | 'RETAINED';

export interface BktParameters {
  pL0: number; // Prior knowledge probability (initial mastery)
  pT: number;  // Transition probability (learning rate)
  pG: number;  // Guess probability
  pS: number;  // Slip probability
}

export interface ConceptMasteryRecord {
  conceptId: string;
  conceptName: string;
  masteryProbability: number; // p(L_t), 0.0 to 1.0
  masteryState: MasteryState;
  observationsCount: number;
  correctCount: number;
  lastObservedAt: string;
}

@Injectable()
export class ConceptMasteryEngineService {
  private readonly logger = new Logger(ConceptMasteryEngineService.name);

  // Standard BKT parameter priors
  private defaultBktParams: BktParameters = {
    pL0: 0.10, // 10% prior
    pT: 0.15,  // 15% learning transition rate
    pG: 0.15,  // 15% chance of guessing correctly
    pS: 0.10,  // 10% chance of slipping on mastered concept
  };

  constructor(private readonly profileService: LearnerProfileService) {}

  public updateConceptMastery(
    studentId: string,
    conceptId: string,
    conceptName: string,
    isCorrect: boolean,
    customParams?: Partial<BktParameters>
  ): ConceptMasteryRecord {
    const profile = this.profileService.getOrCreateProfile(studentId);
    const params: BktParameters = { ...this.defaultBktParams, ...customParams };

    const priorMastery = profile.conceptMasteryMap[conceptId] ?? params.pL0;

    // Bayesian Knowledge Tracing Update Rule:
    let posteriorGivenObservation: number;
    if (isCorrect) {
      // p(L | Correct) = (pL * (1 - pS)) / (pL * (1 - pS) + (1 - pL) * pG)
      const numerator = priorMastery * (1 - params.pS);
      const denominator = numerator + (1 - priorMastery) * params.pG;
      posteriorGivenObservation = denominator > 0 ? numerator / denominator : priorMastery;
    } else {
      // p(L | Incorrect) = (pL * pS) / (pL * pS + (1 - pL) * (1 - pG))
      const numerator = priorMastery * params.pS;
      const denominator = numerator + (1 - priorMastery) * (1 - params.pG);
      posteriorGivenObservation = denominator > 0 ? numerator / denominator : priorMastery;
    }

    // Transit to learned state: p(L_t) = posterior + (1 - posterior) * pT
    const updatedMastery = Number(
      (posteriorGivenObservation + (1 - posteriorGivenObservation) * params.pT).toFixed(4)
    );

    profile.conceptMasteryMap[conceptId] = updatedMastery;
    profile.totalInteractionsCount++;
    profile.lastActiveAt = new Date().toISOString();

    let masteryState: MasteryState = 'UNEXPLORED';
    if (updatedMastery >= 0.95) masteryState = 'RETAINED';
    else if (updatedMastery >= 0.85) masteryState = 'MASTERED';
    else if (updatedMastery >= 0.30) masteryState = 'ACQUIRING';

    return {
      conceptId,
      conceptName,
      masteryProbability: updatedMastery,
      masteryState,
      observationsCount: profile.totalInteractionsCount,
      correctCount: isCorrect ? 1 : 0,
      lastObservedAt: new Date().toISOString(),
    };
  }

  public getConceptMastery(studentId: string, conceptId: string): number {
    const profile = this.profileService.getOrCreateProfile(studentId);
    return profile.conceptMasteryMap[conceptId] ?? this.defaultBktParams.pL0;
  }
}
