"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Button,
  Card,
  Chip,
  EmptyState,
  Field,
  PageHeader,
  SectionTitle,
} from "@/components/ui-kit";

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

type StatusKey = "dislike" | "allergy" | "love";
type ChipTone = "neutral" | "terra" | "olive" | "mustard" | "ink";

const STATUS_CONFIG: Record<StatusKey, { label: string; tone: ChipTone }> = {
  dislike: { label: "N'aime pas", tone: "mustard" },
  allergy: { label: "Allergie", tone: "terra" },
  love: { label: "Adore", tone: "olive" },
};

export default function PreferencesPage() {
  const [preferences, setPreferences] = useState<Preference[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [addingStatus, setAddingStatus] = useState<StatusKey | null>(null);
  const [customName, setCustomName] = useState("");
  const [customNote, setCustomNote] = useState("");
  const [filterStatus, setFilterStatus] = useState<StatusKey | "">("");

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
    const groups: Record<StatusKey, Preference[]> = { allergy: [], dislike: [], love: [] };
    for (const pref of filteredPreferences) {
      const key = pref.status as StatusKey;
      if (groups[key]) groups[key].push(pref);
    }
    return groups;
  }, [filteredPreferences]);

  const dotForTone: Record<ChipTone, string> = {
    neutral: "dot-ink",
    terra: "dot-terra",
    olive: "dot-olive",
    mustard: "dot-mustard",
    ink: "dot-ink",
  };

  return (
    <div className="max-w-3xl mx-auto pb-24 md:pb-8">
      <PageHeader
        eyebrow="préférences"
        title={
          <>
            Mes <span style={{ fontStyle: "italic", color: "var(--color-terracotta)" }}>goûts</span>
          </>
        }
        subtitle="Indique ce que tu aimes, n'aimes pas ou ne peux pas manger."
      />

      {/* Summary tiles — filter toggles */}
      <div className="grid grid-cols-3 gap-px mb-6" style={{ background: "var(--color-line)" }}>
        {(Object.entries(STATUS_CONFIG) as [StatusKey, typeof STATUS_CONFIG[StatusKey]][]).map(
          ([key, cfg]) => {
            const count = preferences.filter((p) => p.status === key).length;
            const isActive = filterStatus === key;
            return (
              <button
                key={key}
                onClick={() => setFilterStatus(isActive ? "" : key)}
                className="p-5 text-left transition-colors"
                style={{
                  background: isActive
                    ? "var(--color-ink)"
                    : "var(--color-cream-pale)",
                  color: isActive
                    ? "var(--color-cream-pale)"
                    : "var(--color-ink)",
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className={`dot ${dotForTone[cfg.tone]}`} />
                  <span
                    className="eyebrow"
                    style={{
                      color: isActive ? "var(--color-cream-deep)" : undefined,
                    }}
                  >
                    {cfg.label}
                  </span>
                </div>
                <p className="font-display text-4xl tnum leading-none">
                  {String(count).padStart(2, "0")}
                </p>
              </button>
            );
          }
        )}
      </div>

      {/* Add preference */}
      <Card variant="default" padding="lg" className="mb-6">
        <SectionTitle>Ajouter une préférence</SectionTitle>

        <div className="flex gap-2 mb-4">
          {(Object.entries(STATUS_CONFIG) as [StatusKey, typeof STATUS_CONFIG[StatusKey]][]).map(
            ([key, cfg]) => {
              const isSel = addingStatus === key;
              return (
                <button
                  key={key}
                  onClick={() => setAddingStatus(isSel ? null : key)}
                  className="flex-1 py-2.5 rounded-md text-sm transition-colors border"
                  style={{
                    background: isSel ? "var(--color-ink)" : "var(--color-cream-pale)",
                    color: isSel ? "var(--color-cream-pale)" : "var(--color-ink-soft)",
                    borderColor: isSel ? "var(--color-ink)" : "var(--color-line)",
                  }}
                >
                  <span className={`dot ${dotForTone[cfg.tone]} mr-2`} />
                  {cfg.label}
                </button>
              );
            }
          )}
        </div>

        {addingStatus && (
          <div className="space-y-3">
            <Field
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un aliment…"
              autoFocus
            />

            {filteredProducts.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => {
                      addPreference(product, addingStatus);
                      setSearch("");
                    }}
                    className="px-3 py-2 rounded-md border text-left text-sm transition-colors hover:bg-[var(--color-cream-deep)]"
                    style={{
                      background: "var(--color-cream-pale)",
                      borderColor: "var(--color-line)",
                      color: "var(--color-ink-soft)",
                    }}
                  >
                    {product.name}
                  </button>
                ))}
              </div>
            )}

            <div className="flex flex-col md:flex-row gap-2 pt-2 border-t" style={{ borderColor: "var(--color-line)" }}>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addCustomPreference()}
                placeholder="Ou tape un aliment personnalisé…"
                className="flex-1 bg-[var(--color-cream-pale)] border border-[var(--color-line)] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-terracotta)]"
              />
              <input
                type="text"
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                placeholder="Note (optionnel)"
                className="md:w-48 bg-[var(--color-cream-pale)] border border-[var(--color-line)] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-terracotta)]"
              />
              <Button
                variant="primary"
                size="md"
                onClick={addCustomPreference}
                disabled={!customName.trim()}
              >
                Ajouter
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Preferences list */}
      {preferences.length === 0 ? (
        <EmptyState
          title="Aucune préférence"
          description="Choisis un statut ci-dessus puis cherche un aliment pour démarrer."
        />
      ) : (
        <div className="space-y-6">
          {(["allergy", "dislike", "love"] as const).map((statusKey) => {
            const items = grouped[statusKey] || [];
            if (items.length === 0) return null;
            const cfg = STATUS_CONFIG[statusKey];

            return (
              <div key={statusKey}>
                <SectionTitle count={items.length}>
                  <span className={`dot ${dotForTone[cfg.tone]}`} />
                  {cfg.label}
                </SectionTitle>
                <div className="flex flex-wrap gap-2">
                  {items.map((pref) => (
                    <div
                      key={pref.id}
                      className="group inline-flex items-center gap-2 rounded-full border text-sm pl-3 pr-2 py-1"
                      style={{
                        background: "var(--color-cream-pale)",
                        borderColor: "var(--color-line)",
                        color: "var(--color-ink-soft)",
                      }}
                    >
                      <span className={`dot ${dotForTone[cfg.tone]}`} />
                      <span className="font-medium" style={{ color: "var(--color-ink)" }}>
                        {pref.product_name}
                      </span>
                      {pref.note && (
                        <span
                          className="text-xs"
                          style={{ color: "var(--color-ink-mute)" }}
                        >
                          ({pref.note})
                        </span>
                      )}
                      <div className="flex gap-1 ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {(Object.keys(STATUS_CONFIG) as StatusKey[])
                          .filter((s) => s !== pref.status)
                          .map((s) => (
                            <button
                              key={s}
                              onClick={() => updateStatus(pref.id, s)}
                              className="font-mono text-[10px] px-1.5 py-0.5 rounded"
                              style={{
                                background: "var(--color-cream-deep)",
                                color: "var(--color-ink-mute)",
                                letterSpacing: "0.04em",
                              }}
                              title={`Passer en ${STATUS_CONFIG[s].label.toLowerCase()}`}
                            >
                              <span className={`dot ${dotForTone[STATUS_CONFIG[s].tone]} mr-1`} />
                              {STATUS_CONFIG[s].label}
                            </button>
                          ))}
                        <button
                          onClick={() => removePreference(pref.id)}
                          className="font-mono text-[10px] px-1.5 py-0.5 rounded"
                          style={{
                            background: "var(--color-cream-deep)",
                            color: "var(--color-ink-mute)",
                          }}
                          title="Supprimer"
                        >
                          ×
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
