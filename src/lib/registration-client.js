import { getFirebaseAuth } from './firebase';
import { isPackagedNativeApp } from './mobile-api';

const DEFAULT_API_BASE_URL = 'https://oitavamusicbetim.vercel.app';

function apiBaseUrl() {
  if (!isPackagedNativeApp()) return '';
  const configured = String(import.meta.env.VITE_MOBILE_API_BASE_URL || '').trim();
  return (configured || DEFAULT_API_BASE_URL).replace(/\/$/, '');
}

async function callRegistrationApi(action, payload = {}) {
  const { auth } = await getFirebaseAuth();
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('Sessão expirada. Abra novamente o link recebido.');

  const idToken = await currentUser.getIdToken(true);
  const response = await fetch(`${apiBaseUrl()}/api/mobile/registration`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ action, ...payload }),
  });

  const result = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(result?.error || result?.message || `Não foi possível concluir o cadastro (HTTP ${response.status}).`);
  }
  return result;
}

export function submitRegistration(profile) {
  return callRegistrationApi('submit', { profile });
}

export async function listPendingRegistrations() {
  const result = await callRegistrationApi('list');
  return Array.isArray(result?.registrations) ? result.registrations : [];
}

export function acceptPendingRegistration(uid) {
  return callRegistrationApi('accept', { uid });
}
