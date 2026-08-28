import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { getFirebaseAuth } from './firebase';
import {
  registerPushInstallation,
  unregisterPushInstallation,
} from './push-notifications.functions';
import {
  isPackagedNativeApp,
  registerMobilePush,
  unregisterMobilePush,
} from './mobile-api';

const NATIVE_PUSH_ENABLED_KEY = 'oitava:native-push-enabled';
const NATIVE_PUSH_TOKEN_KEY = 'oitava:native-push-token';
const NATIVE_PUSH_SERVER_LINKED_KEY = 'oitava:native-push-server-linked';
const NATIVE_PUSH_CHANNEL_ID = 'escala-alerts';
let runtimeCleanup = null;
let registrationPromise = null;

export function isNativeAndroid() {
  return typeof window !== 'undefined'
    && Capacitor.isNativePlatform()
    && Capacitor.getPlatform() === 'android';
}

function preferenceEnabled() {
  return isNativeAndroid() && window.localStorage.getItem(NATIVE_PUSH_ENABLED_KEY) === 'true';
}

export function getNativePushDiagnosticToken() {
  if (!isNativeAndroid()) return '';
  return String(window.localStorage.getItem(NATIVE_PUSH_TOKEN_KEY) || '').trim();
}

async function currentIdToken() {
  const { auth } = await getFirebaseAuth();
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('Sua sessão expirou. Entre novamente no aplicativo.');
  return currentUser.getIdToken(true);
}

async function registerTarget(idToken, token) {
  if (isPackagedNativeApp()) return registerMobilePush(idToken, { token });
  return registerPushInstallation({ data: { idToken, token } });
}

async function unregisterTarget(idToken, token) {
  if (isPackagedNativeApp()) return unregisterMobilePush(idToken, { token });
  return unregisterPushInstallation({ data: { idToken, token } });
}

function cleanServerError(error, fallback) {
  const message = String(error?.message || error || '');
  if (message.includes('<!doctype html') || message.includes('<html')) return new Error(fallback);
  return error instanceof Error ? error : new Error(message || fallback);
}

async function permissionStatus(requestPermission = false) {
  let permission = await PushNotifications.checkPermissions();
  if ((permission.receive === 'prompt' || permission.receive === 'prompt-with-rationale') && requestPermission) {
    permission = await PushNotifications.requestPermissions();
  }
  return permission.receive;
}

async function ensureNativePushChannel() {
  if (!isNativeAndroid()) return;
  try {
    await PushNotifications.createChannel({
      id: NATIVE_PUSH_CHANNEL_ID,
      name: 'Escalas',
      description: 'Avisos de novas escalas do Oitava Music',
      importance: 4,
      visibility: 1,
      vibration: true,
    });
  } catch (error) {
    console.warn('Não foi possível preparar o canal de notificações do Android:', error);
  }
}

export async function relinkNativePushForCurrentUser() {
  if (!isNativeAndroid() || !preferenceEnabled()) return false;
  const permission = await permissionStatus(false);
  if (permission !== 'granted') return false;
  const token = await registerNativePush();
  return Boolean(token);
}

export async function unlinkNativePushForCurrentUser() {
  if (!isNativeAndroid() || !preferenceEnabled()) return false;
  const token = getNativePushDiagnosticToken();
  if (!token) return false;

  const idToken = await currentIdToken();
  await unregisterTarget(idToken, token);
  window.localStorage.setItem(NATIVE_PUSH_SERVER_LINKED_KEY, 'false');
  return true;
}

async function registerNativePush({ requestPermission = false } = {}) {
  if (!isNativeAndroid()) return null;
  if (registrationPromise) return registrationPromise;

  registrationPromise = (async () => {
    const permission = await permissionStatus(requestPermission);
    if (permission !== 'granted') {
      if (requestPermission && permission === 'denied') {
        throw new Error('As notificações estão bloqueadas nas configurações do aparelho.');
      }
      return null;
    }

    if (!requestPermission && !preferenceEnabled()) return null;

    await ensureNativePushChannel();
    const idToken = await currentIdToken();

    return new Promise(async (resolve, reject) => {
      let finished = false;
      let registrationHandle;
      let errorHandle;

      const cleanup = async () => {
        await registrationHandle?.remove?.();
        await errorHandle?.remove?.();
      };

      const finish = async (callback) => {
        if (finished) return;
        finished = true;
        window.clearTimeout(timeout);
        await cleanup();
        callback();
      };

      const timeout = window.setTimeout(() => {
        finish(() => reject(new Error('O aparelho demorou demais para concluir o registro das notificações. Tente novamente.')));
      }, 20000);

      registrationHandle = await PushNotifications.addListener('registration', async (registration) => {
        try {
          const token = String(registration?.value || '').trim();
          if (!token) throw new Error('O Android não retornou um token de notificações válido.');

          window.localStorage.setItem(NATIVE_PUSH_TOKEN_KEY, token);
          window.localStorage.setItem(NATIVE_PUSH_ENABLED_KEY, 'true');

          try {
            await registerTarget(idToken, token);
            window.localStorage.setItem(NATIVE_PUSH_SERVER_LINKED_KEY, 'true');
          } catch (serverError) {
            window.localStorage.setItem(NATIVE_PUSH_SERVER_LINKED_KEY, 'false');
            console.warn('Token FCM obtido, mas o backend ainda não pôde vinculá-lo:', cleanServerError(serverError, 'backend indisponível'));
          }

          await finish(() => resolve(token));
        } catch (error) {
          await finish(() => reject(cleanServerError(error, 'Não foi possível ativar as notificações neste aparelho.')));
        }
      });

      errorHandle = await PushNotifications.addListener('registrationError', async (error) => {
        const message = String(error?.error || error?.message || 'Falha ao registrar notificações no Android.');
        await finish(() => reject(new Error(message)));
      });

      try {
        await PushNotifications.register();
      } catch (error) {
        await finish(() => reject(error));
      }
    });
  })();

  try {
    return await registrationPromise;
  } finally {
    registrationPromise = null;
  }
}

export async function getNativeScaleNotificationStatus() {
  if (!isNativeAndroid()) {
    return { supported: false, configured: false, permission: 'unsupported', enabled: false };
  }

  try {
    const permission = await permissionStatus(false);
    const token = getNativePushDiagnosticToken();
    return {
      supported: true,
      configured: true,
      permission,
      enabled: permission === 'granted' && preferenceEnabled(),
      native: true,
      token,
      serverLinked: window.localStorage.getItem(NATIVE_PUSH_SERVER_LINKED_KEY) === 'true',
    };
  } catch {
    return { supported: false, configured: false, permission: 'unsupported', enabled: false, native: true, token: '', serverLinked: false };
  }
}

export async function enableNativeScaleNotifications() {
  return registerNativePush({ requestPermission: true });
}

export async function disableNativeScaleNotifications() {
  if (!isNativeAndroid()) return;
  const token = getNativePushDiagnosticToken();

  try {
    if (token) {
      const idToken = await currentIdToken();
      await unregisterTarget(idToken, token);
    }
  } catch (error) {
    console.warn('Não foi possível remover o vínculo de push nativo no servidor:', error);
  }

  try {
    await PushNotifications.unregister();
  } catch (error) {
    console.warn('Não foi possível remover o token FCM do Android:', error);
  }

  window.localStorage.setItem(NATIVE_PUSH_ENABLED_KEY, 'false');
  window.localStorage.setItem(NATIVE_PUSH_SERVER_LINKED_KEY, 'false');
  window.localStorage.removeItem(NATIVE_PUSH_TOKEN_KEY);
}

function navigateNativePath(path) {
  if (!path.startsWith('/')) return;

  const nextUrl = new URL(path, window.location.origin);
  const nextPath = `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`;
  const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (nextPath === currentPath) return;

  window.history.pushState(window.history.state, '', nextPath);
  window.dispatchEvent(new PopStateEvent('popstate', { state: window.history.state }));
}

function refreshNativeRegistration() {
  if (!preferenceEnabled()) return;
  registerNativePush().catch((error) => console.warn('Falha ao atualizar o token FCM nativo:', error));
}

export async function startNativeScaleNotificationRuntime() {
  if (!isNativeAndroid()) return () => {};

  if (preferenceEnabled()) {
    refreshNativeRegistration();
  }

  if (runtimeCleanup) return runtimeCleanup;

  const actionHandle = await PushNotifications.addListener('pushNotificationActionPerformed', (event) => {
    const data = event?.notification?.data || {};
    const path = String(data.path || '/minhas-escalas');
    navigateNativePath(path);
  });

  const handleVisibility = () => {
    if (document.visibilityState === 'visible') refreshNativeRegistration();
  };
  const handleFocus = () => refreshNativeRegistration();

  document.addEventListener('visibilitychange', handleVisibility);
  window.addEventListener('focus', handleFocus);

  runtimeCleanup = () => {
    actionHandle.remove().catch(() => undefined);
    document.removeEventListener('visibilitychange', handleVisibility);
    window.removeEventListener('focus', handleFocus);
    runtimeCleanup = null;
  };

  return runtimeCleanup;
}