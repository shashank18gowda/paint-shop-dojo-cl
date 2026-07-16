"use client";

import { useState } from "react";
import {
  IconPlus, IconSearch, IconEdit, IconTrash,
  IconHash, IconX,
} from "../../components/icons";
import {
  usePlants,
  useCreatePlant,
  useUpdatePlant,
  useDeletePlant,
} from "../../lib/hooks/usePlants";
import type { Plant } from "../../types/master-data.types";

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

export default function PlantsPage() {
  const { data: items = [], isLoading, isError, error } = usePlants();
  const createMut = useCreatePlant();
  const updateMut = useUpdatePlant();
  const deleteMut = useDeletePlant();

  const [search, setSearch] = useState("");
  const [drawer, setDrawer] = useState<{ open: boolean; editing: Plant | null }>({
    open: false,
    editing: null,
  });
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const filtered = items.filter(
    (p) =>
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      p.location?.toLowerCase().includes(search.toLowerCase()),
  );

  function toggleActive(plant: Plant) {
    updateMut.mutate({ id: plant.id, input: { isActive: !plant.isActive } });
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
          <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Plants</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
            {isLoading
              ? "Loading…"
              : `${items.length} plants · ${items.filter((p) => p.isActive).length} active`}
          </p>
        </div>
        <button
          onClick={() => setDrawer({ open: true, editing: null })}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:brightness-90 active:scale-[0.98]"
          style={{ background: "#EB0A1E" }}
        >
          <IconPlus size={15} />
          Add Plant
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
            <p className="text-sm font-semibold" style={{ color: "#dc2626" }}>Failed to load plants</p>
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
            placeholder="Search by name, code, or location…"
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
              {search ? "No plants match your search" : "No plants yet"}
            </p>
            {!search && (
              <button
                onClick={() => setDrawer({ open: true, editing: null })}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white"
                style={{ background: "#EB0A1E" }}
              >
                <IconPlus size={14} /> Add Plant
              </button>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--content-bg)" }}>
                <th className="w-28 px-4 py-3 text-left text-xs font-semibold tracking-wide" style={{ color: "var(--text-muted)" }}>Code</th>
                <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide" style={{ color: "var(--text-muted)" }}>Name & Location</th>
                <th className="w-20 px-4 py-3 text-left text-xs font-semibold tracking-wide" style={{ color: "var(--text-muted)" }}>Order</th>
                <th className="w-24 px-4 py-3 text-left text-xs font-semibold tracking-wide" style={{ color: "var(--text-muted)" }}>Status</th>
                <th className="w-24 px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => {
                const isDeleting = deleteMut.isPending && deleteMut.variables === p.id;
                return (
                  <tr
                    key={p.id}
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
                        {p.code}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-sm" style={{ color: "var(--text)" }}>{p.name}</p>
                      {p.location && (
                        <p className="text-xs mt-0.5 line-clamp-1" style={{ color: "var(--text-sub)" }}>
                          📍 {p.location}
                        </p>
                      )}
                      {p.description && (
                        <p className="text-xs mt-0.5 line-clamp-1" style={{ color: "var(--text-sub)" }}>
                          {p.description}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {p.sortOrder ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <button
                        onClick={() => toggleActive(p)}
                        disabled={updateMut.isPending}
                        className="relative h-5 w-9 rounded-full transition-colors disabled:opacity-50"
                        style={{ background: p.isActive ? "#16a34a" : "var(--border)" }}
                        title={p.isActive ? "Deactivate" : "Activate"}
                      >
                        <span
                          className="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform"
                          style={{ transform: p.isActive ? "translateX(16px)" : "translateX(0)" }}
                        />
                      </button>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setDrawer({ open: true, editing: p })}
                          className="flex h-7 w-7 items-center justify-center rounded-md transition-colors"
                          style={{ color: "var(--text-muted)" }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--content-bg)"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                          title="Edit"
                        >
                          <IconEdit size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          disabled={isDeleting}
                          className="flex h-7 items-center justify-center gap-1 px-1.5 rounded-md text-xs font-medium transition-colors disabled:opacity-50"
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
                          title={pendingDelete === p.id ? "Click again to confirm" : "Delete"}
                        >
                          <IconTrash size={13} />
                          {pendingDelete === p.id && (
                            <span>{isDeleting ? "…" : "Confirm"}</span>
                          )}
                        </button>
                        {pendingDelete === p.id && !isDeleting && (
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
        <PlantDrawer
          item={drawer.editing}
          onClose={() => setDrawer({ open: false, editing: null })}
          createMut={createMut}
          updateMut={updateMut}
        />
      )}
    </div>
  );
}

interface PlantDrawerProps {
  item: Plant | null;
  onClose: () => void;
  createMut: any;
  updateMut: any;
}

function PlantDrawer({ item, onClose, createMut, updateMut }: PlantDrawerProps) {
  const [code, setCode] = useState(item?.code ?? "");
  const [name, setName] = useState(item?.name ?? "");
  const [location, setLocation] = useState(item?.location ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [sortOrderStr, setSortOrderStr] = useState((item?.sortOrder ?? "").toString());
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isLoading = createMut.isPending || updateMut.isPending;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errors = validate(code, name, sortOrderStr);
    if (Object.keys(errors).length > 0) {
      setErrors(errors);
      return;
    }

    const input = {
      code: code.trim(),
      name: name.trim(),
      location: location.trim() || undefined,
      description: description.trim() || undefined,
      sortOrder: sortOrderStr ? Number(sortOrderStr) : undefined,
    };

    if (item) {
      updateMut.mutate({ id: item.id, input }, { onSuccess: onClose });
    } else {
      createMut.mutate(input, { onSuccess: onClose });
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onClick={onClose}
      style={{ background: "rgba(0,0,0,0.5)" }}
    >
      <div
        className="w-full sm:w-96 rounded-t-2xl sm:rounded-2xl p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
        style={{ background: "var(--card)" }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold" style={{ color: "var(--text)" }}>
            {item ? "Edit Plant" : "New Plant"}
          </h2>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ color: "var(--text-sub)" }}>
            <IconX size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Code */}
          <div>
            <label className="text-xs font-semibold block mb-1.5" style={{ color: "var(--text-muted)" }}>
              Code <span style={{ color: "#dc2626" }}>*</span>
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                if (errors.code) setErrors({ ...errors, code: "" });
              }}
              placeholder="PLANT_001"
              className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none"
              style={{
                background: "var(--content-bg)",
                border: `1px solid ${errors.code ? "#dc2626" : "var(--border)"}`,
                color: "var(--text)",
              }}
            />
            {errors.code && <p className="text-xs mt-1" style={{ color: "#dc2626" }}>{errors.code}</p>}
          </div>

          {/* Name */}
          <div>
            <label className="text-xs font-semibold block mb-1.5" style={{ color: "var(--text-muted)" }}>
              Name <span style={{ color: "#dc2626" }}>*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors({ ...errors, name: "" });
              }}
              placeholder="Main Manufacturing Plant"
              className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none"
              style={{
                background: "var(--content-bg)",
                border: `1px solid ${errors.name ? "#dc2626" : "var(--border)"}`,
                color: "var(--text)",
              }}
            />
            {errors.name && <p className="text-xs mt-1" style={{ color: "#dc2626" }}>{errors.name}</p>}
          </div>

          {/* Location */}
          <div>
            <label className="text-xs font-semibold block mb-1.5" style={{ color: "var(--text-muted)" }}>
              Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Bangalore, India"
              className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none"
              style={{
                background: "var(--content-bg)",
                border: "1px solid var(--border)",
                color: "var(--text)",
              }}
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold block mb-1.5" style={{ color: "var(--text-muted)" }}>
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Primary paint shop facility with all production lines"
              rows={3}
              className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none resize-none"
              style={{
                background: "var(--content-bg)",
                border: "1px solid var(--border)",
                color: "var(--text)",
              }}
            />
          </div>

          {/* Sort Order */}
          <div>
            <label className="text-xs font-semibold block mb-1.5" style={{ color: "var(--text-muted)" }}>
              Display Order
            </label>
            <input
              type="number"
              value={sortOrderStr}
              onChange={(e) => {
                setSortOrderStr(e.target.value);
                if (errors.sortOrder) setErrors({ ...errors, sortOrder: "" });
              }}
              placeholder="1"
              min="0"
              className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none"
              style={{
                background: "var(--content-bg)",
                border: `1px solid ${errors.sortOrder ? "#dc2626" : "var(--border)"}`,
                color: "var(--text)",
              }}
            />
            {errors.sortOrder && <p className="text-xs mt-1" style={{ color: "#dc2626" }}>{errors.sortOrder}</p>}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
              style={{ background: "var(--content-bg)", color: "var(--text)" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 text-sm font-semibold rounded-lg text-white transition-all disabled:opacity-50"
              style={{ background: "#EB0A1E" }}
            >
              {isLoading ? "Saving…" : item ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
