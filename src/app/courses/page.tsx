"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { CategoryIcon } from "@/components/category-icons";

type ListItem = {
  id: number;
  product_id: number | null;
  product_name: string;
  quantity: number | null;
  unit: string | null;
  category: string | null;
  checked: boolean | number;
  source: string;
  list_status: string;
};

export default function CoursesPage() {
  const [items, setItems] = useState<ListItem[]>([]);
  const [quickAdd, setQuickAdd] = useState("");
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  const fetchItems = () => {
    fetch("/api/list?status=active")
      .then((r) => r.json())
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch(console.error);
  };

  useEffect(() => {
    fetchItems();

    // Auto-refresh every 5s for multi-user sync
    const interval = setInterval(fetchItems, 5000);
    return () => clearInterval(interval);
  }, []);

  const toggleItem = (id: number, checked: boolean) => {
    // Optimistic update - instant visual feedback
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, checked: !checked ? 1 : 0 } : item
      )
    );
    // Sync with server in background
    fetch("/api/list", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, checked: !checked }),
    }).catch(() => fetchItems()); // revert on error
  };

  const addQuickItem = async () => {
    if (!quickAdd.trim()) return;
    await fetch("/api/list", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productName: quickAdd,
        quantity: 1,
        unit: "pcs",
        category: "Autre",
        source: "manual",
        listStatus: "active",
      }),
    });
    setQuickAdd("");
    setShowQuickAdd(false);
    fetchItems();
  };

  const finishShopping = async () => {
    await fetch("/api/list/finish", { method: "POST" });
    fetchItems();
  };

  const grouped = useMemo(() => {
    const groups: Record<string, ListItem[]> = {};
    for (const item of items) {
      const cat = item.category || "Autre";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    }
    // Keep original order - no sorting to avoid items jumping when checked
    return groups;
  }, [items]);

  const checkedCount = items.filter((i) => !!i.checked).length;
  const totalCount = items.length;
  const progress = totalCount > 0 ? (checkedCount / totalCount) * 100 : 0;

  if (totalCount === 0) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <div className="text-6xl mb-4">🛒</div>
        <h1 className="text-xl font-bold mb-2">Pas de liste active</h1>
        <p className="text-muted mb-6">
          Prépare ta liste de courses avant de partir en magasin
        </p>
        <Link
          href="/liste"
          className="px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-hover transition-colors"
        >
          Préparer ma liste
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Mode courses</h1>
        <button
          onClick={finishShopping}
          className="px-4 py-2 bg-success text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          Terminer
        </button>
      </div>

      {/* Progress */}
      <div className="bg-card border border-border rounded-xl p-4 mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="font-medium">
            {checkedCount}/{totalCount} articles
          </span>
          <span className="text-muted">{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-border rounded-full h-3 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${progress}%`,
              backgroundColor:
                progress === 100
                  ? "var(--color-success)"
                  : "var(--color-primary)",
            }}
          />
        </div>
        {progress === 100 && (
          <p className="text-sm text-success font-medium mt-2 text-center">
            Tout est pris ! Bon appétit !
          </p>
        )}
      </div>

      {/* Quick add */}
      {showQuickAdd ? (
        <div className="bg-card border border-border rounded-xl p-3 mb-4 flex gap-2">
          <input
            type="text"
            value={quickAdd}
            onChange={(e) => setQuickAdd(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addQuickItem()}
            placeholder="Ajouter un article..."
            className="flex-1 border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            autoFocus
          />
          <button
            onClick={addQuickItem}
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium"
          >
            +
          </button>
          <button
            onClick={() => setShowQuickAdd(false)}
            className="px-2 text-muted"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowQuickAdd(true)}
          className="w-full mb-4 py-2.5 border border-dashed border-border rounded-xl text-muted hover:border-primary hover:text-primary text-sm transition-colors"
        >
          + Ajouter en direct
        </button>
      )}

      {/* Shopping list */}
      <div className="space-y-3">
        {Object.entries(grouped)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([category, categoryItems]) => (
            <div
              key={category}
              className="bg-card border border-border rounded-xl overflow-hidden"
            >
              <div className="px-4 py-2 bg-card-hover border-b border-border">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <CategoryIcon category={category} size={16} />
                  {category}
                  <span className="text-muted font-normal">
                    {categoryItems.filter((i) => !!i.checked).length}/
                    {categoryItems.length}
                  </span>
                </h3>
              </div>
              <div className="divide-y divide-border">
                {categoryItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => toggleItem(item.id, !!item.checked)}
                    className="flex items-center gap-3 px-4 py-3 w-full text-left hover:bg-card-hover transition-colors"
                  >
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs transition-colors ${
                        !!item.checked
                          ? "bg-success border-success text-white"
                          : "border-border hover:border-primary"
                      }`}
                    >
                      {!!item.checked && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      )}
                    </div>
                    <span
                      className={`flex-1 text-sm ${
                        !!item.checked
                          ? "line-through text-muted"
                          : "text-foreground"
                      }`}
                    >
                      {item.product_name}
                    </span>
                    {item.quantity && (
                      <span className="text-xs text-muted">
                        {item.quantity} {item.unit}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
