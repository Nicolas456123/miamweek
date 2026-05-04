"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/toast";

type Recipe = {
  id: number;
  name: string;
  description: string | null;
  servings: number;
  category: string | null;
  ingredients: { name: string; quantity: number | null; unit: string | null; category: string | null }[];
};

type Suggestion = { name: string; description: string };

const NUMERALS_FR = ["zéro", "une", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix"];

export default function MenuPage() {
  const { toast } = useToast();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedPlat, setSelectedPlat] = useState<Recipe | null>(null);
  const [persons, setPersons] = useState(3);
  const [suggestions, setSuggestions] = useState<{
    entree?: Suggestion;
    dessert?: Suggestion;
    boisson?: Suggestion;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/recipes")
      .then((r) => r.json())
      .then((data) => setRecipes(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, []);

  const getSuggestions = async () => {
    if (!selectedPlat) return;
    setLoading(true);
    setSuggestions(null);
    try {
      const res = await fetch("/api/menu-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platName: selectedPlat.name,
          wantEntree: true,
          wantDessert: true,
          wantBoisson: true,
        }),
      });
      const data = await res.json();
      setSuggestions(data.suggestions);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const addMenuToList = async () => {
    if (!selectedPlat) return;
    const menuLabel = `Menu: ${selectedPlat.name}`;
    for (const ing of selectedPlat.ingredients) {
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
          sourceRecipe: menuLabel,
        }),
      });
    }
    if (suggestions?.entree) {
      await fetch("/api/list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: `Entrée: ${suggestions.entree.name}`,
          quantity: 1,
          unit: "pcs",
          category: "Autre",
          source: "recipe",
          listStatus: "prep",
          sourceRecipe: menuLabel,
        }),
      });
    }
    if (suggestions?.dessert) {
      await fetch("/api/list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: `Dessert: ${suggestions.dessert.name}`,
          quantity: 1,
          unit: "pcs",
          category: "Autre",
          source: "recipe",
          listStatus: "prep",
          sourceRecipe: menuLabel,
        }),
      });
    }
    if (suggestions?.boisson) {
      await fetch("/api/list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: `Boisson: ${suggestions.boisson.name}`,
          quantity: 1,
          unit: "bout.",
          category: "Boissons",
          source: "recipe",
          listStatus: "prep",
          sourceRecipe: menuLabel,
        }),
      });
    }
    toast("Menu ajouté à la liste de courses.");
  };

  const filteredRecipes = search
    ? recipes.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()))
    : recipes.slice(0, 12);

  const personsLabel = persons >= 0 && persons < NUMERALS_FR.length ? NUMERALS_FR[persons] : String(persons);

  const courses = [
    { key: "entree", label: "Entrée", tone: "olive" as const, suggestion: suggestions?.entree, info: "léger · 15 min" },
    {
      key: "plat",
      label: "Plat",
      tone: "terra" as const,
      suggestion: selectedPlat ? { name: selectedPlat.name, description: selectedPlat.description || "" } : undefined,
      info: selectedPlat ? `${selectedPlat.category || "—"} · ${selectedPlat.servings} pers.` : "à choisir",
    },
    { key: "dessert", label: "Dessert", tone: "mustard" as const, suggestion: suggestions?.dessert, info: "douceur · 30 min" },
  ];

  return (
    <div className="pb-24 md:pb-8">
      <p className="eyebrow mb-5">menu</p>

      {/* Hero */}
      <header className="pb-8 mb-8 border-b" style={{ borderColor: "var(--color-line)" }}>
        <h1
          className="font-display tracking-tight"
          style={{
            color: "var(--color-ink)",
            fontSize: "clamp(36px, 5vw, 72px)",
            lineHeight: 1.0,
            letterSpacing: "-0.02em",
            maxWidth: "18ch",
          }}
        >
          Un repas en trois temps, pour{" "}
          <span style={{ fontStyle: "italic", color: "var(--color-terracotta)" }}>
            {personsLabel} personne{persons > 1 ? "s" : ""}.
          </span>
        </h1>

        <div className="mt-5 flex items-center gap-3 text-sm">
          <span className="eyebrow">portions</span>
          <div
            className="inline-flex items-center gap-1 rounded-full px-3 py-1.5"
            style={{ background: "var(--color-cream-pale)", border: "1px solid var(--color-line)" }}
          >
            <button
              onClick={() => setPersons((p) => Math.max(1, p - 1))}
              className="font-mono text-sm w-5"
              style={{ color: "var(--color-ink-mute)" }}
            >
              −
            </button>
            <span className="font-mono text-sm tnum" style={{ minWidth: 16, textAlign: "center" }}>
              {persons}
            </span>
            <button
              onClick={() => setPersons((p) => p + 1)}
              className="font-mono text-sm w-5"
              style={{ color: "var(--color-ink-mute)" }}
            >
              +
            </button>
          </div>
        </div>
      </header>

      {/* 3 dish cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-px mb-8" style={{ background: "var(--color-line)" }}>
        {courses.map((course, idx) => (
          <section key={course.key} className="p-6" style={{ background: "var(--color-cream-pale)" }}>
            <header className="flex items-baseline gap-3 mb-4">
              <span
                className="font-mono text-xs tnum"
                style={{ color: "var(--color-ink-faint)", letterSpacing: "0.08em" }}
              >
                {String(idx + 1).padStart(2, "0")}
              </span>
              <h2
                className="font-display tracking-tight"
                style={{ fontSize: 28, color: "var(--color-ink)", lineHeight: 1.05, fontStyle: "italic" }}
              >
                {course.label}
              </h2>
            </header>

            <div
              className={`placeholder-img placeholder-img-${course.tone} aspect-[4/3] mb-4`}
            >
              {course.suggestion?.name?.slice(0, 22) || "à composer"}
            </div>

            {course.suggestion ? (
              <>
                <p
                  className="font-display text-2xl leading-tight mb-2 tracking-tight"
                  style={{ color: "var(--color-ink)" }}
                >
                  {course.suggestion.name}
                </p>
                {course.suggestion.description && (
                  <p
                    className="text-sm leading-relaxed mb-3"
                    style={{ color: "var(--color-ink-mute)" }}
                  >
                    {course.suggestion.description}
                  </p>
                )}
                <span
                  className="font-mono text-[10px] uppercase rounded-full px-2.5 py-1 inline-block"
                  style={{
                    background: "var(--color-cream-deep)",
                    color: "var(--color-ink-soft)",
                    border: "1px solid var(--color-line)",
                    letterSpacing: "0.06em",
                  }}
                >
                  {course.info}
                </span>
              </>
            ) : (
              <p className="text-sm italic" style={{ color: "var(--color-ink-faint)" }}>
                {course.key === "plat"
                  ? "Choisis un plat principal ci-dessous."
                  : selectedPlat
                  ? "Demande une suggestion à l'IA."
                  : "Choisis d'abord un plat principal."}
              </p>
            )}
          </section>
        ))}
      </div>

      {/* Plat picker */}
      <section className="mb-8">
        <header className="flex items-baseline gap-3 mb-4">
          <span
            className="font-mono text-xs tnum"
            style={{ color: "var(--color-ink-faint)", letterSpacing: "0.08em" }}
          >
            04
          </span>
          <h2
            className="font-display tracking-tight"
            style={{ fontSize: 24, color: "var(--color-ink)", lineHeight: 1.05, fontStyle: "italic" }}
          >
            Choisir le plat principal
          </h2>
        </header>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher une recette…"
          className="w-full bg-[var(--color-cream-pale)] border border-[var(--color-line)] rounded-md px-3 py-2 text-sm mb-3 focus:outline-none focus:border-[var(--color-terracotta)]"
        />
        <div className="flex flex-wrap gap-2">
          {filteredRecipes
            .filter((r) => r.category !== "Dessert")
            .map((r) => {
              const active = selectedPlat?.id === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => {
                    setSelectedPlat(r);
                    setSuggestions(null);
                  }}
                  className="font-mono text-[11px] uppercase tracking-wider rounded-full px-3 py-1.5 transition-colors"
                  style={{
                    background: active ? "var(--color-ink)" : "var(--color-cream-pale)",
                    color: active ? "var(--color-cream-pale)" : "var(--color-ink-soft)",
                    border: "1px solid",
                    borderColor: active ? "var(--color-ink)" : "var(--color-line)",
                    letterSpacing: "0.06em",
                  }}
                >
                  {r.name}
                </button>
              );
            })}
          {filteredRecipes.length === 0 && (
            <p className="text-sm italic" style={{ color: "var(--color-ink-faint)" }}>
              Aucune recette dans ton carnet.
            </p>
          )}
        </div>
      </section>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3 pt-6 border-t" style={{ borderColor: "var(--color-line)" }}>
        <button
          onClick={getSuggestions}
          disabled={!selectedPlat || loading}
          className="rounded-full px-5 py-2.5 text-sm transition-colors disabled:opacity-50"
          style={{
            background: "var(--color-ink)",
            color: "var(--color-cream-pale)",
            border: "1px solid var(--color-ink)",
          }}
        >
          {loading ? "Suggestion…" : "✦ Compléter avec l'IA"}
        </button>
        {selectedPlat && (
          <button
            onClick={addMenuToList}
            className="rounded-full px-5 py-2.5 text-sm font-medium"
            style={{
              background: "var(--color-terracotta)",
              color: "var(--color-cream-pale)",
              border: "1px solid var(--color-terracotta)",
            }}
          >
            + Ajouter à la liste
          </button>
        )}
        {suggestions?.boisson && (
          <span className="text-sm" style={{ color: "var(--color-ink-mute)" }}>
            Suggestion boisson : <em>{suggestions.boisson.name}</em>
          </span>
        )}
      </div>
    </div>
  );
}
