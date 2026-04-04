"use client";

import { useState, useEffect, useMemo } from "react";
import { PRODUCT_CATEGORIES } from "@/lib/utils";
import { CategoryIcon } from "@/components/category-icons";

type Product = {
  id: number;
  name: string;
  category: string;
  default_unit: string;
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

export default function ListePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [listItems, setListItems] = useState<ListItem[]>([]);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [customName, setCustomName] = useState("");
  const [customQty, setCustomQty] = useState("");
  const [customUnit, setCustomUnit] = useState("pcs");
  const [showCustom, setShowCustom] = useState(false);
  const [showMobileList, setShowMobileList] = useState(false);

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((data) => setProducts(Array.isArray(data) ? data : []))
      .catch(console.error);
    fetchList();

    // Auto-refresh every 5s for multi-user sync
    const interval = setInterval(fetchList, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchList = () => {
    fetch("/api/list?status=prep")
      .then((r) => r.json())
      .then((data) => setListItems(Array.isArray(data) ? data : []))
      .catch(console.error);
  };

  let nextTempId = -1;

  const addProduct = (product: Product) => {
    // Optimistic: add to list instantly
    const tempId = nextTempId--;
    const newItem: ListItem = {
      id: tempId,
      product_id: product.id,
      product_name: product.name,
      quantity: 1,
      unit: product.default_unit,
      category: product.category,
      checked: 0,
      source: "manual",
      list_status: "prep",
    };
    setListItems((prev) => [...prev, newItem]);

    fetch("/api/list", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: product.id,
        productName: product.name,
        quantity: 1,
        unit: product.default_unit,
        category: product.category,
        source: "manual",
        listStatus: "prep",
      }),
    })
      .then((r) => r.json())
      .then((saved) => {
        // Replace temp item with real one from server
        setListItems((prev) =>
          prev.map((item) => (item.id === tempId ? saved : item))
        );
      })
      .catch(() => fetchList());
  };

  const addCustom = () => {
    if (!customName.trim()) return;
    const tempId = nextTempId--;
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
    };
    setListItems((prev) => [...prev, newItem]);
    setCustomName("");
    setCustomQty("");
    setShowCustom(false);

    fetch("/api/list", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productName: newItem.product_name,
        quantity: newItem.quantity,
        unit: newItem.unit,
        category: newItem.category,
        source: "manual",
        listStatus: "prep",
      }),
    })
      .then((r) => r.json())
      .then((saved) => {
        setListItems((prev) =>
          prev.map((item) => (item.id === tempId ? saved : item))
        );
      })
      .catch(() => fetchList());
  };

  const removeItem = (id: number) => {
    // Optimistic: remove instantly
    setListItems((prev) => prev.filter((item) => item.id !== id));
    fetch("/api/list", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    }).catch(() => fetchList());
  };

  const updateQuantity = (id: number, quantity: number) => {
    if (quantity <= 0) return removeItem(id);
    // Optimistic: update instantly
    setListItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
    fetch("/api/list", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, quantity }),
    }).catch(() => fetchList());
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

  const getListItem = (productId: number) =>
    listItems.find((item) => item.product_id === productId);
  const isInList = (productId: number) => !!getListItem(productId);

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
          <div className="flex gap-2 overflow-x-auto pb-2 mb-3 scrollbar-hide">
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                !activeCategory
                  ? "bg-primary text-white shadow-sm"
                  : "bg-card border border-border text-muted hover:text-foreground hover:shadow-sm"
              }`}
            >
              Tout
            </button>
            {PRODUCT_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${
                  activeCategory === cat
                    ? "bg-primary text-white shadow-sm"
                    : "bg-card border border-border text-muted hover:text-foreground hover:shadow-sm"
                }`}
              >
                <CategoryIcon category={cat} size={20} />
                {cat}
              </button>
            ))}
          </div>

          {/* Products grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {filteredProducts.map((product) => {
              const listItem = getListItem(product.id);
              const inList = !!listItem;
              return (
                <div
                  key={product.id}
                  className={`p-3 rounded-xl border text-left transition-all text-sm relative ${
                    inList
                      ? "bg-primary-light border-primary/40"
                      : "bg-card border-border hover:border-primary hover:shadow-sm cursor-pointer"
                  }`}
                  onClick={() => !inList && addProduct(product)}
                >
                  <span className="text-xl">{product.icon || "🛒"}</span>
                  <p className="font-medium mt-1 truncate">{product.name}</p>
                  {inList && listItem ? (
                    <div className="flex items-center gap-1 mt-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateQuantity(listItem.id, (listItem.quantity || 1) - 1);
                        }}
                        className="w-6 h-6 rounded-full bg-white/80 text-xs font-bold flex items-center justify-center hover:bg-danger-light hover:text-danger"
                      >
                        -
                      </button>
                      <span className="text-xs font-bold text-primary w-12 text-center">
                        {listItem.quantity || 1} {listItem.unit}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateQuantity(listItem.id, (listItem.quantity || 1) + 1);
                        }}
                        className="w-6 h-6 rounded-full bg-white/80 text-xs font-bold flex items-center justify-center hover:bg-primary hover:text-white"
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-muted">{product.default_unit}</p>
                  )}
                  {inList && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-primary text-white rounded-full flex items-center justify-center">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    </div>
                  )}
                </div>
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

        {/* Right: Current list - Desktop sidebar */}
        <div className="hidden lg:block">
          <ListPanel
            listItems={listItems}
            groupedList={groupedList}
            updateQuantity={updateQuantity}
            removeItem={removeItem}
            validateList={validateList}
          />
        </div>
      </div>

      {/* Mobile: floating button + bottom drawer */}
      {listItems.length > 0 && (
        <>
          {/* Floating button */}
          <button
            onClick={() => setShowMobileList(true)}
            className="lg:hidden fixed bottom-6 right-6 z-40 bg-primary text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center hover:bg-primary-hover transition-colors"
          >
            <span className="text-lg font-bold">{listItems.length}</span>
          </button>

          {/* Drawer overlay */}
          {showMobileList && (
            <div className="lg:hidden fixed inset-0 z-50">
              <div
                className="absolute inset-0 bg-black/40"
                onClick={() => setShowMobileList(false)}
              />
              <div className="absolute bottom-0 left-0 right-0 bg-background rounded-t-2xl max-h-[80vh] overflow-y-auto shadow-2xl">
                <div className="sticky top-0 bg-background px-4 pt-3 pb-2 border-b border-border flex items-center justify-between">
                  <h2 className="font-semibold flex items-center gap-2">
                    Ma liste
                    <span className="text-xs bg-primary text-white px-2.5 py-0.5 rounded-full font-bold">
                      {listItems.length}
                    </span>
                  </h2>
                  <button
                    onClick={() => setShowMobileList(false)}
                    className="text-muted p-1"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
                <div className="p-4">
                  <ListContent
                    groupedList={groupedList}
                    updateQuantity={updateQuantity}
                    removeItem={removeItem}
                  />
                  <button
                    onClick={() => {
                      setShowMobileList(false);
                      validateList();
                    }}
                    className="mt-4 w-full py-3 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-hover transition-colors"
                  >
                    Partir en courses
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ListPanel({
  listItems,
  groupedList,
  updateQuantity,
  removeItem,
  validateList,
}: {
  listItems: ListItem[];
  groupedList: Record<string, ListItem[]>;
  updateQuantity: (id: number, qty: number) => void;
  removeItem: (id: number) => void;
  validateList: () => void;
}) {
  return (
    <div
      className={`rounded-xl p-4 sticky top-20 transition-colors ${
        listItems.length > 0
          ? "bg-card border-2 border-primary/30 shadow-md"
          : "bg-card border border-border"
      }`}
    >
      <div
        className={`flex items-center justify-between mb-3 ${
          listItems.length > 0 ? "pb-3 border-b border-border" : ""
        }`}
      >
        <h2 className="font-semibold flex items-center gap-2">
          Ma liste
          <span
            className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
              listItems.length > 0
                ? "bg-primary text-white"
                : "bg-primary-light text-primary"
            }`}
          >
            {listItems.length}
          </span>
        </h2>
      </div>

      {listItems.length === 0 ? (
        <p className="text-sm text-muted text-center py-6">
          Clique sur les produits pour les ajouter
        </p>
      ) : (
        <>
          <ListContent
            groupedList={groupedList}
            updateQuantity={updateQuantity}
            removeItem={removeItem}
          />
          <button
            onClick={validateList}
            className="mt-4 w-full py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-hover transition-colors"
          >
            Partir en courses
          </button>
        </>
      )}
    </div>
  );
}

function ListContent({
  groupedList,
  updateQuantity,
  removeItem,
}: {
  groupedList: Record<string, ListItem[]>;
  updateQuantity: (id: number, qty: number) => void;
  removeItem: (id: number) => void;
}) {
  return (
    <div className="space-y-1 max-h-[60vh] overflow-y-auto">
      {Object.entries(groupedList)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([category, items]) => (
          <div key={category}>
            <p className="text-xs font-semibold text-muted mt-2 mb-1 flex items-center gap-1">
              <CategoryIcon category={category} size={12} />
              {category}
            </p>
            {items.map((item) => (
              <div
                key={item.id}
                className={`flex items-center gap-2 py-1.5 group ${
                  item.source === "recipe" ? "border-l-2 border-orange-400 pl-2" : ""
                }`}
              >
                <div className="flex-1 min-w-0">
                  <span className="text-sm truncate block">{item.product_name}</span>
                  {item.source_recipe && (
                    <span className="text-[10px] text-orange-500 truncate block">
                      {item.source_recipe}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() =>
                      updateQuantity(item.id, (item.quantity || 1) - 1)
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
                      updateQuantity(item.id, (item.quantity || 1) + 1)
                    }
                    className="w-6 h-6 rounded-full bg-card-hover text-xs font-bold flex items-center justify-center hover:bg-primary-light hover:text-primary"
                  >
                    +
                  </button>
                </div>
                <span className="text-xs text-muted w-6">{item.unit}</span>
                <button
                  onClick={() => removeItem(item.id)}
                  className="text-muted hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg
                    width="14"
                    height="14"
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
        ))}
    </div>
  );
}
