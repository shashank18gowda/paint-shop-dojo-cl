import { apiClient } from "./client";

export interface TrendDay {
  date: string;
  passed: number;
  failed: number;
  count: number;
}

export interface TopPerformer {
  id: string;
  name: string;
  code: string;
  desg: string;
  avgScore: number;
  attempts: number;
  initials: string;
}

export interface HardestQuestion {
  id: string;
  text: string;
  type: string;
  difficulty: number | null;
  attempts: number;
  correctRate: number;
}

export interface LineStat {
  id: string;
  name: string;
  code: string;
  attempts: number;
  avgScore: number;
  passRate: number;
}

export interface ParticipantRankRow {
  id: string;
  rank: number;
  name: string;
  code: string;
  initials: string;
  designation: string;
  designationId: string;
  line: string;
  lineId: string;
  attempts: number;
  passRate: number;
  avgScore: number;
  bestScore: number;
  lastAttempt: string | null;
  performance: string;
  performanceCode: string;
  performanceColor: string;
  deltaScore: number;
}

export interface ParticipantRankings {
  data: ParticipantRankRow[];
  total: number;
  page: number;
  limit: number;
  pages: number;
  performanceLevels: { label: string; code: string; color: string }[];
  kpis: {
    totalLearners: number;
    passingLearners: number;
    avgScoreAll: number;
    mostImproved: { name: string; code: string; deltaScore: number } | null;
  };
}

export interface FetchRankingsParams {
  page?: number;
  limit?: number;
  search?: string;
  designationId?: string;
  lineId?: string;
  plantId?: string;
  performanceLevelCode?: string;
  sortBy?: string;
  sortDir?: string;
}

export function fetchTrend(days = 30): Promise<TrendDay[]> {
  return apiClient.get<TrendDay[]>(`/admin/reports/trend?days=${days}`);
}

export function fetchTopPerformers(limit = 5, designationName?: string, plantName?: string, lineName?: string): Promise<TopPerformer[]> {
  const q = new URLSearchParams();
  q.set("limit", String(limit));
  if (designationName) q.set("designationName", designationName);
  if (plantName) q.set("plantName", plantName);
  if (lineName) q.set("lineName", lineName);
  return apiClient.get<TopPerformer[]>(`/admin/reports/top-performers?${q}`);
}

export function fetchHardestQuestions(limit = 5): Promise<HardestQuestion[]> {
  return apiClient.get<HardestQuestion[]>(`/admin/reports/hardest-questions?limit=${limit}`);
}

export function fetchLineStats(): Promise<LineStat[]> {
  return apiClient.get<LineStat[]>("/admin/reports/lines");
}

export interface ParticipantReportDetail {
  ranks: {
    overall: number | null;
    desg: number | null;
    line: number | null;
    totalLearners: number;
    desgLearners: number;
    lineLearners: number;
  };
  performanceDistribution: { name: string; code: string; color: string; count: number }[];
  weakTopics: { id: string; text: string; type: string; attempts: number; correctRate: number }[];
  trendData: { date: string; score: number; passed: boolean }[];
  desgAvg: number;
  lineAvg: number;
}

export function fetchParticipantReportDetail(id: string): Promise<ParticipantReportDetail> {
  return apiClient.get<ParticipantReportDetail>(`/admin/reports/participants/${id}`);
}

export function fetchParticipantRankings(params: FetchRankingsParams): Promise<ParticipantRankings> {
  const q = new URLSearchParams();
  if (params.page) q.set("page", String(params.page));
  if (params.limit) q.set("limit", String(params.limit));
  if (params.search) q.set("search", params.search);
  if (params.designationId) q.set("designationId", params.designationId);
  if (params.lineId) q.set("lineId", params.lineId);
  if (params.plantId) q.set("plantId", params.plantId);
  if (params.performanceLevelCode) q.set("performanceLevelCode", params.performanceLevelCode);
  if (params.sortBy) q.set("sortBy", params.sortBy);
  if (params.sortDir) q.set("sortDir", params.sortDir);
  const qs = q.toString();
  return apiClient.get<ParticipantRankings>(`/admin/reports/participants${qs ? `?${qs}` : ""}`);
}



