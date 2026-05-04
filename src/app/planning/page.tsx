"use client";

/**
 * Planning — refonte éditoriale complète.
 *
 * Garde TOUTE la logique métier de la version précédente :
 * - même contrats API (/api/meal-plan, /api/recipes, /api/list, /api/ai/suggest)
 * - même persistance localStorage des mealConfigs
 * - même flow auto-fill / addWeekToList / view today vs all
 *
 * Refondu côté visuel :
 * - Hero éditorial avec date du jour en grand
 * - Lignes de jours plates (pas de cards aux bords arrondis)
 * - Slots midi/soir en colonnes typographiques
 * - Toolbar d'actions éditoriale (boutons pill terre cuite)
 */

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Link from "next/link";
import { getMonday, DAYS, MEAL_TYPES, MEAL_SLOTS } from "@/lib/utils";
import { useToast } from "@/components/toast";
import { Button, Chip, PageHeader, EmptyState } from "@/components/ui-kit";

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
  recipeName?: string;
  recipeCategory?: string;
};

type MealConfig = { mode: "cook" | "skip"; persons: number };

const DEFAULT_LUNCH: MealConfig = { mode: "skip", persons: 1 };
const DEFAULT_DINNER: MealConfig = { mode: "cook", persons: 2 };

export default function PlanningPage() {
  const { toast } = useToast();
  const [meals, setMeals] = useState<MealEntry[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [viewAll, setViewAll] = useState(false);
  const [weekOffset] = useState(0);
  const [addingSlot, setAddingSlot] = useState<{ day: number; type: string; weekStart: string } | null>(null);
  const [recipeSearch, setRecipeSearch] = useState("");
  const [customName, setCustomName] = useState("");
  const [mealConfigs, setMealConfigs] = useState<Record<string, MealConfig>>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("miamweek_meal_configs");
        return saved ? JSON.parse(saved) : {};
      } catch { return {}; }
    }
    return {};
  });
  const [autoFilling, setAutoFilling] = useState(false);
  const todayRef = useRef<HTMLDivElement>(null);
  const scrollBoxRef = useRef<HTMLDivElement>(null);

  const today = useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d; }, []);
  const todayDayOfWeek = useMemo(() => { const d = today.getDay(); return d === 0 ? 6 : d - 1; }, [today]);
  const currentMonday = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + weekOffset * 7);
    return getMonday(d);
  }, [weekOffset]);

  useEffect(() => {
    if (Object.keys(mealConfigs).length > 0) {
      localStorage.setItem("miamweek_meal_configs", JSON.stringify(mealConfigs));
    }
  }, [mealConfigs]);

  const getMealConfig = (day: number, meal: "lunch" | "dinner"): MealConfig =>
    mealConfigs[`${day}_${meal}`] || (meal === "lunch" ? DEFAULT_LUNCH : DEFAULT_DINNER);

  const toggleMealMode = (day: number, meal: "lunch" | "dinner") => {
    const key = `${day}_${meal}`;
    const current = getMealConfig(day, meal);
    setMealConfigs((p) => ({ ...p, [key]: { ...current, mode: current.mode === "cook" ? "skip" : "cook" } }));
  };

  const setMealPersons = (day: number, meal: "lunch" | "dinner", persons: number) => {
    const key = `${day}_${meal}`;
    setMealConfigs((p) => ({ ...p, [key]: { ...getMealConfig(day, meal), persons: Math.max(1, persons) } }));
  };

  const fetchMeals = useCallback(() => {
    if (viewAll) {
      const thisMonday = getMonday(new Date());
      const nextMondayDate = new Date(thisMonday);
      nextMondayDate.setDate(nextMondayDate.getDate() + 7);
      const nextMonday = nextMondayDate.toISOString().split("T")[0];
      Promise.all([
        fetch(`/api/meal-plan?weekStart=${thisMonday}`).then((r) => r.json()),
        fetch(`/api/meal-plan?weekStart=${nextMonday}`).then((r) => r.json()),
      ]).then(([w1, w2]) => {
        setMeals([...(Array.isArray(w1) ? w1 : []), ...(Array.isArray(w2) ? w2 : [])]);
      }).catch(console.error);
    } else {
      fetch(`/api/meal-plan?weekStart=${currentMonday}`)
        .then((r) => r.json())
        .then((data) => setMeals(Array.isArray(data) ? data : []))
        .catch(console.error);
    }
  }, [currentMonday, viewAll]);

  useEffect(() => { fetchMeals(); }, [fetchMeals]);
  useEffect(() => {
    fetch("/api/recipes").then((r) => r.json()).then((d) => setRecipes(Array.isArray(d) ? d : [])).catch(console.error);
  }, []);

  useEffect(() => {
    if (viewAll && todayRef.current && scrollBoxRef.current) {
      setTimeout(() => {
        const c = scrollBoxRef.current!;
        const card = todayRef.current!;
        c.scrollTop = card.offsetTop - c.offsetTop;
      }, 100);
    }
  }, [viewAll]);

  const addMeal = async (dayOfWeek: number, mealType: string, weekStart: string, recipeId?: number, name?: string) => {
    await fetch("/api/meal-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weekStart, dayOfWeek, mealType, recipeId: recipeId || null, customName: name || null }),
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

  const removeMenuGroup = async (mealIds: number[]) => {
    for (const id of mealIds) await fetch(`/api/meal-plan?id=${id}`, { method: "DELETE" });
    fetchMeals();
  };

  const addWeekToList = async () => {
    const recipeMeals = meals.filter((m) => m.recipe_id);
    if (recipeMeals.length === 0) return;
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
      await Promise.all(batch.map((ing) =>
        fetch("/api/list", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...ing, source: "recipe", listStatus: "prep" }),
        })
      ));
    }
    toast(`${recipeMeals.length} recette(s) ajoutées à la liste`);
  };

  const autoFillWeek = async () => {
    setAutoFilling(true);
    try {
      const dayDescriptions = DAYS.map((name, i) => {
        const lc = getMealConfig(i, "lunch");
        const dc = getMealConfig(i, "dinner");
        const le = getMealsForPeriod(i, currentMonday, "lunch").length;
        const de = getMealsForPeriod(i, currentMonday, "dinner").length;
        const ld = lc.mode === "skip" ? "pas de repas" : `cuisine pour ${lc.persons} personne(s)${le > 0 ? ` (${le} repas déjà)` : ""}`;
        const dd = dc.mode === "skip" ? "pas de repas" : `cuisine pour ${dc.persons} personne(s)${de > 0 ? ` (${de} repas déjà)` : ""}`;
        return `${name}: Midi=${ld}, Soir=${dd}`;
      }).join("\n");
      const recipeNames = recipes.map((r) => `${r.name} (${r.category || "?"}, ${r.servings} pers.)`).join(", ");
      const res = await fetch("/api/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Complète ce planning de repas pour la semaine. Voici le contexte de chaque jour :\n${dayDescriptions}\n\nRecettes disponibles : ${recipeNames}\n\nPour chaque repas où il faut cuisiner et où il n'y a pas encore de repas, propose un plat. Varie les recettes, équilibre les types de cuisine. Réponds UNIQUEMENT en JSON :\n[{"dayOfWeek": 0, "mealType": "lunch_plat", "name": "Nom du plat"}, ...]`,
        }),
      });
      const data = await res.json();
      const suggestions = data.meals || data.recipes || data.suggestions;
      if (Array.isArray(suggestions)) {
        for (const meal of suggestions) {
          const period = meal.mealType?.startsWith("lunch") ? "lunch" : "dinner";
          const config = getMealConfig(meal.dayOfWeek, period as "lunch" | "dinner");
          if (config.mode !== "cook") continue;
          const existing = meals.filter(
            (m) => m.day_of_week === meal.dayOfWeek && m.meal_type === meal.mealType && m.week_start === currentMonday
          );
          if (existing.length > 0) continue;
          const matchedRecipe = recipes.find((r) => r.name.toLowerCase() === (meal.name || "").toLowerCase());
          await fetch("/api/meal-plan", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              weekStart: currentMonday,
              dayOfWeek: meal.dayOfWeek,
              mealType: meal.mealType || "dinner_plat",
              recipeId: matchedRecipe?.id || null,
              customName: meal.name,
            }),
          });
        }
        fetchMeals();
      }
    } catch (e) { console.error("Auto-fill error:", e); }
    setAutoFilling(false);
  };

  const getMealsForPeriod = (day: number, weekStart: string, period: "lunch" | "dinner") =>
    meals.filter(
      (m) => m.day_of_week === day && m.week_start === weekStart && (m.meal_type === period || m.meal_type.startsWith(`${period}_`))
    );

  const getSlotLabel = (mealType: string) => {
    const slot = MEAL_SLOTS[mealType as keyof typeof MEAL_SLOTS];
    return slot || { label: mealType, icon: "·", color: "text-muted" };
  };

  const getRecipeName = (meal: MealEntry) => {
    if (meal.custom_name) return meal.custom_name;
    if (meal.recipe_id) {
      const r = recipes.find((rec) => rec.id === meal.recipe_id);
      return r?.name || `Recette #${meal.recipe_id}`;
    }
    return "?";
  };

  const filteredRecipes = useMemo(() => {
    if (!recipeSearch) return recipes;
    const s = recipeSearch.toLowerCase();
    return recipes.filter((r) => r.name.toLowerCase().includes(s));
  }, [recipes, recipeSearch]);

  const groupMealsForPeriod = (day: number, weekStart: string, period: "lunch" | "dinner") => {
    const periodMeals = getMealsForPeriod(day, weekStart, period);
    return {
      menuGroup: periodMeals.filter((m) => m.meal_type.includes("_")),
      standaloneMeals: periodMeals.filter((m) => !m.meal_type.includes("_")),
    };
  };

  const displayDays = useMemo(() => {
    if (!viewAll) {
      return [{ date: today, dayOfWeek: todayDayOfWeek, weekStart: currentMonday, isToday: true, isPast: false }];
    }
    const days: { date: Date; dayOfWeek: number; weekStart: string; isToday: boolean; isPast: boolean }[] = [];
    const mondayDate = new Date(currentMonday);
    const startDate = mondayDate < today ? mondayDate : today;
    for (let i = 0; i < 21; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const dow = d.getDay();
      const dayOfWeek = dow === 0 ? 6 : dow - 1;
      const ws = getMonday(d);
      const isToday = d.toDateString() === today.toDateString();
      const isPast = d < today && !isToday;
      days.push({ date: d, dayOfWeek, weekStart: ws, isToday, isPast });
    }
    return days;
  }, [viewAll, today, todayDayOfWeek, currentMonday]);

  const filledSlots = meals.length;

  const renderDayRow = (day: typeof displayDays[0]) => {
    const dayName = day.date.toLocaleDateString("fr-FR", { weekday: "long" });
    const dayDate = day.date.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });

    return (
      <div
        key={`${day.weekStart}-${day.dayOfWeek}`}
        ref={day.isToday ? todayRef : undefined}
        className="py-6 border-t"
        style={{
          borderColor: "var(--color-line)",
          opacity: day.isPast ? 0.45 : 1,
        }}
      >
        {/* Day header */}
        <div className="flex items-baseline gap-4 mb-4">
          <span
            className="font-mono text-xs tnum"
            style={{ color: "var(--color-ink-faint)", letterSpacing: "0.08em", textTransform: "uppercase", minWidth: 28 }}
          >
            {String(day.dayOfWeek + 1).padStart(2, "0")}
          </span>
          <h3
            className="font-display capitalize"
            style={{
              fontSize: day.isToday ? 36 : 24,
              lineHeight: 1.05,
              color: day.isToday ? "var(--color-terracotta)" : "var(--color-ink)",
              fontStyle: day.isToday ? "italic" : "normal",
            }}
          >
            {dayName}
          </h3>
          <span className="eyebrow" style={{ color: "var(--color-ink-mute)" }}>
            {dayDate}
          </span>
          {day.isToday && <Chip tone="terra">aujourd&apos;hui</Chip>}
        </div>

        {/* Two columns midi / soir */}
        <div className="grid grid-cols-2 gap-px" style={{ background: "var(--color-line)" }}>
          {(["lunch", "dinner"] as const).map((mealType) => {
            const config = getMealConfig(day.dayOfWeek, mealType);
            const { menuGroup, standaloneMeals } = groupMealsForPeriod(day.dayOfWeek, day.weekStart, mealType);
            const isAdding =
              addingSlot?.day === day.dayOfWeek &&
              addingSlot?.type === mealType &&
              addingSlot?.weekStart === day.weekStart;

            return (
              <div key={mealType} className="p-4" style={{ background: "var(--color-cream-pale)", minHeight: 120 }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="eyebrow">{MEAL_TYPES[mealType]}</span>
                  <div className="flex items-center gap-1">
                    <button
                      title={config.mode === "cook" ? "Désactiver" : "Activer"}
                      onClick={() => toggleMealMode(day.dayOfWeek, mealType)}
                      className="font-mono text-[10px] px-2 py-1 rounded transition-colors"
                      style={{
                        background: config.mode === "cook" ? "var(--color-ink)" : "transparent",
                        color: config.mode === "cook" ? "var(--color-cream-pale)" : "var(--color-ink-mute)",
                        border: "1px solid",
                        borderColor: config.mode === "cook" ? "var(--color-ink)" : "var(--color-line)",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                      }}
                    >
                      {config.mode === "cook" ? "ON" : "OFF"}
                    </button>
                    {config.mode === "cook" && (
                      <div
                        className="flex items-center gap-1 px-1.5 py-0.5 rounded"
                        style={{ background: "var(--color-cream)", border: "1px solid var(--color-line)" }}
                      >
                        <button
                          onClick={() => setMealPersons(day.dayOfWeek, mealType, config.persons - 1)}
                          className="text-[11px]"
                          style={{ color: "var(--color-ink-mute)", width: 12 }}
                        >−</button>
                        <span className="text-[11px] font-mono tnum" style={{ minWidth: 8, textAlign: "center" }}>
                          {config.persons}
                        </span>
                        <button
                          onClick={() => setMealPersons(day.dayOfWeek, mealType, config.persons + 1)}
                          className="text-[11px]"
                          style={{ color: "var(--color-ink-mute)", width: 12 }}
                        >+</button>
                      </div>
                    )}
                  </div>
                </div>

                {config.mode === "skip" ? (
                  <p className="font-display italic text-lg" style={{ color: "var(--color-ink-faint)" }}>
                    rien.
                  </p>
                ) : (
                  <div>
                    {menuGroup.length > 0 && (
                      <div className="group mb-2">
                        <div className="space-y-1">
                          {menuGroup
                            .sort((a, b) => {
                              const order = ["entree", "plat", "dessert", "boisson"];
                              return order.findIndex((o) => a.meal_type.endsWith(o)) - order.findIndex((o) => b.meal_type.endsWith(o));
                            })
                            .map((meal) => {
                              const slotInfo = getSlotLabel(meal.meal_type);
                              return (
                                <div key={meal.id} className="flex items-baseline gap-2">
                                  <span className="font-mono text-[10px] uppercase tracking-wider" style={{ color: "var(--color-ink-faint)", minWidth: 50 }}>
                                    {slotInfo.label}
                                  </span>
                                  <span className="font-display text-lg leading-tight" style={{ color: "var(--color-ink)" }}>
                                    {getRecipeName(meal)}
                                  </span>
                                </div>
                              );
                            })}
                        </div>
                        <button
                          onClick={() => removeMenuGroup(menuGroup.map((m) => m.id))}
                          className="mt-2 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ color: "var(--color-terracotta)" }}
                        >
                          ✕ supprimer le menu
                        </button>
                      </div>
                    )}

                    {standaloneMeals.map((meal) => (
                      <div key={meal.id} className="group flex items-baseline gap-2 mb-1">
                        <span className="font-display text-xl leading-tight flex-1" style={{ color: "var(--color-ink)" }}>
                          {getRecipeName(meal)}
                        </span>
                        <button
                          onClick={() => removeMeal(meal.id)}
                          className="text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ color: "var(--color-terracotta)" }}
                        >✕</button>
                      </div>
                    ))}

                    {isAdding ? (
                      <div className="mt-2 space-y-2">
                        <input
                          type="text"
                          value={recipeSearch}
                          onChange={(e) => setRecipeSearch(e.target.value)}
                          placeholder="Chercher une recette…"
                          className="w-full bg-[var(--color-cream)] border border-[var(--color-line)] rounded px-2 py-1.5 text-xs focus:outline-none focus:border-[var(--color-terracotta)]"
                          autoFocus
                        />
                        {recipeSearch && (
                          <div className="max-h-40 overflow-y-auto space-y-px">
                            {filteredRecipes.slice(0, 8).map((r) => (
                              <button
                                key={r.id}
                                onClick={() => addMeal(day.dayOfWeek, mealType, day.weekStart, r.id)}
                                className="w-full text-left px-2 py-1.5 text-xs hover:bg-[var(--color-cream-deep)] transition-colors"
                              >
                                <span className="font-medium">{r.name}</span>
                                {r.category && <span className="ml-1" style={{ color: "var(--color-ink-faint)" }}>— {r.category}</span>}
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
                              if (e.key === "Enter" && customName.trim()) addMeal(day.dayOfWeek, mealType, day.weekStart, undefined, customName);
                            }}
                            placeholder="Ou un nom libre…"
                            className="flex-1 bg-[var(--color-cream)] border border-[var(--color-line)] rounded px-2 py-1.5 text-xs"
                          />
                          <button
                            onClick={() => { setAddingSlot(null); setRecipeSearch(""); setCustomName(""); }}
                            className="text-xs px-2"
                            style={{ color: "var(--color-ink-mute)" }}
                          >✕</button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setAddingSlot({ day: day.dayOfWeek, type: mealType, weekStart: day.weekStart })}
                        className="w-full mt-2 py-1.5 text-xs transition-colors"
                        style={{
                          color: "var(--color-ink-mute)",
                          border: "1px dashed var(--color-line)",
                          borderRadius: 4,
                        }}
                      >
                        + ajouter
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto pb-24 md:pb-8">
      <PageHeader
        eyebrow="Planning"
        title={<>La semaine <em style={{ color: "var(--color-terracotta)", fontStyle: "italic" }}>au menu</em></>}
        subtitle="Glissez vos recettes, l'IA complète ce qui manque, la liste de courses se génère toute seule."
        actions={
          <>
            <Link href="/menu">
              <Button variant="secondary" size="sm">Composer un menu</Button>
            </Link>
            <Button variant="ink" size="sm" onClick={autoFillWeek} disabled={autoFilling}>
              {autoFilling ? "Génération…" : "✦ Auto-remplir"}
            </Button>
            {filledSlots > 0 && (
              <Button variant="primary" size="sm" onClick={addWeekToList}>
                Vers la liste
              </Button>
            )}
          </>
        }
      />

      {/* View toggle */}
      <div className="mb-2 flex gap-1 items-center">
        <span className="eyebrow mr-3">vue</span>
        <button
          onClick={() => setViewAll(false)}
          className="text-sm py-1 px-3 rounded-full transition-colors"
          style={{
            background: !viewAll ? "var(--color-ink)" : "transparent",
            color: !viewAll ? "var(--color-cream-pale)" : "var(--color-ink-mute)",
            border: "1px solid",
            borderColor: !viewAll ? "var(--color-ink)" : "var(--color-line)",
          }}
        >
          aujourd&apos;hui
        </button>
        <button
          onClick={() => setViewAll(true)}
          className="text-sm py-1 px-3 rounded-full transition-colors"
          style={{
            background: viewAll ? "var(--color-ink)" : "transparent",
            color: viewAll ? "var(--color-cream-pale)" : "var(--color-ink-mute)",
            border: "1px solid",
            borderColor: viewAll ? "var(--color-ink)" : "var(--color-line)",
          }}
        >
          21 jours
        </button>
      </div>

      <div ref={scrollBoxRef} className="mt-2">
        {displayDays.length === 0 ? (
          <EmptyState
            title="Rien à planifier"
            description="Ajoutez votre première recette pour commencer la semaine."
          />
        ) : (
          displayDays.map((day) => renderDayRow(day))
        )}
      </div>
    </div>
  );
}
