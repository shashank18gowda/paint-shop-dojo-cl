"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  IconSearch,
  IconPlus,
  IconMoreVertical,
  IconChevronLeft,
  IconChevronRight,
  IconEye,
  IconEdit,
  IconUserX,
  IconChevronDown,
  IconX,
} from "../../components/icons";
import {
  useParticipants,
  useCreateParticipant,
  useUpdateParticipant,
  useDeleteParticipant,
} from "../../lib/hooks/useParticipants";
import { useDesignations } from "../../lib/hooks/useDesignations";
import { useLines } from "../../lib/hooks/useLines";
import { useParticipantTypes } from "../../lib/hooks/useParticipantTypes";
import type { Participant } from "../../types/master-data.types";
import { usePlants } from "@/app/lib/hooks/usePlants";

const PAGE_LIMIT = 10;

function initials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function validate(
  code: string,
  name: string,
  designationId: string,
  lineId: string,
  participantTypeId: string,
): Record<string, string> {
  const e: Record<string, string> = {};
  if (!code.trim()) e.code = "Employee code is required";
  else if (code.trim().length < 2)
    e.code = "Code must be at least 2 characters";
  if (!name.trim()) e.name = "Name is required";
  if (!designationId) e.designationId = "Designation is required";
  if (!lineId) e.lineId = "Line is required";
  if (!participantTypeId) e.participantTypeId = "Type is required";
  return e;
}

// ─── Filter select ────────────────────────────────────────────────────────────

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

// ─── Action menu ──────────────────────────────────────────────────────────────

function ActionMenu({
  id,
  onEdit,
  onDelete,
}: {
  id: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-7 w-7 items-center justify-center rounded-md transition-colors"
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
        <IconMoreVertical size={15} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 top-8 z-20 w-40 rounded-lg py-1 shadow-lg"
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
            }}
          >
            <Link
              href={`/participants/${id}`}
              className="flex items-center gap-2.5 px-3 py-2 text-sm transition-colors"
              style={{ color: "var(--text)" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.background =
                  "var(--content-bg)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.background =
                  "transparent";
              }}
              onClick={() => setOpen(false)}
            >
              <IconEye size={14} /> View Detail
            </Link>
            <button
              className="flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors"
              style={{ color: "var(--text)" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "var(--content-bg)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "transparent";
              }}
              onClick={() => {
                setOpen(false);
                onEdit();
              }}
            >
              <IconEdit size={14} /> Edit
            </button>
            <div
              style={{
                height: "1px",
                background: "var(--border)",
                margin: "4px 0",
              }}
            />
            <button
              className="flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors"
              style={{ color: "#dc2626" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "rgba(220,38,38,0.06)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "transparent";
              }}
              onClick={() => {
                setOpen(false);
                onDelete();
              }}
            >
              <IconUserX size={14} /> Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Delete confirmation ──────────────────────────────────────────────────────

function DeleteConfirm({
  participant,
  onCancel,
  onConfirm,
  deleting,
  error,
}: {
  participant: Participant;
  onCancel: () => void;
  onConfirm: () => void;
  deleting: boolean;
  error: string;
}) {
  return (
    <>
      <div className="fixed inset-0 z-30 bg-black/40" onClick={onCancel} />
      <div
        className="fixed left-1/2 top-1/2 z-40 -translate-x-1/2 -translate-y-1/2 w-[420px] rounded-xl p-6"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      >
        <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>
          Delete participant?
        </h2>
        <p className="text-sm mt-2" style={{ color: "var(--text-muted)" }}>
          <span className="font-semibold" style={{ color: "var(--text)" }}>
            {participant.name}
          </span>{" "}
          ({participant.code}) will be permanently removed. This cannot be
          undone.
        </p>
        {error && (
          <p
            className="text-xs mt-3 p-3 rounded-lg"
            style={{ background: "rgba(220,38,38,0.06)", color: "#dc2626" }}
          >
            {error}
          </p>
        )}
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
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Participant drawer (create / edit) ───────────────────────────────────────

function ParticipantDrawer({
  editing,
  onClose,
}: {
  editing: Participant | null;
  onClose: () => void;
}) {
  const isEdit = !!editing;
  const create = useCreateParticipant();
  const update = useUpdateParticipant();
  const { data: designations = [] } = useDesignations();
  const { data: lines = [] } = useLines();
  const { data: participantTypes = [] } = useParticipantTypes();
  const { data: plants = [] } = usePlants();
  const [code, setCode] = useState(editing?.code ?? "");
  const [name, setName] = useState(editing?.name ?? "");
  const [designationId, setDesignationId] = useState(
    editing?.designationId ?? "",
  );
  const [lineId, setLineId] = useState(editing?.lineId ?? "");
  const [participantTypeId, setParticipantTypeId] = useState(
    editing?.participantTypeId ?? "",
  );
  const [plantId, setPlantId] = useState(editing?.plantId ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState("");

  const isPending = create.isPending || update.isPending;

  function clearErr(field: string) {
    setErrors((prev) => {
      const n = { ...prev };
      delete n[field];
      return n;
    });
  }

  function handleSubmit() {
    const errs = validate(code, name, designationId, lineId, participantTypeId);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setApiError("");
    const payload = {
      code: code.trim(),
      name: name.trim(),
      designationId,
      lineId,
      participantTypeId,
      plantId,
    };

    function handleError(e: unknown) {
      const msg = (e as Error).message ?? "";
      if (msg.includes("409") || msg.toLowerCase().includes("already exists")) {
        setErrors({ code: "This employee code is already registered" });
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

  const selectStyle = (hasError: boolean) => ({
    background: "var(--content-bg)",
    border: `1px solid ${hasError ? "#dc2626" : "var(--border)"}`,
    color: "var(--text)",
  });

  return (
    <>
      <div className="fixed inset-0 z-30 bg-black/30" onClick={onClose} />
      <div
        className="fixed right-0 top-0 z-40 h-full w-[440px] flex flex-col shadow-2xl"
        style={{ background: "var(--card)" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-5"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div>
            <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>
              {isEdit ? "Edit Participant" : "New Participant"}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-sub)" }}>
              {isEdit
                ? "Update participant details"
                : "Register a new participant"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
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

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
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
            <label
              className="text-xs font-medium block mb-1.5"
              style={{ color: "var(--text-muted)" }}
            >
              Employee Code <span style={{ color: "#dc2626" }}>*</span>
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                clearErr("code");
              }}
              placeholder="TKM-001234"
              className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-red-100 font-mono"
              style={selectStyle(!!errors.code)}
            />
            {errors.code ? (
              <p className="text-xs mt-1" style={{ color: "#dc2626" }}>
                {errors.code}
              </p>
            ) : (
              <p className="text-xs mt-1" style={{ color: "var(--text-sub)" }}>
                Unique employee identifier
              </p>
            )}
          </div>

          {/* Name */}
          <div>
            <label
              className="text-xs font-medium block mb-1.5"
              style={{ color: "var(--text-muted)" }}
            >
              Full Name <span style={{ color: "#dc2626" }}>*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                clearErr("name");
              }}
              placeholder="Rajan Kumar"
              className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-red-100"
              style={selectStyle(!!errors.name)}
            />
            {errors.name && (
              <p className="text-xs mt-1" style={{ color: "#dc2626" }}>
                {errors.name}
              </p>
            )}
          </div>

          {/* Designation */}
          <div>
            <label
              className="text-xs font-medium block mb-1.5"
              style={{ color: "var(--text-muted)" }}
            >
              Designation <span style={{ color: "#dc2626" }}>*</span>
            </label>
            <select
              value={designationId}
              onChange={(e) => {
                setDesignationId(e.target.value);
                clearErr("designationId");
              }}
              className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-red-100 appearance-none"
              style={selectStyle(!!errors.designationId)}
            >
              <option value="">Select designation…</option>
              {designations
                .filter((d) => d.isActive)
                .map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
            </select>
            {errors.designationId && (
              <p className="text-xs mt-1" style={{ color: "#dc2626" }}>
                {errors.designationId}
              </p>
            )}
          </div>

          {/* Line */}
          <div>
            <label
              className="text-xs font-medium block mb-1.5"
              style={{ color: "var(--text-muted)" }}
            >
              Line <span style={{ color: "#dc2626" }}>*</span>
            </label>
            <select
              value={lineId}
              onChange={(e) => {
                setLineId(e.target.value);
                clearErr("lineId");
              }}
              className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-red-100 appearance-none"
              style={selectStyle(!!errors.lineId)}
            >
              <option value="">Select line…</option>
              {lines
                .filter((l) => l.isActive)
                .map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
            </select>
            {errors.lineId && (
              <p className="text-xs mt-1" style={{ color: "#dc2626" }}>
                {errors.lineId}
              </p>
            )}
          </div>

          {/* Type */}
          <div>
            <label
              className="text-xs font-medium block mb-1.5"
              style={{ color: "var(--text-muted)" }}
            >
              Participant Type <span style={{ color: "#dc2626" }}>*</span>
            </label>
            <select
              value={participantTypeId}
              onChange={(e) => {
                setParticipantTypeId(e.target.value);
                clearErr("participantTypeId");
              }}
              className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-red-100 appearance-none"
              style={selectStyle(!!errors.participantTypeId)}
            >
              <option value="">Select type…</option>
              {participantTypes
                .filter((t) => t.isActive)
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
            </select>
            {errors.participantTypeId && (
              <p className="text-xs mt-1" style={{ color: "#dc2626" }}>
                {errors.participantTypeId}
              </p>
            )}
          </div>

          {/* Plant */}
          <div>
            <label
              className="text-xs font-medium block mb-1.5"
              style={{ color: "var(--text-muted)" }}
            >
              Plant <span style={{ color: "#dc2626" }}>*</span>
            </label>
            <select
              value={plantId}
              onChange={(e) => {
                setPlantId(e.target.value);
                clearErr("plantId");
              }}
              className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-red-100 appearance-none"
              style={selectStyle(!!errors.plantId)}
            >
              <option value="">Select plant…</option>
              {plants
                .filter((p) => p.isActive)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
            </select>
            {errors.plantId && (
              <p className="text-xs mt-1" style={{ color: "#dc2626" }}>
                {errors.plantId}
              </p>
            )}
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
                : "Add Participant"}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;

  const pages: (number | "…")[] = [];
  if (totalPages <= 5) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("…");
    for (
      let i = Math.max(2, page - 1);
      i <= Math.min(totalPages - 1, page + 1);
      i++
    )
      pages.push(i);
    if (page < totalPages - 2) pages.push("…");
    pages.push(totalPages);
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        className="flex h-7 w-7 items-center justify-center rounded-md text-xs transition-colors disabled:opacity-40"
        style={{
          color: "var(--text-muted)",
          border: "1px solid var(--border)",
        }}
      >
        <IconChevronLeft size={13} />
      </button>
      {pages.map((p, i) =>
        p === "…" ? (
          <span
            key={`e${i}`}
            className="flex h-7 w-7 items-center justify-center text-xs"
            style={{ color: "var(--text-sub)" }}
          >
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p)}
            className="flex h-7 w-7 items-center justify-center rounded-md text-xs font-medium transition-colors"
            style={
              p === page
                ? { background: "#EB0A1E", color: "#fff" }
                : { color: "var(--text-muted)" }
            }
          >
            {p}
          </button>
        ),
      )}
      <button
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        className="flex h-7 w-7 items-center justify-center rounded-md text-xs transition-colors disabled:opacity-40"
        style={{
          color: "var(--text-muted)",
          border: "1px solid var(--border)",
        }}
      >
        <IconChevronRight size={13} />
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ParticipantsPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [desgId, setDesgId] = useState("");
  const [lineId, setLineId] = useState("");
  const [typeId, setTypeId] = useState("");
  const [plantId, setPlantId] = useState("");
  const [page, setPage] = useState(1);
  const [drawer, setDrawer] = useState<{
    open: boolean;
    editing: Participant | null;
  }>({ open: false, editing: null });
  const [toDelete, setToDelete] = useState<Participant | null>(null);
  const [deleteError, setDeleteError] = useState("");

  const deleteMut = useDeleteParticipant();

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading, isError, error } = useParticipants({
    page,
    limit: PAGE_LIMIT,
    search: debouncedSearch || undefined,
    designationId: desgId || undefined,
    lineId: lineId || undefined,
    participantTypeId: typeId || undefined,
    plantId: plantId || undefined,
  });

  const { data: designations = [] } = useDesignations();
  const { data: lines = [] } = useLines();
  const { data: participantTypes = [] } = useParticipantTypes();
  const { data: plants = [] } = usePlants();
  const participants = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_LIMIT);

  const desgOptions = [
    { label: "All Designations", value: "" },
    ...designations.map((d) => ({ label: d.name, value: d.id })),
  ];
  const lineOptions = [
    { label: "All Lines", value: "" },
    ...lines.map((l) => ({ label: l.name, value: l.id })),
  ];
  const typeOptions = [
    { label: "All Types", value: "" },
    ...participantTypes.map((t) => ({ label: t.name, value: t.id })),
  ];
  const plantOptions = [
    { label: "All Plants", value: "" },
    ...plants.map((p) => ({ label: p.name, value: p.id })),
  ];

  const hasFilters = !!search || !!desgId || !!lineId || !!typeId || !!plantId;

  function clearFilters() {
    setSearch("");
    setDesgId("");
    setLineId("");
    setTypeId("");
    setPlantId("");
    setPage(1);
  }

  function handleDelete() {
    if (!toDelete) return;
    setDeleteError("");
    deleteMut.mutate(toDelete.id, {
      onSuccess: () => setToDelete(null),
      onError: (e) =>
        setDeleteError((e as Error).message || "Failed to delete"),
    });
  }

  return (
    <div className="p-8 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>
            Participants
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
            {isLoading
              ? "Loading…"
              : `${total} participant${total === 1 ? "" : "s"}`}
          </p>
        </div>
        <button
          onClick={() => setDrawer({ open: true, editing: null })}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:brightness-90 active:scale-[0.98]"
          style={{ background: "#EB0A1E" }}
        >
          <IconPlus size={15} />
          Add Participant
        </button>
      </div>

      {/* Error banner */}
      {isError && (
        <div
          className="rounded-xl p-4 flex items-start gap-3"
          style={{
            background: "rgba(220,38,38,0.06)",
            border: "1px solid rgba(220,38,38,0.20)",
          }}
        >
          <span className="text-lg shrink-0">⚠️</span>
          <div>
            <p className="text-sm font-semibold" style={{ color: "#dc2626" }}>
              Failed to load participants
            </p>
            <p
              className="text-xs mt-0.5"
              style={{ color: "var(--text-muted)" }}
            >
              {(error as Error)?.message}
            </p>
          </div>
        </div>
      )}

      {/* Search + Filters */}
      <div
        className="rounded-xl p-4"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-52">
            <span
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: "var(--text-sub)" }}
            >
              <IconSearch size={15} />
            </span>
            <input
              type="text"
              placeholder="Search by name or employee code…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg focus:outline-none"
              style={{
                background: "var(--content-bg)",
                border: "1px solid var(--border)",
                color: "var(--text)",
              }}
            />
          </div>
          <FilterSelect
            value={desgId}
            onChange={(v) => {
              setDesgId(v);
              setPage(1);
            }}
            options={desgOptions}
          />
          <FilterSelect
            value={lineId}
            onChange={(v) => {
              setLineId(v);
              setPage(1);
            }}
            options={lineOptions}
          />
          <FilterSelect
            value={typeId}
            onChange={(v) => {
              setTypeId(v);
              setPage(1);
            }}
            options={typeOptions}
          />
          <FilterSelect
            value={plantId}
            onChange={(v) => {
              setPlantId(v);
              setPage(1);
            }}
            options={plantOptions}
          />
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="text-xs font-medium px-3 py-2 rounded-lg transition-colors"
              style={{ color: "#EB0A1E", background: "rgba(235,10,30,0.06)" }}
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      >
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-12 rounded-lg animate-pulse"
                style={{ background: "var(--content-bg)" }}
              />
            ))}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr
                style={{
                  borderBottom: "1px solid var(--border)",
                  background: "var(--content-bg)",
                }}
              >
                {[
                  "Participant",
                  "Designation",
                  "Line",
                  "Plant",
                  "Type",
                  "Joined",
                  "",
                ].map((col) => (
                  <th
                    key={col}
                    className="px-4 py-3 text-left text-xs font-semibold tracking-wide"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {participants.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-16 text-center text-sm"
                    style={{ color: "var(--text-sub)" }}
                  >
                    {hasFilters
                      ? "No participants match your filters."
                      : "No participants yet."}
                  </td>
                </tr>
              ) : (
                participants.map((p, i) => (
                  <tr
                    key={p.id}
                    style={{
                      borderBottom:
                        i < participants.length - 1
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
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold shrink-0"
                          style={{
                            background: "rgba(235,10,30,0.08)",
                            color: "#EB0A1E",
                          }}
                        >
                          {initials(p.name)}
                        </div>
                        <div>
                          <Link
                            href={`/participants/${p.id}`}
                            className="font-semibold hover:underline"
                            style={{ color: "var(--text)" }}
                          >
                            {p.name}
                          </Link>
                          <p
                            className="text-xs font-mono"
                            style={{ color: "var(--text-sub)" }}
                          >
                            {p.code}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td
                      className="px-4 py-3.5"
                      style={{ color: "var(--text)" }}
                    >
                      {p.designation.name}
                    </td>
                    <td
                      className="px-4 py-3.5"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {p.line.name}
                    </td>
                    <td
                      className="px-4 py-3.5"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {p.plant?.name ? p.plant.name : "-"}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className="text-xs font-medium px-2 py-1 rounded-md"
                        style={{
                          background: "var(--content-bg)",
                          color: "var(--text-muted)",
                        }}
                      >
                        {p.participantType.name}
                      </span>
                    </td>
                    <td
                      className="px-4 py-3.5 text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {new Date(p.enteredAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3.5">
                      <ActionMenu
                        id={p.id}
                        onEdit={() => setDrawer({ open: true, editing: p })}
                        onDelete={() => {
                          setDeleteError("");
                          setToDelete(p);
                        }}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {/* Pagination footer */}
        {!isLoading && total > 0 && (
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{
              borderTop: "1px solid var(--border)",
              background: "var(--content-bg)",
            }}
          >
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Showing {(page - 1) * PAGE_LIMIT + 1}–
              {Math.min(page * PAGE_LIMIT, total)} of {total}
            </p>
            <Pagination
              page={page}
              totalPages={totalPages}
              onChange={setPage}
            />
          </div>
        )}
      </div>

      {/* Create/edit drawer */}
      {drawer.open && (
        <ParticipantDrawer
          editing={drawer.editing}
          onClose={() => setDrawer({ open: false, editing: null })}
        />
      )}

      {/* Delete confirmation */}
      {toDelete && (
        <DeleteConfirm
          participant={toDelete}
          onCancel={() => {
            setToDelete(null);
            setDeleteError("");
          }}
          onConfirm={handleDelete}
          deleting={deleteMut.isPending}
          error={deleteError}
        />
      )}
    </div>
  );
}
