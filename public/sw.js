// Service worker MiamWeek — « réseau d'abord » pour voir les mises à jour,
// avec repli sur le cache hors-ligne (garde les infos localement).
const RUNTIME = "miamweek-runtime-v1";
const STATIC = "miamweek-static-v1";

self.addEventListener("install", () => {
  // Active immédiatement la nouvelle version
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k !== RUNTIME && k !== STATIC).map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return; // ne touche pas aux POST/PUT/DELETE
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // ignore les ressources tierces

  // Assets immuables (hashés) → cache d'abord
  if (
    url.pathname.startsWith("/_next/static/") ||
    /\.(png|jpg|jpeg|svg|ico|webp|woff2?)$/.test(url.pathname)
  ) {
    event.respondWith(cacheFirst(req, STATIC));
    return;
  }

  // Pages + API + reste → réseau d'abord, repli cache (hors-ligne)
  event.respondWith(networkFirst(req, RUNTIME));
});

async function cacheFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  if (cached) return cached;
  try {
    const res = await fetch(req);
    if (res && res.ok) cache.put(req, res.clone());
    return res;
  } catch {
    return cached || Response.error();
  }
}

async function networkFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const res = await fetch(req);
    if (res && res.ok) cache.put(req, res.clone());
    return res;
  } catch {
    const cached = await cache.match(req);
    if (cached) return cached;
    if (req.mode === "navigate") {
      const shell = await cache.match("/");
      if (shell) return shell;
    }
    return Response.error();
  }
}
