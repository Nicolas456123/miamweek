"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./logo";

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
                    className="px-3 py-1.5 text-sm rounded-full transition-colors"
                    style={{
                      background: active ? "var(--color-ink)" : "transparent",
                      color: active ? "var(--color-cream-pale)" : "var(--color-ink-soft)",
                    }}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile : bottom tab bar — 5 carrés outline éditoriaux */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50"
        style={{
          background: "var(--color-cream-pale)",
          borderTop: "1px solid var(--color-line)",
          boxShadow: "0 -2px 8px rgba(31,26,20,0.04)",
        }}
      >
        <div className="flex items-center justify-around h-16 px-3 pb-1">
          {mobileLinks.map((link) => {
            const active = isActive(link.href);
            const accent = active ? "var(--color-terracotta)" : "var(--color-ink-mute)";
            return (
              <Link
                key={link.href}
                href={link.href}
                className="flex flex-col items-center justify-center gap-1.5 px-1 py-1 min-w-0"
                style={{ color: accent }}
              >
                <span
                  style={{
                    width: 18,
                    height: 18,
                    border: `1.5px solid ${accent}`,
                    borderRadius: 3,
                    background: "transparent",
                  }}
                />
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
