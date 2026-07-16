import { API_BASE } from "./client";
import { useSessionStore } from "../../store/session";

async function downloadFile(endpoint: string, filename: string): Promise<void> {
  const token = useSessionStore.getState().token;
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    if (res.status === 401) {
      useSessionStore.getState().clearSession();
      if (typeof window !== "undefined") window.location.replace("/login");
      throw new Error("Session expired. Please log in again.");
    }
    throw new Error(`HTTP ${res.status}`);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export interface SessionsExportFilters {
  designationId?: string;
  plantId?: string;
  lineId?: string;
  status?: string;
  period?: "ALL" | "WEEKLY" | "MONTHLY" | "DATE_RANGE";
  from?: string;
  to?: string;
}

export function downloadSessionsExport(filters: SessionsExportFilters = {}): Promise<void> {
  const q = new URLSearchParams();
  if (filters.designationId) q.set("designationId", filters.designationId);
  if (filters.plantId) q.set("plantId", filters.plantId);
  if (filters.lineId) q.set("lineId", filters.lineId);
  if (filters.status) q.set("status", filters.status);
  if (filters.period) q.set("period", filters.period);
  if (filters.from) q.set("from", filters.from);
  if (filters.to) q.set("to", filters.to);
  const qs = q.toString();
  return downloadFile(`/admin/export/sessions${qs ? `?${qs}` : ""}`, `sessions-${Date.now()}.csv`);
}

export interface ReportOverviewExportFilters {
  designation?: string;
  plant?: string;
  line?: string;
  days?: number;
  period?: "DAILY" | "WEEKLY" | "MONTHLY" | "DATE_RANGE";
  from?: string;
  to?: string;
}

export function downloadReportOverviewExport(filters: ReportOverviewExportFilters): Promise<void> {
  const q = new URLSearchParams();
  if (filters.designation) q.set("designation", filters.designation);
  if (filters.plant) q.set("plant", filters.plant);
  if (filters.line) q.set("line", filters.line);
  if (filters.days) q.set("days", String(filters.days));
  if (filters.period) q.set("period", filters.period);
  if (filters.from) q.set("from", filters.from);
  if (filters.to) q.set("to", filters.to);
  const qs = q.toString();
  return downloadFile(`/admin/export/reports-overview${qs ? `?${qs}` : ""}`, `report-overview-${Date.now()}.xlsx`);
}

export interface ParticipantRankingsExportFilters {
  search?: string;
  designationId?: string;
  lineId?: string;
  plantId?: string;
  performanceLevelCode?: string;
  sortBy?: string;
  sortDir?: string;
}

export function downloadParticipantRankingsExport(filters: ParticipantRankingsExportFilters): Promise<void> {
  const q = new URLSearchParams();
  if (filters.search) q.set("search", filters.search);
  if (filters.designationId) q.set("designationId", filters.designationId);
  if (filters.lineId) q.set("lineId", filters.lineId);
  if (filters.plantId) q.set("plantId", filters.plantId);
  if (filters.performanceLevelCode) q.set("performanceLevelCode", filters.performanceLevelCode);
  if (filters.sortBy) q.set("sortBy", filters.sortBy);
  if (filters.sortDir) q.set("sortDir", filters.sortDir);
  const qs = q.toString();
  return downloadFile(`/admin/export/participant-rankings${qs ? `?${qs}` : ""}`, `participant-rankings-${Date.now()}.csv`);
}
