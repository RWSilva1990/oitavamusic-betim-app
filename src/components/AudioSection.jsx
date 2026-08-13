import { useRef, useState } from 'react';
import { Upload, Trash2, Download, AlertCircle } from 'lucide-react';
import { C } from '@/lib/theme';
import { genId } from '@/lib/db';
import { getFirebaseStorage } from '@/lib/firebase';
import { Btn } from './ui-kit';

const LABELS = ['Guia', 'Soprano', 'Contralto', 'Tenor', 'Ministro', 'Playback', 'Ensaio'];

export function AudioPlayerList({ audios = [], compact = false }) {
  if (!audios.length) return null;
  return (
    <div style={{ display: 'grid', gap: 6 }}>
      {audios.map((a) => (
        <div key={a.id} className="audio-row" style={compact ? { padding: '8px 10px' } : undefined}>
          <span style={{ fontSize: 12, fontWeight: 700, color: C.accent, whiteSpace: 'nowrap' }}>
            {a.label || 'Áudio'}
          </span>
          <audio controls preload="none" src={a.url} style={{ flex: 1, minWidth: 180 }} />
          <a href={a.url} target="_blank" rel="noopener noreferrer" style={{ color: C.textSecondary, display: 'flex' }} title="Baixar">
            <Download size={14} />
          </a>
        </div>
      ))}
    </div>
  );
}

export default function AudioSection({ song, onChange }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [label, setLabel] = useState('Guia');
  const [error, setError] = useState('');
  const inputRef = useRef(null);
  const audios = song.audios || [];

  const upload = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;
    setError('');
    setUploading(true);
    try {
      const { storage, mod } = await getFirebaseStorage();
      const added = [];
      for (const file of files) {
        const id = genId();
        const path = `repertorio/${song.id}/${id}-${file.name.replace(/[^\w.\-]/g, '_')}`;
        const storageRef = mod.ref(storage, path);
        const task = mod.uploadBytesResumable(storageRef, file, { contentType: file.type });
        await new Promise((resolve, reject) => {
          task.on(
            'state_changed',
            (snap) => setProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
            reject,
            resolve
          );
        });
        const url = await mod.getDownloadURL(storageRef);
        added.push({ id, name: file.name, label, url, path, size: file.size });
      }
      onChange([...audios, ...added]);
    } catch (err) {
      setError(err?.message || 'Falha ao enviar o áudio.');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const remove = async (audio) => {
    onChange(audios.filter((a) => a.id !== audio.id));
    if (audio.path) {
      try {
        const { storage, mod } = await getFirebaseStorage();
        await mod.deleteObject(mod.ref(storage, audio.path));
      } catch {
        /* arquivo já removido */
      }
    }
  };

  return (
    <div>
      <div style={{ display: 'grid', gap: 8, marginBottom: 10 }}>
        {audios.map((a) => (
          <div key={a.id} className="audio-row">
            <span style={{ fontSize: 12, fontWeight: 700, color: C.accent, whiteSpace: 'nowrap' }}>{a.label || 'Áudio'}</span>
            <audio controls preload="none" src={a.url} style={{ flex: 1, minWidth: 160 }} />
            <span style={{ fontSize: 11, color: C.textSecondary, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</span>
            <button onClick={() => remove(a)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.danger, display: 'flex' }} title="Excluir áudio">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {audios.length === 0 && (
          <div style={{ padding: '10px 14px', background: C.bgInput, borderRadius: 8, fontSize: 13, color: C.textSecondary }}>
            Nenhum áudio enviado para esta música.
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <select className="input-field" value={label} onChange={(e) => setLabel(e.target.value)} style={{ width: 150, fontSize: 13 }}>
          {LABELS.map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
        <Btn variant="secondary" disabled={uploading} onClick={() => inputRef.current?.click()}>
          <Upload size={14} />{uploading ? `Enviando... ${progress}%` : 'Adicionar áudio'}
        </Btn>
        <input ref={inputRef} type="file" accept="audio/*" multiple onChange={upload} style={{ display: 'none' }} />
      </div>

      {uploading && (
        <div className="bar-bg" style={{ marginTop: 10 }}>
          <div className="bar-fill" style={{ width: `${progress}%` }} />
        </div>
      )}
      {error && (
        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8, color: C.danger, fontSize: 13 }}>
          <AlertCircle size={14} />{error}
        </div>
      )}
    </div>
  );
}
