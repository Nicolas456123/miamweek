"use client";

import { useState, useEffect, useMemo } from "react";

type Product = {
  id: number;
  name: string;
  category: string;
  defaultUnit: string;
  icon: string | null;
};

type Preference = {
  id: number;
  product_id: number | null;
  product_name: string;
  status: string;
  note: string | null;
  icon: string | null;
  product_category: string | null;
};

const STATUS_CONFIG = {
  dislike: { label: "N'aime pas", icon: "👎", color: "bg-orange-100 text-orange-700 border-orange-200" },
  allergy: { label: "Allergie", icon: "⚠️", color: "bg-red-100 text-red-700 border-red-200" },
  love: { label: "Adore", icon: "❤️", color: "bg-green-100 text-green-700 border-green-200" },
} as const;

export default function PreferencesPage() {
  const [preferences, setPreferences] = useState<Preference[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [addingStatus, setAddingStatus] = useState<string | null>(null);
  const [customName, setCustomName] = useState("");
  const [customNote, setCustomNote] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("");

  useEffect(() => {
    fetchPreferences();
    fetch("/api/products")
      .then((r) => r.json())
      .then((data) => setProducts(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, []);

  const fetchPreferences = () => {
    fetch("/api/preferences")
      .then((r) => r.json())
      .then((data) => setPreferences(Array.isArray(data) ? data : []))
      .catch(console.error);
  };

  const addPreference = async (product: Product, status: string) => {
    await fetch("/api/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: product.id,
        productName: product.name,
        status,
      }),
    });
    fetchPreferences();
  };

  const addCustomPreference = async () => {
    if (!customName.trim() || !addingStatus) return;
    await fetch("/api/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productName: customName,
        status: addingStatus,
        note: customNote || null,
      }),
    });
    setCustomName("");
    setCustomNote("");
    fetchPreferences();
  };

  const updateStatus = async (id: number, status: string) => {
    await fetch("/api/preferences", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    fetchPreferences();
  };

  const removePreference = async (id: number) => {
    await fetch("/api/preferences", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchPreferences();
  };

  const prefProductNames = useMemo(
    () => new Set(preferences.map((p) => p.product_name)),
    [preferences]
  );

  const filteredProducts = useMemo(() => {
    if (!search) return [];
    const s = search.toLowerCase();
    return products
      .filter((p) => p.name.toLowerCase().includes(s) && !prefProductNames.has(p.name))
      .slice(0, 12);
  }, [products, search, prefProductNames]);

  const filteredPreferences = useMemo(() => {
    if (!filterStatus) return preferences;
    return preferences.filter((p) => p.status === filterStatus);
  }, [preferences, filterStatus]);

  const grouped = useMemo(() => {
    const groups: Record<string, Preference[]> = { allergy: [], dislike: [], love: [] };
    for (const pref of filteredPreferences) {
      if (!groups[pref.status]) groups[pref.status] = [];
      groups[pref.status].push(pref);
    }
    return groups;
  }, [filteredPreferences]);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold">Mes préférences</h1>
          <p className="text-sm text-muted">
            Indique ce que tu aimes, n&apos;aimes pas ou ne peux pas manger
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {(Object.entries(STATUS_CONFIG) as [string, typeof STATUS_CONFIG[keyof typeof STATUS_CONFIG]][]).map(([key, cfg]) => {
          const count = preferences.filter((p) => p.status === key).length;
          return (
            <button
              key={key}
              onClick={() => setFilterStatus(filterStatus === key ? "" : key)}
              className={`p-3 rounded-xl border text-center transition-all ${
                filterStatus === key ? cfg.color : "bg-card border-border hover:shadow-sm"
              }`}
            >
              <span className="text-xl">{cfg.icon}</span>
              <p className="font-bold text-lg">{count}</p>
              <p className="text-xs text-muted">{cfg.label}</p>
            </button>
          );
        })}
      </div>

      {/* Add section */}
      <div className="mb-4 bg-card border border-border rounded-xl p-4">
        <h3 className="font-semibold text-sm mb-3">Ajouter une préférence</h3>

        {/* Status selector */}
        <div className="flex gap-2 mb-3">
          {(Object.entries(STATUS_CONFIG) as [string, typeof STATUS_CONFIG[keyof typeof STATUS_CONFIG]][]).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => setAddingStatus(addingStatus === key ? null : key)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                addingStatus === key
                  ? cfg.color
                  : "bg-background border-border text-muted hover:text-foreground"
              }`}
            >
              {cfg.icon} {cfg.label}
            </button>
          ))}
        </div>

        {addingStatus && (
          <>
            {/* Search products */}
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un aliment..."
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
              autoFocus
            />

            {/* Product suggestions */}
            {filteredProducts.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 mb-3">
                {filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => {
                      addPreference(product, addingStatus);
                      setSearch("");
                    }}
                    className="p-2 rounded-lg border border-border bg-background hover:border-primary text-left text-sm transition-colors"
                  >
                    <span>{product.icon || "🛒"}</span>{" "}
                    <span className="text-xs">{product.name}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Custom input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addCustomPreference()}
                placeholder="Ou tape un aliment personnalisé..."
                className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm"
              />
              <input
                type="text"
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                placeholder="Note (optionnel)"
                className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm"
              />
              <button
                onClick={addCustomPreference}
                disabled={!customName.trim()}
                className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium disabled:opacity-50"
              >
                Ajouter
              </button>
            </div>
          </>
        )}
      </div>

      {/* Preferences list */}
      {preferences.length === 0 ? (
        <div className="text-center py-16 text-muted">
          <p className="text-5xl mb-4">🍽️</p>
          <p className="text-lg font-medium">Aucune préférence enregistrée</p>
          <p className="text-sm mt-1">
            Clique sur un statut ci-dessus puis cherche un aliment
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {(["allergy", "dislike", "love"] as const).map((statusKey) => {
            const items = grouped[statusKey] || [];
            if (items.length === 0) return null;
            const cfg = STATUS_CONFIG[statusKey];

            return (
              <div key={statusKey}>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <span>{cfg.icon}</span>
                  {cfg.label}
                  <span className="text-xs font-normal text-muted">({items.length})</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {items.map((pref) => (
                    <div
                      key={pref.id}
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm group ${cfg.color}`}
                    >
                      <span>{pref.icon || "🍽️"}</span>
                      <span className="font-medium">{pref.product_name}</span>
                      {pref.note && (
                        <span className="text-xs opacity-70">({pref.note})</span>
                      )}
                      {/* Quick status switcher */}
                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {Object.keys(STATUS_CONFIG)
                          .filter((s) => s !== pref.status)
                          .map((s) => (
                            <button
                              key={s}
                              onClick={() => updateStatus(pref.id, s)}
                              className="text-xs hover:scale-110 transition-transform"
                              title={STATUS_CONFIG[s as keyof typeof STATUS_CONFIG].label}
                            >
                              {STATUS_CONFIG[s as keyof typeof STATUS_CONFIG].icon}
                            </button>
                          ))}
                        <button
                          onClick={() => removePreference(pref.id)}
                          className="text-xs hover:scale-110 transition-transform ml-1"
                          title="Supprimer"
                        >
                          ✕
                        </button>
                      </div>
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
