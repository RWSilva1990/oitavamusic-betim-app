import { createHash, randomUUID } from 'node:crypto';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getMessaging } from 'firebase-admin/messaging';
import {
  firestoreDocumentPath,
  firestoreRest,
  firestoreString,
  stringFields,
} from './firestore-rest.functions';

type AdminApp = ReturnType<typeof getCommunicationsApp>;

type CommunicationDelivery = {
  id: string;
  communicationId: string;
  title: string;
  message: string;
  senderName: string;
  createdAt: string;
  readAt: string;
};

type SentCommunication = {
  id: string;
  title: string;
  message: string;
  senderName: string;
  createdAt: string;
  recipientCount: number;
  groupNames: string[];
  memberNames: string[];
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

function getCommunicationsApp() {
  const existing = getApps().find((app) => app.name === 'oitava-communications');
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

  return initializeApp({ credential: cert({ projectId, clientEmail, privateKey }), projectId }, 'oitava-communications');
}

async function verifyCaller(idToken: string) {
  const app = getCommunicationsApp();
  const decoded = await getAuth(app).verifyIdToken(idToken, true);
  const email = normalizeEmail(decoded.email);
  if (!email) throw new Error('Não foi possível identificar o usuário autenticado.');
  return { app, uid: decoded.uid, email };
}

async function callerIsAdmin(app: AdminApp, email: string) {
  if (adminEmails().includes(email)) return true;
  const access = await firestoreRest(
    app,
    `/accessUsers/${encodeURIComponent(email)}`,
    {},
    { allowNotFound: true },
  );
  return firestoreString(access, 'role') === 'admin';
}

async function assertAdmin(idToken: string) {
  const caller = await verifyCaller(idToken);
  if (!(await callerIsAdmin(caller.app, caller.email))) {
    throw new Error('Apenas administradores podem enviar comunicados.');
  }
  return caller;
}

async function readCentralArray(app: AdminApp, key: string) {
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

async function resolveMemberId(app: AdminApp, email: string) {
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

function parseStringArray(value: string) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map((item) => String(item || '')).filter(Boolean) : [];
  } catch {
    return [];
  }
}

function deliveryId(communicationId: string, memberId: string) {
  return createHash('sha256').update(`${communicationId}|${memberId}`).digest('hex');
}

function documentId(document: any) {
  const path = firestoreDocumentPath(document);
  return path.split('/').pop() || '';
}

function deliveryFromDocument(document: any): CommunicationDelivery | null {
  if (!document) return null;
  const communicationId = firestoreString(document, 'communicationId');
  const title = firestoreString(document, 'title');
  if (!communicationId || !title) return null;
  return {
    id: documentId(document),
    communicationId,
    title,
    message: firestoreString(document, 'message'),
    senderName: firestoreString(document, 'senderName') || 'Administração',
    createdAt: firestoreString(document, 'createdAt'),
    readAt: firestoreString(document, 'readAt'),
  };
}

function sentFromDocument(document: any): SentCommunication | null {
  if (!document) return null;
  const id = firestoreString(document, 'communicationId') || documentId(document);
  const title = firestoreString(document, 'title');
  if (!id || !title) return null;
  return {
    id,
    title,
    message: firestoreString(document, 'message'),
    senderName: firestoreString(document, 'senderName') || 'Administração',
    createdAt: firestoreString(document, 'createdAt'),
    recipientCount: Number.parseInt(firestoreString(document, 'recipientCount') || '0', 10) || 0,
    groupNames: parseStringArray(firestoreString(document, 'groupNamesJson')),
    memberNames: parseStringArray(firestoreString(document, 'memberNamesJson')),
  };
}

async function queryByStringField(app: AdminApp, collectionId: string, field: string, value: string) {
  const rows = await firestoreRest(app, ':runQuery', {
    method: 'POST',
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId }],
        where: {
          fieldFilter: {
            field: { fieldPath: field },
            op: 'EQUAL',
            value: { stringValue: value },
          },
        },
        limit: 300,
      },
    }),
  });
  return (Array.isArray(rows) ? rows : []).map((row) => row?.document).filter(Boolean);
}

async function queryCollection(app: AdminApp, collectionId: string) {
  const rows = await firestoreRest(app, ':runQuery', {
    method: 'POST',
    body: JSON.stringify({ structuredQuery: { from: [{ collectionId }], limit: 300 } }),
  });
  return (Array.isArray(rows) ? rows : []).map((row) => row?.document).filter(Boolean);
}

type PushTarget = { token: string; memberId: string; path: string };

function targetFromDocument(document: any): PushTarget | null {
  const token = firestoreString(document, 'token')
    || (firestoreString(document, 'targetType') === 'token' ? firestoreString(document, 'target') : '');
  const memberId = firestoreString(document, 'memberId');
  const path = firestoreDocumentPath(document);
  if (!token || !memberId || !path) return null;
  return { token, memberId, path };
}

async function pushTargets(app: AdminApp, memberIds: string[]) {
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
              value: { arrayValue: { values: chunk.map((memberId) => ({ stringValue: memberId })) } },
            },
          },
        },
      }),
    });
    for (const row of Array.isArray(rows) ? rows : []) {
      const target = targetFromDocument(row?.document);
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

async function sendCommunicationPush(
  app: AdminApp,
  communication: { id: string; title: string; message: string },
  memberIds: string[],
) {
  const targets = await pushTargets(app, memberIds);
  let sent = 0;
  let failed = 0;
  const stalePaths = new Set<string>();
  const body = communication.message.length > 150
    ? `${communication.message.slice(0, 147).trimEnd()}...`
    : communication.message;
  const path = `/comunicados?comunicado=${encodeURIComponent(communication.id)}`;

  for (let i = 0; i < targets.length; i += 500) {
    const entries = targets.slice(i, i + 500);
    const response = await getMessaging(app).sendEachForMulticast({
      tokens: entries.map((entry) => entry.token),
      notification: { title: `📢 ${communication.title}`, body },
      data: {
        type: 'communication',
        title: communication.title,
        body,
        path,
        url: `${(env('APP_URL') || 'https://oitavamusicbetim.vercel.app').replace(/\/$/, '')}${path}`,
        communicationId: communication.id,
      },
      android: {
        priority: 'high',
        notification: { channelId: 'escala-alerts', sound: 'default' },
      },
    });
    sent += response.successCount;
    failed += response.failureCount;
    response.responses.forEach((item, index) => {
      if (!item.success && isStaleTargetError(String(item.error?.code || ''))) {
        stalePaths.add(entries[index].path);
      }
    });
  }

  if (stalePaths.size > 0) {
    await Promise.all(
      [...stalePaths].map((pathValue) => firestoreRest(app, `/${pathValue}`, { method: 'DELETE' }).catch(() => undefined)),
    );
  }

  return { sent, failed, devices: targets.length };
}

export async function listCommunicationsForToken(idToken: string) {
  const caller = await verifyCaller(idToken);
  const memberId = await resolveMemberId(caller.app, caller.email);
  if (!memberId) return { memberId: '', unread: 0, communications: [] as CommunicationDelivery[] };

  const documents = await queryByStringField(caller.app, 'communicationDeliveries', 'memberId', memberId);
  const communications = documents
    .map(deliveryFromDocument)
    .filter((item): item is CommunicationDelivery => Boolean(item))
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  return {
    memberId,
    unread: communications.filter((item) => !item.readAt).length,
    communications,
  };
}

export async function markCommunicationReadForToken(idToken: string, communicationId: string) {
  const caller = await verifyCaller(idToken);
  const memberId = await resolveMemberId(caller.app, caller.email);
  if (!memberId) throw new Error('Seu usuário ainda não está vinculado a um membro do ministério.');

  const id = deliveryId(communicationId, memberId);
  const document = await firestoreRest(
    caller.app,
    `/communicationDeliveries/${encodeURIComponent(id)}`,
    {},
    { allowNotFound: true },
  );
  if (!document
    || firestoreString(document, 'memberId') !== memberId
    || firestoreString(document, 'communicationId') !== communicationId) {
    throw new Error('Este comunicado não está disponível para o seu usuário.');
  }

  const readAt = firestoreString(document, 'readAt') || new Date().toISOString();
  await firestoreRest(caller.app, `/communicationDeliveries/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(stringFields({
      memberId,
      communicationId,
      title: firestoreString(document, 'title'),
      message: firestoreString(document, 'message'),
      senderName: firestoreString(document, 'senderName') || 'Administração',
      createdAt: firestoreString(document, 'createdAt'),
      readAt,
    })),
  });
  return { success: true, communicationId, readAt };
}

export async function listSentCommunicationsForToken(idToken: string) {
  const caller = await assertAdmin(idToken);
  const documents = await queryCollection(caller.app, 'communications');
  const communications = documents
    .map(sentFromDocument)
    .filter((item): item is SentCommunication => Boolean(item))
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  return { communications };
}

export async function sendCommunicationForToken(
  idToken: string,
  input: { title: string; message: string; groupIds: string[]; memberIds: string[] },
) {
  const caller = await assertAdmin(idToken);
  const [members, groups] = await Promise.all([
    readCentralArray(caller.app, 'members'),
    readCentralArray(caller.app, 'groups'),
  ]);

  const memberById = new Map(
    members
      .filter((member) => typeof member?.id === 'string' && member.id)
      .map((member) => [String(member.id), member]),
  );
  const groupById = new Map(
    groups
      .filter((group) => typeof group?.id === 'string' && group.id)
      .map((group) => [String(group.id), group]),
  );

  const selectedGroupIds = [...new Set(input.groupIds.filter((id) => groupById.has(id)))];
  const selectedMemberIds = [...new Set(input.memberIds.filter((id) => memberById.has(id)))];
  const recipientIds = new Set<string>(selectedMemberIds);
  for (const groupId of selectedGroupIds) {
    const group = groupById.get(groupId);
    for (const memberId of Array.isArray(group?.memberIds) ? group.memberIds : []) {
      const normalized = String(memberId || '');
      if (memberById.has(normalized)) recipientIds.add(normalized);
    }
  }

  const recipients = [...recipientIds];
  if (recipients.length === 0) throw new Error('Selecione pelo menos uma equipe ou um membro para receber o comunicado.');

  const title = input.title.trim();
  const message = input.message.trim();
  const id = randomUUID();
  const createdAt = new Date().toISOString();
  const senderMember = members.find((member) => normalizeEmail(member?.email) === caller.email);
  const senderName = String(senderMember?.name || '').trim() || 'Administração';
  const groupNames = selectedGroupIds.map((groupId) => String(groupById.get(groupId)?.name || '')).filter(Boolean);
  const memberNames = selectedMemberIds.map((memberId) => String(memberById.get(memberId)?.name || '')).filter(Boolean);

  await firestoreRest(caller.app, `/communications/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(stringFields({
      communicationId: id,
      title,
      message,
      senderUid: caller.uid,
      senderEmail: caller.email,
      senderName,
      createdAt,
      recipientCount: String(recipients.length),
      groupIdsJson: JSON.stringify(selectedGroupIds),
      groupNamesJson: JSON.stringify(groupNames),
      memberIdsJson: JSON.stringify(selectedMemberIds),
      memberNamesJson: JSON.stringify(memberNames),
      recipientMemberIdsJson: JSON.stringify(recipients),
    })),
  });

  await Promise.all(recipients.map((memberId) => {
    const idDelivery = deliveryId(id, memberId);
    return firestoreRest(caller.app, `/communicationDeliveries/${encodeURIComponent(idDelivery)}`, {
      method: 'PATCH',
      body: JSON.stringify(stringFields({
        communicationId: id,
        memberId,
        title,
        message,
        senderName,
        createdAt,
        readAt: '',
      })),
    });
  }));

  let push = { sent: 0, failed: 0, devices: 0 };
  let pushError = '';
  try {
    push = await sendCommunicationPush(caller.app, { id, title, message }, recipients);
  } catch (error) {
    pushError = error instanceof Error ? error.message : 'Falha ao enviar a notificação push.';
    console.error('[communications-push]', error);
  }

  return {
    success: true,
    communication: {
      id,
      title,
      message,
      senderName,
      createdAt,
      recipientCount: recipients.length,
      groupNames,
      memberNames,
    },
    push,
    pushError,
  };
}
