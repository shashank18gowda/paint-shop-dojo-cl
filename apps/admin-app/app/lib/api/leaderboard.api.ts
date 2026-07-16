import { apiClient } from "./client";

export type LeaderboardType = "GLOBAL" | "MONTHLY" | "WEEKLY" | "DAILY";

export interface LeaderboardEntry {
  id: string;
  rank: number;
  score: number;
  percentage: number;
  participant: {
    name: string;
    code: string;
    imageUrl?: string | null;
    line: { name: string } | null;
  };
  designation: { name: string };
  attempt?: {
    session?: {
      durationSeconds: number | null;
    } | null;
  } | null;
}

export interface FetchLeaderboardParams {
  type?: LeaderboardType;
  limit?: number;
  designationId?: string;
  lineId?: string;
  plantId?: string;
}

export function fetchLeaderboard(params: FetchLeaderboardParams = {}): Promise<LeaderboardEntry[]> {
  const q = new URLSearchParams();
  q.set("type", params.type ?? "GLOBAL");
  q.set("limit", String(params.limit ?? 50));
  if (params.designationId) q.set("designationId", params.designationId);
  if (params.lineId) q.set("lineId", params.lineId);
  if (params.plantId) q.set("plantId", params.plantId);
  return apiClient.get<LeaderboardEntry[]>(`/leaderboard?${q.toString()}`);
}
