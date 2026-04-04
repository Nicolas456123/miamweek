"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { getMonday, DAYS, MEAL_TYPES, MEAL_SLOTS } from "@/lib/utils";

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
  // joined from recipe
  recipeName?: string;
  recipeCategory?: string;
};

type ViewMode = "today" | "week" | "next";

export default function PlanningPage() {
  const [meals, setMeals] = useState<MealEntry[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [weekOffset, setWeekOffset] = useState(0);
  const [addingSlot, setAddingSlot] = useState<{
    day: number;
    type: string;
  } | null>(null);
  const [recipeSearch, setRecipeSearch] = useState("");
  const [customName, setCustomName] = useState("");

  const currentMonday = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + weekOffset * 7);
    return getMonday(d);
  }, [weekOffset]);

  const todayDayOfWeek = useMemo(() => {
    const d = new Date();
    const day = d.getDay();
    return day === 0 ? 6 : day - 1; // 0=lundi ... 6=dimanche
  }, []);

  const fetchMeals = useCallback(() => {
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
      .then((data) => setRecipes(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, []);

  const addMeal = async (
    dayOfWeek: number,
    mealType: string,
    recipeId?: number,
    name?: string
  ) => {
    await fetch("/api/meal-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        weekStart: currentMonday,
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

  // Add all ingredients from planned meals to shopping list
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
    alert(
      `Ingrédients de ${recipeMeals.length} recette(s) ajoutés à la liste !`
    );
  };

  const getMealsForSlot = (day: number, type: string) =>
    meals.filter(
      (m) => m.day_of_week === day && m.meal_type === type
    );

  const getMealsForPeriod = (day: number, period: "lunch" | "dinner") =>
    meals.filter(
      (m) => m.day_of_week === day && (m.meal_type === period || m.meal_type.startsWith(`${period}_`))
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

  const getRecipeCategory = (meal: MealEntry) => {
    if (meal.recipe_id) {
      return recipes.find((r) => r.id === meal.recipe_id)?.category || null;
    }
    return null;
  };

  const filteredRecipes = useMemo(() => {
    if (!recipeSearch) return recipes;
    const s = recipeSearch.toLowerCase();
    return recipes.filter((r) => r.name.toLowerCase().includes(s));
  }, [recipes, recipeSearch]);

  // Determine visible days based on view mode
  const visibleDays = useMemo(() => {
    if (viewMode === "today") return [todayDayOfWeek];
    return [0, 1, 2, 3, 4, 5, 6];
  }, [viewMode, todayDayOfWeek]);

  const weekLabel = useMemo(() => {
    const monday = new Date(currentMonday);
    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 6);
    const fmt = (d: Date) =>
      d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
    return `${fmt(monday)} — ${fmt(sunday)}`;
  }, [currentMonday]);

  const getDayDate = (dayIndex: number) => {
    const d = new Date(currentMonday);
    d.setDate(d.getDate() + dayIndex);
    return d.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
    });
  };

  const filledSlots = meals.length;
  const totalSlots = 14; // 7 days x 2 meals
  const fillPercent = Math.round((filledSlots / totalSlots) * 100);

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold">Planning repas</h1>
          <p className="text-sm text-muted">{weekLabel}</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/menu"
            className="px-3 py-2 bg-card border border-border rounded-xl text-sm font-medium hover:shadow-sm transition-shadow"
          >
            🍽️ Composer un menu
          </Link>
          {filledSlots > 0 && (
            <button
              onClick={addWeekToList}
              className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-hover transition-colors"
            >
              Ajouter à ma liste
            </button>
          )}
        </div>
      </div>

      {/* View mode + week nav */}
      <div className="flex gap-2 mb-4">
        <div className="flex bg-card border border-border rounded-xl overflow-hidden">
          {(
            [
              { key: "today", label: "Aujourd'hui" },
              { key: "week", label: "Semaine" },
              { key: "next", label: "S. prochaine" },
            ] as const
          ).map((v) => (
            <button
              key={v.key}
              onClick={() => {
                setViewMode(v.key);
                if (v.key === "today" || v.key === "week") setWeekOffset(0);
                if (v.key === "next") setWeekOffset(1);
              }}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                viewMode === v.key
                  ? "bg-primary text-white"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
        {viewMode === "week" && (
          <div className="flex gap-1 ml-auto">
            <button
              onClick={() => setWeekOffset((w) => w - 1)}
              className="px-3 py-2 bg-card border border-border rounded-xl text-sm hover:shadow-sm"
            >
              ← Sem. préc.
            </button>
            {weekOffset !== 0 && (
              <button
                onClick={() => setWeekOffset(0)}
                className="px-3 py-2 bg-card border border-border rounded-xl text-sm text-primary font-medium hover:shadow-sm"
              >
                Aujourd&apos;hui
              </button>
            )}
            <button
              onClick={() => setWeekOffset((w) => w + 1)}
              className="px-3 py-2 bg-card border border-border rounded-xl text-sm hover:shadow-sm"
            >
              Sem. suiv. →
            </button>
          </div>
        )}
      </div>

      {/* Progress bar */}
      {viewMode !== "today" && (
        <div className="bg-card border border-border rounded-xl p-3 mb-4">
          <div className="flex justify-between text-xs text-muted mb-1">
            <span>
              {filledSlots}/{totalSlots} repas planifiés
            </span>
            <span>{fillPercent}%</span>
          </div>
          <div className="w-full bg-border rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${fillPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Planning grid */}
      <div className="space-y-2">
        {visibleDays.map((dayIndex) => {
          const isToday =
            weekOffset === 0 && dayIndex === todayDayOfWeek;

          return (
            <div
              key={dayIndex}
              className={`bg-card border rounded-xl overflow-hidden ${
                isToday ? "border-primary border-2 shadow-sm" : "border-border"
              }`}
            >
              {/* Day header */}
              <div
                className={`px-4 py-2 flex items-center justify-between ${
                  isToday ? "bg-primary-light" : "bg-card-hover"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm font-bold ${
                      isToday ? "text-primary" : "text-foreground"
                    }`}
                  >
                    {DAYS[dayIndex]}
                  </span>
                  <span className="text-xs text-muted">
                    {getDayDate(dayIndex)}
                  </span>
                  {isToday && (
                    <span className="text-xs bg-primary text-white px-2 py-0.5 rounded-full font-medium">
                      Aujourd&apos;hui
                    </span>
                  )}
                </div>
              </div>

              {/* Meal slots */}
              <div className="grid grid-cols-2 divide-x divide-border">
                {(["lunch", "dinner"] as const).map((mealType) => {
                  const periodMeals = getMealsForPeriod(dayIndex, mealType);
                  const isAdding =
                    addingSlot?.day === dayIndex &&
                    addingSlot?.type === mealType;

                  return (
                    <div key={mealType} className="p-3 min-h-[80px]">
                      <p className="text-xs text-muted font-medium mb-2">
                        {MEAL_TYPES[mealType]}
                      </p>

                      {/* Existing meals with sub-category labels */}
                      {periodMeals.map((meal) => {
                        const slotInfo = getSlotLabel(meal.meal_type);
                        const isSubSlot = meal.meal_type.includes("_");
                        return (
                          <div
                            key={meal.id}
                            className="group flex items-center gap-2 mb-1.5"
                          >
                            <div className="flex-1 bg-background border border-border rounded-lg px-2.5 py-1.5 text-sm">
                              {isSubSlot && (
                                <span className={`text-xs ${slotInfo.color} mr-1`}>
                                  {slotInfo.icon}
                                </span>
                              )}
                              <span className="font-medium">
                                {getRecipeName(meal)}
                              </span>
                            </div>
                            <button
                              onClick={() => removeMeal(meal.id)}
                              className="text-muted hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                            >
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                              </svg>
                            </button>
                          </div>
                        );
                      })}

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
                                  onClick={() =>
                                    addMeal(dayIndex, mealType, r.id)
                                  }
                                  className="w-full text-left px-2 py-1.5 rounded-lg text-xs hover:bg-primary-light hover:text-primary transition-colors"
                                >
                                  <span className="font-medium">{r.name}</span>
                                  {r.category && (
                                    <span className="ml-1 text-muted">
                                      — {r.category}
                                    </span>
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
                                  addMeal(
                                    dayIndex,
                                    mealType,
                                    undefined,
                                    customName
                                  );
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
                          onClick={() =>
                            setAddingSlot({ day: dayIndex, type: mealType })
                          }
                          className="w-full mt-1 py-1.5 border border-dashed border-border rounded-lg text-xs text-muted hover:border-primary hover:text-primary transition-colors"
                        >
                          + Ajouter
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
