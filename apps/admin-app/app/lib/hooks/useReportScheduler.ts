"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchEmailDispatchHistory,
  triggerReportDispatch,
  type EmailDispatchHistoryFilters,
} from "../api/report-scheduler.api";

export function useEmailDispatchHistory(filters: EmailDispatchHistoryFilters = {}) {
  return useQuery({
    queryKey: ["email-dispatch-history", filters],
    queryFn: () => fetchEmailDispatchHistory(filters),
  });
}

export function useTriggerReportDispatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: triggerReportDispatch,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["email-dispatch-history"] });
    },
  });
}
