"use client";

import { useEffect, useRef, useState } from "react";
import { useSessionStore } from "../store/session";
import { useEndSession } from "../lib/hooks/useEndSession";

const IDLE_SECS = 5 * 60;
const WARN_SECS = 30;

export function IdleGuard() {
  const participant = useSessionStore((s) => s.participant);
  const endSession = useEndSession();

  const lastActivityRef = useRef(Date.now());
  const [warnCountdown, setWarnCountdown] = useState<number | null>(null);

  useEffect(() => {
    if (!participant) return;

    lastActivityRef.current = Date.now();
    const bump = () => { lastActivityRef.current = Date.now(); };
    const events = ["mousemove", "keydown", "touchstart", "click", "scroll"] as const;
    events.forEach((e) => window.addEventListener(e, bump, { passive: true }));

    const tick = setInterval(() => {
      const idleSecs = Math.floor((Date.now() - lastActivityRef.current) / 1000);
      const remaining = IDLE_SECS - idleSecs;

      if (remaining <= 0) {
        clearInterval(tick);
        endSession();
      } else if (remaining <= WARN_SECS) {
        setWarnCountdown(remaining);
      } else {
        setWarnCountdown(null);
      }
    }, 1000);

    return () => {
      events.forEach((e) => window.removeEventListener(e, bump));
      clearInterval(tick);
      setWarnCountdown(null);
    };
  }, [participant, endSession]);

  if (!participant || warnCountdown === null) return null;

  return (
    <div
      style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 9999,
        padding: "16px 24px",
        background: "rgba(10,10,10,0.92)",
        backdropFilter: "blur(10px)",
        borderTop: "2px solid #EB0A1E",
      }}
    >
      <div style={{ maxWidth: 480, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <div>
          <p style={{ color: "#fff", fontWeight: 700, fontSize: 14, margin: 0 }}>
            Session ending in {warnCountdown}s
          </p>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, margin: "2px 0 0" }}>
            Tap anywhere to stay logged in
          </p>
        </div>
        <button
          onClick={endSession}
          style={{
            background: "#EB0A1E", color: "#fff", border: "none",
            borderRadius: 24, padding: "10px 20px",
            fontWeight: 700, fontSize: 14, cursor: "pointer", whiteSpace: "nowrap",
          }}
        >
          End Now
        </button>
      </div>
    </div>
  );
}
