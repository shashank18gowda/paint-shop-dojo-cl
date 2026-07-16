"use client";

import { useState } from "react";
import {
  IconPlus, IconEdit, IconTrash, IconShield, IconHash, IconX,
} from "../../components/icons";
import {
  useParticipantTypes,
  useCreateParticipantType,
  useUpdateParticipantType,
  useDeleteParticipantType,
} from "../../lib/hooks/useParticipantTypes";
import type { ParticipantType } from "../../types/master-data.types";

const PALETTE = ["#3b82f6", "#a855f7", "#f59e0b", "#16a34a", "#EB0A1E", "#06b6d4", "#ec4899", "#6b7280"];

function typeColor(index: number): string {
  return PALETTE[index % PALETTE.length] ?? "#3b82f6";
}

function validate(
  code: string,
  name: string,
  sortOrderStr: string,
): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!code.trim()) {
    errors.code = "Code is required";
  } else if (code.trim().length < 2) {
    errors.code = "Code must be at least 2 characters";
  }
  if (!name.trim()) {
    errors.name = "Name is required";
  }
  if (
    sortOrderStr !== "" &&
    (!/^\d+$/.test(sortOrderStr) || Number(sortOrderStr) < 0)
  ) {
    errors.sortOrder = "Must be a non-negative whole number";
  }
  return errors;
}

export default function ParticipantTypesPage() {
  const { data: items = [], isLoading, isError, error } = useParticipantTypes();
  const deleteType = useDeleteParticipantType();
  const [drawer, setDrawer] = useState<{ open: boolean; editing: ParticipantType | null }>({
    open: false,
    editing: null,
  });
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  function handleDelete(id: string) {
    if (pendingDelete === id) {
      deleteType.mutate(id, { onSuccess: () => setPendingDelete(null) });
    } else {
      setPendingDelete(id);
    }
  }

  return (
    <div className="p-8 space-y-6 max-w-7xl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Participant Types</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
            {isLoading
              ? "Loading…"
              : `${items.length} types · ${items.filter((t) => t.isActive).length} active`}
          </p>
        </div>
        <button
          onClick={() => setDrawer({ open: true, editing: null })}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:brightness-90 active:scale-[0.98]"
          style={{ background: "#EB0A1E" }}
        >
          <IconPlus size={15} />
          Add Type
        </button>
      </div>

      {/* Error banner */}
      {isError && (
        <div
          className="rounded-xl px-4 py-3 text-sm"
          style={{
            background: "rgba(220,38,38,0.06)",
            border: "1px solid rgba(220,38,38,0.2)",
            color: "#dc2626",
          }}
        >
          {(error as Error)?.message ?? "Failed to load participant types"}
        </div>
      )}

      {/* Loading skeletons */}
      {isLoading && (
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-xl p-5 animate-pulse"
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                height: 160,
              }}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && items.length === 0 && (
        <div
          className="rounded-xl p-12 flex flex-col items-center justify-center gap-3"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <div
            className="flex h-12 w-12 items-center justify-center rounded-xl"
            style={{ background: "var(--content-bg)", color: "var(--text-sub)" }}
          >
            <IconShield size={20} />
          </div>
          <p className="text-sm font-medium" style={{ color: "var(--text)" }}>No participant types yet</p>
          <p className="text-xs" style={{ color: "var(--text-sub)" }}>Create a type to get started</p>
        </div>
      )}

      {/* Cards */}
      {!isLoading && items.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {items.map((p, idx) => {
            const color = typeColor(idx);
            const isDeleting = deleteType.isPending && deleteType.variables === p.id;
            return (
              <div
                key={p.id}
                className="rounded-xl p-5 transition-all"
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  opacity: p.isActive ? 1 : 0.55,
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-xl"
                    style={{ background: `${color}1A`, color }}
                  >
                    <IconShield size={20} />
                  </div>
                  <span
                    className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{
                      background: p.isActive ? "rgba(22,163,74,0.1)" : "var(--content-bg)",
                      color: p.isActive ? "#16a34a" : "var(--text-sub)",
                    }}
                  >
                    {p.isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-base font-bold" style={{ color: "var(--text)" }}>{p.name}</h3>
                  <span
                    className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded inline-flex items-center"
                    style={{ background: "var(--content-bg)", color: "var(--text-muted)" }}
                  >
                    <IconHash size={9} />{p.code}
                  </span>
                </div>
                {p.sortOrder != null && (
                  <p className="text-xs" style={{ color: "var(--text-sub)" }}>Sort order: {p.sortOrder}</p>
                )}

                <div
                  className="flex items-center justify-end gap-1 mt-4 pt-3"
                  style={{ borderTop: "1px solid var(--border)" }}
                >
                  <button
                    onClick={() => setDrawer({ open: true, editing: p })}
                    className="flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-md transition-colors"
                    style={{ color: "var(--text-muted)" }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = "var(--content-bg)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                    }}
                  >
                    <IconEdit size={11} /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    disabled={isDeleting}
                    className="flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-md transition-colors"
                    style={{
                      color: pendingDelete === p.id ? "#dc2626" : "var(--text-muted)",
                      background: pendingDelete === p.id ? "rgba(220,38,38,0.06)" : "transparent",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = "rgba(220,38,38,0.06)";
                      (e.currentTarget as HTMLButtonElement).style.color = "#dc2626";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background =
                        pendingDelete === p.id ? "rgba(220,38,38,0.06)" : "transparent";
                      (e.currentTarget as HTMLButtonElement).style.color =
                        pendingDelete === p.id ? "#dc2626" : "var(--text-muted)";
                    }}
                    title={pendingDelete === p.id ? "Click again to confirm deletion" : "Delete"}
                  >
                    <IconTrash size={11} />
                    {pendingDelete === p.id ? (isDeleting ? "Deleting…" : "Confirm") : "Delete"}
                  </button>
                  {pendingDelete === p.id && !isDeleting && (
                    <button
                      onClick={() => setPendingDelete(null)}
                      className="flex items-center text-xs font-medium px-1.5 py-1 rounded-md"
                      style={{ color: "var(--text-sub)" }}
                      title="Cancel"
                    >
                      <IconX size={11} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Drawer */}
      {drawer.open && (
        <PTypeDrawer
          editing={drawer.editing}
          onClose={() => setDrawer({ open: false, editing: null })}
        />
      )}
    </div>
  );
}

function PTypeDrawer({
  editing,
  onClose,
}: {
  editing: ParticipantType | null;
  onClose: () => void;
}) {
  const isEdit = !!editing;
  const create = useCreateParticipantType();
  const update = useUpdateParticipantType();

  const [code, setCode] = useState(editing?.code ?? "");
  const [name, setName] = useState(editing?.name ?? "");
  const [sortOrderStr, setSortOrderStr] = useState(
    editing?.sortOrder != null ? String(editing.sortOrder) : "",
  );
  const [isActive, setIsActive] = useState(editing?.isActive ?? true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState("");

  const isPending = create.isPending || update.isPending;

  function clearFieldError(field: string) {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  function handleSubmit() {
    const errs = validate(code, name, sortOrderStr);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setApiError("");
    const payload = {
      code: code.trim(),
      name: name.trim(),
      sortOrder: sortOrderStr !== "" ? Number(sortOrderStr) : undefined,
      isActive,
    };

    function handleError(e: unknown) {
      const msg = (e as Error).message ?? "";
      if (msg.includes("409") || msg.toLowerCase().includes("already exists")) {
        if (msg.toLowerCase().includes("name")) {
          setErrors({ name: "This name is already in use — choose a different one" });
        } else {
          setErrors({ code: "This code is already in use — choose a different one" });
        }
      } else {
        setApiError(msg || "Something went wrong");
      }
    }

    if (isEdit) {
      update.mutate(
        { id: editing!.id, input: payload },
        { onSuccess: onClose, onError: handleError },
      );
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
        <div
          className="flex items-center justify-between p-5"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div>
            <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>
              {isEdit ? "Edit Type" : "New Type"}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-sub)" }}>
              {isEdit ? "Update participant type" : "Add a new participant role"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
            style={{ color: "var(--text-muted)" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "var(--content-bg)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "transparent";
            }}
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

          {/* Preview */}
          <div
            className="flex items-center gap-3 p-3 rounded-lg"
            style={{ background: "var(--content-bg)" }}
          >
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ background: "#3b82f61A", color: "#3b82f6" }}
            >
              <IconShield size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                {name || "Type Name"}
              </p>
              <p className="text-xs font-mono" style={{ color: "var(--text-sub)" }}>
                {code || "CODE"}
              </p>
            </div>
          </div>

          {/* Code */}
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--text-muted)" }}>
              Code <span style={{ color: "#dc2626" }}>*</span>
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                clearFieldError("code");
              }}
              placeholder="OPER"
              className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-red-100 font-mono"
              style={{
                background: "var(--content-bg)",
                border: `1px solid ${errors.code ? "#dc2626" : "var(--border)"}`,
                color: "var(--text)",
              }}
            />
            {errors.code ? (
              <p className="text-xs mt-1" style={{ color: "#dc2626" }}>{errors.code}</p>
            ) : (
              <p className="text-xs mt-1" style={{ color: "var(--text-sub)" }}>
                Unique identifier · uppercase letters and numbers
              </p>
            )}
          </div>

          {/* Name */}
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--text-muted)" }}>
              Name <span style={{ color: "#dc2626" }}>*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                clearFieldError("name");
              }}
              placeholder="Operator"
              className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-red-100"
              style={{
                background: "var(--content-bg)",
                border: `1px solid ${errors.name ? "#dc2626" : "var(--border)"}`,
                color: "var(--text)",
              }}
            />
            {errors.name && (
              <p className="text-xs mt-1" style={{ color: "#dc2626" }}>{errors.name}</p>
            )}
          </div>

          {/* Sort Order */}
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--text-muted)" }}>
              Sort Order
            </label>
            <input
              type="number"
              value={sortOrderStr}
              onChange={(e) => {
                setSortOrderStr(e.target.value);
                clearFieldError("sortOrder");
              }}
              placeholder="1"
              min={0}
              className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-red-100"
              style={{
                background: "var(--content-bg)",
                border: `1px solid ${errors.sortOrder ? "#dc2626" : "var(--border)"}`,
                color: "var(--text)",
              }}
            />
            {errors.sortOrder ? (
              <p className="text-xs mt-1" style={{ color: "#dc2626" }}>{errors.sortOrder}</p>
            ) : (
              <p className="text-xs mt-1" style={{ color: "var(--text-sub)" }}>
                Controls display order · leave blank for alphabetical
              </p>
            )}
          </div>

          {/* Active toggle */}
          <div
            className="flex items-center justify-between p-3 rounded-lg"
            style={{ background: "var(--content-bg)" }}
          >
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--text)" }}>Active</p>
              <p className="text-xs" style={{ color: "var(--text-sub)" }}>
                Available for new participants
              </p>
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
              ? isEdit
                ? "Saving…"
                : "Creating…"
              : isEdit
                ? "Save Changes"
                : "Create Type"}
          </button>
        </div>
      </div>
    </>
  );
}
