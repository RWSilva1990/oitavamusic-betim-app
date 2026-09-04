import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, ListMusic, Minus, Plus, Play, Pause, RotateCcw, TimerReset } from 'lucide-react';
import { C } from '@/lib/theme';
import { fmtDate, todayISO } from '@/lib/db';
import { useData } from '@/lib/data';
import { Btn, PageTitle } from '../ui-kit';

const MIN_BPM = 30;
const MAX_BPM = 240;
const LOOKAHEAD_MS = 25;
const SCHEDULE_AHEAD_SECONDS = 0.1;

const TIME_SIGNATURES = [
  { value: '2/4', beats: 2, denominator: 4 },
  { value: '3/4', beats: 3, denominator: 4 },
  { value: '4/4', beats: 4, denominator: 4 },
  { value: '5/4', beats: 5, denominator: 4 },
  { value: '6/8', beats: 6, denominator: 8 },
  { value: '7/8', beats: 7, denominator: 8 },
  { value: '9/8', beats: 9, denominator: 8 },
  { value: '12/8', beats: 12, denominator: 8 },
];

function clampBpm(value) {
  return Math.max(MIN_BPM, Math.min(MAX_BPM, Math.round(Number(value) || MIN_BPM)));
}

function validSignature(value) {
  return TIME_SIGNATURES.some((item) => item.value === value) ? value : '4/4';
}

export default function MetronomePage() {
  const { scales, songs } = useData();
  const [mode, setMode] = useState('manual');
  const [bpm, setBpm] = useState(72);
  const [timeSignature, setTimeSignature] = useState('4/4');
  const [running, setRunning] = useState(false);
  const [activeBeat, setActiveBeat] = useState(0);
  const [tapTimes, setTapTimes] = useState([]);
  const [selectedScaleId, setSelectedScaleId] = useState('');
  const [setlistIndex, setSetlistIndex] = useState(0);

  const audioContextRef = useRef(null);
  const timerRef = useRef(null);
  const nextNoteTimeRef = useRef(0);
  const currentBeatRef = useRef(0);
  const bpmRef = useRef(bpm);
  const beatsPerMeasureRef = useRef(4);
  const runningRef = useRef(false);

  const selectedSignature = TIME_SIGNATURES.find((item) => item.value === timeSignature) || TIME_SIGNATURES[2];
  const orderedScales = useMemo(() => {
    const today = todayISO();
    return [...(scales || [])].sort((a, b) => {
      const aPast = a.date < today ? 1 : 0;
      const bPast = b.date < today ? 1 : 0;
      if (aPast !== bPast) return aPast - bPast;
      return aPast ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date);
    });
  }, [scales]);
  const selectedScale = orderedScales.find((scale) => scale.id === selectedScaleId) || null;
  const setlist = useMemo(() => (selectedScale?.scaleSongs || [])
    .map((entry) => ({ ...entry, song: songs.find((song) => song.id === entry.songId) }))
    .filter((entry) => entry.song), [selectedScale, songs]);
  const currentSetlistItem = setlist[setlistIndex] || null;

  useEffect(() => {
    bpmRef.current = bpm;
  }, [bpm]);

  useEffect(() => {
    beatsPerMeasureRef.current = selectedSignature.beats;
    currentBeatRef.current = 0;
    setActiveBeat(0);
  }, [selectedSignature.beats]);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return null;
      audioContextRef.current = new AudioContextClass();
    }
    return audioContextRef.current;
  }, []);

  const scheduleClick = useCallback((beatIndex, when) => {
    const context = getAudioContext();
    if (!context) return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const firstBeat = beatIndex === 0;
    oscillator.frequency.value = firstBeat ? 1250 : 820;
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.exponentialRampToValueAtTime(firstBeat ? 0.55 : 0.35, when + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.055);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(when);
    oscillator.stop(when + 0.065);
    const visualDelay = Math.max(0, (when - context.currentTime) * 1000);
    window.setTimeout(() => {
      if (runningRef.current) setActiveBeat(beatIndex);
    }, visualDelay);
  }, [getAudioContext]);

  const scheduler = useCallback(() => {
    const context = audioContextRef.current;
    if (!context || !runningRef.current) return;
    while (nextNoteTimeRef.current < context.currentTime + SCHEDULE_AHEAD_SECONDS) {
      const beatIndex = currentBeatRef.current;
      scheduleClick(beatIndex, nextNoteTimeRef.current);
      nextNoteTimeRef.current += 60 / bpmRef.current;
      currentBeatRef.current = (beatIndex + 1) % beatsPerMeasureRef.current;
    }
  }, [scheduleClick]);

  const stop = useCallback(() => {
    runningRef.current = false;
    setRunning(false);
    setActiveBeat(0);
    currentBeatRef.current = 0;
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const start = useCallback(async () => {
    const context = getAudioContext();
    if (!context) return;
    if (context.state === 'suspended') await context.resume();
    if (timerRef.current) window.clearInterval(timerRef.current);
    currentBeatRef.current = 0;
    nextNoteTimeRef.current = context.currentTime + 0.05;
    runningRef.current = true;
    setRunning(true);
    setActiveBeat(0);
    scheduler();
    timerRef.current = window.setInterval(scheduler, LOOKAHEAD_MS);
  }, [getAudioContext, scheduler]);

  useEffect(() => () => {
    runningRef.current = false;
    if (timerRef.current) window.clearInterval(timerRef.current);
    audioContextRef.current?.close().catch(() => {});
  }, []);

  const loadSetlistItem = useCallback((index) => {
    const item = setlist[index];
    if (!item) return;
    stop();
    setSetlistIndex(index);
    setBpm(clampBpm(item.song.bpm || 72));
    setTimeSignature(validSignature(item.song.timeSignature));
    setTapTimes([]);
  }, [setlist, stop]);

  useEffect(() => {
    if (mode !== 'setlist' || !selectedScale) return;
    if (setlist.length === 0) {
      stop();
      setSetlistIndex(0);
      return;
    }
    loadSetlistItem(0);
  }, [mode, selectedScaleId]); // eslint-disable-line react-hooks/exhaustive-deps

  const adjustBpm = (delta) => setBpm((value) => clampBpm(value + delta));
  const tapTempo = () => {
    const now = performance.now();
    const recent = tapTimes.filter((time) => now - time < 2500);
    const next = [...recent, now].slice(-6);
    setTapTimes(next);
    if (next.length < 2) return;
    const intervals = next.slice(1).map((time, index) => time - next[index]);
    const average = intervals.reduce((sum, value) => sum + value, 0) / intervals.length;
    setBpm(clampBpm(60000 / average));
  };

  const reset = () => {
    stop();
    setTapTimes([]);
    if (mode === 'setlist' && currentSetlistItem) {
      setBpm(clampBpm(currentSetlistItem.song.bpm || 72));
      setTimeSignature(validSignature(currentSetlistItem.song.timeSignature));
    } else {
      setBpm(72);
      setTimeSignature('4/4');
    }
  };

  const beatDots = Array.from({ length: selectedSignature.beats }, (_, index) => index);

  return (
    <div style={{ padding: 24, maxWidth: 760 }}>
      <PageTitle title="Metrônomo" subtitle="Andamento e compasso para estudo, ensaio e execução" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8, maxWidth: 620, margin: '0 auto 14px' }}>
        <button type="button" className={`btn ${mode === 'manual' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => { stop(); setMode('manual'); }} style={{ justifyContent: 'center' }}>Manual</button>
        <button type="button" className={`btn ${mode === 'setlist' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => { stop(); setMode('setlist'); }} style={{ justifyContent: 'center' }}><ListMusic size={16} />Setlist</button>
      </div>

      {mode === 'setlist' && (
        <div className="card" style={{ maxWidth: 620, margin: '0 auto 14px' }}>
          <label className="field-label" htmlFor="metronome-scale">Escala</label>
          <select id="metronome-scale" className="input-field" value={selectedScaleId} onChange={(event) => setSelectedScaleId(event.target.value)}>
            <option value="">Selecione uma escala...</option>
            {orderedScales.map((scale) => <option key={scale.id} value={scale.id}>{scale.name} · {fmtDate(scale.date)}</option>)}
          </select>
          {selectedScale && setlist.length === 0 && <div style={{ marginTop: 12, color: C.textSecondary, fontSize: 12 }}>Esta escala não possui músicas.</div>}
          {currentSetlistItem && (
            <div style={{ marginTop: 14, padding: 12, borderRadius: 12, background: C.accentGlow, border: `1px solid ${C.accent}33` }}>
              <div style={{ fontSize: 11, color: C.textSecondary, marginBottom: 4 }}>Música {setlistIndex + 1} de {setlist.length}</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: C.textPrimary }}>{currentSetlistItem.song.name}</div>
              <div style={{ marginTop: 5, display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 11, color: C.textSecondary }}>
                <span>Cadastro: {currentSetlistItem.song.bpm || '—'} BPM</span>
                <span>·</span>
                <span>{validSignature(currentSetlistItem.song.timeSignature)}</span>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="card" style={{ maxWidth: 620, margin: '0 auto', overflow: 'visible' }}>
        <div style={{ textAlign: 'center', marginBottom: 22 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: C.textSecondary, textTransform: 'uppercase', letterSpacing: 1 }}>BPM</div>
          <div style={{ fontSize: 'clamp(64px, 18vw, 112px)', lineHeight: 1, fontWeight: 800, color: C.textPrimary, fontVariantNumeric: 'tabular-nums', margin: '8px 0 16px' }}>{bpm}</div>
          <input type="range" min={MIN_BPM} max={MAX_BPM} value={bpm} onChange={(event) => setBpm(clampBpm(event.target.value))} aria-label="BPM" style={{ width: '100%', maxWidth: 440, accentColor: C.accent }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8, maxWidth: 440, margin: '0 auto 22px' }}>
          <button type="button" onClick={() => adjustBpm(-1)} className="btn btn-secondary" style={{ justifyContent: 'center', padding: '12px 8px' }}><Minus size={17} />1</button>
          <button type="button" onClick={tapTempo} className="btn btn-secondary" style={{ justifyContent: 'center', padding: '12px 8px' }}><TimerReset size={17} />Tap</button>
          <button type="button" onClick={() => adjustBpm(1)} className="btn btn-secondary" style={{ justifyContent: 'center', padding: '12px 8px' }}><Plus size={17} />1</button>
        </div>

        <div style={{ maxWidth: 440, margin: '0 auto 22px' }}>
          <label className="field-label" htmlFor="metronome-signature">Compasso</label>
          <select id="metronome-signature" className="input-field" value={timeSignature} onChange={(event) => setTimeSignature(event.target.value)}>
            {TIME_SIGNATURES.map((item) => <option key={item.value} value={item.value}>{item.value}</option>)}
          </select>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', gap: 9, minHeight: 38, marginBottom: 24 }} aria-label={`Compasso ${timeSignature}`}>
          {beatDots.map((beat) => {
            const active = running && activeBeat === beat;
            const downbeat = beat === 0;
            return <div key={beat} title={`Tempo ${beat + 1}`} style={{ width: downbeat ? 28 : 22, height: downbeat ? 28 : 22, borderRadius: '50%', border: `2px solid ${downbeat ? C.accent : C.border}`, background: active ? (downbeat ? C.accent : C.textSecondary) : C.bgInput, transform: active ? 'scale(1.16)' : 'scale(1)', transition: 'transform 70ms ease, background 70ms ease' }} />;
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
          <Btn onClick={running ? stop : start} disabled={mode === 'setlist' && !currentSetlistItem} style={{ minWidth: 150, justifyContent: 'center', padding: '12px 20px' }}>
            {running ? <Pause size={18} /> : <Play size={18} />}{running ? 'Pausar' : 'Iniciar'}
          </Btn>
          <Btn variant="secondary" onClick={reset} style={{ justifyContent: 'center' }}><RotateCcw size={15} />Redefinir</Btn>
        </div>

        {mode === 'setlist' && currentSetlistItem && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, maxWidth: 440, margin: '16px auto 0' }}>
            <Btn variant="secondary" disabled={setlistIndex === 0} onClick={() => loadSetlistItem(setlistIndex - 1)} style={{ justifyContent: 'center' }}><ChevronLeft size={16} />Anterior</Btn>
            <Btn variant="secondary" disabled={setlistIndex >= setlist.length - 1} onClick={() => loadSetlistItem(setlistIndex + 1)} style={{ justifyContent: 'center' }}>Próxima<ChevronRight size={16} /></Btn>
          </div>
        )}
      </div>

      <div style={{ maxWidth: 620, margin: '14px auto 0', padding: '12px 14px', borderRadius: 12, background: C.accentGlow, border: `1px solid ${C.accent}33`, color: C.textSecondary, fontSize: 12, lineHeight: 1.6 }}>
        {mode === 'setlist'
          ? 'Ao avançar ou voltar uma música, o metrônomo para e carrega o BPM e o compasso cadastrados. Alterações feitas aqui são temporárias e não modificam o repertório.'
          : 'O primeiro tempo do compasso recebe um clique mais agudo e um marcador visual maior. O Tap Tempo calcula o andamento pelas últimas batidas feitas no botão.'}
      </div>
    </div>
  );
}
