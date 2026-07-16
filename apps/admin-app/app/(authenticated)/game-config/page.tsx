"use client";

import { useState } from "react";
import Link from "next/link";
import {
  IconPlus, IconSearch, IconEdit, IconTrash, IconHash, IconClock,
  IconGamepad, IconGrip, IconMoreVertical, IconEye,
} from "../../components/icons";

type Stage = {
  id: string;
  code: string;
  name: string;
  description: string;
  order: number;
  timeLimit: number;
  pointsPerStep: number;
  stepsCount: number;
  isActive: boolean;
  attemptsCount: number;
  passRate: number;
};

const STAGES: Stage[] = [
  { id: "s1", code: "PAINT-SEQ",     name: "Paint Application Sequence",     description: "Order the basecoat → clearcoat process correctly", order: 1, timeLimit: 90,  pointsPerStep: 10, stepsCount: 6, isActive: true,  attemptsCount: 312, passRate: 68 },
  { id: "s2", code: "PPE-CHECK",     name: "PPE Verification Order",         description: "Sequence the personal protective equipment checks", order: 2, timeLimit: 60,  pointsPerStep: 8,  stepsCount: 5, isActive: true,  attemptsCount: 287, passRate: 82 },
  { id: "s3", code: "BOOTH-PREP",    name: "Spray Booth Pre-Start",          description: "Steps to prepare the spray booth before shift",      order: 3, timeLimit: 120, pointsPerStep: 12, stepsCount: 7, isActive: true,  attemptsCount: 198, passRate: 71 },
  { id: "s4", code: "DEFECT-DIAG",   name: "Defect Diagnostic Flow",         description: "Identify and respond to surface defects in order",   order: 4, timeLimit: 75,  pointsPerStep: 10, stepsCount: 5, isActive: true,  attemptsCount: 156, passRate: 64 },
  { id: "s5", code: "MIX-RATIO",     name: "Mixing Ratio Procedure",         description: "Correct order of paint and solvent mixing steps",    order: 5, timeLimit: 45,  pointsPerStep: 8,  stepsCount: 4, isActive: false, attemptsCount: 0,   passRate: 0  },
];

function ActionMenu({ id }: { id: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-7 w-7 items-center justify-center rounded-md transition-colors"
        style={{ color: "var(--text-muted)" }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--content-bg)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
      >
        <IconMoreVertical size={15} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-20 w-36 rounded-lg py-1 shadow-lg" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <Link href={`/game-config/${id}`} className="flex items-center gap-2.5 px-3 py-2 text-sm" style={{ color: "var(--text)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "var(--content-bg)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "transparent"; }}
              onClick={() => setOpen(false)}
            >
              <IconEye size={14} /> View
            </Link>
            <Link href={`/game-config/${id}`} className="flex items-center gap-2.5 px-3 py-2 text-sm" style={{ color: "var(--text)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "var(--content-bg)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "transparent"; }}
              onClick={() => setOpen(false)}
            >
              <IconEdit size={14} /> Edit
            </Link>
            <div style={{ height: "1px", background: "var(--border)", margin: "4px 0" }} />
            <button className="flex w-full items-center gap-2.5 px-3 py-2 text-sm" style={{ color: "#dc2626" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(220,38,38,0.06)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
            >
              <IconTrash size={14} /> Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function GameConfigPage() {
  const [search, setSearch] = useState("");
  const filtered = STAGES.filter((s) =>
    !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.code.toLowerCase().includes(search.toLowerCase()),
  );

  const activeCount = STAGES.filter((s) => s.isActive).length;
  const totalAttempts = STAGES.reduce((sum, s) => sum + s.attemptsCount, 0);

  return (
    <div className="p-8 space-y-6 max-w-7xl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Game Stages</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
            {activeCount} active · {totalAttempts.toLocaleString()} total attempts
          </p>
        </div>
        <Link
          href="/game-config/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:brightness-90 active:scale-[0.98]"
          style={{ background: "#EB0A1E" }}
        >
          <IconPlus size={15} />
          New Stage
        </Link>
      </div>

      {/* Search */}
      <div className="rounded-xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="relative max-w-md">
          <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-sub)" }}>
            <IconSearch size={15} />
          </span>
          <input
            type="text"
            placeholder="Search stages by name or code…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg focus:outline-none"
            style={{ background: "var(--content-bg)", border: "1px solid var(--border)", color: "var(--text)" }}
          />
        </div>
      </div>

      {/* Stages list — card-based with sequence preview */}
      <div className="space-y-3">
        {filtered.map((s) => (
          <div
            key={s.id}
            className="rounded-xl p-5 transition-all"
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              opacity: s.isActive ? 1 : 0.65,
            }}
          >
            <div className="flex items-start gap-4">
              {/* Drag + order number */}
              <div className="flex flex-col items-center gap-1 shrink-0">
                <span className="cursor-grab" style={{ color: "var(--text-sub)" }}>
                  <IconGrip size={14} />
                </span>
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold"
                  style={{ background: "rgba(168,85,247,0.10)", color: "#a855f7" }}
                >
                  {s.order}
                </div>
              </div>

              {/* Icon */}
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl shrink-0"
                style={{ background: "rgba(168,85,247,0.08)", color: "#a855f7" }}
              >
                <IconGamepad size={20} />
              </div>

              {/* Main content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Link href={`/game-config/${s.id}`} className="hover:underline" style={{ color: "var(--text)" }}>
                    <h3 className="text-base font-bold">{s.name}</h3>
                  </Link>
                  <span
                    className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded inline-flex items-center gap-1"
                    style={{ background: "var(--content-bg)", color: "var(--text-muted)" }}
                  >
                    <IconHash size={9} />{s.code}
                  </span>
                  <span
                    className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{
                      background: s.isActive ? "rgba(34,197,94,0.10)" : "rgba(107,114,128,0.10)",
                      color: s.isActive ? "#16a34a" : "var(--text-sub)",
                    }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.isActive ? "#16a34a" : "var(--text-sub)" }} />
                    {s.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <p className="text-sm mb-3" style={{ color: "var(--text-muted)" }}>{s.description}</p>

                {/* Stat chips */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Chip label="Steps"      value={`${s.stepsCount}`} />
                  <Chip label="Time Limit" value={`${s.timeLimit}s`} icon={<IconClock size={11} />} />
                  <Chip label="Points"     value={`${s.pointsPerStep}/step · max ${s.pointsPerStep * s.stepsCount}`} />
                  {s.attemptsCount > 0 && (
                    <>
                      <Chip label="Attempts" value={s.attemptsCount.toString()} />
                      <Chip
                        label="Pass Rate"
                        value={`${s.passRate}%`}
                        color={s.passRate >= 70 ? "#16a34a" : s.passRate >= 50 ? "#d97706" : "#dc2626"}
                      />
                    </>
                  )}
                </div>
              </div>

              {/* Action */}
              <ActionMenu id={s.id} />
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="rounded-xl py-16 text-center" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <p className="text-sm" style={{ color: "var(--text-sub)" }}>No game stages match your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Chip({ label, value, icon, color }: { label: string; value: string; icon?: React.ReactNode; color?: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-md"
      style={{ background: "var(--content-bg)", color: "var(--text-muted)" }}
    >
      {icon}
      <span>{label}</span>
      <span className="font-semibold" style={{ color: color ?? "var(--text)" }}>{value}</span>
    </span>
  );
}
