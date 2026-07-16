"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  IconArrowLeft, IconCheck, IconX, IconClock, IconCalendar, IconAward,
} from "../../../../../../components/icons";
import { ReportNav } from "../../../../../../components/ReportNav";
import { useAttemptReview, useParticipant } from "../../../../../../lib/hooks/useParticipants";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function formatDuration(seconds: number | null | undefined) {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m} min`;
}

function initials(name: string) {
  return name.split(" ").map((w) => w[0] ?? "").join("").slice(0, 2).toUpperCase();
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReportAttemptReviewPage() {
  const { id, attemptId } = useParams<{ id: string; attemptId: string }>();

  const { data: participant } = useParticipant(id ?? "");
  const { data: review, isLoading, isError } = useAttemptReview(id ?? "", attemptId ?? "");

  const passColor = "#16a34a";
  const failColor = "#dc2626";
  const perfColor = review?.performance?.color ?? "#6b7280";

  if (isLoading) {
    return (
      <div className="p-8 max-w-5xl space-y-4">
        <div className="h-8 w-64 rounded-lg animate-pulse" style={{ background: "var(--card)" }} />
        <div className="h-32 rounded-xl animate-pulse" style={{ background: "var(--card)" }} />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: "var(--card)" }} />
        ))}
      </div>
    );
  }

  if (isError || !review) {
    return (
      <div className="p-8 max-w-5xl">
        <Link href={`/reports/participants/${id}`}
          className="flex items-center gap-2 text-sm mb-6" style={{ color: "var(--text-muted)" }}>
          <IconArrowLeft size={15} /> Back
        </Link>
        <p className="text-sm" style={{ color: "#dc2626" }}>Attempt not found or could not be loaded.</p>
      </div>
    );
  }

  const correct = review.questions.filter((q) => q.isCorrect).length;
  const wrong = review.questions.length - correct;
  const circumference = 2 * Math.PI * 34;

  return (
    <div className="p-8 space-y-6 max-w-5xl">

      <ReportNav active="participants" />

      {/* Breadcrumb */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={`/reports/participants/${id}`}
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
          >
            <IconArrowLeft size={15} />
          </Link>
          <div className="flex items-center gap-2 text-sm flex-wrap" style={{ color: "var(--text-muted)" }}>
            <Link href="/reports" className="hover:underline">Reports</Link>
            <span>/</span>
            <Link href="/reports/participants" className="hover:underline">Participants</Link>
            <span>/</span>
            <Link href={`/reports/participants/${id}`} className="hover:underline">
              {participant?.name ?? "…"}
            </Link>
            <span>/</span>
            <span style={{ color: "var(--text)", fontWeight: 600 }}>Attempt Review</span>
          </div>
        </div>
      </div>

      {/* Attempt summary card */}
      <div className="rounded-xl p-6" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="flex items-center gap-6">
          {/* Score circle */}
          <div className="relative shrink-0">
            <svg viewBox="0 0 80 80" className="h-24 w-24 -rotate-90">
              <circle cx="40" cy="40" r="34" fill="none" stroke="var(--content-bg)" strokeWidth="8" />
              <circle
                cx="40" cy="40" r="34" fill="none"
                stroke={review.isPassed ? "#22c55e" : "#dc2626"}
                strokeWidth="8"
                strokeDasharray={`${(review.percentage / 100) * circumference} ${circumference}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-black" style={{ color: "var(--text)" }}>
                {review.percentage.toFixed(0)}%
              </span>
              <span className="text-[10px] font-semibold" style={{ color: review.isPassed ? "#16a34a" : "#dc2626" }}>
                {review.isPassed ? "PASS" : "FAIL"}
              </span>
            </div>
          </div>

          {/* Identity */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <h1 className="text-xl font-bold" style={{ color: "var(--text)" }}>Attempt Review</h1>
              {review.performance && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: `${perfColor}18`, color: perfColor }}>
                  {review.performance.name}
                </span>
              )}
              <span
                className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{
                  background: review.isPassed ? "rgba(34,197,94,0.10)" : "rgba(220,38,38,0.08)",
                  color: review.isPassed ? "#16a34a" : "#dc2626",
                }}
              >
                {review.isPassed ? <IconCheck size={11} /> : <IconX size={11} />}
                {review.isPassed ? "Pass" : "Fail"}
              </span>
            </div>

            {participant && (
              <div className="flex items-center gap-2 text-xs mb-2" style={{ color: "var(--text-sub)" }}>
                <div className="flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-bold"
                  style={{ background: "rgba(235,10,30,0.08)", color: "#EB0A1E" }}>
                  {initials(participant.name)}
                </div>
                <Link href={`/reports/participants/${id}`} className="font-semibold hover:underline"
                  style={{ color: "var(--text-muted)" }}>
                  {participant.name}
                </Link>
                <span>·</span>
                <span>{participant.code}</span>
                <span>·</span>
                <span>{participant.designation.name}</span>
                <span>·</span>
                <span>{participant.line.name}</span>
              </div>
            )}

            <div className="flex items-center gap-4 text-xs" style={{ color: "var(--text-muted)" }}>
              <span className="flex items-center gap-1">
                <IconCalendar size={11} /> {formatDate(review.completedAt)}
              </span>
              <span className="flex items-center gap-1">
                <IconClock size={11} /> {formatDuration(review.durationSeconds)}
              </span>
              <span className="flex items-center gap-1">
                <IconAward size={11} /> {review.score}/{review.maxScore} pts
              </span>
            </div>
          </div>

          {/* Mini stats */}
          <div className="flex items-stretch shrink-0" style={{ borderLeft: "1px solid var(--border)" }}>
            {[
              { label: "Correct",   value: `${correct}/${review.totalQuestions}`, color: passColor },
              { label: "Incorrect", value: String(wrong),                         color: failColor },
              { label: "Questions", value: String(review.totalQuestions),          color: "var(--text)" },
            ].map((s, i) => (
              <div key={s.label} className="px-5 text-center"
                style={{ borderRight: i < 2 ? "1px solid var(--border)" : "none" }}>
                <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-sub)" }}>{s.label}</p>
                <p className="text-lg font-bold mt-0.5" style={{ color: s.color }}>{s.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Score bar */}
        <div className="mt-5">
          <div className="flex items-center justify-between text-xs mb-1.5" style={{ color: "var(--text-sub)" }}>
            <span>0%</span><span>pass 70%</span><span>100%</span>
          </div>
          <div className="relative h-2 rounded-full overflow-hidden" style={{ background: "var(--content-bg)" }}>
            {/* Pass threshold marker */}
            <div className="absolute top-0 bottom-0 w-px" style={{ left: "70%", background: "#22c55e", opacity: 0.6 }} />
            <div className="h-full rounded-full" style={{
              width: `${Math.min(100, review.percentage)}%`,
              background: review.isPassed ? passColor : failColor,
            }} />
          </div>
        </div>
      </div>

      {/* Question breakdown */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide px-1" style={{ color: "var(--text-muted)" }}>
          Answer Breakdown · {review.questions.length} questions
        </h2>

        {review.questions.map((q) => (
          <div
            key={q.questionId}
            className="rounded-xl overflow-hidden"
            style={{
              background: "var(--card)",
              border: `1px solid ${q.isCorrect ? "rgba(34,197,94,0.25)" : "rgba(220,38,38,0.25)"}`,
              borderLeft: `3px solid ${q.isCorrect ? "#22c55e" : "#dc2626"}`,
            }}
          >
            {/* Header */}
            <div
              className="flex items-start gap-3 px-4 py-3"
              style={{
                background: q.isCorrect ? "rgba(34,197,94,0.04)" : "rgba(220,38,38,0.04)",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <span
                className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold shrink-0 mt-0.5"
                style={{
                  background: q.isCorrect ? "rgba(34,197,94,0.15)" : "rgba(220,38,38,0.10)",
                  color: q.isCorrect ? passColor : failColor,
                }}
              >
                {q.number}
              </span>
              <p className="text-sm font-medium flex-1" style={{ color: "var(--text)" }}>
                {q.questionText}
              </p>
              <div className="shrink-0 flex items-center gap-2">
                {q.timeTaken != null && (
                  <span className="flex items-center gap-1 text-xs" style={{ color: "var(--text-sub)" }}>
                    <IconClock size={11} /> {q.timeTaken}s
                  </span>
                )}
                <span
                  className="flex h-6 w-6 items-center justify-center rounded-full"
                  style={{
                    background: q.isCorrect ? "rgba(34,197,94,0.15)" : "rgba(220,38,38,0.10)",
                    color: q.isCorrect ? passColor : failColor,
                  }}
                >
                  {q.isCorrect ? <IconCheck size={12} /> : <IconX size={12} />}
                </span>
              </div>
            </div>

            {/* Answers */}
            <div className="px-4 py-3 space-y-2">
              <div className="flex items-start gap-2">
                <span
                  className="text-[10px] font-semibold px-1.5 py-0.5 rounded mt-0.5 shrink-0"
                  style={{
                    background: q.isCorrect ? "rgba(34,197,94,0.12)" : "rgba(220,38,38,0.08)",
                    color: q.isCorrect ? passColor : failColor,
                  }}
                >
                  YOUR ANSWER
                </span>
                <span className="text-sm" style={{ color: q.isCorrect ? passColor : failColor }}>
                  {q.yourAnswer}
                </span>
              </div>
              {!q.isCorrect && (
                <div className="flex items-start gap-2">
                  <span
                    className="text-[10px] font-semibold px-1.5 py-0.5 rounded mt-0.5 shrink-0"
                    style={{ background: "rgba(34,197,94,0.12)", color: passColor }}
                  >
                    CORRECT ANSWER
                  </span>
                  <span className="text-sm" style={{ color: passColor }}>{q.correctAnswer}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
