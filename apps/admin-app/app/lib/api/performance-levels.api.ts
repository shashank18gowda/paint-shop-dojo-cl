import { apiClient } from "./client";

export interface PerformanceLevel {
  id: string;
  code: string;
  name: string;
  minScore: number;
  maxScore: number;
  color: string | null;
}

export interface CreatePerformanceLevelInput {
  code: string;
  name: string;
  minScore: number;
  maxScore: number;
  color?: string;
}

export interface UpdatePerformanceLevelInput {
  name?: string;
  minScore?: number;
  maxScore?: number;
  color?: string;
}

export function fetchPerformanceLevels(): Promise<PerformanceLevel[]> {
  return apiClient.get<PerformanceLevel[]>("/admin/performance-levels");
}

export function createPerformanceLevel(input: CreatePerformanceLevelInput): Promise<PerformanceLevel> {
  return apiClient.post<PerformanceLevel>("/admin/performance-levels", input);
}

export function updatePerformanceLevel(id: string, input: UpdatePerformanceLevelInput): Promise<PerformanceLevel> {
  return apiClient.patch<PerformanceLevel>(`/admin/performance-levels/${id}`, input);
}

export function deletePerformanceLevel(id: string): Promise<{ deleted: boolean }> {
  return apiClient.delete<{ deleted: boolean }>(`/admin/performance-levels/${id}`);
}
