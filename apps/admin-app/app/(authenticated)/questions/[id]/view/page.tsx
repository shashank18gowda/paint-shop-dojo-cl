"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  IconArrowLeft, IconEdit, IconCheck, IconX, IconGlobe,
} from "../../../../components/icons";
import { useQuestion } from "../../../../lib/hooks/useQuestions";

const LANG_DISPLAY: Record<string, { name: string; flag: string }> = {
  en: { name: "English",   flag: "🇬🇧" },
  hi: { name: "Hindi",     flag: "🇮🇳" },
  ta: { name: "Tamil",     flag: "🇮🇳" },
  te: { name: "Telugu",    flag: "🇮🇳" },
  kn: { name: "Kannada",   flag: "🇮🇳" },
  ml: { name: "Malayalam", flag: "🇮🇳" },
};

const TYPE_LABEL: Record<string, string> = {
  SINGLE_CHOICE:   "Single Choice",
  MULTIPLE_CHOICE: "Multiple Choice",
  TRUE_FALSE:      "True / False",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "var(--text-sub)" }}>
        {label}
      </p>
      <div className="text-sm" style={{ color: "var(--text)" }}>{children}</div>
    </div>
  );
}

export default function QuestionViewPage() {
  const params = useParams();
  const id = params?.id as string;
  const { data: q, isLoading } = useQuestion(id);

  if (isLoading || !q) {
    return (
      <div className="p-8 max-w-4xl space-y-4">
        <div className="h-8 w-48 rounded-lg animate-pulse" style={{ background: "var(--card)" }} />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-36 rounded-xl animate-pulse" style={{ background: "var(--card)" }} />
        ))}
      </div>
    );
  }

  const enText = q.translations.find((t) => t.languageCode === "en")?.text ?? "(no English text)";
  const correctOptions = q.options.filter((o) => o.isCorrect);

  return (
    <div className="p-8 space-y-5 max-w-4xl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/questions"
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
            <IconArrowLeft size={15} />
          </Link>
          <div>
            <div className="flex items-center gap-2 text-sm" style={{ color: "var(--text-muted)" }}>
              <Link href="/questions" className="hover:underline">Questions</Link>
              <span>/</span>
              <span style={{ color: "var(--text)", fontWeight: 600 }}>
                {enText.slice(0, 50)}{enText.length > 50 ? "…" : ""}
              </span>
            </div>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-sub)" }}>Read-only view</p>
          </div>
        </div>
        <Link href={`/questions/${id}`}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white hover:brightness-90"
          style={{ background: "#EB0A1E" }}>
          <IconEdit size={14} /> Edit Question
        </Link>
      </div>

      {/* Status + meta bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
          style={q.isActive
            ? { background: "rgba(34,197,94,0.10)", color: "#16a34a" }
            : { background: "var(--content-bg)", color: "var(--text-sub)" }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: q.isActive ? "#16a34a" : "var(--text-sub)" }} />
          {q.isActive ? "Active" : "Inactive"}
        </span>
        <span className="text-xs px-2.5 py-1 rounded-full"
          style={{ background: "rgba(59,130,246,0.08)", color: "#3b82f6" }}>
          {TYPE_LABEL[q.type] ?? q.type}
        </span>
        <span className="text-xs px-2.5 py-1 rounded-full"
          style={{ background: "var(--content-bg)", color: "var(--text-muted)" }}>
          Level {q.difficulty ?? "—"}
        </span>
        <span className="text-xs px-2.5 py-1 rounded-full"
          style={{ background: "var(--content-bg)", color: "var(--text-muted)" }}>
          {q.points} pt{q.points !== 1 ? "s" : ""}
        </span>
        <span className="text-xs px-2.5 py-1 rounded-full"
          style={{ background: "var(--content-bg)", color: "var(--text-muted)" }}>
          {q.timeLimit}s
        </span>
        {q.shuffleOptions && (
          <span className="text-xs px-2.5 py-1 rounded-full"
            style={{ background: "rgba(168,85,247,0.08)", color: "#a855f7" }}>
            Shuffle on
          </span>
        )}
      </div>

      {/* Question text — all translations */}
      <div className="rounded-xl p-5 space-y-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <h3 className="text-sm font-semibold" style={{ color: "var(--text)" }}>Question Text</h3>
        {q.translations.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--text-sub)" }}>No translations available.</p>
        ) : (
          q.translations.map((t) => {
            const display = LANG_DISPLAY[t.languageCode];
            return (
              <div key={t.languageCode}>
                <p className="text-xs font-semibold mb-1 flex items-center gap-1.5" style={{ color: "var(--text-muted)" }}>
                  <span>{display?.flag ?? "🌐"}</span>
                  {display?.name ?? t.languageCode.toUpperCase()}
                </p>
                <p className="text-sm leading-relaxed px-3 py-2 rounded-lg"
                  style={{ background: "var(--content-bg)", color: "var(--text)" }}>
                  {t.text}
                </p>
              </div>
            );
          })
        )}
      </div>

      {/* Options */}
      <div className="rounded-xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold" style={{ color: "var(--text)" }}>Answer Options</h3>
          <span className="text-xs" style={{ color: "var(--text-sub)" }}>
            {correctOptions.length} correct of {q.options.length}
          </span>
        </div>
        <div className="space-y-2">
          {q.options
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((opt, idx) => {
              const enOpt = opt.translations.find((t) => t.languageCode === "en")?.text ?? "(no text)";
              return (
                <div key={opt.id} className="flex items-start gap-3 p-3 rounded-lg"
                  style={{
                    background: opt.isCorrect ? "rgba(34,197,94,0.06)" : "var(--content-bg)",
                    border: opt.isCorrect ? "1px solid rgba(34,197,94,0.30)" : "1px solid var(--border)",
                  }}>
                  <span className="flex h-6 w-6 items-center justify-center rounded-full shrink-0 mt-0.5"
                    style={{
                      background: opt.isCorrect ? "#16a34a" : "var(--card)",
                      border: opt.isCorrect ? "1px solid #16a34a" : "1.5px solid var(--border)",
                      color: "#fff",
                    }}>
                    {opt.isCorrect ? <IconCheck size={12} /> : <IconX size={12}/>}
                  </span>
                  <span className="flex h-7 w-7 items-center justify-center shrink-0 mt-0 rounded-md text-xs font-bold font-mono"
                    style={{ background: "var(--card)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm" style={{ color: "var(--text)" }}>{enOpt}</p>
                    {opt.translations.filter((t) => t.languageCode !== "en").map((t) => (
                      <p key={t.languageCode} className="text-xs mt-0.5" style={{ color: "var(--text-sub)" }}>
                        <span className="font-semibold uppercase">{t.languageCode}:</span> {t.text}
                      </p>
                    ))}
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Explanation + translations */}
      {q.explanation && (
        <div className="rounded-xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <h3 className="text-sm font-semibold mb-2" style={{ color: "var(--text)" }}>Explanation</h3>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>{q.explanation}</p>
        </div>
      )}

      {/* Translation coverage */}
      <div className="rounded-xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2 mb-3">
          <IconGlobe size={14} />
          <h3 className="text-sm font-semibold" style={{ color: "var(--text)" }}>Translation Coverage</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {q.translations.map((t) => {
            const display = LANG_DISPLAY[t.languageCode];
            return (
              <span key={t.languageCode} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                style={{ background: "rgba(34,197,94,0.10)", color: "#16a34a", border: "1px solid rgba(34,197,94,0.20)" }}>
                {display?.flag ?? "🌐"} {display?.name ?? t.languageCode.toUpperCase()}
                <IconCheck size={11} />
              </span>
            );
          })}
        </div>
      </div>

    </div>
  );
}
