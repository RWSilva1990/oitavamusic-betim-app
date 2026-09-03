import { useState } from 'react';
import Papa from 'papaparse';
import { Users, Plus, Edit2, Trash2, Check, Search, Upload, Download, Mail } from 'lucide-react';
import { C, ROLES } from '@/lib/theme';
import { genId, normalizeStr } from '@/lib/db';
import { Avatar, Btn, Confirm, Field, Inp, Modal, PageTitle } from '../ui-kit';
import { useData } from '@/lib/data';
import { useAuth } from '@/lib/auth';

export default function MembersPage() {
  const { members, setMembers } = useData();
  const auth = useAuth();
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [form, setForm] = useState({ name: '', birthdate: '', email: '', phone: '', photo: '', roles: [] });
  const [importModal, setImportModal] = useState(false);
  const [preview, setPreview] = useState([]);
  const [inviteState, setInviteState] = useState({});

  const openAdd = () => { setForm({ name: '', birthdate: '', email: '', phone: '', photo: '', roles: [] }); setModal('add'); };
  const openEdit = (m) => { setForm({ ...m, roles: [...(m.roles || [])] }); setModal(m); };

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX = 300;
        let { width, height } = img;
        if (width > height) { if (width > MAX) { height = Math.round((height * MAX) / width); width = MAX; } }
        else if (height > MAX) { width = Math.round((width * MAX) / height); height = MAX; }
        canvas.width = width; canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        setForm((f) => ({ ...f, photo: canvas.toDataURL('image/jpeg', 0.7) }));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const toggleRole = (key) =>
    setForm((f) => ({ ...f, roles: f.roles.includes(key) ? f.roles.filter((r) => r !== key) : [...f.roles, key] }));

  const save = () => {
    if (!form.name.trim() || !form.birthdate) return;
    if (modal === 'add') setMembers((p) => [...p, { ...form, id: genId() }]);
    else setMembers((p) => p.map((m) => (m.id === form.id ? { ...form } : m)));
    setModal(null);
  };
  const del = (id) => { setMembers((p) => p.filter((m) => m.id !== id)); setConfirm(null); };

  const invite = async (member) => {
    if (!member.email) { setInviteState((s) => ({ ...s, [member.id]: 'Cadastre o e-mail do membro primeiro.' })); return; }
    if (!auth.configured) { setInviteState((s) => ({ ...s, [member.id]: 'Configure o Firebase para enviar convites.' })); return; }
    setInviteState((s) => ({ ...s, [member.id]: 'Enviando...' }));
    try {
      await auth.sendInvite(member.email);
      setInviteState((s) => ({ ...s, [member.id]: `Convite enviado para ${member.email}` }));
    } catch (e) {
      setInviteState((s) => ({ ...s, [member.id]: e?.message || 'Falha ao enviar convite.' }));
    }
  };

  const exportCSV = () => {
    const rows = [...members]
      .sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'pt-BR', { sensitivity: 'base' }))
      .map((member) => ({
        nome: member.name || '',
        email: member.email || '',
        telefone: member.phone || '',
        'data de nascimento': member.birthdate || '',
        funcoes: (member.roles || [])
          .map((role) => ROLES.find((item) => item.key === role)?.label || role)
          .filter(Boolean)
          .join(', '),
      }));

    const csv = `\uFEFF${Papa.unparse(rows)}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `membros-oitava-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: ({ data }) => {
        const rows = data
          .map((row) => {
            const keys = Object.keys(row);
            const nk = keys.find((k) => /nome|name/i.test(k)) || keys[0];
            const ek = keys.find((k) => /email|e-mail/i.test(k));
            const pk = keys.find((k) => /tel|celular|phone/i.test(k));
            const bk = keys.find((k) => /nasc|data|birth|aniv/i.test(k));
            const rk = keys.find((k) => /fun[cç][oõ]es|cargo|role/i.test(k));
            const parsedRoles = [];
            if (rk && row[rk]) {
              const str = row[rk].toLowerCase();
              ROLES.forEach((r) => { if (str.includes(r.key) || str.includes(r.label.toLowerCase())) parsedRoles.push(r.key); });
            }
            const rawDate = bk ? row[bk]?.trim() || '' : '';
            let formattedDate = rawDate;
            if (rawDate.includes('/')) {
              const parts = rawDate.split('/');
              if (parts.length === 3) {
                const dia = parts[0].padStart(2, '0');
                const mes = parts[1].padStart(2, '0');
                const ano = parts[2].trim();
                const anoCompleto = ano.length === 2 ? (parseInt(ano, 10) > 30 ? '19' : '20') + ano : ano;
                formattedDate = `${anoCompleto}-${mes}-${dia}`;
              }
            }
            return {
              name: row[nk]?.trim() || '',
              email: ek ? row[ek]?.trim() || '' : '',
              phone: pk ? row[pk]?.trim() || '' : '',
              birthdate: formattedDate,
              roles: parsedRoles,
              photo: '',
            };
          })
          .filter((r) => r.name);
        setPreview(rows);
      },
    });
    e.target.value = '';
  };

  const doImport = () => {
    setMembers((prev) => {
      const updated = [...prev];
      preview.forEach((imported) => {
        const idx = updated.findIndex((m) => normalizeStr(m.name) === normalizeStr(imported.name));
        if (idx >= 0) {
          updated[idx] = {
            ...updated[idx],
            birthdate: imported.birthdate || updated[idx].birthdate,
            email: imported.email || updated[idx].email,
            phone: imported.phone || updated[idx].phone,
            roles: imported.roles.length > 0 ? imported.roles : updated[idx].roles,
          };
        } else {
          updated.push({ ...imported, id: genId() });
        }
      });
      return updated;
    });
    setImportModal(false);
    setPreview([]);
  };

  const filtered = members
    .filter((m) => normalizeStr(m.name).includes(normalizeStr(search)))
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' }));

  return (
    <div style={{ padding: 24, maxWidth: 860 }}>
      <PageTitle title="Membros" subtitle={`${members.length} membro${members.length !== 1 ? 's' : ''}`}>
        <Btn variant="secondary" onClick={exportCSV}><Download size={15} />Exportar CSV</Btn>
        <Btn variant="secondary" onClick={() => { setPreview([]); setImportModal(true); }}><Upload size={15} />Importar CSV</Btn>
        <Btn onClick={openAdd}><Plus size={15} />Novo Membro</Btn>
      </PageTitle>

      <div className="search-wrap">
        <Search size={15} color={C.textSecondary} />
        <input className="input-field" placeholder="Buscar membros..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state"><Users size={38} style={{ marginBottom: 12, opacity: 0.25 }} /><p>Nenhum membro encontrado</p></div>
      ) : (
        <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
          {filtered.map((m) => (
            <div key={m.id} className="card">
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <Avatar member={m} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, color: C.textPrimary, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</div>
                  {m.email && <div style={{ fontSize: 12, color: C.textSecondary, marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.email}</div>}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                    {(m.roles || []).map((r) => {
                      const ro = ROLES.find((x) => x.key === r);
                      return ro ? <span key={r} className="tag">{ro.emoji} {ro.label}</span> : null;
                    })}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                  <Btn variant="ghost" title="Convidar por e-mail" onClick={() => invite(m)}><Mail size={14} /></Btn>
                  <Btn variant="ghost" onClick={() => openEdit(m)}><Edit2 size={14} /></Btn>
                  <Btn variant="ghost" className="del" onClick={() => setConfirm(m.id)}><Trash2 size={14} /></Btn>
                </div>
              </div>
              {inviteState[m.id] && (
                <div style={{ marginTop: 10, fontSize: 12, color: C.accent, background: C.accentGlow, borderRadius: 8, padding: '6px 10px' }}>
                  {inviteState[m.id]}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {importModal && (
        <Modal title="Importar/Atualizar via CSV" onClose={() => { setImportModal(false); setPreview([]); }} wide>
          <div style={{ padding: 14, background: C.bgInput, borderRadius: 8, marginBottom: 16, fontSize: 13, color: C.textSecondary, lineHeight: 1.7 }}>
            <strong style={{ color: C.accent }}>Atualização em massa:</strong> se o nome da planilha já existir, os dados são atualizados sem duplicar o membro e sem quebrar as escalas.
          </div>
          <label style={{ display: 'block', padding: '24px 16px', border: `2px dashed ${C.border}`, borderRadius: 10, textAlign: 'center', cursor: 'pointer', color: C.textSecondary, marginBottom: 16 }}>
            <Upload size={26} style={{ display: 'block', margin: '0 auto 8px' }} />
            Clique para selecionar o arquivo CSV
            <input type="file" accept=".csv" onChange={handleCSV} style={{ display: 'none' }} />
          </label>
          {preview.length > 0 && (
            <>
              <p style={{ color: C.success, fontSize: 13, marginBottom: 10 }}>✓ {preview.length} membro(s) lido(s) na planilha</p>
              <div style={{ maxHeight: 200, overflowY: 'auto', display: 'grid', gap: 4, marginBottom: 16 }}>
                {preview.map((m, i) => {
                  const exists = members.some((e) => normalizeStr(e.name) === normalizeStr(m.name));
                  return (
                    <div key={i} style={{ padding: '7px 12px', background: C.bgHover, borderRadius: 6, display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span style={{ color: C.textPrimary }}>{m.name}</span>
                      <span style={{ color: exists ? C.accent : C.success, fontSize: 11, fontWeight: 700 }}>{exists ? '🔄 Será Atualizado' : '✨ Novo Membro'}</span>
                    </div>
                  );
                })}
              </div>
              <Btn onClick={doImport}><Check size={14} />Processar {preview.length} membro(s)</Btn>
            </>
          )}
        </Modal>
      )}

      {modal && (
        <Modal title={modal === 'add' ? 'Novo Membro' : 'Editar Membro'} onClose={() => setModal(null)}>
          <Inp label="Nome *" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Nome completo" />
          <div className="grid-2">
            <Inp label="Data de Nascimento *" type="date" value={form.birthdate} onChange={(e) => setForm((f) => ({ ...f, birthdate: e.target.value }))} />
            <Inp label="Telefone" type="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="(31) 99999-9999" />
          </div>
          <Inp label="E-mail (acesso do membro)" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="email@exemplo.com" />

          <Field label="Foto (compactada automaticamente)">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {form.photo && <img src={form.photo} alt="" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${C.accent}` }} />}
              <label style={{ cursor: 'pointer', padding: '8px 14px', border: `1px dashed ${C.border}`, borderRadius: 8, color: C.textSecondary, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Upload size={14} />Selecionar foto
                <input type="file" accept="image/*" onChange={handlePhoto} style={{ display: 'none' }} />
              </label>
              {form.photo && <Btn variant="ghost" style={{ padding: '4px 8px', fontSize: 12 }} onClick={() => setForm((f) => ({ ...f, photo: '' }))}>Remover</Btn>}
            </div>
          </Field>

          <Field label="Funções">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
              {ROLES.map((r) => (
                <div key={r.key} className={`role-chip${form.roles.includes(r.key) ? ' selected' : ''}`} onClick={() => toggleRole(r.key)}>
                  <span>{r.emoji}</span>{r.label}
                  {form.roles.includes(r.key) && <Check size={13} style={{ marginLeft: 'auto' }} />}
                </div>
              ))}
            </div>
          </Field>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
            <Btn variant="secondary" onClick={() => setModal(null)}>Cancelar</Btn>
            <Btn onClick={save}><Check size={14} />Salvar</Btn>
          </div>
        </Modal>
      )}
      {confirm && <Confirm msg="Excluir este membro permanentemente?" onOk={() => del(confirm)} onCancel={() => setConfirm(null)} />}
    </div>
  );
}
