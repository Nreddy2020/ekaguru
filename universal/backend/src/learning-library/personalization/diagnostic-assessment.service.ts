import { Injectable, Logger } from '@nestjs/common';
import { LearnerProfileService } from './learner-profile.service';

export type PedagogicalDepth = 'basis' | 'developing' | 'proficient' | 'advanced' | 'deep';

export interface DiagnosticQuestion {
  questionId: string;
  conceptId: string;
  conceptName: string;
  prompt: string;
  options: string[];
  correctOptionIndex: number;
}

export interface DiagnosticAssessmentResult {
  studentId: string;
  bookId: string;
  chapterNumber: number;
  totalQuestions: number;
  correctAnswersCount: number;
  readinessScore: number; // 0.0 to 1.0
  assignedStartingDepth: PedagogicalDepth;
  conceptScores: Record<string, number>;
  placementRationale: string;
  assessedAt: string;
}

@Injectable()
export class DiagnosticAssessmentService {
  private readonly logger = new Logger(DiagnosticAssessmentService.name);

  constructor(private readonly profileService: LearnerProfileService) {}

  public evaluateReadiness(
    studentId: string,
    bookId: string,
    chapterNumber: number,
    answers: { questionId: string; conceptId: string; isCorrect: boolean }[]
  ): DiagnosticAssessmentResult {
    const totalQuestions = answers.length;
    const correctAnswersCount = answers.filter((a) => a.isCorrect).length;
    const readinessScore = totalQuestions > 0 ? Number((correctAnswersCount / totalQuestions).toFixed(3)) : 0.5;

    const conceptScores: Record<string, number> = {};
    for (const a of answers) {
      if (!conceptScores[a.conceptId]) conceptScores[a.conceptId] = 0;
      if (a.isCorrect) conceptScores[a.conceptId] = 1.0;
    }

    // Deterministic Starting Depth Placement Thresholds
    let assignedStartingDepth: PedagogicalDepth = 'basis';
    let placementRationale = 'Foundational readiness indicates initial grounding in fundamental visual steps.';

    if (readinessScore >= 0.85) {
      assignedStartingDepth = 'advanced';
      placementRationale = 'High prerequisite readiness: advancing to multi-step analytical challenges.';
    } else if (readinessScore >= 0.65) {
      assignedStartingDepth = 'proficient';
      placementRationale = 'Solid core readiness: placed into standard balanced classroom depth.';
    } else if (readinessScore >= 0.40) {
      assignedStartingDepth = 'developing';
      placementRationale = 'Emerging understanding: structured with guided scaffolding and analogies.';
    }

    // Update profile starting depth
    const profile = this.profileService.getOrCreateProfile(studentId);
    profile.startingDepths[`${bookId}-ch${chapterNumber}`] = assignedStartingDepth;

    return {
      studentId,
      bookId,
      chapterNumber,
      totalQuestions,
      correctAnswersCount,
      readinessScore,
      assignedStartingDepth,
      conceptScores,
      placementRationale,
      assessedAt: new Date().toISOString(),
    };
  }
}
