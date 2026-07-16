"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchParticipants,
  fetchParticipant,
  fetchParticipantStats,
  fetchParticipantHistory,
  fetchParticipantCertificates,
  fetchAttemptReview,
  createParticipant,
  updateParticipant,
  deleteParticipant,
  type FetchParticipantsParams,
  type CreateParticipantInput,
  type UpdateParticipantInput,
} from "../api/participants.api";

const P_KEY = ["participants"] as const;

export function useParticipants(params: FetchParticipantsParams) {
  return useQuery({
    queryKey: [...P_KEY, params],
    queryFn: () => fetchParticipants(params),
    placeholderData: (prev) => prev,
  });
}

export function useParticipant(id: string) {
  return useQuery({
    queryKey: [...P_KEY, id],
    queryFn: () => fetchParticipant(id),
    enabled: !!id,
  });
}

export function useParticipantStats(id: string) {
  return useQuery({
    queryKey: [...P_KEY, id, "stats"],
    queryFn: () => fetchParticipantStats(id),
    enabled: !!id,
  });
}

export function useParticipantHistory(id: string) {
  return useQuery({
    queryKey: [...P_KEY, id, "history"],
    queryFn: () => fetchParticipantHistory(id),
    enabled: !!id,
  });
}

export function useParticipantCertificates(id: string) {
  return useQuery({
    queryKey: [...P_KEY, id, "certificates"],
    queryFn: () => fetchParticipantCertificates(id),
    enabled: !!id,
  });
}

export function useAttemptReview(participantId: string, attemptId: string) {
  return useQuery({
    queryKey: [...P_KEY, participantId, "attempts", attemptId, "review"],
    queryFn: () => fetchAttemptReview(participantId, attemptId),
    enabled: !!participantId && !!attemptId,
  });
}

export function useCreateParticipant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateParticipantInput) => createParticipant(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: P_KEY });
    },
  });
}

export function useUpdateParticipant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateParticipantInput }) =>
      updateParticipant(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: P_KEY });
    },
  });
}

export function useDeleteParticipant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteParticipant(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: P_KEY });
    },
  });
}
