"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useKioskStore, type KioskMode } from "../store/kiosk";

/**
 * Resolves this device's kiosk mode on every launch:
 *  1. If the URL carries `?kiosk=quiz|game` (the kiosk's locked start URL),
 *     that wins and is persisted — this is what makes the config self-healing
 *     after any localStorage wipe.
 *  2. Otherwise fall back to the stored mode.
 *  3. If still unset, send the device to the one-time /kiosk-setup screen.
 */
export default function KioskGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const mode = useKioskStore((s) => s.mode);
  const setMode = useKioskStore((s) => s.setMode);

  // Wait for zustand's localStorage rehydration before deciding to redirect,
  // so we don't bounce a configured kiosk to setup on first paint.
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("kiosk");
    if (q === "quiz" || q === "game") setMode(q as KioskMode);
    setReady(true);
  }, [setMode]);

  useEffect(() => {
    if (ready && mode === null && pathname !== "/kiosk-setup") {
      router.replace("/kiosk-setup");
    }
  }, [ready, mode, pathname, router]);

  return <>{children}</>;
}
