// Admin-app HTTP client.
// Reads token from the session store (set on login, cleared on logout).

import { useSessionStore } from "../../store/session";
import { API_BASE } from "../env";

async function unwrap<T>(res: Response): Promise<T> {
  if (!res.ok) {
    if (res.status === 401) {
      useSessionStore.getState().clearSession();
      if (typeof window !== "undefined") window.location.replace("/login");
      throw new Error("Session expired. Please log in again.");
    }
    let detail = "";
    try {
      const body = await res.json();
      // Backend wraps errors as { success: false, error: <NestException response> }.
      // NestJS HttpException response is { statusCode, message, error } — we want `message`.
      const raw =
        body?.error?.message ??
        body?.message ??
        (typeof body?.error === "string" ? body.error : null) ??
        body?.error;
      detail = typeof raw === "string" ? raw : raw ? JSON.stringify(raw) : "";
    } catch {
      // ignore parse errors — surface the status alone
    }
    throw new Error(`HTTP ${res.status}${detail ? `: ${detail}` : ""}`);
  }
  if (res.status === 204) return undefined as T;
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

  delete<T>(endpoint: string): Promise<T> {
    return fetch(`${API_BASE}${endpoint}`, {
      method: "DELETE",
      headers: authHeader(),
    }).then(unwrap<T>);
  },

  publicPost<T>(endpoint: string, body: unknown): Promise<T> {
    return fetch(`${API_BASE}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(unwrap<T>);
  },
};

export { API_BASE };
