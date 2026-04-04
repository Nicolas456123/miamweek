"use client";

import { useState, useEffect, useCallback } from "react";
import { DAYS, MEAL_TYPES, getMonday } from "@/lib/utils";

type MealPlanItem = {
  id: number;
  weekStart: string;
  dayOfWeek: number;
  mealType: string;
  recipeId: number | null;
  customName: string | null;
};

type Recipe = {
  id: number;
  name: string;
};

export default function PlanningPage() {
  const [weekStart, setWeekStart] = useState(getMonday());
  const [meals, setMeals] = useState<MealPlanItem[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [editing, setEditing] = useState<{
    day: number;
    type: string;
  } | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [selectedRecipeId, setSelectedRecipeId] = useState<number | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const fetchMeals = useCallback(() => {
    fetch(`/api/meal-plan?weekStart=${weekStart}`)
      .then((r) => r.json())
      .then((data) => setMeals(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, [weekStart]);

  useEffect(() => {
    fetchMeals();
    fetch("/api/recipes")
      .then((r) => r.json())
      .then((data) => setRecipes(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, [fetchMeals]);

  const getMeal = (day: number, type: string) =>
    meals.find((m) => m.dayOfWeek === day && m.mealType === type);

  const saveMeal = async (day: number, type: string) => {
    if (!inputValue && !selectedRecipeId) return;
    const existing = getMeal(day, type);

    if (existing) {
      await fetch("/api/meal-plan", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: existing.id }),
      });
    }

    await fetch("/api/meal-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        weekStart,
        dayOfWeek: day,
        mealType: type,
        recipeId: selectedRecipeId,
        customName: selectedRecipeId ? null : inputValue,
      }),
    });

    setEditing(null);
    setInputValue("");
    setSelectedRecipeId(null);
    fetchMeals();
  };

  const removeMeal = async (id: number) => {
    await fetch("/api/meal-plan", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchMeals();
  };

  const changeWeek = (delta: number) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7 * delta);
    setWeekStart(getMonday(d));
  };

  const generateWithAI = async () => {
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt:
            "Génère un planning de repas pour une semaine complète (lundi à dimanche, midi et soir). Propose des plats variés, équilibrés, faciles à préparer pour 2 personnes. Inclus des plats français et internationaux.",
        }),
      });
      const suggestions = await res.json();

      if (suggestions.meals) {
        for (const meal of meals) {
          await fetch("/api/meal-plan", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: meal.id }),
          });
        }

        for (const meal of suggestions.meals) {
          await fetch("/api/meal-plan", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              weekStart,
              dayOfWeek: meal.dayOfWeek,
              mealType: meal.mealType,
              customName: meal.name,
            }),
          });
        }
        fetchMeals();
      }
    } catch (err) {
      console.error("AI generation failed:", err);
    }
    setAiLoading(false);
  };

  const formatWeekRange = () => {
    const start = new Date(weekStart);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    const fmt = (d: Date) =>
      d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
    return `${fmt(start)} - ${fmt(end)}`;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => changeWeek(-1)}
            className="px-3 py-1.5 bg-card border border-border rounded-lg hover:bg-card-hover text-sm"
          >
            &larr;
          </button>
          <h1 className="text-lg font-semibold">{formatWeekRange()}</h1>
          <button
            onClick={() => changeWeek(1)}
            className="px-3 py-1.5 bg-card border border-border rounded-lg hover:bg-card-hover text-sm"
          >
            &rarr;
          </button>
        </div>
        <button
          onClick={generateWithAI}
          disabled={aiLoading}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover text-sm font-medium disabled:opacity-50"
        >
          {aiLoading ? "Génération..." : "Générer avec IA"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
        {DAYS.map((day, dayIndex) => (
          <div
            key={day}
            className="bg-card border border-border rounded-xl p-3"
          >
            <h3 className="text-sm font-semibold text-center mb-2 text-primary">
              {day}
            </h3>
            {(Object.keys(MEAL_TYPES) as Array<keyof typeof MEAL_TYPES>).map(
              (type) => {
                const meal = getMeal(dayIndex, type);
                const isEditing =
                  editing?.day === dayIndex && editing?.type === type;

                return (
                  <div key={type} className="mb-2">
                    <div className="text-xs text-muted mb-1">
                      {MEAL_TYPES[type]}
                    </div>

                    {isEditing ? (
                      <div className="space-y-1">
                        <select
                          value={selectedRecipeId || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSelectedRecipeId(val ? Number(val) : null);
                            if (val) {
                              const recipe = recipes.find(
                                (r) => r.id === Number(val)
                              );
                              if (recipe) setInputValue(recipe.name);
                            }
                          }}
                          className="w-full bg-background border border-border rounded px-2 py-1 text-xs"
                        >
                          <option value="">Plat libre...</option>
                          {recipes.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.name}
                            </option>
                          ))}
                        </select>
                        {!selectedRecipeId && (
                          <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) =>
                              e.key === "Enter" && saveMeal(dayIndex, type)
                            }
                            placeholder="Nom du plat"
                            className="w-full bg-background border border-border rounded px-2 py-1 text-xs"
                            autoFocus
                          />
                        )}
                        <div className="flex gap-1">
                          <button
                            onClick={() => saveMeal(dayIndex, type)}
                            className="text-xs bg-primary text-white px-2 py-0.5 rounded"
                          >
                            OK
                          </button>
                          <button
                            onClick={() => {
                              setEditing(null);
                              setInputValue("");
                              setSelectedRecipeId(null);
                            }}
                            className="text-xs text-muted px-2 py-0.5"
                          >
                            Annuler
                          </button>
                        </div>
                      </div>
                    ) : meal ? (
                      <div className="group flex items-center gap-1">
                        <span className="text-xs truncate flex-1">
                          {meal.customName ||
                            recipes.find((r) => r.id === meal.recipeId)?.name ||
                            "..."}
                        </span>
                        <button
                          onClick={() => {
                            setEditing({ day: dayIndex, type });
                            setInputValue(meal.customName || "");
                            setSelectedRecipeId(meal.recipeId);
                          }}
                          className="text-xs text-muted opacity-0 group-hover:opacity-100"
                        >
                          ✏
                        </button>
                        <button
                          onClick={() => removeMeal(meal.id)}
                          className="text-xs text-danger opacity-0 group-hover:opacity-100"
                        >
                          x
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setEditing({ day: dayIndex, type })}
                        className="w-full text-xs text-muted border border-dashed border-border rounded py-2 hover:border-primary hover:text-primary"
                      >
                        + Ajouter
                      </button>
                    )}
                  </div>
                );
              }
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
