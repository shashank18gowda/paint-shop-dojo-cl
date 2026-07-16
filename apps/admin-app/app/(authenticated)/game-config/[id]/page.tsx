"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  IconArrowLeft, IconPlus, IconTrash, IconAlertCircle, IconSave,
  IconGrip, IconCheck, IconClock, IconGamepad,
} from "../../../components/icons";

type Step = {
  id: string;
  name: string;
  description: string;
  color: string;
};

const STEP_COLORS = ["#3b82f6", "#a855f7", "#f59e0b", "#16a34a", "#EB0A1E", "#06b6d4", "#ec4899", "#6b7280"];

const SAMPLE_STAGE = {
  code: "PAINT-SEQ",
  name: "Paint Application Sequence",
  description: "Order the basecoat → clearcoat process correctly",
  timeLimit: 90,
  pointsPerStep: 10,
  active: true,
};

const SAMPLE_STEPS: Step[] = [
  { id: "st1", name: "Surface Preparation", description: "Clean and degrease the surface", color: "#3b82f6" },
  { id: "st2", name: "Apply Primer",        description: "Spray uniform primer coat",      color: "#a855f7" },
  { id: "st3", name: "Apply Basecoat",      description: "Color coat application",         color: "#EB0A1E" },
  { id: "st4", name: "Apply Clearcoat",     description: "Protective top layer",            color: "#06b6d4" },
  { id: "st5", name: "Flash Off",           description: "Wait for solvent evaporation",   color: "#f59e0b" },
  { id: "st6", name: "Cure in Oven",        description: "Bake at 140°C for 30 min",       color: "#16a34a" },
];

export default function GameStageEditorPage() {
  const params = useParams();
  const isNew = params?.id === "new";

  const [code,          setCode]          = useState(isNew ? "" : SAMPLE_STAGE.code);
  const [name,          setName]          = useState(isNew ? "" : SAMPLE_STAGE.name);
  const [description,   setDescription]   = useState(isNew ? "" : SAMPLE_STAGE.description);
  const [timeLimit,     setTimeLimit]     = useState(isNew ? 60 : SAMPLE_STAGE.timeLimit);
  const [pointsPerStep, setPointsPerStep] = useState(isNew ? 10 : SAMPLE_STAGE.pointsPerStep);
  const [active,        setActive]        = useState(true);

  const [steps, setSteps] = useState<Step[]>(isNew ? [
    { id: crypto.randomUUID(), name: "", description: "", color: STEP_COLORS[0] },
    { id: crypto.randomUUID(), name: "", description: "", color: STEP_COLORS[1] },
  ] : SAMPLE_STEPS);

  const moveStep = (idx: number, dir: -1 | 1) => {
    const ni = idx + dir;
    if (ni < 0 || ni >= steps.length) return;
    const arr = [...steps];
    [arr[idx], arr[ni]] = [arr[ni], arr[idx]];
    setSteps(arr);
  };
  const addStep = () =>
    setSteps((s) => [...s, { id: crypto.randomUUID(), name: "", description: "", color: STEP_COLORS[s.length % STEP_COLORS.length] }]);
  const removeStep = (id: string) => setSteps((s) => s.filter((x) => x.id !== id));
  const updateStep = (id: string, patch: Partial<Step>) =>
    setSteps((s) => s.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  const issues: string[] = [];
  if (!code.trim()) issues.push("Stage code is required.");
  if (!name.trim()) issues.push("Stage name is required.");
  if (steps.length < 2) issues.push("A stage needs at least 2 steps.");
  if (steps.some((s) => !s.name.trim())) issues.push("All steps need a name.");

  const totalPoints = steps.length * pointsPerStep;

  return (
    <div className="p-8 space-y-6 max-w-7xl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/game-config"
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
            style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
          >
            <IconArrowLeft size={15} />
          </Link>
          <div>
            <div className="flex items-center gap-2 text-sm" style={{ color: "var(--text-muted)" }}>
              <Link href="/game-config" className="hover:underline">Game Stages</Link>
              <span>/</span>
              <span style={{ color: "var(--text)", fontWeight: 600 }}>
                {isNew ? "New Stage" : name || "Stage"}
              </span>
            </div>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-sub)" }}>
              {isNew ? "Create a sequence-based game stage" : "Edit stage configuration and step order"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/game-config" className="px-3.5 py-2 rounded-lg text-sm font-medium" style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
            Cancel
          </Link>
          <button
            disabled={issues.length > 0}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:brightness-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: "#EB0A1E" }}
          >
            <IconSave size={14} />
            Save Stage
          </button>
        </div>
      </div>

      {/* Validation banner */}
      {issues.length > 0 && (
        <div className="flex items-start gap-3 rounded-xl p-4" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.20)" }}>
          <span className="shrink-0 mt-0.5" style={{ color: "#d97706" }}>
            <IconAlertCircle size={18} />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" style={{ color: "#92400e" }}>
              {issues.length} item{issues.length !== 1 ? "s" : ""} need attention before saving
            </p>
            <ul className="mt-1.5 text-xs space-y-0.5 list-disc list-inside" style={{ color: "#92400e" }}>
              {issues.map((m, i) => <li key={i}>{m}</li>)}
            </ul>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-5">

        {/* Left: Form (sequence builder) */}
        <div className="col-span-2 space-y-4">

          {/* Basic info */}
          <div className="rounded-xl p-5 space-y-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <h3 className="text-sm font-semibold" style={{ color: "var(--text)" }}>Stage Information</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--text-muted)" }}>
                  Code <span style={{ color: "#dc2626" }}>*</span>
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="PAINT-SEQ"
                  className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-red-100 font-mono"
                  style={{ background: "var(--content-bg)", border: "1px solid var(--border)", color: "var(--text)" }}
                />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--text-muted)" }}>
                  Name <span style={{ color: "#dc2626" }}>*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Paint Application Sequence"
                  className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-red-100"
                  style={{ background: "var(--content-bg)", border: "1px solid var(--border)", color: "var(--text)" }}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--text-muted)" }}>Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="What participants need to do…"
                className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-red-100"
                style={{ background: "var(--content-bg)", border: "1px solid var(--border)", color: "var(--text)" }}
              />
            </div>
          </div>

          {/* Sequence Builder */}
          <div className="rounded-xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-start justify-between mb-1">
              <div>
                <h3 className="text-sm font-semibold" style={{ color: "var(--text)" }}>Correct Sequence</h3>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-sub)" }}>
                  Order the steps as they should appear. Participants must reproduce this order.
                </p>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0" style={{ background: "var(--content-bg)", color: "var(--text-muted)" }}>
                {steps.length} step{steps.length !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="mt-4 space-y-2">
              {steps.map((step, idx) => (
                <div
                  key={step.id}
                  className="rounded-lg p-3"
                  style={{ background: "var(--content-bg)", border: "1px solid var(--border)" }}
                >
                  <div className="flex items-start gap-3">
                    {/* Drag/order */}
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <span className="cursor-grab" style={{ color: "var(--text-sub)" }} title="Drag to reorder">
                        <IconGrip size={14} />
                      </span>
                      <div
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold text-white shrink-0"
                        style={{ background: step.color }}
                      >
                        {idx + 1}
                      </div>
                    </div>

                    {/* Inputs */}
                    <div className="flex-1 min-w-0 space-y-2">
                      <input
                        type="text"
                        value={step.name}
                        onChange={(e) => updateStep(step.id, { name: e.target.value })}
                        placeholder={`Step ${idx + 1} name`}
                        className="w-full px-2.5 py-1.5 text-sm font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-red-100"
                        style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text)" }}
                      />
                      <input
                        type="text"
                        value={step.description}
                        onChange={(e) => updateStep(step.id, { description: e.target.value })}
                        placeholder="Short description (optional)"
                        className="w-full px-2.5 py-1.5 text-xs rounded-md focus:outline-none focus:ring-2 focus:ring-red-100"
                        style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
                      />
                    </div>

                    {/* Color picker */}
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <div className="grid grid-cols-4 gap-1">
                        {STEP_COLORS.slice(0, 8).map((c) => (
                          <button
                            key={c}
                            onClick={() => updateStep(step.id, { color: c })}
                            className="h-3.5 w-3.5 rounded transition-all"
                            style={{
                              background: c,
                              border: step.color === c ? "1.5px solid var(--text)" : "1.5px solid transparent",
                              transform: step.color === c ? "scale(1.15)" : "scale(1)",
                            }}
                            title={c}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-1 shrink-0">
                      <button
                        onClick={() => moveStep(idx, -1)}
                        disabled={idx === 0}
                        className="flex h-6 w-6 items-center justify-center rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        style={{ color: "var(--text-muted)" }}
                        onMouseEnter={(e) => { if (idx !== 0) (e.currentTarget as HTMLButtonElement).style.background = "var(--card)"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                        title="Move up"
                      >
                        ▲
                      </button>
                      <button
                        onClick={() => moveStep(idx, 1)}
                        disabled={idx === steps.length - 1}
                        className="flex h-6 w-6 items-center justify-center rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        style={{ color: "var(--text-muted)" }}
                        onMouseEnter={(e) => { if (idx !== steps.length - 1) (e.currentTarget as HTMLButtonElement).style.background = "var(--card)"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                        title="Move down"
                      >
                        ▼
                      </button>
                    </div>
                    <button
                      onClick={() => removeStep(step.id)}
                      disabled={steps.length <= 2}
                      className="flex h-7 w-7 items-center justify-center rounded-lg shrink-0 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      style={{ color: "var(--text-sub)" }}
                      onMouseEnter={(e) => {
                        if (steps.length > 2) {
                          (e.currentTarget as HTMLButtonElement).style.background = "rgba(220,38,38,0.06)";
                          (e.currentTarget as HTMLButtonElement).style.color = "#dc2626";
                        }
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                        (e.currentTarget as HTMLButtonElement).style.color = "var(--text-sub)";
                      }}
                    >
                      <IconTrash size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={addStep}
              className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-colors"
              style={{ border: "1.5px dashed var(--border)", color: "var(--text-muted)" }}
            >
              <IconPlus size={14} />
              Add another step
            </button>
          </div>

          {/* Sequence Preview */}
          <div className="rounded-xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold" style={{ color: "var(--text)" }}>Sequence Preview</h3>
              <span className="text-xs" style={{ color: "var(--text-sub)" }}>How participants will see the steps</span>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {steps.map((step, idx) => (
                <div key={step.id} className="flex items-center gap-2 shrink-0">
                  <div
                    className="px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2"
                    style={{
                      background: `${step.color}15`,
                      border: `1px solid ${step.color}40`,
                      color: step.color,
                    }}
                  >
                    <span
                      className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white"
                      style={{ background: step.color }}
                    >
                      {idx + 1}
                    </span>
                    {step.name || `Step ${idx + 1}`}
                  </div>
                  {idx < steps.length - 1 && <span className="text-xs" style={{ color: "var(--text-sub)" }}>→</span>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Settings panel */}
        <div className="col-span-1 space-y-4">

          {/* Scoring */}
          <div className="rounded-xl p-5 space-y-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <h3 className="text-sm font-semibold" style={{ color: "var(--text)" }}>Scoring</h3>

            <div>
              <label className="text-xs font-medium block mb-1.5 flex items-center justify-between" style={{ color: "var(--text-muted)" }}>
                <span>Time Limit</span>
                <span className="font-semibold" style={{ color: "var(--text)" }}>{timeLimit}s</span>
              </label>
              <input
                type="range"
                min={15}
                max={300}
                step={15}
                value={timeLimit}
                onChange={(e) => setTimeLimit(parseInt(e.target.value))}
                className="w-full accent-red-600"
              />
              <div className="flex items-center justify-between text-[10px] mt-1" style={{ color: "var(--text-sub)" }}>
                <span>15s</span>
                <span>5min</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--text-muted)" }}>
                Points per Step
              </label>
              <input
                type="number"
                min={1}
                value={pointsPerStep}
                onChange={(e) => setPointsPerStep(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-red-100"
                style={{ background: "var(--content-bg)", border: "1px solid var(--border)", color: "var(--text)" }}
              />
            </div>

            <div className="rounded-lg p-3 flex items-center justify-between" style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.20)" }}>
              <div>
                <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Max possible score</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-sub)" }}>{steps.length} steps × {pointsPerStep} pts</p>
              </div>
              <p className="text-2xl font-black" style={{ color: "#16a34a" }}>{totalPoints}</p>
            </div>
          </div>

          {/* Active toggle */}
          <div className="rounded-xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text)" }}>Visibility</h3>
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium" style={{ color: "var(--text)" }}>Active</p>
                <p className="text-xs" style={{ color: "var(--text-sub)" }}>Stage is playable on the kiosk</p>
              </div>
              <button
                onClick={() => setActive((v) => !v)}
                className="relative h-6 w-11 rounded-full transition-colors shrink-0"
                style={{ background: active ? "#EB0A1E" : "var(--border)" }}
              >
                <span
                  className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform"
                  style={{ transform: active ? "translateX(20px)" : "translateX(0)" }}
                />
              </button>
            </div>
          </div>

          {/* Helpful info */}
          <div className="rounded-xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center gap-2 mb-3">
              <IconGamepad size={14} className="shrink-0" />
              <h3 className="text-sm font-semibold" style={{ color: "var(--text)" }}>How it works</h3>
            </div>
            <ul className="space-y-2 text-xs" style={{ color: "var(--text-muted)" }}>
              <li className="flex items-start gap-2">
                <IconCheck size={11} className="shrink-0 mt-0.5" />
                <span>Steps are shuffled when shown to participants</span>
              </li>
              <li className="flex items-start gap-2">
                <IconCheck size={11} className="shrink-0 mt-0.5" />
                <span>Each correct step earns {pointsPerStep} points</span>
              </li>
              <li className="flex items-start gap-2">
                <IconClock size={11} className="shrink-0 mt-0.5" />
                <span>{timeLimit}s timer starts when stage begins</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
