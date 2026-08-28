import { EvidenceEvent, MasteryMetric } from './runtime-contracts';

export class EvidenceLedgerService {
  private events: EvidenceEvent[] = [];

  constructor(initialEvents: EvidenceEvent[] = []) {
    this.events = [...initialEvents];
  }

  public recordEvent(event: Omit<EvidenceEvent, 'id' | 'timestamp'>): EvidenceEvent {
    const fullEvent: EvidenceEvent = {
      ...event,
      id: `ev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
    };
    this.events.push(fullEvent);
    return fullEvent;
  }

  public getEventsForConcept(conceptId: string): EvidenceEvent[] {
    return this.events.filter((e) => e.conceptId === conceptId);
  }

  public computeMastery(conceptId: string, prerequisiteIds: string[] = []): MasteryMetric {
    const conceptEvents = this.getEventsForConcept(conceptId);

    const recallEvents = conceptEvents.filter((e) => e.dimension === 'RECALL');
    const appEvents = conceptEvents.filter((e) => e.dimension === 'APPLICATION');
    const reasonEvents = conceptEvents.filter((e) => e.dimension === 'REASONING');
    const obsEvents = conceptEvents.filter((e) => e.dimension === 'OBSERVATION');

    const calcAverage = (evs: EvidenceEvent[]) =>
      evs.length === 0 ? 0 : Math.round((evs.reduce((sum, e) => sum + e.score, 0) / evs.length) * 100);

    const recallScore = calcAverage(recallEvents);
    const applicationScore = calcAverage(appEvents);
    const reasoningScore = calcAverage(reasonEvents);
    const observationCompleted = obsEvents.some((e) => e.isCorrect && e.score >= 0.8);

    // Compute active misconceptions
    const triggeredMisconceptions = new Set<string>();
    const resolvedMisconceptions = new Set<string>();

    conceptEvents.forEach((e) => {
      if (e.misconceptionTriggered) triggeredMisconceptions.add(e.misconceptionTriggered);
      if (e.misconceptionResolved) resolvedMisconceptions.add(e.misconceptionResolved);
    });

    const activeMisconceptions = Array.from(triggeredMisconceptions).filter(
      (mId) => !resolvedMisconceptions.has(mId)
    );

    // Strict Minimum Evidence & Mastery Rules
    const hasMinEvidence =
      recallEvents.length >= 1 && appEvents.length >= 1 && reasonEvents.length >= 1;

    const meetsThresholds =
      recallScore >= 80 && applicationScore >= 70 && reasoningScore >= 70 && activeMisconceptions.length === 0;

    let status: MasteryMetric['status'] = 'NOT_STARTED';
    let nextPedagogicalAction: MasteryMetric['nextPedagogicalAction'] = {
      type: 'TEACH_STEP',
      reason: 'Begin initial Socratic discovery of core concept.',
      stepIndex: 0,
    };

    if (conceptEvents.length > 0) {
      status = 'IN_PROGRESS';
    }

    if (activeMisconceptions.length > 0) {
      status = 'NEEDS_REMEDIATION';
      nextPedagogicalAction = {
        type: 'REMEDIATE_MISCONCEPTION',
        reason: `Active misconception [${activeMisconceptions[0]}] requires targeted Socratic contrast.`,
        misconceptionId: activeMisconceptions[0],
      };
    } else if (meetsThresholds && hasMinEvidence) {
      status = 'MASTERED';
      nextPedagogicalAction = {
        type: 'ADVANCE_EXTENSION',
        reason: 'Mastery mathematically verified across Recall, Application, and Reasoning with zero misconceptions.',
      };
    } else if (recallScore < 80) {
      nextPedagogicalAction = {
        type: 'TEACH_STEP',
        reason: 'Recall foundation below 80% threshold; reinforcing core definition.',
        stepIndex: 0,
      };
    } else if (applicationScore < 70) {
      nextPedagogicalAction = {
        type: 'APPLICATION_CHALLENGE',
        reason: 'Recall verified; testing transfer in a new real-world scenario.',
      };
    } else if (!observationCompleted) {
      nextPedagogicalAction = {
        type: 'OBSERVE_TASK',
        reason: 'Perform hands-on observational experiment to ground theoretical understanding.',
      };
    }

    return {
      conceptId,
      status,
      recallScore,
      applicationScore,
      reasoningScore,
      observationCompleted,
      activeMisconceptions,
      evidenceCount: {
        recall: recallEvents.length,
        application: appEvents.length,
        reasoning: reasonEvents.length,
        observation: obsEvents.length,
      },
      lastEvaluatedAt: new Date().toISOString(),
      nextPedagogicalAction,
    };
  }
}
