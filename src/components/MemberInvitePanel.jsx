import { useEffect, useState } from 'react';
import { Check, Copy, Link2, Mail, RefreshCw, UserCheck } from 'lucide-react';
import { C } from '@/lib/theme';
import { fmtDate, genId, normalizeStr } from '@/lib/db';
import { sendCustomInvitation } from '@/lib/invite-client';
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
  const [sentEmail, setSentEmail] = useState('');
  const [noticeCopied, setNoticeCopied] = useState(false);
  const [registrations, setRegistrations] = useState([]);
  const [busyUid, setBusyUid] = useState('');
  const [error, setError] = useState('');
  const [syncingAccess, setSyncingAccess] = useState(false);
  const [syncResult, setSyncResult] = useState(null);

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
    setSentEmail('');
    setNoticeCopied(false);
    if (!clean) { setMessage('Informe o e-mail da pessoa que será convidada.'); return; }
    setSending(true);
    try {
      await sendCustomInvitation(clean);
      setMessage(`Convite enviado para ${clean}.`);
      setSentEmail(clean);
      setEmail('');
    } catch (e) {
      setMessage(e?.message || 'Falha ao enviar convite.');
    } finally {
      setSending(false);
    }
  };

  const copyWhatsAppNotice = async () => {
    if (!sentEmail) return;

    const notice = `Olá! 👋 Acabei de enviar seu acesso ao Oitava Music Betim para o e-mail ${sentEmail}.\n\nProcure pelo e-mail com o assunto “Crie seu acesso ao Oitava Music Betim”.\n\nSe não aparecer na caixa de entrada, verifique também a pasta Spam/Lixo eletrônico.\n\n🔒 O link é pessoal. Para criar seu acesso, utilize o mesmo e-mail em que recebeu o convite.`;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(notice);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = notice;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setNoticeCopied(true);
    } catch {
      setNoticeCopied(false);
      setMessage('Não foi possível copiar o aviso automaticamente.');
    }
  };

  const syncAccessDirectory = async () => {
    setSyncResult(null);
    setSyncingAccess(true);
    try {
      const result = await auth.syncMemberDirectory(members);
      setSyncResult(result);
    } catch (e) {
      setSyncResult({ error: e?.message || 'Não foi possível sincronizar os acessos.' });
    } finally {
      setSyncingAccess(false);
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
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Btn variant="secondary" onClick={() => { setMessage(''); setSentEmail(''); setNoticeCopied(false); setOpen(true); }}><Mail size={15} />Convidar membro</Btn>
        <Btn variant="secondary" disabled={syncingAccess} onClick={syncAccessDirectory}>
          <Link2 size={15} />{syncingAccess ? 'Sincronizando...' : 'Sincronizar acessos'}
        </Btn>
      </div>

      {syncResult && (
        <div style={{ marginTop: 10, padding: '10px 12px', background: C.bgInput, borderRadius: 8, fontSize: 12, color: syncResult.error ? C.danger : C.textSecondary, lineHeight: 1.6 }}>
          {syncResult.error ? (
            syncResult.error
          ) : (
            <>
              <strong style={{ color: C.textPrimary }}>Sincronização concluída.</strong>{' '}
              {syncResult.linked} novo(s) vínculo(s), {syncResult.alreadyLinked} já vinculado(s), {syncResult.withoutEmail} sem e-mail, {syncResult.invalidEmail} e-mail(s) inválido(s), {syncResult.duplicates} e-mail(s) duplicado(s) e {syncResult.conflicts} conflito(s).
              {(syncResult.duplicates > 0 || syncResult.conflicts > 0) && (
                <div style={{ marginTop: 5, color: C.accent }}>
                  Duplicidades e conflitos foram ignorados automaticamente para não trocar o acesso de ninguém.
                </div>
              )}
            </>
          )}
        </div>
      )}

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
          {sentEmail && (
            <div style={{ marginBottom: 12, padding: '12px 14px', background: C.bgInput, borderRadius: 8 }}>
              <div style={{ marginBottom: 9, color: C.textSecondary, fontSize: 12, lineHeight: 1.5 }}>
                Avise a pessoa pelo WhatsApp para que ela saiba onde procurar o convite.
              </div>
              <Btn variant="secondary" onClick={copyWhatsAppNotice}>
                <Copy size={14} />{noticeCopied ? 'Aviso copiado!' : 'Copiar aviso para WhatsApp'}
              </Btn>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Btn variant="secondary" onClick={() => setOpen(false)}>Fechar</Btn>
            <Btn disabled={sending} onClick={send}><Mail size={14} />{sending ? 'Enviando...' : 'Enviar convite'}</Btn>
          </div>
        </Modal>
      )}
    </>
  );
}
