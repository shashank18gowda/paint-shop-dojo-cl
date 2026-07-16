import { apiClient } from "./client";
import type {
  Language,
  ParticipantType,
  Line,
  Designation,
  Plant,
} from "../../types/api.types";

export function fetchLanguages(): Promise<Language[]> {
  return apiClient.publicGet<Language[]>("/languages");
}

export function fetchLines(): Promise<Line[]> {
  return apiClient.publicGet<Line[]>("/lines");
}

export async function fetchParticipantTypes(): Promise<ParticipantType[]> {
  const data =
    await apiClient.publicGet<ParticipantType[]>("/participant-types");
  return data.sort((a, b) => a.sortOrder - b.sortOrder);
}

export function fetchDesignations(): Promise<Designation[]> {
  return apiClient.publicGet<Designation[]>("/designations");
}

export function fetchPlants(): Promise<Plant[]> {
  return apiClient.publicGet<Plant[]>("/plants");
}
