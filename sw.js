/* sw.js — Web Push for "Simple".
   Scope comes from the registration (./ → /calculator/), so it works on any sub-path.
   No caching, no fetch handler: all requests use the network exactly as before.
   The push payload is never read, so message content can never appear. */

const NOTIFICATION_TITLE = 'Simple';
const NOTIFICATION_OPTIONS = {
  body: 'New message',
  tag: 'simple-new-message', // repeated pushes replace one notification instead of stacking
  renotify: true
};

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Always the same fixed text: works for empty, missing or invalid payloads.
self.addEventListener('push', (event) => {
  event.waitUntil(
    self.registration.showNotification(NOTIFICATION_TITLE, NOTIFICATION_OPTIONS)
      .catch(() => { /* fail safely; nothing private to expose */ })
  );
});

// Tap → focus the open app (it switches itself to the calculator) or open the home page.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const scope = self.registration.scope;          // e.g. https://calculator-simple.github.io/calculator/
  const homeUrl = new URL('./', scope).href;

  event.waitUntil((async () => {
    try {
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of windows) {
        if (client.url.startsWith(scope)) {
          client.postMessage({ type: 'open-home' }); // index.html → Nav.goHome() (locked calculator)
          if ('focus' in client) {
            try { return await client.focus(); } catch { /* fall through to openWindow */ }
          }
        }
      }
      if (self.clients.openWindow) return await self.clients.openWindow(homeUrl);
    } catch {
      /* fail safely */
    }
  })());
});
