import { Check, ExternalLink, Music2 } from 'lucide-react';
import { C } from '@/lib/theme';
import { Btn, Modal } from './ui-kit';

const CHROMATIC_SHARPS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const DISPLAY_FLATS = { 'C#': 'Db', 'D#': 'Eb', 'F#': 'Gb', 'G#': 'Ab', 'A#': 'Bb' };

const NOTE_ALIASES = {
  C: 'C', 'C#': 'C#', DB: 'C#', DO: 'C', 'DO#': 'C#', REB: 'C#',
  D: 'D', 'D#': 'D#', EB: 'D#', RE: 'D', 'RE#': 'D#', MIB: 'D#',
  E: 'E', MI: 'E',
  F: 'F', 'F#': 'F#', GB: 'F#', FA: 'F', 'FA#': 'F#', SOLB: 'F#',
  G: 'G', 'G#': 'G#', AB: 'G#', SOL: 'G', 'SOL#': 'G#', LAB: 'G#',
  A: 'A', 'A#': 'A#', BB: 'A#', LA: 'A', 'LA#': 'A#', SIB: 'A#',
  B: 'B', SI: 'B',
};

function normalizeNote(value) {
  return String(value || '')
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/♯/g, '#')
    .replace(/♭/g, 'B')
    .replace(/\s+/g, '');
}

function parseKey(value) {
  const raw = normalizeNote(value);
  const match = raw.match(/^([A-G](?:#|B)?|DO#?|REB|RE#?|MIB|MI|FA#?|SOLB|SOL#?|LAB|LA#?|SIB|SI)(.*)$/);
  if (!match) return null;
  const root = NOTE_ALIASES[match[1]];
  if (!root) return null;
  return { root, suffix: match[2] || '' };
}

function transposeKey(value, semitones) {
  const parsed = parseKey(value);
  if (!parsed) return '';
  const index = CHROMATIC_SHARPS.indexOf(parsed.root);
  const next = CHROMATIC_SHARPS[(index + semitones + 120) % 12];
  return `${DISPLAY_FLATS[next] || next}${parsed.suffix}`;
}

function shiftLabel(semitones) {
  if (semitones === 0) return 'Original';
  const sign = semitones > 0 ? '+' : '−';
  const abs = Math.abs(semitones);
  const tones = abs / 2;
  const text = Number.isInteger(tones) ? String(tones) : String(tones).replace('.5', '½');
  return `${sign}${text} tom${tones === 1 ? '' : 's'}`;
}

export default function KeyTestAssistant({ song, currentKey, onApply, onClose }) {
  if (!song) return null;

  const originalKey = String(song.originalKey || '').trim();
  const parsed = parseKey(originalKey);
  const shifts = [-4, -3, -2, -1, 0, 1, 2, 3, 4];

  return (
    <Modal title={`Assistente de tom · ${song.name}`} onClose={onClose}>
      <div style={{ padding: '12px 14px', background: C.bgInput, borderRadius: 10, marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: C.textSecondary, marginBottom: 4 }}>Tom original do repertório</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: C.textPrimary }}>{originalKey || 'Não informado'}</div>
        {currentKey && <div style={{ marginTop: 5, fontSize: 12, color: C.textSecondary }}>Tom atual desta escala: <strong style={{ color: C.accent }}>{currentKey}</strong></div>}
      </div>

      {song.youtubeUrl && (
        <a href={song.youtubeUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '10px 12px', marginBottom: 14, border: `1px solid ${C.border}`, borderRadius: 9, color: C.textPrimary, textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>
          <ExternalLink size={14} />Abrir referência no YouTube
        </a>
      )}

      {!originalKey ? (
        <div style={{ padding: '12px 14px', background: C.bgInput, borderRadius: 9, color: C.textSecondary, fontSize: 13, lineHeight: 1.6 }}>
          Cadastre primeiro o Tom original desta música no Repertório para usar o assistente de transposição.
        </div>
      ) : !parsed ? (
        <div style={{ padding: '12px 14px', background: C.bgInput, borderRadius: 9, color: C.textSecondary, fontSize: 13, lineHeight: 1.6 }}>
          Não consegui interpretar o Tom original “{originalKey}”. Use uma notação como C, C#, Db, D, Eb, F#, Bb, Ré, Mi ou Sol.
        </div>
      ) : (
        <>
          <div style={{ fontSize: 12, color: C.textSecondary, marginBottom: 8, lineHeight: 1.5 }}>
            Escolha quanto deseja subir ou descer. O resultado abaixo altera somente o <strong>Tom desta escala</strong>; o Tom original do repertório permanece intacto.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 7 }}>
            {shifts.map((semitones) => {
              const result = transposeKey(originalKey, semitones);
              const selected = currentKey && normalizeNote(currentKey) === normalizeNote(result);
              return (
                <button
                  key={semitones}
                  type="button"
                  onClick={() => onApply(result)}
                  style={{ padding: '10px 7px', borderRadius: 9, border: `1px solid ${selected ? C.accent : C.border}`, background: selected ? C.accentGlow : C.bgHover, color: selected ? C.accent : C.textPrimary, cursor: 'pointer' }}
                >
                  <div style={{ fontSize: 10, color: selected ? C.accent : C.textSecondary, marginBottom: 3 }}>{shiftLabel(semitones)}</div>
                  <div style={{ fontSize: 16, fontWeight: 800 }}>{result}</div>
                  {selected && <Check size={11} style={{ margin: '4px auto 0' }} />}
                </button>
              );
            })}
          </div>
          <div style={{ marginTop: 14, padding: '10px 12px', borderRadius: 9, background: C.bgInput, fontSize: 11, color: C.textSecondary, lineHeight: 1.55, display: 'flex', gap: 8 }}>
            <Music2 size={14} style={{ flexShrink: 0, marginTop: 1 }} />
            Esta etapa calcula e registra a transposição musical. Ela ainda não modifica o áudio do YouTube dentro do Oitava.
          </div>
        </>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
        <Btn variant="secondary" onClick={onClose}>Fechar</Btn>
      </div>
    </Modal>
  );
}
