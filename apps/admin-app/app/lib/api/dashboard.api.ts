import { apiClient } from "./client";

export interface DashboardKpis {
  totalParticipants: number;
  participantsThisMonth: number;
  sessionsToday: number;
  sessionsYesterday: number;
  passRate: number;
  passRateDelta: number;
  avgScore: number;
  avgScoreDelta: number;
}

export interface PerformanceLevel {
  name: string;
  code: string;
  color: string | null;
  count: number;
  pct: number;
}

export interface DesignationStat {
  name: string;
  participants: number;
  avgScore: number;
  passRate: number;
}

export interface PlantStat {
  name: string;
  participants: number;
  avgScore: number;
  passRate: number;
}

export interface LineStat {
  name: string;
  participants: number;
  avgScore: number;
  passRate: number;
}

export interface RecentActivityItem {
  participantId: string;
  name: string;
  desg: string;
  pct: number;
  passed: boolean;
  completedAt: string | null;
}

export interface DashboardData {
  kpis: DashboardKpis;
  performanceDistribution: {
    totalAttempts: number;
    levels: PerformanceLevel[];
  };
  designationStats: DesignationStat[];
  plantStats: PlantStat[];
  lineStats: LineStat[];
  recentActivity: RecentActivityItem[];
}

export interface DashboardChartFilters {
  designationId?: string;
  plantId?: string;
  lineId?: string;
  period?: "ALL" | "WEEKLY" | "MONTHLY" | "DATE_RANGE";
  from?: string;
  to?: string;
}

export interface MonthlyParticipantsFilters extends DashboardChartFilters {
  year?: number;
}

export interface ScoreBreakdownFilters extends DashboardChartFilters {
  from?: string;
  to?: string;
}

export interface MonthlyParticipantPoint {
  month: string;
  monthIndex: number;
  participants: number;
}

export interface MonthlyParticipantsData {
  year: number;
  totalParticipants: number;
  months: MonthlyParticipantPoint[];
}

export interface ScoreBucket {
  code: string;
  label: string;
  color: string;
  count: number;
  pct: number;
}

export interface ScoreBreakdownData {
  totalAttempts: number;
  buckets: ScoreBucket[];
}

export interface PeriodFilters {
  period?: "ALL" | "WEEKLY" | "MONTHLY" | "DATE_RANGE";
  from?: string;
  to?: string;
}

export interface DesignationScoreRow {
  id: string;
  name: string;
  totalAttempts: number;
  buckets: ScoreBucket[];
}

export interface DesignationScoreBreakdownData {
  totalAttempts: number;
  buckets: Pick<ScoreBucket, "code" | "label" | "color">[];
  designations: DesignationScoreRow[];
}

export interface LineDistributionRow {
  id: string;
  name: string;
  color: string;
  count: number;
  pct: number;
  avgScore: number;
}

export interface LineDistributionData {
  totalAttempts: number;
  lines: LineDistributionRow[];
}

export function fetchDashboard(): Promise<DashboardData> {
  return apiClient.get<DashboardData>("/admin/reports/dashboard");
}

function chartQuery<T extends object>(params: T) {  const q = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") q.set(key, String(value));
  }
  const query = q.toString();
  return query ? `?${query}` : "";
}

export function fetchMonthlyParticipants(
  filters: MonthlyParticipantsFilters,
): Promise<MonthlyParticipantsData> {
  return apiClient.get<MonthlyParticipantsData>(
    `/admin/reports/dashboard/monthly-participants${chartQuery(filters)}`,
  );
}

export function fetchScoreBreakdown(
  filters: ScoreBreakdownFilters,
): Promise<ScoreBreakdownData> {
  return apiClient.get<ScoreBreakdownData>(
    `/admin/reports/dashboard/score-breakdown${chartQuery(filters)}`,
  );
}

export function fetchDesignationScoreBreakdown(
  filters: PeriodFilters,
): Promise<DesignationScoreBreakdownData> {
  return apiClient.get<DesignationScoreBreakdownData>(
    `/admin/reports/dashboard/designation-score-breakdown${chartQuery(filters)}`,
  );
}

export function fetchLineDistribution(
  filters: PeriodFilters,
): Promise<LineDistributionData> {
  return apiClient.get<LineDistributionData>(
    `/admin/reports/dashboard/line-distribution${chartQuery(filters)}`,
  );
}

export interface ReportOverviewFilters {
  designation?: string;
  plant?: string;
  line?: string;
  days?: number;
}

export interface ReportOverviewLineStat {
  id: string;
  name: string;
  code: string;
  participants: number;
  attempts: number;
  avgScore: number;
  passRate: number;
}

export interface ReportOverviewTopPerformer {
  id: string;
  name: string;
  code: string;
  desg: string;
  avgScore: number;
  attempts: number;
  initials: string;
}

export interface ReportOverviewHardestQuestion {
  id: string;
  text: string;
  type: string;
  difficulty: number | null;
  attempts: number;
  correctRate: number;
}

export interface ReportOverviewData {
  kpis: DashboardKpis;
  performanceDistribution: {
    totalAttempts: number;
    levels: PerformanceLevel[];
  };
  designationStats: DesignationStat[];
  plantStats: PlantStat[];
  lineStats: ReportOverviewLineStat[];
  topPerformers: ReportOverviewTopPerformer[];
  hardestQuestions: ReportOverviewHardestQuestion[];
}

export function fetchReportOverview(
  filters: ReportOverviewFilters,
): Promise<ReportOverviewData> {
  return apiClient.get<ReportOverviewData>(
    `/admin/reports/dashboard/overview${chartQuery(filters)}`,
  );
}
