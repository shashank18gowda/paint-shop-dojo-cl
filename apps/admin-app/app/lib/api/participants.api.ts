import { apiClient, API_BASE } from "./client";
import { useSessionStore } from "../../store/session";
import type {
  Participant,
  PaginatedParticipants,
  ParticipantStats,
  SessionAttempt,
  ParticipantCertificate,
  AttemptReview,
} from "../../types/master-data.types";

export interface FetchParticipantsParams {
  page?: number;
  limit?: number;
  search?: string;
  designationId?: string;
  lineId?: string;
  participantTypeId?: string;
  plantId?: string;
}

export interface CreateParticipantInput {
  code: string;
  name: string;
  designationId: string;
  participantTypeId: string;
  lineId: string;
  plantId: string;
}

export type UpdateParticipantInput = Partial<CreateParticipantInput>;

export function fetchParticipants(params: FetchParticipantsParams): Promise<PaginatedParticipants> {
  const q = new URLSearchParams();
  if (params.page) q.set("page", String(params.page));
  if (params.limit) q.set("limit", String(params.limit));
  if (params.search) q.set("search", params.search);
  if (params.designationId) q.set("designationId", params.designationId);
  if (params.lineId) q.set("lineId", params.lineId);
  if (params.participantTypeId) q.set("participantTypeId", params.participantTypeId);
  if (params.plantId) q.set("plantId", params.plantId);
  return apiClient.get<PaginatedParticipants>(`/admin/participants?${q}`);
}

export function fetchParticipant(id: string): Promise<Participant> {
  return apiClient.get<Participant>(`/admin/participants/${id}`);
}

export function fetchParticipantStats(id: string): Promise<ParticipantStats> {
  return apiClient.get<ParticipantStats>(`/admin/participants/${id}/stats`);
}

export function createParticipant(input: CreateParticipantInput): Promise<Participant> {
  return apiClient.post<Participant>("/admin/participants", input);
}

export function updateParticipant(id: string, input: UpdateParticipantInput): Promise<Participant> {
  return apiClient.patch<Participant>(`/admin/participants/${id}`, input);
}

export function deleteParticipant(id: string): Promise<Participant> {
  return apiClient.delete<Participant>(`/admin/participants/${id}`);
}

export function fetchParticipantHistory(id: string): Promise<SessionAttempt[]> {
  return apiClient.get<SessionAttempt[]>(`/admin/participants/${id}/history`);
}

export function fetchParticipantCertificates(id: string): Promise<ParticipantCertificate[]> {
  return apiClient.get<ParticipantCertificate[]>(`/admin/participants/${id}/certificates`);
}

export function fetchAttemptReview(participantId: string, attemptId: string): Promise<AttemptReview> {
  return apiClient.get<AttemptReview>(`/admin/participants/${participantId}/attempts/${attemptId}/review`);
}

export async function fetchCertificatePdfBlob(attemptId: string): Promise<Blob> {
  const token = useSessionStore.getState().token;
  const res = await fetch(`${API_BASE}/certificates/${attemptId}/download`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.blob();
}

export async function downloadCertificatePdf(attemptId: string, certNo: string): Promise<void> {
  const blob = await fetchCertificatePdfBlob(attemptId);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${certNo}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
