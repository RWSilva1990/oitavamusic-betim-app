import { createHash } from 'node:crypto';
import { createServerFn } from '@tanstack/react-start';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { z } from 'zod';

const testSchema = z.object({
  idToken: z.string().min(20),
  fid: z.string().min(8).max(600),
});

function env(name: string) {
  return process.env[name]?.trim() || '';
}

function getPushTestApp() {
  const existing = getApps().find((app) => app.name === 'oitava-push-test');
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
    'oitava-push-test',
  );
}

function installationDocId(fid: string) {
  return createHash('sha256').update(fid).digest('hex');
}

export const sendPushTest = createServerFn({ method: 'POST' })
  .validator(testSchema)
  .handler(async ({ data }) => {
    const app = getPushTestApp();
    const decoded = await getAuth(app).verifyIdToken(data.idToken, true);
    const email = decoded.email?.trim().toLowerCase();
    if (!email) throw new Error('Não foi possível identificar o usuário autenticado.');

    const db = getFirestore(app);
    const ref = db.collection('pushInstallations').doc(installationDocId(data.fid));
    const snap = await ref.get();
    if (!snap.exists) {
      throw new Error('Este aparelho ainda não está registrado para receber notificações.');
    }

    const installation = snap.data();
    if (installation?.uid !== decoded.uid && installation?.email !== email) {
      throw new Error('Este aparelho não pertence ao usuário autenticado.');
    }

    const response = await getMessaging(app).send({
      fid: data.fid,
      data: {
        type: 'push-test',
        title: 'Notificação de teste 🔔',
        body: 'Se você está vendo esta mensagem, as notificações do Oitava Music estão funcionando.',
        url: '/minhas-escalas',
        scaleId: 'push-test',
      },
      webpush: {
        headers: { Urgency: 'high' },
      },
    });

    return { success: true, id: response };
  });
