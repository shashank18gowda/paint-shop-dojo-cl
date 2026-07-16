"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchLanguages,
  fetchLanguage,
  createLanguage,
  updateLanguage,
  deleteLanguage,
  type CreateLanguageInput,
  type UpdateLanguageInput,
} from "../api/languages.api";

const LANG_KEY = ["languages"] as const;
const langOneKey = (id: string) => ["languages", id] as const;

export function useLanguages() {
  return useQuery({
    queryKey: LANG_KEY,
    queryFn: fetchLanguages,
  });
}

export function useLanguage(id: string) {
  return useQuery({
    queryKey: langOneKey(id),
    queryFn: () => fetchLanguage(id),
    enabled: !!id,
  });
}

export function useCreateLanguage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateLanguageInput) => createLanguage(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: LANG_KEY });
    },
  });
}

export function useUpdateLanguage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateLanguageInput }) =>
      updateLanguage(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: LANG_KEY });
    },
  });
}

export function useDeleteLanguage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteLanguage(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: LANG_KEY });
    },
  });
}
