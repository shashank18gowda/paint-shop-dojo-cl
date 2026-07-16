"use client";

import { useParams, useRouter } from "next/navigation";
import { useFlowStore } from "../../store/flow";
import { useTranslation } from "../../lib/i18n";
import { useEndSession } from "../../lib/hooks/useEndSession";
import { useAttemptReview } from "../../lib/hooks/useQuiz";
import { formatDuration } from "../../lib/utils/format";
import { RetryIcon, CertIcon, TrophyFullIcon, LogoutIcon, Spinner } from "../../components/icons";
import { PageShell } from "../../components/layout/PageShell";
import type { QuizResult } from "../../store/flow";
import type { AttemptReview } from "../../types/quiz.types";

function reviewToResult(r: AttemptReview): QuizResult {
  return {
    attemptId: r.attemptId,
    score: r.score,
    maxScore: r.maxScore,
    percentage: r.percentage,
    correctAnswers: r.correctAnswers,
    totalQuestions: r.totalQuestions,
    performance: r.performance,
    durationSeconds: r.durationSeconds ?? 0,
    isPassed: r.isPassed,
  };
}

export default function QuizResults() {
  const router = useRouter();
  const { attemptId } = useParams<{ attemptId: string }>();
  const lang     = useFlowStore((s) => s.lang);
  const stored   = useFlowStore((s) => s.lastQuizResult);
  const ui       = useTranslation("quizResults");
  const endSession = useEndSession();

  // Only use the in-memory result if it belongs to THIS attempt — prevents
  // a previous participant's stale result from showing for the next participant.
  const validStored = stored?.attemptId === attemptId ? stored : null;

  const { data: reviewData, isLoading: reviewLoading } = useAttemptReview(
    validStored ? "" : (attemptId ?? ""),
    lang,
  );

  const result: QuizResult | null =
    validStored ?? (reviewData ? reviewToResult(reviewData) : null);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (!result && reviewLoading) {
    return (
      <PageShell>
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Spinner size={36} />
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Loading results…</p>
          </div>
        </div>
      </PageShell>
    );
  }

  // ── Not found ────────────────────────────────────────────────────────────
  if (!result) {
    return (
      <PageShell>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <p className="text-4xl">🔍</p>
          <p className="text-base font-semibold" style={{ color: "var(--text)" }}>
            Result not found
          </p>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            This attempt may have expired or the link is invalid.
          </p>
          <button
            onClick={() => router.replace("/menu")}
            className="mt-2 rounded-full py-3 px-6 text-sm font-semibold text-white"
            style={{ background: "#EB0A1E" }}
          >
            Back to Menu
          </button>
        </div>
      </PageShell>
    );
  }

  const pct       = Math.round(result.percentage);
  const perfColor = result.performance?.color ?? "#6b6b6b";
  const perfCode  = result.performance?.code;
  const perfName  = result.performance?.name ?? "—";

  const msg =
    perfCode === "EXCELLENT" ? ui.excellent :
    perfCode === "GOOD"      ? ui.good :
    perfCode === "AVERAGE"   ? ui.average :
                               ui.needsImprovement;

  const ringSize = 200;
  const ringCenter = ringSize / 2;
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const arcDash = (pct / 100) * circumference;
  const pctTextSize = "text-4xl sm:text-5xl";

  return (
    <PageShell>
      <div className="flex items-center justify-end mb-6 shrink-0">
        <span
          className="text-xs tracking-[0.2em] uppercase"
          style={{ color: "var(--text-muted)" }}
        >
          Toyota Kirloskar Motor
        </span>
      </div>

      <div className="flex flex-1 flex-col items-center gap-6 max-w-2xl mx-auto w-full">
        <div className="text-center">
          <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>
            {ui.title}
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            {ui.subtitle}
          </p>
        </div>

        <div className="relative flex items-center justify-center w-44 h-44 sm:w-52 sm:h-52 shrink-0">
          <svg
            viewBox={`0 0 ${ringSize} ${ringSize}`}
            width="100%"
            height="100%"
            style={{ position: "absolute", transform: "rotate(-90deg)" }}
          >
            <circle
              cx={ringCenter}
              cy={ringCenter}
              r={radius}
              fill="none"
              stroke="var(--border)"
              strokeWidth="10"
            />
            <circle
              cx={ringCenter}
              cy={ringCenter}
              r={radius}
              fill="none"
              stroke={perfColor}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - arcDash}
              style={{ transition: "stroke-dashoffset 1s ease-out" }}
            />
          </svg>
          <div className="flex flex-col items-center justify-center z-10 gap-1 px-3 text-center">
            <span
              className={`${pctTextSize} font-black leading-none`}
              style={{ color: perfColor }}
            >
              {pct}%
            </span>
            <span
              className="text-xs sm:text-sm font-semibold leading-none whitespace-nowrap"
              style={{ color: "var(--text-muted)" }}
            >
              {result.score}/{result.maxScore} pts
            </span>
          </div>
        </div>

        <div
          className="flex items-center gap-2 rounded-full px-5 py-2"
          style={{
            background: `${perfColor}20`,
            border: `1.5px solid ${perfColor}`,
          }}
        >
          <span className="text-base font-bold" style={{ color: perfColor }}>
            {perfName}
          </span>
        </div>

        <p
          className="text-sm text-center"
          style={{ color: "var(--text-muted)" }}
        >
          {msg}
        </p>

        <div className="w-full grid grid-cols-3 gap-3">
          <StatCard
            icon="✅"
            value={`${result.correctAnswers}/${result.totalQuestions}`}
            label={ui.correct}
            color={perfColor}
          />
          <StatCard
            icon="⏱"
            value={formatDuration(result.durationSeconds)}
            label={ui.timeTaken}
            color={perfColor}
          />
          <StatCard
            icon="🎯"
            value={`${result.score}`}
            label={ui.score}
            color={perfColor}
          />
        </div>
      </div>

      <div className="mt-8 w-full max-w-2xl mx-auto flex flex-col gap-3">
        {result.isPassed ? (
          <>
            <button
              onClick={() => router.push(`/certificates/${result.attemptId}`)}
              className="w-full rounded-full py-4 text-base font-semibold text-white active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              style={{
                background: "#EB0A1E",
                boxShadow: "0 8px 24px rgba(235,10,30,0.25)",
              }}
            >
              <CertIcon /> {ui.certificate}
            </button>
            <button
              onClick={() => router.push("/leaderboard")}
              className="w-full rounded-full py-3.5 text-base font-semibold transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              style={{
                background: "var(--bg-card)",
                border: "2px solid var(--border)",
                color: "var(--text)",
              }}
            >
              <TrophyFullIcon /> {ui.leaderboard}
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => router.push("/quiz")}
              className="w-full rounded-full py-4 text-base font-semibold text-white active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              style={{
                background: "#EB0A1E",
                boxShadow: "0 8px 24px rgba(235,10,30,0.25)",
              }}
            >
              <RetryIcon /> {ui.retake}
            </button>
            <button
              onClick={() => router.push("/leaderboard")}
              className="w-full rounded-full py-3.5 text-base font-semibold transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              style={{
                background: "var(--bg-card)",
                border: "2px solid var(--border)",
                color: "var(--text)",
              }}
            >
              <TrophyFullIcon /> {ui.leaderboard}
            </button>
          </>
        )}

        <div className="flex items-center justify-center gap-6 pt-2">
          <button
            onClick={() => router.push("/menu")}
            className="text-sm transition-colors"
            style={{ color: "var(--text-muted)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text)")}
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "var(--text-muted)")
            }
          >
            {ui.menu}
          </button>
          <span style={{ color: "var(--border)" }}>·</span>
          <button
            onClick={endSession}
            className="flex items-center gap-1.5 text-sm font-semibold transition-colors"
            style={{ color: "#EB0A1E" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#c4081a")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#EB0A1E")}
          >
            <LogoutIcon size={14} /> Hand Over Kiosk
          </button>
        </div>
      </div>
    </PageShell>
  );
}

function StatCard({
  icon,
  value,
  label,
  color,
}: {
  icon: string;
  value: string;
  label: string;
  color: string;
}) {
  return (
    <div
      className="flex flex-col items-center gap-1 rounded-2xl py-4 px-2 text-center"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
      }}
    >
      <span className="text-xl">{icon}</span>
      <span className="text-sm font-bold" style={{ color }}>
        {value}
      </span>
      <span
        className="text-xs leading-tight"
        style={{ color: "var(--text-muted)" }}
      >
        {label}
      </span>
    </div>
  );
}


