const CACHE_NAME = 'oitava-music-static-v5';
const STATIC_ASSETS = [
  '/manifest.webmanifest',
  '/pwa-icon-192.png',
  '/icon-512.png',
];

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

const swParams = new URL(self.location.href).searchParams;
const firebaseConfig = {
  apiKey: swParams.get('apiKey') || '',
  appId: swParams.get('appId') || '',
  authDomain: swParams.get('authDomain') || '',
  projectId: swParams.get('projectId') || '',
  storageBucket: swParams.get('storageBucket') || '',
  messagingSenderId: swParams.get('messagingSenderId') || '',
};

const messagingConfigured = Boolean(
  firebaseConfig.apiKey
  && firebaseConfig.appId
  && firebaseConfig.projectId
  && firebaseConfig.messagingSenderId,
);

if (messagingConfigured) {
  try {
    importScripts('https://www.gstatic.com/firebasejs/12.17.1/firebase-app-compat.js');
    importScripts('https://www.gstatic.com/firebasejs/12.17.1/firebase-messaging-compat.js');

    firebase.initializeApp(firebaseConfig);
    const messaging = firebase.messaging();

    messaging.onBackgroundMessage((payload) => {
      const data = payload?.data || {};
      const title = data.title || 'Você foi escalado! 🎵';
      const options = {
        body: data.body || 'Há uma nova escala para você.',
        icon: '/pwa-icon-192.png',
        badge: '/pwa-icon-192.png',
        tag: data.scaleId ? `scale-added-${data.scaleId}` : 'scale-added',
        data: { url: data.url || '/minhas-escalas' },
        vibrate: [180, 80, 180],
      };
      return self.registration.showNotification(title, options);
    });
  } catch (error) {
    console.warn('Firebase Messaging não pôde ser iniciado no service worker:', error);
  }
}

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
