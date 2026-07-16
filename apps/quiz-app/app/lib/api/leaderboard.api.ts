import { apiClient } from "./client";
import type { LeaderboardEntry, FilterType } from "../../types/api.types";

export function fetchLeaderboard(type: FilterType): Promise<LeaderboardEntry[]> {
  return apiClient.publicGet<LeaderboardEntry[]>(`/leaderboard?type=${type}&limit=20`);
}
