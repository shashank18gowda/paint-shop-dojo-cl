"use client";

import { useState } from "react";
import {
  IconPlus, IconSearch, IconEdit, IconTrash,
  IconHash, IconX,
} from "../../components/icons";
import { useLines, useCreateLine, useUpdateLine, useDeleteLine } from "../../lib/hooks/useLines";
import type { Line } from "../../types/master-data.types";

export default function LinesPage() {
  const { data: lines = [], isPending, error } = useLines();
  const createMut = useCreateLine();
  const updateMut = useUpdateLine();
  const deleteMut = useDeleteLine();

  const [search, setSearch] = useState("");
  const [drawer, setDrawer] = useState<{ open: boolean; editing: Line | null }>({ open: false, editing: null });
  const [pendingDelete, setPendingDelete] = useState<Line | null>(null);

  const filtered = lines.filter((l) =>
    !search ||
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    l.code.toLowerCase().includes(search.toLowerCase()),
  );

  const activeCount = lines.filter((l) => l.isActive).length;

  function toggleActive(line: Line) {
    updateMut.mutate({ id: line.id, input: { isActive: !line.isActive } });
  }

  function confirmDelete() {
    if (!pendingDelete) return;
    deleteMut.mutate(pendingDelete.id, {
      onSuccess: () => setPendingDelete(null),
    });
  }

  return (
    <div className="p-8 space-y-6 max-w-7xl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Lines</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
            {isPending ? "Loading…" : `${activeCount} active production line${activeCount === 1 ? "" : "s"}`}
          </p>
        </div>
        <button
          onClick={() => setDrawer({ open: true, editing: null })}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:brightness-90 active:scale-[0.98]"
          style={{ background: "#EB0A1E" }}
        >
          <IconPlus size={15} />
          Add Line
        </button>
      </div>

      {error && <ErrorBanner error={error} />}

      {/* Cards grid */}
      <div className="rounded-xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="relative max-w-md mb-4">
          <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-sub)" }}>
            <IconSearch size={15} />
          </span>
          <input
            type="text"
            placeholder="Search by name or code…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg focus:outline-none"
            style={{ background: "var(--content-bg)", border: "1px solid var(--border)", color: "var(--text)" }}
          />
        </div>

        {isPending ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl p-4 animate-pulse h-28" style={{ background: "var(--content-bg)" }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState hasSearch={!!search} onAdd={() => setDrawer({ open: true, editing: null })} />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((l) => (
              <LineCard
                key={l.id}
                line={l}
                onEdit={() => setDrawer({ open: true, editing: l })}
                onToggle={() => toggleActive(l)}
                onDelete={() => setPendingDelete(l)}
                disabled={updateMut.isPending}
              />
            ))}
          </div>
        )}
      </div>

      {/* Drawer */}
      {drawer.open && (
        <LineDrawer
          editing={drawer.editing}
          onClose={() => setDrawer({ open: false, editing: null })}
          onSubmit={(input) => {
            if (drawer.editing) {
              updateMut.mutate(
                { id: drawer.editing.id, input },
                { onSuccess: () => setDrawer({ open: false, editing: null }) },
              );
            } else {
              createMut.mutate(input, {
                onSuccess: () => setDrawer({ open: false, editing: null }),
              });
            }
          }}
          submitting={createMut.isPending || updateMut.isPending}
          submitError={createMut.error ?? updateMut.error ?? null}
        />
      )}

      {/* Delete confirmation */}
      {pendingDelete && (
        <DeleteConfirm
          line={pendingDelete}
          onCancel={() => setPendingDelete(null)}
          onConfirm={confirmDelete}
          deleting={deleteMut.isPending}
        />
      )}
    </div>
  );
}

// ─── Subcomponents ────────────────────────────────────────────────────────────

function LineCard({
  line, onEdit, onToggle, onDelete, disabled,
}: {
  line: Line;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
  disabled: boolean;
}) {
  return (
    <div
      className="rounded-xl p-4 transition-all"
      style={{
        background: "var(--content-bg)",
        border: "1px solid var(--border)",
        opacity: line.isActive ? 1 : 0.55,
      }}
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded"
              style={{ background: "var(--card)", color: "var(--text)" }}
            >
              <IconHash size={9} className="inline" />{line.code}
            </span>
            {line.sortOrder !== null && (
              <span className="text-[10px]" style={{ color: "var(--text-sub)" }}>
                Order #{line.sortOrder}
              </span>
            )}
          </div>
          <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{line.name}</p>
        </div>
        <button
          onClick={onToggle}
          disabled={disabled}
          className="relative h-5 w-9 rounded-full transition-colors shrink-0 disabled:opacity-50"
          style={{ background: line.isActive ? "#16a34a" : "var(--border)" }}
          title={line.isActive ? "Deactivate" : "Activate"}
        >
          <span
            className="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform"
            style={{ transform: line.isActive ? "translateX(16px)" : "translateX(0)" }}
          />
        </button>
      </div>

      <div className="flex items-center justify-end gap-1 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
        <button
          onClick={onEdit}
          className="flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-md transition-colors"
          style={{ color: "var(--text-muted)" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--card)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
        >
          <IconEdit size={11} /> Edit
        </button>
        <button
          onClick={onDelete}
          className="flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-md transition-colors"
          style={{ color: "var(--text-muted)" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(220,38,38,0.06)";
            (e.currentTarget as HTMLButtonElement).style.color = "#dc2626";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "transparent";
            (e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)";
          }}
        >
          <IconTrash size={11} /> Delete
        </button>
      </div>
    </div>
  );
}

function EmptyState({ hasSearch, onAdd }: { hasSearch: boolean; onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
      <span className="text-4xl">🏭</span>
      <p className="font-semibold" style={{ color: "var(--text)" }}>
        {hasSearch ? "No lines match your search" : "No lines yet"}
      </p>
      <p className="text-sm" style={{ color: "var(--text-sub)" }}>
        {hasSearch ? "Try a different search term." : "Add your first production line to get started."}
      </p>
      {!hasSearch && (
        <button
          onClick={onAdd}
          className="mt-2 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white"
          style={{ background: "#EB0A1E" }}
        >
          <IconPlus size={14} /> Add Line
        </button>
      )}
    </div>
  );
}

function ErrorBanner({ error }: { error: Error }) {
  return (
    <div
      className="rounded-xl p-4 flex items-start gap-3"
      style={{ background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.20)" }}
    >
      <span className="text-lg shrink-0">⚠️</span>
      <div className="flex-1">
        <p className="text-sm font-semibold" style={{ color: "#dc2626" }}>Failed to load lines</p>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{error.message}</p>
      </div>
    </div>
  );
}

function DeleteConfirm({
  line, onCancel, onConfirm, deleting,
}: {
  line: Line;
  onCancel: () => void;
  onConfirm: () => void;
  deleting: boolean;
}) {
  return (
    <>
      <div className="fixed inset-0 z-30 bg-black/40" onClick={onCancel} />
      <div
        className="fixed left-1/2 top-1/2 z-40 -translate-x-1/2 -translate-y-1/2 w-[400px] rounded-xl p-6"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      >
        <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>Deactivate this line?</h2>
        <p className="text-sm mt-2" style={{ color: "var(--text-muted)" }}>
          <span className="font-semibold" style={{ color: "var(--text)" }}>{line.name}</span> will be hidden from the kiosk participant flow. You can re-activate it later from this page.
        </p>
        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onCancel}
            disabled={deleting}
            className="px-3.5 py-2 rounded-lg text-sm font-medium"
            style={{ color: "var(--text-muted)" }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:brightness-90 disabled:opacity-60"
            style={{ background: "#dc2626" }}
          >
            {deleting ? "Deactivating…" : "Deactivate"}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Drawer (create/edit form) ────────────────────────────────────────────────

function LineDrawer({
  editing, onClose, onSubmit, submitting, submitError,
}: {
  editing: Line | null;
  onClose: () => void;
  onSubmit: (input: { code: string; name: string; sortOrder?: number; isActive: boolean }) => void;
  submitting: boolean;
  submitError: Error | null;
}) {
  const isEdit = !!editing;
  const [code, setCode] = useState(editing?.code ?? "");
  const [name, setName] = useState(editing?.name ?? "");
  const [sortOrder, setSortOrder] = useState<string>(
    editing?.sortOrder !== null && editing?.sortOrder !== undefined ? String(editing.sortOrder) : "",
  );
  const [isActive, setIsActive] = useState(editing?.isActive ?? true);

  const [sortOrderError, setSortOrderError] = useState("");

  const isConflict =
    !!submitError &&
    (submitError.message.includes("409") ||
      submitError.message.toLowerCase().includes("already exists"));

  const isNameConflict = isConflict && submitError!.message.toLowerCase().includes("name");
  const isCodeConflict = isConflict && !isNameConflict;

  const canSubmit = code.trim().length >= 2 && name.trim().length >= 1 && !submitting;

  function handleSubmit() {
    if (!canSubmit) return;

    if (sortOrder.trim() !== "") {
      if (!/^\d+$/.test(sortOrder.trim()) || Number(sortOrder.trim()) < 0) {
        setSortOrderError("Must be a non-negative whole number");
        return;
      }
    }
    setSortOrderError("");

    const input: { code: string; name: string; sortOrder?: number; isActive: boolean } = {
      code: code.trim(),
      name: name.trim(),
      isActive,
    };
    if (sortOrder.trim() !== "") input.sortOrder = Number(sortOrder.trim());
    onSubmit(input);
  }

  return (
    <>
      <div className="fixed inset-0 z-30 bg-black/30" onClick={onClose} />
      <div
        className="fixed right-0 top-0 z-40 h-full w-[420px] flex flex-col shadow-2xl"
        style={{ background: "var(--card)" }}
      >
        <div className="flex items-center justify-between p-5" style={{ borderBottom: "1px solid var(--border)" }}>
          <div>
            <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>
              {isEdit ? "Edit Line" : "New Line"}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-sub)" }}>
              {isEdit ? "Update line details" : "Add a new production line"}
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

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--text-muted)" }}>
              Code <span style={{ color: "#dc2626" }}>*</span>
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="TOP_COAT"
              className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-red-100 font-mono"
              style={{
                background: "var(--content-bg)",
                border: `1px solid ${isCodeConflict ? "#dc2626" : "var(--border)"}`,
                color: "var(--text)",
              }}
            />
            {isCodeConflict ? (
              <p className="text-xs mt-1" style={{ color: "#dc2626" }}>
                This code is already in use — choose a different one
              </p>
            ) : (
              <p className="text-xs mt-1" style={{ color: "var(--text-sub)" }}>
                Unique identifier used internally. Uppercase letters/digits/underscores.
              </p>
            )}
          </div>

          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--text-muted)" }}>
              Display Name <span style={{ color: "#dc2626" }}>*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Top Coat Line"
              className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-red-100"
              style={{
                background: "var(--content-bg)",
                border: `1px solid ${isNameConflict ? "#dc2626" : "var(--border)"}`,
                color: "var(--text)",
              }}
            />
            {isNameConflict && (
              <p className="text-xs mt-1" style={{ color: "#dc2626" }}>
                This name is already in use — choose a different one
              </p>
            )}
          </div>

          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--text-muted)" }}>
              Sort Order
            </label>
            <input
              type="number"
              min={0}
              value={sortOrder}
              onChange={(e) => { setSortOrder(e.target.value); setSortOrderError(""); }}
              placeholder="1"
              className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-red-100"
              style={{
                background: "var(--content-bg)",
                border: `1px solid ${sortOrderError ? "#dc2626" : "var(--border)"}`,
                color: "var(--text)",
              }}
            />
            {sortOrderError ? (
              <p className="text-xs mt-1" style={{ color: "#dc2626" }}>{sortOrderError}</p>
            ) : (
              <p className="text-xs mt-1" style={{ color: "var(--text-sub)" }}>
                Lower values appear first in the kiosk picker. Leave blank to sort by name.
              </p>
            )}
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: "var(--content-bg)" }}>
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--text)" }}>Active</p>
              <p className="text-xs" style={{ color: "var(--text-sub)" }}>Visible to kiosk participants</p>
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

          {submitError && !isCodeConflict && !isNameConflict && (
            <div
              className="rounded-lg p-3"
              style={{ background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.20)" }}
            >
              <p className="text-xs font-semibold" style={{ color: "#dc2626" }}>Failed to save</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{submitError.message}</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 p-5" style={{ borderTop: "1px solid var(--border)" }}>
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-3.5 py-2 rounded-lg text-sm font-medium"
            style={{ color: "var(--text-muted)" }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:brightness-90 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ background: "#EB0A1E" }}
          >
            {submitting ? (isEdit ? "Saving…" : "Creating…") : (isEdit ? "Save Changes" : "Create Line")}
          </button>
        </div>
      </div>
    </>
  );
}
