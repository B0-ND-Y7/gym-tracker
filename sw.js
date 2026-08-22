const CACHE='gym-tracker-v3';
const ASSETS=[
  './','./index.html','./manifest.webmanifest','./sw.js',
  './img/chest-press.png','./img/lat-pulldown.png','./img/shoulder-press.png','./img/leg-curl.png',
  './img/leg-extension.png','./img/leg-press.png','./img/bicep-curl.png','./img/tricep-pushdown.png',
  './img/treadmill.png','./img/calf-raise.png','./img/seated-row.png','./img/crunch.png'
];
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k!==CACHE).map(k => caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch', e => e.respondWith(caches.match(e.request).then(r => r || fetch(e.request))));
