"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useToast } from "@/components/toast";
import { matchSearch, formatQuantity } from "@/lib/utils";

type Recipe = {
  id: number;
  name: string;
  description: string | null;
  servings: number;
  category: string | null;
  is_prepared?: number | null;
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
  const [filterCat, setFilterCat] = useState<string>("");

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
    const menuLabel = `Menu: ${selectedPlat.name} (${persons} pers.)`;
    // Mise à l'échelle des quantités selon le nombre de personnes choisi :
    // quantité affichée = quantité de la recette / portions recette × personnes.
    const baseServings = selectedPlat.servings && selectedPlat.servings > 0 ? selectedPlat.servings : 2;
    const factor = persons / baseServings;
    // Plat déjà préparé : ajouter le plat lui-même, pas ses ingrédients.
    if (selectedPlat.is_prepared) {
      await fetch("/api/list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: selectedPlat.name,
          quantity: 1,
          unit: "pcs",
          category: "Surgelés",
          source: "recipe",
          listStatus: "prep",
          sourceRecipe: menuLabel,
        }),
      });
      toast("Plat déjà préparé ajouté à la liste.");
      return;
    }
    for (const ing of selectedPlat.ingredients) {
      const scaledQty =
        ing.quantity != null ? Math.round(ing.quantity * factor * 100) / 100 : 1;
      await fetch("/api/list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: ing.name,
          quantity: scaledQty || 1,
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

  const categories = [
    ...new Set(recipes.map((r) => r.category).filter(Boolean)),
  ] as string[];

  const filteredRecipes = recipes.filter((r) => {
    if (filterCat && r.category !== filterCat) return false;
    if (search) return matchSearch(search, r.name, r.category);
    return true;
  });

  const TONES = ["terra", "olive", "mustard", "neutral"] as const;

  const personsLabel = persons >= 0 && persons < NUMERALS_FR.length ? NUMERALS_FR[persons] : String(persons);

  const courses = [
    { key: "entree", label: "Entrée", tone: "olive" as const, suggestion: suggestions?.entree, info: "léger · 15 min" },
    {
      key: "plat",
      label: "Plat",
      tone: "terra" as const,
      suggestion: selectedPlat ? { name: selectedPlat.name, description: selectedPlat.description || "" } : undefined,
      info: selectedPlat ? `${selectedPlat.category || "—"} · ${persons} pers.` : "à choisir",
    },
    { key: "dessert", label: "Dessert", tone: "mustard" as const, suggestion: suggestions?.dessert, info: "douceur · 30 min" },
  ];

  return (
    <div className="pb-32 md:pb-8">
      {/* Compact header : titre + portions sur une ligne */}
      <header
        className="flex flex-wrap items-end justify-between gap-4 pb-4 mb-5 border-b"
        style={{ borderColor: "var(--color-line)" }}
      >
        <div>
          <p className="eyebrow mb-1.5">menu</p>
          <h1
            className="font-display tracking-tight"
            style={{
              color: "var(--color-ink)",
              fontSize: "clamp(28px, 4vw, 44px)",
              lineHeight: 1.0,
              letterSpacing: "-0.02em",
            }}
          >
            Compose ton{" "}
            <span style={{ fontStyle: "italic", color: "var(--color-terracotta)" }}>
              menu
            </span>
          </h1>
        </div>
        <div className="flex items-center gap-2.5 text-sm">
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

      {/* ── 01 · CHOISIR LE PLAT (immédiatement visible) ───────────── */}
      <section className="mb-8">
        <div className="flex items-baseline justify-between gap-3 mb-3">
          <h2
            className="font-display tracking-tight"
            style={{ fontSize: 22, color: "var(--color-ink)", lineHeight: 1.05, fontStyle: "italic" }}
          >
            Choisis ton plat
          </h2>
          <span className="font-mono text-xs tnum" style={{ color: "var(--color-ink-mute)" }}>
            {String(filteredRecipes.length).padStart(2, "0")} plat{filteredRecipes.length > 1 ? "s" : ""}
          </span>
        </div>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher une recette…"
          className="w-full bg-[var(--color-cream-pale)] border border-[var(--color-line)] rounded-md px-3 py-2 text-sm mb-3 focus:outline-none focus:border-[var(--color-terracotta)]"
        />

        {/* Filtres par catégorie */}
        {categories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
            <button onClick={() => setFilterCat("")} className="shrink-0">
              <span
                className="font-mono text-[11px] uppercase tracking-wider rounded-full px-3 py-1 inline-block"
                style={{
                  background: !filterCat ? "var(--color-ink)" : "var(--color-cream-pale)",
                  color: !filterCat ? "var(--color-cream-pale)" : "var(--color-ink-soft)",
                  border: "1px solid",
                  borderColor: !filterCat ? "var(--color-ink)" : "var(--color-line)",
                  letterSpacing: "0.06em",
                }}
              >
                Tous
              </span>
            </button>
            {categories.map((c) => {
              const active = filterCat === c;
              return (
                <button key={c} onClick={() => setFilterCat(active ? "" : c)} className="shrink-0">
                  <span
                    className="font-mono text-[11px] uppercase tracking-wider rounded-full px-3 py-1 inline-block whitespace-nowrap"
                    style={{
                      background: active ? "var(--color-terracotta)" : "var(--color-cream-pale)",
                      color: active ? "var(--color-cream-pale)" : "var(--color-ink-soft)",
                      border: "1px solid",
                      borderColor: active ? "var(--color-terracotta)" : "var(--color-line)",
                      letterSpacing: "0.06em",
                    }}
                  >
                    {c}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Grille de plats — cartes cliquables */}
        {filteredRecipes.length === 0 ? (
          <p className="text-sm italic py-6" style={{ color: "var(--color-ink-faint)" }}>
            Aucune recette. Ajoute-en dans l&apos;onglet Recettes.
          </p>
        ) : (
          <div
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-px"
            style={{ background: "var(--color-line)" }}
          >
            {filteredRecipes.map((r, idx) => {
              const active = selectedPlat?.id === r.id;
              const tone = TONES[idx % TONES.length];
              return (
                <div
                  key={r.id}
                  className="group flex flex-col transition-colors"
                  style={{
                    background: active ? "var(--color-cream-deep)" : "var(--color-cream-pale)",
                    outline: active ? "2px solid var(--color-terracotta)" : "none",
                    outlineOffset: -2,
                  }}
                >
                  <button
                    onClick={() => {
                      setSelectedPlat(r);
                      setSuggestions(null);
                    }}
                    className="flex flex-col text-left"
                    title="Choisir ce plat"
                  >
                    <div className={`placeholder-img placeholder-img-${tone} aspect-[4/3] relative`}>
                      {r.name.slice(0, 20)}
                      {active && (
                        <span
                          className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                          style={{ background: "var(--color-terracotta)", color: "var(--color-cream-pale)" }}
                        >
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </span>
                      )}
                    </div>
                    <div className="px-3 pt-3">
                      <p
                        className="font-display leading-tight tracking-tight"
                        style={{ fontSize: 18, color: "var(--color-ink)" }}
                      >
                        {r.name}
                      </p>
                    </div>
                  </button>
                  <div className="px-3 pb-3 pt-1.5 mt-auto flex items-center justify-between gap-2">
                    {r.category ? (
                      <span
                        className="font-mono text-[9px] uppercase rounded-full px-2 py-0.5"
                        style={{
                          background: "var(--color-cream-deep)",
                          color: "var(--color-ink-soft)",
                          border: "1px solid var(--color-line)",
                          letterSpacing: "0.06em",
                        }}
                      >
                        {r.category}
                      </span>
                    ) : (
                      <span />
                    )}
                    <Link
                      href={`/recettes/${r.id}`}
                      className="font-mono text-[10px] hover:underline shrink-0"
                      style={{ color: "var(--color-terracotta-deep)", letterSpacing: "0.04em" }}
                      title="Voir le détail de la recette"
                    >
                      détails →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── 02 · TON MENU EN TROIS TEMPS ───────────────────────────── */}
      <section className="mb-8">
        <h2
          className="font-display tracking-tight mb-4"
          style={{ fontSize: 22, color: "var(--color-ink)", lineHeight: 1.05, fontStyle: "italic" }}
        >
          Ton menu en trois temps
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px" style={{ background: "var(--color-line)" }}>
          {courses.map((course, idx) => (
            <div key={course.key} className="p-5" style={{ background: "var(--color-cream-pale)" }}>
              <header className="flex items-baseline gap-2.5 mb-3">
                <span
                  className="font-mono text-xs tnum"
                  style={{ color: "var(--color-ink-faint)", letterSpacing: "0.08em" }}
                >
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <h3
                  className="font-display tracking-tight"
                  style={{ fontSize: 22, color: "var(--color-ink)", lineHeight: 1.05, fontStyle: "italic" }}
                >
                  {course.label}
                </h3>
              </header>

              {course.suggestion ? (
                <>
                  <p
                    className="font-display text-xl leading-tight mb-2 tracking-tight"
                    style={{ color: "var(--color-ink)" }}
                  >
                    {course.suggestion.name}
                  </p>
                  {course.suggestion.description && (
                    <p className="text-sm leading-relaxed mb-3" style={{ color: "var(--color-ink-mute)" }}>
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
                    ? "Choisis un plat ci-dessus."
                    : selectedPlat
                    ? "Complète avec l'IA ci-dessous."
                    : "Choisis d'abord un plat."}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Ingrédients du plat, mis à l'échelle du nombre de personnes */}
        {selectedPlat && selectedPlat.ingredients.length > 0 && (() => {
          const base =
            selectedPlat.servings && selectedPlat.servings > 0 ? selectedPlat.servings : 2;
          const factor = persons / base;
          return (
            <div
              className="mt-4 rounded-md p-4"
              style={{ background: "var(--color-cream-pale)", border: "1px solid var(--color-line)" }}
            >
              <div className="flex items-baseline justify-between mb-3">
                <span className="eyebrow">Ingrédients · {persons} pers.</span>
                <span className="font-mono text-[10px]" style={{ color: "var(--color-ink-faint)", letterSpacing: "0.04em" }}>
                  recette pour {base} · ×{(Math.round(factor * 100) / 100).toString().replace(".", ",")}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
                {selectedPlat.ingredients.map((ing, i) => {
                  const q = ing.quantity != null ? Math.round(ing.quantity * factor * 100) / 100 : null;
                  return (
                    <div key={i} className="flex items-baseline justify-between gap-2 text-sm">
                      <span style={{ color: "var(--color-ink-soft)" }} className="truncate">
                        {ing.name}
                      </span>
                      <span className="font-mono tnum text-[12px] shrink-0" style={{ color: "var(--color-ink-mute)" }}>
                        {q != null ? formatQuantity(q, ing.unit) : "—"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </section>

      {/* Actions — sticky en bas sur mobile pour rester accessibles */}
      <div
        className="flex flex-wrap items-center gap-3 pt-5 border-t sticky bottom-16 md:static md:bottom-auto py-3 md:py-0"
        style={{
          borderColor: "var(--color-line)",
          background: "var(--color-cream)",
        }}
      >
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
            Boisson : <em>{suggestions.boisson.name}</em>
          </span>
        )}
      </div>
    </div>
  );
}
