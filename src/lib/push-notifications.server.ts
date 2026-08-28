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

function env(name: string) {
  return process.env[name]?.trim() || '';
}

function normalizeEmail(value: unknown) {
  return String(value || '').trim().toLowerCase();
}

function adminEmails() {
  return env('ADMIN_EMAILS')
    .split(',')
    .map((email) => normalizeEmail(email))
    .filter(Boolean);
}

function getPushAdminApp() {
  const existing = getApps().find((app) => app.name === 'oitava-push');
  if (existing) return existing;

  const raw = env('FIREBASE_ADMIN_SERVICE_ACCOUNT');
  if (!raw) throw new Error('FIREBASE_ADMIN_SERVICE_ACCOUNT não está configurada na Vercel.');

  let serviceAccount: Record<string, string>;
  try {
    serviceAccount = JSON.parse(raw);
  } catch {
    throw new Error('FIREBASE_ADMIN_SERVICE_ACCOUNT não contém um JSON válido.');
  }

  const projectId = serviceAccount.project_id || serviceAccount.projectId || env('FIREBASE_PROJECT_ID');
  const clientEmail = serviceAccount.client_email || serviceAccount.clientEmail;
  const privateKey = (serviceAccount.private_key || serviceAccount.privateKey || '').replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('A credencial do Firebase Admin está incompleta.');
  }

  return initializeApp(
    {
      credential: cert({ projectId, clientEmail, privateKey }),
      projectId,
    },
    'oitava-push',
  );
}

async function verifyCaller(idToken: string) {
  const app = getPushAdminApp();
  const decoded = await getAuth(app).verifyIdToken(idToken, true);
  const email = normalizeEmail(decoded.email);
  if (!email) throw new Error('Não foi possível identificar o usuário autenticado.');
  return { app, email, uid: decoded.uid };
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
    throw new Error('Apenas administradores autorizados podem disparar notificações de escala.');
  }

  return caller;
}

function installationTarget(data: { fid?: string; token?: string }) {
  const token = String(data.token || '').trim();
  const fid = String(data.fid || '').trim();
  if (Boolean(token) === Boolean(fid)) {
    throw new Error('Informe exatamente um identificador de instalação.');
  }
  if (token) return { type: 'token' as const, value: token };
  return { type: 'fid' as const, value: fid };
}

function installationDocId(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

type MemberRecord = {
  id?: string;
  email?: string;
  [key: string]: unknown;
};

async function readMembers(app: ReturnType<typeof getPushAdminApp>): Promise<MemberRecord[]> {
  const membersDoc = await firestoreRest(app, '/oitava/members', {}, { allowNotFound: true });
  const raw = firestoreString(membersDoc, 'data');
  if (!raw) return [];

  try {
    const members = JSON.parse(raw);
    return Array.isArray(members) ? members : [];
  } catch {
    return [];
  }
}

async function resolveMemberId(app: ReturnType<typeof getPushAdminApp>, email: string) {
  const [access, members] = await Promise.all([
    firestoreRest(
      app,
      `/accessUsers/${encodeURIComponent(email)}`,
      {},
      { allowNotFound: true },
    ),
    readMembers(app),
  ]);

  const accessMemberId = firestoreString(access, 'memberId');
  const emailMatch = members.find((member) => normalizeEmail(member?.email) === email);

  if (accessMemberId) {
    const linked = members.find((member) => member?.id === accessMemberId);
    const linkedEmail = normalizeEmail(linked?.email);

    if (!linked || !linkedEmail || linkedEmail === email) return accessMemberId;
    if (typeof emailMatch?.id === 'string' && emailMatch.id) return emailMatch.id;
    return accessMemberId;
  }

  return typeof emailMatch?.id === 'string' ? emailMatch.id : '';
}

function formatScaleDate(date: string) {
  const [year, month, day] = date.split('-');
  return `${day}/${month}/${year}`;
}

function appUrl() {
  return (env('APP_URL') || 'https://oitavamusicbetim.vercel.app').replace(/\/$/, '');
}

type InstallationTarget = {
  value: string;
  type: 'fid' | 'token';
  path: string;
  memberId: string;
};

function installationFromDocument(document: any, memberIdOverride?: string): InstallationTarget | null {
  const path = firestoreDocumentPath(document);
  const storedMemberId = firestoreString(document, 'memberId');
  const token = firestoreString(document, 'token');
  const fid = firestoreString(document, 'fid');
  const storedTarget = firestoreString(document, 'target');
  const storedType = firestoreString(document, 'targetType');
  const value = storedTarget || token || fid;
  const type = storedType === 'token' || (!storedType && token) ? 'token' : 'fid';
  const memberId = memberIdOverride || storedMemberId;
  if (!value || !path || !memberId) return null;
  return { value, type, path, memberId };
}

async function findInstallationsByMemberIds(
  app: ReturnType<typeof getPushAdminApp>,
  memberIds: string[],
) {
  const installations = new Map<string, InstallationTarget>();

  for (let i = 0; i < memberIds.length; i += 25) {
    const chunk = memberIds.slice(i, i + 25);
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
      const installation = installationFromDocument(row?.document);
      if (installation) installations.set(installation.value, installation);
    }
  }

  const members = await readMembers(app);
  const emailToMemberId = new Map<string, string>();
  for (const memberId of memberIds) {
    const member = members.find((item) => item?.id === memberId);
    const email = normalizeEmail(member?.email);
    if (email) emailToMemberId.set(email, memberId);
  }

  const emails = [...emailToMemberId.keys()];
  for (let i = 0; i < emails.length; i += 25) {
    const chunk = emails.slice(i, i + 25);
    const rows = await firestoreRest(app, ':runQuery', {
      method: 'POST',
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: 'pushInstallations' }],
          where: {
            fieldFilter: {
              field: { fieldPath: 'email' },
              op: 'IN',
              value: {
                arrayValue: {
                  values: chunk.map((email) => ({ stringValue: email })),
                },
              },
            },
          },
        },
      }),
    });

    for (const row of Array.isArray(rows) ? rows : []) {
      const document = row?.document;
      const email = normalizeEmail(firestoreString(document, 'email'));
      const intendedMemberId = emailToMemberId.get(email);
      const installation = installationFromDocument(document, intendedMemberId);
      if (installation) installations.set(installation.value, installation);
    }
  }

  return [...installations.values()];
}

function isStaleTargetError(code: string) {
  return code.includes('installation-id-not-registered')
    || code.includes('registration-token-not-registered')
    || code.includes('invalid-registration-token');
}

export async function registerPushInstallationForToken(
  idToken: string,
  data: { fid?: string; token?: string },
) {
  const caller = await verifyCaller(idToken);
  const memberId = await resolveMemberId(caller.app, caller.email);
  if (!memberId) {
    throw new Error('Seu e-mail ainda não está vinculado a um membro do ministério.');
  }

  const target = installationTarget(data);
  const id = installationDocId(target.value);
  await firestoreRest(caller.app, `/pushInstallations/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(
      stringFields({
        target: target.value,
        targetType: target.type,
        fid: target.type === 'fid' ? target.value : '',
        token: target.type === 'token' ? target.value : '',
        memberId,
        email: caller.email,
        uid: caller.uid,
        updatedAt: new Date().toISOString(),
      }),
    ),
  });

  // O produto passou a usar notificações somente pelo aplicativo Android.
  // Ao registrar um token nativo válido, removemos inscrições Web Push antigas
  // do mesmo membro para impedir notificações do Chrome/site.
  if (target.type === 'token') {
    const existing = await findInstallationsByMemberIds(caller.app, [memberId]);
    const webPaths = existing
      .filter((installation) => installation.type === 'fid')
      .map((installation) => installation.path);
    if (webPaths.length > 0) {
      await Promise.all(
        [...new Set(webPaths)].map((webPath) =>
          firestoreRest(caller.app, `/${webPath}`, { method: 'DELETE' }).catch(() => undefined),
        ),
      );
    }
  }

  console.info('[push-register]', JSON.stringify({ memberId, targetType: target.type }));
  return { success: true, memberId, targetType: target.type };
}

export async function unregisterPushInstallationForToken(
  idToken: string,
  data: { fid?: string; token?: string },
) {
  const caller = await verifyCaller(idToken);
  const target = installationTarget(data);
  const id = installationDocId(target.value);
  const installation = await firestoreRest(
    caller.app,
    `/pushInstallations/${id}`,
    {},
    { allowNotFound: true },
  );

  if (installation) {
    const uid = firestoreString(installation, 'uid');
    const email = firestoreString(installation, 'email');
    if (uid === caller.uid || normalizeEmail(email) === caller.email) {
      await firestoreRest(caller.app, `/pushInstallations/${id}`, { method: 'DELETE' });
    }
  }

  return { success: true };
}

export async function notifyScaleMembersAddedForToken(
  idToken: string,
  scale: { id: string; name: string; date: string },
  addedMemberIds: string[],
) {
  const caller = await assertAdmin(idToken);
  const memberIds = [...new Set(addedMemberIds)].filter(Boolean);
  if (memberIds.length === 0) {
    console.info('[push-scale]', JSON.stringify({ scaleId: scale.id, memberIds: [], devices: 0, webDevices: 0, androidDevices: 0, sent: 0, failed: 0 }));
    return { success: true, sent: 0, failed: 0, devices: 0 };
  }

  const installations = await findInstallationsByMemberIds(caller.app, memberIds);
  const nativeTargets = installations.filter((item) => item.type === 'token');
  const allWebTargets = installations.filter((item) => item.type === 'fid');

  if (nativeTargets.length === 0) {
    console.info('[push-scale]', JSON.stringify({
      scaleId: scale.id,
      memberIds,
      success: true,
      sent: 0,
      failed: 0,
      devices: 0,
      webDevices: 0,
      androidDevices: 0,
      suppressedWebDevices: allWebTargets.length,
    }));
    return { success: true, sent: 0, failed: 0, devices: 0 };
  }

  const link = `${appUrl()}/minhas-escalas?escala=${encodeURIComponent(scale.id)}`;
  const path = `/minhas-escalas?escala=${encodeURIComponent(scale.id)}`;
  const title = 'Você foi escalado! 🎵';
  const body = `Você foi incluído na escala “${scale.name}” de ${formatScaleDate(scale.date)}.`;

  let sent = 0;
  let failed = 0;
  const stalePaths: string[] = [];

  for (let i = 0; i < nativeTargets.length; i += 500) {
    const entries = nativeTargets.slice(i, i + 500);
    const tokens = entries.map((item) => item.value);
    const response = await getMessaging(caller.app).sendEachForMulticast({
      tokens,
      notification: { title, body },
      data: {
        type: 'scale-added',
        title,
        body,
        url: link,
        path,
        scaleId: scale.id,
      },
      android: {
        priority: 'high',
      },
    });

    sent += response.successCount;
    failed += response.failureCount;
    response.responses.forEach((item, index) => {
      if (item.success) return;
      const code = String(item.error?.code || '');
      console.warn('[push-native-failure]', JSON.stringify({
        scaleId: scale.id,
        memberId: entries[index]?.memberId || '',
        code,
      }));
      if (isStaleTargetError(code)) stalePaths.push(entries[index].path);
    });
  }

  if (stalePaths.length > 0) {
    await Promise.all(
      [...new Set(stalePaths)].map((stalePath) =>
        firestoreRest(caller.app, `/${stalePath}`, { method: 'DELETE' }).catch(() => undefined),
      ),
    );
  }

  const result = {
    success: true,
    sent,
    failed,
    devices: nativeTargets.length,
    webDevices: 0,
    androidDevices: nativeTargets.length,
    suppressedWebDevices: allWebTargets.length,
  };

  console.info('[push-scale]', JSON.stringify({ scaleId: scale.id, memberIds, ...result }));
  return result;
}
