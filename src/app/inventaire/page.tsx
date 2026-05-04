"use client";

import { useState, useEffect, useMemo } from "react";
import { useToast } from "@/components/toast";

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
};

type LocationKey = "frigo" | "placard" | "congélateur";

const LOCATIONS: { key: LocationKey; label: string }[] = [
  { key: "frigo", label: "Frigo" },
  { key: "placard", label: "Placard" },
  { key: "congélateur", label: "Congélateur" },
];

const TONES: Record<LocationKey, "olive" | "neutral" | "mustard"> = {
  frigo: "olive",
  placard: "neutral",
  congélateur: "mustard",
};

function fmtQty(qty: number): string {
  if (Number.isInteger(qty)) return String(qty);
  return qty.toFixed(2).replace(/\.?0+$/, "");
}

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(+d)) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.ceil((+d - +now) / 86400000);
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
  const [items, setItems] = useState<PantryItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [addSearch, setAddSearch] = useState("");
  const [activeLocation, setActiveLocation] = useState<LocationKey>("frigo");

  const fetchPantry = () => {
    fetch("/api/pantry")
      .then((r) => r.json())
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch(() => {});
  };

  useEffect(() => {
    fetchPantry();
    fetch("/api/products")
      .then((r) => r.json())
      .then((d) => setProducts(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

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
    await fetch(`/api/pantry?id=${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((it) => it.id !== id));
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

  const total = items.length;
  const expiring = useMemo(() => {
    return items.filter((it) => {
      const d = daysUntil(it.expires_at);
      return d !== null && d <= 3;
    }).length;
  }, [items]);
  const ending = useMemo(() => {
    return items.filter((it) => (it.quantity || 0) > 0 && (it.quantity || 0) < 1).length;
  }, [items]);

  const filteredProducts = useMemo(() => {
    if (!addSearch) return [];
    const s = addSearch.toLowerCase();
    return products.filter((p) => p.name.toLowerCase().includes(s)).slice(0, 12);
  }, [products, addSearch]);

  return (
    <div className="pb-24 md:pb-8">
      {/* Eyebrow + actions */}
      <div className="flex items-baseline justify-between mb-5">
        <p className="eyebrow">Ce qu&apos;il y a chez toi · {String(total).padStart(2, "0")} produits</p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => toast("Scanner ticket : à venir.")}
            className="rounded-full px-4 py-2 text-sm transition-colors"
            style={{
              background: "var(--color-cream-pale)",
              border: "1px solid var(--color-line)",
              color: "var(--color-ink-soft)",
            }}
          >
            Scanner ticket
          </button>
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

      {/* 3 columns by location */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-px" style={{ background: "var(--color-line)" }}>
        {LOCATIONS.map((loc, idx) => {
          const list = groupedByLocation[loc.key];
          const tone = TONES[loc.key];
          return (
            <section
              key={loc.key}
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
                    {loc.label}
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
                  {list.slice(0, 6).map((it) => {
                    const days = daysUntil(it.expires_at);
                    const dlc = dlcLabel(days);
                    return (
                      <li
                        key={it.id}
                        className="group flex items-center gap-3 py-3 border-b"
                        style={{ borderColor: "var(--color-line-soft)" }}
                      >
                        <span
                          className={`placeholder-img placeholder-img-${tone}`}
                          style={{
                            width: 24,
                            height: 24,
                            fontSize: 0,
                            flexShrink: 0,
                            minHeight: 24,
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm leading-tight truncate" style={{ color: "var(--color-ink)" }}>
                            {it.product_name}
                          </p>
                          <p
                            className="font-mono text-[10px] truncate"
                            style={{ color: "var(--color-ink-mute)", letterSpacing: "0.04em" }}
                          >
                            {it.quantity ? `${fmtQty(it.quantity)}${it.unit ? " " + it.unit : ""}` : "—"}
                          </p>
                        </div>
                        <span
                          className="font-mono text-xs tnum shrink-0"
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
                            DLC
                          </span>
                        </span>
                        <button
                          onClick={() => removeItem(it.id)}
                          className="font-mono text-[12px] opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                          style={{ color: "var(--color-terracotta)" }}
                        >
                          ×
                        </button>
                      </li>
                    );
                  })}
                  {list.length > 6 && (
                    <li className="pt-3 px-4 text-sm" style={{ color: "var(--color-ink-faint)" }}>
                      + {list.length - 6} autre{list.length - 6 > 1 ? "s" : ""}…
                    </li>
                  )}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
