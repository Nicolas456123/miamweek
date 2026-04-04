"use client";

import { useState, useEffect } from "react";

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
  utensils: string | null; // JSON string
  steps: string | null; // JSON string
  ingredients: Ingredient[];
};

function parseJSON<T>(val: string | null | undefined, fallback: T): T {
  if (!val) return fallback;
  try { return JSON.parse(val); } catch { return fallback; }
}

const DIFFICULTY_COLORS: Record<string, string> = {
  facile: "bg-green-100 text-green-700",
  moyen: "bg-yellow-100 text-yellow-700",
  difficile: "bg-red-100 text-red-700",
};

export default function RecettesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("");
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

  useEffect(() => { fetchRecipes(); }, []);

  const resetForm = () => {
    setForm({
      name: "", description: "", servings: 2, category: "",
      prepTime: 0, cookTime: 0, difficulty: "facile",
      utensils: [""], steps: [""],
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
      ingredients: recipe.ingredients.length > 0
        ? recipe.ingredients.map((i) => ({
            name: i.name, quantity: i.quantity, unit: i.unit || "", category: i.category || "",
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
          name: recipe.name, description: recipe.description || "",
          servings: recipe.servings || 2, category: recipe.category || "",
          prepTime: recipe.prepTime || 0, cookTime: recipe.cookTime || 0,
          difficulty: recipe.difficulty || "facile",
          utensils: recipe.utensils || [""],
          steps: recipe.steps || [""],
          ingredients: recipe.ingredients?.map(
            (i: { name: string; quantity: number; unit: string; category: string }) => ({
              name: i.name, quantity: i.quantity || null, unit: i.unit || "", category: i.category || "",
            })
          ) || [{ name: "", quantity: null, unit: "", category: "" }],
        });
        setShowAdd(true);
      }
    } catch (err) { console.error(err); }
    setAiLoading(false);
    setAiPrompt("");
  };

  const addAllToList = async (recipe: Recipe) => {
    // Get inventory to filter out what we already have
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
    } catch { /* ignore */ }

    let skipped = 0;
    for (const ing of recipe.ingredients) {
      // Skip if already in inventory with status "ok"
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
      alert(`${recipe.ingredients.length - skipped} ingrédients ajoutés à la liste.\n${skipped} déjà en stock (ignorés).`);
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

  // Get unique categories
  const categories = [...new Set(recipes.map((r) => r.category).filter(Boolean))] as string[];

  const filteredRecipes = recipes.filter((r) => {
    if (filterCategory && r.category !== filterCategory) return false;
    if (search) {
      const s = search.toLowerCase();
      return r.name.toLowerCase().includes(s) ||
        r.description?.toLowerCase().includes(s) ||
        r.ingredients.some((i) => i.name.toLowerCase().includes(s));
    }
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto flex flex-col" style={{ height: "calc(100vh - 120px)" }}>
      <div className="flex items-center justify-between mb-3 shrink-0">
        <h1 className="text-xl font-bold">Recettes</h1>
        <span className="text-sm text-muted">
          {filteredRecipes.length} recette{filteredRecipes.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* AI suggestion */}
      <div className="mb-3 bg-card border border-border rounded-xl p-4 shrink-0">
        <div className="flex gap-2">
          <input type="text" value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && generateWithAI()}
            placeholder="Demande une recette à l'IA... (ex: 'pâtes carbonara', 'plat végétarien rapide')"
            className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm" />
          <button onClick={generateWithAI} disabled={aiLoading}
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium disabled:opacity-50">
            {aiLoading ? "..." : "Suggérer"}
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-3 shrink-0">
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher une recette ou un ingrédient..."
          className="w-full bg-card border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
      </div>

      {/* Category filter tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 mb-3 scrollbar-hide shrink-0">
        <button
          onClick={() => setFilterCategory("")}
          className={`px-3 py-1.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors shrink-0 ${
            !filterCategory
              ? "bg-primary text-white shadow-sm"
              : "bg-card border border-border text-muted hover:text-foreground hover:shadow-sm"
          }`}
        >
          Toutes
        </button>
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setFilterCategory(filterCategory === c ? "" : c)}
            className={`px-3 py-1.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors shrink-0 ${
              filterCategory === c
                ? "bg-primary text-white shadow-sm"
                : "bg-card border border-border text-muted hover:text-foreground hover:shadow-sm"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 min-h-0 overflow-y-auto pb-4">
      {/* Add/Edit form */}
      {showAdd ? (
        <div className="mb-4 bg-card border border-border rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input type="text" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Nom de la recette" autoFocus
              className="bg-background border border-border rounded-lg px-3 py-2 text-sm" />
            <input type="text" value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              placeholder="Catégorie (ex: Italien, Rapide...)"
              className="bg-background border border-border rounded-lg px-3 py-2 text-sm" />
          </div>
          <textarea value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Description / instructions" rows={2}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm" />

          {/* Times + difficulty */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-muted">Prépa (min)</label>
              <input type="number" value={form.prepTime || ""}
                onChange={(e) => setForm({ ...form, prepTime: Number(e.target.value) })}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm" min={0} />
            </div>
            <div>
              <label className="text-xs text-muted">Cuisson (min)</label>
              <input type="number" value={form.cookTime || ""}
                onChange={(e) => setForm({ ...form, cookTime: Number(e.target.value) })}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm" min={0} />
            </div>
            <div>
              <label className="text-xs text-muted">Difficulté</label>
              <select value={form.difficulty}
                onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm">
                <option value="facile">Facile</option>
                <option value="moyen">Moyen</option>
                <option value="difficile">Difficile</option>
              </select>
            </div>
          </div>

          {/* Utensils */}
          <div>
            <span className="text-sm font-medium">Ustensiles</span>
            {form.utensils.map((u, i) => (
              <div key={i} className="flex gap-2 mb-1">
                <input type="text" value={u}
                  onChange={(e) => {
                    const updated = [...form.utensils];
                    updated[i] = e.target.value;
                    setForm({ ...form, utensils: updated });
                  }}
                  placeholder="Ex: poêle, casserole..."
                  className="flex-1 bg-background border border-border rounded px-2 py-1 text-xs" />
                <button onClick={() => setForm({ ...form, utensils: form.utensils.filter((_, j) => j !== i) })}
                  className="text-muted hover:text-danger text-xs px-1">x</button>
              </div>
            ))}
            <button onClick={() => setForm({ ...form, utensils: [...form.utensils, ""] })}
              className="text-xs text-primary hover:underline">+ Ajouter un ustensile</button>
          </div>

          {/* Ingredients */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Ingrédients</span>
              <div className="flex items-center gap-2">
                <label className="text-xs text-muted">Portions:</label>
                <input type="number" value={form.servings}
                  onChange={(e) => setForm({ ...form, servings: Number(e.target.value) })}
                  className="w-16 bg-background border border-border rounded px-2 py-1 text-xs" min={1} />
              </div>
            </div>
            {form.ingredients.map((ing, i) => (
              <div key={i} className="flex gap-2 mb-1.5">
                <input type="text" value={ing.name}
                  onChange={(e) => { const u = [...form.ingredients]; u[i] = { ...u[i], name: e.target.value }; setForm({ ...form, ingredients: u }); }}
                  placeholder="Ingrédient"
                  className="flex-1 bg-background border border-border rounded px-2 py-1 text-xs" />
                <input type="number" value={ing.quantity ?? ""}
                  onChange={(e) => { const u = [...form.ingredients]; u[i] = { ...u[i], quantity: e.target.value ? Number(e.target.value) : null }; setForm({ ...form, ingredients: u }); }}
                  placeholder="Qté"
                  className="w-16 bg-background border border-border rounded px-2 py-1 text-xs" />
                <input type="text" value={ing.unit}
                  onChange={(e) => { const u = [...form.ingredients]; u[i] = { ...u[i], unit: e.target.value }; setForm({ ...form, ingredients: u }); }}
                  placeholder="Unité"
                  className="w-16 bg-background border border-border rounded px-2 py-1 text-xs" />
                <button onClick={() => setForm({ ...form, ingredients: form.ingredients.filter((_, j) => j !== i) })}
                  className="text-muted hover:text-danger text-xs px-1">x</button>
              </div>
            ))}
            <button onClick={() => setForm({ ...form, ingredients: [...form.ingredients, { name: "", quantity: null, unit: "", category: "" }] })}
              className="text-xs text-primary hover:underline mt-1">+ Ajouter un ingrédient</button>
          </div>

          {/* Steps */}
          <div>
            <span className="text-sm font-medium">Étapes</span>
            {form.steps.map((step, i) => (
              <div key={i} className="flex gap-2 mb-1.5">
                <span className="text-xs text-muted mt-1.5 w-5">{i + 1}.</span>
                <textarea value={step}
                  onChange={(e) => {
                    const updated = [...form.steps];
                    updated[i] = e.target.value;
                    setForm({ ...form, steps: updated });
                  }}
                  placeholder={`Étape ${i + 1}...`}
                  rows={2}
                  className="flex-1 bg-background border border-border rounded px-2 py-1 text-xs" />
                <button onClick={() => setForm({ ...form, steps: form.steps.filter((_, j) => j !== i) })}
                  className="text-muted hover:text-danger text-xs px-1">x</button>
              </div>
            ))}
            <button onClick={() => setForm({ ...form, steps: [...form.steps, ""] })}
              className="text-xs text-primary hover:underline">+ Ajouter une étape</button>
          </div>

          <div className="flex gap-2 pt-2">
            <button onClick={saveRecipe}
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium">
              {editingId ? "Modifier" : "Enregistrer"}
            </button>
            <button onClick={resetForm} className="text-muted text-sm px-4">Annuler</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowAdd(true)}
          className="w-full mb-4 py-3 border border-dashed border-border rounded-xl text-muted hover:border-primary hover:text-primary text-sm">
          + Ajouter une recette
        </button>
      )}

      {/* Recipes list */}
      <div className="space-y-3">
        {filteredRecipes.map((recipe) => {
          const isExpanded = expandedId === recipe.id;
          const utensils = parseJSON<string[]>(recipe.utensils, []);
          const steps = parseJSON<string[]>(recipe.steps, []);
          const totalTime = (recipe.prep_time || 0) + (recipe.cook_time || 0);

          return (
            <div key={recipe.id} className="bg-card border border-border rounded-xl overflow-hidden">
              {/* Header - always visible */}
              <div
                className="p-4 cursor-pointer hover:bg-card-hover transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : recipe.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm">{recipe.name}</h3>
                    {recipe.description && (
                      <p className="text-xs text-muted mt-1 line-clamp-2">{recipe.description}</p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {recipe.category && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">{recipe.category}</span>
                      )}
                      {recipe.difficulty && (
                        <span className={`text-xs px-2 py-0.5 rounded ${DIFFICULTY_COLORS[recipe.difficulty] || "bg-gray-100 text-gray-600"}`}>
                          {recipe.difficulty}
                        </span>
                      )}
                      {totalTime > 0 && (
                        <span className="text-xs text-muted flex items-center gap-1">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                          </svg>
                          {totalTime} min
                        </span>
                      )}
                      <span className="text-xs text-muted">{recipe.servings} pers.</span>
                      <span className="text-xs text-muted">{recipe.ingredients.length} ingrédients</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <button onClick={(e) => { e.stopPropagation(); addAllToList(recipe); }}
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                        addedToList.has(recipe.id)
                          ? "bg-primary-light text-primary"
                          : "bg-primary text-white hover:bg-primary-hover"
                      }`}>
                      {addedToList.has(recipe.id) ? "Ajouté !" : "+ Liste"}
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); editRecipe(recipe); }}
                      className="text-xs text-muted hover:text-foreground px-2 py-1">Modifier</button>
                    <button onClick={(e) => { e.stopPropagation(); deleteRecipe(recipe.id); }}
                      className="text-xs text-muted hover:text-danger px-2 py-1">Supprimer</button>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                      className={`text-muted transition-transform ${isExpanded ? "rotate-180" : ""}`}>
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </div>
                </div>
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <div className="border-t border-border px-4 pb-4 space-y-4">
                  {/* Time details */}
                  {(recipe.prep_time || recipe.cook_time) && (
                    <div className="flex gap-4 pt-3">
                      {recipe.prep_time ? (
                        <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-xs">
                          <span>Prépa</span>
                          <span className="font-bold">{recipe.prep_time} min</span>
                        </div>
                      ) : null}
                      {recipe.cook_time ? (
                        <div className="flex items-center gap-2 bg-orange-50 text-orange-700 px-3 py-1.5 rounded-lg text-xs">
                          <span>Cuisson</span>
                          <span className="font-bold">{recipe.cook_time} min</span>
                        </div>
                      ) : null}
                      {totalTime > 0 && (
                        <div className="flex items-center gap-2 bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-xs">
                          <span>Total</span>
                          <span className="font-bold">{totalTime} min</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Utensils */}
                  {utensils.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-muted uppercase mb-2">Ustensiles</h4>
                      <div className="flex flex-wrap gap-2">
                        {utensils.map((u, i) => (
                          <span key={i} className="text-xs bg-card-hover px-2.5 py-1 rounded-lg">
                            🍳 {u}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Ingredients */}
                  {recipe.ingredients.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-muted uppercase mb-2">
                        Ingrédients ({recipe.servings} pers.)
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                        {recipe.ingredients.map((ing, i) => (
                          <button
                            key={i}
                            onClick={() => addOneToList(ing, recipe.name)}
                            className="flex items-center gap-2 text-sm py-1.5 px-2 rounded-lg hover:bg-primary-light transition-colors text-left group"
                            title="Ajouter à ma liste"
                          >
                            <span className="w-5 h-5 rounded-full border border-border group-hover:border-primary group-hover:bg-primary group-hover:text-white flex items-center justify-center text-xs shrink-0 transition-colors">
                              +
                            </span>
                            <span className="font-medium">
                              {ing.quantity && `${ing.quantity}`}
                              {ing.unit && ` ${ing.unit}`}
                            </span>
                            <span>{ing.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Steps */}
                  {steps.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-muted uppercase mb-2">Étapes</h4>
                      <ol className="space-y-2">
                        {steps.map((step, i) => (
                          <li key={i} className="flex gap-3 text-sm">
                            <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                              {i + 1}
                            </span>
                            <p className="text-sm leading-relaxed">{step}</p>
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

      {filteredRecipes.length === 0 && !showAdd && (
        <div className="text-center py-12 text-muted">
          <p className="text-4xl mb-3">📖</p>
          <p>Aucune recette trouvée</p>
          <p className="text-sm mt-1">
            {search || filterCategory
              ? "Essaie de modifier ta recherche"
              : "Ajoutez vos recettes ou demandez des suggestions à l'IA"}
          </p>
        </div>
      )}
      </div>
    </div>
  );
}
