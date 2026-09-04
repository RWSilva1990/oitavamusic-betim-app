import { randomUUID } from 'node:crypto';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { MobileApiError } from './mobile-api.server';

type RegistrationProfile = {
  name: string;
  birthdate: string;
  phone: string;
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

  const snap = await getFirestore(caller.app).doc(`accessUsers/${caller.email}`).get();
  if (snap.data()?.role !== 'admin') {
    throw new MobileApiError(403, 'Apenas administradores podem gerenciar cadastros pendentes.');
  }
  return caller;
}

function parseCentralData(value: unknown, fallback: unknown) {
  if (typeof value !== 'string' || !value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export async function submitRegistrationForToken(idToken: string, profile: RegistrationProfile) {
  const caller = await verifyCaller(idToken);
  if (!caller.emailVerified) {
    throw new MobileApiError(403, 'O e-mail precisa estar verificado antes de enviar o cadastro.');
  }

  const name = profile.name.trim();
  const birthdate = profile.birthdate.trim();
  const phone = profile.phone.trim();
  if (name.length < 3 || !birthdate || !phone) {
    throw new MobileApiError(400, 'Preencha nome completo, data de nascimento e telefone.');
  }

  const db = getFirestore(caller.app);
  const ref = db.doc(`memberRegistrations/${caller.uid}`);
  const previous = await ref.get();
  const now = new Date().toISOString();
  const createdAt = String(previous.data()?.createdAt || now);

  await ref.set({
    name,
    birthdate,
    phone,
    email: caller.email,
    status: 'pending',
    createdAt,
    updatedAt: now,
  }, { merge: false });

  return { success: true, status: 'pending' };
}

export async function listRegistrationsForToken(idToken: string) {
  const caller = await assertAdmin(idToken);
  const snap = await getFirestore(caller.app).collection('memberRegistrations').get();
  const registrations = snap.docs
    .map((doc) => ({ uid: doc.id, ...doc.data() }))
    .sort((a: any, b: any) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')));
  return { registrations };
}

export async function acceptRegistrationForToken(idToken: string, uid: string) {
  const caller = await assertAdmin(idToken);
  const db = getFirestore(caller.app);
  const registrationRef = db.doc(`memberRegistrations/${uid}`);
  const registrationSnap = await registrationRef.get();
  if (!registrationSnap.exists) throw new MobileApiError(404, 'Cadastro pendente não encontrado.');

  const registration = registrationSnap.data() || {};
  if (registration.status !== 'pending') {
    throw new MobileApiError(409, 'Este cadastro já foi processado.');
  }

  const email = normalizeEmail(registration.email);
  const name = String(registration.name || '').trim();
  if (!email || !name) throw new MobileApiError(400, 'O cadastro pendente está incompleto.');

  const membersRef = db.doc('oitava/members');
  const usersRef = db.doc('oitava/users');
  const [membersSnap, usersSnap] = await Promise.all([membersRef.get(), usersRef.get()]);
  const members = parseCentralData(membersSnap.data()?.data, []);
  const users = parseCentralData(usersSnap.data()?.data, {});
  if (!Array.isArray(members) || !users || typeof users !== 'object' || Array.isArray(users)) {
    throw new Error('Os dados centrais de membros/acessos estão inválidos.');
  }

  const existingIndex = members.findIndex((member: any) => normalizeEmail(member?.email) === email);
  const existing = existingIndex >= 0 ? members[existingIndex] : null;
  const memberId = String(existing?.id || randomUUID());
  const memberData = {
    ...(existing || {}),
    id: memberId,
    name,
    birthdate: String(registration.birthdate || ''),
    phone: String(registration.phone || ''),
    email,
    photo: String(existing?.photo || ''),
    roles: Array.isArray(existing?.roles) ? existing.roles : [],
  };

  const nextMembers = [...members];
  if (existingIndex >= 0) nextMembers[existingIndex] = memberData;
  else nextMembers.push(memberData);

  const nextUsers = { ...(users as Record<string, any>) };
  nextUsers[email] = { ...(nextUsers[email] || {}), role: 'membro', memberId };
  const now = new Date().toISOString();

  const batch = db.batch();
  batch.set(membersRef, { data: JSON.stringify(nextMembers) });
  batch.set(usersRef, { data: JSON.stringify(nextUsers) });
  batch.set(db.doc(`accessUsers/${email}`), { email, role: 'membro', memberId, updatedAt: now }, { merge: true });
  batch.update(registrationRef, {
    status: 'accepted',
    memberId,
    acceptedAt: now,
    updatedAt: now,
  });
  await batch.commit();

  return { success: true, memberId, member: memberData, members: nextMembers };
}
