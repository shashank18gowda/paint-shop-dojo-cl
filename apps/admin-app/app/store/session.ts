"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Admin {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "SUPER_ADMIN";
}

interface SessionState {
  token: string | null;
  admin: Admin | null;
  setSession: (token: string, admin: Admin) => void;
  clearSession: () => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      token: null,
      admin: null,
      setSession: (token, admin) => set({ token, admin }),
      clearSession: () => set({ token: null, admin: null }),
    }),
    {
      name: "admin-session",
    },
  ),
);
