export const C = {
  bg: 'var(--app-bg)',
  bgSecondary: 'var(--app-surface)',
  bgCard: 'var(--app-card)',
  bgHover: 'var(--app-hover)',
  bgInput: 'var(--app-input)',
  accent: '#8B5CF6',
  accentAlt: '#D946A8',
  accentDark: '#6D3DE0',
  accentGlow: 'var(--app-accent-glow)',
  accentGlow2: 'var(--app-accent-glow-2)',
  border: 'var(--app-border)',
  textPrimary: 'var(--app-text)',
  textSecondary: 'var(--app-text-muted)',
  danger: '#E5484D',
  success: '#2FB060',
  blue: '#3B82F6',
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
  :root {
    --app-bg: #F0F2F8;
    --app-surface: #FFFFFF;
    --app-card: #FFFFFF;
    --app-hover: #E8EBF4;
    --app-input: #F5F7FC;
    --app-border: #D8DCF0;
    --app-text: #111827;
    --app-text-muted: #667085;
    --app-placeholder: #98A2B3;
    --app-sidebar: rgba(255,255,255,0.96);
    --app-topbar: rgba(255,255,255,0.92);
    --app-overlay: rgba(20,10,50,0.45);
    --app-accent-glow: rgba(139,92,246,0.12);
    --app-accent-glow-2: rgba(217,70,168,0.07);
    --app-subtle: rgba(17,24,39,0.05);
    --app-shadow: rgba(20,10,50,0.14);
    color-scheme: light;
  }

  :root[data-theme='dark'] {
    --app-bg: #0D111A;
    --app-surface: #121824;
    --app-card: #151C29;
    --app-hover: #1C2535;
    --app-input: #111827;
    --app-border: #2A3446;
    --app-text: #F4F6FA;
    --app-text-muted: #AAB4C5;
    --app-placeholder: #788398;
    --app-sidebar: rgba(15,20,31,0.97);
    --app-topbar: rgba(13,17,26,0.92);
    --app-overlay: rgba(0,0,0,0.68);
    --app-accent-glow: rgba(139,92,246,0.17);
    --app-accent-glow-2: rgba(217,70,168,0.10);
    --app-subtle: rgba(255,255,255,0.06);
    --app-shadow: rgba(0,0,0,0.34);
    color-scheme: dark;
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root { width: 100%; max-width: 100vw; overflow-x: hidden; }
  html, body {
    background: var(--app-bg);
    font-family: 'Plus Jakarta Sans', sans-serif;
    color: var(--app-text);
    -webkit-tap-highlight-color: transparent;
    -webkit-overflow-scrolling: touch;
    background-image: radial-gradient(ellipse 60% 40% at 15% 0%, rgba(139,92,246,0.07) 0%, transparent 70%), radial-gradient(ellipse 40% 50% at 85% 80%, rgba(217,70,168,0.05) 0%, transparent 70%);
    background-attachment: fixed;
    transition: background-color .18s ease, color .18s ease;
  }
  ::-webkit-scrollbar { width: 5px; height: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--app-border); border-radius: 4px; }
  ::-webkit-scrollbar-thumb:hover { background: #8B5CF666; }
  input, select, textarea, button { font-family: 'Plus Jakarta Sans', sans-serif; }
  input::placeholder, textarea::placeholder { color: var(--app-placeholder); }
  select option { background: var(--app-card); color: var(--app-text); }
  a { color: inherit; }

  .sidebar {
    width: 230px; background: var(--app-sidebar);
    border-right: 1px solid var(--app-border);
    position: fixed; top: 0; left: 0; bottom: 0; z-index: 200;
    transform: translateX(-100%);
    transition: transform 0.28s cubic-bezier(.4,0,.2,1), background-color .18s ease;
    display: flex; flex-direction: column;
    box-shadow: 2px 0 18px var(--app-shadow);
  }
  .sidebar.open { transform: translateX(0); }
  .topbar-menu-btn { display: flex; }
  .main-content { margin-left: 0; color: var(--app-text); }

  @media (min-width: 900px) {
    .sidebar { transform: translateX(0) !important; }
    .main-content { margin-left: 230px; }
    .topbar-menu-btn { display: none !important; }
  }

  .nav-item {
    padding: 10px 14px; border-radius: 10px; cursor: pointer;
    display: flex; align-items: center; gap: 10px;
    font-size: 13.5px; font-weight: 500; color: var(--app-text-muted);
    transition: all 0.15s; border: 1px solid transparent;
    margin-bottom: 3px; user-select: none; text-decoration: none;
  }
  .nav-item:hover { background: var(--app-subtle); color: var(--app-text); }
  .nav-item.active {
    background: rgba(139,92,246,0.13); color: #9F7AEA;
    font-weight: 600; border-color: rgba(139,92,246,0.25);
    box-shadow: 0 0 12px rgba(139,92,246,0.08);
  }

  .btn {
    padding: 9px 18px; border-radius: 10px; cursor: pointer;
    font-size: 13px; font-family: 'Plus Jakarta Sans', sans-serif;
    display: inline-flex; align-items: center; gap: 6px;
    transition: opacity 0.15s, transform 0.1s; border: none;
    font-weight: 600; white-space: nowrap;
  }
  .btn:hover { opacity: 0.86; }
  .btn:active { transform: scale(0.96); }
  .btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .btn-primary { background: linear-gradient(135deg, #7C3AED, #A855F7); color: #fff; box-shadow: 0 4px 18px rgba(124,58,237,0.27); }
  .btn-secondary { background: transparent; color: var(--app-text-muted); border: 1px solid var(--app-border) !important; }
  .btn-danger { background: transparent; color: #E5484D; border: 1px solid #E5484D55 !important; }
  .btn-ghost { background: transparent; color: var(--app-text-muted); padding: 6px 8px; }
  .btn-ghost:hover { color: var(--app-text); background: var(--app-subtle); }
  .btn-ghost.del:hover { color: #E5484D; }

  .input-field {
    width: 100%; padding: 10px 14px;
    background: var(--app-input); border: 1px solid var(--app-border);
    border-radius: 10px; color: var(--app-text); font-size: 14px;
    transition: border-color 0.2s, box-shadow 0.2s, background-color .18s ease;
  }
  .input-field:focus { outline: none; border-color: #8B5CF6; box-shadow: 0 0 0 3px rgba(139,92,246,0.14); }
  .input-field:hover { border-color: #8B5CF677; }

  .card {
    background: var(--app-card); border: 1px solid var(--app-border);
    border-radius: 16px; padding: 16px;
    transition: border-color 0.2s, box-shadow 0.2s, background-color .18s ease;
    max-width: 100%; overflow: hidden;
  }
  .card:hover { border-color: rgba(139,92,246,0.32); box-shadow: 0 5px 20px var(--app-shadow); }

  .tag {
    padding: 3px 9px; border-radius: 20px; font-size: 11px; font-weight: 600;
    background: rgba(139,92,246,0.13); color: #9F7AEA; border: 1px solid rgba(139,92,246,0.28);
  }
  .tag.sub { background: rgba(217,70,168,0.12); color: #E879C8; border-color: rgba(217,70,168,0.28); }
  .tag.green { background: rgba(47,176,96,0.13); color: #49C878; border-color: rgba(47,176,96,0.28); }

  .field-label {
    display: block; margin-bottom: 6px;
    color: var(--app-text-muted); font-size: 11px; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.8px;
  }
  .field-wrap { margin-bottom: 16px; }

  .modal-overlay {
    position: fixed; inset: 0; z-index: 500;
    background: var(--app-overlay); backdrop-filter: blur(8px);
    display: flex; align-items: center; justify-content: center; padding: 16px;
  }
  .modal-box {
    background: var(--app-card); border-radius: 20px;
    border: 1px solid var(--app-border);
    width: 100%; max-width: 680px;
    max-height: calc(100dvh - 32px);
    display: flex; flex-direction: column;
    box-shadow: 0 24px 64px var(--app-shadow);
  }
  .modal-header {
    padding: 18px 24px; border-bottom: 1px solid var(--app-border);
    display: flex; align-items: center; justify-content: space-between;
    background: var(--app-accent-glow-2); z-index: 1; flex-shrink: 0;
    border-radius: 20px 20px 0 0;
  }
  .modal-body { padding: 24px; overflow-y: auto; flex: 1; -webkit-overflow-scrolling: touch; color: var(--app-text); }

  .empty-state { text-align: center; padding: 60px 24px; color: var(--app-text-muted); }

  .role-chip {
    padding: 8px 12px; border-radius: 10px; cursor: pointer;
    display: flex; align-items: center; gap: 8px; font-size: 13px;
    border: 1px solid var(--app-border); background: transparent; color: var(--app-text-muted);
    transition: all 0.15s; user-select: none;
  }
  .role-chip.selected {
    border-color: rgba(139,92,246,0.45); background: rgba(139,92,246,0.12); color: #9F7AEA;
  }
  .member-pick {
    padding: 8px 12px; border-radius: 10px; cursor: pointer;
    display: flex; align-items: center; gap: 10px; font-size: 13.5px;
    border: 1px solid var(--app-border); background: transparent; transition: all 0.15s; color: var(--app-text);
  }
  .member-pick:hover { border-color: rgba(139,92,246,0.34); background: rgba(139,92,246,0.06); }
  .member-pick.selected { border-color: rgba(139,92,246,0.45); background: rgba(139,92,246,0.12); }

  .bar-bg { height: 6px; background: var(--app-hover); border-radius: 4px; overflow: hidden; margin-top: 6px; }
  .bar-fill { height: 100%; background: linear-gradient(90deg, #8B5CF6, #D946A8); border-radius: 4px; }

  .avatar {
    width: 44px; height: 44px; border-radius: 50%; flex-shrink: 0;
    background: rgba(139,92,246,0.14); border: 2px solid rgba(139,92,246,0.28);
    display: flex; align-items: center; justify-content: center;
    font-size: 17px; font-weight: 700; color: #9F7AEA; overflow: hidden;
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
    color: var(--app-text); background: var(--app-hover);
    transition: background 0.15s;
  }
  .song-item:hover { background: rgba(139,92,246,0.13); color: var(--app-text); }

  .scale-song-row {
    padding: 12px; background: var(--app-hover); border-radius: 10px; margin-bottom: 8px;
    border: 1px solid var(--app-border); color: var(--app-text);
  }

  .btn-whatsapp { background: #1FAD4A; color: #fff; }
  .btn-whatsapp:hover { opacity: 0.88; }

  .section-header {
    font-family: 'Plus Jakarta Sans', sans-serif; font-size: 11px; font-weight: 700;
    color: var(--app-text-muted); text-transform: uppercase; letter-spacing: 1.5px;
    margin-bottom: 10px; display: flex; align-items: center; gap: 8px;
  }

  .home-section { margin-top: 28px; text-align: left; }

  .audio-row {
    display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
    padding: 10px 12px; background: var(--app-input); border: 1px solid var(--app-border);
    border-radius: 10px;
  }
  .audio-row audio { height: 34px; max-width: 100%; }

  .appearance-popover { color: var(--app-text); }

  :root[data-theme='dark'] .topbar-surface { background: var(--app-topbar) !important; }
  :root[data-theme='dark'] [style*='background: rgb(255, 255, 255)'],
  :root[data-theme='dark'] [style*='background:#FFFFFF'] { background: var(--app-card) !important; }

  @keyframes spin { to { transform: rotate(360deg); } }
`;
