import { useEffect, useMemo, useState } from 'react';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { AlertCircle, CheckCircle2, ExternalLink, Music, Search, Smartphone, Youtube } from 'lucide-react';
import { C } from '@/lib/theme';
import { getYtId, normalizeStr } from '@/lib/db';
import { useData } from '@/lib/data';
import { Btn, PageTitle } from '../ui-kit';

const TransposeLauncher = registerPlugin('TransposeLauncher');

export default function PitchTestPage() {
  const { songs } = useData();
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [nativeAndroid, setNativeAndroid] = useState(false);
  const [opening, setOpening] = useState(false);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    setNativeAndroid(Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android');
  }, []);

  const orderedSongs = useMemo(
    () => [...songs].sort((a, b) => String(a?.name || '').localeCompare(String(b?.name || ''), 'pt-BR', { sensitivity: 'base' })),
    [songs],
  );

  const filteredSongs = useMemo(() => {
    const term = normalizeStr(search);
    if (!term) return orderedSongs.slice(0, 40);
    return orderedSongs.filter((song) => normalizeStr(song?.name).includes(term)).slice(0, 60);
  }, [orderedSongs, search]);

  const selectedSong = songs.find((song) => song.id === selectedId) || null;
  const youtubeUrl = String(selectedSong?.youtubeUrl || '').trim();
  const hasYoutube = Boolean(getYtId(youtubeUrl));

  const selectSong = (song) => {
    setSelectedId(song.id);
    setStatus(null);
  };

  const openInTranspose = async () => {
    if (!selectedSong || !hasYoutube || !nativeAndroid || opening) return;

    setOpening(true);
    setStatus(null);
    try {
      const result = await TransposeLauncher.open({ url: youtubeUrl });
      if (result?.opened) {
        setStatus({ type: 'success', message: 'Link enviado ao Transpose. Ao voltar ao Oitava, sua seleção continuará aqui.' });
      } else {
        setStatus({
          type: 'error',
          message: result?.reason === 'not-installed'
            ? 'O Transpose não está instalado ou esta versão ainda não aceita links enviados pelo Oitava.'
            : 'Não foi possível abrir esta música no Transpose.',
        });
      }
    } catch (error) {
      console.warn('Falha ao abrir música no Transpose:', error);
      setStatus({ type: 'error', message: 'Não foi possível abrir o Transpose neste aparelho.' });
    } finally {
      setOpening(false);
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 860 }}>
      <PageTitle
        title="Testar tom de música"
        subtitle="Escolha uma música do repertório e envie a referência do YouTube diretamente para o Transpose."
      />

      <div className="card" style={{ marginBottom: 18, display: 'flex', alignItems: 'flex-start', gap: 12, lineHeight: 1.55 }}>
        <div style={{ width: 38, height: 38, borderRadius: 11, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.accentGlow, color: C.accent }}>
          <Smartphone size={19} />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: C.textPrimary, marginBottom: 3 }}>Como funciona</div>
          <div style={{ fontSize: 12, color: C.textSecondary }}>
            O Oitava apenas envia o link da música. A reprodução e a alteração de tom continuam sendo feitas dentro do Transpose.
          </div>
          {!nativeAndroid && (
            <div style={{ marginTop: 7, fontSize: 11.5, fontWeight: 700, color: C.accent }}>
              A abertura direta no Transpose fica disponível no aplicativo Android do Oitava Music.
            </div>
          )}
        </div>
      </div>

      <div className="search-wrap" style={{ marginBottom: 12 }}>
        <Search size={15} color={C.textSecondary} />
        <input
          className="input-field"
          placeholder="Buscar música do repertório..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      <div style={{ display: 'grid', gap: 7, maxHeight: 360, overflowY: 'auto', paddingRight: 2 }}>
        {filteredSongs.length === 0 ? (
          <div className="empty-state" style={{ minHeight: 150 }}>
            <Music size={34} style={{ marginBottom: 10, opacity: 0.25 }} />
            <p>Nenhuma música encontrada</p>
          </div>
        ) : filteredSongs.map((song) => {
          const selected = song.id === selectedId;
          const songHasYoutube = Boolean(getYtId(String(song.youtubeUrl || '').trim()));
          return (
            <button
              type="button"
              key={song.id}
              aria-pressed={selected}
              onClick={() => selectSong(song)}
              className="card"
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 11,
                textAlign: 'left',
                cursor: 'pointer',
                borderColor: selected ? C.accent : C.border,
                boxShadow: selected ? `0 0 0 1px ${C.accent}33` : undefined,
                fontFamily: 'inherit',
              }}
            >
              <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: selected ? C.accentGlow : C.bgInput, color: selected ? C.accent : C.textSecondary }}>
                <Music size={17} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 750, color: C.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{song.name}</div>
                <div style={{ marginTop: 3, display: 'flex', gap: 7, flexWrap: 'wrap', alignItems: 'center' }}>
                  {song.originalKey && <span className="tag green">Tom original: {song.originalKey}</span>}
                  {songHasYoutube ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10.5, color: '#E8463A', fontWeight: 700 }}><Youtube size={11} />YouTube</span>
                  ) : (
                    <span style={{ fontSize: 10.5, color: C.textSecondary }}>Sem link do YouTube</span>
                  )}
                </div>
              </div>
              {selected && <CheckCircle2 size={18} color={C.accent} />}
            </button>
          );
        })}
      </div>

      {selectedSong && (
        <div className="card" style={{ marginTop: 18, padding: 18 }}>
          <div style={{ fontSize: 11, color: C.textSecondary, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 5 }}>Música selecionada</div>
          <div style={{ fontSize: 17, fontWeight: 800, color: C.textPrimary }}>{selectedSong.name}</div>
          <div style={{ marginTop: 7, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {selectedSong.originalKey && <span className="tag green">Tom original: {selectedSong.originalKey}</span>}
            {selectedSong.bpm && <span className="tag">{selectedSong.bpm} BPM</span>}
          </div>

          {!hasYoutube && (
            <div style={{ marginTop: 13, padding: '10px 12px', borderRadius: 9, display: 'flex', gap: 8, alignItems: 'flex-start', background: `${C.danger}12`, border: `1px solid ${C.danger}33`, color: C.danger, fontSize: 12, lineHeight: 1.5 }}>
              <AlertCircle size={15} style={{ marginTop: 1, flexShrink: 0 }} />
              Esta música não possui um link válido do YouTube cadastrado no repertório.
            </div>
          )}

          <Btn
            onClick={openInTranspose}
            disabled={!hasYoutube || !nativeAndroid || opening}
            style={{ marginTop: 16, width: '100%', justifyContent: 'center', minHeight: 42 }}
          >
            <ExternalLink size={15} />
            {opening ? 'Abrindo Transpose...' : 'Abrir no Transpose'}
          </Btn>
        </div>
      )}

      {status && (
        <div
          role="status"
          style={{
            marginTop: 12,
            padding: '10px 12px',
            borderRadius: 9,
            fontSize: 12,
            lineHeight: 1.5,
            background: status.type === 'success' ? `${C.success}12` : `${C.danger}12`,
            border: `1px solid ${status.type === 'success' ? C.success : C.danger}33`,
            color: status.type === 'success' ? C.success : C.danger,
          }}
        >
          {status.message}
        </div>
      )}
    </div>
  );
}
