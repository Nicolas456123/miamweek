"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useToast } from "@/components/toast";
import {
  Button,
  Card,
  Chip,
  EmptyState,
  Field,
  PageHeader,
} from "@/components/ui-kit";
import { RecipePhoto } from "@/components/recipe-photo";

type Ingredient = {
  id?: number;
  name: string;
  quantity: number | null;
  unit: string | null;
  category: string | null;
  product_id?: number | null;
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
  ingredients: Ingredient[];
  is_favorite?: number | null;
  photo_url?: string | null;
  photo_credit?: string | null;
};

function parseJSON<T>(val: string | null | undefined, fallback: T): T {
  if (!val) return fallback;
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
}

const DIFFICULTY_TONE: Record<string, "olive" | "mustard" | "terra"> = {
  facile: "olive",
  moyen: "mustard",
  difficile: "terra",
};

export default function RecettesPage() {
  const { toast } = useToast();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [filterFavorites, setFilterFavorites] = useState(false);
  const [search, setSearch] = useState("");
  const [addedToList, setAddedToList] = useState<Set<number>>(new Set());
  const [form, setForm] = useState({
    name: "",
    description: "",
    servings: 2,
    category: "",
    prepTime: 0,
    cookTime: 0,
    difficulty: "facile",
    utensils: [""],
    steps: [""],
    ingredients: [{ name: "", quantity: null as number | null, unit: "", category: "" }],
  });
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const fetchRecipes = () => {
    fetch("/api/recipes")
      .then((r) => r.json())
      .then((data) => setRecipes(Array.isArray(data) ? data : []))
      .catch(console.error);
  };

  useEffect(() => {
    fetchRecipes();
  }, []);

  const toggleFavorite = async (recipeId: number) => {
    setRecipes((prev) =>
      prev.map((r) =>
        r.id === recipeId ? { ...r, is_favorite: r.is_favorite ? 0 : 1 } : r
      )
    );
    await fetch("/api/recipes/favorite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipeId }),
    });
  };

  const resetForm = () => {
    setForm({
      name: "",
      description: "",
      servings: 2,
      category: "",
      prepTime: 0,
      cookTime: 0,
      difficulty: "facile",
      utensils: [""],
      steps: [""],
      ingredients: [{ name: "", quantity: null, unit: "", category: "" }],
    });
    setShowAdd(false);
    setEditingId(null);
  };

  const saveRecipe = async () => {
    if (!form.name.trim()) return;
    const validIngredients = form.ingredients.filter((i) => i.name.trim());
    const validUtensils = form.utensils.filter((u) => u.trim());
    const validSteps = form.steps.filter((s) => s.trim());

    const payload = {
      ...form,
      ingredients: validIngredients,
      utensils: validUtensils,
      steps: validSteps,
    };

    if (editingId) {
      await fetch(`/api/recipes/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }
    resetForm();
    fetchRecipes();
  };

  const deleteRecipe = async (id: number) => {
    await fetch(`/api/recipes/${id}`, { method: "DELETE" });
    fetchRecipes();
  };

  const editRecipe = (recipe: Recipe) => {
    const utensils = parseJSON<string[]>(recipe.utensils, [""]);
    const steps = parseJSON<string[]>(recipe.steps, [""]);
    setForm({
      name: recipe.name,
      description: recipe.description || "",
      servings: recipe.servings,
      category: recipe.category || "",
      prepTime: recipe.prep_time || 0,
      cookTime: recipe.cook_time || 0,
      difficulty: recipe.difficulty || "facile",
      utensils: utensils.length > 0 ? utensils : [""],
      steps: steps.length > 0 ? steps : [""],
      ingredients:
        recipe.ingredients.length > 0
          ? recipe.ingredients.map((i) => ({
              name: i.name,
              quantity: i.quantity,
              unit: i.unit || "",
              category: i.category || "",
            }))
          : [{ name: "", quantity: null, unit: "", category: "" }],
    });
    setEditingId(recipe.id);
    setShowAdd(true);
  };

  const generateWithAI = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Donne-moi une recette détaillée pour: ${aiPrompt}. Inclus les ingrédients avec quantités pour 2 personnes.`,
        }),
      });
      const data = await res.json();
      if (data.recipes && data.recipes.length > 0) {
        const recipe = data.recipes[0];
        setForm({
          name: recipe.name,
          description: recipe.description || "",
          servings: recipe.servings || 2,
          category: recipe.category || "",
          prepTime: recipe.prepTime || 0,
          cookTime: recipe.cookTime || 0,
          difficulty: recipe.difficulty || "facile",
          utensils: recipe.utensils || [""],
          steps: recipe.steps || [""],
          ingredients:
            recipe.ingredients?.map(
              (i: { name: string; quantity: number; unit: string; category: string }) => ({
                name: i.name,
                quantity: i.quantity || null,
                unit: i.unit || "",
                category: i.category || "",
              })
            ) || [{ name: "", quantity: null, unit: "", category: "" }],
        });
        setShowAdd(true);
      }
    } catch (err) {
      console.error(err);
    }
    setAiLoading(false);
    setAiPrompt("");
  };

  const addAllToList = async (recipe: Recipe) => {
    let inventoryNames: string[] = [];
    try {
      const invRes = await fetch("/api/stock");
      const invData = await invRes.json();
      if (Array.isArray(invData)) {
        inventoryNames = invData
          .filter((s: { status: string }) => s.status === "ok")
          .map((s: { product_name: string }) => s.product_name?.toLowerCase())
          .filter(Boolean);
      }
    } catch {
      /* ignore */
    }

    let skipped = 0;
    for (const ing of recipe.ingredients) {
      if (inventoryNames.includes(ing.name.toLowerCase())) {
        skipped++;
        continue;
      }
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
    setAddedToList((prev) => new Set(prev).add(recipe.id));
    if (skipped > 0) {
      toast(
        `${recipe.ingredients.length - skipped} ingrédients ajoutés${
          skipped > 0 ? ` (${skipped} en stock)` : ""
        }`
      );
    }
  };

  const addOneToList = async (ing: Ingredient, recipeName?: string) => {
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
        sourceRecipe: recipeName || null,
      }),
    });
  };

  const categories = [
    ...new Set(recipes.map((r) => r.category).filter(Boolean)),
  ] as string[];

  const filteredRecipes = recipes.filter((r) => {
    if (filterFavorites && !r.is_favorite) return false;
    if (filterCategory && r.category !== filterCategory) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        r.name.toLowerCase().includes(s) ||
        r.description?.toLowerCase().includes(s) ||
        r.ingredients.some((i) => i.name.toLowerCase().includes(s))
      );
    }
    return true;
  });

  return (
    <div className="pb-24 md:pb-8">
      {/* Hero — title is the eyebrow itself */}
      <header
        className="pb-8 mb-8 border-b flex items-end justify-between gap-6 flex-wrap"
        style={{ borderColor: "var(--color-line)" }}
      >
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
          Toutes les recettes,{" "}
          <span style={{ fontStyle: "italic", color: "var(--color-terracotta)" }}>
            par catégorie ou par humeur.
          </span>
        </h1>
        <div className="flex items-center gap-3">
          <span className="eyebrow tnum" style={{ color: "var(--color-ink-mute)" }}>
            {String(filteredRecipes.length).padStart(2, "0")} recette
            {filteredRecipes.length !== 1 ? "s" : ""}
          </span>
          {!showAdd && (
            <Button variant="ink" size="md" onClick={() => setShowAdd(true)}>
              + Ajouter
            </Button>
          )}
        </div>
      </header>

      {/* AI suggest */}
      <Card variant="soft" padding="md" className="mb-5">
        <div className="flex flex-col md:flex-row gap-2 items-stretch">
          <input
            type="text"
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && generateWithAI()}
            placeholder="Demande une recette à l'IA — ex : pâtes carbonara, plat végétarien rapide…"
            className="flex-1 bg-[var(--color-cream-pale)] border border-[var(--color-line)] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-terracotta)]"
          />
          <Button variant="primary" size="md" onClick={generateWithAI} disabled={aiLoading}>
            {aiLoading ? "…" : "Suggérer"}
          </Button>
        </div>
      </Card>

      {/* Search + filters */}
      <div className="mb-5 space-y-3">
        <Field
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher une recette ou un ingrédient…"
        />
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => {
              setFilterCategory("");
              setFilterFavorites(false);
            }}
            className="shrink-0"
          >
            <Chip tone={!filterCategory && !filterFavorites ? "ink" : "neutral"}>
              Toutes
            </Chip>
          </button>
          <button
            onClick={() => {
              setFilterFavorites(!filterFavorites);
              setFilterCategory("");
            }}
            className="shrink-0"
          >
            <Chip tone={filterFavorites ? "terra" : "neutral"}>Favoris</Chip>
          </button>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setFilterCategory(filterCategory === c ? "" : c)}
              className="shrink-0"
            >
              <Chip tone={filterCategory === c ? "ink" : "neutral"}>{c}</Chip>
            </button>
          ))}
        </div>
      </div>

      {/* Add / edit form */}
      {showAdd && (
        <Card variant="default" padding="lg" className="mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field
              label="Nom"
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Nom de la recette"
              autoFocus
            />
            <Field
              label="Catégorie"
              type="text"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              placeholder="Italien, Rapide, Végétarien…"
            />
          </div>
          <label className="block">
            <span className="eyebrow block mb-2">Description</span>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Description / instructions"
              rows={2}
              className="w-full bg-[var(--color-cream-pale)] border border-[var(--color-line)] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-terracotta)]"
            />
          </label>

          <div className="grid grid-cols-3 gap-3">
            <Field
              label="Prépa (min)"
              type="number"
              value={form.prepTime || ""}
              onChange={(e) => setForm({ ...form, prepTime: Number(e.target.value) })}
              min={0}
            />
            <Field
              label="Cuisson (min)"
              type="number"
              value={form.cookTime || ""}
              onChange={(e) => setForm({ ...form, cookTime: Number(e.target.value) })}
              min={0}
            />
            <label className="block">
              <span className="eyebrow block mb-2">Difficulté</span>
              <select
                value={form.difficulty}
                onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                className="w-full bg-[var(--color-cream-pale)] border border-[var(--color-line)] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-terracotta)]"
              >
                <option value="facile">Facile</option>
                <option value="moyen">Moyen</option>
                <option value="difficile">Difficile</option>
              </select>
            </label>
          </div>

          <div>
            <span className="eyebrow block mb-2">Ustensiles</span>
            {form.utensils.map((u, i) => (
              <div key={i} className="flex gap-2 mb-1.5">
                <input
                  type="text"
                  value={u}
                  onChange={(e) => {
                    const updated = [...form.utensils];
                    updated[i] = e.target.value;
                    setForm({ ...form, utensils: updated });
                  }}
                  placeholder="Poêle, casserole, four…"
                  className="flex-1 bg-[var(--color-cream-pale)] border border-[var(--color-line)] rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-[var(--color-terracotta)]"
                />
                <button
                  onClick={() =>
                    setForm({ ...form, utensils: form.utensils.filter((_, j) => j !== i) })
                  }
                  className="text-xs px-2"
                  style={{ color: "var(--color-ink-mute)" }}
                >
                  ×
                </button>
              </div>
            ))}
            <button
              onClick={() => setForm({ ...form, utensils: [...form.utensils, ""] })}
              className="text-xs hover:underline"
              style={{ color: "var(--color-terracotta-deep)" }}
            >
              + Ajouter un ustensile
            </button>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="eyebrow">Ingrédients</span>
              <div className="flex items-center gap-2">
                <span className="eyebrow">Portions</span>
                <input
                  type="number"
                  value={form.servings}
                  onChange={(e) => setForm({ ...form, servings: Number(e.target.value) })}
                  className="w-16 bg-[var(--color-cream-pale)] border border-[var(--color-line)] rounded-md px-2 py-1 text-sm tnum"
                  min={1}
                />
              </div>
            </div>
            {form.ingredients.map((ing, i) => (
              <div key={i} className="flex gap-2 mb-1.5">
                <input
                  type="text"
                  value={ing.name}
                  onChange={(e) => {
                    const u = [...form.ingredients];
                    u[i] = { ...u[i], name: e.target.value };
                    setForm({ ...form, ingredients: u });
                  }}
                  placeholder="Ingrédient"
                  className="flex-1 bg-[var(--color-cream-pale)] border border-[var(--color-line)] rounded-md px-2 py-1.5 text-sm focus:outline-none focus:border-[var(--color-terracotta)]"
                />
                <input
                  type="number"
                  value={ing.quantity ?? ""}
                  onChange={(e) => {
                    const u = [...form.ingredients];
                    u[i] = { ...u[i], quantity: e.target.value ? Number(e.target.value) : null };
                    setForm({ ...form, ingredients: u });
                  }}
                  placeholder="Qté"
                  className="w-16 bg-[var(--color-cream-pale)] border border-[var(--color-line)] rounded-md px-2 py-1.5 text-sm tnum focus:outline-none focus:border-[var(--color-terracotta)]"
                />
                <input
                  type="text"
                  value={ing.unit}
                  onChange={(e) => {
                    const u = [...form.ingredients];
                    u[i] = { ...u[i], unit: e.target.value };
                    setForm({ ...form, ingredients: u });
                  }}
                  placeholder="Unité"
                  className="w-20 bg-[var(--color-cream-pale)] border border-[var(--color-line)] rounded-md px-2 py-1.5 text-sm focus:outline-none focus:border-[var(--color-terracotta)]"
                />
                <button
                  onClick={() =>
                    setForm({ ...form, ingredients: form.ingredients.filter((_, j) => j !== i) })
                  }
                  className="text-xs px-2"
                  style={{ color: "var(--color-ink-mute)" }}
                >
                  ×
                </button>
              </div>
            ))}
            <button
              onClick={() =>
                setForm({
                  ...form,
                  ingredients: [
                    ...form.ingredients,
                    { name: "", quantity: null, unit: "", category: "" },
                  ],
                })
              }
              className="text-xs hover:underline"
              style={{ color: "var(--color-terracotta-deep)" }}
            >
              + Ajouter un ingrédient
            </button>
          </div>

          <div>
            <span className="eyebrow block mb-2">Étapes</span>
            {form.steps.map((step, i) => (
              <div key={i} className="flex gap-2 mb-1.5">
                <span
                  className="font-mono text-xs mt-2 w-6 tnum"
                  style={{ color: "var(--color-ink-mute)" }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <textarea
                  value={step}
                  onChange={(e) => {
                    const updated = [...form.steps];
                    updated[i] = e.target.value;
                    setForm({ ...form, steps: updated });
                  }}
                  placeholder={`Étape ${i + 1}…`}
                  rows={2}
                  className="flex-1 bg-[var(--color-cream-pale)] border border-[var(--color-line)] rounded-md px-2 py-1.5 text-sm focus:outline-none focus:border-[var(--color-terracotta)]"
                />
                <button
                  onClick={() =>
                    setForm({ ...form, steps: form.steps.filter((_, j) => j !== i) })
                  }
                  className="text-xs px-2"
                  style={{ color: "var(--color-ink-mute)" }}
                >
                  ×
                </button>
              </div>
            ))}
            <button
              onClick={() => setForm({ ...form, steps: [...form.steps, ""] })}
              className="text-xs hover:underline"
              style={{ color: "var(--color-terracotta-deep)" }}
            >
              + Ajouter une étape
            </button>
          </div>

          <div className="flex gap-2 pt-2 border-t" style={{ borderColor: "var(--color-line)" }}>
            <Button variant="primary" size="md" onClick={saveRecipe}>
              {editingId ? "Modifier" : "Enregistrer"}
            </Button>
            <Button variant="ghost" size="md" onClick={resetForm}>
              Annuler
            </Button>
          </div>
        </Card>
      )}

      {/* Recipe grid */}
      {filteredRecipes.length === 0 && !showAdd ? (
        <EmptyState
          title="Aucune recette"
          description={
            search || filterCategory
              ? "Modifie ta recherche ou retire les filtres."
              : "Ajoute ta première recette ou demande une suggestion à l'IA."
          }
          action={
            <Button variant="primary" size="md" onClick={() => setShowAdd(true)}>
              + Ajouter une recette
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-px" style={{ background: "var(--color-line)" }}>
          {filteredRecipes.map((recipe, idx) => {
            const isExpanded = expandedId === recipe.id;
            const utensils = parseJSON<string[]>(recipe.utensils, []);
            const steps = parseJSON<string[]>(recipe.steps, []);
            const totalTime = (recipe.prep_time || 0) + (recipe.cook_time || 0);
            const diffTone = recipe.difficulty
              ? DIFFICULTY_TONE[recipe.difficulty] || "neutral"
              : "neutral";
            const tones: ("neutral" | "terra" | "olive" | "mustard")[] = [
              "neutral",
              "terra",
              "olive",
              "mustard",
            ];
            const tone = tones[idx % tones.length];

            return (
              <div
                key={recipe.id}
                className="flex flex-col"
                style={{ background: "var(--color-cream-pale)" }}
              >
                <Link href={`/recettes/${recipe.id}`} className="block">
                  <RecipePhoto
                    recipe={recipe}
                    persist
                    placeholderTone={tone}
                    className="aspect-square w-full"
                  />
                </Link>

                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3
                      className="font-display text-2xl leading-tight tracking-tight"
                      style={{ color: "var(--color-ink)" }}
                    >
                      {recipe.name}
                    </h3>
                    <button
                      onClick={() => toggleFavorite(recipe.id)}
                      className="shrink-0 text-xs px-2 py-1 rounded-full transition-colors"
                      style={{
                        background: recipe.is_favorite
                          ? "rgba(200,85,61,0.12)"
                          : "transparent",
                        color: recipe.is_favorite
                          ? "var(--color-terracotta-deep)"
                          : "var(--color-ink-mute)",
                        border: `1px solid ${
                          recipe.is_favorite
                            ? "rgba(200,85,61,0.25)"
                            : "var(--color-line)"
                        }`,
                      }}
                      title={recipe.is_favorite ? "Retirer des favoris" : "Favori"}
                    >
                      {recipe.is_favorite ? "♥ favori" : "♡"}
                    </button>
                  </div>

                  {recipe.description && (
                    <p
                      className="text-sm leading-relaxed mb-3 line-clamp-2"
                      style={{ color: "var(--color-ink-mute)" }}
                    >
                      {recipe.description}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {recipe.category && <Chip tone="neutral">{recipe.category}</Chip>}
                    {recipe.difficulty && (
                      <Chip tone={diffTone as "olive" | "mustard" | "terra" | "neutral"}>
                        {recipe.difficulty}
                      </Chip>
                    )}
                    {totalTime > 0 && (
                      <span
                        className="font-mono text-[11px] tnum"
                        style={{
                          color: "var(--color-ink-mute)",
                          letterSpacing: "0.04em",
                          padding: "4px 10px",
                        }}
                      >
                        {totalTime} MIN
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-auto pt-3 border-t" style={{ borderColor: "var(--color-line)" }}>
                    <span
                      className="font-mono text-[11px] tnum"
                      style={{ color: "var(--color-ink-faint)", letterSpacing: "0.04em" }}
                    >
                      {String(recipe.servings).padStart(2, "0")} PERS · {String(recipe.ingredients.length).padStart(2, "0")} ING
                    </span>
                    <Button
                      variant={addedToList.has(recipe.id) ? "secondary" : "primary"}
                      size="sm"
                      onClick={() => addAllToList(recipe)}
                    >
                      {addedToList.has(recipe.id) ? "Ajouté" : "+ Liste"}
                    </Button>
                  </div>
                </div>

                {isExpanded && (
                  <div
                    className="border-t px-4 py-4 space-y-4"
                    style={{ borderColor: "var(--color-line)", background: "var(--color-cream-deep)" }}
                  >
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => editRecipe(recipe)}>
                        Modifier
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => deleteRecipe(recipe.id)}>
                        Supprimer
                      </Button>
                    </div>

                    {(recipe.prep_time || recipe.cook_time) && (
                      <div className="flex flex-wrap gap-2">
                        {recipe.prep_time ? (
                          <Chip tone="olive">Prépa · {recipe.prep_time} min</Chip>
                        ) : null}
                        {recipe.cook_time ? (
                          <Chip tone="mustard">Cuisson · {recipe.cook_time} min</Chip>
                        ) : null}
                        {totalTime > 0 && <Chip tone="ink">Total · {totalTime} min</Chip>}
                      </div>
                    )}

                    {utensils.length > 0 && (
                      <div>
                        <h4 className="eyebrow mb-2">Ustensiles</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {utensils.map((u, i) => (
                            <Chip key={i} tone="neutral">
                              {u}
                            </Chip>
                          ))}
                        </div>
                      </div>
                    )}

                    {recipe.ingredients.length > 0 && (
                      <div>
                        <h4 className="eyebrow mb-2">
                          Ingrédients ({recipe.servings} pers.)
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                          {recipe.ingredients.map((ing, i) => (
                            <button
                              key={i}
                              onClick={() => addOneToList(ing, recipe.name)}
                              className="flex items-center gap-2 text-sm py-1.5 px-2 rounded-md text-left transition-colors hover:bg-[var(--color-cream-pale)]"
                              title="Ajouter à ma liste"
                            >
                              <span
                                className="w-5 h-5 rounded-full border flex items-center justify-center text-xs shrink-0"
                                style={{
                                  borderColor: "var(--color-line)",
                                  color: "var(--color-ink-mute)",
                                }}
                              >
                                +
                              </span>
                              <span className="font-medium tnum">
                                {ing.quantity && `${ing.quantity}`}
                                {ing.unit && ` ${ing.unit}`}
                              </span>
                              <span style={{ color: "var(--color-ink-soft)" }}>{ing.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {steps.length > 0 && (
                      <div>
                        <h4 className="eyebrow mb-2">Étapes</h4>
                        <ol className="space-y-2.5">
                          {steps.map((step, i) => (
                            <li key={i} className="flex gap-3 text-sm">
                              <span
                                className="font-mono text-xs tnum shrink-0"
                                style={{ color: "var(--color-ink-mute)", paddingTop: 2 }}
                              >
                                {String(i + 1).padStart(2, "0")}
                              </span>
                              <p
                                className="text-sm leading-relaxed"
                                style={{ color: "var(--color-ink-soft)" }}
                              >
                                {step}
                              </p>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
