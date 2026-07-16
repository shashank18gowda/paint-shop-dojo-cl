"use client";

import { useState } from "react";
import { ChevronLeft, LogoutIcon } from "../icons";
import { useSessionStore } from "../../store/session";
import { useEndSession } from "../../lib/hooks/useEndSession";
import { BACKEND_URL } from "../../lib/env";

function resolveImage(url?: string | null): string | null {
  if (!url) return null;
  return url.startsWith("http") ? url : `${BACKEND_URL}${url}`;
}

function UserChip() {
  const participant = useSessionStore((s) => s.participant);
  if (!participant) return null;

  const avatar = resolveImage(participant.imageUrl);
  const initials = participant.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex items-center gap-2 shrink-0">
      <div className="flex flex-col items-end">
        <span
          className="text-xs font-bold leading-tight"
          style={{ color: "var(--text)" }}
        >
          {participant.name}
        </span>
        <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
          {participant.code}&nbsp;·&nbsp;{participant.designation}&nbsp;·&nbsp;
          {participant.line}&nbsp;·&nbsp;{participant.plant}
        </span>
      </div>
      <div
        className="flex items-center justify-center rounded-full text-xs font-bold overflow-hidden shrink-0"
        style={{
          width: 32,
          height: 32,
          background: "rgba(235,10,30,0.12)",
          color: "#EB0A1E",
        }}
      >
        {avatar ? (
          <img
            src={avatar}
            alt={participant.name}
            className="w-full h-full object-cover"
          />
        ) : (
          initials
        )}
      </div>
    </div>
  );
}

function LogoutButton() {
  const participant = useSessionStore((s) => s.participant);
  const [open, setOpen] = useState(false);
  const endSession = useEndSession();

  if (!participant) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="End session"
        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all"
        style={{
          color: "var(--text-muted)",
          background: "transparent",
          border: "1px solid var(--border)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = "#EB0A1E";
          e.currentTarget.style.borderColor = "#EB0A1E";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = "var(--text-muted)";
          e.currentTarget.style.borderColor = "var(--border)";
        }}
      >
        <LogoutIcon size={14} /> Log out
      </button>
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9000,
            background: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--bg)",
              border: "1px solid var(--border)",
              borderRadius: 20,
              maxWidth: 380,
              width: "100%",
              padding: 28,
              display: "flex",
              flexDirection: "column",
              gap: 20,
              boxShadow:
                "0 24px 60px rgba(0,0,0,0.45), 0 4px 12px rgba(0,0,0,0.25)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                margin: "0 auto",
                width: 52,
                height: 52,
                borderRadius: 14,
                background: "rgba(235,10,30,0.12)",
                color: "#EB0A1E",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <LogoutIcon size={22} />
            </div>
            <div>
              <h3
                style={{
                  color: "var(--text)",
                  fontSize: 19,
                  fontWeight: 700,
                  margin: 0,
                }}
              >
                End session?
              </h3>
              <p
                style={{
                  color: "var(--text-muted)",
                  fontSize: 13,
                  margin: "8px 0 0",
                  lineHeight: 1.55,
                }}
              >
                You&apos;ll be signed out and the kiosk will return to the start
                screen.
              </p>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setOpen(false)}
                style={{
                  flex: 1,
                  borderRadius: 9999,
                  padding: "12px 0",
                  fontWeight: 600,
                  fontSize: 14,
                  background: "transparent",
                  border: "1.5px solid var(--border)",
                  color: "var(--text)",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setOpen(false);
                  endSession();
                }}
                style={{
                  flex: 1,
                  borderRadius: 9999,
                  padding: "12px 0",
                  fontWeight: 700,
                  fontSize: 14,
                  background: "#EB0A1E",
                  color: "#fff",
                  border: "none",
                  cursor: "pointer",
                  boxShadow: "0 8px 20px rgba(235,10,30,0.3)",
                }}
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function HeaderActions() {
  return (
    <div className="flex items-center gap-3">
      <UserChip />
      <LogoutButton />
    </div>
  );
}

interface PageShellProps {
  children: React.ReactNode;
  className?: string;
}

/** Full-screen kiosk wrapper — fills the display, consistent padding */
export function PageShell({ children, className = "" }: PageShellProps) {
  return (
    <div
      style={{ background: "var(--bg)", color: "var(--text)" }}
      className="min-h-screen flex flex-col"
    >
      <div className={`w-full flex flex-col flex-1 px-8 py-7 ${className}`}>
        {children}
      </div>
    </div>
  );
}

interface PageHeaderProps {
  onBack?: () => void;
  title?: string;
  right?: React.ReactNode;
}

/** Single header bar: back/brand (left) · title (center) · user info (right) */
export function PageHeader({ onBack, title, right }: PageHeaderProps) {
  return (
    <div
      className="flex items-center justify-between shrink-0 -mx-8 px-8 -mt-7 pt-5 pb-4 mb-10 border-b"
      style={{ borderColor: "var(--border)" }}
    >
      {/* Left: back button or brand */}
      {onBack ? (
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-1.5 -ml-1 rounded-lg text-sm font-medium transition-all"
          style={{ color: "var(--text-muted)", background: "transparent" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "var(--text)";
            e.currentTarget.style.background = "var(--bg-card)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--text-muted)";
            e.currentTarget.style.background = "transparent";
          }}
        >
          <ChevronLeft size={18} /> Back
        </button>
      ) : (
        <div className="flex items-center gap-2">
          <span className="block h-3.5 w-[3px] rounded-full bg-[#EB0A1E]" />
          <span
            className="text-[11px] tracking-[0.24em] uppercase font-semibold"
            style={{ color: "var(--text-muted)" }}
          >
            PaintShop Dojo
          </span>
        </div>
      )}

      {/* Center: page title */}
      {title ? (
        <span className="text-base font-bold" style={{ color: "var(--text)" }}>
          {title}
        </span>
      ) : (
        <span
          className="text-[11px] tracking-[0.24em] uppercase font-semibold"
          style={{ color: "var(--text-muted)" }}
        >
          Toyota Kirloskar Motor
        </span>
      )}

      {/* Right: custom slot or user chip + logout */}
      {right !== undefined ? right : <HeaderActions />}
    </div>
  );
}
