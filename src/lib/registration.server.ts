import { randomUUID } from 'node:crypto';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import {
  firestoreRest,
  firestoreString,
  stringFields,
} from './firestore-rest.functions';
import { MobileApiError } from './mobile-api.server';

type RegistrationProfile = {
  name: string;
  birthdate: string;
  phone: string;
  roles: string[];
};

type RegistrationApproval = {
  memberId?: string;
  roles: string[];
};

const ALLOWED_ROLE_KEYS = new Set([
  'bateria',
  'baixo',
  'violao',
  'guitarra',
  'teclado',
  'ministro',
  'tenor',
  'soprano',
  'contralto',
]);

type AdminApp = ReturnType<typeof getRegistrationApp>;

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

function getRegistrationApp() {
  const existing = getApps().find((app) => app.name === 'oitava-registrations');
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
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('A credencial do Firebase Admin está incompleta.');
  }

  return initializeApp({ credential: cert({ projectId, clientEmail, privateKey }), projectId }, 'oitava-registrations');
}

function projectIdOf(app: AdminApp) {
  const projectId = String(app.options?.projectId || '').trim();
  if (!projectId) throw new Error('Não foi possível identificar o projeto Firebase.');
  return projectId;
}

function documentName(app: AdminApp, path: string) {
  return `projects/${projectIdOf(app)}/databases/(default)/documents/${path}`;
}

async function verifyCaller(idToken: string) {
  const app = getRegistrationApp();
  const decoded = await getAuth(app).verifyIdToken(idToken, true);
  const email = normalizeEmail(decoded.email);
  if (!email) throw new MobileApiError(401, 'Não foi possível identificar o e-mail autenticado.');
  return { app, uid: decoded.uid, email, emailVerified: decoded.email_verified === true };
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
    throw new MobileApiError(403, 'Apenas administradores podem gerenciar cadastros pendentes.');
  }
  return caller;
}

function accessIsApproved(document: any) {
  const role = firestoreString(document, 'role');
  const memberId = firestoreString(document, 'memberId');
  return Boolean(memberId) && (role === 'membro' || role === 'admin');
}

function parseCentralData(value: unknown, fallback: unknown) {
  if (typeof value !== 'string' || !value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function normalizeRoles(value: unknown) {
  const items = Array.isArray(value) ? value : parseCentralData(value, []);
  if (!Array.isArray(items)) return [];
  return [...new Set(items.map((item) => String(item || '').trim()).filter((item) => ALLOWED_ROLE_KEYS.has(item)))];
}

function registrationFromDocument(document: any) {
  if (!document) return null;
  const name = String(document?.name || '');
  const uid = name.split('/').pop() || '';
  if (!uid) return null;
  return {
    uid,
    name: firestoreString(document, 'name'),
    birthdate: firestoreString(document, 'birthdate'),
    phone: firestoreString(document, 'phone'),
    roles: normalizeRoles(firestoreString(document, 'roles')),
    email: firestoreString(document, 'email'),
    status: firestoreString(document, 'status'),
    createdAt: firestoreString(document, 'createdAt'),
    updatedAt: firestoreString(document, 'updatedAt'),
    memberId: firestoreString(document, 'memberId'),
    acceptedAt: firestoreString(document, 'acceptedAt'),
  };
}

export async function submitRegistrationForToken(idToken: string, profile: RegistrationProfile) {
  const caller = await verifyCaller(idToken);
  if (!caller.emailVerified) {
    throw new MobileApiError(403, 'O e-mail precisa estar verificado antes de enviar o cadastro.');
  }

  if (adminEmails().includes(caller.email)) {
    throw new MobileApiError(409, 'Este e-mail já possui acesso aprovado. Use a opção “Esqueci minha senha” se precisar redefinir a senha.');
  }

  const currentAccess = await firestoreRest(
    caller.app,
    `/accessUsers/${encodeURIComponent(caller.email)}`,
    {},
    { allowNotFound: true },
  );
  if (accessIsApproved(currentAccess)) {
    throw new MobileApiError(409, 'Este e-mail já possui acesso aprovado. Use a opção “Esqueci minha senha” se precisar redefinir a senha.');
  }

  const name = profile.name.trim();
  const birthdate = profile.birthdate.trim();
  const phone = profile.phone.trim();
  const roles = normalizeRoles(profile.roles);
  if (name.length < 3 || !birthdate || !phone || roles.length === 0) {
    throw new MobileApiError(400, 'Preencha nome completo, data de nascimento, telefone e pelo menos uma função no ministério.');
  }

  const previous = await firestoreRest(
    caller.app,
    `/memberRegistrations/${encodeURIComponent(caller.uid)}`,
    {},
    { allowNotFound: true },
  );
  const now = new Date().toISOString();
  const createdAt = firestoreString(previous, 'createdAt') || now;

  await firestoreRest(caller.app, `/memberRegistrations/${encodeURIComponent(caller.uid)}`, {
    method: 'PATCH',
    body: JSON.stringify(stringFields({
      name,
      birthdate,
      phone,
      roles: JSON.stringify(roles),
      email: caller.email,
      status: 'pending',
      createdAt,
      updatedAt: now,
    })),
  });

  return { success: true, status: 'pending' };
}

export async function listRegistrationsForToken(idToken: string) {
  const caller = await assertAdmin(idToken);
  const rows = await firestoreRest(caller.app, ':runQuery', {
    method: 'POST',
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: 'memberRegistrations' }],
        limit: 500,
      },
    }),
  });

  const candidates = (Array.isArray(rows) ? rows : [])
    .map((row) => registrationFromDocument(row?.document))
    .filter(Boolean)
    .filter((registration: any) => registration.status === 'pending');

  const visible = await Promise.all(
    candidates.map(async (registration: any) => {
      const email = normalizeEmail(registration.email);
      if (!email || adminEmails().includes(email)) return null;
      const access = await firestoreRest(
        caller.app,
        `/accessUsers/${encodeURIComponent(email)}`,
        {},
        { allowNotFound: true },
      );
      return accessIsApproved(access) ? null : registration;
    }),
  );

  const registrations = visible
    .filter(Boolean)
    .sort((a: any, b: any) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')));
  return { registrations };
}

export async function acceptRegistrationForToken(
  idToken: string,
  uid: string,
  approval: RegistrationApproval,
) {
  const caller = await assertAdmin(idToken);
  const registrationDocument = await firestoreRest(
    caller.app,
    `/memberRegistrations/${encodeURIComponent(uid)}`,
    {},
    { allowNotFound: true },
  );
  if (!registrationDocument) throw new MobileApiError(404, 'Cadastro pendente não encontrado.');

  const registration = registrationFromDocument(registrationDocument);
  if (!registration) throw new MobileApiError(404, 'Cadastro pendente não encontrado.');
  if (registration.status !== 'pending') {
    throw new MobileApiError(409, 'Este cadastro já foi processado.');
  }

  const email = normalizeEmail(registration.email);
  const name = String(registration.name || '').trim();
  const finalRoles = normalizeRoles(approval.roles);
  if (!email || !name || !registration.birthdate || !registration.phone || finalRoles.length === 0) {
    throw new MobileApiError(400, 'O cadastro pendente está incompleto.');
  }

  const [membersDocument, usersDocument, currentAccess] = await Promise.all([
    firestoreRest(caller.app, '/oitava/members', {}, { allowNotFound: true }),
    firestoreRest(caller.app, '/oitava/users', {}, { allowNotFound: true }),
    firestoreRest(caller.app, `/accessUsers/${encodeURIComponent(email)}`, {}, { allowNotFound: true }),
  ]);

  if (accessIsApproved(currentAccess)) {
    throw new MobileApiError(409, 'Este e-mail já possui acesso aprovado e não pode ser aprovado novamente.');
  }

  const members = parseCentralData(firestoreString(membersDocument, 'data'), []);
  const users = parseCentralData(firestoreString(usersDocument, 'data'), {});
  if (!Array.isArray(members) || !users || typeof users !== 'object' || Array.isArray(users)) {
    throw new Error('Os dados centrais de membros/acessos estão inválidos.');
  }

  const requestedMemberId = String(approval.memberId || '').trim();
  const existingIndex = requestedMemberId
    ? members.findIndex((member: any) => String(member?.id || '') === requestedMemberId)
    : -1;

  if (requestedMemberId && existingIndex < 0) {
    throw new MobileApiError(404, 'O participante escolhido para o vínculo não existe mais.');
  }

  const existing = existingIndex >= 0 ? members[existingIndex] : null;
  const memberId = String(existing?.id || randomUUID());
  const previousEmail = normalizeEmail(existing?.email);
  const memberData = {
    ...(existing || {}),
    id: memberId,
    name,
    birthdate: String(registration.birthdate || ''),
    phone: String(registration.phone || ''),
    email,
    photo: String(existing?.photo || ''),
    roles: finalRoles,
  };

  const nextMembers = [...members];
  if (existingIndex >= 0) nextMembers[existingIndex] = memberData;
  else nextMembers.push(memberData);

  const nextUsers = { ...(users as Record<string, any>) };
  if (
    previousEmail
    && previousEmail !== email
    && nextUsers[previousEmail]?.memberId === memberId
    && nextUsers[previousEmail]?.role !== 'admin'
  ) {
    delete nextUsers[previousEmail];
  }

  const currentRole = firestoreString(currentAccess, 'role');
  const role = currentRole === 'admin' ? 'admin' : 'membro';
  nextUsers[email] = { ...(nextUsers[email] || {}), role, memberId };
  const now = new Date().toISOString();

  let previousAccess: any = null;
  if (previousEmail && previousEmail !== email) {
    previousAccess = await firestoreRest(
      caller.app,
      `/accessUsers/${encodeURIComponent(previousEmail)}`,
      {},
      { allowNotFound: true },
    );
  }

  const writes: any[] = [
    {
      update: {
        name: documentName(caller.app, 'oitava/members'),
        fields: stringFields({ data: JSON.stringify(nextMembers) }).fields,
      },
    },
    {
      update: {
        name: documentName(caller.app, 'oitava/users'),
        fields: stringFields({ data: JSON.stringify(nextUsers) }).fields,
      },
    },
    {
      update: {
        name: documentName(caller.app, `accessUsers/${email}`),
        fields: stringFields({ email, role, memberId, updatedAt: now }).fields,
      },
    },
    {
      update: {
        name: documentName(caller.app, `memberRegistrations/${uid}`),
        fields: stringFields({
          name: registration.name,
          birthdate: registration.birthdate,
          phone: registration.phone,
          roles: JSON.stringify(finalRoles),
          email,
          status: 'accepted',
          createdAt: registration.createdAt,
          updatedAt: now,
          memberId,
          acceptedAt: now,
        }).fields,
      },
    },
  ];

  if (
    previousEmail
    && previousEmail !== email
    && firestoreString(previousAccess, 'memberId') === memberId
    && firestoreString(previousAccess, 'role') !== 'admin'
  ) {
    writes.push({ delete: documentName(caller.app, `accessUsers/${previousEmail}`) });
  }

  await firestoreRest(caller.app, ':commit', {
    method: 'POST',
    body: JSON.stringify({ writes }),
  });

  return {
    success: true,
    memberId,
    linkedExisting: existingIndex >= 0,
    member: memberData,
    members: nextMembers,
  };
}
