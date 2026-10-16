import { useEffect, useState } from 'react';
import { Calendar, Plus, Edit2, Trash2, Check, Search, Eye, Share2, Youtube, X, ChevronUp, ChevronDown, Music2, Filter } from 'lucide-react';
import { C, ROLES } from '@/lib/theme';
import { fmtDate, genId, shareToWhatsApp, todayISO } from '@/lib/db';
import { Avatar, Btn, Confirm, Field, Inp, Modal, PageTitle } from '../ui-kit';
import { AudioPlayerList } from '../AudioSection';
import { useData } from '@/lib/data';
import { useNavigate } from '@tanstack/react-router';
import { beginScaleSongRegistration, takeScaleDraft } from '@/lib/scale-draft';

const VOCAL_KEYS = ['tenor', 'soprano', 'contralto'];
const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function formatMonthKey(value) {
  const [year, month] = String(value || '').split('-');
  const monthIndex = Number(month) - 1;
  if (!year || monthIndex < 0 || monthIndex > 11) return value;
  return `${MONTH_NAMES[monthIndex]}/${year}`;
}

function normalizeSearchText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .trim();
}

function ArchivedSection({ archived, renderCard }) {
  return (
    <details className="previous-scales-details">
      <summary className="section-header previous-scales-summary">
        <span>📦 Anteriores ({archived.length})</span>
        <span className="previous-scales-toggle" aria-hidden="true" />
      </summary>
      <div className="previous-scales-content">
        {archived.map((sc) => (
          <div key={sc.id} style={{ opacity: 0.65 }}>{renderCard(sc)}</div>
        ))}
      </div>
    </details>
  );
}

export default function ScalesPage() {
  const { scales, setScales, members, groups, songs } = useData();
  const navigate = useNavigate();
  const [modal, setModal] = useState(null);
  const [viewModal, setViewModal] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [form, setForm] = useState({ name: '', date: '', groupId: '', observations: '', scaleMembers: [], scaleSongs: [] });
  const [mSearch, setMSearch] = useState('');
  const [sSearch, setSSearch] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterGroup, setFilterGroup] = useState('');
  const [filterMember, setFilterMember] = useState('');
  const [filterModal, setFilterModal] = useState(false);
  const [draftFilterMonth, setDraftFilterMonth] = useState('');
  const [draftFilterGroup, setDraftFilterGroup] = useState('');
  const [draftFilterMember, setDraftFilterMember] = useState('');
  const [groupFilterSearch, setGroupFilterSearch] = useState('');
  const [memberFilterSearch, setMemberFilterSearch] = useState('');

  const fresh = () => ({ name: '', date: '', groupId: '', observations: '', scaleMembers: [], scaleSongs: [] });
  const openAdd = () => { setForm(fresh()); setMSearch(''); setSSearch(''); setModal('add'); };
  const openEdit = (sc) => {
    setForm({
      ...fresh(),
      ...sc,
      observations: sc.observations || '',
      scaleMembers: (sc.scaleMembers || []).map((x) => ({ ...x, isSub: false })),
      scaleSongs: (sc.scaleSongs || []).map((x) => ({ ...x })),
    });
    setMSearch(''); setSSearch(''); setModal(sc);
  };

  const onGroupChange = (gid) => {
    const g = groups.find((x) => x.id === gid);
    setForm((f) => ({ ...f, groupId: gid, scaleMembers: (g?.memberIds || []).map((id) => ({ memberId: id, isSub: false, role: '' })) }));
  };

  const removeMember = (id) => setForm((f) => ({ ...f, scaleMembers: f.scaleMembers.filter((x) => x.memberId !== id) }));
  const addMember = (id) => {
    if (form.scaleMembers.find((x) => x.memberId === id)) return;
    setForm((f) => ({ ...f, scaleMembers: [...f.scaleMembers, { memberId: id, isSub: false, role: '' }] }));
    setMSearch('');
  };
  const updateMemberRole = (memberId, role) =>
    setForm((f) => ({
      ...f,
      scaleMembers: f.scaleMembers.map((x) => {
        if (x.memberId !== memberId) return x;
        const current = x.roles || (x.role ? [x.role] : []);
        const updated = current.includes(role) ? current.filter((r) => r !== role) : [...current, role];
        return { ...x, roles: updated, role: updated[0] || '' };
      }),
    }));
  const addSong = (id) => {
    if (form.scaleSongs.find((x) => x.songId === id)) return;
    setForm((f) => ({ ...f, scaleSongs: [...f.scaleSongs, { songId: id, key: '', notes: '', soloMemberId: '' }] }));
    setSSearch('');
  };
  const removeSong = (id) => setForm((f) => ({ ...f, scaleSongs: f.scaleSongs.filter((x) => x.songId !== id) }));
  const updateSong = (id, field, val) => setForm((f) => ({ ...f, scaleSongs: f.scaleSongs.map((x) => (x.songId === id ? { ...x, [field]: val } : x)) }));
  const moveSong = (index, direction) => setForm((f) => {
    const target = index + direction;
    if (target < 0 || target >= f.scaleSongs.length) return f;
    const scaleSongs = [...f.scaleSongs];
    [scaleSongs[index], scaleSongs[target]] = [scaleSongs[target], scaleSongs[index]];
    return { ...f, scaleSongs };
  });

  const save = () => {
    if (!form.name.trim() || !form.date) return;
    const normalizedForm = {
      ...form,
      observations: String(form.observations || '').trim(),
      scaleMembers: (form.scaleMembers || []).map((member) => ({ ...member, isSub: false })),
    };
    if (modal === 'add') setScales((p) => [...p, { ...normalizedForm, id: genId() }]);
    else setScales((p) => p.map((scale) => (scale.id === form.id ? { ...normalizedForm } : scale)));
    setModal(null);
  };
  const del = (id) => { setScales((p) => p.filter((s) => s.id !== id)); setConfirm(null); };

  const openSongRegistration = () => {
    beginScaleSongRegistration({
      form: {
        ...form,
        observations: form.observations || '',
        scaleMembers: (form.scaleMembers || []).map((member) => ({ ...member, isSub: false })),
      },
      mode: modal === 'add' ? 'add' : 'edit',
      editingId: modal !== 'add' ? modal?.id || form.id || '' : '',
      memberSearch: mSearch,
      songSearch: sSearch,
      suggestedSongName: sSearch.trim(),
    });
    setModal(null);
    navigate({ to: '/repertorio' });
  };

  useEffect(() => {
    const restored = takeScaleDraft();
    if (!restored?.draft?.form) return;

    const draftForm = restored.draft.form;
    const restoredSongs = [...(draftForm.scaleSongs || [])];
    if (restored.newSongId && !restoredSongs.some((item) => item.songId === restored.newSongId)) {
      restoredSongs.push({ songId: restored.newSongId, key: '', notes: '', soloMemberId: '' });
    }

    setForm({
      ...fresh(),
      ...draftForm,
      observations: draftForm.observations || '',
      scaleMembers: (draftForm.scaleMembers || []).map((member) => ({ ...member, isSub: false })),
      scaleSongs: restoredSongs,
    });
    setMSearch(restored.draft.memberSearch || '');
    setSSearch('');
    if (restored.draft.mode === 'add') {
      setModal('add');
    } else {
      const editingScale = scales.find((scale) => scale.id === restored.draft.editingId);
      setModal(editingScale || { id: restored.draft.editingId || draftForm.id });
    }
  }, [scales]);

  const existingIds = form.scaleMembers.map((x) => x.memberId);
  const normalizedMemberSearch = normalizeSearchText(mSearch);
  const availSubs = members.filter((m) => !existingIds.includes(m.id) && normalizeSearchText(m.name).includes(normalizedMemberSearch));
  const availSongs = songs.filter((s) => s.name.toLowerCase().includes(sSearch.toLowerCase()) && !form.scaleSongs.find((x) => x.songId === s.id));

  const scaleMembersOf = (sc) => (sc.scaleMembers || []).map((sm) => ({ ...sm, member: members.find((m) => m.id === sm.memberId) })).filter((x) => x.member);
  const scaleSongsOf = (sc) => (sc.scaleSongs || []).map((ss) => ({ ...ss, song: songs.find((s) => s.id === ss.songId) })).filter((x) => x.song);

  const filtersActive = Boolean(filterMonth || filterGroup || filterMember);
  const selectedFilterGroup = groups.find((group) => group.id === filterGroup);
  const selectedFilterMember = members.find((member) => member.id === filterMember);
  const selectedDraftGroup = groups.find((group) => group.id === draftFilterGroup);
  const selectedDraftMember = members.find((member) => member.id === draftFilterMember);

  const normalizedGroupFilterSearch = normalizeSearchText(groupFilterSearch);
  const normalizedParticipantFilterSearch = normalizeSearchText(memberFilterSearch);
  const groupFilterResults = groupFilterSearch.trim() && (
    !selectedDraftGroup || normalizeSearchText(selectedDraftGroup.name) !== normalizedGroupFilterSearch
  )
    ? groups
      .filter((group) => normalizeSearchText(group.name).includes(normalizedGroupFilterSearch))
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
      .slice(0, 8)
    : [];
  const memberFilterResults = memberFilterSearch.trim() && (
    !selectedDraftMember || normalizeSearchText(selectedDraftMember.name) !== normalizedParticipantFilterSearch
  )
    ? members
      .filter((member) => normalizeSearchText(member.name).includes(normalizedParticipantFilterSearch))
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
      .slice(0, 8)
    : [];

  const filteredScales = scales.filter((scale) => {
    if (filterMonth && !String(scale.date || '').startsWith(filterMonth)) return false;
    if (filterGroup && scale.groupId !== filterGroup) return false;
    if (filterMember && !(scale.scaleMembers || []).some((member) => member.memberId === filterMember)) return false;
    return true;
  });

  const openFilters = () => {
    setDraftFilterMonth(filterMonth);
    setDraftFilterGroup(filterGroup);
    setDraftFilterMember(filterMember);
    setGroupFilterSearch(selectedFilterGroup?.name || '');
    setMemberFilterSearch(selectedFilterMember?.name || '');
    setFilterModal(true);
  };

  const clearFilterDraft = () => {
    setDraftFilterMonth('');
    setDraftFilterGroup('');
    setDraftFilterMember('');
    setGroupFilterSearch('');
    setMemberFilterSearch('');
  };

  const applyFilters = () => {
    setFilterMonth(draftFilterMonth);
    setFilterGroup(draftFilterGroup);
    setFilterMember(draftFilterMember);
    setFilterModal(false);
  };

  const clearFilters = () => {
    setFilterMonth('');
    setFilterGroup('');
    setFilterMember('');
    clearFilterDraft();
  };

  const today = todayISO();
  const active = [...filteredScales].filter((s) => s.date >= today).sort((a, b) => a.date.localeCompare(b.date));
  const archived = [...filteredScales].filter((s) => s.date < today).sort((a, b) => b.date.localeCompare(a.date));

  const renderCard = (sc) => {
    const g = groups.find((x) => x.id === sc.groupId);
    const sm = scaleMembersOf(sc);
    const ss = scaleSongsOf(sc);
    return (
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontWeight: 700, color: C.textPrimary, fontSize: 15 }}>{sc.name}</span>
              {g && <span className="tag">{g.name}</span>}
            </div>
            <div style={{ color: C.textSecondary, fontSize: 12, marginBottom: 10 }}>📅 {fmtDate(sc.date)}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
              {sm.map((x) => <span key={x.memberId} className="tag">{x.member.name}</span>)}
            </div>
            <div style={{ fontSize: 12, color: C.textSecondary }}>{ss.length} música{ss.length !== 1 ? 's' : ''}</div>
          </div>
          <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
            <Btn variant="ghost" onClick={() => setViewModal(sc)}><Eye size={14} /></Btn>
            <Btn variant="ghost" onClick={() => openEdit(sc)}><Edit2 size={14} /></Btn>
            <Btn variant="ghost" style={{ color: '#1FAD4A' }} onClick={() => shareToWhatsApp(sc, members, groups, songs)}><Share2 size={14} /></Btn>
            <Btn variant="ghost" className="del" onClick={() => setConfirm(sc.id)}><Trash2 size={14} /></Btn>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: 24, maxWidth: 860 }}>
      <PageTitle title="Escalas" subtitle={`${scales.length} escala${scales.length !== 1 ? 's' : ''}`}>
        <Btn variant="secondary" onClick={openFilters}>
          <Filter size={14} />Filtrar escalas{filtersActive ? ' •' : ''}
        </Btn>
        <Btn onClick={openAdd}><Plus size={15} />Nova Escala</Btn>
      </PageTitle>

      {scales.length === 0 ? (
        <div className="empty-state"><Calendar size={38} style={{ marginBottom: 12, opacity: 0.25 }} /><p>Nenhuma escala criada</p></div>
      ) : (
        <>
          {filtersActive && (
            <div
              style={{
                marginBottom: 16,
                padding: '9px 12px',
                background: C.bgCard,
                border: `1px solid ${C.border}`,
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                flexWrap: 'wrap',
              }}
            >
              <span style={{ fontSize: 11, fontWeight: 700, color: C.textSecondary, marginRight: 2 }}>Filtros:</span>
              {filterMonth && (
                <span className="tag" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  {formatMonthKey(filterMonth)}
                  <button
                    type="button"
                    aria-label="Remover filtro de mês"
                    onClick={() => setFilterMonth('')}
                    style={{ border: 0, background: 'transparent', color: 'inherit', padding: 0, display: 'flex', cursor: 'pointer' }}
                  >
                    <X size={11} />
                  </button>
                </span>
              )}
              {selectedFilterGroup && (
                <span className="tag" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  {selectedFilterGroup.name}
                  <button
                    type="button"
                    aria-label="Remover filtro de equipe"
                    onClick={() => setFilterGroup('')}
                    style={{ border: 0, background: 'transparent', color: 'inherit', padding: 0, display: 'flex', cursor: 'pointer' }}
                  >
                    <X size={11} />
                  </button>
                </span>
              )}
              {selectedFilterMember && (
                <span className="tag" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  {selectedFilterMember.name}
                  <button
                    type="button"
                    aria-label="Remover filtro de participante"
                    onClick={() => setFilterMember('')}
                    style={{ border: 0, background: 'transparent', color: 'inherit', padding: 0, display: 'flex', cursor: 'pointer' }}
                  >
                    <X size={11} />
                  </button>
                </span>
              )}
              <button
                type="button"
                onClick={clearFilters}
                style={{ border: 0, background: 'transparent', color: C.accent, fontSize: 11, fontWeight: 700, cursor: 'pointer', padding: '3px 4px' }}
              >
                Limpar todos
              </button>
              <span style={{ marginLeft: 'auto', fontSize: 11, color: C.textSecondary, fontWeight: 600 }}>
                {filteredScales.length} escala{filteredScales.length !== 1 ? 's' : ''} encontrada{filteredScales.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}

          {filteredScales.length === 0 ? (
            <div className="empty-state" style={{ minHeight: 180 }}>
              <Search size={34} style={{ marginBottom: 10, opacity: 0.25 }} />
              <p style={{ marginBottom: 4 }}>Nenhuma escala encontrada</p>
              <span style={{ color: C.textSecondary, fontSize: 12 }}>Altere ou limpe os filtros selecionados.</span>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 16 }}>
              {active.length > 0 ? (
                <div>
                  <div className="section-header" style={{ marginBottom: 10 }}><Calendar size={13} />Agendadas ({active.length})</div>
                  <div style={{ display: 'grid', gap: 8 }}>{active.map((sc) => <div key={sc.id}>{renderCard(sc)}</div>)}</div>
                </div>
              ) : (
                <div style={{ padding: '14px 16px', background: C.bgCard, borderRadius: 10, border: `1px solid ${C.border}`, fontSize: 13, color: C.textSecondary, textAlign: 'center' }}>
                  Nenhuma escala agendada com os filtros selecionados
                </div>
              )}
              {archived.length > 0 && <ArchivedSection archived={archived} renderCard={renderCard} />}
            </div>
          )}
        </>
      )}

      {filterModal && (
        <Modal title="Filtrar escalas" onClose={() => setFilterModal(false)}>
          <Field label="Mês / ano">
            <input
              className="input-field"
              type="month"
              value={draftFilterMonth}
              onChange={(e) => setDraftFilterMonth(e.target.value)}
            />
          </Field>

          <Field label="Equipe">
            <div style={{ position: 'relative' }}>
              <Search size={13} color={C.textSecondary} style={{ position: 'absolute', left: 10, top: 13, pointerEvents: 'none' }} />
              <input
                className="input-field"
                placeholder="Digite o nome da equipe..."
                value={groupFilterSearch}
                onChange={(e) => {
                  setGroupFilterSearch(e.target.value);
                  setDraftFilterGroup('');
                }}
                style={{ paddingLeft: 30 }}
              />
            </div>
            {groupFilterResults.length > 0 && (
              <div style={{ marginTop: 5, border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden', background: C.bgInput }}>
                {groupFilterResults.map((group) => (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => {
                      setDraftFilterGroup(group.id);
                      setGroupFilterSearch(group.name);
                    }}
                    style={{ width: '100%', border: 0, borderBottom: `1px solid ${C.border}`, background: 'transparent', color: C.textPrimary, textAlign: 'left', padding: '9px 12px', cursor: 'pointer', fontSize: 13 }}
                  >
                    {group.name}
                  </button>
                ))}
              </div>
            )}
            {groupFilterSearch.trim() && !draftFilterGroup && groupFilterResults.length === 0 && (
              <div style={{ marginTop: 5, fontSize: 11, color: C.textSecondary }}>Nenhuma equipe encontrada</div>
            )}
          </Field>

          <Field label="Participante">
            <div style={{ position: 'relative' }}>
              <Search size={13} color={C.textSecondary} style={{ position: 'absolute', left: 10, top: 13, pointerEvents: 'none' }} />
              <input
                className="input-field"
                placeholder="Digite o nome do participante..."
                value={memberFilterSearch}
                onChange={(e) => {
                  setMemberFilterSearch(e.target.value);
                  setDraftFilterMember('');
                }}
                style={{ paddingLeft: 30 }}
              />
            </div>
            {memberFilterResults.length > 0 && (
              <div style={{ marginTop: 5, border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden', background: C.bgInput }}>
                {memberFilterResults.map((member) => (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => {
                      setDraftFilterMember(member.id);
                      setMemberFilterSearch(member.name);
                    }}
                    style={{ width: '100%', border: 0, borderBottom: `1px solid ${C.border}`, background: 'transparent', color: C.textPrimary, textAlign: 'left', padding: '9px 12px', cursor: 'pointer', fontSize: 13 }}
                  >
                    {member.name}
                  </button>
                ))}
              </div>
            )}
            {memberFilterSearch.trim() && !draftFilterMember && memberFilterResults.length === 0 && (
              <div style={{ marginTop: 5, fontSize: 11, color: C.textSecondary }}>Nenhum participante encontrado</div>
            )}
          </Field>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
            <Btn variant="secondary" onClick={clearFilterDraft}>Limpar</Btn>
            <Btn onClick={applyFilters}><Filter size={14} />Aplicar filtros</Btn>
          </div>
        </Modal>
      )}

      {viewModal && (
        <Modal title={viewModal.name} onClose={() => setViewModal(null)} wide>
          <div style={{ color: C.textSecondary, fontSize: 13, marginBottom: 18 }}>
            📅 {fmtDate(viewModal.date)} · {groups.find((g) => g.id === viewModal.groupId)?.name || 'Sem grupo'}
          </div>
          {viewModal.observations && (
            <Field label="Observações">
              <div style={{ padding: '10px 12px', background: C.bgInput, border: `1px solid ${C.border}`, borderRadius: 9, color: C.textPrimary, fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                {viewModal.observations}
              </div>
            </Field>
          )}
          <Field label="Membros na Escala">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {scaleMembersOf(viewModal).map((x) => {
                const activeRoles = x.roles || (x.role ? [x.role] : []);
                const roleLabels = activeRoles.map((r) => ROLES.find((ro) => ro.key === r)).filter(Boolean);
                return (
                  <div key={x.memberId} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 12px', background: C.accentGlow, borderRadius: 20, border: `1px solid ${C.accent + '44'}` }}>
                    <Avatar member={x.member} size={24} />
                    <div>
                      <span style={{ fontSize: 13, color: C.accent }}>{x.member.name}</span>
                      {roleLabels.length > 0 && (
                        <span style={{ fontSize: 11, color: C.textSecondary, marginLeft: 4 }}>· {roleLabels.map((r) => `${r.emoji} ${r.label}`).join(', ')}</span>
                      )}
                    </div>
                  </div>
                );
              })}
              {scaleMembersOf(viewModal).length === 0 && <span style={{ color: C.textSecondary, fontSize: 13 }}>Nenhum membro</span>}
            </div>
          </Field>
          <Field label="Músicas">
            <div style={{ display: 'grid', gap: 8 }}>
              {scaleSongsOf(viewModal).map((x) => (
                <div key={x.songId} style={{ padding: '10px 14px', background: C.bgHover, borderRadius: 8, display: 'grid', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                    <span style={{ fontWeight: 600, color: C.textPrimary }}>{x.song.name}</span>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                      {x.key && <span className="tag green">Tom: {x.key}</span>}
                      {x.song.bpm && <span className="tag" style={{ fontSize: 10 }}>♩ {x.song.bpm} BPM</span>}
                      {x.soloMemberId && (() => {
                        const soloist = members.find((m) => m.id === x.soloMemberId);
                        if (!soloist) return null;
                        const vocalRole = (soloist.roles || []).find((r) => VOCAL_KEYS.includes(r));
                        const roleLabel = vocalRole ? ROLES.find((ro) => ro.key === vocalRole)?.label : '';
                        return (
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#7c4dff', background: 'rgba(124,77,255,0.12)', border: '1px solid rgba(124,77,255,0.35)', borderRadius: 6, padding: '2px 8px' }}>
                            🎙️ Solo: {soloist.name}{roleLabel ? ` · ${roleLabel}` : ''}
                          </span>
                        );
                      })()}
                      {x.notes && <span style={{ fontSize: 12, color: C.textSecondary }}>{x.notes}</span>}
                    </div>
                  </div>
                  <AudioPlayerList audios={x.song.audios} compact />
                </div>
              ))}
              {scaleSongsOf(viewModal).length === 0 && <span style={{ color: C.textSecondary, fontSize: 13 }}>Nenhuma música</span>}
            </div>
          </Field>
          {scaleSongsOf(viewModal).some((x) => x.song.youtubeUrl) && (
            <div style={{ marginTop: 4, display: 'grid', gap: 5 }}>
              <div className="field-label" style={{ marginBottom: 2 }}>Links do YouTube</div>
              {scaleSongsOf(viewModal).filter((x) => x.song.youtubeUrl).map((x) => (
                <a key={x.songId} href={x.song.youtubeUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', background: C.bgHover, borderRadius: 8, textDecoration: 'none', color: C.textPrimary, fontSize: 13 }}>
                  <Youtube size={14} color="#E8463A" />
                  <span style={{ flex: 1 }}>{x.song.name}</span>
                  <span style={{ fontSize: 11, color: C.textSecondary }}>↗</span>
                </a>
              ))}
            </div>
          )}
          <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
            <Btn className="btn-whatsapp" onClick={() => shareToWhatsApp(viewModal, members, groups, songs)}>
              <Share2 size={15} />Enviar para WhatsApp
            </Btn>
          </div>
        </Modal>
      )}

      {modal && (
        <Modal title={modal === 'add' ? 'Nova Escala' : 'Editar Escala'} onClose={() => setModal(null)} wide>
          <div className="grid-2">
            <Inp label="Nome da Escala *" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Ex: Culto Domingo Manhã" />
            <Inp label="Data *" type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
          </div>

          <Field label="Grupo">
            <select className="input-field" value={form.groupId} onChange={(e) => onGroupChange(e.target.value)}>
              <option value="">Selecionar grupo...</option>
              {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </Field>

          <Field label="Observações">
            <textarea
              className="input-field"
              rows={4}
              value={form.observations || ''}
              onChange={(e) => setForm((current) => ({ ...current, observations: e.target.value }))}
              placeholder="Ex: Chegar às 18h para passagem de som."
              style={{ resize: 'vertical', minHeight: 96 }}
            />
          </Field>

          <Field label={`Membros na Escala (${form.scaleMembers.length})`}>
            {form.scaleMembers.length === 0 && (
              <div style={{ marginBottom: 10, padding: '10px 14px', background: C.bgInput, borderRadius: 8, fontSize: 13, color: C.textSecondary }}>
                Selecione um grupo ou adicione membros manualmente
              </div>
            )}
            {form.scaleMembers.map((sm) => {
              const m = members.find((x) => x.id === sm.memberId);
              if (!m) return null;
              const memberRoles = (m.roles || []).map((r) => ROLES.find((x) => x.key === r)).filter(Boolean);
              const activeRoles = sm.roles || (sm.role ? [sm.role] : []);
              return (
                <div key={sm.memberId} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 10px', marginBottom: 6, background: C.accentGlow, border: `1px solid ${C.accent + '33'}`, borderRadius: 10 }}>
                  <Avatar member={m} size={28} style={{ flexShrink: 0, marginTop: 2 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.accent, marginBottom: 5 }}>{m.name}</div>
                    {memberRoles.length > 0 ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {memberRoles.map((r) => {
                          const on = activeRoles.includes(r.key);
                          return (
                            <div key={r.key} onClick={() => updateMemberRole(sm.memberId, r.key)}
                              style={{ padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: 'pointer', userSelect: 'none', display: 'flex', alignItems: 'center', gap: 4, background: on ? C.accent + '22' : 'transparent', color: on ? C.accent : C.textSecondary, border: `1px solid ${on ? C.accent + '88' : C.border}` }}>
                              {r.emoji} {r.label}{on && <Check size={10} />}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <span style={{ fontSize: 11, color: C.textSecondary }}>Sem funções cadastradas</span>
                    )}
                  </div>
                  <button onClick={() => removeMember(sm.memberId)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textSecondary, display: 'flex', padding: 4, flexShrink: 0 }}><X size={13} /></button>
                </div>
              );
            })}
            <div style={{ border: `1px dashed ${C.border}`, borderRadius: 8, padding: 10 }}>
              <div style={{ fontSize: 12, color: C.textSecondary, marginBottom: 7 }}>Adicionar membro:</div>
              <div style={{ position: 'relative', marginBottom: 7 }}>
                <Search size={12} color={C.textSecondary} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)' }} />
                <input className="input-field" placeholder="Buscar..." value={mSearch} onChange={(e) => setMSearch(e.target.value)} style={{ paddingLeft: 26, fontSize: 12 }} />
              </div>
              <div style={{ maxHeight: 120, overflowY: 'auto', display: 'grid', gap: 3 }}>
                {availSubs.slice(0, 10).map((m) => (
                  <div key={m.id} className="song-item" onClick={() => addMember(m.id)} style={{ padding: '6px 10px', fontSize: 13 }}>
                    <Plus size={12} color={C.accent} />{m.name}
                    <span style={{ marginLeft: 'auto', fontSize: 11, color: C.textSecondary }}>
                      {(m.roles || []).map((r) => ROLES.find((x) => x.key === r)?.emoji).filter(Boolean).join(' ')}
                    </span>
                  </div>
                ))}
                {availSubs.length === 0 && mSearch && <div style={{ fontSize: 12, color: C.textSecondary, textAlign: 'center', padding: 10 }}>Nenhum resultado</div>}
              </div>
            </div>
          </Field>

          <Field label={`Músicas (${form.scaleSongs.length})`}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
              <Btn type="button" variant="secondary" onClick={openSongRegistration}>
                <Music2 size={14} />Cadastrar nova música
              </Btn>
            </div>
            <div style={{ position: 'relative', marginBottom: 8 }}>
              <Search size={13} color={C.textSecondary} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input className="input-field" placeholder="Buscar música para adicionar..." value={sSearch} onChange={(e) => setSSearch(e.target.value)} style={{ paddingLeft: 30, fontSize: 13 }} />
            </div>
            {sSearch.trim() && (
              <div style={{ background: C.bgInput, border: `1px solid ${C.border}`, borderRadius: 8, marginBottom: 10, overflow: 'hidden' }}>
                {availSongs.slice(0, 8).length === 0 ? (
                  <div style={{ padding: '10px 14px', fontSize: 13, color: C.textSecondary }}>Nenhuma música encontrada</div>
                ) : (
                  availSongs.slice(0, 8).map((s) => (
                    <div key={s.id} className="song-item" onClick={() => { addSong(s.id); setSSearch(''); }} style={{ borderBottom: `1px solid ${C.border}`, borderRadius: 0, padding: '9px 14px' }}>
                      <Plus size={13} color={C.accent} />
                      <span style={{ flex: 1 }}>{s.name}</span>
                      {s.bpm && <span style={{ fontSize: 11, color: C.accent, marginRight: 4 }}>♩{s.bpm}</span>}
                      {(s.audios || []).length > 0 && <span style={{ fontSize: 11, color: C.success, marginRight: 4 }}>🎧</span>}
                      {s.youtubeUrl && <Youtube size={12} color="#E8463A" />}
                    </div>
                  ))
                )}
              </div>
            )}
            {form.scaleSongs.length > 1 && (
              <div style={{ marginBottom: 8, fontSize: 11, color: C.textSecondary }}>
                Use as setas para ajustar a ordem das músicas antes de salvar a escala.
              </div>
            )}
            {form.scaleSongs.length === 0 && !sSearch && (
              <div style={{ padding: '12px 14px', background: C.bgInput, borderRadius: 8, fontSize: 13, color: C.textSecondary, textAlign: 'center' }}>
                Use a busca acima para adicionar músicas
              </div>
            )}
            {form.scaleSongs.map((ss, idx) => {
              const song = songs.find((s) => s.id === ss.songId);
              const vocalists = form.scaleMembers
                .map((sm) => {
                  const m = members.find((x) => x.id === sm.memberId);
                  if (!m) return null;
                  const vocalRole = (m.roles || []).find((r) => VOCAL_KEYS.includes(r));
                  if (!vocalRole) return null;
                  return { member: m, roleLabel: ROLES.find((r) => r.key === vocalRole)?.label || '' };
                })
                .filter(Boolean);
              return (
                <div key={ss.songId} className="scale-song-row" style={{ marginBottom: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                      <span style={{ fontSize: 11, color: C.textSecondary, fontWeight: 700, minWidth: 18 }}>{idx + 1}.</span>
                      <span style={{ fontWeight: 600, color: C.textPrimary, fontSize: 13 }}>{song?.name}</span>
                      {song?.bpm && <span style={{ fontSize: 10, color: C.accent, background: C.accentGlow, borderRadius: 4, padding: '1px 5px' }}>♩{song.bpm}</span>}
                      {song?.youtubeUrl && <a href={song.youtubeUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', color: '#E8463A' }}><Youtube size={13} /></a>}
                    </div>
                    <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                      <button
                        type="button"
                        onClick={() => moveSong(idx, -1)}
                        disabled={idx === 0}
                        aria-label={`Mover ${song?.name || 'música'} para cima`}
                        title="Mover para cima"
                        style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${C.border}`, background: C.bgHover, color: C.textSecondary, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: idx === 0 ? 'default' : 'pointer', opacity: idx === 0 ? 0.3 : 1 }}
                      >
                        <ChevronUp size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveSong(idx, 1)}
                        disabled={idx === form.scaleSongs.length - 1}
                        aria-label={`Mover ${song?.name || 'música'} para baixo`}
                        title="Mover para baixo"
                        style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${C.border}`, background: C.bgHover, color: C.textSecondary, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: idx === form.scaleSongs.length - 1 ? 'default' : 'pointer', opacity: idx === form.scaleSongs.length - 1 ? 0.3 : 1 }}
                      >
                        <ChevronDown size={15} />
                      </button>
                      <button type="button" onClick={() => removeSong(ss.songId)} aria-label={`Remover ${song?.name || 'música'}`} title="Remover música" style={{ width: 28, height: 28, borderRadius: 7, border: 'none', background: 'transparent', cursor: 'pointer', color: C.danger, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={14} /></button>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 8 }}>
                    <input className="input-field" placeholder="Tom (ex: Ré)" value={ss.key} onChange={(e) => updateSong(ss.songId, 'key', e.target.value)} style={{ fontSize: 12 }} />
                    <input className="input-field" placeholder="Observações..." value={ss.notes} onChange={(e) => updateSong(ss.songId, 'notes', e.target.value)} style={{ fontSize: 12 }} />
                  </div>
                  {vocalists.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      <select className="input-field" value={ss.soloMemberId || ''} onChange={(e) => updateSong(ss.songId, 'soloMemberId', e.target.value)} style={{ fontSize: 12 }}>
                        <option value="">🎙️ Sem solista...</option>
                        {vocalists.map(({ member: m, roleLabel }) => (
                          <option key={m.id} value={m.id}>🎙️ {m.name} — {roleLabel}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              );
            })}
          </Field>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Btn variant="secondary" onClick={() => setModal(null)}>Cancelar</Btn>
            <Btn onClick={save}><Check size={14} />Salvar Escala</Btn>
          </div>
        </Modal>
      )}
      {confirm && <Confirm msg="Excluir esta escala?" onOk={() => del(confirm)} onCancel={() => setConfirm(null)} />}
    </div>
  );
}