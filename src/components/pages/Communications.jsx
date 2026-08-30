import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Check, History, Inbox, Megaphone, Plus, Search, Send, Users } from 'lucide-react';
import { C } from '@/lib/theme';
import { Avatar, Btn, Field, Inp, Modal, PageTitle } from '../ui-kit';
import { useAuth } from '@/lib/auth';
import { useData } from '@/lib/data';
import {
  getCommunicationsInbox,
  getSentCommunications,
  markCommunicationRead,
  sendCommunication,
} from '@/lib/communications';

function normalizeSearchText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .trim();
}

function formatDateTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(date);
}

function MessagePreview({ text }) {
  return (
    <div style={{
      marginTop: 7,
      color: C.textSecondary,
      fontSize: 12.5,
      lineHeight: 1.55,
      display: '-webkit-box',
      WebkitLineClamp: 2,
      WebkitBoxOrient: 'vertical',
      overflow: 'hidden',
    }}>
      {text}
    </div>
  );
}

export default function CommunicationsPage() {
  const auth = useAuth();
  const { groups, members } = useData();
  const [tab, setTab] = useState('inbox');
  const [inbox, setInbox] = useState([]);
  const [unread, setUnread] = useState(0);
  const [sent, setSent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [compose, setCompose] = useState(false);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState('');
  const [form, setForm] = useState({ title: '', message: '', groupIds: [], memberIds: [] });
  const [memberSearch, setMemberSearch] = useState('');
  const openedFromUrl = useRef(false);

  const loadInbox = useCallback(async () => {
    const data = await getCommunicationsInbox();
    setInbox(data?.communications || []);
    setUnread(Number(data?.unread || 0));
  }, []);

  const loadSent = useCallback(async () => {
    if (!auth.isAdmin) return;
    const data = await getSentCommunications();
    setSent(data?.communications || []);
  }, [auth.isAdmin]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      await Promise.all([loadInbox(), loadSent()]);
    } catch (e) {
      setError(e?.message || 'Não foi possível carregar os comunicados.');
    } finally {
      setLoading(false);
    }
  }, [loadInbox, loadSent]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const openReceived = useCallback(async (item) => {
    setSelected({ ...item, kind: 'received' });
    if (item.readAt) return;
    try {
      const result = await markCommunicationRead(item.communicationId);
      const readAt = result?.readAt || new Date().toISOString();
      setInbox((current) => current.map((entry) => (
        entry.communicationId === item.communicationId ? { ...entry, readAt } : entry
      )));
      setUnread((current) => Math.max(0, current - 1));
      window.dispatchEvent(new CustomEvent('oitava:communications-updated'));
    } catch (e) {
      console.warn('Não foi possível marcar o comunicado como lido:', e);
    }
  }, []);

  useEffect(() => {
    if (loading || openedFromUrl.current || inbox.length === 0) return;
    const id = new URLSearchParams(window.location.search).get('comunicado');
    if (!id) return;
    const item = inbox.find((entry) => entry.communicationId === id);
    if (!item) return;
    openedFromUrl.current = true;
    openReceived(item);
  }, [loading, inbox, openReceived]);

  const recipientIds = useMemo(() => {
    const ids = new Set(form.memberIds);
    for (const groupId of form.groupIds) {
      const group = groups.find((item) => item.id === groupId);
      for (const memberId of group?.memberIds || []) ids.add(memberId);
    }
    return [...ids].filter((id) => members.some((member) => member.id === id));
  }, [form.groupIds, form.memberIds, groups, members]);

  const filteredMembers = useMemo(() => {
    const term = normalizeSearchText(memberSearch);
    return members
      .filter((member) => !term || normalizeSearchText(member.name).includes(term))
      .sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'pt-BR', { sensitivity: 'base' }));
  }, [members, memberSearch]);

  const toggleGroup = (id) => setForm((current) => ({
    ...current,
    groupIds: current.groupIds.includes(id)
      ? current.groupIds.filter((value) => value !== id)
      : [...current.groupIds, id],
  }));

  const toggleMember = (id) => setForm((current) => ({
    ...current,
    memberIds: current.memberIds.includes(id)
      ? current.memberIds.filter((value) => value !== id)
      : [...current.memberIds, id],
  }));

  const openCompose = () => {
    setForm({ title: '', message: '', groupIds: [], memberIds: [] });
    setMemberSearch('');
    setNotice('');
    setCompose(true);
  };

  const submitCommunication = async () => {
    if (sending) return;
    if (!form.title.trim() || !form.message.trim()) {
      setNotice('Informe o título e a mensagem do comunicado.');
      return;
    }
    if (recipientIds.length === 0) {
      setNotice('Selecione pelo menos uma equipe ou um membro avulso.');
      return;
    }

    setSending(true);
    setNotice('');
    try {
      const result = await sendCommunication(form);
      setCompose(false);
      const pushText = result?.pushError
        ? ' O comunicado foi salvo, mas houve uma falha no envio da notificação push.'
        : '';
      setNotice(`Comunicado enviado para ${result?.communication?.recipientCount || recipientIds.length} pessoa(s).${pushText}`);
      await Promise.all([loadSent(), loadInbox()]);
      window.dispatchEvent(new CustomEvent('oitava:communications-updated'));
    } catch (e) {
      setNotice(e?.message || 'Não foi possível enviar o comunicado.');
    } finally {
      setSending(false);
    }
  };

  const unreadLabel = unread > 0 ? `${unread} não lido${unread !== 1 ? 's' : ''}` : 'Nenhum comunicado novo';

  return (
    <div style={{ padding: 24, maxWidth: 900 }}>
      <PageTitle title="Comunicados" subtitle={auth.isAdmin ? `${unreadLabel} • envie mensagens para equipes e membros` : unreadLabel}>
        {auth.isAdmin && <Btn onClick={openCompose}><Plus size={15} />Novo Comunicado</Btn>}
      </PageTitle>

      {auth.isAdmin && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
          <Btn variant={tab === 'inbox' ? 'primary' : 'secondary'} onClick={() => setTab('inbox')}>
            <Inbox size={14} />Recebidos{unread > 0 ? ` (${unread})` : ''}
          </Btn>
          <Btn variant={tab === 'sent' ? 'primary' : 'secondary'} onClick={() => setTab('sent')}>
            <History size={14} />Enviados
          </Btn>
        </div>
      )}

      {notice && (
        <div style={{ marginBottom: 16, padding: '10px 13px', border: `1px solid ${C.border}`, borderRadius: 10, background: C.accentGlow, color: C.textPrimary, fontSize: 12.5, lineHeight: 1.5 }}>
          {notice}
        </div>
      )}

      {error && (
        <div style={{ marginBottom: 16, padding: '10px 13px', border: `1px solid ${C.danger}44`, borderRadius: 10, color: C.danger, fontSize: 13 }}>
          {error}
        </div>
      )}

      {loading ? (
        <div className="empty-state"><Megaphone size={36} style={{ marginBottom: 10, opacity: 0.25 }} /><p>Carregando comunicados...</p></div>
      ) : tab === 'sent' && auth.isAdmin ? (
        sent.length === 0 ? (
          <div className="empty-state"><Send size={38} style={{ marginBottom: 12, opacity: 0.25 }} /><p>Nenhum comunicado enviado</p></div>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {sent.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelected({ ...item, kind: 'sent' })}
                className="card"
                style={{ width: '100%', textAlign: 'left', cursor: 'pointer', color: C.textPrimary, fontFamily: 'inherit' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <strong style={{ fontSize: 14.5 }}>{item.title}</strong>
                      <span className="tag">{item.recipientCount} destinatário{item.recipientCount !== 1 ? 's' : ''}</span>
                    </div>
                    <MessagePreview text={item.message} />
                    <div style={{ marginTop: 9, fontSize: 11, color: C.textSecondary }}>{formatDateTime(item.createdAt)}</div>
                  </div>
                  <Send size={17} color={C.accent} style={{ flexShrink: 0 }} />
                </div>
              </button>
            ))}
          </div>
        )
      ) : inbox.length === 0 ? (
        <div className="empty-state"><Inbox size={38} style={{ marginBottom: 12, opacity: 0.25 }} /><p>Nenhum comunicado recebido</p></div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {inbox.map((item) => {
            const isUnread = !item.readAt;
            return (
              <button
                key={item.communicationId}
                type="button"
                onClick={() => openReceived(item)}
                className="card"
                style={{
                  width: '100%', textAlign: 'left', cursor: 'pointer', color: C.textPrimary, fontFamily: 'inherit',
                  borderColor: isUnread ? `${C.accent}88` : C.border,
                  background: isUnread ? C.accentGlow : C.bgCard,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      {isUnread && <span className="tag">NOVO</span>}
                      <strong style={{ fontSize: 14.5 }}>{item.title}</strong>
                    </div>
                    <MessagePreview text={item.message} />
                    <div style={{ marginTop: 9, fontSize: 11, color: C.textSecondary }}>
                      {item.senderName || 'Administração'} • {formatDateTime(item.createdAt)}
                    </div>
                  </div>
                  <Megaphone size={18} color={isUnread ? C.accent : C.textSecondary} style={{ flexShrink: 0 }} />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {compose && (
        <Modal title="Novo Comunicado" onClose={() => !sending && setCompose(false)} wide>
          <Inp
            label="Título *"
            value={form.title}
            maxLength={140}
            onChange={(e) => setForm((current) => ({ ...current, title: e.target.value }))}
            placeholder="Ex: Ensaio extraordinário"
          />

          <Field label="Mensagem *">
            <textarea
              className="input-field"
              value={form.message}
              maxLength={4000}
              onChange={(e) => setForm((current) => ({ ...current, message: e.target.value }))}
              placeholder="Digite o comunicado que será enviado..."
              rows={6}
              style={{ resize: 'vertical', lineHeight: 1.55 }}
            />
          </Field>

          <Field label={`Equipes (${form.groupIds.length} selecionada${form.groupIds.length !== 1 ? 's' : ''})`}>
            <div style={{ display: 'grid', gap: 6, gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))' }}>
              {groups.map((group) => {
                const selectedGroup = form.groupIds.includes(group.id);
                return (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => toggleGroup(group.id)}
                    className={`member-pick${selectedGroup ? ' selected' : ''}`}
                    style={{ width: '100%', textAlign: 'left' }}
                  >
                    <Users size={16} color={selectedGroup ? C.accent : C.textSecondary} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, color: selectedGroup ? C.accent : C.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{group.name}</div>
                      <div style={{ fontSize: 10.5, color: C.textSecondary }}>{(group.memberIds || []).length} membro(s)</div>
                    </div>
                    {selectedGroup && <Check size={15} color={C.accent} />}
                  </button>
                );
              })}
              {groups.length === 0 && <div style={{ color: C.textSecondary, fontSize: 12 }}>Nenhuma equipe cadastrada.</div>}
            </div>
          </Field>

          <Field label={`Membros avulsos (${form.memberIds.length} selecionado${form.memberIds.length !== 1 ? 's' : ''})`}>
            <div className="search-wrap" style={{ marginBottom: 10 }}>
              <Search size={13} color={C.textSecondary} />
              <input className="input-field" placeholder="Buscar membro..." value={memberSearch} onChange={(e) => setMemberSearch(e.target.value)} style={{ fontSize: 13 }} />
            </div>
            <div style={{ maxHeight: 230, overflowY: 'auto', display: 'grid', gap: 5 }}>
              {filteredMembers.map((member) => {
                const selectedMember = form.memberIds.includes(member.id);
                const includedByGroup = !selectedMember && form.groupIds.some((groupId) => (
                  groups.find((group) => group.id === groupId)?.memberIds || []
                ).includes(member.id));
                return (
                  <div key={member.id} className={`member-pick${selectedMember ? ' selected' : ''}`} onClick={() => toggleMember(member.id)}>
                    <Avatar member={member} size={32} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: selectedMember ? C.accent : C.textPrimary, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{member.name}</div>
                      {includedByGroup && <div style={{ color: C.textSecondary, fontSize: 10.5 }}>Já incluído por uma equipe selecionada</div>}
                    </div>
                    {selectedMember && <Check size={15} color={C.accent} />}
                  </div>
                );
              })}
            </div>
          </Field>

          <div style={{ marginBottom: 15, padding: '11px 13px', borderRadius: 10, background: C.accentGlow, border: `1px solid ${C.accent}33`, color: C.textPrimary, fontSize: 12.5 }}>
            <strong style={{ color: C.accent }}>{recipientIds.length} destinatário{recipientIds.length !== 1 ? 's' : ''}</strong>
            <span style={{ color: C.textSecondary }}> após eliminar seleções repetidas entre equipes e membros avulsos.</span>
          </div>

          {notice && <div style={{ marginBottom: 12, color: C.danger, fontSize: 12.5 }}>{notice}</div>}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Btn variant="secondary" disabled={sending} onClick={() => setCompose(false)}>Cancelar</Btn>
            <Btn disabled={sending || recipientIds.length === 0} onClick={submitCommunication}>
              <Send size={14} />{sending ? 'Enviando...' : 'Enviar Comunicado'}
            </Btn>
          </div>
        </Modal>
      )}

      {selected && (
        <Modal title={selected.title} onClose={() => setSelected(null)}>
          <div style={{ whiteSpace: 'pre-wrap', color: C.textPrimary, fontSize: 14, lineHeight: 1.7 }}>{selected.message}</div>
          <div style={{ marginTop: 18, paddingTop: 14, borderTop: `1px solid ${C.border}`, color: C.textSecondary, fontSize: 11.5, lineHeight: 1.6 }}>
            <div><strong style={{ color: C.textPrimary }}>Enviado por:</strong> {selected.senderName || 'Administração'}</div>
            <div><strong style={{ color: C.textPrimary }}>Data:</strong> {formatDateTime(selected.createdAt)}</div>
            {selected.kind === 'sent' && (
              <>
                <div><strong style={{ color: C.textPrimary }}>Destinatários:</strong> {selected.recipientCount}</div>
                {selected.groupNames?.length > 0 && <div><strong style={{ color: C.textPrimary }}>Equipes:</strong> {selected.groupNames.join(', ')}</div>}
                {selected.memberNames?.length > 0 && <div><strong style={{ color: C.textPrimary }}>Membros avulsos:</strong> {selected.memberNames.join(', ')}</div>}
              </>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
