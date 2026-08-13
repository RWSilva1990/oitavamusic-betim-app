import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { LogIn, AlertCircle } from 'lucide-react';
import { C, LOGO_HOME } from '@/lib/theme';
import { Btn, Inp } from '../ui-kit';
import { useAuth } from '@/lib/auth';

export default function LoginPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e?.preventDefault?.();
    setErr(''); setMsg(''); setBusy(true);
    try {
      await auth.signIn(email, password);
      navigate({ to: '/', replace: true });
    } catch (e2) {
      setErr(traduz(e2));
    } finally {
      setBusy(false);
    }
  };

  const reset = async () => {
    if (!email.trim()) { setErr('Informe seu e-mail para redefinir a senha.'); return; }
    setErr(''); setMsg('');
    try {
      await auth.resetPassword(email);
      setMsg('Enviamos um link de redefinição de senha para o seu e-mail.');
    } catch (e2) {
      setErr(traduz(e2));
    }
  };

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <form onSubmit={submit} style={{ width: '100%', maxWidth: 340 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <img src={LOGO_HOME} alt="" style={{ width: 76, height: 76, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${C.accent}`, boxShadow: `0 8px 24px ${C.accentGlow}` }} />
          <h1 style={{ fontSize: 21, fontWeight: 800, color: C.accent, marginTop: 14 }}>Oitava Music Betim</h1>
          <p style={{ color: C.textSecondary, fontSize: 13 }}>Entre com seu e-mail e senha</p>
        </div>

        {!auth.configured && (
          <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 8, background: C.accentGlow, color: C.accent, fontSize: 12, lineHeight: 1.6 }}>
            O Firebase ainda não foi configurado neste ambiente. Cadastre as variáveis do projeto no Vercel antes de liberar o acesso.
          </div>
        )}

        <Inp label="E-mail" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" />
        <Inp label="Senha" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />

        {err && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: C.danger, fontSize: 13, marginBottom: 12 }}>
            <AlertCircle size={14} />{err}
          </div>
        )}
        {msg && <div style={{ color: C.success, fontSize: 13, marginBottom: 12 }}>{msg}</div>}

        <Btn type="submit" disabled={busy || !auth.configured} style={{ width: '100%', justifyContent: 'center', padding: 12 }}>
          <LogIn size={15} />{busy ? 'Entrando...' : 'Entrar'}
        </Btn>
        <button type="button" onClick={reset} style={{ marginTop: 14, width: '100%', background: 'none', border: 'none', color: C.textSecondary, fontSize: 12, cursor: 'pointer' }}>
          Esqueci minha senha
        </button>
      </form>
    </div>
  );
}

function traduz(e) {
  const code = e?.code || '';
  if (code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found')) return 'E-mail ou senha incorretos.';
  if (code.includes('too-many-requests')) return 'Muitas tentativas. Tente novamente mais tarde.';
  if (code.includes('invalid-email')) return 'E-mail inválido.';
  return e?.message || 'Não foi possível entrar.';
}
