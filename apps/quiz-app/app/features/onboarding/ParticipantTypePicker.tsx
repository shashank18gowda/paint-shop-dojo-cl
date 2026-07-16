"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useParticipantTypes } from "../../lib/hooks/useReference";
import { useFlowStore } from "../../store/flow";
import { useTranslation } from "../../lib/i18n";
import { RoleIcon, EmployeeIcon, ContractorIcon, TraineeIcon, CheckIcon } from "../../components/icons";
import { PageShell, PageHeader } from "../../components/layout/PageShell";

const TYPE_META: Record<string, { description: string; icon: React.ReactNode }> = {
  EMPLOYEE:   { description: "Full-time TKM plant employee",    icon: <EmployeeIcon /> },
  CONTRACTOR: { description: "Third-party contractor on-site",  icon: <ContractorIcon /> },
  TRAINEE:    { description: "New joinee undergoing induction", icon: <TraineeIcon /> },
};

export default function ParticipantTypePicker() {
  const router = useRouter();
  const setParticipantType = useFlowStore((s) => s.setParticipantType);
  const t = useTranslation("participantType");

  const { data: types = [], isPending, isError } = useParticipantTypes();
  const [selected, setSelected] = useState<string>("");

  const effectiveSelected = selected || types[0]?.id || "";

  function handleContinue() {
    const type = types.find((t) => t.id === effectiveSelected);
    if (!type) return;
    setParticipantType(type.id, type.code);
    router.push("/login");
  }

  return (
    <PageShell>
      <PageHeader onBack={() => router.back()} />

      <div className="flex flex-1 flex-col items-center justify-center gap-8 text-center">
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }} className="flex h-16 w-16 items-center justify-center rounded-2xl">
          <RoleIcon size={28} />
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold" style={{ color: "var(--text)" }}>{t.title}</h1>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>{t.subtitle}</p>
        </div>

        <div className="flex w-full max-w-xl mx-auto flex-col gap-3">
          {isPending && (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ background: "var(--bg-card)" }} />
            ))
          )}
          {isError && (
            <p className="text-sm text-center" style={{ color: "#f59e0b" }}>Failed to load roles. Please refresh.</p>
          )}
          {types.map((type) => {
            const meta   = TYPE_META[type.code] ?? { description: "", icon: <RoleIcon /> };
            const active = effectiveSelected === type.id;
            return (
              <button
                key={type.id}
                onClick={() => setSelected(type.id)}
                style={{
                  border:     `2px solid ${active ? "#EB0A1E" : "var(--border)"}`,
                  background: active ? "rgba(235,10,30,0.08)" : "var(--bg-card)",
                  transition: "border-color 0.15s, background 0.15s",
                  textAlign:  "left",
                }}
                className="flex items-center gap-4 rounded-2xl px-5 py-4"
              >
                <div
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full"
                  style={{
                    background: active ? "#EB0A1E" : "var(--bg-card-hover)",
                    color:      active ? "#ffffff" : "var(--text-muted)",
                    transition: "background 0.15s, color 0.15s",
                  }}
                >
                  {meta.icon}
                </div>
                <div className="flex flex-col gap-0.5 flex-1">
                  <span className="text-xl font-bold leading-tight" style={{ color: "var(--text)" }}>{type.name}</span>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>{meta.description}</span>
                </div>
                {active ? (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EB0A1E]">
                    <CheckIcon size={13} stroke="white" strokeWidth={3} />
                  </div>
                ) : (
                  <span className="shrink-0 rounded px-2 py-0.5 text-xs font-semibold tracking-widest" style={{ background: "var(--bg-card-hover)", color: "var(--text-muted)" }}>
                    {type.code.slice(0, 3)}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-8 w-full max-w-xl mx-auto">
        <button
          onClick={handleContinue}
          disabled={isPending || !effectiveSelected}
          className="w-full rounded-full py-4 text-base font-semibold text-white transition-all duration-200 active:scale-[0.98]"
          style={{ background: "#EB0A1E", boxShadow: "0 8px 24px rgba(235,10,30,0.25)" }}
        >
          {t.cta}
        </button>
      </div>
    </PageShell>
  );
}
