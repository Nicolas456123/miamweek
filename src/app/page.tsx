"use client";

import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { Logo } from "@/components/logo";
import { getMonday } from "@/lib/utils";

const DAYS_FR_SHORT = ["L", "M", "M", "J", "V", "S", "D"];
const DAYS_FR_3 = ["LUN", "MAR", "MER", "JEU", "VEN", "SAM", "DIM"];
const MONTHS_FR = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

type MealEntry = {
  meal_type: string;
  custom_name: string | null;
  recipe_id: number | null;
  day_of_week: number;
  recipeName?: string;
  recipeCategory?: string;
};

type Recipe = {
  id: number;
  name: string;
  category: string | null;
  prep_time: number | null;
  cook_time: number | null;
  servings: number;
};

type ListItem = {
  id: number;
  product_name: string;
  quantity: number | null;
  unit: string | null;
  category: string | null;
  source_recipe?: string | null;
};

const PLACEHOLDER_TONES = ["terra", "olive", "mustard", "neutral"] as const;

export default function HomePage() {
  const [now, setNow] = useState<Date | null>(null);
  const [meals, setMeals] = useState<MealEntry[]>([]);
  const [recipes, setRecipes] = useState<Record<number, Recipe>>({});
  const [listItems, setListItems] = useState<ListItem[]>([]);

  useEffect(() => {
    const today = new Date();
    setNow(today);
    const weekStart = getMonday(today);
    fetch(`/api/meal-plan?weekStart=${weekStart}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setMeals(data);
      })
      .catch(() => {});
    fetch("/api/recipes")
      .then((r) => r.json())
      .then((data: Recipe[]) => {
        if (Array.isArray(data)) {
          const map: Record<number, Recipe> = {};
          for (const r of data) map[r.id] = r;
          setRecipes(map);
        }
      })
      .catch(() => {});
    fetch("/api/list?status=prep")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setListItems(data);
      })
      .catch(() => {});
  }, []);

  const todayDayOfWeek = useMemo(() => {
    if (!now) return 0;
    const d = now.getDay();
    return d === 0 ? 6 : d - 1;
  }, [now]);

  const todayMeals = useMemo(
    () => meals.filter((m) => m.day_of_week === todayDayOfWeek),
    [meals, todayDayOfWeek]
  );
  const dinnerMeal = todayMeals.find((m) => m.meal_type.startsWith("dinner")) || null;

  // Build the recipe used for tonight (if any) — fetched from recipes map
  const tonightRecipe = useMemo<Recipe | null>(() => {
    if (!dinnerMeal?.recipe_id) return null;
    return recipes[dinnerMeal.recipe_id] || null;
  }, [dinnerMeal, recipes]);

  const tonightTitle = dinnerMeal?.custom_name || tonightRecipe?.name || null;

  // Week days (Mon → Sun) with their numeric day
  const weekDays = useMemo(() => {
    if (!now) return [];
    const monday = new Date(now);
    const dow = monday.getDay();
    const diff = monday.getDate() - dow + (dow === 0 ? -6 : 1);
    monday.setDate(diff);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return { date: d.getDate(), dayOfWeek: i, full: d };
    });
  }, [now]);

  // Upcoming meals (today + next days) — compact list of next ~5
  const upcoming = useMemo(() => {
    const ordered = [...meals]
      .filter((m) => m.day_of_week >= todayDayOfWeek)
      .sort((a, b) => {
        if (a.day_of_week !== b.day_of_week) return a.day_of_week - b.day_of_week;
        // dinner before lunch is wrong — lunch (midi) first then dinner (soir)
        return a.meal_type.localeCompare(b.meal_type);
      });
    return ordered.slice(0, 5);
  }, [meals, todayDayOfWeek]);

  const dayLabel = useMemo(() => {
    if (!now) return "";
    return DAYS_FR_3[todayDayOfWeek];
  }, [now, todayDayOfWeek]);

  const dateLabel = useMemo(() => {
    if (!now) return "";
    return `${now.getDate()} ${MONTHS_FR[now.getMonth()]}`;
  }, [now]);

  const totalEstimated = useMemo(() => {
    return listItems.reduce((acc, item) => {
      const q = item.quantity ?? 1;
      // No real prices — heuristic for placeholder
      return acc + q * 1.8;
    }, 0);
  }, [listItems]);

  const totalIngredients = listItems.length;
  const totalRecipesPlanned = useMemo(
    () => meals.filter((m) => m.recipe_id).length,
    [meals]
  );

  return (
    <div className="pb-24 md:pb-8">
      {/* Greeting eyebrow */}
      <div className="eyebrow mb-6 flex items-center gap-3">
        <span>bonsoir nicolas</span>
        {now && (
          <>
            <span style={{ color: "var(--color-ink-faint)" }}>·</span>
            <span>{dayLabel} {dateLabel}</span>
          </>
        )}
      </div>

      {/* HERO — large editorial */}
      <header className="pb-10 mb-10 border-b" style={{ borderColor: "var(--color-line)" }}>
        <h1
          className="font-display tracking-tight"
          style={{
            color: "var(--color-ink)",
            fontSize: "clamp(48px, 7.5vw, 112px)",
            lineHeight: 0.95,
            letterSpacing: "-0.02em",
          }}
        >
          Ce soir,
          <br />
          <span style={{ fontStyle: "italic", color: "var(--color-terracotta)" }}>
            {tonightTitle ? tonightTitle.toLowerCase() : "rien de prévu."}
          </span>
        </h1>

        {tonightTitle && (
          <div className="mt-6 flex flex-wrap items-center gap-4 text-sm">
            {tonightRecipe && (
              <span
                className="font-mono text-[11px] tracking-wider uppercase rounded-full px-3 py-1.5"
                style={{
                  background: "rgba(200,85,61,0.12)",
                  color: "var(--color-terracotta-deep)",
                  border: "1px solid rgba(200,85,61,0.25)",
                  letterSpacing: "0.08em",
                }}
              >
                Recette · {(tonightRecipe.prep_time || 0) + (tonightRecipe.cook_time || 0)} min · {tonightRecipe.servings} pers.
              </span>
            )}
            {tonightRecipe && (
              <Link
                href={`/recettes`}
                className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors hover:bg-[var(--color-cream-deep)]"
                style={{
                  borderColor: "var(--color-line)",
                  color: "var(--color-ink-soft)",
                  background: "var(--color-cream-pale)",
                }}
              >
                Voir la recette
                <span className="font-mono">→</span>
              </Link>
            )}
            <Link
              href="/planning"
              className="text-sm hover:underline"
              style={{ color: "var(--color-ink-mute)" }}
            >
              Changer pour ce soir
            </Link>
          </div>
        )}
      </header>

      {/* 3 columns : LA SEMAINE / LISTE PRÊTE / SUGGESTION */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-px" style={{ background: "var(--color-line)" }}>
        {/* 01 — LA SEMAINE */}
        <section className="p-6" style={{ background: "var(--color-cream)" }}>
          <p className="eyebrow mb-5">
            <span style={{ color: "var(--color-ink-faint)" }}>01 · </span>
            la semaine
          </p>
          <div className="grid grid-cols-7 gap-1 mb-6">
            {weekDays.map((d) => {
              const active = d.dayOfWeek === todayDayOfWeek;
              return (
                <Link
                  key={d.dayOfWeek}
                  href="/planning"
                  className="flex flex-col items-center gap-1 py-2 rounded transition-colors"
                  style={{
                    background: active ? "var(--color-terracotta)" : "transparent",
                    color: active ? "var(--color-cream-pale)" : "var(--color-ink-soft)",
                  }}
                >
                  <span className="font-mono text-[10px]" style={{ letterSpacing: "0.05em", opacity: 0.6 }}>
                    {DAYS_FR_SHORT[d.dayOfWeek]}
                  </span>
                  <span className="font-display text-xl tnum leading-none">{d.date}</span>
                </Link>
              );
            })}
          </div>
          <ul className="space-y-3">
            {upcoming.length === 0 && (
              <li className="text-sm" style={{ color: "var(--color-ink-faint)" }}>
                Pas encore de repas planifiés.
              </li>
            )}
            {upcoming.map((m, i) => {
              const recipe = m.recipe_id ? recipes[m.recipe_id] : null;
              const name = m.custom_name || recipe?.name || "Repas libre";
              const period = m.meal_type.startsWith("lunch") ? "midi" : "soir";
              const dayShort = DAYS_FR_3[m.day_of_week];
              const tag = recipe ? "RECETTE" : "MENU";
              return (
                <li key={i} className="flex items-baseline justify-between gap-3 pb-2 border-b" style={{ borderColor: "var(--color-line-soft)" }}>
                  <div className="min-w-0">
                    <p className="font-mono text-[10px]" style={{ color: "var(--color-ink-mute)", letterSpacing: "0.06em" }}>
                      {dayShort} · {period}
                    </p>
                    <p className="text-sm truncate" style={{ color: "var(--color-ink)" }}>
                      {name}
                    </p>
                  </div>
                  <span
                    className="shrink-0 font-mono text-[10px] rounded-full px-2 py-0.5"
                    style={{
                      background: tag === "RECETTE" ? "rgba(200,85,61,0.10)" : "var(--color-cream-deep)",
                      color: tag === "RECETTE" ? "var(--color-terracotta-deep)" : "var(--color-ink-soft)",
                      letterSpacing: "0.06em",
                    }}
                  >
                    {tag}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

        {/* 02 — LISTE PRÊTE */}
        <section className="p-6" style={{ background: "var(--color-cream)" }}>
          <p className="eyebrow mb-5">
            <span style={{ color: "var(--color-ink-faint)" }}>02 · </span>
            liste prête
          </p>
          <div
            className="rounded-md p-5"
            style={{ background: "var(--color-cream-pale)", border: "1px solid var(--color-line)" }}
          >
            <div className="flex items-baseline justify-between mb-1">
              <span className="font-display text-5xl tnum leading-none" style={{ color: "var(--color-ink)" }}>
                {String(totalIngredients).padStart(2, "0")}
              </span>
              <span className="font-display tnum text-base" style={{ color: "var(--color-terracotta)", fontStyle: "italic" }}>
                ~{totalEstimated.toFixed(2)}€
              </span>
            </div>
            <div className="flex justify-between mb-4">
              <p className="eyebrow" style={{ color: "var(--color-ink-mute)" }}>articles à acheter</p>
              <p className="eyebrow" style={{ color: "var(--color-ink-faint)" }}>estimé</p>
            </div>
            <ul className="space-y-1.5 mb-4 text-sm">
              {listItems.slice(0, 5).map((it) => (
                <li key={it.id} className="flex justify-between gap-2">
                  <span style={{ color: "var(--color-ink-soft)" }}>· {it.product_name}</span>
                  <span className="font-mono tnum text-[12px]" style={{ color: "var(--color-ink-mute)" }}>
                    {it.quantity ? `${it.quantity}${it.unit ? " " + it.unit : ""}` : ""}
                  </span>
                </li>
              ))}
              {listItems.length > 5 && (
                <li className="text-sm" style={{ color: "var(--color-ink-faint)" }}>
                  + {listItems.length - 5} autre{listItems.length - 5 > 1 ? "s" : ""}…
                </li>
              )}
              {listItems.length === 0 && (
                <li className="text-sm" style={{ color: "var(--color-ink-faint)" }}>
                  Liste vide pour le moment.
                </li>
              )}
            </ul>
            <Link
              href="/courses"
              className="block w-full text-center rounded-full py-2.5 text-sm font-medium transition-colors"
              style={{
                background: "var(--color-terracotta)",
                color: "var(--color-cream-pale)",
                border: "1px solid var(--color-terracotta)",
              }}
            >
              Mode courses →
            </Link>
          </div>
        </section>

        {/* 03 — SUGGESTION */}
        <section className="p-6" style={{ background: "var(--color-cream)" }}>
          <p className="eyebrow mb-5">
            <span style={{ color: "var(--color-ink-faint)" }}>03 · </span>
            suggestion
          </p>
          <div className="placeholder-img placeholder-img-olive aspect-[4/3] mb-4">
            galette de sarrasin
          </div>
          <p className="eyebrow mb-2">idée du jour</p>
          <p
            className="font-display text-2xl leading-tight tracking-tight mb-3"
            style={{ color: "var(--color-ink)" }}
          >
            <span style={{ fontStyle: "italic", color: "var(--color-terracotta)" }}>
              Galettes
            </span>{" "}
            de sarrasin, œuf, comté & roquette
          </p>
          <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--color-ink-mute)" }}>
            Tu as déjà sarrasin, œufs et comté au frigo. Reste à acheter de la roquette.
          </p>
          <div className="flex items-center gap-3">
            <Link
              href="/menu"
              className="rounded-full border px-3.5 py-1.5 text-sm transition-colors hover:bg-[var(--color-cream-deep)]"
              style={{ borderColor: "var(--color-line)", color: "var(--color-ink-soft)", background: "var(--color-cream-pale)" }}
            >
              Ajouter au menu
            </Link>
            <Link
              href="/recettes"
              className="text-sm hover:underline"
              style={{ color: "var(--color-ink-mute)" }}
            >
              Autre idée ↻
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
