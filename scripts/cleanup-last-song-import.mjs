import { cert, getApps, initializeApp } from 'firebase-admin/app';

const BRANCH = 'fix/communications-api-2026-09-03';
const mode = process.argv.includes('--execute') ? 'execute' : 'dry-run';
const RECENT_WINDOW_MS = 6 * 60 * 60 * 1000;

function env(name) {
  return String(process.env[name] || '').trim();
}

function assertPreview() {
  if (env('VERCEL_ENV') !== 'preview' || env('VERCEL_GIT_COMMIT_REF') !== BRANCH) {
    console.log('[cleanup-last-import] skipped: not the validation preview branch');
    process.exit(0);
  }
}

function getApp() {
  const existing = getApps().find((app) => app.name === 'oitava-cleanup-build');
  if (existing) return existing;
  const raw = env('FIREBASE_ADMIN_SERVICE_ACCOUNT');
  if (!raw) throw new Error('FIREBASE_ADMIN_SERVICE_ACCOUNT não configurada');
  const serviceAccount = JSON.parse(raw);
  const projectId = serviceAccount.project_id || serviceAccount.projectId || env('FIREBASE_PROJECT_ID');
  const clientEmail = serviceAccount.client_email || serviceAccount.clientEmail;
  const privateKey = String(serviceAccount.private_key || serviceAccount.privateKey || '').replace(/\\n/g, '\n');
  if (!projectId || !clientEmail || !privateKey) throw new Error('Credencial Firebase Admin incompleta');
  return initializeApp({ credential: cert({ projectId, clientEmail, privateKey }), projectId }, 'oitava-cleanup-build');
}

async function accessToken(app) {
  const token = await app.options.credential.getAccessToken();
  if (!token?.access_token) throw new Error('Não foi possível obter token do Firebase Admin');
  return token.access_token;
}

async function firestore(app, suffix, init = {}, allowNotFound = false) {
  const projectId = String(app.options.projectId || '').trim();
  const token = await accessToken(app);
  const url = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents${suffix}`;
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  if (allowNotFound && response.status === 404) return null;
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload?.error?.message || `Firestore HTTP ${response.status}`);
  return payload;
}

function fieldString(document, field) {
  const value = document?.fields?.[field]?.stringValue;
  return typeof value === 'string' ? value : '';
}

function parseCentral(document, fallback) {
  const raw = fieldString(document, 'data');
  if (!raw) return fallback;
  try { return JSON.parse(raw); } catch { return fallback; }
}

function normalizeName(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u200B-\u200D\u2060\uFEFF]/g, '')
    .replace(/[\u00A0\u202F]/g, ' ')
    .replace(/[‘’´`]/g, "'")
    .replace(/[–—−]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function idTimestamp(id) {
  const value = String(id || '');
  if (!/^[0-9a-z]{8}/i.test(value)) return null;
  const timestamp = Number.parseInt(value.slice(0, 8), 36);
  const min = Date.UTC(2024, 0, 1);
  const max = Date.now() + 24 * 60 * 60 * 1000;
  return Number.isFinite(timestamp) && timestamp >= min && timestamp <= max ? timestamp : null;
}

function chooseOriginal(entries) {
  const legacy = entries.filter((entry) => entry.timestamp === null);
  if (legacy.length) return legacy.sort((a, b) => a.index - b.index)[0];
  return [...entries].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0))[0];
}

function documentName(app, path) {
  return `projects/${app.options.projectId}/databases/(default)/documents/${path}`;
}

function stringData(value) {
  return { fields: { data: { stringValue: JSON.stringify(value) } } };
}

assertPreview();
const app = getApp();
const [songsDoc, scalesDoc] = await Promise.all([
  firestore(app, '/oitava/songs', {}, true),
  firestore(app, '/oitava/scales', {}, true),
]);
const songs = parseCentral(songsDoc, []);
const scales = parseCentral(scalesDoc, []);
if (!Array.isArray(songs) || !Array.isArray(scales)) throw new Error('Dados centrais inválidos');

const groups = new Map();
songs.forEach((song, index) => {
  const key = normalizeName(song?.name);
  if (!key) return;
  const list = groups.get(key) || [];
  list.push({ song, index, timestamp: idTimestamp(song?.id) });
  groups.set(key, list);
});

const duplicateGroups = [];
for (const entries of groups.values()) {
  if (entries.length < 2) continue;
  const original = chooseOriginal(entries);
  const duplicates = entries.filter((entry) => entry !== original);
  duplicateGroups.push({
    name: String(original.song?.name || ''),
    keepId: String(original.song?.id || ''),
    keepCreatedAt: original.timestamp ? new Date(original.timestamp).toISOString() : 'legacy/unknown',
    duplicates: duplicates.map((entry) => ({
      id: String(entry.song?.id || ''),
      createdAt: entry.timestamp ? new Date(entry.timestamp).toISOString() : 'legacy/unknown',
    })),
  });
}

const recentCutoff = Date.now() - RECENT_WINDOW_MS;
const recentSongs = songs
  .map((song) => ({
    id: String(song?.id || ''),
    name: String(song?.name || ''),
    timestamp: idTimestamp(song?.id),
  }))
  .filter((item) => item.timestamp !== null && item.timestamp >= recentCutoff)
  .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0))
  .map((item) => ({ id: item.id, name: item.name, createdAt: new Date(item.timestamp).toISOString() }));

console.log('[cleanup-last-import] report=' + JSON.stringify({ mode, songsTotal: songs.length, scalesTotal: scales.length, duplicateGroups, recentSongs }));

if (mode === 'execute') {
  const targetIds = new Set(
    duplicateGroups.flatMap((group) => group.duplicates.map((item) => item.id)),
  );
  const replacementById = new Map();
  for (const group of duplicateGroups) {
    for (const item of group.duplicates) replacementById.set(item.id, group.keepId);
  }

  const nextSongs = songs.filter((song) => !targetIds.has(String(song?.id || '')));
  const nextScales = scales.map((scale) => ({
    ...scale,
    scaleSongs: Array.isArray(scale?.scaleSongs)
      ? scale.scaleSongs.map((item) => {
          const replacement = replacementById.get(String(item?.songId || ''));
          return replacement ? { ...item, songId: replacement } : item;
        })
      : scale?.scaleSongs,
  }));

  const writes = [
    { update: { name: documentName(app, 'oitava/songs'), ...stringData(nextSongs) } },
    { update: { name: documentName(app, 'oitava/scales'), ...stringData(nextScales) } },
  ];
  await firestore(app, ':commit', { method: 'POST', body: JSON.stringify({ writes }) });
  console.log('[cleanup-last-import] executed=' + JSON.stringify({ removedSongs: targetIds.size, songsBefore: songs.length, songsAfter: nextSongs.length }));
}
