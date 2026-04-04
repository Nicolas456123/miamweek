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

export const CATEGORIES = [
  "Fruits & Légumes",
  "Viandes & Poissons",
  "Produits laitiers",
  "Boulangerie",
  "Épicerie",
  "Surgelés",
  "Boissons",
  "Hygiène & Maison",
  "Autre",
] as const;

export const TASK_ICONS: Record<string, string> = {
  vacuum: "🧹",
  bath: "🛁",
  washing: "👕",
  kitchen: "🍳",
  trash: "🗑️",
  bed: "🛏️",
  window: "🪟",
  dust: "✨",
  default: "📋",
};

export function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export function isOverdue(lastDone: string | null, frequency: string): boolean {
  if (!lastDone) return true;
  const last = new Date(lastDone);
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24)
  );

  switch (frequency) {
    case "daily":
      return diffDays >= 1;
    case "weekly":
      return diffDays >= 7;
    case "monthly":
      return diffDays >= 30;
    default:
      return false;
  }
}

export function formatFrequency(frequency: string): string {
  switch (frequency) {
    case "daily":
      return "Quotidien";
    case "weekly":
      return "Hebdomadaire";
    case "monthly":
      return "Mensuel";
    default:
      return frequency;
  }
}
