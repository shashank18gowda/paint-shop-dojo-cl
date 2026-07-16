"use client";

import Link from "next/link";
import {
  IconBarChart, IconUsers, IconBook, IconTrendingUp, IconAward, IconMail, IconClock,
} from "./icons";

type ReportKey = "overview" | "participants" | "questions" | "trends" | "certificates" | "recipients" | "history";

type ReportTab = {
  key: ReportKey;
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  soon?: boolean;
};

const TABS: ReportTab[] = [
  { key: "overview",     label: "Overview",     href: "/reports",              icon: IconBarChart },
  { key: "participants", label: "Participants", href: "/reports/participants", icon: IconUsers },
  // { key: "questions",    label: "Questions",    href: "/reports/questions",    icon: IconBook,        soon: true },
  // { key: "trends",       label: "Trends",       href: "/reports/trends",       icon: IconTrendingUp,  soon: true },
  // { key: "certificates", label: "Certificates", href: "/reports/certificates", icon: IconAward,       soon: true },
  { key: "recipients",   label: "Sharing",      href: "/reports/recipients",   icon: IconMail },
  { key: "history",      label: "History",      href: "/reports/history",      icon: IconClock },
];

export function ReportNav({ active }: { active: ReportKey }) {
  return (
    <div
      className="flex items-center gap-1 p-1 rounded-xl"
      style={{ background: "var(--card)", border: "1px solid var(--border)" }}
    >
      {TABS.map((t) => {
        const isActive = t.key === active;
        const Icon = t.icon;

        if (t.soon) {
          return (
            <span
              key={t.key}
              title="Coming soon"
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium cursor-not-allowed select-none"
              style={{ color: "var(--text-sub)" }}
            >
              <Icon size={14} />
              {t.label}
              <span
                className="text-[9px] font-semibold px-1.5 py-0.5 rounded"
                style={{ background: "var(--content-bg)", color: "var(--text-sub)" }}
              >
                SOON
              </span>
            </span>
          );
        }

        return (
          <Link
            key={t.key}
            href={t.href}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors"
            style={
              isActive
                ? { background: "#EB0A1E", color: "#fff" }
                : { color: "var(--text-muted)" }
            }
            onMouseEnter={(e) => {
              if (!isActive)
                (e.currentTarget as HTMLAnchorElement).style.background = "var(--content-bg)";
            }}
            onMouseLeave={(e) => {
              if (!isActive)
                (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
            }}
          >
            <Icon size={14} />
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
