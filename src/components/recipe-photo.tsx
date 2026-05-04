"use client";

/**
 * Composant photo de recette — utilise /api/photo (Pexels) avec fallback placeholder.
 *
 * Usage :
 *   <RecipePhoto recipe={recipe} className="aspect-[4/3] w-full" />
 *
 * Si recipe.photo_url existe (DB), on l'affiche.
 * Sinon, on appelle /api/photo?q=<recipe.name> et on cache l'URL côté client (sessionStorage).
 * On peut aussi POSTer l'URL trouvée vers /api/recipes/:id/photo pour la persister en DB
 * — à brancher selon vos besoins.
 */

import { useState, useEffect } from "react";

type RecipePhotoProps = {
  recipe: {
    id: number;
    name: string;
    photo_url?: string | null;
    photo_credit?: string | null;
  };
  className?: string;
  showCredit?: boolean;
  /** persiste l'URL trouvée en DB via PATCH /api/recipes/:id (false par défaut) */
  persist?: boolean;
};

const SS_KEY = (name: string) => `mw_photo_${name.toLowerCase().slice(0, 60)}`;

export function RecipePhoto({
  recipe,
  className = "",
  showCredit = false,
  persist = false,
}: RecipePhotoProps) {
  const [url, setUrl] = useState<string | null>(recipe.photo_url || null);
  const [credit, setCredit] = useState<string | null>(recipe.photo_credit || null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (recipe.photo_url) return;

    // Cache session
    try {
      const cached = sessionStorage.getItem(SS_KEY(recipe.name));
      if (cached) {
        const parsed = JSON.parse(cached);
        setUrl(parsed.url);
        setCredit(parsed.credit);
        return;
      }
    } catch {}

    setLoading(true);
    fetch(`/api/photo?q=${encodeURIComponent(recipe.name)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.url) {
          setUrl(data.url);
          setCredit(data.photographer || null);
          try {
            sessionStorage.setItem(
              SS_KEY(recipe.name),
              JSON.stringify({ url: data.url, credit: data.photographer })
            );
          } catch {}

          // Persister en DB si demandé
          if (persist && recipe.id) {
            fetch(`/api/recipes/${recipe.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                photo_url: data.url,
                photo_credit: data.photographer,
              }),
            }).catch(() => {});
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [recipe.id, recipe.name, recipe.photo_url, persist]);

  if (!url) {
    return (
      <div
        className={`placeholder-img placeholder-img-terra ${className}`}
        style={{ minHeight: 120 }}
      >
        {loading ? "…" : recipe.name.slice(0, 24)}
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-lg ${className}`}>
      <img
        src={url}
        alt={recipe.name}
        className="w-full h-full object-cover"
        loading="lazy"
      />
      {showCredit && credit && (
        <span
          className="absolute bottom-1.5 right-1.5 font-mono text-[10px] px-1.5 py-0.5 rounded"
          style={{
            background: "rgba(31,26,20,0.6)",
            color: "var(--color-cream-pale)",
            backdropFilter: "blur(4px)",
          }}
        >
          {credit} / Pexels
        </span>
      )}
    </div>
  );
}
