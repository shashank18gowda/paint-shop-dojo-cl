import { apiClient } from "./client";
import type { QuizSession, QuizSubmitResult, Answer, AttemptHistoryItem, AttemptReview, QuizEligibility } from "../../types/api.types";

export function fetchQuizEligibility(): Promise<QuizEligibility> {
  return apiClient.get<QuizEligibility>("/quiz/eligibility");
}

export function startQuiz(language: string, questionCount: number): Promise<QuizSession> {
  return apiClient.post<QuizSession>("/quiz/sessions", { language, questionCount });
}

export function submitQuiz(sessionId: string, answers: Answer[], totalQuestions?: number): Promise<QuizSubmitResult> {
  return apiClient.post<QuizSubmitResult>(`/quiz/sessions/${sessionId}/submit`, { answers, totalQuestions });
}

export function fetchAttemptHistory(sort: string): Promise<AttemptHistoryItem[]> {
  return apiClient.get<AttemptHistoryItem[]>(`/quiz/history?sort=${sort}`);
}

export function fetchAttemptReview(attemptId: string, lang: string): Promise<AttemptReview> {
  return apiClient.get<AttemptReview>(`/quiz/attempts/${attemptId}/review?lang=${lang}`);
}
