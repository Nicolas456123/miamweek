"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type SubItem = { href: string; label: string; match?: string[] };
type SubGroup = { match: string[]; items: SubItem[] };

const SUBGROUPS: SubGroup[] = [
  {
    match: ["/planning", "/menu", "/recettes"],
    items: [
      { href: "/planning", label: "Planning" },
      { href: "/menu", label: "Menu" },
      { href: "/recettes", label: "Recettes" },
    ],
  },
  {
    match: ["/liste", "/courses", "/inventaire", "/ingredients"],
    items: [
      { href: "/liste", label: "Liste" },
      { href: "/courses", label: "Courses" },
      { href: "/inventaire", label: "Stock", match: ["/inventaire", "/ingredients"] },
    ],
  },
];

export function SubNav() {
  const pathname = usePathname();
  const group = SUBGROUPS.find((g) => g.match.some((m) => pathname === m || pathname.startsWith(m)));
  if (!group) return null;

  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-5 -mt-1">
      {group.items.map((item) => {
        const active = (item.match || [item.href]).some(
          (m) => pathname === m || pathname.startsWith(m)
        );
        return (
          <Link
            key={item.href}
            href={item.href}
            className="shrink-0 rounded-full px-4 py-1.5 text-sm transition-colors whitespace-nowrap"
            style={{
              background: active ? "var(--color-ink)" : "var(--color-cream-pale)",
              color: active ? "var(--color-cream-pale)" : "var(--color-ink-soft)",
              border: "1px solid",
              borderColor: active ? "var(--color-ink)" : "var(--color-line)",
            }}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
