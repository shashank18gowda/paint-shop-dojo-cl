"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { useSettingsStore } from "../../store/settings";
import { useFlowStore } from "../../store/flow";
import { useTranslation } from "../../lib/i18n";
import { GearIcon, ArrowRight, SunIcon, MoonIcon } from "../../components/icons";
import type { FontSize } from "../../store/settings";
import type { LangCode } from "../../store/flow";

const LANGS: { code: LangCode; label: string; native: string }[] = [
  { code: "EN", label: "English",  native: "EN"      },
  { code: "KN", label: "ಕನ್ನಡ",   native: "ಕನ್ನಡ"   },
  // { code: "HI", label: "हिंदी",   native: "हिंदी"   },
];

const FONT_SIZE_OPTIONS: { value: FontSize; size: string }[] = [
  { value: "sm", size: "11px" },
  { value: "md", size: "14px" },
  { value: "lg", size: "18px" },
  { value: "xl", size: "23px" },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const { theme, fontSize, setTheme, setFontSize } = useSettingsStore();
  const lang    = useFlowStore((s) => s.lang);
  const setLang = useFlowStore((s) => s.setLang);
  const isDark  = theme === "dark";
  const t = useTranslation("welcome");

  return (
    <div style={{ background: "var(--bg)", color: "var(--text)" }} className="relative flex min-h-screen flex-col">

      <div className="flex flex-1 flex-col items-center justify-center gap-8 px-8 text-center">

        {/* Logo */}
        <div className="relative">
          <div className="flex h-28 w-28 items-center justify-center rounded-[2rem] bg-[#EB0A1E] shadow-2xl shadow-[#EB0A1E]/40">
            <Image
              src="/toyotalogo.png"
              alt="Toyota"
              width={80}
              height={64}
              className="h-16 w-20 object-contain"
              priority
            />
          </div>
          <div style={{ background: "var(--bg)", border: "2px solid var(--border)" }} className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full">
            <span style={{ color: "var(--text-muted)" }}><GearIcon /></span>
          </div>
        </div>

        {/* Title */}
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-5xl font-black tracking-tight leading-none">
            <span className="text-[#EB0A1E]">Paint</span>
            <span style={{ color: "var(--text)" }}>shop Dojo</span>
          </h1>
          <p style={{ color: "var(--text-muted)" }} className="text-base tracking-wide">{t.tagline}</p>
        </div>

        {/* Language selector — prominent, inline, not a separate page */}
        <div className="flex items-center gap-2">
          {LANGS.map((l) => {
            const active = lang === l.code;
            return (
              <button
                key={l.code}
                onClick={() => setLang(l.code)}
                className="rounded-full px-5 py-2 text-sm font-semibold transition-all active:scale-95"
                style={{
                  background:  active ? "#EB0A1E"           : "var(--bg-card)",
                  color:       active ? "#ffffff"            : "var(--text-muted)",
                  border:      `1.5px solid ${active ? "#EB0A1E" : "var(--border)"}`,
                  boxShadow:   active ? "0 4px 12px rgba(235,10,30,0.25)" : "none",
                }}
              >
                {l.native}
              </button>
            );
          })}
        </div>

        {/* Primary CTA — straight to login, no intermediate steps */}
        <button
          onClick={() => router.push("/login")}
          className="flex items-center gap-3 rounded-full bg-[#EB0A1E] px-10 py-4 text-base font-semibold text-white shadow-lg shadow-[#EB0A1E]/30 transition-all hover:bg-[#c4081a] active:scale-95"
        >
          {t.cta}
          <ArrowRight size={18} />
        </button>

        {/* <p style={{ color: "var(--text-muted)" }} className="text-sm">
          {t.help}{" "}
          <span style={{ color: "var(--text)" }} className="font-semibold underline underline-offset-2">
            Contact Paint Quality Built-In & MQE / QCD
          </span>
        </p> */}
      </div>

      {/* Footer — display/accessibility controls only */}
      <footer style={{ borderTop: "1px solid var(--border)" }} className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-1 leading-none">
          {FONT_SIZE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFontSize(opt.value)}
              style={{
                fontSize:  opt.size,
                color:     fontSize === opt.value ? "#EB0A1E" : "var(--text-muted)",
                fontWeight: "bold",
                lineHeight: 1,
                padding:   "0 4px",
                transition: "color 0.15s",
              }}
            >
              A
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setTheme(isDark ? "light" : "dark")}
            style={{ color: "var(--text-muted)", transition: "color 0.15s" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#EB0A1E")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}
          >
            {isDark ? <SunIcon /> : <MoonIcon />}
          </button>

          <div style={{ background: "var(--border)", width: 1, height: 16 }} />

          <span style={{ color: "var(--text-muted)" }} className="flex items-center gap-1.5 text-xs">
            {/* <PhoneIcon /> */}
            Need Help? <span style={{ color: "var(--text)", fontWeight: 600 }}>Contact Paint Quality Built-In & MQE / QCD</span>
          </span>
        </div>
      </footer>
    </div>
  );
}
