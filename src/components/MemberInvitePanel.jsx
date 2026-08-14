import { useEffect, useState } from 'react';
import { Check, Mail, RefreshCw, UserCheck } from 'lucide-react';
import { C } from '@/lib/theme';
import { fmtDate, genId, normalizeStr } from '@/lib/db';
import { Btn, Inp, Modal } from './ui-kit';
import { useAuth } from '@/lib/auth';
import { useData } from '@/lib/data';

export default function MemberInvitePanel() {
  const auth = useAuth();
  const { members, setMembers } = useData();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [registrations, setRegistrations] = useState([]);
  const [busyUid, setBusyUid] = useState('');
  const [error, setError] = useState('');

  const refresh = async () => {
    if (!auth.isAdmin) return;
    setError('');
    try {
      setRegistrations(await auth.listRegistrations());
    } catch (e) {
      setError(e?.message || 'Não foi possível carregar os cadastros recebidos.');
    }
  };

  useEffect(() => {
    refresh();
  }, [auth.isAdmin]);

  const send = async () => {
    const clean = email.trim().toLowerCase();
    setMessage('');
    if (!clean) { setMessage('Informe o e-mail da pessoa que será convidada.'); return; }
    setSending(true);
    try {
      await auth.sendInvite(clean);
      setMessage(`Convite enviado para ${clean}.`);
      setEmail('');
    } catch (e) {
      setMessage(e?.message || 'Falha ao enviar convite.');
    } finally {
      setSending(false);
    }
  };

  const accept = async (registration) => {
    setBusyUid(registration.uid);
    setError('');
    try {
      const existing = members.find((m) => normalizeStr(m.email) === normalizeStr(registration.email));
      const memberId = existing?.id || genId();
      const memberData = {
        ...(existing || {}),
        id: memberId,
        name: registration.name,
        birthdate: registration.birthdate,
        phone: registration.phone,
        email: registration.email,
        photo: existing?.photo || '',
        roles: existing?.roles || [],
      };
      const nextMembers = existing
        ? members.map((m) => (m.id === existing.id ? memberData : m))
        : [...members, memberData];
      await auth.acceptRegistration(registration, memberId, nextMembers);
      setMembers(nextMembers);
      setRegistrations((rows) => rows.map((r) => (r.uid === registration.uid ? { ...r, status: 'accepted' } : r)));
    } catch (e) {
      setError(e?.message || 'Não foi possível concluir o cadastro.');
    } finally {
      setBusyUid('');
    }
  };

  const pending = registrations.filter((r) => r.status === 'pending');

  return (
    <>
      <Btn variant="secondary" onClick={() => { setMessage(''); setOpen(true); }}><Mail size={15} />Convidar membro</Btn>

      <div className="card" style={{ marginTop: 12, marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <UserCheck size={17} color={C.accent} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, color: C.textPrimary }}>Cadastros recebidos</div>
            <div style={{ fontSize: 12, color: C.textSecondary }}>Dados preenchidos pelas pessoas que receberam seu convite.</div>
          </div>
          <Btn variant="ghost" title="Atualizar" onClick={refresh}><RefreshCw size={14} /></Btn>
        </div>
        {error && <div style={{ color: C.danger, fontSize: 12, marginBottom: 10 }}>{error}</div>}
        {!error && pending.length === 0 && (
          <div style={{ padding: '12px 14px', background: C.bgInput, borderRadius: 8, color: C.textSecondary, fontSize: 12 }}>
            Nenhum cadastro pendente no momento.
          </div>
        )}
        <div style={{ display: 'grid', gap: 8 }}>
          {pending.map((r) => (
            <div key={r.uid} style={{ padding: '10px 12px', background: C.bgHover, borderRadius: 9, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 220 }}>
                <div style={{ fontWeight: 700, color: C.textPrimary }}>{r.name}</div>
                <div style={{ fontSize: 12, color: C.textSecondary }}>{r.email} · {r.phone}</div>
                <div style={{ fontSize: 11, color: C.textSecondary, marginTop: 2 }}>Nascimento: {fmtDate(r.birthdate)}</div>
              </div>
              <Btn disabled={busyUid === r.uid} onClick={() => accept(r)}>
                <Check size={14} />{busyUid === r.uid ? 'Adicionando...' : 'Adicionar membro'}
              </Btn>
            </div>
          ))}
        </div>
      </div>

      {open && (
        <Modal title="Convidar novo membro" onClose={() => setOpen(false)}>
          <div style={{ padding: 12, background: C.bgInput, borderRadius: 8, marginBottom: 14, fontSize: 12, color: C.textSecondary, lineHeight: 1.6 }}>
            Informe apenas o e-mail. A pessoa receberá um link seguro e preencherá nome completo, data de nascimento e telefone.
          </div>
          <Inp label="E-mail *" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="pessoa@email.com" />
          {message && <div style={{ marginBottom: 12, color: C.accent, fontSize: 12 }}>{message}</div>}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Btn variant="secondary" onClick={() => setOpen(false)}>Fechar</Btn>
            <Btn disabled={sending} onClick={send}><Mail size={14} />{sending ? 'Enviando...' : 'Enviar convite'}</Btn>
          </div>
        </Modal>
      )}
    </>
  );
}
