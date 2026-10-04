// FireBoard Pitmaster service worker.
// Makes the app installable and delivers pull alerts (Web Push).
// It deliberately caches nothing: a cook screen must never show stale readings offline.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : "" };
  }
  const title = data.title || "FireBoard Pitmaster";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || "",
      tag: data.tag || "pitmaster",
      // A pull alert replaces any earlier one for the same cook, alerts again, and stays until handled.
      renotify: Boolean(data.tag),
      requireInteraction: true,
      icon: "/icons/icon-192.png",
      vibrate: [300, 150, 300, 150, 300],
      data: { url: data.url || "/" },
    }),
  );
});

// Tapping the alert focuses an open Pitmaster window, or opens one at the cook screen.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL((event.notification.data && event.notification.data.url) || "/", self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      const open = windows.find((w) => new URL(w.url).origin === self.location.origin);
      return open ? open.focus() : self.clients.openWindow(target);
    }),
  );
});
