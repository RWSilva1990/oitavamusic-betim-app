import { useEffect, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Cake, Clock, Megaphone } from 'lucide-react';
import { C, ROLES, LOGO_HOME } from '@/lib/theme';
import { fmtDate, todayISO } from '@/lib/db';
import { getCommunicationsInbox } from '@/lib/communications';
import { Avatar } from '../ui-kit';
import { useAuth } from '@/lib/auth';
import { useData } from '@/lib/data';

function UnreadCommunicationsAlert({ count }) {
  if (!count) return null;
  const singular = count === 1;

  return (
    <Link
      to="/comunicados"
      className="card"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '14px 16px',
        marginBottom: 18,
        textDecoration: 'none',
        borderColor: `${C.accent}88`,
        background: C.accentGlow,
        boxShadow: '0 5px 18px rgba(139,92,246,0.10)',
      }}
    >
      <div style={{
        width: 38,
        height: 38,
        borderRadius: 12,
        background: 'rgba(139,92,246,0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Megaphone size={19} color={C.accent} />
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', marginBottom: 3 }}>
          <span className="tag" style={{ fontSize: 9.5 }}>NOVO</span>
          <strong style={{ color: C.textPrimary, fontSize: 13.5 }}>
            {singular ? 'Você tem um comunicado para ler' : 'Você tem comunicados para ler'}
          </strong>
        </div>
        <div style={{ color: C.textSecondary, fontSize: 11.5, lineHeight: 1.45 }}>
          {singular
            ? 'Existe 1 comunicado não lido aguardando sua leitura.'
            : `Existem ${count} comunicados não lidos aguardando sua leitura.`}
        </div>
      </div>
      <span style={{ color: C.accent, fontWeight: 800, fontSize: 11.5, flexShrink: 0 }}>
        Ler →
      </span>
    </Link>
  );
}

export default function HomePage() {
  const auth = useAuth();
  const { members, groups, songs, scales } = useData();
  const [unreadCommunications, setUnreadCommunications] = useState(0);
  const today = todayISO();

  useEffect(() => {
    let alive = true;

    const loadUnread = async () => {
      try {
        const data = await getCommunicationsInbox();
        if (alive) setUnreadCommunications(Number(data?.unread || 0));
      } catch (error) {
        console.warn('Não foi possível verificar comunicados não lidos na tela inicial:', error);
      }
    };

    const refresh = () => { loadUnread(); };
    loadUnread();
    window.addEventListener('oitava:communications-updated', refresh);
    window.addEventListener('focus', refresh);

    return () => {
      alive = false;
      window.removeEventListener('oitava:communications-updated', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, [auth.user?.uid]);

  if (auth.role === 'membro') {
    const me = auth.memberFor(members);
    const myUpcoming = me
      ? scales
          .filter((sc) => sc.date >= today && (sc.scaleMembers || []).some((sm) => sm.memberId === me.id))
          .sort((a, b) => a.date.localeCompare(b.date))
      : [];
    const nextScale = myUpcoming[0];
    const nextGroup = nextScale ? groups.find((g) => g.id === nextScale.groupId) : null;
    const firstName = (me?.name || '').trim().split(/\s+/)[0];

    return (
      <div style={{ padding: '36px 24px', maxWidth: 620, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ width: 76, height: 76, borderRadius: '50%', margin: '0 auto 16px', overflow: 'hidden', border: `2px solid ${C.accent}`, boxShadow: '0 10px 30px rgba(99,57,255,0.20)' }}>
            <img src={LOGO_HOME} alt="Oitava Music Betim" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <h1 style={{ fontWeight: 800, fontSize: 22, color: C.accent, marginBottom: 4 }}>
            {firstName ? `Olá, ${firstName}` : 'Oitava Music Betim'}
          </h1>
          <p style={{ color: C.textSecondary, fontSize: 13 }}>O que você precisa acessar agora?</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginBottom: 20 }}>
          <Link to="/minhas-escalas" className="card" style={{ textDecoration: 'none', padding: 18, minHeight: 128, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 28 }}>📅</div>
            <div>
              <div style={{ color: C.textPrimary, fontWeight: 800, fontSize: 15 }}>Minhas Escalas</div>
              <div style={{ color: C.textSecondary, fontSize: 12, marginTop: 4, lineHeight: 1.5 }}>Datas, músicas, tons e áudios das suas escalas.</div>
            </div>
          </Link>

          <Link to="/repertorio" className="card" style={{ textDecoration: 'none', padding: 18, minHeight: 128, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 28 }}>🎵</div>
            <div>
              <div style={{ color: C.textPrimary, fontWeight: 800, fontSize: 15 }}>Repertório</div>
              <div style={{ color: C.textSecondary, fontSize: 12, marginTop: 4, lineHeight: 1.5 }}>Estude as músicas e ouça todos os áudios disponíveis.</div>
            </div>
          </Link>
        </div>

        <UnreadCommunicationsAlert count={unreadCommunications} />

        <div className="section-header" style={{ marginBottom: 10 }}><Clock size={14} />Próxima escala</div>
        {nextScale ? (
          <Link to="/minhas-escalas" className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, textDecoration: 'none', padding: 16 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ color: C.textPrimary, fontWeight: 700, fontSize: 14, marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nextScale.name}</div>
              <div style={{ color: C.textSecondary, fontSize: 12 }}>
                📅 {fmtDate(nextScale.date)}{nextGroup ? ` · ${nextGroup.name}` : ''}
              </div>
            </div>
            <span style={{ color: C.accent, fontWeight: 700, fontSize: 12, flexShrink: 0 }}>Ver escala →</span>
          </Link>
        ) : (
          <div style={{ padding: 16, background: C.bgCard, borderRadius: 10, border: `1px solid ${C.border}`, fontSize: 13, color: C.textSecondary, textAlign: 'center' }}>
            Você não possui escala futura no momento.
          </div>
        )}
      </div>
    );
  }

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

      <UnreadCommunicationsAlert count={unreadCommunications} />

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
