import { useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Check, AlertCircle, ShieldCheck, UserRound } from 'lucide-react';
import { C, LOGO_HOME } from '@/lib/theme';
import { submitRegistration } from '@/lib/registration-client';
import { getFirebaseAuth } from '@/lib/firebase';
import { Btn, Inp } from '../ui-kit';
import { useAuth } from '@/lib/auth';

export default function InvitePage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [profile, setProfile] = useState({ name: '', birthdate: '', phone: '' });
  const [pass, setPass] = useState('');
  const [pass2, setPass2] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? window.localStorage.getItem('oitava:invite-email') : null;
    if (saved) setEmail(saved);
    if (auth.user && step === 'email') {
      setEmail(auth.user.email || saved || '');
      setStep('profile');
    }
  }, [auth.user, step]);

  const confirmEmail = async () => {
    setErr('');
    if (!email.trim()) { setErr('Informe o e-mail que recebeu o convite.'); return; }
    setBusy(true);
    try {
      const invitedUser = await auth.completeInvite(email);
      setEmail(invitedUser?.email || email.trim().toLowerCase());
      setStep('profile');
    } catch (e) {
      setErr(e?.message || 'Não foi possível validar o convite.');
    } finally {
      setBusy(false);
    }
  };

  const continueToPassword = () => {
    setErr('');
    if (!profile.name.trim()) { setErr('Informe seu nome completo.'); return; }
    if (!profile.birthdate) { setErr('Informe sua data de nascimento.'); return; }
    if (!profile.phone.trim()) { setErr('Informe seu telefone.'); return; }
    setStep('password');
  };

  const savePassword = async () => {
    setErr('');
    if (pass.length < 6) { setErr('A senha precisa ter pelo menos 6 caracteres.'); return; }
    if (pass !== pass2) { setErr('As senhas não coincidem.'); return; }
    setBusy(true);
    try {
      // 1) Define a senha no Firebase.
      await auth.definePassword(pass);

      // 2) Confirma que a senha realmente funciona antes de criar qualquer cadastro pendente.
      const { auth: firebaseAuth, mod } = await getFirebaseAuth();
      const currentUser = firebaseAuth.currentUser;
      const currentEmail = currentUser?.email?.trim().toLowerCase();
      if (!currentUser || !currentEmail) {
        throw new Error('A sessão expirou antes de confirmar a senha. Solicite um novo link de primeiro acesso.');
      }
      const passwordCredential = mod.EmailAuthProvider.credential(currentEmail, pass);
      await mod.reauthenticateWithCredential(currentUser, passwordCredential);

      // 3) Somente depois da senha validada o cadastro entra na fila do administrador.
      await submitRegistration(profile);

      // 4) Encerra a sessão para garantir que a aprovação continue sendo obrigatória.
      await auth.logout();
      setStep('pending');
    } catch (e) {
      const code = String(e?.code || '');
      if (code.includes('weak-password')) {
        setErr('A senha não atende aos requisitos de segurança do Firebase. Escolha uma senha mais forte.');
      } else if (code.includes('wrong-password') || code.includes('invalid-credential')) {
        setErr('A senha não pôde ser confirmada pelo Firebase. O cadastro não foi enviado para aprovação. Tente criar a senha novamente.');
      } else if (code.includes('requires-recent-login')) {
        setErr('A sessão de primeiro acesso expirou. Solicite um novo link e conclua o cadastro novamente.');
      } else {
        setErr(e?.message || 'Não foi possível concluir a criação do acesso. O cadastro não foi enviado para aprovação.');
      }
    } finally {
      setBusy(false);
    }
  };

  const subtitle =
    step === 'email'
      ? 'Confirme o e-mail que recebeu o convite'
      : step === 'profile'
        ? 'Preencha seus dados básicos'
        : step === 'password'
          ? 'Defina e confirme sua senha pessoal'
          : 'Seu cadastro foi enviado para aprovação';

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: 26 }}>
          <img src={LOGO_HOME} alt="" style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${C.accent}` }} />
          <h1 style={{ fontSize: 20, fontWeight: 800, color: C.accent, marginTop: 12 }}>Ativar meu acesso</h1>
          <p style={{ color: C.textSecondary, fontSize: 13 }}>{subtitle}</p>
        </div>

        {step === 'email' && (
          <>
            <Inp label="E-mail do convite" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" />
            <Btn disabled={busy} onClick={confirmEmail} style={{ width: '100%', justifyContent: 'center', padding: 12 }}>
              <ShieldCheck size={15} />{busy ? 'Validando...' : 'Continuar'}
            </Btn>
          </>
        )}

        {step === 'profile' && (
          <>
            <Inp label="Nome completo *" value={profile.name} onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))} placeholder="Seu nome completo" />
            <Inp label="Data de nascimento *" type="date" value={profile.birthdate} onChange={(e) => setProfile((p) => ({ ...p, birthdate: e.target.value }))} />
            <Inp label="Telefone *" type="tel" value={profile.phone} onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} placeholder="(31) 99999-9999" />
            <Inp label="E-mail verificado" type="email" value={email} disabled />
            <div style={{ padding: '10px 12px', background: C.bgInput, borderRadius: 8, fontSize: 12, color: C.textSecondary, lineHeight: 1.6, marginBottom: 14 }}>
              O e-mail fica bloqueado porque ele foi validado pelo link do convite. Seus dados ainda não serão enviados para aprovação nesta etapa.
            </div>
            <Btn disabled={busy} onClick={continueToPassword} style={{ width: '100%', justifyContent: 'center', padding: 12 }}>
              <UserRound size={15} />Continuar para criar senha
            </Btn>
          </>
        )}

        {step === 'password' && (
          <>
            <Inp label="Nova senha" type="password" autoComplete="new-password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="mínimo 6 caracteres" />
            <Inp label="Confirmar senha" type="password" autoComplete="new-password" value={pass2} onChange={(e) => setPass2(e.target.value)} placeholder="repita a senha" />
            <div style={{ padding: '10px 12px', background: C.bgInput, borderRadius: 8, fontSize: 12, color: C.textSecondary, lineHeight: 1.6, marginBottom: 14 }}>
              Ao concluir, o Firebase criará e confirmará sua senha. Somente depois dessa confirmação seu cadastro será enviado para aprovação de um administrador.
            </div>
            <Btn disabled={busy} onClick={savePassword} style={{ width: '100%', justifyContent: 'center', padding: 12 }}>
              <Check size={15} />{busy ? 'Criando e confirmando acesso...' : 'Concluir cadastro'}
            </Btn>
          </>
        )}

        {step === 'pending' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 58, height: 58, margin: '0 auto 16px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.accentGlow, color: C.accent }}>
              <Check size={28} />
            </div>
            <div style={{ padding: '14px 16px', background: C.bgInput, borderRadius: 10, fontSize: 13, color: C.textSecondary, lineHeight: 1.65, marginBottom: 16 }}>
              <strong style={{ color: C.textPrimary }}>Acesso criado e cadastro recebido.</strong><br />
              Sua senha foi confirmada pelo Firebase. Agora um administrador precisa aceitar sua solicitação antes do primeiro login. Depois da aprovação, entre normalmente usando o e-mail <strong style={{ color: C.textPrimary }}>{email}</strong> e a senha que você acabou de criar.
            </div>
            <Btn onClick={() => navigate({ to: '/entrar', replace: true })} style={{ width: '100%', justifyContent: 'center', padding: 12 }}>
              Ir para a tela de login
            </Btn>
          </div>
        )}

        {err && (
          <div style={{ marginTop: 14, display: 'flex', gap: 8, alignItems: 'center', color: C.danger, fontSize: 13 }}>
            <AlertCircle size={14} />{err}
          </div>
        )}
        {step !== 'pending' && (
          <p style={{ marginTop: 18, fontSize: 11, color: C.textSecondary, textAlign: 'center', lineHeight: 1.6 }}>
            Sua senha é gerenciada pelo Firebase Authentication e não fica armazenada junto aos seus dados de membro.
          </p>
        )}
      </div>
    </div>
  );
}
