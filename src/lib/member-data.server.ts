import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { firestoreRest, firestoreString } from './firestore-rest.functions';

function env(name: string) {
  return process.env[name]?.trim() || '';
}

function normalizeEmail(value: unknown) {
  return String(value || '').trim().toLowerCase();
}

function getMemberDataAdminApp() {
  const existing = getApps().find((app) => app.name === 'oitava-member-data');
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
    'oitava-member-data',
  );
}

async function readJsonDocument(app: ReturnType<typeof getMemberDataAdminApp>, docId: string) {
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

function publicMemberProfile(member: any) {
  return {
    id: String(member?.id || ''),
    name: String(member?.name || ''),
    photo: String(member?.photo || ''),
    roles: Array.isArray(member?.roles) ? member.roles.filter((role: unknown) => typeof role === 'string') : [],
  };
}

function publicScaleMember(slot: any) {
  const roles = Array.isArray(slot?.roles)
    ? slot.roles.filter((role: unknown) => typeof role === 'string')
    : [];
  const role = typeof slot?.role === 'string' ? slot.role : '';
  return {
    memberId: String(slot?.memberId || ''),
    isSub: Boolean(slot?.isSub),
    roles,
    role: role || roles[0] || '',
  };
}

function publicSong(song: any) {
  return {
    id: String(song?.id || ''),
    name: String(song?.name || ''),
    youtubeUrl: String(song?.youtubeUrl || ''),
    originalKey: String(song?.originalKey || ''),
    bpm: song?.bpm ?? '',
    timeSignature: String(song?.timeSignature || ''),
    audios: Array.isArray(song?.audios) ? song.audios : [],
  };
}

export async function getMemberAppDataForToken(idToken: string) {
  const app = getMemberDataAdminApp();
  const decoded = await getAuth(app).verifyIdToken(idToken, true);
  const email = normalizeEmail(decoded.email);

  if (!email || decoded.email_verified !== true) {
    throw new Error('Não foi possível validar o usuário do ministério.');
  }

  const access = await firestoreRest(
    app,
    `/accessUsers/${encodeURIComponent(email)}`,
    {},
    { allowNotFound: true },
  );

  const role = firestoreString(access, 'role');
  const memberId = firestoreString(access, 'memberId');
  if (role !== 'membro' || !memberId) {
    throw new Error('Este acesso não está vinculado a um membro válido.');
  }

  const [members, groups, songs, scales] = await Promise.all([
    readJsonDocument(app, 'members'),
    readJsonDocument(app, 'groups'),
    readJsonDocument(app, 'songs'),
    readJsonDocument(app, 'scales'),
  ]);

  const member = members.find((item: any) => String(item?.id || '') === memberId);
  if (!member) throw new Error('O cadastro de membro vinculado a este acesso não foi encontrado.');

  const myScales = scales
    .filter((scale: any) =>
      Array.isArray(scale?.scaleMembers)
      && scale.scaleMembers.some((slot: any) => String(slot?.memberId || '') === memberId),
    )
    .map((scale: any) => ({
      id: String(scale?.id || ''),
      name: String(scale?.name || ''),
      date: String(scale?.date || ''),
      groupId: String(scale?.groupId || ''),
      scaleMembers: Array.isArray(scale?.scaleMembers)
        ? scale.scaleMembers.map(publicScaleMember).filter((slot: any) => slot.memberId)
        : [],
      scaleSongs: Array.isArray(scale?.scaleSongs)
        ? scale.scaleSongs.map((song: any) => ({
            ...song,
            soloMemberId: String(song?.soloMemberId || ''),
          }))
        : [],
    }));

  const participantIds = new Set(
    myScales.flatMap((scale: any) =>
      (scale.scaleMembers || []).map((slot: any) => String(slot?.memberId || '')).filter(Boolean),
    ),
  );
  participantIds.add(memberId);

  const publicMembers = members
    .filter((item: any) => participantIds.has(String(item?.id || '')))
    .map(publicMemberProfile)
    .filter((item: any) => item.id && item.name);

  const usedGroupIds = new Set(myScales.map((scale: any) => scale.groupId).filter(Boolean));
  const myGroups = groups
    .filter((group: any) => usedGroupIds.has(String(group?.id || '')))
    .map((group: any) => ({
      id: String(group?.id || ''),
      name: String(group?.name || ''),
    }));

  return {
    member: publicMemberProfile(member),
    members: publicMembers,
    groups: myGroups,
    songs: songs.map(publicSong).filter((song: any) => song.id && song.name),
    scales: myScales,
  };
}
