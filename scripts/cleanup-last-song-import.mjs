import { cert, getApps, initializeApp } from 'firebase-admin/app';

const BRANCH = 'fix/communications-api-2026-09-03';
const mode = process.argv.includes('--execute') ? 'execute' : 'dry-run';
const BATCH_START = Date.parse('2026-09-04T01:45:40.000Z');
const BATCH_END = Date.parse('2026-09-04T01:46:30.000Z');

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

function idTimestamp(id) {
  const value = String(id || '');
  if (!/^[0-9a-z]{8}/i.test(value)) return null;
  const timestamp = Number.parseInt(value.slice(0, 8), 36);
  const min = Date.UTC(2024, 0, 1);
  const max = Date.now() + 24 * 60 * 60 * 1000;
  return Number.isFinite(timestamp) && timestamp >= min && timestamp <= max ? timestamp : null;
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

const batchSongs = songs
  .map((song) => ({ song, timestamp: idTimestamp(song?.id) }))
  .filter((entry) => entry.timestamp !== null && entry.timestamp >= BATCH_START && entry.timestamp <= BATCH_END);
const batchIds = new Set(batchSongs.map((entry) => String(entry.song?.id || '')));
const affectedScales = scales.filter((scale) =>
  Array.isArray(scale?.scaleSongs) && scale.scaleSongs.some((item) => batchIds.has(String(item?.songId || ''))),
);

const timestamps = batchSongs.map((entry) => entry.timestamp).filter((value) => value !== null);
const report = {
  mode,
  songsTotal: songs.length,
  scalesTotal: scales.length,
  batchCount: batchSongs.length,
  batchFirst: timestamps.length ? new Date(Math.min(...timestamps)).toISOString() : null,
  batchLast: timestamps.length ? new Date(Math.max(...timestamps)).toISOString() : null,
  firstFive: batchSongs.slice(0, 5).map((entry) => ({ id: entry.song.id, name: entry.song.name })),
  lastFive: batchSongs.slice(-5).map((entry) => ({ id: entry.song.id, name: entry.song.name })),
  affectedScales: affectedScales.map((scale) => ({ id: String(scale?.id || ''), name: String(scale?.name || ''), date: String(scale?.date || '') })),
};
console.log('[cleanup-last-import] report=' + JSON.stringify(report));

if (mode === 'execute') {
  const nextSongs = songs.filter((song) => !batchIds.has(String(song?.id || '')));
  const affectedScaleIds = new Set(affectedScales.map((scale) => String(scale?.id || '')));
  const nextScales = scales.filter((scale) => !affectedScaleIds.has(String(scale?.id || '')));

  const writes = [
    { update: { name: documentName(app, 'oitava/songs'), ...stringData(nextSongs) } },
    { update: { name: documentName(app, 'oitava/scales'), ...stringData(nextScales) } },
  ];
  await firestore(app, ':commit', { method: 'POST', body: JSON.stringify({ writes }) });
  console.log('[cleanup-last-import] executed=' + JSON.stringify({
    removedSongs: batchIds.size,
    removedScales: affectedScaleIds.size,
    songsBefore: songs.length,
    songsAfter: nextSongs.length,
    scalesBefore: scales.length,
    scalesAfter: nextScales.length,
  }));
}
