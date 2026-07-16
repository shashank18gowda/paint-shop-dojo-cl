"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { startQuiz, submitQuiz, fetchAttemptHistory, fetchAttemptReview, fetchQuizEligibility } from "../api/quiz.api";
import { QUERY_KEYS } from "../../constants/queryKeys";
import type { Answer } from "../../types/api.types";

export function useQuizEligibility() {
  return useQuery({
    queryKey: QUERY_KEYS.quizEligibility,
    queryFn: fetchQuizEligibility,
    staleTime: 60_000,
  });
}

// Modeled as a query (not a mutation) so React Query's own cache-dedup by
// queryKey absorbs React Strict Mode's dev-only double-effect-invocation —
// two callers with the same key share one in-flight request instead of each
// creating their own session. `mountId` should be a value that's stable for
// the lifetime of one quiz attempt (e.g. from `useState(() => crypto.randomUUID())`)
// so a genuine new attempt still starts a fresh session.
export function useStartQuiz(mountId: string, language: string, questionCount: number, enabled: boolean) {
  return useQuery({
    queryKey: QUERY_KEYS.quizSession(mountId),
    queryFn: () => startQuiz(language, questionCount),
    enabled,
    staleTime: Infinity,
    retry: false,
  });
}

export function useSubmitQuiz() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, answers, totalQuestions }: { sessionId: string; answers: Answer[]; totalQuestions?: number }) =>
      submitQuiz(sessionId, answers, totalQuestions),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.quizEligibility });
    },
  });
}

export function useAttemptHistory(sort: string) {
  return useQuery({
    queryKey: QUERY_KEYS.attemptHistory(sort),
    queryFn: () => fetchAttemptHistory(sort),
    staleTime: 30_000,
  });
}

export function useAttemptReview(attemptId: string, lang: string) {
  return useQuery({
    queryKey: QUERY_KEYS.attemptReview(attemptId),
    queryFn: () => fetchAttemptReview(attemptId, lang),
    staleTime: Infinity,
    enabled: !!attemptId,
  });
}

