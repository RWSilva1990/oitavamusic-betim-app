export const C = {
  bg: '#F0F2F8',
  bgSecondary: '#FFFFFF',
  bgCard: '#FFFFFF',
  bgHover: '#E8EBF4',
  bgInput: '#F5F7FC',
  accent: '#6339ff',
  accentAlt: '#d946a8',
  accentDark: '#4620cc',
  accentGlow: 'rgba(99,57,255,0.10)',
  accentGlow2: 'rgba(217,70,168,0.06)',
  border: '#D8DCF0',
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  danger: '#DC2626',
  success: '#16A34A',
  blue: '#2563EB',
};

export const ROLES = [
  { key: 'bateria', label: 'Bateria', emoji: '🥁' },
  { key: 'baixo', label: 'Baixo', emoji: '🎸' },
  { key: 'violao', label: 'Violão', emoji: '🎵' },
  { key: 'guitarra', label: 'Guitarra', emoji: '🎸' },
  { key: 'teclado', label: 'Teclado', emoji: '🎹' },
  { key: 'ministro', label: 'Ministro', emoji: '✨' },
  { key: 'tenor', label: 'Tenor', emoji: '🎙️' },
  { key: 'soprano', label: 'Soprano', emoji: '🎙️' },
  { key: 'contralto', label: 'Contralto', emoji: '🎙️' },
];

export const NAV = [
  { id: 'home', label: 'Início', emoji: '🏠', to: '/' },
  { id: 'members', label: 'Membros', emoji: '👥', to: '/membros' },
  { id: 'groups', label: 'Grupos', emoji: '🎸', to: '/grupos' },
  { id: 'songs', label: 'Repertório', emoji: '🎵', to: '/repertorio' },
  { id: 'scales', label: 'Escalas', emoji: '📅', to: '/escalas' },
  { id: 'reports', label: 'Relatórios', emoji: '📊', to: '/relatorios' },
];

export const LOGO_HOME = '/icon-512.png';
export const LOGO_SIDEBAR = '/icon-192.png';

export const GLOBAL_CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root { width: 100%; max-width: 100vw; overflow-x: hidden; }
  html, body {
    background: #F0F2F8;
    font-family: 'Plus Jakarta Sans', sans-serif;
    color: #111827;
    -webkit-tap-highlight-color: transparent;
    -webkit-overflow-scrolling: touch;
    background-image: radial-gradient(ellipse 60% 40% at 15% 0%, rgba(99,57,255,0.06) 0%, transparent 70%), radial-gradient(ellipse 40% 50% at 85% 80%, rgba(217,70,168,0.04) 0%, transparent 70%);
    background-attachment: fixed;
  }
  ::-webkit-scrollbar { width: 5px; height: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #D8DCF0; border-radius: 4px; }
  ::-webkit-scrollbar-thumb:hover { background: #6339ff55; }
  input, select, textarea, button { font-family: 'Plus Jakarta Sans', sans-serif; }
  input::placeholder, textarea::placeholder { color: #9CA3AF; }
  select option { background: #FFFFFF; color: #111827; }
  a { color: inherit; }

  .sidebar {
    width: 230px; background: rgba(255,255,255,0.95);
    border-right: 1px solid #D8DCF0;
    position: fixed; top: 0; left: 0; bottom: 0; z-index: 200;
    transform: translateX(-100%);
    transition: transform 0.28s cubic-bezier(.4,0,.2,1);
    display: flex; flex-direction: column;
    box-shadow: 2px 0 16px rgba(99,57,255,0.06);
  }
  .sidebar.open { transform: translateX(0); }
  .topbar-menu-btn { display: flex; }
  .main-content { margin-left: 0; }

  @media (min-width: 900px) {
    .sidebar { transform: translateX(0) !important; }
    .main-content { margin-left: 230px; }
    .topbar-menu-btn { display: none !important; }
  }

  .nav-item {
    padding: 10px 14px; border-radius: 10px; cursor: pointer;
    display: flex; align-items: center; gap: 10px;
    font-size: 13.5px; font-weight: 500; color: #6B7280;
    transition: all 0.15s; border: 1px solid transparent;
    margin-bottom: 3px; user-select: none; text-decoration: none;
  }
  .nav-item:hover { background: rgba(0,0,0,0.04); color: #374151; }
  .nav-item.active {
    background: rgba(99,57,255,0.10); color: #6339ff;
    font-weight: 600; border-color: rgba(99,57,255,0.20);
    box-shadow: 0 0 12px rgba(99,57,255,0.06);
  }

  .btn {
    padding: 9px 18px; border-radius: 10px; cursor: pointer;
    font-size: 13px; font-family: 'Plus Jakarta Sans', sans-serif;
    display: inline-flex; align-items: center; gap: 6px;
    transition: opacity 0.15s, transform 0.1s; border: none;
    font-weight: 600; white-space: nowrap;
  }
  .btn:hover { opacity: 0.82; }
  .btn:active { transform: scale(0.96); }
  .btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .btn-primary { background: linear-gradient(135deg, #6339ff, #a855f7); color: #fff; box-shadow: 0 4px 18px rgba(99,57,255,0.25); }
  .btn-secondary { background: transparent; color: #6B7280; border: 1px solid #D8DCF0 !important; }
  .btn-danger { background: transparent; color: #DC2626; border: 1px solid #DC262644 !important; }
  .btn-ghost { background: transparent; color: #6B7280; padding: 6px 8px; }
  .btn-ghost:hover { color: #111827; background: rgba(0,0,0,0.05); }
  .btn-ghost.del:hover { color: #DC2626; }

  .input-field {
    width: 100%; padding: 10px 14px;
    background: #F5F7FC; border: 1px solid #D8DCF0;
    border-radius: 10px; color: #111827; font-size: 14px;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .input-field:focus { outline: none; border-color: #6339ff; box-shadow: 0 0 0 3px rgba(99,57,255,0.10); }
  .input-field:hover { border-color: #6339ff55; }

  .card {
    background: #FFFFFF; border: 1px solid #D8DCF0;
    border-radius: 16px; padding: 16px;
    transition: border-color 0.2s, box-shadow 0.2s;
    max-width: 100%; overflow: hidden;
  }
  .card:hover { border-color: rgba(99,57,255,0.25); box-shadow: 0 4px 16px rgba(99,57,255,0.06); }

  .tag {
    padding: 3px 9px; border-radius: 20px; font-size: 11px; font-weight: 600;
    background: rgba(99,57,255,0.10); color: #6339ff; border: 1px solid rgba(99,57,255,0.25);
  }
  .tag.sub { background: rgba(217,70,168,0.10); color: #d946a8; border-color: rgba(217,70,168,0.25); }
  .tag.green { background: rgba(22,163,74,0.10); color: #16A34A; border-color: rgba(22,163,74,0.25); }

  .field-label {
    display: block; margin-bottom: 6px;
    color: #6B7280; font-size: 11px; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.8px;
  }
  .field-wrap { margin-bottom: 16px; }

  .modal-overlay {
    position: fixed; inset: 0; z-index: 500;
    background: rgba(20,10,50,0.45); backdrop-filter: blur(8px);
    display: flex; align-items: center; justify-content: center; padding: 16px;
  }
  .modal-box {
    background: #FFFFFF; border-radius: 20px;
    border: 1px solid #D8DCF0;
    width: 100%; max-width: 680px;
    max-height: calc(100dvh - 32px);
    display: flex; flex-direction: column;
    box-shadow: 0 24px 64px rgba(20,10,50,0.18);
  }
  .modal-header {
    padding: 18px 24px; border-bottom: 1px solid #E8EBF4;
    display: flex; align-items: center; justify-content: space-between;
    background: rgba(99,57,255,0.04); z-index: 1; flex-shrink: 0;
    border-radius: 20px 20px 0 0;
  }
  .modal-body { padding: 24px; overflow-y: auto; flex: 1; -webkit-overflow-scrolling: touch; color: #111827; }

  .empty-state { text-align: center; padding: 60px 24px; color: #6B7280; }

  .role-chip {
    padding: 8px 12px; border-radius: 10px; cursor: pointer;
    display: flex; align-items: center; gap: 8px; font-size: 13px;
    border: 1px solid #D8DCF0; background: transparent; color: #6B7280;
    transition: all 0.15s; user-select: none;
  }
  .role-chip.selected {
    border-color: rgba(99,57,255,0.40); background: rgba(99,57,255,0.08); color: #6339ff;
  }
  .member-pick {
    padding: 8px 12px; border-radius: 10px; cursor: pointer;
    display: flex; align-items: center; gap: 10px; font-size: 13.5px;
    border: 1px solid #D8DCF0; background: transparent; transition: all 0.15s; color: #111827;
  }
  .member-pick:hover { border-color: rgba(99,57,255,0.30); background: rgba(99,57,255,0.04); }
  .member-pick.selected { border-color: rgba(99,57,255,0.40); background: rgba(99,57,255,0.08); }

  .bar-bg { height: 6px; background: #E8EBF4; border-radius: 4px; overflow: hidden; margin-top: 6px; }
  .bar-fill { height: 100%; background: linear-gradient(90deg, #6339ff, #d946a8); border-radius: 4px; }

  .avatar {
    width: 44px; height: 44px; border-radius: 50%; flex-shrink: 0;
    background: rgba(99,57,255,0.12); border: 2px solid rgba(99,57,255,0.25);
    display: flex; align-items: center; justify-content: center;
    font-size: 17px; font-weight: 700; color: #6339ff; overflow: hidden;
  }
  .avatar img { width: 100%; height: 100%; object-fit: cover; }

  .search-wrap { position: relative; margin-bottom: 18px; }
  .search-wrap svg { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); pointer-events: none; }
  .search-wrap input { padding-left: 36px; }

  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  @media (max-width: 500px) { .grid-2 { grid-template-columns: 1fr; } }

  .song-item {
    padding: 10px 14px; border-radius: 10px; cursor: pointer;
    display: flex; align-items: center; gap: 8px; font-size: 13px;
    color: #111827; background: #E8EBF4;
    transition: background 0.15s;
  }
  .song-item:hover { background: rgba(99,57,255,0.10); color: #111827; }

  .scale-song-row {
    padding: 12px; background: #E8EBF4; border-radius: 10px; margin-bottom: 8px;
    border: 1px solid #D8DCF0; color: #111827;
  }

  .btn-whatsapp { background: #1FAD4A; color: #fff; }
  .btn-whatsapp:hover { opacity: 0.85; }

  .section-header {
    font-family: 'Plus Jakarta Sans', sans-serif; font-size: 11px; font-weight: 700;
    color: #6B7280; text-transform: uppercase; letter-spacing: 1.5px;
    margin-bottom: 10px; display: flex; align-items: center; gap: 8px;
  }

  .home-section { margin-top: 28px; text-align: left; }

  .audio-row {
    display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
    padding: 10px 12px; background: #F5F7FC; border: 1px solid #D8DCF0;
    border-radius: 10px;
  }
  .audio-row audio { height: 34px; max-width: 100%; }

  @keyframes spin { to { transform: rotate(360deg); } }
`;
