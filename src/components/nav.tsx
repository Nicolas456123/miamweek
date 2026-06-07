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

const desktopLinks = [
  { href: "/", label: "Accueil" },
  { href: "/planning", label: "Planning" },
  { href: "/menu", label: "Menu" },
  { href: "/recettes", label: "Recettes" },
  { href: "/liste", label: "Liste" },
  { href: "/courses", label: "Courses" },
  { href: "/inventaire", label: "Inventaire" },
  { href: "/suivi", label: "Suivi" },
];

const mobileLinks = [
  { href: "/", label: "Acc." },
  { href: "/planning", label: "Plan." },
  { href: "/menu", label: "Menu" },
  { href: "/liste", label: "Liste" },
  { href: "/courses", label: "Courses" },
  { href: "/inventaire", label: "Stock" },
];

export function Nav() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

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
              {desktopLinks.map((link) => {
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full transition-colors"
                    style={{
                      background: active ? "var(--color-ink)" : "transparent",
                      color: active ? "var(--color-cream-pale)" : "var(--color-ink-soft)",
                    }}
                  >
                    <NavIcon href={link.href} size={15} />
                    {link.label}
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
          {mobileLinks.map((link) => {
            const active = isActive(link.href);
            const accent = active ? "var(--color-terracotta)" : "var(--color-ink-mute)";
            return (
              <Link
                key={link.href}
                href={link.href}
                className="flex flex-col items-center justify-center gap-1 px-1 py-1 min-w-0"
                style={{ color: accent }}
              >
                <NavIcon href={link.href} size={20} />
                <span
                  style={{
                    fontSize: 10,
                    letterSpacing: "0.02em",
                    fontFamily: "var(--font-geist-sans)",
                    fontWeight: 400,
                  }}
                >
                  {link.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
