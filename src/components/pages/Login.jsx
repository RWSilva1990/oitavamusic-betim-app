import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { AlertCircle, KeyRound, LogIn, UserPlus } from 'lucide-react';
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
  const [linkBusy, setLinkBusy] = useState('');

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

  const validateEmail = () => {
    if (!email.trim()) {
      setErr('Informe seu e-mail para receber o link.');
      return false;
    }
    return true;
  };

  const requestFirstAccess = async () => {
    if (!validateEmail()) return;
    setErr(''); setMsg(''); setLinkBusy('first');
    try {
      await auth.sendInvite(email);
      setMsg('Enviamos um link de primeiro acesso. Depois de confirmar o e-mail, você poderá preencher seus dados e criar sua senha. Seu cadastro ficará pendente até a aprovação de um administrador.');
    } catch (e2) {
      setErr(traduz(e2));
    } finally {
      setLinkBusy('');
    }
  };

  const requestPasswordAccess = async () => {
    if (!validateEmail()) return;
    setErr(''); setMsg(''); setLinkBusy('password');
    try {
      await auth.sendAccessLink(email);
      setMsg('Enviamos um link para criar ou redefinir sua senha. Esta opção só libera acesso para e-mails que já tenham vínculo aprovado no aplicativo.');
    } catch (e2) {
      setErr(traduz(e2));
    } finally {
      setLinkBusy('');
    }
  };

  const anyLinkBusy = Boolean(linkBusy);

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <form onSubmit={submit} style={{ width: '100%', maxWidth: 340 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <img src={LOGO_HOME} alt="" style={{ display: 'block', margin: '0 auto', width: 76, height: 76, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${C.accent}`, boxShadow: `0 8px 24px ${C.accentGlow}` }} />
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
        {msg && <div style={{ color: C.success, fontSize: 13, lineHeight: 1.5, marginBottom: 12 }}>{msg}</div>}

        <Btn type="submit" disabled={busy || anyLinkBusy || !auth.configured} style={{ width: '100%', justifyContent: 'center', padding: 12 }}>
          <LogIn size={15} />{busy ? 'Entrando...' : 'Entrar'}
        </Btn>

        <button
          type="button"
          disabled={anyLinkBusy || !auth.configured}
          onClick={requestFirstAccess}
          style={{ marginTop: 14, width: '100%', background: 'none', border: 'none', color: C.accent, fontSize: 12, fontWeight: 700, cursor: anyLinkBusy ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
        >
          <UserPlus size={14} />
          {linkBusy === 'first' ? 'Enviando link...' : 'Primeiro acesso'}
        </button>

        <button
          type="button"
          disabled={anyLinkBusy || !auth.configured}
          onClick={requestPasswordAccess}
          style={{ marginTop: 10, width: '100%', background: 'none', border: 'none', color: C.textSecondary, fontSize: 12, fontWeight: 700, cursor: anyLinkBusy ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
        >
          <KeyRound size={14} />
          {linkBusy === 'password' ? 'Enviando link...' : 'Esqueci minha senha'}
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
  return e?.message || 'Não foi possível concluir a operação.';
}
