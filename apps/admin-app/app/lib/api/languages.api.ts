import { apiClient } from "./client";
import type { Language } from "../../types/master-data.types";

export interface CreateLanguageInput {
  code: string;
  name: string;
  isActive?: boolean;
}

export type UpdateLanguageInput = Partial<CreateLanguageInput>;

export function fetchLanguages(): Promise<Language[]> {
  return apiClient.get<Language[]>("/admin/languages");
}

export function fetchLanguage(id: string): Promise<Language> {
  return apiClient.get<Language>(`/admin/languages/${id}`);
}

export function createLanguage(input: CreateLanguageInput): Promise<Language> {
  return apiClient.post<Language>("/admin/languages", input);
}

export function updateLanguage(id: string, input: UpdateLanguageInput): Promise<Language> {
  return apiClient.patch<Language>(`/admin/languages/${id}`, input);
}

export function deleteLanguage(id: string): Promise<Language> {
  return apiClient.delete<Language>(`/admin/languages/${id}`);
}
