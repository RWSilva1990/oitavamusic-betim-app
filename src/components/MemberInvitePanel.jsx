import { useEffect, useMemo, useState } from 'react';
import { Check, Copy, Link2, Mail, RefreshCw, Search, UserCheck, UserPlus } from 'lucide-react';
import { C, ROLES } from '@/lib/theme';
import { fmtDate } from '@/lib/db';
import { acceptPendingRegistration, listPendingRegistrations } from '@/lib/registration-client';
import { sendCustomInvitation } from '@/lib/invite-client';
import { Btn, Field, Inp, Modal } from './ui-kit';
import { useAuth } from '@/lib/auth';
import { useData } from '@/lib/data';

function normalizeName(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function similarityScore(memberName, requestedName) {
  const member = normalizeName(memberName);
  const requested = normalizeName(requestedName);
  if (!member || !requested) return 0;
  if (member === requested) return 100;
  if (member.startsWith(requested) || requested.startsWith(member)) return 85;
  if (member.includes(requested) || requested.includes(member)) return 75;

  const memberWords = new Set(member.split(' ').filter((word) => word.length > 1));
  const requestedWords = requested.split(' ').filter((word) => word.length > 1);
  if (requestedWords.length === 0) return 0;
  const common = requestedWords.filter((word) => memberWords.has(word)).length;
  return Math.round((common / Math.max(memberWords.size, requestedWords.length)) * 70);
}

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
  const [refreshing, setRefreshing] = useState(false);
  const [syncingAccess, setSyncingAccess] = useState(false);
  const [syncResult, setSyncResult] = useState(null);

  const [approvalRegistration, setApprovalRegistration] = useState(null);
  const [approvalRoles, setApprovalRoles] = useState([]);
  const [approvalTarget, setApprovalTarget] = useState(null);
  const [memberSearch, setMemberSearch] = useState('');

  const refresh = async ({ silent = false } = {}) => {
    if (!auth.isAdmin) return;
    if (!silent) setRefreshing(true);
    setError('');
    try {
      setRegistrations(await listPendingRegistrations());
    } catch (e) {
      setError(e?.message || 'Não foi possível carregar os cadastros recebidos.');
    } finally {
      if (!silent) setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!auth.isAdmin) return undefined;
    refresh();
    const refreshWhenVisible = () => { if (document.visibilityState === 'visible') refresh({ silent: true }); };
    const refreshWhenFocused = () => refresh({ silent: true });
    const interval = window.setInterval(() => refresh({ silent: true }), 15000);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    window.addEventListener('focus', refreshWhenFocused);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
      window.removeEventListener('focus', refreshWhenFocused);
    };
  }, [auth.isAdmin]);

  const send = async () => {
    const clean = email.trim().toLowerCase();
    setMessage('');
    setSentEmail('');
    setNoticeCopied(false);
    if (!clean) {
      setMessage('Informe o e-mail da pessoa que será convidada.');
      return;
    }
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
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(notice);
      else {
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
      setSyncResult(await auth.syncMemberDirectory(members));
    } catch (e) {
      setSyncResult({ error: e?.message || 'Não foi possível sincronizar os acessos.' });
    } finally {
      setSyncingAccess(false);
    }
  };

  const openApproval = (registration) => {
    setApprovalRegistration(registration);
    setApprovalRoles(Array.isArray(registration.roles) ? registration.roles : []);
    setApprovalTarget(null);
    setMemberSearch('');
    setError('');
  };

  const resetApproval = () => {
    setApprovalRegistration(null);
    setApprovalRoles([]);
    setApprovalTarget(null);
    setMemberSearch('');
  };

  const closeApproval = () => {
    if (busyUid) return;
    resetApproval();
  };

  const toggleApprovalRole = (role) => {
    setApprovalRoles((current) => (
      current.includes(role)
        ? current.filter((item) => item !== role)
        : [...current, role]
    ));
  };

  const suggestedMembers = useMemo(() => {
    if (!approvalRegistration) return [];
    return members
      .map((member) => ({ member, score: similarityScore(member.name, approvalRegistration.name) }))
      .filter((item) => item.score >= 30)
      .sort((a, b) => b.score - a.score || a.member.name.localeCompare(b.member.name, 'pt-BR'))
      .slice(0, 5)
      .map((item) => item.member);
  }, [approvalRegistration, members]);

  const searchResults = useMemo(() => {
    const query = normalizeName(memberSearch);
    if (!query) return [];
    return members
      .filter((member) => normalizeName(member.name).includes(query))
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
      .slice(0, 8);
  }, [memberSearch, members]);

  const approve = async () => {
    if (!approvalRegistration) return;
    if (!approvalTarget) {
      setError('Escolha se o cadastro será vinculado a um participante existente ou criado como novo.');
      return;
    }
    if (approvalRoles.length === 0) {
      setError('Mantenha pelo menos uma função antes de aprovar.');
      return;
    }

    setBusyUid(approvalRegistration.uid);
    setError('');
    try {
      const result = await acceptPendingRegistration(approvalRegistration.uid, {
        memberId: approvalTarget.mode === 'existing' ? approvalTarget.memberId : '',
        roles: approvalRoles,
      });
      if (Array.isArray(result?.members)) setMembers(result.members);
      setRegistrations((rows) => rows.filter((row) => row.uid !== approvalRegistration.uid));
      resetApproval();
      await refresh({ silent: true });
    } catch (e) {
      setError(e?.message || 'Não foi possível concluir o cadastro.');
    } finally {
      setBusyUid('');
    }
  };

  const pending = registrations.filter((registration) => registration.status === 'pending');
  const selectedExisting = approvalTarget?.mode === 'existing'
    ? members.find((member) => member.id === approvalTarget.memberId)
    : null;

  const renderMemberChoice = (member) => {
    const selected = approvalTarget?.mode === 'existing' && approvalTarget.memberId === member.id;
    return (
      <button
        key={member.id}
        type="button"
        onClick={() => setApprovalTarget({ mode: 'existing', memberId: member.id })}
        style={{
          width: '100%',
          padding: '9px 11px',
          borderRadius: 9,
          border: `1px solid ${selected ? C.accent : C.border}`,
          background: selected ? C.accentGlow : C.bgInput,
          color: C.textPrimary,
          textAlign: 'left',
          cursor: 'pointer',
          display: 'grid',
          gap: 3,
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 700 }}>{member.name}</span>
        <span style={{ fontSize: 11, color: C.textSecondary }}>
          {member.email || 'Sem e-mail cadastrado'}
          {(member.roles || []).length > 0
            ? ` · ${member.roles.map((key) => ROLES.find((role) => role.key === key)?.label).filter(Boolean).join(', ')}`
            : ''}
        </span>
      </button>
    );
  };

  return (
    <>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Btn variant="secondary" onClick={() => { setMessage(''); setSentEmail(''); setNoticeCopied(false); setOpen(true); }}>
          <Mail size={15} />Convidar membro
        </Btn>
        <Btn variant="secondary" disabled={syncingAccess} onClick={syncAccessDirectory}>
          <Link2 size={15} />{syncingAccess ? 'Sincronizando...' : 'Sincronizar acessos'}
        </Btn>
      </div>

      {syncResult && (
        <div style={{ marginTop: 10, padding: '10px 12px', background: C.bgInput, borderRadius: 8, fontSize: 12, color: syncResult.error ? C.danger : C.textSecondary, lineHeight: 1.6 }}>
          {syncResult.error
            ? syncResult.error
            : (
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
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, color: C.textPrimary }}>Cadastros recebidos</div>
            <div style={{ fontSize: 12, color: C.textSecondary }}>Dados informados no primeiro acesso e aguardando sua revisão.</div>
          </div>
          <Btn variant="ghost" title="Atualizar" disabled={refreshing} onClick={() => refresh()}>
            <RefreshCw size={14} style={refreshing ? { animation: 'spin 0.8s linear infinite' } : undefined} />
          </Btn>
        </div>

        {error && !approvalRegistration && <div style={{ color: C.danger, fontSize: 12, marginBottom: 10 }}>{error}</div>}
        {!error && !refreshing && pending.length === 0 && (
          <div style={{ padding: '12px 14px', background: C.bgInput, borderRadius: 8, color: C.textSecondary, fontSize: 12 }}>
            Nenhum cadastro pendente no momento.
          </div>
        )}

        <div style={{ display: 'grid', gap: 8 }}>
          {pending.map((registration) => (
            <div key={registration.uid} className="pending-registration-row">
              <div style={{ flex: 1, minWidth: 0, overflowWrap: 'anywhere' }}>
                <div style={{ fontWeight: 700, color: C.textPrimary }}>{registration.name}</div>
                <div style={{ fontSize: 12, color: C.textSecondary }}>{registration.email} · {registration.phone}</div>
                <div style={{ fontSize: 11, color: C.textSecondary, marginTop: 2 }}>Nascimento: {fmtDate(registration.birthdate)}</div>
                {(registration.roles || []).length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                    {registration.roles.map((key) => {
                      const role = ROLES.find((item) => item.key === key);
                      return role ? <span key={key} className="tag">{role.emoji} {role.label}</span> : null;
                    })}
                  </div>
                )}
              </div>
              <Btn disabled={busyUid === registration.uid} onClick={() => openApproval(registration)}>
                <Check size={14} />Revisar cadastro
              </Btn>
            </div>
          ))}
        </div>
      </div>

      {approvalRegistration && (
        <Modal title="Revisar e aprovar cadastro" onClose={closeApproval} wide>
          <div style={{ padding: '12px 14px', background: C.bgInput, borderRadius: 9, marginBottom: 16, display: 'grid', gap: 5, fontSize: 12, color: C.textSecondary }}>
            <div><strong style={{ color: C.textPrimary }}>Nome:</strong> {approvalRegistration.name}</div>
            <div><strong style={{ color: C.textPrimary }}>E-mail verificado:</strong> {approvalRegistration.email}</div>
            <div><strong style={{ color: C.textPrimary }}>Telefone:</strong> {approvalRegistration.phone}</div>
            <div><strong style={{ color: C.textPrimary }}>Nascimento:</strong> {fmtDate(approvalRegistration.birthdate)}</div>
          </div>

          <Field label="Funções que serão gravadas *">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 6 }}>
              {ROLES.map((role) => {
                const selected = approvalRoles.includes(role.key);
                return (
                  <button
                    key={role.key}
                    type="button"
                    className={`role-chip${selected ? ' selected' : ''}`}
                    onClick={() => toggleApprovalRole(role.key)}
                    aria-pressed={selected}
                    style={{ width: '100%', textAlign: 'left' }}
                  >
                    <span>{role.emoji}</span>{role.label}
                    {selected && <Check size={13} style={{ marginLeft: 'auto' }} />}
                  </button>
                );
              })}
            </div>
            <div style={{ marginTop: 6, fontSize: 11, color: C.textSecondary }}>
              Você pode corrigir as funções antes da aprovação.
            </div>
          </Field>

          <Field label="Vincular a participante existente">
            <div style={{ position: 'relative', marginBottom: 8 }}>
              <Search size={13} color={C.textSecondary} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input
                className="input-field"
                placeholder="Digite o nome do participante..."
                value={memberSearch}
                onChange={(event) => setMemberSearch(event.target.value)}
                style={{ paddingLeft: 30 }}
              />
            </div>

            {!memberSearch.trim() && suggestedMembers.length > 0 && (
              <>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.textSecondary, marginBottom: 6 }}>Possíveis participantes já cadastrados</div>
                <div style={{ display: 'grid', gap: 5, marginBottom: 8 }}>
                  {suggestedMembers.map(renderMemberChoice)}
                </div>
              </>
            )}

            {memberSearch.trim() && (
              <div style={{ display: 'grid', gap: 5, marginBottom: 8 }}>
                {searchResults.map(renderMemberChoice)}
                {searchResults.length === 0 && (
                  <div style={{ padding: '9px 11px', background: C.bgInput, borderRadius: 8, fontSize: 12, color: C.textSecondary }}>
                    Nenhum participante encontrado.
                  </div>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={() => setApprovalTarget({ mode: 'new' })}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 9,
                border: `1px solid ${approvalTarget?.mode === 'new' ? C.accent : C.border}`,
                background: approvalTarget?.mode === 'new' ? C.accentGlow : 'transparent',
                color: approvalTarget?.mode === 'new' ? C.accent : C.textPrimary,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 7,
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              <UserPlus size={14} />Criar como novo participante
            </button>
          </Field>

          {selectedExisting && (
            <div style={{ padding: '10px 12px', borderRadius: 8, background: C.accentGlow, color: C.textSecondary, fontSize: 12, lineHeight: 1.6, marginBottom: 12 }}>
              <strong style={{ color: C.accent }}>Vínculo selecionado: {selectedExisting.name}.</strong><br />
              O participante manterá o mesmo identificador interno, suas equipes e referências em escalas antigas. Nome, telefone, nascimento, e-mail e funções serão atualizados com os dados aprovados.
            </div>
          )}

          {approvalTarget?.mode === 'new' && (
            <div style={{ padding: '10px 12px', borderRadius: 8, background: C.bgInput, color: C.textSecondary, fontSize: 12, lineHeight: 1.6, marginBottom: 12 }}>
              Será criado um novo participante. A equipe continuará sendo definida posteriormente pelo administrador.
            </div>
          )}

          {error && <div style={{ color: C.danger, fontSize: 12, marginBottom: 10 }}>{error}</div>}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
            <Btn variant="secondary" disabled={Boolean(busyUid)} onClick={closeApproval}>Cancelar</Btn>
            <Btn disabled={Boolean(busyUid) || !approvalTarget || approvalRoles.length === 0} onClick={approve}>
              <Check size={14} />{busyUid ? 'Aprovando...' : 'Aprovar acesso'}
            </Btn>
          </div>
        </Modal>
      )}

      {open && (
        <Modal title="Convidar novo membro" onClose={() => setOpen(false)}>
          <div style={{ padding: 12, background: C.bgInput, borderRadius: 8, marginBottom: 14, fontSize: 12, color: C.textSecondary, lineHeight: 1.6 }}>
            Informe apenas o e-mail. A pessoa receberá um link seguro e preencherá nome completo, data de nascimento, telefone e suas funções no ministério. O acesso só será liberado depois que você revisar e aprovar o cadastro recebido.
          </div>
          <Inp label="E-mail *" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="pessoa@email.com" />
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
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
            <Btn variant="secondary" onClick={() => setOpen(false)}>Fechar</Btn>
            <Btn disabled={sending} onClick={send}>
              <Mail size={14} />{sending ? 'Enviando...' : 'Enviar convite'}
            </Btn>
          </div>
        </Modal>
      )}
    </>
  );
}
