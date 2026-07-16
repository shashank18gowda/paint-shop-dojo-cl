"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  IconSearch, IconPlus, IconChevronDown, IconChevronLeft, IconChevronRight,
  IconMoreVertical, IconEdit, IconEye, IconTrash, IconUpload, IconX,
} from "../../components/icons";
import { useQuestions, useDeleteQuestion } from "../../lib/hooks/useQuestions";
import type { QuestionListItem, QuestionType } from "../../lib/api/questions.api";

const PAGE_LIMIT = 20;

const TYPE_META: Record<QuestionType, { label: string; short: string; color: string; bg: string }> = {
  SINGLE_CHOICE:   { label: "Single Choice",   short: "SC", color: "#3b82f6", bg: "rgba(59,130,246,0.10)" },
  MULTIPLE_CHOICE: { label: "Multiple Choice", short: "MC", color: "#a855f7", bg: "rgba(168,85,247,0.10)" },
  TRUE_FALSE:      { label: "True/False",       short: "TF", color: "#f59e0b", bg: "rgba(245,158,11,0.10)" },
};

const TYPE_OPTIONS = ["All Types", "Single Choice", "Multiple Choice", "True/False"];
const DIFF_OPTIONS = ["All Difficulties", "Level 1", "Level 2", "Level 3", "Level 4", "Level 5"];
const STATUS_OPTIONS = ["All Status", "Active", "Inactive"];
// const LANG_OPTIONS = ["All Languages", "EN", "HI", "TA", "TE", "KN"];
const LANG_OPTIONS = ["All Languages", "EN", "HI", "KN"];


function typeFromLabel(label: string): string | undefined {
  if (label === "Single Choice")   return "SINGLE_CHOICE";
  if (label === "Multiple Choice") return "MULTIPLE_CHOICE";
  if (label === "True/False")      return "TRUE_FALSE";
  return undefined;
}

function FilterSelect({ value, onChange, options }: {
  value: string; onChange: (v: string) => void; options: string[];
}) {
  return (
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="appearance-none pl-3 pr-8 py-2 text-sm rounded-lg cursor-pointer focus:outline-none"
        style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text)" }}>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-sub)" }}>
        <IconChevronDown size={13} />
      </span>
    </div>
  );
}

function DifficultyDots({ value }: { value: number | null }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className="w-1.5 h-1.5 rounded-full"
          style={{ background: n <= (value ?? 0) ? "#EB0A1E" : "var(--border)" }} />
      ))}
    </div>
  );
}

function LangCoverage({ langs }: { langs: string[] }) {
  // const all = ["en", "hi", "ta", "te", "kn"];
  const all = ["en", "hi", "kn"];

  return (
    <div className="flex items-center gap-1">
      {all.map((code) => {
        const has = langs.includes(code);
        return (
          <span key={code} title={`${code.toUpperCase()}: ${has ? "translated" : "missing"}`}
            className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded"
            style={{
              background: has ? "rgba(34,197,94,0.10)" : "var(--content-bg)",
              color:      has ? "#16a34a" : "var(--text-sub)",
              border:     has ? "1px solid rgba(34,197,94,0.20)" : "1px solid var(--border)",
            }}>
            {code}
          </span>
        );
      })}
    </div>
  );
}

// ─── Delete confirmation ──────────────────────────────────────────────────────

function DeleteConfirm({ onCancel, onConfirm, deleting, error }: {
  onCancel: () => void; onConfirm: () => void; deleting: boolean; error: string;
}) {
  return (
    <>
      <div className="fixed inset-0 z-30 bg-black/40" onClick={onCancel} />
      <div className="fixed left-1/2 top-1/2 z-40 -translate-x-1/2 -translate-y-1/2 w-[420px] rounded-xl p-6"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>Delete question?</h2>
        <p className="text-sm mt-2" style={{ color: "var(--text-muted)" }}>
          This question will be permanently removed from the quiz bank.
        </p>
        {error && (
          <p className="text-xs mt-3 p-3 rounded-lg" style={{ background: "rgba(220,38,38,0.06)", color: "#dc2626" }}>
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onCancel} disabled={deleting} className="px-3.5 py-2 rounded-lg text-sm font-medium" style={{ color: "var(--text-muted)" }}>
            Cancel
          </button>
          <button onClick={onConfirm} disabled={deleting}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-60" style={{ background: "#dc2626" }}>
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Action menu ──────────────────────────────────────────────────────────────

function ActionMenu({ id, onDelete }: { id: string; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)}
        className="flex h-7 w-7 items-center justify-center rounded-md transition-colors"
        style={{ color: "var(--text-muted)" }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--content-bg)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}>
        <IconMoreVertical size={15} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-20 w-36 rounded-lg py-1 shadow-lg"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <Link href={`/questions/${id}/view`}
              className="flex items-center gap-2.5 px-3 py-2 text-sm transition-colors"
              style={{ color: "var(--text)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "var(--content-bg)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "transparent"; }}
              onClick={() => setOpen(false)}>
              <IconEye size={14} /> View
            </Link>
            <Link href={`/questions/${id}`}
              className="flex items-center gap-2.5 px-3 py-2 text-sm transition-colors"
              style={{ color: "var(--text)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "var(--content-bg)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "transparent"; }}
              onClick={() => setOpen(false)}>
              <IconEdit size={14} /> Edit
            </Link>
            <div style={{ height: "1px", background: "var(--border)", margin: "4px 0" }} />
            <button className="flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors"
              style={{ color: "#dc2626" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(220,38,38,0.06)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
              onClick={() => { setOpen(false); onDelete(); }}>
              <IconTrash size={14} /> Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function Pagination({ page, totalPages, onChange }: {
  page: number; totalPages: number; onChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
  const pages: (number | "…")[] = [];
  if (totalPages <= 5) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("…");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push("…");
    pages.push(totalPages);
  }
  return (
    <div className="flex items-center gap-1">
      <button onClick={() => onChange(page - 1)} disabled={page === 1}
        className="flex h-7 w-7 items-center justify-center rounded-md text-xs disabled:opacity-40"
        style={{ color: "var(--text-muted)", border: "1px solid var(--border)" }}>
        <IconChevronLeft size={13} />
      </button>
      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`e${i}`} className="flex h-7 w-7 items-center justify-center text-xs" style={{ color: "var(--text-sub)" }}>…</span>
        ) : (
          <button key={p} onClick={() => onChange(p)}
            className="flex h-7 w-7 items-center justify-center rounded-md text-xs font-medium"
            style={p === page ? { background: "#EB0A1E", color: "#fff" } : { color: "var(--text-muted)" }}>
            {p}
          </button>
        )
      )}
      <button onClick={() => onChange(page + 1)} disabled={page === totalPages}
        className="flex h-7 w-7 items-center justify-center rounded-md text-xs disabled:opacity-40"
        style={{ color: "var(--text-muted)", border: "1px solid var(--border)" }}>
        <IconChevronRight size={13} />
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function QuestionsPage() {
  const [search,     setSearch]     = useState("");
  const [debSearch,  setDebSearch]  = useState("");
  const [type,       setType]       = useState("All Types");
  const [difficulty, setDifficulty] = useState("All Difficulties");
  const [status,     setStatus]     = useState("All Status");
  const [lang,       setLang]       = useState("All Languages");
  const [page,       setPage]       = useState(1);
  const [toDelete,   setToDelete]   = useState<QuestionListItem | null>(null);
  const [deleteError, setDeleteError] = useState("");

  const deleteMut = useDeleteQuestion();

  useEffect(() => {
    const t = setTimeout(() => { setDebSearch(search); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading, isError, error } = useQuestions({
    page,
    limit: PAGE_LIMIT,
    search: debSearch || undefined,
    type: typeFromLabel(type),
    difficulty: difficulty !== "All Difficulties" ? Number(difficulty.replace("Level ", "")) : undefined,
    isActive: status === "Active" ? true : status === "Inactive" ? false : undefined,
    langCode: lang !== "All Languages" ? lang.toLowerCase() : undefined,
  });

  const questions = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_LIMIT);

  function handleDelete() {
    if (!toDelete) return;
    setDeleteError("");
    deleteMut.mutate(toDelete.id, {
      onSuccess: () => setToDelete(null),
      onError: (e) => setDeleteError((e as Error).message || "Failed to delete"),
    });
  }

  return (
    <div className="p-8 space-y-6 max-w-7xl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Questions</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
            {isLoading ? "Loading…" : `${total} question${total === 1 ? "" : "s"} in the bank`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text)" }}>
            <IconUpload size={14} /> Import CSV
          </button>
          <Link href="/questions/new"
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:brightness-90 active:scale-[0.98]"
            style={{ background: "#EB0A1E" }}>
            <IconPlus size={15} /> New Question
          </Link>
        </div>
      </div>

      {/* Error */}
      {isError && (
        <div className="rounded-xl p-4 flex items-start gap-3"
          style={{ background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.20)" }}>
          <span className="text-lg shrink-0">⚠️</span>
          <div>
            <p className="text-sm font-semibold" style={{ color: "#dc2626" }}>Failed to load questions</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{(error as Error)?.message}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="rounded-xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-52">
            <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-sub)" }}>
              <IconSearch size={15} />
            </span>
            <input type="text" placeholder="Search questions…" value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg focus:outline-none"
              style={{ background: "var(--content-bg)", border: "1px solid var(--border)", color: "var(--text)" }} />
          </div>
          <FilterSelect value={type}       onChange={(v) => { setType(v);       setPage(1); }} options={TYPE_OPTIONS}   />
          <FilterSelect value={difficulty} onChange={(v) => { setDifficulty(v); setPage(1); }} options={DIFF_OPTIONS}   />
          <FilterSelect value={status}     onChange={(v) => { setStatus(v);     setPage(1); }} options={STATUS_OPTIONS} />
          {/* <FilterSelect value={lang}       onChange={(v) => { setLang(v);       setPage(1); }} options={LANG_OPTIONS}   /> */}
          {(search || type !== "All Types" || difficulty !== "All Difficulties" || status !== "All Status" || lang !== "All Languages") && (
            <button onClick={() => { setSearch(""); setType("All Types"); setDifficulty("All Difficulties"); setStatus("All Status"); setLang("All Languages"); setPage(1); }}
              className="text-xs font-medium px-3 py-2 rounded-lg flex items-center gap-1"
              style={{ color: "#EB0A1E", background: "rgba(235,10,30,0.06)" }}>
              <IconX size={12} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-12 rounded-lg animate-pulse" style={{ background: "var(--content-bg)" }} />
            ))}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--content-bg)" }}>
                {["#", "Question", "Type", "Difficulty", "Points · Time", "Languages", "Status", ""].map((col) => (
                  <th key={col} className="px-4 py-3 text-left text-xs font-semibold tracking-wide" style={{ color: "var(--text-muted)" }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {questions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-sm" style={{ color: "var(--text-sub)" }}>
                    No questions match your filters.
                  </td>
                </tr>
              ) : (
                questions.map((q, i) => {
                  const meta = TYPE_META[q.type];
                  return (
                    <tr key={q.id}
                      style={{ borderBottom: i < questions.length - 1 ? "1px solid var(--border)" : "none" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "var(--content-bg)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "transparent"; }}>
                      <td className="px-4 py-3.5 text-xs font-mono" style={{ color: "var(--text-sub)" }}>
                        {(page - 1) * PAGE_LIMIT + i + 1}
                      </td>
                      <td className="px-4 py-3.5">
                        <Link href={`/questions/${q.id}/view`} className="hover:underline" style={{ color: "var(--text)" }}>
                          <p className="font-medium line-clamp-2">{q.englishText ?? "(no English text)"}</p>
                        </Link>
                        <p className="text-xs mt-0.5" style={{ color: "var(--text-sub)" }}>
                          {q.optionsCount} option{q.optionsCount !== 1 ? "s" : ""}
                        </p>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-md"
                          style={{ background: meta.bg, color: meta.color }}>
                          <span className="font-mono">{meta.short}</span>
                          <span>{meta.label}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <DifficultyDots value={q.difficulty} />
                      </td>
                      <td className="px-4 py-3.5 text-xs" style={{ color: "var(--text-muted)" }}>
                        <span className="font-semibold" style={{ color: "var(--text)" }}>
                          {q.points} pt{q.points !== 1 ? "s" : ""}
                        </span>
                        <span className="mx-1.5" style={{ color: "var(--text-sub)" }}>·</span>
                        {q.timeLimit}s
                      </td>
                      <td className="px-4 py-3.5"><LangCoverage langs={q.langs} /></td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium"
                          style={{ color: q.isActive ? "#16a34a" : "var(--text-sub)" }}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: q.isActive ? "#16a34a" : "var(--text-sub)" }} />
                          {q.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <ActionMenu id={q.id} onDelete={() => { setDeleteError(""); setToDelete(q); }} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}

        {/* Pagination footer */}
        {!isLoading && total > 0 && (
          <div className="flex items-center justify-between px-4 py-3"
            style={{ borderTop: "1px solid var(--border)", background: "var(--content-bg)" }}>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Showing {(page - 1) * PAGE_LIMIT + 1}–{Math.min(page * PAGE_LIMIT, total)} of {total}
            </p>
            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          </div>
        )}
      </div>

      {toDelete && (
        <DeleteConfirm
          onCancel={() => { setToDelete(null); setDeleteError(""); }}
          onConfirm={handleDelete}
          deleting={deleteMut.isPending}
          error={deleteError}
        />
      )}
    </div>
  );
}
