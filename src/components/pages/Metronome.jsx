import { useCallback, useEffect, useRef, useState } from 'react';
import { Minus, Plus, Play, Pause, RotateCcw, TimerReset } from 'lucide-react';
import { C } from '@/lib/theme';
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

export default function MetronomePage() {
  const [bpm, setBpm] = useState(72);
  const [timeSignature, setTimeSignature] = useState('4/4');
  const [running, setRunning] = useState(false);
  const [activeBeat, setActiveBeat] = useState(0);
  const [tapTimes, setTapTimes] = useState([]);

  const audioContextRef = useRef(null);
  const timerRef = useRef(null);
  const nextNoteTimeRef = useRef(0);
  const currentBeatRef = useRef(0);
  const bpmRef = useRef(bpm);
  const beatsPerMeasureRef = useRef(4);
  const runningRef = useRef(false);

  const selectedSignature = TIME_SIGNATURES.find((item) => item.value === timeSignature) || TIME_SIGNATURES[2];

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

      const secondsPerBeat = 60 / bpmRef.current;
      nextNoteTimeRef.current += secondsPerBeat;
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
    setBpm(72);
    setTimeSignature('4/4');
    setTapTimes([]);
  };

  const beatDots = Array.from({ length: selectedSignature.beats }, (_, index) => index);

  return (
    <div style={{ padding: 24, maxWidth: 760 }}>
      <PageTitle title="Metrônomo" subtitle="Andamento e compasso para estudo, ensaio e execução" />

      <div className="card" style={{ maxWidth: 620, margin: '0 auto', overflow: 'visible' }}>
        <div style={{ textAlign: 'center', marginBottom: 22 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: C.textSecondary, textTransform: 'uppercase', letterSpacing: 1 }}>BPM</div>
          <div style={{ fontSize: 'clamp(64px, 18vw, 112px)', lineHeight: 1, fontWeight: 800, color: C.textPrimary, fontVariantNumeric: 'tabular-nums', margin: '8px 0 16px' }}>
            {bpm}
          </div>
          <input
            type="range"
            min={MIN_BPM}
            max={MAX_BPM}
            value={bpm}
            onChange={(event) => setBpm(clampBpm(event.target.value))}
            aria-label="BPM"
            style={{ width: '100%', maxWidth: 440, accentColor: C.accent }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8, maxWidth: 440, margin: '0 auto 22px' }}>
          <button type="button" onClick={() => adjustBpm(-1)} className="btn btn-secondary" style={{ justifyContent: 'center', padding: '12px 8px' }}>
            <Minus size={17} />1
          </button>
          <button type="button" onClick={tapTempo} className="btn btn-secondary" style={{ justifyContent: 'center', padding: '12px 8px' }}>
            <TimerReset size={17} />Tap
          </button>
          <button type="button" onClick={() => adjustBpm(1)} className="btn btn-secondary" style={{ justifyContent: 'center', padding: '12px 8px' }}>
            <Plus size={17} />1
          </button>
        </div>

        <div style={{ maxWidth: 440, margin: '0 auto 22px' }}>
          <label className="field-label" htmlFor="metronome-signature">Compasso</label>
          <select
            id="metronome-signature"
            className="input-field"
            value={timeSignature}
            onChange={(event) => setTimeSignature(event.target.value)}
          >
            {TIME_SIGNATURES.map((item) => <option key={item.value} value={item.value}>{item.value}</option>)}
          </select>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', gap: 9, minHeight: 38, marginBottom: 24 }} aria-label={`Compasso ${timeSignature}`}>
          {beatDots.map((beat) => {
            const active = running && activeBeat === beat;
            const downbeat = beat === 0;
            return (
              <div
                key={beat}
                title={`Tempo ${beat + 1}`}
                style={{
                  width: downbeat ? 28 : 22,
                  height: downbeat ? 28 : 22,
                  borderRadius: '50%',
                  border: `2px solid ${downbeat ? C.accent : C.border}`,
                  background: active ? (downbeat ? C.accent : C.textSecondary) : C.bgInput,
                  transform: active ? 'scale(1.16)' : 'scale(1)',
                  transition: 'transform 70ms ease, background 70ms ease',
                }}
              />
            );
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
          <Btn onClick={running ? stop : start} style={{ minWidth: 150, justifyContent: 'center', padding: '12px 20px' }}>
            {running ? <Pause size={18} /> : <Play size={18} />}
            {running ? 'Pausar' : 'Iniciar'}
          </Btn>
          <Btn variant="secondary" onClick={reset} style={{ justifyContent: 'center' }}>
            <RotateCcw size={15} />Redefinir
          </Btn>
        </div>
      </div>

      <div style={{ maxWidth: 620, margin: '14px auto 0', padding: '12px 14px', borderRadius: 12, background: C.accentGlow, border: `1px solid ${C.accent}33`, color: C.textSecondary, fontSize: 12, lineHeight: 1.6 }}>
        O primeiro tempo do compasso recebe um clique mais agudo e um marcador visual maior. O Tap Tempo calcula o andamento pelas últimas batidas feitas no botão.
      </div>
    </div>
  );
}
