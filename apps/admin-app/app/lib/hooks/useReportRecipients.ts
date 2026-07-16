"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchReportRecipients,
  createReportRecipient,
  updateReportRecipient,
  deleteReportRecipient,
  updateReportAccess,
  type CreateReportRecipientInput,
  type UpdateReportRecipientInput,
  type UpdateReportAccessInput,
} from "../api/report-recipients.api";

const REPORT_RECIPIENTS_KEY = ["report-recipients"] as const;

export function useReportRecipients() {
  return useQuery({
    queryKey: REPORT_RECIPIENTS_KEY,
    queryFn: fetchReportRecipients,
  });
}

export function useCreateReportRecipient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateReportRecipientInput) => createReportRecipient(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: REPORT_RECIPIENTS_KEY });
    },
  });
}

export function useUpdateReportRecipient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateReportRecipientInput }) =>
      updateReportRecipient(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: REPORT_RECIPIENTS_KEY });
    },
  });
}

export function useDeleteReportRecipient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteReportRecipient(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: REPORT_RECIPIENTS_KEY });
    },
  });
}

export function useUpdateReportAccess() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateReportAccessInput }) =>
      updateReportAccess(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: REPORT_RECIPIENTS_KEY });
    },
  });
}
