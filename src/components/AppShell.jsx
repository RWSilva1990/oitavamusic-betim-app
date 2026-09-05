import { useEffect, useState } from 'react';
import { Link, useNavigate, useRouterState } from '@tanstack/react-router';
import { Bell, Menu, LogOut, X } from 'lucide-react';
import { C, NAV, LOGO_HOME, LOGO_SIDEBAR } from '@/lib/theme';
import { Btn } from './ui-kit';
import NotificationSettings from './NotificationSettings';
import AppearanceSettings from './AppearanceSettings';
import { useAuth } from '@/lib/auth';
import { useData } from '@/lib/data';
import { startScaleNotificationRuntime } from '@/lib/push-client';
import { getCommunicationsInbox } from '@/lib/communications';

const COMMUNICATIONS_NAV = { id: 'communications', label: 'Comunicados', emoji: '📢', to: '/comunicados' };
const METRONOME_NAV = { id: 'metronome', label: 'Metrônomo', emoji: '⏱️', to: '/metronomo' };
const PITCH_TEST_NAV = { id: 'pitch-test', label: 'Testar tom de música', emoji: '🎚️', to: '/testar-tom' };
const TOOLS_NAV = { id: 'tools', label: 'Ferramentas', emoji: '🧰', children: [METRONOME_NAV, PITCH_TEST_NAV] };
const NATIVE_FOREGROUND_NOTIFICATION_EVENT = 'oitava:native-foreground-notification';

const MEMBER_NAV = [
  { id: 'home', label: 'Início', emoji: '🏠', to: '/' },
  { id: 'my-scales', label: 'Minhas Escalas', emoji: '📅', to: '/minhas-escalas' },
  { id: 'songs', label: 'Repertório', emoji: '🎵', to: '/repertorio' },
  TOOLS_NAV,
  COMMUNICATIONS_NAV,
];

const ADMIN_NAV = [
  NAV[0],
  { id: 'my-scales', label: 'Minhas Escalas', emoji: '📅', to: '/minhas-escalas' },
  NAV[1],
  NAV[2],
  NAV[3],
  NAV[4],
  TOOLS_NAV,
  NAV[5],
  COMMUNICATIONS_NAV,
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
  const [toolsOpen, setToolsOpen] = useState(false);
  const [unreadCommunications, setUnreadCommunications] = useState(0);
  const [foregroundNotification, setForegroundNotification] = useState(null);
  const auth = useAuth();
  const { syncing, syncOk, ready } = useData();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const memberAllowed = allowMember && auth.role === 'membro';
  const navItems = memberAllowed ? MEMBER_NAV : auth.isAdmin ? ADMIN_NAV : NAV;

  useEffect(() => {
    if (TOOLS_NAV.children.some((item) => item.to === pathname)) setToolsOpen(true);
  }, [pathname]);

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
    let timer;
    const showForegroundNotification = (event) => {
      const detail = event?.detail || {};
      const title = String(detail.title || 'Oitava Music').trim();
      const body = String(detail.body || '').trim();
      if (!title && !body) return;

      if (timer) window.clearTimeout(timer);
      setForegroundNotification({
        title: title || 'Oitava Music',
        body,
        path: String(detail.path || '/minhas-escalas'),
      });
      timer = window.setTimeout(() => setForegroundNotification(null), 6500);
    };

    window.addEventListener(NATIVE_FOREGROUND_NOTIFICATION_EVENT, showForegroundNotification);
    return () => {
      if (timer) window.clearTimeout(timer);
      window.removeEventListener(NATIVE_FOREGROUND_NOTIFICATION_EVENT, showForegroundNotification);
    };
  }, []);

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

  const openForegroundNotification = () => {
    const path = String(foregroundNotification?.path || '');
    setForegroundNotification(null);
    if (!path.startsWith('/')) return;

    const nextUrl = new URL(path, window.location.origin);
    const nextPath = `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`;
    const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (nextPath === currentPath) return;

    window.history.pushState(window.history.state, '', nextPath);
    window.dispatchEvent(new PopStateEvent('popstate', { state: window.history.state }));
  };

  if (auth.loading) return <Loader label="Verificando acesso..." />;
  if (!auth.configured) return <SetupRequired />;
  if (!auth.user) return <Loader label="Redirecionando..." />;
  if (auth.role !== 'admin' && !memberAllowed) return <Loader label="Redirecionando..." />;
  if (!ready) return <Loader />;

  const flatNavItems = navItems.flatMap((item) => item.children || [item]);
  const current = flatNavItems.find((n) => n.to === pathname) || flatNavItems[0];

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
          {navItems.map((n) => {
            if (n.children) {
              const childActive = n.children.some((item) => item.to === pathname);
              return (
                <div key={n.id}>
                  <button
                    type="button"
                    className={`nav-item${childActive ? ' active' : ''}`}
                    aria-expanded={toolsOpen}
                    onClick={() => setToolsOpen((open) => !open)}
                    style={{ width: '100%', border: 'none', fontFamily: 'inherit', textAlign: 'left', cursor: 'pointer' }}
                  >
                    <span style={{ fontSize: 18 }}>{n.emoji}</span>
                    <span style={{ flex: 1 }}>{n.label}</span>
                    <span aria-hidden="true" style={{ fontSize: 12, opacity: 0.75 }}>{toolsOpen ? '▾' : '▸'}</span>
                  </button>
                  {toolsOpen && (
                    <div style={{ paddingLeft: 16 }}>
                      {n.children.map((child) => (
                        <Link
                          key={child.id}
                          to={child.to}
                          className={`nav-item${pathname === child.to ? ' active' : ''}`}
                          onClick={() => setSideOpen(false)}
                          style={{ fontSize: 12 }}
                        >
                          <span style={{ fontSize: 16 }}>{child.emoji}</span>
                          <span style={{ flex: 1 }}>{child.label}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return (
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
            );
          })}
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

      {foregroundNotification && (
        <div
          role="alert"
          onClick={openForegroundNotification}
          style={{
            position: 'fixed',
            top: 'calc(env(safe-area-inset-top, 0px) + 12px)',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1200,
            width: 'calc(100vw - 24px)',
            maxWidth: 520,
            padding: '12px 42px 12px 12px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 11,
            borderRadius: 16,
            border: `1px solid ${C.accent}55`,
            background: C.bgCard,
            boxShadow: '0 12px 38px var(--app-shadow)',
            cursor: 'pointer',
          }}
        >
          <div style={{ width: 34, height: 34, borderRadius: 11, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.accentGlow, color: C.accent }}>
            <Bell size={18} strokeWidth={2.4} />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 13, lineHeight: 1.35, fontWeight: 800, color: C.textPrimary }}>{foregroundNotification.title}</div>
            {foregroundNotification.body && (
              <div style={{ marginTop: 3, fontSize: 11.5, lineHeight: 1.45, color: C.textSecondary }}>{foregroundNotification.body}</div>
            )}
            <div style={{ marginTop: 5, fontSize: 10.5, fontWeight: 800, color: C.accent }}>Toque para abrir</div>
          </div>
          <button
            type="button"
            aria-label="Fechar notificação"
            onClick={(event) => {
              event.stopPropagation();
              setForegroundNotification(null);
            }}
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              width: 28,
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              borderRadius: 9,
              background: 'transparent',
              color: C.textSecondary,
              cursor: 'pointer',
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="main-content" style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', overflowX: 'hidden', width: 'auto', minWidth: 0 }}>
        <div className="topbar-surface" style={{ height: 54, background: 'var(--app-topbar)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', padding: '0 18px', gap: 8, position: 'sticky', top: 0, zIndex: 100 }}>
          <button className="topbar-menu-btn btn-ghost btn" onClick={() => setSideOpen((x) => !x)} style={{ padding: '6px 8px' }}>
            <Menu size={19} />
          </button>
          <span style={{ fontWeight: 800, color: C.accent, fontSize: 13, flex: 1, minWidth: 0 }}>
            {current?.emoji} {current?.label}
          </span>
          <AppearanceSettings />
          <NotificationSettings />
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
            {syncing ? (
              <div style={{ width: 8, height: 8, borderRadius: '50%', border: `1.5px solid ${C.textSecondary}44`, borderTopColor: C.textSecondary, animation: 'spin 0.8s linear infinite' }} />
            ) : (
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: syncOk === true ? C.success : syncOk === false ? C.danger : C.textSecondary }} />
            )}
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
      </div>
    </>
  );
}
