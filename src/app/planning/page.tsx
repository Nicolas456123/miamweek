"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Link from "next/link";
import { getMonday, DAYS, MEAL_TYPES, MEAL_SLOTS } from "@/lib/utils";
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
  recipeName?: string;
  recipeCategory?: string;
};

type MealConfig = {
  mode: "cook" | "skip";
  persons: number;
};

const DEFAULT_LUNCH: MealConfig = { mode: "skip", persons: 1 };
const DEFAULT_DINNER: MealConfig = { mode: "cook", persons: 2 };

export default function PlanningPage() {
  const [meals, setMeals] = useState<MealEntry[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const { toast } = useToast();
  const [viewAll, setViewAll] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);
  const [addingSlot, setAddingSlot] = useState<{
    day: number;
    type: string;
    weekStart: string;
  } | null>(null);
  const [recipeSearch, setRecipeSearch] = useState("");
  const [customName, setCustomName] = useState("");
  const [mealConfigs, setMealConfigs] = useState<Record<string, MealConfig>>({});
  const [autoFilling, setAutoFilling] = useState(false);
  const todayRef = useRef<HTMLDivElement>(null);
  const scrollBoxRef = useRef<HTMLDivElement>(null);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const todayDayOfWeek = useMemo(() => {
    const day = today.getDay();
    return day === 0 ? 6 : day - 1;
  }, [today]);

  const currentMonday = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + weekOffset * 7);
    return getMonday(d);
  }, [weekOffset]);

  const getMealConfig = (day: number, meal: "lunch" | "dinner"): MealConfig =>
    mealConfigs[`${day}_${meal}`] || (meal === "lunch" ? DEFAULT_LUNCH : DEFAULT_DINNER);

  const toggleMealMode = (day: number, meal: "lunch" | "dinner") => {
    const key = `${day}_${meal}`;
    const current = getMealConfig(day, meal);
    setMealConfigs((prev) => ({
      ...prev,
      [key]: { ...current, mode: current.mode === "cook" ? "skip" : "cook" },
    }));
  };

  const setMealPersons = (day: number, meal: "lunch" | "dinner", persons: number) => {
    const key = `${day}_${meal}`;
    setMealConfigs((prev) => ({
      ...prev,
      [key]: { ...getMealConfig(day, meal), persons: Math.max(1, persons) },
    }));
  };

  const fetchMeals = useCallback(() => {
    if (viewAll) {
      // Fetch current + next week
      const thisMonday = getMonday(new Date());
      const nextMondayDate = new Date(thisMonday);
      nextMondayDate.setDate(nextMondayDate.getDate() + 7);
      const nextMonday = nextMondayDate.toISOString().split("T")[0];

      Promise.all([
        fetch(`/api/meal-plan?weekStart=${thisMonday}`).then((r) => r.json()),
        fetch(`/api/meal-plan?weekStart=${nextMonday}`).then((r) => r.json()),
      ])
        .then(([w1, w2]) => {
          const all = [
            ...(Array.isArray(w1) ? w1 : []),
            ...(Array.isArray(w2) ? w2 : []),
          ];
          setMeals(all);
        })
        .catch(console.error);
    } else {
      fetch(`/api/meal-plan?weekStart=${currentMonday}`)
        .then((r) => r.json())
        .then((data) => setMeals(Array.isArray(data) ? data : []))
        .catch(console.error);
    }
  }, [currentMonday, viewAll]);

  useEffect(() => {
    fetchMeals();
  }, [fetchMeals]);

  useEffect(() => {
    fetch("/api/recipes")
      .then((r) => r.json())
      .then((data) => setRecipes(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, []);

  // Auto-scroll to today when viewing all days
  useEffect(() => {
    if (viewAll && todayRef.current && scrollBoxRef.current) {
      setTimeout(() => {
        const container = scrollBoxRef.current!;
        const card = todayRef.current!;
        container.scrollTop = card.offsetTop - container.offsetTop;
      }, 100);
    }
  }, [viewAll]);

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

  const removeMenuGroup = async (mealIds: number[]) => {
    for (const id of mealIds) {
      await fetch(`/api/meal-plan?id=${id}`, { method: "DELETE" });
    }
    fetchMeals();
  };

  const addWeekToList = async () => {
    const recipeMeals = meals.filter((m) => m.recipe_id);
    if (recipeMeals.length === 0) return;

    for (const meal of recipeMeals) {
      const res = await fetch(`/api/recipes/${meal.recipe_id}`);
      const recipe = await res.json();
      if (!recipe.ingredients) continue;

      for (const ing of recipe.ingredients) {
        await fetch("/api/list", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productName: ing.name,
            quantity: ing.quantity || 1,
            unit: ing.unit || "pcs",
            category: ing.category || "Autre",
            source: "recipe",
            listStatus: "prep",
            sourceRecipe: recipe.name,
          }),
        });
      }
    }
    toast(`${recipeMeals.length} recette(s) ajoutées à la liste`);
  };

  const autoFillWeek = async () => {
    setAutoFilling(true);
    try {
      const dayDescriptions = DAYS.map((name, i) => {
        const lunchConfig = getMealConfig(i, "lunch");
        const dinnerConfig = getMealConfig(i, "dinner");
        const lunchExisting = getMealsForPeriod(i, currentMonday, "lunch").length;
        const dinnerExisting = getMealsForPeriod(i, currentMonday, "dinner").length;

        const lunchDesc = lunchConfig.mode === "skip" ? "pas de repas"
          : `cuisine pour ${lunchConfig.persons} personne(s)${lunchExisting > 0 ? ` (${lunchExisting} repas déjà)` : ""}`;

        const dinnerDesc = dinnerConfig.mode === "skip" ? "pas de repas"
          : `cuisine pour ${dinnerConfig.persons} personne(s)${dinnerExisting > 0 ? ` (${dinnerExisting} repas déjà)` : ""}`;

        return `${name}: Midi=${lunchDesc}, Soir=${dinnerDesc}`;
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

          const matchedRecipe = recipes.find(
            (r) => r.name.toLowerCase() === (meal.name || "").toLowerCase()
          );

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
    } catch (err) {
      console.error("Auto-fill error:", err);
    }
    setAutoFilling(false);
  };

  const getMealsForPeriod = (day: number, weekStart: string, period: "lunch" | "dinner") =>
    meals.filter(
      (m) => m.day_of_week === day && m.week_start === weekStart && (m.meal_type === period || m.meal_type.startsWith(`${period}_`))
    );

  const getSlotLabel = (mealType: string) => {
    const slot = MEAL_SLOTS[mealType as keyof typeof MEAL_SLOTS];
    return slot || { label: mealType, icon: "🍽️", color: "text-muted" };
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
    const subSlotMeals = periodMeals.filter((m) => m.meal_type.includes("_"));
    const standaloneMeals = periodMeals.filter((m) => !m.meal_type.includes("_"));
    const menuGroup = subSlotMeals.length > 0 ? subSlotMeals : null;
    return { menuGroup, standaloneMeals };
  };

  // Build list of days to display
  const displayDays = useMemo(() => {
    if (!viewAll) {
      // Just today
      return [{
        date: today,
        dayOfWeek: todayDayOfWeek,
        weekStart: currentMonday,
        isToday: true,
        isPast: false,
      }];
    }

    // All days: from today to 13 days ahead (2 weeks)
    const days: { date: Date; dayOfWeek: number; weekStart: string; isToday: boolean; isPast: boolean }[] = [];
    // Include a few past days for context (from Monday of current week)
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

  // Render a single day card
  const renderDayCard = (day: typeof displayDays[0]) => {
    const dayLabel = day.date.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });

    return (
      <div
        key={`${day.weekStart}-${day.dayOfWeek}`}
        ref={day.isToday ? todayRef : undefined}
        className={`bg-card border rounded-xl overflow-hidden transition-opacity ${
          day.isToday
            ? "border-primary border-2 shadow-sm"
            : day.isPast
              ? "border-border opacity-60"
              : "border-border"
        }`}
      >
        {/* Day header */}
        <div
          className={`px-4 py-2.5 flex items-center gap-2 ${
            day.isToday ? "bg-primary-light" : "bg-card-hover"
          }`}
        >
          <span className={`text-sm font-bold capitalize ${day.isToday ? "text-primary" : "text-foreground"}`}>
            {dayLabel}
          </span>
          {day.isToday && (
            <span className="text-xs bg-primary text-white px-2 py-0.5 rounded-full font-medium">
              Aujourd&apos;hui
            </span>
          )}
        </div>

        {/* Meal slots */}
        <div className="grid grid-cols-2 divide-x divide-border">
          {(["lunch", "dinner"] as const).map((mealType) => {
            const config = getMealConfig(day.dayOfWeek, mealType);
            const { menuGroup, standaloneMeals } = groupMealsForPeriod(day.dayOfWeek, day.weekStart, mealType);
            const isAdding =
              addingSlot?.day === day.dayOfWeek &&
              addingSlot?.type === mealType &&
              addingSlot?.weekStart === day.weekStart;

            return (
              <div key={mealType} className="min-h-[80px]">
                {/* Meal header */}
                <div className="px-3 pt-2 pb-1 flex items-center justify-between">
                  <p className="text-xs text-muted font-medium">
                    {MEAL_TYPES[mealType]}
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      title={config.mode === "cook" ? "Désactiver ce repas" : "Activer ce repas"}
                      onClick={() => toggleMealMode(day.dayOfWeek, mealType)}
                      className={`w-6 h-6 rounded-md text-xs flex items-center justify-center transition-colors ${
                        config.mode === "cook"
                          ? "bg-primary text-white"
                          : "bg-background border border-border text-muted hover:text-foreground"
                      }`}
                    >
                      {config.mode === "cook" ? "👨‍🍳" : "—"}
                    </button>
                    {config.mode === "cook" && (
                      <div className="flex items-center gap-0.5 ml-1 bg-background border border-border rounded-md px-0.5">
                        <button
                          onClick={() => setMealPersons(day.dayOfWeek, mealType, config.persons - 1)}
                          className="w-4 h-4 text-[10px] font-bold text-muted hover:text-foreground"
                        >
                          -
                        </button>
                        <span className="text-[10px] font-semibold w-3 text-center">{config.persons}</span>
                        <button
                          onClick={() => setMealPersons(day.dayOfWeek, mealType, config.persons + 1)}
                          className="w-4 h-4 text-[10px] font-bold text-muted hover:text-foreground"
                        >
                          +
                        </button>
                        <span className="text-[8px] text-muted">p.</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Meal content */}
                {config.mode === "skip" ? (
                  <div className="px-3 py-3 text-center text-xs text-muted italic bg-gray-50">
                    —
                  </div>
                ) : (
                  <div className="px-3 pb-3">
                    {/* Composed menu group */}
                    {menuGroup && menuGroup.length > 0 && (
                      <div className="group mb-1.5 bg-background border border-border rounded-lg overflow-hidden">
                        <div className="divide-y divide-border/50">
                          {menuGroup
                            .sort((a, b) => {
                              const order = ["entree", "plat", "dessert", "boisson"];
                              const aIdx = order.findIndex((o) => a.meal_type.endsWith(o));
                              const bIdx = order.findIndex((o) => b.meal_type.endsWith(o));
                              return aIdx - bIdx;
                            })
                            .map((meal) => {
                              const slotInfo = getSlotLabel(meal.meal_type);
                              return (
                                <div
                                  key={meal.id}
                                  className="flex items-center gap-2 px-2.5 py-1.5 text-sm"
                                >
                                  <span className={`text-xs ${slotInfo.color}`}>
                                    {slotInfo.icon}
                                  </span>
                                  <span className="font-medium flex-1">
                                    {getRecipeName(meal)}
                                  </span>
                                </div>
                              );
                            })}
                        </div>
                        <div className="flex justify-end px-2 py-1 bg-gray-50/50">
                          <button
                            onClick={() => removeMenuGroup(menuGroup.map((m) => m.id))}
                            className="text-muted hover:text-danger text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            Supprimer le menu
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Standalone meals */}
                    {standaloneMeals.map((meal) => (
                      <div
                        key={meal.id}
                        className="group flex items-center gap-2 mb-1.5"
                      >
                        <div className="flex-1 bg-background border border-border rounded-lg px-2.5 py-1.5 text-sm">
                          <span className="font-medium">
                            {getRecipeName(meal)}
                          </span>
                        </div>
                        <button
                          onClick={() => removeMeal(meal.id)}
                          className="text-muted hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      </div>
                    ))}

                    {/* Add meal */}
                    {isAdding ? (
                      <div className="mt-1 space-y-2">
                        <input
                          type="text"
                          value={recipeSearch}
                          onChange={(e) => setRecipeSearch(e.target.value)}
                          placeholder="Chercher une recette..."
                          className="w-full bg-background border border-border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                          autoFocus
                        />
                        {recipeSearch && (
                          <div className="max-h-40 overflow-y-auto space-y-0.5">
                            {filteredRecipes.slice(0, 8).map((r) => (
                              <button
                                key={r.id}
                                onClick={() => addMeal(day.dayOfWeek, mealType, day.weekStart, r.id)}
                                className="w-full text-left px-2 py-1.5 rounded-lg text-xs hover:bg-primary-light hover:text-primary transition-colors"
                              >
                                <span className="font-medium">{r.name}</span>
                                {r.category && (
                                  <span className="ml-1 text-muted">— {r.category}</span>
                                )}
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
                              if (e.key === "Enter" && customName.trim())
                                addMeal(day.dayOfWeek, mealType, day.weekStart, undefined, customName);
                            }}
                            placeholder="Ou tape un nom libre..."
                            className="flex-1 bg-background border border-border rounded-lg px-2 py-1.5 text-xs"
                          />
                          <button
                            onClick={() => {
                              setAddingSlot(null);
                              setRecipeSearch("");
                              setCustomName("");
                            }}
                            className="text-xs text-muted px-2"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setAddingSlot({ day: day.dayOfWeek, type: mealType, weekStart: day.weekStart })}
                        className="w-full mt-1 py-1.5 border border-dashed border-border rounded-lg text-xs text-muted hover:border-primary hover:text-primary transition-colors"
                      >
                        + Ajouter
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
    <div className="max-w-5xl mx-auto flex flex-col h-[calc(100vh-160px)] md:h-[calc(100vh-120px)]">
      {/* Header */}
      <div className="mb-3 shrink-0">
        <h1 className="text-xl font-bold mb-2">Planning repas</h1>
        <div className="flex gap-2 flex-wrap">
          <Link
            href="/menu"
            className="px-3 py-2 bg-card border border-border rounded-xl text-sm font-medium hover:shadow-sm transition-shadow"
          >
            🍽️ Composer un menu
          </Link>
          <button
            onClick={autoFillWeek}
            disabled={autoFilling}
            className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 disabled:opacity-50 transition-colors"
          >
            {autoFilling ? "Génération..." : "✨ Auto-remplir"}
          </button>
          {filledSlots > 0 && (
            <button
              onClick={addWeekToList}
              className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-hover transition-colors"
            >
              📝 Ajouter à ma liste
            </button>
          )}
        </div>
      </div>

      {/* View toggle */}
      <div className="flex gap-2 mb-3 shrink-0">
        <div className="flex bg-card border border-border rounded-xl overflow-hidden">
          <button
            onClick={() => setViewAll(false)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              !viewAll ? "bg-primary text-white" : "text-muted hover:text-foreground"
            }`}
          >
            Aujourd&apos;hui
          </button>
          <button
            onClick={() => setViewAll(true)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              viewAll ? "bg-primary text-white" : "text-muted hover:text-foreground"
            }`}
          >
            Tous les jours
          </button>
        </div>
      </div>

      {/* Days */}
      <div ref={scrollBoxRef} className="space-y-2 overflow-y-auto flex-1 min-h-0 pb-4">
        {displayDays.map((day) => renderDayCard(day))}
      </div>
    </div>
  );
}
