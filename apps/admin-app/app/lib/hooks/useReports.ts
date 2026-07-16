"use client";

import { useQuery } from "@tanstack/react-query";
import {
  fetchTrend,
  fetchTopPerformers,
  fetchHardestQuestions,
  fetchLineStats,
  fetchParticipantRankings,
  fetchParticipantReportDetail,
  type FetchRankingsParams,
} from "../api/reports.api";

const R_KEY = ["reports"] as const;

export function useReportTrend(days = 30) {
  return useQuery({
    queryKey: [...R_KEY, "trend", days],
    queryFn: () => fetchTrend(days),
    staleTime: 60_000,
  });
}

export function useTopPerformers(limit = 5, designationName?: string,plantName?: string, lineName?: string) {
  return useQuery({
    queryKey: [...R_KEY, "top-performers", limit, designationName, plantName, lineName],
    queryFn: () => fetchTopPerformers(limit, designationName, plantName, lineName),
    staleTime: 60_000,
  });
}

export function useHardestQuestions(limit = 5) {
  return useQuery({
    queryKey: [...R_KEY, "hardest-questions", limit],
    queryFn: () => fetchHardestQuestions(limit),
    staleTime: 60_000,
  });
}

export function useLineStats() {
  return useQuery({
    queryKey: [...R_KEY, "lines"],
    queryFn: fetchLineStats,
    staleTime: 60_000,
  });
}

export function useParticipantReportDetail(id: string) {
  return useQuery({
    queryKey: [...R_KEY, "participants", id, "detail"],
    queryFn: () => fetchParticipantReportDetail(id),
    enabled: !!id,
    staleTime: 60_000,
  });
}

export function useParticipantRankings(params: FetchRankingsParams) {
  return useQuery({
    queryKey: [...R_KEY, "participants", params],
    queryFn: () => fetchParticipantRankings(params),
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  });
}
