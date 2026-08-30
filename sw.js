'use strict';

const VERSION = '16.0.0';
const CACHE = `gym-tracker-v${VERSION}`;
const CORE = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './core.mjs',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(CORE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key.startsWith('gym-tracker-') && key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

function cacheable(response) {
  return response && (response.ok || response.type === 'opaque');
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE);
  try {
    const response = await fetch(request);
    if (cacheable(response)) {
      cache.put(request, response.clone());
      return response;
    }
    const cached = await cache.match(request);
    return cached || response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw error;
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (cacheable(response)) cache.put(request, response.clone());
  return response;
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request).catch(() => caches.match('./index.html')));
    return;
  }

  // Keep the anatomy dependency after its first successful/opaque CDN fetch.
  if (url.origin !== self.location.origin && (url.hostname === 'unpkg.com' || url.hostname === 'cdn.jsdelivr.net')) {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (url.origin !== self.location.origin) return;

  if (/\.(?:gif|jpe?g|png|webp|svg)$/i.test(url.pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // HTML, code and JSON should update promptly; cache is only the offline fallback.
  if (/\.(?:html?|js|mjs|css|json|webmanifest)$/i.test(url.pathname) || url.pathname.endsWith('/')) {
    event.respondWith(networkFirst(request));
  }
});
