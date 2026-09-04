import { createFileRoute } from '@tanstack/react-router';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { firestoreRest, firestoreString } from '@/lib/firestore-rest.functions';

const ALLOWED_BRANCH = 'fix/communications-api-2026-09-03';
const RECENT_WINDOW_MS = 12 * 60 * 60 * 1000;

function env(name: string) {
  return process.env[name]?.trim() || '';
}

function assertPreviewOnly() {
  if (env('VERCEL_ENV') !== 'preview' || env('VERCEL_GIT_COMMIT_REF') !== ALLOWED_BRANCH) {
    throw new Error('Esta rotina só pode ser executada no preview de validação.');
  }
}

function getCleanupApp() {
  const existing = getApps().find((app) => app.name === 'oitava-cleanup-preview');
  if (existing) return existing;

  const raw = env('FIREBASE_ADMIN_SERVICE_ACCOUNT');
  if (!raw) throw new Error('FIREBASE_ADMIN_SERVICE_ACCOUNT não está configurada.');
  const serviceAccount = JSON.parse(raw);
  const projectId = serviceAccount.project_id || serviceAccount.projectId || env('FIREBASE_PROJECT_ID');
  const clientEmail = serviceAccount.client_email || serviceAccount.clientEmail;
  const privateKey = (serviceAccount.private_key || serviceAccount.privateKey || '').replace(/\\n/g, '\n');
  if (!projectId || !clientEmail || !privateKey) throw new Error('Credencial Firebase Admin incompleta.');

  return initializeApp({ credential: cert({ projectId, clientEmail, privateKey }), projectId }, 'oitava-cleanup-preview');
}

function parseCentral(document: any, fallback: any) {
  const raw = firestoreString(document, 'data');
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function normalizeName(value: unknown) {
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

function idTimestamp(id: unknown) {
  const value = String(id || '');
  if (!/^[0-9a-z]{8}/i.test(value)) return null;
  const timestamp = Number.parseInt(value.slice(0, 8), 36);
  const min = Date.UTC(2024, 0, 1);
  const max = Date.now() + 24 * 60 * 60 * 1000;
  return Number.isFinite(timestamp) && timestamp >= min && timestamp <= max ? timestamp : null;
}

function chooseOriginal(entries: Array<{ song: any; index: number; timestamp: number | null }>) {
  const legacy = entries.filter((entry) => entry.timestamp === null);
  if (legacy.length) return legacy.sort((a, b) => a.index - b.index)[0];
  return [...entries].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0))[0];
}

async function buildReport() {
  assertPreviewOnly();
  const app = getCleanupApp();
  const [songsDocument, scalesDocument] = await Promise.all([
    firestoreRest(app, '/oitava/songs', {}, { allowNotFound: true }),
    firestoreRest(app, '/oitava/scales', {}, { allowNotFound: true }),
  ]);

  const songs = parseCentral(songsDocument, []);
  const scales = parseCentral(scalesDocument, []);
  if (!Array.isArray(songs) || !Array.isArray(scales)) throw new Error('Dados centrais inválidos.');

  const grouped = new Map<string, Array<{ song: any; index: number; timestamp: number | null }>>();
  songs.forEach((song: any, index: number) => {
    const key = normalizeName(song?.name);
    if (!key) return;
    const list = grouped.get(key) || [];
    list.push({ song, index, timestamp: idTimestamp(song?.id) });
    grouped.set(key, list);
  });

  const cutoff = Date.now() - RECENT_WINDOW_MS;
  const duplicateGroups = [] as any[];
  const candidateIds = new Set<string>();

  for (const entries of grouped.values()) {
    if (entries.length < 2) continue;
    const original = chooseOriginal(entries);
    const duplicates = entries.filter((entry) => entry !== original);
    const recentDuplicates = duplicates.filter((entry) => entry.timestamp !== null && entry.timestamp >= cutoff);
    if (!recentDuplicates.length) continue;

    recentDuplicates.forEach((entry) => candidateIds.add(String(entry.song.id)));
    duplicateGroups.push({
      name: String(original.song?.name || ''),
      keep: {
        id: String(original.song?.id || ''),
        createdAt: original.timestamp ? new Date(original.timestamp).toISOString() : 'legacy/unknown',
      },
      remove: recentDuplicates.map((entry) => ({
        id: String(entry.song?.id || ''),
        createdAt: entry.timestamp ? new Date(entry.timestamp).toISOString() : 'unknown',
      })),
    });
  }

  const affectedScales = scales
    .filter((scale: any) => (scale?.scaleSongs || []).some((item: any) => candidateIds.has(String(item?.songId || ''))))
    .map((scale: any) => ({ id: String(scale?.id || ''), name: String(scale?.name || ''), date: String(scale?.date || '') }));

  return {
    songsTotal: songs.length,
    scalesTotal: scales.length,
    duplicateGroups,
    removeCount: candidateIds.size,
    candidateIds: [...candidateIds],
    affectedScales,
  };
}

export const Route = createFileRoute('/api/internal/cleanup-last-song-import')({
  server: {
    handlers: {
      GET: async () => {
        try {
          const report = await buildReport();
          return Response.json({ ok: true, mode: 'preview-only', ...report });
        } catch (error: any) {
          return Response.json({ ok: false, error: error?.message || 'Falha ao analisar duplicatas.' }, { status: 500 });
        }
      },
    },
  },
});
