import { EvidenceLedgerService } from './evidence-ledger.service';
import { KnowledgeRepositoryService } from './knowledge-repository.service';
import { KnowledgeUnit, MasteryMetric, SocraticStep } from './runtime-contracts';

export interface RuntimeDialogueState {
  currentConcept: KnowledgeUnit;
  masteryMetric: MasteryMetric;
  activeSocraticStepIndex: number;
  activeSocraticStep: SocraticStep;
  totalSocraticSteps: number;
  activeMisconceptionId: string | null;
  remediationMode: boolean;
  remediationStep?: {
    socraticExplanation: string;
    challengeQuestion: {
      text: string;
      options: string[];
      correctIndex: number;
      explanation: string;
    };
  };
  lastFeedback: {
    isCorrect: boolean;
    message: string;
    explanation: string;
  } | null;
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

  public getRuntimeState(conceptId: string, sectionTitle: string, currentStepIndex: number = 0): RuntimeDialogueState {
    const ku = KnowledgeRepositoryService.getKnowledgeUnit(conceptId, sectionTitle);
    const mastery = this.ledger.computeMastery(ku.conceptId, ku.prerequisiteConceptIds);

    const safeStepIdx = Math.min(Math.max(0, currentStepIndex), ku.socraticSteps.length - 1);
    const activeStep = ku.socraticSteps[safeStepIdx];
    const activeMisconception = mastery.activeMisconceptions[0] || null;

    let remediationStep = undefined;
    if (activeMisconception) {
      const misc = ku.misconceptions.find((m) => m.id === activeMisconception);
      if (misc) {
        remediationStep = {
          socraticExplanation: misc.socraticRemediation,
          challengeQuestion: {
            text: misc.independentVerificationChallenge.question,
            options: misc.independentVerificationChallenge.options,
            correctIndex: misc.independentVerificationChallenge.correctIndex,
            explanation: misc.independentVerificationChallenge.explanation,
          },
        };
      }
    }

    return {
      currentConcept: ku,
      masteryMetric: mastery,
      activeSocraticStepIndex: safeStepIdx,
      activeSocraticStep: activeStep,
      totalSocraticSteps: ku.socraticSteps.length,
      activeMisconceptionId: activeMisconception,
      remediationMode: activeMisconception !== null,
      remediationStep,
      lastFeedback: null,
    };
  }

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
  } {
    const ku = KnowledgeRepositoryService.getKnowledgeUnit(conceptId, sectionTitle);
    const step = ku.socraticSteps[stepIndex] || ku.socraticSteps[0];
    const isCorrect = optionIndex === step.question.correctIndex;

    let misconceptionDetected: string | null = null;
    if (!isCorrect && step.question.misconceptionIdIfChosen && step.question.misconceptionIdIfChosen[optionIndex]) {
      misconceptionDetected = step.question.misconceptionIdIfChosen[optionIndex];
    }

    this.ledger.recordEvent({
      learnerId: this.learnerId,
      conceptId: ku.conceptId,
      sectionId,
      dimension: step.cognitiveDimension,
      difficulty: step.difficulty,
      score: isCorrect ? 1.0 : 0.0,
      isCorrect,
      misconceptionTriggered: misconceptionDetected || undefined,
      details: `Answered option [${optionIndex}] to ${step.stepType} question`,
    });

    let nextStepIdx = stepIndex;
    if (isCorrect && stepIndex < ku.socraticSteps.length - 1) {
      nextStepIdx = stepIndex + 1;
    }

    const nextState = this.getRuntimeState(conceptId, sectionTitle, nextStepIdx);
    nextState.lastFeedback = {
      isCorrect,
      message: isCorrect ? '✓ Correct! Evidence recorded.' : 'Incorrect response recorded.',
      explanation: isCorrect ? step.question.explanation : 'Let us review the underlying biological mechanism.',
    };

    return {
      state: nextState,
      isCorrect,
      feedback: step.question.explanation,
    };
  }

  public submitRemediationAnswer(
    conceptId: string,
    sectionId: string,
    optionIndex: number,
    sectionTitle: string = ''
  ): {
    state: RuntimeDialogueState;
    isCorrect: boolean;
    feedback: string;
  } {
    const ku = KnowledgeRepositoryService.getKnowledgeUnit(conceptId, sectionTitle);
    const currentMastery = this.ledger.computeMastery(ku.conceptId);
    const activeMisconceptionId = currentMastery.activeMisconceptions[0];
    const misc = ku.misconceptions.find((m) => m.id === activeMisconceptionId);

    const isCorrect = misc ? optionIndex === misc.independentVerificationChallenge.correctIndex : false;

    this.ledger.recordEvent({
      learnerId: this.learnerId,
      conceptId: ku.conceptId,
      sectionId,
      dimension: 'RECALL',
      difficulty: 2,
      score: isCorrect ? 1.0 : 0.0,
      isCorrect,
      misconceptionResolved: isCorrect && activeMisconceptionId ? activeMisconceptionId : undefined,
      details: `Remediation challenge answer for ${activeMisconceptionId}`,
    });

    const nextState = this.getRuntimeState(conceptId, sectionTitle, 0);
    nextState.lastFeedback = {
      isCorrect,
      message: isCorrect ? '✓ Misconception Resolved! Verification challenge passed.' : 'Misconception persists; review explanation carefully.',
      explanation: misc ? misc.independentVerificationChallenge.explanation : '',
    };

    return {
      state: nextState,
      isCorrect,
      feedback: misc ? misc.independentVerificationChallenge.explanation : '',
    };
  }

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
        feedback: 'No observational task configured.',
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

    const nextState = this.getRuntimeState(conceptId, sectionTitle);
    return {
      state: nextState,
      valid: result.valid,
      feedback: result.feedback,
    };
  }
}
