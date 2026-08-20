import { useEffect, useState } from 'react';
import { Bell, BellOff, CheckCircle2 } from 'lucide-react';
import { C } from '@/lib/theme';
import { Btn } from './ui-kit';
import {
  disableScaleNotifications,
  enableScaleNotifications,
  getScaleNotificationStatus,
} from '@/lib/push-client';

export default function NotificationSettings() {
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const refresh = async () => {
    try {
      setStatus(await getScaleNotificationStatus());
    } catch {
      setStatus({ supported: false, configured: false, permission: 'unsupported', enabled: false });
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const enable = async () => {
    setBusy(true);
    setMessage('');
    try {
      await enableScaleNotifications();
      setMessage('Notificações ativadas neste aparelho.');
    } catch (error) {
      setMessage(error?.message || 'Não foi possível ativar as notificações.');
    } finally {
      await refresh();
      setBusy(false);
    }
  };

  const disable = async () => {
    setBusy(true);
    setMessage('');
    try {
      await disableScaleNotifications();
      setMessage('Notificações desativadas neste aparelho.');
    } catch (error) {
      setMessage(error?.message || 'Não foi possível desativar as notificações.');
    } finally {
      await refresh();
      setBusy(false);
    }
  };

  if (!status) return null;

  const blocked = status.permission === 'denied';

  return (
    <div className="card" style={{ marginBottom: 20, padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: status.enabled ? `${C.success}14` : C.accentGlow,
            color: status.enabled ? C.success : C.accent,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {status.enabled ? <CheckCircle2 size={21} /> : <Bell size={21} />}
        </div>

        <div style={{ flex: 1, minWidth: 210 }}>
          <div style={{ fontWeight: 800, color: C.textPrimary, fontSize: 14 }}>Notificações das escalas</div>
          <div style={{ marginTop: 4, color: C.textSecondary, fontSize: 12, lineHeight: 1.55 }}>
            {status.enabled
              ? 'Este aparelho avisará quando você for adicionado a uma nova escala.'
              : 'Ative para receber um aviso no aparelho quando você for inserido em uma escala.'}
          </div>

          {!status.configured && (
            <div style={{ marginTop: 8, color: C.accent, fontSize: 11, fontWeight: 700 }}>
              Configuração de push do Firebase pendente neste ambiente.
            </div>
          )}
          {!status.supported && status.configured && (
            <div style={{ marginTop: 8, color: C.textSecondary, fontSize: 11 }}>
              Este navegador ou aparelho não oferece suporte a notificações push.
            </div>
          )}
          {blocked && (
            <div style={{ marginTop: 8, color: C.danger, fontSize: 11, lineHeight: 1.5 }}>
              A permissão foi bloqueada no aparelho. Para reativar, abra as configurações do aplicativo/navegador e permita notificações para o Oitava Music Betim.
            </div>
          )}
          {message && (
            <div style={{ marginTop: 8, color: message.includes('ativadas') ? C.success : C.textSecondary, fontSize: 11 }}>
              {message}
            </div>
          )}
        </div>

        {status.enabled ? (
          <Btn variant="secondary" disabled={busy} onClick={disable}>
            <BellOff size={14} />{busy ? 'Aguarde...' : 'Desativar'}
          </Btn>
        ) : (
          <Btn disabled={busy || blocked || !status.supported || !status.configured} onClick={enable}>
            <Bell size={14} />{busy ? 'Ativando...' : 'Ativar notificações'}
          </Btn>
        )}
      </div>
    </div>
  );
}
