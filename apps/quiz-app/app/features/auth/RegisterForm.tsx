"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  useDesignations,
  useLines,
  useParticipantTypes,
  usePlants,
} from "../../lib/hooks/useReference";
import { useFlowStore } from "../../store/flow";
import { useSessionStore } from "../../store/session";
import { useTranslation } from "../../lib/i18n";
import { useRegister } from "../../lib/hooks/useAuth";
import { CheckIcon, Spinner } from "../../components/icons";
import { PageShell, PageHeader } from "../../components/layout/PageShell";
import VirtualKeyboard from "../../components/VirtualKeyboard";

export default function RegisterForm() {
  const router = useRouter();
  const t = useTranslation("register");

  const pendingCode = useFlowStore((s) => s.pendingCode);
  const setPendingCode = useFlowStore((s) => s.setPendingCode);
  const setSession = useSessionStore((s) => s.setSession);
  const participant = useSessionStore((s) => s.participant);

  const {
    data: designations = [],
    isPending: desgLoading,
    isError: desgError,
  } = useDesignations();
  const {
    data: lines = [],
    isPending: lineLoading,
    isError: lineError,
  } = useLines();
  const { data: types = [], isPending: typeLoading } = useParticipantTypes();
  const {
    data: plants = [],
    isPending: plantLoading,
    isError: plantError,
  } = usePlants();

  const {
    mutate: registerMutate,
    isPending: registering,
    error: registerError,
  } = useRegister();

  const [name, setName] = useState("");
  const [typeId, setTypeId] = useState("");
  const [desgId, setDesgId] = useState("");
  const [lineId, setLineId] = useState("");
  const [plantId, setPlantId] = useState("");
  const [mounted, setMounted] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);

  useEffect(() => {
    queueMicrotask(() => setMounted(true));
  }, []);

  useEffect(() => {
    if (mounted && !pendingCode && !participant) router.replace("/login");
  }, [mounted, pendingCode, participant, router]);

  if (!mounted || (!pendingCode && !participant)) return null;

  const selectedTypeId = typeId || types[0]?.id || "";
  const selectedDesgId = desgId || designations[0]?.id || "";
  const selectedLineId = lineId || lines[0]?.id || "";
  const selectedPlantId = plantId || plants[0]?.id || "";
  const normalizedName = name.trim().replace(/\s+/g, " ");
  const hasValidName =
    /^[A-Za-z]+(?: [A-Za-z]+)*$/.test(normalizedName) &&
    normalizedName.length >= 2;
  const canSubmit =
    hasValidName &&
    !!selectedTypeId &&
    !!selectedDesgId &&
    !!selectedLineId &&
    !!selectedPlantId;

  const registerErrorMsg = registerError
    ? registerError.message === "HTTP 409"
      ? t.errorDuplicate
      : t.errorNetwork
    : "";

  function handleSubmit() {
    if (!canSubmit || !pendingCode) return;
    registerMutate(
      {
        name: normalizedName,
        employeeCode: pendingCode,
        participantTypeId: selectedTypeId,
        designationId: selectedDesgId,
        lineId: selectedLineId,
        plantId: selectedPlantId,
      },
      {
        onSuccess: (data) => {
          setSession(data.token, data.participant);
          setPendingCode(null);
          router.push("/photo");
        },
      },
    );
  }

  return (
    <PageShell>
      <PageHeader onBack={() => router.replace("/login")} />

      <div className="flex flex-1 flex-col gap-7 max-w-xl mx-auto w-full">
        {/* Header */}
        <div className="text-center pt-2">
          <div
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full text-2xl font-black text-white"
            style={{
              background: "#EB0A1E",
              boxShadow: "0 8px 24px rgba(235,10,30,0.3)",
            }}
          >
            {pendingCode?.charAt(0)}
          </div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>
            {t.title}
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            {t.subtitle}
          </p>
          <span
            className="inline-block mt-2 rounded-full px-3 py-1 text-xs font-semibold font-mono"
            style={{ background: "rgba(235,10,30,0.12)", color: "#EB0A1E" }}
          >
            {pendingCode}
          </span>
        </div>

        {/* ── Name ── */}
        <Section label={t.nameLbl}>
          <input
            autoFocus
            type="text"
            inputMode="none"
            value={name}
            onChange={(e) =>
              setName(e.target.value.replace(/[^A-Za-z\s]/g, ""))
            }
            placeholder={t.namePlaceholder}
            autoComplete="off"
            className="w-full rounded-xl px-4 py-3 text-base font-semibold outline-none"
            style={{
              background: "var(--bg-card)",
              border: `2px solid ${hasValidName ? "#EB0A1E" : "var(--border)"}`,
              color: "var(--text)",
              transition: "border-color 0.15s",
            }}
            onFocus={(e) => {
              setNameFocused(true);
              if (!hasValidName) e.target.style.borderColor = "#EB0A1E";
            }}
            onBlur={(e) => {
              setNameFocused(false);
              if (!hasValidName) e.target.style.borderColor = "var(--border)";
            }}
          />
          {nameFocused && (
            <VirtualKeyboard
              layout="alpha"
              value={name}
              onChange={(next) => setName(next.replace(/[^A-Za-z\s]/g, ""))}
              maxLength={64}
            />
          )}
        </Section>

        {/* ── Who are you? ── */}
        <Section label={t.wru}>
          {typeLoading ? (
            <div className="flex gap-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex-1 h-12 rounded-xl animate-pulse"
                  style={{ background: "var(--bg-card)" }}
                />
              ))}
            </div>
          ) : (
            <div className="flex gap-2">
              {types.map((tp) => {
                const active = selectedTypeId === tp.id;
                return (
                  <button
                    key={tp.id}
                    onClick={() => setTypeId(tp.id)}
                    className="flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all active:scale-95"
                    style={{
                      border: `2px solid ${active ? "#EB0A1E" : "var(--border)"}`,
                      background: active
                        ? "rgba(235,10,30,0.10)"
                        : "var(--bg-card)",
                      color: active ? "#EB0A1E" : "var(--text-muted)",
                    }}
                  >
                    {tp.name}
                  </button>
                );
              })}
            </div>
          )}
        </Section>

        {/* ── Designation ── */}
        <Section label={t.desgLbl}>
          {desgLoading && (
            <div
              className="h-32 rounded-xl animate-pulse"
              style={{ background: "var(--bg-card)" }}
            />
          )}
          {desgError && (
            <p className="text-sm" style={{ color: "#f59e0b" }}>
              Failed to load designations.
            </p>
          )}
          <div className="flex flex-col gap-2 max-h-44 overflow-y-auto pr-1">
            {designations.map((desg) => {
              const active = selectedDesgId === desg.id;
              return (
                <button
                  key={desg.id}
                  onClick={() => setDesgId(desg.id)}
                  className="flex items-center gap-3 rounded-xl px-4 py-3 transition-all"
                  style={{
                    border: `2px solid ${active ? "#EB0A1E" : "var(--border)"}`,
                    background: active
                      ? "rgba(235,10,30,0.08)"
                      : "var(--bg-card)",
                    textAlign: "left",
                  }}
                >
                  <div
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ background: active ? "#EB0A1E" : "var(--border)" }}
                  />
                  <span
                    className="text-sm font-medium flex-1"
                    style={{ color: "var(--text)" }}
                  >
                    {desg.name}
                  </span>
                  {active && (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#EB0A1E]">
                      <CheckIcon size={10} stroke="white" strokeWidth={3.5} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </Section>

        {/* ── Today's Line ── */}
        <Section label={t.prd_line}>
          {lineLoading && (
            <div
              className="h-24 rounded-xl animate-pulse"
              style={{ background: "var(--bg-card)" }}
            />
          )}
          {lineError && (
            <p className="text-sm" style={{ color: "#f59e0b" }}>
              Failed to load lines.
            </p>
          )}
          <div className="flex flex-col gap-2 max-h-36 overflow-y-auto pr-1">
            {lines.map((line) => {
              const active = selectedLineId === line.id;
              return (
                <button
                  key={line.id}
                  onClick={() => setLineId(line.id)}
                  className="flex items-center gap-3 rounded-xl px-4 py-3 transition-all"
                  style={{
                    border: `2px solid ${active ? "#EB0A1E" : "var(--border)"}`,
                    background: active
                      ? "rgba(235,10,30,0.08)"
                      : "var(--bg-card)",
                    textAlign: "left",
                  }}
                >
                  <div
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ background: active ? "#EB0A1E" : "var(--border)" }}
                  />
                  <span
                    className="text-sm font-medium flex-1"
                    style={{ color: "var(--text)" }}
                  >
                    {line.name}
                  </span>
                  {active && (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#EB0A1E]">
                      <CheckIcon size={10} stroke="white" strokeWidth={3.5} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </Section>

        {/* ── Plant ── */}
        <Section label={t.mfd_plant}>
          {plantLoading && (
            <div
              className="h-24 rounded-xl animate-pulse"
              style={{ background: "var(--bg-card)" }}
            />
          )}
          {plantError && (
            <p className="text-sm" style={{ color: "#f59e0b" }}>
              Failed to load plants.
            </p>
          )}
          <div className="flex flex-col gap-2 max-h-36 overflow-y-auto pr-1">
            {plants.map((plant) => {
              const active = selectedPlantId === plant.id;
              return (
                <button
                  key={plant.id}
                  onClick={() => setPlantId(plant.id)}
                  className="flex items-center gap-3 rounded-xl px-4 py-3 transition-all"
                  style={{
                    border: `2px solid ${active ? "#EB0A1E" : "var(--border)"}`,
                    background: active
                      ? "rgba(235,10,30,0.08)"
                      : "var(--bg-card)",
                    textAlign: "left",
                  }}
                >
                  <div
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ background: active ? "#EB0A1E" : "var(--border)" }}
                  />
                  <div className="flex-1">
                    <span
                      className="text-sm font-medium block"
                      style={{ color: "var(--text)" }}
                    >
                      {plant.name}
                    </span>
                    {/* {plant.location && <span className="text-xs" style={{ color: "var(--text-muted)" }}>{plant.location}</span>} */}
                  </div>
                  {active && (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#EB0A1E]">
                      <CheckIcon size={10} stroke="white" strokeWidth={3.5} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </Section>
      </div>

      {/* Submit */}
      <div className="mt-8 w-full max-w-xl mx-auto flex flex-col gap-3">
        {registerErrorMsg && (
          <p
            className="text-sm text-center rounded-xl px-4 py-2"
            style={{ color: "#EB0A1E", background: "rgba(235,10,30,0.08)" }}
          >
            {registerErrorMsg}
          </p>
        )}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit || registering}
          className="w-full rounded-full py-4 text-base font-semibold text-white transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          style={{
            background:
              canSubmit && !registering ? "#EB0A1E" : "var(--bg-card-hover)",
            color: canSubmit && !registering ? "#ffffff" : "var(--text-muted)",
            boxShadow:
              canSubmit && !registering
                ? "0 8px 24px rgba(235,10,30,0.25)"
                : "none",
            cursor: canSubmit && !registering ? "pointer" : "not-allowed",
          }}
        >
          {registering ? (
            <>
              <Spinner size={18} /> {t.createing_ac}
            </>
          ) : (
            t.create_ac
          )}
        </button>
      </div>
    </PageShell>
  );
}

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <p
        className="text-xs font-semibold uppercase tracking-widest"
        style={{ color: "var(--text-muted)" }}
      >
        {label}
      </p>
      {children}
    </div>
  );
}
