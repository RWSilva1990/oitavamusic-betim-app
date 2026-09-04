import { getFirebaseAuth } from './firebase';
import { isPackagedNativeApp } from './mobile-api';

const DEFAULT_API_BASE_URL = 'https://oitavamusicbetim.vercel.app';

export const DEFAULT_NOTIFICATION_PREFERENCES = {
  noticeScaleAdded: true,
  noticeScaleRemoved: true,
  noticeRoleChanged: true,
  noticeRepertoireChanged: true,
  noticeSongDetailsChanged: true,
  reminder7Days: false,
  reminder3Days: true,
  reminder1Day: true,
  reminderSameDay: false,
};

function endpoint() {
  if (!isPackagedNativeApp()) return '/api/mobile/notifications';
  const configured = String(import.meta.env.VITE_MOBILE_API_BASE_URL || '').trim();
  const base = (configured || DEFAULT_API_BASE_URL).replace(/\/$/, '');
  return `${base}/api/mobile/notifications`;
}

async function currentIdToken() {
  const { auth } = await getFirebaseAuth();
  if (!auth.currentUser) throw new Error('Sua sessão expirou. Entre novamente no aplicativo.');
  return auth.currentUser.getIdToken(true);
}

async function request(body, fallback) {
  const idToken = await currentIdToken();
  const response = await fetch(endpoint(), {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(payload?.error || fallback || 'Não foi possível concluir a operação.');
  return payload;
}

export async function getNotificationPreferences() {
  const result = await request({ action: 'get-preferences' }, 'Não foi possível carregar suas preferências.');
  return { ...DEFAULT_NOTIFICATION_PREFERENCES, ...(result?.preferences || {}) };
}

export async function saveNotificationPreferences(preferences) {
  const value = { ...DEFAULT_NOTIFICATION_PREFERENCES, ...(preferences || {}) };
  const result = await request(
    { action: 'save-preferences', preferences: value },
    'Não foi possível salvar suas preferências.',
  );
  return { ...DEFAULT_NOTIFICATION_PREFERENCES, ...(result?.preferences || value) };
}

export async function sendScaleEventNotification(type, scale, memberIds, detail) {
  const ids = [...new Set((memberIds || []).filter(Boolean))];
  if (ids.length === 0) return { sent: 0, failed: 0, devices: 0, recipients: 0 };
  return request({
    action: 'notify-scale-event',
    type,
    scale: { id: scale.id, name: scale.name, date: scale.date },
    memberIds: ids,
    ...(detail ? { detail } : {}),
  }, 'A escala foi salva, mas um dos avisos não pôde ser enviado.');
}
