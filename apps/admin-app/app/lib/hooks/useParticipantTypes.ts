"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchParticipantTypes,
  fetchParticipantType,
  createParticipantType,
  updateParticipantType,
  deleteParticipantType,
  type CreateParticipantTypeInput,
  type UpdateParticipantTypeInput,
} from "../api/participant-types.api";

const PT_KEY = ["participant-types"] as const;
const ptOneKey = (id: string) => ["participant-types", id] as const;

export function useParticipantTypes() {
  return useQuery({
    queryKey: PT_KEY,
    queryFn: fetchParticipantTypes,
  });
}

export function useParticipantType(id: string) {
  return useQuery({
    queryKey: ptOneKey(id),
    queryFn: () => fetchParticipantType(id),
    enabled: !!id,
  });
}

export function useCreateParticipantType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateParticipantTypeInput) => createParticipantType(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PT_KEY });
    },
  });
}

export function useUpdateParticipantType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateParticipantTypeInput }) =>
      updateParticipantType(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PT_KEY });
    },
  });
}

export function useDeleteParticipantType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteParticipantType(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PT_KEY });
    },
  });
}
