export function getMonday(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split("T")[0];
}

export const DAYS = [
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
  "Dimanche",
];

export const MEAL_TYPES = {
  lunch: "Midi",
  dinner: "Soir",
} as const;

export const MEAL_SLOTS = {
  lunch_entree: { label: "Entrée", period: "lunch", icon: "🥗", color: "text-green-600" },
  lunch_plat: { label: "Plat", period: "lunch", icon: "🍽️", color: "text-orange-600" },
  lunch_dessert: { label: "Dessert", period: "lunch", icon: "🍰", color: "text-pink-600" },
  lunch_boisson: { label: "Boisson", period: "lunch", icon: "🍷", color: "text-blue-600" },
  dinner_entree: { label: "Entrée", period: "dinner", icon: "🥗", color: "text-green-600" },
  dinner_plat: { label: "Plat", period: "dinner", icon: "🍽️", color: "text-orange-600" },
  dinner_dessert: { label: "Dessert", period: "dinner", icon: "🍰", color: "text-pink-600" },
  dinner_boisson: { label: "Boisson", period: "dinner", icon: "🍷", color: "text-blue-600" },
  // Legacy support
  lunch: { label: "Midi", period: "lunch", icon: "🍽️", color: "text-orange-600" },
  dinner: { label: "Soir", period: "dinner", icon: "🍽️", color: "text-orange-600" },
} as const;

export const CATEGORIES = [
  "Fruits & Légumes",
  "Viandes & Poissons",
  "Produits laitiers",
  "Boulangerie",
  "Épicerie",
  "Surgelés",
  "Boissons",
  "Hygiène & Beauté",
  "Entretien & Maison",
  "Épices & Condiments",
  "Autre",
] as const;

export const PRODUCT_CATEGORIES = [
  "Fruits & Légumes",
  "Viandes & Poissons",
  "Produits laitiers",
  "Boulangerie",
  "Épicerie",
  "Surgelés",
  "Boissons",
  "Hygiène & Beauté",
  "Entretien & Maison",
  "Épices & Condiments",
] as const;

export const LIST_STATUS = {
  prep: "prep",
  active: "active",
  done: "done",
} as const;

export const STOCK_STATUS = {
  ok: "ok",
  low: "low",
  out: "out",
} as const;

export type ListStatus = (typeof LIST_STATUS)[keyof typeof LIST_STATUS];
export type StockStatus = (typeof STOCK_STATUS)[keyof typeof STOCK_STATUS];

export function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

// ── Recherche souple ──────────────────────────────────────────────────
// Retire les accents/diacritiques et passe en minuscules.
// Ainsi « mais » trouve « maïs », « echalote » trouve « Échalote ».
export function normalize(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

// Recherche par jetons : chaque mot de la requête doit apparaître quelque part
// dans les champs fournis (insensible aux accents et à l'ordre des mots).
// Une requête vide correspond à tout.
export function matchSearch(
  query: string,
  ...fields: (string | null | undefined)[]
): boolean {
  const q = normalize(query);
  if (!q) return true;
  const haystack = normalize(fields.filter(Boolean).join(" "));
  return q.split(/\s+/).every((token) => haystack.includes(token));
}

// ── Quantités & unités ────────────────────────────────────────────────
// Unités proposées dans les sélecteurs (plus besoin de les écrire à la main).
export const UNITS = [
  "pcs",
  "g",
  "kg",
  "ml",
  "cl",
  "L",
  "càc",
  "càs",
  "pincée",
  "tranche",
  "sachet",
  "boîte",
  "pot",
  "botte",
  "gousse",
  "bouteille",
] as const;

// Format français d'un nombre : virgule décimale, zéros superflus retirés.
export function formatNumberFR(n: number): string {
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(2).replace(/\.?0+$/, "").replace(".", ",");
}

// Adapte l'unité en fonction de la grandeur : 2500 ml → « 2,5 L »,
// 1000 g → « 1 kg », 0,5 L → « 500 ml », etc.
export function formatQuantity(
  qty: number | null | undefined,
  unit: string | null | undefined
): string {
  if (qty == null) return "";
  let q = qty;
  let u = (unit || "").trim();
  const lower = u.toLowerCase();
  const abs = Math.abs(q);
  if (lower === "g" && abs >= 1000) {
    q = q / 1000;
    u = "kg";
  } else if (lower === "kg" && abs > 0 && abs < 1) {
    q = q * 1000;
    u = "g";
  } else if (lower === "ml" && abs >= 1000) {
    q = q / 1000;
    u = "L";
  } else if ((lower === "l" || lower === "cl") && abs > 0 && abs < (lower === "cl" ? 0.1 : 1)) {
    q = q * (lower === "cl" ? 10 : 1000);
    u = "ml";
  }
  const num = formatNumberFR(q);
  return u ? `${num} ${u}` : num;
}
