import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { firestoreRest, firestoreString, stringFields } from './firestore-rest.functions';
import { MobileApiError } from './mobile-api.server';

const ALLOWED_KEYS = new Set(['members', 'groups', 'songs', 'scales']);
const MAX_DOCUMENT_BYTES = 900 * 1024;

function env(name: string) {
  return process.env[name]?.trim() || '';
}

function normalizeEmail(value: unknown) {
  return String(value || '').trim().toLowerCase();
}

function configuredAdminEmails() {
  return new Set(
    env('ADMIN_EMAILS')
      .concat(',', env('VITE_ADMIN_EMAILS'))
      .split(',')
      .map(normalizeEmail)
      .filter(Boolean),
  );
}

function getAdminDataApp() {
  const existing = getApps().find((app) => app.name === 'oitava-admin-data');
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
    'oitava-admin-data',
  );
}

async function assertAdminToken(idToken: string) {
  const app = getAdminDataApp();
  const decoded = await getAuth(app).verifyIdToken(idToken, true);
  const email = normalizeEmail(decoded.email);

  if (!email || decoded.email_verified !== true) {
    throw new MobileApiError(401, 'Não foi possível validar o administrador.');
  }

  if (configuredAdminEmails().has(email)) return app;

  const access = await firestoreRest(
    app,
    `/accessUsers/${encodeURIComponent(email)}`,
    {},
    { allowNotFound: true },
  );

  if (firestoreString(access, 'role') !== 'admin') {
    throw new MobileApiError(403, 'Este usuário não possui acesso administrativo.');
  }

  return app;
}

async function readJsonDocument(app: ReturnType<typeof getAdminDataApp>, docId: string) {
  const document = await firestoreRest(
    app,
    `/oitava/${encodeURIComponent(docId)}`,
    {},
    { allowNotFound: true },
  );
  const raw = firestoreString(document, 'data');
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    throw new Error(`Dados inválidos no documento oitava/${docId}.`);
  }
}

export async function getAdminAppDataForToken(idToken: string) {
  const app = await assertAdminToken(idToken);
  const [members, groups, songs, scales] = await Promise.all([
    readJsonDocument(app, 'members'),
    readJsonDocument(app, 'groups'),
    readJsonDocument(app, 'songs'),
    readJsonDocument(app, 'scales'),
  ]);

  return { members, groups, songs, scales };
}

export async function saveAdminAppDataForToken(idToken: string, key: string, data: unknown) {
  const app = await assertAdminToken(idToken);
  if (!ALLOWED_KEYS.has(key)) {
    throw new MobileApiError(400, 'Conjunto de dados administrativo inválido.');
  }
  if (!Array.isArray(data)) {
    throw new MobileApiError(400, 'Os dados administrativos precisam ser uma lista.');
  }

  const serialized = JSON.stringify(data);
  if (Buffer.byteLength(serialized, 'utf8') > MAX_DOCUMENT_BYTES) {
    throw new MobileApiError(413, 'Este conjunto de dados excede o limite seguro do Firestore.');
  }

  await firestoreRest(app, `/oitava/${encodeURIComponent(key)}?updateMask.fieldPaths=data`, {
    method: 'PATCH',
    body: JSON.stringify(stringFields({ data: serialized })),
  });

  return { ok: true };
}
