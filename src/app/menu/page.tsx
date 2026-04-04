"use client";

import { useState, useEffect } from "react";

type Recipe = {
  id: number;
  name: string;
  description: string | null;
  servings: number;
  category: string | null;
  ingredients: { name: string; quantity: number | null; unit: string | null; category: string | null }[];
};

type Suggestion = {
  name: string;
  description: string;
};

export default function MenuPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedPlat, setSelectedPlat] = useState<Recipe | null>(null);
  const [wantEntree, setWantEntree] = useState(true);
  const [wantDessert, setWantDessert] = useState(true);
  const [wantBoisson, setWantBoisson] = useState(true);
  const [suggestions, setSuggestions] = useState<{
    entree?: Suggestion;
    dessert?: Suggestion;
    boisson?: Suggestion;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [addedToList, setAddedToList] = useState(false);

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
          wantEntree,
          wantDessert,
          wantBoisson,
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
    // Add main dish ingredients
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
          sourceRecipe: `Menu: ${selectedPlat.name}`,
        }),
      });
    }
    // Add suggestions names as notes
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
          sourceRecipe: `Menu: ${selectedPlat.name}`,
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
          sourceRecipe: `Menu: ${selectedPlat.name}`,
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
          sourceRecipe: `Menu: ${selectedPlat.name}`,
        }),
      });
    }
    setAddedToList(true);
  };

  const filteredRecipes = search
    ? recipes.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()))
    : recipes;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-bold mb-4">Composer un menu</h1>

      {/* Step 1: Choose main dish */}
      <div className="bg-card border border-border rounded-xl p-4 mb-4">
        <h2 className="font-semibold mb-3 flex items-center gap-2">
          <span className="w-6 h-6 bg-primary text-white rounded-full text-xs flex items-center justify-center font-bold">1</span>
          Choisis ton plat principal
        </h2>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher une recette..."
          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-primary/30"
        />

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-60 overflow-y-auto">
          {filteredRecipes
            .filter((r) => r.category !== "Dessert")
            .map((recipe) => (
              <button
                key={recipe.id}
                onClick={() => {
                  setSelectedPlat(recipe);
                  setSuggestions(null);
                  setAddedToList(false);
                }}
                className={`p-3 rounded-xl border text-left text-sm transition-all ${
                  selectedPlat?.id === recipe.id
                    ? "bg-primary-light border-primary"
                    : "bg-background border-border hover:border-primary"
                }`}
              >
                <p className="font-medium truncate">{recipe.name}</p>
                {recipe.category && (
                  <p className="text-xs text-muted">{recipe.category}</p>
                )}
              </button>
            ))}
        </div>
      </div>

      {/* Step 2: Choose what to accompany */}
      {selectedPlat && (
        <div className="bg-card border border-border rounded-xl p-4 mb-4">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <span className="w-6 h-6 bg-primary text-white rounded-full text-xs flex items-center justify-center font-bold">2</span>
            Que veux-tu avec &quot;{selectedPlat.name}&quot; ?
          </h2>

          <div className="flex flex-wrap gap-3 mb-4">
            {[
              { key: "entree", label: "Entrée", icon: "🥗", state: wantEntree, set: setWantEntree },
              { key: "dessert", label: "Dessert", icon: "🍰", state: wantDessert, set: setWantDessert },
              { key: "boisson", label: "Boisson", icon: "🍷", state: wantBoisson, set: setWantBoisson },
            ].map((opt) => (
              <button
                key={opt.key}
                onClick={() => opt.set(!opt.state)}
                className={`px-4 py-3 rounded-xl border text-sm font-medium flex items-center gap-2 transition-colors ${
                  opt.state
                    ? "bg-primary-light border-primary text-primary"
                    : "bg-background border-border text-muted"
                }`}
              >
                <span className="text-xl">{opt.icon}</span>
                {opt.label}
              </button>
            ))}
          </div>

          <button
            onClick={getSuggestions}
            disabled={loading || (!wantEntree && !wantDessert && !wantBoisson)}
            className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-hover disabled:opacity-50 transition-colors"
          >
            {loading ? "Recherche d'associations..." : "Suggérer des associations"}
          </button>
        </div>
      )}

      {/* Step 3: Suggestions */}
      {suggestions && (
        <div className="bg-card border-2 border-primary/30 rounded-xl p-4 mb-4">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <span className="w-6 h-6 bg-primary text-white rounded-full text-xs flex items-center justify-center font-bold">3</span>
            Menu suggéré
          </h2>

          <div className="space-y-3">
            {suggestions.entree && (
              <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-xl p-3">
                <span className="text-2xl">🥗</span>
                <div>
                  <p className="text-xs font-semibold text-green-600 uppercase">Entrée</p>
                  <p className="font-medium text-sm">{suggestions.entree.name}</p>
                  <p className="text-xs text-muted">{suggestions.entree.description}</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3 bg-orange-50 border border-orange-200 rounded-xl p-3">
              <span className="text-2xl">🍽️</span>
              <div>
                <p className="text-xs font-semibold text-orange-600 uppercase">Plat principal</p>
                <p className="font-medium text-sm">{selectedPlat?.name}</p>
                <p className="text-xs text-muted">{selectedPlat?.description}</p>
              </div>
            </div>

            {suggestions.dessert && (
              <div className="flex items-start gap-3 bg-pink-50 border border-pink-200 rounded-xl p-3">
                <span className="text-2xl">🍰</span>
                <div>
                  <p className="text-xs font-semibold text-pink-600 uppercase">Dessert</p>
                  <p className="font-medium text-sm">{suggestions.dessert.name}</p>
                  <p className="text-xs text-muted">{suggestions.dessert.description}</p>
                </div>
              </div>
            )}

            {suggestions.boisson && (
              <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-3">
                <span className="text-2xl">🍷</span>
                <div>
                  <p className="text-xs font-semibold text-blue-600 uppercase">Boisson</p>
                  <p className="font-medium text-sm">{suggestions.boisson.name}</p>
                  <p className="text-xs text-muted">{suggestions.boisson.description}</p>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={addMenuToList}
            disabled={addedToList}
            className={`mt-4 w-full py-3 rounded-xl text-sm font-semibold transition-colors ${
              addedToList
                ? "bg-primary-light text-primary"
                : "bg-primary text-white hover:bg-primary-hover"
            }`}
          >
            {addedToList ? "Ajouté à ma liste !" : "Ajouter tout le menu à ma liste"}
          </button>
        </div>
      )}
    </div>
  );
}
