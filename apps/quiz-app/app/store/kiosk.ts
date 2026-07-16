import { create } from "zustand";
import { persist } from "zustand/middleware";

export type KioskMode = "quiz" | "game";

interface KioskState {
  // null = this device has not been configured yet (first run / data was cleared)
  mode: KioskMode | null;
  setMode: (mode: KioskMode) => void;
}

// Per-DEVICE config (not per-participant). Persisted to localStorage so it
// survives navigation and refreshes. localStorage has no expiry, but it CAN be
// wiped (browser "clear data on exit", kiosk session reset, private mode). To
// stay self-healing, the kiosk's locked start URL should carry `?kiosk=quiz|game`
// — KioskGuard re-applies it on every launch, so a wipe recovers on next boot.
export const useKioskStore = create<KioskState>()(
  persist(
    (set) => ({
      mode: null,
      setMode: (mode) => set({ mode }),
    }),
    { name: "kiosk" }
  )
);
