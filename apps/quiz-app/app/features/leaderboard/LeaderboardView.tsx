"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLeaderboard } from "../../lib/hooks/useLeaderboard";
import type { FilterType, LeaderboardEntry } from "../../types/api.types";
import { useFlowStore } from "../../store/flow";
import { useSessionStore } from "../../store/session";
import { useTranslation } from "../../lib/i18n";
import { formatDuration } from "../../lib/utils/format";

import { ChevronDown } from "../../components/icons";
import { PageShell, PageHeader } from "../../components/layout/PageShell";
import { BACKEND_URL } from "../../lib/env";

function resolveImage(url: string | null | undefined): string | null {
  if (!url) return null;
  return url.startsWith("http") ? url : `${BACKEND_URL}${url}`;
}

const FILTER_LABELS: Record<FilterType, Record<string, string>> = {
  GLOBAL:  { EN: "All Time",    KN: "ಎಲ್ಲಾ ಸಮಯ",    HI: "सब समय"    },
  DAILY:   { EN: "Today",       KN: "ಇಂದು",          HI: "आज"         },
  WEEKLY:  { EN: "Weekly",      KN: "ಈ ವಾರ",         HI: "साप्ताहिक" },
  MONTHLY: { EN: "Monthly",     KN: "ಈ ತಿಂಗಳು",      HI: "मासिक"     },
};

export default function LeaderboardView() {
  const router = useRouter();
  const lang        = useFlowStore((s) => s.lang);
  const participant = useSessionStore((s) => s.participant);

  const ui = useTranslation("leaderboard");

  const [filter, setFilter] = useState<FilterType>("GLOBAL");
  const { data: entries = [], isPending } = useLeaderboard(filter);

  const myCode = participant?.code ?? "";
  const top3   = entries.slice(0, 3);
  const rest   = entries.slice(3);

  return (
    <PageShell>
      <PageHeader onBack={() => router.back()} title={ui.title} />

      <div className="flex flex-col flex-1 max-w-4xl mx-auto w-full">
      {/* Podium */}
      {isPending ? (
        <div className="flex items-end justify-center gap-5 py-6">
          {[2, 1, 3].map((n) => (
            <div key={n} className="animate-pulse rounded-3xl" style={{ flex: n === 1 ? "0 0 26%" : "0 0 20%", maxWidth: n === 1 ? 380 : 290, height: n === 1 ? 240 : 190, background: "var(--bg-card)" }} />
          ))}
        </div>
      ) : top3.length > 0 ? (
        <div className="flex items-end justify-center gap-5 py-6">
          {top3[1] && <TopCard entry={top3[1]} pos={2} myCode={myCode} youLabel={ui.you} />}
          {top3[0] && <TopCard entry={top3[0]} pos={1} myCode={myCode} youLabel={ui.you} />}
          {top3[2] && <TopCard entry={top3[2]} pos={3} myCode={myCode} youLabel={ui.you} />}
        </div>
      ) : null}

      {/* List card */}
      <div className="flex-1 rounded-3xl px-6 pt-5 pb-8 mt-3" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-bold" style={{ color: "var(--text)" }}>{ui.topPerformers}</p>
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>{ui.filterBy}</span>
            <div className="relative">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as FilterType)}
                className="appearance-none rounded-xl pl-3 pr-7 py-1.5 text-xs font-semibold cursor-pointer"
                style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)", outline: "none" }}
              >
                {(["GLOBAL", "DAILY", "WEEKLY", "MONTHLY"] as FilterType[]).map((f) => (
                  <option key={f} value={f}>{FILTER_LABELS[f][lang]}</option>
                ))}
              </select>
              <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--text-muted)" }}>
                <ChevronDown />
              </span>
            </div>
          </div>
        </div>

        {!isPending && entries.length > 0 && (
          <div className="grid text-[10px] font-bold uppercase tracking-widest pb-2 mb-1" style={{ gridTemplateColumns: "56px 1fr 1fr 80px 90px", color: "var(--text-muted)", borderBottom: "1px solid var(--border)" }}>
            <span>{ui.colRank}</span><span>{ui.colParticipant}</span><span>{ui.colDesg}</span>
            <span className="text-right">{ui.colScore}</span><span className="text-right">{ui.colTime}</span>
          </div>
        )}

        {isPending ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 rounded-xl my-1 animate-pulse" style={{ background: "var(--bg)" }} />
          ))
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <span className="text-5xl">🏆</span>
            <p className="font-semibold" style={{ color: "var(--text)" }}>{ui.empty}</p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>{ui.emptyHint}</p>
          </div>
        ) : (
          (entries.length < 3 ? entries : rest).map((entry) => {
            const isMe = entry.participant.code === myCode;
            const dur  = entry.attempt?.session?.durationSeconds;
            return (
              <div key={entry.id} className="grid items-center py-3 rounded-xl px-2 my-0.5"
                style={{ gridTemplateColumns: "56px 1fr 1fr 80px 90px", background: isMe ? "rgba(235,10,30,0.07)" : "transparent", borderBottom: "1px solid var(--border)" }}
              >
                <span className="text-sm font-bold tabular-nums" style={{ color: isMe ? "#EB0A1E" : "var(--text-muted)" }}>{entry.rank}</span>
                <div className="flex items-center gap-2 min-w-0">
                  <Avatar name={entry.participant.name} imageUrl={resolveImage(entry.participant.imageUrl)} size={36} highlight={isMe} />
                  <div className="min-w-0">
                    <span className="text-xs font-semibold truncate block" style={{ color: isMe ? "#EB0A1E" : "var(--text)" }}>
                      {entry.participant.name}{isMe && <span className="ml-1 text-[10px]">({ui.you})</span>}
                    </span>
                    <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{entry.participant.code}</span>
                  </div>
                </div>
                <div className="flex flex-col pr-2 min-w-0">
                  <span className="text-xs truncate" style={{ color: isMe ? "#EB0A1E" : "var(--text-muted)" }}>{entry.designation.name}</span>
                  {entry.participant.line && <span className="text-[10px] truncate" style={{ color: isMe ? "rgba(235,10,30,0.6)" : "var(--text-muted)", opacity: 0.75 }}>{entry.participant.line.name}</span>}
                </div>
                <span className="text-xs font-bold text-right tabular-nums" style={{ color: isMe ? "#EB0A1E" : "var(--text)" }}>{Math.round(entry.percentage)}%</span>
                <span className="text-xs font-semibold text-right tabular-nums" style={{ color: isMe ? "#EB0A1E" : "var(--text-muted)" }}>{formatDuration(dur)}</span>
              </div>
            );
          })
        )}

      </div>
      </div>

      <div className="mt-4 w-full max-w-4xl mx-auto">
        <button
          onClick={() => router.back()}
          className="w-full rounded-full py-3.5 text-base font-semibold transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          style={{ background: "var(--bg-card)", border: "2px solid var(--border)", color: "var(--text)" }}
        >
          Back to Results
        </button>
      </div>
    </PageShell>
  );
}

const RANK_MEDAL = ["#f59e0b", "#94a3b8", "#b45309"];

function TopCard({ entry, pos, myCode, youLabel }: { entry: LeaderboardEntry; pos: 1 | 2 | 3; myCode: string; youLabel: string }) {
  const isMe    = entry.participant.code === myCode;
  const isFirst = pos === 1;
  const color   = RANK_MEDAL[pos - 1];
  const avatarSz = isFirst ? 80 : 60;
  return (
    <div className="flex flex-col items-center rounded-3xl px-4 py-5 gap-2"
      style={{ flex: isFirst ? "0 0 26%" : "0 0 20%", maxWidth: isFirst ? 380 : 290, minWidth: isFirst ? 150 : 120, background: isFirst ? "#EB0A1E" : "var(--bg-card)", border: `1.5px solid ${isFirst ? "transparent" : "var(--border)"}`, alignSelf: isFirst ? "stretch" : "flex-end", minHeight: isFirst ? 240 : 190, boxShadow: isFirst ? "0 12px 32px rgba(235,10,30,0.35)" : "none" }}
    >
      <span className="text-sm font-black" style={{ color: isFirst ? "rgba(255,255,255,0.7)" : color }}>#{pos}</span>
      <Avatar name={entry.participant.name} imageUrl={resolveImage(entry.participant.imageUrl)} size={avatarSz} borderColor={isFirst ? "rgba(255,255,255,0.4)" : color} />
      <div className="text-center">
        <p className="text-sm font-bold leading-tight" style={{ color: isFirst ? "#fff" : "var(--text)" }}>
          {entry.participant.name}{isMe && <span style={{ color: isFirst ? "rgba(255,255,255,0.7)" : "#EB0A1E" }}> ({youLabel})</span>}
        </p>
        <p className="text-xs mt-0.5 truncate max-w-full" style={{ color: isFirst ? "rgba(255,255,255,0.6)" : "var(--text-muted)" }}>{entry.designation.name}</p>
        {entry.participant.line && <p className="text-[10px] truncate max-w-full" style={{ color: isFirst ? "rgba(255,255,255,0.45)" : "var(--text-muted)", opacity: 0.8 }}>{entry.participant.line.name}</p>}
      </div>
      <div className="rounded-full px-3 py-1 text-sm font-black" style={{ background: isFirst ? "rgba(255,255,255,0.2)" : `${color}22`, color: isFirst ? "#fff" : color }}>
        {Math.round(entry.percentage)}%
      </div>
    </div>
  );
}

function Avatar({ name, imageUrl, size, borderColor, highlight }: { name: string; imageUrl: string | null; size: number; borderColor?: string; highlight?: boolean }) {
  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const border   = `2.5px solid ${borderColor ?? (highlight ? "#EB0A1E" : "var(--border)")}`;
  return imageUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={imageUrl} alt={name} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", border, flexShrink: 0 }} />
  ) : (
    <div style={{ width: size, height: size, borderRadius: "50%", background: "#EB0A1E", border, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: size * 0.33, fontWeight: 700, color: "#fff" }}>
      {initials}
    </div>
  );
}
