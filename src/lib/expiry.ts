// Helpers de péremption pour le garde-manger (stock).

export type ExpiryItem = {
  product_name: string;
  expires_at: string | null;
  opened_at: string | null;
  shelf_life_after_open_days: number | null;
};

export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

// Péremption effective : la plus proche entre la DLC et (ouverture + N jours).
export function effectiveExpiry(it: ExpiryItem): string | null {
  const base = it.expires_at;
  if (it.opened_at && it.shelf_life_after_open_days != null) {
    const afterOpen = addDays(it.opened_at, it.shelf_life_after_open_days);
    if (!base) return afterOpen;
    return new Date(afterOpen) < new Date(base) ? afterOpen : base;
  }
  return base;
}

export function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(+d)) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.ceil((+d - +now) / 86400000);
}
