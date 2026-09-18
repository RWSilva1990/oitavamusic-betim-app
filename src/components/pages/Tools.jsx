import { useMemo, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Capacitor } from '@capacitor/core';
import { Headphones, TimerReset } from 'lucide-react';
import { C } from '@/lib/theme';
import { useData } from '@/lib/data';
import { PageTitle } from '../ui-kit';
import KeyTestAssistant from '../KeyTestAssistant';

export default function ToolsPage() {
  const { songs } = useData();
  const [selectedSongId, setSelectedSongId] = useState('');
  const [selectedSong, setSelectedSong] = useState(null);
  const isAndroidApk = Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
  const orderedSongs = useMemo(() => [...(songs || [])].sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'pt-BR')), [songs]);

  return (
    <div style={{ padding: 24, maxWidth: 760 }}>
      <PageTitle title="Ferramentas" subtitle="Recursos de apoio para ensaio e execução" />
      <div style={{ display: 'grid', gap: 12 }}>
        <Link to="/metronomo" className="card" style={{ textDecoration: 'none', color: C.textPrimary, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.accentGlow, color: C.accent }}><TimerReset size={22} /></div>
          <div><div style={{ fontWeight: 800 }}>Metrônomo</div><div style={{ marginTop: 3, fontSize: 12, color: C.textSecondary }}>BPM, Tap Tempo, compasso e modo Setlist.</div></div>
        </Link>

        {isAndroidApk && (
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.accentGlow, color: C.accent }}><Headphones size={22} /></div>
              <div><div style={{ fontWeight: 800, color: C.textPrimary }}>Descobrir tom da música</div><div style={{ marginTop: 3, fontSize: 12, color: C.textSecondary }}>Escolha uma música do repertório e abra sua referência no Transpose.</div></div>
            </div>
            <select className="input-field" value={selectedSongId} onChange={(e) => setSelectedSongId(e.target.value)}>
              <option value="">Selecione uma música...</option>
              {orderedSongs.map((song) => <option key={song.id} value={song.id}>{song.name}{song.artist ? ` · ${song.artist}` : ''}</option>)}
            </select>
            <button type="button" className="btn btn-primary" disabled={!selectedSongId} onClick={() => setSelectedSong(orderedSongs.find((song) => song.id === selectedSongId) || null)} style={{ marginTop: 10 }}>Testar tom</button>
          </div>
        )}
      </div>
      {selectedSong && <KeyTestAssistant song={selectedSong} currentKey="" onApply={() => {}} onClose={() => setSelectedSong(null)} />}
    </div>
  );
}
