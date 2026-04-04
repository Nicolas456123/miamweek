const s = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

export const categoryIcons: Record<string, React.ReactNode> = {
  "Fruits & Légumes": (
    <svg {...s}>
      <path d="M12 2c-2 0-4 1.5-4 4 0 1 .3 2 1 2.7C7 10 6 12 6 14c0 4 2.7 8 6 8s6-4 6-8c0-2-1-4-3-5.3.7-.7 1-1.7 1-2.7 0-2.5-2-4-4-4z" fill="#dcfce7" stroke="#16a34a"/>
      <path d="M12 2v6" stroke="#16a34a"/>
      <path d="M10 4c-1-1-3-.5-3 1" stroke="#22c55e"/>
    </svg>
  ),
  "Viandes & Poissons": (
    <svg {...s}>
      <path d="M4 12c0-3 2-6 5-7 1.5-.5 3.5-.5 5 0 3 1 5 4 5 7 0 4-3 7-7.5 7S4 16 4 12z" fill="#fee2e2" stroke="#ef4444"/>
      <path d="M10 9c0 1.5 1.5 3 3 2.5" stroke="#ef4444"/>
      <ellipse cx="15" cy="10" rx="1" ry="1.5" fill="#ef4444" opacity="0.3"/>
    </svg>
  ),
  "Produits laitiers": (
    <svg {...s}>
      <rect x="7" y="4" width="10" height="16" rx="2" fill="#dbeafe" stroke="#3b82f6"/>
      <path d="M7 8h10" stroke="#3b82f6"/>
      <circle cx="12" cy="14" r="2" fill="#3b82f6" opacity="0.3"/>
    </svg>
  ),
  "Boulangerie": (
    <svg {...s}>
      <path d="M5 16c0-2 1-4 3-5 1-2 3-3 4-3s3 1 4 3c2 1 3 3 3 5 0 2-1 4-7 4s-7-2-7-4z" fill="#fef3c7" stroke="#f59e0b"/>
      <path d="M9 11c1-1 2.5-1 3.5 0" stroke="#f59e0b" opacity="0.6"/>
      <path d="M12.5 11c1-1 2.5-1 3.5 0" stroke="#f59e0b" opacity="0.6"/>
    </svg>
  ),
  "Épicerie": (
    <svg {...s}>
      <rect x="5" y="6" width="14" height="14" rx="2" fill="#fef3c7" stroke="#f59e0b"/>
      <path d="M5 10h14" stroke="#f59e0b"/>
      <path d="M9 2v4M15 2v4" stroke="#f59e0b"/>
      <path d="M9 14h6M9 17h4" stroke="#f59e0b" opacity="0.5"/>
    </svg>
  ),
  "Surgelés": (
    <svg {...s}>
      <path d="M12 2v20M2 12h20" stroke="#0ea5e9"/>
      <path d="M7 4l5 5 5-5M17 20l-5-5-5 5" stroke="#0ea5e9" opacity="0.5"/>
      <path d="M4 7l5 5-5 5M20 17l-5-5 5-5" stroke="#0ea5e9" opacity="0.5"/>
      <circle cx="12" cy="12" r="2" fill="#dbeafe" stroke="#0ea5e9"/>
    </svg>
  ),
  "Boissons": (
    <svg {...s}>
      <path d="M8 2h8l-1 14a2 2 0 01-2 2h-2a2 2 0 01-2-2L8 2z" fill="#dbeafe" stroke="#3b82f6"/>
      <path d="M8 2h8" stroke="#3b82f6" strokeWidth="2"/>
      <path d="M9 7h6" stroke="#3b82f6" opacity="0.4"/>
      <path d="M12 18v3M9 21h6" stroke="#3b82f6"/>
    </svg>
  ),
  "Hygiène & Beauté": (
    <svg {...s}>
      <rect x="7" y="3" width="10" height="18" rx="3" fill="#f3e8ff" stroke="#a855f7"/>
      <circle cx="12" cy="9" r="2" fill="#a855f7" opacity="0.3"/>
      <path d="M10 15h4" stroke="#a855f7" opacity="0.5"/>
      <path d="M9 3h6v3a1 1 0 01-1 1h-4a1 1 0 01-1-1V3z" fill="#a855f7" opacity="0.2" stroke="#a855f7"/>
    </svg>
  ),
  "Entretien & Maison": (
    <svg {...s}>
      <path d="M12 2l-1 7h2l-1 7" stroke="#0ea5e9" fill="none"/>
      <path d="M8 18c0-1 1.5-2 4-2s4 1 4 2v2H8v-2z" fill="#dbeafe" stroke="#0ea5e9"/>
      <path d="M6 12l2-2M18 12l-2-2" stroke="#0ea5e9" opacity="0.4"/>
      <circle cx="12" cy="5" r="1.5" fill="#0ea5e9" opacity="0.2"/>
    </svg>
  ),
  "Épices & Condiments": (
    <svg {...s}>
      <path d="M9 2h6v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V2z" fill="#fef3c7" stroke="#f59e0b"/>
      <path d="M8 7h8l-1 13a2 2 0 01-2 2h-2a2 2 0 01-2-2L8 7z" fill="#fef3c7" stroke="#f59e0b"/>
      <path d="M10 11h4M11 14h2" stroke="#f59e0b" opacity="0.5"/>
    </svg>
  ),
  "Autre": (
    <svg {...s}>
      <circle cx="12" cy="12" r="9" fill="#f0f5f0" stroke="#6b7b6b"/>
      <path d="M12 8v4M12 16h.01" stroke="#6b7b6b"/>
    </svg>
  ),
};

export function CategoryIcon({ category, size = 18 }: { category: string; size?: number }) {
  const icon = categoryIcons[category] || categoryIcons["Autre"];
  return (
    <span style={{ display: "inline-flex", width: size, height: size }} className="shrink-0">
      {icon}
    </span>
  );
}
