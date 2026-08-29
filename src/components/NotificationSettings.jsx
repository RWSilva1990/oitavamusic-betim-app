import { useEffect, useRef, useState } from 'react';
import { Bell, Check, X } from 'lucide-react';
import { C } from '@/lib/theme';
import {
  enableScaleNotifications,
  getScaleNotificationStatus,
} from '@/lib/push-client';
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  getNotificationPreferences,
  saveNotificationPreferences,
} from '@/lib/notification-center';

const NOTICE_OPTIONS = [
  ['noticeScaleAdded', 'Quando eu entrar em uma escala'],
  ['noticeScaleRemoved', 'Quando eu sair de uma escala'],
  ['noticeRoleChanged', 'Quando minha função for alterada'],
  ['noticeRepertoireChanged', 'Quando o repertório for alterado'],
  ['noticeSongDetailsChanged', 'Quando o tom ou o solista de uma música mudar'],
];

const REMINDER_OPTIONS = [
  ['reminder7Days', '7 dias antes'],
  ['reminder3Days', '3 dias antes'],
  ['reminder1Day', '1 dia antes'],
  ['reminderSameDay', 'No dia da escala'],
];

function PreferenceRow({ label, checked, onChange, disabled }) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      aria-pressed={checked}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        padding: '12px 0',
        background: 'transparent',
        border: 'none',
        borderBottom: `1px solid ${C.border}`,
        color: C.textPrimary,
        cursor: disabled ? 'wait' : 'pointer',
        textAlign: 'left',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <span style={{ fontSize: 13, lineHeight: 1.4, paddingRight: 8 }}>{label}</span>
      <span
        aria-hidden="true"
        style={{
          width: 42,
          height: 24,
          borderRadius: 20,
          padding: 2,
          flexShrink: 0,
          background: checked ? C.accent : C.bgHover,
          border: `1px solid ${checked ? C.accent : C.border}`,
          display: 'flex',
          justifyContent: checked ? 'flex-end' : 'flex-start',
          alignItems: 'center',
          transition: 'all .16s ease',
        }}
      >
        <span style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,.18)' }} />
      </span>
    </button>
  );
}

export default function NotificationSettings() {
  const [status, setStatus] = useState(null);
  const [open, setOpen] = useState(false);
  const [preferences, setPreferences] = useState(DEFAULT_NOTIFICATION_PREFERENCES);
  const [saving, setSaving] = useState(false);
  const [deviceBusy, setDeviceBusy] = useState(false);
  const [loadingPreferences, setLoadingPreferences] = useState(false);
  const [message, setMessage] = useState(null);
  const [panelPosition, setPanelPosition] = useState(null);
  const messageTimer = useRef(null);
  const rootRef = useRef(null);
  const bellRef = useRef(null);

  const refresh = async () => {
    try {
      setStatus(await getScaleNotificationStatus());
    } catch {
      setStatus({ supported: false, configured: false, permission: 'unsupported', enabled: false });
    }
  };

  const flash = (text, error = false) => {
    if (messageTimer.current) window.clearTimeout(messageTimer.current);
    setMessage({ text, error });
    messageTimer.current = window.setTimeout(() => setMessage(null), 3200);
  };

  const loadPreferences = async () => {
    setLoadingPreferences(true);
    try {
      setPreferences(await getNotificationPreferences());
    } catch (error) {
      flash(error?.message || 'Não foi possível carregar suas preferências.', true);
    } finally {
      setLoadingPreferences(false);
    }
  };

  const updatePanelPosition = () => {
    if (typeof window === 'undefined' || !bellRef.current) return;
    const rect = bellRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const sideMargin = 12;
    const gap = 8;
    const width = Math.min(304, Math.max(260, viewportWidth - (sideMargin * 2)));
    const left = Math.min(
      viewportWidth - width - sideMargin,
      Math.max(sideMargin, rect.right - width),
    );
    const top = rect.bottom + gap;
    const maxHeight = Math.max(280, viewportHeight - top - sideMargin);
    const arrowLeft = Math.min(
      width - 28,
      Math.max(18, (rect.left + (rect.width / 2)) - left - 6),
    );

    setPanelPosition({ left, top, width, maxHeight, arrowLeft });
  };

  useEffect(() => {
    refresh();
    return () => {
      if (messageTimer.current) window.clearTimeout(messageTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!open) return undefined;

    updatePanelPosition();
    const closeOutside = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    const reposition = () => updatePanelPosition();

    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('keydown', closeOnEscape);
    window.addEventListener('resize', reposition);
    window.addEventListener('orientationchange', reposition);
    window.addEventListener('scroll', reposition, true);
    return () => {
      document.removeEventListener('pointerdown', closeOutside);
      document.removeEventListener('keydown', closeOnEscape);
      window.removeEventListener('resize', reposition);
      window.removeEventListener('orientationchange', reposition);
      window.removeEventListener('scroll', reposition, true);
    };
  }, [open]);

  const togglePanel = () => {
    if (open) {
      setOpen(false);
      return;
    }
    updatePanelPosition();
    setOpen(true);
    loadPreferences();
    refresh();
  };

  const activateDeviceNotifications = async () => {
    if (!status || deviceBusy) return;
    if (!status.configured) return flash('Notificações ainda não estão configuradas.', true);
    if (!status.supported) return flash('Este aparelho não oferece suporte a notificações.', true);
    if (status.permission === 'denied') {
      return flash('Notificações bloqueadas nas configurações do aparelho.', true);
    }

    setDeviceBusy(true);
    try {
      await enableScaleNotifications();
      flash('Notificações do aparelho ativadas');
    } catch (error) {
      flash(error?.message || 'Não foi possível ativar as notificações.', true);
    } finally {
      await refresh();
      setDeviceBusy(false);
    }
  };

  const save = async () => {
    if (saving || loadingPreferences) return;
    setSaving(true);
    try {
      setPreferences(await saveNotificationPreferences(preferences));
      flash('Preferências salvas');
    } catch (error) {
      flash(error?.message || 'Não foi possível salvar suas preferências.', true);
    } finally {
      setSaving(false);
    }
  };

  if (!status) return null;

  const permissionGranted = status.permission === 'granted';
  const permissionDenied = status.permission === 'denied';
  const deviceEnabled = Boolean(status.enabled);
  const canActivate = status.supported && status.configured && !permissionDenied && !deviceEnabled;

  let deviceText = 'O estado das notificações não pôde ser identificado neste aparelho.';
  if (!status.supported) {
    deviceText = 'Este aparelho não oferece suporte às notificações do aplicativo.';
  } else if (!status.configured) {
    deviceText = 'As notificações ainda não estão configuradas neste ambiente.';
  } else if (deviceEnabled) {
    deviceText = 'Permitidas pelo Android e vinculadas a este aparelho.';
  } else if (permissionGranted) {
    deviceText = 'O Android já permitiu notificações. Conclua a ativação para vincular este aparelho.';
  } else if (permissionDenied) {
    deviceText = 'Bloqueadas nas configurações do Android. Suas preferências abaixo continuam salvas.';
  } else {
    deviceText = 'O Android ainda precisa autorizar as notificações deste aplicativo.';
  }

  return (
    <div ref={rootRef} style={{ position: 'relative', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
      <button
        ref={bellRef}
        type="button"
        onClick={togglePanel}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="Notificações e lembretes"
        title="Notificações e lembretes"
        style={{
          position: 'relative',
          zIndex: open ? 922 : 'auto',
          width: 40,
          height: 40,
          borderRadius: 12,
          border: `1px solid ${deviceEnabled ? `${C.accent}44` : C.border}`,
          background: deviceEnabled ? C.accentGlow : C.bgHover,
          color: deviceEnabled ? C.accent : C.textSecondary,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.18s ease',
        }}
      >
        <Bell size={20} strokeWidth={2.3} />
      </button>

      {open && panelPosition && (
        <div
          role="dialog"
          aria-modal="false"
          aria-label="Notificações e Lembretes"
          style={{
            position: 'fixed',
            top: panelPosition.top,
            left: panelPosition.left,
            zIndex: 921,
            width: panelPosition.width,
            maxHeight: `calc(${panelPosition.maxHeight}px - env(safe-area-inset-bottom, 0px))`,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            background: C.bgCard,
            border: `1px solid ${C.border}`,
            borderRadius: 18,
            boxShadow: '0 18px 52px var(--app-shadow)',
          }}
        >
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: -6,
              left: panelPosition.arrowLeft,
              width: 12,
              height: 12,
              background: C.bgCard,
              borderLeft: `1px solid ${C.border}`,
              borderTop: `1px solid ${C.border}`,
              transform: 'rotate(45deg)',
              zIndex: 3,
            }}
          />

          <div style={{ flexShrink: 0, padding: '15px 16px 13px', background: C.bgCard, borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: C.textPrimary }}>Notificações e Lembretes</div>
              <div style={{ marginTop: 3, fontSize: 11, color: C.textSecondary }}>Escolha quais alertas você quer receber.</div>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Fechar" style={{ background: 'none', border: 'none', color: C.textSecondary, cursor: 'pointer', padding: 3, display: 'flex', flexShrink: 0 }}>
              <X size={19} />
            </button>
          </div>

          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', overscrollBehavior: 'contain', padding: '15px 16px 12px' }}>
            <div style={{ padding: 13, border: `1px solid ${C.border}`, background: C.bgHover, borderRadius: 13, marginBottom: 18 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: C.textPrimary }}>Permissão de notificações</div>
              <div style={{ marginTop: 4, fontSize: 11, lineHeight: 1.5, color: C.textSecondary }}>{deviceText}</div>

              {deviceEnabled && (
                <div style={{ marginTop: 9, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 9px', borderRadius: 9, background: C.accentGlow, color: C.accent, fontSize: 11, fontWeight: 800 }}>
                  <Check size={13} /> Permitidas pelo Android
                </div>
              )}

              {canActivate && (
                <button
                  type="button"
                  onClick={activateDeviceNotifications}
                  disabled={deviceBusy}
                  className="btn btn-secondary"
                  style={{ marginTop: 10, width: '100%', justifyContent: 'center', padding: '8px 10px', fontSize: 11 }}
                >
                  {deviceBusy ? 'Aguarde...' : permissionGranted ? 'Concluir ativação' : 'Ativar notificações'}
                </button>
              )}

              {permissionDenied && status.supported && status.configured && (
                <div style={{ marginTop: 9, fontSize: 10.5, lineHeight: 1.45, color: C.textSecondary }}>
                  Para liberar novamente, use as configurações de notificações do Android para o Oitava Music.
                </div>
              )}
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: C.accent, textTransform: 'uppercase', letterSpacing: .7, marginBottom: 3 }}>Avisos sobre minhas escalas</div>
              <div style={{ fontSize: 11, lineHeight: 1.45, color: C.textSecondary, marginBottom: 4 }}>São enviados quando alguma informação importante da sua escala muda.</div>
              {NOTICE_OPTIONS.map(([key, label]) => (
                <PreferenceRow key={key} label={label} checked={Boolean(preferences[key])} disabled={loadingPreferences || saving} onChange={(value) => setPreferences((current) => ({ ...current, [key]: value }))} />
              ))}
            </div>

            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: C.accent, textTransform: 'uppercase', letterSpacing: .7, marginBottom: 3 }}>Lembretes das minhas escalas</div>
              <div style={{ fontSize: 11, lineHeight: 1.45, color: C.textSecondary, marginBottom: 4 }}>Você escolhe com quanta antecedência quer ser lembrado.</div>
              {REMINDER_OPTIONS.map(([key, label]) => (
                <PreferenceRow key={key} label={label} checked={Boolean(preferences[key])} disabled={loadingPreferences || saving} onChange={(value) => setPreferences((current) => ({ ...current, [key]: value }))} />
              ))}
            </div>

            {loadingPreferences && <div style={{ marginTop: 14, fontSize: 12, color: C.textSecondary, textAlign: 'center' }}>Carregando preferências...</div>}
          </div>

          <div style={{ flexShrink: 0, padding: '10px 16px calc(10px + env(safe-area-inset-bottom, 0px))', borderTop: `1px solid ${C.border}`, background: C.bgCard }}>
            <button type="button" onClick={save} disabled={saving || loadingPreferences} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: 10 }}>
              <Check size={15} />{saving ? 'Salvando...' : 'Salvar preferências'}
            </button>
          </div>
        </div>
      )}

      {message && (
        <div role="status" style={{ position: 'absolute', right: 0, top: 48, zIndex: 930, width: 'max-content', maxWidth: 'min(280px, calc(100vw - 24px))', padding: '8px 10px', borderRadius: 10, border: `1px solid ${message.error ? `${C.danger}33` : C.border}`, background: C.bgCard, boxShadow: '0 8px 24px rgba(27,20,61,0.14)', color: message.error ? C.danger : C.textPrimary, fontSize: 11, fontWeight: 700, lineHeight: 1.4, textAlign: 'center' }}>
          {message.text}
        </div>
      )}
    </div>
  );
}
