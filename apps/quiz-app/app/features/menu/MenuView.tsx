"use client";

import { useRouter } from "next/navigation";
import { useKioskStore } from "../../store/kiosk";
import { useTranslation } from "../../lib/i18n";
import { QuizDocIcon, PlayIcon, CertIcon, TrophyIcon, HistoryIcon, PersonIcon, ArrowRight } from "../../components/icons";
import { PageShell, PageHeader } from "../../components/layout/PageShell";

export default function MenuView() {
  const router = useRouter();
  const t = useTranslation("menu");

  const isGame = useKioskStore((s) => s.mode) === "game";

  const handleStart = () => {
    router.push(isGame ? "/game" : "/quiz");
  };

  return (
    <PageShell>
      <PageHeader />
      <div className="text-center mb-8 shrink-0 max-w-3xl mx-auto w-full">
        <h1 className="text-4xl font-black tracking-tight leading-none">
          <span className="text-[#EB0A1E]">Paint</span>
          <span style={{ color: "var(--text)" }}>shop Dojo</span>
        </h1>
        <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>{t.tagline}</p>
      </div>

      <div
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
        className="rounded-2xl p-7 text-center mb-4 shrink-0 max-w-3xl mx-auto w-full"
      >
        <div
          className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl"
          style={{ background: "rgba(235,10,30,0.12)", color: "#EB0A1E" }}
        >
          {isGame ? <PlayIcon size={22} /> : <QuizDocIcon />}
        </div>
        <h2 className="text-xl font-bold mb-1" style={{ color: "var(--text)" }}>{isGame ? t.game : t.quiz}</h2>
        <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>{isGame ? t.gameSub : t.quizSub}</p>
        <button
          onClick={handleStart}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#EB0A1E] py-3.5 text-base font-semibold text-white transition-all hover:bg-[#c4081a] active:scale-[0.98] shadow-lg shadow-[#EB0A1E]/20"
        >
          {isGame ? t.gameCta : t.quizCta} <ArrowRight />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 max-w-3xl mx-auto w-full">
        {[
          { icon: <CertIcon size={18} />,    title: t.certificates, sub: t.certSub,    cta: t.certCta,    href: "/certificates" },
          { icon: <TrophyIcon />,             title: t.leaderboard,  sub: t.lbSub,      cta: t.lbCta,      href: "/leaderboard"  },
          { icon: <HistoryIcon />,            title: t.attempts,     sub: t.attSub,     cta: t.attCta,     href: "/attempts"     },
          { icon: <PersonIcon size={18} />,   title: t.profile,      sub: t.profileSub, cta: t.profileCta, href: "/profile"      },
        ].map(({ icon, title, sub, cta, href }) => (
          <button
            key={href}
            onClick={() => router.push(href)}
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)", textAlign: "left" }}
            className="flex flex-col gap-3 rounded-2xl p-4 transition-all hover:border-[#3a3a3a] active:scale-[0.98]"
          >
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ background: "var(--bg-card-hover)", color: "var(--text-muted)" }}
            >
              {icon}
            </div>
            <div>
              <p className="font-bold text-sm leading-tight" style={{ color: "var(--text)" }}>{title}</p>
              <p className="text-xs mt-1 leading-snug" style={{ color: "var(--text-muted)" }}>{sub}</p>
            </div>
            <span className="flex items-center gap-1 text-xs font-semibold text-[#EB0A1E]">
              {cta} <ArrowRight size={11} />
            </span>
          </button>
        ))}
      </div>

    </PageShell>
  );
}
