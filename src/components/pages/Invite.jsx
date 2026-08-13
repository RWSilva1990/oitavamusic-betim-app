import { useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Check, AlertCircle, ShieldCheck } from 'lucide-react';
import { C, LOGO_HOME } from '@/lib/theme';
import { Btn, Inp } from '../ui-kit';
import { useAuth } from '@/lib/auth';

export default function InvitePage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [pass2, setPass2] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? window.localStorage.getItem('oitava:invite-email') : null;
    if (saved) setEmail(saved);
    if (auth.user) setStep('password');
  }, [auth.user]);

  const confirmEmail = async () => {
    setErr(''); setBusy(true);
    try {
      await auth.completeInvite(email);
      setStep('password');
    } catch (e) {
      setErr(e?.message || 'Não foi possível validar o convite.');
    } finally {
      setBusy(false);
    }
  };

  const savePassword = async () => {
    setErr('');
    if (pass.length < 6) { setErr('A senha precisa ter pelo menos 6 caracteres.'); return; }
    if (pass !== pass2) { setErr('As senhas não coincidem.'); return; }
    setBusy(true);
    try {
      await auth.definePassword(pass);
      navigate({ to: '/minhas-escalas', replace: true });
    } catch (e) {
      setErr(e?.message || 'Não foi possível salvar a senha.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 340 }}>
        <div style={{ textAlign: 'center', marginBottom: 26 }}>
          <img src={LOGO_HOME} alt="" style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${C.accent}` }} />
          <h1 style={{ fontSize: 20, fontWeight: 800, color: C.accent, marginTop: 12 }}>Ativar meu acesso</h1>
          <p style={{ color: C.textSecondary, fontSize: 13 }}>
            {step === 'email' ? 'Confirme o e-mail que recebeu o convite' : 'Defina sua senha pessoal'}
          </p>
        </div>

        {step === 'email' ? (
          <>
            <Inp label="E-mail do convite" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" />
            <Btn disabled={busy} onClick={confirmEmail} style={{ width: '100%', justifyContent: 'center', padding: 12 }}>
              <ShieldCheck size={15} />{busy ? 'Validando...' : 'Continuar'}
            </Btn>
          </>
        ) : (
          <>
            <Inp label="Nova senha" type="password" autoComplete="new-password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="mínimo 6 caracteres" />
            <Inp label="Confirmar senha" type="password" autoComplete="new-password" value={pass2} onChange={(e) => setPass2(e.target.value)} placeholder="repita a senha" />
            <Btn disabled={busy} onClick={savePassword} style={{ width: '100%', justifyContent: 'center', padding: 12 }}>
              <Check size={15} />{busy ? 'Salvando...' : 'Salvar senha e entrar'}
            </Btn>
          </>
        )}

        {err && (
          <div style={{ marginTop: 14, display: 'flex', gap: 8, alignItems: 'center', color: C.danger, fontSize: 13 }}>
            <AlertCircle size={14} />{err}
          </div>
        )}
        <p style={{ marginTop: 18, fontSize: 11, color: C.textSecondary, textAlign: 'center', lineHeight: 1.6 }}>
          Sua senha é gravada de forma criptografada pelo Firebase Authentication — nem os administradores conseguem vê-la.
        </p>
      </div>
    </div>
  );
}
