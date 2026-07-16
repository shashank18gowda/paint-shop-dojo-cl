"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { IconArrowLeft, IconCheck, IconX, IconClock, IconCalendar } from "../../../../../components/icons";
import { useAttemptReview } from "../../../../../lib/hooks/useParticipants";
import { useParticipant } from "../../../../../lib/hooks/useParticipants";

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function formatDuration(seconds: number | null | undefined): string {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m} min`;
}

export default function AttemptReviewPage() {
  const { id, attemptId } = useParams<{ id: string; attemptId: string }>();
  const searchParams = useSearchParams();
  const attemptNo = searchParams.get("n") ?? "?";
  const referrer = searchParams.get("referrer") ?? null;
  const backHref = referrer ?? `/participants/${id}`;

  const { data: participant } = useParticipant(id ?? "");
  const { data: review, isLoading, isError } = useAttemptReview(id ?? "", attemptId ?? "");

  const passColor = "#16a34a";
  const failColor = "#dc2626";
  const perfColor = review?.performance?.color ?? "#6b7280";

  if (isLoading) {
    return (
      <div className="p-8 max-w-4xl space-y-4">
        <div className="h-8 w-64 rounded-lg animate-pulse" style={{ background: "var(--card)" }} />
        <div className="h-28 rounded-xl animate-pulse" style={{ background: "var(--card)" }} />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-24 rounded-xl animate-pulse" style={{ background: "var(--card)" }} />
        ))}
      </div>
    );
  }

  if (isError || !review) {
    return (
      <div className="p-8 max-w-4xl">
        <Link href={backHref} className="flex items-center gap-2 text-sm mb-6" style={{ color: "var(--text-muted)" }}>
          <IconArrowLeft size={15} /> Back
        </Link>
        <p className="text-sm" style={{ color: "#dc2626" }}>Attempt not found or could not be loaded.</p>
      </div>
    );
  }

  const correct = review.questions.filter((q) => q.isCorrect).length;
  const wrong = review.questions.length - correct;

  return (
    <div className="p-8 space-y-6 max-w-4xl">

      {/* Breadcrumb */}
      <div className="flex items-center gap-3">
        <Link
          href={backHref}
          className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
          style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
        >
          <IconArrowLeft size={15} />
        </Link>
        <div className="flex items-center gap-2 text-sm" style={{ color: "var(--text-muted)" }}>
          <Link href="/participants" className="hover:underline">Participants</Link>
          <span>/</span>
          <Link href={`/participants/${id}`} className="hover:underline">
            {participant?.name ?? "…"}
          </Link>
          <span>/</span>
          <span style={{ color: "var(--text)", fontWeight: 600 }}>Attempt #{attemptNo} Review</span>
        </div>
      </div>

      {/* Summary card */}
      <div
        className="rounded-xl p-5"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-lg font-bold" style={{ color: "var(--text)" }}>
              Attempt #{attemptNo} — Quiz Review
            </h1>
            <div className="flex items-center gap-4 mt-1 text-xs" style={{ color: "var(--text-sub)" }}>
              <span className="flex items-center gap-1">
                <IconCalendar size={11} /> {formatDate(review.completedAt)}
              </span>
              <span className="flex items-center gap-1">
                <IconClock size={11} /> {formatDuration(review.durationSeconds)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {review.performance && (
              <span
                className="text-xs font-semibold px-3 py-1 rounded-full"
                style={{ background: `${perfColor}18`, color: perfColor }}
              >
                {review.performance.name}
              </span>
            )}
            <span
              className="inline-flex items-center gap-1.5 text-sm font-bold px-3 py-1 rounded-full"
              style={{
                background: review.isPassed ? "rgba(34,197,94,0.10)" : "rgba(220,38,38,0.08)",
                color: review.isPassed ? passColor : failColor,
              }}
            >
              {review.isPassed ? <IconCheck size={14} /> : <IconX size={14} />}
              {review.isPassed ? "Passed" : "Failed"}
            </span>
          </div>
        </div>

        {/* Score metrics */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Score",    value: `${review.score}/${review.maxScore}`, sub: "points" },
            { label: "Percentage", value: `${review.percentage.toFixed(1)}%`, sub: "of total" },
            { label: "Correct",  value: String(correct), sub: `of ${review.totalQuestions}` },
            { label: "Wrong",    value: String(wrong),   sub: `of ${review.totalQuestions}` },
          ].map(({ label, value, sub }) => (
            <div key={label} className="rounded-lg p-3 text-center" style={{ background: "var(--content-bg)" }}>
              <p className="text-lg font-bold" style={{ color: "var(--text)" }}>{value}</p>
              <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>{label}</p>
              <p className="text-[10px]" style={{ color: "var(--text-sub)" }}>{sub}</p>
            </div>
          ))}
        </div>

        {/* Score bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs mb-1.5" style={{ color: "var(--text-sub)" }}>
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--content-bg)" }}>
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min(100, review.percentage)}%`,
                background: review.isPassed ? passColor : failColor,
              }}
            />
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>
          QUESTION BREAKDOWN · {review.questions.length} questions
        </h2>

        {review.questions.map((q) => (
          <div
            key={q.questionId}
            className="rounded-xl overflow-hidden"
            style={{
              background: "var(--card)",
              border: `1px solid ${q.isCorrect ? "rgba(34,197,94,0.25)" : "rgba(220,38,38,0.25)"}`,
            }}
          >
            {/* Question header */}
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
                  className="flex items-center justify-center h-6 w-6 rounded-full"
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
              {/* Your answer */}
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
                <span
                  className="text-sm"
                  style={{ color: q.isCorrect ? passColor : failColor }}
                >
                  {q.yourAnswer}
                </span>
              </div>

              {/* Correct answer — only shown when wrong */}
              {!q.isCorrect && (
                <div className="flex items-start gap-2">
                  <span
                    className="text-[10px] font-semibold px-1.5 py-0.5 rounded mt-0.5 shrink-0"
                    style={{ background: "rgba(34,197,94,0.12)", color: passColor }}
                  >
                    CORRECT ANSWER
                  </span>
                  <span className="text-sm" style={{ color: passColor }}>
                    {q.correctAnswer}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
