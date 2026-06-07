"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type PantryItem = {
  id: number;
  product_name: string;
  expires_at: string | null;
  opened_at: string | null;
  shelf_life_after_open_days: number | null;
};

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

// Péremption effective : la plus proche entre la DLC et (ouverture + N jours).
function effectiveExpiry(it: PantryItem): string | null {
  const base = it.expires_at;
  if (it.opened_at && it.shelf_life_after_open_days != null) {
    const afterOpen = addDays(it.opened_at, it.shelf_life_after_open_days);
    if (!base) return afterOpen;
    return new Date(afterOpen) < new Date(base) ? afterOpen : base;
  }
  return base;
}

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(+d)) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.ceil((+d - +now) / 86400000);
}

function dayLabel(days: number): string {
  if (days < 0) return `périmé depuis ${-days} j`;
  if (days === 0) return "aujourd'hui";
  if (days === 1) return "demain";
  return `dans ${days} j`;
}

/**
 * Bannière d'alerte : produits du stock qui périment bientôt (ou sont périmés).
 * Tient compte de la date d'ouverture + durée max après ouverture.
 */
export function ExpiryAlert({ withinDays = 3 }: { withinDays?: number }) {
  const [items, setItems] = useState<{ id: number; name: string; days: number }[]>([]);
  const [dismissed, setDismissed] = useState(false);
  const [notifPerm, setNotifPerm] = useState<NotificationPermission | "unsupported">(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      return Notification.permission;
    }
    return "unsupported";
  });

  useEffect(() => {
    fetch("/api/pantry")
      .then((r) => r.json())
      .then((data: PantryItem[]) => {
        if (!Array.isArray(data)) return;
        const alerts = data
          .map((it) => ({
            id: it.id,
            name: it.product_name,
            days: daysUntil(effectiveExpiry(it)),
          }))
          .filter((x): x is { id: number; name: string; days: number } => x.days !== null && x.days <= withinDays)
          .sort((a, b) => a.days - b.days);
        setItems(alerts);

        // Notification système (1×/session) si l'utilisateur a autorisé les rappels.
        if (
          alerts.length > 0 &&
          typeof window !== "undefined" &&
          "Notification" in window &&
          Notification.permission === "granted" &&
          !sessionStorage.getItem("miamweek_notified")
        ) {
          const expired = alerts.filter((a) => a.days < 0).length;
          const body =
            expired > 0
              ? `${expired} produit(s) périmé(s), ${alerts.length} à consommer vite.`
              : `${alerts.length} produit(s) à consommer vite : ${alerts.slice(0, 3).map((a) => a.name).join(", ")}…`;
          try {
            new Notification("MiamWeek — péremption", { body, icon: "/icon-192.png" });
            sessionStorage.setItem("miamweek_notified", "1");
          } catch {
            /* ignore */
          }
        }
      })
      .catch(() => {});
  }, [withinDays]);

  const requestNotifications = () => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    Notification.requestPermission().then((p) => setNotifPerm(p));
  };

  if (dismissed || items.length === 0) return null;

  const expiredCount = items.filter((i) => i.days < 0).length;
  const headline =
    expiredCount > 0
      ? `${expiredCount} produit${expiredCount > 1 ? "s" : ""} périmé${expiredCount > 1 ? "s" : ""}` +
        (items.length > expiredCount ? `, ${items.length - expiredCount} bientôt` : "")
      : `${items.length} produit${items.length > 1 ? "s" : ""} à consommer vite`;

  return (
    <div
      className="mb-6 rounded-md p-4"
      style={{
        background: expiredCount > 0 ? "rgba(200,85,61,0.10)" : "rgba(201,162,39,0.12)",
        border: `1px solid ${expiredCount > 0 ? "rgba(200,85,61,0.30)" : "rgba(201,162,39,0.35)"}`,
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <span
            aria-hidden
            className="shrink-0"
            style={{ fontSize: 16, lineHeight: "20px" }}
          >
            ⏰
          </span>
          <div className="min-w-0">
            <p
              className="text-sm font-medium"
              style={{ color: expiredCount > 0 ? "var(--color-terracotta-deep)" : "#8a6d10" }}
            >
              {headline}
            </p>
            <ul className="mt-1.5 space-y-0.5">
              {items.slice(0, 4).map((it) => (
                <li
                  key={it.id}
                  className="text-xs flex items-baseline justify-between gap-3"
                  style={{ color: "var(--color-ink-soft)" }}
                >
                  <span className="truncate">{it.name}</span>
                  <span
                    className="font-mono text-[10px] shrink-0"
                    style={{ color: it.days < 0 ? "var(--color-terracotta)" : "#8a6d10", letterSpacing: "0.04em" }}
                  >
                    {dayLabel(it.days)}
                  </span>
                </li>
              ))}
              {items.length > 4 && (
                <li className="text-xs" style={{ color: "var(--color-ink-mute)" }}>
                  + {items.length - 4} autre{items.length - 4 > 1 ? "s" : ""}…
                </li>
              )}
            </ul>
            <div className="mt-2 flex items-center gap-3">
              <Link
                href="/recettes?antigaspi=1"
                className="text-xs font-medium hover:underline"
                style={{ color: "var(--color-olive-deep)" }}
              >
                🌱 Cuisiner avant que ce soit trop tard →
              </Link>
              <Link
                href="/inventaire"
                className="text-xs hover:underline"
                style={{ color: "var(--color-ink-mute)" }}
              >
                Voir le stock
              </Link>
              {notifPerm === "default" && (
                <button
                  onClick={requestNotifications}
                  className="text-xs hover:underline"
                  style={{ color: "var(--color-ink-mute)" }}
                >
                  🔔 Activer les rappels
                </button>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          aria-label="Masquer"
          className="font-mono text-sm shrink-0"
          style={{ color: "var(--color-ink-mute)" }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
