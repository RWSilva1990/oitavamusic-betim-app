import { useState } from 'react';
import { Calendar, Plus, Edit2, Trash2, Check, Search, Eye, Share2, Youtube, X } from 'lucide-react';
import { C, ROLES } from '@/lib/theme';
import { fmtDate, genId, normalizeStr, shareToWhatsApp, todayISO } from '@/lib/db';
import { Avatar, Btn, Confirm, Field, Inp, Modal, PageTitle } from '../ui-kit';
import { AudioPlayerList } from '../AudioSection';
import { useData } from '@/lib/data';

const VOCAL_KEYS = ['tenor', 'soprano', 'contralto'];

function ArchivedSection({ archived, renderCard }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <div onClick={() => setOpen((o) => !o)} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none', marginBottom: open ? 10 : 0 }}>
        <div className="section-header" style={{ marginBottom: 0, flex: 1 }}>📦 Arquivadas ({archived.length})</div>
        <span style={{ fontSize: 11, color: C.textSecondary }}>{open ? '▲ ocultar' : '▼ mostrar'}</span>
      </div>
      {open && (
        <div style={{ display: 'grid', gap: 8 }}>
          {archived.map((sc) => (
            <div key={sc.id} style={{ opacity: 0.65 }}>{renderCard(sc)}</div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ScalesPage() {
  const { scales, setScales, members, groups, songs } = useData();
  const [modal, setModal] = useState(null);
  const [viewModal, setViewModal] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [form, setForm] = useState({ name: '', date: '', groupId: '', scaleMembers: [], scaleSongs: [] });
  const [mSearch, setMSearch] = useState('');
  const [sSearch, setSSearch] = useState('');

  const fresh = () => ({ name: '', date: '', groupId: '', scaleMembers: [], scaleSongs: [] });
  const openAdd = () => { setForm(fresh()); setMSearch(''); setSSearch(''); setModal('add'); };
  const openEdit = (sc) => {
    setForm({ ...sc, scaleMembers: (sc.scaleMembers || []).map((x) => ({ ...x })), scaleSongs: (sc.scaleSongs || []).map((x) => ({ ...x })) });
    setMSearch(''); setSSearch(''); setModal(sc);
  };

  const onGroupChange = (gid) => {
    const g = groups.find((x) => x.id === gid);
    setForm((f) => ({ ...f, groupId: gid, scaleMembers: (g?.memberIds || []).map((id) => ({ memberId: id, isSub: false, role: '' })) }));
  };

  const removeMember = (id) => setForm((f) => ({ ...f, scaleMembers: f.scaleMembers.filter((x) => x.memberId !== id) }));
  const addSubstitute = (id) => {
    if (form.scaleMembers.find((x) => x.memberId === id)) return;
    setForm((f) => ({ ...f, scaleMembers: [...f.scaleMembers, { memberId: id, isSub: true, role: '' }] }));
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

  const save = () => {
    if (!form.name.trim() || !form.date) return;
    if (modal === 'add') setScales((p) => [...p, { ...form, id: genId() }]);
    else setScales((p) => p.map((s) => (s.id === form.id ? { ...form } : s)));
    setModal(null);
  };
  const del = (id) => { setScales((p) => p.filter((s) => s.id !== id)); setConfirm(null); };

  const existingIds = form.scaleMembers.map((x) => x.memberId);
  const availSubs = members.filter((m) => !existingIds.includes(m.id) && normalizeStr(m.name).includes(normalizeStr(mSearch)));
  const availSongs = songs.filter((s) => s.name.toLowerCase().includes(sSearch.toLowerCase()) && !form.scaleSongs.find((x) => x.songId === s.id));

  const scaleMembersOf = (sc) => (sc.scaleMembers || []).map((sm) => ({ ...sm, member: members.find((m) => m.id === sm.memberId) })).filter((x) => x.member);
  const scaleSongsOf = (sc) => (sc.scaleSongs || []).map((ss) => ({ ...ss, song: songs.find((s) => s.id === ss.songId) })).filter((x) => x.song);

  const today = todayISO();
  const active = [...scales].filter((s) => s.date >= today).sort((a, b) => a.date.localeCompare(b.date));
  const archived = [...scales].filter((s) => s.date < today).sort((a, b) => b.date.localeCompare(a.date));

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
              {sm.map((x) => <span key={x.memberId} className={`tag${x.isSub ? ' sub' : ''}`}>{x.isSub ? '↔ ' : ''}{x.member.name}</span>)}
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
        <Btn onClick={openAdd}><Plus size={15} />Nova Escala</Btn>
      </PageTitle>

      {scales.length === 0 ? (
        <div className="empty-state"><Calendar size={38} style={{ marginBottom: 12, opacity: 0.25 }} /><p>Nenhuma escala criada</p></div>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {active.length > 0 ? (
            <div>
              <div className="section-header" style={{ marginBottom: 10 }}><Calendar size={13} />Agendadas ({active.length})</div>
              <div style={{ display: 'grid', gap: 8 }}>{active.map((sc) => <div key={sc.id}>{renderCard(sc)}</div>)}</div>
            </div>
          ) : (
            <div style={{ padding: '14px 16px', background: C.bgCard, borderRadius: 10, border: `1px solid ${C.border}`, fontSize: 13, color: C.textSecondary, textAlign: 'center' }}>
              Nenhuma escala agendada
            </div>
          )}
          {archived.length > 0 && <ArchivedSection archived={archived} renderCard={renderCard} />}
        </div>
      )}

      {viewModal && (
        <Modal title={viewModal.name} onClose={() => setViewModal(null)} wide>
          <div style={{ color: C.textSecondary, fontSize: 13, marginBottom: 18 }}>
            📅 {fmtDate(viewModal.date)} · {groups.find((g) => g.id === viewModal.groupId)?.name || 'Sem grupo'}
          </div>
          <Field label="Membros na Escala">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {scaleMembersOf(viewModal).map((x) => {
                const activeRoles = x.roles || (x.role ? [x.role] : []);
                const roleLabels = activeRoles.map((r) => ROLES.find((ro) => ro.key === r)).filter(Boolean);
                return (
                  <div key={x.memberId} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 12px', background: x.isSub ? 'rgba(79,128,225,0.1)' : C.accentGlow, borderRadius: 20, border: `1px solid ${x.isSub ? C.blue + '44' : C.accent + '44'}` }}>
                    <Avatar member={x.member} size={24} />
                    <div>
                      <span style={{ fontSize: 13, color: x.isSub ? C.blue : C.accent }}>{x.isSub ? '↔ ' : ''}{x.member.name}</span>
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
                <div key={sm.memberId} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 10px', marginBottom: 6, background: sm.isSub ? 'rgba(79,128,225,0.08)' : C.accentGlow, border: `1px solid ${sm.isSub ? C.blue + '44' : C.accent + '33'}`, borderRadius: 10 }}>
                  <Avatar member={m} size={28} style={{ flexShrink: 0, marginTop: 2 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: sm.isSub ? C.blue : C.accent, marginBottom: 5 }}>{sm.isSub ? '↔ ' : ''}{m.name}</div>
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
              <div style={{ fontSize: 12, color: C.textSecondary, marginBottom: 7 }}>Adicionar membro / substituto:</div>
              <div style={{ position: 'relative', marginBottom: 7 }}>
                <Search size={12} color={C.textSecondary} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)' }} />
                <input className="input-field" placeholder="Buscar..." value={mSearch} onChange={(e) => setMSearch(e.target.value)} style={{ paddingLeft: 26, fontSize: 12 }} />
              </div>
              <div style={{ maxHeight: 120, overflowY: 'auto', display: 'grid', gap: 3 }}>
                {availSubs.slice(0, 10).map((m) => (
                  <div key={m.id} className="song-item" onClick={() => addSubstitute(m.id)} style={{ padding: '6px 10px', fontSize: 13 }}>
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 11, color: C.textSecondary, fontWeight: 700, minWidth: 18 }}>{idx + 1}.</span>
                      <span style={{ fontWeight: 600, color: C.textPrimary, fontSize: 13 }}>{song?.name}</span>
                      {song?.bpm && <span style={{ fontSize: 10, color: C.accent, background: C.accentGlow, borderRadius: 4, padding: '1px 5px' }}>♩{song.bpm}</span>}
                      {song?.youtubeUrl && <a href={song.youtubeUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', color: '#E8463A' }}><Youtube size={13} /></a>}
                    </div>
                    <button onClick={() => removeSong(ss.songId)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.danger, display: 'flex', padding: 2 }}><X size={14} /></button>
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