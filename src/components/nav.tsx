"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./logo";

// ── Icônes de navigation (SVG inline, trait = couleur courante) ───────
const iconProps = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const NAV_ICONS: Record<string, React.ReactNode> = {
  "/": (
    <svg {...iconProps}>
      <path d="M3 11l9-8 9 8" />
      <path d="M5 10v10h5v-6h4v6h5V10" />
    </svg>
  ),
  "/planning": (
    <svg {...iconProps}>
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <path d="M3 9h18M8 2v4M16 2v4" />
    </svg>
  ),
  "/menu": (
    <svg {...iconProps}>
      <path d="M6 2v8a2 2 0 0 0 2 2 2 2 0 0 0 2-2V2M8 12v10" />
      <path d="M16 2c-1.5 0-2.5 2-2.5 5s1 5 2.5 5v10" />
    </svg>
  ),
  "/recettes": (
    <svg {...iconProps}>
      <path d="M4 4a2 2 0 0 1 2-2h13v18H6a2 2 0 0 0-2 2z" />
      <path d="M9 6h6M9 9h6" />
    </svg>
  ),
  "/liste": (
    <svg {...iconProps}>
      <path d="M9 4h7a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
      <path d="M9 2h4v3H9zM9 12l2 2 3-4" />
    </svg>
  ),
  "/courses": (
    <svg {...iconProps}>
      <circle cx="9" cy="20" r="1.4" />
      <circle cx="18" cy="20" r="1.4" />
      <path d="M2 3h3l2.4 12a1.5 1.5 0 0 0 1.5 1.2h8.2a1.5 1.5 0 0 0 1.5-1.2L21 7H6" />
    </svg>
  ),
  "/ingredients": (
    <svg {...iconProps}>
      <path d="M12 2c-2 0-4 1.6-4 4 0 1 .3 1.8 1 2.5C7 9.7 6 11.6 6 14c0 4 2.7 7 6 7s6-3 6-7c0-2.4-1-4.3-3-5.5.7-.7 1-1.5 1-2.5 0-2.4-2-4-4-4z" />
      <path d="M12 3v6" />
    </svg>
  ),
  "/inventaire": (
    <svg {...iconProps}>
      <path d="M3 8l9-5 9 5v8l-9 5-9-5z" />
      <path d="M3 8l9 5 9-5M12 13v8" />
    </svg>
  ),
  "/suivi": (
    <svg {...iconProps}>
      <path d="M3 3v18h18" />
      <path d="M7 14l3-4 3 3 5-6" />
    </svg>
  ),
};

function NavIcon({ href, size = 18 }: { href: string; size?: number }) {
  const icon = NAV_ICONS[href] || NAV_ICONS["/"];
  return (
    <span style={{ display: "inline-flex", width: size, height: size }} className="shrink-0">
      {icon}
    </span>
  );
}

// Onglets principaux regroupés. Chaque groupe pointe vers sa page par défaut
// et reste actif sur l'ensemble de ses pages (sous-navigation dans SubNav).
type NavGroup = {
  href: string;
  iconKey: string;
  label: string;
  mLabel: string;
  members: string[];
  exact?: boolean;
};

const groups: NavGroup[] = [
  { href: "/", iconKey: "/", label: "Accueil", mLabel: "Acc.", members: ["/"], exact: true },
  { href: "/planning", iconKey: "/menu", label: "Repas", mLabel: "Repas", members: ["/planning", "/menu", "/recettes"] },
  { href: "/liste", iconKey: "/courses", label: "Courses", mLabel: "Courses", members: ["/liste", "/courses", "/inventaire", "/ingredients"] },
  { href: "/suivi", iconKey: "/suivi", label: "Suivi", mLabel: "Suivi", members: ["/suivi"] },
];

export function Nav() {
  const pathname = usePathname();

  const isActive = (group: NavGroup) =>
    group.exact
      ? pathname === "/"
      : group.members.some((m) => pathname === m || pathname.startsWith(m));

  return (
    <>
      {/* Desktop : top bar éditoriale, 8 liens en pills */}
      <nav
        className="hidden md:block sticky top-0 z-50"
        style={{
          background: "var(--color-cream-pale)",
          borderBottom: "1px solid var(--color-line)",
        }}
      >
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between h-14">
            <Link href="/" className="flex items-center">
              <Logo size={22} />
            </Link>
            <div className="flex gap-1 items-center">
              {groups.map((group) => {
                const active = isActive(group);
                return (
                  <Link
                    key={group.href}
                    href={group.href}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full transition-colors"
                    style={{
                      background: active ? "var(--color-ink)" : "transparent",
                      color: active ? "var(--color-cream-pale)" : "var(--color-ink-soft)",
                    }}
                  >
                    <NavIcon href={group.iconKey} size={15} />
                    {group.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile : bottom tab bar — icônes éditoriales + labels */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50"
        style={{
          background: "var(--color-cream-pale)",
          borderTop: "1px solid var(--color-line)",
          boxShadow: "0 -2px 8px rgba(31,26,20,0.04)",
        }}
      >
        <div className="flex items-center justify-around h-16 px-2 pb-1">
          {groups.map((group) => {
            const active = isActive(group);
            const accent = active ? "var(--color-terracotta)" : "var(--color-ink-mute)";
            return (
              <Link
                key={group.href}
                href={group.href}
                className="flex flex-col items-center justify-center gap-1 px-1 py-1 min-w-0 flex-1"
                style={{ color: accent }}
              >
                <NavIcon href={group.iconKey} size={21} />
                <span
                  className="truncate max-w-full"
                  style={{
                    fontSize: 10,
                    letterSpacing: "0.01em",
                    fontFamily: "var(--font-geist-sans)",
                    fontWeight: 400,
                  }}
                >
                  {group.mLabel}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
