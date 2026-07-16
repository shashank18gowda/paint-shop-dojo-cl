"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchQuestions,
  fetchQuestion,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  type FetchQuestionsParams,
  type CreateQuestionInput,
  type UpdateQuestionInput,
} from "../api/questions.api";

const Q_KEY = ["questions"] as const;

export function useQuestions(params: FetchQuestionsParams) {
  return useQuery({
    queryKey: [...Q_KEY, params],
    queryFn: () => fetchQuestions(params),
    placeholderData: (prev) => prev,
  });
}

export function useQuestion(id: string) {
  return useQuery({
    queryKey: [...Q_KEY, id],
    queryFn: () => fetchQuestion(id),
    enabled: !!id && id !== "new",
  });
}

export function useCreateQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateQuestionInput) => createQuestion(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: Q_KEY });
    },
  });
}

export function useUpdateQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateQuestionInput }) =>
      updateQuestion(id, input),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: Q_KEY });
      qc.invalidateQueries({ queryKey: [...Q_KEY, id] });
    },
  });
}

export function useDeleteQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteQuestion(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: Q_KEY });
    },
  });
}
