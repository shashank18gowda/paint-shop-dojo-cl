"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSessionStore } from "../store/session";
import { adminLogin } from "../lib/api/auth.api";
import Image from "next/image";

export default function AdminLoginPage() {
  const router = useRouter();
  const setSession = useSessionStore((s) => s.setSession);
  const existingToken = useSessionStore((s) => s.token);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch — read persisted state only after mount.
  useEffect(() => {
    setMounted(true);
  }, []);

  // If already logged in, bounce to dashboard.
  useEffect(() => {
    if (mounted && existingToken) router.replace("/dashboard");
  }, [mounted, existingToken, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setError("");
    setSubmitting(true);
    try {
      const res = await adminLogin({
        email: email.trim().toLowerCase(),
        password,
      });
      setSession(res.token, res.admin);
      router.replace("/dashboard");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Login failed";
      setError(
        msg.includes("401") || msg.toLowerCase().includes("invalid")
          ? "Invalid email or password"
          : msg,
      );
      setSubmitting(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "var(--content-bg)" }}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-8 shadow-lg"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      >
        {/* Brand */}
        <div className="flex items-center gap-2.5 mb-6">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg shrink-0"
            style={{ background: "#EB0A1E" }}
          >
            <Image
              src="/toyotalogo.png"
              alt="Toyota"
              width={24}
              height={20}
              className="h-5 w-6 object-contain"
              priority
            />
            {/* <span className="text-white text-sm font-black tracking-tight">PD</span> */}
          </div>
          <div>
            <p
              className="text-sm font-bold leading-tight"
              style={{ color: "var(--text)" }}
            >
              <span style={{ color: "#EB0A1E" }}>Paint</span>Shop Dojo
            </p>
            <p className="text-xs" style={{ color: "var(--text-sub)" }}>
              Admin Console
            </p>
          </div>
        </div>

        <h1 className="text-xl font-bold mb-1" style={{ color: "var(--text)" }}>
          Sign in
        </h1>
        <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
          Use your admin account to manage the platform.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              className="text-xs font-medium block mb-1.5"
              style={{ color: "var(--text-muted)" }}
            >
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              autoFocus
              placeholder="admin@tkm.co.in"
              className="w-full px-3 py-2.5 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-red-100"
              style={{
                background: "var(--content-bg)",
                border: "1px solid var(--border)",
                color: "var(--text)",
              }}
            />
          </div>

          <div>
            <label
              className="text-xs font-medium block mb-1.5"
              style={{ color: "var(--text-muted)" }}
            >
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              placeholder="••••••••"
              className="w-full px-3 py-2.5 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-red-100"
              style={{
                background: "var(--content-bg)",
                border: "1px solid var(--border)",
                color: "var(--text)",
              }}
            />
          </div>

          {error && (
            <div
              className="rounded-lg px-3 py-2 text-xs font-medium"
              style={{
                background: "rgba(220,38,38,0.06)",
                border: "1px solid rgba(220,38,38,0.20)",
                color: "#dc2626",
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !email.trim() || !password}
            className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:brightness-90 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ background: "#EB0A1E" }}
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
