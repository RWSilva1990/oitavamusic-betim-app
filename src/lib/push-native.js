import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { getFirebaseAuth } from './firebase';
import {
  registerPushInstallation,
  unregisterPushInstallation,
} from './push-notifications.functions';

const NATIVE_PUSH_ENABLED_KEY = 'oitava:native-push-enabled';
const NATIVE_PUSH_TOKEN_KEY = 'oitava:native-push-token';
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

async function currentIdToken() {
  const { auth } = await getFirebaseAuth();
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('Sua sessão expirou. Entre novamente no aplicativo.');
  return currentUser.getIdToken(true);
}

function cleanServerError(error, fallback) {
  const message = String(error?.message || error || '');
  if (message.includes('<!doctype html') || message.includes('<html')) return new Error(fallback);
  return error instanceof Error ? error : new Error(message || fallback);
}

async function permissionStatus(requestPermission = false) {
  let permission = await PushNotifications.checkPermissions();
  if (permission.receive === 'prompt' && requestPermission) {
    permission = await PushNotifications.requestPermissions();
  }
  return permission.receive;
}

async function relinkStoredNativePush() {
  if (!preferenceEnabled()) return false;
  const token = String(window.localStorage.getItem(NATIVE_PUSH_TOKEN_KEY) || '').trim();
  if (!token) return false;

  const idToken = await currentIdToken();
  await registerPushInstallation({ data: { idToken, token } });
  return true;
}

export async function relinkNativePushForCurrentUser() {
  if (!isNativeAndroid() || !preferenceEnabled()) return false;
  const permission = await permissionStatus(false);
  if (permission !== 'granted') return false;
  return relinkStoredNativePush();
}

export async function unlinkNativePushForCurrentUser() {
  if (!isNativeAndroid() || !preferenceEnabled()) return false;
  const token = String(window.localStorage.getItem(NATIVE_PUSH_TOKEN_KEY) || '').trim();
  if (!token) return false;

  const idToken = await currentIdToken();
  await unregisterPushInstallation({ data: { idToken, token } });
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

          await registerPushInstallation({ data: { idToken, token } });
          window.localStorage.setItem(NATIVE_PUSH_TOKEN_KEY, token);
          window.localStorage.setItem(NATIVE_PUSH_ENABLED_KEY, 'true');
          await finish(() => resolve(token));
        } catch (error) {
          await finish(() => reject(cleanServerError(error, 'Não foi possível vincular este aparelho às notificações.')));
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
    return {
      supported: true,
      configured: true,
      permission,
      enabled: permission === 'granted' && preferenceEnabled(),
      native: true,
    };
  } catch {
    return { supported: false, configured: false, permission: 'unsupported', enabled: false, native: true };
  }
}

export async function enableNativeScaleNotifications() {
  return registerNativePush({ requestPermission: true });
}

export async function disableNativeScaleNotifications() {
  if (!isNativeAndroid()) return;
  const token = window.localStorage.getItem(NATIVE_PUSH_TOKEN_KEY) || '';

  try {
    if (token) {
      const idToken = await currentIdToken();
      await unregisterPushInstallation({ data: { idToken, token } });
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
  window.localStorage.removeItem(NATIVE_PUSH_TOKEN_KEY);
}

export async function startNativeScaleNotificationRuntime() {
  if (!isNativeAndroid()) return () => {};

  if (preferenceEnabled()) {
    try {
      await relinkNativePushForCurrentUser();
    } catch (error) {
      console.warn('Falha ao reassociar notificações nativas:', error);
    }
    registerNativePush().catch((error) => console.warn('Falha ao renovar notificações nativas:', error));
  }

  if (runtimeCleanup) return runtimeCleanup;

  const actionHandle = await PushNotifications.addListener('pushNotificationActionPerformed', (event) => {
    const data = event?.notification?.data || {};
    const path = String(data.path || '/minhas-escalas');
    if (path.startsWith('/')) window.location.assign(path);
  });

  runtimeCleanup = () => {
    actionHandle.remove().catch(() => undefined);
    runtimeCleanup = null;
  };

  return runtimeCleanup;
}
