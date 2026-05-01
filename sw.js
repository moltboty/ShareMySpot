// ========================================
// ShareMySpot — Service Worker
// ========================================

var CACHE_NAME = 'sharemyspot-v18';
var ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/i18n.js',
  './js/storage.js',
  './js/utils.js',
  './js/share-utils.js',
  './js/share.js',
  './js/app.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// Install — cache all assets
self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (key) { return key !== CACHE_NAME; })
          .map(function (key) { return caches.delete(key); })
      );
    })
  );
  self.clients.claim();
});

// Fetch — network-first for pages/scripts so testers see new releases immediately.
self.addEventListener('fetch', function (e) {
  var requestUrl = new URL(e.request.url);
  var isNavigation = e.request.mode === 'navigate' || e.request.destination === 'document';
  var hasCacheBuster = requestUrl.search && requestUrl.search.length > 0;

  if (isNavigation || hasCacheBuster) {
    e.respondWith(
      fetch(e.request).catch(function () {
        return caches.match(e.request).then(function (cached) {
          return cached || caches.match('./index.html');
        });
      })
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then(function (cached) {
      return cached || fetch(e.request);
    })
  );
});
