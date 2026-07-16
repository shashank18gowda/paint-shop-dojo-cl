"use client";

import Link from "next/link";
import { useState } from "react";
import {
  IconUsers, IconTrendingUp, IconTrendingDown, IconCheck,
  IconUserPlus, IconUpload, IconDownload, IconTrophy, IconClock,
} from "../../components/icons";
import {
  useDashboard,
  useDesignationScoreBreakdown,
  useLineDistribution,
  useMonthlyParticipants,
  useScoreBreakdown,
} from "../../lib/hooks/useDashboard";
import { useDesignations } from "../../lib/hooks/useDesignations";
import { useLines } from "../../lib/hooks/useLines";
import { usePlants } from "../../lib/hooks/usePlants";
import { downloadSessionsExport } from "../../lib/api/export.api";
import type {
  DesignationScoreRow,
  LineDistributionRow,
  MonthlyParticipantPoint,
  PeriodFilters as DashboardPeriodFilters,
  ScoreBucket,
} from "../../lib/api/dashboard.api";
// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(iso: string | null | undefined): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function sign(n: number): string {
  return n >= 0 ? `+${n}` : `${n}`;
}

function formatPct(n: number): string {
  return Number.isInteger(n) ? `${n}%` : `${n.toFixed(1)}%`;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ h, w = "100%" }: { h: number; w?: string }) {
  return (
    <div
      className="animate-pulse rounded-lg"
      style={{ height: h, width: w, background: "var(--content-bg)" }}
    />
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
}) {
  return (
   <label className="flex min-w-0 flex-col gap-1">
      <span className="text-[11px] font-medium" style={{ color: "var(--text-sub)" }}>{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-full min-w-0 rounded-lg px-3 text-xs outline-none"
        style={{ background: "var(--content-bg)", border: "1px solid var(--border)", color: "var(--text)" }}
      >
        {options.map((option) => (
          <option key={option.value || option.label} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  );
}

function DateFilter({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex min-w-0 flex-col gap-1">
      <span className="text-[11px] font-medium" style={{ color: "var(--text-sub)" }}>{label}</span>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
            className="h-9 w-full min-w-0 rounded-lg px-3 text-xs outline-none"
        style={{ background: "var(--content-bg)", border: "1px solid var(--border)", color: "var(--text)" }}
      />
    </label>
  );
}

function PeriodFilters({
  value,
  onChange,
}: {
  value: DashboardPeriodFilters;
  onChange: (value: DashboardPeriodFilters) => void;
}) {
  return (
    <>
      <FilterSelect
        label="Period"
        value={value.period ?? "ALL"}
        onChange={(period) => onChange({ ...value, period: period as DashboardPeriodFilters["period"] })}
        options={[
          { label: "All Time", value: "ALL" },
          { label: "Weekly", value: "WEEKLY" },
          { label: "Monthly", value: "MONTHLY" },
          { label: "Date Range", value: "DATE_RANGE" },
        ]}
      />
      <DateFilter
        label="From"
        value={value.from ?? ""}
        onChange={(from) => onChange({ ...value, from, period: "DATE_RANGE" })}
      />
      <DateFilter
        label="To"
        value={value.to ?? ""}
        onChange={(to) => onChange({ ...value, to, period: "DATE_RANGE" })}
      />
    </>
  );
}
function MonthlyParticipantsChart({
  data,
  loading,
}: {
  data: MonthlyParticipantPoint[];
  loading: boolean;
}) {
  const max = Math.max(...data.map((item) => item.participants), 1);

  if (loading) {
    return (
      <div className="flex h-64 items-end gap-3">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton key={i} h={80 + (i % 4) * 28} />
        ))}
      </div>
    );
  }

  return (
    <div className="h-64">
      <div className="flex h-52 items-end gap-3 border-b" style={{ borderColor: "var(--border)" }}>
        {data.map((item) => {
          const height = `${Math.max(5, (item.participants / max) * 100)}%`;
          return (
            <div key={item.month} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
              <span className="text-[11px] font-semibold" style={{ color: "var(--text)" }}>{item.participants}</span>
              <div
                className="w-full rounded-t-md transition-all"
                style={{ height, background: "linear-gradient(180deg, #EB0A1E 0%, #f97316 100%)" }}
                title={`${item.month}: ${item.participants} participants`}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-2 grid grid-cols-12 gap-3">
        {data.map((item) => (
          <span key={item.month} className="text-center text-[10px] font-medium" style={{ color: "var(--text-sub)" }}>
            {item.month}
          </span>
        ))}
      </div>
    </div>
  );
}

function ScorePieChart({
  buckets,
  total,
  loading,
}: {
  buckets: ScoreBucket[];
  total: number;
  loading: boolean;
}) {
  let cursor = 0;
  const gradient = total > 0
    ? buckets.map((bucket) => {
        const size = (bucket.count / total) * 100;
        const segment = `${bucket.color} ${cursor}% ${cursor + size}%`;
        cursor += size;
        return segment;
      }).join(", ")
    : "var(--content-bg) 0% 100%";

  if (loading) {
    return (
       <div className="grid gap-6 sm:grid-cols-[180px_1fr] sm:items-center">
        <Skeleton h={180} w="180px" />
        <div className="space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} h={30} />)}</div>
      </div>
    );
  }

  return (
<div className="grid gap-6 sm:grid-cols-[180px_1fr] sm:items-center">      <div
        className="relative h-44 w-44 rounded-full"
        style={{ background: `conic-gradient(${gradient})` }}
        aria-label="Score breakdown pie chart"
      >
        <div
          className="absolute inset-10 flex flex-col items-center justify-center rounded-full text-center"
          style={{ background: "var(--card)" }}
        >
          <span className="text-2xl font-bold" style={{ color: "var(--text)" }}>{total}</span>
          <span className="text-[10px] font-medium uppercase tracking-wide" style={{ color: "var(--text-sub)" }}>
            Attempts
          </span>
        </div>
      </div>
      <div className="space-y-2">
        {buckets.map((bucket) => (
          <div key={bucket.code} className="flex items-center justify-between gap-4 rounded-lg px-3 py-2" style={{ background: "var(--content-bg)" }}>
            <div className="flex min-w-0 items-center gap-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: bucket.color }} />
              <span className="text-sm font-medium" style={{ color: "var(--text)" }}>{bucket.label}</span>
            </div>
            <div className="shrink-0 text-right">
              <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>{bucket.count}</span>
              <span className="ml-2 text-xs" style={{ color: "var(--text-sub)" }}>{bucket.pct}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DesignationScoreBarChart({
  rows,
  loading,
}: {
  rows: DesignationScoreRow[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="grid grid-cols-[120px_1fr] items-center gap-3">
            <Skeleton h={14} />
            <Skeleton h={28} />
          </div>
        ))}
      </div>
    );
  }

  if (!rows.length) {
    return <p className="py-10 text-center text-sm" style={{ color: "var(--text-sub)" }}>No designation score data for this period.</p>;
  }

  return (
    <div className="space-y-4">
      {rows.map((row) => (
        <div key={row.id} className="grid gap-2 lg:grid-cols-[150px_1fr] lg:items-center">
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold" style={{ color: "var(--text)" }}>{row.name}</p>
            <p className="text-[10px]" style={{ color: "var(--text-sub)" }}>{row.totalAttempts} attempts</p>
          </div>
          <div className="h-8 overflow-hidden rounded-lg" style={{ background: "var(--content-bg)" }}>
            <div className="flex h-full">
              {row.buckets.map((bucket) => (
                <div
                  key={bucket.code}
                  title={`${row.name} ${bucket.label}: ${bucket.count}`}
                  style={{
                    width: `${row.totalAttempts > 0 ? (bucket.count / row.totalAttempts) * 100 : 0}%`,
                    background: bucket.color,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function LineDistributionPieChart({
  rows,
  total,
  loading,
}: {
  rows: LineDistributionRow[];
  total: number;
  loading: boolean;
}) {
  let cursor = 0;
  const gradient = total > 0
    ? rows.map((line) => {
        const size = (line.count / total) * 100;
        const segment = `${line.color} ${cursor}% ${cursor + size}%`;
        cursor += size;
        return segment;
      }).join(", ")
    : "var(--content-bg) 0% 100%";

  if (loading) {
    return (
      <div className="grid gap-6 sm:grid-cols-[180px_1fr] sm:items-center">
        <Skeleton h={180} w="180px" />
        <div className="space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} h={30} />)}</div>
      </div>
    );
  }

  if (!rows.length) {
    return <p className="py-10 text-center text-sm" style={{ color: "var(--text-sub)" }}>No line data for this period.</p>;
  }

  return (
    <div className="grid gap-6 sm:grid-cols-[180px_1fr] sm:items-center">
      <div className="relative h-44 w-44 rounded-full" style={{ background: `conic-gradient(${gradient})` }}>
        <div className="absolute inset-10 flex flex-col items-center justify-center rounded-full text-center" style={{ background: "var(--card)" }}>
          <span className="text-2xl font-bold" style={{ color: "var(--text)" }}>{total}</span>
          <span className="text-[10px] font-medium uppercase tracking-wide" style={{ color: "var(--text-sub)" }}>Attempts</span>
        </div>
      </div>
      <div className="space-y-2">
        {rows.map((line) => (
          <div key={line.id} className="flex items-center justify-between gap-3 rounded-lg px-3 py-2" style={{ background: "var(--content-bg)" }}>
            <div className="flex min-w-0 items-center gap-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: line.color }} />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium" style={{ color: "var(--text)" }}>{line.name}</p>
                <p className="text-[10px]" style={{ color: "var(--text-sub)" }}>{line.avgScore}% avg score</p>
              </div>
            </div>
            <div className="shrink-0 text-right">
              <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>{line.count}</span>
              <span className="ml-2 text-xs" style={{ color: "var(--text-sub)" }}>{line.pct}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { data, isLoading, dataUpdatedAt } = useDashboard();
  const [isExporting, setIsExporting] = useState(false);

  const currentYear = new Date().getFullYear();
  const [monthlyFilters, setMonthlyFilters] = useState({
    year: currentYear,
    designationId: "",
    plantId: "",
    lineId: "",
  });
const [scoreFilters, setScoreFilters] = useState({
    period: "ALL" as DashboardPeriodFilters["period"],
    from: "",
    to: "",
    designationId: "",
    plantId: "",
    lineId: "",
  });

  async function handleExportReport() {
    setIsExporting(true);
    try {
      await downloadSessionsExport({
        designationId: scoreFilters.designationId || undefined,
        plantId: scoreFilters.plantId || undefined,
        lineId: scoreFilters.lineId || undefined,
        period: scoreFilters.period,
        from: scoreFilters.from || undefined,
        to: scoreFilters.to || undefined,
      });
    } catch {
      // ignore download errors for now
    } finally {
      setIsExporting(false);
    }
  }

  const quickActions: {
    label: string;
    icon: typeof IconUserPlus;
    href: string;
    color: string;
    bg: string;
    onClick?: () => void;
  }[] = [
    { label: "Add Participant", icon: IconUserPlus, href: "/participants", color: "#EB0A1E", bg: "rgba(235,10,30,0.08)" },

    // { label: "Import CSV",      icon: IconUpload,   href: "#",            color: "#3b82f6", bg: "rgba(59,130,246,0.08)" },
    { label: isExporting ? "Exporting…" : "Export Report", icon: IconDownload, href: "#", color: "#22c55e", bg: "rgba(34,197,94,0.08)", onClick: handleExportReport },
    { label: "Leaderboard",     icon: IconTrophy,   href: "#",            color: "#f59e0b", bg: "rgba(245,158,11,0.08)" },
  ];
  const [designationScoreFilters, setDesignationScoreFilters] = useState<DashboardPeriodFilters>({
    period: "ALL",
    from: "",
    to: "",
  });
  const [lineDistributionFilters, setLineDistributionFilters] = useState<DashboardPeriodFilters>({
    period: "ALL",
    from: "",
    to: "",
  });

  const { data: designations = [] } = useDesignations();
  const { data: plants = [] } = usePlants();
  const { data: lines = [] } = useLines();
  const monthlyParticipants = useMonthlyParticipants(monthlyFilters);
  const scoreBreakdown = useScoreBreakdown(scoreFilters);
  const designationScoreBreakdown = useDesignationScoreBreakdown(designationScoreFilters);
  const lineDistribution = useLineDistribution(lineDistributionFilters);
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  const updatedLabel = dataUpdatedAt
    ? `Updated ${timeAgo(new Date(dataUpdatedAt).toISOString())}`
    : "Loading…";

  // ── Derive KPI card definitions from live data ──
  const designationOptions = [
    { label: "All Designations", value: "" },
    ...designations.filter((item) => item.isActive).map((item) => ({ label: item.name, value: item.id })),
  ];
  const plantOptions = [
    { label: "All Plants", value: "" },
    ...plants.filter((item) => item.isActive).map((item) => ({ label: item.name, value: item.id })),
  ];
  const lineOptions = [
    { label: "All Lines", value: "" },
    ...lines.filter((item) => item.isActive).map((item) => ({ label: item.name, value: item.id })),
  ];
  const yearOptions = Array.from({ length: 5 }, (_, index) => {
    const year = currentYear - index;
    return { label: String(year), value: String(year) };
  });

  const kpis = data
    ? [
        {
          label: "Total Participants",
          value: String(data.kpis.totalParticipants),
          icon: IconUsers,
          trend: `+${data.kpis.participantsThisMonth}`,
          trendLabel: "this month",
          up: data.kpis.participantsThisMonth >= 0,
          iconBg: "rgba(59,130,246,0.10)",
          iconColor: "#3b82f6",
        },
        {
          label: "Sessions Today",
          value: String(data.kpis.sessionsToday),
          icon: IconClock,
          trend: sign(data.kpis.sessionsToday - data.kpis.sessionsYesterday),
          trendLabel: "vs yesterday",
          up: data.kpis.sessionsToday >= data.kpis.sessionsYesterday,
          iconBg: "rgba(168,85,247,0.10)",
          iconColor: "#a855f7",
        },
        {
          label: "Pass Rate",
          value: formatPct(data.kpis.passRate),
          icon: IconCheck,
          trend: `${sign(data.kpis.passRateDelta)}%`,
          trendLabel: "vs last week",
          up: data.kpis.passRateDelta >= 0,
          iconBg: "rgba(34,197,94,0.10)",
          iconColor: "#22c55e",
        },
        {
          label: "Avg Score",
          value: formatPct(data.kpis.avgScore),
          icon: IconTrendingUp,
          trend: `${sign(data.kpis.avgScoreDelta)}%`,
          trendLabel: "vs last week",
          up: data.kpis.avgScoreDelta >= 0,
          iconBg: "rgba(235,10,30,0.10)",
          iconColor: "#EB0A1E",
        },
      ]
    : [];

  const maxCount = data
    ? Math.max(...data.performanceDistribution.levels.map((p) => p.count), 1)
    : 1;

  return (
    <div className="p-8 space-y-7 max-w-7xl">

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Dashboard</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>{today}</p>
        </div>
        <div
          className="text-xs font-medium px-3 py-1.5 rounded-lg"
          style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
        >
          Live · {updatedLabel}
        </div>
      </div>

      {/* KPI Cards */}
   <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <Skeleton h={40} w="40px" />
                <div className="mt-4 space-y-2">
                  <Skeleton h={28} w="60%" />
                  <Skeleton h={14} w="80%" />
                </div>
              </div>
            ))
          : kpis.map((kpi) => {
              const Icon = kpi.icon;
              const TrendIcon = kpi.up ? IconTrendingUp : IconTrendingDown;
              return (
                <div key={kpi.label} className="rounded-xl p-5"
                  style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg"
                      style={{ background: kpi.iconBg, color: kpi.iconColor }}>
                      <Icon size={18} />
                    </div>
                    <span className="flex items-center gap-1 text-xs font-medium"
                      style={{ color: kpi.up ? "#16a34a" : "#dc2626" }}>
                      <TrendIcon size={12} />{kpi.trend}
                    </span>
                  </div>
                  <p className="text-2xl font-bold mb-0.5" style={{ color: "var(--text)" }}>{kpi.value}</p>
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>{kpi.label}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-sub)" }}>{kpi.trendLabel}</p>
                </div>
              );
            })}
      </div>

      {/* Dashboard Analytics */}
 <div className="grid grid-cols-1 gap-4 2xl:grid-cols-2">        <div className="rounded-xl p-6" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold" style={{ color: "var(--text)" }}>
                Month-wise Participants Tested
              </h2>
              <p className="mt-1 text-xs" style={{ color: "var(--text-sub)" }}>
                Unique participants with completed tests
              </p>
            </div>
            <span className="shrink-0 rounded-lg px-2.5 py-1 text-xs font-medium" style={{ background: "var(--content-bg)", color: "var(--text-muted)" }}>
              {monthlyParticipants.data?.totalParticipants ?? 0} total
            </span>
          </div>

 <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">            <FilterSelect
              label="Year"
              value={String(monthlyFilters.year)}
              onChange={(value) => setMonthlyFilters((prev) => ({ ...prev, year: +value }))}
              options={yearOptions}
            />
            <FilterSelect
              label="Designation"
              value={monthlyFilters.designationId}
              onChange={(value) => setMonthlyFilters((prev) => ({ ...prev, designationId: value }))}
              options={designationOptions}
            />
          <FilterSelect
              label="Plant"
              value={monthlyFilters.plantId}
              onChange={(value) => setMonthlyFilters((prev) => ({ ...prev, plantId: value }))}
              options={plantOptions}
            />
            <FilterSelect
              label="Line"
              value={monthlyFilters.lineId}
              onChange={(value) => setMonthlyFilters((prev) => ({ ...prev, lineId: value }))}
              options={lineOptions}
            />
          </div>

          <MonthlyParticipantsChart
            data={monthlyParticipants.data?.months ?? []}
            loading={monthlyParticipants.isLoading}
          />
        </div>

        <div className="rounded-xl p-6" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold" style={{ color: "var(--text)" }}>
                Score Breakdown
              </h2>
              <p className="mt-1 text-xs" style={{ color: "var(--text-sub)" }}>
                Attempt percentage distribution
              </p>
            </div>
            <span className="shrink-0 rounded-lg px-2.5 py-1 text-xs font-medium" style={{ background: "var(--content-bg)", color: "var(--text-muted)" }}>
              {scoreBreakdown.data?.totalAttempts ?? 0} attempts
            </span>
          </div>

        <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            <FilterSelect
              label="Period"
              value={scoreFilters.period ?? "ALL"}
              onChange={(value) => setScoreFilters((prev) => ({ ...prev, period: value as DashboardPeriodFilters["period"] }))}
              options={[
                { label: "All Time", value: "ALL" },
                { label: "Weekly", value: "WEEKLY" },
                { label: "Monthly", value: "MONTHLY" },
                { label: "Date Range", value: "DATE_RANGE" },
              ]}
            />
            <DateFilter
              label="From"
              value={scoreFilters.from}
              onChange={(value) => setScoreFilters((prev) => ({ ...prev, from: value, period: "DATE_RANGE" }))}
            />
            <DateFilter
              label="To"
              value={scoreFilters.to}
              onChange={(value) => setScoreFilters((prev) => ({ ...prev, to: value, period: "DATE_RANGE" }))}
            />
            <FilterSelect
              label="Designation"
              value={scoreFilters.designationId}
              onChange={(value) => setScoreFilters((prev) => ({ ...prev, designationId: value }))}
              options={designationOptions}
            />
            <FilterSelect
              label="Plant"
              value={scoreFilters.plantId}
              onChange={(value) => setScoreFilters((prev) => ({ ...prev, plantId: value }))}
              options={plantOptions}
            />
            <FilterSelect
              label="Line"
              value={scoreFilters.lineId}
              onChange={(value) => setScoreFilters((prev) => ({ ...prev, lineId: value }))}
              options={lineOptions}
            />
          </div>

           <ScorePieChart
            buckets={scoreBreakdown.data?.buckets ?? []}
            total={scoreBreakdown.data?.totalAttempts ?? 0}
            loading={scoreBreakdown.isLoading}
          />
        </div>
      </div>

      {/* Period Reports */}
      <div className="grid grid-cols-1 gap-4 2xl:grid-cols-2">
        <div className="rounded-xl p-6" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold" style={{ color: "var(--text)" }}>
                Designation-wise Score Breakup
              </h2>
              <p className="mt-1 text-xs" style={{ color: "var(--text-sub)" }}>
                Attempts grouped by score range
              </p>
            </div>
            <span className="shrink-0 rounded-lg px-2.5 py-1 text-xs font-medium" style={{ background: "var(--content-bg)", color: "var(--text-muted)" }}>
              {designationScoreBreakdown.data?.totalAttempts ?? 0} attempts
            </span>
          </div>

          <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <PeriodFilters value={designationScoreFilters} onChange={setDesignationScoreFilters} />
          </div>

          <div className="mb-4 flex flex-wrap gap-3">
            {(designationScoreBreakdown.data?.buckets ?? []).map((bucket) => (
              <span key={bucket.code} className="inline-flex items-center gap-1.5 text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>
                <span className="h-2 w-2 rounded-full" style={{ background: bucket.color }} />
                {bucket.label}
              </span>
            ))}
          </div>

          <DesignationScoreBarChart
            rows={designationScoreBreakdown.data?.designations ?? []}
            loading={designationScoreBreakdown.isLoading}
          />
        </div>

        <div className="rounded-xl p-6" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold" style={{ color: "var(--text)" }}>
                Line-wise Attempts
              </h2>
              <p className="mt-1 text-xs" style={{ color: "var(--text-sub)" }}>
                Completed tests by Line
              </p>
            </div>
            <span className="shrink-0 rounded-lg px-2.5 py-1 text-xs font-medium" style={{ background: "var(--content-bg)", color: "var(--text-muted)" }}>
              {lineDistribution.data?.totalAttempts ?? 0} attempts
            </span>
          </div>

          <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <PeriodFilters value={lineDistributionFilters} onChange={setLineDistributionFilters} />
          </div>

          <LineDistributionPieChart
            rows={lineDistribution.data?.lines ?? []}
            total={lineDistribution.data?.totalAttempts ?? 0}
            loading={lineDistribution.isLoading}
          />
        </div>
      </div>

      {/* Mid Row: Performance Distribution + Recent Activity */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">

        {/* Performance Distribution */}
       <div className="rounded-xl p-6 xl:col-span-3"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold" style={{ color: "var(--text)" }}>
              Performance Distribution
            </h2>
            <span className="text-xs" style={{ color: "var(--text-sub)" }}>
              {!data ? "—" : `All time · ${data.performanceDistribution.totalAttempts} attempts`}
            </span>
          </div>

          {!data ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex justify-between"><Skeleton h={14} w="30%" /><Skeleton h={14} w="15%" /></div>
                  <Skeleton h={8} />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {data.performanceDistribution.levels.map((level) => (
                <div key={level.code}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: level.color ?? "#6b7280" }} />
                      <span className="text-sm font-medium" style={{ color: "var(--text)" }}>{level.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>{level.count}</span>
                      <span className="text-xs w-10 text-right" style={{ color: "var(--text-sub)" }}>{level.pct}%</span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--content-bg)" }}>
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${(level.count / maxCount) * 100}%`, background: level.color ?? "#6b7280", opacity: 0.85 }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Designation Breakdown */}
          <div className="mt-7 pt-5" style={{ borderTop: "1px solid var(--border)" }}>
            <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text)" }}>
              Designation Breakdown
            </h3>
            {!data ? (
              <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((i) => <Skeleton key={i} h={72} />)}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {data.designationStats.map((d) => (
                  <div key={d.name} className="rounded-lg p-3" style={{ background: "var(--content-bg)" }}>
                    <p className="text-xs font-semibold mb-2" style={{ color: "var(--text)" }}>{d.name}</p>
                    <div className="flex items-center justify-between text-xs" style={{ color: "var(--text-muted)" }}>
                      <span>{d.participants} participants</span>
                      <span className="font-semibold" style={{ color: d.passRate >= 70 ? "#16a34a" : "#d97706" }}>
                        {d.passRate}% pass
                      </span>
                    </div>
                    <div className="mt-1.5 h-1 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                      <div className="h-full rounded-full"
                        style={{ width: `${d.passRate}%`, background: d.passRate >= 70 ? "#16a34a" : "#d97706" }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
 <div className="rounded-xl p-6 flex flex-col xl:col-span-2"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold" style={{ color: "var(--text)" }}>Recent Activity</h2>
            <Link href="/participants" className="text-xs font-medium" style={{ color: "#EB0A1E" }}>
              View all →
            </Link>
          </div>

          {!data ? (
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton h={28} w="28px" />
                  <div className="flex-1 space-y-1"><Skeleton h={12} /><Skeleton h={10} w="60%" /></div>
                  <Skeleton h={20} w="40px" />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-2 -mx-1 px-1">
              {data.recentActivity.map((a, i) => (
                <Link
                  key={a.participantId + i}
                  href={`/participants/${a.participantId}`}
                  className="flex items-center gap-3 py-2 px-2 rounded-lg transition-colors"
                  style={{ borderBottom: i < data.recentActivity.length - 1 ? "1px solid var(--border)" : "none" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "var(--content-bg)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "transparent"; }}
                >
                  <div
                    className="flex h-7 w-7 items-center justify-center rounded-full shrink-0 text-[10px] font-bold"
                    style={{
                      background: a.passed ? "rgba(34,197,94,0.12)" : "rgba(220,38,38,0.10)",
                      color: a.passed ? "#16a34a" : "#dc2626",
                    }}
                  >
                    {a.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate" style={{ color: "var(--text)" }}>{a.name}</p>
                    <p className="text-[11px]" style={{ color: "var(--text-sub)" }}>{a.desg}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                      style={{
                        background: a.passed ? "rgba(34,197,94,0.10)" : "rgba(220,38,38,0.08)",
                        color: a.passed ? "#16a34a" : "#dc2626",
                      }}
                    >
                      {a.pct.toFixed(0)}%
                    </span>
                    <p className="text-[10px] mt-0.5" style={{ color: "var(--text-sub)" }}>
                      {timeAgo(a.completedAt)}
                    </p>
                  </div>
                </Link>
              ))}

              {data.recentActivity.length === 0 && (
                <p className="text-sm text-center py-8" style={{ color: "var(--text-sub)" }}>
                  No recent activity yet.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-xl p-6" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <h2 className="text-base font-semibold mb-4" style={{ color: "var(--text)" }}>Quick Actions</h2>
        <div className="flex items-center gap-3">
          {quickActions.map((action, i) => {
            const Icon = action.icon;
            const className = "flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-all hover:brightness-95 active:scale-[0.98] disabled:opacity-60";
            const style = { background: action.bg, color: action.color };
            if (action.onClick) {
              return (
                <button key={i} onClick={action.onClick} disabled={isExporting} className={className} style={style}>
                  <Icon size={15} />
                  {action.label}
                </button>
              );
            }
            return (
              <Link key={i} href={action.href} className={className} style={style}>
                <Icon size={15} />
                {action.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
