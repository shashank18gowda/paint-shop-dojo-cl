import { apiClient } from "./client";
import type { LoginResult, RegisterPayload, Participant, ParticipantStats } from "../../types/api.types";


export function login(employeeCode: string): Promise<LoginResult> {
  return apiClient.publicPost<LoginResult>("/auth/login", { employeeCode });
}

export function register(payload: RegisterPayload): Promise<LoginResult> {
  return apiClient.publicPost<LoginResult>("/auth/register", payload);
}

export function uploadPhoto(photo: Blob): Promise<{ imageUrl?: string }> {
  const form = new FormData();
  form.append("photo", photo, "photo.jpg");
  return apiClient.postForm<{ imageUrl?: string }>("/participants/me/photo", form);
}

export function updateProfile(data: { name?: string; designationId?: string; lineId?: string }): Promise<Participant> {
  return apiClient.patch<Participant>("/participants/me", data);
}

export function fetchParticipantStats(code: string): Promise<ParticipantStats> {
  return apiClient.get<ParticipantStats>(`/participants/${code}/stats`);
}
