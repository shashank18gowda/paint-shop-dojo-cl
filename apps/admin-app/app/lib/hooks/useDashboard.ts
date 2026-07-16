"use client";

import { useQuery } from "@tanstack/react-query";
import {
  fetchDashboard,
  fetchDesignationScoreBreakdown,
  fetchLineDistribution,
  fetchMonthlyParticipants,
  fetchScoreBreakdown,
  type MonthlyParticipantsFilters,
  type PeriodFilters,
  type ScoreBreakdownFilters,
} from "../api/dashboard.api";

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchDashboard,
    refetchInterval: 60_000, // auto-refresh every 60s
    staleTime: 30_000,
  });
}

export function useMonthlyParticipants(filters: MonthlyParticipantsFilters) {
  return useQuery({
    queryKey: ["dashboard", "monthly-participants", filters],
    queryFn: () => fetchMonthlyParticipants(filters),
    staleTime: 30_000,
  });
}

export function useScoreBreakdown(filters: ScoreBreakdownFilters) {
  return useQuery({
    queryKey: ["dashboard", "score-breakdown", filters],
    queryFn: () => fetchScoreBreakdown(filters),
    staleTime: 30_000,
  });
}

export function useDesignationScoreBreakdown(filters: PeriodFilters) {
  return useQuery({
    queryKey: ["dashboard", "designation-score-breakdown", filters],
    queryFn: () => fetchDesignationScoreBreakdown(filters),
    staleTime: 30_000,
  });
}

export function useLineDistribution(filters: PeriodFilters) {
  return useQuery({
    queryKey: ["dashboard", "line-distribution", filters],
    queryFn: () => fetchLineDistribution(filters),
    staleTime: 30_000,
  });
}
