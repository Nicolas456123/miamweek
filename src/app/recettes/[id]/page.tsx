"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useToast } from "@/components/toast";
import { RecipePhoto } from "@/components/recipe-photo";

type Ingredient = {
  id?: number;
  name: string;
  quantity: number | null;
  unit: string | null;
  category: string | null;
};

type Recipe = {
  id: number;
  name: string;
  description: string | null;
  servings: number;
  category: string | null;
  prep_time: number | null;
  cook_time: number | null;
  difficulty: string | null;
  utensils: string | null;
  steps: string | null;
  photo_url?: string | null;
  photo_credit?: string | null;
  ingredients: Ingredient[];
};

function parseJSON<T>(val: string | null | undefined, fallback: T): T {
  if (!val) return fallback;
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
}

function formatTime(minutes: number): string {
  if (minutes < 60) return `${minutes}'`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, "0")}`;
}

function fmtQty(qty: number): string {
  if (Number.isInteger(qty)) return String(qty);
  return qty.toFixed(2).replace(/\.?0+$/, "");
}

const DIFFICULTY_STARS: Record<string, string> = {
  facile: "★",
  moyen: "★ ★",
  difficile: "★ ★ ★",
};

// Render title with last 1-2 words italicized terracotta
function renderTitle(name: string) {
  const parts = name.trim().split(" ");
  if (parts.length <= 1) {
    return (
      <span style={{ fontStyle: "italic", color: "var(--color-terracotta)" }}>
        {name}
      </span>
    );
  }
  // First word normal, rest italic terracotta
  return (
    <>
      {parts[0]}{" "}
      <span style={{ fontStyle: "italic", color: "var(--color-terracotta)" }}>
        {parts.slice(1).join(" ")}
      </span>
    </>
  );
}

export default function RecipeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { toast } = useToast();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetch(`/api/recipes/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data && !data.error) setRecipe(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const addAllToList = async () => {
    if (!recipe) return;
    setAdding(true);
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
    setAdding(false);
    toast(`${recipe.ingredients.length} ingrédients ajoutés à la liste.`);
  };

  if (loading) {
    return (
      <div className="pb-24 md:pb-8">
        <p className="eyebrow">chargement…</p>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="pb-24 md:pb-8">
        <p className="eyebrow mb-4">recette introuvable</p>
        <Link
          href="/recettes"
          className="text-sm hover:underline"
          style={{ color: "var(--color-terracotta-deep)" }}
        >
          ← Retour aux recettes
        </Link>
      </div>
    );
  }

  const utensils = parseJSON<string[]>(recipe.utensils, []);
  const steps = parseJSON<string[]>(recipe.steps, []);
  const totalTime = (recipe.prep_time || 0) + (recipe.cook_time || 0);

  return (
    <div className="pb-24 md:pb-8">
      {/* Eyebrow + back */}
      <div className="flex items-baseline justify-between mb-5">
        <p className="eyebrow flex items-center gap-2">
          {recipe.category && (
            <>
              <span style={{ color: "var(--color-terracotta-deep)" }}>
                Plat principal
              </span>
              <span style={{ color: "var(--color-ink-faint)" }}>·</span>
              <span>{recipe.category}</span>
            </>
          )}
        </p>
        <Link
          href="/recettes"
          className="text-sm hover:underline"
          style={{ color: "var(--color-ink-mute)" }}
        >
          ← Retour aux recettes
        </Link>
      </div>

      {/* Hero with split layout : title + photo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-8 mb-8 border-b" style={{ borderColor: "var(--color-line)" }}>
        <div>
          <h1
            className="font-display tracking-tight"
            style={{
              color: "var(--color-ink)",
              fontSize: "clamp(36px, 5vw, 64px)",
              lineHeight: 1.0,
              letterSpacing: "-0.02em",
            }}
          >
            {renderTitle(recipe.name)}
          </h1>

          {recipe.description && (
            <p
              className="mt-5 text-base leading-relaxed"
              style={{ color: "var(--color-ink-mute)", maxWidth: "60ch" }}
            >
              {recipe.description}
            </p>
          )}

          {/* 4 stats */}
          <div className="mt-8 grid grid-cols-4 gap-4 pb-6 border-b" style={{ borderColor: "var(--color-line)" }}>
            <Stat
              value={recipe.prep_time ? formatTime(recipe.prep_time) : "—"}
              label="Préparation"
            />
            <Stat
              value={recipe.cook_time ? formatTime(recipe.cook_time) : "—"}
              label="Cuisson"
            />
            <Stat value={recipe.servings} label="Portions" />
            <Stat
              value={recipe.difficulty ? DIFFICULTY_STARS[recipe.difficulty] || recipe.difficulty : "—"}
              label="Difficulté"
            />
          </div>

          {/* Actions */}
          <div className="mt-6 flex flex-wrap gap-2">
            <Link
              href="/planning"
              className="rounded-full px-5 py-2.5 text-sm font-medium transition-colors"
              style={{
                background: "var(--color-terracotta)",
                color: "var(--color-cream-pale)",
                border: "1px solid var(--color-terracotta)",
              }}
            >
              Planifier ce repas
            </Link>
            <button
              onClick={addAllToList}
              disabled={adding}
              className="rounded-full px-5 py-2.5 text-sm transition-colors disabled:opacity-50"
              style={{
                background: "var(--color-cream-pale)",
                color: "var(--color-ink-soft)",
                border: "1px solid var(--color-line)",
              }}
            >
              {adding ? "Ajout…" : "Ajouter à la liste"}
            </button>
          </div>
        </div>

        <div>
          <RecipePhoto
            recipe={recipe}
            persist
            className="w-full aspect-[4/3]"
            placeholderTone="terra"
          />
          {totalTime > 0 && (
            <p
              className="mt-3 font-mono text-xs tnum text-right"
              style={{ color: "var(--color-ink-mute)", letterSpacing: "0.04em" }}
            >
              TOTAL · {formatTime(totalTime)}
            </p>
          )}
        </div>
      </div>

      {/* 2 columns : ingrédients + préparation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Ingrédients */}
        <section>
          <header className="flex items-baseline gap-3 mb-6">
            <span
              className="font-mono text-xs tnum"
              style={{ color: "var(--color-ink-faint)", letterSpacing: "0.08em" }}
            >
              01
            </span>
            <h2
              className="font-display tracking-tight"
              style={{ fontSize: 28, color: "var(--color-ink)", lineHeight: 1.05, fontStyle: "italic" }}
            >
              Ingrédients
            </h2>
            <span
              className="font-mono text-xs tnum ml-auto"
              style={{ color: "var(--color-ink-mute)", letterSpacing: "0.06em" }}
            >
              POUR {recipe.servings} PERS · {String(recipe.ingredients.length).padStart(2, "0")}
            </span>
          </header>
          {recipe.ingredients.length === 0 ? (
            <p className="text-sm italic" style={{ color: "var(--color-ink-faint)" }}>
              Pas d&apos;ingrédients renseignés.
            </p>
          ) : (
            <ul>
              {recipe.ingredients.map((ing, i) => (
                <li
                  key={i}
                  className="flex items-baseline justify-between gap-3 py-2.5 border-b"
                  style={{ borderColor: "var(--color-line-soft)" }}
                >
                  <span className="text-sm" style={{ color: "var(--color-ink)" }}>
                    {ing.name}
                  </span>
                  <span
                    className="font-mono text-xs tnum shrink-0"
                    style={{ color: "var(--color-ink-mute)", letterSpacing: "0.04em" }}
                  >
                    {ing.quantity ? `${fmtQty(ing.quantity)} ${ing.unit || ""}` : "—"}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {utensils.length > 0 && (
            <div className="mt-8">
              <p className="eyebrow mb-3">ustensiles</p>
              <div className="flex flex-wrap gap-2">
                {utensils.map((u, i) => (
                  <span
                    key={i}
                    className="font-mono text-[11px] uppercase tracking-wider rounded-full px-3 py-1"
                    style={{
                      background: "var(--color-cream-deep)",
                      color: "var(--color-ink-soft)",
                      border: "1px solid var(--color-line)",
                      letterSpacing: "0.06em",
                    }}
                  >
                    {u}
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Préparation */}
        <section>
          <header className="flex items-baseline gap-3 mb-6">
            <span
              className="font-mono text-xs tnum"
              style={{ color: "var(--color-ink-faint)", letterSpacing: "0.08em" }}
            >
              02
            </span>
            <h2
              className="font-display tracking-tight"
              style={{ fontSize: 28, color: "var(--color-ink)", lineHeight: 1.05, fontStyle: "italic" }}
            >
              Préparation
            </h2>
          </header>
          {steps.length === 0 ? (
            <p className="text-sm italic" style={{ color: "var(--color-ink-faint)" }}>
              Pas d&apos;étapes renseignées.
            </p>
          ) : (
            <ol className="space-y-5">
              {steps.map((step, i) => (
                <li key={i} className="flex gap-4">
                  <span
                    className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center font-mono text-sm tnum"
                    style={{
                      border: "1.5px solid var(--color-line)",
                      color: "var(--color-terracotta-deep)",
                      background: "var(--color-cream-pale)",
                    }}
                  >
                    {i + 1}
                  </span>
                  <p
                    className="text-sm leading-relaxed pt-1.5"
                    style={{ color: "var(--color-ink-soft)" }}
                  >
                    {step}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div>
      <p
        className="font-display tnum leading-none"
        style={{ fontSize: 24, color: "var(--color-ink)" }}
      >
        {value}
      </p>
      <p className="eyebrow mt-1.5">{label}</p>
    </div>
  );
}
