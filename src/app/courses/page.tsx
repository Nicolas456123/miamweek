"use client";

import { useState, useEffect, useCallback } from "react";
import { CATEGORIES, getMonday } from "@/lib/utils";

type ShoppingItem = {
  id: number;
  name: string;
  quantity: number | null;
  unit: string | null;
  category: string | null;
  checked: boolean;
  source: string;
};

export default function CoursesPage() {
  const [weekStart, setWeekStart] = useState(getMonday());
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [newItem, setNewItem] = useState("");
  const [newCategory, setNewCategory] = useState("Autre");
  const [newQuantity, setNewQuantity] = useState("");
  const [newUnit, setNewUnit] = useState("");
  const [generating, setGenerating] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  const fetchItems = useCallback(() => {
    fetch(`/api/shopping?weekStart=${weekStart}`)
      .then((r) => r.json())
      .then(setItems)
      .catch(console.error);
  }, [weekStart]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const addItem = async () => {
    if (!newItem.trim()) return;
    await fetch("/api/shopping", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        weekStart,
        name: newItem,
        quantity: newQuantity ? Number(newQuantity) : null,
        unit: newUnit || null,
        category: newCategory,
      }),
    });
    setNewItem("");
    setNewQuantity("");
    setNewUnit("");
    fetchItems();
  };

  const toggleItem = async (id: number, checked: boolean) => {
    await fetch("/api/shopping", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, checked: !checked }),
    });
    fetchItems();
  };

  const removeItem = async (id: number) => {
    await fetch("/api/shopping", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchItems();
  };

  const generateFromPlan = async () => {
    setGenerating(true);
    try {
      await fetch("/api/shopping/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weekStart }),
      });
      fetchItems();
    } catch (err) {
      console.error(err);
    }
    setGenerating(false);
  };

  const changeWeek = (delta: number) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7 * delta);
    setWeekStart(getMonday(d));
  };

  // Group items by category
  const grouped = items.reduce(
    (acc, item) => {
      const cat = item.category || "Autre";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    },
    {} as Record<string, ShoppingItem[]>
  );

  const checkedCount = items.filter((i) => i.checked).length;
  const totalCount = items.length;

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
        <div className="flex gap-2">
          <button
            onClick={generateFromPlan}
            disabled={generating}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover text-sm font-medium disabled:opacity-50"
          >
            {generating ? "Génération..." : "Générer depuis le planning"}
          </button>
        </div>
      </div>

      {/* Progress */}
      {totalCount > 0 && (
        <div className="mb-4 bg-card border border-border rounded-xl p-3">
          <div className="flex justify-between text-sm mb-2">
            <span>
              {checkedCount}/{totalCount} articles
            </span>
            <span className="text-muted">
              {Math.round((checkedCount / totalCount) * 100)}%
            </span>
          </div>
          <div className="w-full bg-border rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full"
              style={{
                width: `${(checkedCount / totalCount) * 100}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Add item */}
      <div className="mb-4">
        {showAdd ? (
          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addItem()}
                placeholder="Nom de l'article"
                className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm"
                autoFocus
              />
              <input
                type="number"
                value={newQuantity}
                onChange={(e) => setNewQuantity(e.target.value)}
                placeholder="Qté"
                className="w-20 bg-background border border-border rounded-lg px-3 py-2 text-sm"
              />
              <input
                type="text"
                value={newUnit}
                onChange={(e) => setNewUnit(e.target.value)}
                placeholder="Unité"
                className="w-20 bg-background border border-border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="bg-background border border-border rounded-lg px-3 py-2 text-sm"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <button
                onClick={addItem}
                className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium"
              >
                Ajouter
              </button>
              <button
                onClick={() => setShowAdd(false)}
                className="px-4 py-2 text-muted text-sm"
              >
                Annuler
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAdd(true)}
            className="w-full py-3 border border-dashed border-border rounded-xl text-muted hover:border-primary hover:text-primary text-sm"
          >
            + Ajouter un article
          </button>
        )}
      </div>

      {/* Shopping list grouped by category */}
      <div className="space-y-3">
        {Object.entries(grouped)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([category, categoryItems]) => (
            <div
              key={category}
              className="bg-card border border-border rounded-xl overflow-hidden"
            >
              <div className="px-4 py-2 bg-card-hover border-b border-border">
                <h3 className="text-sm font-semibold">{category}</h3>
              </div>
              <div className="divide-y divide-border">
                {categoryItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-card-hover"
                  >
                    <button
                      onClick={() => toggleItem(item.id, item.checked)}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center text-xs ${
                        item.checked
                          ? "bg-success border-success text-white"
                          : "border-border hover:border-primary"
                      }`}
                    >
                      {item.checked && "✓"}
                    </button>
                    <span
                      className={`flex-1 text-sm ${
                        item.checked
                          ? "line-through opacity-50"
                          : ""
                      }`}
                    >
                      {item.name}
                    </span>
                    {item.quantity && (
                      <span className="text-xs text-muted">
                        {item.quantity}
                        {item.unit ? ` ${item.unit}` : ""}
                      </span>
                    )}
                    {item.source === "auto" && (
                      <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                        auto
                      </span>
                    )}
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-muted hover:text-danger text-sm"
                    >
                      x
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
      </div>

      {totalCount === 0 && (
        <div className="text-center py-12 text-muted">
          <p className="text-4xl mb-3">🛒</p>
          <p>Aucun article pour cette semaine</p>
          <p className="text-sm mt-1">
            Ajoutez des articles ou générez la liste depuis le planning
          </p>
        </div>
      )}
    </div>
  );
}
