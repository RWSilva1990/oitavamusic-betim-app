import { createHash } from 'node:crypto';
import { createServerFn } from '@tanstack/react-start';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { z } from 'zod';

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

async function resolveMemberId(email: string) {
  const db = getFirestore(getPushAdminApp());

  const accessSnap = await db.collection('accessUsers').doc(email).get();
  const accessMemberId = accessSnap.data()?.memberId;
  if (typeof accessMemberId === 'string' && accessMemberId) return accessMemberId;

  // Administradores podem ter um cadastro de membro com o mesmo e-mail mesmo
  // quando o acesso administrativo não carrega memberId no cliente.
  const membersSnap = await db.collection('oitava').doc('members').get();
  const raw = membersSnap.data()?.data;
  if (typeof raw !== 'string' || !raw) return '';

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

export const registerPushInstallation = createServerFn({ method: 'POST' })
  .validator(registerSchema)
  .handler(async ({ data }) => {
    const caller = await verifyCaller(data.idToken);
    const memberId = await resolveMemberId(caller.email);
    if (!memberId) {
      throw new Error('Seu e-mail ainda não está vinculado a um membro do ministério.');
    }

    const db = getFirestore(caller.app);
    await db.collection('pushInstallations').doc(installationDocId(data.fid)).set(
      {
        fid: data.fid,
        memberId,
        email: caller.email,
        uid: caller.uid,
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );

    return { success: true, memberId };
  });

export const unregisterPushInstallation = createServerFn({ method: 'POST' })
  .validator(unregisterSchema)
  .handler(async ({ data }) => {
    const caller = await verifyCaller(data.idToken);
    const db = getFirestore(caller.app);
    const ref = db.collection('pushInstallations').doc(installationDocId(data.fid));
    const snap = await ref.get();

    if (snap.exists) {
      const stored = snap.data();
      if (stored?.uid === caller.uid || stored?.email === caller.email) {
        await ref.delete();
      }
    }

    return { success: true };
  });

export const notifyScaleMembersAdded = createServerFn({ method: 'POST' })
  .validator(notifySchema)
  .handler(async ({ data }) => {
    const caller = await assertAdmin(data.idToken);
    const memberIds = [...new Set(data.addedMemberIds)].filter(Boolean);
    if (memberIds.length === 0) return { success: true, sent: 0, failed: 0, devices: 0 };

    const db = getFirestore(caller.app);
    const installations = new Map<string, FirebaseFirestore.DocumentReference>();

    // Firestore aceita consultas IN em lotes; dividimos para manter uma margem
    // segura e suportar escalas grandes sem mudar a estrutura atual dos dados.
    for (let i = 0; i < memberIds.length; i += 25) {
      const chunk = memberIds.slice(i, i + 25);
      const snap = await db.collection('pushInstallations').where('memberId', 'in', chunk).get();
      for (const docSnap of snap.docs) {
        const fid = docSnap.data()?.fid;
        if (typeof fid === 'string' && fid) installations.set(fid, docSnap.ref);
      }
    }

    const fids = [...installations.keys()];
    if (fids.length === 0) return { success: true, sent: 0, failed: 0, devices: 0 };

    const link = `${appUrl()}/minhas-escalas?escala=${encodeURIComponent(data.scale.id)}`;
    const title = 'Você foi escalado! 🎵';
    const body = `Você foi incluído na escala “${data.scale.name}” de ${formatScaleDate(data.scale.date)}.`;

    let sent = 0;
    let failed = 0;
    const staleRefs: FirebaseFirestore.DocumentReference[] = [];

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
          const ref = installations.get(chunk[index]);
          if (ref) staleRefs.push(ref);
        }
      });
    }

    if (staleRefs.length > 0) {
      await Promise.all(staleRefs.map((ref) => ref.delete().catch(() => undefined)));
    }

    return { success: true, sent, failed, devices: fids.length };
  });
