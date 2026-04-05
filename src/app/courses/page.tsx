"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { CategoryIcon } from "@/components/category-icons";
import { useOfflineSync, offlineFetch } from "@/lib/offline-sync";

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
  source_recipe: string | null;
};

export default function CoursesPage() {
  const [items, setItems] = useState<ListItem[]>([]);
  const [quickAdd, setQuickAdd] = useState("");
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  const fetchItems = useCallback(() => {
    fetch("/api/list?status=active")
      .then((r) => r.json())
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch(() => {
        // Offline - keep current state
      });
  }, []);

  const { isOnline, queueSize, isSyncing, syncNow, safeFetch } = useOfflineSync(fetchItems);

  useEffect(() => {
    fetchItems();

    // Auto-refresh every 5s — but only if no pending offline mutations
    const interval = setInterval(() => {
      if (navigator.onLine) safeFetch();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchItems, safeFetch]);

  const toggleItem = async (id: number, checked: boolean) => {
    // Optimistic update - instant visual feedback always
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, checked: !checked ? 1 : 0 } : item
      )
    );

    // Send to server (queued if offline)
    const res = await offlineFetch("/api/list", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, checked: !checked }),
      offlineOptimistic: true,
    });

    // If server returned an error while online, revert
    if (res && !res.ok && navigator.onLine) {
      fetchItems();
    }
  };

  const addQuickItem = async () => {
    if (!quickAdd.trim()) return;

    // Optimistic: add to local list immediately
    const tempId = -Date.now();
    const newItem: ListItem = {
      id: tempId,
      product_id: null,
      product_name: quickAdd,
      quantity: 1,
      unit: "pcs",
      category: "Autre",
      checked: 0,
      source: "manual",
      list_status: "active",
      source_recipe: null,
    };
    setItems((prev) => [...prev, newItem]);
    setQuickAdd("");
    setShowQuickAdd(false);

    await offlineFetch("/api/list", {
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
      offlineOptimistic: true,
    });

    // Refresh to get real ID (if online)
    if (navigator.onLine) {
      setTimeout(fetchItems, 300);
    }
  };

  const finishShopping = async () => {
    if (!navigator.onLine) {
      alert("Tu dois être en ligne pour terminer les courses.");
      return;
    }
    const checked = items.filter((i) => !!i.checked).length;
    const unchecked = items.filter((i) => !i.checked).length;
    let msg = `Valider les courses ?\n\n${checked} article(s) pris`;
    if (unchecked > 0) msg += `\n${unchecked} article(s) non pris (seront supprimés)`;
    msg += `\n\nLes articles cochés seront ajoutés à ton inventaire.`;
    if (!confirm(msg)) return;

    const res = await fetch("/api/list/finish", { method: "POST" });
    const data = await res.json();
    alert(`Courses terminées !\n${data.itemsProcessed || 0} produit(s) ajouté(s) à l'inventaire.`);
    fetchItems();
  };

  const cancelShopping = async () => {
    if (!confirm("Annuler les courses ? La liste reviendra en mode préparation.")) return;
    await fetch("/api/list/cancel", { method: "POST" });
    window.location.href = "/liste";
  };

  const grouped = useMemo(() => {
    const groups: Record<string, ListItem[]> = {};
    for (const item of items) {
      const cat = item.category || "Autre";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    }
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
    <div className="max-w-xl mx-auto pb-20 md:pb-0">
      {/* Offline banner */}
      {(!isOnline || queueSize > 0) && (
        <div
          className={`mb-3 px-4 py-2.5 rounded-xl text-sm font-medium flex items-center justify-between ${
            !isOnline
              ? "bg-orange-100 text-orange-800 border border-orange-200"
              : "bg-blue-100 text-blue-800 border border-blue-200"
          }`}
        >
          <div className="flex items-center gap-2">
            <span>{!isOnline ? "📡" : "🔄"}</span>
            {!isOnline ? (
              <span>
                Mode hors-ligne — tes actions sont sauvegardées localement
                {queueSize > 0 && ` (${queueSize} en attente)`}
              </span>
            ) : (
              <span>
                {queueSize} modification{queueSize > 1 ? "s" : ""} en attente de
                synchronisation
              </span>
            )}
          </div>
          {isOnline && queueSize > 0 && (
            <button
              onClick={syncNow}
              className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-semibold"
            >
              Sync
            </button>
          )}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Mode courses</h1>
        <div className="flex gap-2">
          <button
            onClick={cancelShopping}
            className="px-4 py-2 bg-card border border-border text-muted rounded-xl text-sm font-medium hover:text-danger hover:border-danger transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={finishShopping}
            disabled={!isOnline}
            className="px-4 py-2 bg-success text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            Valider les courses
          </button>
        </div>
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
                    <div className={`flex-1 min-w-0 ${
                      !!item.checked ? "line-through opacity-50" : ""
                    }`}>
                      <span className="text-sm block truncate">{item.product_name}</span>
                      {item.source_recipe && (
                        <span className="text-[10px] text-orange-500 block truncate">
                          {item.source_recipe}
                        </span>
                      )}
                    </div>
                    {item.quantity && (
                      <span className="text-xs text-muted shrink-0">
                        {item.quantity} {item.unit}
                      </span>
                    )}
                    {item.source === "recipe" && !item.source_recipe && (
                      <span className="text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded shrink-0">
                        recette
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
