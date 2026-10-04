// FireBoard Pitmaster service worker.
// It makes the app installable and will carry pull-alert push notifications.
// It deliberately caches nothing: a cook screen must never show stale readings offline.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
