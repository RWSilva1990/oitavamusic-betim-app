import { useEffect, useMemo, useState } from 'react';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { AlertCircle, CheckCircle2, Download, ExternalLink, Music, Search, Smartphone, Youtube } from 'lucide-react';
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
  const [transposeInstalled, setTransposeInstalled] = useState(null);
  const [opening, setOpening] = useState(false);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    const android = Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
    setNativeAndroid(android);
    if (!android) return undefined;

    let alive = true;
    const refreshInstallStatus = async () => {
      try {
        const result = await TransposeLauncher.isInstalled();
        if (alive) setTransposeInstalled(Boolean(result?.installed));
      } catch (error) {
        console.warn('Falha ao verificar instalação do Transpose:', error);
        if (alive) setTransposeInstalled(false);
      }
    };

    refreshInstallStatus();
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') refreshInstallStatus();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      alive = false;
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
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

  const openInstallPage = async () => {
    if (!nativeAndroid || opening) return;
    setOpening(true);
    setStatus(null);
    try {
      const result = await TransposeLauncher.openInstallPage();
      if (!result?.opened) throw new Error('install-page-not-opened');
      setStatus({ type: 'info', message: 'Baixe e instale o APK do Transpose. Ao terminar, volte ao Oitava Music; a verificação será feita automaticamente.' });
    } catch (error) {
      console.warn('Falha ao abrir página de instalação do Transpose:', error);
      setStatus({ type: 'error', message: 'Não foi possível abrir a página de instalação do Transpose neste aparelho.' });
    } finally {
      setOpening(false);
    }
  };

  const openInTranspose = async () => {
    if (!selectedSong || !hasYoutube || !nativeAndroid || opening) return;

    if (transposeInstalled === false) {
      setStatus({ type: 'info', message: 'Instale o Transpose primeiro. Depois volte ao Oitava Music e toque novamente em “Abrir no Transpose”.' });
      return;
    }

    setOpening(true);
    setStatus(null);
    try {
      const result = await TransposeLauncher.open({ url: youtubeUrl });
      if (result?.opened) {
        setStatus({ type: 'success', message: 'Música enviada ao Transpose. Ao voltar ao Oitava, sua seleção continuará aqui.' });
      } else if (result?.reason === 'not-installed') {
        setTransposeInstalled(false);
        setStatus({ type: 'info', message: 'O Transpose ainda não está instalado. Use o botão de instalação abaixo e depois retorne ao Oitava Music.' });
      } else {
        setStatus({ type: 'error', message: 'Não foi possível abrir esta música no Transpose.' });
      }
    } catch (error) {
      console.warn('Falha ao abrir música no Transpose:', error);
      setStatus({ type: 'error', message: 'Não foi possível abrir o Transpose neste aparelho.' });
    } finally {
      setOpening(false);
    }
  };

  const statusColors = status?.type === 'success'
    ? { background: `${C.success}12`, border: `${C.success}33`, color: C.success }
    : status?.type === 'info'
      ? { background: C.accentGlow, border: `${C.accent}33`, color: C.textSecondary }
      : { background: `${C.danger}12`, border: `${C.danger}33`, color: C.danger };

  return (
    <div style={{ padding: 24, maxWidth: 860 }}>
      <PageTitle
        title="Testar tom de música"
        subtitle="Escolha uma música do repertório e continue o teste de tom no Transpose."
      />

      <div className="card" style={{ marginBottom: 18, display: 'flex', alignItems: 'flex-start', gap: 12, lineHeight: 1.55 }}>
        <div style={{ width: 38, height: 38, borderRadius: 11, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.accentGlow, color: C.accent }}>
          <Smartphone size={19} />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: C.textPrimary, marginBottom: 3 }}>Oitava + Transpose</div>
          <div style={{ fontSize: 12, color: C.textSecondary }}>
            O Oitava seleciona a música e envia o link do YouTube. No Transpose você reproduz a referência e sobe ou desce o tom em tempo real.
          </div>
          {!nativeAndroid && (
            <div style={{ marginTop: 7, fontSize: 11.5, fontWeight: 700, color: C.accent }}>
              Esta integração direta fica disponível no aplicativo Android do Oitava Music.
            </div>
          )}
        </div>
      </div>

      {nativeAndroid && transposeInstalled === false && (
        <div className="card" style={{ marginBottom: 18, borderColor: `${C.accent}55` }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <Download size={19} color={C.accent} style={{ flexShrink: 0, marginTop: 1 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: C.textPrimary }}>Prepare o Transpose para usar esta ferramenta</div>
              <div style={{ marginTop: 8, display: 'grid', gap: 7, fontSize: 12, lineHeight: 1.5, color: C.textSecondary }}>
                <div><strong style={{ color: C.textPrimary }}>1.</strong> Abra a página de download do Transpose.</div>
                <div><strong style={{ color: C.textPrimary }}>2.</strong> Baixe e instale o APK mais recente disponibilizado pelo projeto.</div>
                <div><strong style={{ color: C.textPrimary }}>3.</strong> Volte ao Oitava Music. A instalação será reconhecida automaticamente.</div>
              </div>
              <Btn onClick={openInstallPage} disabled={opening} style={{ marginTop: 13, justifyContent: 'center' }}>
                <Download size={15} />{opening ? 'Abrindo...' : 'Instalar Transpose'}
              </Btn>
            </div>
          </div>
        </div>
      )}

      {nativeAndroid && transposeInstalled === true && (
        <div style={{ marginBottom: 14, padding: '9px 12px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8, background: `${C.success}12`, border: `1px solid ${C.success}33`, color: C.success, fontSize: 12, fontWeight: 700 }}>
          <CheckCircle2 size={15} />Transpose instalado e pronto para uso.
        </div>
      )}

      <div className="search-wrap" style={{ marginBottom: 12 }}>
        <Search size={15} color={C.textSecondary} />
        <input className="input-field" placeholder="Buscar música do repertório..." value={search} onChange={(event) => setSearch(event.target.value)} />
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
            <button type="button" key={song.id} aria-pressed={selected} onClick={() => selectSong(song)} className="card" style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 11, textAlign: 'left', cursor: 'pointer', borderColor: selected ? C.accent : C.border, boxShadow: selected ? `0 0 0 1px ${C.accent}33` : undefined, fontFamily: 'inherit' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: selected ? C.accentGlow : C.bgInput, color: selected ? C.accent : C.textSecondary }}>
                <Music size={17} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 750, color: C.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{song.name}</div>
                <div style={{ marginTop: 3, display: 'flex', gap: 7, flexWrap: 'wrap', alignItems: 'center' }}>
                  {song.originalKey && <span className="tag green">Tom original: {song.originalKey}</span>}
                  {songHasYoutube ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10.5, color: '#E8463A', fontWeight: 700 }}><Youtube size={11} />YouTube</span> : <span style={{ fontSize: 10.5, color: C.textSecondary }}>Sem link do YouTube</span>}
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
              <AlertCircle size={15} style={{ marginTop: 1, flexShrink: 0 }} />Esta música não possui um link válido do YouTube cadastrado no repertório.
            </div>
          )}

          <Btn onClick={openInTranspose} disabled={!hasYoutube || !nativeAndroid || opening || transposeInstalled === false} style={{ marginTop: 16, width: '100%', justifyContent: 'center', minHeight: 42 }}>
            <ExternalLink size={15} />{opening ? 'Abrindo Transpose...' : 'Abrir no Transpose'}
          </Btn>
        </div>
      )}

      {status && (
        <div role="status" style={{ marginTop: 12, padding: '10px 12px', borderRadius: 9, fontSize: 12, lineHeight: 1.5, background: statusColors.background, border: `1px solid ${statusColors.border}`, color: statusColors.color }}>
          {status.message}
        </div>
      )}
    </div>
  );
}
