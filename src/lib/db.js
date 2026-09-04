import { ROLES } from './theme';
import { getFirebaseFirestore } from './firebase';

export async function dbGet(docId) {
  const { db, mod } = await getFirebaseFirestore();
  const snap = await mod.getDoc(mod.doc(db, 'oitava', docId));
  if (!snap.exists()) return null;
  const value = snap.data()?.data;
  if (typeof value !== 'string' || !value) return null;
  try {
    return JSON.parse(value);
  } catch {
    throw new Error(`Dados inválidos no documento oitava/${docId}`);
  }
}

export async function dbSet(docId, val) {
  const { db, mod } = await getFirebaseFirestore();
  await mod.setDoc(mod.doc(db, 'oitava', docId), { data: JSON.stringify(val) });
}

export const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2);

export const fmtDate = (d) => (d ? new Date(d + 'T12:00:00').toLocaleDateString('pt-BR') : '—');

export const shortName = (name) => {
  const parts = (name || '').trim().split(/\s+/);
  if (parts.length <= 2) return name;
  return `${parts[0]} ${parts[parts.length - 1]}`;
};

export const normalizeStr = (str) =>
  String(str || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u200B-\u200D\u2060\uFEFF]/g, '')
    .replace(/[’‘`´]/g, "'")
    .replace(/[–—−]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

export const todayISO = () => new Date().toISOString().split('T')[0];

export function getYtId(url) {
  if (!url) return null;
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return m ? m[1] : null;
}

export function buildWhatsAppText(sc, members, groups, songs) {
  const group = groups.find((g) => g.id === sc.groupId);
  const scMembers = (sc.scaleMembers || [])
    .map((sm) => ({ ...sm, member: members.find((m) => m.id === sm.memberId) }))
    .filter((x) => x.member);
  const scSongs = (sc.scaleSongs || [])
    .map((ss) => ({ ...ss, song: songs.find((s) => s.id === ss.songId) }))
    .filter((x) => x.song);

  let txt = `🎵 *${sc.name}*\n`;
  txt += `📅 *Data:* ${fmtDate(sc.date)}\n`;
  if (group) txt += `🎸 *Grupo:* ${group.name}\n`;
  txt += `\n`;

  if (scMembers.length > 0) {
    txt += `*👥 Integrantes:*\n`;
    scMembers.forEach((x) => {
      const activeRoles = x.roles || (x.role ? [x.role] : []);
      const roleLabel =
        activeRoles.length > 0
          ? activeRoles
              .map((r) => {
                const ro = ROLES.find((o) => o.key === r);
                return ro ? `${ro.emoji} ${ro.label}` : null;
              })
              .filter(Boolean)
              .join(' + ')
          : (x.member.roles || [])
              .map((r) => ROLES.find((o) => o.key === r)?.label)
              .filter(Boolean)
              .join(', ');
      txt += `• ${shortName(x.member.name)}${x.isSub ? ' ↔ (substituto)' : ''}${roleLabel ? ` — ${roleLabel}` : ''}\n`;
    });
    txt += `\n`;
  }

  if (scSongs.length > 0) {
    txt += `*🎵 Repertório:*\n`;
    const playlistIds = [];
    scSongs.forEach((x, i) => {
      txt += `\n*${i + 1}. ${x.song.name}*\n`;
      const tomBpm = [x.key ? `Tom: *${x.key}*` : null, x.song.bpm ? `BPM: *${x.song.bpm}*` : null]
        .filter(Boolean)
        .join('  |  ');
      if (tomBpm) txt += `${tomBpm}\n`;
      if (x.soloMemberId) {
        const soloist = members.find((m) => m.id === x.soloMemberId);
        if (soloist) {
          const vocalRole = (soloist.roles || []).find((r) =>
            ['tenor', 'soprano', 'contralto'].includes(r)
          );
          const roleLabel = vocalRole ? ROLES.find((ro) => ro.key === vocalRole)?.label : '';
          txt += `🎙️ Solo: *${shortName(soloist.name)}*${roleLabel ? ` (${roleLabel})` : ''}\n`;
        }
      }
      if (x.notes) txt += `Obs: ${x.notes}\n`;
      const ytId = getYtId(x.song.youtubeUrl);
      if (ytId) playlistIds.push(ytId);
    });
    if (playlistIds.length > 0) {
      txt += `\n▶️ *Playlist:* https://www.youtube.com/watch_videos?video_ids=${playlistIds.join(',')}\n`;
    }
  }

  return txt;
}

export function shareToWhatsApp(sc, members, groups, songs) {
  const text = buildWhatsAppText(sc, members, groups, songs);
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
}
