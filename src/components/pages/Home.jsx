import { Link } from '@tanstack/react-router';
import { Cake, Clock } from 'lucide-react';
import { C, ROLES, LOGO_HOME } from '@/lib/theme';
import { fmtDate, todayISO } from '@/lib/db';
import { Avatar } from '../ui-kit';
import { useData } from '@/lib/data';

export default function HomePage() {
  const { members, groups, songs, scales } = useData();
  const today = todayISO();
  const thisMonth = new Date().getMonth() + 1;

  const counts = {
    members: members.length,
    groups: groups.length,
    songs: songs.length,
    scales: scales.filter((s) => s.date >= today).length,
  };

  const upcoming = [...scales]
    .filter((s) => s.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5);

  const birthdayMembers = members
    .filter((m) => m.birthdate && parseInt(m.birthdate.split('-')[1], 10) === thisMonth)
    .sort((a, b) => parseInt(a.birthdate.split('-')[2], 10) - parseInt(b.birthdate.split('-')[2], 10));

  const now = new Date();
  const isToday = (birthdate) => {
    if (!birthdate) return false;
    const [, m, d] = birthdate.split('-').map(Number);
    return m === now.getMonth() + 1 && d === now.getDate();
  };

  const cards = [
    { emoji: '👥', label: 'Membros', val: counts.members, sub: 'cadastrado', to: '/membros' },
    { emoji: '🎸', label: 'Grupos', val: counts.groups, sub: 'formado', to: '/grupos' },
    { emoji: '🎵', label: 'Repertório', val: counts.songs, sub: 'música', to: '/repertorio' },
    { emoji: '📅', label: 'Escalas', val: counts.scales, sub: 'agendada', to: '/escalas' },
  ];

  return (
    <div style={{ padding: '40px 24px', maxWidth: 580, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ width: 88, height: 88, borderRadius: '50%', margin: '0 auto 20px', overflow: 'hidden', border: `2px solid ${C.accent}`, boxShadow: '0 12px 40px rgba(99,57,255,0.25)' }}>
          <img src={LOGO_HOME} alt="Oitava Music Betim" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <h1 style={{ fontWeight: 800, fontSize: 22, color: C.accent, marginBottom: 4, letterSpacing: '-0.5px' }}>Oitava Music Betim</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 8 }}>
        {cards.map((item) => (
          <Link key={item.label} to={item.to} className="card" style={{ textAlign: 'left', textDecoration: 'none', display: 'block' }}>
            <div style={{ fontSize: 20, marginBottom: 6 }}>{item.emoji}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: C.accent }}>{item.val}</div>
            <div style={{ fontSize: 11.5, color: C.textSecondary, marginTop: 2 }}>
              {item.label} {item.val !== 1 ? item.sub + 's' : item.sub}
            </div>
          </Link>
        ))}
      </div>

      <div className="home-section">
        <div className="section-header"><Clock size={14} />{upcoming.length > 0 ? 'Próximas Escalas' : 'Escalas'}</div>
        {upcoming.length === 0 ? (
          <div style={{ padding: 16, background: C.bgCard, borderRadius: 10, border: `1px solid ${C.border}`, fontSize: 13, color: C.textSecondary, textAlign: 'center' }}>
            Nenhuma escala agendada
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 8 }}>
            {upcoming.map((sc) => {
              const g = groups.find((x) => x.id === sc.groupId);
              const daysUntil = Math.ceil((new Date(sc.date + 'T12:00:00') - new Date()) / 86400000);
              return (
                <Link key={sc.id} to="/escalas" className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 700, color: C.textPrimary, fontSize: 14, marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sc.name}</div>
                    <div style={{ fontSize: 12, color: C.textSecondary, display: 'flex', alignItems: 'center', gap: 8 }}>
                      📅 {fmtDate(sc.date)}
                      {g && <span className="tag" style={{ fontSize: 10 }}>{g.name}</span>}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    {daysUntil <= 0 ? (
                      <span style={{ fontSize: 12, fontWeight: 700, color: C.success }}>Hoje!</span>
                    ) : daysUntil === 1 ? (
                      <span style={{ fontSize: 12, fontWeight: 600, color: C.accent }}>Amanhã</span>
                    ) : (
                      <span style={{ fontSize: 12, color: C.textSecondary }}>{daysUntil}d</span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <div className="home-section">
        <div className="section-header"><Cake size={14} />Aniversariantes do Mês</div>
        {birthdayMembers.length === 0 ? (
          <div style={{ padding: 16, background: C.bgCard, borderRadius: 10, border: `1px solid ${C.border}`, fontSize: 13, color: C.textSecondary, textAlign: 'center' }}>
            Nenhum aniversariante este mês
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 8 }}>
            {birthdayMembers.map((m) => {
              const day = parseInt(m.birthdate.split('-')[2], 10);
              const isBday = isToday(m.birthdate);
              return (
                <div key={m.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Avatar member={m} size={40} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: C.textPrimary, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.name}</span>
                      {isBday && <span style={{ flexShrink: 0, fontSize: 14 }}>🎂</span>}
                    </div>
                    <div style={{ fontSize: 12, color: C.textSecondary }}>
                      {(m.roles || []).map((r) => ROLES.find((x) => x.key === r)?.label).filter(Boolean).join(', ') || 'Sem função'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: isBday ? C.accent : C.textPrimary }}>{day}</div>
                    {isBday && <div style={{ fontSize: 10, color: C.accent, fontWeight: 600 }}>HOJE!</div>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
