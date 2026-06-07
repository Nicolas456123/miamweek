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

// Score de pertinence d'une recherche (0 = aucune correspondance).
// Un jeton est satisfait s'il est une sous-chaîne du NOM, ou s'il correspond à
// un MOT ENTIER d'un champ secondaire (catégorie…). Cela évite que « mais »
// (maïs) remonte tous les produits « Entretien & Maison ». Le nom prime.
export function searchScore(
  query: string,
  name: string | null | undefined,
  ...extra: (string | null | undefined)[]
): number {
  const q = normalize(query);
  if (!q) return 1;
  const tokens = q.split(/\s+/);
  const nameNorm = normalize(name || "");
  const extraWords = new Set(
    normalize(extra.filter(Boolean).join(" "))
      .split(/\s+/)
      .filter(Boolean)
  );
  let nameHits = 0;
  for (const t of tokens) {
    const inName = nameNorm.includes(t);
    const inExtra = extraWords.has(t);
    if (!inName && !inExtra) return 0;
    if (inName) nameHits++;
  }
  let score = 1 + nameHits * 10;
  if (nameNorm === q) score += 1000;
  else if (nameNorm.startsWith(q)) score += 100;
  return score;
}

// Filtre + trie une liste par pertinence (nom d'abord). Le 1er champ retourné
// par `fields` est le nom ; les suivants sont des champs secondaires.
export function rankedFilter<T>(
  items: T[],
  query: string,
  fields: (item: T) => (string | null | undefined)[]
): T[] {
  if (!normalize(query)) return items;
  return items
    .map((item) => {
      const f = fields(item);
      return { item, score: searchScore(query, f[0], ...f.slice(1)) };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.item);
}

// Estimation de prix réaliste selon l'unité (faute de prix réels).
// Évite les montants aberrants (250 g ≠ 450 €).
export function estimatePrice(
  qty: number | null | undefined,
  unit: string | null | undefined
): number {
  const q = qty ?? 1;
  const u = (unit || "").toLowerCase();
  if (u === "g") return (q / 1000) * 8; // ~8 €/kg moyen
  if (u === "kg") return q * 8;
  if (u === "ml") return (q / 1000) * 3; // ~3 €/L moyen
  if (u === "cl") return (q / 100) * 3;
  if (u === "l") return q * 3;
  // pcs, botte, sachet, pot… : ~1,8 € l'unité, borné pour rester réaliste
  return Math.min(Math.max(q, 1), 12) * 1.8;
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
