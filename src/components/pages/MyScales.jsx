import { useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Calendar, Eye, Youtube } from 'lucide-react';
import { C, ROLES, LOGO_HOME } from '@/lib/theme';
import { fmtDate, todayISO } from '@/lib/db';
import { Avatar, Btn, Field, Modal } from '../ui-kit';
import { AudioPlayerList } from '../AudioSection';
import { useAuth } from '@/lib/auth';
import { useData } from '@/lib/data';

const VOCAL_KEYS = ['tenor', 'soprano', 'contralto'];

export default function MyScalesPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const { members, groups, songs, scales, ready } = useData();
  const [viewModal, setViewModal] = useState(null);
  const [pastOpen, setPastOpen] = useState(false);

  const me = auth.memberFor(members);
  const today = todayISO();

  useEffect(() => {
    if (auth.configured && !auth.loading && !auth.user) navigate({ to: '/entrar', replace: true });
  }, [auth.configured, auth.loading, auth.user, navigate]);

  const mine = me
    ? scales
        .filter((sc) => (sc.scaleMembers || []).some((sm) => sm.memberId === me.id))
        .sort((a, b) => a.date.localeCompare(b.date))
    : [];

  const upcoming = mine.filter((s) => s.date >= today);
  const past = mine.filter((s) => s.date < today).reverse();

  const scaleMembersOf = (sc) => (sc.scaleMembers || [])
    .map((sm) => ({ ...sm, member: members.find((m) => m.id === sm.memberId) }))
    .filter((x) => x.member);

  const scaleSongsOf = (sc) => (sc.scaleSongs || [])
    .map((ss) => ({ ...ss, song: songs.find((s) => s.id === ss.songId) }))
    .filter((x) => x.song);

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
              {sm.map((x) => (
                <span key={x.memberId} className={`tag${x.isSub ? ' sub' : ''}`}>
                  {x.isSub ? '↔ ' : ''}{x.member.name}
                </span>
              ))}
            </div>
            <div style={{ fontSize: 12, color: C.textSecondary }}>{ss.length} música{ss.length !== 1 ? 's' : ''}</div>
          </div>
          <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
            <Btn variant="ghost" onClick={() => setViewModal(sc)} aria-label={`Visualizar ${sc.name}`}>
              <Eye size={14} />
            </Btn>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: 24, maxWidth: 860 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <img src={LOGO_HOME} alt="" style={{ width: 44, height: 44, borderRadius: '50%', border: `2px solid ${C.accent}` }} />
        <div style={{ flex: 1, minWidth: 160 }}>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: C.accent }}>Minhas Escalas</h1>
          <p style={{ color: C.textSecondary, fontSize: 13 }}>{me?.name || auth.email}</p>
        </div>
        {me && <Avatar member={me} size={40} />}
      </div>

      {!ready ? (
        <div className="empty-state"><p>Carregando...</p></div>
      ) : !me ? (
        <div className="empty-state">
          <Calendar size={38} style={{ marginBottom: 12, opacity: 0.25 }} />
          <p>Seu cadastro ainda está aguardando liberação pelo administrador.</p>
          <p style={{ fontSize: 13, marginTop: 8 }}>Quando a liberação for concluída, suas escalas aparecerão aqui.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          <div>
            <div className="section-header" style={{ marginBottom: 10 }}><Calendar size={13} />Próximas ({upcoming.length})</div>
            {upcoming.length === 0 ? (
              <div style={{ padding: '14px 16px', background: C.bgCard, borderRadius: 10, border: `1px solid ${C.border}`, fontSize: 13, color: C.textSecondary, textAlign: 'center' }}>
                Você não está escalado para nenhuma data futura.
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 8 }}>{upcoming.map((sc) => <div key={sc.id}>{renderCard(sc)}</div>)}</div>
            )}
          </div>

          {past.length > 0 && (
            <div>
              <div
                onClick={() => setPastOpen((open) => !open)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none', marginBottom: pastOpen ? 10 : 0 }}
              >
                <div className="section-header" style={{ marginBottom: 0, flex: 1 }}>📦 Anteriores ({past.length})</div>
                <span style={{ fontSize: 11, color: C.textSecondary }}>{pastOpen ? '▲ ocultar' : '▼ mostrar'}</span>
              </div>
              {pastOpen && (
                <div style={{ display: 'grid', gap: 8, opacity: 0.7 }}>
                  {past.slice(0, 10).map((sc) => <div key={sc.id}>{renderCard(sc)}</div>)}
                </div>
              )}
            </div>
          )}
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
        </Modal>
      )}
    </div>
  );
}
