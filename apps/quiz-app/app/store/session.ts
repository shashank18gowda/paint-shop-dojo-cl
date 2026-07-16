import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Participant {
  id: string;
  name: string;
  code: string;
  designation: string;
  designationId?: string;
  line: string;
  lineId?: string;
  type: string;
  plant?: string;
  plantId?: string;
  imageUrl?: string | null;
}

interface SessionState {
  token: string | null;
  participant: Participant | null;
  setSession: (token: string, participant: Participant) => void;
  updateParticipant: (updates: Partial<Participant>) => void;
  clearSession: () => void;
}

function setAuthCookie(value: "1" | "") {
  if (typeof document === "undefined") return;
  if (value) {
    document.cookie = "auth-token=1; path=/; SameSite=Strict; max-age=86400";
  } else {
    document.cookie = "auth-token=; path=/; SameSite=Strict; max-age=0";
  }
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      token: null,
      participant: null,
      setSession: (token, participant) => {
        setAuthCookie("1");
        set({ token, participant });
      },
      updateParticipant: (updates) =>
        set((s) => ({
          participant: s.participant ? { ...s.participant, ...updates } : null,
        })),
      clearSession: () => {
        setAuthCookie("");
        set({ token: null, participant: null });
      },
    }),
    {
      name: "session",
      onRehydrateStorage: () => (state) => {
        if (state?.token) setAuthCookie("1");
      },
    }
  )
);
