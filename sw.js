// v14 intentionally does not register a service worker.
// Existing registrations are removed by index.html during the v14.0.3 boot.
self.addEventListener('install', event => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
