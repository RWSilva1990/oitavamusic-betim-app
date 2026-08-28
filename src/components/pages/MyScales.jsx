import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Calendar, Mic, Youtube } from 'lucide-react';
import { C, ROLES, LOGO_HOME } from '@/lib/theme';
import { fmtDate, todayISO } from '@/lib/db';
import { Avatar } from '../ui-kit';
import { AudioPlayerList } from '../AudioSection';
import { useAuth } from '@/lib/auth';
import { useData } from '@/lib/data';

export default function MyScalesPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const { members, groups, songs, scales, ready } = useData();

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

  const Card = ({ sc }) => {
    const g = groups.find((x) => x.id === sc.groupId);
    const mySlot = (sc.scaleMembers || []).find((sm) => sm.memberId === me?.id);
    const myRoles = (mySlot?.roles || (mySlot?.role ? [mySlot.role] : []))
      .map((r) => ROLES.find((x) => x.key === r))
      .filter(Boolean);
    const team = (sc.scaleMembers || [])
      .map((slot) => ({ ...slot, member: members.find((member) => member.id === slot.memberId) }))
      .filter((item) => item.member);
    const scSongs = (sc.scaleSongs || []).map((ss) => ({ ...ss, song: songs.find((s) => s.id === ss.songId) })).filter((x) => x.song);
    return (
      <div className="card" style={{ marginBottom: 10 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ fontWeight: 700, color: C.textPrimary, fontSize: 15 }}>{sc.name}</span>
          {g && <span className="tag">{g.name}</span>}
          {mySlot?.isSub && <span className="tag sub">↔ Substituto</span>}
        </div>
        <div style={{ color: C.textSecondary, fontSize: 12, marginBottom: 10 }}>📅 {fmtDate(sc.date)}</div>
        {myRoles.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
            {myRoles.map((r) => <span key={r.key} className="tag">{r.emoji} {r.label}</span>)}
          </div>
        )}

        {team.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.textSecondary, marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Equipe</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {team.map((item) => {
                const activeRoles = item.roles || (item.role ? [item.role] : []);
                const roleLabels = activeRoles.map((r) => ROLES.find((role) => role.key === r)).filter(Boolean);
                const isMe = item.memberId === me?.id;
                return (
                  <div
                    key={item.memberId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 7,
                      padding: '5px 10px',
                      background: item.isSub ? 'rgba(79,128,225,0.1)' : C.bgHover,
                      borderRadius: 18,
                      border: `1px solid ${isMe ? C.accent + '66' : C.border}`,
                    }}
                  >
                    <Avatar member={item.member} size={22} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: isMe ? 700 : 600, color: C.textPrimary }}>
                        {item.isSub ? '↔ ' : ''}{item.member.name}{isMe ? ' · você' : ''}
                      </div>
                      {roleLabels.length > 0 && (
                        <div style={{ fontSize: 10, color: C.textSecondary }}>
                          {roleLabels.map((r) => `${r.emoji} ${r.label}`).join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gap: 8 }}>
          {scSongs.map((x) => (
            <div key={x.songId} style={{ padding: '10px 14px', background: C.bgHover, borderRadius: 8, display: 'grid', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <span style={{ fontWeight: 600, color: C.textPrimary, fontSize: 14 }}>{x.song.name}</span>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                  {x.key && <span className="tag green">Tom: {x.key}</span>}
                  {x.song.bpm && <span className="tag" style={{ fontSize: 10 }}>♩ {x.song.bpm} BPM</span>}
                  {(x.song.audios || []).length > 0 && (
                    <span
                      title="Áudio disponível"
                      aria-label="Áudio disponível"
                      style={{ display: 'flex', alignItems: 'center', color: C.accent }}
                    >
                      <Mic size={14} />
                    </span>
                  )}
                  {x.soloMemberId === me?.id && <span className="tag" style={{ fontSize: 10 }}>🎙️ Você é o solista</span>}
                  {x.song.youtubeUrl && (
                    <a href={x.song.youtubeUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', color: '#E8463A' }}><Youtube size={14} /></a>
                  )}
                </div>
              </div>
              {x.notes && <div style={{ fontSize: 12, color: C.textSecondary }}>{x.notes}</div>}
              <AudioPlayerList audios={x.song.audios} compact />
            </div>
          ))}
          {scSongs.length === 0 && <span style={{ color: C.textSecondary, fontSize: 13 }}>Nenhuma música cadastrada nesta escala</span>}
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: 24, maxWidth: 760, margin: '0 auto' }}>
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
          <p style={{ fontSize: 13, marginTop: 8 }}>Quando a liberação for concluída, suas escalas e os áudios destinados a você aparecerão aqui.</p>
        </div>
      ) : (
        <>
          <div className="section-header" style={{ marginBottom: 10 }}><Calendar size={13} />Próximas ({upcoming.length})</div>
          {upcoming.length === 0 ? (
            <div style={{ padding: '14px 16px', background: C.bgCard, borderRadius: 10, border: `1px solid ${C.border}`, fontSize: 13, color: C.textSecondary, textAlign: 'center', marginBottom: 20 }}>
              Você não está escalado para nenhuma data futura.
            </div>
          ) : (
            <div style={{ marginBottom: 20 }}>{upcoming.map((sc) => <Card key={sc.id} sc={sc} />)}</div>
          )}

          {past.length > 0 && (
            <>
              <div className="section-header" style={{ marginBottom: 10 }}>📦 Anteriores ({past.length})</div>
              <div style={{ opacity: 0.7 }}>{past.slice(0, 10).map((sc) => <Card key={sc.id} sc={sc} />)}</div>
            </>
          )}
        </>
      )}
    </div>
  );
}