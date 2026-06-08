// ml-hub-BUILD is replaced by scripts/patch-sw.js at build time with a UTC timestamp
const CACHE = 'ml-hub-BUILD';
const PRECACHE = ['/', '/manifest.json', '/icons/icon-192.png', '/icons/icon-512.png', '/offline.html'];

self.addEventListener('install', evt => {
  self.skipWaiting();
  evt.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE)));
});

self.addEventListener('activate', evt => {
  evt.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', evt => {
  if (evt.request.method !== 'GET') return;
  // Don't intercept cross-origin requests (Pyodide CDN, etc.)
  if (!evt.request.url.startsWith(self.location.origin)) return;

  evt.respondWith(
    caches.match(evt.request).then(cached => {
      const networkFetch = fetch(evt.request).then(resp => {
        if (resp.ok) {
          caches.open(CACHE).then(c => c.put(evt.request, resp.clone()));
        }
        return resp;
      }).catch(() => {
        if (cached) return cached;
        // Navigation requests (page loads) with no cache → serve offline page
        if (evt.request.mode === 'navigate') return caches.match('/offline.html');
        return cached;
      });
      // Stale-while-revalidate: serve cache immediately, update in background
      return cached ?? networkFetch;
    })
  );
});
