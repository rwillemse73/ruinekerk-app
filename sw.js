/* Reisblik 9.8.5 — tijdelijke offline vakantie */
const CACHE_NAME = 'reisblik-app-v9.8.5';
const OFFLINE_PREFIX = 'reisblik-offline-vacation-';
const APP_SHELL = [
  './','./index.html','./manifest.json','./css/reisblik.css',
  './js/visited.js','./js/navigation.js','./js/extra-info.js?v=9.7.5',
  './js/agenda.js?v=9.7.5','./js/vakantie.js?v=9.7.5','./js/vakantie-keuze.js?v=9.7.5',
  './js/app.js?v=9.7.5','./js/ui.js?v=9.7.5','./js/backup.js?v=9.7.5',
  './js/clear-local-storage.js?v=9.7.5','./js/mijn-reisdag.js?v=9.8.5',
  './js/restore.js?v=9.7.5','./js/search.js?v=9.7.5','./js/help.js?v=9.7.5',
  './js/offline-prepare.js?v=9.8.5','./config/vakanties.json'
];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(APP_SHELL)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('reisblik-app-')&&k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('message',event=>{
  if(!event.data || event.data.type!=='CACHE_URLS') return;
  const urls=Array.isArray(event.data.urls)?event.data.urls:[];
  const targetCache=(typeof event.data.cacheName==='string' && event.data.cacheName.startsWith(OFFLINE_PREFIX)) ? event.data.cacheName : CACHE_NAME;
  event.waitUntil(caches.open(targetCache).then(cache=>Promise.all(urls.map(async url=>{
    try { const r=await fetch(url,{cache:'no-store'}); if(r.ok) await cache.put(new Request(new URL(url,self.location.href).href),r.clone()); } catch(e) {}
  }))));
});
self.addEventListener('fetch',event=>{
  const request=event.request; if(request.method!=='GET') return;
  event.respondWith((async()=>{
    const url=new URL(request.url), same=url.origin===self.location.origin;
    let cached=await caches.match(request);
    if(!cached && same){ const clean=new URL(url.href); clean.search=''; clean.hash=''; cached=await caches.match(new Request(clean.href)); }
    if(cached) return cached;
    try{
      const response=await fetch(request);
      if(response.ok && same){
        const clean=new URL(url.href); clean.search=''; clean.hash='';
        caches.open(CACHE_NAME).then(c=>c.put(new Request(clean.href),response.clone()));
      }
      return response;
    }catch(error){
      if(request.mode==='navigate'){const fallback=await caches.match('./index.html'); if(fallback)return fallback;}
      throw error;
    }
  })());
});
