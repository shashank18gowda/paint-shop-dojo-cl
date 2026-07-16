"use client";
import { useQuery } from "@tanstack/react-query";
import { fetchLeaderboard } from "../api/leaderboard.api";
import { QUERY_KEYS } from "../../constants/queryKeys";
import type { FilterType } from "../../types/api.types";

export function useLeaderboard(type: FilterType) {
  return useQuery({
    queryKey: QUERY_KEYS.leaderboard(type),
    queryFn: () => fetchLeaderboard(type),
    staleTime: 30_000,
  });
}
