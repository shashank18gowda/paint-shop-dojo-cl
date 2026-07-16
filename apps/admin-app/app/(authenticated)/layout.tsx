"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "../components/Sidebar";
import { useSessionStore } from "../store/session";

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const token = useSessionStore((s) => s.token);
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch — only read persisted state after mount.
  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (mounted && !token) router.replace("/login");
  }, [mounted, token, router]);

  // Until we know whether the user is authed, render nothing — prevents the
  // dashboard from briefly flashing for unauthenticated visitors.
  if (!mounted || !token) return null;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-auto" style={{ background: "var(--content-bg)" }}>
        {children}
      </main>
    </div>
  );
}
