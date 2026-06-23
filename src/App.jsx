import { useState, useEffect } from "react";
import Papa from "papaparse";
import {
  Users, Music, BookOpen, Calendar, BarChart2,
  Plus, Edit2, Trash2, X, Check, Search, Youtube,
  Upload, Menu, AlertCircle, Eye, Share2, Cake, Clock
} from "lucide-react";

// ═══════════════════════════════════
// THEME & CONSTANTS (Refatorado para Variáveis CSS)
// ═══════════════════════════════════
const C = {
  bg:           'rgb(var(--bg))',
  bgSecondary:  'rgb(var(--bgSecondary))',
  bgCard:       'rgb(var(--bgCard))',
  bgHover:      'rgb(var(--bgHover))',
  bgInput:      'rgb(var(--bgInput))',
  accent:       'rgb(var(--accent))',
  accentAlt:    'rgb(var(--accentAlt))',
  accentDark:   'rgb(var(--accentDark))',
  accentGlow:   'rgba(var(--accent), 0.15)',
  accentGlow2:  'rgba(var(--accentAlt), 0.10)',
  border:       'rgb(var(--border))',
  textPrimary:  'rgb(var(--textPrimary))',
  textSecondary:'rgb(var(--textSecondary))',
  danger:       'rgb(var(--danger))',
  success:      'rgb(var(--success))',
  blue:         'rgb(var(--blue))',
  
  // Helpers de opacidade para estilos inline
  accent44:        'rgba(var(--accent), 0.26)',
  accent33:        'rgba(var(--accent), 0.20)',
  accent22:        'rgba(var(--accent), 0.13)',
  accent88:        'rgba(var(--accent), 0.53)',
  danger44:        'rgba(var(--danger), 0.26)',
  danger18:        'rgba(var(--danger), 0.09)',
  textSecondary44: 'rgba(var(--textSecondary), 0.26)',
};

const ROLES = [
  { key: 'bateria',   label: 'Bateria',   emoji: '🥁' },
  { key: 'baixo',     label: 'Baixo',     emoji: '🎸' },
  { key: 'violao',    label: 'Violão',    emoji: '🎵' },
  { key: 'guitarra',  label: 'Guitarra',  emoji: '🎸' },
  { key: 'teclado',   label: 'Teclado',   emoji: '🎹' },
  { key: 'ministro',  label: 'Ministro',  emoji: '✨' },
  { key: 'tenor',     label: 'Tenor',     emoji: '🎙️' },
  { key: 'soprano',   label: 'Soprano',   emoji: '🎙️' },
  { key: 'contralto', label: 'Contralto', emoji: '🎙️' },
];

const NAV = [
  { id: 'home',    label: 'Início',     emoji: '🏠' },
  { id: 'members', label: 'Membros',    emoji: '👥' },
  { id: 'groups',  label: 'Grupos',     emoji: '🎸' },
  { id: 'songs',   label: 'Repertório', emoji: '🎵' },
  { id: 'scales',  label: 'Escalas',    emoji: '📅' },
  { id: 'reports', label: 'Relatórios', emoji: '📊' },
];

const GLOBAL_CSS = `
 :root {
   /* Variáveis base - Tema Escuro Padrão */
   --bg: 4, 5, 13;
   --bgSecondary: 7, 9, 26;
   --bgCard: 12, 14, 31;
   --bgHover: 17, 20, 40;
   --bgInput: 6, 8, 18;
   --accent: 167, 139, 250;
   --accentDark: 99, 57, 255;
   --accentAlt: 244, 114, 182;
   --border: 26, 29, 58;
   --textPrimary: 238, 240, 255;
   --textSecondary: 90, 100, 144;
   --danger: 248, 113, 113;
   --success: 74, 222, 128;
   --blue: 96, 165, 250;
   
   --shadowCard: rgba(99,57,255,0.08);
   --btnPrimaryShadow: rgba(99,57,255,0.35);
   --modalOverlay: rgba(0,0,5,0.80);
   --selectOptionBg: rgba(255,255,255,0.025);
   --cardBorderHover: rgba(167,139,250,0.25);
 }

 [data-theme="light"] {
   /* Variáveis base - Tema Claro */
   --bg: 244, 245, 249;
   --bgSecondary: 255, 255, 255;
   --bgCard: 255, 255, 255;
   --bgHover: 238, 240, 245;
   --bgInput: 255, 255, 255;
   --accent: 124, 58, 237;
   --accentDark: 91, 33, 182;
   --accentAlt: 219, 39, 119;
   --border: 203, 213, 225;
   --textPrimary: 15, 23, 42;
   --textSecondary: 100, 116, 139;
   --danger: 239, 68, 68;
   --success: 34, 197, 94;
   --blue: 59, 130, 246;
   
   --shadowCard: rgba(0,0,0,0.05);
   --btnPrimaryShadow: rgba(124,58,237,0.3);
   --modalOverlay: rgba(0,0,0,0.5);
   --selectOptionBg: rgba(0,0,0,0.05);
   --cardBorderHover: rgba(124,58,237,0.4);
 }

 @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
 *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
 html, body, #root { width: 100%; max-width: 100vw; overflow-x: hidden; }
 html, body {
   background: rgb(var(--bg));
   font-family: 'Plus Jakarta Sans', sans-serif;
   color: rgb(var(--textPrimary));
   -webkit-tap-highlight-color: transparent;
   -webkit-overflow-scrolling: touch;
   background-image: radial-gradient(ellipse 60% 40% at 15% 0%, rgba(var(--accentDark),0.10) 0%, transparent 70%), radial-gradient(ellipse 40% 50% at 85% 80%, rgba(var(--accentAlt),0.08) 0%, transparent 70%); background-attachment: fixed;
 }
 ::-webkit-scrollbar { width: 5px; height: 5px; }
 ::-webkit-scrollbar-track { background: transparent; }
 ::-webkit-scrollbar-thumb { background: rgb(var(--border)); border-radius: 4px; }
 ::-webkit-scrollbar-thumb:hover { background: rgba(var(--accent), 0.33); }
 input, select, textarea, button { font-family: 'Plus Jakarta Sans', sans-serif; }
 input::placeholder, textarea::placeholder { color: rgb(var(--textSecondary)); }
 select option { background: var(--selectOptionBg); color: rgb(var(--textPrimary)); }
 a { color: inherit; }

 .sidebar {
   width: 230px; background: rgba(var(--bgSecondary),0.85);
   border-right: 1px solid rgba(var(--accent),0.10);
   position: fixed; top: 0; left: 0; bottom: 0; z-index: 200;
   transform: translateX(-100%);
   transition: transform 0.28s cubic-bezier(.4,0,.2,1);
   display: flex; flex-direction: column;
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
   font-size: 13.5px; font-weight: 500; color: rgb(var(--textSecondary));
   transition: all 0.15s; border: 1px solid transparent;
   margin-bottom: 3px; user-select: none;
 }
 .nav-item:hover { background: rgba(var(--textPrimary),0.04); color: rgb(var(--accent)); }
 .nav-item.active {
   background: rgba(var(--accentDark),0.15); color: rgb(var(--accent));
   font-weight: 600; border-color: rgba(var(--accent),0.25);
   box-shadow: 0 0 16px rgba(var(--accentDark),0.10);
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
 .btn-primary { background: linear-gradient(135deg, rgb(var(--accentDark)), rgb(var(--accent))); color: #fff; box-shadow: 0 4px 18px var(--btnPrimaryShadow); }
 .btn-secondary { background: transparent; color: rgb(var(--textSecondary)); border: 1px solid rgba(var(--textPrimary),0.07) !important; }
 .btn-danger { background: transparent; color: rgb(var(--danger)); border: 1px solid rgba(var(--danger),0.26) !important; }
 .btn-ghost { background: transparent; color: rgb(var(--textSecondary)); padding: 6px 8px; }
 .btn-ghost:hover { color: rgb(var(--textPrimary)); background: rgba(var(--textPrimary),0.04); }
 .btn-ghost.del:hover { color: rgb(var(--danger)); }

 .input-field {
   width: 100%; padding: 10px 14px;
   background: rgb(var(--bgInput)); border: 1px solid rgb(var(--border));
   border-radius: 10px; color: rgb(var(--textPrimary)); font-size: 14px;
   transition: border-color 0.2s, box-shadow 0.2s;
 }
 .input-field:focus { outline: none; border-color: rgb(var(--accent)); box-shadow: 0 0 0 3px rgba(var(--accent),0.12); }
 .input-field:hover { border-color: rgba(var(--accent),0.33); }

 .card {
   background: rgba(var(--bgCard),0.6); border: 1px solid rgba(var(--textPrimary),0.07);
   border-radius: 16px; padding: 16px;
   transition: border-color 0.2s, box-shadow 0.2s;
   backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
   max-width: 100%; overflow: hidden;
 }
 .card:hover { border-color: var(--cardBorderHover); box-shadow: 0 4px 24px var(--shadowCard); }

 .tag {
   padding: 3px 9px; border-radius: 20px; font-size: 11px; font-weight: 600;
   background: rgba(var(--accent),0.15); color: rgb(var(--accent)); border: 1px solid rgba(var(--accent),0.30);
 }
 .tag.sub { background: rgba(var(--accentAlt),0.13); color: rgb(var(--accentAlt)); border-color: rgba(var(--accentAlt),0.30); }
 .tag.green { background: rgba(var(--success),0.13); color: rgb(var(--success)); border-color: rgba(var(--success),0.30); }

 .field-label {
   display: block; margin-bottom: 6px;
   color: rgb(var(--textSecondary)); font-size: 11px; font-weight: 700;
   text-transform: uppercase; letter-spacing: 0.8px;
 }
 .field-wrap { margin-bottom: 16px; }

 .modal-overlay {
   position: fixed; inset: 0; z-index: 500;
   background: var(--modalOverlay); backdrop-filter: blur(8px);
   display: flex; align-items: center; justify-content: center; padding: 16px;
 }
 .modal-box {
   background: rgb(var(--bgCard)); border-radius: 20px;
   border: 1px solid rgba(var(--accent),0.18);
   width: 100%; max-width: 680px;
   max-height: calc(100dvh - 32px);
   display: flex; flex-direction: column;
   box-shadow: 0 32px 80px rgba(0,0,0,0.7);
 }
 .modal-header {
   padding: 18px 24px; border-bottom: 1px solid rgba(var(--accent),0.10);
   display: flex; align-items: center; justify-content: space-between;
   background: rgba(var(--accentDark),0.06); z-index: 1; flex-shrink: 0;
   border-radius: 20px 20px 0 0;
 }
 .modal-body { padding: 24px; overflow-y: auto; flex: 1; -webkit-overflow-scrolling: touch; }

 .empty-state { text-align: center; padding: 60px 24px; color: rgb(var(--textSecondary)); }

 .role-chip {
   padding: 8px 12px; border-radius: 10px; cursor: pointer;
   display: flex; align-items: center; gap: 8px; font-size: 13px;
   border: 1px solid rgb(var(--border)); background: transparent; color: rgb(var(--textSecondary));
   transition: all 0.15s; user-select: none;
 }
 .role-chip.selected {
   border-color: rgba(var(--accent),0.5); background: rgba(var(--accent),0.12); color: rgb(var(--accent));
 }
 .member-pick {
   padding: 8px 12px; border-radius: 10px; cursor: pointer;
   display: flex; align-items: center; gap: 10px; font-size: 13.5px;
   border: 1px solid rgb(var(--border)); background: transparent; transition: all 0.15s;
 }
 .member-pick:hover { border-color: rgba(var(--accent),0.35); background: rgba(var(--textPrimary),0.04); }
 .member-pick.selected { border-color: rgba(var(--accent),0.5); background: rgba(var(--accent),0.12); }

 .bar-bg { height: 6px; background: rgb(var(--bgHover)); border-radius: 4px; overflow: hidden; margin-top: 6px; }
 .bar-fill { height: 100%; background: linear-gradient(90deg, rgb(var(--accentDark)), rgb(var(--accentAlt))); border-radius: 4px; }

 .avatar {
   width: 44px; height: 44px; border-radius: 50%; flex-shrink: 0;
   background: rgba(var(--accentDark),0.20); border: 2px solid rgba(var(--accent),0.30);
   display: flex; align-items: center; justify-content: center;
   font-size: 17px; font-weight: 700; color: rgb(var(--accent)); overflow: hidden;
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
   color: rgb(var(--textPrimary)); background: rgba(var(--textPrimary),0.04);
   transition: background 0.15s;
 }
 .song-item:hover { background: rgba(var(--accent),0.10); }

 .scale-song-row {
   padding: 12px; background: rgba(var(--textPrimary),0.04); border-radius: 10px; margin-bottom: 8px;
   border: 1px solid rgba(var(--textPrimary),0.06);
 }

 .btn-whatsapp { background: #1FAD4A; color: #fff; }
 .btn-whatsapp:hover { opacity: 0.85; }

 .archive-divider {
   display: flex; align-items: center; gap: 10px; margin: 4px 0;
   color: rgb(var(--textSecondary)); font-size: 12px; cursor: pointer;
   padding: 6px 0; user-select: none;
 }
 .archive-divider:hover { color: rgb(var(--textPrimary)); }

 .section-header {
   font-family: 'Plus Jakarta Sans', sans-serif; font-size: 11px; font-weight: 700;
   color: rgb(var(--textSecondary)); text-transform: uppercase; letter-spacing: 1.5px;
   margin-bottom: 10px; display: flex; align-items: center; gap: 8px;
 }

 .home-section { margin-top: 28px; text-align: left; }

 .birthday-chip {
   display: flex; align-items: center; gap: 10px;
   padding: 8px 12px; background: rgba(var(--textPrimary),0.025); border: 1px solid rgba(var(--textPrimary),0.07);
   border-radius: 10px; font-size: 13px;
 }
 .birthday-chip:hover { border-color: rgba(var(--accent),0.25); }

 @keyframes spin { to { transform: rotate(360deg); } }
`;

// ═══════════════════════════════════
// FIREBASE FIRESTORE (REST API)
// ═══════════════════════════════════
const FB = 'https://firestore.googleapis.com/v1/projects/oitavamusicbetim/databases/(default)/documents/oitava';

async function dbGet(docId) {
  try {
    const res = await fetch(`${FB}/${docId}`);
    if (!res.ok) return null;
    const json = await res.json();
    const val = json.fields?.data?.stringValue;
    return val ? JSON.parse(val) : null;
  } catch { return null; }
}

async function dbSet(docId, val) {
  try {
    await fetch(`${FB}/${docId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: { data: { stringValue: JSON.stringify(val) } } }),
    });
  } catch {}
}

const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2);
const fmtDate = d => d ? new Date(d + 'T12:00:00').toLocaleDateString('pt-BR') : '—';
const shortName = name => {
  const parts = (name || '').trim().split(/\s+/);
  if (parts.length <= 2) return name;
  return `${parts[0]} ${parts[parts.length - 1]}`;
};

// ═══════════════════════════════════
// WHATSAPP SHARE HELPER
// ═══════════════════════════════════
function buildWhatsAppText(sc, members, groups, songs) {
  const group = groups.find(g => g.id === sc.groupId);
  const scMembers = (sc.scaleMembers || [])
    .map(sm => ({ ...sm, member: members.find(m => m.id === sm.memberId) }))
    .filter(x => x.member);
  const scSongs = (sc.scaleSongs || [])
    .map(ss => ({ ...ss, song: songs.find(s => s.id === ss.songId) }))
    .filter(x => x.song);

  let txt = `🎵 *${sc.name}*\n`;
  txt += `📅 *Data:* ${fmtDate(sc.date)}\n`;
  if (group) txt += `🎸 *Grupo:* ${group.name}\n`;
  txt += `\n`;

  if (scMembers.length > 0) {
    txt += `*👥 Integrantes:*\n`;
    scMembers.forEach(x => {
      const activeRoles = x.roles || (x.role ? [x.role] : []);
      const roleLabel = activeRoles.length > 0
        ? activeRoles.map(r => { const ro = ROLES.find(ro => ro.key === r); return ro ? `${ro.emoji} ${ro.label}` : null; }).filter(Boolean).join(' + ')
        : ((x.member.roles || []).map(r => ROLES.find(ro => ro.key === r)?.label).filter(Boolean).join(', '));
      txt += `• ${shortName(x.member.name)}${roleLabel ? ` — ${roleLabel}` : ''}\n`;
    });
    txt += `\n`;
  }

  const getYtId = url => {
    if (!url) return null;
    const m = url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return m ? m[1] : null;
  };

  if (scSongs.length > 0) {
    txt += `*🎵 Repertório:*\n`;
    const playlistIds = [];

    scSongs.forEach((x, i) => {
      txt += `${i + 1}. *${x.song.name}*`;
      if (x.key) txt += ` — Tom: ${x.key}`;
      if (x.song.bpm) txt += ` | BPM: ${x.song.bpm}`;
      if (x.soloMemberId) {
        const soloist = members.find(m => m.id === x.soloMemberId);
        if (soloist) {
          const vocalRole = (soloist.roles || []).find(r => ['tenor','soprano','contralto'].includes(r));
          const roleLabel = vocalRole ? ROLES.find(ro => ro.key === vocalRole)?.label : '';
          txt += ` | 🎙️ Solo: ${shortName(soloist.name)}${roleLabel ? ` (${roleLabel})` : ''}`;
        }
      }
      if (x.notes) txt += ` | ${x.notes}`;

      const ytId = getYtId(x.song.youtubeUrl);
      if (ytId) {
        playlistIds.push(ytId);
      }
      txt += `\n`;
    });

    if (playlistIds.length > 0) {
      const joinedIds = playlistIds.join(',');
      txt += `\n▶️ *Playlist:* https://www.youtube.com/watch_videos?video_ids=${joinedIds}\n`;
    }
  }

  return txt;
}

function shareToWhatsApp(sc, members, groups, songs) {
  const text = buildWhatsAppText(sc, members, groups, songs);
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
}

// ═══════════════════════════════════
// REUSABLE UI
// ═══════════════════════════════════

function Btn({ children, variant = 'primary', className = '', ...p }) {
  return <button className={`btn btn-${variant} ${className}`} {...p}>{children}</button>;
}

function Field({ label, children }) {
  return <div className="field-wrap">{label && <label className="field-label">{label}</label>}{children}</div>;
}

function Inp({ label, ...p }) {
  return <Field label={label}><input className="input-field" {...p} /></Field>;
}

function Modal({ title, onClose, wide, children }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: wide ? 680 : 460 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 16, fontWeight: 800, color: C.accent }}>{title}</h2>
          <Btn variant="ghost" onClick={onClose} style={{ padding: 4 }}><X size={18} /></Btn>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

function Confirm({ msg, onOk, onCancel }) {
  return (
    <div className="modal-overlay" style={{ zIndex: 900 }}>
      <div className="modal-box" style={{ maxWidth: 340, borderRadius: 14, height: 'auto', display: 'block' }}>
        <div className="modal-body" style={{ textAlign: 'center', padding: 28 }}>
          <AlertCircle size={32} color={C.danger} style={{ marginBottom: 12 }} />
          <p style={{ color: C.textPrimary, marginBottom: 20 }}>{msg}</p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            <Btn variant="secondary" onClick={onCancel}>Cancelar</Btn>
            <Btn variant="danger" onClick={onOk}><Trash2 size={14} />Excluir</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

function Avatar({ member, size = 44 }) {
  return (
    <div className="avatar" style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {member.photo ? <img src={member.photo} alt="" /> : (member.name?.[0] || '?')}
    </div>
  );
}

// ─── Logo ───────────────────────────────────────────────────
const LOGO_HOME = "/icon-512.png"; 
const LOGO_SIDEBAR = "/icon-192.png";

// ─── Pages ─────────────────────────────────────────────────

function HomePage({ counts, scales, members, groups, onNav }) {
  const today = new Date().toISOString().split('T')[0];
  const thisMonth = new Date().getMonth() + 1;

  const upcoming = [...scales]
    .filter(s => s.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5);

  const birthdayMembers = members
    .filter(m => {
      if (!m.birthdate) return false;
      const month = parseInt(m.birthdate.split('-')[1], 10);
      return month === thisMonth;
    })
    .sort((a, b) => {
      const da = parseInt(a.birthdate.split('-')[2], 10);
      const db = parseInt(b.birthdate.split('-')[2], 10);
      return da - db;
    });

  const today2 = new Date();
  const isToday = (birthdate) => {
    if (!birthdate) return false;
    const [, m, d] = birthdate.split('-').map(Number);
    return m === today2.getMonth() + 1 && d === today2.getDate();
  };

  return (
    <div style={{ padding: '40px 24px', maxWidth: 580, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{
          width: 88, height: 88, borderRadius: '50%', margin: '0 auto 20px',
          overflow: 'hidden', border: `2px solid ${C.accent}`,
          boxShadow: `0 12px 40px ${C.accentGlow}`,
        }}>
          <img src={LOGO_HOME} alt="Oitava Music" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <h1 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800, fontSize: 22, color: C.accent, marginBottom: 4, letterSpacing: '-0.5px' }}>Oitava Music Betim</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 8 }}>
        {[
          { emoji: '👥', label: 'Membros',    val: counts.members,  sub: 'cadastrado', page: 'members' },
          { emoji: '🎸', label: 'Grupos',     val: counts.groups,   sub: 'formado',    page: 'groups'  },
          { emoji: '🎵', label: 'Repertório', val: counts.songs,    sub: 'música',     page: 'songs'   },
          { emoji: '📅', label: 'Escalas',    val: counts.scales,   sub: 'criada',     page: 'scales'  },
        ].map(item => (
          <div key={item.label} className="card" style={{ textAlign: 'left', cursor: 'pointer' }} onClick={() => onNav(item.page)}>
            <div style={{ fontSize: 20, marginBottom: 6 }}>{item.emoji}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: C.accent, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{item.val}</div>
            <div style={{ fontSize: 11.5, color: C.textSecondary, marginTop: 2 }}>
              {item.label} {item.val !== 1 ? item.sub + 's' : item.sub}
            </div>
          </div>
        ))}
      </div>

      <div className="home-section">
        <div className="section-header">
          <Clock size={14} />{upcoming.length > 0 ? 'Próximas Escalas' : 'Escalas'}
        </div>
        {upcoming.length === 0 ? (
          <div style={{ padding: '16px', background: C.bgCard, borderRadius: 10, border: `1px solid ${C.border}`, fontSize: 13, color: C.textSecondary, textAlign: 'center' }}>
            Nenhuma escala agendada
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 8 }}>
            {upcoming.map(sc => {
              const g = groups.find(x => x.id === sc.groupId);
              const daysUntil = Math.ceil((new Date(sc.date + 'T12:00:00') - new Date()) / (1000 * 60 * 60 * 24));
              return (
                <div key={sc.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, cursor: 'pointer' }} onClick={() => onNav('scales')}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 700, color: C.textPrimary, fontSize: 14, marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sc.name}</div>
                    <div style={{ fontSize: 12, color: C.textSecondary, display: 'flex', alignItems: 'center', gap: 8 }}>
                      📅 {fmtDate(sc.date)}
                      {g && <span className="tag" style={{ fontSize: 10 }}>{g.name}</span>}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    {daysUntil === 0
                      ? <span style={{ fontSize: 12, fontWeight: 700, color: C.success }}>Hoje!</span>
                      : daysUntil === 1
                      ? <span style={{ fontSize: 12, fontWeight: 600, color: C.accent }}>Amanhã</span>
                      : <span style={{ fontSize: 12, color: C.textSecondary }}>{daysUntil}d</span>
                    }
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="home-section">
        <div className="section-header">
          <Cake size={14} />Aniversariantes do Mês
        </div>
        {birthdayMembers.length === 0 ? (
          <div style={{ padding: '16px', background: C.bgCard, borderRadius: 10, border: `1px solid ${C.border}`, fontSize: 13, color: C.textSecondary, textAlign: 'center' }}>
            Nenhum aniversariante este mês
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 8 }}>
            {birthdayMembers.map(m => {
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
                      {(m.roles || []).map(r => ROLES.find(x => x.key === r)?.label).filter(Boolean).join(', ') || 'Sem função'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: isBday ? C.accent : C.textPrimary, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{day}</div>
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

// ─── Members ────────────────────────────────────────────────

function MembersPage({ members, setMembers }) {
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [form, setForm] = useState({ name: '', birthdate: '', email: '', phone: '', photo: '', roles: [] });
  const [importModal, setImportModal] = useState(false);
  const [preview, setPreview] = useState([]);

  const normalizeStr = (str) => {
    return (str || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
  };

  const openAdd = () => { setForm({ name: '', birthdate: '', email: '', phone: '', photo: '', roles: [] }); setModal('add'); };
  const openEdit = m => { setForm({ ...m, roles: [...(m.roles || [])] }); setModal(m); };

  const handlePhoto = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 300;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX_SIZE) { height = Math.round((height * MAX_SIZE) / width); width = MAX_SIZE; }
        } else {
          if (height > MAX_SIZE) { width = Math.round((width * MAX_SIZE) / height); height = MAX_SIZE; }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
        setForm(f => ({ ...f, photo: compressedBase64 }));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const toggleRole = key => setForm(f => ({
    ...f, roles: f.roles.includes(key) ? f.roles.filter(r => r !== key) : [...f.roles, key]
  }));

  const save = () => {
    if (!form.name.trim() || !form.birthdate) return;
    if (modal === 'add') setMembers(p => [...p, { ...form, id: genId() }]);
    else setMembers(p => p.map(m => m.id === form.id ? { ...form } : m));
    setModal(null);
  };
  const del = id => { setMembers(p => p.filter(m => m.id !== id)); setConfirm(null); };

  const handleCSV = e => {
    const file = e.target.files[0]; if (!file) return;
    Papa.parse(file, {
      header: true, skipEmptyLines: true,
      complete: ({ data }) => {
        const rows = data.map(row => {
          const keys = Object.keys(row);
          const nk = keys.find(k => /nome|name/i.test(k)) || keys[0];
          const ek = keys.find(k => /email|e-mail/i.test(k));
          const pk = keys.find(k => /tel|celular|phone/i.test(k));
          const bk = keys.find(k => /nasc|data|birth|aniv/i.test(k));
          const rk = keys.find(k => /fun[cç][oõ]es|cargo|role/i.test(k));
          let parsedRoles = [];
          if (rk && row[rk]) {
            const str = row[rk].toLowerCase();
            ROLES.forEach(r => { if (str.includes(r.key) || str.includes(r.label.toLowerCase())) parsedRoles.push(r.key); });
          }
          let rawDate = bk ? row[bk]?.trim() || '' : '';
          let formattedDate = '';
          if (rawDate.includes('/')) {
            const parts = rawDate.split('/');
            if (parts.length === 3) {
              const dia = parts[0].padStart(2, '0');
              const mes = parts[1].padStart(2, '0');
              const ano = parts[2].trim();
              const anoCompleto = ano.length === 2 ? (parseInt(ano) > 30 ? '19' : '20') + ano : ano;
              formattedDate = `${anoCompleto}-${mes}-${dia}`;
            }
          } else { formattedDate = rawDate; }
          return {
            name: row[nk]?.trim() || '',
            email: ek ? row[ek]?.trim() || '' : '',
            phone: pk ? row[pk]?.trim() || '' : '',
            birthdate: formattedDate,
            roles: parsedRoles,
            photo: ''
          };
        }).filter(r => r.name);
        setPreview(rows);
      }
    });
    e.target.value = '';
  };

  const doImport = () => {
    setMembers(prevMembers => {
      let updatedList = [...prevMembers];
      preview.forEach(importedMember => {
        const existingIndex = updatedList.findIndex(m => normalizeStr(m.name) === normalizeStr(importedMember.name));
        if (existingIndex >= 0) {
          updatedList[existingIndex] = {
            ...updatedList[existingIndex],
            birthdate: importedMember.birthdate || updatedList[existingIndex].birthdate,
            email: importedMember.email || updatedList[existingIndex].email,
            phone: importedMember.phone || updatedList[existingIndex].phone,
            roles: importedMember.roles.length > 0 ? importedMember.roles : updatedList[existingIndex].roles
          };
        } else {
          updatedList.push({ ...importedMember, id: genId() });
        }
      });
      return updatedList;
    });
    setImportModal(false); setPreview([]);
  };

  const filtered = members
    .filter(m => normalizeStr(m.name).includes(normalizeStr(search)))
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' }));

  return (
    <div style={{ padding: 24, maxWidth: 860 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap:
