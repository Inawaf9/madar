// Retirement worker for legacy /sw.js registrations. MADAR does not register
// a new service worker. Do not intercept requests or delete application caches.
self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.registration.unregister());
});
