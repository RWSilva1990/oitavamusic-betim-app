import { useEffect, useRef, useState } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { C } from '@/lib/theme';

const THEME_KEY = 'oitava:appearance';
const MODES = [
  { id: 'system', label: 'Sistema', icon: Monitor },
  { id: 'light', label: 'Claro', icon: Sun },
  { id: 'dark', label: 'Escuro', icon: Moon },
];

function storedMode() {
  if (typeof window === 'undefined') return 'system';
  const value = window.localStorage.getItem(THEME_KEY);
  return MODES.some((mode) => mode.id === value) ? value : 'system';
}

function applyTheme(mode) {
  if (typeof document === 'undefined') return;
  const dark = mode === 'dark'
    || (mode === 'system' && window.matchMedia?.('(prefers-color-scheme: dark)').matches);

  document.documentElement.dataset.appearance = mode;
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light';

  const meta = document.querySelector('meta[name="theme-color"]');
  meta?.setAttribute('content', dark ? '#0D111A' : '#F0F2F8');
}

export function initializeAppearance() {
  const mode = storedMode();
  applyTheme(mode);
  return mode;
}

export default function AppearanceSettings() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState(storedMode);
  const wrapRef = useRef(null);

  useEffect(() => {
    applyTheme(mode);
    window.localStorage.setItem(THEME_KEY, mode);

    const media = window.matchMedia?.('(prefers-color-scheme: dark)');
    const onSystemChange = () => {
      if (mode === 'system') applyTheme('system');
    };
    media?.addEventListener?.('change', onSystemChange);
    return () => media?.removeEventListener?.('change', onSystemChange);
  }, [mode]);

  useEffect(() => {
    const close = (event) => {
      if (!wrapRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, []);

  const active = MODES.find((item) => item.id === mode) || MODES[0];
  const ActiveIcon = active.icon;

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <button
        type="button"
        className="btn btn-ghost"
        aria-label={`Aparência: ${active.label}`}
        title={`Aparência: ${active.label}`}
        onClick={() => setOpen((value) => !value)}
        style={{ width: 34, height: 34, padding: 0, justifyContent: 'center', borderRadius: 10 }}
      >
        <ActiveIcon size={17} />
      </button>

      {open && (
        <div
          className="appearance-popover"
          style={{
            position: 'absolute',
            right: 0,
            top: 40,
            width: 210,
            padding: 8,
            borderRadius: 14,
            background: C.bgCard,
            border: `1px solid ${C.border}`,
            boxShadow: '0 16px 42px rgba(0,0,0,0.22)',
            zIndex: 700,
          }}
        >
          <div style={{ padding: '6px 8px 8px', fontSize: 11, fontWeight: 800, color: C.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8 }}>
            Aparência
          </div>
          {MODES.map((item) => {
            const Icon = item.icon;
            const selected = item.id === mode;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => { setMode(item.id); setOpen(false); }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 11px',
                  border: 0,
                  borderRadius: 10,
                  background: selected ? C.accentGlow : 'transparent',
                  color: selected ? C.accent : C.textPrimary,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontSize: 13,
                  fontWeight: selected ? 700 : 600,
                  textAlign: 'left',
                }}
              >
                <Icon size={16} />
                <span style={{ flex: 1 }}>{item.label}</span>
                <span
                  aria-hidden="true"
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    border: `2px solid ${selected ? C.accent : C.border}`,
                    boxShadow: selected ? `inset 0 0 0 3px ${C.bgCard}` : 'none',
                    background: selected ? C.accent : 'transparent',
                  }}
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
