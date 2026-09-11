/* Reisblik 9.8.0 – offline basis
 * Fase 1: cache de app-shell en bewaar lokaal geladen bestanden voor hergebruik.
 * Offline kaarttegels en een apart gebied-downloadsysteem komen in een latere fase.
 */
const CACHE_NAME = 'reisblik-app-v9.8.0';
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
  './js/mijn-reisdag.js?v=9.8.0',
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
    const cached = await caches.match(request);
    if (cached) return cached;

    try {
      const response = await fetch(request);
      // Bewaar succesvolle same-origin bestanden die tijdens online gebruik
      // worden geladen, zodat ze later ook offline beschikbaar kunnen zijn.
      const url = new URL(request.url);
      if (response.ok && url.origin === self.location.origin) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
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
