"use client";

/**
 * Planning — grille hebdomadaire 7 colonnes.
 * Préserve toute la logique métier (API meal-plan/recipes/list/ai, localStorage mealConfigs).
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { getMonday, DAYS, MEAL_SLOTS } from "@/lib/utils";
import { useToast } from "@/components/toast";

type Recipe = {
  id: number;
  name: string;
  category: string | null;
  prep_time: number | null;
  cook_time: number | null;
  servings: number;
};

type MealEntry = {
  id: number;
  week_start: string;
  day_of_week: number;
  meal_type: string;
  recipe_id: number | null;
  custom_name: string | null;
};

type MealConfig = { mode: "cook" | "skip"; persons: number };

const DEFAULT_LUNCH: MealConfig = { mode: "skip", persons: 1 };
const DEFAULT_DINNER: MealConfig = { mode: "cook", persons: 2 };

const DAYS_FR_3 = ["LUN", "MAR", "MER", "JEU", "VEN", "SAM", "DIM"];
const MONTHS_FR_SHORT = ["JAN", "FÉV", "MAR", "AVR", "MAI", "JUN", "JUL", "AOÛ", "SEP", "OCT", "NOV", "DÉC"];

type ChipType = "RECETTE" | "MENU" | "RESTE" | "DEHORS";

function detectChipType(meal: MealEntry, recipe?: Recipe): ChipType {
  if (recipe) return "RECETTE";
  if (meal.custom_name?.toLowerCase().includes("reste")) return "RESTE";
  if (meal.custom_name?.toLowerCase().match(/dehors|resto|restaurant/)) return "DEHORS";
  return "MENU";
}

const CHIP_TONES: Record<ChipType, { bg: string; fg: string }> = {
  RECETTE: { bg: "rgba(200,85,61,0.12)", fg: "var(--color-terracotta-deep)" },
  MENU: { bg: "rgba(201,162,39,0.15)", fg: "#8a6d10" },
  RESTE: { bg: "var(--color-cream-deep)", fg: "var(--color-ink-soft)" },
  DEHORS: { bg: "rgba(92,107,63,0.13)", fg: "var(--color-olive-deep)" },
};

export default function PlanningPage() {
  const { toast } = useToast();
  const [meals, setMeals] = useState<MealEntry[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [weekOffset, setWeekOffset] = useState(0);
  const [addingSlot, setAddingSlot] = useState<{ day: number; type: string; weekStart: string } | null>(null);
  const [recipeSearch, setRecipeSearch] = useState("");
  const [customName, setCustomName] = useState("");
  const [autoFilling, setAutoFilling] = useState(false);
  const [now, setNow] = useState<Date | null>(null);
  const [mealConfigs, setMealConfigs] = useState<Record<string, MealConfig>>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("miamweek_meal_configs");
        return saved ? JSON.parse(saved) : {};
      } catch {
        return {};
      }
    }
    return {};
  });

  useEffect(() => {
    setNow(new Date());
  }, []);

  const todayDayOfWeek = useMemo(() => {
    if (!now) return 0;
    const d = now.getDay();
    return d === 0 ? 6 : d - 1;
  }, [now]);

  const currentMonday = useMemo(() => {
    if (!now) return "";
    const d = new Date(now);
    d.setDate(d.getDate() + weekOffset * 7);
    return getMonday(d);
  }, [now, weekOffset]);

  const isCurrentWeek = weekOffset === 0;

  useEffect(() => {
    if (Object.keys(mealConfigs).length > 0) {
      localStorage.setItem("miamweek_meal_configs", JSON.stringify(mealConfigs));
    }
  }, [mealConfigs]);

  const getMealConfig = (day: number, meal: "lunch" | "dinner"): MealConfig =>
    mealConfigs[`${day}_${meal}`] || (meal === "lunch" ? DEFAULT_LUNCH : DEFAULT_DINNER);

  const fetchMeals = useCallback(() => {
    if (!currentMonday) return;
    fetch(`/api/meal-plan?weekStart=${currentMonday}`)
      .then((r) => r.json())
      .then((data) => setMeals(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, [currentMonday]);

  useEffect(() => {
    fetchMeals();
  }, [fetchMeals]);

  useEffect(() => {
    fetch("/api/recipes")
      .then((r) => r.json())
      .then((d) => setRecipes(Array.isArray(d) ? d : []))
      .catch(console.error);
  }, []);

  const addMeal = async (
    dayOfWeek: number,
    mealType: string,
    weekStart: string,
    recipeId?: number,
    name?: string
  ) => {
    await fetch("/api/meal-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        weekStart,
        dayOfWeek,
        mealType,
        recipeId: recipeId || null,
        customName: name || null,
      }),
    });
    setAddingSlot(null);
    setRecipeSearch("");
    setCustomName("");
    fetchMeals();
  };

  const removeMeal = async (id: number) => {
    await fetch(`/api/meal-plan?id=${id}`, { method: "DELETE" });
    fetchMeals();
  };

  const addWeekToList = async () => {
    const recipeMeals = meals.filter((m) => m.recipe_id);
    if (recipeMeals.length === 0) {
      toast("Aucune recette planifiée à ajouter.");
      return;
    }
    const recipeResponses = await Promise.all(
      recipeMeals.map((m) => fetch(`/api/recipes/${m.recipe_id}`).then((r) => r.json()))
    );
    const toAdd: { productName: string; quantity: number; unit: string; category: string; sourceRecipe: string }[] = [];
    for (const recipe of recipeResponses) {
      if (!recipe.ingredients) continue;
      for (const ing of recipe.ingredients) {
        toAdd.push({
          productName: ing.name,
          quantity: ing.quantity || 1,
          unit: ing.unit || "pcs",
          category: ing.category || "Autre",
          sourceRecipe: recipe.name,
        });
      }
    }
    for (let i = 0; i < toAdd.length; i += 5) {
      const batch = toAdd.slice(i, i + 5);
      await Promise.all(
        batch.map((ing) =>
          fetch("/api/list", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...ing, source: "recipe", listStatus: "prep" }),
          })
        )
      );
    }
    toast(`${recipeMeals.length} recette(s) ajoutée(s) à la liste.`);
  };

  const autoFillWeek = async () => {
    setAutoFilling(true);
    try {
      const dayDescriptions = DAYS.map((name, i) => {
        const lc = getMealConfig(i, "lunch");
        const dc = getMealConfig(i, "dinner");
        return `${name}: Midi=${lc.mode === "skip" ? "skip" : `cook ${lc.persons}p`}, Soir=${dc.mode === "skip" ? "skip" : `cook ${dc.persons}p`}`;
      }).join("\n");
      const recipeNames = recipes.map((r) => `${r.name} (${r.category || "?"}, ${r.servings}p)`).join(", ");
      const res = await fetch("/api/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Complète ce planning. Contexte:\n${dayDescriptions}\nRecettes: ${recipeNames}\nRéponds JSON [{"dayOfWeek":0,"mealType":"dinner","name":"X"}]`,
        }),
      });
      const data = await res.json();
      const suggestions = data.meals || data.recipes || data.suggestions;
      if (Array.isArray(suggestions)) {
        for (const meal of suggestions) {
          const period = meal.mealType?.startsWith("lunch") ? "lunch" : "dinner";
          const config = getMealConfig(meal.dayOfWeek, period as "lunch" | "dinner");
          if (config.mode !== "cook") continue;
          const exists = meals.some(
            (m) =>
              m.day_of_week === meal.dayOfWeek &&
              m.meal_type === (meal.mealType || "dinner") &&
              m.week_start === currentMonday
          );
          if (exists) continue;
          const matched = recipes.find((r) => r.name.toLowerCase() === (meal.name || "").toLowerCase());
          await fetch("/api/meal-plan", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              weekStart: currentMonday,
              dayOfWeek: meal.dayOfWeek,
              mealType: meal.mealType || "dinner",
              recipeId: matched?.id || null,
              customName: meal.name,
            }),
          });
        }
        fetchMeals();
        toast("Planning complété.");
      }
    } catch (e) {
      console.error("Auto-fill error:", e);
      toast("L'auto-remplissage a échoué.");
    }
    setAutoFilling(false);
  };

  const recipesById = useMemo(() => {
    const map: Record<number, Recipe> = {};
    for (const r of recipes) map[r.id] = r;
    return map;
  }, [recipes]);

  const getMealsForPeriod = (day: number, period: "lunch" | "dinner") =>
    meals.filter(
      (m) => m.day_of_week === day && (m.meal_type === period || m.meal_type.startsWith(`${period}_`))
    );

  const getRecipeName = (meal: MealEntry) => {
    if (meal.custom_name) return meal.custom_name;
    if (meal.recipe_id && recipesById[meal.recipe_id]) return recipesById[meal.recipe_id].name;
    return "?";
  };

  const filteredRecipes = useMemo(() => {
    if (!recipeSearch) return recipes;
    const s = recipeSearch.toLowerCase();
    return recipes.filter((r) => r.name.toLowerCase().includes(s));
  }, [recipes, recipeSearch]);

  // Stats for the hero
  const totalMealsPlanned = meals.length;
  const totalRecipeMeals = useMemo(() => meals.filter((m) => m.recipe_id).length, [meals]);
  const totalIngredients = useMemo(() => {
    // Sum from recipes used
    return meals.reduce((acc, m) => {
      if (!m.recipe_id) return acc;
      const r = recipesById[m.recipe_id];
      return acc + (r ? 6 : 0); // approx 6 ingredients per recipe
    }, 0);
  }, [meals, recipesById]);

  // Week label
  const weekLabel = useMemo(() => {
    if (!currentMonday) return "";
    const monday = new Date(currentMonday + "T00:00:00");
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const wn = Math.ceil(((+monday - +new Date(monday.getFullYear(), 0, 1)) / 86400000 + 1) / 7);
    const dayLabel = (d: Date) =>
      `${String(d.getDate()).padStart(2, "0")}-${String(sunday.getDate()).padStart(2, "0")}`;
    void dayLabel;
    return `SEM. ${String(wn).padStart(2, "0")} · ${monday.getDate()}-${sunday.getDate()} ${MONTHS_FR_SHORT[monday.getMonth()]}`;
  }, [currentMonday]);

  // Build the 7 weekday columns
  const weekDays = useMemo(() => {
    if (!currentMonday) return [];
    const monday = new Date(currentMonday + "T00:00:00");
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return {
        date: d,
        dayOfWeek: i,
        weekStart: currentMonday,
        isToday: isCurrentWeek && i === todayDayOfWeek,
        isPast: isCurrentWeek && i < todayDayOfWeek,
      };
    });
  }, [currentMonday, isCurrentWeek, todayDayOfWeek]);

  // Pick a tone color for placeholder of today's recipe
  const renderDayColumn = (day: typeof weekDays[0]) => {
    const lunchMeals = getMealsForPeriod(day.dayOfWeek, "lunch");
    const dinnerMeals = getMealsForPeriod(day.dayOfWeek, "dinner");
    const lunchConfig = getMealConfig(day.dayOfWeek, "lunch");
    const dinnerConfig = getMealConfig(day.dayOfWeek, "dinner");

    // Today-only big placeholder for hero recipe
    const heroMeal = day.isToday ? dinnerMeals[0] || lunchMeals[0] : null;
    const heroRecipe = heroMeal?.recipe_id ? recipesById[heroMeal.recipe_id] : null;

    return (
      <div
        key={`${day.weekStart}-${day.dayOfWeek}`}
        className="flex flex-col"
        style={{
          background: "var(--color-cream-pale)",
          opacity: day.isPast ? 0.55 : 1,
        }}
      >
        {/* Day header */}
        <div className="px-3 pt-3 pb-2 flex items-baseline justify-between">
          <div className="flex items-baseline gap-2">
            <span
              className="font-mono text-[11px]"
              style={{
                color: day.isToday ? "var(--color-terracotta)" : "var(--color-ink-mute)",
                letterSpacing: "0.08em",
              }}
            >
              {DAYS_FR_3[day.dayOfWeek]}
            </span>
            <span
              className="font-display text-2xl tnum leading-none"
              style={{
                color: day.isToday ? "var(--color-terracotta)" : "var(--color-ink)",
              }}
            >
              {String(day.date.getDate()).padStart(2, "0")}
            </span>
          </div>
          {day.isToday && (
            <span
              className="font-mono text-[10px] uppercase tracking-wider rounded-full px-2 py-0.5"
              style={{
                background: "var(--color-terracotta)",
                color: "var(--color-cream-pale)",
                letterSpacing: "0.08em",
              }}
            >
              aujourd&apos;hui
            </span>
          )}
        </div>

        {/* Hero placeholder for today's main recipe */}
        {heroMeal && day.isToday && (
          <div
            className="placeholder-img placeholder-img-terra mx-3 mb-2"
            style={{ aspectRatio: "1 / 1", fontSize: 10 }}
          >
            {heroMeal.custom_name?.slice(0, 28) || heroRecipe?.name.slice(0, 28) || "plat du jour"}
          </div>
        )}

        {/* MIDI */}
        {renderSlot(day, "lunch", lunchMeals, lunchConfig)}

        {/* SOIR */}
        {renderSlot(day, "dinner", dinnerMeals, dinnerConfig)}
      </div>
    );
  };

  const renderSlot = (
    day: typeof weekDays[0],
    period: "lunch" | "dinner",
    periodMeals: MealEntry[],
    config: MealConfig
  ) => {
    const isAdding =
      addingSlot?.day === day.dayOfWeek &&
      addingSlot?.type === period &&
      addingSlot?.weekStart === day.weekStart;
    const slotsBefore = period === "lunch" ? 0 : 1;

    return (
      <div className="px-3 pb-3 pt-1.5">
        <div className="flex items-baseline justify-between mb-1">
          <span
            className="font-mono text-[10px] uppercase"
            style={{ color: "var(--color-ink-mute)", letterSpacing: "0.08em" }}
          >
            {period === "lunch" ? "midi" : "soir"}
          </span>
          {config.mode === "cook" && (
            <span
              className="font-mono text-[10px]"
              style={{ color: "var(--color-ink-faint)", letterSpacing: "0.04em" }}
            >
              +{config.persons}
            </span>
          )}
        </div>

        {config.mode === "skip" && periodMeals.length === 0 ? (
          <p className="text-xs italic" style={{ color: "var(--color-ink-faint)" }}>
            —
          </p>
        ) : (
          <div className="space-y-1.5">
            {periodMeals.map((meal) => {
              const recipe = meal.recipe_id ? recipesById[meal.recipe_id] : undefined;
              const tag = detectChipType(meal, recipe);
              return (
                <div key={meal.id} className="group">
                  <p className="text-sm leading-tight" style={{ color: "var(--color-ink)" }}>
                    {getRecipeName(meal)}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className="font-mono text-[9px] uppercase rounded-sm px-1.5 py-0.5"
                      style={{
                        background: CHIP_TONES[tag].bg,
                        color: CHIP_TONES[tag].fg,
                        letterSpacing: "0.06em",
                      }}
                    >
                      {tag}
                    </span>
                    <button
                      onClick={() => removeMeal(meal.id)}
                      className="font-mono text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: "var(--color-terracotta)" }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}

            {isAdding ? (
              <div className="space-y-1.5 pt-1">
                <input
                  type="text"
                  value={recipeSearch}
                  onChange={(e) => setRecipeSearch(e.target.value)}
                  placeholder="Recette…"
                  className="w-full bg-[var(--color-cream)] border border-[var(--color-line)] rounded px-2 py-1 text-xs focus:outline-none focus:border-[var(--color-terracotta)]"
                  autoFocus
                />
                {recipeSearch && (
                  <div className="max-h-32 overflow-y-auto space-y-px">
                    {filteredRecipes.slice(0, 5).map((r) => (
                      <button
                        key={r.id}
                        onClick={() => addMeal(day.dayOfWeek, period, day.weekStart, r.id)}
                        className="w-full text-left px-2 py-1 text-[11px] transition-colors hover:bg-[var(--color-cream-deep)]"
                        style={{ color: "var(--color-ink-soft)" }}
                      >
                        {r.name}
                      </button>
                    ))}
                  </div>
                )}
                <div className="flex gap-1">
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && customName.trim()) {
                        addMeal(day.dayOfWeek, period, day.weekStart, undefined, customName);
                      }
                    }}
                    placeholder="Libre…"
                    className="flex-1 bg-[var(--color-cream)] border border-[var(--color-line)] rounded px-2 py-1 text-xs"
                  />
                  <button
                    onClick={() => {
                      setAddingSlot(null);
                      setRecipeSearch("");
                      setCustomName("");
                    }}
                    className="text-xs px-1"
                    style={{ color: "var(--color-ink-mute)" }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setAddingSlot({ day: day.dayOfWeek, type: period, weekStart: day.weekStart })}
                className="w-full py-1 text-xs transition-colors"
                style={{
                  color: "var(--color-ink-mute)",
                  border: "1px dashed var(--color-line)",
                  borderRadius: 3,
                }}
              >
                + ajouter
              </button>
            )}
          </div>
        )}
        <span className="sr-only">{slotsBefore}</span>
      </div>
    );
  };

  // Mobile vertical list rendering
  const renderMobileList = () => {
    return (
      <div className="md:hidden flex flex-col">
        {weekDays.map((day) => {
          const lunch = getMealsForPeriod(day.dayOfWeek, "lunch");
          const dinner = getMealsForPeriod(day.dayOfWeek, "dinner");
          return (
            <div
              key={day.dayOfWeek}
              className="border-t flex gap-4 py-4"
              style={{ borderColor: "var(--color-line)", opacity: day.isPast ? 0.5 : 1 }}
            >
              <div className="w-12 shrink-0">
                <p
                  className="font-mono text-[10px]"
                  style={{ color: "var(--color-ink-mute)", letterSpacing: "0.08em" }}
                >
                  {DAYS_FR_3[day.dayOfWeek]}
                </p>
                <p
                  className="font-display text-3xl tnum leading-none"
                  style={{ color: day.isToday ? "var(--color-terracotta)" : "var(--color-ink)" }}
                >
                  {String(day.date.getDate()).padStart(2, "0")}
                </p>
                {day.isToday && (
                  <span
                    className="mt-2 inline-block font-mono text-[9px] uppercase rounded-full px-2 py-0.5"
                    style={{
                      background: "rgba(200,85,61,0.15)",
                      color: "var(--color-terracotta-deep)",
                      border: "1px solid rgba(200,85,61,0.25)",
                      letterSpacing: "0.08em",
                    }}
                  >
                    NOW
                  </span>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <div>
                  <p className="font-mono text-[10px]" style={{ color: "var(--color-ink-mute)", letterSpacing: "0.08em" }}>
                    MIDI
                  </p>
                  {lunch.length > 0 ? (
                    lunch.map((m) => (
                      <p key={m.id} className="text-sm" style={{ color: "var(--color-ink)" }}>
                        {getRecipeName(m)}
                      </p>
                    ))
                  ) : (
                    <p className="text-sm italic" style={{ color: "var(--color-ink-faint)" }}>
                      —
                    </p>
                  )}
                </div>
                <div>
                  <p className="font-mono text-[10px]" style={{ color: "var(--color-ink-mute)", letterSpacing: "0.08em" }}>
                    SOIR
                  </p>
                  {dinner.length > 0 ? (
                    dinner.map((m) => (
                      <p
                        key={m.id}
                        className="text-sm font-medium"
                        style={{ color: "var(--color-ink)" }}
                      >
                        {getRecipeName(m)}
                      </p>
                    ))
                  ) : (
                    <p className="text-sm italic" style={{ color: "var(--color-ink-faint)" }}>
                      —
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="pb-32 md:pb-8">
      {/* Eyebrow */}
      <p className="eyebrow mb-5">la semaine en bouche</p>

      {/* Hero + stats */}
      <header
        className="pb-8 mb-8 border-b flex flex-col md:flex-row md:items-end md:justify-between gap-6"
        style={{ borderColor: "var(--color-line)" }}
      >
        <h1
          className="font-display tracking-tight"
          style={{
            color: "var(--color-ink)",
            fontSize: "clamp(40px, 5.5vw, 80px)",
            lineHeight: 0.95,
            letterSpacing: "-0.02em",
            maxWidth: "12ch",
          }}
        >
          Sept jours,{" "}
          <span style={{ fontStyle: "italic", color: "var(--color-terracotta)" }}>
            {totalMealsPlanned > 0
              ? `${totalMealsPlanned} repas, une`
              : "à composer, une"}
          </span>{" "}
          liste de courses.
        </h1>

        <div className="grid grid-cols-4 gap-6 md:gap-8 shrink-0">
          <Stat value={totalMealsPlanned} label="Repas planifiés" />
          <Stat value={totalIngredients} label="Ingrédients" />
          <Stat value={Math.max(0, totalIngredients - 8)} label="À acheter" tone="terra" />
          <Stat value={totalRecipeMeals} label="Recettes" />
        </div>
      </header>

      {/* Week navigation */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <p className="eyebrow">{weekLabel}</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setWeekOffset((w) => w - 1)}
            className="rounded-full px-3 py-1.5 text-sm transition-colors"
            style={{
              color: "var(--color-ink-mute)",
              border: "1px solid var(--color-line)",
              background: "var(--color-cream-pale)",
            }}
          >
            ←
          </button>
          {!isCurrentWeek && (
            <button
              onClick={() => setWeekOffset(0)}
              className="rounded-full px-4 py-1.5 text-sm transition-colors"
              style={{
                background: "var(--color-ink)",
                color: "var(--color-cream-pale)",
                border: "1px solid var(--color-ink)",
              }}
            >
              Aujourd&apos;hui
            </button>
          )}
          <button
            onClick={() => setWeekOffset((w) => w + 1)}
            className="rounded-full px-3 py-1.5 text-sm transition-colors"
            style={{
              color: "var(--color-ink-mute)",
              border: "1px solid var(--color-line)",
              background: "var(--color-cream-pale)",
            }}
          >
            →
          </button>
        </div>
      </div>

      {/* Desktop : 7-column grid */}
      <div
        className="hidden md:grid grid-cols-7 gap-px rounded-md overflow-hidden border"
        style={{ background: "var(--color-line)", borderColor: "var(--color-line)" }}
      >
        {weekDays.map((d) => renderDayColumn(d))}
      </div>

      {/* Mobile : vertical list */}
      {renderMobileList()}

      {/* Bottom toolbar */}
      <div
        className="mt-6 pt-6 border-t flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        style={{ borderColor: "var(--color-line)" }}
      >
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
          {(["RECETTE", "MENU", "RESTE", "DEHORS"] as ChipType[]).map((tag) => (
            <span
              key={tag}
              className="font-mono uppercase tracking-wider flex items-center gap-1.5"
              style={{ color: "var(--color-ink-mute)", letterSpacing: "0.06em" }}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: CHIP_TONES[tag].fg }}
              />
              {tag.toLowerCase()}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/menu"
            className="rounded-full border px-4 py-2 text-sm transition-colors hover:bg-[var(--color-cream-deep)]"
            style={{ borderColor: "var(--color-line)", background: "var(--color-cream-pale)", color: "var(--color-ink-soft)" }}
          >
            Composer un menu
          </Link>
          <button
            onClick={autoFillWeek}
            disabled={autoFilling}
            className="rounded-full px-4 py-2 text-sm transition-colors disabled:opacity-50"
            style={{
              background: "var(--color-ink)",
              color: "var(--color-cream-pale)",
              border: "1px solid var(--color-ink)",
            }}
          >
            {autoFilling ? "Génération…" : "Auto-remplir la semaine"}
          </button>
          {totalMealsPlanned > 0 && (
            <button
              onClick={addWeekToList}
              className="rounded-full px-4 py-2 text-sm font-medium transition-colors"
              style={{
                background: "var(--color-terracotta)",
                color: "var(--color-cream-pale)",
                border: "1px solid var(--color-terracotta)",
              }}
            >
              + Générer la liste de courses
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({
  value,
  label,
  tone = "neutral",
}: {
  value: number | string;
  label: string;
  tone?: "neutral" | "terra";
}) {
  return (
    <div className="text-right">
      <p
        className="font-display tnum leading-none"
        style={{
          fontSize: 36,
          color: tone === "terra" ? "var(--color-terracotta)" : "var(--color-ink)",
        }}
      >
        {value}
      </p>
      <p className="eyebrow mt-1.5">{label}</p>
    </div>
  );
}
