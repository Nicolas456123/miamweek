"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useToast } from "@/components/toast";
import { ItemRow, ItemIcon } from "@/components/item-row";
import { cacheGet, cacheSet } from "@/lib/client-cache";
import { rankedFilter, formatQuantity, normalize, getMonday, DAYS, UNITS, PRODUCT_CATEGORIES } from "@/lib/utils";

type PlannedMeal = { day_of_week: number; meal_type: string; recipe_id: number | null; custom_name: string | null };
type RecipeLite = { id: number; name: string; ingredients?: { name: string; quantity: number | null; unit: string | null }[] };

type Product = {
  id: number;
  name: string;
  category: string;
  defaultUnit: string;
  icon: string | null;
};

type PantryItem = {
  id: number;
  product_id: number | null;
  product_name: string;
  quantity: number | null;
  unit: string | null;
  category: string | null;
  location: string | null;
  expires_at: string | null;
  added_at: string | null;
  opened_at: string | null;
  shelf_life_after_open_days: number | null;
};

type LocationKey = "frigo" | "placard" | "congélateur";

const LOCATIONS: { key: LocationKey; label: string }[] = [
  { key: "frigo", label: "Frigo" },
  { key: "placard", label: "Placard" },
  { key: "congélateur", label: "Congélateur" },
];

type EditDraft = {
  name: string;
  quantity: string;
  unit: string;
  category: string;
  location: LocationKey;
  addedAt: string;
  expiresAt: string;
  opened: boolean;
  openedAt: string;
  shelfLife: string;
};

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(+d)) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.ceil((+d - +now) / 86400000);
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

// Péremption effective : la plus proche entre la DLC du produit et
// (date d'ouverture + jours de conservation après ouverture).
// Ex : lait DLC dans 12 j, mais ouvert aujourd'hui avec 5 j max → 5 j.
function effectiveExpiry(it: PantryItem): string | null {
  const base = it.expires_at;
  if (it.opened_at && it.shelf_life_after_open_days != null) {
    const afterOpen = addDays(it.opened_at, it.shelf_life_after_open_days);
    if (!base) return afterOpen;
    return new Date(afterOpen) < new Date(base) ? afterOpen : base;
  }
  return base;
}

function isoDate(v: string | null): string {
  if (!v) return "";
  const d = new Date(v);
  if (isNaN(+d)) return "";
  return d.toISOString().split("T")[0];
}

function dlcLabel(days: number | null): { text: string; tone: "danger" | "warn" | "neutral" } {
  if (days === null) return { text: "—", tone: "neutral" };
  if (days < 0) return { text: `${-days}j`, tone: "danger" };
  if (days === 0) return { text: "auj.", tone: "danger" };
  if (days <= 3) return { text: `${days}j`, tone: "danger" };
  if (days <= 30) return { text: `${days}j`, tone: "warn" };
  if (days < 60) return { text: `${days}j`, tone: "neutral" };
  const months = Math.round(days / 30);
  return { text: `${months}m`, tone: "neutral" };
}

export default function InventairePage() {
  const { toast } = useToast();
  const [items, setItems] = useState<PantryItem[]>(() => cacheGet<PantryItem[]>("pantry") ?? []);
  const [products, setProducts] = useState<Product[]>(() => cacheGet<Product[]>("products") ?? []);
  const [showAdd, setShowAdd] = useState(false);
  const [addSearch, setAddSearch] = useState("");
  const [activeLocation, setActiveLocation] = useState<LocationKey>("frigo");
  const [stockGroupMode, setStockGroupMode] = useState<"location" | "category" | "meal">("location");
  const [meals, setMeals] = useState<PlannedMeal[]>([]);
  const [recipes, setRecipes] = useState<RecipeLite[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState<EditDraft | null>(null);

  const fetchPantry = () => {
    fetch("/api/pantry")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setItems(data);
          cacheSet("pantry", data);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchPantry();
    fetch("/api/products")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) {
          setProducts(d);
          cacheSet("products", d);
        }
      })
      .catch(() => {});
    // Pour la vue « par repas prévu » : planning de la semaine + recettes
    fetch(`/api/meal-plan?weekStart=${getMonday(new Date())}`)
      .then((r) => r.json())
      .then((d) => setMeals(Array.isArray(d) ? d : []))
      .catch(() => {});
    fetch("/api/recipes")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) setRecipes(d);
      })
      .catch(() => {});
  }, []);

  // Recherche d'un produit du stock par nom (souple)
  const stockByName = useMemo(() => {
    const m = new Map<string, PantryItem>();
    for (const it of items) m.set(normalize(it.product_name), it);
    return m;
  }, [items]);
  const findStock = (name: string): PantryItem | null => {
    const n = normalize(name);
    if (!n) return null;
    if (stockByName.has(n)) return stockByName.get(n)!;
    for (const [k, v] of stockByName) if (k.includes(n) || n.includes(k)) return v;
    return null;
  };

  // Sections « par repas prévu » : ingrédients en stock / manquants + jours restants
  const mealSections = useMemo(() => {
    if (stockGroupMode !== "meal") return [];
    const byId = new Map(recipes.map((r) => [r.id, r]));
    const out: {
      key: string;
      name: string;
      day: string;
      daysLeft: number | null;
      shortageCount: number;
      ings: {
        name: string;
        qty: number | null;
        unit: string | null;
        have: PantryItem | null;
        status: "ok" | "low" | "missing";
        shortfall: number | null;
      }[];
    }[] = [];
    for (const m of meals) {
      const rec = m.recipe_id != null ? byId.get(m.recipe_id) : undefined;
      if (!rec || !rec.ingredients || rec.ingredients.length === 0) continue;
      const ings = rec.ingredients.map((ing) => {
        const have = findStock(ing.name);
        let status: "ok" | "low" | "missing" = have ? "ok" : "missing";
        let shortfall: number | null = null;
        if (
          have &&
          ing.quantity != null &&
          have.quantity != null &&
          normalize(ing.unit || "") === normalize(have.unit || "") &&
          have.quantity < ing.quantity
        ) {
          status = "low";
          shortfall = Math.round((ing.quantity - have.quantity) * 100) / 100;
        }
        return { name: ing.name, qty: ing.quantity, unit: ing.unit, have, status, shortfall };
      });
      const haveDays = ings
        .filter((i) => i.have)
        .map((i) => daysUntil(effectiveExpiry(i.have!)))
        .filter((d): d is number => d !== null);
      const daysLeft = haveDays.length ? Math.min(...haveDays) : null;
      const shortageCount = ings.filter((i) => i.status !== "ok").length;
      out.push({
        key: `${m.day_of_week}-${m.meal_type}-${m.recipe_id}`,
        name: rec.name,
        day: DAYS[m.day_of_week] ?? "",
        daysLeft,
        shortageCount,
        ings,
      });
    }
    // Priorise les repas dont un ingrédient en stock périme le plus tôt.
    out.sort((a, b) => (a.daysLeft ?? Infinity) - (b.daysLeft ?? Infinity));
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stockGroupMode, meals, recipes, items]);

  const addProduct = async (p: Product) => {
    await fetch("/api/pantry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: p.id,
        productName: p.name,
        quantity: 1,
        unit: p.defaultUnit,
        category: p.category,
        location: activeLocation,
      }),
    });
    setAddSearch("");
    fetchPantry();
  };

  const removeItem = async (id: number) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
    await fetch("/api/pantry", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  };

  const updateQty = async (it: PantryItem, delta: number) => {
    const u = (it.unit || "pcs").toLowerCase();
    const step = u === "g" || u === "ml" ? 50 : u === "kg" || u === "l" ? 0.25 : 1;
    const newQty = Math.round(Math.max(0, (it.quantity || 0) + step * delta) * 100) / 100;
    if (newQty === 0) {
      removeItem(it.id);
      return;
    }
    setItems((prev) =>
      prev.map((x) => (x.id === it.id ? { ...x, quantity: newQty } : x))
    );
    try {
      await fetch("/api/pantry", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: it.id, quantity: newQty }),
      });
    } catch {
      fetchPantry();
    }
  };

  const startEdit = (it: PantryItem) => {
    setEditingId(it.id);
    setDraft({
      name: it.product_name,
      quantity: it.quantity != null ? String(it.quantity) : "",
      unit: it.unit || "pcs",
      category: it.category || "Autre",
      location: (it.location as LocationKey) || "placard",
      addedAt: isoDate(it.added_at),
      expiresAt: isoDate(it.expires_at),
      opened: !!it.opened_at,
      openedAt: isoDate(it.opened_at),
      shelfLife:
        it.shelf_life_after_open_days != null ? String(it.shelf_life_after_open_days) : "",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft(null);
  };

  const saveEdit = async () => {
    if (editingId == null || !draft) return;
    const qty = draft.quantity ? Number(draft.quantity.replace(",", ".")) : null;
    const shelf = draft.shelfLife ? Number(draft.shelfLife) : null;
    const payload = {
      id: editingId,
      productName: draft.name.trim() || undefined,
      quantity: qty,
      unit: draft.unit,
      category: draft.category,
      location: draft.location,
      addedAt: draft.addedAt || null,
      expiresAt: draft.expiresAt || null,
      openedAt: draft.opened ? draft.openedAt || isoDate(new Date().toISOString()) : null,
      shelfLifeAfterOpenDays: shelf,
    };
    setItems((prev) =>
      prev.map((x) =>
        x.id === editingId
          ? {
              ...x,
              product_name: payload.productName ?? x.product_name,
              quantity: qty,
              unit: draft.unit,
              category: draft.category,
              location: draft.location,
              added_at: payload.addedAt,
              expires_at: payload.expiresAt,
              opened_at: payload.openedAt,
              shelf_life_after_open_days: shelf,
            }
          : x
      )
    );
    cancelEdit();
    try {
      await fetch("/api/pantry", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      toast("Produit mis à jour.");
    } catch {
      toast("Échec de la mise à jour.");
      fetchPantry();
    }
  };

  const groupedByLocation = useMemo(() => {
    const groups: Record<LocationKey, PantryItem[]> = {
      frigo: [],
      placard: [],
      congélateur: [],
    };
    for (const it of items) {
      const loc = (it.location as LocationKey) || "placard";
      if (groups[loc]) groups[loc].push(it);
      else groups.placard.push(it);
    }
    return groups;
  }, [items]);

  const sections = useMemo(() => {
    if (stockGroupMode === "category") {
      const groups: Record<string, PantryItem[]> = {};
      for (const it of items) {
        const c = it.category || "Autre";
        (groups[c] ||= []).push(it);
      }
      const order = [...PRODUCT_CATEGORIES, "Autre"] as string[];
      const ordered: { key: string; label: string; items: PantryItem[] }[] = [];
      for (const c of order) if (groups[c]) ordered.push({ key: c, label: c, items: groups[c] });
      for (const [c, list] of Object.entries(groups)) {
        if (!order.includes(c)) ordered.push({ key: c, label: c, items: list });
      }
      return ordered;
    }
    return LOCATIONS.map((l) => ({
      key: l.key as string,
      label: l.label,
      items: groupedByLocation[l.key],
    }));
  }, [stockGroupMode, items, groupedByLocation]);

  const total = items.length;
  const expiring = useMemo(() => {
    return items.filter((it) => {
      const d = daysUntil(effectiveExpiry(it));
      return d !== null && d <= 3;
    }).length;
  }, [items]);
  const ending = useMemo(() => {
    return items.filter((it) => (it.quantity || 0) > 0 && (it.quantity || 0) < 1).length;
  }, [items]);

  const filteredProducts = useMemo(() => {
    if (!addSearch) return [];
    return rankedFilter(products, addSearch, (p) => [p.name, p.category]).slice(0, 12);
  }, [products, addSearch]);

  const productIcon = (it: PantryItem): string | null => {
    if (it.product_id != null) {
      const p = products.find((x) => x.id === it.product_id);
      if (p?.icon) return p.icon;
    }
    const p = products.find((x) => normalize(x.name) === normalize(it.product_name));
    return p?.icon || null;
  };

  const fieldCls =
    "w-full min-w-0 bg-[var(--color-cream-pale)] border border-[var(--color-line)] rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:border-[var(--color-terracotta)]";

  const renderEditPanel = () => {
    if (!draft) return null;
    const set = (patch: Partial<EditDraft>) => setDraft({ ...draft, ...patch });
    return (
      <div className="rounded-md p-3 space-y-2.5" style={{ background: "var(--color-cream-deep)", border: "1px solid var(--color-terracotta)" }}>
        <label className="block">
          <span className="eyebrow block mb-1">Nom</span>
          <input type="text" value={draft.name} onChange={(e) => set({ name: e.target.value })} className={fieldCls} autoFocus />
        </label>
        <div className="grid grid-cols-2 gap-2 [&>label]:min-w-0">
          <label className="block">
            <span className="eyebrow block mb-1">Quantité</span>
            <input type="number" inputMode="decimal" value={draft.quantity} onChange={(e) => set({ quantity: e.target.value })} className={`${fieldCls} tnum`} />
          </label>
          <label className="block">
            <span className="eyebrow block mb-1">Unité</span>
            <select value={draft.unit} onChange={(e) => set({ unit: e.target.value })} className={fieldCls}>
              {(UNITS as readonly string[]).includes(draft.unit) ? null : <option value={draft.unit}>{draft.unit}</option>}
              {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </label>
        </div>
        <div className="grid grid-cols-2 gap-2 [&>label]:min-w-0">
          <label className="block">
            <span className="eyebrow block mb-1">Emplacement</span>
            <select value={draft.location} onChange={(e) => set({ location: e.target.value as LocationKey })} className={fieldCls}>
              {LOCATIONS.map((l) => <option key={l.key} value={l.key}>{l.label}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="eyebrow block mb-1">Catégorie</span>
            <select value={draft.category} onChange={(e) => set({ category: e.target.value })} className={fieldCls}>
              {[...PRODUCT_CATEGORIES, "Autre"].map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
        </div>
        <div className="grid grid-cols-2 gap-2 [&>label]:min-w-0">
          <label className="block">
            <span className="eyebrow block mb-1">Date d&apos;ajout</span>
            <input type="date" value={draft.addedAt} onChange={(e) => set({ addedAt: e.target.value })} className={fieldCls} />
          </label>
          <label className="block">
            <span className="eyebrow block mb-1">Péremption (DLC)</span>
            <input type="date" value={draft.expiresAt} onChange={(e) => set({ expiresAt: e.target.value })} className={fieldCls} />
          </label>
        </div>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={draft.opened}
            onChange={(e) =>
              set({
                opened: e.target.checked,
                openedAt:
                  e.target.checked && !draft.openedAt
                    ? isoDate(new Date().toISOString())
                    : draft.openedAt,
              })
            }
            className="w-4 h-4 accent-[var(--color-terracotta)]"
          />
          <span className="text-sm" style={{ color: "var(--color-ink-soft)" }}>
            Produit ouvert / entamé
          </span>
        </label>
        {draft.opened && (
          <>
            <div className="grid grid-cols-2 gap-2 [&>label]:min-w-0">
              <label className="block">
                <span className="eyebrow block mb-1">Date d&apos;ouverture</span>
                <input type="date" value={draft.openedAt} onChange={(e) => set({ openedAt: e.target.value })} className={fieldCls} />
              </label>
              <label className="block">
                <span className="eyebrow block mb-1">Max après ouverture (j)</span>
                <input type="number" inputMode="numeric" placeholder="ex : 5" value={draft.shelfLife} onChange={(e) => set({ shelfLife: e.target.value })} className={`${fieldCls} tnum`} />
              </label>
            </div>
            {draft.openedAt && draft.shelfLife && (
              <p className="font-mono text-[10px]" style={{ color: "#8a6d10", letterSpacing: "0.04em" }}>
                → à consommer avant le {addDays(draft.openedAt, Number(draft.shelfLife))}
              </p>
            )}
          </>
        )}
        <div className="flex items-center justify-between pt-1">
          <button
            onClick={() => {
              if (editingId != null) removeItem(editingId);
              cancelEdit();
            }}
            className="text-xs px-3 py-1.5 rounded-full"
            style={{ color: "var(--color-terracotta-deep)", border: "1px solid var(--color-line)" }}
          >
            Supprimer
          </button>
          <div className="flex gap-2">
            <button onClick={cancelEdit} className="text-sm px-3 py-1.5 rounded-full" style={{ color: "var(--color-ink-mute)", border: "1px solid var(--color-line)" }}>
              Annuler
            </button>
            <button
              onClick={saveEdit}
              className="text-sm px-4 py-1.5 rounded-full font-medium"
              style={{ background: "var(--color-terracotta)", color: "var(--color-cream-pale)", border: "1px solid var(--color-terracotta)" }}
            >
              Enregistrer
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="pb-24 md:pb-8">
      {/* Eyebrow + actions */}
      <div className="flex items-baseline justify-between mb-5">
        <p className="eyebrow">Ce qu&apos;il y a chez toi · {String(total).padStart(2, "0")} produits</p>
        <div className="flex items-center gap-2">
          <Link
            href="/ingredients"
            className="rounded-full px-4 py-2 text-sm transition-colors"
            style={{
              background: "var(--color-cream-pale)",
              border: "1px solid var(--color-line)",
              color: "var(--color-ink-soft)",
            }}
            title="Voir et modifier la base d'ingrédients (valeurs standard, conservation…)"
          >
            ⚙ Base d&apos;ingrédients
          </Link>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="rounded-full px-4 py-2 text-sm font-medium"
            style={{
              background: "var(--color-terracotta)",
              color: "var(--color-cream-pale)",
              border: "1px solid var(--color-terracotta)",
            }}
          >
            {showAdd ? "× Fermer" : "+ Ajouter"}
          </button>
        </div>
      </div>

      {/* Hero + stats */}
      <header
        className="pb-8 mb-8 border-b flex flex-col md:flex-row md:items-end md:justify-between gap-6"
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
          Le{" "}
          <span style={{ fontStyle: "italic", color: "var(--color-terracotta)" }}>
            garde-manger
          </span>
          , en un coup d&apos;œil.
        </h1>

        <div className="grid grid-cols-3 gap-6 md:gap-8 shrink-0">
          <div className="text-right">
            <p className="font-display tnum leading-none" style={{ fontSize: 36, color: "var(--color-ink)" }}>
              {String(total).padStart(2, "0")}
            </p>
            <p className="eyebrow mt-1.5">produits</p>
          </div>
          <div className="text-right">
            <p
              className="font-display tnum leading-none"
              style={{ fontSize: 36, color: "var(--color-terracotta)", fontStyle: "italic" }}
            >
              {String(expiring).padStart(2, "0")}
            </p>
            <p className="eyebrow mt-1.5">à finir vite</p>
          </div>
          <div className="text-right">
            <p className="font-display tnum leading-none" style={{ fontSize: 36, color: "var(--color-ink)" }}>
              {String(ending).padStart(2, "0")}
            </p>
            <p className="eyebrow mt-1.5">bientôt vides</p>
          </div>
        </div>
      </header>

      {/* Add panel */}
      {showAdd && (
        <div className="mb-8 rounded-md p-5 space-y-3" style={{ background: "var(--color-cream-deep)" }}>
          <div className="flex gap-2 mb-3">
            <span className="eyebrow self-center mr-2">ranger dans</span>
            {LOCATIONS.map((l) => {
              const active = activeLocation === l.key;
              return (
                <button
                  key={l.key}
                  onClick={() => setActiveLocation(l.key)}
                  className="font-mono text-[11px] uppercase rounded-full px-3 py-1 transition-colors"
                  style={{
                    background: active ? "var(--color-ink)" : "var(--color-cream-pale)",
                    color: active ? "var(--color-cream-pale)" : "var(--color-ink-soft)",
                    border: "1px solid",
                    borderColor: active ? "var(--color-ink)" : "var(--color-line)",
                    letterSpacing: "0.06em",
                  }}
                >
                  {l.label}
                </button>
              );
            })}
          </div>
          <input
            type="text"
            value={addSearch}
            onChange={(e) => setAddSearch(e.target.value)}
            placeholder="Chercher un produit dans le catalogue…"
            className="w-full bg-[var(--color-cream-pale)] border border-[var(--color-line)] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-terracotta)]"
            autoFocus
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
        </div>
      )}

      {/* Affichage : par emplacement ou par catégorie */}
      <div className="flex items-center gap-2 mb-4">
        <span className="eyebrow mr-2">affichage</span>
        {(["location", "category", "meal"] as const).map((mode) => {
          const active = stockGroupMode === mode;
          return (
            <button
              key={mode}
              onClick={() => setStockGroupMode(mode)}
              className="font-mono text-[11px] uppercase tracking-wider rounded-full px-3 py-1 transition-colors"
              style={{
                background: active ? "var(--color-ink)" : "var(--color-cream-pale)",
                color: active ? "var(--color-cream-pale)" : "var(--color-ink-soft)",
                border: "1px solid",
                borderColor: active ? "var(--color-ink)" : "var(--color-line)",
                letterSpacing: "0.06em",
              }}
            >
              {mode === "location" ? "Par emplacement" : mode === "category" ? "Par catégorie" : "Par repas prévu"}
            </button>
          );
        })}
      </div>

      {/* Vue par repas prévu : ingrédients en stock / manquants (fantôme) + jours restants */}
      {stockGroupMode === "meal" && (
        <div className="space-y-8">
          {mealSections.length === 0 ? (
            <p className="text-sm italic" style={{ color: "var(--color-ink-faint)" }}>
              Aucun repas planifié cette semaine (ou recettes sans ingrédients).
            </p>
          ) : (
            mealSections.map((sec) => (
              <section key={sec.key}>
                <header className="flex items-baseline justify-between gap-3 mb-3">
                  <h2
                    className="font-display tracking-tight"
                    style={{ fontSize: 24, color: "var(--color-ink)", lineHeight: 1.05, fontStyle: "italic" }}
                  >
                    {sec.name}{" "}
                    <span className="font-mono text-[10px] not-italic" style={{ color: "var(--color-ink-faint)" }}>
                      {sec.day}
                    </span>
                  </h2>
                  <div className="flex items-center gap-2 shrink-0">
                    {sec.daysLeft != null && (
                      <span
                        className="font-mono text-[10px] uppercase rounded-full px-2 py-0.5"
                        style={{
                          background:
                            sec.daysLeft < 0
                              ? "rgba(200,85,61,0.12)"
                              : sec.daysLeft <= 3
                              ? "rgba(201,162,39,0.15)"
                              : "var(--color-cream-deep)",
                          color:
                            sec.daysLeft < 0
                              ? "var(--color-terracotta-deep)"
                              : sec.daysLeft <= 3
                              ? "#8a6d10"
                              : "var(--color-ink-soft)",
                          border: "1px solid var(--color-line)",
                          letterSpacing: "0.06em",
                        }}
                      >
                        {sec.daysLeft < 0 ? "ingrédient périmé" : `${sec.daysLeft} j pour cuisiner`}
                      </span>
                    )}
                    {sec.shortageCount > 0 && (
                      <span
                        className="font-mono text-[10px] uppercase rounded-full px-2 py-0.5"
                        style={{ color: "var(--color-ink-mute)", border: "1px dashed var(--color-line)", letterSpacing: "0.06em" }}
                      >
                        manque {sec.shortageCount}
                      </span>
                    )}
                  </div>
                </header>
                <div className="grid grid-cols-1 md:grid-cols-2 md:gap-x-8">
                  {sec.ings.map((ing, i) => {
                    const have = ing.have;
                    const d = have ? daysUntil(effectiveExpiry(have)) : null;
                    const exp = d !== null && d < 0;
                    const need = ing.qty != null ? `il faut ${formatQuantity(ing.qty, ing.unit)}` : "à prévoir";
                    const stockStr = have?.quantity ? formatQuantity(have.quantity, have.unit) : have ? "en stock" : "";
                    let meta: string;
                    if (ing.status === "missing") {
                      meta = `${need} · à acheter — manquant`;
                    } else if (ing.status === "low") {
                      meta = `${need} · en stock ${stockStr} — pas assez${
                        ing.shortfall != null ? ` (il manque ${formatQuantity(ing.shortfall, ing.unit)})` : ""
                      }`;
                    } else {
                      meta = `${need} · en stock ${stockStr}${d !== null ? ` · ${d < 0 ? "périmé" : d + " j"}` : ""}`;
                    }
                    return (
                      <div key={i} className="border-b" style={{ borderColor: "var(--color-line-soft)" }}>
                        <ItemRow
                          faded={ing.status === "missing"}
                          leading={
                            have ? (
                              <ItemIcon icon={productIcon(have)} />
                            ) : (
                              <span className="rounded-full" style={{ width: 8, height: 8, border: "1px solid var(--color-line)" }} />
                            )
                          }
                          name={
                            ing.status === "missing" ? (
                              <span style={{ color: "var(--color-ink-mute)" }}>{ing.name}</span>
                            ) : exp ? (
                              <span style={{ color: "var(--color-terracotta)" }}>{ing.name} · périmé</span>
                            ) : ing.status === "low" ? (
                              <span style={{ color: "#8a6d10" }}>{ing.name} · pas assez</span>
                            ) : (
                              ing.name
                            )
                          }
                          meta={meta}
                        />
                      </div>
                    );
                  })}
                </div>
              </section>
            ))
          )}
        </div>
      )}

      {/* Sections (par emplacement ou par catégorie) */}
      {stockGroupMode !== "meal" && (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-px" style={{ background: "var(--color-line)" }}>
        {sections.map((sec, idx) => {
          const list = sec.items;
          return (
            <section
              key={sec.key}
              className="px-1 py-6"
              style={{ background: "var(--color-cream)" }}
            >
              <header className="px-4 mb-5 flex items-baseline justify-between">
                <div className="flex items-baseline gap-3">
                  <span
                    className="font-mono text-xs tnum"
                    style={{ color: "var(--color-ink-faint)", letterSpacing: "0.08em" }}
                  >
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <h2
                    className="font-display tracking-tight"
                    style={{ fontSize: 28, color: "var(--color-ink)", lineHeight: 1.05, fontStyle: "italic" }}
                  >
                    {sec.label}
                  </h2>
                </div>
                <span
                  className="font-mono text-xs tnum"
                  style={{ color: "var(--color-ink-mute)", letterSpacing: "0.06em" }}
                >
                  {String(list.length).padStart(2, "0")}
                </span>
              </header>

              {list.length === 0 ? (
                <p className="px-4 text-sm italic" style={{ color: "var(--color-ink-faint)" }}>
                  Vide.
                </p>
              ) : (
                <ul className="px-4 space-y-px">
                  {list.map((it) => {
                    const effExp = effectiveExpiry(it);
                    const days = daysUntil(effExp);
                    const dlc = dlcLabel(days);
                    const opened = !!it.opened_at;
                    const expired = days !== null && days < 0;
                    if (editingId === it.id && draft) {
                      return (
                        <li key={it.id} className="py-3 border-b" style={{ borderColor: "var(--color-line-soft)" }}>
                          {renderEditPanel()}
                        </li>
                      );
                    }
                    return (
                      <li
                        key={it.id}
                        className="group border-b"
                        style={{ borderColor: "var(--color-line-soft)" }}
                      >
                        <ItemRow
                          leading={<ItemIcon icon={productIcon(it)} />}
                          name={
                            expired ? (
                              <span style={{ color: "var(--color-terracotta)" }}>
                                {it.product_name} · périmé
                              </span>
                            ) : (
                              it.product_name
                            )
                          }
                          meta={`${it.quantity ? formatQuantity(it.quantity, it.unit) : "—"}${opened ? " · ouvert" : ""}`}
                          trailing={
                            <>
                              <button
                                onClick={() => updateQty(it, -1)}
                                aria-label="Diminuer"
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
                                aria-label="Augmenter"
                                className="font-mono text-sm w-7 h-7 rounded transition-colors"
                                style={{
                                  color: "var(--color-ink-mute)",
                                  border: "1px solid var(--color-line)",
                                  background: "var(--color-cream-pale)",
                                }}
                              >
                                +
                              </button>
                              <span
                                className="font-mono text-xs tnum shrink-0 w-8 text-right"
                                style={{
                                  color:
                                    dlc.tone === "danger"
                                      ? "var(--color-terracotta)"
                                      : dlc.tone === "warn"
                                      ? "#8a6d10"
                                      : "var(--color-ink-faint)",
                                  letterSpacing: "0.04em",
                                }}
                              >
                                <span className="block leading-none">{dlc.text}</span>
                                <span
                                  className="block uppercase mt-0.5"
                                  style={{ fontSize: 8, color: "var(--color-ink-faint)", letterSpacing: "0.08em" }}
                                >
                                  {opened ? "OUV." : "DLC"}
                                </span>
                              </span>
                              <button
                                onClick={() => startEdit(it)}
                                aria-label="Modifier"
                                title="Modifier le produit"
                                className="shrink-0 w-7 h-7 rounded flex items-center justify-center transition-colors"
                                style={{
                                  color: "var(--color-ink-mute)",
                                  border: "1px solid var(--color-line)",
                                  background: "var(--color-cream-pale)",
                                }}
                              >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M12 20h9" />
                                  <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => removeItem(it.id)}
                                aria-label="Supprimer"
                                className="font-mono text-[12px] md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                                style={{ color: "var(--color-terracotta)" }}
                              >
                                ×
                              </button>
                            </>
                          }
                        />
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          );
        })}
      </div>
      )}
    </div>
  );
}
