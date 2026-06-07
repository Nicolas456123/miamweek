// Cache client léger (mémoire + sessionStorage) pour afficher instantanément
// les données déjà chargées, puis rafraîchir depuis le réseau.
// Modèle « stale-while-revalidate » côté appli : on hydrate l'état avec le
// cache (rendu immédiat), et le fetch met à jour ensuite.

const mem = new Map<string, unknown>();

export function cacheGet<T>(key: string): T | undefined {
  if (mem.has(key)) return mem.get(key) as T;
  if (typeof window !== "undefined") {
    try {
      const raw = sessionStorage.getItem("mw:" + key);
      if (raw) {
        const v = JSON.parse(raw) as T;
        mem.set(key, v);
        return v;
      }
    } catch {
      /* ignore */
    }
  }
  return undefined;
}

export function cacheSet<T>(key: string, val: T): void {
  mem.set(key, val);
  if (typeof window !== "undefined") {
    try {
      sessionStorage.setItem("mw:" + key, JSON.stringify(val));
    } catch {
      /* quota / sérialisation */
    }
  }
}
