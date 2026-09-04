import { getFirebaseAuth } from './firebase';
import { notifyScaleMembersAdded } from './push-notifications.functions';
import { isPackagedNativeApp, notifyMobileScaleRemoved } from './mobile-api';

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

export async function sendScaleRemovedNotifications(scale, removedMemberIds) {
  const ids = [...new Set((removedMemberIds || []).filter(Boolean))];
  if (ids.length === 0) return { sent: 0, failed: 0, devices: 0 };

  const idToken = await currentIdToken();
  try {
    if (isPackagedNativeApp()) {
      return await notifyMobileScaleRemoved(idToken, scale, ids);
    }

    return await notifyScaleMembersAdded({
      data: {
        idToken,
        scale: { id: scale.id, name: scale.name, date: scale.date },
        addedMemberIds: ids,
        eventType: 'removed',
      },
    });
  } catch (error) {
    throw cleanServerError(error, 'A escala foi salva, mas não foi possível enviar a notificação de remoção.');
  }
}
