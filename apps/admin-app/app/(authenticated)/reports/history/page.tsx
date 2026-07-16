"use client";

import { useState } from "react";
import {
  IconChevronDown, IconChevronLeft, IconChevronRight, IconCheck, IconAlertCircle, IconMail, IconClock,
} from "../../../components/icons";
import { ReportNav } from "../../../components/ReportNav";
import { useReportRecipients } from "../../../lib/hooks/useReportRecipients";
import { useEmailDispatchHistory, useTriggerReportDispatch } from "../../../lib/hooks/useReportScheduler";
import type { ReportType, EmailDispatchStatus } from "../../../types/master-data.types";

const PAGE_LIMIT = 20;

const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  DAILY: "Daily",
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
};

const REPORT_TYPES: ReportType[] = ["DAILY", "WEEKLY", "MONTHLY"];

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  }).format(new Date(iso));
}

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

function StatusBadge({ status }: { status: EmailDispatchStatus }) {
  const ok = status === "SUCCESS";
  return (
    <span
      className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
      style={{
        background: ok ? "rgba(22,163,74,0.12)" : "rgba(220,38,38,0.12)",
        color: ok ? "#16a34a" : "#dc2626",
      }}
    >
      {ok ? <IconCheck size={11} /> : <IconAlertCircle size={11} />}
      {ok ? "Success" : "Failed"}
    </span>
  );
}

function TriggerButton({ type }: { type: ReportType }) {
  const trigger = useTriggerReportDispatch();
  const isThis = trigger.isPending && trigger.variables === type;
  const result = trigger.isSuccess && trigger.variables === type ? trigger.data : undefined;

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={() => trigger.mutate(type)}
        disabled={trigger.isPending}
        className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        style={{ background: "var(--content-bg)", border: "1px solid var(--border)", color: "var(--text)" }}
      >
        <IconMail size={14} />
        {isThis ? "Sending…" : `Send ${REPORT_TYPE_LABELS[type]} Now`}
      </button>
      {result && (
        <p className="text-xs" style={{ color: "var(--text-sub)" }}>
          {result.recipients} recipient{result.recipients === 1 ? "" : "s"} · {result.sent} sent
          {result.skipped > 0 && ` · ${result.skipped} skipped`}
          {result.failed > 0 && ` · ${result.failed} failed`}
        </p>
      )}
    </div>
  );
}

export default function EmailDispatchHistoryPage() {
  const [recipientId, setRecipientId] = useState("");
  const [reportType, setReportType] = useState<ReportType | "">("");
  const [status, setStatus] = useState<EmailDispatchStatus | "">("");
  const [page, setPage] = useState(1);

  const { data: recipients = [] } = useReportRecipients();
  const { data, isLoading, isError, error } = useEmailDispatchHistory({
    recipientId: recipientId || undefined,
    reportType: reportType || undefined,
    status: status || undefined,
    page,
    limit: PAGE_LIMIT,
  });

  const entries = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_LIMIT));

  const recipientOptions = [
    { label: "All Recipients", value: "" },
    ...recipients.map((r) => ({ label: r.name ? `${r.name} (${r.email})` : r.email, value: r.id })),
  ];
  const reportTypeOptions = [
    { label: "All Report Types", value: "" },
    ...REPORT_TYPES.map((t) => ({ label: REPORT_TYPE_LABELS[t], value: t })),
  ];
  const statusOptions = [
    { label: "All Statuses", value: "" },
    { label: "Success", value: "SUCCESS" },
    { label: "Failed", value: "FAILED" },
  ];

  const filtersDirty = recipientId || reportType || status;
  const resetFilters = () => {
    setRecipientId(""); setReportType(""); setStatus(""); setPage(1);
  };

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

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Reports</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
            Analytics, performance trends &amp; report sharing
          </p>
        </div>
      </div>

      <ReportNav active="history" />

      {/* Section header + manual triggers */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold" style={{ color: "var(--text)" }}>Email Dispatch History</h2>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-sub)" }}>
            {isLoading ? "Loading…" : `${total} email${total === 1 ? "" : "s"} logged`}
          </p>
        </div>
        <div className="flex flex-wrap items-start gap-2">
          {REPORT_TYPES.map((t) => <TriggerButton key={t} type={t} />)}
        </div>
      </div>

      {/* Error banner */}
      {isError && (
        <div
          className="rounded-xl p-4 flex items-start gap-3"
          style={{ background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.20)" }}
        >
          <span className="text-lg shrink-0">⚠️</span>
          <div>
            <p className="text-sm font-semibold" style={{ color: "#dc2626" }}>Failed to load dispatch history</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              {(error as Error)?.message}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="rounded-xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2 flex-wrap">
          <FilterSelect value={recipientId} onChange={(v) => { setRecipientId(v); setPage(1); }} options={recipientOptions} />
          <FilterSelect value={reportType} onChange={(v) => { setReportType(v as ReportType | ""); setPage(1); }} options={reportTypeOptions} />
          <FilterSelect value={status} onChange={(v) => { setStatus(v as EmailDispatchStatus | ""); setPage(1); }} options={statusOptions} />
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
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 rounded-lg animate-pulse" style={{ background: "var(--content-bg)" }} />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <span style={{ color: "var(--text-sub)" }}><IconClock size={28} /></span>
            <p className="font-semibold" style={{ color: "var(--text)" }}>
              {filtersDirty ? "No emails match your filters" : "No emails sent yet"}
            </p>
            <p className="text-xs" style={{ color: "var(--text-sub)" }}>
              Scheduled report emails will appear here once sent.
            </p>
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--content-bg)" }}>
                  <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide" style={{ color: "var(--text-muted)" }}>Recipient</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide" style={{ color: "var(--text-muted)" }}>Report</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide" style={{ color: "var(--text-muted)" }}>Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide" style={{ color: "var(--text-muted)" }}>Sent At (IST)</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide" style={{ color: "var(--text-muted)" }}>Error</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e, i) => (
                  <tr
                    key={e.id}
                    style={{ borderBottom: i < entries.length - 1 ? "1px solid var(--border)" : "none" }}
                    onMouseEnter={(ev) => { (ev.currentTarget as HTMLTableRowElement).style.background = "var(--content-bg)"; }}
                    onMouseLeave={(ev) => { (ev.currentTarget as HTMLTableRowElement).style.background = "transparent"; }}
                  >
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-sm" style={{ color: "var(--text)" }}>{e.recipient.name || e.recipient.email}</p>
                      {e.recipient.name && (
                        <p className="text-xs mt-0.5" style={{ color: "var(--text-sub)" }}>{e.recipient.email}</p>
                      )}
                    </td>
                    <td className="px-4 py-3.5" style={{ color: "var(--text)" }}>{REPORT_TYPE_LABELS[e.reportType]}</td>
                    <td className="px-4 py-3.5"><StatusBadge status={e.status} /></td>
                    <td className="px-4 py-3.5 text-xs" style={{ color: "var(--text-sub)" }}>{formatDateTime(e.sentAt)}</td>
                    <td className="px-4 py-3.5 text-xs max-w-xs">
                      {e.error ? (
                        <span className="line-clamp-2" style={{ color: "#dc2626" }}>{e.error}</span>
                      ) : (
                        <span style={{ color: "var(--text-sub)" }}>—</span>
                      )}
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
                {`Showing ${Math.min((page - 1) * PAGE_LIMIT + 1, total)}–${Math.min(page * PAGE_LIMIT, total)} of ${total}`}
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
          </>
        )}
      </div>
    </div>
  );
}
