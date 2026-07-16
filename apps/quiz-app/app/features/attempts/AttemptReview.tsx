"use client";

import { useRouter } from "next/navigation";
import { useAttemptReview } from "../../lib/hooks/useQuiz";
import { useFlowStore } from "../../store/flow";
import type { AttemptReviewQuestion } from "../../types/api.types";
import { formatDuration } from "../../lib/utils/format";
import { Spinner, CheckIcon, CertIcon } from "../../components/icons";
import { PageShell, PageHeader } from "../../components/layout/PageShell";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function ScoreRing({ pct, color }: { pct: number; color: string }) {
  const r = 44, circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: 112, height: 112 }}>
      <svg width={112} height={112} style={{ position: "absolute", transform: "rotate(-90deg)" }}>
        <circle cx="56" cy="56" r={r} fill="none" stroke="var(--border)" strokeWidth="8" />
        <circle cx="56" cy="56" r={r} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={circ - dash}
          style={{ transition: "stroke-dashoffset 1s ease-out" }}
        />
      </svg>
      <span className="text-2xl font-black z-10" style={{ color }}>{Math.round(pct)}%</span>
    </div>
  );
}

function CorrectBar({ correct, total }: { correct: number; total: number }) {
  const incorrect = total - correct;
  const pct = total > 0 ? (correct / total) * 100 : 0;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between text-sm">
        <span style={{ color: "var(--text-muted)" }}>Correct</span>
        <span className="font-bold" style={{ color: "#22c55e" }}>{correct}</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: "#22c55e" }} />
      </div>
      <div className="flex items-center justify-between text-sm">
        <span style={{ color: "var(--text-muted)" }}>Incorrect</span>
        <span className="font-bold" style={{ color: "#ef4444" }}>{incorrect}</span>
      </div>
    </div>
  );
}

function QuestionCard({ q }: { q: AttemptReviewQuestion }) {
  const isCorrect = q.isCorrect;
  return (
    <div className="flex flex-col gap-3 rounded-2xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1.5 flex-1">
          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
            Question {String(q.number).padStart(2, "0")}
          </span>
          <p className="text-sm font-medium leading-relaxed" style={{ color: "var(--text)" }}>{q.questionText}</p>
        </div>
        <div className="shrink-0 mt-0.5">
          {isCorrect ? (
            <div className="flex h-7 w-7 items-center justify-center rounded-full" style={{ background: "rgba(34,197,94,0.15)", border: "1.5px solid #22c55e" }}>
              <CheckIcon size={13} stroke="#22c55e" strokeWidth={3} />
            </div>
          ) : (
            <div className="flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold" style={{ background: "rgba(239,68,68,0.12)", border: "1.5px solid #ef4444", color: "#ef4444" }}>
              ✕
            </div>
          )}
        </div>
      </div>

      {isCorrect ? (
        <div className="rounded-xl px-4 py-3" style={{ background: "rgba(34,197,94,0.07)", borderLeft: "3px solid #22c55e" }}>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "#22c55e" }}>Your Answer &amp; Correct Answer</p>
          <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{q.yourAnswer}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl px-4 py-3" style={{ background: "rgba(239,68,68,0.07)", borderLeft: "3px solid #ef4444" }}>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "#ef4444" }}>Your Answer</p>
            <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{q.yourAnswer}</p>
          </div>
          <div className="rounded-xl px-4 py-3" style={{ background: "rgba(34,197,94,0.07)", borderLeft: "3px solid #22c55e" }}>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "#22c55e" }}>Correct Answer</p>
            <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{q.correctAnswer}</p>
          </div>
        </div>
      )}

      {q.timeTaken != null && (
        <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>⏱ {q.timeTaken}s to answer</p>
      )}

      {q.explanation ? (
        <div className="rounded-xl px-4 py-3" style={{ background: "rgba(59,130,246,0.08)", borderLeft: "3px solid #3b82f6" }}>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "#2563eb" }}>Explanation</p>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text)" }}>{q.explanation}</p>
        </div>
      ) : null}
    </div>
  );
}

export default function AttemptReview({ attemptId }: { attemptId: string }) {
  const router = useRouter();
  const lang = useFlowStore((s) => s.lang);
  const { data: review, isPending, error } = useAttemptReview(attemptId, lang);

  if (isPending) {
    return (
      <PageShell>
        <PageHeader onBack={() => router.back()} />
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Spinner size={36} />
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Loading review…</p>
          </div>
        </div>
      </PageShell>
    );
  }

  if (error || !review) {
    return (
      <PageShell>
        <PageHeader onBack={() => router.back()} />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center flex flex-col gap-3">
            <p className="text-4xl">⚠️</p>
            <p className="text-sm" style={{ color: "#f59e0b" }}>Failed to load review.</p>
            <button onClick={() => router.back()} className="text-sm underline" style={{ color: "#EB0A1E" }}>Go back</button>
          </div>
        </div>
      </PageShell>
    );
  }

  const perfColor = review.performance?.color ?? "#6b7280";
  const perfName  = review.performance?.name ?? "—";
  const perfCode  = review.performance?.code ?? "";

  const msg =
    perfCode === "EXCELLENT" ? "Outstanding! You've mastered this material." :
    perfCode === "GOOD"      ? "Great job! Keep it up." :
    perfCode === "AVERAGE"   ? "Decent effort. Review the incorrect answers below." :
                               "Keep practicing! Study the correct answers below.";

  return (
    <PageShell>
      <PageHeader onBack={() => router.push("/attempts")} />

      <div className="flex flex-col gap-6 max-w-3xl mx-auto w-full">

        {/* Summary hero */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Score + verdict */}
          <div className="flex items-center gap-5 rounded-3xl p-6" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <ScoreRing pct={review.percentage} color={perfColor} />
            <div className="flex flex-col gap-2 min-w-0">
              <span
                className="self-start rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide"
                style={{
                  background: review.isPassed ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
                  color: review.isPassed ? "#16a34a" : "#dc2626",
                }}
              >
                {review.isPassed ? "PASS" : "FAIL"}
              </span>
              <div>
                <p className="text-sm font-bold" style={{ color: perfColor }}>{perfName}</p>
                <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--text-muted)" }}>{msg}</p>
              </div>
              <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>{formatDate(review.completedAt)}</p>
            </div>
          </div>

          {/* Session meta */}
          <div className="rounded-3xl px-6 py-5 flex flex-col gap-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Session Meta</p>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-sm">
                <span style={{ color: "var(--text-muted)" }}>⏱ Time Taken</span>
                <span className="font-bold" style={{ color: "var(--text)" }}>{formatDuration(review.durationSeconds)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span style={{ color: "var(--text-muted)" }}>📋 Total Questions</span>
                <span className="font-bold" style={{ color: "var(--text)" }}>{review.totalQuestions}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span style={{ color: "var(--text-muted)" }}>🎯 Score</span>
                <span className="font-bold" style={{ color: "var(--text)" }}>{review.score}/{review.maxScore} pts</span>
              </div>
            </div>
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: "0.75rem" }}>
              <CorrectBar correct={review.correctAnswers} total={review.totalQuestions} />
            </div>
          </div>
        </div>

        {/* Actions */}
        {review.isPassed && (
          <button
            onClick={() => router.push(`/certificates/${review.attemptId}`)}
            className="w-full rounded-full py-3.5 text-sm font-semibold text-white active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            style={{ background: "#EB0A1E", boxShadow: "0 8px 24px rgba(235,10,30,0.2)" }}
          >
            <CertIcon size={14} /> View Certificate
          </button>
        )}

        {/* Detailed review */}
        <div>
          <h2 className="text-base font-bold mb-4" style={{ color: "var(--text)" }}>Detailed Review</h2>
          <div className="flex flex-col gap-3">
            {review.questions.map((q) => (
              <QuestionCard key={q.questionId} q={q} />
            ))}
          </div>
        </div>

      </div>
    </PageShell>
  );
}
