import { apiClient } from "./client";
import type { Designation } from "../../types/master-data.types";

export interface CreateDesignationInput {
  code: string;
  name: string;
  description?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export type UpdateDesignationInput = Partial<CreateDesignationInput>;

export function fetchDesignations(): Promise<Designation[]> {
  return apiClient.get<Designation[]>("/admin/designations");
}

export function fetchDesignation(id: string): Promise<Designation> {
  return apiClient.get<Designation>(`/admin/designations/${id}`);
}

export function createDesignation(input: CreateDesignationInput): Promise<Designation> {
  return apiClient.post<Designation>("/admin/designations", input);
}

export function updateDesignation(id: string, input: UpdateDesignationInput): Promise<Designation> {
  return apiClient.patch<Designation>(`/admin/designations/${id}`, input);
}

export function deleteDesignation(id: string): Promise<Designation> {
  return apiClient.delete<Designation>(`/admin/designations/${id}`);
}
