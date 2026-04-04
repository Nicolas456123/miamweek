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
