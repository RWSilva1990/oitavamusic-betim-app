import {
  firebaseServiceWorkerUrl,
  getFirebaseAuth,
  getFirebaseMessaging,
  loadFirebaseConfig,
} from './firebase';
import {
  disableNativeScaleNotifications,
  enableNativeScaleNotifications,
  getNativeScaleNotificationStatus,
  isNativeAndroid,
  startNativeScaleNotificationRuntime,
} from './push-native';
import {
  notifyMobileScaleAdded,
  registerMobilePush,
  unregisterMobilePush,
} from './mobile-api';

const PUSH_ENABLED_KEY = 'oitava:push-enabled';
const PUSH_TOKEN_KEY = 'oitava:push-token';
const PUSH_FID_KEY = 'oitava:push-fid';
const NOTIFICATION_BADGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAYAAADimHc4AAABRUlEQVR42u3cUQ7CIBBFUSHsf8v1yw9jjcZgZxjOXYAt7/KwKOntBgAAAAAAAAAAAACoSttloMdxHE8Db60REBR+JhFt5/AziGjCj5XRfQ2ei/tVngZMaMCVrdCA4FZoQHArNCAYAgjYm7Hj2q0Bws8pICr8yN+Dhpn/KuHKe+nCP5dxVSu68GNFDOHHLk/2AcGtGKvNwCwNmyVBA+wDCAABBIAAAkAAASCAABBAAAggAAQQAAIIAAF1GSvffIVzpEPoxQXMCqzqqelmlhY6Hb3b2f5UT0Grhh/9rohu5i/eAOEHCqgQfvQY7IRXbYClRwMIAAH2AQgSkOW1jyvP/q0bkGUC9eyD+Mc1MrW3Zx7M47NnXiPb0jntZmZvzN4FtcK7QEMEzJTwbVifrrfCg0Kqf8QqPFmlEFBtlgIAAAAAAAAowB3XUph8InDUGgAAAABJRU5ErkJggg==';
let runtimeCleanup = null;
let syncPromise = null;

function browserReady() {
  return typeof window !== 'undefined' && typeof navigator !== 'undefined';
}

function isIOSDevice() {
  if (!browserReady()) return false;
  const ua = String(navigator.userAgent || '');
  return /iPad|iPhone|iPod/i.test(ua)
    || (navigator.platform === 'MacIntel' && Number(navigator.maxTouchPoints || 0) > 1);
}

function isStandaloneWebApp() {
  if (!browserReady()) return false;
  return window.matchMedia?.('(display-mode: standalone)')?.matches === true
    || navigator.standalone === true;
}

function hasWebPushApis() {
  return browserReady()
    && 'Notification' in window
    && 'serviceWorker' in navigator
    && 'PushManager' in window;
}

function preferenceEnabled() {
  return browserReady() && window.localStorage.getItem(PUSH_ENABLED_KEY) === 'true';
}

function cleanServerError(error, fallback) {
  const message = String(error?.message || error || '');
  if (message.includes('<!doctype html') || message.includes('<html') || message.includes('Only HTML requests are supported here')) {
    return new Error(fallback);
  }
  return error instanceof Error ? error : new Error(message || fallback);
}

async function currentIdToken() {
  const { auth } = await getFirebaseAuth();
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('Sua sessão expirou. Entre novamente no aplicativo.');
  return currentUser.getIdToken(true);
}

async function ensureServiceWorker() {
  if (!('serviceWorker' in navigator)) throw new Error('Este navegador não oferece suporte a notificações em segundo plano.');
  const registration = await navigator.serviceWorker.register(firebaseServiceWorkerUrl());
  await navigator.serviceWorker.ready;
  return registration;
}

async function registerWebPush(messaging, mod, options) {
  if (typeof mod.register === 'function' && typeof mod.onRegistered === 'function') {
    let unsubscribe = () => {};
    let timer;
    const fidPromise = new Promise((resolve, reject) => {
      timer = window.setTimeout(
        () => reject(new Error('O registro de notificações demorou mais que o esperado. Tente novamente.')),
        20000,
      );
      unsubscribe = mod.onRegistered(messaging, (fid) => {
        const value = String(fid || '').trim();
        if (!value) return;
        window.clearTimeout(timer);
        resolve(value);
      });
    });

    try {
      await mod.register(messaging, options);
      const fid = await fidPromise;
      return { type: 'fid', value: fid };
    } finally {
      if (timer) window.clearTimeout(timer);
      unsubscribe();
    }
  }

  const token = await mod.getToken(messaging, options);
  if (!token) throw new Error('O navegador não forneceu um identificador para receber notificações. Tente novamente.');
  return { type: 'token', value: token };
}

export async function getScaleNotificationStatus() {
  if (isNativeAndroid()) return getNativeScaleNotificationStatus();

  const cfg = await loadFirebaseConfig();
  const ios = isIOSDevice();
  const standalone = isStandaloneWebApp();
  const webPushApis = hasWebPushApis();

  let firebaseSupported = false;
  if (webPushApis) {
    try {
      const mod = await import('firebase/messaging');
      firebaseSupported = await mod.isSupported();
    } catch {
      firebaseSupported = false;
    }
  }

  const supported = webPushApis && (!ios || standalone);
  return {
    supported,
    configured: Boolean(cfg.messagingConfigured && cfg.vapidKey),
    permission: 'Notification' in window ? Notification.permission : 'unsupported',
    enabled: supported && Notification.permission === 'granted' && preferenceEnabled(),
    native: false,
    ios,
    standalone,
    requiresHomeScreen: ios && !standalone,
    firebaseSupported,
  };
}

export async function syncScaleNotifications({ requestPermission = false } = {}) {
  if (isNativeAndroid()) {
    return requestPermission ? enableNativeScaleNotifications() : null;
  }

  if (!browserReady()) return null;
  if (syncPromise) return syncPromise;

  syncPromise = (async () => {
    const cfg = await loadFirebaseConfig();
    if (!cfg.messagingConfigured || !cfg.vapidKey) {
      if (requestPermission) throw new Error('As notificações ainda não foram configuradas neste ambiente.');
      return null;
    }

    const ios = isIOSDevice();
    const standalone = isStandaloneWebApp();
    if (ios && !standalone) {
      throw new Error('No iPhone, as notificações funcionam no Oitava Music instalado na Tela de Início. Abra o aplicativo pelo ícone da Tela de Início e tente novamente.');
    }

    if (!hasWebPushApis()) {
      throw new Error('Este aparelho não disponibilizou os recursos de Web Push necessários.');
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

    const registration = await ensureServiceWorker();
    const allowWebPushFallback = ios && standalone && hasWebPushApis();
    const { messaging, mod } = await getFirebaseMessaging({ allowWebPushFallback });
    const target = await registerWebPush(messaging, mod, {
      vapidKey: cfg.vapidKey,
      serviceWorkerRegistration: registration,
    });

    const idToken = await currentIdToken();
    const previousToken = window.localStorage.getItem(PUSH_TOKEN_KEY) || '';
    const previousFid = window.localStorage.getItem(PUSH_FID_KEY) || '';

    if (target.type === 'fid') {
      await registerMobilePush(idToken, { fid: target.value, platform: 'web' });
      if (previousToken) {
        await unregisterMobilePush(idToken, { token: previousToken }).catch(() => undefined);
      }
      if (previousFid && previousFid !== target.value) {
        await unregisterMobilePush(idToken, { fid: previousFid }).catch(() => undefined);
      }
      window.localStorage.setItem(PUSH_FID_KEY, target.value);
      window.localStorage.removeItem(PUSH_TOKEN_KEY);
    } else {
      await registerMobilePush(idToken, { token: target.value, platform: 'web' });
      if (previousFid) {
        await unregisterMobilePush(idToken, { fid: previousFid }).catch(() => undefined);
      }
      window.localStorage.setItem(PUSH_TOKEN_KEY, target.value);
      window.localStorage.removeItem(PUSH_FID_KEY);
    }

    window.localStorage.setItem(PUSH_ENABLED_KEY, 'true');
    return target.value;
  })();

  try {
    return await syncPromise;
  } catch (error) {
    throw cleanServerError(error, 'Não foi possível vincular este navegador às notificações.');
  } finally {
    syncPromise = null;
  }
}

export async function enableScaleNotifications() {
  if (isNativeAndroid()) return enableNativeScaleNotifications();
  return syncScaleNotifications({ requestPermission: true });
}

export async function disableScaleNotifications() {
  if (isNativeAndroid()) return disableNativeScaleNotifications();
  if (!browserReady()) return;

  const token = window.localStorage.getItem(PUSH_TOKEN_KEY) || '';
  const fid = window.localStorage.getItem(PUSH_FID_KEY) || '';

  try {
    const idToken = await currentIdToken();
    if (token) await unregisterMobilePush(idToken, { token });
    if (fid) await unregisterMobilePush(idToken, { fid });
  } catch (error) {
    console.warn('Não foi possível remover o vínculo de push no servidor:', error);
  }

  try {
    const allowWebPushFallback = isIOSDevice() && isStandaloneWebApp() && hasWebPushApis();
    const { messaging, mod } = await getFirebaseMessaging({ allowWebPushFallback });
    if (fid && typeof mod.unregister === 'function') await mod.unregister(messaging);
    else if (typeof mod.deleteToken === 'function') await mod.deleteToken(messaging);
  } catch (error) {
    console.warn('Não foi possível remover o registro local do FCM:', error);
  }

  window.localStorage.setItem(PUSH_ENABLED_KEY, 'false');
  window.localStorage.removeItem(PUSH_TOKEN_KEY);
  window.localStorage.removeItem(PUSH_FID_KEY);
}

async function showForegroundNotification(payload) {
  if (Notification.permission !== 'granted' || !preferenceEnabled()) return;
  const data = payload?.data || {};
  const notification = payload?.notification || {};
  const registration = await navigator.serviceWorker.ready;
  await registration.showNotification(data.title || notification.title || 'Oitava Music Betim', {
    body: data.body || notification.body || 'Há uma nova atualização para você.',
    icon: '/pwa-icon-192.png',
    badge: NOTIFICATION_BADGE,
    tag: data.scaleId ? `${data.type || 'oitava'}-${data.scaleId}` : (data.communicationId ? `communication-${data.communicationId}` : 'oitava-music-push'),
    data: { url: data.url || data.path || '/minhas-escalas' },
    vibrate: [180, 80, 180],
  });
}

export async function startScaleNotificationRuntime() {
  if (isNativeAndroid()) return startNativeScaleNotificationRuntime();
  if (!browserReady() || runtimeCleanup) return runtimeCleanup || (() => {});

  const cfg = await loadFirebaseConfig();
  if (!cfg.messagingConfigured) return () => {};

  try {
    const allowWebPushFallback = isIOSDevice() && isStandaloneWebApp() && hasWebPushApis();
    const { messaging, mod } = await getFirebaseMessaging({ allowWebPushFallback });
    const offMessage = mod.onMessage(messaging, (payload) => {
      showForegroundNotification(payload).catch(console.warn);
    });

    runtimeCleanup = () => {
      offMessage();
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
    return await notifyMobileScaleAdded(idToken, scale, ids);
  } catch (error) {
    throw cleanServerError(error, 'A escala foi salva, mas não foi possível enviar as notificações.');
  }
}
