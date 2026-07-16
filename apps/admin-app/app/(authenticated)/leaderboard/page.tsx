"use client";

import { useState } from "react";
import {
  IconChevronDown,
  IconTrophy,
  IconAward,
  IconUserX,
  IconAlertCircle,
  IconX,
  IconTrendingUp,
  IconTrendingDown,
} from "../../components/icons";
import {
  useLeaderboard,
  type LeaderboardType,
} from "../../lib/hooks/useLeaderboard";
import { useDesignations } from "../../lib/hooks/useDesignations";
import { useLines } from "../../lib/hooks/useLines";
import { usePlants } from "../../lib/hooks/usePlants";

const TYPES: { key: LeaderboardType; label: string; sub: string }[] = [
  { key: "GLOBAL", label: "All Time", sub: "Since launch" },
  { key: "MONTHLY", label: "Monthly", sub: "This month" },
  { key: "WEEKLY", label: "Weekly", sub: "This week" },
  { key: "DAILY", label: "Today", sub: "Today" },
];

function FilterSelect({
  value,
  onChange,
  options,
}: {
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
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          color: "var(--text)",
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
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

function RankChange({
  prevRank,
  rank,
}: {
  prevRank: number | null;
  rank: number;
}) {
  if (prevRank === null) {
    return (
      <span className="text-xs" style={{ color: "var(--text-sub)" }}>
        —
      </span>
    );
  }
  const diff = prevRank - rank;
  if (diff === 0) {
    return (
      <span className="text-xs" style={{ color: "var(--text-sub)" }}>
        —
      </span>
    );
  }
  const up = diff > 0;
  return (
    <span
      className="inline-flex items-center gap-0.5 text-xs font-semibold"
      style={{ color: up ? "#16a34a" : "#dc2626" }}
    >
      {up ? <IconTrendingUp size={11} /> : <IconTrendingDown size={11} />}
      {Math.abs(diff)}
    </span>
  );
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function LeaderboardPage() {
  const [type, setType] = useState<LeaderboardType>("GLOBAL");
  const [desgId, setDesgId] = useState("");
  const [lineId, setLineId] = useState("");
  const [plantId, setPlantId] = useState("");
  const [resetOpen, setResetOpen] = useState(false);
  const [excluded, setExcluded] = useState<Set<string>>(new Set());

  const { data: designations } = useDesignations();
  const { data: lines } = useLines();
  const { data: plants } = usePlants();

  const { data: entries = [], isLoading, error } = useLeaderboard({
    type,
    limit: 50,
    designationId: desgId || undefined,
    lineId: lineId || undefined,
    plantId: plantId || undefined,
  });

  const designationOptions = [
    { label: "All Designations", value: "" },
    ...(designations ?? []).map((d) => ({ label: d.name, value: d.id })),
  ];
  const lineOptions = [
    { label: "All Lines", value: "" },
    ...(lines ?? []).map((l) => ({ label: l.name, value: l.id })),
  ];
  const plantOptions = [
    { label: "All Plants", value: "" },
    ...(plants ?? []).map((p) => ({ label: p.name, value: p.id })),
  ];

  const mapped = entries.map((entry) => ({
    id: entry.id,
    rank: entry.rank,
    prevRank: null,
    participantName: entry.participant.name,
    initials: getInitials(entry.participant.name),
    employeeCode: entry.participant.code,
    designation: entry.designation.name,
    line: entry.participant.line?.name ?? "",
    score: entry.score,
    percentage: entry.percentage,
    flagged: false,
  }));

  const filtered = mapped;
  const podium = filtered.slice(0, 3);
  const rest = filtered.slice(3);

  const toggleExclude = (id: string) =>
    setExcluded((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="p-8 space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>
            Leaderboard
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
            Top performers across quizzes and game stages
          </p>
        </div>
        <div className="flex items-center gap-2">
          <FilterSelect value={desgId} onChange={setDesgId} options={designationOptions} />
          <FilterSelect value={lineId} onChange={setLineId} options={lineOptions} />
          <FilterSelect value={plantId} onChange={setPlantId} options={plantOptions} />
          {/* <button
            onClick={() => setResetOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{
              background: "rgba(220,38,38,0.06)",
              border: "1px solid rgba(220,38,38,0.15)",
              color: "#dc2626",
            }}
          >
            <IconAlertCircle size={14} />
            Reset Period
          </button> */}
        </div>
      </div>

      <div
        className="rounded-xl p-1.5 flex items-center gap-1"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      >
        {TYPES.map((t) => (
          <button
            key={t.key}
            onClick={() => setType(t.key)}
            className="flex-1 flex flex-col items-center py-2.5 rounded-lg transition-all"
            style={
              type === t.key
                ? {
                    background: "rgba(235,10,30,0.06)",
                    border: "1px solid rgba(235,10,30,0.20)",
                  }
                : { background: "transparent", border: "1px solid transparent" }
            }
          >
            <span
              className="text-sm font-semibold"
              style={{ color: type === t.key ? "#EB0A1E" : "var(--text)" }}
            >
              {t.label}
            </span>
            <span
              className="text-[11px] mt-0.5"
              style={{ color: "var(--text-sub)" }}
            >
              {t.sub}
            </span>
          </button>
        ))}
      </div>

      {error && (
        <div
          className="rounded-xl p-5"
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            color: "#dc2626",
          }}
        >
          {error.message}
        </div>
      )}

      {isLoading && (
        <div
          className="rounded-xl p-6 text-sm text-center"
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            color: "var(--text-sub)",
          }}
        >
          Loading leaderboard...
        </div>
      )}

      {!isLoading && !filtered.length && (
        <div
          className="rounded-xl p-6 text-sm text-center"
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            color: "var(--text-sub)",
          }}
        >
          No leaderboard entries are available yet.
        </div>
      )}

      {!isLoading && filtered.length > 0 && (
        <>
          <div className="grid grid-cols-3 gap-4">
            {podium.map((entry, index) => {
              const positions = [podium[1], podium[0], podium[2]].filter(
                Boolean,
              );
              const card = positions[index];
              if (!card) return <div key={index} />;
              const place = card.rank;
              const medalColors = { 1: "#fbbf24", 2: "#94a3b8", 3: "#d97706" };
              const color = medalColors[place as 1 | 2 | 3];

              return (
                <div
                  key={card.id}
                  className="flex flex-col items-center justify-end"
                >
                  <div
                    className="w-full rounded-xl p-5 text-center relative transition-all"
                    style={{
                      background: "var(--card)",
                      border:
                        place === 1
                          ? `2px solid ${color}`
                          : "1px solid var(--border)",
                      boxShadow: place === 1 ? `0 8px 32px ${color}30` : "none",
                    }}
                  >
                    {place === 1 && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-2xl">
                        👑
                      </span>
                    )}

                    <div
                      className="mx-auto flex h-16 w-16 items-center justify-center rounded-full text-lg font-black mb-3 shrink-0"
                      style={{
                        background: `${color}20`,
                        color,
                        border: `3px solid ${color}`,
                      }}
                    >
                      {card.initials}
                    </div>

                    <div
                      className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full mb-2"
                      style={{ background: `${color}20`, color }}
                    >
                      <IconTrophy size={11} />
                      Rank #{place}
                    </div>

                    <p
                      className="text-base font-bold leading-tight"
                      style={{ color: "var(--text)" }}
                    >
                      {card.participantName}
                    </p>
                    <p
                      className="text-xs font-mono mt-0.5"
                      style={{ color: "var(--text-sub)" }}
                    >
                      {card.employeeCode}
                    </p>
                    <p
                      className="text-xs mt-1"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {card.designation}
                    </p>

                    <div
                      className="mt-3 pt-3 grid grid-cols-2 gap-2 text-center"
                      style={{ borderTop: "1px solid var(--border)" }}
                    >
                      <div>
                        <p
                          className="text-lg font-black"
                          style={{ color: "var(--text)" }}
                        >
                          {card.score}
                        </p>
                        <p
                          className="text-[10px] font-medium"
                          style={{ color: "var(--text-sub)" }}
                        >
                          POINTS
                        </p>
                      </div>
                      <div>
                        <p className="text-lg font-black" style={{ color }}>
                          {card.percentage ? card.percentage.toFixed(0) : "0"}%
                        </p>
                        <p
                          className="text-[10px] font-medium"
                          style={{ color: "var(--text-sub)" }}
                        >
                          AVG
                        </p>
                      </div>
                    </div>
                  </div>
                  <div
                    className="w-full rounded-b-md flex items-center justify-center text-white font-black text-2xl"
                    style={{
                      background: color,
                      height:
                        place === 1 ? "60px" : place === 2 ? "44px" : "32px",
                    }}
                  >
                    {place}
                  </div>
                </div>
              );
            })}
          </div>

          <div
            className="rounded-xl overflow-hidden"
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
            }}
          >
            <div
              className="px-5 py-3 flex items-center justify-between"
              style={{
                borderBottom: "1px solid var(--border)",
                background: "var(--content-bg)",
              }}
            >
              <p
                className="text-xs font-semibold uppercase tracking-wide"
                style={{ color: "var(--text-muted)" }}
              >
                Rankings 4–{filtered.length}
              </p>
              <p className="text-xs" style={{ color: "var(--text-sub)" }}>
                {filtered.length} participants ranked
              </p>
            </div>

            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  <th
                    className="w-16 px-4 py-3 text-left text-xs font-semibold tracking-wide"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Rank
                  </th>
                  <th
                    className="w-16 px-4 py-3 text-left text-xs font-semibold tracking-wide"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Δ
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-semibold tracking-wide"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Participant
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-semibold tracking-wide"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Designation · Line
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-semibold tracking-wide"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Avg Score
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-semibold tracking-wide"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Points
                  </th>
                  {/* <th className="w-12 px-4 py-3">ss</th> */}
                </tr>
              </thead>
              <tbody>
                {rest.map((entry, index) => {
                  const isExcluded = excluded.has(entry.id);
                  return (
                    <tr
                      key={entry.id}
                      style={{
                        borderBottom:
                          index < rest.length - 1
                            ? "1px solid var(--border)"
                            : "none",
                        opacity: isExcluded ? 0.4 : 1,
                      }}
                      onMouseEnter={(ev) => {
                        (
                          ev.currentTarget as HTMLTableRowElement
                        ).style.background = "var(--content-bg)";
                      }}
                      onMouseLeave={(ev) => {
                        (
                          ev.currentTarget as HTMLTableRowElement
                        ).style.background = "transparent";
                      }}
                    >
                      <td className="px-4 py-3.5">
                        <span
                          className="font-bold text-base"
                          style={{ color: "var(--text)" }}
                        >
                          #{entry.rank}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <RankChange
                          prevRank={entry.prevRank}
                          rank={entry.rank}
                        />
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold shrink-0"
                            style={{
                              background: "rgba(235,10,30,0.08)",
                              color: "#EB0A1E",
                            }}
                          >
                            {entry.initials}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p
                                className="font-semibold"
                                style={{
                                  color: "var(--text)",
                                  textDecoration: isExcluded
                                    ? "line-through"
                                    : "none",
                                }}
                              >
                                {entry.participantName}
                              </p>
                            </div>
                            <p
                              className="text-xs font-mono"
                              style={{ color: "var(--text-sub)" }}
                            >
                              {entry.employeeCode}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td
                        className="px-4 py-3.5 text-xs"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {entry.designation}
                        <span
                          className="mx-1.5"
                          style={{ color: "var(--text-sub)" }}
                        >
                          ·
                        </span>
                        {entry.line}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className="text-sm font-bold"
                          style={{
                            color:
                              entry.percentage >= 70
                                ? "#16a34a"
                                : entry.percentage >= 50
                                  ? "#d97706"
                                  : "#dc2626",
                          }}
                        >
                          {entry.percentage ? entry.percentage.toFixed(0) : "0"}
                          %
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className="text-sm font-bold"
                          style={{ color: "var(--text)" }}
                        >
                          {entry.score}
                        </span>
                      </td>
                      {/* <td className="px-4 py-3.5">
                        <button
                          onClick={() => toggleExclude(entry.id)}
                          className="flex h-7 w-7 items-center justify-center rounded-md transition-colors"
                          style={{ color: "var(--text-muted)" }}
                          onMouseEnter={(ev) => {
                            (
                              ev.currentTarget as HTMLButtonElement
                            ).style.background = "rgba(220,38,38,0.06)";
                            (
                              ev.currentTarget as HTMLButtonElement
                            ).style.color = "#dc2626";
                          }}
                          onMouseLeave={(ev) => {
                            (
                              ev.currentTarget as HTMLButtonElement
                            ).style.background = "transparent";
                            (
                              ev.currentTarget as HTMLButtonElement
                            ).style.color = "var(--text-muted)";
                          }}
                          title={
                            isExcluded ? "Restore" : "Exclude from leaderboard"
                          }
                        >
                          <IconUserX size={13} />
                        </button>
                      </td> */}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {resetOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => setResetOpen(false)}
          />
          <div
            className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-[460px] rounded-2xl shadow-2xl"
            style={{ background: "var(--card)" }}
          >
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-full shrink-0"
                  style={{
                    background: "rgba(220,38,38,0.10)",
                    color: "#dc2626",
                  }}
                >
                  <IconAlertCircle size={22} />
                </div>
                <div className="flex-1 min-w-0">
                  <h2
                    className="text-lg font-bold"
                    style={{ color: "var(--text)" }}
                  >
                    Reset {TYPES.find((t) => t.key === type)?.label}{" "}
                    leaderboard?
                  </h2>
                  <p
                    className="text-sm mt-1"
                    style={{ color: "var(--text-muted)" }}
                  >
                    All ranks for {TYPES.find((t) => t.key === type)?.sub} will
                    be cleared. Underlying quiz attempts and certificates are{" "}
                    <strong>not</strong> deleted. This action cannot be undone.
                  </p>
                </div>
                <button
                  onClick={() => setResetOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors shrink-0"
                  style={{ color: "var(--text-muted)" }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      "var(--content-bg)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      "transparent";
                  }}
                >
                  <IconX size={16} />
                </button>
              </div>

              <div
                className="mt-5 rounded-lg p-3 flex items-start gap-2"
                style={{ background: "var(--content-bg)" }}
              >
                <IconAward size={14} className="shrink-0 mt-0.5" />
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Tip: Export the current leaderboard as CSV before resetting if
                  you need a record.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 mt-6">
                <button
                  onClick={() => setResetOpen(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium"
                  style={{ color: "var(--text-muted)" }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => setResetOpen(false)}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:brightness-90"
                  style={{ background: "#dc2626" }}
                >
                  Reset Leaderboard
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
