import { apiClient } from "./client";
import type { EmailDispatchHistoryResult, ReportType } from "../../types/master-data.types";

export interface EmailDispatchHistoryFilters {
  recipientId?: string;
  reportType?: ReportType;
  status?: "SUCCESS" | "FAILED";
  page?: number;
  limit?: number;
}

export function fetchEmailDispatchHistory(filters: EmailDispatchHistoryFilters = {}): Promise<EmailDispatchHistoryResult> {
  const q = new URLSearchParams();
  if (filters.recipientId) q.set("recipientId", filters.recipientId);
  if (filters.reportType) q.set("reportType", filters.reportType);
  if (filters.status) q.set("status", filters.status);
  if (filters.page) q.set("page", String(filters.page));
  if (filters.limit) q.set("limit", String(filters.limit));
  const qs = q.toString();
  return apiClient.get<EmailDispatchHistoryResult>(`/admin/report-scheduler/history${qs ? `?${qs}` : ""}`);
}

export interface TriggerReportResult {
  reportType: ReportType;
  recipients: number;
  sent: number;
  skipped: number;
  failed: number;
}

export function triggerReportDispatch(reportType: ReportType): Promise<TriggerReportResult> {
  return apiClient.post<TriggerReportResult>(`/admin/report-scheduler/trigger/${reportType}`, {});
}
