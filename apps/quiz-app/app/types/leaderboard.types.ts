export type FilterType = "GLOBAL" | "DAILY" | "WEEKLY" | "MONTHLY";

export interface LeaderboardEntry {
  id: string;
  rank: number;
  score: number;
  percentage: number;
  createdAt: string;
  participant: { name: string; code: string; imageUrl: string | null; line: { name: string } | null };
  designation: { name: string };
  attempt: { session: { durationSeconds: number | null } };
}
