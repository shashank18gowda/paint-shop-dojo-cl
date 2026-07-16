"use client";

import { useRouter } from "next/navigation";
import { useFlowStore } from "../../store/flow";
import { useSessionStore } from "../../store/session";
import { useTranslation } from "../../lib/i18n";
import { useGameEligibility } from "../../lib/hooks/useGame";
import { PlayIcon, Spinner } from "../../components/icons";
import { PageShell, PageHeader } from "../../components/layout/PageShell";

export default function GameEligibility() {
  const router = useRouter();
  const ui = useTranslation("game");
  const { data: eligibility, isLoading } = useGameEligibility();

  const languageCode = useFlowStore((s) => s.lang);
  const participantId = useSessionStore((s) => s.participant?.id);

  const handleStart = () => {
    const gameUrl = new URL("http://localhost:3003");
    if (participantId) gameUrl.searchParams.set("participantId", participantId);
    gameUrl.searchParams.set("languageCode", languageCode);
    window.location.assign(gameUrl.toString());
  };

  if (isLoading) {
    return (
      <PageShell>
        <PageHeader onBack={() => router.push("/menu")} />
        <div className="flex flex-1 items-center justify-center">
          <Spinner size={40} />
        </div>
      </PageShell>
    );
  }

  if (eligibility && !eligibility.eligible) {
    return <CooldownScreen eligibility={eligibility} onBack={() => router.push("/menu")} />;
  }

  return (
    <PageShell>
      <PageHeader onBack={() => router.push("/menu")} />

      <div className="flex flex-1 flex-col items-center gap-8 max-w-2xl mx-auto w-full">
        <div className="flex flex-col items-center gap-3 text-center">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{ background: "rgba(235,10,30,0.12)", color: "#EB0A1E" }}
          >
            <PlayIcon size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>{ui.title}</h1>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>{ui.subtitle}</p>
          </div>
        </div>

        <div
          className="w-full rounded-2xl p-5 flex flex-col gap-3"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
        >
          {ui.rules.map((rule, i) => (
            <div key={i} className="flex items-start gap-3">
              <div
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white mt-0.5"
                style={{ background: "#EB0A1E" }}
              >
                {i + 1}
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text)" }}>{rule}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 w-full max-w-2xl mx-auto">
        <button
          onClick={handleStart}
          className="w-full rounded-full py-4 text-base font-semibold text-white active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          style={{ background: "#EB0A1E", boxShadow: "0 8px 24px rgba(235,10,30,0.25)" }}
        >
          <PlayIcon size={18} /> {ui.startBtn}
        </button>
      </div>
    </PageShell>
  );
}

function CooldownScreen({
  eligibility,
  onBack,
}: {
  eligibility: { cooldownUntil: string | null; daysRemaining: number; lastAttemptPassed: boolean | null };
  onBack: () => void;
}) {
  const ui = useTranslation("game");
  const until = eligibility.cooldownUntil
    ? new Date(eligibility.cooldownUntil).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";
  const passed = eligibility.lastAttemptPassed === true;
  const dayLabel = eligibility.daysRemaining === 1 ? ui.day : ui.days;

  return (
    <PageShell>
      <PageHeader onBack={onBack} />
      <div className="flex flex-1 flex-col items-center justify-center gap-6 max-w-2xl mx-auto w-full text-center">
        <div
          className="flex h-20 w-20 items-center justify-center rounded-2xl text-3xl"
          style={{ background: passed ? "rgba(34,197,94,0.12)" : "rgba(245,158,11,0.12)" }}
        >
          {passed ? "🏆" : "⏳"}
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>
            {ui.cooldownTitle}
          </h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {passed ? ui.cooldownPassed : ui.cooldownRetry}
          </p>
        </div>
        <div
          className="w-full rounded-2xl p-5 flex flex-col gap-3"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
        >
          <Row label={ui.lastAttempt} value={passed ? ui.passedLabel : ui.didNotPassLabel} valueColor={passed ? "#22c55e" : "#f59e0b"} />
          <Row label={ui.availableOn} value={until} />
          <Row label={ui.timeRemaining} value={`${eligibility.daysRemaining} ${dayLabel}`} />
        </div>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          {ui.viewHistoryHint}
        </p>
      </div>
    </PageShell>
  );
}

function Row({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm" style={{ color: "var(--text-muted)" }}>{label}</span>
      <span className="text-sm font-semibold" style={{ color: valueColor ?? "var(--text)" }}>{value}</span>
    </div>
  );
}
