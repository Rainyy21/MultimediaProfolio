const CACHE_NAME = 'pwc-v1';
const ASSETS = [
  './',
  './pwc.html',
  './css/pwc.css',
  './js/pwc.js',
  './data.json',
  './manifest.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((res) => res || fetch(e.request))
  );
});
