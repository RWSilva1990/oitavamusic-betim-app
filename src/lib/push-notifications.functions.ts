import { createHash } from 'node:crypto';
import { createServerFn } from '@tanstack/react-start';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getMessaging } from 'firebase-admin/messaging';
import { z } from 'zod';
import {
  firestoreDocumentPath,
  firestoreRest,
  firestoreString,
  stringFields,
} from './firestore-rest.functions';

const registerSchema = z.object({
  idToken: z.string().min(20),
  fid: z.string().min(8).max(600),
});

const unregisterSchema = registerSchema;

const notifySchema = z.object({
  idToken: z.string().min(20),
  scale: z.object({
    id: z.string().min(1).max(160),
    name: z.string().trim().min(1).max(180),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  }),
  addedMemberIds: z.array(z.string().min(1).max(160)).max(300),
});

function env(name: string) {
  return process.env[name]?.trim() || '';
}

function adminEmails() {
  return env('ADMIN_EMAILS')
    .split(',')
    .map((email) => email.trim().toLowerCase())
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
  const email = decoded.email?.trim().toLowerCase();
  if (!email) throw new Error('Não foi possível identificar o usuário autenticado.');
  return { app, email, uid: decoded.uid };
}

async function assertAdmin(idToken: string) {
  const caller = await verifyCaller(idToken);
  if (!adminEmails().includes(caller.email)) {
    throw new Error('Apenas administradores autorizados podem disparar notificações de escala.');
  }
  return caller;
}

function installationDocId(fid: string) {
  return createHash('sha256').update(fid).digest('hex');
}

function debugMemberId(memberId: string) {
  return createHash('sha256').update(memberId).digest('hex').slice(0, 10);
}

async function resolveMemberId(app: ReturnType<typeof getPushAdminApp>, email: string) {
  const access = await firestoreRest(
    app,
    `/accessUsers/${encodeURIComponent(email)}`,
    {},
    { allowNotFound: true },
  );
  const accessMemberId = firestoreString(access, 'memberId');
  if (accessMemberId) return accessMemberId;

  // Administradores podem ter cadastro de membro com o mesmo e-mail mesmo
  // quando o acesso administrativo não possui memberId.
  const membersDoc = await firestoreRest(app, '/oitava/members', {}, { allowNotFound: true });
  const raw = firestoreString(membersDoc, 'data');
  if (!raw) return '';

  try {
    const members = JSON.parse(raw);
    if (!Array.isArray(members)) return '';
    const match = members.find(
      (member) => String(member?.email || '').trim().toLowerCase() === email,
    );
    return typeof match?.id === 'string' ? match.id : '';
  } catch {
    return '';
  }
}

function formatScaleDate(date: string) {
  const [year, month, day] = date.split('-');
  return `${day}/${month}/${year}`;
}

function appUrl() {
  return (env('APP_URL') || 'https://oitavamusicbetim.vercel.app').replace(/\/$/, '');
}

async function findInstallationsByMemberIds(
  app: ReturnType<typeof getPushAdminApp>,
  memberIds: string[],
) {
  const installations = new Map<string, string>();

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
      const document = row?.document;
      const fid = firestoreString(document, 'fid');
      const path = firestoreDocumentPath(document);
      if (fid && path) installations.set(fid, path);
    }
  }

  return installations;
}

export const registerPushInstallation = createServerFn({ method: 'POST' })
  .validator(registerSchema)
  .handler(async ({ data }) => {
    const caller = await verifyCaller(data.idToken);
    const memberId = await resolveMemberId(caller.app, caller.email);
    if (!memberId) {
      throw new Error('Seu e-mail ainda não está vinculado a um membro do ministério.');
    }

    const id = installationDocId(data.fid);
    await firestoreRest(caller.app, `/pushInstallations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(
        stringFields({
          fid: data.fid,
          memberId,
          email: caller.email,
          uid: caller.uid,
          updatedAt: new Date().toISOString(),
        }),
      ),
    });

    console.info('[push-debug] installation registered', {
      member: debugMemberId(memberId),
    });

    return { success: true, memberId };
  });

export const unregisterPushInstallation = createServerFn({ method: 'POST' })
  .validator(unregisterSchema)
  .handler(async ({ data }) => {
    const caller = await verifyCaller(data.idToken);
    const id = installationDocId(data.fid);
    const installation = await firestoreRest(
      caller.app,
      `/pushInstallations/${id}`,
      {},
      { allowNotFound: true },
    );

    if (installation) {
      const uid = firestoreString(installation, 'uid');
      const email = firestoreString(installation, 'email');
      if (uid === caller.uid || email === caller.email) {
        await firestoreRest(caller.app, `/pushInstallations/${id}`, { method: 'DELETE' });
      }
    }

    return { success: true };
  });

export const notifyScaleMembersAdded = createServerFn({ method: 'POST' })
  .validator(notifySchema)
  .handler(async ({ data }) => {
    const caller = await assertAdmin(data.idToken);
    const memberIds = [...new Set(data.addedMemberIds)].filter(Boolean);

    console.info('[push-debug] scale notification requested', {
      scaleId: data.scale.id,
      addedMembers: memberIds.map(debugMemberId),
      addedCount: memberIds.length,
    });

    if (memberIds.length === 0) return { success: true, sent: 0, failed: 0, devices: 0 };

    const installations = await findInstallationsByMemberIds(caller.app, memberIds);
    const fids = [...installations.keys()];

    console.info('[push-debug] installations matched', {
      addedMembers: memberIds.map(debugMemberId),
      devices: fids.length,
    });

    if (fids.length === 0) return { success: true, sent: 0, failed: 0, devices: 0 };

    const link = `${appUrl()}/minhas-escalas?escala=${encodeURIComponent(data.scale.id)}`;
    const title = 'Você foi escalado! 🎵';
    const body = `Você foi incluído na escala “${data.scale.name}” de ${formatScaleDate(data.scale.date)}.`;

    let sent = 0;
    let failed = 0;
    const stalePaths: string[] = [];

    for (let i = 0; i < fids.length; i += 500) {
      const chunk = fids.slice(i, i + 500);
      const response = await getMessaging(caller.app).sendEachForMulticast({
        fids: chunk,
        data: {
          type: 'scale-added',
          title,
          body,
          url: link,
          scaleId: data.scale.id,
        },
        webpush: {
          headers: { Urgency: 'high' },
          fcmOptions: { link },
        },
      });

      sent += response.successCount;
      failed += response.failureCount;

      response.responses.forEach((item, index) => {
        if (item.success) return;
        const code = String(item.error?.code || '');
        if (
          code.includes('installation-id-not-registered')
          || code.includes('registration-token-not-registered')
        ) {
          const path = installations.get(chunk[index]);
          if (path) stalePaths.push(path);
        }
      });
    }

    console.info('[push-debug] delivery result', {
      devices: fids.length,
      sent,
      failed,
    });

    if (stalePaths.length > 0) {
      await Promise.all(
        stalePaths.map((path) =>
          firestoreRest(caller.app, `/${path}`, { method: 'DELETE' }).catch(() => undefined),
        ),
      );
    }

    return { success: true, sent, failed, devices: fids.length };
  });
