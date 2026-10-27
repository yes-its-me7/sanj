// Sa+Nj service worker: app works offline, updates itself in the background.
const V = 'sanj-v6';
const SHELL = ['./','index.html','manifest.webmanifest','icon-192.png','icon-512.png','apple-touch-icon.png','sticker.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return; // never cache the database
  e.respondWith(caches.open(V).then(async c => {
    const hit = await c.match(e.request);
    if (e.request.mode === 'navigate') { try { const r = await fetch(e.request); if (r.ok) c.put(e.request, r.clone()); return r; } catch (_) { return hit; } }
    const net = fetch(e.request).then(r => { if (r.ok) c.put(e.request, r.clone()); return r; }).catch(() => hit);
    return hit || net;
  }));
});

// push notifications: show what the server sent, open the app when tapped
self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (_) { d = { body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.title || 'SKM - NJD', {
    body: d.body || '🤍', tag: d.tag || undefined, renotify: !!d.tag,
    icon: 'icon-192.png', badge: 'icon-192.png', data: { url: d.url || './' }
  }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || './';
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const c of list) { if ('focus' in c) return c.focus(); }
    return self.clients.openWindow(url);
  }));
});
