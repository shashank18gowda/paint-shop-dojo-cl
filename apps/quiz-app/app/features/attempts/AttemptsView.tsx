"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "../../lib/i18n";
import { useAttemptHistory } from "../../lib/hooks/useQuiz";
import type { AttemptHistoryItem } from "../../types/api.types";
import { formatDuration } from "../../lib/utils/format";
import { ChevronDown, PlayIcon, CertIcon, ArrowRight } from "../../components/icons";
import { PageShell, PageHeader } from "../../components/layout/PageShell";

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}

function ScoreArc({ pct, color, size = 52 }: { pct: number; color: string; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  const cx = size / 2;
  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ position: "absolute", transform: "rotate(-90deg)" }}>
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="var(--border)" strokeWidth="4" />
        <circle cx={cx} cy={cx} r={r} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={circ - dash}
          style={{ transition: "stroke-dashoffset 0.8s ease-out" }}
        />
      </svg>
      <span className="text-xs font-black z-10 tabular-nums" style={{ color }}>{Math.round(pct)}%</span>
    </div>
  );
}

function SummaryCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-2xl px-5 py-4 flex-1" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
      <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>{label}</span>
      <span className="text-2xl font-black" style={{ color: "var(--text)" }}>{value}</span>
      {sub && <span className="text-xs" style={{ color: "var(--text-muted)" }}>{sub}</span>}
    </div>
  );
}

function AttemptRow({ item, router }: { item: AttemptHistoryItem; router: ReturnType<typeof useRouter> }) {
  const perfColor = item.performance?.color ?? "#6b7280";
  const perfCode  = item.performance?.code ?? "";
  const perfName  = item.performance?.name ?? "—";

  return (
    <div
      className="flex items-center gap-4 px-5 py-4 rounded-2xl transition-all"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
    >
      {/* Score arc */}
      <ScoreArc pct={item.percentage} color={perfColor} />

      {/* Main info */}
      <div className="flex flex-col gap-0.5 min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold" style={{ color: "var(--text)" }}>
            {formatDate(item.completedAt)}
          </span>
          <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
            {formatTime(item.completedAt)}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {/* Performance badge */}
          {item.performance && (
            <span
              className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide"
              style={{ background: `${perfColor}20`, color: perfColor }}
            >
              {perfName}
            </span>
          )}
          {/* Pass/Fail */}
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-bold"
            style={{
              background: item.isPassed ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
              color: item.isPassed ? "#16a34a" : "#dc2626",
            }}
          >
            {item.isPassed ? "PASS" : "FAIL"}
          </span>
          {/* Performance tag for FAIL cases with no performance level */}
          {!item.performance && perfCode === "" && (
            <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>No level</span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="hidden sm:flex items-center gap-6 shrink-0">
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-sm font-bold tabular-nums" style={{ color: "var(--text)" }}>
            {item.correctAnswers}/{item.totalQuestions}
          </span>
          <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>Correct</span>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-sm font-bold tabular-nums" style={{ color: "var(--text)" }}>
            {formatDuration(item.durationSeconds)}
          </span>
          <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>Time Taken</span>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-sm font-bold tabular-nums" style={{ color: "var(--text)" }}>
            {item.score}/{item.maxScore}
          </span>
          <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>Score</span>
        </div>
      </div>

      {/* Actions */}
      <div className="shrink-0 flex items-center gap-2">
        {item.attemptId && item.isPassed && (
          <button
            onClick={(e) => { e.stopPropagation(); router.push(`/certificates/${item.attemptId}`); }}
            className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all active:scale-[0.97]"
            style={{ background: "rgba(235,10,30,0.08)", color: "#EB0A1E", border: "1px solid rgba(235,10,30,0.2)" }}
          >
            <CertIcon size={12} /> Cert
          </button>
        )}
        {item.attemptId && (
          <button
            onClick={() => router.push(`/attempts/${item.attemptId}`)}
            className="flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-semibold transition-all active:scale-[0.97]"
            style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
          >
            Review <ArrowRight size={11} />
          </button>
        )}
      </div>
    </div>
  );
}

export default function AttemptsView() {
  const router = useRouter();
  const t = useTranslation("menu");
  const [sort, setSort] = useState<"recent" | "best">("recent");

  const { data: attempts = [], isPending } = useAttemptHistory(sort);

  const bestPct   = attempts.length ? Math.max(...attempts.map(a => a.percentage)) : 0;
  const passRate  = attempts.length ? Math.round((attempts.filter(a => a.isPassed).length / attempts.length) * 100) : 0;

  return (
    <PageShell>
      <PageHeader onBack={() => router.push("/menu")} title={t.attemptsTitle} />

      <div className="flex flex-col flex-1 gap-5 max-w-3xl mx-auto w-full">

        {/* Summary */}
        <div className="flex gap-3">
          <SummaryCard label="Total Attempts" value={String(attempts.length)} sub="completed quizzes" />
          <SummaryCard label="Best Score"     value={attempts.length ? `${Math.round(bestPct)}%` : "—"} sub="highest percentage" />
          <SummaryCard label="Pass Rate"      value={attempts.length ? `${passRate}%` : "—"} sub="of all attempts" />
        </div>

        {/* List card */}
        <div className="flex-1 rounded-3xl px-5 pt-5 pb-6" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold" style={{ color: "var(--text)" }}>Attempt History</p>
            <div className="relative flex items-center gap-2">
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>Sort by</span>
              <div className="relative">
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as "recent" | "best")}
                  className="appearance-none rounded-xl pl-3 pr-7 py-1.5 text-xs font-semibold cursor-pointer"
                  style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)", outline: "none" }}
                >
                  <option value="recent">Recent First</option>
                  <option value="best">Best Score</option>
                </select>
                <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--text-muted)" }}>
                  <ChevronDown />
                </span>
              </div>
            </div>
          </div>

          {isPending ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ background: "var(--bg)" }} />
              ))}
            </div>
          ) : attempts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
              <span className="text-5xl">📋</span>
              <p className="font-semibold" style={{ color: "var(--text)" }}>No attempts yet</p>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>Complete a quiz to see your history here</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {attempts.map((item) => (
                <AttemptRow key={item.sessionId} item={item} router={router} />
              ))}
            </div>
          )}

          <button
            onClick={() => router.push("/quiz")}
            className="mt-5 w-full rounded-full py-3.5 text-sm font-semibold text-white active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            style={{ background: "#EB0A1E", boxShadow: "0 8px 24px rgba(235,10,30,0.2)" }}
          >
            <PlayIcon size={13} /> {t.takeQuiz}
          </button>
        </div>

      </div>
    </PageShell>
  );
}
