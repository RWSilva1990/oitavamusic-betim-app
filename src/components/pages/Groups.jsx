import { useState } from 'react';
import { Music, Plus, Edit2, Trash2, Check, Search } from 'lucide-react';
import { C, ROLES } from '@/lib/theme';
import { genId } from '@/lib/db';
import { Avatar, Btn, Confirm, Field, Inp, Modal, PageTitle } from '../ui-kit';
import { useData } from '@/lib/data';

export default function GroupsPage() {
  const { groups, setGroups, members } = useData();
  const [modal, setModal] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [form, setForm] = useState({ name: '', memberIds: [] });
  const [mSearch, setMSearch] = useState('');

  const openAdd = () => { setForm({ name: '', memberIds: [] }); setMSearch(''); setModal('add'); };
  const openEdit = (g) => { setForm({ ...g, memberIds: [...(g.memberIds || [])] }); setMSearch(''); setModal(g); };
  const toggleM = (id) => setForm((f) => ({ ...f, memberIds: f.memberIds.includes(id) ? f.memberIds.filter((x) => x !== id) : [...f.memberIds, id] }));

  const save = () => {
    if (!form.name.trim()) return;
    if (modal === 'add') setGroups((p) => [...p, { ...form, id: genId() }]);
    else setGroups((p) => p.map((g) => (g.id === form.id ? { ...form } : g)));
    setModal(null);
  };
  const del = (id) => { setGroups((p) => p.filter((g) => g.id !== id)); setConfirm(null); };

  const filteredM = members.filter((m) => m.name.toLowerCase().includes(mSearch.toLowerCase()));

  return (
    <div style={{ padding: 24, maxWidth: 860 }}>
      <PageTitle title="Grupos" subtitle={`${groups.length} grupo${groups.length !== 1 ? 's' : ''}`}>
        <Btn onClick={openAdd}><Plus size={15} />Novo Grupo</Btn>
      </PageTitle>

      {groups.length === 0 ? (
        <div className="empty-state"><Music size={38} style={{ marginBottom: 12, opacity: 0.25 }} /><p>Nenhum grupo cadastrado</p></div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {groups.map((g) => {
            const gMembers = members.filter((m) => (g.memberIds || []).includes(m.id));
            return (
              <div key={g.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, color: C.textPrimary, fontSize: 16, marginBottom: 10 }}>{g.name}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {gMembers.map((m) => (
                        <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 10px', background: C.bgHover, borderRadius: 20, fontSize: 12 }}>
                          <Avatar member={m} size={20} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</span>
                        </div>
                      ))}
                      {gMembers.length === 0 && <span style={{ color: C.textSecondary, fontSize: 13 }}>Sem membros</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                    <Btn variant="ghost" onClick={() => openEdit(g)}><Edit2 size={14} /></Btn>
                    <Btn variant="ghost" className="del" onClick={() => setConfirm(g.id)}><Trash2 size={14} /></Btn>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal && (
        <Modal title={modal === 'add' ? 'Novo Grupo' : 'Editar Grupo'} onClose={() => setModal(null)} wide>
          <Inp label="Nome do Grupo *" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Ex: Grupo Alpha" />
          <Field label={`Membros (${form.memberIds.length} selecionado${form.memberIds.length !== 1 ? 's' : ''})`}>
            <div className="search-wrap" style={{ marginBottom: 10 }}>
              <Search size={13} color={C.textSecondary} />
              <input className="input-field" placeholder="Filtrar membros..." value={mSearch} onChange={(e) => setMSearch(e.target.value)} style={{ fontSize: 13 }} />
            </div>
            <div style={{ maxHeight: 240, overflowY: 'auto', display: 'grid', gap: 5 }}>
              {filteredM.map((m) => (
                <div key={m.id} className={`member-pick${form.memberIds.includes(m.id) ? ' selected' : ''}`} onClick={() => toggleM(m.id)}>
                  <Avatar member={m} size={32} />
                  <div style={{ flex: 1 }}>
                    <div style={{ color: form.memberIds.includes(m.id) ? C.accent : C.textPrimary, fontWeight: 500 }}>{m.name}</div>
                    <div style={{ fontSize: 11, color: C.textSecondary }}>
                      {(m.roles || []).map((r) => ROLES.find((x) => x.key === r)?.label).filter(Boolean).join(', ') || 'Sem função'}
                    </div>
                  </div>
                  {form.memberIds.includes(m.id) && <Check size={15} color={C.accent} />}
                </div>
              ))}
              {filteredM.length === 0 && <div style={{ textAlign: 'center', padding: 20, color: C.textSecondary, fontSize: 13 }}>Nenhum membro</div>}
            </div>
          </Field>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
            <Btn variant="secondary" onClick={() => setModal(null)}>Cancelar</Btn>
            <Btn onClick={save}><Check size={14} />Salvar</Btn>
          </div>
        </Modal>
      )}
      {confirm && <Confirm msg="Excluir este grupo?" onOk={() => del(confirm)} onCancel={() => setConfirm(null)} />}
    </div>
  );
}
