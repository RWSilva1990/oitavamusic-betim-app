import { useState } from 'react';
import Papa from 'papaparse';
import { Music, Plus, Edit2, Trash2, Check, Search, Upload, Youtube, AlertCircle, Mic2 } from 'lucide-react';
import { C } from '@/lib/theme';
import { genId } from '@/lib/db';
import { Btn, Confirm, Field, Inp, Modal, PageTitle } from '../ui-kit';
import AudioSection from '../AudioSection';
import { useData } from '@/lib/data';

export default function SongsPage() {
  const { songs, setSongs } = useData();
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [audioModal, setAudioModal] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [form, setForm] = useState({ name: '', youtubeUrl: '', bpm: '' });
  const [importModal, setImportModal] = useState(false);
  const [preview, setPreview] = useState([]);
  const [dupWarning, setDupWarning] = useState('');

  const openAdd = () => { setForm({ name: '', youtubeUrl: '', bpm: '' }); setDupWarning(''); setModal('add'); };
  const openEdit = (s) => { setForm({ id: s.id, name: s.name, youtubeUrl: s.youtubeUrl || '', bpm: s.bpm || '' }); setDupWarning(''); setModal(s); };

  const save = () => {
    if (!form.name.trim()) return;
    const isDup = songs.some(
      (s) => s.name.trim().toLowerCase() === form.name.trim().toLowerCase() && (modal === 'add' || s.id !== form.id)
    );
    if (isDup) { setDupWarning(`"${form.name.trim()}" já está no repertório.`); return; }
    setDupWarning('');
    if (modal === 'add') setSongs((p) => [...p, { ...form, audios: [], id: genId() }]);
    else setSongs((p) => p.map((s) => (s.id === form.id ? { ...s, ...form } : s)));
    setModal(null);
  };
  const del = (id) => { setSongs((p) => p.filter((s) => s.id !== id)); setConfirm(null); };

  const setAudios = (songId, audios) => {
    setSongs((p) => p.map((s) => (s.id === songId ? { ...s, audios } : s)));
    setAudioModal((m) => (m && m.id === songId ? { ...m, audios } : m));
  };

  const handleCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: ({ data }) => {
        const rows = data
          .map((row) => {
            const keys = Object.keys(row);
            const nk = keys.find((k) => /nome|name|musica|titulo|title/i.test(k)) || keys[0];
            const uk = keys.find((k) => /url|link|youtube/i.test(k)) || keys[1];
            const bk = keys.find((k) => /bpm/i.test(k));
            return { name: row[nk]?.trim() || '', youtubeUrl: uk ? row[uk]?.trim() || '' : '', bpm: bk ? row[bk]?.trim() || '' : '' };
          })
          .filter((r) => r.name);
        setPreview(rows);
      },
    });
    e.target.value = '';
  };

  const doImport = () => {
    setSongs((p) => [...p, ...preview.map((s) => ({ ...s, audios: [], id: genId() }))]);
    setImportModal(false);
    setPreview([]);
  };

  const filtered = songs.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ padding: 24, maxWidth: 860 }}>
      <PageTitle title="Repertório" subtitle={`${songs.length} música${songs.length !== 1 ? 's' : ''}`}>
        <Btn variant="secondary" onClick={() => { setPreview([]); setImportModal(true); }}><Upload size={15} />Importar CSV</Btn>
        <Btn onClick={openAdd}><Plus size={15} />Nova Música</Btn>
      </PageTitle>

      <div className="search-wrap">
        <Search size={15} color={C.textSecondary} />
        <input className="input-field" placeholder="Buscar músicas..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state"><Music size={38} style={{ marginBottom: 12, opacity: 0.25 }} /><p>Nenhuma música encontrada</p></div>
      ) : (
        <div style={{ display: 'grid', gap: 8 }}>
          {filtered.map((s, i) => {
            const hues = [200, 260, 320, 30, 160, 50, 290, 10];
            const hue = hues[i % hues.length];
            const nAudios = (s.audios || []).length;
            return (
              <div key={s.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, flexShrink: 0, background: `hsl(${hue},70%,94%)`, border: `1.5px solid hsl(${hue},60%,78%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: `hsl(${hue},55%,42%)` }}>
                  {s.name.trim()[0]?.toUpperCase() || '🎵'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: C.textPrimary, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    {s.youtubeUrl ? (
                      <a href={s.youtubeUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#E8463A', fontSize: 12, textDecoration: 'none' }}>
                        <Youtube size={12} />Abrir no YouTube
                      </a>
                    ) : (
                      <span style={{ fontSize: 12, color: C.textSecondary }}>Sem link</span>
                    )}
                    {s.bpm && (
                      <span style={{ fontSize: 11, fontWeight: 700, color: C.accent, background: C.accentGlow, border: `1px solid ${C.accent}33`, borderRadius: 6, padding: '1px 7px' }}>♩ {s.bpm} BPM</span>
                    )}
                    {nAudios > 0 && <span className="tag green">🎧 {nAudios} áudio{nAudios !== 1 ? 's' : ''}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 2 }}>
                  <Btn variant="ghost" title="Áudios de voz" onClick={() => setAudioModal(s)}><Mic2 size={14} /></Btn>
                  <Btn variant="ghost" onClick={() => openEdit(s)}><Edit2 size={14} /></Btn>
                  <Btn variant="ghost" className="del" onClick={() => setConfirm(s.id)}><Trash2 size={14} /></Btn>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {audioModal && (
        <Modal title={`Áudios · ${audioModal.name}`} onClose={() => setAudioModal(null)} wide>
          <p style={{ fontSize: 13, color: C.textSecondary, marginBottom: 14, lineHeight: 1.6 }}>
            Envie arquivos de voz (MP3, M4A, WAV, OGG) para esta música. Os membros escalados ouvem esses áudios na área deles.
          </p>
          <AudioSection song={audioModal} onChange={(audios) => setAudios(audioModal.id, audios)} />
        </Modal>
      )}

      {modal && (
        <Modal title={modal === 'add' ? 'Nova Música' : 'Editar Música'} onClose={() => setModal(null)}>
          <Inp label="Nome da Música *" value={form.name} onChange={(e) => { setForm((f) => ({ ...f, name: e.target.value })); setDupWarning(''); }} placeholder="Ex: Oceanos" />
          {dupWarning && (
            <div style={{ marginTop: -10, marginBottom: 14, padding: '8px 12px', background: `${C.danger}18`, border: `1px solid ${C.danger}44`, borderRadius: 8, color: C.danger, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircle size={14} />{dupWarning}
            </div>
          )}
          <Inp label="Link do YouTube" value={form.youtubeUrl} onChange={(e) => setForm((f) => ({ ...f, youtubeUrl: e.target.value }))} placeholder="https://youtube.com/watch?v=..." />
          <Inp label="BPM (Batidas por Minuto)" type="number" min="40" max="300" value={form.bpm} onChange={(e) => setForm((f) => ({ ...f, bpm: e.target.value }))} placeholder="Ex: 120" />
          {modal !== 'add' && (
            <Field label="Áudios de voz">
              <AudioSection song={modal} onChange={(audios) => setAudios(modal.id, audios)} />
            </Field>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Btn variant="secondary" onClick={() => setModal(null)}>Cancelar</Btn>
            <Btn onClick={save}><Check size={14} />Salvar</Btn>
          </div>
        </Modal>
      )}

      {importModal && (
        <Modal title="Importar Músicas via CSV" onClose={() => { setImportModal(false); setPreview([]); }} wide>
          <div style={{ padding: 14, background: C.bgInput, borderRadius: 8, marginBottom: 16, fontSize: 13, color: C.textSecondary, lineHeight: 1.7 }}>
            <strong style={{ color: C.accent }}>Formato esperado:</strong> arquivo <code>.csv</code> com colunas <code>nome</code>, <code>url</code> e opcionalmente <code>bpm</code>.
          </div>
          <label style={{ display: 'block', padding: '24px 16px', border: `2px dashed ${C.border}`, borderRadius: 10, textAlign: 'center', cursor: 'pointer', color: C.textSecondary, marginBottom: 16 }}>
            <Upload size={26} style={{ display: 'block', margin: '0 auto 8px' }} />
            Clique para selecionar o arquivo CSV
            <input type="file" accept=".csv" onChange={handleCSV} style={{ display: 'none' }} />
          </label>
          {preview.length > 0 && (
            <>
              <p style={{ color: C.success, fontSize: 13, marginBottom: 10 }}>✓ {preview.length} música(s) encontrada(s)</p>
              <div style={{ maxHeight: 200, overflowY: 'auto', display: 'grid', gap: 4, marginBottom: 16 }}>
                {preview.map((s, i) => (
                  <div key={i} style={{ padding: '7px 12px', background: C.bgHover, borderRadius: 6, display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 13 }}>
                    <span style={{ color: C.textPrimary }}>{s.name}</span>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      {s.bpm && <span style={{ color: C.accent, fontSize: 11 }}>♩ {s.bpm} BPM</span>}
                      {s.youtubeUrl && <span style={{ color: C.success, fontSize: 11 }}>✓ YouTube</span>}
                    </div>
                  </div>
                ))}
              </div>
              <Btn onClick={doImport}><Check size={14} />Importar {preview.length} música(s)</Btn>
            </>
          )}
        </Modal>
      )}
      {confirm && <Confirm msg="Excluir esta música do repertório?" onOk={() => del(confirm)} onCancel={() => setConfirm(null)} />}
    </div>
  );
}
