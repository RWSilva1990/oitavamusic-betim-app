import { useState } from 'react';
import Papa from 'papaparse';
import { Music, Plus, Edit2, Trash2, Check, Search, Upload, Download, Youtube, AlertCircle, Mic2 } from 'lucide-react';
import { C } from '@/lib/theme';
import { genId, normalizeStr } from '@/lib/db';
import { Btn, Confirm, Field, Inp, Modal, PageTitle } from '../ui-kit';
import AudioSection, { AudioPlayerList } from '../AudioSection';
import { useData } from '@/lib/data';
import { useAuth } from '@/lib/auth';

const TIME_SIGNATURES = ['2/4', '3/4', '4/4', '5/4', '6/8', '7/8', '9/8', '12/8'];

export default function SongsPage() {
  const { songs, setSongs } = useData();
  const auth = useAuth();
  const readOnly = !auth.isAdmin;
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [audioModal, setAudioModal] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [form, setForm] = useState({ name: '', youtubeUrl: '', bpm: '', originalKey: '', timeSignature: '' });
  const [importModal, setImportModal] = useState(false);
  const [preview, setPreview] = useState([]);
  const [dupWarning, setDupWarning] = useState('');

  const openAdd = () => {
    if (readOnly) return;
    setForm({ name: '', youtubeUrl: '', bpm: '', originalKey: '', timeSignature: '' });
    setDupWarning('');
    setModal('add');
  };

  const openEdit = (s) => {
    if (readOnly) return;
    setForm({ id: s.id, name: s.name, youtubeUrl: s.youtubeUrl || '', bpm: s.bpm || '', originalKey: s.originalKey || '', timeSignature: s.timeSignature || '' });
    setDupWarning('');
    setModal(s);
  };

  const save = () => {
    if (readOnly || !form.name.trim()) return;
    const isDup = songs.some((s) => s.name.trim().toLowerCase() === form.name.trim().toLowerCase() && (modal === 'add' || s.id !== form.id));
    if (isDup) {
      setDupWarning(`"${form.name.trim()}" já está no repertório.`);
      return;
    }
    setDupWarning('');
    if (modal === 'add') setSongs((p) => [...p, { ...form, audios: [], id: genId() }]);
    else setSongs((p) => p.map((s) => (s.id === form.id ? { ...s, ...form } : s)));
    setModal(null);
  };

  const del = (id) => {
    if (readOnly) return;
    setSongs((p) => p.filter((s) => s.id !== id));
    setConfirm(null);
  };

  const setAudios = (songId, audios) => {
    if (readOnly) return;
    setSongs((p) => p.map((s) => (s.id === songId ? { ...s, audios } : s)));
    setAudioModal((m) => (m && m.id === songId ? { ...m, audios } : m));
  };

  const exportCSV = () => {
    if (readOnly) return;
    const rows = [...songs]
      .sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'pt-BR', { sensitivity: 'base' }))
      .map((song) => ({
        nome: song.name || '',
        url: song.youtubeUrl || '',
        'tom original': song.originalKey || '',
        bpm: song.bpm || '',
        compasso: song.timeSignature || '',
      }));

    const csv = `\uFEFF${Papa.unparse(rows)}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    const date = new Date().toISOString().slice(0, 10);
    anchor.href = url;
    anchor.download = `repertorio-oitava-${date}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const handleCSV = (e) => {
    if (readOnly) return;
    const file = e.target.files[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: ({ data }) => {
        const rows = data.map((row) => {
          const keys = Object.keys(row);
          const nk = keys.find((k) => /nome|name|musica|titulo|title/i.test(k)) || keys[0];
          const uk = keys.find((k) => /url|link|youtube/i.test(k)) || keys[1];
          const bk = keys.find((k) => /bpm/i.test(k));
          const ok = keys.find((k) => /tom\s*original|original\s*key|^tom$|^key$/i.test(k));
          const tk = keys.find((k) => /compasso|time\s*signature/i.test(k));
          const importedSignature = tk ? row[tk]?.trim() || '' : '';
          return {
            name: row[nk]?.trim() || '',
            youtubeUrl: uk ? row[uk]?.trim() || '' : '',
            bpm: bk ? row[bk]?.trim() || '' : '',
            originalKey: ok ? row[ok]?.trim() || '' : '',
            timeSignature: TIME_SIGNATURES.includes(importedSignature) ? importedSignature : '',
          };
        }).filter((r) => r.name);
        setPreview(rows);
      },
    });
    e.target.value = '';
  };

  const doImport = () => {
    if (readOnly) return;
    setSongs((current) => {
      const updated = [...current];

      for (const imported of preview) {
        const importedName = normalizeStr(imported.name);
        const index = updated.findIndex((song) => normalizeStr(song.name) === importedName);

        if (index >= 0) {
          const existing = updated[index];
          updated[index] = {
            ...existing,
            youtubeUrl: imported.youtubeUrl || existing.youtubeUrl || '',
            originalKey: imported.originalKey || existing.originalKey || '',
            bpm: imported.bpm || existing.bpm || '',
            timeSignature: imported.timeSignature || existing.timeSignature || '',
          };
        } else {
          updated.push({ ...imported, audios: [], id: genId() });
        }
      }

      return updated;
    });
    setImportModal(false);
    setPreview([]);
  };

  const filtered = songs.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ padding: 24, maxWidth: 860 }}>
      <PageTitle title="Repertório" subtitle={readOnly ? `${songs.length} música${songs.length !== 1 ? 's' : ''} disponíveis para estudo` : `${songs.length} música${songs.length !== 1 ? 's' : ''}`}>
        {!readOnly && <><Btn variant="secondary" onClick={exportCSV}><Download size={15} />Exportar CSV</Btn><Btn variant="secondary" onClick={() => { setPreview([]); setImportModal(true); }}><Upload size={15} />Importar CSV</Btn><Btn onClick={openAdd}><Plus size={15} />Nova Música</Btn></>}
      </PageTitle>

      {readOnly && <div style={{ marginBottom: 16, padding: '11px 13px', background: C.bgInput, borderRadius: 9, fontSize: 12, color: C.textSecondary, lineHeight: 1.6 }}>Aqui você pode consultar todo o repertório, abrir a referência no YouTube e ouvir os áudios de estudo disponíveis.</div>}

      <div className="search-wrap"><Search size={15} color={C.textSecondary} /><input className="input-field" placeholder="Buscar músicas..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>

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
                <div style={{ width: 44, height: 44, borderRadius: 10, flexShrink: 0, background: `hsl(${hue},70%,94%)`, border: `1.5px solid hsl(${hue},60%,78%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: `hsl(${hue},55%,42%)` }}>{s.name.trim()[0]?.toUpperCase() || '🎵'}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: C.textPrimary, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    {s.youtubeUrl ? <a href={s.youtubeUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#E8463A', fontSize: 12, textDecoration: 'none' }}><Youtube size={12} />Abrir no YouTube</a> : <span style={{ fontSize: 12, color: C.textSecondary }}>Sem link</span>}
                    {s.originalKey && <span className="tag green">Tom original: {s.originalKey}</span>}
                    {s.bpm && <span style={{ fontSize: 11, fontWeight: 700, color: C.accent, background: C.accentGlow, border: `1px solid ${C.accent}33`, borderRadius: 6, padding: '1px 7px' }}>♩ {s.bpm} BPM</span>}
                    {s.timeSignature && <span className="tag">Compasso: {s.timeSignature}</span>}
                    {nAudios > 0 && <span className="tag green">🎧 {nAudios} áudio{nAudios !== 1 ? 's' : ''}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 2 }}>
                  <Btn variant="ghost" title={readOnly ? 'Ouvir áudios' : 'Áudios de voz'} onClick={() => setAudioModal(s)}><Mic2 size={14} /></Btn>
                  {!readOnly && <><Btn variant="ghost" onClick={() => openEdit(s)}><Edit2 size={14} /></Btn><Btn variant="ghost" className="del" onClick={() => setConfirm(s.id)}><Trash2 size={14} /></Btn></>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {audioModal && <Modal title={`Áudios · ${audioModal.name}`} onClose={() => setAudioModal(null)} wide>
        {readOnly ? <><p style={{ fontSize: 13, color: C.textSecondary, marginBottom: 14, lineHeight: 1.6 }}>Ouça os áudios disponíveis para estudar esta música.</p>{(audioModal.audios || []).length > 0 ? <AudioPlayerList audios={audioModal.audios || []} /> : <div style={{ padding: '10px 14px', background: C.bgInput, borderRadius: 8, fontSize: 13, color: C.textSecondary }}>Nenhum áudio disponível para esta música.</div>}</> : <><p style={{ fontSize: 13, color: C.textSecondary, marginBottom: 14, lineHeight: 1.6 }}>Envie arquivos de voz (MP3, M4A, WAV, OGG) para esta música. Os membros autorizados podem ouvir esses áudios no repertório e nas escalas.</p><AudioSection song={audioModal} onChange={(audios) => setAudios(audioModal.id, audios)} /></>}
      </Modal>}

      {!readOnly && modal && <Modal title={modal === 'add' ? 'Nova Música' : 'Editar Música'} onClose={() => setModal(null)}>
        <Inp label="Nome da Música *" value={form.name} onChange={(e) => { setForm((f) => ({ ...f, name: e.target.value })); setDupWarning(''); }} placeholder="Ex: Oceanos" />
        {dupWarning && <div style={{ marginTop: -10, marginBottom: 14, padding: '8px 12px', background: `${C.danger}18`, border: `1px solid ${C.danger}44`, borderRadius: 8, color: C.danger, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}><AlertCircle size={14} />{dupWarning}</div>}
        <Inp label="Link do YouTube" value={form.youtubeUrl} onChange={(e) => setForm((f) => ({ ...f, youtubeUrl: e.target.value }))} placeholder="https://youtube.com/watch?v=..." />
        <Inp label="Tom original" value={form.originalKey} onChange={(e) => setForm((f) => ({ ...f, originalKey: e.target.value }))} placeholder="Ex: D, F#, Bb" />
        <Inp label="BPM (Batidas por Minuto)" type="number" min="40" max="300" value={form.bpm} onChange={(e) => setForm((f) => ({ ...f, bpm: e.target.value }))} placeholder="Ex: 120" />
        <Field label="Compasso">
          <select className="input-field" value={form.timeSignature} onChange={(e) => setForm((f) => ({ ...f, timeSignature: e.target.value }))}>
            <option value="">Não informado</option>
            {TIME_SIGNATURES.map((signature) => <option key={signature} value={signature}>{signature}</option>)}
          </select>
        </Field>
        {modal !== 'add' && <Field label="Áudios de voz"><AudioSection song={modal} onChange={(audios) => setAudios(modal.id, audios)} /></Field>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}><Btn variant="secondary" onClick={() => setModal(null)}>Cancelar</Btn><Btn onClick={save}><Check size={14} />Salvar</Btn></div>
      </Modal>}

      {!readOnly && importModal && <Modal title="Importar/Atualizar Músicas via CSV" onClose={() => { setImportModal(false); setPreview([]); }} wide>
        <div style={{ padding: 14, background: C.bgInput, borderRadius: 8, marginBottom: 16, fontSize: 13, color: C.textSecondary, lineHeight: 1.7 }}>
          <strong style={{ color: C.accent }}>Atualização segura:</strong> arquivo <code>.csv</code> com colunas <code>nome</code>, <code>url</code> e opcionalmente <code>tom original</code>, <code>bpm</code> e <code>compasso</code>. Se a música já existir pelo nome, os dados preenchidos serão atualizados sem trocar o ID e sem apagar os áudios. Campos vazios da planilha não apagam informações existentes.
        </div>
        <label style={{ display: 'block', padding: '24px 16px', border: `2px dashed ${C.border}`, borderRadius: 10, textAlign: 'center', cursor: 'pointer', color: C.textSecondary, marginBottom: 16 }}><Upload size={26} style={{ display: 'block', margin: '0 auto 8px' }} />Clique para selecionar o arquivo CSV<input type="file" accept=".csv" onChange={handleCSV} style={{ display: 'none' }} /></label>
        {preview.length > 0 && <><p style={{ color: C.success, fontSize: 13, marginBottom: 10 }}>✓ {preview.length} música(s) encontrada(s)</p><div style={{ maxHeight: 220, overflowY: 'auto', display: 'grid', gap: 4, marginBottom: 16 }}>{preview.map((s, i) => { const exists = songs.some((song) => normalizeStr(song.name) === normalizeStr(s.name)); return <div key={i} style={{ padding: '7px 12px', background: C.bgHover, borderRadius: 6, display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 13 }}><span style={{ color: C.textPrimary }}>{s.name}</span><div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}><span style={{ color: exists ? C.accent : C.success, fontSize: 11, fontWeight: 700 }}>{exists ? '🔄 Será atualizada' : '✨ Nova música'}</span>{s.originalKey && <span style={{ color: C.success, fontSize: 11 }}>Tom: {s.originalKey}</span>}{s.bpm && <span style={{ color: C.accent, fontSize: 11 }}>♩ {s.bpm} BPM</span>}{s.timeSignature && <span style={{ color: C.accent, fontSize: 11 }}>{s.timeSignature}</span>}{s.youtubeUrl && <span style={{ color: C.success, fontSize: 11 }}>✓ YouTube</span>}</div></div>; })}</div><Btn onClick={doImport}><Check size={14} />Processar {preview.length} música(s)</Btn></>}
      </Modal>}

      {!readOnly && confirm && <Confirm msg="Excluir esta música do repertório?" onOk={() => del(confirm)} onCancel={() => setConfirm(null)} />}
    </div>
  );
}
