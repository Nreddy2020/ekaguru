import { Injectable, Logger } from '@nestjs/common';
import { CanonicalEvidencePack } from '../knowledge/canonical-evidence-pack.service';

export interface MisconceptionDiagnosis {
  detected: boolean;
  misconceptionId?: string;
  misconceptionName?: string;
  studentAnswerText: string;
  correctExplanation: string;
  socraticQuestion: string;
  pedagogicalAnalogy: string;
  citationPageNumber: number;
}

@Injectable()
export class GroundedSocraticTutorService {
  private readonly logger = new Logger(GroundedSocraticTutorService.name);

  // Common curricular misconceptions mapped to concepts
  private knownMisconceptions = [
    {
      misconceptionId: 'MISC_01',
      conceptId: 'C0101',
      pattern: /(cloud|crystal|icicle|pile of sand|balloon|water level).*(grow|living)/i,
      name: 'Accretion vs. Biological Growth',
      explanation: 'Inanimate objects increase in size by external accretion (adding material to the outside), whereas living organisms grow internally via biological cellular development.',
      socraticQuestion: 'Think about a balloon blowing up versus a kitten growing into a cat. Does the balloon create new cells inside itself, or is air just pushed into it from outside?',
      pedagogicalAnalogy: 'Like building a brick tower from the outside versus a plant making leaves from its own internal nutrients.',
      citationPageNumber: 3,
    },
    {
      misconceptionId: 'MISC_02',
      conceptId: 'C0102',
      pattern: /(adult|stop growing|shrink)/i,
      name: 'Static Adulthood Fallacy',
      explanation: 'Living organisms continue cellular renewal and development throughout their complete lifecycle.',
      socraticQuestion: 'When a tree reaches full height, do its leaves and roots stop changing, or do they constantly renew themselves?',
      pedagogicalAnalogy: 'Like maintaining a house with fresh repairs even after the main walls are finished.',
      citationPageNumber: 4,
    },
  ];

  public diagnoseAnswer(
    conceptId: string,
    studentAnswer: string,
    evidencePack: CanonicalEvidencePack
  ): MisconceptionDiagnosis {
    for (const m of this.knownMisconceptions) {
      if (m.conceptId === conceptId && m.pattern.test(studentAnswer)) {
        this.logger.log(`[MISCONCEPTION DETECTED] ${m.name} for concept ${conceptId}`);
        return {
          detected: true,
          misconceptionId: m.misconceptionId,
          misconceptionName: m.name,
          studentAnswerText: studentAnswer,
          correctExplanation: m.explanation,
          socraticQuestion: m.socraticQuestion,
          pedagogicalAnalogy: m.pedagogicalAnalogy,
          citationPageNumber: m.citationPageNumber,
        };
      }
    }

    return {
      detected: false,
      studentAnswerText: studentAnswer,
      correctExplanation: 'Response grounded in foundational curricular evidence.',
      socraticQuestion: 'How does this observation connect to what you observed on Page 3?',
      pedagogicalAnalogy: 'Connecting each step to the physical textbook evidence.',
      citationPageNumber: evidencePack.physicalPages[0] || 3,
    };
  }
}
