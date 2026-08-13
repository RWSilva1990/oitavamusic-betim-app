import { useState } from 'react';
import { BarChart2 } from 'lucide-react';
import { C } from '@/lib/theme';
import { todayISO } from '@/lib/db';
import { PageTitle } from '../ui-kit';
import { useData } from '@/lib/data';

export default function ReportsPage() {
  const { scales, songs } = useData();
  const today = todayISO();
  const threeMonthsAgo = (() => { const d = new Date(); d.setMonth(d.getMonth() - 3); return d.toISOString().split('T')[0]; })();

  const [start, setStart] = useState(threeMonthsAgo);
  const [end, setEnd] = useState(today);

  const inRange = scales.filter((s) => s.date >= start && s.date <= end);
  const counts = {};
  inRange.forEach((sc) => (sc.scaleSongs || []).forEach((ss) => { counts[ss.songId] = (counts[ss.songId] || 0) + 1; }));
  const ranked = Object.entries(counts)
    .map(([id, n]) => ({ song: songs.find((s) => s.id === id), n }))
    .filter((r) => r.song)
    .sort((a, b) => b.n - a.n);
  const max = ranked[0]?.n || 1;

  return (
    <div style={{ padding: 24, maxWidth: 760 }}>
      <PageTitle title="Relatórios" subtitle="Músicas mais escaladas no período selecionado" />

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="grid-2">
          <div>
            <label className="field-label">Data Inicial</label>
            <input className="input-field" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div>
            <label className="field-label">Data Final</label>
            <input className="input-field" type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
          </div>
        </div>
        <div style={{ marginTop: 12, fontSize: 13, color: C.textSecondary }}>
          <strong style={{ color: C.textPrimary }}>{inRange.length}</strong> escala(s) no período ·{' '}
          <strong style={{ color: C.textPrimary }}>{ranked.length}</strong> música(s) escalada(s)
        </div>
      </div>

      {ranked.length === 0 ? (
        <div className="empty-state"><BarChart2 size={38} style={{ marginBottom: 12, opacity: 0.25 }} /><p>Nenhuma música escalada neste período</p></div>
      ) : (
        <div style={{ display: 'grid', gap: 8 }}>
          {ranked.map((r, i) => (
            <div key={r.song.id} className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, background: i < 3 ? C.accentGlow : C.bgHover, color: i < 3 ? C.accent : C.textSecondary, border: `1px solid ${i < 3 ? C.accent + '44' : C.border}` }}>
                  {i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600, color: C.textPrimary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.song.name}</span>
                    {r.song.bpm && <span style={{ fontSize: 10, color: C.accent, background: C.accentGlow, borderRadius: 4, padding: '1px 5px', flexShrink: 0 }}>♩ {r.song.bpm} BPM</span>}
                  </div>
                  <div className="bar-bg"><div className="bar-fill" style={{ width: `${(r.n / max) * 100}%` }} /></div>
                </div>
                <div style={{ fontWeight: 800, color: C.accent, fontSize: 20, flexShrink: 0 }}>{r.n}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
