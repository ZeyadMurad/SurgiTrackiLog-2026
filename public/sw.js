/* ============================================================
   SurgiTrack iLog — Progressive Web App Service Worker
   Strategy:
   • Precache the app shell (SPA entry + icons + manifest)
   • Navigations: network-first, offline fallback to cached shell
   • Same-origin static assets (hashed /assets/*): cache-first
   • Cross-origin (Firebase, Google APIs) and /api/*: network only
   The app itself caches clinical data in localStorage, so the
   logbook remains fully readable offline.
   ============================================================ */

const CACHE = 'surgitrack-v2';
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.png',
  '/favicon.ico',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
  '/pwa-maskable-512x512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Only handle same-origin GET requests.
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Server APIs must always hit the network (AI, PubMed, journals, news).
  if (url.pathname.startsWith('/api/')) return;

  // SPA navigations: network-first so new deployments are picked up,
  // offline fallback to the cached app shell.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put('/index.html', copy));
          return res;
        })
        .catch(() =>
          caches.match('/index.html').then((r) => r || caches.match('/'))
        )
    );
    return;
  }

  // Static assets (Vite hashed filenames are immutable): cache-first.
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => cached);
    })
  );
});
