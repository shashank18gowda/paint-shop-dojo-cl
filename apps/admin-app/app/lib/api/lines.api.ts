import { apiClient } from "./client";
import type { Line } from "../../types/master-data.types";

export interface CreateLineInput {
  code: string;
  name: string;
  sortOrder?: number;
  isActive?: boolean;
}

export type UpdateLineInput = Partial<CreateLineInput>;

export function fetchLines(): Promise<Line[]> {
  return apiClient.get<Line[]>("/admin/lines");
}

export function createLine(input: CreateLineInput): Promise<Line> {
  return apiClient.post<Line>("/admin/lines", input);
}

export function updateLine(id: string, input: UpdateLineInput): Promise<Line> {
  return apiClient.patch<Line>(`/admin/lines/${id}`, input);
}

export function deleteLine(id: string): Promise<Line> {
  return apiClient.delete<Line>(`/admin/lines/${id}`);
}
