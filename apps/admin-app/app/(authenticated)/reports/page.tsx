"use client";

import { useState } from "react";
import {
  IconChevronDown,
  IconDownload,
  IconTrendingUp,
  IconTrendingDown,
  IconCheck,
  IconClock,
  IconUsers,
  IconAlertCircle,
} from "../../components/icons";
import { ReportNav } from "../../components/ReportNav";
import { useReportOverview } from "../../lib/hooks/useReportOverview";
import { downloadReportOverviewExport } from "../../lib/api/export.api";

const RANGES = [
  "Last 7 days",
  "Last 30 days",
  "Last 90 days",
  "This year",
  "All time",
];

const RANGE_DAYS: Record<string, number> = {
  "Last 7 days": 7,
  "Last 30 days": 30,
  "Last 90 days": 90,
  "This year": 365,
  "All time": 365,
};

// Desg colors cycle
const DESG_COLORS = [
  "#EB0A1E",
  "#3b82f6",
  "#a855f7",
  "#22c55e",
  "#f59e0b",
  "#06b6d4",
];

function FilterSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div className="relative flex-1 min-w-[140px] sm:flex-none">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none pl-3 pr-8 py-2 text-sm rounded-lg cursor-pointer focus:outline-none"
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          color: "var(--text)",
        }}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <span
        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2"
        style={{ color: "var(--text-sub)" }}
      >
        <IconChevronDown size={13} />
      </span>
    </div>
  );
}

function SkeletonBar({ w = "100%", h = "1rem" }: { w?: string; h?: string }) {
  return (
    <div
      className="rounded animate-pulse"
      style={{ width: w, height: h, background: "var(--content-bg)" }}
    />
  );
}

export default function ReportsPage() {
  const [range, setRange] = useState("Last 30 days");
  const [desg, setDesg] = useState("All Designations");
  const [plant, setPlant] = useState("All Plants");
  const [line, setLine] = useState("All Lines");
  const [isExporting, setIsExporting] = useState(false);
  const days = RANGE_DAYS[range] ?? 30;

  const filters = {
    designation: desg !== "All Designations" ? desg : undefined,

    plant: plant !== "All Plants" ? plant : undefined,

    line: line !== "All Lines" ? line : undefined,

    days,
  };
  const { data: report, isLoading } = useReportOverview(filters);

  async function handleExport() {
    setIsExporting(true);
    try {
      await downloadReportOverviewExport(filters);
    } catch {
      // ignore download errors for now
    } finally {
      setIsExporting(false);
    }
  }

  const topPerformers = report?.topPerformers;
  const hardestQuestions = report?.hardestQuestions;
  const lineStats = report?.lineStats;

  // Build desg list from report data
  const desgNames = report?.designationStats.map((d) => d.name) ?? [];
  const desgOptions = ["All Designations", ...desgNames];

  // Build plant list from report data
  const plantNames = report?.plantStats.map((p) => p.name) ?? [];
  const plantOptions = ["All Plants", ...plantNames];

  // Build line list from report data
  const lineNames = report?.lineStats.map((l) => l.name) ?? [];
  const lineOptions = ["All Lines", ...lineNames];

  // Filtered desg stats
  const desgPerf = (report?.designationStats ?? [])
    .filter((d) => desg === "All Designations" || d.name === desg)
    .map((d, i) => ({ ...d, color: DESG_COLORS[i % DESG_COLORS.length] }));

  // KPI cards derived from report
  const kpis = report?.kpis;
  const totalAttempts = report?.performanceDistribution.totalAttempts ?? 0;

  const kpiCards = [
    {
      label: "Total Attempts",
      value: totalAttempts.toLocaleString(),
      trend: kpis ? `+${kpis.sessionsToday}` : "—",
      trendLabel: "today",
      up: true,
      icon: IconUsers,
      color: "#3b82f6",
      bg: "rgba(59,130,246,0.10)",
    },
    {
      label: "Pass Rate",
      value: kpis ? `${kpis.passRate.toFixed(1)}%` : "—",
      trend: kpis
        ? `${kpis.passRateDelta >= 0 ? "+" : ""}${kpis.passRateDelta.toFixed(1)}%`
        : "—",
      trendLabel: "vs prev week",
      up: (kpis?.passRateDelta ?? 0) >= 0,
      icon: IconCheck,
      color: "#22c55e",
      bg: "rgba(34,197,94,0.10)",
    },
    {
      label: "Avg Score",
      value: kpis ? `${kpis.avgScore.toFixed(1)}%` : "—",
      trend: kpis
        ? `${kpis.avgScoreDelta >= 0 ? "+" : ""}${kpis.avgScoreDelta.toFixed(1)}%`
        : "—",
      trendLabel: "vs prev week",
      up: (kpis?.avgScoreDelta ?? 0) >= 0,
      icon: IconTrendingUp,
      color: "#EB0A1E",
      bg: "rgba(235,10,30,0.10)",
    },
    {
      label: "Sessions Today",
      value: kpis ? String(kpis.sessionsToday) : "—",
      trend: kpis
        ? `${kpis.sessionsToday >= kpis.sessionsYesterday ? "+" : ""}${kpis.sessionsToday - kpis.sessionsYesterday}`
        : "—",
      trendLabel: "vs yesterday",
      up: (kpis?.sessionsToday ?? 0) >= (kpis?.sessionsYesterday ?? 0),
      icon: IconClock,
      color: "#a855f7",
      bg: "rgba(168,85,247,0.10)",
    },
  ];

  return (
    <div className="p-4 space-y-6 max-w-7xl sm:p-8">
      <ReportNav active="overview" />

      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>
            Reports
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
            Training performance overview{" "}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <FilterSelect value={range} onChange={setRange} options={RANGES} />
          <FilterSelect
            value={plant}
            onChange={setPlant}
            options={plantOptions}
          />
          <FilterSelect value={line} onChange={setLine} options={lineOptions} />
          <FilterSelect value={desg} onChange={setDesg} options={desgOptions} />
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              color: "var(--text)",
            }}
          >
            <IconDownload size={14} />
            {isExporting ? "Exporting…" : "Export Excel"}
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((k) => {
          const Icon = k.icon;
          const TrendIcon = k.up ? IconTrendingUp : IconTrendingDown;
          return (
            <div
              key={k.label}
              className="rounded-xl p-5"
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg"
                  style={{ background: k.bg, color: k.color }}
                >
                  <Icon size={18} />
                </div>
                {isLoading ? (
                  <SkeletonBar w="4rem" h="1rem" />
                ) : (
                  <span
                    className="flex items-center gap-1 text-xs font-medium"
                    style={{ color: k.up ? "#16a34a" : "#dc2626" }}
                  >
                    <TrendIcon size={12} />
                    {k.trend}
                  </span>
                )}
              </div>
              {isLoading ? (
                <SkeletonBar w="60%" h="1.5rem" />
              ) : (
                <p
                  className="text-2xl font-bold mb-0.5"
                  style={{ color: "var(--text)" }}
                >
                  {k.value}
                </p>
              )}
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                {k.label}
              </p>
              <p
                className="text-xs mt-0.5"
                style={{ color: "var(--text-sub)" }}
              >
                {k.trendLabel}
              </p>
            </div>
          );
        })}
      </div>

      {/* Designation Performance + Top Performers */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        {/* Desg comparison */}
        <div
          className="rounded-xl p-6 xl:col-span-3"
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
          }}
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2
                className="text-base font-semibold"
                style={{ color: "var(--text)" }}
              >
                Designation Performance
              </h2>
              <p
                className="text-xs mt-0.5"
                style={{ color: "var(--text-sub)" }}
              >
                Pass rate and average score by designation
              </p>
            </div>
          </div>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((n) => (
                <SkeletonBar key={n} h="2.5rem" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {desgPerf.map((d) => (
                <div key={d.name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ background: d.color }}
                      />
                      <span
                        className="text-sm font-semibold"
                        style={{ color: "var(--text)" }}
                      >
                        {d.name}
                      </span>
                      <span
                        className="text-xs"
                        style={{ color: "var(--text-sub)" }}
                      >
                        · {d.participants} participants
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span
                        className="text-xs"
                        style={{ color: "var(--text-muted)" }}
                      >
                        Avg{" "}
                        <span
                          className="font-semibold"
                          style={{ color: "var(--text)" }}
                        >
                          {d.avgScore}%
                        </span>
                      </span>
                      <span
                        className="text-sm font-bold w-10 text-right"
                        style={{
                          color: d.passRate >= 70 ? "#16a34a" : "#d97706",
                        }}
                      >
                        {d.passRate}%
                      </span>
                    </div>
                  </div>
                  <div
                    className="relative h-3 rounded-full overflow-hidden"
                    style={{ background: "var(--content-bg)" }}
                  >
                    <div
                      className="absolute left-0 top-0 h-full rounded-full"
                      style={{ width: `${d.passRate}%`, background: d.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Line stats */}
          <div
            className="mt-7 pt-5"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            <h3
              className="text-sm font-semibold mb-3"
              style={{ color: "var(--text)" }}
            >
              Line Performance
            </h3>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((n) => (
                  <SkeletonBar key={n} h="2rem" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {(lineStats ?? []).map((l) => (
                  <div
                    key={l.id}
                    className="flex items-center gap-3 p-2 rounded-lg"
                    style={{ background: "var(--content-bg)" }}
                  >
                    <p
                      className="text-xs font-medium flex-1 truncate"
                      style={{ color: "var(--text)" }}
                    >
                      {l.name}
                    </p>
                    <span
                      className="text-xs"
                      style={{ color: "var(--text-sub)" }}
                    >
                      {l.attempts} attempts
                    </span>
                    <span
                      className="text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Avg {l.avgScore}%
                    </span>
                    <span
                      className="text-xs font-bold w-12 text-right"
                      style={{
                        color: l.passRate >= 70 ? "#16a34a" : "#d97706",
                      }}
                    >
                      {l.passRate}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Top performers */}
        <div
          className="rounded-xl p-6 xl:col-span-2"
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
          }}
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2
                className="text-base font-semibold"
                style={{ color: "var(--text)" }}
              >
                Top Performers
              </h2>
              <p
                className="text-xs mt-0.5"
                style={{ color: "var(--text-sub)" }}
              >
                {desg === "All Designations"
                  ? "Highest avg score overall"
                  : `Highest avg score in ${desg}`}
              </p>
            </div>
          </div>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <SkeletonBar key={n} h="3rem" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {(topPerformers ?? []).map((p, i) => {
                const medal =
                  i === 0
                    ? "#fbbf24"
                    : i === 1
                      ? "#94a3b8"
                      : i === 2
                        ? "#d97706"
                        : null;
                return (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 p-2.5 rounded-lg"
                    style={{ background: "var(--content-bg)" }}
                  >
                    <div
                      className="flex h-7 w-7 items-center justify-center shrink-0 rounded-full text-xs font-bold"
                      style={{
                        background: medal ?? "var(--card)",
                        color: medal ? "#fff" : "var(--text-sub)",
                        border: medal ? "none" : "1px solid var(--border)",
                      }}
                    >
                      {i + 1}
                    </div>
                    <div
                      className="flex h-8 w-8 items-center justify-center shrink-0 rounded-full text-[10px] font-bold"
                      style={{
                        background: "rgba(235,10,30,0.08)",
                        color: "#EB0A1E",
                      }}
                    >
                      {p.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-semibold truncate"
                        style={{ color: "var(--text)" }}
                      >
                        {p.name}
                      </p>
                      <p
                        className="text-[11px]"
                        style={{ color: "var(--text-sub)" }}
                      >
                        {p.desg} · {p.attempts} attempts
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className="text-sm font-bold"
                        style={{ color: "#16a34a" }}
                      >
                        {p.avgScore}%
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Hardest Questions */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      >
        <div className="p-6 pb-4 flex items-center justify-between">
          <div>
            <h2
              className="text-base font-semibold"
              style={{ color: "var(--text)" }}
            >
              Hardest Questions
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-sub)" }}>
              Questions with the lowest correct-answer rate · review for clarity
            </p>
          </div>
          {!isLoading && hardestQuestions && hardestQuestions.length > 0 && (
            <div
              className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg"
              style={{ background: "rgba(245,158,11,0.08)", color: "#92400e" }}
            >
              <IconAlertCircle size={13} />
              <span className="font-medium">
                {hardestQuestions.filter((q) => q.correctRate < 55).length}{" "}
                questions below 55% correct rate
              </span>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="p-6 pt-0 space-y-3">
            {[1, 2, 3, 4, 5].map((n) => (
              <SkeletonBar key={n} h="2.5rem" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr
                style={{
                  borderBottom: "1px solid var(--border)",
                  background: "var(--content-bg)",
                }}
              >
                <th
                  className="px-6 py-3 text-left text-xs font-semibold tracking-wide"
                  style={{ color: "var(--text-muted)" }}
                >
                  Question
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold tracking-wide w-20"
                  style={{ color: "var(--text-muted)" }}
                >
                  Type
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold tracking-wide w-24"
                  style={{ color: "var(--text-muted)" }}
                >
                  Difficulty
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold tracking-wide w-24"
                  style={{ color: "var(--text-muted)" }}
                >
                  Attempts
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold tracking-wide w-44"
                  style={{ color: "var(--text-muted)" }}
                >
                  Correct Rate
                </th>
              </tr>
            </thead>
            <tbody>
              {(hardestQuestions ?? []).length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-sm"
                    style={{ color: "var(--text-sub)" }}
                  >
                    Not enough data yet.
                  </td>
                </tr>
              ) : (
                (hardestQuestions ?? []).map((q, i) => (
                  <tr
                    key={q.id}
                    style={{
                      borderBottom:
                        i < (hardestQuestions ?? []).length - 1
                          ? "1px solid var(--border)"
                          : "none",
                    }}
                    onMouseEnter={(e) => {
                      (
                        e.currentTarget as HTMLTableRowElement
                      ).style.background = "var(--content-bg)";
                    }}
                    onMouseLeave={(e) => {
                      (
                        e.currentTarget as HTMLTableRowElement
                      ).style.background = "transparent";
                    }}
                  >
                    <td className="px-6 py-3.5">
                      <p
                        className="font-medium line-clamp-1"
                        style={{ color: "var(--text)" }}
                      >
                        {q.text}
                      </p>
                      {/* <p className="text-xs mt-0.5 font-mono" style={{ color: "var(--text-sub)" }}>{q.id.slice(0, 8)}</p> */}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className="text-xs font-mono font-bold px-1.5 py-0.5 rounded"
                        style={{
                          background:
                            q.type === "SC"
                              ? "rgba(59,130,246,0.10)"
                              : "rgba(168,85,247,0.10)",
                          color: q.type === "SC" ? "#3b82f6" : "#a855f7",
                        }}
                      >
                        {q.type}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <span
                            key={n}
                            className="w-1.5 h-1.5 rounded-full"
                            style={{
                              background:
                                q.difficulty !== null && n <= q.difficulty
                                  ? "#EB0A1E"
                                  : "var(--border)",
                            }}
                          />
                        ))}
                      </div>
                    </td>
                    <td
                      className="px-4 py-3.5 text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {q.attempts}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div
                          className="flex-1 h-1.5 rounded-full overflow-hidden"
                          style={{ background: "var(--content-bg)" }}
                        >
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${q.correctRate}%`,
                              background:
                                q.correctRate >= 70
                                  ? "#22c55e"
                                  : q.correctRate >= 50
                                    ? "#d97706"
                                    : "#dc2626",
                            }}
                          />
                        </div>
                        <span
                          className="text-xs font-bold w-10 text-right"
                          style={{
                            color:
                              q.correctRate >= 70
                                ? "#16a34a"
                                : q.correctRate >= 50
                                  ? "#d97706"
                                  : "#dc2626",
                          }}
                        >
                          {q.correctRate}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  );
}
