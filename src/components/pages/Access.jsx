import { useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { AlertCircle, Check, KeyRound, ShieldCheck } from 'lucide-react';
import { C, LOGO_HOME } from '@/lib/theme';
import { Btn, Inp } from '../ui-kit';
import { useAuth } from '@/lib/auth';

export default function AccessPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [accessRole, setAccessRole] = useState('membro');
  const [pass, setPass] = useState('');
  const [pass2, setPass2] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? window.localStorage.getItem('oitava:access-email') : null;
    if (saved) setEmail(saved);
  }, []);

  const confirmEmail = async () => {
    setErr('');
    if (!email.trim()) {
      setErr('Informe o mesmo e-mail usado para solicitar o link.');
      return;
    }
    setBusy(true);
    try {
      const result = await auth.completeAccess(email);
      setEmail(result?.user?.email || email.trim().toLowerCase());
      setAccessRole(result?.role || 'membro');
      setStep('password');
    } catch (e) {
      setErr(e?.message || 'Não foi possível validar este acesso.');
    } finally {
      setBusy(false);
    }
  };

  const savePassword = async () => {
    setErr('');
    if (pass.length < 6) {
      setErr('A senha precisa ter pelo menos 6 caracteres.');
      return;
    }
    if (pass !== pass2) {
      setErr('As senhas não coincidem.');
      return;
    }
    setBusy(true);
    try {
      await auth.definePassword(pass);
      navigate({ to: accessRole === 'admin' ? '/' : '/minhas-escalas', replace: true });
    } catch (e) {
      setErr(e?.message || 'Não foi possível salvar a nova senha.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: 26 }}>
          <img src={LOGO_HOME} alt="" style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${C.accent}` }} />
          <h1 style={{ fontSize: 20, fontWeight: 800, color: C.accent, marginTop: 12 }}>Criar ou redefinir senha</h1>
          <p style={{ color: C.textSecondary, fontSize: 13 }}>
            {step === 'email' ? 'Confirme o e-mail que recebeu o link' : 'Defina sua nova senha de acesso'}
          </p>
        </div>

        {step === 'email' && (
          <>
            <div style={{ padding: '11px 13px', background: C.bgInput, borderRadius: 8, fontSize: 12, color: C.textSecondary, lineHeight: 1.6, marginBottom: 14 }}>
              Para sua segurança, informe o mesmo endereço usado na tela de login. O acesso só será liberado se ele estiver vinculado a um membro cadastrado.
            </div>
            <Inp label="E-mail" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" />
            <Btn disabled={busy} onClick={confirmEmail} style={{ width: '100%', justifyContent: 'center', padding: 12 }}>
              <ShieldCheck size={15} />{busy ? 'Validando...' : 'Validar meu acesso'}
            </Btn>
          </>
        )}

        {step === 'password' && (
          <>
            <div style={{ padding: '11px 13px', background: C.bgInput, borderRadius: 8, fontSize: 12, color: C.textSecondary, lineHeight: 1.6, marginBottom: 14 }}>
              <strong style={{ color: C.textPrimary }}>E-mail confirmado:</strong><br />{email}
            </div>
            <Inp label="Nova senha" type="password" autoComplete="new-password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="mínimo 6 caracteres" />
            <Inp label="Confirmar senha" type="password" autoComplete="new-password" value={pass2} onChange={(e) => setPass2(e.target.value)} placeholder="repita a senha" />
            <Btn disabled={busy} onClick={savePassword} style={{ width: '100%', justifyContent: 'center', padding: 12 }}>
              {busy ? <KeyRound size={15} /> : <Check size={15} />}{busy ? 'Salvando...' : 'Salvar senha e entrar'}
            </Btn>
          </>
        )}

        {err && (
          <div style={{ marginTop: 14, display: 'flex', gap: 8, alignItems: 'center', color: C.danger, fontSize: 13 }}>
            <AlertCircle size={14} />{err}
          </div>
        )}

        <p style={{ marginTop: 18, fontSize: 11, color: C.textSecondary, textAlign: 'center', lineHeight: 1.6 }}>
          O link confirma a propriedade do e-mail. Sua senha é armazenada e gerenciada pelo Firebase Authentication.
        </p>
      </div>
    </div>
  );
}
