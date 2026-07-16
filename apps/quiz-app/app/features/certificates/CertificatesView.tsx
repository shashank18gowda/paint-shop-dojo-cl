"use client";

import { useRouter } from "next/navigation";
import { useTranslation } from "../../lib/i18n";
import { useAttemptHistory } from "../../lib/hooks/useQuiz";
import type { AttemptHistoryItem } from "../../types/api.types";
import { CertIcon, ArrowRight } from "../../components/icons";
import { PageShell, PageHeader } from "../../components/layout/PageShell";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function CertRow({ item, router }: { item: AttemptHistoryItem; router: ReturnType<typeof useRouter> }) {
  const perfColor = item.performance?.color ?? "#c9a84c";
  const perfName  = item.performance?.name ?? "—";

  return (
    <div
      className="flex items-center gap-4 px-5 py-4 rounded-2xl"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
    >
      {/* Score badge */}
      <div
        className="shrink-0 flex flex-col items-center justify-center rounded-xl"
        style={{ width: 56, height: 56, background: `${perfColor}18`, border: `1.5px solid ${perfColor}40` }}
      >
        <span className="text-base font-black tabular-nums" style={{ color: perfColor }}>{Math.round(item.percentage)}%</span>
        <span className="text-[9px] font-bold uppercase tracking-wide mt-0.5" style={{ color: perfColor, opacity: 0.7 }}>Score</span>
      </div>

      {/* Info */}
      <div className="flex flex-col gap-1 min-w-0 flex-1">
        <span className="text-xs font-bold" style={{ color: "var(--text)" }}>{formatDate(item.completedAt)}</span>
        <span
          className="self-start rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide"
          style={{ background: `${perfColor}20`, color: perfColor }}
        >
          {perfName}
        </span>
        <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
          {item.correctAnswers}/{item.totalQuestions} correct · Score {item.score}/{item.maxScore}
        </span>
      </div>

      {/* View button */}
      {item.attemptId && (
        <button
          onClick={() => router.push(`/certificates/${item.attemptId}`)}
          className="shrink-0 flex items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all active:scale-[0.97]"
          style={{ background: "rgba(235,10,30,0.08)", color: "#EB0A1E", border: "1px solid rgba(235,10,30,0.2)" }}
        >
          <CertIcon size={13} /> View <ArrowRight size={11} />
        </button>
      )}
    </div>
  );
}

export default function CertificatesView() {
  const router = useRouter();
  const t = useTranslation("menu");
  const { data: attempts = [], isPending } = useAttemptHistory("recent");

  const certs = attempts.filter((a) => a.isPassed && a.attemptId);

  return (
    <PageShell>
      <PageHeader onBack={() => router.push("/menu")} title={t.certificatesTitle} />

      <div className="flex flex-col flex-1 gap-4 max-w-3xl mx-auto w-full">

        {isPending ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ background: "var(--bg-card)" }} />
            ))}
          </div>
        ) : certs.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 gap-4 text-center py-20">
            <span className="text-5xl">🏆</span>
            <p className="font-semibold text-lg" style={{ color: "var(--text)" }}>No certificates yet</p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Pass a quiz to earn your first certificate</p>
            <button
              onClick={() => router.push("/quiz")}
              className="mt-2 rounded-full py-3 px-8 text-sm font-semibold text-white"
              style={{ background: "#EB0A1E" }}
            >
              {t.takeQuiz}
            </button>
          </div>
        ) : (
          <>
            <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
              {certs.length} certificate{certs.length !== 1 ? "s" : ""} earned
            </p>
            <div className="flex flex-col gap-2">
              {certs.map((item) => (
                <CertRow key={item.sessionId} item={item} router={router} />
              ))}
            </div>
          </>
        )}

      </div>
    </PageShell>
  );
}
