"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  IconArrowLeft, IconEdit, IconUserX, IconCheck, IconX,
  IconClock, IconDownload, IconPrinter, IconAward, IconCalendar, IconEye,
} from "../../../components/icons";
import {
  useParticipant,
  useParticipantStats,
  useParticipantHistory,
  useParticipantCertificates,
  useUpdateParticipant,
  useDeleteParticipant,
} from "../../../lib/hooks/useParticipants";
import { useDesignations } from "../../../lib/hooks/useDesignations";
import { useLines } from "../../../lib/hooks/useLines";
import { useParticipantTypes } from "../../../lib/hooks/useParticipantTypes";
import { CertificateTemplate } from "../../../components/certificate/CertificateTemplate";
import { downloadCertificatePdf, generateCertificatePdfBlob } from "../../../lib/certificatePdf";
import { usePrint } from "../../../lib/hooks/usePrint";
import type { Participant, ParticipantCertificate } from "../../../types/master-data.types";

type Tab = "attempts" | "certificates";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function initials(name: string): string {
  return name.split(" ").map((w) => w[0] ?? "").join("").slice(0, 2).toUpperCase();
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function formatDuration(seconds: number | null | undefined): string {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m} min`;
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg p-4 text-center" style={{ background: "var(--content-bg)" }}>
      <p className="text-xl font-bold" style={{ color: "var(--text)" }}>{value}</p>
      <p className="text-xs font-medium mt-0.5" style={{ color: "var(--text-muted)" }}>{label}</p>
      {sub && <p className="text-[10px] mt-0.5" style={{ color: "var(--text-sub)" }}>{sub}</p>}
    </div>
  );
}

function PassBadge({ passed }: { passed: boolean }) {
  return (
    <span
      className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
      style={{
        background: passed ? "rgba(34,197,94,0.10)" : "rgba(220,38,38,0.08)",
        color: passed ? "#16a34a" : "#dc2626",
      }}
    >
      {passed ? <IconCheck size={11} /> : <IconX size={11} />}
      {passed ? "Pass" : "Fail"}
    </span>
  );
}

// Renders the real CertificateTemplate off-screen and prints it to PDF, so the
// download is pixel/vector-identical to the on-screen certificate preview
// (same component used on the /certificates pages) instead of a separately
// maintained design.
function CertificateDownloadButton({ cert }: { cert: ParticipantCertificate }) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const hiddenCertRef = useRef<HTMLDivElement>(null);
  const { printBlob, error: printError } = usePrint();

  useEffect(() => {
    if (!isDownloading || !hiddenCertRef.current) return;
    const root = hiddenCertRef.current;
    Promise.resolve().then(async () => {
      try {
        await downloadCertificatePdf(root, cert.certificateNo);
      } catch (err) {
        console.error("PDF generation failed:", err);
        alert(`Failed to generate PDF: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setIsDownloading(false);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDownloading]);

  useEffect(() => {
    if (!isPrinting || !hiddenCertRef.current) return;
    const root = hiddenCertRef.current;
    Promise.resolve().then(async () => {
      try {
        const blob = await generateCertificatePdfBlob(root);
        await printBlob(blob, { jobName: `Certificate ${cert.certificateNo}` });
      } catch (err) {
        console.error("Print failed:", err);
        alert(`Failed to print: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setIsPrinting(false);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPrinting]);

  const participantMeta = [cert.employeeCode, cert.designationName, cert.lineName]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => setIsDownloading(true)}
          disabled={isDownloading || isPrinting}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-60"
          style={{ background: "rgba(34,197,94,0.08)", color: "#16a34a", border: "1px solid rgba(34,197,94,0.15)" }}>
          <IconDownload size={12} />
          {isDownloading ? "…" : "PDF"}
        </button>
        <button
          onClick={() => setIsPrinting(true)}
          disabled={isDownloading || isPrinting}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-60"
          style={{ background: "rgba(235,10,30,0.08)", color: "#EB0A1E", border: "1px solid rgba(235,10,30,0.15)" }}>
          <IconPrinter size={12} />
          {isPrinting ? "…" : "Print"}
        </button>
        {printError && (
          <p className="text-xs" style={{ color: "#dc2626" }}>{printError}</p>
        )}
      </div>

      {(isDownloading || isPrinting) && (
        <div
          ref={hiddenCertRef}
          style={{ position: "fixed", top: 0, left: "-9999px", width: "1200px", zIndex: -1, pointerEvents: "none" }}
          aria-hidden
        >
          <CertificateTemplate
            participantName={cert.participantName}
            participantMeta={participantMeta}
            certificateNo={cert.certificateNo}
            issuedDate={formatDate(cert.issuedAt)}
            bodyText={
              <>
                We appreciate you for successfully completing the{" "}
                <strong>Paint Shop Dojo Training Program</strong> and demonstrating
                a performance level of <strong>{cert.performanceName}</strong> with
                a score of <strong>{Math.round(cert.percentage)}%</strong>. Your
                dedication will be of prime importance in the success of TKM.
              </>
            }
          />
        </div>
      )}
    </>
  );
}

// ─── Edit drawer ──────────────────────────────────────────────────────────────

function EditDrawer({ participant, onClose }: { participant: Participant; onClose: () => void }) {
  const update = useUpdateParticipant();
  const { data: designations = [] } = useDesignations();
  const { data: lines = [] } = useLines();
  const { data: participantTypes = [] } = useParticipantTypes();

  const [code, setCode] = useState(participant.code);
  const [name, setName] = useState(participant.name);
  const [designationId, setDesignationId] = useState(participant.designationId);
  const [lineId, setLineId] = useState(participant.lineId);
  const [participantTypeId, setParticipantTypeId] = useState(participant.participantTypeId);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState("");

  function clearErr(field: string) {
    setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
  }

  function handleSubmit() {
    const e: Record<string, string> = {};
    if (!code.trim()) e.code = "Employee code is required";
    else if (code.trim().length < 2) e.code = "Code must be at least 2 characters";
    if (!name.trim()) e.name = "Name is required";
    if (!designationId) e.designationId = "Designation is required";
    if (!lineId) e.lineId = "Line is required";
    if (!participantTypeId) e.participantTypeId = "Type is required";
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    setApiError("");
    update.mutate(
      { id: participant.id, input: { code: code.trim(), name: name.trim(), designationId, lineId, participantTypeId } },
      {
        onSuccess: onClose,
        onError: (err) => {
          const msg = (err as Error).message ?? "";
          if (msg.includes("409") || msg.toLowerCase().includes("already exists")) {
            setErrors({ code: "This employee code is already registered" });
          } else {
            setApiError(msg || "Something went wrong");
          }
        },
      },
    );
  }

  const fieldStyle = (hasErr: boolean) => ({
    background: "var(--content-bg)",
    border: `1px solid ${hasErr ? "#dc2626" : "var(--border)"}`,
    color: "var(--text)",
  });

  return (
    <>
      <div className="fixed inset-0 z-30 bg-black/30" onClick={onClose} />
      <div className="fixed right-0 top-0 z-40 h-full w-[440px] flex flex-col shadow-2xl" style={{ background: "var(--card)" }}>
        <div className="flex items-center justify-between p-5" style={{ borderBottom: "1px solid var(--border)" }}>
          <div>
            <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>Edit Participant</h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-sub)" }}>Update participant details</p>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ color: "var(--text-muted)" }}>
            <IconX size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {apiError && (
            <div className="rounded-lg px-3 py-2.5 text-xs" style={{ background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.2)", color: "#dc2626" }}>
              {apiError}
            </div>
          )}
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--text-muted)" }}>Employee Code <span style={{ color: "#dc2626" }}>*</span></label>
            <input type="text" value={code} onChange={(e) => { setCode(e.target.value); clearErr("code"); }}
              className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-red-100 font-mono"
              style={fieldStyle(!!errors.code)} />
            {errors.code && <p className="text-xs mt-1" style={{ color: "#dc2626" }}>{errors.code}</p>}
          </div>
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--text-muted)" }}>Full Name <span style={{ color: "#dc2626" }}>*</span></label>
            <input type="text" value={name} onChange={(e) => { setName(e.target.value); clearErr("name"); }}
              className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-red-100"
              style={fieldStyle(!!errors.name)} />
            {errors.name && <p className="text-xs mt-1" style={{ color: "#dc2626" }}>{errors.name}</p>}
          </div>
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--text-muted)" }}>Designation <span style={{ color: "#dc2626" }}>*</span></label>
            <select value={designationId} onChange={(e) => { setDesignationId(e.target.value); clearErr("designationId"); }}
              className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none appearance-none" style={fieldStyle(!!errors.designationId)}>
              <option value="">Select designation…</option>
              {designations.filter((d) => d.isActive).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            {errors.designationId && <p className="text-xs mt-1" style={{ color: "#dc2626" }}>{errors.designationId}</p>}
          </div>
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--text-muted)" }}>Line <span style={{ color: "#dc2626" }}>*</span></label>
            <select value={lineId} onChange={(e) => { setLineId(e.target.value); clearErr("lineId"); }}
              className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none appearance-none" style={fieldStyle(!!errors.lineId)}>
              <option value="">Select line…</option>
              {lines.filter((l) => l.isActive).map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
            {errors.lineId && <p className="text-xs mt-1" style={{ color: "#dc2626" }}>{errors.lineId}</p>}
          </div>
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--text-muted)" }}>Participant Type <span style={{ color: "#dc2626" }}>*</span></label>
            <select value={participantTypeId} onChange={(e) => { setParticipantTypeId(e.target.value); clearErr("participantTypeId"); }}
              className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none appearance-none" style={fieldStyle(!!errors.participantTypeId)}>
              <option value="">Select type…</option>
              {participantTypes.filter((t) => t.isActive).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            {errors.participantTypeId && <p className="text-xs mt-1" style={{ color: "#dc2626" }}>{errors.participantTypeId}</p>}
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 p-5" style={{ borderTop: "1px solid var(--border)" }}>
          <button onClick={onClose} className="px-3.5 py-2 rounded-lg text-sm font-medium" style={{ color: "var(--text-muted)" }}>Cancel</button>
          <button onClick={handleSubmit} disabled={update.isPending}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:brightness-90 disabled:opacity-60"
            style={{ background: "#EB0A1E" }}>
            {update.isPending ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Delete confirmation ──────────────────────────────────────────────────────

function DeleteModal({ name, code, onCancel, onConfirm, deleting, error }: {
  name: string; code: string; onCancel: () => void; onConfirm: () => void; deleting: boolean; error: string;
}) {
  return (
    <>
      <div className="fixed inset-0 z-30 bg-black/40" onClick={onCancel} />
      <div className="fixed left-1/2 top-1/2 z-40 -translate-x-1/2 -translate-y-1/2 w-[420px] rounded-xl p-6"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>Delete participant?</h2>
        <p className="text-sm mt-2" style={{ color: "var(--text-muted)" }}>
          <span className="font-semibold" style={{ color: "var(--text)" }}>{name}</span> ({code}) will be permanently removed.
        </p>
        {error && <p className="text-xs mt-3 p-3 rounded-lg" style={{ background: "rgba(220,38,38,0.06)", color: "#dc2626" }}>{error}</p>}
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onCancel} disabled={deleting} className="px-3.5 py-2 rounded-lg text-sm font-medium" style={{ color: "var(--text-muted)" }}>Cancel</button>
          <button onClick={onConfirm} disabled={deleting}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-60" style={{ background: "#dc2626" }}>
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ParticipantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("attempts");
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const { data: participant, isLoading, isError } = useParticipant(id ?? "");
  const { data: stats } = useParticipantStats(id ?? "");
  const { data: history = [], isLoading: historyLoading } = useParticipantHistory(id ?? "");
  const { data: certificates = [], isLoading: certsLoading } = useParticipantCertificates(id ?? "");
  const deleteMut = useDeleteParticipant();

  function handleDelete() {
    setDeleteError("");
    deleteMut.mutate(id, {
      onSuccess: () => router.push("/participants"),
      onError: (e) => setDeleteError((e as Error).message || "Failed to delete"),
    });
  }

  if (isLoading) {
    return (
      <div className="p-8 max-w-7xl">
        <div className="h-8 w-48 rounded-lg animate-pulse mb-6" style={{ background: "var(--card)" }} />
        <div className="grid grid-cols-4 gap-5">
          <div className="col-span-1 h-80 rounded-xl animate-pulse" style={{ background: "var(--card)" }} />
          <div className="col-span-3 h-80 rounded-xl animate-pulse" style={{ background: "var(--card)" }} />
        </div>
      </div>
    );
  }

  if (isError || !participant) {
    return (
      <div className="p-8 max-w-7xl">
        <Link href="/participants" className="flex items-center gap-2 text-sm mb-6" style={{ color: "var(--text-muted)" }}>
          <IconArrowLeft size={15} /> Back to Participants
        </Link>
        <p className="text-sm" style={{ color: "#dc2626" }}>Participant not found.</p>
      </div>
    );
  }

  const p = participant;

  return (
    <div className="p-8 space-y-6 max-w-7xl">

      {/* Breadcrumb + Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/participants"
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
            style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
            <IconArrowLeft size={15} />
          </Link>
          <div className="flex items-center gap-2 text-sm" style={{ color: "var(--text-muted)" }}>
            <Link href="/participants" className="hover:underline">Participants</Link>
            <span>/</span>
            <span style={{ color: "var(--text)", fontWeight: 600 }}>{p.name}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setEditOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text)" }}>
            <IconEdit size={14} /> Edit
          </button>
          <button onClick={() => { setDeleteError(""); setDeleteOpen(true); }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.15)", color: "#dc2626" }}>
            <IconUserX size={14} /> Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-5">

        {/* Left: Profile Card */}
        <div className="col-span-1 space-y-4">
          <div className="rounded-xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex flex-col items-center text-center mb-5">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl text-xl font-black mb-3"
                style={{ background: "rgba(235,10,30,0.08)", color: "#EB0A1E" }}>
                {initials(p.name)}
              </div>
              <h2 className="text-base font-bold" style={{ color: "var(--text)" }}>{p.name}</h2>
              <p className="text-xs mt-0.5 font-mono" style={{ color: "var(--text-sub)" }}>{p.code}</p>
            </div>
            <div className="space-y-3" style={{ borderTop: "1px solid var(--border)", paddingTop: "1.25rem" }}>
              {[
                { label: "Designation", value: p.designation.name },
                { label: "Line",       value: p.line.name },
                { label: "Plant",      value: p.plant?.name ?? "-" },
                { label: "Type",       value: p.participantType.name },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>{label}</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded"
                    style={{ background: "var(--content-bg)", color: "var(--text)" }}>{value}</span>
                </div>
              ))}
              <div className="flex items-start justify-between">
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>Joined</span>
                <div className="flex items-center gap-1 text-xs" style={{ color: "var(--text)" }}>
                  <IconCalendar size={11} />{formatDate(p.enteredAt)}
                </div>
              </div>
              {stats?.lastActivity && (
                <div className="flex items-start justify-between">
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>Last Active</span>
                  <span className="text-xs" style={{ color: "var(--text)" }}>{formatDate(stats.lastActivity)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="rounded-xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <h3 className="text-xs font-semibold mb-3 uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
              Performance Summary
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <StatCard label="Sessions"   value={String(stats?.totalSessions ?? "—")} />
              <StatCard label="Attempts"   value={String(stats?.totalAttempts ?? "—")} />
              <StatCard label="Best Score" value={stats ? `${stats.bestScore.toFixed(0)}%` : "—"} />
              <StatCard label="Best Level" value={stats?.bestPerformance ?? "—"} />
            </div>
          </div>
        </div>

        {/* Right: Tabs */}
        <div className="col-span-3">
          <div className="rounded-xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>

            {/* Tab Bar */}
            <div className="flex items-center gap-0 px-5 pt-4" style={{ borderBottom: "1px solid var(--border)" }}>
              {(["attempts", "certificates"] as Tab[]).map((t) => (
                <button key={t} onClick={() => setTab(t)}
                  className="px-4 py-2 text-sm font-semibold capitalize transition-colors relative"
                  style={{
                    color: tab === t ? "var(--text)" : "var(--text-muted)",
                    borderBottom: tab === t ? "2px solid #EB0A1E" : "2px solid transparent",
                    marginBottom: "-1px",
                  }}>
                  {t === "attempts"
                    ? `Attempts${historyLoading ? "" : ` (${history.length})`}`
                    : `Certificates${certsLoading ? "" : ` (${certificates.length})`}`}
                </button>
              ))}
            </div>

            {/* Attempts Tab */}
            {tab === "attempts" && (
              historyLoading ? (
                <div className="p-6 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 rounded-lg animate-pulse" style={{ background: "var(--content-bg)" }} />
                  ))}
                </div>
              ) : history.length === 0 ? (
                <div className="py-16 text-center">
                  <p className="text-sm" style={{ color: "var(--text-sub)" }}>No completed quiz attempts yet.</p>
                </div>
              ) : (
                <div className="divide-y" style={{ "--tw-divide-opacity": 1 } as React.CSSProperties}>
                  {history.map((a, idx) => {
                    const attemptNo = history.length - idx;
                    const color = a.performance?.color ?? (a.isPassed ? "#22c55e" : "#dc2626");
                    return (
                      <div key={a.sessionId} className="flex items-center gap-4 px-5 py-4">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg shrink-0"
                          style={{ background: a.isPassed ? "rgba(34,197,94,0.10)" : "rgba(220,38,38,0.08)", color: a.isPassed ? "#16a34a" : "#dc2626" }}>
                          {a.isPassed ? <IconCheck size={16} /> : <IconX size={16} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                              Attempt #{attemptNo}
                            </span>
                            <PassBadge passed={a.isPassed} />
                            {a.performance && (
                              <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                                style={{ background: `${color}18`, color }}>
                                {a.performance.name}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs" style={{ color: "var(--text-sub)" }}>
                            <span className="flex items-center gap-1"><IconCalendar size={11} />{formatDate(a.completedAt)}</span>
                            <span className="flex items-center gap-1"><IconClock size={11} />{formatDuration(a.durationSeconds)}</span>
                            <span>{a.correctAnswers}/{a.totalQuestions} correct</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-lg font-bold" style={{ color: "var(--text)" }}>
                            {a.percentage.toFixed(0)}%
                          </p>
                          <p className="text-xs" style={{ color: "var(--text-sub)" }}>
                            {a.score}/{a.maxScore} pts
                          </p>
                        </div>
                        <div className="w-20 shrink-0">
                          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--content-bg)" }}>
                            <div className="h-full rounded-full"
                              style={{ width: `${Math.min(100, a.percentage)}%`, background: a.isPassed ? "#22c55e" : "#dc2626" }} />
                          </div>
                        </div>
                        {a.attemptId && (
                          <Link
                            href={`/participants/${id}/attempts/${a.attemptId}?n=${attemptNo}`}
                            className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg shrink-0 transition-colors"
                            style={{ background: "var(--content-bg)", color: "var(--text-muted)", border: "1px solid var(--border)" }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "var(--text)"; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "var(--text-muted)"; }}
                          >
                            <IconEye size={12} /> Review
                          </Link>
                        )}
                      </div>
                    );
                  })}
                </div>
              )
            )}

            {/* Certificates Tab */}
            {tab === "certificates" && (
              certsLoading ? (
                <div className="p-6 space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-20 rounded-lg animate-pulse" style={{ background: "var(--content-bg)" }} />
                  ))}
                </div>
              ) : certificates.length === 0 ? (
                <div className="py-16 text-center">
                  <span className="flex justify-center mb-3" style={{ color: "var(--text-sub)" }}>
                    <IconAward size={32} />
                  </span>
                  <p className="text-sm" style={{ color: "var(--text-sub)" }}>No certificates issued yet.</p>
                </div>
              ) : (
                <div className="p-5 space-y-3">
                  {certificates.map((c) => {
                    const color = c.performanceColor ?? "#6b7280";
                    return (
                      <div key={c.id} className="flex items-center gap-4 p-4 rounded-xl"
                        style={{ background: "var(--content-bg)", border: "1px solid var(--border)" }}>
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl shrink-0"
                          style={{ background: `${color}18`, color }}>
                          <IconAward size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm font-semibold font-mono" style={{ color: "var(--text)" }}>
                              {c.certificateNo}
                            </span>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                              style={{ background: `${color}18`, color }}>
                              {c.performanceName}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs" style={{ color: "var(--text-sub)" }}>
                            <span className="flex items-center gap-1">
                              <IconCalendar size={11} />{formatDate(c.issuedAt)}
                            </span>
                            <span>·</span>
                            <span className="font-semibold" style={{ color: "var(--text-muted)" }}>
                              {c.percentage.toFixed(0)}% · {c.score}/{c.maxScore} pts
                            </span>
                          </div>
                        </div>
                        <CertificateDownloadButton cert={c} />
                      </div>
                    );
                  })}
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {editOpen && <EditDrawer participant={p} onClose={() => setEditOpen(false)} />}

      {deleteOpen && (
        <DeleteModal
          name={p.name}
          code={p.code}
          onCancel={() => { setDeleteOpen(false); setDeleteError(""); }}
          onConfirm={handleDelete}
          deleting={deleteMut.isPending}
          error={deleteError}
        />
      )}
    </div>
  );
}
