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

const EMPTY_STATUS = {
  supported: false,
  configured: false,
  permission: 'default',
  enabled: false,
  native: false,
  checking: true,
};

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
  const [status, setStatus] = useState(EMPTY_STATUS);
  const [open, setOpen] = useState(false);
  const [preferences, setPreferences] = useState(DEFAULT_NOTIFICATION_PREFERENCES);
  const [saving, setSaving] = useState(false);
  const [deviceBusy, setDeviceBusy] = useState(false);
  const [loadingPreferences, setLoadingPreferences] = useState(false);
  const [message, setMessage] = useState(null);
  const messageTimer = useRef(null);
  const rootRef = useRef(null);

  const refresh = async () => {
    setStatus((current) => ({ ...current, checking: true }));
    let timeoutId;
    try {
      const next = await Promise.race([
        getScaleNotificationStatus(),
        new Promise((_, reject) => {
          timeoutId = window.setTimeout(() => reject(new Error('notification-status-timeout')), 8000);
        }),
      ]);
      setStatus({ ...EMPTY_STATUS, ...(next || {}), checking: false });
    } catch {
      setStatus((current) => ({
        ...current,
        supported: false,
        configured: false,
        permission: 'unsupported',
        enabled: false,
        checking: false,
      }));
    } finally {
      if (timeoutId) window.clearTimeout(timeoutId);
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

  useEffect(() => {
    refresh();
    return () => {
      if (messageTimer.current) window.clearTimeout(messageTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!open) return undefined;

    const closeOutside = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  const togglePanel = () => {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    loadPreferences();
    refresh();
  };

  const activateDeviceNotifications = async () => {
    if (deviceBusy) return;
    if (status.checking) return flash('Aguarde a verificação das notificações.', true);
    if (!status.configured) return flash('Notificações ainda não estão configuradas.', true);
    if (!status.supported) return flash('Este dispositivo não oferece suporte a notificações.', true);
    if (status.permission === 'denied') {
      return flash('Notificações bloqueadas nas configurações do dispositivo.', true);
    }

    setDeviceBusy(true);
    try {
      await enableScaleNotifications();
      flash('Notificações ativadas');
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

  const permissionGranted = status.permission === 'granted';
  const permissionDenied = status.permission === 'denied';
  const deviceEnabled = Boolean(status.enabled);
  const canActivate = !status.checking && status.supported && status.configured && !permissionDenied && !deviceEnabled;
  const platformName = status.native ? 'Android' : 'navegador';

  let deviceText = 'O estado das notificações não pôde ser identificado neste dispositivo.';
  if (status.checking) {
    deviceText = 'Verificando disponibilidade das notificações...';
  } else if (!status.supported) {
    deviceText = 'Este dispositivo não oferece suporte às notificações do aplicativo.';
  } else if (!status.configured) {
    deviceText = 'As notificações ainda não estão configuradas neste ambiente.';
  } else if (deviceEnabled) {
    deviceText = status.native
      ? 'Permitidas pelo Android e vinculadas a este aparelho.'
      : 'Permitidas pelo navegador e vinculadas a este dispositivo.';
  } else if (permissionGranted) {
    deviceText = `O ${platformName} já permitiu notificações. Conclua a ativação para vincular este dispositivo.`;
  } else if (permissionDenied) {
    deviceText = `Bloqueadas nas configurações do ${platformName}. Suas preferências abaixo continuam salvas.`;
  } else {
    deviceText = `O ${platformName} ainda precisa autorizar as notificações deste aplicativo.`;
  }

  return (
    <div ref={rootRef} style={{ position: 'relative', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
      <button
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
          opacity: status.checking ? 0.82 : 1,
        }}
      >
        <Bell size={20} strokeWidth={2.3} />
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="false"
          aria-label="Notificações e Lembretes"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            zIndex: 921,
            width: 'min(304px, calc(100vw - 24px))',
            maxHeight: 'calc(100dvh - 76px - env(safe-area-inset-bottom, 0px))',
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
              right: 14,
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
            {message && (
              <div style={{ marginBottom: 12, padding: '9px 10px', borderRadius: 10, fontSize: 11, lineHeight: 1.45, background: message.error ? 'rgba(229,72,77,.10)' : C.accentGlow, color: message.error ? C.danger : C.accent }}>
                {message.text}
              </div>
            )}

            <div style={{ padding: 13, border: `1px solid ${C.border}`, background: C.bgHover, borderRadius: 13, marginBottom: 18 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: C.textPrimary }}>Permissão de notificações</div>
              <div style={{ marginTop: 4, fontSize: 11, lineHeight: 1.5, color: C.textSecondary }}>{deviceText}</div>

              {deviceEnabled && (
                <div style={{ marginTop: 9, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 9px', borderRadius: 9, background: C.accentGlow, color: C.accent, fontSize: 11, fontWeight: 800 }}>
                  <Check size={13} /> {status.native ? 'Permitidas pelo Android' : 'Permitidas pelo navegador'}
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
                  Para liberar novamente, use as configurações de notificações do {platformName} para o Oitava Music.
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
    </div>
  );
}
