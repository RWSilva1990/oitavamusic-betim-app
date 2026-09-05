import { useEffect, useMemo, useState } from 'react';
import { ExternalLink, Music2, Search, Youtube } from 'lucide-react';
import { C } from '@/lib/theme';
import { normalizeStr } from '@/lib/db';
import { useData } from '@/lib/data';
import { Btn, PageTitle } from '../ui-kit';

const TRANSPOSE_RESULT_EVENT = 'oitava:transpose-open-result';

export default function TestSongKeyPage() {
  const { songs } = useData();
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [status, setStatus] = useState('');

  const selected = songs.find((song) => song.id === selectedId) || null;
  const filtered = useMemo(() => {
    const query = normalizeStr(search);
    return [...songs]
      .filter((song) => !query || normalizeStr(song.name).includes(query))
      .sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'pt-BR', { sensitivity: 'base' }));
  }, [songs, search]);

  useEffect(() => {
    const handleResult = (event) => {
      const detail = event?.detail || {};
      if (detail.ok === false && detail.reason === 'not-installed') {
        setStatus('O app Transpose não foi encontrado neste aparelho.');
      }
    };
    window.addEventListener(TRANSPOSE_RESULT_EVENT, handleResult);
    return () => window.removeEventListener(TRANSPOSE_RESULT_EVENT, handleResult);
  }, []);

  const openInTranspose = () => {
    const url = String(selected?.youtubeUrl || '').trim();
    if (!url) {
      setStatus('Esta música não possui link do YouTube cadastrado.');
      return;
    }

    setStatus('');
    if (window.OitavaNative?.openInTranspose) {
      window.OitavaNative.openInTranspose(url);
      return;
    }

    window.open(url, '_blank', 'noopener,noreferrer');
    setStatus('No navegador, a referência foi aberta no YouTube. A integração direta com o Transpose funciona no app Android.');
  };

  return (
    <div style={{ padding: 24, maxWidth: 860 }}>
      <PageTitle title="Testar tom de música" subtitle="Escolha uma música do repertório e abra a referência diretamente no Transpose." />

      <div style={{ marginBottom: 16, padding: '12px 14px', background: C.bgInput, borderRadius: 10, color: C.textSecondary, fontSize: 12, lineHeight: 1.6 }}>
        O Oitava envia o link do YouTube já cadastrado no repertório. O Transpose abre a música usando o player e os controles de pitch dele.
      </div>

      <div className="search-wrap" style={{ marginBottom: 14 }}>
        <Search size={15} color={C.textSecondary} />
        <input className="input-field" placeholder="Buscar música no repertório..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div style={{ display: 'grid', gap: 8, maxHeight: 360, overflowY: 'auto', paddingRight: 2 }}>
        {filtered.length === 0 ? (
          <div className="empty-state"><Music2 size={36} style={{ opacity: 0.25, marginBottom: 10 }} /><p>Nenhuma música encontrada</p></div>
        ) : filtered.map((song) => {
          const active = selectedId === song.id;
          return (
            <button
              key={song.id}
              type="button"
              onClick={() => { setSelectedId(song.id); setStatus(''); }}
              className="card"
              style={{ width: '100%', textAlign: 'left', cursor: 'pointer', border: active ? `1.5px solid ${C.accent}` : undefined, background: active ? C.accentGlow : undefined }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.bgInput, flexShrink: 0 }}><Music2 size={18} color={C.accent} /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, color: C.textPrimary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{song.name}</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4, fontSize: 11, color: C.textSecondary }}>
                    <span>{song.youtubeUrl ? 'YouTube disponível' : 'Sem link do YouTube'}</span>
                    {song.originalKey && <span>• Tom original: {song.originalKey}</span>}
                    {song.bpm && <span>• {song.bpm} BPM</span>}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {selected && (
        <div className="card" style={{ marginTop: 18 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <Youtube size={22} color="#E8463A" style={{ marginTop: 2, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: C.textPrimary }}>{selected.name}</div>
              <div style={{ marginTop: 6, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {selected.originalKey && <span className="tag green">Tom original: {selected.originalKey}</span>}
                {selected.bpm && <span className="tag">{selected.bpm} BPM</span>}
                {selected.timeSignature && <span className="tag">Compasso: {selected.timeSignature}</span>}
              </div>
              {!selected.youtubeUrl && <div style={{ marginTop: 10, color: C.danger, fontSize: 12 }}>Esta música não possui link do YouTube cadastrado.</div>}
            </div>
          </div>

          <Btn onClick={openInTranspose} disabled={!selected.youtubeUrl} style={{ marginTop: 16, width: '100%', justifyContent: 'center' }}>
            <ExternalLink size={15} />Abrir no Transpose
          </Btn>
        </div>
      )}

      {status && <div style={{ marginTop: 14, padding: '10px 12px', borderRadius: 9, background: C.bgInput, color: C.textSecondary, fontSize: 12, lineHeight: 1.5 }}>{status}</div>}
    </div>
  );
}
