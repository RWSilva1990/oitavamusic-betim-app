import { getFirebaseAuth } from './firebase';

async function currentIdToken() {
  const { auth } = await getFirebaseAuth();
  if (!auth.currentUser) throw new Error('Sua sessão expirou. Entre novamente no aplicativo.');
  return auth.currentUser.getIdToken(true);
}

export async function sendScaleEventNotification(type, scale, memberIds, detail) {
  const ids = [...new Set((memberIds || []).filter(Boolean))];
  if (ids.length === 0) return { sent: 0, failed: 0, devices: 0, recipients: 0 };

  const idToken = await currentIdToken();
  const response = await fetch('/api/mobile/notifications', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({
      action: 'notify-scale-event',
      type,
      scale: { id: scale.id, name: scale.name, date: scale.date },
      memberIds: ids,
      ...(detail ? { detail } : {}),
    }),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.error || 'A escala foi salva, mas o aviso não pôde ser enviado.');
  }
  return payload;
}
