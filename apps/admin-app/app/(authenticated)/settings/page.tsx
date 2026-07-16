"use client";

import { useMemo, useState } from "react";
import {
  IconAward, IconSettings, IconBuilding, IconPlus, IconEdit,
  IconTrash, IconHash, IconChevronDown, IconLayers, IconPower,
} from "../../components/icons";
import {
  usePerformanceLevels,
  useCreatePerformanceLevel,
  useUpdatePerformanceLevel,
  useDeletePerformanceLevel,
} from "../../lib/hooks/usePerformanceLevels";

type Tab = "performance" | "kiosks" | "general";

type PerfLevel = {
  id: string;
  code: string;
  name: string;
  minScore: number;
  maxScore: number;
  color: string | null;
};

const defaultNewLevel = {
  code: "",
  name: "",
  minScore: 0,
  maxScore: 100,
  color: "#EB0A1E",
};

type Kiosk = {
  id: string;
  code: string;
  name: string;
  line: string;
  defaultLanguage: string;
  online: boolean;
  lastSeen: string;
};

const KIOSKS: Kiosk[] = [
  { id: "k1", code: "K-PSHOP-01", name: "Paint Shop Kiosk 1",  line: "Line A — Body 1",     defaultLanguage: "English", online: true,  lastSeen: "Just now"   },
  { id: "k2", code: "K-PSHOP-02", name: "Paint Shop Kiosk 2",  line: "Line B — Paint 1",    defaultLanguage: "Hindi",   online: true,  lastSeen: "2m ago"     },
  { id: "k3", code: "K-ASMBLY",   name: "Assembly Kiosk",      line: "Line C — Assembly",   defaultLanguage: "Tamil",   online: true,  lastSeen: "5m ago"     },
  { id: "k4", code: "K-BSHOP",    name: "Body Shop Kiosk",     line: "Line A — Body 1",     defaultLanguage: "English", online: false, lastSeen: "3d ago"     },
  { id: "k5", code: "K-QC",       name: "QC Kiosk",            line: "Line A — Body 1",     defaultLanguage: "English", online: true,  lastSeen: "Just now"   },
];

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>("performance");

  return (
    <div className="p-8 space-y-6 max-w-7xl">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Settings</h1>
        {/* <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
          System configuration · performance bands · kiosk assignments
        </p> */}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 -mb-px" style={{ borderBottom: "1px solid var(--border)" }}>
        {([
          { key: "performance", label: "Performance Levels", icon: IconAward },
          // { key: "kiosks",      label: "Kiosks",              icon: IconLayers },
          // { key: "general",     label: "General",             icon: IconSettings },
        ] as const).map((t) => {
          const Icon = t.icon;
          const isActive = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-colors"
              style={{
                color: isActive ? "var(--text)" : "var(--text-muted)",
                borderBottom: isActive ? "2px solid #EB0A1E" : "2px solid transparent",
              }}
            >
              <Icon size={14} />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "performance" && <PerformanceTab />}
      {tab === "kiosks"      && <KiosksTab />}
      {tab === "general"     && <GeneralTab />}
    </div>
  );
}

/* ─── Performance Levels Tab ─────────────────────────────────── */

function PerformanceTab() {
  const { data, isLoading, isError } = usePerformanceLevels();
  const createPerformanceLevel = useCreatePerformanceLevel();
  const updatePerformanceLevel = useUpdatePerformanceLevel();
  const deletePerformanceLevel = useDeletePerformanceLevel();

  const [isCreating, setIsCreating] = useState(false);
  const [newLevel, setNewLevel] = useState(defaultNewLevel);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValues, setEditingValues] = useState({
    name: "",
    minScore: 0,
    maxScore: 100,
    color: "#6b7280",
  });

  const sortedLevels = useMemo(() => {
    return [...(data ?? [])].sort((a, b) => a.minScore - b.minScore);
  }, [data]);

  const busy =
    createPerformanceLevel.status === "pending" ||
    updatePerformanceLevel.status === "pending" ||
    deletePerformanceLevel.status === "pending";

  const handleCreateSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    createPerformanceLevel.mutate(
      {
        ...newLevel,
        code: newLevel.code.trim().toUpperCase(),
      },
      {
        onSuccess: () => {
          setNewLevel(defaultNewLevel);
          setIsCreating(false);
        },
      },
    );
  };

  const handleStartEditing = (level: PerfLevel) => {
    setEditingId(level.id);
    setEditingValues({
      name: level.name,
      minScore: level.minScore,
      maxScore: level.maxScore,
      color: level.color ?? '#6b7280',
    });
  };

  const handleUpdateSubmit = (id: string) => {
    updatePerformanceLevel.mutate(
      {
        id,
        input: {
          name: editingValues.name,
          minScore: editingValues.minScore,
          maxScore: editingValues.maxScore,
          color: editingValues.color,
        },
      },
      {
        onSuccess: () => setEditingId(null),
      },
    );
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('Delete this performance band?')) {
      return;
    }

    deletePerformanceLevel.mutate(id);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold" style={{ color: "var(--text)" }}>Performance Bands</h2>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-sub)" }}>
            Score ranges that determine the performance label and certificate appearance
          </p>
        </div>
        <button
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:brightness-90 active:scale-[0.98]"
          style={{ background: "#EB0A1E" }}
          onClick={() => setIsCreating((prev) => !prev)}
          disabled={busy}
        >
          <IconPlus size={14} />
          {isCreating ? 'Cancel' : 'Add Level'}
        </button>
      </div>

      {isCreating && (
        <form onSubmit={handleCreateSubmit} className="rounded-xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1 text-xs text-left">
              <span>Code</span>
              <input
                value={newLevel.code}
                onChange={(event) => setNewLevel((prev) => ({ ...prev, code: event.target.value }))}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                placeholder="EXPERT"
                required
              />
            </label>
            <label className="space-y-1 text-xs text-left">
              <span>Name</span>
              <input
                value={newLevel.name}
                onChange={(event) => setNewLevel((prev) => ({ ...prev, name: event.target.value }))}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                placeholder="Expert"
                required
              />
            </label>
            <label className="space-y-1 text-xs text-left">
              <span>Minimum score</span>
              <input
                type="number"
                value={newLevel.minScore}
                onChange={(event) => setNewLevel((prev) => ({ ...prev, minScore: Number(event.target.value) }))}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                min={0}
                max={100}
                required
              />
            </label>
            <label className="space-y-1 text-xs text-left">
              <span>Maximum score</span>
              <input
                type="number"
                value={newLevel.maxScore}
                onChange={(event) => setNewLevel((prev) => ({ ...prev, maxScore: Number(event.target.value) }))}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                min={0}
                max={100}
                required
              />
            </label>
            <label className="space-y-1 text-xs text-left md:col-span-2">
              <span>Color</span>
              <input
                type="color"
                value={newLevel.color}
                onChange={(event) => setNewLevel((prev) => ({ ...prev, color: event.target.value }))}
                className="h-11 w-full rounded-lg border p-1"
              />
            </label>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-lg bg-[#EB0A1E] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-90"
              disabled={busy}
            >
              Save level
            </button>
            {createPerformanceLevel.error && (
              <span className="text-sm text-[#dc2626]">{String(createPerformanceLevel.error)}</span>
            )}
          </div>
        </form>
      )}

      <div className="rounded-xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <p className="text-xs font-semibold mb-3 uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Score Distribution Preview</p>
        <div className="flex h-12 rounded-lg overflow-hidden" style={{ border: "1px solid var(--border)" }}>
          {sortedLevels.length > 0 ? sortedLevels.map((p) => (
            <div
              key={p.id}
              className="relative flex items-center justify-center transition-all"
              style={{
                width: `${p.maxScore - p.minScore + 1}%`,
                background: `${p.color ?? '#6b7280'}20`,
                borderRight: "1px solid var(--border)",
              }}
            >
              <span className="text-xs font-semibold" style={{ color: p.color ?? '#6b7280' }}>{p.name}</span>
            </div>
          )) : (
            <div className="flex flex-1 items-center justify-center text-xs text-[var(--text-muted)]">
              No performance bands configured
            </div>
          )}
        </div>
        <div className="flex items-center justify-between mt-1.5 text-[10px] font-mono" style={{ color: "var(--text-sub)" }}>
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--content-bg)" }}>
              <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide" style={{ color: "var(--text-muted)" }}>Level</th>
              <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide" style={{ color: "var(--text-muted)" }}>Code</th>
              <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide" style={{ color: "var(--text-muted)" }}>Score Range</th>
              <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide" style={{ color: "var(--text-muted)" }}>Color</th>
              {/* <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide" style={{ color: "var(--text-muted)" }}>Attempts</th> */}
              <th className="w-24 px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-sm text-[var(--text-muted)]">Loading performance levels…</td>
              </tr>
            ) : isError ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-sm text-[#dc2626]">Unable to load performance levels</td>
              </tr>
            ) : sortedLevels.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-sm text-[var(--text-muted)]">No performance levels available</td>
              </tr>
            ) : sortedLevels.map((level, index) => {
              const isEditing = editingId === level.id;
              return (
                <tr
                  key={level.id}
                  style={{ borderBottom: index < sortedLevels.length - 1 ? "1px solid var(--border)" : "none" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "var(--content-bg)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "transparent"; }}
                >
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg shrink-0" style={{ background: `${level.color ?? '#6b7280'}18`, color: level.color ?? '#6b7280' }}>
                        <IconAward size={15} />
                      </div>
                      {isEditing ? (
                        <input
                          value={editingValues.name}
                          onChange={(event) => setEditingValues((prev) => ({ ...prev, name: event.target.value }))}
                          className="w-full rounded-lg border px-3 py-2 text-sm"
                        />
                      ) : (
                        <span className="font-semibold" style={{ color: "var(--text)" }}>{level.name}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded inline-flex items-center gap-1" style={{ background: "var(--content-bg)", color: "var(--text-muted)" }}>
                      <IconHash size={9} />{level.code}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    {isEditing ? (
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={editingValues.minScore}
                          onChange={(event) => setEditingValues((prev) => ({ ...prev, minScore: Number(event.target.value) }))}
                          className="w-20 rounded-lg border px-3 py-2 text-sm"
                          min={0}
                          max={100}
                        />
                        <span className="text-xs font-semibold font-mono" style={{ color: "var(--text)" }}>–</span>
                        <input
                          type="number"
                          value={editingValues.maxScore}
                          onChange={(event) => setEditingValues((prev) => ({ ...prev, maxScore: Number(event.target.value) }))}
                          className="w-20 rounded-lg border px-3 py-2 text-sm"
                          min={0}
                          max={100}
                        />
                      </div>
                    ) : (
                      <span className="text-xs font-semibold font-mono" style={{ color: "var(--text)" }}>
                        {level.minScore}% – {level.maxScore}%
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    {isEditing ? (
                      <input
                        type="color"
                        value={editingValues.color}
                        onChange={(event) => setEditingValues((prev) => ({ ...prev, color: event.target.value }))}
                        className="h-11 w-full rounded-lg border p-1"
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded shrink-0" style={{ background: level.color ?? '#6b7280' }} />
                        <span className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>{(level.color ?? '#6b7280').toUpperCase()}</span>
                      </div>
                    )}
                  </td>
                  {/* <td className="px-4 py-3.5 text-xs" style={{ color: "var(--text-muted)" }}>
                    <span className="font-semibold" style={{ color: "var(--text)" }}>—</span>
                  </td> */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      {isEditing ? (
                        <>
                          <button
                            className="rounded-md px-3 py-2 text-xs font-semibold transition-colors"
                            style={{ color: "var(--text)" }}
                            onClick={() => handleUpdateSubmit(level.id)}
                            disabled={busy}
                          >
                            Save
                          </button>
                          <button
                            className="rounded-md px-3 py-2 text-xs font-semibold transition-colors"
                            style={{ color: "var(--text-muted)" }}
                            onClick={() => setEditingId(null)}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="flex h-7 w-7 items-center justify-center rounded-md transition-colors"
                            style={{ color: "var(--text-muted)" }}
                            onClick={() => handleStartEditing(level)}
                          >
                            <IconEdit size={14} />
                          </button>
                          <button
                            className="flex h-7 w-7 items-center justify-center rounded-md transition-colors"
                            style={{ color: "var(--text-muted)" }}
                            onClick={() => handleDelete(level.id)}
                          >
                            <IconTrash size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── Kiosks Tab ────────────────────────────────────────────── */

function KiosksTab() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold" style={{ color: "var(--text)" }}>Kiosk Devices</h2>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-sub)" }}>
            Map each kiosk device to a production line and default language
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full" style={{ background: "rgba(34,197,94,0.10)", color: "#16a34a" }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#16a34a" }} />
            {KIOSKS.filter((k) => k.online).length} of {KIOSKS.length} online
          </span>
          <button
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:brightness-90 active:scale-[0.98]"
            style={{ background: "#EB0A1E" }}
          >
            <IconPlus size={14} />
            Register Kiosk
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {KIOSKS.map((k) => (
          <div
            key={k.id}
            className="rounded-xl p-4 transition-all"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            <div className="flex items-start gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-lg shrink-0"
                style={{
                  background: k.online ? "rgba(34,197,94,0.10)" : "rgba(107,114,128,0.10)",
                  color: k.online ? "#16a34a" : "#6b7280",
                }}
              >
                <IconLayers size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: "var(--content-bg)", color: "var(--text-muted)" }}>
                    {k.code}
                  </span>
                  <span
                    className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded"
                    style={{
                      background: k.online ? "rgba(34,197,94,0.10)" : "rgba(107,114,128,0.10)",
                      color: k.online ? "#16a34a" : "#6b7280",
                    }}
                  >
                    {k.online && <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#16a34a" }} />}
                    {k.online ? "ONLINE" : "OFFLINE"}
                  </span>
                </div>
                <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{k.name}</p>
                <div className="mt-2 space-y-1 text-xs" style={{ color: "var(--text-muted)" }}>
                  <div className="flex items-center justify-between">
                    <span>Line</span>
                    <span className="font-medium" style={{ color: "var(--text)" }}>{k.line}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Default Language</span>
                    <span className="font-medium" style={{ color: "var(--text)" }}>{k.defaultLanguage}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Last Seen</span>
                    <span style={{ color: "var(--text-sub)" }}>{k.lastSeen}</span>
                  </div>
                </div>
              </div>
              <button
                className="flex h-7 w-7 items-center justify-center rounded-md shrink-0 transition-colors"
                style={{ color: "var(--text-muted)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--content-bg)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                title="Configure"
              >
                <IconEdit size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── General Tab ──────────────────────────────────────────── */

function GeneralTab() {
  const [orgName,        setOrgName]        = useState("Toyota Kirloskar Motor");
  const [passingScore,   setPassingScore]   = useState(70);
  const [sessionTimeout, setSessionTimeout] = useState(15);
  const [idleTimeout,    setIdleTimeout]    = useState(60);
  const [defaultLang,    setDefaultLang]    = useState("English");
  const [retakeWindow,   setRetakeWindow]   = useState(7);
  const [emailReports,   setEmailReports]   = useState(true);
  const [kioskNotif,     setKioskNotif]     = useState(false);
  const [autoCertGen,    setAutoCertGen]    = useState(true);

  return (
    <div className="grid grid-cols-3 gap-5">

      <div className="col-span-2 space-y-4">

        {/* Organization */}
        <Card title="Organization" icon={<IconBuilding size={14} />}>
          <Field label="Organization Name">
            <input
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-red-100"
              style={{ background: "var(--content-bg)", border: "1px solid var(--border)", color: "var(--text)" }}
            />
          </Field>
          <Field label="Default Language">
            <Select value={defaultLang} onChange={setDefaultLang} options={["English", "Hindi", "Tamil", "Telugu", "Kannada"]} />
          </Field>
        </Card>

        {/* Quiz Rules */}
        <Card title="Quiz Rules" icon={<IconAward size={14} />}>
          <Field label="Passing Score" sub={`Participants need ≥${passingScore}% to pass`}>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={40} max={95} step={5}
                value={passingScore}
                onChange={(e) => setPassingScore(parseInt(e.target.value))}
                className="flex-1 accent-red-600"
              />
              <span className="text-sm font-bold w-12 text-right" style={{ color: "var(--text)" }}>{passingScore}%</span>
            </div>
          </Field>
          <Field label="Retake Cooldown" sub="Days a participant must wait between attempts">
            <div className="flex items-center gap-2">
              <input
                type="number" min={0} max={30}
                value={retakeWindow}
                onChange={(e) => setRetakeWindow(parseInt(e.target.value) || 0)}
                className="w-24 px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-red-100"
                style={{ background: "var(--content-bg)", border: "1px solid var(--border)", color: "var(--text)" }}
              />
              <span className="text-sm" style={{ color: "var(--text-muted)" }}>days</span>
            </div>
          </Field>
          <Toggle label="Auto-generate Certificates" sub="Issue a certificate immediately on pass" checked={autoCertGen} onChange={() => setAutoCertGen((v) => !v)} />
        </Card>

        {/* Session */}
        <Card title="Session & Idle" icon={<IconPower size={14} />}>
          <Field label="Session Timeout" sub="Auto-submit if quiz inactive">
            <div className="flex items-center gap-2">
              <input
                type="number" min={1} max={60}
                value={sessionTimeout}
                onChange={(e) => setSessionTimeout(parseInt(e.target.value) || 1)}
                className="w-24 px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-red-100"
                style={{ background: "var(--content-bg)", border: "1px solid var(--border)", color: "var(--text)" }}
              />
              <span className="text-sm" style={{ color: "var(--text-muted)" }}>minutes</span>
            </div>
          </Field>
          <Field label="Idle Logout" sub="Auto-logout from kiosk after no activity">
            <div className="flex items-center gap-2">
              <input
                type="number" min={10} max={300}
                value={idleTimeout}
                onChange={(e) => setIdleTimeout(parseInt(e.target.value) || 10)}
                className="w-24 px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-red-100"
                style={{ background: "var(--content-bg)", border: "1px solid var(--border)", color: "var(--text)" }}
              />
              <span className="text-sm" style={{ color: "var(--text-muted)" }}>seconds</span>
            </div>
          </Field>
        </Card>

        {/* Notifications */}
        <Card title="Notifications" icon={<IconSettings size={14} />}>
          <Toggle label="Daily Email Reports" sub="Send activity summary to admin email each morning" checked={emailReports} onChange={() => setEmailReports((v) => !v)} />
          <Toggle label="Kiosk Offline Alerts" sub="Notify when a kiosk goes offline for &gt; 10 minutes" checked={kioskNotif} onChange={() => setKioskNotif((v) => !v)} />
        </Card>

        {/* Save */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <button className="px-4 py-2 rounded-lg text-sm font-medium" style={{ color: "var(--text-muted)" }}>
            Reset to Defaults
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:brightness-90"
            style={{ background: "#EB0A1E" }}
          >
            Save Settings
          </button>
        </div>
      </div>

      {/* Side: System info */}
      <div className="col-span-1 space-y-4">
        <div className="rounded-xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <h3 className="text-xs font-semibold mb-3 uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>System Info</h3>
          <div className="space-y-3 text-xs">
            <Row label="Version"><span className="font-mono" style={{ color: "var(--text)" }}>v1.0.0-beta</span></Row>
            <Row label="Environment"><span className="font-semibold" style={{ color: "var(--text)" }}>Production</span></Row>
            <Row label="Database"><span className="font-mono" style={{ color: "var(--text)" }}>PostgreSQL 15.4</span></Row>
            <Row label="Last Backup"><span style={{ color: "var(--text-muted)" }}>4 hrs ago</span></Row>
            <Row label="Storage"><span style={{ color: "var(--text-muted)" }}>2.1 / 50 GB</span></Row>
          </div>
        </div>

        <div className="rounded-xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <h3 className="text-xs font-semibold mb-3 uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Maintenance</h3>
          <div className="space-y-2">
            <button className="w-full px-3 py-2 rounded-lg text-sm font-medium text-left transition-colors" style={{ background: "var(--content-bg)", color: "var(--text)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--border)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--content-bg)"; }}
            >
              Run Backup Now
            </button>
            <button className="w-full px-3 py-2 rounded-lg text-sm font-medium text-left transition-colors" style={{ background: "var(--content-bg)", color: "var(--text)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--border)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--content-bg)"; }}
            >
              Clear Cache
            </button>
            <button className="w-full px-3 py-2 rounded-lg text-sm font-medium text-left transition-colors" style={{ background: "rgba(220,38,38,0.06)", color: "#dc2626", border: "1px solid rgba(220,38,38,0.15)" }}>
              Restart Services
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Card({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-xl p-5 space-y-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="text-sm font-semibold" style={{ color: "var(--text)" }}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Field({ label, sub, children }: { label: string; sub?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--text-muted)" }}>{label}</label>
      {children}
      {sub && <p className="text-xs mt-1" style={{ color: "var(--text-sub)" }} dangerouslySetInnerHTML={{ __html: sub }} />}
    </div>
  );
}

function Toggle({ label, sub, checked, onChange }: { label: string; sub: string; checked: boolean; onChange: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{label}</p>
        <p className="text-xs" style={{ color: "var(--text-sub)" }} dangerouslySetInnerHTML={{ __html: sub }} />
      </div>
      <button
        onClick={onChange}
        className="relative h-6 w-11 rounded-full transition-colors shrink-0"
        style={{ background: checked ? "#EB0A1E" : "var(--border)" }}
      >
        <span
          className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform"
          style={{ transform: checked ? "translateX(20px)" : "translateX(0)" }}
        />
      </button>
    </div>
  );
}

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none pl-3 pr-9 py-2 text-sm rounded-lg cursor-pointer focus:outline-none"
        style={{ background: "var(--content-bg)", border: "1px solid var(--border)", color: "var(--text)" }}
      >
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-sub)" }}>
        <IconChevronDown size={13} />
      </span>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span style={{ color: "var(--text-muted)" }}>{label}</span>
      {children}
    </div>
  );
}
