import { useSessionStore } from "../../store/session";
import { API_BASE } from "../env";

export { API_BASE };

async function unwrap<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  return (json.data ?? json) as T;
}

function authHeader(): Record<string, string> {
  const token = useSessionStore.getState().token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const apiClient = {
  get<T>(endpoint: string): Promise<T> {
    return fetch(`${API_BASE}${endpoint}`, {
      headers: authHeader(),
    }).then(unwrap<T>);
  },

  post<T>(endpoint: string, body: unknown): Promise<T> {
    return fetch(`${API_BASE}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify(body),
    }).then(unwrap<T>);
  },

  patch<T>(endpoint: string, body: unknown): Promise<T> {
    return fetch(`${API_BASE}${endpoint}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify(body),
    }).then(unwrap<T>);
  },

  postForm<T>(endpoint: string, form: FormData): Promise<T> {
    return fetch(`${API_BASE}${endpoint}`, {
      method: "POST",
      headers: authHeader(),
      body: form,
    }).then(unwrap<T>);
  },

  publicGet<T>(endpoint: string): Promise<T> {
    return fetch(`${API_BASE}${endpoint}`).then(unwrap<T>);
  },

  publicPost<T>(endpoint: string, body: unknown): Promise<T> {
    return fetch(`${API_BASE}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(unwrap<T>);
  },
};
