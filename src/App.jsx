import { useState, useEffect } from "react";
import Papa from "papaparse";
import {
Users, Music, BookOpen, Calendar, BarChart2,
Plus, Edit2, Trash2, X, Check, Search, Youtube,
Upload, Menu, AlertCircle, Eye, Share2, Cake, Clock
} from "lucide-react";

// ═══════════════════════════════════
// THEME & CONSTANTS
// ═══════════════════════════════════
const C = {
bg:           '#1e1525',
bgSecondary:  '#251830',
bgCard:       '#2d1f3a',
bgHover:      '#362548',
bgInput:      '#1a1020',
accent:       '#c084fc',
accentAlt:    '#f08070',
accentDark:   '#9333ea',
accentGlow:   'rgba(192,132,252,0.15)',
accentGlow2:  'rgba(240,128,112,0.12)',
border:       '#3d2a52',
textPrimary:  '#f5eeff',
textSecondary:'#8870a8',
danger:       '#f87171',
success:      '#4ade80',
blue:         '#60a5fa',
};

const ROLES = [
{ key: 'bateria',   label: 'Bateria',   emoji: '🥁' },
{ key: 'baixo',     label: 'Baixo',     emoji: '🎸' },
{ key: 'violao',    label: 'Violão',    emoji: '🎵' },
{ key: 'guitarra',  label: 'Guitarra',  emoji: '🎸' },
{ key: 'teclado',   label: 'Teclado',   emoji: '🎹' },
{ key: 'vocal',     label: 'Vocal',     emoji: '🎤' },
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
 @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@800;900&family=Nunito:ital,wght@0,300;0,400;0,600;0,700;1,400&display=swap');
 *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
 html, body, #root { width: 100%; max-width: 100vw; overflow-x: hidden; }
 html, body {
   background: #1e1525;
   font-family: 'Nunito', sans-serif;
   color: #f5eeff;
   -webkit-tap-highlight-color: transparent;
   -webkit-overflow-scrolling: touch;
   background-image:
     radial-gradient(ellipse 70% 50% at 0% 0%, rgba(240,128,112,0.12) 0%, transparent 60%),
     radial-gradient(ellipse 60% 50% at 100% 100%, rgba(147,51,234,0.14) 0%, transparent 60%);
   background-attachment: fixed;
 }
 ::-webkit-scrollbar { width: 5px; height: 5px; }
 ::-webkit-scrollbar-track { background: transparent; }
 ::-webkit-scrollbar-thumb { background: #3d2a52; border-radius: 4px; }
 ::-webkit-scrollbar-thumb:hover { background: #c084fc55; }
 input, select, textarea, button { font-family: 'Nunito', sans-serif; }
 input::placeholder, textarea::placeholder { color: #8870a8; }
 select option { background: #2d1f3a; color: #f5eeff; }
 a { color: inherit; }

 /* ── Fix date picker icon visibility ── */
 input[type="date"] { color-scheme: dark; }
 input[type="date"]::-webkit-calendar-picker-indicator {
   filter: invert(80%) sepia(20%) saturate(400%) hue-rotate(240deg) brightness(1.2);
   cursor: pointer; opacity: 0.8;
 }
 input[type="date"]::-webkit-calendar-picker-indicator:hover { opacity: 1; }

 .sidebar {
   width: 240px;
   background: rgba(30,21,37,0.92);
   backdrop-filter: blur(24px);
   -webkit-backdrop-filter: blur(24px);
   border-right: 1px solid rgba(192,132,252,0.12);
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
   .main-content { margin-left: 240px; }
   .topbar-menu-btn { display: none !important; }
 }

 .nav-item {
   padding: 10px 14px; border-radius: 10px; cursor: pointer;
   display: flex; align-items: center; gap: 10px;
   font-size: 13.5px; font-weight: 500; color: #8870a8;
   transition: all 0.15s; border: 1px solid transparent;
   margin-bottom: 3px; user-select: none;
 }
 .nav-item:hover { background: rgba(255,255,255,0.05); color: #d4b8f0; border-color: rgba(255,255,255,0.06); }
 .nav-item.active {
   background: rgba(192,132,252,0.15); color: #c084fc;
   font-weight: 600; border-color: rgba(192,132,252,0.30);
   box-shadow: 0 0 16px rgba(147,51,234,0.12);
 }

 .btn {
   padding: 9px 18px; border-radius: 10px; cursor: pointer;
   font-size: 13px; font-family: 'Nunito', sans-serif;
   display: inline-flex; align-items: center; gap: 6px;
   transition: opacity 0.15s, transform 0.1s; border: none;
   font-weight: 600; white-space: nowrap;
 }
 .btn:hover { opacity: 0.82; }
 .btn:active { transform: scale(0.96); }
 .btn-primary { background: linear-gradient(135deg, #9333ea, #c084fc); color: #fff; box-shadow: 0 4px 18px rgba(147,51,234,0.35); }
 .btn-secondary { background: transparent; color: #8870a8; border: 1px solid #3d2a52 !important; }
 .btn-danger { background: transparent; color: #f87171; border: 1px solid #f8717144 !important; }
 .btn-ghost { background: transparent; color: #8870a8; padding: 6px 8px; }
 .btn-ghost:hover { color: #f5eeff; background: rgba(255,255,255,0.06); }
 .btn-ghost.del:hover { color: #f87171; }

 .input-field {
   width: 100%; padding: 10px 14px;
   background: #1a1020; border: 1px solid #3d2a52;
   border-radius: 10px; color: #f5eeff; font-size: 14px;
   transition: border-color 0.2s, box-shadow 0.2s;
 }
 .input-field:focus { outline: none; border-color: #c084fc; box-shadow: 0 0 0 3px rgba(192,132,252,0.14); }
 .input-field:hover { border-color: #c084fc55; }

 .card {
   background: rgba(255,255,255,0.04);
   border: 1px solid rgba(255,255,255,0.08);
   border-radius: 16px; padding: 16px;
   transition: border-color 0.2s, box-shadow 0.2s;
   backdrop-filter: blur(10px);
   -webkit-backdrop-filter: blur(10px);
   max-width: 100%; overflow: hidden;
 }
 .card:hover { border-color: rgba(192,132,252,0.28); box-shadow: 0 4px 24px rgba(147,51,234,0.10); }

 .tag {
   padding: 3px 9px; border-radius: 20px; font-size: 11px; font-weight: 600;
   background: rgba(192,132,252,0.15); color: #c084fc; border: 1px solid rgba(192,132,252,0.32);
 }
 .tag.sub { background: rgba(240,128,112,0.14); color: #f08878; border-color: rgba(240,128,112,0.32); }
 .tag.green { background: rgba(74,222,128,0.13); color: #4ade80; border-color: rgba(74,222,128,0.30); }

 .field-label {
   display: block; margin-bottom: 6px;
   color: #8870a8; font-size: 11px; font-weight: 700;
   text-transform: uppercase; letter-spacing: 0.8px;
 }
 .field-wrap { margin-bottom: 16px; }

 .modal-overlay {
   position: fixed; inset: 0; z-index: 500;
   background: rgba(10,5,18,0.82); backdrop-filter: blur(10px);
   display: flex; align-items: center; justify-content: center; padding: 16px;
 }
 .modal-box {
   background: #251830; border-radius: 20px;
   border: 1px solid rgba(192,132,252,0.20);
   width: 100%; max-width: 680px;
   max-height: calc(100dvh - 32px);
   display: flex; flex-direction: column;
   box-shadow: 0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(192,132,252,0.08);
 }
 .modal-header {
   padding: 18px 24px; border-bottom: 1px solid rgba(192,132,252,0.12);
   display: flex; align-items: center; justify-content: space-between;
   background: rgba(147,51,234,0.07); z-index: 1; flex-shrink: 0;
   border-radius: 20px 20px 0 0;
 }
 .modal-body { padding: 24px; overflow-y: auto; flex: 1; -webkit-overflow-scrolling: touch; }

 .empty-state { text-align: center; padding: 60px 24px; color: #8870a8; }

 .role-chip {
   padding: 8px 12px; border-radius: 10px; cursor: pointer;
   display: flex; align-items: center; gap: 8px; font-size: 13px;
   border: 1px solid #3d2a52; background: transparent; color: #8870a8;
   transition: all 0.15s; user-select: none;
 }
 .role-chip.selected { border-color: rgba(192,132,252,0.55); background: rgba(192,132,252,0.13); color: #c084fc; }

 .member-pick {
   padding: 8px 12px; border-radius: 10px; cursor: pointer;
   display: flex; align-items: center; gap: 10px; font-size: 13.5px;
   border: 1px solid #3d2a52; background: transparent; transition: all 0.15s;
 }
 .member-pick:hover { border-color: rgba(192,132,252,0.38); background: rgba(192,132,252,0.07); }
 .member-pick.selected { border-color: rgba(192,132,252,0.55); background: rgba(192,132,252,0.13); }

 .bar-bg { height: 6px; background: #2d1f3a; border-radius: 4px; overflow: hidden; margin-top: 6px; }
 .bar-fill { height: 100%; background: linear-gradient(90deg, #f08070, #c084fc); border-radius: 4px; }

 .avatar {
   width: 44px; height: 44px; border-radius: 50%; flex-shrink: 0;
   background: rgba(192,132,252,0.18); border: 2px solid rgba(192,132,252,0.35);
   display: flex; align-items: center; justify-content: center;
   font-size: 17px; font-weight: 700; color: #c084fc; overflow: hidden;
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
   color: #f5eeff; background: rgba(255,255,255,0.05); transition: background 0.15s;
 }
 .song-item:hover { background: rgba(192,132,252,0.12); }

 .scale-song-row {
   padding: 12px; background: rgba(255,255,255,0.04); border-radius: 10px; margin-bottom: 8px;
   border: 1px solid rgba(255,255,255,0.07);
 }

 .btn-whatsapp { background: #1FAD4A; color: #fff; }
 .btn-whatsapp:hover { opacity: 0.85; }

 .archive-divider {
   display: flex; align-items: center; gap: 10px; margin: 4px 0;
   color: #8870a8; font-size: 12px; cursor: pointer; padding: 6px 0; user-select: none;
 }
 .archive-divider:hover { color: #f5eeff; }

 .section-header {
   font-family: 'Montserrat', sans-serif; font-size: 11px; font-weight: 800;
   color: #8870a8; text-transform: uppercase; letter-spacing: 1.5px;
   margin-bottom: 10px; display: flex; align-items: center; gap: 8px;
 }

 /* ── C2 Layout: member cards grid ── */
 .member-card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; }
 .member-card {
   background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
   border-radius: 14px; padding: 16px; text-align: center;
   transition: border-color 0.2s, box-shadow 0.2s; cursor: default;
 }
 .member-card:hover { border-color: rgba(192,132,252,0.30); box-shadow: 0 4px 20px rgba(147,51,234,0.10); }
 .member-card-ava {
   width: 52px; height: 52px; border-radius: 50%; margin: 0 auto 10px;
   background: rgba(192,132,252,0.18); border: 2px solid rgba(192,132,252,0.35);
   display: flex; align-items: center; justify-content: center;
   font-size: 20px; font-weight: 700; color: #c084fc; overflow: hidden;
 }
 .member-card-ava img { width: 100%; height: 100%; object-fit: cover; }
 .member-card-name { font-size: 13px; font-weight: 700; color: #f5eeff; margin-bottom: 6px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
 .member-card-tags { display: flex; flex-wrap: wrap; justify-content: center; gap: 3px; }
 .member-card-tag {
   font-size: 9px; padding: 2px 7px; border-radius: 20px; font-weight: 600;
   background: rgba(192,132,252,0.15); color: #c084fc; border: 1px solid rgba(192,132,252,0.30);
 }

 /* ── C2 Layout: scale cards with date block ── */
 .scale-card-c2 {
   background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
   border-radius: 16px; padding: 18px 20px;
   display: flex; align-items: center; gap: 18px;
   transition: all 0.2s;
 }
 .scale-card-c2:hover { border-color: rgba(240,128,112,0.30); background: rgba(240,128,112,0.04); }
 .scale-date-block {
   width: 54px; height: 54px; border-radius: 14px; flex-shrink: 0;
   background: rgba(240,128,112,0.14); border: 1px solid rgba(240,128,112,0.30);
   display: flex; flex-direction: column; align-items: center; justify-content: center;
 }
 .scale-date-day { font-family: 'Montserrat', sans-serif; font-size: 22px; font-weight: 900; color: #f08878; line-height: 1; }
 .scale-date-mon { font-size: 9px; color: rgba(240,136,120,0.7); letter-spacing: 1px; text-transform: uppercase; margin-top: 2px; }

 /* ── C2 Layout: hero card ── */
 .hero-card {
   background: rgba(255,255,255,0.04);
   border: 1px solid rgba(255,255,255,0.08);
   border-radius: 20px; padding: 28px 28px 24px;
   position: relative; overflow: hidden;
   backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
 }
 .hero-card::before {
   content: ''; position: absolute; top: -60px; right: -60px;
   width: 220px; height: 220px; border-radius: 50%;
   background: radial-gradient(circle, rgba(240,128,112,0.18), transparent 70%);
   pointer-events: none;
 }
 .hero-card::after {
   content: ''; position: absolute; bottom: -50px; left: 25%;
   width: 180px; height: 180px; border-radius: 50%;
   background: radial-gradient(circle, rgba(192,132,252,0.14), transparent 70%);
   pointer-events: none;
 }
 .hero-stat-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 10px; }
 @media (max-width: 560px) { .hero-stat-grid { grid-template-columns: repeat(2,1fr); } }
 .hero-stat {
   background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.10);
   border-radius: 14px; padding: 14px 12px; cursor: pointer; transition: all 0.2s;
 }
 .hero-stat:hover { border-color: rgba(192,132,252,0.30); background: rgba(192,132,252,0.10); }
 .hero-stat-icon { font-size: 18px; margin-bottom: 8px; }
 .hero-stat-num { font-family: 'Montserrat', sans-serif; font-size: 26px; font-weight: 900; color: #f5eeff; line-height: 1; }
 .hero-stat-lbl { font-size: 11px; color: #8870a8; margin-top: 4px; }

 /* ── Sidebar mini-stats ── */
 .sidebar-mini-stats { padding: 14px 18px; border-top: 1px solid rgba(192,132,252,0.10); }
 .sidebar-mini-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
 .sidebar-mini-label { font-size: 11px; color: #8870a8; }
 .sidebar-mini-val { font-size: 11px; color: #c084fc; font-weight: 700; }

 .home-section { margin-top: 24px; }

 .birthday-chip {
   display: flex; align-items: center; gap: 10px;
   padding: 8px 12px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
   border-radius: 10px; font-size: 13px;
 }
 .birthday-chip:hover { border-color: rgba(192,132,252,0.28); }

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
const scMembers = (sc.scaleMembers || []).map(sm => ({ ...sm, member: members.find(m => m.id === sm.memberId) })).filter(x => x.member);
const scSongs = (sc.scaleSongs || []).map(ss => ({ ...ss, song: songs.find(s => s.id === ss.songId) })).filter(x => x.song);
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
txt += `• ${shortName(x.member.name)}${x.isSub ? ' ↔ (substituto)' : ''}${roleLabel ? ` — ${roleLabel}` : ''}\n`;
});
txt += `\n`;
}
if (scSongs.length > 0) {
txt += `*🎵 Repertório:*\n`;
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
if (x.song.youtubeUrl) txt += `\n   🔗 ${x.song.youtubeUrl}`;
txt += `\n`;
});
}
return txt;
}
function shareToWhatsApp(sc, members, groups, songs) {
window.open(`https://wa.me/?text=${encodeURIComponent(buildWhatsAppText(sc, members, groups, songs))}`, '_blank');
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
<h2 style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 16, fontWeight: 800, color: C.accent }}>{title}</h2>
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

const LOGO_HOME = "/icon-512.png";
const LOGO_SIDEBAR = "/icon-192.png";

// ═══════════════════════════════════
// HOME PAGE — C2 Hero Layout
// ═══════════════════════════════════
function HomePage({ counts, scales, members, groups, onNav }) {
const today = new Date().toISOString().split('T')[0];
const thisMonth = new Date().getMonth() + 1;
const upcoming = [...scales].filter(s => s.date >= today).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5);
const birthdayMembers = members
.filter(m => { if (!m.birthdate) return false; return parseInt(m.birthdate.split('-')[1], 10) === thisMonth; })
.sort((a, b) => parseInt(a.birthdate.split('-')[2], 10) - parseInt(b.birthdate.split('-')[2], 10));
const today2 = new Date();
const isToday = (bd) => { if (!bd) return false; const [,m,d] = bd.split('-').map(Number); return m === today2.getMonth()+1 && d === today2.getDate(); };

return (
<div style={{ padding: '28px 24px', maxWidth: 860, margin: '0 auto' }}>
  {/* Hero card */}
  <div className="hero-card" style={{ marginBottom: 20 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20, position: 'relative', zIndex: 1 }}>
      <div style={{ width: 52, height: 52, borderRadius: 16, overflow: 'hidden', border: `2px solid rgba(192,132,252,0.40)`, flexShrink: 0 }}>
        <img src={LOGO_HOME} alt="Oitava Music" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
      <div>
        <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, fontSize: 20, color: C.textPrimary, lineHeight: 1.1 }}>
          Olá, <span style={{ background: 'linear-gradient(90deg, #c084fc, #f08070)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Oitava Music</span> 👋
        </div>
        <div style={{ fontSize: 12, color: C.textSecondary, marginTop: 3 }}>
          {upcoming.length > 0 ? `Próxima escala em ${Math.ceil((new Date(upcoming[0].date+'T12:00:00') - new Date()) / 86400000)}d · ${upcoming[0].name}` : 'Nenhuma escala agendada'}
        </div>
      </div>
    </div>
    <div className="hero-stat-grid" style={{ position: 'relative', zIndex: 1 }}>
      {[
        { emoji: '👥', label: 'Membros',    val: counts.members,  page: 'members' },
        { emoji: '🎸', label: 'Grupos',     val: counts.groups,   page: 'groups'  },
        { emoji: '🎵', label: 'Músicas',    val: counts.songs,    page: 'songs'   },
        { emoji: '📅', label: 'Escalas',    val: counts.scales,   page: 'scales'  },
      ].map(item => (
        <div key={item.label} className="hero-stat" onClick={() => onNav(item.page)}>
          <div className="hero-stat-icon">{item.emoji}</div>
          <div className="hero-stat-num">{item.val}</div>
          <div className="hero-stat-lbl">{item.label}</div>
        </div>
      ))}
    </div>
  </div>

  {/* Upcoming scales */}
  <div className="home-section">
    <div className="section-header"><Calendar size={13} />{upcoming.length > 0 ? `Próximas Escalas` : 'Escalas'}</div>
    {upcoming.length === 0 ? (
      <div style={{ padding: 16, background: 'rgba(255,255,255,0.04)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', fontSize: 13, color: C.textSecondary, textAlign: 'center' }}>
        Nenhuma escala agendada
      </div>
    ) : (
      <div style={{ display: 'grid', gap: 8 }}>
        {upcoming.map(sc => {
          const g = groups.find(x => x.id === sc.groupId);
          const daysUntil = Math.ceil((new Date(sc.date+'T12:00:00') - new Date()) / 86400000);
          const [,mm,dd] = sc.date.split('-');
          const months = ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ'];
          return (
            <div key={sc.id} className="scale-card-c2" style={{ cursor: 'pointer' }} onClick={() => onNav('scales')}>
              <div className="scale-date-block">
                <div className="scale-date-day">{dd}</div>
                <div className="scale-date-mon">{months[parseInt(mm)-1]}</div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, color: C.textPrimary, fontSize: 14, marginBottom: 5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sc.name}</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {g && <span className="tag" style={{ fontSize: 10 }}>{g.name}</span>}
                </div>
              </div>
              <div style={{ flexShrink: 0 }}>
                {daysUntil === 0 ? <span style={{ fontSize: 12, fontWeight: 700, color: C.success }}>Hoje!</span>
                : daysUntil === 1 ? <span style={{ fontSize: 12, fontWeight: 700, color: C.accent }}>Amanhã</span>
                : <span style={{ fontSize: 12, color: C.textSecondary }}>{daysUntil}d</span>}
              </div>
            </div>
          );
        })}
      </div>
    )}
  </div>

  {/* Birthdays */}
  <div className="home-section">
    <div className="section-header"><Cake size={13} />Aniversariantes do Mês</div>
    {birthdayMembers.length === 0 ? (
      <div style={{ padding: 16, background: 'rgba(255,255,255,0.04)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', fontSize: 13, color: C.textSecondary, textAlign: 'center' }}>
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
                <div style={{ fontWeight: 600, color: C.textPrimary, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</span>
                  {isBday && <span style={{ flexShrink: 0 }}>🎂</span>}
                </div>
                <div style={{ fontSize: 12, color: C.textSecondary }}>{(m.roles||[]).map(r => ROLES.find(x=>x.key===r)?.label).filter(Boolean).join(', ') || 'Sem função'}</div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: isBday ? C.accent : C.textPrimary, fontFamily: 'Montserrat, sans-serif' }}>{day}</div>
                {isBday && <div style={{ fontSize: 10, color: C.accent, fontWeight: 700 }}>HOJE!</div>}
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

// ═══════════════════════════════════
// MEMBERS PAGE — C2 card grid
// ═══════════════════════════════════
function MembersPage({ members, setMembers }) {
const [search, setSearch] = useState('');
const [modal, setModal] = useState(null);
const [confirm, setConfirm] = useState(null);
const [form, setForm] = useState({ name: '', birthdate: '', email: '', phone: '', photo: '', roles: [] });
const [importModal, setImportModal] = useState(false);
const [preview, setPreview] = useState([]);

const normalizeStr = (str) => (str||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
const openAdd = () => { setForm({ name:'', birthdate:'', email:'', phone:'', photo:'', roles:[] }); setModal('add'); };
const openEdit = m => { setForm({ ...m, roles:[...(m.roles||[])] }); setModal(m); };

const handlePhoto = e => {
const file = e.target.files[0]; if (!file) return;
const reader = new FileReader();
reader.onload = ev => {
const img = new Image();
img.onload = () => {
const canvas = document.createElement('canvas');
const MAX_SIZE = 300;
let w = img.width, h = img.height;
if (w > h) { if (w > MAX_SIZE) { h = Math.round(h*MAX_SIZE/w); w = MAX_SIZE; } }
else { if (h > MAX_SIZE) { w = Math.round(w*MAX_SIZE/h); h = MAX_SIZE; } }
canvas.width = w; canvas.height = h;
canvas.getContext('2d').drawImage(img, 0, 0, w, h);
setForm(f => ({ ...f, photo: canvas.toDataURL('image/jpeg', 0.7) }));
};
img.src = ev.target.result;
};
reader.readAsDataURL(file);
};

const toggleRole = key => setForm(f => ({ ...f, roles: f.roles.includes(key) ? f.roles.filter(r=>r!==key) : [...f.roles, key] }));
const save = () => {
if (!form.name.trim() || !form.birthdate) return;
if (modal==='add') setMembers(p => [...p, { ...form, id: genId() }]);
else setMembers(p => p.map(m => m.id===form.id ? { ...form } : m));
setModal(null);
};
const del = id => { setMembers(p => p.filter(m => m.id!==id)); setConfirm(null); };

const handleCSV = e => {
const file = e.target.files[0]; if (!file) return;
Papa.parse(file, { header: true, skipEmptyLines: true, complete: ({ data }) => {
const rows = data.map(row => {
const keys = Object.keys(row);
const nk = keys.find(k => /nome|name/i.test(k)) || keys[0];
const ek = keys.find(k => /email|e-mail/i.test(k));
const pk = keys.find(k => /tel|celular|phone/i.test(k));
const bk = keys.find(k => /nasc|data|birth|aniv/i.test(k));
const rk = keys.find(k => /fun[cç][oõ]es|cargo|role/i.test(k));
let parsedRoles = [];
if (rk && row[rk]) { const str = row[rk].toLowerCase(); ROLES.forEach(r => { if (str.includes(r.key)||str.includes(r.label.toLowerCase())) parsedRoles.push(r.key); }); }
let rawDate = bk ? row[bk]?.trim()||'' : '', formattedDate = '';
if (rawDate.includes('/')) { const parts = rawDate.split('/'); if (parts.length===3) { const dia=parts[0].padStart(2,'0'), mes=parts[1].padStart(2,'0'), ano=parts[2].trim(), anoC=ano.length===2?(parseInt(ano)>30?'19':'20')+ano:ano; formattedDate=`${anoC}-${mes}-${dia}`; } } else { formattedDate=rawDate; }
return { name: row[nk]?.trim()||'', email: ek?row[ek]?.trim()||'':'', phone: pk?row[pk]?.trim()||'':'', birthdate: formattedDate, roles: parsedRoles, photo: '' };
}).filter(r => r.name);
setPreview(rows);
}});
e.target.value = '';
};

const doImport = () => {
setMembers(prev => {
let list = [...prev];
preview.forEach(imp => {
const idx = list.findIndex(m => normalizeStr(m.name)===normalizeStr(imp.name));
if (idx >= 0) { list[idx] = { ...list[idx], birthdate: imp.birthdate||list[idx].birthdate, email: imp.email||list[idx].email, phone: imp.phone||list[idx].phone, roles: imp.roles.length>0?imp.roles:list[idx].roles }; }
else { list.push({ ...imp, id: genId() }); }
});
return list;
});
setImportModal(false); setPreview([]);
};

const filtered = members.filter(m => normalizeStr(m.name).includes(normalizeStr(search))).sort((a,b) => a.name.localeCompare(b.name,'pt-BR',{sensitivity:'base'}));
const ROLES_INSTRUMENTAL = ROLES.filter(r => !['tenor','soprano','contralto'].includes(r.key));
const ROLES_VOCAL = ROLES.filter(r => ['tenor','soprano','contralto'].includes(r.key));

return (
<div style={{ padding: 24, maxWidth: 860 }}>
  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, flexWrap:'wrap', gap:10 }}>
    <div>
      <h1 style={{ fontFamily:'Montserrat, sans-serif', fontSize:21, fontWeight:800, color:C.accent }}>Membros</h1>
      <p style={{ color:C.textSecondary, fontSize:13 }}>{members.length} membro{members.length!==1?'s':''}</p>
    </div>
    <div style={{ display:'flex', gap:8 }}>
      <Btn variant="secondary" onClick={() => { setPreview([]); setImportModal(true); }}><Upload size={15}/>Importar CSV</Btn>
      <Btn onClick={openAdd}><Plus size={15}/>Novo Membro</Btn>
    </div>
  </div>

  <div className="search-wrap">
    <Search size={15} color={C.textSecondary}/>
    <input className="input-field" placeholder="Buscar membros..." value={search} onChange={e=>setSearch(e.target.value)}/>
  </div>

  {filtered.length===0 ? (
    <div className="empty-state"><Users size={38} style={{marginBottom:12,opacity:0.25}}/><p>Nenhum membro encontrado</p></div>
  ) : (
    <div className="member-card-grid">
      {filtered.map(m => (
        <div key={m.id} className="member-card">
          <div className="member-card-ava">
            {m.photo ? <img src={m.photo} alt=""/> : (m.name?.[0]||'?')}
          </div>
          <div className="member-card-name">{m.name}</div>
          <div className="member-card-tags">
            {(m.roles||[]).map(r => { const ro=ROLES.find(x=>x.key===r); return ro ? <span key={r} className="member-card-tag">{ro.emoji} {ro.label}</span> : null; })}
          </div>
          <div style={{ display:'flex', justifyContent:'center', gap:4, marginTop:10 }}>
            <Btn variant="ghost" onClick={()=>openEdit(m)} style={{padding:'4px 8px'}}><Edit2 size={13}/></Btn>
            <Btn variant="ghost" className="del" onClick={()=>setConfirm(m.id)} style={{padding:'4px 8px'}}><Trash2 size={13}/></Btn>
          </div>
        </div>
      ))}
    </div>
  )}

  {importModal && (
    <Modal title="Importar/Atualizar via CSV" onClose={() => { setImportModal(false); setPreview([]); }} wide>
      <div style={{ padding:14, background:C.bgInput, borderRadius:8, marginBottom:16, fontSize:13, color:C.textSecondary, lineHeight:1.7 }}>
        <strong style={{color:C.accent}}>Atualização em Massa:</strong> Se o nome já existir, os dados são atualizados sem duplicar.
      </div>
      <label style={{ display:'block', padding:'24px 16px', border:`2px dashed ${C.border}`, borderRadius:10, textAlign:'center', cursor:'pointer', color:C.textSecondary, marginBottom:16 }}>
        <Upload size={26} style={{display:'block',margin:'0 auto 8px'}}/>Clique para selecionar o arquivo CSV
        <input type="file" accept=".csv" onChange={handleCSV} style={{display:'none'}}/>
      </label>
      {preview.length>0 && (
        <>
          <p style={{color:C.success,fontSize:13,marginBottom:10}}>✓ {preview.length} membro{preview.length!==1?'s':''} lido{preview.length!==1?'s':''}</p>
          <div style={{maxHeight:200,overflowY:'auto',display:'grid',gap:4,marginBottom:16}}>
            {preview.map((m,i) => {
              const exists = members.some(ex => normalizeStr(ex.name)===normalizeStr(m.name));
              return (<div key={i} style={{padding:'7px 12px',background:C.bgHover,borderRadius:6,display:'flex',justifyContent:'space-between',fontSize:13}}>
                <span style={{color:C.textPrimary}}>{m.name}</span>
                <span style={{color:exists?C.accent:C.success,fontSize:11,fontWeight:700}}>{exists?'🔄 Será Atualizado':'✨ Novo Membro'}</span>
              </div>);
            })}
          </div>
          <Btn onClick={doImport}><Check size={14}/>Processar {preview.length} membro{preview.length!==1?'s':''}</Btn>
        </>
      )}
    </Modal>
  )}

  {modal && (
    <Modal title={modal==='add'?'Novo Membro':'Editar Membro'} onClose={()=>setModal(null)}>
      <Inp label="Nome *" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Nome completo"/>
      <div className="grid-2">
        <Inp label="Data de Nascimento *" type="date" value={form.birthdate} onChange={e=>setForm(f=>({...f,birthdate:e.target.value}))}/>
        <Inp label="Telefone" type="tel" value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} placeholder="(11) 99999-9999"/>
      </div>
      <Inp label="E-mail" type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} placeholder="email@exemplo.com"/>
      <Field label="Foto (Compactada Automaticamente)">
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          {form.photo && <img src={form.photo} alt="" style={{width:48,height:48,borderRadius:'50%',objectFit:'cover',border:`2px solid ${C.accent}`}}/>}
          <label style={{cursor:'pointer',padding:'8px 14px',border:`1px dashed ${C.border}`,borderRadius:8,color:C.textSecondary,fontSize:13,display:'flex',alignItems:'center',gap:6}}>
            <Upload size={14}/>Selecionar foto<input type="file" accept="image/*" onChange={handlePhoto} style={{display:'none'}}/>
          </label>
          {form.photo && <Btn variant="ghost" style={{padding:'4px 8px',fontSize:12}} onClick={()=>setForm(f=>({...f,photo:''}))}>Remover</Btn>}
        </div>
      </Field>
      <Field label="Funções — Instrumentos">
        <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:6}}>
          {ROLES_INSTRUMENTAL.map(r => (
            <div key={r.key} className={`role-chip${form.roles.includes(r.key)?' selected':''}`} onClick={()=>toggleRole(r.key)}>
              <span>{r.emoji}</span>{r.label}{form.roles.includes(r.key)&&<Check size={13} style={{marginLeft:'auto'}}/>}
            </div>
          ))}
        </div>
      </Field>
      <Field label="Funções — Vocal">
        <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:6}}>
          {ROLES_VOCAL.map(r => (
            <div key={r.key} className={`role-chip${form.roles.includes(r.key)?' selected':''}`} onClick={()=>toggleRole(r.key)}>
              <span>{r.emoji}</span>{r.label}{form.roles.includes(r.key)&&<Check size={13} style={{marginLeft:'auto'}}/>}
            </div>
          ))}
        </div>
      </Field>
      <div style={{display:'flex',justifyContent:'flex-end',gap:8,marginTop:4}}>
        <Btn variant="secondary" onClick={()=>setModal(null)}>Cancelar</Btn>
        <Btn onClick={save}><Check size={14}/>Salvar</Btn>
      </div>
    </Modal>
  )}
  {confirm && <Confirm msg="Excluir este membro permanentemente?" onOk={()=>del(confirm)} onCancel={()=>setConfirm(null)}/>}
</div>
);
}

// ═══════════════════════════════════
// GROUPS PAGE
// ═══════════════════════════════════
function GroupsPage({ groups, setGroups, members }) {
const [modal, setModal] = useState(null);
const [confirm, setConfirm] = useState(null);
const [form, setForm] = useState({ name:'', memberIds:[] });
const [mSearch, setMSearch] = useState('');

const openAdd = () => { setForm({name:'',memberIds:[]}); setMSearch(''); setModal('add'); };
const openEdit = g => { setForm({...g,memberIds:[...(g.memberIds||[])]}); setMSearch(''); setModal(g); };
const toggleM = id => setForm(f => ({...f, memberIds: f.memberIds.includes(id)?f.memberIds.filter(x=>x!==id):[...f.memberIds,id]}));
const save = () => { if(!form.name.trim())return; if(modal==='add')setGroups(p=>[...p,{...form,id:genId()}]); else setGroups(p=>p.map(g=>g.id===form.id?{...form}:g)); setModal(null); };
const del = id => { setGroups(p=>p.filter(g=>g.id!==id)); setConfirm(null); };
const filteredM = members.filter(m=>m.name.toLowerCase().includes(mSearch.toLowerCase()));

return (
<div style={{padding:24,maxWidth:860}}>
  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24,flexWrap:'wrap',gap:10}}>
    <div>
      <h1 style={{fontFamily:'Montserrat, sans-serif',fontSize:21,fontWeight:800,color:C.accent}}>Grupos</h1>
      <p style={{color:C.textSecondary,fontSize:13}}>{groups.length} grupo{groups.length!==1?'s':''}</p>
    </div>
    <Btn onClick={openAdd}><Plus size={15}/>Novo Grupo</Btn>
  </div>
  {groups.length===0?(
    <div className="empty-state"><Music size={38} style={{marginBottom:12,opacity:0.25}}/><p>Nenhum grupo cadastrado</p></div>
  ):(
    <div style={{display:'grid',gap:10}}>
      {groups.map(g=>{
        const gMembers=members.filter(m=>(g.memberIds||[]).includes(m.id));
        return (
          <div key={g.id} className="card">
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:12}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:700,color:C.textPrimary,fontSize:16,marginBottom:10}}>{g.name}</div>
                <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                  {gMembers.map(m=>(
                    <div key={m.id} style={{display:'flex',alignItems:'center',gap:6,padding:'3px 10px',background:C.bgHover,borderRadius:20,fontSize:12}}>
                      <Avatar member={m} size={20}/><span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{m.name}</span>
                    </div>
                  ))}
                  {gMembers.length===0&&<span style={{color:C.textSecondary,fontSize:13}}>Sem membros</span>}
                </div>
              </div>
              <div style={{display:'flex',gap:2,flexShrink:0}}>
                <Btn variant="ghost" onClick={()=>openEdit(g)}><Edit2 size={14}/></Btn>
                <Btn variant="ghost" className="del" onClick={()=>setConfirm(g.id)}><Trash2 size={14}/></Btn>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  )}
  {modal&&(
    <Modal title={modal==='add'?'Novo Grupo':'Editar Grupo'} onClose={()=>setModal(null)} wide>
      <Inp label="Nome do Grupo *" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Ex: Grupo Alpha"/>
      <Field label={`Membros (${form.memberIds.length} selecionado${form.memberIds.length!==1?'s':''})`}>
        <div className="search-wrap" style={{marginBottom:10}}>
          <Search size={13} color={C.textSecondary}/>
          <input className="input-field" placeholder="Filtrar membros..." value={mSearch} onChange={e=>setMSearch(e.target.value)} style={{fontSize:13}}/>
        </div>
        <div style={{maxHeight:240,overflowY:'auto',display:'grid',gap:5}}>
          {filteredM.map(m=>(
            <div key={m.id} className={`member-pick${form.memberIds.includes(m.id)?' selected':''}`} onClick={()=>toggleM(m.id)}>
              <Avatar member={m} size={32}/>
              <div style={{flex:1}}><div style={{color:form.memberIds.includes(m.id)?C.accent:C.textPrimary,fontWeight:500}}>{m.name}</div>
              <div style={{fontSize:11,color:C.textSecondary}}>{(m.roles||[]).map(r=>ROLES.find(x=>x.key===r)?.label).filter(Boolean).join(', ')||'Sem função'}</div></div>
              {form.memberIds.includes(m.id)&&<Check size={15} color={C.accent}/>}
            </div>
          ))}
          {filteredM.length===0&&<div style={{textAlign:'center',padding:20,color:C.textSecondary,fontSize:13}}>Nenhum membro</div>}
        </div>
      </Field>
      <div style={{display:'flex',justifyContent:'flex-end',gap:8,marginTop:8}}>
        <Btn variant="secondary" onClick={()=>setModal(null)}>Cancelar</Btn>
        <Btn onClick={save}><Check size={14}/>Salvar</Btn>
      </div>
    </Modal>
  )}
  {confirm&&<Confirm msg="Excluir este grupo?" onOk={()=>del(confirm)} onCancel={()=>setConfirm(null)}/>}
</div>
);
}

// ═══════════════════════════════════
// SONGS PAGE
// ═══════════════════════════════════
function SongsPage({ songs, setSongs }) {
const [search, setSearch] = useState('');
const [modal, setModal] = useState(null);
const [confirm, setConfirm] = useState(null);
const [form, setForm] = useState({ name:'', youtubeUrl:'', bpm:'' });
const [importModal, setImportModal] = useState(false);
const [preview, setPreview] = useState([]);
const [dupWarning, setDupWarning] = useState('');

const openAdd = () => { setForm({name:'',youtubeUrl:'',bpm:''}); setDupWarning(''); setModal('add'); };
const openEdit = s => { setForm({name:s.name,youtubeUrl:s.youtubeUrl||'',bpm:s.bpm||''}); setDupWarning(''); setModal(s); };

const save = () => {
if(!form.name.trim())return;
const isDup = songs.some(s=>s.name.trim().toLowerCase()===form.name.trim().toLowerCase()&&(modal==='add'||s.id!==form.id));
if(isDup){setDupWarning(`"${form.name.trim()}" já está no repertório.`);return;}
setDupWarning('');
if(modal==='add')setSongs(p=>[...p,{...form,id:genId()}]);
else setSongs(p=>p.map(s=>s.id===form.id?{...form,id:s.id}:s));
setModal(null);
};
const del = id => { setSongs(p=>p.filter(s=>s.id!==id)); setConfirm(null); };

const handleCSV = e => {
const file=e.target.files[0]; if(!file)return;
Papa.parse(file,{header:true,skipEmptyLines:true,complete:({data})=>{
const rows=data.map(row=>{
const keys=Object.keys(row);
const nk=keys.find(k=>/nome|name|musica|titulo|title/i.test(k))||keys[0];
const uk=keys.find(k=>/url|link|youtube/i.test(k))||keys[1];
const bk=keys.find(k=>/bpm/i.test(k));
return{name:row[nk]?.trim()||'',youtubeUrl:row[uk]?.trim()||'',bpm:bk?row[bk]?.trim()||'':''};
}).filter(r=>r.name);
setPreview(rows);
}});
e.target.value='';
};
const doImport = () => { setSongs(p=>[...p,...preview.map(s=>({...s,id:genId()}))]); setImportModal(false); setPreview([]); };
const filtered = songs.filter(s=>s.name.toLowerCase().includes(search.toLowerCase()));

return (
<div style={{padding:24,maxWidth:860}}>
  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24,flexWrap:'wrap',gap:10}}>
    <div>
      <h1 style={{fontFamily:'Montserrat, sans-serif',fontSize:21,fontWeight:800,color:C.accent}}>Repertório</h1>
      <p style={{color:C.textSecondary,fontSize:13}}>{songs.length} música{songs.length!==1?'s':''}</p>
    </div>
    <div style={{display:'flex',gap:8}}>
      <Btn variant="secondary" onClick={()=>{setPreview([]);setImportModal(true);}}><Upload size={15}/>Importar CSV</Btn>
      <Btn onClick={openAdd}><Plus size={15}/>Nova Música</Btn>
    </div>
  </div>
  <div className="search-wrap">
    <Search size={15} color={C.textSecondary}/>
    <input className="input-field" placeholder="Buscar músicas..." value={search} onChange={e=>setSearch(e.target.value)}/>
  </div>
  {filtered.length===0?(
    <div className="empty-state"><Music size={38} style={{marginBottom:12,opacity:0.25}}/><p>Nenhuma música encontrada</p></div>
  ):(
    <div style={{display:'grid',gap:8}}>
      {filtered.map((s,i)=>{
        const hues=[200,260,320,30,160,50,290,10];
        const hue=hues[i%hues.length];
        return (
          <div key={s.id} className="card" style={{display:'flex',alignItems:'center',gap:12}}>
            <div style={{width:44,height:44,borderRadius:10,flexShrink:0,background:`hsl(${hue},60%,22%)`,border:`1.5px solid hsl(${hue},60%,35%)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,fontWeight:800,color:`hsl(${hue},80%,65%)`,fontFamily:'Montserrat, sans-serif'}}>
              {s.name.trim()[0]?.toUpperCase()||'🎵'}
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontWeight:600,color:C.textPrimary,marginBottom:3,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.name}</div>
              <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
                {s.youtubeUrl?<a href={s.youtubeUrl} target="_blank" rel="noopener noreferrer" style={{display:'inline-flex',alignItems:'center',gap:4,color:'#E8463A',fontSize:12,textDecoration:'none'}}><Youtube size={12}/>Abrir no YouTube</a>:<span style={{fontSize:12,color:C.textSecondary}}>Sem link</span>}
                {s.bpm&&<span style={{fontSize:11,fontWeight:700,color:C.accent,background:C.accentGlow,border:`1px solid ${C.accent}33`,borderRadius:6,padding:'1px 7px'}}>♩ {s.bpm} BPM</span>}
              </div>
            </div>
            <div style={{display:'flex',gap:2}}>
              <Btn variant="ghost" onClick={()=>openEdit(s)}><Edit2 size={14}/></Btn>
              <Btn variant="ghost" className="del" onClick={()=>setConfirm(s.id)}><Trash2 size={14}/></Btn>
            </div>
          </div>
        );
      })}
    </div>
  )}
  {modal&&(
    <Modal title={modal==='add'?'Nova Música':'Editar Música'} onClose={()=>setModal(null)}>
      <Inp label="Nome da Música *" value={form.name} onChange={e=>{setForm(f=>({...f,name:e.target.value}));setDupWarning('');}} placeholder="Ex: Oceanos"/>
      {dupWarning&&<div style={{marginTop:-10,marginBottom:14,padding:'8px 12px',background:`${C.danger}18`,border:`1px solid ${C.danger}44`,borderRadius:8,color:C.danger,fontSize:13,display:'flex',alignItems:'center',gap:8}}><AlertCircle size={14}/>{dupWarning}</div>}
      <Inp label="Link do YouTube" value={form.youtubeUrl} onChange={e=>setForm(f=>({...f,youtubeUrl:e.target.value}))} placeholder="https://youtube.com/watch?v=..."/>
      <Inp label="BPM (Batidas por Minuto)" type="number" min="40" max="300" value={form.bpm} onChange={e=>setForm(f=>({...f,bpm:e.target.value}))} placeholder="Ex: 120"/>
      <div style={{display:'flex',justifyContent:'flex-end',gap:8}}>
        <Btn variant="secondary" onClick={()=>setModal(null)}>Cancelar</Btn>
        <Btn onClick={save}><Check size={14}/>Salvar</Btn>
      </div>
    </Modal>
  )}
  {importModal&&(
    <Modal title="Importar Músicas via CSV" onClose={()=>{setImportModal(false);setPreview([]);}} wide>
      <div style={{padding:14,background:C.bgInput,borderRadius:8,marginBottom:16,fontSize:13,color:C.textSecondary,lineHeight:1.7}}>
        <strong style={{color:C.accent}}>Formato esperado:</strong> colunas <code>nome</code>, <code>url</code> e opcionalmente <code>bpm</code>.
      </div>
      <label style={{display:'block',padding:'24px 16px',border:`2px dashed ${C.border}`,borderRadius:10,textAlign:'center',cursor:'pointer',color:C.textSecondary,marginBottom:16}}>
        <Upload size={26} style={{display:'block',margin:'0 auto 8px'}}/>Clique para selecionar o arquivo CSV
        <input type="file" accept=".csv" onChange={handleCSV} style={{display:'none'}}/>
      </label>
      {preview.length>0&&(
        <>
          <p style={{color:C.success,fontSize:13,marginBottom:10}}>✓ {preview.length} música{preview.length!==1?'s':''} encontrada{preview.length!==1?'s':''}</p>
          <div style={{maxHeight:200,overflowY:'auto',display:'grid',gap:4,marginBottom:16}}>
            {preview.map((s,i)=>(
              <div key={i} style={{padding:'7px 12px',background:C.bgHover,borderRadius:6,display:'flex',justifyContent:'space-between',gap:8,fontSize:13}}>
                <span style={{color:C.textPrimary}}>{s.name}</span>
                <div style={{display:'flex',gap:8,alignItems:'center'}}>
                  {s.bpm&&<span style={{color:C.accent,fontSize:11}}>♩ {s.bpm} BPM</span>}
                  {s.youtubeUrl&&<span style={{color:C.success,fontSize:11}}>✓ YouTube</span>}
                </div>
              </div>
            ))}
          </div>
          <Btn onClick={doImport}><Check size={14}/>Importar {preview.length} música{preview.length!==1?'s':''}</Btn>
        </>
      )}
    </Modal>
  )}
  {confirm&&<Confirm msg="Excluir esta música do repertório?" onOk={()=>del(confirm)} onCancel={()=>setConfirm(null)}/>}
</div>
);
}

// ═══════════════════════════════════
// ARCHIVED HELPER
// ═══════════════════════════════════
function ArchivedSection({ archived, ScaleCard }) {
const [open, setOpen] = useState(false);
return (
<div>
  <div onClick={()=>setOpen(o=>!o)} style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',userSelect:'none',marginBottom:open?10:0}}>
    <div className="section-header" style={{marginBottom:0,flex:1}}>📦 Arquivadas ({archived.length})</div>
    <span style={{fontSize:11,color:C.textSecondary}}>{open?'▲ ocultar':'▼ mostrar'}</span>
  </div>
  {open&&<div style={{display:'grid',gap:8}}>{archived.map(sc=><div key={sc.id} style={{opacity:0.65}}><ScaleCard sc={sc}/></div>)}</div>}
</div>
);
}

// ═══════════════════════════════════
// SCALES PAGE — C2 date block layout
// ═══════════════════════════════════
function ScalesPage({ scales, setScales, members, groups, songs }) {
const [modal, setModal] = useState(null);
const [viewModal, setViewModal] = useState(null);
const [confirm, setConfirm] = useState(null);
const [form, setForm] = useState({ name:'', date:'', groupId:'', scaleMembers:[], scaleSongs:[] });
const [mSearch, setMSearch] = useState('');
const [sSearch, setSSearch] = useState('');

const fresh = () => ({name:'',date:'',groupId:'',scaleMembers:[],scaleSongs:[]});
const openAdd = () => { setForm(fresh()); setMSearch(''); setSSearch(''); setModal('add'); };
const openEdit = sc => { setForm({...sc,scaleMembers:sc.scaleMembers.map(x=>({...x})),scaleSongs:sc.scaleSongs.map(x=>({...x}))}); setMSearch(''); setSSearch(''); setModal(sc); };

const onGroupChange = gid => {
const g=groups.find(x=>x.id===gid);
setForm(f=>({...f,groupId:gid,scaleMembers:(g?.memberIds||[]).map(id=>({memberId:id,isSub:false,role:''}))}));
};

const removeMember = id => setForm(f=>({...f,scaleMembers:f.scaleMembers.filter(x=>x.memberId!==id)}));
const addSubstitute = id => { if(form.scaleMembers.find(x=>x.memberId===id))return; setForm(f=>({...f,scaleMembers:[...f.scaleMembers,{memberId:id,isSub:true,role:''}]})); setMSearch(''); };
const updateMemberRole = (memberId, role) => setForm(f=>({...f,scaleMembers:f.scaleMembers.map(x=>{
if(x.memberId!==memberId)return x;
const current=x.roles||(x.role?[x.role]:[]);
const updated=current.includes(role)?current.filter(r=>r!==role):[...current,role];
return{...x,roles:updated,role:updated[0]||''};
})}));
const addSong = id => { if(form.scaleSongs.find(x=>x.songId===id))return; setForm(f=>({...f,scaleSongs:[...f.scaleSongs,{songId:id,key:'',notes:'',soloMemberId:''}]})); setSSearch(''); };
const removeSong = id => setForm(f=>({...f,scaleSongs:f.scaleSongs.filter(x=>x.songId!==id)}));
const updateSong = (id,field,val) => setForm(f=>({...f,scaleSongs:f.scaleSongs.map(x=>x.songId===id?{...x,[field]:val}:x)}));
const save = () => { if(!form.name.trim()||!form.date)return; if(modal==='add')setScales(p=>[...p,{...form,id:genId()}]); else setScales(p=>p.map(s=>s.id===form.id?{...form}:s)); setModal(null); };
const del = id => { setScales(p=>p.filter(s=>s.id!==id)); setConfirm(null); };

const existingIds = form.scaleMembers.map(x=>x.memberId);
const availSubs = members.filter(m=>!existingIds.includes(m.id)&&m.name.toLowerCase().includes(mSearch.toLowerCase()));
const availSongs = songs.filter(s=>s.name.toLowerCase().includes(sSearch.toLowerCase())&&!form.scaleSongs.find(x=>x.songId===s.id));
const scaleMembers = sc => (sc.scaleMembers||[]).map(sm=>({...sm,member:members.find(m=>m.id===sm.memberId)})).filter(x=>x.member);
const scaleSongs = sc => (sc.scaleSongs||[]).map(ss=>({...ss,song:songs.find(s=>s.id===ss.songId)})).filter(x=>x.song);

const months = ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ'];

return (
<div style={{padding:24,maxWidth:860}}>
  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24,flexWrap:'wrap',gap:10}}>
    <div>
      <h1 style={{fontFamily:'Montserrat, sans-serif',fontSize:21,fontWeight:800,color:C.accent}}>Escalas</h1>
      <p style={{color:C.textSecondary,fontSize:13}}>{scales.length} escala{scales.length!==1?'s':''}</p>
    </div>
    <Btn onClick={openAdd}><Plus size={15}/>Nova Escala</Btn>
  </div>

  {scales.length===0?(
    <div className="empty-state"><Calendar size={38} style={{marginBottom:12,opacity:0.25}}/><p>Nenhuma escala criada</p></div>
  ):(() => {
    const today=new Date().toISOString().split('T')[0];
    const active=[...scales].filter(s=>s.date>=today).sort((a,b)=>a.date.localeCompare(b.date));
    const archived=[...scales].filter(s=>s.date<today).sort((a,b)=>b.date.localeCompare(a.date));

    const ScaleCard = ({ sc }) => {
      const g=groups.find(x=>x.id===sc.groupId);
      const sm=scaleMembers(sc);
      const ss=scaleSongs(sc);
      const [,mm,dd]=sc.date.split('-');
      return (
        <div className="scale-card-c2">
          <div className="scale-date-block">
            <div className="scale-date-day">{dd}</div>
            <div className="scale-date-mon">{months[parseInt(mm)-1]}</div>
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:'flex',flexWrap:'wrap',alignItems:'center',gap:8,marginBottom:5}}>
              <span style={{fontWeight:700,color:C.textPrimary,fontSize:15}}>{sc.name}</span>
              {g&&<span className="tag">{g.name}</span>}
            </div>
            <div style={{display:'flex',flexWrap:'wrap',gap:4,marginBottom:4}}>
              {sm.map(x=><span key={x.memberId} className={`tag${x.isSub?' sub':''}`}>{x.isSub?'↔ ':''}{x.member.name}</span>)}
            </div>
            <div style={{fontSize:12,color:C.textSecondary}}>{ss.length} música{ss.length!==1?'s':''}</div>
          </div>
          <div style={{display:'flex',gap:2,flexShrink:0}}>
            <Btn variant="ghost" onClick={()=>setViewModal(sc)}><Eye size={14}/></Btn>
            <Btn variant="ghost" onClick={()=>openEdit(sc)}><Edit2 size={14}/></Btn>
            <Btn variant="ghost" style={{color:'#1FAD4A'}} onClick={()=>shareToWhatsApp(sc,members,groups,songs)}><Share2 size={14}/></Btn>
            <Btn variant="ghost" className="del" onClick={()=>setConfirm(sc.id)}><Trash2 size={14}/></Btn>
          </div>
        </div>
      );
    };

    return (
      <div style={{display:'grid',gap:16}}>
        {active.length>0&&(
          <div>
            <div className="section-header" style={{marginBottom:10}}><Calendar size={13}/>Agendadas ({active.length})</div>
            <div style={{display:'grid',gap:8}}>{active.map(sc=><ScaleCard key={sc.id} sc={sc}/>)}</div>
          </div>
        )}
        {active.length===0&&<div style={{padding:'14px 16px',background:'rgba(255,255,255,0.04)',borderRadius:10,border:'1px solid rgba(255,255,255,0.08)',fontSize:13,color:C.textSecondary,textAlign:'center'}}>Nenhuma escala agendada</div>}
        {archived.length>0&&<ArchivedSection archived={archived} ScaleCard={ScaleCard}/>}
      </div>
    );
  })()}

  {/* View Modal */}
  {viewModal&&(
    <Modal title={viewModal.name} onClose={()=>setViewModal(null)} wide>
      <div style={{color:C.textSecondary,fontSize:13,marginBottom:18}}>
        📅 {fmtDate(viewModal.date)} · {groups.find(g=>g.id===viewModal.groupId)?.name||'Sem grupo'}
      </div>
      <Field label="Membros na Escala">
        <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
          {scaleMembers(viewModal).map(x=>{
            const activeRoles=x.roles||(x.role?[x.role]:[]);
            const roleLabels=activeRoles.map(r=>ROLES.find(ro=>ro.key===r)).filter(Boolean);
            return (
              <div key={x.memberId} style={{display:'flex',alignItems:'center',gap:8,padding:'5px 12px',background:x.isSub?'rgba(96,165,250,0.10)':C.accentGlow,borderRadius:20,border:`1px solid ${x.isSub?C.blue+'44':C.accent+'44'}`}}>
                <Avatar member={x.member} size={24}/>
                <div>
                  <span style={{fontSize:13,color:x.isSub?C.blue:C.accent}}>{x.isSub?'↔ ':''}{x.member.name}</span>
                  {roleLabels.length>0&&<span style={{fontSize:11,color:C.textSecondary,marginLeft:4}}>· {roleLabels.map(r=>`${r.emoji} ${r.label}`).join(', ')}</span>}
                </div>
              </div>
            );
          })}
          {scaleMembers(viewModal).length===0&&<span style={{color:C.textSecondary,fontSize:13}}>Nenhum membro</span>}
        </div>
      </Field>
      <Field label="Músicas">
        <div style={{display:'grid',gap:8}}>
          {scaleSongs(viewModal).map(x=>(
            <div key={x.songId} style={{padding:'10px 14px',background:C.bgHover,borderRadius:8,display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:8}}>
              <span style={{fontWeight:600,color:C.textPrimary}}>{x.song.name}</span>
              <div style={{display:'flex',gap:6,alignItems:'center',flexWrap:'wrap'}}>
                {x.key&&<span className="tag green">Tom: {x.key}</span>}
                {x.song.bpm&&<span className="tag" style={{fontSize:10}}>♩ {x.song.bpm} BPM</span>}
                {x.soloMemberId&&(()=>{
                  const soloist=members.find(m=>m.id===x.soloMemberId); if(!soloist)return null;
                  const vocalRole=(soloist.roles||[]).find(r=>['tenor','soprano','contralto'].includes(r));
                  const roleLabel=vocalRole?ROLES.find(ro=>ro.key===vocalRole)?.label:'';
                  return <span style={{fontSize:11,fontWeight:700,color:C.accent,background:C.accentGlow,border:`1px solid ${C.accent}44`,borderRadius:6,padding:'2px 8px'}}>🎙️ Solo: {soloist.name}{roleLabel?` · ${roleLabel}`:''}</span>;
                })()}
                {x.notes&&<span style={{fontSize:12,color:C.textSecondary}}>{x.notes}</span>}
              </div>
            </div>
          ))}
          {scaleSongs(viewModal).length===0&&<span style={{color:C.textSecondary,fontSize:13}}>Nenhuma música</span>}
        </div>
      </Field>
      {scaleSongs(viewModal).some(x=>x.song.youtubeUrl)&&(
        <div style={{marginTop:4,display:'grid',gap:5}}>
          <div className="field-label" style={{marginBottom:2}}>Links do YouTube</div>
          {scaleSongs(viewModal).filter(x=>x.song.youtubeUrl).map(x=>(
            <a key={x.songId} href={x.song.youtubeUrl} target="_blank" rel="noopener noreferrer"
              style={{display:'flex',alignItems:'center',gap:8,padding:'7px 12px',background:C.bgHover,borderRadius:8,textDecoration:'none',color:C.textPrimary,fontSize:13}}>
              <Youtube size={14} color="#E8463A"/><span style={{flex:1}}>{x.song.name}</span><span style={{fontSize:11,color:C.textSecondary}}>↗</span>
            </a>
          ))}
        </div>
      )}
      <div style={{marginTop:16,display:'flex',justifyContent:'flex-end'}}>
        <Btn className="btn-whatsapp" onClick={()=>shareToWhatsApp(viewModal,members,groups,songs)}><Share2 size={15}/>Enviar para WhatsApp</Btn>
      </div>
    </Modal>
  )}

  {/* Add/Edit Modal */}
  {modal&&(
    <Modal title={modal==='add'?'Nova Escala':'Editar Escala'} onClose={()=>setModal(null)} wide>
      <div className="grid-2">
        <Inp label="Nome da Escala *" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Ex: Culto Domingo Manhã"/>
        <Inp label="Data *" type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/>
      </div>
      <Field label="Grupo">
        <select className="input-field" value={form.groupId} onChange={e=>onGroupChange(e.target.value)}>
          <option value="">Selecionar grupo...</option>
          {groups.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
      </Field>
      <Field label={`Membros na Escala (${form.scaleMembers.length})`}>
        {form.scaleMembers.length===0&&<div style={{marginBottom:10,padding:'10px 14px',background:C.bgInput,borderRadius:8,fontSize:13,color:C.textSecondary}}>Selecione um grupo ou adicione membros manualmente</div>}
        {form.scaleMembers.map(sm=>{
          const m=members.find(x=>x.id===sm.memberId); if(!m)return null;
          const memberRoles=(m.roles||[]).map(r=>ROLES.find(x=>x.key===r)).filter(Boolean);
          const activeRoles=sm.roles||(sm.role?[sm.role]:[]);
          return (
            <div key={sm.memberId} style={{display:'flex',alignItems:'flex-start',gap:8,padding:'8px 10px',marginBottom:6,background:sm.isSub?'rgba(96,165,250,0.08)':C.accentGlow,border:`1px solid ${sm.isSub?C.blue+'44':C.accent+'33'}`,borderRadius:10}}>
              <Avatar member={m} size={28}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:600,color:sm.isSub?C.blue:C.accent,marginBottom:5}}>{sm.isSub?'↔ ':''}{m.name}</div>
                {memberRoles.length>0?(
                  <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
                    {memberRoles.map(r=>{
                      const active=activeRoles.includes(r.key);
                      return (
                        <div key={r.key} onClick={()=>updateMemberRole(sm.memberId,r.key)}
                          style={{padding:'3px 9px',borderRadius:20,fontSize:11,fontWeight:600,cursor:'pointer',userSelect:'none',display:'flex',alignItems:'center',gap:4,transition:'all 0.15s',
                            background:active?C.accent+'22':'transparent',color:active?C.accent:C.textSecondary,border:`1px solid ${active?C.accent+'88':C.border}`}}>
                          {r.emoji} {r.label}{active&&<Check size={10}/>}
                        </div>
                      );
                    })}
                  </div>
                ):<span style={{fontSize:11,color:C.
