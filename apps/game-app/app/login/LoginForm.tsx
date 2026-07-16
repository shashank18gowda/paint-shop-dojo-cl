"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useLogin } from "../../lib/hooks/useAuth";
import { useSessionStore } from "../../store/session";
import { useFlowStore } from "../../store/flow";
import { useTranslation } from "../../lib/i18n";
import { BadgeIcon, Spinner, ArrowRight } from "../../components/icons";
import { PageShell, PageHeader } from "../../components/layout/PageShell";
import VirtualKeyboard from "../../components/VirtualKeyboard";

export default function LoginForm() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const setPendingCode = useFlowStore((s) => s.setPendingCode);
  const setSession = useSessionStore((s) => s.setSession);
  const clearSession = useSessionStore((s) => s.clearSession);
  const t = useTranslation("login");
  const b = useTranslation("new_here");

  const [code, setCode] = useState("");

  const {
    mutate: login,
    isPending,
    error: mutationError,
    reset: resetLogin,
  } = useLogin();

  const normalizedCode = code.trim().toUpperCase();
  const hasValidCodeShape = /^[A-Z0-9]{1,20}$/.test(normalizedCode);
  // const hasValidCodeShape =
  //   /^[A-Z0-9]{1,20}$/.test(normalizedCode) && /[A-Z]/.test(normalizedCode);
  const showInvalidCode = !!normalizedCode && !hasValidCodeShape;
  const isNotFound =
    mutationError?.message === "HTTP 404" ||
    mutationError?.message === "HTTP 400";
  const errorMsg = showInvalidCode
    ? t.errorFormat
    : mutationError
      ? isNotFound
        ? t.errorInvalid
        : t.errorNetwork
      : "";

  function updateCode(next: string) {
    resetLogin();
    setCode(
      next
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, 20),
    );
  }

  function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!hasValidCodeShape) return;

    login(normalizedCode, {
      onSuccess: (data) => {
        setSession(data.token, data.participant);
        router.push("/confirm");
      },
    });
  }

  function handleRegister() {
    clearSession();
    setPendingCode(code.trim().toUpperCase());
    router.push("/register");
  }

  return (
    <PageShell>
      <PageHeader onBack={() => router.replace("/")} />

      <div className="flex flex-1 flex-col items-center justify-center gap-8 text-center">
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
          }}
          className="flex h-16 w-16 items-center justify-center rounded-2xl"
        >
          <BadgeIcon size={28} />
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold" style={{ color: "var(--text)" }}>
            {t.title}
          </h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {t.subtitle}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="w-full max-w-xl mx-auto flex flex-col gap-4"
        >
          <div className="flex flex-col gap-2 text-left">
            <label
              className="text-sm font-medium"
              style={{ color: "var(--text-sub)" }}
            >
              {t.label}
            </label>
            <input
              ref={inputRef}
              autoFocus
              type="text"
              inputMode="none"
              value={code}
              onChange={(e) => updateCode(e.target.value)}
              placeholder={t.placeholder}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="characters"
              spellCheck={false}
              style={{
                background: "var(--bg-card)",
                border: `2px solid ${errorMsg ? "#EB0A1E" : "var(--border)"}`,
                color: "var(--text)",
                borderRadius: "1rem",
                padding: "1rem 1.25rem",
                fontSize: "1.5rem",
                fontWeight: 700,
                letterSpacing: "0.15em",
                outline: "none",
                width: "100%",
                textAlign: "center",
                transition: "border-color 0.15s",
              }}
              onFocus={(e) => {
                if (!errorMsg) e.target.style.borderColor = "#EB0A1E";
              }}
              onBlur={(e) => {
                if (!errorMsg) e.target.style.borderColor = "var(--border)";
              }}
            />
            {errorMsg && (
              <p className="text-sm text-center" style={{ color: "#EB0A1E" }}>
                {errorMsg}
              </p>
            )}

            <VirtualKeyboard
              layout="alphanum"
              value={code}
              onChange={updateCode}
              maxLength={20}
            />

            {isNotFound && (
              <div
                className="rounded-2xl p-4 flex flex-col gap-3"
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                }}
              >
                <p
                  className="text-sm text-center"
                  style={{ color: "var(--text-muted)" }}
                >
                  {b.title}
                </p>
                <button
                  type="button"
                  onClick={handleRegister}
                  className="w-full flex items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold transition-all active:scale-[0.98]"
                  style={{
                    background: "var(--bg-card-hover)",
                    color: "var(--text)",
                    border: "2px solid var(--border)",
                  }}
                >
                  {b.btn_txt} <ArrowRight size={14} />
                </button>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={!hasValidCodeShape || isPending}
            className="w-full rounded-full py-4 text-base font-semibold text-white transition-all duration-200 active:scale-[0.98]"
            style={{
              background:
                hasValidCodeShape && !isPending
                  ? "#EB0A1E"
                  : "var(--bg-card-hover)",
              color:
                hasValidCodeShape && !isPending
                  ? "#ffffff"
                  : "var(--text-muted)",
              cursor:
                hasValidCodeShape && !isPending ? "pointer" : "not-allowed",
              boxShadow:
                hasValidCodeShape && !isPending
                  ? "0 8px 24px rgba(235,10,30,0.25)"
                  : "none",
            }}
          >
            {isPending ? (
              <span className="flex items-center justify-center gap-2">
                <Spinner size={18} /> Verifying...
              </span>
            ) : (
              t.cta
            )}
          </button>
        </form>
      </div>
    </PageShell>
  );
}
