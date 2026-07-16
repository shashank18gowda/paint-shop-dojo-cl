"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import {
  IconSearch, IconChevronDown, IconChevronLeft, IconChevronRight,
  IconDownload, IconTrendingUp, IconTrendingDown, IconUsers,
  IconAward, IconCheck, IconArrowLeft,
} from "../../../components/icons";
import { ReportNav } from "../../../components/ReportNav";
import { useParticipantRankings } from "../../../lib/hooks/useReports";
import { useDesignations } from "../../../lib/hooks/useDesignations";
import { useLines } from "../../../lib/hooks/useLines";
import { usePlants } from "@/app/lib/hooks/usePlants";
import { downloadParticipantRankingsExport } from "../../../lib/api/export.api";

type SortKey = "rank" | "attempts" | "passRate" | "avgScore" | "bestScore" | "lastAttempt";

function FilterSelect({ value, onChange, options }: {
  value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string }[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none pl-3 pr-8 py-2 text-sm rounded-lg cursor-pointer focus:outline-none"
        style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text)" }}
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-sub)" }}>
        <IconChevronDown size={13} />
      </span>
    </div>
  );
}

function SortHeader({
  label, k, sortKey, sortDir, onSort, align = "left", width,
}: {
  label: string;
  k: SortKey;
  sortKey: SortKey;
  sortDir: "asc" | "desc";
  onSort: (k: SortKey) => void;
  align?: "left" | "right";
  width?: string;
}) {
  const active = sortKey === k;
  return (
    <th
      className={`px-4 py-3 text-${align} text-xs font-semibold tracking-wide cursor-pointer select-none`}
      style={{ color: active ? "var(--text)" : "var(--text-muted)", width }}
      onClick={() => onSort(k)}
    >
      <span className={`inline-flex items-center gap-1 ${align === "right" ? "flex-row-reverse" : ""}`}>
        {label}
        <span className="inline-flex flex-col -space-y-1 leading-none" style={{ color: active ? "#EB0A1E" : "var(--text-sub)" }}>
          <span className="text-[7px]" style={{ opacity: active && sortDir === "asc" ? 1 : 0.35 }}>▲</span>
          <span className="text-[7px]" style={{ opacity: active && sortDir === "desc" ? 1 : 0.35 }}>▼</span>
        </span>
      </span>
    </th>
  );
}

function RankBadge({ rank }: { rank: number }) {
  const medal = rank === 1 ? "#fbbf24" : rank === 2 ? "#94a3b8" : rank === 3 ? "#d97706" : null;
  return (
    <div
      className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold shrink-0"
      style={{
        background: medal ?? "var(--content-bg)",
        color: medal ? "#fff" : "var(--text-sub)",
        border: medal ? "none" : "1px solid var(--border)",
      }}
    >
      {rank}
    </div>
  );
}

function PerfChip({ name, color }: { name: string; color: string }) {
  return (
    <span
      className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full"
      style={{ background: `${color}18`, color }}
    >
      {name}
    </span>
  );
}

function ScoreBar({ value }: { value: number }) {
  const color = value >= 80 ? "#16a34a" : value >= 65 ? "#3b82f6" : value >= 50 ? "#d97706" : "#dc2626";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--content-bg)" }}>
        <div className="h-full rounded-full" style={{ width: `${value}%`, background: color }} />
      </div>
      <span className="text-xs font-bold w-10 text-right" style={{ color }}>
        {value.toFixed(1)}%
      </span>
    </div>
  );
}

function SkeletonRow() {
  return (
    <tr style={{ borderBottom: "1px solid var(--border)" }}>
      {Array.from({ length: 10 }).map((_, i) => (
        <td key={i} className="px-4 py-3.5">
          <div className="h-4 rounded animate-pulse" style={{ background: "var(--content-bg)", width: "80%" }} />
        </td>
      ))}
    </tr>
  );
}

function timeAgo(iso: string | null): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 60) return m <= 1 ? "Just now" : `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d === 1) return "Yesterday";
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

const PAGE_LIMIT = 20;

export default function ParticipantsReportPage() {
  const [search, setSearch] = useState("");
  const [desgId, setDesgId] = useState("");
  const [lineId, setLineId] = useState("");
  const [plantId, setPlantId] = useState("");
  const [perfCode, setPerfCode] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("rank");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [isExporting, setIsExporting] = useState(false);

  const { data: desgs } = useDesignations();
  const { data: lines } = useLines();
  const { data: plants } = usePlants();

  const rankingFilters = {
    search: search || undefined,
    designationId: desgId || undefined,
    lineId: lineId || undefined,
    plantId: plantId || undefined,
    performanceLevelCode: perfCode || undefined,
    sortBy: sortKey,
    sortDir,
  };

  const { data, isLoading } = useParticipantRankings({
    page,
    limit: PAGE_LIMIT,
    ...rankingFilters,
  });

  async function handleExport() {
    setIsExporting(true);
    try {
      await downloadParticipantRankingsExport(rankingFilters);
    } catch {
      // ignore download errors for now
    } finally {
      setIsExporting(false);
    }
  }

  const onSort = useCallback((k: SortKey) => {
    if (sortKey === k) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(k);
      setSortDir(k === "rank" ? "asc" : "desc");
    }
    setPage(1);
  }, [sortKey]);

  const resetFilters = () => {
    setSearch(""); setPlantId(""); setDesgId(""); setLineId(""); setPerfCode(""); setPage(1);
  };

  const filtersDirty = search || desgId || lineId || perfCode;

  const rows = data?.data ?? [];
  const kpis = data?.kpis;
  const totalPages = data?.pages ?? 1;
  const totalRows = data?.total ?? 0;

    const plantOptions = [
    { label: "All Plants", value: "" },
    ...(plants ?? []).map((p) => ({ label: p.name, value: p.id })),
  ];
  const desgOptions = [
    { label: "All Designations", value: "" },
    ...(desgs ?? []).map((d) => ({ label: d.name, value: d.id })),
  ];
  const lineOptions = [
    { label: "All Lines", value: "" },
    ...(lines ?? []).map((l) => ({ label: l.name, value: l.id })),
  ];
  const perfOptions = [
    { label: "All Levels", value: "" },
    ...(data?.performanceLevels ?? []).map((p) => ({ label: p.label, value: p.code })),
  ];


  // Pagination range
  const pageNums: (number | "...")[] = [];
  if (totalPages <= 5) {
    for (let i = 1; i <= totalPages; i++) pageNums.push(i);
  } else {
    pageNums.push(1);
    if (page > 3) pageNums.push("...");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pageNums.push(i);
    if (page < totalPages - 2) pageNums.push("...");
    pageNums.push(totalPages);
  }

  return (
    <div className="p-8 space-y-6 max-w-7xl">

      <ReportNav active="participants" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/reports"
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
            style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
          >
            <IconArrowLeft size={15} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Participant Report</h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
              Per-learner performance ranked by average score
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
            style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text)" }}
          >
            <IconDownload size={14} />
            {isExporting ? "Exporting…" : "Export CSV"}
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg mb-4" style={{ background: "rgba(59,130,246,0.10)", color: "#3b82f6" }}>
            <IconUsers size={18} />
          </div>
          {isLoading
            ? <div className="h-7 w-16 rounded animate-pulse" style={{ background: "var(--content-bg)" }} />
            : <p className="text-2xl font-bold" style={{ color: "var(--text)" }}>{kpis?.totalLearners ?? 0}</p>
          }
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Active Learners</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-sub)" }}>at least 1 attempt</p>
        </div>

        <div className="rounded-xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg mb-4" style={{ background: "rgba(34,197,94,0.10)", color: "#22c55e" }}>
            <IconCheck size={18} />
          </div>
          {isLoading
            ? <div className="h-7 w-24 rounded animate-pulse" style={{ background: "var(--content-bg)" }} />
            : (
              <p className="text-2xl font-bold" style={{ color: "var(--text)" }}>
                {kpis?.passingLearners ?? 0}
                <span className="text-sm font-medium ml-1" style={{ color: "var(--text-sub)" }}>/ {kpis?.totalLearners ?? 0}</span>
              </p>
            )
          }
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Avg ≥ 65%</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-sub)" }}>learners meeting threshold</p>
        </div>

        <div className="rounded-xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg mb-4" style={{ background: "rgba(235,10,30,0.10)", color: "#EB0A1E" }}>
            <IconAward size={18} />
          </div>
          {isLoading
            ? <div className="h-7 w-20 rounded animate-pulse" style={{ background: "var(--content-bg)" }} />
            : <p className="text-2xl font-bold" style={{ color: "var(--text)" }}>{kpis?.avgScoreAll ?? 0}%</p>
          }
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Overall Avg Score</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-sub)" }}>across all learners</p>
        </div>

      </div>

      {/* Filters */}
      <div className="rounded-xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-52">
            <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-sub)" }}>
              <IconSearch size={15} />
            </span>
            <input
              type="text"
              placeholder="Search by name or employee code…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg focus:outline-none"
              style={{ background: "var(--content-bg)", border: "1px solid var(--border)", color: "var(--text)" }}
            />
          </div>
          <FilterSelect value={plantId} onChange={(v) => { setPlantId(v); setPage(1); }} options={plantOptions} />
          <FilterSelect value={desgId} onChange={(v) => { setDesgId(v); setPage(1); }} options={desgOptions} />
          <FilterSelect value={lineId} onChange={(v) => { setLineId(v); setPage(1); }} options={lineOptions} />
          <FilterSelect value={perfCode} onChange={(v) => { setPerfCode(v); setPage(1); }} options={perfOptions} />
          {filtersDirty && (
            <button
              onClick={resetFilters}
              className="text-xs font-medium px-3 py-2 rounded-lg"
              style={{ color: "#EB0A1E", background: "rgba(235,10,30,0.06)" }}
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--content-bg)" }}>
              <SortHeader label="Rank"     k="rank"        sortKey={sortKey} sortDir={sortDir} onSort={onSort} width="6rem" />
              <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide" style={{ color: "var(--text-muted)" }}>Participant</th>
              <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide" style={{ color: "var(--text-muted)" }}>Desg / Line</th>
              <SortHeader label="Attempts" k="attempts"    sortKey={sortKey} sortDir={sortDir} onSort={onSort} align="right" width="6rem" />
              {/* <SortHeader label="Pass Rate" k="passRate"   sortKey={sortKey} sortDir={sortDir} onSort={onSort} align="right" width="6rem" /> */}
              <SortHeader label="Avg Score" k="avgScore"   sortKey={sortKey} sortDir={sortDir} onSort={onSort} width="13rem" />
              <SortHeader label="Best"      k="bestScore"  sortKey={sortKey} sortDir={sortDir} onSort={onSort} align="right" width="5rem" />
              <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide w-32" style={{ color: "var(--text-muted)" }}>Performance</th>
              {/* <th className="px-4 py-3 text-right text-xs font-semibold tracking-wide w-24" style={{ color: "var(--text-muted)" }}>Trend</th> */}
              <SortHeader label="Last"      k="lastAttempt" sortKey={sortKey} sortDir={sortDir} onSort={onSort} align="right" width="6rem" />
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 10 }).map((_, i) => <SkeletonRow key={i} />)
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-12 text-center text-sm" style={{ color: "var(--text-sub)" }}>
                  No participants match your filters.
                </td>
              </tr>
            ) : rows.map((r, i) => (
              <tr
                key={r.id}
                style={{ borderBottom: i < rows.length - 1 ? "1px solid var(--border)" : "none" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "var(--content-bg)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "transparent"; }}
              >
                <td className="px-4 py-3.5">
                  <RankBadge rank={r.rank} />
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold shrink-0"
                      style={{ background: "rgba(235,10,30,0.08)", color: "#EB0A1E" }}
                    >
                      {r.initials}
                    </div>
                    <div className="min-w-0">
                      <Link
                        href={`/reports/participants/${r.id}`}
                        className="font-semibold hover:underline truncate block"
                        style={{ color: "var(--text)" }}
                      >
                        {r.name}
                      </Link>
                      <p className="text-xs font-mono" style={{ color: "var(--text-sub)" }}>{r.code}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <p className="text-sm" style={{ color: "var(--text)" }}>{r.designation}</p>
                  <p className="text-xs" style={{ color: "var(--text-sub)" }}>{r.line}</p>
                </td>
                <td className="px-4 py-3.5 text-right text-sm tabular-nums" style={{ color: "var(--text-muted)" }}>
                  {r.attempts}
                </td>
                {/* <td className="px-4 py-3.5 text-right">
                  <span
                    className="text-sm font-semibold tabular-nums"
                    style={{ color: r.passRate >= 70 ? "#16a34a" : r.passRate >= 50 ? "#d97706" : "#dc2626" }}
                  >
                    {r.passRate}%
                  </span>
                </td> */}
                <td className="px-4 py-3.5">
                  <ScoreBar value={r.avgScore} />
                </td>
                <td className="px-4 py-3.5 text-right text-sm font-semibold tabular-nums" style={{ color: "var(--text)" }}>
                  {r.bestScore.toFixed(0)}%
                </td>
                <td className="px-4 py-3.5">
                  <PerfChip name={r.performance} color={r.performanceColor} />
                </td>
                {/* <td className="px-4 py-3.5 text-right">
                  <span
                    className="inline-flex items-center gap-1 text-xs font-semibold"
                    style={{ color: r.deltaScore >= 0 ? "#16a34a" : "#dc2626" }}
                  >
                    {r.deltaScore >= 0 ? <IconTrendingUp size={11} /> : <IconTrendingDown size={11} />}
                    {r.deltaScore >= 0 ? "+" : ""}{r.deltaScore.toFixed(1)}
                  </span>
                </td> */}
                <td className="px-4 py-3.5 text-right text-xs" style={{ color: "var(--text-muted)" }}>
                  {timeAgo(r.lastAttempt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ borderTop: "1px solid var(--border)", background: "var(--content-bg)" }}
        >
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {isLoading
              ? "Loading…"
              : `Showing ${Math.min((page - 1) * PAGE_LIMIT + 1, totalRows)}–${Math.min(page * PAGE_LIMIT, totalRows)} of ${totalRows} learners`
            }
          </p>
          <div className="flex items-center gap-1">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="flex h-7 w-7 items-center justify-center rounded-md text-xs disabled:opacity-40"
              style={{ color: "var(--text-muted)", border: "1px solid var(--border)" }}
            >
              <IconChevronLeft size={13} />
            </button>
            {pageNums.map((p, i) =>
              p === "..." ? (
                <span key={`el-${i}`} className="flex h-7 w-7 items-center justify-center text-xs" style={{ color: "var(--text-muted)" }}>…</span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p as number)}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-xs font-medium"
                  style={
                    p === page
                      ? { background: "#EB0A1E", color: "#fff" }
                      : { color: "var(--text-muted)", border: "1px solid transparent" }
                  }
                >
                  {p}
                </button>
              )
            )}
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="flex h-7 w-7 items-center justify-center rounded-md text-xs disabled:opacity-40"
              style={{ color: "var(--text-muted)", border: "1px solid var(--border)" }}
            >
              <IconChevronRight size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
