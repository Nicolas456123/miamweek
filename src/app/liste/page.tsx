"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Link from "next/link";
import { useToast } from "@/components/toast";
import { useOfflineSync, offlineFetch } from "@/lib/offline-sync";

type Product = {
  id: number;
  name: string;
  category: string;
  default_unit: string;
  default_quantity: number | null;
  icon: string | null;
};

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

const NUMERALS_FR = [
  "Zéro",
  "Un",
  "Deux",
  "Trois",
  "Quatre",
  "Cinq",
  "Six",
  "Sept",
  "Huit",
  "Neuf",
  "Dix",
  "Onze",
  "Douze",
  "Treize",
  "Quatorze",
  "Quinze",
  "Seize",
  "Dix-sept",
  "Dix-huit",
  "Dix-neuf",
  "Vingt",
];
const MONTHS_FR_SHORT = ["JAN", "FÉV", "MAR", "AVR", "MAI", "JUN", "JUL", "AOÛ", "SEP", "OCT", "NOV", "DÉC"];

const CATEGORY_ORDER = [
  "Fruits & Légumes",
  "Viandes & Poissons",
  "Produits laitiers",
  "Boulangerie",
  "Épicerie",
  "Surgelés",
  "Boissons",
  "Hygiène & Beauté",
  "Entretien & Maison",
  "Épices & Condiments",
  "Autre",
];

function fmtQty(qty: number): string {
  if (Number.isInteger(qty)) return String(qty);
  return qty.toFixed(2).replace(/\.?0+$/, "");
}

function getStep(unit: string): number {
  const u = unit.toLowerCase();
  if (u === "g" || u === "ml") return 50;
  if (u === "kg" || u === "l") return 0.25;
  return 1;
}

function numeralFR(n: number): string {
  if (n >= 0 && n < NUMERALS_FR.length) return NUMERALS_FR[n];
  return String(n);
}

export default function ListePage() {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<ListItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [customName, setCustomName] = useState("");
  const [customQty, setCustomQty] = useState("");
  const [customUnit, setCustomUnit] = useState("pcs");
  const [now, setNow] = useState<Date | null>(null);
  const nextTempIdRef = useRef(-1);

  useEffect(() => {
    setNow(new Date());
  }, []);

  const fetchList = useCallback(() => {
    fetch("/api/list?status=prep")
      .then((r) => r.json())
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const { safeFetch } = useOfflineSync(fetchList);

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((d) => setProducts(Array.isArray(d) ? d : []))
      .catch(console.error);
    fetchList();
    const id = setInterval(() => {
      if (navigator.onLine) safeFetch();
    }, 5000);
    return () => clearInterval(id);
  }, [fetchList, safeFetch]);

  const addProduct = (p: Product) => {
    const tempId = nextTempIdRef.current--;
    const qty = p.default_quantity || 1;
    const newItem: ListItem = {
      id: tempId,
      product_id: p.id,
      product_name: p.name,
      quantity: qty,
      unit: p.default_unit,
      category: p.category,
      checked: 0,
      source: "manual",
      list_status: "prep",
      source_recipe: null,
    };
    setItems((prev) => [...prev, newItem]);
    offlineFetch("/api/list", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: p.id,
        productName: p.name,
        quantity: qty,
        unit: p.default_unit,
        category: p.category,
        source: "manual",
        listStatus: "prep",
      }),
      offlineOptimistic: true,
    }).then((r) => r?.json()).then((saved) => {
      if (saved && !saved.queued) {
        setItems((prev) => prev.map((it) => (it.id === tempId ? saved : it)));
      }
    }).catch(() => {});
    setProductSearch("");
  };

  const addCustom = () => {
    if (!customName.trim()) return;
    const tempId = nextTempIdRef.current--;
    const newItem: ListItem = {
      id: tempId,
      product_id: null,
      product_name: customName,
      quantity: customQty ? Number(customQty) : 1,
      unit: customUnit,
      category: activeCategory || "Autre",
      checked: 0,
      source: "manual",
      list_status: "prep",
      source_recipe: null,
    };
    setItems((prev) => [...prev, newItem]);
    offlineFetch("/api/list", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productName: customName,
        quantity: customQty ? Number(customQty) : 1,
        unit: customUnit,
        category: activeCategory || "Autre",
        source: "manual",
        listStatus: "prep",
      }),
      offlineOptimistic: true,
    }).then((r) => r?.json()).then((saved) => {
      if (saved && !saved.queued) {
        setItems((prev) => prev.map((it) => (it.id === tempId ? saved : it)));
      }
    }).catch(() => {});
    setCustomName("");
    setCustomQty("");
    setShowAdd(false);
  };

  const toggleCheck = (item: ListItem) => {
    const next = !item.checked;
    setItems((prev) => prev.map((it) => (it.id === item.id ? { ...it, checked: next ? 1 : 0 } : it)));
    offlineFetch("/api/list", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, checked: next }),
      offlineOptimistic: true,
    }).catch(() => {});
  };

  const updateQty = (item: ListItem, delta: number) => {
    const step = getStep(item.unit || "pcs") * delta;
    const newQty = Math.max(0, (item.quantity || 0) + step);
    if (newQty === 0) {
      removeItem(item.id);
      return;
    }
    setItems((prev) => prev.map((it) => (it.id === item.id ? { ...it, quantity: newQty } : it)));
    offlineFetch("/api/list", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, quantity: newQty }),
      offlineOptimistic: true,
    }).catch(() => {});
  };

  const removeItem = (id: number) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
    if (id < 0) return;
    fetch("/api/list", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    }).catch(() => {});
  };

  const validateAndGoToCourses = async () => {
    if (items.length === 0) {
      toast("La liste est vide.");
      return;
    }
    await fetch("/api/list/validate", { method: "POST" });
    window.location.href = "/courses";
  };

  // Filter
  const visibleItems = useMemo(() => {
    if (!activeCategory) return items;
    return items.filter((it) => (it.category || "Autre") === activeCategory);
  }, [items, activeCategory]);

  // Group by category, ordered
  const grouped = useMemo(() => {
    const groups: Record<string, ListItem[]> = {};
    for (const it of visibleItems) {
      const cat = it.category || "Autre";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(it);
    }
    const ordered: [string, ListItem[]][] = [];
    for (const cat of CATEGORY_ORDER) {
      if (groups[cat]) ordered.push([cat, groups[cat]]);
    }
    for (const [cat, list] of Object.entries(groups)) {
      if (!CATEGORY_ORDER.includes(cat)) ordered.push([cat, list]);
    }
    return ordered;
  }, [visibleItems]);

  // Stats
  const checkedCount = items.filter((i) => !!i.checked).length;
  const totalCount = items.length;
  const totalEstimated = items.reduce((acc, it) => acc + (it.quantity || 1) * 1.8, 0);
  const recipeSources = useMemo(() => {
    const set = new Set<string>();
    for (const it of items) if (it.source_recipe) set.add(it.source_recipe);
    return set.size;
  }, [items]);

  const filteredProducts = useMemo(() => {
    if (!productSearch) return [];
    const s = productSearch.toLowerCase();
    return products.filter((p) => p.name.toLowerCase().includes(s)).slice(0, 12);
  }, [products, productSearch]);

  // Title — nN articles, un panier
  const articlesNum = totalCount > 0 ? numeralFR(totalCount).toLowerCase() : "zéro";

  // Categories with counts (unfiltered)
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const it of items) {
      const cat = it.category || "Autre";
      counts[cat] = (counts[cat] || 0) + 1;
    }
    return counts;
  }, [items]);

  const weekLabel = useMemo(() => {
    if (!now) return "";
    const wn = Math.ceil(((+now - +new Date(now.getFullYear(), 0, 1)) / 86400000 + 1) / 7);
    return `LISTE DE COURSES · SEM. ${String(wn).padStart(2, "0")}`;
  }, [now]);

  return (
    <div className="pb-24 md:pb-8">
      {/* Eyebrow + action */}
      <div className="flex items-baseline justify-between mb-5">
        <p className="eyebrow">{weekLabel}</p>
        {totalCount > 0 && (
          <button
            onClick={validateAndGoToCourses}
            className="rounded-full px-4 py-2 text-sm font-medium transition-colors"
            style={{
              background: "var(--color-terracotta)",
              color: "var(--color-cream-pale)",
              border: "1px solid var(--color-terracotta)",
            }}
          >
            Mode courses →
          </button>
        )}
      </div>

      {/* Hero + stats */}
      <header
        className="pb-8 mb-6 border-b flex flex-col md:flex-row md:items-end md:justify-between gap-6"
        style={{ borderColor: "var(--color-line)" }}
      >
        <h1
          className="font-display tracking-tight"
          style={{
            color: "var(--color-ink)",
            fontSize: "clamp(36px, 5vw, 72px)",
            lineHeight: 1.0,
            letterSpacing: "-0.02em",
            maxWidth: "16ch",
          }}
        >
          <span style={{ fontStyle: "italic", color: "var(--color-terracotta)" }}>
            {articlesNum}
          </span>{" "}
          articles,{" "}
          <span style={{ fontStyle: "italic", color: "var(--color-terracotta)" }}>
            un panier.
          </span>
        </h1>

        <div className="grid grid-cols-3 gap-6 md:gap-8 shrink-0">
          <div className="text-right">
            <p className="font-display tnum leading-none" style={{ fontSize: 36, color: "var(--color-ink)" }}>
              {String(totalCount).padStart(2, "0")}
            </p>
            <p className="eyebrow mt-1.5">à acheter</p>
          </div>
          <div className="text-right">
            <p className="font-display tnum leading-none" style={{ fontSize: 36, color: "var(--color-ink)" }}>
              {String(checkedCount).padStart(2, "0")}
            </p>
            <p className="eyebrow mt-1.5">cochés</p>
          </div>
          <div className="text-right">
            <p
              className="font-display tnum leading-none"
              style={{ fontSize: 36, color: "var(--color-terracotta)", fontStyle: "italic" }}
            >
              {totalEstimated.toFixed(2).replace(".", ",")}€
            </p>
            <p className="eyebrow mt-1.5">estimé</p>
          </div>
        </div>
      </header>

      {/* Filter chips */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="eyebrow mr-2">filtrer</span>
        <button
          onClick={() => setActiveCategory(null)}
          className="font-mono text-[11px] uppercase tracking-wider rounded-full px-3 py-1 transition-colors"
          style={{
            background: !activeCategory ? "var(--color-ink)" : "var(--color-cream-pale)",
            color: !activeCategory ? "var(--color-cream-pale)" : "var(--color-ink-soft)",
            border: "1px solid",
            borderColor: !activeCategory ? "var(--color-ink)" : "var(--color-line)",
            letterSpacing: "0.06em",
          }}
        >
          Tous · {String(totalCount).padStart(2, "0")}
        </button>
        {CATEGORY_ORDER.filter((c) => categoryCounts[c]).map((cat) => {
          const active = activeCategory === cat;
          const short = cat
            .replace("Produits laitiers", "Laitiers")
            .replace("Fruits & Légumes", "Fruits & Lég")
            .replace("Viandes & Poissons", "Viandes")
            .replace("Hygiène & Beauté", "Hygiène")
            .replace("Entretien & Maison", "Entretien")
            .replace("Épices & Condiments", "Épices");
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(active ? null : cat)}
              className="font-mono text-[11px] uppercase tracking-wider rounded-full px-3 py-1 transition-colors"
              style={{
                background: active ? "var(--color-terracotta)" : "var(--color-cream-pale)",
                color: active ? "var(--color-cream-pale)" : "var(--color-ink-soft)",
                border: "1px solid",
                borderColor: active ? "var(--color-terracotta)" : "var(--color-line)",
                letterSpacing: "0.06em",
              }}
            >
              {short} · {String(categoryCounts[cat]).padStart(2, "0")}
            </button>
          );
        })}
      </div>

      {/* Source meta */}
      <div className="flex items-center justify-between mb-8 text-sm">
        <p style={{ color: "var(--color-ink-mute)" }}>
          {recipeSources > 0
            ? `généré depuis ${recipeSources} recette${recipeSources > 1 ? "s" : ""}`
            : "ajouté manuellement"}
        </p>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="text-sm hover:underline"
          style={{ color: "var(--color-terracotta-deep)" }}
        >
          {showAdd ? "× Annuler" : "+ Ajouter manuel"}
        </button>
      </div>

      {/* Custom add panel */}
      {showAdd && (
        <div
          className="mb-8 rounded-md p-5 space-y-3"
          style={{ background: "var(--color-cream-deep)" }}
        >
          <input
            type="text"
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            placeholder="Chercher un produit dans le catalogue…"
            className="w-full bg-[var(--color-cream-pale)] border border-[var(--color-line)] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-terracotta)]"
          />
          {filteredProducts.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {filteredProducts.map((p) => (
                <button
                  key={p.id}
                  onClick={() => addProduct(p)}
                  className="px-3 py-2 rounded-md border text-left text-sm transition-colors hover:bg-[var(--color-cream-pale)]"
                  style={{
                    background: "var(--color-cream-pale)",
                    borderColor: "var(--color-line)",
                    color: "var(--color-ink-soft)",
                  }}
                >
                  {p.name}
                </button>
              ))}
            </div>
          )}
          <div className="flex flex-col md:flex-row gap-2 pt-3 border-t" style={{ borderColor: "var(--color-line)" }}>
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addCustom()}
              placeholder="Ou un produit hors catalogue…"
              className="flex-1 bg-[var(--color-cream-pale)] border border-[var(--color-line)] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-terracotta)]"
            />
            <input
              type="number"
              value={customQty}
              onChange={(e) => setCustomQty(e.target.value)}
              placeholder="qté"
              className="md:w-20 bg-[var(--color-cream-pale)] border border-[var(--color-line)] rounded-md px-3 py-2 text-sm tnum focus:outline-none focus:border-[var(--color-terracotta)]"
            />
            <input
              type="text"
              value={customUnit}
              onChange={(e) => setCustomUnit(e.target.value)}
              placeholder="unité"
              className="md:w-20 bg-[var(--color-cream-pale)] border border-[var(--color-line)] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-terracotta)]"
            />
            <button
              onClick={addCustom}
              disabled={!customName.trim()}
              className="rounded-full px-4 py-2 text-sm font-medium disabled:opacity-50"
              style={{
                background: "var(--color-terracotta)",
                color: "var(--color-cream-pale)",
                border: "1px solid var(--color-terracotta)",
              }}
            >
              Ajouter
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {totalCount === 0 && !showAdd && (
        <div className="text-center py-16">
          <div className="placeholder-img mx-auto mb-6" style={{ width: 96, height: 96 }}>
            ∅
          </div>
          <h2 className="font-display text-3xl mb-2" style={{ color: "var(--color-ink)" }}>
            Liste vide
          </h2>
          <p className="text-sm mb-6" style={{ color: "var(--color-ink-mute)" }}>
            Génère depuis le planning ou ajoute manuellement.
          </p>
          <div className="flex justify-center gap-2">
            <Link
              href="/planning"
              className="rounded-full px-5 py-2.5 text-sm transition-colors"
              style={{
                background: "var(--color-cream-pale)",
                border: "1px solid var(--color-line)",
                color: "var(--color-ink-soft)",
              }}
            >
              Vers planning
            </Link>
            <button
              onClick={() => setShowAdd(true)}
              className="rounded-full px-5 py-2.5 text-sm font-medium"
              style={{
                background: "var(--color-terracotta)",
                color: "var(--color-cream-pale)",
                border: "1px solid var(--color-terracotta)",
              }}
            >
              + Ajouter
            </button>
          </div>
        </div>
      )}

      {/* Sections grouped by category */}
      <div className="space-y-12">
        {grouped.map(([cat, list], idx) => (
          <section key={cat}>
            <header className="flex items-baseline gap-3 mb-5">
              <span
                className="font-mono text-xs tnum"
                style={{ color: "var(--color-ink-faint)", letterSpacing: "0.08em" }}
              >
                {String(idx + 1).padStart(2, "0")}
              </span>
              <h2
                className="font-display tracking-tight"
                style={{ fontSize: 30, color: "var(--color-ink)", lineHeight: 1.05, fontStyle: "italic" }}
              >
                {cat}
              </h2>
              <span
                className="font-mono text-xs tnum"
                style={{ color: "var(--color-ink-mute)", letterSpacing: "0.06em", marginLeft: "auto" }}
              >
                {String(list.length).padStart(2, "0")} article{list.length > 1 ? "s" : ""}
              </span>
            </header>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-px" style={{ background: "var(--color-line)" }}>
              {list.map((it) => (
                <div
                  key={it.id}
                  className="flex items-center gap-3 px-1 py-3"
                  style={{ background: "var(--color-cream)" }}
                >
                  <button
                    onClick={() => toggleCheck(it)}
                    className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors"
                    style={{
                      background: it.checked ? "var(--color-terracotta)" : "transparent",
                      border: `1.5px solid ${it.checked ? "var(--color-terracotta)" : "var(--color-line)"}`,
                      color: "var(--color-cream-pale)",
                    }}
                  >
                    {!!it.checked && (
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                  <div className={`flex-1 min-w-0 ${it.checked ? "opacity-50" : ""}`}>
                    <p
                      className="text-sm leading-tight truncate"
                      style={{
                        color: "var(--color-ink)",
                        fontWeight: 500,
                        textDecoration: it.checked ? "line-through" : "none",
                      }}
                    >
                      {it.product_name}
                    </p>
                    <p
                      className="font-mono text-[10px] mt-0.5 truncate"
                      style={{ color: "var(--color-ink-mute)", letterSpacing: "0.04em" }}
                    >
                      {it.quantity ? `${fmtQty(it.quantity)}${it.unit ? " " + it.unit : ""}` : ""}
                      {it.source_recipe ? ` · ${it.source_recipe}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => updateQty(it, -1)}
                      className="font-mono text-sm w-7 h-7 rounded transition-colors"
                      style={{
                        color: "var(--color-ink-mute)",
                        border: "1px solid var(--color-line)",
                        background: "var(--color-cream-pale)",
                      }}
                    >
                      −
                    </button>
                    <button
                      onClick={() => updateQty(it, +1)}
                      className="font-mono text-sm w-7 h-7 rounded transition-colors"
                      style={{
                        color: "var(--color-ink-mute)",
                        border: "1px solid var(--color-line)",
                        background: "var(--color-cream-pale)",
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
