import { Capacitor } from '@capacitor/core';

const DEFAULT_API_BASE_URL = 'https://oitavamusicbetim.vercel.app';

export function isPackagedNativeApp() {
  return typeof window !== 'undefined'
    && Capacitor.isNativePlatform()
    && window.location.hostname === 'localhost';
}

function apiBaseUrl() {
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

export async function getMobileFirebaseConfig() {
  const response = await fetch(apiUrl('/api/mobile/config'), {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });
  return parseJsonResponse(response, 'Não foi possível carregar a configuração do aplicativo.');
}

export async function getMobileMemberData(idToken) {
  const response = await fetch(apiUrl('/api/mobile/member-data'), {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
  });
  return parseJsonResponse(response, 'Não foi possível carregar os dados do membro.');
}
