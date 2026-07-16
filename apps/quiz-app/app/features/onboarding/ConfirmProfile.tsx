"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLines } from "../../lib/hooks/useReference";
import { useFlowStore } from "../../store/flow";
import { useSessionStore } from "../../store/session";
import { useTranslation } from "../../lib/i18n";
import { CheckIcon, Spinner, ArrowRight } from "../../components/icons";
import { PageShell, PageHeader } from "../../components/layout/PageShell";
import { BACKEND_URL } from "../../lib/env";

function resolveImage(url: string | null | undefined): string | null {
  if (!url) return null;
  return url.startsWith("http") ? url : `${BACKEND_URL}${url}`;
}

export default function ConfirmProfile() {
  const router = useRouter();
  const setSelectedLine    = useFlowStore((s) => s.setSelectedLine);
  const participant        = useSessionStore((s) => s.participant);
  const updateParticipant  = useSessionStore((s) => s.updateParticipant);

  const t = useTranslation("confirm");

  const { data: lines = [], isPending: linesPending, isError } = useLines();
  const [selectedLine, setSelectedLine_] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Guard: no participant means not logged in
  useEffect(() => {
    if (!mounted) return;
    if (!participant) router.replace("/login");
  }, [mounted, participant, router]);

  // Pre-select their last used line
  useEffect(() => {
    if (!lines.length || selectedLine) return;
    const match = lines.find((ln) => ln.name === participant?.line);
    setSelectedLine_(match?.id ?? lines[0]?.id ?? "");
  }, [lines, participant?.line, selectedLine]);

  if (!mounted || !participant) return null;

  function handleConfirm() {
    const line = lines.find((l) => l.id === selectedLine);
    if (!line) return;
    updateParticipant({ line: line.name, lineId: line.id });
    setSelectedLine(line.id);
    router.push("/menu");
  }

  const imageUrl = resolveImage(participant.imageUrl);
  const initials = participant.name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <PageShell>
      <PageHeader onBack={() => router.replace("/login")} />

      <div className="flex flex-1 flex-col items-center justify-center gap-8 max-w-xl mx-auto w-full">

        {/* Welcome back avatar + name */}
        <div className="flex flex-col items-center gap-3">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={participant.name}
              className="rounded-full object-cover"
              style={{ width: 88, height: 88, border: "3px solid var(--border)" }}
            />
          ) : (
            <div
              className="rounded-full flex items-center justify-center text-2xl font-black text-white"
              style={{ width: 88, height: 88, background: "linear-gradient(135deg,#EB0A1E,#a80016)" }}
            >
              {initials}
            </div>
          )}
          <div className="text-center">
            <p className="text-sm font-semibold" style={{ color: "#22c55e" }}>Welcome back!</p>
            <h1 className="text-2xl font-bold mt-0.5" style={{ color: "var(--text)" }}>{participant.name}</h1>
            <p className="text-sm font-mono mt-0.5" style={{ color: "var(--text-muted)" }}>{participant.code}</p>
          </div>
          <div className="flex gap-2">
            <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{ background: "rgba(235,10,30,0.10)", color: "#EB0A1E" }}>
              {participant.type}
            </span>
            <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{ background: "var(--bg-card)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
              {participant.designation}
            </span>
          </div>
        </div>

        {/* Today's line picker */}
        <div className="w-full flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
            {t.lineLbl}
          </p>
          {linesPending && (
            <div className="h-28 rounded-xl animate-pulse" style={{ background: "var(--bg-card)" }} />
          )}
          {isError && (
            <p className="text-sm" style={{ color: "#f59e0b" }}>Failed to load lines.</p>
          )}
          <div className="flex flex-col gap-2">
            {lines.map((line) => {
              const active = selectedLine === line.id;
              return (
                <button
                  key={line.id}
                  onClick={() => setSelectedLine_(line.id)}
                  className="flex items-center gap-3 rounded-xl px-4 py-3 transition-all"
                  style={{
                    border:     `2px solid ${active ? "#EB0A1E" : "var(--border)"}`,
                    background: active ? "rgba(235,10,30,0.08)" : "var(--bg-card)",
                    textAlign:  "left",
                  }}
                >
                  <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: active ? "#EB0A1E" : "var(--border)" }} />
                  <span className="text-sm font-medium flex-1" style={{ color: "var(--text)" }}>{line.name}</span>
                  {active && (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#EB0A1E]">
                      <CheckIcon size={10} stroke="white" strokeWidth={3.5} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* CTA */}
      <div className="mt-8 w-full max-w-xl mx-auto">
        <button
          onClick={handleConfirm}
          disabled={!selectedLine || linesPending}
          className="w-full rounded-full py-4 text-base font-semibold text-white transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          style={{
            background: selectedLine ? "#EB0A1E" : "var(--bg-card-hover)",
            color:      selectedLine ? "#ffffff"  : "var(--text-muted)",
            boxShadow:  selectedLine ? "0 8px 24px rgba(235,10,30,0.25)" : "none",
          }}
        >
          {linesPending ? <Spinner size={18} /> : <>{t.cta} <ArrowRight size={16} /></>}
        </button>
        <button
          onClick={() => router.replace("/login")}
          className="w-full py-3 text-sm mt-2 transition-colors"
          style={{ color: "var(--text-muted)" }}
          onMouseEnter={e => (e.currentTarget.style.color = "#EB0A1E")}
          onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}
        >
          {t.notYou}
        </button>
      </div>
    </PageShell>
  );
}
