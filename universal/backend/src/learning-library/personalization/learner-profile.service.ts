import { Injectable, Logger, NotFoundException } from '@nestjs/common';

export type LearningModality = 'VISUAL' | 'VERBAL' | 'INTERACTIVE' | 'READING';
export type LearningPace = 'GENTLE' | 'STANDARD' | 'ACCELERATED';

export interface LearnerProfileRecord {
  studentId: string;
  displayName: string;
  gradeLevel: string;
  preferredModality: LearningModality;
  targetPace: LearningPace;
  conceptMasteryMap: Record<string, number>; // conceptId -> mastery probability (0.0 to 1.0)
  startingDepths: Record<string, string>; // chapterId -> starting depth ('basis' | 'developing' | 'proficient' | 'advanced' | 'deep')
  totalLessonsCompleted: number;
  totalInteractionsCount: number;
  lastActiveAt: string;
  createdAt: string;
}

@Injectable()
export class LearnerProfileService {
  private readonly logger = new Logger(LearnerProfileService.name);
  private profiles: Map<string, LearnerProfileRecord> = new Map();

  public getOrCreateProfile(studentId: string, displayName: string = 'Learner', gradeLevel: string = 'Class 5'): LearnerProfileRecord {
    let profile = this.profiles.get(studentId);
    if (!profile) {
      profile = {
        studentId,
        displayName,
        gradeLevel,
        preferredModality: 'VISUAL',
        targetPace: 'STANDARD',
        conceptMasteryMap: {},
        startingDepths: {},
        totalLessonsCompleted: 0,
        totalInteractionsCount: 0,
        lastActiveAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
      this.profiles.set(studentId, profile);
      this.logger.log(`Created learner profile for ${displayName} (${studentId})`);
    }
    return profile;
  }

  public getProfile(studentId: string): LearnerProfileRecord {
    const profile = this.profiles.get(studentId);
    if (!profile) throw new NotFoundException(`Learner profile not found for ${studentId}`);
    return profile;
  }

  public updatePreferences(studentId: string, modality?: LearningModality, pace?: LearningPace): LearnerProfileRecord {
    const profile = this.getProfile(studentId);
    if (modality) profile.preferredModality = modality;
    if (pace) profile.targetPace = pace;
    profile.lastActiveAt = new Date().toISOString();
    return profile;
  }

  public recordLessonCompleted(studentId: string, chapterId: string): LearnerProfileRecord {
    const profile = this.getProfile(studentId);
    profile.totalLessonsCompleted++;
    profile.lastActiveAt = new Date().toISOString();
    return profile;
  }
}
