"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchLines,
  createLine,
  updateLine,
  deleteLine,
  type CreateLineInput,
  type UpdateLineInput,
} from "../api/lines.api";

const LINES_KEY = ["lines"] as const;

export function useLines() {
  return useQuery({
    queryKey: LINES_KEY,
    queryFn: fetchLines,
  });
}

export function useCreateLine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateLineInput) => createLine(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: LINES_KEY });
    },
  });
}

export function useUpdateLine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateLineInput }) => updateLine(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: LINES_KEY });
    },
  });
}

export function useDeleteLine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteLine(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: LINES_KEY });
    },
  });
}
