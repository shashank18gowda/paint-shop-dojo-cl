import { apiClient } from "./client";
import type { ParticipantType } from "../../types/master-data.types";

export interface CreateParticipantTypeInput {
  code: string;
  name: string;
  sortOrder?: number;
  isActive?: boolean;
}

export type UpdateParticipantTypeInput = Partial<CreateParticipantTypeInput>;

export function fetchParticipantTypes(): Promise<ParticipantType[]> {
  return apiClient.get<ParticipantType[]>("/admin/participant-types");
}

export function fetchParticipantType(id: string): Promise<ParticipantType> {
  return apiClient.get<ParticipantType>(`/admin/participant-types/${id}`);
}

export function createParticipantType(input: CreateParticipantTypeInput): Promise<ParticipantType> {
  return apiClient.post<ParticipantType>("/admin/participant-types", input);
}

export function updateParticipantType(id: string, input: UpdateParticipantTypeInput): Promise<ParticipantType> {
  return apiClient.patch<ParticipantType>(`/admin/participant-types/${id}`, input);
}

export function deleteParticipantType(id: string): Promise<ParticipantType> {
  return apiClient.delete<ParticipantType>(`/admin/participant-types/${id}`);
}
