"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { CategoryIcon } from "@/components/category-icons";
import { useOfflineSync, offlineFetch } from "@/lib/offline-sync";
import { useToast } from "@/components/toast";
import {
  Button,
  Card,
  Chip,
  EmptyState,
  PageHeader,
} from "@/components/ui-kit";

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
  const { toast } = useToast();
  const [items, setItems] = useState<ListItem[]>([]);
  const [quickAdd, setQuickAdd] = useState("");
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  const fetchItems = useCallback(() => {
    fetch("/api/list?status=active")
      .then((r) => r.json())
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const { isOnline, queueSize, isSyncing, syncNow, safeFetch } = useOfflineSync(fetchItems);

  useEffect(() => {
    fetchItems();
    const interval = setInterval(() => {
      if (navigator.onLine) safeFetch();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchItems, safeFetch]);

  const toggleItem = async (id: number, checked: boolean) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked: !checked ? 1 : 0 } : item))
    );

    const res = await offlineFetch("/api/list", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, checked: !checked }),
      offlineOptimistic: true,
    });

    if (res && !res.ok && navigator.onLine) {
      fetchItems();
    }
  };

  const addQuickItem = async () => {
    if (!quickAdd.trim()) return;

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

    if (navigator.onLine) {
      setTimeout(fetchItems, 300);
    }
  };

  const finishShopping = async () => {
    if (!navigator.onLine) {
      toast("Tu dois être en ligne pour terminer les courses.", "error");
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
    toast(`Courses terminées · ${data.itemsProcessed || 0} produit(s) ajouté(s) à l'inventaire.`);
    setTimeout(() => {
      window.location.href = "/inventaire";
    }, 1500);
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
      <div className="max-w-3xl mx-auto pb-24 md:pb-8">
        <PageHeader
          eyebrow="en magasin"
          title={
            <>
              Mode <span style={{ fontStyle: "italic", color: "var(--color-terracotta)" }}>courses</span>
            </>
          }
        />
        <EmptyState
          title="Pas de liste active"
          description="Prépare ta liste avant de partir en magasin — elle apparaîtra ici."
          action={
            <Link href="/liste">
              <Button variant="primary" size="lg">Préparer ma liste</Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pb-24 md:pb-8">
      {(!isOnline || queueSize > 0) && (
        <Card
          variant="default"
          padding="sm"
          className="mb-4 flex items-center justify-between"
          style={{
            background: !isOnline
              ? "rgba(201,162,39,0.15)"
              : "rgba(92,107,63,0.13)",
            borderColor: !isOnline
              ? "rgba(201,162,39,0.32)"
              : "rgba(92,107,63,0.28)",
          }}
        >
          <div
            className="text-sm flex items-center gap-2"
            style={{
              color: !isOnline ? "#8a6d10" : "var(--color-olive-deep)",
            }}
          >
            <span
              className="dot"
              style={{
                background: !isOnline ? "var(--color-mustard)" : "var(--color-olive)",
              }}
            />
            {!isOnline ? (
              <span>
                Hors-ligne — actions sauvegardées localement
                {queueSize > 0 && ` (${queueSize} en attente)`}
              </span>
            ) : (
              <span>
                {queueSize} modification{queueSize > 1 ? "s" : ""} en attente
              </span>
            )}
          </div>
          {isOnline && queueSize > 0 && (
            <Button variant="primary" size="sm" onClick={syncNow}>
              {isSyncing ? "Sync…" : "Sync"}
            </Button>
          )}
        </Card>
      )}

      <PageHeader
        eyebrow="en magasin"
        title={
          <>
            Mode <span style={{ fontStyle: "italic", color: "var(--color-terracotta)" }}>courses</span>
          </>
        }
        actions={
          <>
            <Button variant="ghost" size="md" onClick={cancelShopping}>
              Annuler
            </Button>
            <Button variant="ink" size="md" onClick={finishShopping} disabled={!isOnline}>
              Valider
            </Button>
          </>
        }
      />

      {/* Progress */}
      <Card variant="default" padding="md" className="mb-5">
        <div className="flex items-baseline justify-between mb-3">
          <span className="font-display text-3xl tnum" style={{ color: "var(--color-ink)" }}>
            {String(checkedCount).padStart(2, "0")}
            <span style={{ color: "var(--color-ink-faint)" }}> / {String(totalCount).padStart(2, "0")}</span>
          </span>
          <span className="font-mono text-xs tnum" style={{ color: "var(--color-ink-mute)", letterSpacing: "0.04em" }}>
            {Math.round(progress)}%
          </span>
        </div>
        <div
          className="w-full h-1 rounded-full overflow-hidden"
          style={{ background: "var(--color-line)" }}
        >
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${progress}%`,
              background:
                progress === 100 ? "var(--color-olive)" : "var(--color-terracotta)",
            }}
          />
        </div>
        {progress === 100 && (
          <p
            className="text-sm font-medium mt-3 text-center font-display"
            style={{ color: "var(--color-olive-deep)", fontStyle: "italic", fontSize: 18 }}
          >
            Tout est pris. Bon appétit.
          </p>
        )}
      </Card>

      {/* Quick add */}
      {showQuickAdd ? (
        <Card variant="default" padding="sm" className="mb-4 flex gap-2">
          <input
            type="text"
            value={quickAdd}
            onChange={(e) => setQuickAdd(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addQuickItem()}
            placeholder="Ajouter un article…"
            className="flex-1 bg-[var(--color-cream-pale)] border border-[var(--color-line)] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-terracotta)]"
            autoFocus
          />
          <Button variant="primary" size="md" onClick={addQuickItem}>
            +
          </Button>
          <Button variant="ghost" size="md" onClick={() => setShowQuickAdd(false)}>
            ×
          </Button>
        </Card>
      ) : (
        <button
          onClick={() => setShowQuickAdd(true)}
          className="w-full mb-4 py-2.5 border border-dashed rounded-md text-sm transition-colors hover:border-[var(--color-terracotta)] hover:text-[var(--color-terracotta-deep)]"
          style={{
            borderColor: "var(--color-line)",
            color: "var(--color-ink-mute)",
          }}
        >
          + Ajouter en direct
        </button>
      )}

      {/* Shopping list grouped by category */}
      <div className="space-y-4">
        {Object.entries(grouped)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([category, categoryItems]) => {
            const catChecked = categoryItems.filter((i) => !!i.checked).length;
            return (
              <Card
                key={category}
                variant="default"
                padding="none"
                className="overflow-hidden"
              >
                <div
                  className="px-4 py-3 flex items-center justify-between border-b"
                  style={{
                    borderColor: "var(--color-line)",
                    background: "var(--color-cream-deep)",
                  }}
                >
                  <h3 className="flex items-center gap-2.5">
                    <CategoryIcon category={category} size={14} />
                    <span
                      className="eyebrow"
                      style={{ color: "var(--color-ink-soft)" }}
                    >
                      {category}
                    </span>
                  </h3>
                  <span
                    className="font-mono text-xs tnum"
                    style={{ color: "var(--color-ink-mute)", letterSpacing: "0.04em" }}
                  >
                    {String(catChecked).padStart(2, "0")} / {String(categoryItems.length).padStart(2, "0")}
                  </span>
                </div>
                <div>
                  {categoryItems.map((item, idx) => (
                    <button
                      key={item.id}
                      onClick={() => toggleItem(item.id, !!item.checked)}
                      className="flex items-center gap-3 px-4 py-3 w-full text-left transition-colors hover:bg-[var(--color-cream-deep)]"
                      style={{
                        borderTop:
                          idx > 0 ? "1px solid var(--color-line-soft)" : "none",
                      }}
                    >
                      <div
                        className="w-5 h-5 rounded flex items-center justify-center shrink-0 transition-colors"
                        style={{
                          background: item.checked
                            ? "var(--color-olive)"
                            : "transparent",
                          border: `1.5px solid ${
                            item.checked ? "var(--color-olive)" : "var(--color-line)"
                          }`,
                          color: "var(--color-cream-pale)",
                        }}
                      >
                        {!!item.checked && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                      <div
                        className={`flex-1 min-w-0 ${
                          !!item.checked ? "line-through opacity-50" : ""
                        }`}
                      >
                        <span className="text-sm block truncate" style={{ color: "var(--color-ink)" }}>
                          {item.product_name}
                        </span>
                        {item.source_recipe && (
                          <span
                            className="font-mono text-[10px] block truncate"
                            style={{ color: "var(--color-terracotta-deep)", letterSpacing: "0.04em" }}
                          >
                            {item.source_recipe}
                          </span>
                        )}
                      </div>
                      {item.quantity && (
                        <span
                          className="font-mono text-xs tnum shrink-0"
                          style={{ color: "var(--color-ink-mute)" }}
                        >
                          {item.quantity} {item.unit}
                        </span>
                      )}
                      {item.source === "recipe" && !item.source_recipe && (
                        <Chip tone="terra">recette</Chip>
                      )}
                    </button>
                  ))}
                </div>
              </Card>
            );
          })}
      </div>
    </div>
  );
}
