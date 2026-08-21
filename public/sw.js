const CACHE_NAME = 'oitava-music-static-v7';
const STATIC_ASSETS = [
  '/manifest.webmanifest',
  '/pwa-icon-192.png',
  '/icon-512.png',
];

const NOTIFICATION_BADGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAYAAADimHc4AAABRUlEQVR42u3cUQ7CIBBFUSHsf8v1yw9jjcZgZxjOXYAt7/KwKOntBgAAAAAAAAAAAACoSttloMdxHE8Db60REBR+JhFt5/AziGjCj5XRfQ2ei/tVngZMaMCVrdCA4FZoQHArNCAYAgjYm7Hj2q0Bws8pICr8yN+Dhpn/KuHKe+nCP5dxVSu68GNFDOHHLk/2AcGtGKvNwCwNmyVBA+wDCAABBIAAAkAAASCAABBAAAggAAQQAAIIAAF1GSvffIVzpEPoxQXMCqzqqelmlhY6Hb3b2f5UT0Grhh/9rohu5i/eAOEHCqgQfvQY7IRXbYClRwMIAAH2AQgSkOW1jyvP/q0bkGUC9eyD+Mc1MrW3Zx7M47NnXiPb0jntZmZvzN4FtcK7QEMEzJTwbVifrrfCg0Kqf8QqPFmlEFBtlgIAAAAAAAAowB3XUph8InDUGgAAAABJRU5ErkJggg==';

function notificationData(payload) {
  if (!payload || typeof payload !== 'object') return {};
  return payload.data || payload.message?.data || {};
}

function notificationInfo(payload) {
  if (!payload || typeof payload !== 'object') return {};
  return payload.notification || payload.message?.notification || {};
}

self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data?.json?.() || {};
  } catch {
    try {
      payload = JSON.parse(event.data?.text?.() || '{}');
    } catch {
      payload = {};
    }
  }

  const data = notificationData(payload);
  const notification = notificationInfo(payload);
  const title = data.title || notification.title || 'Você foi escalado! 🎵';
  const body = data.body || notification.body || 'Há uma nova escala para você.';
  const url = data.url || payload.fcmOptions?.link || payload.message?.fcmOptions?.link || '/minhas-escalas';

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/pwa-icon-192.png',
      badge: NOTIFICATION_BADGE,
      tag: data.scaleId ? `scale-added-${data.scaleId}` : 'oitava-music-push',
      data: { url },
      vibrate: [180, 80, 180],
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = event.notification?.data?.url || '/minhas-escalas';
  const targetUrl = new URL(target, self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async (clients) => {
      const existing = clients.find((client) => new URL(client.url).origin === self.location.origin);
      if (existing) {
        if ('navigate' in existing) await existing.navigate(targetUrl);
        return existing.focus();
      }
      return self.clients.openWindow(targetUrl);
    }),
  );
});

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (STATIC_ASSETS.includes(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request)),
    );
    return;
  }

  event.respondWith(fetch(request));
});
