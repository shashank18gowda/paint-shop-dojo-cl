"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  IconArrowLeft, IconDownload, IconPrinter, IconCheck, IconX, IconClock,
  IconCalendar, IconAward, IconTrendingUp, IconAlertCircle, IconEye,
} from "../../../../components/icons";
import { ReportNav } from "../../../../components/ReportNav";
import { useParticipant, useParticipantHistory, useParticipantCertificates } from "../../../../lib/hooks/useParticipants";
import { useParticipantReportDetail } from "../../../../lib/hooks/useReports";
import { downloadCertificatePdf, fetchCertificatePdfBlob } from "../../../../lib/api/participants.api";
import { usePrint } from "../../../../lib/hooks/usePrint";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(" ").map((w) => w[0] ?? "").join("").slice(0, 2).toUpperCase();
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function formatDuration(seconds: number) {
  if (!seconds) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return s > 0 ? `${h}h ${m}m ${s}s` : `${h}h ${m}m`;
  return s > 0 ? `${m}m ${s}s` : `${m} min`;
}

function formatShortDuration(seconds: number | null | undefined) {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m} min`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

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

function StatRow({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>{label}</p>
        {sub && <p className="text-[10px]" style={{ color: "var(--text-sub)" }}>{sub}</p>}
      </div>
      <p className="text-sm font-bold" style={{ color: "var(--text)" }}>{value}</p>
    </div>
  );
}

function SkeletonBlock({ h = "1rem", w = "100%" }: { h?: string; w?: string }) {
  return <div className="rounded animate-pulse" style={{ height: h, width: w, background: "var(--content-bg)" }} />;
}

// ─── Score Trend Chart ────────────────────────────────────────────────────────

function ScoreTrendChart({
  trendData,
  desgAvg,
}: {
  trendData: { date: string; score: number; passed: boolean }[];
  desgAvg: number;
}) {
  if (trendData.length === 0) {
    return (
      <div className="h-44 flex items-center justify-center text-sm" style={{ color: "var(--text-sub)" }}>
        No attempt data yet
      </div>
    );
  }

  const W = 640; const H = 200;
  const padL = 36; const padR = 16; const padT = 16; const padB = 28;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const xFor = (i: number) =>
    padL + (trendData.length === 1 ? innerW / 2 : (i / (trendData.length - 1)) * innerW);
  const yFor = (v: number) => padT + innerH - (v / 100) * innerH;

  const userPath = trendData.map((p, i) => `${i === 0 ? "M" : "L"}${xFor(i)},${yFor(p.score)}`).join(" ");
  const userArea = `${userPath} L${xFor(trendData.length - 1)},${yFor(0)} L${xFor(0)},${yFor(0)} Z`;

  const labels = trendData.map((d) => new Date(d.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-44">
      {[0, 25, 50, 75, 100].map((g) => (
        <g key={g}>
          <line x1={padL} x2={W - padR} y1={yFor(g)} y2={yFor(g)}
            stroke="var(--border)" strokeDasharray={g === 0 ? "0" : "3 3"} strokeWidth="1" />
          <text x={padL - 6} y={yFor(g) + 3} textAnchor="end" fontSize="9" fill="var(--text-sub)">{g}%</text>
        </g>
      ))}

      {/* Pass threshold */}
      <line x1={padL} x2={W - padR} y1={yFor(70)} y2={yFor(70)}
        stroke="#22c55e" strokeDasharray="4 4" strokeWidth="1" opacity="0.55" />
      <text x={W - padR} y={yFor(70) - 4} textAnchor="end" fontSize="9" fill="#16a34a">pass 70%</text>

      {/* Desg avg horizontal line */}
      {desgAvg > 0 && (
        <>
          <line x1={padL} x2={W - padR} y1={yFor(desgAvg)} y2={yFor(desgAvg)}
            stroke="#94a3b8" strokeDasharray="4 3" strokeWidth="1.5" />
          <text x={W - padR} y={yFor(desgAvg) - 4} textAnchor="end" fontSize="9" fill="#64748b">desg {desgAvg}%</text>
        </>
      )}

      {/* User area + line */}
      <path d={userArea} fill="rgba(235,10,30,0.08)" />
      <path d={userPath} stroke="#EB0A1E" strokeWidth="2" fill="none" />

      {/* Dots + labels */}
      {trendData.map((p, i) => (
        <g key={i}>
          <circle cx={xFor(i)} cy={yFor(p.score)} r="4"
            fill={p.passed ? "#22c55e" : "#dc2626"} stroke="var(--card)" strokeWidth="2" />
          <text x={xFor(i)} y={H - padB + 16} textAnchor="middle" fontSize="9" fill="var(--text-sub)">
            {labels[i]}
          </text>
        </g>
      ))}
    </svg>
  );
}

// ─── Performance Donut ────────────────────────────────────────────────────────

function AttemptSnapshot({
  trendData,
  desgAvg,
  lineAvg,
}: {
  trendData: { date: string; score: number; passed: boolean }[];
  desgAvg: number;
  lineAvg: number;
}) {
  if (trendData.length === 0) {
    return (
      <div className="h-44 flex items-center justify-center text-sm" style={{ color: "var(--text-sub)" }}>
        No completed attempts yet
      </div>
    );
  }

  const latest = trendData[trendData.length - 1];
  const first = trendData[0];
  const delta = trendData.length > 1 ? latest.score - first.score : null;

  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="rounded-lg p-4" style={{ background: "var(--content-bg)" }}>
        <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>Latest Attempt</p>
        <p className="text-2xl font-bold" style={{ color: latest.passed ? "#16a34a" : "#dc2626" }}>
          {latest.score.toFixed(1)}%
        </p>
        <p className="text-xs mt-1" style={{ color: "var(--text-sub)" }}>{formatDate(latest.date)}</p>
      </div>
      <div className="rounded-lg p-4" style={{ background: "var(--content-bg)" }}>
        <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>Change</p>
        <p className="text-2xl font-bold" style={{ color: delta == null ? "var(--text)" : delta >= 0 ? "#16a34a" : "#dc2626" }}>
          {delta == null ? "—" : `${delta >= 0 ? "+" : ""}${delta.toFixed(1)}%`}
        </p>
        <p className="text-xs mt-1" style={{ color: "var(--text-sub)" }}>
          {delta == null ? "needs another attempt" : "from first attempt"}
        </p>
      </div>
      <div className="rounded-lg p-4" style={{ background: "var(--content-bg)" }}>
        <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>Benchmarks</p>
        <p className="text-sm font-bold" style={{ color: "var(--text)" }}>
          Desg {desgAvg > 0 ? `${desgAvg}%` : "—"}
        </p>
        <p className="text-sm font-bold mt-1" style={{ color: "var(--text)" }}>
          Line {lineAvg > 0 ? `${lineAvg}%` : "—"}
        </p>
      </div>
    </div>
  );
}

function PerformanceDonut({
  distribution,
}: {
  distribution: { name: string; code: string; color: string; count: number }[];
}) {
  const actual = distribution.filter((p) => p.count > 0);
  const total = actual.reduce((s, p) => s + p.count, 0);

  if (total === 0) {
    return (
      <div className="h-24 flex items-center text-sm" style={{ color: "var(--text-sub)" }}>
        No performance levels assigned yet.
      </div>
    );
  }

  const C = 2 * Math.PI * 32;
  const slices = actual
    .reduce<{ name: string; color: string; len: number; offset: number }[]>((acc, p) => {
      const len = (p.count / total) * C;
      const offset = acc.length ? acc[acc.length - 1].offset + acc[acc.length - 1].len : 0;
      acc.push({ name: p.name, color: p.color, len, offset });
      return acc;
    }, []);

  return (
    <div className="flex items-center gap-5">
      <svg viewBox="0 0 80 80" className="h-24 w-24 -rotate-90 shrink-0">
        <circle cx="40" cy="40" r="32" fill="none" stroke="var(--content-bg)" strokeWidth="12" />
        {slices.map((s) => (
          <circle key={s.name} cx="40" cy="40" r="32" fill="none" stroke={s.color}
            strokeWidth="12" strokeDasharray={`${s.len} ${C}`} strokeDashoffset={-s.offset} />
        ))}
      </svg>
      <div className="flex-1 space-y-1.5">
        {distribution.map((d) => {
          const color = d.color ?? "#e5e7eb";
          return (
            <div key={d.code} className="flex items-center gap-2 text-xs">
              <span className="w-2 h-2 rounded-sm shrink-0" style={{ background: color }} />
              <span className="flex-1" style={{ color: "var(--text-muted)" }}>{d.name}</span>
              <span className="font-semibold tabular-nums" style={{ color: "var(--text)" }}>{d.count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ParticipantReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [tab, setTab] = useState<"attempts" | "weak" | "certs">("attempts");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [printingId, setPrintingId] = useState<string | null>(null);

  const { data: participant, isLoading: pLoading, isError } = useParticipant(id ?? "");
  const { data: history = [], isLoading: histLoading } = useParticipantHistory(id ?? "");
  const { data: certificates = [], isLoading: certsLoading } = useParticipantCertificates(id ?? "");
  const { data: detail, isLoading: detailLoading } = useParticipantReportDetail(id ?? "");
  const { printBlob, error: printError } = usePrint();

  async function handleDownload(attemptId: string, certNo: string) {
    setDownloadingId(attemptId);
    try { await downloadCertificatePdf(attemptId, certNo); } catch { /* ignore */ }
    finally { setDownloadingId(null); }
  }

  async function handlePrint(attemptId: string, certNo: string) {
    setPrintingId(attemptId);
    try {
      const blob = await fetchCertificatePdfBlob(attemptId);
      await printBlob(blob, { jobName: `Certificate ${certNo}` });
    } catch (err) {
      console.error("Print failed:", err);
      alert(`Failed to print: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setPrintingId(null);
    }
  }

  if (pLoading) {
    return (
      <div className="p-8 max-w-7xl space-y-4">
        <SkeletonBlock h="2rem" w="20rem" />
        <SkeletonBlock h="5rem" />
        <div className="grid grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonBlock key={i} h="5rem" />)}
        </div>
      </div>
    );
  }

  if (isError || !participant) {
    return (
      <div className="p-8 max-w-7xl">
        <Link href="/reports/participants" className="flex items-center gap-2 text-sm mb-6" style={{ color: "var(--text-muted)" }}>
          <IconArrowLeft size={15} /> Back to Participants
        </Link>
        <p className="text-sm" style={{ color: "#dc2626" }}>Participant not found.</p>
      </div>
    );
  }

  const p = participant;

  // Derived KPI values from history
  const totalAttempts = history.length;
  const passedCount = history.filter((a) => a.isPassed).length;
  const passRate = totalAttempts > 0 ? Math.round((passedCount / totalAttempts) * 100) : 0;
  const avgScore = totalAttempts > 0
    ? (history.reduce((s, a) => s + a.percentage, 0) / totalAttempts).toFixed(1)
    : "—";
  const bestScore = totalAttempts > 0
    ? Math.max(...history.map((a) => a.percentage)).toFixed(0)
    : "—";
  const totalSecs = history.reduce((s, a) => s + (a.durationSeconds ?? 0), 0);
  const avgSecs = totalAttempts > 0 ? Math.round(totalSecs / totalAttempts) : 0;

  const ranks = detail?.ranks;

  return (
    <div className="p-8 space-y-6 max-w-7xl">

      <ReportNav active="participants" />

      {/* Breadcrumb */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/reports/participants"
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
            <IconArrowLeft size={15} />
          </Link>
          <div className="flex items-center gap-2 text-sm" style={{ color: "var(--text-muted)" }}>
            <Link href="/reports" className="hover:underline">Reports</Link>
            <span>/</span>
            <Link href="/reports/participants" className="hover:underline">Participants</Link>
            <span>/</span>
            <span style={{ color: "var(--text)", fontWeight: 600 }}>{p.name}</span>
          </div>
        </div>
        <button
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium"
          style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text)" }}>
          <IconDownload size={14} /> Export CSV
        </button>
      </div>

      {/* Profile + Ranks */}
      <div className="rounded-xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-4 min-w-0 flex-1">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl text-lg font-black shrink-0"
              style={{ background: "rgba(235,10,30,0.08)", color: "#EB0A1E" }}>
              {initials(p.name)}
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold" style={{ color: "var(--text)" }}>{p.name}</h1>
              <p className="text-xs font-mono" style={{ color: "var(--text-sub)" }}>{p.code}</p>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                {[p.designation.name, p.line.name, p.participantType.name].map((tag) => (
                  <span key={tag} className="text-xs font-medium px-2 py-0.5 rounded"
                    style={{ background: "var(--content-bg)", color: "var(--text-muted)" }}>
                    {tag}
                  </span>
                ))}
                <span className="text-xs flex items-center gap-1" style={{ color: "var(--text-sub)" }}>
                  <IconCalendar size={11} /> Joined {formatDate(p.enteredAt)}
                </span>
              </div>
            </div>
          </div>

          {/* Rank badges */}
          <div className="flex items-stretch shrink-0" style={{ borderLeft: "1px solid var(--border)" }}>
            {detailLoading ? (
              <div className="px-5"><SkeletonBlock h="3rem" w="8rem" /></div>
            ) : ranks ? (
              [
                { label: "Overall",       pos: ranks.overall, of: ranks.totalLearners },
                { label: p.designation.name, pos: ranks.desg,  of: ranks.desgLearners },
                { label: p.line.name,      pos: ranks.line,   of: ranks.lineLearners },
              ].map((r, i) => (
                <div key={i} className="px-5 text-center"
                  style={{ borderRight: i < 2 ? "1px solid var(--border)" : "none" }}>
                  <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-sub)" }}>{r.label}</p>
                  {r.pos ? (
                    <p className="text-xl font-bold mt-0.5" style={{ color: "var(--text)" }}>
                      #{r.pos}
                      <span className="text-xs font-medium ml-1" style={{ color: "var(--text-sub)" }}>/ {r.of}</span>
                    </p>
                  ) : (
                    <p className="text-sm font-medium mt-1" style={{ color: "var(--text-sub)" }}>—</p>
                  )}
                </div>
              ))
            ) : null}
          </div>
        </div>
      </div>

      {/* 6 KPI cards */}
      <div className="grid grid-cols-6 gap-3">
        {[
          { label: "Attempts",     value: histLoading ? "…" : String(totalAttempts), sub: `${passedCount} passed`,       icon: IconAward,      color: "#3b82f6" },
          { label: "Pass Rate",    value: histLoading ? "…" : `${passRate}%`,        sub: `${passedCount}/${totalAttempts} sessions`, icon: IconCheck,      color: "#22c55e" },
          { label: "Avg Score",    value: histLoading ? "…" : `${avgScore}%`,        sub: "across all attempts",          icon: IconTrendingUp, color: "#EB0A1E" },
          { label: "Best Score",   value: histLoading ? "…" : `${bestScore}%`,       sub: "single attempt high",          icon: IconAward,      color: "#a855f7" },
          { label: "Total Time",   value: histLoading ? "…" : formatDuration(totalSecs), sub: formatShortDuration(avgSecs) + " avg / attempt", icon: IconClock, color: "#f59e0b" },
          { label: "Certificates", value: certsLoading ? "…" : String(certificates.length), sub: "issued",              icon: IconAward,      color: "#fbbf24" },
        ].map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="rounded-xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg mb-3"
                style={{ background: `${k.color}18`, color: k.color }}>
                <Icon size={15} />
              </div>
              <p className="text-lg font-bold" style={{ color: "var(--text)" }}>{k.value}</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>{k.label}</p>
              <p className="text-[10px] mt-0.5" style={{ color: "var(--text-sub)" }}>{k.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Trend chart + side panel */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 rounded-xl p-6" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold" style={{ color: "var(--text)" }}>
                {(detail?.trendData.length ?? 0) >= 3 ? "Score Trend" : "Attempt Snapshot"}
              </h2>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-sub)" }}>
                {(detail?.trendData.length ?? 0) >= 3 ? "This learner vs designation average" : "Latest score, movement, and benchmarks"}
              </p>
            </div>
            {(detail?.trendData.length ?? 0) >= 3 && <div className="flex items-center gap-3 text-xs" style={{ color: "var(--text-muted)" }}>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 inline-block" style={{ background: "#EB0A1E" }} />{p.name.split(" ")[0]}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 inline-block" style={{ background: "#94a3b8" }} />Desg avg
              </span>
            </div>}
          </div>
          {detailLoading || histLoading ? (
            <SkeletonBlock h="11rem" />
          ) : (detail?.trendData.length ?? 0) >= 3 ? (
            <ScoreTrendChart
              trendData={detail?.trendData ?? []}
              desgAvg={detail?.desgAvg ?? 0}
            />
          ) : (
            <AttemptSnapshot
              trendData={detail?.trendData ?? []}
              desgAvg={detail?.desgAvg ?? 0}
              lineAvg={detail?.lineAvg ?? 0}
            />
          )}
        </div>

        <div className="rounded-xl p-6" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <h2 className="text-base font-semibold mb-1" style={{ color: "var(--text)" }}>Performance Levels</h2>
          <p className="text-xs mb-4" style={{ color: "var(--text-sub)" }}>Using configured DB levels</p>
          {detailLoading ? (
            <SkeletonBlock h="6rem" />
          ) : (
            <PerformanceDonut distribution={detail?.performanceDistribution ?? []} />
          )}

          <div className="mt-5 pt-5 space-y-2.5" style={{ borderTop: "1px solid var(--border)" }}>
            {detailLoading ? (
              <SkeletonBlock h="4rem" />
            ) : (
              <>
                <StatRow
                  label="Avg vs Desg"
                  value={detail && detail.desgAvg > 0 && avgScore !== "—"
                    ? `${(parseFloat(avgScore) - detail.desgAvg) >= 0 ? "+" : ""}${(parseFloat(avgScore) - detail.desgAvg).toFixed(1)}%`
                    : "—"}
                  sub={detail?.desgAvg ? `desg avg ${detail.desgAvg}%` : undefined}
                />
                <StatRow
                  label="Avg vs Line"
                  value={detail && detail.lineAvg > 0 && avgScore !== "—"
                    ? `${(parseFloat(avgScore) - detail.lineAvg) >= 0 ? "+" : ""}${(parseFloat(avgScore) - detail.lineAvg).toFixed(1)}%`
                    : "—"}
                  sub={detail?.lineAvg ? `line avg ${detail.lineAvg}%` : undefined}
                />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="rounded-xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="flex items-center gap-0 px-5 pt-4" style={{ borderBottom: "1px solid var(--border)" }}>
          {([
            { k: "attempts", label: `Attempts (${histLoading ? "…" : totalAttempts})` },
            { k: "weak",     label: `Weak Topics (${detailLoading ? "…" : (detail?.weakTopics.length ?? 0)})` },
            { k: "certs",    label: `Certificates (${certsLoading ? "…" : certificates.length})` },
          ] as const).map((t) => (
            <button
              key={t.k}
              onClick={() => setTab(t.k)}
              className="px-4 py-2 text-sm font-semibold transition-colors"
              style={{
                color: tab === t.k ? "var(--text)" : "var(--text-muted)",
                borderBottom: tab === t.k ? "2px solid #EB0A1E" : "2px solid transparent",
                marginBottom: "-1px",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Attempts tab */}
        {tab === "attempts" && (
          histLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map((i) => <SkeletonBlock key={i} h="3.5rem" />)}
            </div>
          ) : history.length === 0 ? (
            <div className="py-14 text-center text-sm" style={{ color: "var(--text-sub)" }}>No completed attempts yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--content-bg)" }}>
                  <th className="px-5 py-3 text-left text-xs font-semibold tracking-wide" style={{ color: "var(--text-muted)" }}>Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide" style={{ color: "var(--text-muted)" }}>Result</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide" style={{ color: "var(--text-muted)" }}>Performance</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide" style={{ color: "var(--text-muted)" }}>Duration</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold tracking-wide" style={{ color: "var(--text-muted)" }}>Score</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold tracking-wide w-16" />
                </tr>
              </thead>
              <tbody>
                {history.map((a, i) => {
                  const color = a.performance?.color ?? (a.isPassed ? "#22c55e" : "#dc2626");
                  return (
                    <tr
                      key={a.sessionId}
                      style={{ borderBottom: i < history.length - 1 ? "1px solid var(--border)" : "none" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "var(--content-bg)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "transparent"; }}
                    >
                      <td className="px-5 py-3.5 text-sm" style={{ color: "var(--text)" }}>
                        {formatDate(a.completedAt)}
                      </td>
                      <td className="px-4 py-3.5"><PassBadge passed={a.isPassed} /></td>
                      <td className="px-4 py-3.5">
                        {a.performance ? (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                            style={{ background: `${color}18`, color }}>
                            {a.performance.name}
                          </span>
                        ) : <span style={{ color: "var(--text-sub)" }}>—</span>}
                      </td>
                      <td className="px-4 py-3.5 text-xs flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
                        <IconClock size={11} /> {formatShortDuration(a.durationSeconds)}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <p className="text-sm font-bold" style={{ color: "var(--text)" }}>{a.percentage.toFixed(1)}%</p>
                        <p className="text-[10px]" style={{ color: "var(--text-sub)" }}>{a.score}/{a.maxScore}</p>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        {a.attemptId && (
                          <Link
                            href={`/reports/participants/${id}/attempts/${a.attemptId}`}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-md transition-colors"
                            style={{ background: "rgba(235,10,30,0.06)", color: "#EB0A1E", border: "1px solid rgba(235,10,30,0.15)" }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "rgba(235,10,30,0.12)"; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "rgba(235,10,30,0.06)"; }}
                          >
                            <IconEye size={12} /> View
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )
        )}

        {/* Weak topics tab */}
        {tab === "weak" && (
          detailLoading ? (
            <div className="p-5 space-y-3">{[1, 2, 3].map((i) => <SkeletonBlock key={i} h="3rem" />)}</div>
          ) : !detail?.weakTopics.length ? (
            <div className="py-14 text-center text-sm" style={{ color: "var(--text-sub)" }}>No weak topics identified yet.</div>
          ) : (
            <div className="p-5">
              <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg mb-4"
                style={{ background: "rgba(245,158,11,0.08)", color: "#92400e" }}>
                <IconAlertCircle size={13} />
                <span>Questions this learner has answered incorrectly most often.</span>
              </div>
              <div className="space-y-2">
                {detail.weakTopics.map((q) => (
                  <div key={q.id} className="flex items-center gap-4 p-3 rounded-lg" style={{ background: "var(--content-bg)" }}>
                    <span
                      className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded shrink-0"
                      style={{
                        background: q.type === "SC" ? "rgba(59,130,246,0.10)" : q.type === "MC" ? "rgba(168,85,247,0.10)" : "rgba(245,158,11,0.10)",
                        color: q.type === "SC" ? "#3b82f6" : q.type === "MC" ? "#a855f7" : "#d97706",
                      }}
                    >
                      {q.type}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-1" style={{ color: "var(--text)" }}>{q.text}</p>
                      <p className="text-xs mt-0.5 font-mono" style={{ color: "var(--text-sub)" }}>
                        seen {q.attempts}×
                      </p>
                    </div>
                    <div className="w-40 shrink-0">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--card)" }}>
                          <div className="h-full rounded-full" style={{
                            width: `${q.correctRate}%`,
                            background: q.correctRate >= 70 ? "#22c55e" : q.correctRate >= 50 ? "#d97706" : "#dc2626",
                          }} />
                        </div>
                        <span className="text-xs font-bold w-10 text-right" style={{
                          color: q.correctRate >= 70 ? "#16a34a" : q.correctRate >= 50 ? "#d97706" : "#dc2626",
                        }}>
                          {q.correctRate}%
                        </span>
                      </div>
                      <p className="text-[10px] mt-0.5 text-right" style={{ color: "var(--text-sub)" }}>correct rate</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        )}

        {/* Certificates tab */}
        {tab === "certs" && (
          certsLoading ? (
            <div className="p-5 space-y-3">{[1, 2].map((i) => <SkeletonBlock key={i} h="5rem" />)}</div>
          ) : certificates.length === 0 ? (
            <div className="py-14 text-center">
              <span className="flex justify-center mb-3" style={{ color: "var(--text-sub)" }}><IconAward size={32} /></span>
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
                        <span className="text-sm font-semibold font-mono" style={{ color: "var(--text)" }}>{c.certificateNo}</span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: `${color}18`, color }}>{c.performanceName}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs" style={{ color: "var(--text-sub)" }}>
                        <span className="flex items-center gap-1"><IconCalendar size={11} />{formatDate(c.issuedAt)}</span>
                        <span>·</span>
                        <span className="font-semibold" style={{ color: "var(--text-muted)" }}>
                          {c.percentage.toFixed(0)}% · {c.score}/{c.maxScore} pts
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleDownload(c.attemptId, c.certificateNo)}
                        disabled={downloadingId === c.attemptId}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-60"
                        style={{ background: "rgba(34,197,94,0.08)", color: "#16a34a", border: "1px solid rgba(34,197,94,0.15)" }}>
                        <IconDownload size={12} />
                        {downloadingId === c.attemptId ? "…" : "PDF"}
                      </button>
                      <button
                        onClick={() => handlePrint(c.attemptId, c.certificateNo)}
                        disabled={printingId === c.attemptId}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-60"
                        style={{ background: "rgba(235,10,30,0.08)", color: "#EB0A1E", border: "1px solid rgba(235,10,30,0.15)" }}>
                        <IconPrinter size={12} />
                        {printingId === c.attemptId ? "…" : "Print"}
                      </button>
                    </div>
                  </div>
                );
              })}
              {printError && (
                <p className="text-xs" style={{ color: "#dc2626" }}>{printError}</p>
              )}
            </div>
          )
        )}
      </div>
    </div>
  );
}
