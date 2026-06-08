const CACHE = 'ml-hub-v1';
const PRECACHE = ['/', '/manifest.json', '/icons/icon-192.png', '/icons/icon-512.png'];

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
      }).catch(() => cached);
      // Stale-while-revalidate: serve cache immediately, update in background
      return cached ?? networkFetch;
    })
  );
});
