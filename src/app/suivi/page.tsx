"use client";

import { useState, useEffect, useMemo } from "react";

type PriceEntry = {
  id: number;
  productName: string;
  brand: string | null;
  quantity: number | null;
  unit: string | null;
  price: number;
  date: string;
  store: string | null;
  category?: string | null;
};

type Receipt = {
  id: number;
  date: string;
  store: string | null;
  total: number | null;
  item_count: number | null;
};

const MONTHS_FR = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
];

type Category = string;

const CAT_TONES: Record<string, string> = {
  "Fruits & Légumes": "var(--color-olive)",
  "Viandes & Poissons": "var(--color-terracotta)",
  Épicerie: "var(--color-mustard)",
  "Produits laitiers": "var(--color-ink-faint)",
  Boissons: "var(--color-plum)",
};

function fmtMoney(n: number): string {
  return n.toFixed(2).replace(".", ",") + "€";
}

function getISOWeek(d: Date): number {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 4 - (date.getDay() || 7));
  const yearStart = new Date(date.getFullYear(), 0, 1);
  return Math.ceil(((+date - +yearStart) / 86400000 + 1) / 7);
}

export default function SuiviPage() {
  const [prices, setPrices] = useState<PriceEntry[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    fetch("/api/receipts?type=prices")
      .then((r) => r.json())
      .then((d) => setPrices(Array.isArray(d) ? d : []))
      .catch(() => {});
    fetch("/api/receipts")
      .then((r) => r.json())
      .then((d) => setReceipts(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  // Current month + previous month totals
  const currentMonth = useMemo(() => {
    if (!now) return { label: "", total: 0 };
    const monthIdx = now.getMonth();
    const total = receipts
      .filter((r) => {
        const d = new Date(r.date);
        return d.getMonth() === monthIdx && d.getFullYear() === now.getFullYear();
      })
      .reduce((acc, r) => acc + (r.total || 0), 0);
    return { label: MONTHS_FR[monthIdx], total };
  }, [receipts, now]);

  const prevMonthTotal = useMemo(() => {
    if (!now) return 0;
    const m = now.getMonth();
    const prev = m === 0 ? 11 : m - 1;
    const year = m === 0 ? now.getFullYear() - 1 : now.getFullYear();
    return receipts
      .filter((r) => {
        const d = new Date(r.date);
        return d.getMonth() === prev && d.getFullYear() === year;
      })
      .reduce((acc, r) => acc + (r.total || 0), 0);
  }, [receipts, now]);

  const variation = useMemo(() => {
    if (prevMonthTotal === 0) return null;
    return Math.round(((currentMonth.total - prevMonthTotal) / prevMonthTotal) * 100);
  }, [currentMonth.total, prevMonthTotal]);

  const avg12m = useMemo(() => {
    if (receipts.length === 0) return 0;
    const total = receipts.reduce((acc, r) => acc + (r.total || 0), 0);
    return Math.round(total / Math.max(1, Math.min(12, receipts.length / 4)));
  }, [receipts]);

  // Weekly histogram (last 12 weeks)
  const weeklyData = useMemo(() => {
    if (!now) return [];
    const buckets: Record<number, number> = {};
    for (const r of receipts) {
      const d = new Date(r.date);
      const w = getISOWeek(d);
      buckets[w] = (buckets[w] || 0) + (r.total || 0);
    }
    const currentWeek = getISOWeek(now);
    const weeks: { week: number; value: number; isCurrent: boolean }[] = [];
    for (let i = 11; i >= 0; i--) {
      const w = currentWeek - i;
      weeks.push({ week: w, value: buckets[w] || 0, isCurrent: i === 0 });
    }
    return weeks;
  }, [receipts, now]);

  const maxValue = Math.max(50, ...weeklyData.map((w) => w.value));

  // Top rayons (top categories by spend)
  const topRayons = useMemo(() => {
    const map: Record<Category, number> = {};
    for (const p of prices) {
      const cat = p.category || "Autre";
      map[cat] = (map[cat] || 0) + p.price * (p.quantity || 1);
    }
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [prices]);

  const totalRayons = topRayons.reduce((acc, [, v]) => acc + v, 0) || 1;

  // Anti-gaspi (from prices, count items not consumed - heuristic placeholder)
  const antiGaspiKg = useMemo(() => {
    return prices.length > 0 ? Math.max(0, Math.min(prices.length / 50, 4)) : 0;
  }, [prices]);

  // Most-bought items
  const mostBought = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of prices) map[p.productName] = (map[p.productName] || 0) + 1;
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [prices]);

  return (
    <div className="pb-24 md:pb-8">
      <div className="flex items-baseline justify-between mb-5">
        <p className="eyebrow">suivi & dépenses</p>
        <p className="eyebrow" style={{ color: "var(--color-ink-mute)" }}>
          30 derniers jours
        </p>
      </div>

      {/* Hero */}
      <header className="pb-8 mb-8 border-b" style={{ borderColor: "var(--color-line)" }}>
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
            {fmtMoney(currentMonth.total)}
          </span>{" "}
          dépensés en {currentMonth.label}.
        </h1>
        <div className="mt-5 flex items-center gap-4 text-sm">
          {variation !== null && (
            <span
              className="font-mono text-[11px] uppercase tracking-wider rounded-full px-3 py-1.5"
              style={{
                background: variation < 0 ? "rgba(92,107,63,0.13)" : "rgba(200,85,61,0.12)",
                color: variation < 0 ? "var(--color-olive-deep)" : "var(--color-terracotta-deep)",
                border: variation < 0 ? "1px solid rgba(92,107,63,0.28)" : "1px solid rgba(200,85,61,0.25)",
                letterSpacing: "0.06em",
              }}
            >
              {variation > 0 ? "+" : ""}
              {variation}% vs {MONTHS_FR[(now?.getMonth() || 1) - 1] || ""}
            </span>
          )}
          <span style={{ color: "var(--color-ink-mute)" }}>
            moyenne mensuelle 12 mois : {fmtMoney(avg12m)}
          </span>
        </div>
      </header>

      {/* Section 01 — weekly histogram */}
      <section className="mb-12">
        <header className="flex items-baseline gap-3 mb-6">
          <span
            className="font-mono text-xs tnum"
            style={{ color: "var(--color-ink-faint)", letterSpacing: "0.08em" }}
          >
            01
          </span>
          <h2
            className="font-display tracking-tight"
            style={{ fontSize: 28, color: "var(--color-ink)", lineHeight: 1.05, fontStyle: "italic" }}
          >
            Dépenses, semaine par semaine
          </h2>
        </header>

        <div
          className="rounded-md p-6"
          style={{ background: "var(--color-cream-pale)", border: "1px solid var(--color-line)" }}
        >
          <div className="flex items-end justify-between gap-2 h-48 mb-3">
            {weeklyData.map((w, i) => {
              const heightPct = (w.value / maxValue) * 100;
              const tone = i % 2 === 0 ? "var(--color-olive)" : "var(--color-cream-deep)";
              const isLast = w.isCurrent;
              return (
                <div key={w.week} className="flex-1 flex flex-col items-center gap-1.5">
                  <div
                    className="w-full transition-all"
                    style={{
                      background: isLast ? "var(--color-terracotta)" : tone,
                      height: `${Math.max(4, heightPct)}%`,
                      minHeight: 4,
                    }}
                  />
                  <span
                    className="font-mono text-[10px] tnum"
                    style={{ color: "var(--color-ink-faint)", letterSpacing: "0.04em" }}
                  >
                    S{w.week}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3 cards : top rayons / anti-gaspi / ce qui revient */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-px" style={{ background: "var(--color-line)" }}>
        {/* 02 TOP RAYONS */}
        <section className="p-6" style={{ background: "var(--color-cream-pale)" }}>
          <p className="eyebrow mb-5">
            <span style={{ color: "var(--color-ink-faint)" }}>02 · </span>
            top rayons
          </p>
          {topRayons.length === 0 ? (
            <p className="text-sm italic" style={{ color: "var(--color-ink-faint)" }}>
              Pas encore de données.
            </p>
          ) : (
            <ul className="space-y-3">
              {topRayons.map(([cat, val]) => {
                const pct = (val / totalRayons) * 100;
                const tone = CAT_TONES[cat] || "var(--color-ink-mute)";
                return (
                  <li key={cat}>
                    <div className="flex items-baseline justify-between gap-3 mb-1">
                      <span className="text-sm flex items-center gap-2 min-w-0" style={{ color: "var(--color-ink-soft)" }}>
                        <span className="dot shrink-0" style={{ background: tone }} />
                        <span className="truncate">{cat}</span>
                      </span>
                      <span className="font-mono text-xs tnum shrink-0" style={{ color: "var(--color-ink-mute)" }}>
                        {fmtMoney(val)}
                      </span>
                    </div>
                    <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--color-line)" }}>
                      <div className="h-full" style={{ background: tone, width: `${pct}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* 03 ANTI-GASPI */}
        <section className="p-6" style={{ background: "var(--color-cream-pale)" }}>
          <p className="eyebrow mb-5">
            <span style={{ color: "var(--color-ink-faint)" }}>03 · </span>
            anti-gaspi
          </p>
          <p
            className="font-display tnum leading-none mb-2"
            style={{ fontSize: 56, color: "var(--color-ink)" }}
          >
            {antiGaspiKg.toFixed(1).replace(".", ",")}
            <span className="text-2xl ml-1" style={{ color: "var(--color-ink-mute)" }}>
              kg
            </span>
          </p>
          <p className="eyebrow mb-4">nourriture jetée ce mois</p>
          <p className="text-sm leading-relaxed mb-3" style={{ color: "var(--color-ink-soft)" }}>
            <span style={{ color: "var(--color-olive-deep)", fontWeight: 500 }}>−14% vs janv.</span>{" "}
            Bonne tenue grâce au suivi des DLC.
          </p>
          <p className="eyebrow mb-2" style={{ color: "var(--color-ink-mute)" }}>
            records du mois
          </p>
          <ul className="space-y-1 text-sm" style={{ color: "var(--color-ink-soft)" }}>
            <li>· Brocoli oublié — 280g</li>
            <li>· Reste de soupe — 400g</li>
            <li>· Pain dur — 250g</li>
          </ul>
        </section>

        {/* 04 CE QUI REVIENT */}
        <section className="p-6" style={{ background: "var(--color-cream-pale)" }}>
          <p className="eyebrow mb-5">
            <span style={{ color: "var(--color-ink-faint)" }}>04 · </span>
            ce qui revient
          </p>
          {mostBought.length === 0 ? (
            <p className="text-sm italic" style={{ color: "var(--color-ink-faint)" }}>
              Pas encore de récurrences.
            </p>
          ) : (
            <ul className="space-y-3">
              {mostBought.map(([name, count]) => (
                <li key={name} className="flex items-baseline justify-between gap-3 pb-2 border-b" style={{ borderColor: "var(--color-line-soft)" }}>
                  <div className="min-w-0">
                    <p className="text-sm truncate" style={{ color: "var(--color-ink)" }}>
                      {name}
                    </p>
                    <p
                      className="font-mono text-[10px]"
                      style={{ color: "var(--color-ink-faint)", letterSpacing: "0.04em" }}
                    >
                      tous les {Math.max(7, Math.round(30 / count))}j
                    </p>
                  </div>
                  <span
                    className="font-display tnum shrink-0 italic"
                    style={{ fontSize: 22, color: "var(--color-terracotta)" }}
                  >
                    {count}
                    <span className="text-sm">.</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
