/* Reisblik 9.8.1 – reparatie offline basis
 * Reparatie: cache- en laadverzoeken met cache-busting querystrings worden
 * ook offline teruggevonden. Daardoor blijven vakanties en hun vaste content
 * beschikbaar nadat de app eerst online is geladen.
 * Offline kaarttegels en een apart gebied-downloadsysteem komen later.
 */
const CACHE_NAME = 'reisblik-app-v9.8.1';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './css/reisblik.css',
  './js/visited.js',
  './js/navigation.js',
  './js/extra-info.js?v=9.7.5',
  './js/agenda.js?v=9.7.5',
  './js/vakantie.js?v=9.7.5',
  './js/vakantie-keuze.js?v=9.7.5',
  './js/app.js?v=9.7.5',
  './js/ui.js?v=9.7.5',
  './js/backup.js?v=9.7.5',
  './js/clear-local-storage.js?v=9.7.5',
  './js/mijn-reisdag.js?v=9.8.1',
  './js/restore.js?v=9.7.5',
  './js/search.js?v=9.7.5',
  './js/help.js?v=9.7.5',
  './config/vakanties.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key.startsWith('reisblik-app-') && key !== CACHE_NAME)
          .map(key => caches.delete(key))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  event.respondWith((async () => {
    const url = new URL(request.url);
    const sameOrigin = url.origin === self.location.origin;

    // Veel Reisblik-bestanden worden bewust met ?v=... of ?t=... geladen.
    // Zo'n querystring mag offline niet betekenen dat een eerder opgeslagen
    // bestand onvindbaar is. Eerst de exacte request proberen, daarna een
    // querystring-vrije cachekey voor bestanden van Reisblik zelf.
    let cached = await caches.match(request);
    if (!cached && sameOrigin) {
      const cleanUrl = new URL(url.href);
      cleanUrl.search = '';
      cleanUrl.hash = '';
      cached = await caches.match(new Request(cleanUrl.href, {method:'GET'}));
    }
    if (cached) return cached;

    try {
      const response = await fetch(request);

      // Bewaar succesvolle same-origin bestanden met een stabiele cachekey.
      // Daardoor werken ook toekomstige cache-busting URL's offline.
      if (response.ok && sameOrigin) {
        const cleanUrl = new URL(url.href);
        cleanUrl.search = '';
        cleanUrl.hash = '';
        const cacheKey = new Request(cleanUrl.href, {method:'GET'});
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(cacheKey, copy));
      }
      return response;
    } catch (error) {
      // Voor navigatie naar de app: toon de lokaal opgeslagen app-shell.
      if (request.mode === 'navigate') {
        const fallback = await caches.match('./index.html');
        if (fallback) return fallback;
      }
      throw error;
    }
  })());
});
