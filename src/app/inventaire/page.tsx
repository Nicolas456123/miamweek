"use client";

import { useState, useEffect, useMemo } from "react";
import { PRODUCT_CATEGORIES } from "@/lib/utils";
import { CategoryIcon } from "@/components/category-icons";

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
  added_at: string | null;
  expires_at: string | null;
  icon: string | null;
  defaultUnit: string | null;
};

const LOCATIONS = [
  { key: "frigo", label: "Frigo", icon: "🧊" },
  { key: "congélateur", label: "Congélateur", icon: "❄️" },
  { key: "placard", label: "Placard", icon: "🗄️" },
  { key: "autre", label: "Autre", icon: "📦" },
] as const;

export default function InventairePage() {
  const [items, setItems] = useState<PantryItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"category" | "location">("category");
  const [showAdd, setShowAdd] = useState(false);
  const [addSearch, setAddSearch] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("placard");

  useEffect(() => {
    fetchPantry();
    fetch("/api/products")
      .then((r) => r.json())
      .then((data) => setProducts(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, []);

  const fetchPantry = () => {
    fetch("/api/pantry")
      .then((r) => r.json())
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch(console.error);
  };

  const addItem = async (product: Product) => {
    await fetch("/api/pantry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: product.id,
        productName: product.name,
        quantity: 1,
        unit: product.defaultUnit,
        category: product.category,
        location: selectedLocation,
      }),
    });
    fetchPantry();
  };

  const updateQuantity = async (id: number, quantity: number) => {
    if (quantity <= 0) return removeItem(id);
    await fetch("/api/pantry", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, quantity }),
    });
    fetchPantry();
  };

  const updateLocation = async (id: number, location: string) => {
    await fetch("/api/pantry", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, location }),
    });
    fetchPantry();
  };

  const removeItem = async (id: number) => {
    await fetch("/api/pantry", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchPantry();
  };

  const filteredItems = useMemo(() => {
    if (!search) return items;
    const s = search.toLowerCase();
    return items.filter((i) => i.product_name.toLowerCase().includes(s));
  }, [items, search]);

  const groupedByCategory = useMemo(() => {
    const groups: Record<string, PantryItem[]> = {};
    for (const item of filteredItems) {
      const key = item.category || "Autre";
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    }
    return groups;
  }, [filteredItems]);

  const groupedByLocation = useMemo(() => {
    const groups: Record<string, PantryItem[]> = {};
    for (const item of filteredItems) {
      const key = item.location || "placard";
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    }
    return groups;
  }, [filteredItems]);

  const grouped = viewMode === "category" ? groupedByCategory : groupedByLocation;

  const filteredProducts = useMemo(() => {
    if (!addSearch) return products.slice(0, 20);
    const s = addSearch.toLowerCase();
    return products.filter((p) => p.name.toLowerCase().includes(s)).slice(0, 20);
  }, [products, addSearch]);

  const pantryProductIds = useMemo(
    () => new Set(items.map((i) => i.product_id)),
    [items]
  );

  const locationLabel = (loc: string) =>
    LOCATIONS.find((l) => l.key === loc) || { label: loc, icon: "📦" };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold">Mon inventaire</h1>
          <p className="text-sm text-muted">
            {items.length} produit{items.length !== 1 ? "s" : ""} chez moi
          </p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-hover transition-colors"
        >
          {showAdd ? "Fermer" : "+ Ajouter"}
        </button>
      </div>

      {/* Add panel */}
      {showAdd && (
        <div className="mb-4 bg-card border border-border rounded-xl p-4">
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={addSearch}
              onChange={(e) => setAddSearch(e.target.value)}
              placeholder="Rechercher un produit à ajouter..."
              className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              autoFocus
            />
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="bg-background border border-border rounded-lg px-3 py-2 text-sm"
            >
              {LOCATIONS.map((loc) => (
                <option key={loc.key} value={loc.key}>
                  {loc.icon} {loc.label}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-60 overflow-y-auto">
            {filteredProducts.map((product) => {
              const inPantry = pantryProductIds.has(product.id);
              return (
                <button
                  key={product.id}
                  onClick={() => addItem(product)}
                  className={`p-2.5 rounded-lg border text-left transition-all text-sm ${
                    inPantry
                      ? "bg-primary-light border-primary/30"
                      : "bg-background border-border hover:border-primary"
                  }`}
                >
                  <span className="text-base">{product.icon || "🛒"}</span>
                  <p className="font-medium text-xs mt-0.5 truncate">
                    {product.name}
                  </p>
                  {inPantry && (
                    <span className="text-xs text-primary">Déjà ajouté</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Search + view toggle */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher dans mon inventaire..."
          className="flex-1 bg-card border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <div className="flex bg-card border border-border rounded-xl overflow-hidden">
          <button
            onClick={() => setViewMode("category")}
            className={`px-3 py-2 text-sm font-medium transition-colors ${
              viewMode === "category"
                ? "bg-primary text-white"
                : "text-muted hover:text-foreground"
            }`}
          >
            Rayon
          </button>
          <button
            onClick={() => setViewMode("location")}
            className={`px-3 py-2 text-sm font-medium transition-colors ${
              viewMode === "location"
                ? "bg-primary text-white"
                : "text-muted hover:text-foreground"
            }`}
          >
            Lieu
          </button>
        </div>
      </div>

      {/* Summary cards */}
      {items.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          {LOCATIONS.map((loc) => {
            const count = items.filter(
              (i) => (i.location || "placard") === loc.key
            ).length;
            return (
              <div
                key={loc.key}
                className="bg-card border border-border rounded-xl p-3 text-center"
              >
                <span className="text-xl">{loc.icon}</span>
                <p className="font-bold text-lg">{count}</p>
                <p className="text-xs text-muted">{loc.label}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Items list */}
      {items.length === 0 ? (
        <div className="text-center py-16 text-muted">
          <p className="text-5xl mb-4">📦</p>
          <p className="text-lg font-medium">Ton inventaire est vide</p>
          <p className="text-sm mt-1">
            Clique sur &quot;+ Ajouter&quot; pour commencer à lister ce que tu as chez toi
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([group, groupItems]) => {
              const loc = locationLabel(group);
              return (
                <div key={group}>
                  <h3 className="text-sm font-semibold text-muted mb-2 flex items-center gap-2">
                    {viewMode === "category" ? (
                      <CategoryIcon
                        category={group}
                        size={16}
                      />
                    ) : (
                      <span>{loc.icon}</span>
                    )}
                    {viewMode === "category" ? group : loc.label}
                    <span className="text-xs font-normal">
                      ({groupItems.length})
                    </span>
                  </h3>
                  <div className="space-y-1">
                    {groupItems.map((item) => (
                      <div
                        key={item.id}
                        className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3 group hover:shadow-sm transition-shadow"
                      >
                        <span className="text-lg">
                          {item.icon || "🛒"}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {item.product_name}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {viewMode === "category" && (
                              <select
                                value={item.location || "placard"}
                                onChange={(e) =>
                                  updateLocation(item.id, e.target.value)
                                }
                                className="text-xs bg-transparent border-none text-muted p-0 cursor-pointer"
                              >
                                {LOCATIONS.map((l) => (
                                  <option key={l.key} value={l.key}>
                                    {l.icon} {l.label}
                                  </option>
                                ))}
                              </select>
                            )}
                            {viewMode === "location" && item.category && (
                              <span className="text-xs text-muted flex items-center gap-1">
                                <CategoryIcon
                                  category={item.category}
                                  size={10}
                                />
                                {item.category}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() =>
                              updateQuantity(
                                item.id,
                                (item.quantity || 1) - 1
                              )
                            }
                            className="w-7 h-7 rounded-full bg-card-hover text-xs font-bold flex items-center justify-center hover:bg-danger-light hover:text-danger transition-colors"
                          >
                            -
                          </button>
                          <span className="text-sm w-10 text-center font-semibold">
                            {item.quantity || 1}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(
                                item.id,
                                (item.quantity || 1) + 1
                              )
                            }
                            className="w-7 h-7 rounded-full bg-card-hover text-xs font-bold flex items-center justify-center hover:bg-primary-light hover:text-primary transition-colors"
                          >
                            +
                          </button>
                          <span className="text-xs text-muted w-8">
                            {item.unit}
                          </span>
                        </div>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-muted hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
