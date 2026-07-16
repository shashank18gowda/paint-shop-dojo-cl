import { apiClient } from "./client";
import type { ReportRecipient } from "../../types/master-data.types";

export interface CreateReportRecipientInput {
  email: string;
  name?: string;
  notes?: string;
  isActive?: boolean;
}

export type UpdateReportRecipientInput = Partial<CreateReportRecipientInput>;

export interface UpdateReportAccessInput {
  daily?: boolean;
  weekly?: boolean;
  monthly?: boolean;
}

export function fetchReportRecipients(): Promise<ReportRecipient[]> {
  return apiClient.get<ReportRecipient[]>("/admin/report-recipients");
}

export function createReportRecipient(input: CreateReportRecipientInput): Promise<ReportRecipient> {
  return apiClient.post<ReportRecipient>("/admin/report-recipients", input);
}

export function updateReportRecipient(id: string, input: UpdateReportRecipientInput): Promise<ReportRecipient> {
  return apiClient.patch<ReportRecipient>(`/admin/report-recipients/${id}`, input);
}

export function deleteReportRecipient(id: string): Promise<ReportRecipient> {
  return apiClient.delete<ReportRecipient>(`/admin/report-recipients/${id}`);
}

export function updateReportAccess(id: string, input: UpdateReportAccessInput): Promise<ReportRecipient> {
  return apiClient.patch<ReportRecipient>(`/admin/report-recipients/${id}/access`, input);
}
