const DRAFT_KEY = 'oitava:scale-draft-v1';
const FLOW_KEY = 'oitava:scale-song-registration';
const NEW_SONG_KEY = 'oitava:scale-new-song-id';

function storage() {
  if (typeof window === 'undefined') return null;
  return window.sessionStorage;
}

export function beginScaleSongRegistration(payload) {
  const target = storage();
  if (!target) return;
  target.setItem(DRAFT_KEY, JSON.stringify(payload));
  target.setItem(FLOW_KEY, 'true');
  target.removeItem(NEW_SONG_KEY);
}

export function readScaleDraft() {
  const target = storage();
  if (!target) return null;
  const raw = target.getItem(DRAFT_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

export function isScaleSongRegistration() {
  const target = storage();
  return Boolean(target && target.getItem(FLOW_KEY) === 'true' && target.getItem(DRAFT_KEY));
}

export function markScaleNewSong(songId) {
  const target = storage();
  if (!target || !songId) return;
  target.setItem(NEW_SONG_KEY, String(songId));
}

export function takeScaleDraft() {
  const target = storage();
  if (!target) return null;

  const draft = readScaleDraft();
  if (!draft) return null;

  const newSongId = target.getItem(NEW_SONG_KEY) || '';
  target.removeItem(DRAFT_KEY);
  target.removeItem(FLOW_KEY);
  target.removeItem(NEW_SONG_KEY);

  return { draft, newSongId };
}
