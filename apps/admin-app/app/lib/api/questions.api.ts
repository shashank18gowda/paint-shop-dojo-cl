import { apiClient } from "./client";

export type QuestionType = "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "TRUE_FALSE";

export interface QuestionListItem {
  id: string;
  type: QuestionType;
  difficulty: number | null;
  points: number;
  timeLimit: number;
  isActive: boolean;
  shuffleOptions: boolean;
  createdAt: string;
  updatedAt: string;
  langs: string[];
  optionsCount: number;
  englishText: string | null;
}

export interface PaginatedQuestions {
  data: QuestionListItem[];
  total: number;
  page: number;
  limit: number;
}

export interface TranslationItem {
  languageCode: string;
  text: string;
}

export interface OptionItem {
  id: string;
  isCorrect: boolean;
  order: number;
  translations: TranslationItem[];
}

export interface QuestionDetail {
  id: string;
  type: QuestionType;
  difficulty: number | null;
  points: number;
  timeLimit: number;
  isActive: boolean;
  shuffleOptions: boolean;
  explanation: string | null;
  createdAt: string;
  updatedAt: string;
  translations: TranslationItem[];
  options: OptionItem[];
}

export interface OptionInput {
  isCorrect: boolean;
  order?: number;
  translations: TranslationItem[];
}

export interface CreateQuestionInput {
  type: QuestionType;
  difficulty?: number;
  points?: number;
  timeLimit?: number;
  shuffleOptions?: boolean;
  isActive?: boolean;
  explanation?: string;
  translations: TranslationItem[];
  options: OptionInput[];
}

export type UpdateQuestionInput = Partial<CreateQuestionInput>;

export interface FetchQuestionsParams {
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
  difficulty?: number;
  isActive?: boolean;
  langCode?: string;
}

export function fetchQuestions(params: FetchQuestionsParams): Promise<PaginatedQuestions> {
  const q = new URLSearchParams();
  if (params.page)       q.set("page",       String(params.page));
  if (params.limit)      q.set("limit",      String(params.limit));
  if (params.search)     q.set("search",     params.search);
  if (params.type)       q.set("type",       params.type);
  if (params.difficulty) q.set("difficulty", String(params.difficulty));
  if (params.isActive !== undefined) q.set("isActive", String(params.isActive));
  if (params.langCode)   q.set("langCode",   params.langCode);
  return apiClient.get<PaginatedQuestions>(`/admin/questions?${q}`);
}

export function fetchQuestion(id: string): Promise<QuestionDetail> {
  return apiClient.get<QuestionDetail>(`/admin/questions/${id}`);
}

export function createQuestion(input: CreateQuestionInput): Promise<QuestionDetail> {
  return apiClient.post<QuestionDetail>("/admin/questions", input);
}

export function updateQuestion(id: string, input: UpdateQuestionInput): Promise<QuestionDetail> {
  return apiClient.patch<QuestionDetail>(`/admin/questions/${id}`, input);
}

export function deleteQuestion(id: string): Promise<{ deleted: boolean }> {
  return apiClient.delete<{ deleted: boolean }>(`/admin/questions/${id}`);
}
