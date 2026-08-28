import { useEffect, useRef, useState } from 'react';
import { Bell, BellOff, Copy } from 'lucide-react';
import { C } from '@/lib/theme';
import {
  disableScaleNotifications,
  enableScaleNotifications,
  getScaleNotificationStatus,
} from '@/lib/push-client';

export default function NotificationSettings() {
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);
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

  useEffect(() => {
    refresh();
    return () => {
      if (messageTimer.current) window.clearTimeout(messageTimer.current);
    };
  }, []);

  const toggle = async () => {
    if (!status || busy) return;

    if (!status.configured) {
      flash('Notificações ainda não estão configuradas.', true);
      return;
    }
    if (!status.supported) {
      flash('Este aparelho não oferece suporte a notificações.', true);
      return;
    }
    if (!status.enabled && status.permission === 'denied') {
      flash('Notificações bloqueadas nas configurações do aparelho.', true);
      return;
    }

    setBusy(true);
    try {
      if (status.enabled) {
        await disableScaleNotifications();
        flash('Notificações desativadas');
      } else {
        await enableScaleNotifications();
        flash('Notificações ativadas no aparelho');
      }
    } catch (error) {
      flash(error?.message || 'Não foi possível alterar as notificações.', true);
    } finally {
      await refresh();
      setBusy(false);
    }
  };

  const copyToken = async () => {
    const token = String(status?.token || '').trim();
    if (!token) {
      flash('Ative as notificações primeiro para gerar o token FCM.', true);
      return;
    }
    try {
      await navigator.clipboard.writeText(token);
      flash(status?.serverLinked ? 'Token FCM copiado' : 'Token FCM copiado — backend ainda não vinculado');
    } catch {
      flash('Não foi possível copiar o token automaticamente.', true);
    }
  };

  if (!status) return null;

  const enabled = status.enabled;
  const label = enabled ? 'Desativar notificações' : 'Ativar notificações';

  return (
    <div style={{ position: 'relative', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
      {status.native && status.token && (
        <button
          type="button"
          onClick={copyToken}
          aria-label="Copiar token FCM"
          title="Copiar token FCM para teste"
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            border: `1px solid ${C.border}`,
            background: C.bgHover,
            color: C.textSecondary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <Copy size={15} />
        </button>
      )}

      <button
        type="button"
        onClick={toggle}
        disabled={busy}
        aria-label={label}
        aria-pressed={enabled}
        title={label}
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
          cursor: busy ? 'wait' : 'pointer',
          opacity: busy ? 0.6 : 1,
          transition: 'all 0.18s ease',
        }}
      >
        {enabled ? <Bell size={20} strokeWidth={2.3} /> : <BellOff size={20} strokeWidth={2.1} />}
      </button>

      {message && (
        <div
          role="status"
          style={{
            position: 'absolute',
            right: 0,
            top: 48,
            zIndex: 30,
            width: 'max-content',
            maxWidth: 260,
            padding: '8px 10px',
            borderRadius: 10,
            border: `1px solid ${message.error ? `${C.danger}33` : C.border}`,
            background: C.bgCard,
            boxShadow: '0 8px 24px rgba(27,20,61,0.14)',
            color: message.error ? C.danger : C.textPrimary,
            fontSize: 11,
            fontWeight: 700,
            lineHeight: 1.4,
            textAlign: 'center',
          }}
        >
          {message.text}
        </div>
      )}
    </div>
  );
}
