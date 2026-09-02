import { Injectable, Logger } from '@nestjs/common';
import { LearnerProfileService } from './learner-profile.service';

export type ReviewPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface ScheduledReviewItem {
  conceptId: string;
  conceptName: string;
  chapterNumber: number;
  lastPracticedDate: string;
  estimatedRetention: number; // 0.0 to 1.0 (Ebbinghaus R)
  memoryStabilityDays: number;
  priority: ReviewPriority;
  recommendedActivity: string;
}

export interface StudentReinforcementSchedule {
  studentId: string;
  totalConceptsMonitored: number;
  dueReviewsCount: number;
  reviewItems: ScheduledReviewItem[];
  generatedAt: string;
}

@Injectable()
export class SpacedReinforcementSchedulerService {
  private readonly logger = new Logger(SpacedReinforcementSchedulerService.name);

  constructor(private readonly profileService: LearnerProfileService) {}

  // Calculate Ebbinghaus memory retention: R = exp(-t / S)
  public calculateRetention(elapsedDays: number, masteryProbability: number, reviewsCount: number = 1): number {
    // Stability S increases with higher mastery and review count: S = (1 + 2.5 * reviews) * mastery
    const stability = Math.max(0.5, (1 + 2.5 * reviewsCount) * masteryProbability * 4.0);
    const retention = Math.exp(-elapsedDays / stability);
    return Number(Math.min(1.0, Math.max(0.0, retention)).toFixed(3));
  }

  public generateSchedule(
    studentId: string,
    simulatedElapsedDays: Record<string, number> = {}
  ): StudentReinforcementSchedule {
    const profile = this.profileService.getOrCreateProfile(studentId);
    const reviewItems: ScheduledReviewItem[] = [];

    const conceptNames: Record<string, string> = {
      C0101: 'Living Things',
      C0102: 'Growth Continuum',
      C0201: 'Skeletal System',
      M0301: 'Area Calculation',
      S0101: 'Nutritional Energy',
    };

    for (const [conceptId, mastery] of Object.entries(profile.conceptMasteryMap)) {
      const elapsedDays = simulatedElapsedDays[conceptId] ?? 3; // default 3 days
      const retention = this.calculateRetention(elapsedDays, mastery);
      const stability = Math.max(1, Math.round((1 + 2.5) * mastery * 4.0));

      let priority: ReviewPriority = 'LOW';
      if (retention < 0.50) priority = 'CRITICAL';
      else if (retention < 0.70) priority = 'HIGH';
      else if (retention < 0.85) priority = 'MEDIUM';

      if (retention < 0.80) {
        reviewItems.push({
          conceptId,
          conceptName: conceptNames[conceptId] || conceptId,
          chapterNumber: 1,
          lastPracticedDate: new Date(Date.now() - elapsedDays * 86400000).toISOString(),
          estimatedRetention: retention,
          memoryStabilityDays: stability,
          priority,
          recommendedActivity: `Targeted 3-minute micro-review on ${conceptNames[conceptId] || conceptId} (Page 3 visual scan)`,
        });
      }
    }

    // Sort by most urgent retention risk first
    reviewItems.sort((a, b) => a.estimatedRetention - b.estimatedRetention);

    return {
      studentId,
      totalConceptsMonitored: Object.keys(profile.conceptMasteryMap).length,
      dueReviewsCount: reviewItems.length,
      reviewItems,
      generatedAt: new Date().toISOString(),
    };
  }
}
