import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { Mail, Send } from 'lucide-react';
import AppShell from '@/components/AppShell';
import { Btn } from '@/components/ui-kit';
import { sendResendTestEmail } from '@/lib/email-test.functions';
import { C } from '@/lib/theme';
import { useAuth } from '@/lib/auth';

export const Route = createFileRoute('/teste-email')({
  head: () => ({
    meta: [{ title: 'Teste de e-mail — Oitava Music Betim' }],
  }),
  component: EmailTestPage,
});

function EmailTestPage() {
  const auth = useAuth();
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ success?: boolean; message?: string; to?: string }>({});

  const send = async () => {
    setSending(true);
    setResult({});
    try {
      const response = await sendResendTestEmail();
      setResult({
        success: true,
        to: response.to,
        message: 'E-mail enviado. Confira sua caixa de entrada e também a pasta de spam.',
      });
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Não foi possível enviar o e-mail de teste.',
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <AppShell>
      <div style={{ padding: 24, maxWidth: 680, margin: '0 auto' }}>
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <Mail size={22} color={C.accent} />
            <div>
              <h1 style={{ margin: 0, fontSize: 20, color: C.textPrimary }}>Teste do Resend</h1>
              <div style={{ marginTop: 3, fontSize: 12, color: C.textSecondary }}>
                Envio temporário para validar a integração de e-mail do Oitava Music.
              </div>
            </div>
          </div>

          {!auth.isAdmin ? (
            <div style={{ padding: 14, borderRadius: 10, background: C.bgInput, color: C.textSecondary, fontSize: 13 }}>
              Esta página de teste está disponível apenas para administradores.
            </div>
          ) : (
            <>
              <p style={{ fontSize: 13, lineHeight: 1.65, color: C.textSecondary, margin: '18px 0' }}>
                O servidor usará a chave RESEND_API_KEY da Vercel e enviará apenas para o primeiro endereço configurado em ADMIN_EMAILS.
              </p>
              <Btn disabled={sending} onClick={send}>
                <Send size={14} />{sending ? 'Enviando...' : 'Enviar e-mail de teste'}
              </Btn>

              {result.message && (
                <div
                  style={{
                    marginTop: 16,
                    padding: '12px 14px',
                    borderRadius: 10,
                    background: result.success ? '#effbf4' : '#fff1f1',
                    color: result.success ? '#24754a' : C.danger,
                    fontSize: 12,
                    lineHeight: 1.6,
                  }}
                >
                  {result.message}
                  {result.success && result.to && <div style={{ marginTop: 4 }}>Destino: {result.to}</div>}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
