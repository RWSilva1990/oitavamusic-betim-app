import { useEffect, useRef, useState } from 'react';
import { Bell, BellOff, Check, X } from 'lucide-react';
import { C } from '@/lib/theme';
import {
  disableScaleNotifications,
  enableScaleNotifications,
  getScaleNotificationStatus,
} from '@/lib/push-client';
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  getNotificationPreferences,
  saveNotificationPreferences,
} from '@/lib/notification-center.client';

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
        padding: '11px 0',
        background: 'transparent',
        border: 'none',
        borderBottom: `1px solid ${C.border}`,
        color: C.textPrimary,
        cursor: disabled ? 'wait' : 'pointer',
        textAlign: 'left',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <span style={{ fontSize: 13, lineHeight: 1.4 }}>{label}</span>
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
  const [busy, setBusy] = useState(false);
  const [loadingPreferences, setLoadingPreferences] = useState(false);
  const [message, setMessage] = useState(null);
  const messageTimer = useRef(null);

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

  useEffect(() => {
    refresh();
    return () => {
      if (messageTimer.current) window.clearTimeout(messageTimer.current);
    };
  }, []);

  const openPanel = () => {
    setOpen(true);
    loadPreferences();
  };

  const toggleDevice = async () => {
    if (!status || busy) return;
    if (!status.configured) return flash('Notificações ainda não estão configuradas.', true);
    if (!status.supported) return flash('Este aparelho não oferece suporte a notificações.', true);
    if (!status.enabled && status.permission === 'denied') {
      return flash('Notificações bloqueadas nas configurações do aparelho.', true);
    }

    setBusy(true);
    try {
      if (status.enabled) {
        await disableScaleNotifications();
        flash('Notificações desativadas neste aparelho');
      } else {
        await enableScaleNotifications();
        flash('Notificações ativadas neste aparelho');
      }
    } catch (error) {
      flash(error?.message || 'Não foi possível alterar as notificações.', true);
    } finally {
      await refresh();
      setBusy(false);
    }
  };

  const save = async () => {
    if (busy || loadingPreferences) return;
    setBusy(true);
    try {
      setPreferences(await saveNotificationPreferences(preferences));
      flash('Preferências salvas');
    } catch (error) {
      flash(error?.message || 'Não foi possível salvar suas preferências.', true);
    } finally {
      setBusy(false);
    }
  };

  if (!status) return null;
  const enabled = status.enabled;

  return (
    <div style={{ position: 'relative', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
      <button
        type="button"
        onClick={openPanel}
        aria-label="Notificações e lembretes"
        title="Notificações e lembretes"
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          border: `1px solid ${enabled ? `${C.accent}44` : C.border}`,
          background: enabled ? C.accentGlow : C.bgHover,
          color: enabled ? C.accent : C.textSecondary,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.18s ease',
        }}
      >
        {enabled ? <Bell size={20} strokeWidth={2.3} /> : <BellOff size={20} strokeWidth={2.1} />}
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Notificações e Lembretes"
          onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 900,
            background: 'var(--app-overlay)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <div style={{ width: '100%', maxWidth: 520, maxHeight: 'calc(100dvh - 32px)', overflowY: 'auto', background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 20, boxShadow: '0 24px 64px var(--app-shadow)' }}>
            <div style={{ position: 'sticky', top: 0, zIndex: 2, padding: '18px 20px', background: C.bgCard, borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 800, color: C.textPrimary }}>Notificações e Lembretes</div>
                <div style={{ marginTop: 3, fontSize: 11, color: C.textSecondary }}>Escolha o que você quer receber.</div>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Fechar" style={{ background: 'none', border: 'none', color: C.textSecondary, cursor: 'pointer', padding: 5, display: 'flex' }}><X size={19} /></button>
            </div>

            <div style={{ padding: 20 }}>
              <div style={{ padding: 14, border: `1px solid ${C.border}`, background: C.bgHover, borderRadius: 14, marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: C.textPrimary }}>Notificações neste aparelho</div>
                    <div style={{ marginTop: 3, fontSize: 11, lineHeight: 1.45, color: C.textSecondary }}>
                      {enabled ? 'Este aparelho está autorizado a receber seus avisos e lembretes.' : 'Ative para receber os alertas escolhidos abaixo.'}
                    </div>
                  </div>
                  <button type="button" onClick={toggleDevice} disabled={busy} style={{ minWidth: 92, padding: '8px 11px', borderRadius: 9, border: `1px solid ${enabled ? `${C.danger}44` : `${C.accent}55`}`, background: enabled ? 'transparent' : C.accentGlow, color: enabled ? C.danger : C.accent, fontSize: 11, fontWeight: 800, cursor: busy ? 'wait' : 'pointer' }}>
                    {busy ? 'Aguarde...' : enabled ? 'Desativar' : 'Ativar'}
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: 22 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: C.accent, textTransform: 'uppercase', letterSpacing: .7, marginBottom: 3 }}>Avisos sobre minhas escalas</div>
                <div style={{ fontSize: 11, color: C.textSecondary, marginBottom: 5 }}>São enviados quando alguma informação importante da sua escala muda.</div>
                {NOTICE_OPTIONS.map(([key, label]) => (
                  <PreferenceRow key={key} label={label} checked={Boolean(preferences[key])} disabled={loadingPreferences || busy} onChange={(value) => setPreferences((current) => ({ ...current, [key]: value }))} />
                ))}
              </div>

              <div>
                <div style={{ fontSize: 12, fontWeight: 800, color: C.accent, textTransform: 'uppercase', letterSpacing: .7, marginBottom: 3 }}>Lembretes das minhas escalas</div>
                <div style={{ fontSize: 11, color: C.textSecondary, marginBottom: 5 }}>Você escolhe com quanta antecedência quer ser lembrado.</div>
                {REMINDER_OPTIONS.map(([key, label]) => (
                  <PreferenceRow key={key} label={label} checked={Boolean(preferences[key])} disabled={loadingPreferences || busy} onChange={(value) => setPreferences((current) => ({ ...current, [key]: value }))} />
                ))}
              </div>

              {loadingPreferences && <div style={{ marginTop: 16, fontSize: 12, color: C.textSecondary, textAlign: 'center' }}>Carregando preferências...</div>}

              <button type="button" onClick={save} disabled={busy || loadingPreferences} className="btn btn-primary" style={{ marginTop: 20, width: '100%', justifyContent: 'center', padding: 11 }}>
                <Check size={15} />{busy ? 'Salvando...' : 'Salvar preferências'}
              </button>
            </div>
          </div>
        </div>
      )}

      {message && (
        <div role="status" style={{ position: 'absolute', right: 0, top: 48, zIndex: 950, width: 'max-content', maxWidth: 280, padding: '8px 10px', borderRadius: 10, border: `1px solid ${message.error ? `${C.danger}33` : C.border}`, background: C.bgCard, boxShadow: '0 8px 24px rgba(27,20,61,0.14)', color: message.error ? C.danger : C.textPrimary, fontSize: 11, fontWeight: 700, lineHeight: 1.4, textAlign: 'center' }}>
          {message.text}
        </div>
      )}
    </div>
  );
}
