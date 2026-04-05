"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { CategoryIcon } from "@/components/category-icons";
import { CategoryFilter, getFilterCategories } from "@/components/category-filter";
import { useOfflineSync, offlineFetch } from "@/lib/offline-sync";

type Product = {
  id: number;
  name: string;
  category: string;
  default_unit: string;
  default_quantity: number | null;
  quantity_presets: string | null; // JSON array e.g. "[6, 12, 20]"
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

type PantryItem = {
  product_id: number | null;
  product_name: string;
  quantity: number | null;
  unit: string | null;
  location: string | null;
};

// Smart step size based on unit and default quantity
function getStep(unit: string, defaultQty: number | null): number {
  const u = unit.toLowerCase();
  if (u === "g") return 50;
  if (u === "ml") return 50;
  if (u === "kg") return 0.5;
  if (u === "l") return 0.25;
  // For pieces/lots/boîtes, step by 1
  return 1;
}

// Format quantity for display (remove trailing .0)
function fmtQty(qty: number): string {
  if (Number.isInteger(qty)) return String(qty);
  // Show max 2 decimals
  const s = qty.toFixed(2).replace(/\.?0+$/, "");
  return s;
}

function locationLabel(loc: string | null): string {
  if (loc === "frigo") return "Frigo";
  if (loc === "congélateur") return "Congél.";
  if (loc === "placard") return "Placard";
  return "";
}

// Normalize units to a base for comparison (g, ml, pcs)
function normalizeToBase(qty: number, unit: string): { qty: number; base: string } | null {
  const u = unit.toLowerCase();
  if (u === "g") return { qty, base: "g" };
  if (u === "kg") return { qty: qty * 1000, base: "g" };
  if (u === "ml") return { qty, base: "ml" };
  if (u === "l") return { qty: qty * 1000, base: "ml" };
  if (u === "cl") return { qty: qty * 10, base: "ml" };
  if (u === "pcs" || u === "lot" || u === "bout." || u === "boîte") return { qty, base: u };
  return { qty, base: u };
}

function unitsCompatible(unitA: string, unitB: string): boolean {
  const a = normalizeToBase(1, unitA);
  const b = normalizeToBase(1, unitB);
  if (!a || !b) return false;
  return a.base === b.base;
}

type StockStatus = "enough" | "partial" | "incompatible" | "unknown";

function getStockStatus(
  needQty: number | null,
  needUnit: string | null,
  stockQty: number | null,
  stockUnit: string | null
): { status: StockStatus; label: string } {
  if (!stockQty || !stockUnit || !needUnit) {
    return { status: "unknown", label: "En stock" };
  }

  if (!unitsCompatible(needUnit, stockUnit)) {
    // Can't compare - just show what's in stock with its own unit
    return {
      status: "incompatible",
      label: `En stock : ${fmtQty(stockQty)} ${stockUnit}`,
    };
  }

  const need = normalizeToBase(needQty || 0, needUnit);
  const stock = normalizeToBase(stockQty, stockUnit);
  if (!need || !stock) return { status: "unknown", label: "En stock" };

  if (stock.qty >= need.qty) {
    return { status: "enough", label: `En stock : ${fmtQty(stockQty)} ${stockUnit} (suffisant)` };
  }
  return { status: "partial", label: `En stock : ${fmtQty(stockQty)} ${stockUnit} (insuffisant)` };
}

export default function ListePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [listItems, setListItems] = useState<ListItem[]>([]);
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [customName, setCustomName] = useState("");
  const [customQty, setCustomQty] = useState("");
  const [customUnit, setCustomUnit] = useState("pcs");
  const [showCustom, setShowCustom] = useState(false);
  const [showMobileList, setShowMobileList] = useState(false);

  // Smart scan states
  const [smartMode, setSmartMode] = useState<"none" | "text" | "photo" | "voice">("none");
  const [smartText, setSmartText] = useState("");
  const [smartImage, setSmartImage] = useState<string | null>(null);
  const [smartLoading, setSmartLoading] = useState(false);
  const [smartResult, setSmartResult] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);

  const fetchList = useCallback(() => {
    fetch("/api/list?status=prep")
      .then((r) => r.json())
      .then((data) => setListItems(Array.isArray(data) ? data : []))
      .catch(() => { /* offline - keep local state */ });
  }, []);

  const { isOnline, queueSize, syncNow, safeFetch } = useOfflineSync(fetchList);

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((data) => setProducts(Array.isArray(data) ? data : []))
      .catch(console.error);
    fetch("/api/pantry")
      .then((r) => r.json())
      .then((data) => setPantryItems(Array.isArray(data) ? data : []))
      .catch(console.error);
    fetchList();

    // Auto-refresh every 5s — but only if no pending offline mutations
    const interval = setInterval(() => {
      if (navigator.onLine) safeFetch();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchList]);

  // Pantry lookup by product name (lowercase)
  const pantryByName = useMemo(() => {
    const map: Record<string, PantryItem> = {};
    for (const p of pantryItems) {
      map[p.product_name.toLowerCase()] = p;
    }
    return map;
  }, [pantryItems]);

  const getPantryInfo = (name: string): PantryItem | undefined =>
    pantryByName[name.toLowerCase()];

  let nextTempId = -1;

  const addProduct = (product: Product, qty?: number) => {
    const defaultQty = qty || product.default_quantity || 1;
    // Optimistic: add to list instantly
    const tempId = nextTempId--;
    const newItem: ListItem = {
      id: tempId,
      product_id: product.id,
      product_name: product.name,
      quantity: defaultQty,
      unit: product.default_unit,
      category: product.category,
      checked: 0,
      source: "manual",
      list_status: "prep",
      source_recipe: null,
    };
    setListItems((prev) => [...prev, newItem]);

    offlineFetch("/api/list", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: product.id,
        productName: product.name,
        quantity: defaultQty,
        unit: product.default_unit,
        category: product.category,
        source: "manual",
        listStatus: "prep",
      }),
      offlineOptimistic: true,
    })
      .then((r) => r?.json())
      .then((saved) => {
        if (saved && !saved.queued) {
          setListItems((prev) =>
            prev.map((item) => (item.id === tempId ? saved : item))
          );
        }
      })
      .catch(() => {});
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
      source_recipe: null,
    };
    setListItems((prev) => [...prev, newItem]);
    setCustomName("");
    setCustomQty("");
    setShowCustom(false);

    offlineFetch("/api/list", {
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
      offlineOptimistic: true,
    })
      .then((r) => r?.json())
      .then((saved) => {
        if (saved && !saved.queued) {
          setListItems((prev) =>
            prev.map((item) => (item.id === tempId ? saved : item))
          );
        }
      })
      .catch(() => {});
  };

  const removeItem = (id: number) => {
    // Optimistic: remove instantly
    setListItems((prev) => prev.filter((item) => item.id !== id));
    offlineFetch("/api/list", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
      offlineOptimistic: true,
    });
  };

  const clearAllItems = async () => {
    setListItems([]);
    await fetch("/api/list", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true, status: "prep" }),
    });
  };

  // Smart scan functions
  const handleSmartScan = async () => {
    if (!smartText && !smartImage) return;
    setSmartLoading(true);
    setSmartResult(null);
    try {
      const res = await fetch("/api/list-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: smartImage || undefined,
          text: smartText || undefined,
        }),
      });
      const data = await res.json();
      if (data.count > 0) {
        setSmartResult(`${data.count} produit${data.count > 1 ? "s" : ""} ajouté${data.count > 1 ? "s" : ""}`);
        fetchList();
        setTimeout(() => {
          setSmartMode("none");
          setSmartText("");
          setSmartImage(null);
          setSmartResult(null);
        }, 2000);
      } else {
        setSmartResult("Aucun produit détecté");
      }
    } catch {
      setSmartResult("Erreur de scan");
    }
    setSmartLoading(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setSmartImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const startListening = () => {
    const SpeechRecognition = (window as unknown as { webkitSpeechRecognition?: typeof window.SpeechRecognition; SpeechRecognition?: typeof window.SpeechRecognition }).webkitSpeechRecognition || (window as unknown as { SpeechRecognition?: typeof window.SpeechRecognition }).SpeechRecognition;
    if (!SpeechRecognition) {
      setSmartResult("Reconnaissance vocale non supportée par ce navigateur");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "fr-FR";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: Event & { results: SpeechRecognitionResultList }) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setSmartText(transcript);
    };

    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.start();
    setIsListening(true);

    // Auto-stop after 15 seconds
    setTimeout(() => {
      try { recognition.stop(); } catch { /* ignore */ }
    }, 15000);
  };

  const updateQuantity = (id: number, quantity: number) => {
    if (quantity <= 0) return removeItem(id);
    // Optimistic: update instantly
    setListItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
    offlineFetch("/api/list", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, quantity }),
      offlineOptimistic: true,
    });
  };

  const validateList = async () => {
    if (!navigator.onLine) {
      alert("Tu dois être en ligne pour valider la liste.");
      return;
    }
    await fetch("/api/list/validate", {
      method: "POST",
    });
    window.location.href = "/courses";
  };

  const filteredProducts = useMemo(() => {
    let filtered = products;
    const filterCats = getFilterCategories(activeCategory);
    if (filterCats) {
      filtered = filtered.filter((p) => filterCats.includes(p.category));
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
    <div className="flex flex-col h-[calc(100vh-160px)] md:h-[calc(100vh-120px)]">
      {/* Offline banner */}
      {(!isOnline || queueSize > 0) && (
        <div
          className={`mb-3 px-4 py-2.5 rounded-xl text-sm font-medium flex items-center justify-between shrink-0 ${
            !isOnline
              ? "bg-orange-100 text-orange-800 border border-orange-200"
              : "bg-blue-100 text-blue-800 border border-blue-200"
          }`}
        >
          <div className="flex items-center gap-2">
            <span>{!isOnline ? "📡" : "🔄"}</span>
            {!isOnline ? (
              <span>
                Mode hors-ligne — tes modifications sont sauvegardées localement
                {queueSize > 0 && ` (${queueSize} en attente)`}
              </span>
            ) : (
              <span>
                {queueSize} modification{queueSize > 1 ? "s" : ""} en attente
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

      <div className="flex items-center justify-between mb-3 shrink-0">
        <h1 className="text-xl font-bold">Ma liste</h1>
        {listItems.length > 0 && (
          <button
            onClick={validateList}
            className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-hover transition-colors shadow-sm whitespace-nowrap"
          >
            Valider ({listItems.length} articles)
          </button>
        )}
      </div>

      {/* Search */}
      <div className="mb-3 shrink-0">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un produit..."
          className="w-full bg-card border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        />
      </div>

      {/* Smart add buttons */}
      <div className="flex gap-2 mb-3 shrink-0">
        {([
          { mode: "text" as const, icon: "✏️", label: "Taper" },
          { mode: "photo" as const, icon: "📸", label: "Photo" },
          { mode: "voice" as const, icon: "🎤", label: "Parler" },
        ]).map((m) => (
          <button
            key={m.mode}
            onClick={() => {
              setSmartMode(smartMode === m.mode ? "none" : m.mode);
              setSmartText("");
              setSmartImage(null);
              setSmartResult(null);
            }}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
              smartMode === m.mode
                ? "bg-primary text-white shadow-sm"
                : "bg-card border border-border text-muted hover:text-foreground hover:shadow-sm"
            }`}
          >
            <span>{m.icon}</span>
            {m.label}
          </button>
        ))}
      </div>

      {/* Smart scan panel */}
      {smartMode !== "none" && (
        <div className="bg-card border border-border rounded-xl p-3 mb-3 shrink-0 space-y-2">
          {smartMode === "text" && (
            <div className="flex gap-2">
              <input
                type="text"
                value={smartText}
                onChange={(e) => setSmartText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && smartText.trim()) handleSmartScan();
                }}
                placeholder="du lait, 6 oeufs, 500g de farine..."
                className="flex-1 border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                autoFocus
              />
              <button
                onClick={handleSmartScan}
                disabled={!smartText.trim() || smartLoading}
                className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium disabled:opacity-50"
              >
                {smartLoading ? "..." : "Ajouter"}
              </button>
            </div>
          )}
          {smartMode === "photo" && (
            <div className="space-y-2">
              {smartImage ? (
                <div className="relative">
                  <img src={smartImage} alt="Scan" className="w-full max-h-40 object-contain rounded-lg bg-gray-100" />
                  <button
                    onClick={() => setSmartImage(null)}
                    className="absolute top-1 right-1 w-6 h-6 bg-danger text-white rounded-full text-xs flex items-center justify-center"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center py-4 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary transition-colors">
                  <span className="text-2xl mb-1">📸</span>
                  <span className="text-xs text-muted">Photo, screenshot ou ticket</span>
                  <input type="file" accept="image/*" capture="environment" onChange={handleImageUpload} className="hidden" />
                </label>
              )}
              {smartImage && (
                <button onClick={handleSmartScan} disabled={smartLoading}
                  className="w-full py-2 bg-primary text-white rounded-lg text-sm font-semibold disabled:opacity-50">
                  {smartLoading ? "Analyse en cours..." : "Analyser et ajouter"}
                </button>
              )}
            </div>
          )}
          {smartMode === "voice" && (
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <button
                  onClick={isListening ? undefined : startListening}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all shrink-0 ${
                    isListening ? "bg-danger text-white animate-pulse" : "bg-primary text-white hover:bg-primary-hover"
                  }`}
                >
                  🎤
                </button>
                <div className="flex-1">
                  {smartText ? (
                    <p className="text-sm">{smartText}</p>
                  ) : (
                    <p className="text-sm text-muted italic">
                      {isListening ? "Parle maintenant..." : "Appuie pour dicter"}
                    </p>
                  )}
                </div>
              </div>
              {smartText && (
                <button onClick={handleSmartScan} disabled={smartLoading}
                  className="w-full py-2 bg-primary text-white rounded-lg text-sm font-semibold disabled:opacity-50">
                  {smartLoading ? "Ajout en cours..." : "Ajouter à la liste"}
                </button>
              )}
            </div>
          )}
          {smartResult && (
            <p className={`text-sm font-medium text-center py-1 ${smartResult.includes("ajouté") ? "text-primary" : "text-danger"}`}>
              {smartResult}
            </p>
          )}
        </div>
      )}

      {/* Category tabs */}
      <div className="mb-3 shrink-0">
        <CategoryFilter active={activeCategory} onChange={setActiveCategory} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0 overflow-hidden">
        {/* Left: Product catalog */}
        <div className="lg:col-span-2 overflow-y-auto min-h-0 pr-2">
          {/* Products grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {filteredProducts.map((product) => {
              const listItem = getListItem(product.id);
              const inList = !!listItem;
              const pantryInfo = getPantryInfo(product.name);
              const presets = product.quantity_presets
                ? (() => { try { return JSON.parse(product.quantity_presets!) as number[]; } catch { return null; } })()
                : null;
              const step = getStep(product.default_unit, product.default_quantity);
              const defaultQty = product.default_quantity || 1;

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
                    <div className="mt-1">
                      {/* Presets row if available */}
                      {presets && (
                        <div className="flex gap-1 mb-1 flex-wrap">
                          {presets.map((p) => (
                            <button
                              key={p}
                              onClick={(e) => {
                                e.stopPropagation();
                                updateQuantity(listItem.id, p);
                              }}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors ${
                                listItem.quantity === p
                                  ? "bg-primary text-white"
                                  : "bg-white/80 text-muted hover:text-primary"
                              }`}
                            >
                              {p}
                            </button>
                          ))}
                        </div>
                      )}
                      {/* +/- controls */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateQuantity(listItem.id, (listItem.quantity || defaultQty) - step);
                          }}
                          className="w-6 h-6 rounded-full bg-white/80 text-xs font-bold flex items-center justify-center hover:bg-danger-light hover:text-danger"
                        >
                          -
                        </button>
                        <span className="text-xs font-bold text-primary w-14 text-center">
                          {fmtQty(listItem.quantity || defaultQty)} {listItem.unit}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateQuantity(listItem.id, (listItem.quantity || defaultQty) + step);
                          }}
                          className="w-6 h-6 rounded-full bg-white/80 text-xs font-bold flex items-center justify-center hover:bg-primary hover:text-white"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-muted">
                      {fmtQty(defaultQty)} {product.default_unit}
                    </p>
                  )}

                  {/* In pantry indicator */}
                  {pantryInfo && (() => {
                    const listQty = listItem?.quantity ?? defaultQty;
                    const listUnit = listItem?.unit ?? product.default_unit;
                    const stock = getStockStatus(listQty, listUnit, pantryInfo.quantity, pantryInfo.unit);
                    const colors = stock.status === "enough"
                      ? "bg-green-100 text-green-700"
                      : stock.status === "partial"
                        ? "bg-orange-100 text-orange-700"
                        : "bg-blue-100 text-blue-600";
                    return (
                      <div className={`absolute bottom-2 right-2 text-[9px] font-medium px-1.5 py-0.5 rounded-full ${colors}`}>
                        {stock.label}
                      </div>
                    );
                  })()}

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

          {/* end of products grid container */}
        </div>

        {/* Right: Current list - Desktop sidebar */}
        <div className="hidden lg:block">
          <ListPanel
            listItems={listItems}
            groupedList={groupedList}
            updateQuantity={updateQuantity}
            removeItem={removeItem}
            clearAllItems={clearAllItems}
            validateList={validateList}
            getPantryInfo={getPantryInfo}
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
                  <div className="flex items-center gap-2">
                    <button
                      onClick={clearAllItems}
                      className="text-xs text-danger hover:text-danger font-medium"
                    >
                      Tout vider
                    </button>
                    <button
                      onClick={() => setShowMobileList(false)}
                      className="text-muted p-1"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <ListContent
                    groupedList={groupedList}
                    updateQuantity={updateQuantity}
                    removeItem={removeItem}
                    getPantryInfo={getPantryInfo}
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
  clearAllItems,
  validateList,
  getPantryInfo,
}: {
  listItems: ListItem[];
  groupedList: Record<string, ListItem[]>;
  updateQuantity: (id: number, qty: number) => void;
  removeItem: (id: number) => void;
  clearAllItems: () => void;
  validateList: () => void;
  getPantryInfo: (name: string) => PantryItem | undefined;
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
        {listItems.length > 0 && (
          <button
            onClick={clearAllItems}
            className="text-xs text-danger hover:text-danger font-medium"
          >
            Tout vider
          </button>
        )}
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
            getPantryInfo={getPantryInfo}
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
  getPantryInfo,
}: {
  groupedList: Record<string, ListItem[]>;
  updateQuantity: (id: number, qty: number) => void;
  removeItem: (id: number) => void;
  getPantryInfo: (name: string) => PantryItem | undefined;
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
            {items.map((item) => {
              const step = getStep(item.unit || "pcs", item.quantity);
              const pantryInfo = getPantryInfo(item.product_name);
              return (
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
                  {pantryInfo && (() => {
                    const stock = getStockStatus(item.quantity, item.unit, pantryInfo.quantity, pantryInfo.unit);
                    const color = stock.status === "enough"
                      ? "text-green-600"
                      : stock.status === "partial"
                        ? "text-orange-500"
                        : "text-blue-500";
                    return (
                      <span className={`text-[10px] ${color} truncate block`}>
                        {stock.label}{pantryInfo.location ? ` — ${locationLabel(pantryInfo.location)}` : ""}
                      </span>
                    );
                  })()}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() =>
                      updateQuantity(item.id, (item.quantity || 1) - step)
                    }
                    className="w-6 h-6 rounded-full bg-card-hover text-xs font-bold flex items-center justify-center hover:bg-danger-light hover:text-danger"
                  >
                    -
                  </button>
                  <span className="text-xs w-12 text-center font-medium">
                    {fmtQty(item.quantity || 1)}
                  </span>
                  <button
                    onClick={() =>
                      updateQuantity(item.id, (item.quantity || 1) + step)
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
              );
            })}
          </div>
        ))}
    </div>
  );
}
