"use client";

import { useState, useEffect, useMemo, useCallback, useRef, type ReactNode } from "react";
import Link from "next/link";
import { useToast } from "@/components/toast";
import { CategoryIcon } from "@/components/category-icons";
import { useOfflineSync, offlineFetch } from "@/lib/offline-sync";
import { rankedFilter, formatQuantity, estimatePrice, normalize, UNITS, PRODUCT_CATEGORIES } from "@/lib/utils";

type Product = {
  id: number;
  name: string;
  category: string;
  default_unit: string;
  default_quantity: number | null;
  icon: string | null;
  price?: number | null;
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
  "Desserts & Sucré",
  "Épicerie",
  "Surgelés",
  "Boissons",
  "Hygiène & Beauté",
  "Entretien & Maison",
  "Épices & Condiments",
  "Autre",
];

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

// Bouton qui répète l'action tant qu'il est maintenu (en accélérant).
function HoldButton({
  onStep,
  ariaLabel,
  className,
  style,
  children,
}: {
  onStep: () => void;
  ariaLabel: string;
  className?: string;
  style?: React.CSSProperties;
  children: ReactNode;
}) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const delay = useRef(280);

  const stop = () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  };
  const start = () => {
    stop();
    onStep();
    delay.current = 280;
    const tick = () => {
      onStep();
      delay.current = Math.max(45, delay.current * 0.8);
      timer.current = setTimeout(tick, delay.current);
    };
    timer.current = setTimeout(tick, delay.current);
  };

  useEffect(() => () => stop(), []);

  return (
    <button
      onPointerDown={(e) => {
        e.preventDefault();
        start();
      }}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      aria-label={ariaLabel}
      className={className}
      style={style}
    >
      {children}
    </button>
  );
}

// Ligne avec glisser-pour-supprimer (vers la gauche) sur mobile.
function SwipeRow({ onRemove, children }: { onRemove: () => void; children: ReactNode }) {
  const [dx, setDx] = useState(0);
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  const horizontal = useRef(false);

  const onTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    horizontal.current = false;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (startX.current == null) return;
    const dX = e.touches[0].clientX - startX.current;
    const dY = e.touches[0].clientY - (startY.current ?? 0);
    if (!horizontal.current && Math.abs(dX) > Math.abs(dY) && Math.abs(dX) > 8) {
      horizontal.current = true;
    }
    if (horizontal.current) setDx(Math.max(-140, Math.min(0, dX)));
  };
  const onTouchEnd = () => {
    if (dx < -80) onRemove();
    setDx(0);
    startX.current = null;
    horizontal.current = false;
  };

  return (
    <div className="relative overflow-hidden" style={{ background: "var(--color-cream)" }}>
      {/* Fond rouge « supprimer » révélé au glissement */}
      <div
        className="absolute inset-0 flex items-center justify-end pr-5"
        style={{ background: "var(--color-terracotta)", color: "var(--color-cream-pale)" }}
        aria-hidden
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
      </div>
      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{
          transform: `translateX(${dx}px)`,
          transition: dx === 0 ? "transform 0.2s ease" : "none",
          background: "var(--color-cream)",
        }}
      >
        {children}
      </div>
    </div>
  );
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
  const [customCategory, setCustomCategory] = useState<string>("Autre");
  const [catalogCat, setCatalogCat] = useState<string | null>(null);
  const [orderCounts, setOrderCounts] = useState<Record<string, number>>({});
  const [currentList, setCurrentList] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("miamweek_current_list") || "Ma liste";
    }
    return "Ma liste";
  });
  const [serverLists, setServerLists] = useState<string[]>([]);
  const [serverListNames, setServerListNames] = useState<string[]>([]);
  const [pending, setPending] = useState<{
    productId: number | null;
    name: string;
    qty: string;
    unit: string;
    category: string;
  } | null>(null);
  const [now, setNow] = useState<Date | null>(null);
  const nextTempIdRef = useRef(-1);
  const itemsRef = useRef<ListItem[]>([]);
  const syncTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    setNow(new Date());
  }, []);

  // Ouvre le panneau d'ajout en pré-sélectionnant la catégorie du filtre actif.
  const openAddPanel = () => {
    if (activeCategory) setCustomCategory(activeCategory);
    setShowAdd(true);
  };

  const fetchList = useCallback(() => {
    fetch(`/api/list?status=prep&list=${encodeURIComponent(currentList)}`)
      .then((r) => r.json())
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [currentList]);

  // La liste courante (sélection) reste un choix par appareil.
  useEffect(() => {
    localStorage.setItem("miamweek_current_list", currentList);
  }, [currentList]);

  const fetchLists = useCallback(() => {
    fetch("/api/lists")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) setServerLists(d.map((l: { name: string }) => l.name));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

  // Toutes les listes connues (en base + présentes via les articles)
  const knownLists = useMemo(() => {
    const set = new Set<string>(["Ma liste", ...serverLists, ...serverListNames, currentList]);
    return [...set];
  }, [serverLists, serverListNames, currentList]);

  const createNewList = async () => {
    const name = window.prompt("Nom de la nouvelle liste ?");
    const trimmed = name?.trim();
    if (!trimmed) return;
    setServerLists((prev) => (prev.includes(trimmed) ? prev : [...prev, trimmed]));
    setCurrentList(trimmed);
    setActiveCategory(null);
    try {
      await fetch("/api/lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
    } catch {
      /* sera retenté au prochain chargement */
    }
  };

  const deleteCurrentList = async () => {
    if (currentList === "Ma liste") return;
    if (!confirm(`Supprimer la liste « ${currentList} » et ses articles ?`)) return;
    const name = currentList;
    setServerLists((prev) => prev.filter((n) => n !== name));
    setCurrentList("Ma liste");
    try {
      await fetch("/api/lists", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
    } catch {
      /* ignore */
    }
  };

  const { safeFetch } = useOfflineSync(fetchList);

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((d) => setProducts(Array.isArray(d) ? d : []))
      .catch(console.error);
    // Fréquence de commande : combien de fois chaque produit a été ajouté
    fetch("/api/list")
      .then((r) => r.json())
      .then((data) => {
        if (!Array.isArray(data)) return;
        const counts: Record<string, number> = {};
        const names = new Set<string>();
        for (const it of data) {
          const k = (it.product_name || "").toLowerCase();
          if (k) counts[k] = (counts[k] || 0) + 1;
          if (it.list_name) names.add(it.list_name);
        }
        setOrderCounts(counts);
        setServerListNames([...names]);
      })
      .catch(() => {});
    fetchList();
    const id = setInterval(() => {
      if (navigator.onLine) safeFetch();
    }, 5000);
    return () => clearInterval(id);
  }, [fetchList, safeFetch]);

  // Étape de validation : sélectionner un produit le met « en attente » pour
  // ajuster quantité/unité/catégorie avant de l'ajouter réellement à la liste.
  const stageProduct = (p: Product) => {
    setPending({
      productId: p.id,
      name: p.name,
      qty: String(p.default_quantity || 1),
      unit: p.default_unit,
      category: p.category,
    });
    setProductSearch("");
  };

  const confirmPending = () => {
    if (!pending || !pending.name.trim()) return;
    const qty = pending.qty ? Number(pending.qty.replace(",", ".")) : 1;
    const tempId = nextTempIdRef.current--;
    const newItem: ListItem = {
      id: tempId,
      product_id: pending.productId,
      product_name: pending.name,
      quantity: qty,
      unit: pending.unit,
      category: pending.category,
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
        productId: pending.productId,
        productName: pending.name,
        quantity: qty,
        unit: pending.unit,
        category: pending.category,
        source: "manual",
        listStatus: "prep",
        listName: currentList,
      }),
      offlineOptimistic: true,
    }).then((r) => r?.json()).then((saved) => {
      if (saved && !saved.queued) {
        setItems((prev) => prev.map((it) => (it.id === tempId ? saved : it)));
      }
    }).catch(() => {});
    setPending(null);
  };

  const addCustom = () => {
    if (!customName.trim()) return;
    const category = customCategory || activeCategory || "Autre";
    const tempId = nextTempIdRef.current--;
    const newItem: ListItem = {
      id: tempId,
      product_id: null,
      product_name: customName,
      quantity: customQty ? Number(customQty) : 1,
      unit: customUnit,
      category,
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
        category,
        source: "manual",
        listStatus: "prep",
        listName: currentList,
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

  // Incrément local immédiat + synchronisation réseau différée (pour gérer
  // l'appui maintenu qui accélère sans spammer l'API).
  const stepQty = (item: ListItem, delta: number) => {
    const id = item.id;
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        const step = getStep(it.unit || "pcs") * delta;
        return { ...it, quantity: Math.max(0, Math.round(((it.quantity || 0) + step) * 100) / 100) };
      })
    );
    if (syncTimers.current[id]) clearTimeout(syncTimers.current[id]);
    syncTimers.current[id] = setTimeout(() => {
      delete syncTimers.current[id];
      const current = itemsRef.current.find((x) => x.id === id);
      if (!current) return;
      const q = current.quantity || 0;
      if (q <= 0) {
        removeItem(id);
        return;
      }
      offlineFetch("/api/list", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, quantity: q }),
        offlineOptimistic: true,
      }).catch(() => {});
    }, 450);
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
    await fetch("/api/list/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listName: currentList }),
    });
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

  // Correspondance produit (par id puis par nom) pour icône + prix
  const productMaps = useMemo(() => {
    const byId = new Map<number, Product>();
    const byName = new Map<string, Product>();
    for (const p of products) {
      byId.set(p.id, p);
      byName.set(normalize(p.name), p);
    }
    return { byId, byName };
  }, [products]);

  const productFor = useCallback(
    (it: ListItem): Product | undefined => {
      if (it.product_id != null && productMaps.byId.has(it.product_id)) {
        return productMaps.byId.get(it.product_id);
      }
      return productMaps.byName.get(normalize(it.product_name));
    },
    [productMaps]
  );

  // Prix : utilise le prix de la base si dispo (proratisé à la quantité),
  // sinon l'estimation heuristique selon l'unité.
  const priceFor = useCallback(
    (it: ListItem): number => {
      const p = productFor(it);
      if (p?.price != null) {
        const dq = p.default_quantity || 1;
        const ratio = it.quantity && dq ? it.quantity / dq : 1;
        return p.price * ratio;
      }
      return estimatePrice(it.quantity, it.unit);
    },
    [productFor]
  );

  // Stats
  const totalCount = items.length;
  const totalEstimated = items.reduce((acc, it) => acc + priceFor(it), 0);
  const recipeSources = useMemo(() => {
    const set = new Set<string>();
    for (const it of items) if (it.source_recipe) set.add(it.source_recipe);
    return set.size;
  }, [items]);

  const freqOf = useCallback(
    (name: string) => orderCounts[name.toLowerCase()] || 0,
    [orderCounts]
  );

  const filteredProducts = useMemo(() => {
    if (!productSearch) return [];
    return rankedFilter(products, productSearch, (p) => [p.name, p.category]).slice(0, 12);
  }, [products, productSearch]);

  // Catalogue à parcourir (sans recherche) : groupé par type, les plus
  // commandés d'abord dans chaque catégorie.
  const catalogByCategory = useMemo(() => {
    const base = catalogCat
      ? products.filter((p) => (p.category || "Autre") === catalogCat)
      : products;
    const groups: Record<string, Product[]> = {};
    for (const p of base) {
      const cat = p.category || "Autre";
      (groups[cat] ||= []).push(p);
    }
    const ordered: [string, Product[]][] = [];
    for (const cat of CATEGORY_ORDER) {
      if (groups[cat]) ordered.push([cat, groups[cat]]);
    }
    for (const [cat, list] of Object.entries(groups)) {
      if (!CATEGORY_ORDER.includes(cat)) ordered.push([cat, list]);
    }
    // Tri interne : fréquence décroissante puis nom
    for (const [, list] of ordered) {
      list.sort((a, b) => {
        const d = freqOf(b.name) - freqOf(a.name);
        return d !== 0 ? d : a.name.localeCompare(b.name);
      });
    }
    return ordered;
  }, [products, catalogCat, freqOf]);

  const catalogCategories = useMemo(() => {
    const set = new Set<string>();
    for (const p of products) set.add(p.category || "Autre");
    return CATEGORY_ORDER.filter((c) => set.has(c));
  }, [products]);

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
      <div className="flex items-baseline justify-between gap-2 mb-5">
        <p className="eyebrow">{weekLabel}</p>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/courses"
            className="rounded-full px-4 py-2 text-sm transition-colors"
            style={{
              background: "var(--color-cream-pale)",
              border: "1px solid var(--color-line)",
              color: "var(--color-ink-soft)",
            }}
            title="Voir les courses en cours"
          >
            Courses
          </Link>
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
              Valider · courses →
            </button>
          )}
        </div>
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

        <div className="grid grid-cols-2 gap-6 md:gap-8 shrink-0">
          <div className="text-right">
            <p className="font-display tnum leading-none" style={{ fontSize: 36, color: "var(--color-ink)" }}>
              {String(totalCount).padStart(2, "0")}
            </p>
            <p className="eyebrow mt-1.5">à acheter</p>
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

      {/* Sélecteur de listes */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto scrollbar-hide pb-1">
        <span className="eyebrow mr-1 shrink-0">listes</span>
        {knownLists.map((name) => {
          const active = name === currentList;
          return (
            <button
              key={name}
              onClick={() => {
                setCurrentList(name);
                setActiveCategory(null);
              }}
              className="shrink-0 rounded-full px-3 py-1.5 text-sm transition-colors whitespace-nowrap"
              style={{
                background: active ? "var(--color-ink)" : "var(--color-cream-pale)",
                color: active ? "var(--color-cream-pale)" : "var(--color-ink-soft)",
                border: "1px solid",
                borderColor: active ? "var(--color-ink)" : "var(--color-line)",
              }}
            >
              {name}
            </button>
          );
        })}
        <button
          onClick={createNewList}
          className="shrink-0 rounded-full px-3 py-1.5 text-sm transition-colors whitespace-nowrap"
          style={{
            background: "transparent",
            color: "var(--color-terracotta-deep)",
            border: "1px dashed var(--color-line)",
          }}
        >
          + Nouvelle liste
        </button>
        {currentList !== "Ma liste" && (
          <button
            onClick={deleteCurrentList}
            aria-label="Supprimer cette liste"
            title="Supprimer cette liste"
            className="shrink-0 rounded-full w-8 h-8 flex items-center justify-center transition-colors"
            style={{ color: "var(--color-terracotta)", border: "1px solid var(--color-line)" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        )}
      </div>

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
              className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider rounded-full px-3 py-1 transition-colors"
              style={{
                background: active ? "var(--color-terracotta)" : "var(--color-cream-pale)",
                color: active ? "var(--color-cream-pale)" : "var(--color-ink-soft)",
                border: "1px solid",
                borderColor: active ? "var(--color-terracotta)" : "var(--color-line)",
                letterSpacing: "0.06em",
              }}
            >
              <CategoryIcon category={cat} size={13} />
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
          onClick={() => (showAdd ? setShowAdd(false) : openAddPanel())}
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
          {/* Validation : confirmer le produit sélectionné avant ajout */}
          {pending && (
            <div
              className="rounded-md p-3 space-y-2"
              style={{ background: "var(--color-cream-pale)", border: "1px solid var(--color-terracotta)" }}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium" style={{ color: "var(--color-ink)" }}>
                  {pending.name}
                </span>
                <span className="eyebrow" style={{ color: "var(--color-terracotta-deep)" }}>
                  à valider
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <input
                  type="number"
                  inputMode="decimal"
                  value={pending.qty}
                  onChange={(e) => setPending({ ...pending, qty: e.target.value })}
                  onKeyDown={(e) => e.key === "Enter" && confirmPending()}
                  aria-label="Quantité"
                  className="w-20 bg-[var(--color-cream-pale)] border border-[var(--color-line)] rounded-md px-3 py-2 text-sm tnum focus:outline-none focus:border-[var(--color-terracotta)]"
                />
                <select
                  value={pending.unit}
                  onChange={(e) => setPending({ ...pending, unit: e.target.value })}
                  aria-label="Unité"
                  className="w-24 bg-[var(--color-cream-pale)] border border-[var(--color-line)] rounded-md px-2 py-2 text-sm focus:outline-none focus:border-[var(--color-terracotta)]"
                >
                  {!(UNITS as readonly string[]).includes(pending.unit) && (
                    <option value={pending.unit}>{pending.unit}</option>
                  )}
                  {UNITS.map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
                <select
                  value={pending.category}
                  onChange={(e) => setPending({ ...pending, category: e.target.value })}
                  aria-label="Catégorie"
                  className="flex-1 min-w-[8rem] bg-[var(--color-cream-pale)] border border-[var(--color-line)] rounded-md px-2 py-2 text-sm focus:outline-none focus:border-[var(--color-terracotta)]"
                >
                  {[...PRODUCT_CATEGORIES, "Autre"].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setPending(null)}
                  className="text-sm px-3 py-1.5 rounded-full"
                  style={{ color: "var(--color-ink-mute)", border: "1px solid var(--color-line)" }}
                >
                  Annuler
                </button>
                <button
                  onClick={confirmPending}
                  className="text-sm px-4 py-1.5 rounded-full font-medium"
                  style={{
                    background: "var(--color-terracotta)",
                    color: "var(--color-cream-pale)",
                    border: "1px solid var(--color-terracotta)",
                  }}
                >
                  Valider · ajouter
                </button>
              </div>
            </div>
          )}

          <input
            type="text"
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            placeholder="Chercher un produit dans le catalogue…"
            className="w-full bg-[var(--color-cream-pale)] border border-[var(--color-line)] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-terracotta)]"
          />

          {/* Résultats de recherche */}
          {productSearch && filteredProducts.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {filteredProducts.map((p) => (
                <button
                  key={p.id}
                  onClick={() => stageProduct(p)}
                  className="flex items-center justify-between gap-1 px-3 py-2 rounded-md border text-left text-sm transition-colors hover:bg-[var(--color-cream-pale)]"
                  style={{
                    background: "var(--color-cream-pale)",
                    borderColor: "var(--color-line)",
                    color: "var(--color-ink-soft)",
                  }}
                >
                  <span className="truncate">{p.icon ? `${p.icon} ` : ""}{p.name}</span>
                  {freqOf(p.name) > 0 && (
                    <span className="font-mono text-[9px] tnum shrink-0" style={{ color: "var(--color-terracotta-deep)" }}>
                      ×{freqOf(p.name)}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Catalogue à parcourir (sans recherche) : par type, plus commandés d'abord */}
          {!productSearch && (
            <div className="space-y-3">
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                <button
                  onClick={() => setCatalogCat(null)}
                  className="font-mono text-[10px] uppercase tracking-wider rounded-full px-2.5 py-1 shrink-0 transition-colors"
                  style={{
                    background: !catalogCat ? "var(--color-ink)" : "var(--color-cream-pale)",
                    color: !catalogCat ? "var(--color-cream-pale)" : "var(--color-ink-soft)",
                    border: "1px solid",
                    borderColor: !catalogCat ? "var(--color-ink)" : "var(--color-line)",
                    letterSpacing: "0.06em",
                  }}
                >
                  Tout
                </button>
                {catalogCategories.map((c) => {
                  const active = catalogCat === c;
                  return (
                    <button
                      key={c}
                      onClick={() => setCatalogCat(active ? null : c)}
                      className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider rounded-full px-2.5 py-1 shrink-0 whitespace-nowrap transition-colors"
                      style={{
                        background: active ? "var(--color-terracotta)" : "var(--color-cream-pale)",
                        color: active ? "var(--color-cream-pale)" : "var(--color-ink-soft)",
                        border: "1px solid",
                        borderColor: active ? "var(--color-terracotta)" : "var(--color-line)",
                        letterSpacing: "0.06em",
                      }}
                    >
                      <CategoryIcon category={c} size={12} />
                      {c
                        .replace("Produits laitiers", "Laitiers")
                        .replace("Fruits & Légumes", "Fruits & Lég")
                        .replace("Viandes & Poissons", "Viandes")
                        .replace("Hygiène & Beauté", "Hygiène")
                        .replace("Entretien & Maison", "Entretien")
                        .replace("Épices & Condiments", "Épices")}
                    </button>
                  );
                })}
              </div>

              <div className="max-h-72 overflow-y-auto space-y-4 pr-1">
                {catalogByCategory.map(([cat, list]) => (
                  <div key={cat}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <CategoryIcon category={cat} size={14} />
                      <span className="eyebrow" style={{ color: "var(--color-ink-soft)" }}>
                        {cat}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                      {list.slice(0, catalogCat ? 60 : 9).map((p) => (
                        <button
                          key={p.id}
                          onClick={() => stageProduct(p)}
                          className="flex items-center justify-between gap-1 px-3 py-2 rounded-md border text-left text-sm transition-colors hover:bg-[var(--color-cream-pale)]"
                          style={{
                            background: "var(--color-cream-pale)",
                            borderColor: "var(--color-line)",
                            color: "var(--color-ink-soft)",
                          }}
                        >
                          <span className="truncate">{p.icon ? `${p.icon} ` : ""}{p.name}</span>
                          {freqOf(p.name) > 0 && (
                            <span
                              className="font-mono text-[9px] tnum shrink-0"
                              style={{ color: "var(--color-terracotta-deep)" }}
                              title="Déjà commandé"
                            >
                              ×{freqOf(p.name)}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                    {!catalogCat && list.length > 9 && (
                      <button
                        onClick={() => setCatalogCat(cat)}
                        className="mt-1.5 text-xs hover:underline"
                        style={{ color: "var(--color-terracotta-deep)" }}
                      >
                        + {list.length - 9} autre{list.length - 9 > 1 ? "s" : ""} dans {cat}
                      </button>
                    )}
                  </div>
                ))}
              </div>
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
            <select
              value={customUnit}
              onChange={(e) => setCustomUnit(e.target.value)}
              aria-label="Unité"
              className="md:w-24 bg-[var(--color-cream-pale)] border border-[var(--color-line)] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-terracotta)]"
            >
              {UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
            <select
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
              aria-label="Catégorie"
              className="md:w-40 bg-[var(--color-cream-pale)] border border-[var(--color-line)] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-terracotta)]"
            >
              {[...PRODUCT_CATEGORIES, "Autre"].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
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
              onClick={openAddPanel}
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
              <span className="self-center">
                <CategoryIcon category={cat} size={20} />
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
                <SwipeRow key={it.id} onRemove={() => removeItem(it.id)}>
                  <div className="group flex items-center gap-3 px-1 py-3">
                    {productFor(it)?.icon ? (
                      <span className="text-base shrink-0 w-5 text-center">{productFor(it)!.icon}</span>
                    ) : (
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ background: "var(--color-line)" }}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm leading-tight truncate"
                        style={{
                          color: "var(--color-ink)",
                          fontWeight: 500,
                        }}
                      >
                        {it.product_name}
                      </p>
                      <p
                        className="font-mono text-[10px] mt-0.5 truncate"
                        style={{ color: "var(--color-ink-mute)", letterSpacing: "0.04em" }}
                      >
                        {it.quantity ? formatQuantity(it.quantity, it.unit) : ""}
                        {it.source_recipe ? ` · ${it.source_recipe}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <HoldButton
                        onStep={() => stepQty(it, -1)}
                        ariaLabel="Diminuer"
                        className="font-mono text-sm w-7 h-7 rounded transition-colors touch-none select-none"
                        style={{
                          color: "var(--color-ink-mute)",
                          border: "1px solid var(--color-line)",
                          background: "var(--color-cream-pale)",
                        }}
                      >
                        −
                      </HoldButton>
                      <HoldButton
                        onStep={() => stepQty(it, +1)}
                        ariaLabel="Augmenter"
                        className="font-mono text-sm w-7 h-7 rounded transition-colors touch-none select-none"
                        style={{
                          color: "var(--color-ink-mute)",
                          border: "1px solid var(--color-line)",
                          background: "var(--color-cream-pale)",
                        }}
                      >
                        +
                      </HoldButton>
                      <button
                        onClick={() => removeItem(it.id)}
                        aria-label="Supprimer"
                        title="Supprimer"
                        className="w-7 h-7 rounded flex items-center justify-center transition-colors"
                        style={{ color: "var(--color-terracotta)" }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </SwipeRow>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
