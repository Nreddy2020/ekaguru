import { Injectable } from '@nestjs/common';
import { TutorProvider, TutorContext, TutorInput, TutorResponse } from './tutor-provider.interface';

@Injectable()
export class DeterministicTutorProvider implements TutorProvider {
  async startSession(context: TutorContext): Promise<TutorResponse> {
    const isYoung = context.age < 12;
    return {
      statement: isYoung 
        ? "Let's work through this problem together. We want to add these two fractions." 
        : "Let's evaluate the addition of these two fractions with unlike denominators.",
      options: [
        "5/6 (Convert to common denominator)",
        "2/5 (Add numerators and denominators directly)",
        "3/6 (Convert first fraction only)"
      ],
      correctOption: "5/6 (Convert to common denominator)"
    };
  }

  async respond(context: TutorContext, input: TutorInput): Promise<TutorResponse> {
    const cleanResponse = String(input.response).trim().toLowerCase();
    
    if (cleanResponse.includes("2/5")) {
      return {
        statement: "I see what you tried. You added the denominators directly. But if we add a half of a pizza and a third of another pizza, are the pieces the same size? Let's check them.",
        detectedMisconception: "ADD_DENOMINATORS_DIRECTLY"
      };
    }

    if (cleanResponse.includes("5/6")) {
      return {
        statement: "Fractions Mastered! You can now confidently compare fractions, find equivalent denominators, and add fractions with like denominators.",
        nextBestAction: "REMEDIATION",
        nbaReason: {
          action: "REMEDIATION",
          target: "frac-addition-unlike",
          reason: {
            type: "MISCONCEPTION",
            code: "ADD_DENOMINATORS_DIRECTLY",
            evidenceCount: input.attempts
          }
        }
      };
    }

    return {
      statement: "That's not quite correct. Let's look at the denominators. Are they the same?"
    };
  }

  async requestHint(context: TutorContext, level: number): Promise<TutorResponse> {
    if (level === 1) {
      return {
        statement: "Let's look at the denominators. Are they the same? What must we do before we add them?"
      };
    } else if (level === 2) {
      return {
        statement: "Think of sharing. If you have different sized slices, you cannot just add them. We need to cut the slices so they are identical in size."
      };
    } else {
      return {
        statement: "Find the least common multiple of 2 and 3. The common denominator is 6. Try converting both fractions."
      };
    }
  }

  async explainMisconception(context: TutorContext, misconceptionCode: string): Promise<TutorResponse> {
    return {
      statement: "When adding fractions, we cannot simply add the bottom numbers together. Denominators represent the size of the parts, so we must slice them equally first."
    };
  }
}
