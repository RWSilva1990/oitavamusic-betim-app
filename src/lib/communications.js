import { Capacitor } from '@capacitor/core';
import { getFirebaseAuth } from './firebase';

const DEFAULT_API_BASE_URL = 'https://oitavamusicbetim.vercel.app';

function isPackagedNativeApp() {
  return typeof window !== 'undefined'
    && Capacitor.isNativePlatform()
    && window.location.hostname === 'localhost';
}

function apiBaseUrl() {
  if (!isPackagedNativeApp()) return '';
  const configured = String(import.meta.env.VITE_MOBILE_API_BASE_URL || '').trim();
  return (configured || DEFAULT_API_BASE_URL).replace(/\/$/, '');
}

async function currentIdToken() {
  const { auth } = await getFirebaseAuth();
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('Sua sessão expirou. Entre novamente no aplicativo.');
  return currentUser.getIdToken(true);
}

async function requestCommunications(payload) {
  const idToken = await currentIdToken();
  const response = await fetch(`${apiBaseUrl()}/api/mobile/communications`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(String(data?.message || data?.error || 'Não foi possível acessar os comunicados.'));
  }
  return data;
}

export function getCommunicationsInbox() {
  return requestCommunications({ action: 'inbox' });
}

export function getSentCommunications() {
  return requestCommunications({ action: 'sent' });
}

export function markCommunicationRead(communicationId) {
  return requestCommunications({ action: 'mark-read', communicationId });
}

export function sendCommunication({ title, message, groupIds = [], memberIds = [] }) {
  return requestCommunications({ action: 'send', title, message, groupIds, memberIds });
}
