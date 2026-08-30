import { useEffect, useState } from 'react';
import { Link, useNavigate, useRouterState } from '@tanstack/react-router';
import { Menu, LogOut } from 'lucide-react';
import { C, NAV, LOGO_HOME, LOGO_SIDEBAR } from '@/lib/theme';
import { Btn } from './ui-kit';
import NotificationSettings from './NotificationSettings';
import AppearanceSettings from './AppearanceSettings';
import { useAuth } from '@/lib/auth';
import { useData } from '@/lib/data';
import { startScaleNotificationRuntime } from '@/lib/push-client';
import { getCommunicationsInbox } from '@/lib/communications';

const COMMUNICATIONS_NAV = { id: 'communications', label: 'Comunicados', emoji: '📢', to: '/comunicados' };

const MEMBER_NAV = [
  { id: 'home', label: 'Início', emoji: '🏠', to: '/' },
  { id: 'my-scales', label: 'Minhas Escalas', emoji: '📅', to: '/minhas-escalas' },
  COMMUNICATIONS_NAV,
  { id: 'songs', label: 'Repertório', emoji: '🎵', to: '/repertorio' },
];

const ADMIN_NAV = [
  NAV[0],
  { id: 'my-scales', label: 'Minhas Escalas', emoji: '📅', to: '/minhas-escalas' },
  COMMUNICATIONS_NAV,
  ...NAV.slice(1),
];

export function Loader({ label = 'Conectando ao Firebase...' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', color: C.textSecondary, gap: 16 }}>
      <img src={LOGO_HOME} alt="" style={{ width: 64, height: 64, borderRadius: '50%', border: `2px solid ${C.accent}` }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 18, height: 18, border: `2px solid ${C.accent}44`, borderTopColor: C.accent, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        {label}
      </div>
    </div>
  );
}

function SetupRequired() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', padding: 24, textAlign: 'center' }}>
      <img src={LOGO_HOME} alt="" style={{ width: 72, height: 72, borderRadius: '50%', border: `2px solid ${C.accent}` }} />
      <h2 style={{ marginTop: 18, color: C.accent, fontSize: 20 }}>Firebase não configurado</h2>
      <p style={{ marginTop: 8, maxWidth: 440, color: C.textSecondary, fontSize: 13, lineHeight: 1.6 }}>
        Este ambiente ainda não recebeu as variáveis do Firebase. Configure-as no Vercel e faça um novo deploy.
      </p>
    </div>
  );
}

export default function AppShell({ children, allowMember = false }) {
  const [sideOpen, setSideOpen] = useState(false);
  const [unreadCommunications, setUnreadCommunications] = useState(0);
  const auth = useAuth();
  const { syncing, syncOk, ready } = useData();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const memberAllowed = allowMember && auth.role === 'membro';
  const navItems = memberAllowed ? MEMBER_NAV : auth.isAdmin ? ADMIN_NAV : NAV;

  useEffect(() => {
    if (!auth.configured || auth.loading) return;
    if (!auth.user) navigate({ to: '/entrar', replace: true });
    else if (auth.role === 'membro' && !allowMember) navigate({ to: '/', replace: true });
  }, [auth.configured, auth.loading, auth.user, auth.role, allowMember, navigate]);

  useEffect(() => {
    if (!auth.user || !auth.role) return undefined;
    let alive = true;
    let cleanup = () => {};

    startScaleNotificationRuntime().then((fn) => {
      if (!alive) {
        fn?.();
        return;
      }
      cleanup = fn || (() => {});
    }).catch((error) => console.warn('Falha ao iniciar notificações:', error));

    return () => {
      alive = false;
      cleanup();
    };
  }, [auth.user?.uid, auth.role]);

  useEffect(() => {
    if (!auth.user || !auth.role) {
      setUnreadCommunications(0);
      return undefined;
    }

    let alive = true;
    const refreshUnread = () => {
      getCommunicationsInbox()
        .then((data) => { if (alive) setUnreadCommunications(Number(data?.unread || 0)); })
        .catch((error) => console.warn('Falha ao atualizar contador de comunicados:', error));
    };

    refreshUnread();
    const interval = window.setInterval(refreshUnread, 30000);
    window.addEventListener('oitava:communications-updated', refreshUnread);
    return () => {
      alive = false;
      window.clearInterval(interval);
      window.removeEventListener('oitava:communications-updated', refreshUnread);
    };
  }, [auth.user?.uid, auth.role]);

  if (auth.loading) return <Loader label="Verificando acesso..." />;
  if (!auth.configured) return <SetupRequired />;
  if (!auth.user) return <Loader label="Redirecionando..." />;
  if (auth.role !== 'admin' && !memberAllowed) return <Loader label="Redirecionando..." />;
  if (!ready) return <Loader />;

  const current = navItems.find((n) => n.to === pathname) || navItems[0];

  return (
    <>
      <div className={`sidebar${sideOpen ? ' open' : ''}`}>
        <div style={{ padding: '16px 18px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src={LOGO_SIDEBAR} alt="Logo" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
          <div style={{ color: C.accent, fontSize: 13, fontWeight: 800, lineHeight: 1.3 }}>
            Oitava Music<br />Betim
          </div>
        </div>
        <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto' }}>
          {navItems.map((n) => (
            <Link
              key={n.id}
              to={n.to}
              className={`nav-item${pathname === n.to ? ' active' : ''}`}
              onClick={() => setSideOpen(false)}
            >
              <span style={{ fontSize: 18 }}>{n.emoji}</span>
              <span style={{ flex: 1 }}>{n.label}</span>
              {n.id === 'communications' && unreadCommunications > 0 && (
                <span style={{ minWidth: 20, height: 20, padding: '0 6px', borderRadius: 10, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: C.accent, color: '#fff', fontSize: 10, fontWeight: 800 }}>
                  {unreadCommunications > 99 ? '99+' : unreadCommunications}
                </span>
              )}
            </Link>
          ))}
        </nav>
        <div style={{ padding: '12px 16px', borderTop: `1px solid ${C.border}`, fontSize: 11, color: C.textSecondary, lineHeight: 1.5 }}>
          {auth.configured && auth.user ? (
            <>
              <div style={{ marginBottom: 8, wordBreak: 'break-all' }}>👤 {auth.email}</div>
              <Btn variant="secondary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => auth.logout().then(() => navigate({ to: '/entrar', replace: true }))}>
                <LogOut size={13} />Sair
              </Btn>
            </>
          ) : (
            <>☁️ Sincronizado entre<br />todos os dispositivos</>
          )}
        </div>
      </div>

      {sideOpen && (
        <div onClick={() => setSideOpen(false)} style={{ position: 'fixed', inset: 0, background: 'var(--app-overlay)', zIndex: 199 }} />
      )}

      <div className="main-content" style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', overflowX: 'hidden', width: '100%' }}>
        <div className="topbar-surface" style={{ height: 54, background: 'var(--app-topbar)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', padding: '0 18px', gap: 8, position: 'sticky', top: 0, zIndex: 100 }}>
          <button className="topbar-menu-btn btn-ghost btn" onClick={() => setSideOpen((x) => !x)} style={{ padding: '6px 8px' }}>
            <Menu size={19} />
          </button>
          <span style={{ fontWeight: 800, color: C.accent, fontSize: 13, flex: 1 }}>
            {current?.emoji} {current?.label}
          </span>
          <AppearanceSettings />
          <NotificationSettings />
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            {syncing ? (
              <div style={{ width: 8, height: 8, borderRadius: '50%', border: `1.5px solid ${C.textSecondary}44`, borderTopColor: C.textSecondary, animation: 'spin 0.8s linear infinite' }} />
            ) : (
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: syncOk === true ? C.success : syncOk === false ? C.danger : C.textSecondary }} />
            )}
          </div>
        </div>
        <div style={{ flex: 1 }}>{children}</div>
      </div>
    </>
  );
}
