export interface QuestionOption {
  id: string;
  /** Option text keyed by language code, e.g. { EN: "…", KN: "…" }. */
  textByLang: Record<string, string>;
}

export interface Question {
  id: string;
  type: string;
  points: number;
  timeLimit: number;
  difficulty: number | null;
  /** Question text keyed by language code, e.g. { EN: "…", KN: "…" }. */
  textByLang: Record<string, string>;
  options: QuestionOption[];
}

export interface QuizLanguage {
  code: string;
  name: string;
}

export interface QuizSession {
  sessionId: string;
  questions: Question[];
  /** Active languages the questions can be displayed in. */
  languages: QuizLanguage[];
}

export interface QuizEligibility {
  eligible: boolean;
  lastAttemptPassed: boolean | null;
  cooldownUntil: string | null;
  daysRemaining: number;
}

export interface QuizSubmitResult {
  attemptId: string;
  score: number;
  maxScore: number;
  percentage: number;
  correctAnswers: number;
  totalQuestions: number;
  performance: { name: string; color: string; code: string } | null;
  durationSeconds: number;
  isPassed: boolean;
}

export interface Answer {
  questionId: string;
  optionId: string;
  timeTaken?: number;
}

export interface AttemptReviewQuestion {
  number: number;
  questionId: string;
  questionText: string;
  isCorrect: boolean;
  timeTaken: number | null;
  yourAnswer: string;
  correctAnswer: string;
  explanation?: string | null;
}

export interface AttemptReview {
  attemptId: string;
  completedAt: string;
  score: number;
  maxScore: number;
  percentage: number;
  correctAnswers: number;
  totalQuestions: number;
  durationSeconds: number | null;
  isPassed: boolean;
  performance: { name: string; color: string; code: string } | null;
  questions: AttemptReviewQuestion[];
}

export interface AttemptHistoryItem {
  sessionId: string;
  attemptId: string | null;
  completedAt: string;
  score: number;
  maxScore: number;
  percentage: number;
  correctAnswers: number;
  totalQuestions: number;
  durationSeconds: number | null;
  isPassed: boolean;
  performance: { name: string; color: string; code: string } | null;
}
