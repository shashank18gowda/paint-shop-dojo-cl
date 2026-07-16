import { useQuery } from "@tanstack/react-query";
import { fetchLeaderboard, type FetchLeaderboardParams, type LeaderboardEntry } from "../api/leaderboard.api";

export function useLeaderboard(params: FetchLeaderboardParams) {
  return useQuery<LeaderboardEntry[], Error>({
    queryKey: ["leaderboard", params],
    queryFn: () => fetchLeaderboard(params),
    staleTime: 30_000,
    retry: 1,
  });
}

export type { FetchLeaderboardParams, LeaderboardEntry, LeaderboardType } from "../api/leaderboard.api";
