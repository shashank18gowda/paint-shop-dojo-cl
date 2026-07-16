"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  IconArrowLeft, IconPlus, IconTrash, IconCheck, IconX,
  IconAlertCircle, IconSave, IconGlobe, IconType,
} from "../../../components/icons";
import { useQuestion, useCreateQuestion, useUpdateQuestion } from "../../../lib/hooks/useQuestions";
import { useLanguages } from "../../../lib/hooks/useLanguages";
import type { QuestionType, OptionInput } from "../../../lib/api/questions.api";

// ─── Display config (keyed by lowercase code) ─────────────────────────────────

const LANG_DISPLAY: Record<string, { name: string; flag: string }> = {
  en: { name: "English",   flag: "🇬🇧" },
  hi: { name: "Hindi",     flag: "🇮🇳" },
  ta: { name: "Tamil",     flag: "🇮🇳" },
  te: { name: "Telugu",    flag: "🇮🇳" },
  kn: { name: "Kannada",   flag: "🇮🇳" },
  ml: { name: "Malayalam", flag: "🇮🇳" },
};

type OptionRow = {
  key: string;                      // local stable key
  texts: Record<string, string>;    // keyed by LOWERCASE language code
  correct: boolean;
};

function buildPayload(
  type: QuestionType,
  text: Record<string, string>,     // keyed by lowercase code
  explanation: string,
  options: OptionRow[],
  difficulty: number,
  points: number,
  timeLimit: number,
  isActive: boolean,
  shuffleOptions: boolean,
) {
  const translations = Object.entries(text)
    .filter(([, t]) => t.trim())
    .map(([languageCode, t]) => ({ languageCode, text: t.trim() }));   // already lowercase

  const opts: OptionInput[] = options.map((opt, idx) => ({
    isCorrect: opt.correct,
    order: idx,
    translations: Object.entries(opt.texts)
      .filter(([, t]) => t.trim())
      .map(([languageCode, t]) => ({ languageCode, text: t.trim() })), // already lowercase
  }));

  return {
    type,
    difficulty: difficulty || undefined,
    points,
    timeLimit,
    isActive,
    shuffleOptions,
    explanation: explanation.trim() || undefined,
    translations,
    options: opts,
  };
}

function ToggleRow({ label, sub, checked, onChange }: {
  label: string; sub: string; checked: boolean; onChange: () => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{label}</p>
        <p className="text-xs" style={{ color: "var(--text-sub)" }}>{sub}</p>
      </div>
      <button onClick={onChange} className="relative h-6 w-11 rounded-full transition-colors shrink-0"
        style={{ background: checked ? "#EB0A1E" : "var(--border)" }}>
        <span className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform"
          style={{ transform: checked ? "translateX(20px)" : "translateX(0)" }} />
      </button>
    </div>
  );
}

export default function QuestionEditorPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const isNew = id === "new";

  const { data: existing, isLoading: loadingQuestion } = useQuestion(id);
  const { data: languages = [] } = useLanguages();
  const createMut = useCreateQuestion();
  const updateMut = useUpdateQuestion();
  const isPending = createMut.isPending || updateMut.isPending;

  // ── Editor state — all language codes are LOWERCASE ───────────────────────
  const [activeLang,  setActiveLang]  = useState("en");
  const [type,        setType]        = useState<QuestionType>("SINGLE_CHOICE");
  const [difficulty,  setDifficulty]  = useState(2);
  const [points,      setPoints]      = useState(1);
  const [timeLimit,   setTimeLimit]   = useState(30);
  const [isActive,    setIsActive]    = useState(true);
  const [shuffle,     setShuffle]     = useState(true);
  const [text,        setText]        = useState<Record<string, string>>({});
  const [explanation, setExplanation] = useState("");
  const [options, setOptions] = useState<OptionRow[]>([
    { key: crypto.randomUUID(), texts: {}, correct: false },
    { key: crypto.randomUUID(), texts: {}, correct: false },
  ]);
  const [apiError, setApiError] = useState("");
  const [saved,    setSaved]    = useState(false);

  // Active languages from DB — normalize code to lowercase
  const activeLangs = languages
    .filter((l) => l.isActive)
    .map((l) => ({ ...l, code: l.code.toLowerCase() }));

  const activeLangName =
    activeLangs.find((l) => l.code === activeLang)?.name ??
    LANG_DISPLAY[activeLang]?.name ??
    activeLang.toUpperCase();

  useEffect(() => {
    if (!activeLangs.length) return;
    if (activeLangs.some((l) => l.code === activeLang)) return;
    setActiveLang(activeLangs[0].code);
  }, [activeLangs, activeLang]);

  // ── Load existing question into editor state ───────────────────────────────
  useEffect(() => {
    if (!existing) return;
    setType(existing.type as QuestionType);
    setDifficulty(existing.difficulty ?? 2);
    setPoints(existing.points);
    setTimeLimit(existing.timeLimit);
    setIsActive(existing.isActive);
    setShuffle(existing.shuffleOptions);
    setExplanation(existing.explanation ?? "");

    // API already returns lowercase codes (mapDetail normalises them)
    const textMap: Record<string, string> = {};
    for (const t of existing.translations) {
      textMap[t.languageCode] = t.text; // lowercase
    }
    setText(textMap);

    setOptions(
      existing.options.map((o) => ({
        key: o.id,
        correct: o.isCorrect,
        texts: Object.fromEntries(
          o.translations.map((t) => [t.languageCode, t.text]), // lowercase from API
        ),
      })),
    );
  }, [existing]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const setOptionText = (key: string, lang: string, val: string) =>
    setOptions((opts) =>
      opts.map((o) => o.key === key ? { ...o, texts: { ...o.texts, [lang]: val } } : o),
    );

  const toggleCorrect = (key: string) => {
    if (type === "SINGLE_CHOICE" || type === "TRUE_FALSE") {
      setOptions((opts) => opts.map((o) => ({ ...o, correct: o.key === key })));
    } else {
      setOptions((opts) => opts.map((o) => o.key === key ? { ...o, correct: !o.correct } : o));
    }
  };

  const addOption  = () => setOptions((o) => [...o, { key: crypto.randomUUID(), texts: {}, correct: false }]);
  const removeOption = (key: string) => setOptions((o) => o.filter((x) => x.key !== key));

  // ── Validation ─────────────────────────────────────────────────────────────
  const langCoverage = activeLangs.filter((l) => text[l.code]?.trim()).length;
  const correctCount = options.filter((o) => o.correct).length;
  const issues: string[] = [];
  const missingQuestionLangs = activeLangs.filter((l) => !text[l.code]?.trim());
  const missingOptionLangs = options
    .map((opt, idx) => ({
      idx,
      missing: activeLangs.filter((l) => !opt.texts[l.code]?.trim()),
    }))
    .filter((item) => item.missing.length > 0);

  if (missingQuestionLangs.length > 0) {
    const langs = missingQuestionLangs.map((l) => l.name).join(", ");
    issues.push(`Complete the question text for ${langs}.`);
  }

  if (!text.en?.trim()) issues.push("English question text is required.");
  if (options.length < 2) issues.push("Add at least two answer options.");
  if (correctCount === 0) issues.push("Mark at least one option as correct.");
  if (type === "SINGLE_CHOICE" && correctCount > 1) issues.push("Single Choice can only have one correct answer.");
  if (type === "TRUE_FALSE"    && correctCount > 1) issues.push("True/False can only have one correct answer.");

  if (missingOptionLangs.length > 0) {
    missingOptionLangs.forEach((item) => {
      const letter = String.fromCharCode(65 + item.idx);
      const langs = item.missing.map((l) => l.name).join(", ");
      issues.push(`Option ${letter} is missing text for ${langs}.`);
    });
  }

  // ── Save ───────────────────────────────────────────────────────────────────
  function handleSave(publishActive: boolean) {
    if (issues.length > 0) return;
    setApiError("");
    setSaved(false);
    const payload = buildPayload(type, text, explanation, options, difficulty, points, timeLimit, publishActive, shuffle);

    if (isNew) {
      createMut.mutate(payload, {
        onSuccess: (q) => { setSaved(true); router.replace(`/questions/${q.id}`); },
        onError: (e) => setApiError((e as Error).message || "Failed to save"),
      });
    } else {
      updateMut.mutate({ id, input: payload }, {
        onSuccess: () => setSaved(true),
        onError: (e) => setApiError((e as Error).message || "Failed to save"),
      });
    }
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (!isNew && loadingQuestion) {
    return (
      <div className="p-8 max-w-7xl">
        <div className="h-8 w-48 rounded-lg animate-pulse mb-6" style={{ background: "var(--card)" }} />
        <div className="grid grid-cols-3 gap-5">
          <div className="col-span-2 space-y-4">
            {[1, 2, 3].map((i) => <div key={i} className="h-40 rounded-xl animate-pulse" style={{ background: "var(--card)" }} />)}
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => <div key={i} className="h-32 rounded-xl animate-pulse" style={{ background: "var(--card)" }} />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 max-w-7xl">

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
                {isNew ? "New Question" : (text.en ? text.en.slice(0, 50) + (text.en.length > 50 ? "…" : "") : `Question ${id.slice(0, 8)}…`)}
              </span>
            </div>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-sub)" }}>
              {isNew ? "Create a new question for the quiz bank" : "Edit question and translations"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/questions" className="px-3.5 py-2 rounded-lg text-sm font-medium"
            style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
            Cancel
          </Link>
          <button onClick={() => handleSave(false)} disabled={isPending || issues.length > 0}
            className="px-3.5 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
            style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text)" }}>
            {isPending ? "Saving…" : "Save Draft"}
          </button>
          <button onClick={() => handleSave(true)} disabled={isPending || issues.length > 0}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white hover:brightness-90 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: "#EB0A1E" }}>
            <IconSave size={14} />
            {isPending ? "Publishing…" : "Publish"}
          </button>
        </div>
      </div>

      {/* Banners */}
      {apiError && (
        <div className="flex items-start gap-3 rounded-xl p-4"
          style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.20)" }}>
          <span style={{ color: "#dc2626", flexShrink: 0, marginTop: 1 }}><IconAlertCircle size={18} /></span>
          <p className="text-sm" style={{ color: "#dc2626" }}>{apiError}</p>
        </div>
      )}
      {saved && !apiError && !isPending && (
        <div className="flex items-center gap-3 rounded-xl p-4"
          style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.20)" }}>
          <span style={{ color: "#16a34a", flexShrink: 0 }}><IconCheck size={18} /></span>
          <p className="text-sm font-medium" style={{ color: "#16a34a" }}>Question saved successfully.</p>
        </div>
      )}
      {issues.length > 0 && (
        <div className="flex items-start gap-3 rounded-xl p-4"
          style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.20)" }}>
          <span style={{ color: "#d97706", flexShrink: 0, marginTop: 1 }}><IconAlertCircle size={18} /></span>
          <div>
            <p className="text-sm font-semibold" style={{ color: "#92400e" }}>
              {issues.length} item{issues.length !== 1 ? "s" : ""} need attention before publishing
            </p>
            <ul className="mt-1.5 text-xs space-y-0.5 list-disc list-inside" style={{ color: "#92400e" }}>
              {issues.map((m, i) => <li key={i}>{m}</li>)}
            </ul>
          </div>
        </div>
      )}

      {/* Body */}
      <div className="grid grid-cols-3 gap-5">

        {/* Left column */}
        <div className="col-span-2 space-y-4">

          {/* Question text */}
          <div className="rounded-xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold" style={{ color: "var(--text)" }}>Question Text</h3>
              <span className="text-xs" style={{ color: "var(--text-sub)" }}>{text[activeLang]?.length ?? 0} chars</span>
            </div>

            {/* Language tabs */}
            <div className="flex items-center gap-1 mb-3 p-1 rounded-lg" style={{ background: "var(--content-bg)" }}>
              {activeLangs.map((l) => {
                const has = !!text[l.code]?.trim(); // l.code is lowercase
                const isCur = l.code === activeLang; // both lowercase
                return (
                  <button key={l.code} onClick={() => setActiveLang(l.code)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all"
                    style={isCur
                      ? { background: "var(--card)", color: "var(--text)", boxShadow: "0 1px 2px rgba(0,0,0,0.06)" }
                      : { color: has ? "var(--text-muted)" : "var(--text-sub)" }}>
                    <span className="uppercase">{l.code}</span>
                    {has
                      ? <span style={{ color: "#16a34a" }}><IconCheck size={11} /></span>
                      : <span className="w-1.5 h-1.5 rounded-full"
                          style={{ background: l.code === "en" ? "#EB0A1E" : "var(--border)" }} />
                    }
                  </button>
                );
              })}
            </div>

            <textarea value={text[activeLang] ?? ""}
              onChange={(e) => setText((p) => ({ ...p, [activeLang]: e.target.value }))}
              rows={3}
              placeholder={`Enter the question in ${activeLangName}…`}
              className="w-full px-3 py-2.5 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-red-100"
              style={{
                background: "var(--content-bg)",
                border: `1px solid ${activeLang === "en" && !text.en?.trim() ? "#dc2626" : "var(--border)"}`,
                color: "var(--text)",
                resize: "none",
              }} />
            {activeLang === "en" && (
              <p className="text-xs mt-1.5" style={{ color: "var(--text-sub)" }}>
                English is required and used as the fallback for the quiz.
              </p>
            )}
          </div>

          {/* Answer options */}
          <div className="rounded-xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-semibold" style={{ color: "var(--text)" }}>Answer Options</h3>
              <span className="text-xs" style={{ color: "var(--text-sub)" }}>{correctCount} correct of {options.length}</span>
            </div>
            <p className="text-xs mb-4" style={{ color: "var(--text-sub)" }}>
              {type === "MULTIPLE_CHOICE"
                ? "Select all options that should be marked correct."
                : "Select exactly one option as correct."}
            </p>

            <div className="space-y-2">
              {options.map((opt, idx) => (
                <div key={opt.key} className="flex items-start gap-3 p-3 rounded-lg"
                  style={{
                    background: opt.correct ? "rgba(34,197,94,0.06)" : "var(--content-bg)",
                    border: opt.correct ? "1px solid rgba(34,197,94,0.30)" : "1px solid var(--border)",
                  }}>
                  <button onClick={() => toggleCorrect(opt.key)}
                    className="flex h-6 w-6 items-center justify-center shrink-0 mt-1"
                    style={{
                      borderRadius: type === "MULTIPLE_CHOICE" ? "4px" : "9999px",
                      background: opt.correct ? "#16a34a" : "var(--card)",
                      border: opt.correct ? "1px solid #16a34a" : "1.5px solid var(--border)",
                      color: "#fff",
                    }}>
                    {opt.correct && <IconCheck size={13} />}
                  </button>

                  <span className="flex h-7 w-7 items-center justify-center shrink-0 mt-0.5 rounded-md text-xs font-bold font-mono"
                    style={{ background: "var(--card)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
                    {String.fromCharCode(65 + idx)}
                  </span>

                  <input type="text" value={opt.texts[activeLang] ?? ""}
                    onChange={(e) => setOptionText(opt.key, activeLang, e.target.value)}
                    placeholder={`Option ${idx + 1} (${activeLangName})`}
                    disabled={type === "TRUE_FALSE"}
                    className="flex-1 px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-red-100 disabled:opacity-60"
                    style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text)" }} />

                  {type !== "TRUE_FALSE" && options.length > 2 && (
                    <button onClick={() => removeOption(opt.key)}
                      className="flex h-9 w-9 items-center justify-center shrink-0 rounded-lg"
                      style={{ color: "var(--text-sub)" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(220,38,38,0.06)"; (e.currentTarget as HTMLButtonElement).style.color = "#dc2626"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "var(--text-sub)"; }}>
                      <IconTrash size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {type !== "TRUE_FALSE" && (
              <button onClick={addOption}
                className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg"
                style={{ border: "1.5px dashed var(--border)", color: "var(--text-muted)" }}>
                <IconPlus size={14} /> Add another option
              </button>
            )}
          </div>

          {/* Explanation */}
          <div className="rounded-xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-semibold" style={{ color: "var(--text)" }}>Explanation</h3>
              <span className="text-[10px] font-semibold tracking-wide px-1.5 py-0.5 rounded"
                style={{ background: "var(--content-bg)", color: "var(--text-sub)" }}>OPTIONAL</span>
            </div>
            <p className="text-xs mb-3" style={{ color: "var(--text-sub)" }}>
              Shown to participants after they submit their answer.
            </p>
            <textarea value={explanation} onChange={(e) => setExplanation(e.target.value)} rows={3}
              placeholder="Why is the correct answer right?"
              className="w-full px-3 py-2.5 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-red-100"
              style={{ background: "var(--content-bg)", border: "1px solid var(--border)", color: "var(--text)", resize: "none" }} />
          </div>
        </div>

        {/* Right column */}
        <div className="col-span-1 space-y-4">

          {/* Question type */}
          <div className="rounded-xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center gap-2 mb-3">
              <IconType size={14} />
              <h3 className="text-sm font-semibold" style={{ color: "var(--text)" }}>Question Type</h3>
            </div>
            <div className="space-y-1.5">
              {([
                { key: "SINGLE_CHOICE",   label: "Single Choice",   sub: "One correct answer" },
                // { key: "MULTIPLE_CHOICE", label: "Multiple Choice", sub: "Multiple correct" },
                { key: "TRUE_FALSE",      label: "True / False",    sub: "Binary question" },
              ] as const).map((opt) => (
                <button key={opt.key} onClick={() => {
                  setType(opt.key);
                  if (opt.key === "TRUE_FALSE") {
                    setOptions([
                      { key: crypto.randomUUID(), texts: { en: "True",  hi: "सही",  ta: "சரி" }, correct: true  },
                      { key: crypto.randomUUID(), texts: { en: "False", hi: "गलत", ta: "தவறு" }, correct: false },
                    ]);
                  }
                  if (opt.key === "SINGLE_CHOICE") {
                    const first = options.findIndex((o) => o.correct);
                    setOptions((opts) => opts.map((o, i) => ({ ...o, correct: i === Math.max(first, 0) })));
                  }
                }}
                  className="flex items-center gap-3 w-full p-2.5 rounded-lg text-left"
                  style={type === opt.key
                    ? { background: "rgba(235,10,30,0.06)", border: "1px solid rgba(235,10,30,0.30)" }
                    : { background: "var(--content-bg)", border: "1px solid transparent" }}>
                  <span className="flex h-4 w-4 items-center justify-center rounded-full shrink-0"
                    style={{
                      border: type === opt.key ? "4px solid #EB0A1E" : "1.5px solid var(--border)",
                      background: type === opt.key ? "#fff" : "var(--card)",
                    }} />
                  <div className="flex-1">
                    <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{opt.label}</p>
                    <p className="text-xs" style={{ color: "var(--text-sub)" }}>{opt.sub}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Scoring & Difficulty */}
          <div className="rounded-xl p-5 space-y-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <h3 className="text-sm font-semibold" style={{ color: "var(--text)" }}>Scoring & Difficulty</h3>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Difficulty</label>
                <span className="text-xs font-semibold" style={{ color: "var(--text)" }}>Level {difficulty}</span>
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} onClick={() => setDifficulty(n)}
                    className="flex-1 h-2 rounded-full"
                    style={{ background: n <= difficulty ? "#EB0A1E" : "var(--content-bg)" }} />
                ))}
              </div>
              <div className="flex items-center justify-between mt-1.5 text-[10px]" style={{ color: "var(--text-sub)" }}>
                <span>Easy</span><span>Hard</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--text-muted)" }}>Points</label>
                <input type="number" min={1} value={points}
                  onChange={(e) => setPoints(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-red-100"
                  style={{ background: "var(--content-bg)", border: "1px solid var(--border)", color: "var(--text)" }} />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--text-muted)" }}>Time (sec)</label>
                <input type="number" min={5} value={timeLimit}
                  onChange={(e) => setTimeLimit(Math.max(5, parseInt(e.target.value) || 30))}
                  className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-red-100"
                  style={{ background: "var(--content-bg)", border: "1px solid var(--border)", color: "var(--text)" }} />
              </div>
            </div>
          </div>

          {/* Settings */}
          <div className="rounded-xl p-5 space-y-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <h3 className="text-sm font-semibold" style={{ color: "var(--text)" }}>Settings</h3>
            <ToggleRow label="Active"          sub="Include in active quiz pool"       checked={isActive} onChange={() => setIsActive((v) => !v)} />
            <ToggleRow label="Shuffle Options" sub="Randomize option order on display" checked={shuffle}  onChange={() => setShuffle((v) => !v)} />
          </div>

          {/* Translation status */}
          <div className="rounded-xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <IconGlobe size={14} />
                <h3 className="text-sm font-semibold" style={{ color: "var(--text)" }}>Translations</h3>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{
                  background: langCoverage === activeLangs.length ? "rgba(34,197,94,0.10)" : "rgba(245,158,11,0.10)",
                  color:      langCoverage === activeLangs.length ? "#16a34a" : "#d97706",
                }}>
                {langCoverage}/{activeLangs.length}
              </span>
            </div>
            <div className="space-y-1.5">
              {activeLangs.map((l) => {
                const has = !!text[l.code]?.trim();
                const display = LANG_DISPLAY[l.code]; // l.code is lowercase
                return (
                  <button key={l.code} onClick={() => setActiveLang(l.code)}
                    className="flex items-center gap-2.5 w-full px-2 py-1.5 rounded-md text-left"
                    style={{ background: l.code === activeLang ? "var(--content-bg)" : "transparent" }}>
                    <span className="text-base">{display?.flag ?? "🌐"}</span>
                    <span className="text-xs font-medium flex-1" style={{ color: "var(--text)" }}>
                      {display?.name ?? l.name}
                    </span>
                    {has ? (
                      <span className="flex h-4 w-4 items-center justify-center rounded-full"
                        style={{ background: "rgba(34,197,94,0.12)", color: "#16a34a" }}>
                        <IconCheck size={10} />
                      </span>
                    ) : (
                      <span className="flex h-4 w-4 items-center justify-center rounded-full"
                        style={{ background: "var(--content-bg)", color: "var(--text-sub)" }}>
                        <IconX size={10} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
