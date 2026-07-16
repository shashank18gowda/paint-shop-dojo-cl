"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useStartQuiz, useSubmitQuiz } from "../../lib/hooks/useQuiz";
import { useFlowStore, type LangCode } from "../../store/flow";
import { useSessionStore } from "../../store/session";
import { useTranslation } from "../../lib/i18n";
import { Spinner, ArrowRight, CheckIcon } from "../../components/icons";
import { API_BASE } from "../../lib/api/client";

type AnswerEntry = { optionIds: string[]; timeTaken: number };

// Native labels for the in-quiz language switch; falls back to the backend name.
const LANG_LABEL: Record<string, string> = { EN: "EN", KN: "ಕನ್ನಡ", HI: "हिंदी" };

// Pick a localized string, falling back to English then any available language.
function pick(byLang: Record<string, string>, lang: LangCode): string {
  return byLang[lang] ?? byLang.EN ?? Object.values(byLang)[0] ?? "";
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function ActiveQuiz() {
  const router = useRouter();
  const lang    = useFlowStore((s) => s.lang);
  const setLastQuizResult = useFlowStore((s) => s.setLastQuizResult);
  const token   = useSessionStore((s) => s.token);

  const [currentIdx,      setCurrentIdx]      = useState(0);
  const [selectedIds,     setSelectedIds]     = useState<Set<string>>(new Set());
  const [questionTimeLeft, setQuestionTimeLeft] = useState(0);
  // Language the questions are displayed in — initialised to the language the
  // participant chose during onboarding, but switchable mid-quiz. Cosmetic
  // only: it never re-fetches, re-shuffles, or changes what gets scored.
  const [displayLang,     setDisplayLang]     = useState<LangCode>(lang);

  const selectedIdsRef   = useRef<Set<string>>(new Set());
  const currentIdxRef    = useRef(0);
  const answersRef       = useRef<Map<string, AnswerEntry>>(new Map());
  const timerRef         = useRef<ReturnType<typeof setInterval> | null>(null);
  const advancingRef     = useRef(false);
  const submittedRef     = useRef(false);
  const questionStartRef = useRef<number>(0);
  // Always-current refs so timer/beforeunload closures don't go stale
  const advanceRef       = useRef<() => void>(() => {});
  const questionsRef     = useRef<ReturnType<typeof useStartQuiz>["data"] extends { questions: infer Q } ? Q : never[]>([]);

  selectedIdsRef.current = selectedIds;
  currentIdxRef.current  = currentIdx;

  // Stable for the lifetime of this quiz attempt — see useStartQuiz for why.
  const [mountId] = useState(() => crypto.randomUUID());
  const { data: session, isPending: loading, error: startError } = useStartQuiz(mountId, lang, 10, !!token);
  const { mutate: submitQuiz, isPending: submitting, error: submitError } = useSubmitQuiz();

  useEffect(() => {
    if (!token) router.replace("/login");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ui = useTranslation("quiz");
  const questions = session?.questions ?? [];
  const availableLangs = session?.languages ?? [];
  // @ts-expect-error — generic inference quirk; shape is identical
  questionsRef.current = questions;

  function doSubmit(finalAnswers: Map<string, AnswerEntry>) {
    if (submittedRef.current) return;
    submittedRef.current = true;
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }

    const payload = questions.flatMap((q) => {
      const ans = finalAnswers.get(q.id);
      if (!ans || ans.optionIds.length === 0) return [];
      return ans.optionIds.map((id) => ({ questionId: q.id, optionId: id, timeTaken: ans.timeTaken }));
    });

    submitQuiz(
      { sessionId: session!.sessionId, answers: payload, totalQuestions: questions.length },
      {
        onSuccess: (result) => {
          setLastQuizResult(result);
          router.replace(`/quiz/results/${result.attemptId}`);
        },
      }
    );
  }

  function advance() {
    if (advancingRef.current) return;
    advancingRef.current = true;

    const idx      = currentIdxRef.current;
    const sel      = [...selectedIdsRef.current];
    const timeTaken = Math.round((Date.now() - questionStartRef.current) / 1000);

    const next = new Map(answersRef.current);
    next.set(questions[idx].id, { optionIds: sel, timeTaken });
    answersRef.current = next;

    if (idx + 1 < questions.length) {
      setCurrentIdx(idx + 1);
      setSelectedIds(new Set());
      selectedIdsRef.current = new Set();
      advancingRef.current = false;
    } else {
      doSubmit(next);
    }
  }

  // Mirror to ref so the per-question timer can call latest advance()
  advanceRef.current = advance;

  // Per-question timer — restarts whenever the active question changes
  useEffect(() => {
    if (loading || !questions.length || submittedRef.current) return;
    const q = questions[currentIdx];
    if (!q) return;

    const limit = q.timeLimit ?? 30;
    setQuestionTimeLeft(limit);
    questionStartRef.current = Date.now();

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setQuestionTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          timerRef.current = null;
          advanceRef.current();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIdx, loading, questions.length]);

  // Submit partial answers if user closes the tab or navigates away mid-quiz
  useEffect(() => {
    if (!session) return;

    function handleUnload() {
      if (submittedRef.current || !session) return;
      const final = new Map(answersRef.current);
      const currentQ = (questionsRef.current as typeof questions)[currentIdxRef.current];
      if (currentQ) {
        final.set(currentQ.id, {
          optionIds: [...selectedIdsRef.current],
          timeTaken: Math.round((Date.now() - questionStartRef.current) / 1000),
        });
      }
      const payload = (questionsRef.current as typeof questions).flatMap((q) => {
        const ans = final.get(q.id);
        if (!ans || ans.optionIds.length === 0) return [];
        return ans.optionIds.map((id) => ({ questionId: q.id, optionId: id, timeTaken: ans.timeTaken }));
      });

      if (payload.length === 0) return;

      const currentToken = useSessionStore.getState().token;
      fetch(`${API_BASE}/quiz/sessions/${session.sessionId}/submit`, {
        method: "POST",
        keepalive: true,
        headers: {
          "Content-Type": "application/json",
          ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {}),
        },
           body: JSON.stringify({ answers: payload, totalQuestions: (questionsRef.current as typeof questions).length }),
      });
    }

    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [session]);

  if (loading) {
    return (
      <div style={{ background: "var(--bg)", color: "var(--text)" }} className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Spinner size={40} />
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Loading quiz…</p>
        </div>
      </div>
    );
  }

  if (startError) {
    return (
      <div style={{ background: "var(--bg)", color: "var(--text)" }} className="flex min-h-screen items-center justify-center px-6">
        <div className="text-center flex flex-col gap-4 max-w-sm">
          <p className="text-4xl">⚠️</p>
          <p style={{ color: "#f59e0b" }}>Failed to load quiz. Please try again.</p>
          <button onClick={() => router.push("/quiz")} className="rounded-full py-3 px-6 text-sm font-semibold text-white" style={{ background: "#EB0A1E" }}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (submitError) {
    return (
      <div style={{ background: "var(--bg)", color: "var(--text)" }} className="flex min-h-screen items-center justify-center px-6">
        <div className="text-center flex flex-col gap-4 max-w-sm">
          <p className="text-4xl">❌</p>
          <p className="text-base font-semibold" style={{ color: "var(--text)" }}>Submission failed</p>
          <p className="text-sm" style={{ color: "#f59e0b" }}>
            {(submitError as Error).message?.includes("400")
              ? "This session was already submitted."
              : "Unable to submit your answers. Please check your connection and try again."}
          </p>
          <button onClick={() => router.push("/menu")} className="rounded-full py-3 px-6 text-sm font-semibold text-white" style={{ background: "#EB0A1E" }}>
            Back to Menu
          </button>
        </div>
      </div>
    );
  }

  if (!loading && questions.length === 0) {
    return (
      <div style={{ background: "var(--bg)", color: "var(--text)" }} className="flex min-h-screen items-center justify-center px-6">
        <div className="text-center flex flex-col gap-4 max-w-sm">
          <p className="text-4xl">🌐</p>
          <p className="text-base font-semibold" style={{ color: "var(--text)" }}>{ui.unavailableTitle}</p>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {ui.unavailableMessage}
          </p>
          <button onClick={() => router.push("/quiz")} className="rounded-full py-3 px-6 text-sm font-semibold text-white" style={{ background: "#EB0A1E" }}>
            {ui.goBack}
          </button>
        </div>
      </div>
    );
  }

  const question = questions[currentIdx];
  if (!question) return null;

  const total        = questions.length;
  const limit        = question.timeLimit ?? 30;
  const timeFraction = limit > 0 ? questionTimeLeft / limit : 0;
  const timerColor   = timeFraction <= 0.10 ? "#ef4444" : timeFraction <= 0.25 ? "#f59e0b" : "#22c55e";
  const circumference = 2 * Math.PI * 26;
  const strokeDash   = circumference * timeFraction;
  const isLast       = currentIdx + 1 === total;

  return (
    <div style={{ background: "var(--bg)", color: "var(--text)" }} className="min-h-screen flex flex-col">
      <div className="mx-auto w-full max-w-3xl flex flex-col flex-1 px-8 py-6">

        {/* Language switch — display-only, lets the participant read the same
            question in another language without losing progress. */}
        {availableLangs.length > 1 && (
          <div className="mb-4 flex shrink-0 justify-center">
            <div
              className="inline-flex items-center gap-1 rounded-full p-1"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
            >
              {availableLangs.map((l) => {
                const active = displayLang === l.code;
                return (
                  <button
                    key={l.code}
                    onClick={() => setDisplayLang(l.code as LangCode)}
                    className="rounded-full px-4 py-1.5 text-xs font-semibold transition-colors"
                    style={{
                      background: active ? "#EB0A1E" : "transparent",
                      color: active ? "#fff" : "var(--text-muted)",
                    }}
                  >
                    {LANG_LABEL[l.code] ?? l.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Progress bar */}
        <div className="mb-5 shrink-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
              Question {currentIdx + 1} of {total}
            </span>
            <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
              {question.points} {question.points === 1 ? "pt" : "pts"}
            </span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${(currentIdx / total) * 100}%`, background: "#EB0A1E" }}
            />
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-5">
          {/* Per-question timer + question card */}
          <div
            className="w-full rounded-3xl p-6 flex flex-col gap-5"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
          >
            <div className="flex justify-center">
              <div className="relative flex items-center justify-center" style={{ width: 80, height: 80 }}>
                <svg width="80" height="80" style={{ transform: "rotate(-90deg)", position: "absolute" }}>
                  <circle cx="40" cy="40" r="26" fill="none" stroke="var(--border)" strokeWidth="4" />
                  <circle
                    cx="40" cy="40" r="26" fill="none"
                    stroke={timerColor} strokeWidth="4" strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference - strokeDash}
                    style={{ transition: "stroke-dashoffset 0.9s linear, stroke 0.3s" }}
                  />
                </svg>
                <span
                  className="text-sm font-bold tabular-nums z-10"
                  style={{ color: timerColor, transition: "color 0.3s" }}
                >
                  {formatTime(questionTimeLeft)}
                </span>
              </div>
            </div>
            <p className="text-base font-semibold leading-relaxed text-center" style={{ color: "var(--text)" }}>
              {pick(question.textByLang, displayLang)}
            </p>
          </div>

          {/* Options */}
          <div className="flex flex-col gap-3">
            {question.type === "MULTIPLE_CHOICE" && (
              <p className="text-xs text-center font-medium" style={{ color: "var(--text-muted)" }}>
                Select all correct answers
              </p>
            )}
            {question.options.map((opt, i) => {
              const active   = selectedIds.has(opt.id);
              const isMulti  = question.type === "MULTIPLE_CHOICE";
              return (
                <button
                  key={opt.id}
                  onClick={() => {
                    if (isMulti) {
                      setSelectedIds((prev) => {
                        const next = new Set(prev);
                        if (next.has(opt.id)) {
                          next.delete(opt.id);
                        } else if (next.size < question.options.length - 1) {
                          // Prevent selecting all options — at least one must remain unselected
                          next.add(opt.id);
                        }
                        return next;
                      });
                    } else {
                      setSelectedIds(new Set([opt.id]));
                    }
                  }}
                  style={{
                    background: active ? "rgba(235,10,30,0.10)" : "var(--bg-card)",
                    border:     `2px solid ${active ? "#EB0A1E" : "var(--border)"}`,
                    textAlign:  "left",
                    transition: "border-color 0.15s, background 0.15s",
                  }}
                  className="w-full rounded-2xl px-4 py-3.5 flex items-center gap-3"
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center ${isMulti ? "rounded-md" : "rounded-full"} text-xs font-bold`}
                    style={{
                      background: active ? "#EB0A1E" : "var(--border)",
                      color: active ? "#fff" : "var(--text-muted)",
                      transition: "background 0.15s, color 0.15s",
                    }}
                  >
                    {active && isMulti ? <CheckIcon size={14} /> : String.fromCharCode(65 + i)}
                  </span>
                  <span className="text-sm font-medium" style={{ color: "var(--text)" }}>{pick(opt.textByLang, displayLang)}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-6 shrink-0">
          <button
            onClick={advance}
            disabled={submitting}
            className="w-full rounded-full py-4 text-base font-semibold text-white active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            style={{
              background: "#EB0A1E",
              boxShadow: "0 8px 24px rgba(235,10,30,0.25)",
              opacity: submitting ? 0.7 : 1,
              cursor: submitting ? "not-allowed" : "pointer",
            }}
          >
            {submitting ? <><Spinner size={18} /> {ui.submitting}</> : isLast ? <><CheckIcon /> {ui.submitBtn}</> : <>{ui.nextBtn} <ArrowRight /></>}
          </button>
          {selectedIds.size === 0 && !isLast && (
            <p className="text-xs text-center mt-2" style={{ color: "var(--text-muted)" }}>
              {question.type === "MULTIPLE_CHOICE" ? ui.selectAllAnswers : ui.selectAnswerWait}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

