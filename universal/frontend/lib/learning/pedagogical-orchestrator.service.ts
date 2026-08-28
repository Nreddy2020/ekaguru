import { EvidenceLedgerService } from './evidence-ledger.service';
import { KnowledgeRepositoryService } from './knowledge-repository.service';
import { KnowledgeUnit, MasteryMetric, SocraticStep } from './runtime-contracts';

export interface RuntimeDialogueState {
  currentConcept: KnowledgeUnit;
  masteryMetric: MasteryMetric;
  activeSocraticStepIndex: number;
  activeSocraticStep: SocraticStep;
  activeMisconceptionId: string | null;
  remediationMode: boolean;
  dialogueHistory: {
    sender: 'EKAGURU' | 'LEARNER';
    message: string;
    reason?: string;
    timestamp: string;
    isCorrect?: boolean;
    misconceptionTriggered?: string;
  }[];
}

export class PedagogicalOrchestratorService {
  private ledger: EvidenceLedgerService;
  private learnerId: string;

  constructor(learnerId: string = 'learner-001', ledger?: EvidenceLedgerService) {
    this.learnerId = learnerId;
    this.ledger = ledger || new EvidenceLedgerService();
  }

  public getLedger(): EvidenceLedgerService {
    return this.ledger;
  }

  /**
   * Initialize or update the runtime state for a given section/concept
   */
  public getRuntimeState(conceptId: string, sectionTitle: string): RuntimeDialogueState {
    const ku = KnowledgeRepositoryService.getKnowledgeUnit(conceptId, sectionTitle);
    const mastery = this.ledger.computeMastery(ku.conceptId, ku.prerequisiteConceptIds);

    const stepIdx = mastery.nextPedagogicalAction.stepIndex ?? 0;
    const activeStep = ku.socraticSteps[stepIdx] || ku.socraticSteps[0];
    const activeMisconception = mastery.activeMisconceptions[0] || null;

    return {
      currentConcept: ku,
      masteryMetric: mastery,
      activeSocraticStepIndex: stepIdx,
      activeSocraticStep: activeStep,
      activeMisconceptionId: activeMisconception,
      remediationMode: activeMisconception !== null,
      dialogueHistory: [
        {
          sender: 'EKAGURU',
          message: activeMisconception
            ? `⚠️ Let's clear up a misconception: ${ku.misconceptions.find((m) => m.id === activeMisconception)?.socraticRemediation || 'Let us review this concept.'}`
            : activeStep.groundedExplanation,
          reason: mastery.nextPedagogicalAction.reason,
          timestamp: new Date().toISOString(),
        },
      ],
    };
  }

  /**
   * Process a student response to a Socratic question
   */
  public submitSocraticAnswer(
    conceptId: string,
    sectionId: string,
    stepIndex: number,
    optionIndex: number,
    sectionTitle: string = ''
  ): {
    state: RuntimeDialogueState;
    isCorrect: boolean;
    feedback: string;
    misconceptionDetected: string | null;
    misconceptionResolved: string | null;
  } {
    const ku = KnowledgeRepositoryService.getKnowledgeUnit(conceptId, sectionTitle);
    const step = ku.socraticSteps[stepIndex] || ku.socraticSteps[0];
    const isCorrect = optionIndex === step.question.correctIndex;

    let misconceptionDetected: string | null = null;
    let misconceptionResolved: string | null = null;

    if (!isCorrect && step.question.misconceptionIdIfChosen && step.question.misconceptionIdIfChosen[optionIndex]) {
      misconceptionDetected = step.question.misconceptionIdIfChosen[optionIndex];
    }

    const currentMastery = this.ledger.computeMastery(ku.conceptId);
    if (isCorrect && currentMastery.activeMisconceptions.length > 0) {
      misconceptionResolved = currentMastery.activeMisconceptions[0];
    }

    // Map stepType to cognitive dimension
    const dimension = step.stepType === 'WHAT' ? 'RECALL' : step.stepType === 'HOW' ? 'APPLICATION' : 'REASONING';

    // Record immutable evidence event
    this.ledger.recordEvent({
      learnerId: this.learnerId,
      conceptId: ku.conceptId,
      sectionId,
      dimension,
      difficulty: step.stepType === 'WHAT' ? 1 : step.stepType === 'HOW' ? 3 : 4,
      score: isCorrect ? 1.0 : 0.0,
      isCorrect,
      misconceptionTriggered: misconceptionDetected || undefined,
      misconceptionResolved: misconceptionResolved || undefined,
      details: `Answered option [${optionIndex}] to question: ${step.question.text}`,
    });

    const updatedState = this.getRuntimeState(conceptId, sectionTitle);

    return {
      state: updatedState,
      isCorrect,
      feedback: isCorrect ? step.question.explanation : 'Incorrect answer recorded in evidence ledger.',
      misconceptionDetected,
      misconceptionResolved,
    };
  }

  /**
   * Submit observational experiment inputs
   */
  public submitObservation(
    conceptId: string,
    sectionId: string,
    inputs: Record<string, any>,
    sectionTitle: string = ''
  ): {
    state: RuntimeDialogueState;
    valid: boolean;
    feedback: string;
  } {
    const ku = KnowledgeRepositoryService.getKnowledgeUnit(conceptId, sectionTitle);
    if (!ku.observationalTask) {
      return {
        state: this.getRuntimeState(conceptId, sectionTitle),
        valid: false,
        feedback: 'No observational task available for this concept.',
      };
    }

    const result = ku.observationalTask.validationLogic(inputs);

    this.ledger.recordEvent({
      learnerId: this.learnerId,
      conceptId: ku.conceptId,
      sectionId,
      dimension: 'OBSERVATION',
      difficulty: 3,
      score: result.reasoningScore,
      isCorrect: result.valid,
      details: `Observation inputs: ${JSON.stringify(inputs)}`,
    });

    const updatedState = this.getRuntimeState(conceptId, sectionTitle);

    return {
      state: updatedState,
      valid: result.valid,
      feedback: result.feedback,
    };
  }
}
