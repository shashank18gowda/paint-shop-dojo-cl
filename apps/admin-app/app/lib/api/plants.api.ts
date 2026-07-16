import { apiClient } from "./client";
import type { Plant } from "../../types/master-data.types";

export interface CreatePlantInput {
  code: string;
  name: string;
  location?: string;
  description?: string;
  sortOrder?: number;
}

export interface UpdatePlantInput {
  code?: string;
  name?: string;
  location?: string;
  description?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export function fetchPlants(): Promise<Plant[]> {
  return apiClient.get<Plant[]>("/admin/plants");
}

export function fetchPlant(id: string): Promise<Plant> {
  return apiClient.get<Plant>(`/admin/plants/${id}`);
}

export function createPlant(input: CreatePlantInput): Promise<Plant> {
  return apiClient.post<Plant>("/admin/plants", input);
}

export function updatePlant(id: string, input: UpdatePlantInput): Promise<Plant> {
  return apiClient.patch<Plant>(`/admin/plants/${id}`, input);
}

export function deletePlant(id: string): Promise<void> {
  return apiClient.delete(`/admin/plants/${id}`);
}
