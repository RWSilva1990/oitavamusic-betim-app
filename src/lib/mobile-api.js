import { Capacitor } from '@capacitor/core';

const DEFAULT_API_BASE_URL = 'https://oitavamusicbetim.vercel.app';

export function isPackagedNativeApp() {
  return typeof window !== 'undefined'
    && Capacitor.isNativePlatform()
    && window.location.hostname === 'localhost';
}

export function isDirectFirebaseTestMode() {
  return isPackagedNativeApp()
    && import.meta.env.VITE_ANDROID_TEST_DIRECT_FIREBASE === 'true';
}

function assertMobileBackendAllowed() {
  if (isDirectFirebaseTestMode()) {
    throw new Error('Backend móvel de produção bloqueado no ambiente de teste.');
  }
}

function apiBaseUrl() {
  assertMobileBackendAllowed();
  const configured = String(import.meta.env.VITE_MOBILE_API_BASE_URL || '').trim();
  return (configured || DEFAULT_API_BASE_URL).replace(/\/$/, '');
}

function apiUrl(path) {
  return `${apiBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`;
}

async function parseJsonResponse(response, fallbackMessage) {
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message = payload?.message || payload?.error || fallbackMessage || `HTTP ${response.status}`;
    throw new Error(String(message));
  }
  return payload;
}

async function mobilePost(path, idToken, body, fallbackMessage) {
  const response = await fetch(apiUrl(path), {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(body),
  });
  return parseJsonResponse(response, fallbackMessage);
}

export async function getMobileFirebaseConfig() {
  const response = await fetch(apiUrl('/api/mobile/config'), {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });
  return parseJsonResponse(response, 'Não foi possível carregar a configuração do aplicativo.');
}

export async function getMobileMemberData(idToken) {
  return mobilePost(
    '/api/mobile/member-data',
    idToken,
    {},
    'Não foi possível carregar os dados do membro.',
  );
}

export async function getMobileAdminData(idToken) {
  return mobilePost(
    '/api/mobile/admin-data',
    idToken,
    { action: 'load' },
    'Não foi possível carregar os dados administrativos.',
  );
}

export async function saveMobileAdminData(idToken, key, data) {
  return mobilePost(
    '/api/mobile/admin-data',
    idToken,
    { action: 'save', key, data },
    'Não foi possível salvar os dados administrativos.',
  );
}

export async function registerMobilePush(idToken, target) {
  return mobilePost(
    '/api/mobile/push',
    idToken,
    { action: 'register', target },
    'Não foi possível vincular este aparelho às notificações.',
  );
}

export async function unregisterMobilePush(idToken, target) {
  return mobilePost(
    '/api/mobile/push',
    idToken,
    { action: 'unregister', target },
    'Não foi possível remover o vínculo de notificações.',
  );
}

export async function notifyMobileScaleAdded(idToken, scale, addedMemberIds) {
  return mobilePost(
    '/api/mobile/push',
    idToken,
    {
      action: 'notify-scale-added',
      scale: { id: scale.id, name: scale.name, date: scale.date },
      addedMemberIds,
    },
    'A escala foi salva, mas não foi possível enviar as notificações.',
  );
}

export async function notifyMobileScaleRemoved(idToken, scale, removedMemberIds) {
  return mobilePost(
    '/api/mobile/push',
    idToken,
    {
      action: 'notify-scale-removed',
      scale: { id: scale.id, name: scale.name, date: scale.date },
      removedMemberIds,
    },
    'A escala foi salva, mas não foi possível enviar a notificação de remoção.',
  );
}

export async function sendMobileInvitation(idToken, email) {
  return mobilePost(
    '/api/mobile/invite',
    idToken,
    { email },
    'Não foi possível enviar o convite.',
  );
}
