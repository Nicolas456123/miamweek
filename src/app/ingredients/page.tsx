"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useToast } from "@/components/toast";
import { CategoryIcon } from "@/components/category-icons";
import {
  searchScore,
  formatQuantity,
  UNITS,
  PRODUCT_CATEGORIES,
} from "@/lib/utils";

type Product = {
  id: number;
  name: string;
  category: string;
  default_unit: string;
  default_quantity: number | null;
  icon: string | null;
  is_custom: number | boolean | null;
  default_shelf_life_days: number | null;
  default_shelf_life_after_open_days: number | null;
};

const ALL_CATEGORIES = [...PRODUCT_CATEGORIES, "Autre"];

type Draft = {
  name: string;
  category: string;
  defaultUnit: string;
  defaultQuantity: string;
  icon: string;
  shelfLifeDays: string;
  shelfLifeAfterOpen: string;
};

const emptyDraft: Draft = {
  name: "",
  category: "Fruits & Légumes",
  defaultUnit: "pcs",
  defaultQuantity: "1",
  icon: "",
  shelfLifeDays: "",
  shelfLifeAfterOpen: "",
};

export default function IngredientsPage() {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState<Draft>(emptyDraft);
  const [showAdd, setShowAdd] = useState(false);
  const [addDraft, setAddDraft] = useState<Draft>(emptyDraft);

  const fetchProducts = useCallback(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((d) => setProducts(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const visible = useMemo(() => {
    return products.filter((p) => {
      if (activeCategory && (p.category || "Autre") !== activeCategory) return false;
      return searchScore(search, p.name, p.category) > 0;
    });
  }, [products, search, activeCategory]);

  const grouped = useMemo(() => {
    const groups: Record<string, Product[]> = {};
    for (const p of visible) {
      const cat = p.category || "Autre";
      (groups[cat] ||= []).push(p);
    }
    const ordered: [string, Product[]][] = [];
    for (const cat of ALL_CATEGORIES) {
      if (groups[cat]) ordered.push([cat, groups[cat]]);
    }
    for (const [cat, list] of Object.entries(groups)) {
      if (!ALL_CATEGORIES.includes(cat)) ordered.push([cat, list]);
    }
    return ordered;
  }, [visible]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of products) {
      const cat = p.category || "Autre";
      counts[cat] = (counts[cat] || 0) + 1;
    }
    return counts;
  }, [products]);

  const customCount = useMemo(
    () => products.filter((p) => !!p.is_custom).length,
    [products]
  );

  const startEdit = (p: Product) => {
    setEditingId(p.id);
    setEditDraft({
      name: p.name,
      category: p.category || "Autre",
      defaultUnit: p.default_unit || "pcs",
      defaultQuantity: p.default_quantity != null ? String(p.default_quantity) : "1",
      icon: p.icon || "",
      shelfLifeDays: p.default_shelf_life_days != null ? String(p.default_shelf_life_days) : "",
      shelfLifeAfterOpen:
        p.default_shelf_life_after_open_days != null ? String(p.default_shelf_life_after_open_days) : "",
    });
  };

  const saveEdit = async () => {
    if (editingId == null || !editDraft.name.trim()) return;
    const payload = {
      id: editingId,
      name: editDraft.name.trim(),
      category: editDraft.category,
      defaultUnit: editDraft.defaultUnit,
      defaultQuantity: editDraft.defaultQuantity ? Number(editDraft.defaultQuantity) : 1,
      icon: editDraft.icon.trim() || null,
      defaultShelfLifeDays: editDraft.shelfLifeDays ? Number(editDraft.shelfLifeDays) : null,
      defaultShelfLifeAfterOpenDays: editDraft.shelfLifeAfterOpen ? Number(editDraft.shelfLifeAfterOpen) : null,
    };
    setProducts((prev) =>
      prev.map((p) =>
        p.id === editingId
          ? {
              ...p,
              name: payload.name,
              category: payload.category,
              default_unit: payload.defaultUnit,
              default_quantity: payload.defaultQuantity,
              icon: payload.icon,
              default_shelf_life_days: payload.defaultShelfLifeDays,
              default_shelf_life_after_open_days: payload.defaultShelfLifeAfterOpenDays,
            }
          : p
      )
    );
    setEditingId(null);
    try {
      await fetch("/api/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      toast("Ingrédient mis à jour.");
    } catch {
      toast("Échec de la mise à jour.");
      fetchProducts();
    }
  };

  const removeProduct = async (p: Product) => {
    if (!confirm(`Supprimer « ${p.name} » de la base d'ingrédients ?`)) return;
    setProducts((prev) => prev.filter((x) => x.id !== p.id));
    if (editingId === p.id) setEditingId(null);
    try {
      await fetch("/api/products", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: p.id }),
      });
      toast("Ingrédient supprimé.");
    } catch {
      toast("Échec de la suppression.");
      fetchProducts();
    }
  };

  const addProduct = async () => {
    if (!addDraft.name.trim()) return;
    const payload = {
      name: addDraft.name.trim(),
      category: addDraft.category,
      defaultUnit: addDraft.defaultUnit,
      defaultQuantity: addDraft.defaultQuantity ? Number(addDraft.defaultQuantity) : 1,
      icon: addDraft.icon.trim() || null,
      defaultShelfLifeDays: addDraft.shelfLifeDays ? Number(addDraft.shelfLifeDays) : null,
      defaultShelfLifeAfterOpenDays: addDraft.shelfLifeAfterOpen ? Number(addDraft.shelfLifeAfterOpen) : null,
    };
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const saved = await res.json();
      if (saved?.id) {
        setProducts((prev) => [...prev, saved]);
        toast(`« ${payload.name} » ajouté à la base.`);
        setAddDraft({ ...emptyDraft, category: addDraft.category });
        setShowAdd(false);
      } else {
        toast("Échec de l'ajout.");
      }
    } catch {
      toast("Échec de l'ajout.");
    }
  };

  const inputCls =
    "bg-[var(--color-cream-pale)] border border-[var(--color-line)] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-terracotta)]";

  const renderDraftFields = (
    draft: Draft,
    set: (d: Draft) => void,
    onSubmit: () => void
  ) => (
    <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
      <input
        type="text"
        value={draft.name}
        onChange={(e) => set({ ...draft, name: e.target.value })}
        onKeyDown={(e) => e.key === "Enter" && onSubmit()}
        placeholder="Nom de l'ingrédient"
        aria-label="Nom"
        className={`${inputCls} col-span-2 md:col-span-2`}
        autoFocus
      />
      <select
        value={draft.category}
        onChange={(e) => set({ ...draft, category: e.target.value })}
        aria-label="Catégorie"
        className={inputCls}
      >
        {ALL_CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <input
        type="number"
        value={draft.defaultQuantity}
        onChange={(e) => set({ ...draft, defaultQuantity: e.target.value })}
        placeholder="Qté"
        aria-label="Quantité par défaut"
        className={`${inputCls} tnum`}
        min={0}
      />
      <select
        value={draft.defaultUnit}
        onChange={(e) => set({ ...draft, defaultUnit: e.target.value })}
        aria-label="Unité"
        className={inputCls}
      >
        {UNITS.map((u) => (
          <option key={u} value={u}>
            {u}
          </option>
        ))}
      </select>
      <input
        type="text"
        value={draft.icon}
        onChange={(e) => set({ ...draft, icon: e.target.value })}
        placeholder="Émoji"
        aria-label="Émoji"
        maxLength={4}
        className={`${inputCls} text-center`}
      />
      <label className="col-span-2 md:col-span-3 flex items-center gap-2">
        <span className="eyebrow shrink-0">Conservation (j)</span>
        <input
          type="number"
          inputMode="numeric"
          value={draft.shelfLifeDays}
          onChange={(e) => set({ ...draft, shelfLifeDays: e.target.value })}
          placeholder="ex : 7"
          aria-label="Durée de conservation standard en jours"
          className={`${inputCls} tnum w-full min-w-0`}
          min={0}
        />
      </label>
      <label className="col-span-2 md:col-span-3 flex items-center gap-2">
        <span className="eyebrow shrink-0">Après ouverture (j)</span>
        <input
          type="number"
          inputMode="numeric"
          value={draft.shelfLifeAfterOpen}
          onChange={(e) => set({ ...draft, shelfLifeAfterOpen: e.target.value })}
          placeholder="ex : 5"
          aria-label="Durée max après ouverture en jours"
          className={`${inputCls} tnum w-full min-w-0`}
          min={0}
        />
      </label>
    </div>
  );

  return (
    <div className="pb-24 md:pb-8">
      {/* Eyebrow + action */}
      <div className="flex items-baseline justify-between mb-5">
        <p className="eyebrow">
          Base d&apos;ingrédients · {String(products.length).padStart(2, "0")} produits
          {customCount > 0 ? ` · ${customCount} perso` : ""}
        </p>
        <button
          onClick={() => setShowAdd((v) => !v)}
          className="rounded-full px-4 py-2 text-sm font-medium"
          style={{
            background: "var(--color-terracotta)",
            color: "var(--color-cream-pale)",
            border: "1px solid var(--color-terracotta)",
          }}
        >
          {showAdd ? "× Fermer" : "+ Nouvel ingrédient"}
        </button>
      </div>

      {/* Hero */}
      <header
        className="pb-8 mb-6 border-b"
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
          Tous tes ingrédients,{" "}
          <span style={{ fontStyle: "italic", color: "var(--color-terracotta)" }}>
            à ta main.
          </span>
        </h1>
        <p className="text-sm mt-3" style={{ color: "var(--color-ink-mute)" }}>
          Ajuste l&apos;unité, la catégorie ou la quantité par défaut — et ajoute
          tes propres ingrédients.
        </p>
      </header>

      {/* Add panel */}
      {showAdd && (
        <div
          className="mb-6 rounded-md p-5 space-y-3"
          style={{ background: "var(--color-cream-deep)" }}
        >
          <span className="eyebrow">Nouvel ingrédient</span>
          {renderDraftFields(addDraft, setAddDraft, addProduct)}
          <div className="flex justify-end">
            <button
              onClick={addProduct}
              disabled={!addDraft.name.trim()}
              className="rounded-full px-4 py-2 text-sm font-medium disabled:opacity-50"
              style={{
                background: "var(--color-terracotta)",
                color: "var(--color-cream-pale)",
                border: "1px solid var(--color-terracotta)",
              }}
            >
              Ajouter à la base
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Rechercher un ingrédient… (ex : mais, echalote)"
        className={`${inputCls} w-full mb-3`}
      />

      {/* Category filter chips */}
      <div className="flex flex-wrap items-center gap-2 mb-8">
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
          Tous · {String(products.length).padStart(2, "0")}
        </button>
        {ALL_CATEGORIES.filter((c) => categoryCounts[c]).map((cat) => {
          const active = activeCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(active ? null : cat)}
              className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider rounded-full px-3 py-1 transition-colors"
              style={{
                background: active ? "var(--color-terracotta)" : "var(--color-cream-pale)",
                color: active ? "var(--color-cream-pale)" : "var(--color-ink-soft)",
                border: "1px solid",
                borderColor: active ? "var(--color-terracotta)" : "var(--color-line)",
                letterSpacing: "0.06em",
              }}
            >
              <CategoryIcon category={cat} size={14} />
              {categoryCounts[cat]}
            </button>
          );
        })}
      </div>

      {/* Empty state */}
      {visible.length === 0 && (
        <div className="text-center py-16">
          <p className="font-display text-2xl mb-2" style={{ color: "var(--color-ink)" }}>
            Aucun ingrédient
          </p>
          <p className="text-sm" style={{ color: "var(--color-ink-mute)" }}>
            Modifie ta recherche ou ajoute un nouvel ingrédient.
          </p>
        </div>
      )}

      {/* Grouped list */}
      <div className="space-y-10">
        {grouped.map(([cat, list]) => (
          <section key={cat}>
            <header className="flex items-center gap-2.5 mb-4">
              <CategoryIcon category={cat} size={20} />
              <h2
                className="font-display tracking-tight"
                style={{ fontSize: 26, color: "var(--color-ink)", lineHeight: 1.05, fontStyle: "italic" }}
              >
                {cat}
              </h2>
              <span
                className="font-mono text-xs tnum"
                style={{ color: "var(--color-ink-mute)", letterSpacing: "0.06em", marginLeft: "auto" }}
              >
                {String(list.length).padStart(2, "0")}
              </span>
            </header>
            <div className="grid grid-cols-1 gap-px" style={{ background: "var(--color-line)" }}>
              {list.map((p) =>
                editingId === p.id ? (
                  <div key={p.id} className="px-1 py-3 space-y-3" style={{ background: "var(--color-cream-deep)" }}>
                    {renderDraftFields(editDraft, setEditDraft, saveEdit)}
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => removeProduct(p)}
                        className="text-xs px-3 py-1.5 rounded-full"
                        style={{ color: "var(--color-terracotta-deep)", border: "1px solid var(--color-line)" }}
                      >
                        Supprimer
                      </button>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-sm px-3 py-1.5 rounded-full"
                          style={{ color: "var(--color-ink-mute)", border: "1px solid var(--color-line)" }}
                        >
                          Annuler
                        </button>
                        <button
                          onClick={saveEdit}
                          disabled={!editDraft.name.trim()}
                          className="text-sm px-4 py-1.5 rounded-full font-medium disabled:opacity-50"
                          style={{
                            background: "var(--color-terracotta)",
                            color: "var(--color-cream-pale)",
                            border: "1px solid var(--color-terracotta)",
                          }}
                        >
                          Enregistrer
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 px-1 py-3"
                    style={{ background: "var(--color-cream)" }}
                  >
                    <span className="text-lg shrink-0 w-6 text-center">{p.icon || "•"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm leading-tight truncate" style={{ color: "var(--color-ink)", fontWeight: 500 }}>
                        {p.name}
                        {!!p.is_custom && (
                          <span
                            className="ml-2 font-mono text-[9px] uppercase rounded px-1.5 py-0.5"
                            style={{
                              background: "rgba(200,85,61,0.10)",
                              color: "var(--color-terracotta-deep)",
                              letterSpacing: "0.06em",
                            }}
                          >
                            perso
                          </span>
                        )}
                      </p>
                      <p
                        className="font-mono text-[10px] mt-0.5 truncate"
                        style={{ color: "var(--color-ink-mute)", letterSpacing: "0.04em" }}
                      >
                        défaut · {formatQuantity(p.default_quantity ?? 1, p.default_unit)}
                        {p.default_shelf_life_days != null ? ` · conserv. ${p.default_shelf_life_days} j` : ""}
                        {p.default_shelf_life_after_open_days != null ? ` · ouvert ${p.default_shelf_life_after_open_days} j` : ""}
                      </p>
                    </div>
                    <button
                      onClick={() => startEdit(p)}
                      className="text-xs px-3 py-1.5 rounded-full shrink-0 transition-colors"
                      style={{
                        color: "var(--color-ink-soft)",
                        border: "1px solid var(--color-line)",
                        background: "var(--color-cream-pale)",
                      }}
                    >
                      Modifier
                    </button>
                  </div>
                )
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
