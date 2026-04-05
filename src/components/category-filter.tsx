"use client";

// Each visual filter button maps to one or more DB categories
type FilterEntry = {
  emoji: string;
  label: string;
  categories: string[]; // DB category values to match
};

const FILTERS: FilterEntry[] = [
  { emoji: "🥬", label: "Fruits", categories: ["Fruits & Légumes"] },
  { emoji: "🥕", label: "Légumes", categories: ["Fruits & Légumes"] },
  { emoji: "🥩", label: "Viandes", categories: ["Viandes & Poissons"] },
  { emoji: "🐟", label: "Poissons", categories: ["Viandes & Poissons"] },
  { emoji: "🧀", label: "Laitiers", categories: ["Produits laitiers"] },
  { emoji: "🥖", label: "Boulang.", categories: ["Boulangerie"] },
  { emoji: "🫙", label: "Épicerie", categories: ["Épicerie"] },
  { emoji: "🧊", label: "Surgelés", categories: ["Surgelés"] },
  { emoji: "🥤", label: "Boissons", categories: ["Boissons"] },
  { emoji: "🧴", label: "Hygiène", categories: ["Hygiène & Beauté"] },
  { emoji: "💄", label: "Beauté", categories: ["Hygiène & Beauté"] },
  { emoji: "🧹", label: "Entretien", categories: ["Entretien & Maison"] },
  { emoji: "🌶️", label: "Épices", categories: ["Épices & Condiments"] },
  { emoji: "🫒", label: "Condiments", categories: ["Épices & Condiments"] },
];

export function CategoryFilter({
  active,
  onChange,
}: {
  active: string | null;
  onChange: (cat: string | null) => void;
}) {
  // Find which filter index is active
  const activeIdx = active ? FILTERS.findIndex((f) => f.label === active) : -1;

  const handleClick = (idx: number) => {
    if (activeIdx === idx) {
      onChange(null);
    } else {
      onChange(FILTERS[idx].label);
    }
  };

  return (
    <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide shrink-0 px-1">
      <button
        onClick={() => onChange(null)}
        className={`flex flex-col items-center justify-center rounded-xl px-3 py-2 min-w-[64px] transition-colors shrink-0 ${
          !active
            ? "bg-primary text-white shadow-sm"
            : "bg-card border border-border text-muted hover:text-foreground hover:shadow-sm"
        }`}
      >
        <span className="text-2xl leading-none">🛒</span>
        <span className="text-[10px] font-semibold mt-1">Tout</span>
      </button>
      {FILTERS.map((filter, idx) => {
        const isActive = activeIdx === idx;
        return (
          <button
            key={filter.label}
            onClick={() => handleClick(idx)}
            className={`flex flex-col items-center justify-center rounded-xl px-3 py-2 min-w-[64px] transition-colors shrink-0 ${
              isActive
                ? "bg-primary text-white shadow-sm"
                : "bg-card border border-border text-muted hover:text-foreground hover:shadow-sm"
            }`}
          >
            <span className="text-2xl leading-none">{filter.emoji}</span>
            <span className="text-[10px] font-semibold mt-1 whitespace-nowrap">{filter.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// Helper: get the DB categories that match the current active filter label
export function getFilterCategories(activeLabel: string | null): string[] | null {
  if (!activeLabel) return null;
  const filter = FILTERS.find((f) => f.label === activeLabel);
  return filter ? filter.categories : null;
}
