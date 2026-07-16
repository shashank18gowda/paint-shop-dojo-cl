"use client";

import { useRouter } from "next/navigation";
import { useKioskStore, type KioskMode } from "../store/kiosk";
import { QuizDocIcon, PlayIcon, ArrowRight } from "../components/icons";
import { PageShell } from "../components/layout/PageShell";

export default function KioskSetupPage() {
  const router = useRouter();
  const setMode = useKioskStore((s) => s.setMode);

  const choose = (mode: KioskMode) => {
    setMode(mode);
    router.replace("/"); // back to the normal participant entry (WelcomeScreen)
  };

  const cards: { mode: KioskMode; icon: React.ReactNode; title: string; sub: string }[] = [
    { mode: "quiz", icon: <QuizDocIcon />, title: "Quiz Kiosk", sub: "Employees take the training assessment quiz." },
    { mode: "game", icon: <PlayIcon size={22} />, title: "Game Kiosk", sub: "Employees play the Paint Shop process game." },
  ];

  return (
    <PageShell>
      <div className="text-center mb-8 shrink-0 max-w-2xl mx-auto w-full">
        <h1 className="text-3xl font-black tracking-tight">
          <span className="text-[#EB0A1E]">Kiosk</span>
          <span style={{ color: "var(--text)" }}> Setup</span>
        </h1>
        <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
          Choose what this device runs. This is a one-time setup for the kiosk.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto w-full">
        {cards.map(({ mode, icon, title, sub }) => (
          <button
            key={mode}
            onClick={() => choose(mode)}
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)", textAlign: "left" }}
            className="flex flex-col gap-4 rounded-2xl p-6 transition-all hover:border-[#EB0A1E] active:scale-[0.98]"
          >
            <div
              className="flex h-12 w-12 items-center justify-center rounded-xl"
              style={{ background: "rgba(235,10,30,0.12)", color: "#EB0A1E" }}
            >
              {icon}
            </div>
            <div>
              <p className="font-bold text-lg leading-tight" style={{ color: "var(--text)" }}>{title}</p>
              <p className="text-sm mt-1 leading-snug" style={{ color: "var(--text-muted)" }}>{sub}</p>
            </div>
            <span className="flex items-center gap-1 text-sm font-semibold text-[#EB0A1E]">
              Use this mode <ArrowRight size={13} />
            </span>
          </button>
        ))}
      </div>
    </PageShell>
  );
}
