"use client";

import { useState } from "react";
import {
  IconPlus, IconSearch, IconEdit, IconTrash,
  IconHash, IconX,
} from "../../components/icons";
import {
  useDesignations,
  useCreateDesignation,
  useUpdateDesignation,
  useDeleteDesignation,
} from "../../lib/hooks/useDesignations";
import type { Designation } from "../../types/master-data.types";

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
  if (sortOrderStr !== "" && (!/^\d+$/.test(sortOrderStr) || Number(sortOrderStr) < 0)) {
    errors.sortOrder = "Must be a non-negative whole number";
  }
  return errors;
}

export default function DesignationsPage() {
  const { data: items = [], isLoading, isError, error } = useDesignations();
  const updateMut = useUpdateDesignation();
  const deleteMut = useDeleteDesignation();

  const [search, setSearch] = useState("");
  const [drawer, setDrawer] = useState<{ open: boolean; editing: Designation | null }>({
    open: false,
    editing: null,
  });
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const filtered = items.filter(
    (d) =>
      !search ||
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.code.toLowerCase().includes(search.toLowerCase()),
  );

  function toggleActive(designation: Designation) {
    updateMut.mutate({ id: designation.id, input: { isActive: !designation.isActive } });
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
          <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Designations</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
            {isLoading
              ? "Loading…"
              : `${items.length} designations · ${items.filter((d) => d.isActive).length} active`}
          </p>
        </div>
        <button
          onClick={() => setDrawer({ open: true, editing: null })}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:brightness-90 active:scale-[0.98]"
          style={{ background: "#EB0A1E" }}
        >
          <IconPlus size={15} />
          Add Designation
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
            <p className="text-sm font-semibold" style={{ color: "#dc2626" }}>Failed to load designations</p>
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
            placeholder="Search by name or code…"
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
              {search ? "No designations match your search" : "No designations yet"}
            </p>
            {!search && (
              <button
                onClick={() => setDrawer({ open: true, editing: null })}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white"
                style={{ background: "#EB0A1E" }}
              >
                <IconPlus size={14} /> Add Designation
              </button>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--content-bg)" }}>
                <th className="w-28 px-4 py-3 text-left text-xs font-semibold tracking-wide" style={{ color: "var(--text-muted)" }}>Code</th>
                <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide" style={{ color: "var(--text-muted)" }}>Name & Description</th>
                <th className="w-20 px-4 py-3 text-left text-xs font-semibold tracking-wide" style={{ color: "var(--text-muted)" }}>Order</th>
                <th className="w-24 px-4 py-3 text-left text-xs font-semibold tracking-wide" style={{ color: "var(--text-muted)" }}>Status</th>
                <th className="w-24 px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d, i) => {
                const isDeleting = deleteMut.isPending && deleteMut.variables === d.id;
                return (
                  <tr
                    key={d.id}
                    style={{ borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : "none" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "var(--content-bg)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "transparent"; }}
                  >
                    <td className="px-4 py-4">
                      <span
                        className="inline-flex items-center gap-1 font-mono text-xs font-bold px-2 py-1 rounded"
                        style={{ background: "var(--content-bg)", color: "var(--text)" }}
                      >
                        <IconHash size={10} />
                        {d.code}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-sm" style={{ color: "var(--text)" }}>{d.name}</p>
                      {d.description && (
                        <p className="text-xs mt-0.5 line-clamp-1" style={{ color: "var(--text-sub)" }}>
                          {d.description}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {d.sortOrder ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <button
                        onClick={() => toggleActive(d)}
                        disabled={updateMut.isPending}
                        className="relative h-5 w-9 rounded-full transition-colors disabled:opacity-50"
                        style={{ background: d.isActive ? "#16a34a" : "var(--border)" }}
                        title={d.isActive ? "Deactivate" : "Activate"}
                      >
                        <span
                          className="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform"
                          style={{ transform: d.isActive ? "translateX(16px)" : "translateX(0)" }}
                        />
                      </button>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setDrawer({ open: true, editing: d })}
                          className="flex h-7 w-7 items-center justify-center rounded-md transition-colors"
                          style={{ color: "var(--text-muted)" }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--content-bg)"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                          title="Edit"
                        >
                          <IconEdit size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(d.id)}
                          disabled={isDeleting}
                          className="flex h-7 items-center justify-center gap-1 px-1.5 rounded-md text-xs font-medium transition-colors disabled:opacity-50"
                          style={{
                            color: pendingDelete === d.id ? "#dc2626" : "var(--text-muted)",
                            background: pendingDelete === d.id ? "rgba(220,38,38,0.06)" : "transparent",
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.background = "rgba(220,38,38,0.06)";
                            (e.currentTarget as HTMLButtonElement).style.color = "#dc2626";
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.background =
                              pendingDelete === d.id ? "rgba(220,38,38,0.06)" : "transparent";
                            (e.currentTarget as HTMLButtonElement).style.color =
                              pendingDelete === d.id ? "#dc2626" : "var(--text-muted)";
                          }}
                          title={pendingDelete === d.id ? "Click again to confirm" : "Delete"}
                        >
                          <IconTrash size={13} />
                          {pendingDelete === d.id && (
                            <span>{isDeleting ? "…" : "Confirm"}</span>
                          )}
                        </button>
                        {pendingDelete === d.id && !isDeleting && (
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
        <DesignationDrawer
          editing={drawer.editing}
          onClose={() => setDrawer({ open: false, editing: null })}
        />
      )}
    </div>
  );
}

function DesignationDrawer({
  editing,
  onClose,
}: {
  editing: Designation | null;
  onClose: () => void;
}) {
  const isEdit = !!editing;
  const create = useCreateDesignation();
  const update = useUpdateDesignation();

  const [code, setCode] = useState(editing?.code ?? "");
  const [name, setName] = useState(editing?.name ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");
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
      description: description.trim() || undefined,
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
              {isEdit ? "Edit Designation" : "New Designation"}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-sub)" }}>
              {isEdit ? "Update designation details" : "Add a new designation to the master list"}
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

          {/* Code */}
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--text-muted)" }}>
              Code <span style={{ color: "#dc2626" }}>*</span>
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => { setCode(e.target.value.toUpperCase()); clearFieldError("code"); }}
              placeholder="PSHOP"
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
                Unique identifier · uppercase letters and numbers only
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
              onChange={(e) => { setName(e.target.value); clearFieldError("name"); }}
              placeholder="Paint Shop"
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

          {/* Description */}
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--text-muted)" }}>
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="What this designation does…"
              className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-red-100 resize-none"
              style={{ background: "var(--content-bg)", border: "1px solid var(--border)", color: "var(--text)" }}
            />
          </div>

          {/* Sort Order */}
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--text-muted)" }}>
              Sort Order
            </label>
            <input
              type="number"
              value={sortOrderStr}
              onChange={(e) => { setSortOrderStr(e.target.value); clearFieldError("sortOrder"); }}
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
              <p className="text-xs" style={{ color: "var(--text-sub)" }}>Available for participant assignment</p>
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
              ? isEdit ? "Saving…" : "Creating…"
              : isEdit ? "Save Changes" : "Create Designation"}
          </button>
        </div>
      </div>
    </>
  );
}
