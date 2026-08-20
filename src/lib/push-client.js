import {
  firebaseServiceWorkerUrl,
  getFirebaseAuth,
  getFirebaseMessaging,
  loadFirebaseConfig,
} from './firebase';
import {
  notifyScaleMembersAdded,
  registerPushInstallation,
  unregisterPushInstallation,
} from './push-notifications.functions';

const PUSH_ENABLED_KEY = 'oitava:push-enabled';
const PUSH_FID_KEY = 'oitava:push-fid';
let runtimeCleanup = null;
let syncPromise = null;

function browserReady() {
  return typeof window !== 'undefined' && typeof navigator !== 'undefined';
}

function preferenceEnabled() {
  return browserReady() && window.localStorage.getItem(PUSH_ENABLED_KEY) === 'true';
}

function cleanServerError(error, fallback) {
  const message = String(error?.message || error || '');
  if (message.includes('<!doctype html') || message.includes('<html')) return new Error(fallback);
  return error instanceof Error ? error : new Error(message || fallback);
}

async function currentIdToken() {
  const { auth } = await getFirebaseAuth();
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('Sua sessão expirou. Entre novamente no aplicativo.');
  return currentUser.getIdToken(true);
}

async function ensureServiceWorker(cfg) {
  if (!('serviceWorker' in navigator)) throw new Error('Este navegador não oferece suporte a notificações em segundo plano.');
  const registration = await navigator.serviceWorker.register(firebaseServiceWorkerUrl(cfg));
  await navigator.serviceWorker.ready;
  return registration;
}

export async function getScaleNotificationStatus() {
  const cfg = await loadFirebaseConfig();
  const supported = browserReady()
    && 'Notification' in window
    && 'serviceWorker' in navigator;

  let firebaseSupported = false;
  if (supported) {
    try {
      const mod = await import('firebase/messaging');
      firebaseSupported = await mod.isSupported();
    } catch {
      firebaseSupported = false;
    }
  }

  return {
    supported: supported && firebaseSupported,
    configured: Boolean(cfg.messagingConfigured),
    permission: supported ? Notification.permission : 'unsupported',
    enabled: supported && Notification.permission === 'granted' && preferenceEnabled(),
  };
}

export async function syncScaleNotifications({ requestPermission = false } = {}) {
  if (!browserReady()) return null;
  if (syncPromise) return syncPromise;

  syncPromise = (async () => {
    const cfg = await loadFirebaseConfig();
    if (!cfg.messagingConfigured || !cfg.vapidKey) {
      if (requestPermission) throw new Error('As notificações ainda não foram configuradas neste ambiente.');
      return null;
    }

    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      throw new Error('Este aparelho não oferece suporte a notificações do aplicativo.');
    }

    let permission = Notification.permission;
    if (permission !== 'granted' && requestPermission) {
      permission = await Notification.requestPermission();
    }
    if (permission !== 'granted') {
      if (requestPermission && permission === 'denied') {
        throw new Error('As notificações estão bloqueadas nas configurações do aparelho.');
      }
      return null;
    }

    if (!requestPermission && !preferenceEnabled()) return null;

    const registration = await ensureServiceWorker(cfg);
    const { messaging, mod } = await getFirebaseMessaging();
    const idToken = await currentIdToken();

    return new Promise((resolve, reject) => {
      let finished = false;
      let unsubscribe = () => {};
      const timeout = window.setTimeout(() => {
        if (finished) return;
        finished = true;
        unsubscribe();
        reject(new Error('O aparelho demorou demais para concluir o registro das notificações. Tente novamente.'));
      }, 20000);

      const finish = (callback) => {
        if (finished) return;
        finished = true;
        window.clearTimeout(timeout);
        unsubscribe();
        callback();
      };

      unsubscribe = mod.onRegistered(messaging, async (fid) => {
        try {
          await registerPushInstallation({ data: { idToken, fid } });
          window.localStorage.setItem(PUSH_FID_KEY, fid);
          window.localStorage.setItem(PUSH_ENABLED_KEY, 'true');
          finish(() => resolve(fid));
        } catch (error) {
          finish(() => reject(cleanServerError(error, 'Não foi possível vincular este aparelho às notificações.')));
        }
      });

      mod.register(messaging, {
        vapidKey: cfg.vapidKey,
        serviceWorkerRegistration: registration,
      }).catch((error) => {
        finish(() => reject(error));
      });
    });
  })();

  try {
    return await syncPromise;
  } finally {
    syncPromise = null;
  }
}

export async function enableScaleNotifications() {
  return syncScaleNotifications({ requestPermission: true });
}

export async function disableScaleNotifications() {
  if (!browserReady()) return;
  const fid = window.localStorage.getItem(PUSH_FID_KEY) || '';

  try {
    if (fid) {
      const idToken = await currentIdToken();
      await unregisterPushInstallation({ data: { idToken, fid } });
    }
  } catch (error) {
    console.warn('Não foi possível remover o vínculo de push no servidor:', error);
  }

  try {
    const { messaging, mod } = await getFirebaseMessaging();
    await mod.unregister(messaging);
  } catch (error) {
    console.warn('Não foi possível remover o registro local do FCM:', error);
  }

  window.localStorage.setItem(PUSH_ENABLED_KEY, 'false');
  window.localStorage.removeItem(PUSH_FID_KEY);
}

async function showForegroundNotification(payload) {
  if (Notification.permission !== 'granted' || !preferenceEnabled()) return;
  const data = payload?.data || {};
  const registration = await navigator.serviceWorker.ready;
  await registration.showNotification(data.title || 'Você foi escalado! 🎵', {
    body: data.body || 'Há uma nova escala para você.',
    icon: '/pwa-icon-192.png',
    badge: '/pwa-icon-192.png',
    tag: data.scaleId ? `scale-added-${data.scaleId}` : 'scale-added',
    data: { url: data.url || '/minhas-escalas' },
    vibrate: [180, 80, 180],
  });
}

export async function startScaleNotificationRuntime() {
  if (!browserReady() || runtimeCleanup) return runtimeCleanup || (() => {});

  const cfg = await loadFirebaseConfig();
  if (!cfg.messagingConfigured) return () => {};

  try {
    const { messaging, mod } = await getFirebaseMessaging();

    const offMessage = mod.onMessage(messaging, (payload) => {
      showForegroundNotification(payload).catch(console.warn);
    });

    const offUnregistered = mod.onUnregistered(messaging, async (fid) => {
      try {
        const idToken = await currentIdToken();
        await unregisterPushInstallation({ data: { idToken, fid } });
      } catch {
        // O servidor também elimina instalações inválidas ao tentar enviar.
      }
      if (window.localStorage.getItem(PUSH_FID_KEY) === fid) {
        window.localStorage.removeItem(PUSH_FID_KEY);
      }
    });

    runtimeCleanup = () => {
      offMessage();
      offUnregistered();
      runtimeCleanup = null;
    };

    if (preferenceEnabled() && Notification.permission === 'granted') {
      syncScaleNotifications().catch((error) => console.warn('Falha ao renovar notificações:', error));
    }

    return runtimeCleanup;
  } catch (error) {
    console.warn('Notificações push indisponíveis:', error);
    return () => {};
  }
}

export async function sendScaleAddedNotifications(scale, addedMemberIds) {
  const ids = [...new Set((addedMemberIds || []).filter(Boolean))];
  if (ids.length === 0) return { sent: 0, failed: 0, devices: 0 };

  const idToken = await currentIdToken();
  try {
    return await notifyScaleMembersAdded({
      data: {
        idToken,
        scale: { id: scale.id, name: scale.name, date: scale.date },
        addedMemberIds: ids,
      },
    });
  } catch (error) {
    throw cleanServerError(error, 'A escala foi salva, mas não foi possível enviar as notificações.');
  }
}
