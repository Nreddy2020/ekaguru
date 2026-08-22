export interface TutorContext {
  learnerId: string;
  age: number;
  board: string;
  grade: number;
  subject: string;
  conceptId: string;
  conceptName: string;
  timeBudgetSeconds: number;
  masteryScore: number;
}

export interface TutorInput {
  sessionId: string;
  stepId: string;
  learnerId: string;
  response: string;
  attempts: number;
}

export interface TutorResponse {
  statement: string;
  options?: string[];
  correctOption?: string;
  detectedMisconception?: string;
  nextBestAction?: string;
  nbaReason?: any;
}

export interface TutorProvider {
  startSession(context: TutorContext): Promise<TutorResponse>;
  respond(context: TutorContext, input: TutorInput): Promise<TutorResponse>;
  requestHint(context: TutorContext, level: number): Promise<TutorResponse>;
  explainMisconception(context: TutorContext, misconceptionCode: string): Promise<TutorResponse>;
}
