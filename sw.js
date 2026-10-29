/**
 * DictaShadow Studio - PWA Offline Service Worker (sw.js)
 * Caches app shell & external UI assets for 100% offline study
 */
const CACHE_NAME = 'dictashadow-studio-v3';

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './css/studio.css',
  './js/state.js',
  './js/srt-parser.js',
  './js/diff-checker.js',
  './js/audio-engine.js',
  './js/vinyl-jog.js',
  './js/dictation.js',
  './js/speech-analysis.js',
  './js/shadowing.js',
  './js/hotkeys.js',
  './js/storage.js',
  './js/srt-editor.js',
  './js/gestures.js',
  './js/app.js'
];

const EXTERNAL_ASSETS = [
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/lucide@latest'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await cache.addAll(ASSETS_TO_CACHE);
      await Promise.allSettled(
        EXTERNAL_ASSETS.map((url) =>
          fetch(url, { mode: 'no-cors' }).then((res) => cache.put(url, res))
        )
      );
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});

