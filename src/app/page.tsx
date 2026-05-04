"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Logo } from "@/components/logo";
import { getMonday } from "@/lib/utils";

const DAYS_FR = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const MONTHS_FR = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

const PRIMARY_LINKS = [
  { href: "/planning", label: "Planning", desc: "Organiser la semaine" },
  { href: "/recettes", label: "Recettes", desc: "Carnet personnel" },
  { href: "/liste", label: "Liste", desc: "Préparer les courses" },
  { href: "/courses", label: "Mode courses", desc: "En magasin" },
];

const SECONDARY_LINKS = [
  { href: "/menu", label: "Menu" },
  { href: "/inventaire", label: "Inventaire" },
  { href: "/preferences", label: "Goûts" },
  { href: "/suivi", label: "Suivi" },
];

type TodayMeal = { meal_type: string; custom_name: string | null; recipe_id: number | null };

export default function HomePage() {
  const [todayMeals, setTodayMeals] = useState<TodayMeal[]>([]);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const today = new Date();
    setNow(today);
    const dow = today.getDay();
    const dayOfWeek = dow === 0 ? 6 : dow - 1;
    const weekStart = getMonday(today);
    fetch(`/api/meal-plan?weekStart=${weekStart}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setTodayMeals(data.filter((m: TodayMeal & { day_of_week: number }) => m.day_of_week === dayOfWeek));
        }
      })
      .catch(() => {});
  }, []);

  const dayLabel = now ? DAYS_FR[(now.getDay() === 0 ? 6 : now.getDay() - 1)] : "";
  const dateLabel = now ? `${now.getDate()} ${MONTHS_FR[now.getMonth()]}` : "";
  const weekNum = now
    ? Math.ceil(((+now - +new Date(now.getFullYear(), 0, 1)) / 86400000 + 1) / 7)
    : 0;

  const dinnerMeals = todayMeals.filter((m) => m.meal_type === "dinner" || m.meal_type.startsWith("dinner_"));
  const lunchMeals = todayMeals.filter((m) => m.meal_type === "lunch" || m.meal_type.startsWith("lunch_"));

  return (
    <div className="max-w-3xl mx-auto pb-24 md:pb-8">
      {/* Hero éditorial */}
      <header className="pt-6 pb-10 border-b" style={{ borderColor: "var(--color-line)" }}>
        <div className="eyebrow mb-6 flex items-center gap-3">
          <Logo size={16} />
          {now && (
            <>
              <span style={{ color: "var(--color-ink-faint)" }}>·</span>
              <span>Semaine {String(weekNum).padStart(2, "0")} — {dayLabel} {dateLabel}</span>
            </>
          )}
        </div>
        <h1 className="font-display text-5xl md:text-7xl leading-[0.95] tracking-tight" style={{ color: "var(--color-ink)" }}>
          Ce soir,
          <br />
          <span style={{ fontStyle: "italic", color: "var(--color-terracotta)" }}>
            {dinnerMeals.length > 0 ? (dinnerMeals[0].custom_name || "une recette") : "rien de prévu."}
          </span>
        </h1>

        {todayMeals.length > 0 && (
          <Link
            href="/planning?view=today"
            className="mt-6 inline-flex items-center gap-2 text-sm group"
            style={{ color: "var(--color-ink-soft)" }}
          >
            <span>Voir le détail du jour</span>
            <span className="font-mono" style={{ transition: "transform 0.2s" }}>→</span>
          </Link>
        )}
      </header>

      {/* Menu du jour */}
      {todayMeals.length > 0 && (
        <section className="py-8 border-b" style={{ borderColor: "var(--color-line)" }}>
          <div className="eyebrow mb-4">au programme</div>
          <div className="grid grid-cols-2 gap-px" style={{ background: "var(--color-line)" }}>
            <div className="p-5" style={{ background: "var(--color-cream-pale)" }}>
              <p className="eyebrow mb-2">Midi</p>
              {lunchMeals.length > 0 ? (
                lunchMeals.map((m, i) => (
                  <p key={i} className="font-display text-2xl leading-tight" style={{ color: "var(--color-ink)" }}>
                    {m.custom_name || "Recette"}
                  </p>
                ))
              ) : (
                <p className="text-sm" style={{ color: "var(--color-ink-faint)" }}>—</p>
              )}
            </div>
            <div className="p-5" style={{ background: "var(--color-cream-pale)" }}>
              <p className="eyebrow mb-2">Soir</p>
              {dinnerMeals.length > 0 ? (
                dinnerMeals.map((m, i) => (
                  <p key={i} className="font-display text-2xl leading-tight" style={{ color: "var(--color-ink)" }}>
                    {m.custom_name || "Recette"}
                  </p>
                ))
              ) : (
                <p className="text-sm" style={{ color: "var(--color-ink-faint)" }}>—</p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Sections principales */}
      <section className="py-8">
        <div className="eyebrow mb-5">essentiel</div>
        <div className="space-y-px" style={{ background: "var(--color-line)" }}>
          {PRIMARY_LINKS.map((link, i) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-baseline gap-6 py-5 px-1 group hover:px-3 transition-all"
              style={{ background: "var(--color-cream)" }}
            >
              <span
                className="font-mono text-xs tnum"
                style={{ color: "var(--color-ink-faint)", width: 24 }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="flex-1">
                <h3
                  className="font-display text-3xl md:text-4xl leading-tight"
                  style={{ color: "var(--color-ink)" }}
                >
                  {link.label}
                </h3>
                <p className="text-sm mt-1" style={{ color: "var(--color-ink-mute)" }}>
                  {link.desc}
                </p>
              </div>
              <span
                className="font-mono text-sm self-center"
                style={{ color: "var(--color-ink-mute)", transition: "transform 0.2s" }}
              >
                →
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Liens secondaires */}
      <section className="py-8 border-t" style={{ borderColor: "var(--color-line)" }}>
        <div className="eyebrow mb-4">aussi</div>
        <div className="flex flex-wrap gap-2">
          {SECONDARY_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="chip hover:bg-cream-deep"
              style={{ background: "var(--color-cream-pale)" }}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
