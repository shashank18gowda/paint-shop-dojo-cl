"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useSessionStore } from "../store/session";
import {
  IconDashboard,
  IconUsers,
  IconBook,
  IconGamepad,
  IconBarChart,
  IconAward,
  IconSettings,
  IconLogOut,
  IconBuilding,
  IconLayers,
  IconShield,
  IconGlobe,
  IconTrophy,
} from "./icons";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  soon?: boolean;
};

type NavSection = {
  label: string;
  items: NavItem[];
};

const sections: NavSection[] = [
  {
    label: "MAIN",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: IconDashboard },
      { href: "/participants", label: "Participants", icon: IconUsers },
    ],
  },
  {
    label: "CONTENT",
    items: [
      { href: "/questions", label: "Questions", icon: IconBook },
      // { href: "/game-config", label: "Game Config", icon: IconGamepad },
    ],
  },
  {
    label: "MASTER DATA",
    items: [
      { href: "/designations", label: "Designations", icon: IconBuilding },
      { href: "/plants", label: "Plants", icon: IconBuilding },
      { href: "/lines", label: "Lines", icon: IconLayers },
      {
        href: "/participant-types",
        label: "Participant Types",
        icon: IconShield,
      },
      // { href: "/languages",         label: "Languages",         icon: IconGlobe },
    ],
  },
  {
    label: "ANALYTICS",
    items: [
      { href: "/reports", label: "Reports", icon: IconBarChart },
      { href: "/leaderboard", label: "Leaderboard", icon: IconTrophy },
      { href: "/certificates", label: "Certificates", icon: IconAward },
    ],
  },
  {
    label: "SYSTEM",
    items: [{ href: "/settings", label: "Settings", icon: IconSettings }],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const admin = useSessionStore((s) => s.admin);
  const clearSession = useSessionStore((s) => s.clearSession);

  function handleSignOut() {
    clearSession();
    router.replace("/login");
  }

  const initials = admin
    ? admin.name
        .split(" ")
        .map((p) => p[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "AD";

  return (
    <aside
      className="flex flex-col w-60 shrink-0 h-full"
      style={{
        background: "var(--sidebar-bg)",
        borderRight: "1px solid var(--sidebar-border)",
      }}
    >
      {/* Logo */}
      <div
        className="px-5 py-5 shrink-0"
        style={{ borderBottom: "1px solid var(--sidebar-border)" }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg shrink-0"
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
          </div>
          <div>
            <p className="text-white text-sm font-bold leading-tight">
              <span style={{ color: "#EB0A1E" }}>Paint</span>Shop Dojo
            </p>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
              Admin Console
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {sections.map((section) => (
          <div key={section.label}>
            <p
              className="px-2 mb-1.5 text-[10px] font-semibold tracking-widest"
              style={{ color: "rgba(255,255,255,0.25)" }}
            >
              {section.label}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active =
                  pathname === item.href ||
                  pathname.startsWith(item.href + "/");
                const Icon = item.icon;

                if (item.soon) {
                  return (
                    <li key={item.href}>
                      <span
                        className="flex items-center gap-3 px-2 py-2 rounded-lg cursor-not-allowed select-none"
                        title="Coming soon"
                      >
                        <span
                          className="shrink-0"
                          style={{ color: "rgba(255,255,255,0.18)" }}
                        >
                          <Icon size={16} />
                        </span>
                        <span
                          className="text-sm"
                          style={{ color: "rgba(255,255,255,0.22)" }}
                        >
                          {item.label}
                        </span>
                        <span
                          className="ml-auto text-[9px] font-semibold px-1.5 py-0.5 rounded"
                          style={{
                            background: "rgba(255,255,255,0.06)",
                            color: "rgba(255,255,255,0.25)",
                          }}
                        >
                          SOON
                        </span>
                      </span>
                    </li>
                  );
                }

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="flex items-center gap-3 px-2 py-2 rounded-lg transition-colors relative"
                      style={
                        active
                          ? {
                              background: "rgba(235,10,30,0.12)",
                              color: "#ffffff",
                            }
                          : {
                              color: "rgba(255,255,255,0.5)",
                            }
                      }
                      onMouseEnter={(e) => {
                        if (!active)
                          (
                            e.currentTarget as HTMLAnchorElement
                          ).style.background = "rgba(255,255,255,0.05)";
                      }}
                      onMouseLeave={(e) => {
                        if (!active)
                          (
                            e.currentTarget as HTMLAnchorElement
                          ).style.background = "transparent";
                      }}
                    >
                      {active && (
                        <span
                          className="absolute left-0 top-1 bottom-1 w-0.5 rounded-r-full"
                          style={{ background: "#EB0A1E" }}
                        />
                      )}
                      <Icon size={16} className="shrink-0" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User */}
      <div
        className="px-3 py-4 shrink-0"
        style={{ borderTop: "1px solid var(--sidebar-border)" }}
      >
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg mb-1">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full shrink-0 text-xs font-bold"
            style={{ background: "rgba(235,10,30,0.15)", color: "#EB0A1E" }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {admin?.name ?? "—"}
            </p>
            <p
              className="text-xs truncate"
              style={{ color: "rgba(255,255,255,0.35)" }}
            >
              {admin?.email ?? ""}
            </p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 w-full px-2 py-2 rounded-lg text-sm transition-colors"
          style={{ color: "rgba(255,255,255,0.35)" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "#EB0A1E";
            (e.currentTarget as HTMLButtonElement).style.background =
              "rgba(235,10,30,0.08)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color =
              "rgba(255,255,255,0.35)";
            (e.currentTarget as HTMLButtonElement).style.background =
              "transparent";
          }}
        >
          <IconLogOut size={15} />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
