import { createHash } from 'node:crypto';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getMessaging } from 'firebase-admin/messaging';
import {
  firestoreDocumentPath,
  firestoreRest,
  firestoreString,
  stringFields,
} from './firestore-rest.functions';

export type NotificationPreferences = {
  noticeScaleAdded: boolean;
  noticeScaleRemoved: boolean;
  noticeRoleChanged: boolean;
  noticeRepertoireChanged: boolean;
  noticeSongDetailsChanged: boolean;
  reminder7Days: boolean;
  reminder3Days: boolean;
  reminder1Day: boolean;
  reminderSameDay: boolean;
};

export type ScaleNoticeType =
  | 'scale-added'
  | 'scale-removed'
  | 'role-changed'
  | 'repertoire-changed'
  | 'song-details-changed';

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
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

function env(name: string) {
  return process.env[name]?.trim() || '';
}

function normalizeEmail(value: unknown) {
  return String(value || '').trim().toLowerCase();
}

function adminEmails() {
  return (env('ADMIN_EMAILS') || env('VITE_ADMIN_EMAILS'))
    .split(',')
    .map((email) => normalizeEmail(email))
    .filter(Boolean);
}

function getCenterApp() {
  const existing = getApps().find((app) => app.name === 'oitava-notification-center');
  if (existing) return existing;

  const raw = env('FIREBASE_ADMIN_SERVICE_ACCOUNT');
  if (!raw) throw new Error('FIREBASE_ADMIN_SERVICE_ACCOUNT não está configurada.');

  let serviceAccount: Record<string, string>;
  try {
    serviceAccount = JSON.parse(raw);
  } catch {
    throw new Error('FIREBASE_ADMIN_SERVICE_ACCOUNT não contém um JSON válido.');
  }

  const projectId = serviceAccount.project_id || serviceAccount.projectId || env('FIREBASE_PROJECT_ID');
  const clientEmail = serviceAccount.client_email || serviceAccount.clientEmail;
  const privateKey = (serviceAccount.private_key || serviceAccount.privateKey || '').replace(/\\n/g, '\n');
  if (!projectId || !clientEmail || !privateKey) throw new Error('A credencial do Firebase Admin está incompleta.');

  return initializeApp({ credential: cert({ projectId, clientEmail, privateKey }), projectId }, 'oitava-notification-center');
}

async function verifyCaller(idToken: string) {
  const app = getCenterApp();
  const decoded = await getAuth(app).verifyIdToken(idToken, true);
  const email = normalizeEmail(decoded.email);
  if (!email) throw new Error('Não foi possível identificar o usuário autenticado.');
  return { app, uid: decoded.uid, email };
}

async function assertAdmin(idToken: string) {
  const caller = await verifyCaller(idToken);
  if (adminEmails().includes(caller.email)) return caller;
  const access = await firestoreRest(
    caller.app,
    `/accessUsers/${encodeURIComponent(caller.email)}`,
    {},
    { allowNotFound: true },
  );
  if (firestoreString(access, 'role') !== 'admin') {
    throw new Error('Apenas administradores podem disparar avisos de escala.');
  }
  return caller;
}

async function readCentralArray(app: ReturnType<typeof getCenterApp>, key: string) {
  const document = await firestoreRest(app, `/oitava/${encodeURIComponent(key)}`, {}, { allowNotFound: true });
  const raw = firestoreString(document, 'data');
  if (!raw) return [] as Array<Record<string, any>>;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [] as Array<Record<string, any>>;
  }
}

async function resolveMemberId(app: ReturnType<typeof getCenterApp>, email: string) {
  const [access, members] = await Promise.all([
    firestoreRest(app, `/accessUsers/${encodeURIComponent(email)}`, {}, { allowNotFound: true }),
    readCentralArray(app, 'members'),
  ]);
  const accessMemberId = firestoreString(access, 'memberId');
  const emailMatch = members.find((member) => normalizeEmail(member?.email) === email);
  const emailMemberId = typeof emailMatch?.id === 'string' ? emailMatch.id : '';
  if (!accessMemberId) return emailMemberId;
  const linked = members.find((member) => member?.id === accessMemberId);
  const linkedEmail = normalizeEmail(linked?.email);
  if (!linked || !linkedEmail || linkedEmail === email) return accessMemberId;
  return emailMemberId || accessMemberId;
}

function firestoreBoolean(document: any, field: string) {
  const value = document?.fields?.[field];
  if (typeof value?.booleanValue === 'boolean') return value.booleanValue;
  if (typeof value?.stringValue === 'string') {
    if (value.stringValue === 'true') return true;
    if (value.stringValue === 'false') return false;
  }
  return undefined;
}

function normalizedPreferences(value: unknown): NotificationPreferences {
  const source = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  const result = { ...DEFAULT_NOTIFICATION_PREFERENCES };
  for (const key of Object.keys(result) as Array<keyof NotificationPreferences>) {
    if (typeof source[key] === 'boolean') result[key] = source[key] as boolean;
  }
  return result;
}

function preferencesFromDocument(document: any): NotificationPreferences {
  const result = { ...DEFAULT_NOTIFICATION_PREFERENCES };
  for (const key of Object.keys(result) as Array<keyof NotificationPreferences>) {
    const stored = firestoreBoolean(document, key);
    if (typeof stored === 'boolean') result[key] = stored;
  }
  return result;
}

async function preferencesForMember(app: ReturnType<typeof getCenterApp>, memberId: string) {
  const document = await firestoreRest(
    app,
    `/notificationPreferences/${encodeURIComponent(memberId)}`,
    {},
    { allowNotFound: true },
  );
  return preferencesFromDocument(document);
}

export async function getNotificationPreferencesForToken(idToken: string) {
  const caller = await verifyCaller(idToken);
  const memberId = await resolveMemberId(caller.app, caller.email);
  if (!memberId) throw new Error('Seu e-mail ainda não está vinculado a um membro do ministério.');
  return { memberId, preferences: await preferencesForMember(caller.app, memberId) };
}

export async function saveNotificationPreferencesForToken(idToken: string, value: unknown) {
  const caller = await verifyCaller(idToken);
  const memberId = await resolveMemberId(caller.app, caller.email);
  if (!memberId) throw new Error('Seu e-mail ainda não está vinculado a um membro do ministério.');
  const preferences = normalizedPreferences(value);
  await firestoreRest(caller.app, `/notificationPreferences/${encodeURIComponent(memberId)}`, {
    method: 'PATCH',
    body: JSON.stringify(stringFields({
      memberId,
      email: caller.email,
      uid: caller.uid,
      updatedAt: new Date().toISOString(),
      ...Object.fromEntries(
        Object.entries(preferences).map(([key, enabled]) => [key, enabled ? 'true' : 'false']),
      ),
    })),
  });
  return { success: true, memberId, preferences };
}

function preferenceKeyForNotice(type: ScaleNoticeType): keyof NotificationPreferences {
  if (type === 'scale-added') return 'noticeScaleAdded';
  if (type === 'scale-removed') return 'noticeScaleRemoved';
  if (type === 'role-changed') return 'noticeRoleChanged';
  if (type === 'repertoire-changed') return 'noticeRepertoireChanged';
  return 'noticeSongDetailsChanged';
}

async function filterByPreference(
  app: ReturnType<typeof getCenterApp>,
  memberIds: string[],
  key: keyof NotificationPreferences,
) {
  const unique = [...new Set(memberIds.filter(Boolean))];
  const allowed: string[] = [];
  for (const memberId of unique) {
    const preferences = await preferencesForMember(app, memberId);
    if (preferences[key]) allowed.push(memberId);
  }
  return allowed;
}

type PushTarget = { token: string; memberId: string; path: string };

function nativeTargetFromDocument(document: any): PushTarget | null {
  const token = firestoreString(document, 'token')
    || (firestoreString(document, 'targetType') === 'token' ? firestoreString(document, 'target') : '');
  const memberId = firestoreString(document, 'memberId');
  const path = firestoreDocumentPath(document);
  if (!token || !memberId || !path) return null;
  return { token, memberId, path };
}

async function nativeTargets(app: ReturnType<typeof getCenterApp>, memberIds: string[]) {
  const unique = [...new Set(memberIds.filter(Boolean))];
  const found = new Map<string, PushTarget>();
  for (let i = 0; i < unique.length; i += 25) {
    const chunk = unique.slice(i, i + 25);
    const rows = await firestoreRest(app, ':runQuery', {
      method: 'POST',
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: 'pushInstallations' }],
          where: {
            fieldFilter: {
              field: { fieldPath: 'memberId' },
              op: 'IN',
              value: {
                arrayValue: {
                  values: chunk.map((memberId) => ({ stringValue: memberId })),
                },
              },
            },
          },
        },
      }),
    });
    for (const row of Array.isArray(rows) ? rows : []) {
      const target = nativeTargetFromDocument(row?.document);
      if (target) found.set(target.token, target);
    }
  }
  return [...found.values()];
}

function isStaleTargetError(code: string) {
  return code.includes('registration-token-not-registered')
    || code.includes('invalid-registration-token')
    || code.includes('installation-id-not-registered');
}

async function sendNative(
  app: ReturnType<typeof getCenterApp>,
  memberIds: string[],
  notification: { type: string; title: string; body: string; path: string; scaleId: string },
) {
  const targets = await nativeTargets(app, memberIds);
  let sent = 0;
  let failed = 0;
  const sentMembers = new Set<string>();
  const stalePaths = new Set<string>();

  for (let i = 0; i < targets.length; i += 500) {
    const entries = targets.slice(i, i + 500);
    const response = await getMessaging(app).sendEachForMulticast({
      tokens: entries.map((entry) => entry.token),
      notification: { title: notification.title, body: notification.body },
      data: {
        type: notification.type,
        title: notification.title,
        body: notification.body,
        path: notification.path,
        url: `${(env('APP_URL') || 'https://oitavamusicbetim.vercel.app').replace(/\/$/, '')}${notification.path}`,
        scaleId: notification.scaleId,
      },
      android: {
        priority: 'high',
        notification: { channelId: 'escala-alerts', sound: 'default' },
      },
    });
    sent += response.successCount;
    failed += response.failureCount;
    response.responses.forEach((item, index) => {
      const entry = entries[index];
      if (item.success) sentMembers.add(entry.memberId);
      else if (isStaleTargetError(String(item.error?.code || ''))) stalePaths.add(entry.path);
    });
  }

  if (stalePaths.size > 0) {
    await Promise.all(
      [...stalePaths].map((path) => firestoreRest(app, `/${path}`, { method: 'DELETE' }).catch(() => undefined)),
    );
  }

  return { sent, failed, devices: targets.length, sentMemberIds: [...sentMembers] };
}

function formatScaleDate(date: string) {
  const [year, month, day] = date.split('-');
  return `${day}/${month}/${year}`;
}

function noticeContent(
  type: ScaleNoticeType,
  scale: { id: string; name: string; date: string },
  detail?: { songName?: string; roleLabel?: string },
) {
  if (type === 'scale-added') return {
    title: 'Você foi escalado! 🎵',
    body: `Você foi incluído na escala “${scale.name}” de ${formatScaleDate(scale.date)}.`,
    path: `/minhas-escalas?escala=${encodeURIComponent(scale.id)}`,
  };
  if (type === 'scale-removed') return {
    title: 'Você foi removido da escala',
    body: `Você não está mais na escala “${scale.name}” de ${formatScaleDate(scale.date)}.`,
    path: '/minhas-escalas',
  };
  if (type === 'role-changed') return {
    title: 'Sua função na escala foi alterada',
    body: detail?.roleLabel
      ? `Sua função em “${scale.name}” foi atualizada para ${detail.roleLabel}.`
      : `Sua função em “${scale.name}” foi atualizada.`,
    path: `/minhas-escalas?escala=${encodeURIComponent(scale.id)}`,
  };
  if (type === 'repertoire-changed') return {
    title: 'Repertório atualizado 🎵',
    body: `O repertório da escala “${scale.name}” foi alterado. Toque para conferir.`,
    path: `/minhas-escalas?escala=${encodeURIComponent(scale.id)}`,
  };
  return {
    title: 'Tom ou solista atualizado',
    body: detail?.songName
      ? `Houve alteração de tom ou solista em “${detail.songName}” na escala “${scale.name}”.`
      : `Houve alteração de tom ou solista na escala “${scale.name}”.`,
    path: `/minhas-escalas?escala=${encodeURIComponent(scale.id)}`,
  };
}

export async function notifyScaleEventForToken(
  idToken: string,
  input: {
    type: ScaleNoticeType;
    scale: { id: string; name: string; date: string };
    memberIds: string[];
    detail?: { songName?: string; roleLabel?: string };
  },
) {
  const caller = await assertAdmin(idToken);
  const allowed = await filterByPreference(caller.app, input.memberIds, preferenceKeyForNotice(input.type));
  if (allowed.length === 0) return { success: true, sent: 0, failed: 0, devices: 0, recipients: 0 };
  const content = noticeContent(input.type, input.scale, input.detail);
  const result = await sendNative(caller.app, allowed, {
    type: input.type,
    title: content.title,
    body: content.body,
    path: content.path,
    scaleId: input.scale.id,
  });
  return { success: true, ...result, recipients: allowed.length };
}

function saoPauloDateISO() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function dayDifference(date: string, today: string) {
  const toUtc = (value: string) => {
    const [year, month, day] = value.split('-').map(Number);
    return Date.UTC(year, month - 1, day);
  };
  return Math.round((toUtc(date) - toUtc(today)) / 86400000);
}

function reminderPreference(days: number): keyof NotificationPreferences | null {
  if (days === 7) return 'reminder7Days';
  if (days === 3) return 'reminder3Days';
  if (days === 1) return 'reminder1Day';
  if (days === 0) return 'reminderSameDay';
  return null;
}

function reminderContent(scale: { id: string; name: string; date: string }, days: number) {
  const title = days === 0
    ? 'Sua escala é hoje 🎵'
    : days === 1
      ? 'Sua escala é amanhã 🎵'
      : `Sua escala é daqui a ${days} dias 🎵`;
  const body = `“${scale.name}” está marcada para ${formatScaleDate(scale.date)}. Confira o repertório e sua função.`;
  return { title, body, path: `/minhas-escalas?escala=${encodeURIComponent(scale.id)}` };
}

function deliveryId(scaleId: string, memberId: string, days: number, date: string) {
  return createHash('sha256').update(`${scaleId}|${memberId}|${days}|${date}`).digest('hex');
}

async function reminderAlreadyDelivered(app: ReturnType<typeof getCenterApp>, id: string) {
  return Boolean(await firestoreRest(
    app,
    `/notificationReminderDeliveries/${encodeURIComponent(id)}`,
    {},
    { allowNotFound: true },
  ));
}

async function markReminderDelivered(
  app: ReturnType<typeof getCenterApp>,
  id: string,
  values: { scaleId: string; memberId: string; daysBefore: number; scaleDate: string },
) {
  await firestoreRest(app, `/notificationReminderDeliveries/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(stringFields({
      scaleId: values.scaleId,
      memberId: values.memberId,
      daysBefore: String(values.daysBefore),
      scaleDate: values.scaleDate,
      sentAt: new Date().toISOString(),
    })),
  });
}

export async function runScaleReminderSweep() {
  const app = getCenterApp();
  let scales = await readCentralArray(app, 'scales');
  if (!Array.isArray(scales)) scales = [];

  const today = saoPauloDateISO();
  let sent = 0;
  let failed = 0;
  let evaluated = 0;

  for (const scale of scales) {
    if (!scale?.id || !scale?.name || !/^\d{4}-\d{2}-\d{2}$/.test(String(scale.date || ''))) continue;
    const days = dayDifference(String(scale.date), today);
    const preferenceKey = reminderPreference(days);
    if (!preferenceKey) continue;
    const memberIds = [...new Set(
      (scale.scaleMembers || []).map((item: any) => String(item?.memberId || '')).filter(Boolean),
    )] as string[];
    if (memberIds.length === 0) continue;
    evaluated += memberIds.length;

    const allowed = await filterByPreference(app, memberIds, preferenceKey);
    const pending: string[] = [];
    for (const memberId of allowed) {
      const id = deliveryId(scale.id, memberId, days, scale.date);
      if (!(await reminderAlreadyDelivered(app, id))) pending.push(memberId);
    }
    if (pending.length === 0) continue;

    const content = reminderContent(scale as { id: string; name: string; date: string }, days);
    const result = await sendNative(app, pending, {
      type: 'scale-reminder',
      title: content.title,
      body: content.body,
      path: content.path,
      scaleId: scale.id,
    });
    sent += result.sent;
    failed += result.failed;

    await Promise.all(result.sentMemberIds.map((memberId) => {
      const id = deliveryId(scale.id, memberId, days, scale.date);
      return markReminderDelivered(app, id, {
        scaleId: scale.id,
        memberId,
        daysBefore: days,
        scaleDate: scale.date,
      });
    }));
  }

  const result = { success: true, date: today, evaluated, sent, failed };
  console.info('[scale-reminders]', JSON.stringify(result));
  return result;
}
