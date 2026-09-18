import { useMemo, useState } from 'react';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { ExternalLink, Music2, Search, Youtube } from 'lucide-react';
import { C } from '@/lib/theme';
import { useData } from '@/lib/data';
import { Btn, PageTitle } from '../ui-kit';

const PitchHandoff = registerPlugin('PitchHandoff');
const TRANSPOSE_RELEASES_URL = 'https://github.com/joh9911/Transpose/releases/latest';

function isYoutubeUrl(value) {
  try {
    const url = new URL(String(value || '').trim());
    const host = url.hostname.replace(/^www\./, '').toLowerCase();
    return ['youtube.com', 'm.youtube.com', 'youtu.be'].includes(host);
  } catch {
    return false;
  }
}

export default function SongKeyTesterPage() {
  const { songs } = useData();
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [feedback, setFeedback] = useState(null);

  const isAndroidApk = Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
  const selected = (songs || []).find((song) => song.id === selectedId) || null;
  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-BR');
    return [...(songs || [])]
      .filter((song) => !term || String(song.name || '').toLocaleLowerCase('pt-BR').includes(term))
      .sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'pt-BR', { sensitivity: 'base' }));
  }, [songs, search]);

  const hasYoutube = Boolean(selected?.youtubeUrl && isYoutubeUrl(selected.youtubeUrl));

  async function openTranspose() {
    setFeedback(null);
    if (!selected) {
      setFeedback({ type: 'error', text: 'Selecione uma música do repertório.' });
      return;
    }
    if (!hasYoutube) {
      setFeedback({ type: 'error', text: 'Esta música não possui um link válido do YouTube cadastrado.' });
      return;
    }
    if (!isAndroidApk) {
      setFeedback({ type: 'info', text: 'Esta ferramenta está disponível no APK Android do Oitava Music.' });
      return;
    }

    try {
      await PitchHandoff.openInTranspose({ url: selected.youtubeUrl });
      setFeedback({ type: 'success', text: 'Abrindo a música no Transpose...' });
    } catch (error) {
      const message = String(error?.message || '');
      if (message.includes('TRANSPOSE_UNAVAILABLE')) {
        setFeedback({ type: 'error', text: 'O Transpose compatível não foi encontrado neste aparelho.' });
      } else {
        setFeedback({ type: 'error', text: 'Não foi possível abrir a música no Transpose.' });
      }
    }
  }

  async function openTransposeDownload() {
    try {
      await PitchHandoff.openTransposeStore();
    } catch {
      window.open(TRANSPOSE_RELEASES_URL, '_blank', 'noopener,noreferrer');
    }
  }

  const feedbackStyle = feedback?.type === 'success'
    ? { background: `${C.success}14`, borderColor: `${C.success}44`, color: C.success }
    : feedback?.type === 'error'
      ? { background: `${C.danger}12`, borderColor: `${C.danger}44`, color: C.danger }
      : { background: C.accentGlow, borderColor: `${C.accent}44`, color: C.textSecondary };

  return (
    <div style={{ padding: 24, maxWidth: 900 }}>
      <PageTitle
        title="Testar tom de música"
        subtitle="Escolha uma música do repertório e abra a referência do YouTube diretamente no Transpose."
      />

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: C.textSecondary, lineHeight: 1.6 }}>
          O Oitava Music usa o link do YouTube já cadastrado no repertório. O Transpose recebe essa referência e faz a reprodução e a alteração de tom.
        </div>
      </div>

      <div className="search-wrap" style={{ marginBottom: 12 }}>
        <Search size={15} color={C.textSecondary} />
        <input
          className="input-field"
          placeholder="Buscar música no repertório..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 14 }}>
        <div style={{ padding: '12px 14px', borderBottom: `1px solid ${C.border}`, fontSize: 12, fontWeight: 800, color: C.textPrimary }}>
          Repertório · {filtered.length} música{filtered.length !== 1 ? 's' : ''}
        </div>
        <div style={{ maxHeight: 340, overflowY: 'auto' }}>
          {filtered.length === 0 ? (
            <div className="empty-state" style={{ minHeight: 150 }}>
              <Music2 size={32} style={{ marginBottom: 10, opacity: 0.25 }} />
              <p>Nenhuma música encontrada</p>
            </div>
          ) : filtered.map((song) => {
            const active = song.id === selectedId;
            return (
              <button
                type="button"
                key={song.id}
                onClick={() => { setSelectedId(song.id); setFeedback(null); }}
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  textAlign: 'left',
                  border: 'none',
                  borderBottom: `1px solid ${C.border}`,
                  background: active ? C.accentGlow : 'transparent',
                  color: C.textPrimary,
                  cursor: 'pointer',
                }}
              >
                <div style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: active ? `${C.accent}22` : C.bgInput, color: C.accent, fontWeight: 800 }}>
                  {String(song.name || 'M').trim()[0]?.toUpperCase() || 'M'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{song.name}</div>
                  <div style={{ marginTop: 2, display: 'flex', gap: 7, flexWrap: 'wrap', fontSize: 10.5, color: C.textSecondary }}>
                    {song.originalKey && <span>Tom: {song.originalKey}</span>}
                    {song.bpm && <span>{song.bpm} BPM</span>}
                    {song.timeSignature && <span>{song.timeSignature}</span>}
                    {!song.youtubeUrl && <span style={{ color: C.danger }}>Sem link do YouTube</span>}
                  </div>
                </div>
                {song.youtubeUrl && <Youtube size={15} color="#E8463A" />}
              </button>
            );
          })}
        </div>
      </div>

      {selected && (
        <div className="card" style={{ display: 'grid', gap: 13 }}>
          <div>
            <div style={{ fontSize: 11, color: C.textSecondary, marginBottom: 4 }}>Música selecionada</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.textPrimary }}>{selected.name}</div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span className="tag green">Tom original: {selected.originalKey || 'Não informado'}</span>
            {selected.bpm && <span className="tag">♩ {selected.bpm} BPM</span>}
            {selected.timeSignature && <span className="tag">Compasso: {selected.timeSignature}</span>}
          </div>

          {selected.youtubeUrl ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, padding: '9px 10px', borderRadius: 9, background: C.bgInput, color: C.textSecondary, fontSize: 11 }}>
              <Youtube size={14} color="#E8463A" style={{ flexShrink: 0 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selected.youtubeUrl}</span>
            </div>
          ) : (
            <div style={{ padding: '9px 10px', borderRadius: 9, background: `${C.danger}10`, color: C.danger, fontSize: 11 }}>
              Esta música não possui link do YouTube cadastrado.
            </div>
          )}

          <Btn onClick={openTranspose} disabled={!hasYoutube} style={{ width: '100%', justifyContent: 'center' }}>
            <ExternalLink size={15} />Abrir no Transpose
          </Btn>

          <button
            type="button"
            onClick={openTransposeDownload}
            style={{ border: 0, background: 'transparent', color: C.textSecondary, textDecoration: 'underline', cursor: 'pointer', fontSize: 11 }}
          >
            Instalar / atualizar Transpose
          </button>
        </div>
      )}

      {feedback && (
        <div style={{ marginTop: 14, padding: '10px 12px', border: '1px solid', borderRadius: 9, fontSize: 11.5, lineHeight: 1.5, ...feedbackStyle }}>
          {feedback.text}
        </div>
      )}
    </div>
  );
}
