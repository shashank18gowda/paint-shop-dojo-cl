export interface GameSession {
    participantId?: string;
    languageCode?: string;
}

export interface FetchQuizData {
  flowId: string;
  code: string;
  name: string;
  description: string | null;
  assetBaseUrl?: string;
  scoring: {
    pointsPerCorrect: number;
    penaltyPerWrong: number;
    penaltyPerHint: number;
    maxWrongAttempts: number;
  };
  maxScore: number;
  timePerQuestion: number;
  processPurposeDisplayTime: number;
  quizData: QuizQuestion[];
}

export interface QuizQuestion {
  questionId: string;
  // The correct answer (a process id); null for COLOUR_PICK / CONFIRM screens.
  correctProcessId: string | null;
  stepNo: number;
  header: string;
  instruction: string;
  carTexture: string;        
  successTexture: string;    
  successVideo: string;      
  options: QuizOption[];
  hints: string[];           
}


// ─── Shared ───────────────────────────────────────────────────────────────────

export type Variant = 'hyryder' | 'hycross';

export enum QuestionKind {
  PROCESS_PICK = 'PROCESS_PICK',
  COLOUR_PICK = 'COLOUR_PICK',
  CONFIRM = 'CONFIRM'
}

export type LocalizedText = string | Record<string, string>;

export interface RuntimeQuizOption {
  id: string;
  // Make these optional since they are likely mapped on the frontend later
  label?: LocalizedText;
  imageKey?: string;
  isCorrect?: boolean;
  
  // Add the raw properties from the backend payload
  translations?: LocalizedText; 
  hex?: string; 
  imageUrl?: string | null; 
}

// Update your Hint interface as well, since the payload uses an object with 'order' and 'translations'
export interface RuntimeQuizHint {
  order?: number;
  translations?: LocalizedText;
}

export interface RuntimeQuizQuestion {
  processId: string;
  kind: QuestionKind;
  isColorPick: boolean;
  stepNo?: number; // Noticed the payload uses stepNo instead of step
  step?: number;
  header?: LocalizedText;
  instruction?: LocalizedText;
  carTexture: string;
  successTexture: string;
  successVideo: string;
  
  // Top level translations from the raw payload
  translations?: Record<string, {
    questionText: string;
    initialVisualText: string;
    carVisualBefore: string;
  }>;
  
  options: RuntimeQuizOption[];
  
  // Allow for both mapped strings or raw backend hint objects
  hints: LocalizedText[] | RuntimeQuizHint[]; 
}

export interface GameSceneInitData {
  variant?: string;
  participantId?: string;
  flowId?: string;
  sessionData: StartRunData;
  quizData: RuntimeQuizQuestion[];
}

// ─── initGameRun ──────────────────────────────────────────────────────────────

export interface InitGameRunPayload {
  participantId: string;
  flowId: string;
  variant: Variant;
}

export interface InitGameRunResponse {
  runId: string;
  startedAt: string;       // ISO 8601 — treat as the canonical start time
}

// ─── submitGameRun ────────────────────────────────────────────────────────────

export interface GameAnswerEvent {
  attemptNo: number;
  chosenOptionId: string;
  chosenLabel: string;
  isCorrect: boolean;
  hintRevealed: number | null;
}

export interface GameRunStep {
  questionId: string;
  stepNo: number;
  wrongAttempts: number;
  pointsAwarded: number;
  isCorrect: boolean;
  timeTaken: number;        // seconds on this question
  events: GameAnswerEvent[];
}

export interface SubmitGameRunPayload {
  runId: string;
  participantId: string;
  flowId: string;
  variant: Variant;
  languageCode: string | null;
  startedAt: string;        // ISO 8601 from initGameRun response
  completedAt: string;      // ISO 8601 set client-side on game completion
  timeTaken: number;        // total seconds, derived from completedAt - startedAt
  score: number;
  maxScore: number;
  steps: GameRunStep[];
}

export interface JudgementBand {
  code: string;
  name: string;
  minScore: number;
  maxScore: number;
  color: string | null;
  certificateEligible: boolean;
}

export interface SubmitGameRunResponse {
  runId: string;
  score: number;
  maxScore: number;
  judgementBand: JudgementBand;
}


// --- Tracking Interfaces ---
export interface QuizEvent {
  attemptNo: number;
  chosenOptionId: string;
  chosenLabel: string;
  isCorrect: boolean;
  hintRevealed: number | null;
}

export interface QuizOption {
  id: string;
  label: string;
  imageKey: string;
  isCorrect: boolean;
}

export interface QuizStep {
  questionId: string;
  stepNo: number;
  shownOptions: QuizOption[];
  wrongAttempts: number;
  pointsAwarded: number;
  isCorrect: boolean;
  timeTaken: number;
  hintUsed: number;
  events: QuizEvent[];
}

export interface SubmitQuizPayload {
  runId: string;
  participantId: string;
  flowId: string;
  variant: string;
  languageCode: string;
  startedAt: string;
  completedAt: string;
  timeTaken: number;
  score: number;
  maxScore: number;
  steps: QuizStep[];
}


// apiServices.ts interfaces
export interface StartRunPayload {
  carModelCode: string;
  carColourCode?: string;
  languageCode?: string;
}

// Based on the Session Start Response contract
export interface StartRunData {
  runId: string;
  pointsPerCorrect: number;
  penaltyPerWrong: number;
  maxWrongAttempts: number;
  maxScore: number;
  carModel: { code: string; name: string };
  languageCode: string;
  availableLanguages: string[];
  questions: any[];
}

export interface GameChoice {
  processId: string;
  isCorrect: boolean;
  names: Record<string, string>; // e.g., { en: "Degreasing", hi: "डीग्रीसिंग" }
}

export interface GameStepContent {
  questionText: string;
  initialVisualText: string;
  hints: string[][]; // Array of arrays based on your JSON schema
}

export interface GameStep {
  stepNo: number;
  processId: string;
  shownProcessIds: string[];
  carVisualBefore: string;
  carVisualAfter: string;
  successVideo: string;
  content: Record<string, GameStepContent>; // e.g., { en: { ... }, hi: { ... } }
  choices: GameChoice[];
}

export interface StartRunResponse {
  success: boolean;
  data: StartRunData;
}

// Matches BatchAnswerDto
export interface BatchAnswerPayload {
  questionId: string;
  chosenProcessId: string;
  wrongAttempts?: number;
  timeTaken?: number;
}

// Matches SubmitBatchDto
export interface SubmitBatchPayload {
  answers: Array<{
    questionId: string;
    timeTaken: number;
    hintUsed: number;
    answers: Array<{
      attemptNo: number;
      chosenProcessId: string;
      isCorrect: boolean;
    }>;
  }>;
  carColourId?: string;
}

// The exact response from submit depends on your backend, but usually includes score/band
export interface SubmitBatchResponse {
  runId: string;
  score: number;
  maxScore: number;
  judgementBand?: any; 
}
