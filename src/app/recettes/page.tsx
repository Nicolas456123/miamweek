"use client";

import { useState, useEffect } from "react";

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
  ingredients: Ingredient[];
};

export default function RecettesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    servings: 2,
    category: "",
    ingredients: [{ name: "", quantity: null as number | null, unit: "", category: "" }],
  });
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const fetchRecipes = () => {
    fetch("/api/recipes")
      .then((r) => r.json())
      .then(setRecipes)
      .catch(console.error);
  };

  useEffect(() => {
    fetchRecipes();
  }, []);

  const resetForm = () => {
    setForm({
      name: "",
      description: "",
      servings: 2,
      category: "",
      ingredients: [{ name: "", quantity: null, unit: "", category: "" }],
    });
    setShowAdd(false);
    setEditingId(null);
  };

  const addIngredientRow = () => {
    setForm({
      ...form,
      ingredients: [
        ...form.ingredients,
        { name: "", quantity: null, unit: "", category: "" },
      ],
    });
  };

  const removeIngredientRow = (index: number) => {
    setForm({
      ...form,
      ingredients: form.ingredients.filter((_, i) => i !== index),
    });
  };

  const updateIngredient = (
    index: number,
    field: string,
    value: string | number | null
  ) => {
    const updated = [...form.ingredients];
    updated[index] = { ...updated[index], [field]: value };
    setForm({ ...form, ingredients: updated });
  };

  const saveRecipe = async () => {
    if (!form.name.trim()) return;
    const validIngredients = form.ingredients.filter((i) => i.name.trim());

    if (editingId) {
      await fetch(`/api/recipes/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, ingredients: validIngredients }),
      });
    } else {
      await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, ingredients: validIngredients }),
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
    setForm({
      name: recipe.name,
      description: recipe.description || "",
      servings: recipe.servings,
      category: recipe.category || "",
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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold">Recettes</h1>
        <span className="text-sm text-muted">
          {recipes.length} recette{recipes.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* AI suggestion */}
      <div className="mb-4 bg-card border border-border rounded-xl p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && generateWithAI()}
            placeholder="Demande une recette à l'IA... (ex: 'pâtes carbonara', 'plat végétarien rapide')"
            className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm"
          />
          <button
            onClick={generateWithAI}
            disabled={aiLoading}
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {aiLoading ? "..." : "Suggérer"}
          </button>
        </div>
      </div>

      {/* Add/Edit recipe form */}
      {showAdd ? (
        <div className="mb-4 bg-card border border-border rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Nom de la recette"
              className="bg-background border border-border rounded-lg px-3 py-2 text-sm"
              autoFocus
            />
            <input
              type="text"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              placeholder="Catégorie (ex: italien, rapide...)"
              className="bg-background border border-border rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Description / instructions"
            rows={2}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm"
          />
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Ingrédients</span>
              <div className="flex items-center gap-2">
                <label className="text-xs text-muted">Portions:</label>
                <input
                  type="number"
                  value={form.servings}
                  onChange={(e) =>
                    setForm({ ...form, servings: Number(e.target.value) })
                  }
                  className="w-16 bg-background border border-border rounded px-2 py-1 text-xs"
                  min={1}
                />
              </div>
            </div>
            {form.ingredients.map((ing, i) => (
              <div key={i} className="flex gap-2 mb-1.5">
                <input
                  type="text"
                  value={ing.name}
                  onChange={(e) => updateIngredient(i, "name", e.target.value)}
                  placeholder="Ingrédient"
                  className="flex-1 bg-background border border-border rounded px-2 py-1 text-xs"
                />
                <input
                  type="number"
                  value={ing.quantity ?? ""}
                  onChange={(e) =>
                    updateIngredient(
                      i,
                      "quantity",
                      e.target.value ? Number(e.target.value) : null
                    )
                  }
                  placeholder="Qté"
                  className="w-16 bg-background border border-border rounded px-2 py-1 text-xs"
                />
                <input
                  type="text"
                  value={ing.unit}
                  onChange={(e) => updateIngredient(i, "unit", e.target.value)}
                  placeholder="Unité"
                  className="w-16 bg-background border border-border rounded px-2 py-1 text-xs"
                />
                <button
                  onClick={() => removeIngredientRow(i)}
                  className="text-muted hover:text-danger text-xs px-1"
                >
                  x
                </button>
              </div>
            ))}
            <button
              onClick={addIngredientRow}
              className="text-xs text-primary hover:underline mt-1"
            >
              + Ajouter un ingrédient
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={saveRecipe}
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium"
            >
              {editingId ? "Modifier" : "Enregistrer"}
            </button>
            <button onClick={resetForm} className="text-muted text-sm px-4">
              Annuler
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          className="w-full mb-4 py-3 border border-dashed border-border rounded-xl text-muted hover:border-primary hover:text-primary text-sm"
        >
          + Ajouter une recette
        </button>
      )}

      {/* Recipes list */}
      <div className="space-y-3">
        {recipes.map((recipe) => (
          <div
            key={recipe.id}
            className="bg-card border border-border rounded-xl p-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-sm">{recipe.name}</h3>
                {recipe.description && (
                  <p className="text-xs text-muted mt-1">
                    {recipe.description}
                  </p>
                )}
                <div className="flex gap-2 mt-2">
                  {recipe.category && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                      {recipe.category}
                    </span>
                  )}
                  <span className="text-xs text-muted">
                    {recipe.servings} pers.
                  </span>
                  <span className="text-xs text-muted">
                    {recipe.ingredients.length} ingrédients
                  </span>
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => editRecipe(recipe)}
                  className="text-xs text-muted hover:text-foreground px-2 py-1"
                >
                  Modifier
                </button>
                <button
                  onClick={() => deleteRecipe(recipe.id)}
                  className="text-xs text-muted hover:text-danger px-2 py-1"
                >
                  Supprimer
                </button>
              </div>
            </div>
            {recipe.ingredients.length > 0 && (
              <div className="mt-3 pt-3 border-t border-border">
                <div className="flex flex-wrap gap-2">
                  {recipe.ingredients.map((ing, i) => (
                    <span
                      key={i}
                      className="text-xs bg-card-hover px-2 py-1 rounded"
                    >
                      {ing.quantity && `${ing.quantity}`}
                      {ing.unit && ` ${ing.unit}`} {ing.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {recipes.length === 0 && !showAdd && (
        <div className="text-center py-12 text-muted">
          <p className="text-4xl mb-3">📖</p>
          <p>Aucune recette enregistrée</p>
          <p className="text-sm mt-1">
            Ajoutez vos recettes ou demandez des suggestions à l&apos;IA
          </p>
        </div>
      )}
    </div>
  );
}
