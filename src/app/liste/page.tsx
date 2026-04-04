"use client";

import { useState, useEffect, useMemo } from "react";
import { PRODUCT_CATEGORIES } from "@/lib/utils";

type Product = {
  id: number;
  name: string;
  category: string;
  defaultUnit: string;
  icon: string | null;
};

type ListItem = {
  id: number;
  productId: number | null;
  productName: string;
  quantity: number | null;
  unit: string | null;
  category: string | null;
  checked: boolean;
  source: string;
  listStatus: string;
};

export default function ListePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [listItems, setListItems] = useState<ListItem[]>([]);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [customName, setCustomName] = useState("");
  const [customQty, setCustomQty] = useState("");
  const [customUnit, setCustomUnit] = useState("pcs");
  const [showCustom, setShowCustom] = useState(false);

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((data) => setProducts(Array.isArray(data) ? data : []))
      .catch(console.error);
    fetchList();
  }, []);

  const fetchList = () => {
    fetch("/api/list?status=prep")
      .then((r) => r.json())
      .then((data) => setListItems(Array.isArray(data) ? data : []))
      .catch(console.error);
  };

  const addProduct = async (product: Product) => {
    await fetch("/api/list", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: product.id,
        productName: product.name,
        quantity: 1,
        unit: product.defaultUnit,
        category: product.category,
        source: "manual",
        listStatus: "prep",
      }),
    });
    fetchList();
  };

  const addCustom = async () => {
    if (!customName.trim()) return;
    await fetch("/api/list", {
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
    });
    setCustomName("");
    setCustomQty("");
    setShowCustom(false);
    fetchList();
  };

  const removeItem = async (id: number) => {
    await fetch("/api/list", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchList();
  };

  const updateQuantity = async (id: number, quantity: number) => {
    if (quantity <= 0) return removeItem(id);
    await fetch("/api/list", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, quantity }),
    });
    fetchList();
  };

  const validateList = async () => {
    await fetch("/api/list/validate", {
      method: "POST",
    });
    window.location.href = "/courses";
  };

  const filteredProducts = useMemo(() => {
    let filtered = products;
    if (activeCategory) {
      filtered = filtered.filter((p) => p.category === activeCategory);
    }
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter((p) => p.name.toLowerCase().includes(s));
    }
    return filtered;
  }, [products, activeCategory, search]);

  const groupedList = useMemo(() => {
    const groups: Record<string, ListItem[]> = {};
    for (const item of listItems) {
      const cat = item.category || "Autre";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    }
    return groups;
  }, [listItems]);

  const isInList = (productId: number) =>
    listItems.some((item) => item.productId === productId);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Préparer ma liste</h1>
        {listItems.length > 0 && (
          <button
            onClick={validateList}
            className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-hover transition-colors shadow-sm"
          >
            Valider la liste ({listItems.length} articles)
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Product catalog */}
        <div className="lg:col-span-2">
          {/* Search */}
          <div className="mb-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un produit..."
              className="w-full bg-card border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>

          {/* Category tabs */}
          <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3 scrollbar-hide">
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                !activeCategory
                  ? "bg-primary text-white"
                  : "bg-card border border-border text-muted hover:text-foreground"
              }`}
            >
              Tout
            </button>
            {PRODUCT_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  activeCategory === cat
                    ? "bg-primary text-white"
                    : "bg-card border border-border text-muted hover:text-foreground"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Products grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {filteredProducts.map((product) => {
              const inList = isInList(product.id);
              return (
                <button
                  key={product.id}
                  onClick={() => !inList && addProduct(product)}
                  className={`p-3 rounded-xl border text-left transition-all text-sm ${
                    inList
                      ? "bg-primary-light border-primary/30 opacity-60"
                      : "bg-card border-border hover:border-primary hover:shadow-sm"
                  }`}
                >
                  <span className="text-lg">{product.icon || "🛒"}</span>
                  <p className="font-medium mt-1 truncate">{product.name}</p>
                  <p className="text-xs text-muted">{product.defaultUnit}</p>
                  {inList && (
                    <span className="text-xs text-primary font-medium">
                      Dans la liste
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Custom product */}
          {showCustom ? (
            <div className="mt-3 bg-card border border-border rounded-xl p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addCustom()}
                  placeholder="Nom du produit"
                  className="flex-1 border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                  autoFocus
                />
                <input
                  type="number"
                  value={customQty}
                  onChange={(e) => setCustomQty(e.target.value)}
                  placeholder="Qté"
                  className="w-16 border border-border rounded-lg px-2 py-2 text-sm bg-background"
                />
                <select
                  value={customUnit}
                  onChange={(e) => setCustomUnit(e.target.value)}
                  className="border border-border rounded-lg px-2 py-2 text-sm bg-background"
                >
                  <option value="pcs">pcs</option>
                  <option value="kg">kg</option>
                  <option value="g">g</option>
                  <option value="L">L</option>
                  <option value="lot">lot</option>
                </select>
                <button
                  onClick={addCustom}
                  className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium"
                >
                  Ajouter
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowCustom(true)}
              className="mt-3 w-full py-2.5 border border-dashed border-border rounded-xl text-muted hover:border-primary hover:text-primary text-sm transition-colors"
            >
              + Produit personnalisé
            </button>
          )}
        </div>

        {/* Right: Current list */}
        <div>
          <div className="bg-card border border-border rounded-xl p-4 sticky top-20">
            <h2 className="font-semibold mb-3 flex items-center gap-2">
              Ma liste
              <span className="text-xs bg-primary-light text-primary px-2 py-0.5 rounded-full">
                {listItems.length}
              </span>
            </h2>

            {listItems.length === 0 ? (
              <p className="text-sm text-muted text-center py-6">
                Clique sur les produits pour les ajouter
              </p>
            ) : (
              <div className="space-y-1 max-h-[60vh] overflow-y-auto">
                {Object.entries(groupedList)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([category, items]) => (
                    <div key={category}>
                      <p className="text-xs font-semibold text-muted mt-2 mb-1">
                        {category}
                      </p>
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-2 py-1.5 group"
                        >
                          <span className="text-sm flex-1 truncate">
                            {item.productName}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() =>
                                updateQuantity(
                                  item.id,
                                  (item.quantity || 1) - 1
                                )
                              }
                              className="w-6 h-6 rounded-full bg-card-hover text-xs font-bold flex items-center justify-center hover:bg-danger-light hover:text-danger"
                            >
                              -
                            </button>
                            <span className="text-xs w-8 text-center font-medium">
                              {item.quantity || 1}
                            </span>
                            <button
                              onClick={() =>
                                updateQuantity(
                                  item.id,
                                  (item.quantity || 1) + 1
                                )
                              }
                              className="w-6 h-6 rounded-full bg-card-hover text-xs font-bold flex items-center justify-center hover:bg-primary-light hover:text-primary"
                            >
                              +
                            </button>
                          </div>
                          <span className="text-xs text-muted w-6">
                            {item.unit}
                          </span>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-muted hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  ))}
              </div>
            )}

            {listItems.length > 0 && (
              <button
                onClick={validateList}
                className="mt-4 w-full py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-hover transition-colors"
              >
                Partir en courses
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
