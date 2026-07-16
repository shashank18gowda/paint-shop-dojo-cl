"use client";

import { useState } from "react";
import {
  IconPlus, IconSearch, IconEdit, IconTrash, IconMail, IconX,
} from "../../../components/icons";
import { ReportNav } from "../../../components/ReportNav";
import {
  useReportRecipients,
  useCreateReportRecipient,
  useUpdateReportRecipient,
  useDeleteReportRecipient,
  useUpdateReportAccess,
} from "../../../lib/hooks/useReportRecipients";
import type { ReportRecipient } from "../../../types/master-data.types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ACCESS_OPTIONS: { key: "daily" | "weekly" | "monthly"; label: string; full: string }[] = [
  { key: "daily", label: "D", full: "Daily" },
  { key: "weekly", label: "W", full: "Weekly" },
  { key: "monthly", label: "M", full: "Monthly" },
];

function validate(email: string): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!email.trim()) {
    errors.email = "Email is required";
  } else if (!EMAIL_RE.test(email.trim())) {
    errors.email = "Enter a valid email address";
  }
  return errors;
}

export default function ReportRecipientsPage() {
  const { data: items = [], isLoading, isError, error } = useReportRecipients();
  const updateMut = useUpdateReportRecipient();
  const deleteMut = useDeleteReportRecipient();

  const [search, setSearch] = useState("");
  const [drawer, setDrawer] = useState<{ open: boolean; editingId: string | null }>({
    open: false,
    editingId: null,
  });
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const filtered = items.filter(
    (r) =>
      !search ||
      r.email.toLowerCase().includes(search.toLowerCase()) ||
      (r.name ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  // Always resolve the live recipient from query data so the drawer stays fresh
  const liveEditing = drawer.editingId
    ? (items.find((r) => r.id === drawer.editingId) ?? null)
    : null;

  function toggleActive(recipient: ReportRecipient) {
    updateMut.mutate({ id: recipient.id, input: { isActive: !recipient.isActive } });
  }

  function handleDelete(id: string) {
    if (pendingDelete === id) {
      deleteMut.mutate(id, { onSuccess: () => setPendingDelete(null) });
    } else {
      setPendingDelete(id);
    }
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

      <ReportNav active="recipients" />

      {/* Section header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold" style={{ color: "var(--text)" }}>Email Recipients</h2>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-sub)" }}>
            {isLoading
              ? "Loading…"
              : `${items.length} recipient${items.length === 1 ? "" : "s"} · ${items.filter((r) => r.isActive).length} active`}
          </p>
        </div>
        <button
          onClick={() => setDrawer({ open: true, editingId: null })}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:brightness-90 active:scale-[0.98]"
          style={{ background: "#EB0A1E" }}
        >
          <IconPlus size={15} />
          Add Recipient
        </button>
      </div>

      {/* Error banner */}
      {isError && (
        <div
          className="rounded-xl p-4 flex items-start gap-3"
          style={{ background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.20)" }}
        >
          <span className="text-lg shrink-0">⚠️</span>
          <div>
            <p className="text-sm font-semibold" style={{ color: "#dc2626" }}>Failed to load recipients</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              {(error as Error)?.message}
            </p>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="rounded-xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="relative max-w-md">
          <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-sub)" }}>
            <IconSearch size={15} />
          </span>
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg focus:outline-none"
            style={{ background: "var(--content-bg)", border: "1px solid var(--border)", color: "var(--text)" }}
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 rounded-lg animate-pulse" style={{ background: "var(--content-bg)" }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <p className="font-semibold" style={{ color: "var(--text)" }}>
              {search ? "No recipients match your search" : "No recipients yet"}
            </p>
            {!search && (
              <button
                onClick={() => setDrawer({ open: true, editingId: null })}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white"
                style={{ background: "#EB0A1E" }}
              >
                <IconPlus size={14} /> Add Recipient
              </button>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--content-bg)" }}>
                <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide" style={{ color: "var(--text-muted)" }}>Email</th>
                <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide" style={{ color: "var(--text-muted)" }}>Name & Notes</th>
                <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide" style={{ color: "var(--text-muted)" }}>Report Access</th>
                <th className="w-24 px-4 py-3 text-left text-xs font-semibold tracking-wide" style={{ color: "var(--text-muted)" }}>Status</th>
                <th className="w-24 px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => {
                const isDeleting = deleteMut.isPending && deleteMut.variables === r.id;
                return (
                  <tr
                    key={r.id}
                    style={{ borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : "none" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "var(--content-bg)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "transparent"; }}
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="flex h-8 w-8 items-center justify-center rounded-lg shrink-0"
                          style={{ background: "rgba(59,130,246,0.10)", color: "#3b82f6" }}
                        >
                          <IconMail size={14} />
                        </div>
                        <span className="font-medium text-sm" style={{ color: "var(--text)" }}>{r.email}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-sm" style={{ color: "var(--text)" }}>{r.name || "—"}</p>
                      {r.notes && (
                        <p className="text-xs mt-0.5 line-clamp-1" style={{ color: "var(--text-sub)" }}>
                          {r.notes}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <ReportAccessBadges recipient={r} />
                    </td>
                    <td className="px-4 py-4">
                      <button
                        onClick={() => toggleActive(r)}
                        disabled={updateMut.isPending}
                        className="relative h-5 w-9 rounded-full transition-colors disabled:opacity-50"
                        style={{ background: r.isActive ? "#16a34a" : "var(--border)" }}
                        title={r.isActive ? "Deactivate" : "Activate"}
                      >
                        <span
                          className="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform"
                          style={{ transform: r.isActive ? "translateX(16px)" : "translateX(0)" }}
                        />
                      </button>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setDrawer({ open: true, editingId: r.id })}
                          className="flex h-7 w-7 items-center justify-center rounded-md transition-colors"
                          style={{ color: "var(--text-muted)" }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--content-bg)"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                          title="Edit"
                        >
                          <IconEdit size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(r.id)}
                          disabled={isDeleting}
                          className="flex h-7 items-center justify-center gap-1 px-1.5 rounded-md text-xs font-medium transition-colors disabled:opacity-50"
                          style={{
                            color: pendingDelete === r.id ? "#dc2626" : "var(--text-muted)",
                            background: pendingDelete === r.id ? "rgba(220,38,38,0.06)" : "transparent",
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.background = "rgba(220,38,38,0.06)";
                            (e.currentTarget as HTMLButtonElement).style.color = "#dc2626";
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.background =
                              pendingDelete === r.id ? "rgba(220,38,38,0.06)" : "transparent";
                            (e.currentTarget as HTMLButtonElement).style.color =
                              pendingDelete === r.id ? "#dc2626" : "var(--text-muted)";
                          }}
                          title={pendingDelete === r.id ? "Click again to confirm" : "Delete"}
                        >
                          <IconTrash size={13} />
                          {pendingDelete === r.id && (
                            <span>{isDeleting ? "…" : "Confirm"}</span>
                          )}
                        </button>
                        {pendingDelete === r.id && !isDeleting && (
                          <button
                            onClick={() => setPendingDelete(null)}
                            className="flex h-7 w-7 items-center justify-center rounded-md"
                            style={{ color: "var(--text-sub)" }}
                            title="Cancel"
                          >
                            <IconX size={12} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Drawer */}
      {drawer.open && (
        <RecipientDrawer
          editing={liveEditing}
          onClose={() => setDrawer({ open: false, editingId: null })}
        />
      )}
    </div>
  );
}

/** Read-only access badges shown in the list */
function ReportAccessBadges({ recipient }: { recipient: ReportRecipient }) {
  const enabled = ACCESS_OPTIONS.filter(({ key }) => recipient.reportAccess[key]);
  if (enabled.length === 0) {
    return <span className="text-xs" style={{ color: "var(--text-sub)" }}>None</span>;
  }
  return (
    <div className="flex items-center gap-1.5">
      {enabled.map(({ key, label, full }) => (
        <span
          key={key}
          className="flex h-6 w-6 items-center justify-center rounded-md text-xs font-semibold"
          style={{
            background: "rgba(22,163,74,0.12)",
            border: "1px solid #16a34a",
            color: "#16a34a",
          }}
          title={`${full} report enabled`}
        >
          {label}
        </span>
      ))}
    </div>
  );
}

function RecipientDrawer({
  editing,
  onClose,
}: {
  editing: ReportRecipient | null;
  onClose: () => void;
}) {
  const isEdit = !!editing;
  const create = useCreateReportRecipient();
  const update = useUpdateReportRecipient();
  const updateAccess = useUpdateReportAccess();

  const [email, setEmail] = useState(editing?.email ?? "");
  const [name, setName] = useState(editing?.name ?? "");
  const [notes, setNotes] = useState(editing?.notes ?? "");
  const [isActive, setIsActive] = useState(editing?.isActive ?? true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState("");

  const isPending = create.isPending || update.isPending;
  const isAccessPending = updateAccess.isPending && updateAccess.variables?.id === editing?.id;

  function clearFieldError(field: string) {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  function handleSubmit() {
    const errs = validate(email);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setApiError("");
    const payload = {
      email: email.trim(),
      name: name.trim() || undefined,
      notes: notes.trim() || undefined,
      isActive,
    };

    function handleError(e: unknown) {
      const msg = (e as Error).message ?? "";
      if (msg.includes("409") || msg.toLowerCase().includes("already exists")) {
        setErrors({ email: "This email is already in the list" });
      } else {
        setApiError(msg || "Something went wrong");
      }
    }

    if (isEdit) {
      update.mutate({ id: editing!.id, input: payload }, { onSuccess: onClose, onError: handleError });
    } else {
      create.mutate(payload, { onSuccess: onClose, onError: handleError });
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-30 bg-black/30" onClick={onClose} />
      <div
        className="fixed right-0 top-0 z-40 h-full w-[420px] flex flex-col shadow-2xl"
        style={{ background: "var(--card)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5" style={{ borderBottom: "1px solid var(--border)" }}>
          <div>
            <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>
              {isEdit ? "Edit Recipient" : "New Recipient"}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-sub)" }}>
              {isEdit ? "Update recipient details" : "Add an email address to the report sharing list"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
            style={{ color: "var(--text-muted)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--content-bg)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
          >
            <IconX size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* API error */}
          {apiError && (
            <div
              className="rounded-lg px-3 py-2.5 text-xs"
              style={{
                background: "rgba(220,38,38,0.06)",
                border: "1px solid rgba(220,38,38,0.2)",
                color: "#dc2626",
              }}
            >
              {apiError}
            </div>
          )}

          {/* Email */}
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--text-muted)" }}>
              Email <span style={{ color: "#dc2626" }}>*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); clearFieldError("email"); }}
              placeholder="name@example.com"
              className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-red-100"
              style={{
                background: "var(--content-bg)",
                border: `1px solid ${errors.email ? "#dc2626" : "var(--border)"}`,
                color: "var(--text)",
              }}
            />
            {errors.email && (
              <p className="text-xs mt-1" style={{ color: "#dc2626" }}>{errors.email}</p>
            )}
          </div>

          {/* Name */}
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--text-muted)" }}>
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Plant Head"
              className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-red-100"
              style={{ background: "var(--content-bg)", border: "1px solid var(--border)", color: "var(--text)" }}
            />
            <p className="text-xs mt-1" style={{ color: "var(--text-sub)" }}>
              Optional · helps identify who this address belongs to
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--text-muted)" }}>
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="e.g. Should receive weekly performance summaries…"
              className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-red-100 resize-none"
              style={{ background: "var(--content-bg)", border: "1px solid var(--border)", color: "var(--text)" }}
            />
          </div>

          {/* Active toggle */}
          <div
            className="flex items-center justify-between p-3 rounded-lg"
            style={{ background: "var(--content-bg)" }}
          >
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--text)" }}>Active</p>
              <p className="text-xs" style={{ color: "var(--text-sub)" }}>Included when reports are shared</p>
            </div>
            <button
              onClick={() => setIsActive((v) => !v)}
              className="relative h-6 w-11 rounded-full transition-colors shrink-0"
              style={{ background: isActive ? "#16a34a" : "var(--border)" }}
            >
              <span
                className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform"
                style={{ transform: isActive ? "translateX(20px)" : "translateX(0)" }}
              />
            </button>
          </div>

          {/* Report Access — edit mode only */}
          {isEdit && editing && (
            <div>
              <div style={{ borderTop: "1px solid var(--border)", marginBottom: "1rem" }} />
              <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--text-muted)" }}>
                Report Access
              </label>
              <p className="text-xs mb-3" style={{ color: "var(--text-sub)" }}>
                Choose which report frequencies this recipient receives
              </p>
              <div className="flex items-center gap-2">
                {ACCESS_OPTIONS.map(({ key, label, full }) => {
                  const enabled = editing.reportAccess[key];
                  return (
                    <button
                      key={key}
                      onClick={() =>
                        updateAccess.mutate({ id: editing.id, input: { [key]: !enabled } })
                      }
                      disabled={isAccessPending}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                      style={{
                        background: enabled ? "rgba(22,163,74,0.12)" : "var(--content-bg)",
                        border: `1px solid ${enabled ? "#16a34a" : "var(--border)"}`,
                        color: enabled ? "#16a34a" : "var(--text-sub)",
                      }}
                      title={`${full} report ${enabled ? "enabled — click to disable" : "disabled — click to enable"}`}
                    >
                      <span
                        className="flex h-5 w-5 items-center justify-center rounded font-bold text-xs"
                        style={{
                          background: enabled ? "#16a34a" : "var(--border)",
                          color: "white",
                        }}
                      >
                        {label}
                      </span>
                      {full}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-end gap-2 p-5"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <button
            onClick={onClose}
            className="px-3.5 py-2 rounded-lg text-sm font-medium"
            style={{ color: "var(--text-muted)" }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:brightness-90 disabled:opacity-60"
            style={{ background: "#EB0A1E" }}
          >
            {isPending
              ? isEdit ? "Saving…" : "Adding…"
              : isEdit ? "Save Changes" : "Add Recipient"}
          </button>
        </div>
      </div>
    </>
  );
}
