import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import AppShell from '@/components/AppShell';
import { Btn } from '@/components/ui-kit';
import { useAuth } from '@/lib/auth';
import { useData } from '@/lib/data';
import { getFirebaseAuth } from '@/lib/firebase';
import { registerPushInstallation } from '@/lib/push-notifications.functions';
import { sendScaleAddedNotifications } from '@/lib/push-client';
import { todayISO } from '@/lib/db';

export const Route = createFileRoute('/push-diagnostico')({
  component: () => (
    <AppShell>
      <PushDiagnosticPage />
    </AppShell>
  ),
});

function PushDiagnosticPage() {
  const auth = useAuth();
  const { members } = useData();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<any>(null);
  const me = auth.memberFor(members);

  const verifyLink = async () => {
    setBusy(true);
    try {
      const token = window.localStorage.getItem('oitava:native-push-token') || '';
      if (!token) throw new Error('Este aparelho não possui token nativo salvo. Ative o sino primeiro.');
      if (!me?.id) throw new Error('Este administrador não foi localizado no cadastro de membros.');

      const { auth: firebaseAuth } = await getFirebaseAuth();
      if (!firebaseAuth.currentUser) throw new Error('Sessão expirada.');
      const idToken = await firebaseAuth.currentUser.getIdToken(true);
      const response = await registerPushInstallation({ data: { idToken, token } });

      setResult({
        type: 'link',
        ok: response?.memberId === me.id,
        currentMemberId: me.id,
        registeredMemberId: response?.memberId || '',
        targetType: response?.targetType || '',
      });
    } catch (error: any) {
      setResult({ type: 'error', message: error?.message || String(error) });
    } finally {
      setBusy(false);
    }
  };

  const sendTest = async () => {
    setBusy(true);
    try {
      if (!me?.id) throw new Error('Este administrador não foi localizado no cadastro de membros.');
      const response = await sendScaleAddedNotifications(
        {
          id: `diagnostico-${Date.now()}`,
          name: 'Teste de notificação do administrador',
          date: todayISO(),
        },
        [me.id],
      );
      setResult({ type: 'send', ...response });
    } catch (error: any) {
      setResult({ type: 'error', message: error?.message || String(error) });
    } finally {
      setBusy(false);
    }
  };

  if (!auth.isAdmin) {
    return <div style={{ padding: 24 }}>Diagnóstico disponível apenas para administradores.</div>;
  }

  return (
    <div style={{ padding: 24, maxWidth: 680, margin: '0 auto' }}>
      <h1 style={{ marginBottom: 8 }}>Diagnóstico de notificações</h1>
      <p style={{ marginBottom: 18, opacity: 0.75 }}>
        Página temporária para validar o vínculo do aparelho e o envio nativo do administrador.
      </p>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
        <Btn onClick={verifyLink} disabled={busy}>1. Verificar vínculo</Btn>
        <Btn onClick={sendTest} disabled={busy}>2. Enviar push de teste</Btn>
      </div>

      <div style={{ padding: 14, border: '1px solid #ddd', borderRadius: 10, background: '#fff' }}>
        <div><strong>Administrador:</strong> {auth.email}</div>
        <div><strong>Membro localizado:</strong> {me?.name || 'não localizado'}</div>
        {result?.type === 'link' && (
          <div style={{ marginTop: 12 }}>
            <div><strong>Vínculo:</strong> {result.ok ? 'CORRETO' : 'DIVERGENTE'}</div>
            <div><strong>Tipo:</strong> {result.targetType || '—'}</div>
            <div><strong>ID atual:</strong> {result.currentMemberId}</div>
            <div><strong>ID registrado:</strong> {result.registeredMemberId}</div>
          </div>
        )}
        {result?.type === 'send' && (
          <div style={{ marginTop: 12 }}>
            <div><strong>Enviadas:</strong> {result.sent ?? 0}</div>
            <div><strong>Falhas:</strong> {result.failed ?? 0}</div>
            <div><strong>Dispositivos:</strong> {result.devices ?? 0}</div>
            <div><strong>Android:</strong> {result.androidDevices ?? 0}</div>
            <div><strong>Web:</strong> {result.webDevices ?? 0}</div>
          </div>
        )}
        {result?.type === 'error' && (
          <div style={{ marginTop: 12, color: '#b42318' }}><strong>Erro:</strong> {result.message}</div>
        )}
      </div>
    </div>
  );
}
