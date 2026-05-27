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
  bg:           '#070C14',
  bgSecondary:  '#0C1220',
  bgCard:       '#111826',
  bgHover:      '#17202E',
  bgInput:      '#080D18',
  accent:       '#C9A84C',
  accentDark:   '#8B6914',
  accentGlow:   'rgba(201,168,76,0.13)',
  border:       '#1C2840',
  textPrimary:  '#EDF2F8',
  textSecondary:'#607088',
  danger:       '#D95252',
  success:      '#4DA870',
  blue:         '#4F80E1',
};

const ROLES = [
  { key: 'soprano', label: 'Soprano', emoji: '👩‍🎤' },
  { key: 'contralto', label: 'Contralto', emoji: '🎙️' },
  { key: 'tenor', label: 'Tenor', emoji: '👨‍🎤' },
  { key: 'ministro', label: 'Ministro', emoji: '✨' },
  { key: 'violao', label: 'Violão', emoji: '🎸' },
  { key: 'guitarra', label: 'Guitarra', emoji: '🎸' },
  { key: 'baixo', label: 'Baixo', emoji: '🎸' },
  { key: 'bateria', label: 'Bateria', emoji: '🥁' },
  { key: 'teclado', label: 'Teclado', emoji: '🎹' },
  { key: 'libras', label: 'Libras', emoji: '🤟' },
  { key: 'mesa_som', label: 'Mesa de Som', emoji: '🎛️' }
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
    background: ${C.bg}; 
    font-family: 'Nunito', sans-serif; 
    color: ${C.textPrimary}; 
    -webkit-tap-highlight-color: transparent; 
    -webkit-overflow-scrolling: touch; /* DEVOLVE O DESLIZE SUAVE (MOMENTUM) PARA CELULARES */
  }
  ::-webkit-scrollbar { width: 5px; height: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 4px; }
  ::-webkit-scrollbar-thumb:hover { background: ${C.accent}66; }
  input, select, textarea, button { font-family: 'Nunito', sans-serif; }
  input::placeholder, textarea::placeholder { color: ${C.textSecondary}; }
  select option { background: ${C.bgCard}; color: ${C.textPrimary}; }
  a { color: inherit; }

  .sidebar {
    width: 230px; background: ${C.bgSecondary};
    border-right: 1px solid ${C.border};
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
    padding: 10px 14px; border-radius: 8px; cursor: pointer;
    display: flex; align-items: center; gap: 10px;
    font-size: 14px; font-weight: 400; color: ${C.textSecondary};
    transition: all 0.15s; border-left: 3px solid transparent;
    margin-bottom: 2px; user-select: none;
  }
  .nav-item:hover { background: ${C.bgHover}; color: ${C.textPrimary}; }
  .nav-item.active {
    background: ${C.accentGlow}; color: ${C.accent};
    font-weight: 600; border-left-color: ${C.accent};
  }

  .btn { 
    padding: 9px 18px; border-radius: 8px; cursor: pointer;
    font-size: 13.5px; font-family: 'Nunito', sans-serif;
    display: inline-flex; align-items: center; gap: 6px;
    transition: opacity 0.15s, transform 0.1s; border: none;
    font-weight: 600; white-space: nowrap;
  }
  .btn:hover { opacity: 0.82; }
  .btn:active { transform: scale(0.96); }
  .btn-primary { background: ${C.accent}; color: #06090F; }
  .btn-secondary { background: transparent; color: ${C.textSecondary}; border: 1px solid ${C.border} !important; }
  .btn-danger { background: transparent; color: ${C.danger}; border: 1px solid ${C.danger}44 !important; }
  .btn-ghost { background: transparent; color: ${C.textSecondary}; padding: 6px 8px; }
  .btn-ghost:hover { color: ${C.textPrimary}; background: ${C.bgHover}; }
  .btn-ghost.del:hover { color: ${C.danger}; }

  .input-field {
    width: 100%; padding: 10px 14px;
    background: ${C.bgInput}; border: 1px solid ${C.border};
    border-radius: 8px; color: ${C.textPrimary}; font-size: 14px;
    transition: border-color 0.2s;
  }
  .input-field:focus { outline: none; border-color: ${C.accent}; }
  .input-field:hover { border-color: ${C.accent}66; }

  .card {
    background: ${C.bgCard}; border: 1px solid ${C.border};
    border-radius: 12px; padding: 16px;
    transition: border-color 0.2s;
    max-width: 100%; /* IMPEDE QUE O CONTEÚDO VAZE */
    overflow: hidden;
  }
  .card:hover { border-color: ${C.accent}33; }

  .tag {
    padding: 3px 9px; border-radius: 20px; font-size: 11px; font-weight: 600;
    background: ${C.accentGlow}; color: ${C.accent}; border: 1px solid ${C.accent}33;
  }
  .tag.sub { background: rgba(79,128,225,0.13); color: ${C.blue}; border-color: ${C.blue}33; }
  .tag.green { background: rgba(77,168,112,0.13); color: ${C.success}; border-color: ${C.success}33; }

  .field-label {
    display: block; margin-bottom: 6px;
    color: ${C.textSecondary}; font-size: 11.5px; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.6px;
  }
  .field-wrap { margin-bottom: 16px; }

  /* MUDANÇAS AQUI PARA CENTRALIZAR E LIMITAR O MODAL */
  .modal-overlay {
    position: fixed; inset: 0; z-index: 500;
    background: rgba(0,0,0,0.72); backdrop-filter: blur(6px);
    display: flex; align-items: center; justify-content: center; padding: 16px; 
  }
  .modal-box {
    background: ${C.bgCard}; border-radius: 16px;
    border: 1px solid ${C.border};
    width: 100%; max-width: 680px; 
    max-height: calc(100dvh - 32px); /* Limita o tamanho ao espaço da tela */
    display: flex; flex-direction: column; /* Permite rolagem apenas no corpo */
    box-shadow: 0 32px 64px rgba(0,0,0,0.6);
  }
  .modal-header {
    padding: 18px 24px; border-bottom: 1px solid ${C.border};
    display: flex; align-items: center; justify-content: space-between;
    background: ${C.bgCard}; z-index: 1; flex-shrink: 0;
    border-radius: 16px 16px 0 0;
  }
  .modal-body { 
    padding: 24px; 
    overflow-y: auto; 
    flex: 1; 
    -webkit-overflow-scrolling: touch; /* DESLIZE SUAVE DENTRO DO POP-UP */
  }

  .empty-state {
    text-align: center; padding: 60px 24px; color: ${C.textSecondary};
  }
  .role-chip {
    padding: 8px 12px; border-radius: 8px; cursor: pointer;
    display: flex; align-items: center; gap: 8px; font-size: 13px;
    border: 1px solid ${C.border}; background: transparent; color: ${C.textSecondary};
    transition: all 0.15s; user-select: none;
  }
  .role-chip.selected { 
    border-color: ${C.accent}; background: ${C.accentGlow}; color: ${C.accent};
  }
  .member-pick {
    padding: 8px 12px; border-radius: 8px; cursor: pointer;
    display: flex; align-items: center; gap: 10px; font-size: 13.5px;
    border: 1px solid ${C.border}; background: transparent;
    transition: all 0.15s;
  }
  .member-pick:hover { border-color: ${C.accent}66; background: ${C.bgHover}; }
  .member-pick.selected { border-color: ${C.accent}; background: ${C.accentGlow}; }

  .bar-bg { height: 6px; background: ${C.bgHover}; border-radius: 4px; overflow: hidden; margin-top: 6px; }
  .bar-fill { height: 100%; background: linear-gradient(90deg, ${C.accent}, ${C.accentDark}); border-radius: 4px; }

  .avatar {
    width: 44px; height: 44px; border-radius: 50%; flex-shrink: 0;
    background: ${C.accentGlow}; border: 2px solid ${C.accent}33;
    display: flex; align-items: center; justify-content: center;
    font-size: 17px; font-weight: 700; color: ${C.accent};
    overflow: hidden;
  }
  .avatar img { width: 100%; height: 100%; object-fit: cover; }

  .search-wrap { position: relative; margin-bottom: 18px; }
  .search-wrap svg { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); pointer-events: none; }
  .search-wrap input { padding-left: 36px; }

  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  @media (max-width: 500px) { .grid-2 { grid-template-columns: 1fr; } }

  .song-item {
    padding: 10px 14px; border-radius: 8px; cursor: pointer;
    display: flex; align-items: center; gap: 8px; font-size: 13px;
    color: ${C.textPrimary}; background: ${C.bgHover};
    transition: background 0.15s;
  }
  .song-item:hover { background: ${C.bgCard}; }

  .scale-song-row {
    padding: 12px; background: ${C.bgHover}; border-radius: 8px; margin-bottom: 8px;
  }

  .btn-whatsapp {
    background: #1FAD4A; color: #fff;
  }
  .btn-whatsapp:hover { opacity: 0.85; }

  .archive-divider {
    display: flex; align-items: center; gap: 10; margin: 4px 0;
    color: ${C.textSecondary}; font-size: 12px; cursor: pointer;
    padding: 6px 0; user-select: none;
  }
  .archive-divider:hover { color: ${C.textPrimary}; }

  .section-header {
    font-family: 'Cinzel', serif; font-size: 13px; font-weight: 700;
    color: ${C.textSecondary}; text-transform: uppercase; letter-spacing: 1px;
    margin-bottom: 10px; display: flex; align-items: center; gap: 8px;
  }

  .home-section { margin-top: 28px; text-align: left; }

  .birthday-chip {
    display: flex; align-items: center; gap: 10px;
    padding: 8px 12px; background: ${C.bgCard}; border: 1px solid ${C.border};
    border-radius: 10px; font-size: 13px;
  }
  .birthday-chip:hover { border-color: ${C.accent}44; }
`;

// ═══════════════════════════════════
// STORAGE HELPERS  (shared = sync between devices)
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

// ═══════════════════════════════════
// WHATSAPP SHARE HELPER
// ═══════════════════════════════════
function getYtId(url) {
  const m = url?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  return m ? m[1] : null;
}

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
      const roleObj = x.role ? ROLES.find(r => r.key === x.role) : null;
      const roleLabel = roleObj ? `${roleObj.emoji} ${roleObj.label}` : ((x.member.roles || []).map(r => ROLES.find(ro => ro.key === r)?.label).filter(Boolean).join(', '));
      txt += `• ${x.member.name}${x.isSub ? ' ↔ (substituto)' : ''}${roleLabel ? ` — ${roleLabel}` : ''}\n`;
    });
    txt += `\n`;
  }

  if (scSongs.length > 0) {
    txt += `*🎵 Repertório:*\n`;
    scSongs.forEach((x, i) => {
      txt += `${i + 1}. *${x.song.name}*`;
      if (x.key) txt += ` — Tom: ${x.key}`;
      if (x.notes) txt += ` | ${x.notes}`;
      if (x.song.youtubeUrl) txt += `\n   🔗 ${x.song.youtubeUrl}`;
      txt += `\n`;
    });
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
          <h2 style={{ fontFamily: 'Cinzel, serif', fontSize: 17, color: C.accent }}>{title}</h2>
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

  // Next 5 upcoming scales (today or future), sorted ascending
  const upcoming = [...scales]
    .filter(s => s.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5);

  // Members with birthday this month
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
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{
          width: 88, height: 88, borderRadius: '50%', margin: '0 auto 20px',
          overflow: 'hidden', border: `3px solid ${C.accent}`,
          boxShadow: `0 12px 32px ${C.accentGlow}`,
        }}>
          <img src={LOGO_HOME} alt="Oitava Music" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <h1 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, fontSize: 22, color: C.accent, marginBottom: 4, letterSpacing: '-0.5px' }}>Oitava Music Betim</h1>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 8 }}>
        {[
          { emoji: '👥', label: 'Membros',    val: counts.members,  sub: 'cadastrado', page: 'members' },
          { emoji: '🎸', label: 'Grupos',     val: counts.groups,   sub: 'formado',    page: 'groups'  },
          { emoji: '🎵', label: 'Repertório', val: counts.songs,    sub: 'música',     page: 'songs'   },
          { emoji: '📅', label: 'Escalas',    val: counts.scales,   sub: 'criada',     page: 'scales'  },
        ].map(item => (
          <div key={item.label} className="card" style={{ textAlign: 'left', cursor: 'pointer' }} onClick={() => onNav(item.page)}>
            <div style={{ fontSize: 20, marginBottom: 6 }}>{item.emoji}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: C.accent, fontFamily: 'Cinzel, serif' }}>{item.val}</div>
            <div style={{ fontSize: 11.5, color: C.textSecondary, marginTop: 2 }}>
              {item.label} {item.val !== 1 ? item.sub + 's' : item.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Upcoming Scales */}
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

      {/* Birthday Members */}
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
                  {/* ESSE minWidth: 0 FOI ADICIONADO PARA CORRIGIR TEXTOS GIGANTES */}
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
                    <div style={{ fontSize: 20, fontWeight: 700, color: isBday ? C.accent : C.textPrimary, fontFamily: 'Cinzel, serif' }}>{day}</div>
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

  const normalizeStr = (str) => (str || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();

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
        let width = img.width, height = img.height;
        if (width > height) { if (width > MAX_SIZE) { height = Math.round((height * MAX_SIZE) / width); width = MAX_SIZE; } } 
        else { if (height > MAX_SIZE) { width = Math.round((width * MAX_SIZE) / height); height = MAX_SIZE; } }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        setForm(f => ({ ...f, photo: canvas.toDataURL('image/jpeg', 0.7) }));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const toggleRole = key => setForm(f => ({
    ...f, roles: f.roles.includes(key) ? f.roles.filter(r => r !== key) : [...f.roles, key]
  }));

  const save = () => {
    if (!form.name.trim()) return;
    // 1. OBRIGA A DATA DE NASCIMENTO
    if (!form.birthdate) {
      alert('A Data de Nascimento é obrigatória para cadastrar um membro.');
      return;
    }

    // 2. EXCLUSÃO DA FUNÇÃO "VOZES" SILENCIOSAMENTE
    const cleanedRoles = form.roles.filter(r => r !== 'vozes' && r !== 'vocal' && r !== 'vocalista');
    const dataToSave = { ...form, roles: cleanedRoles };

    if (modal === 'add') setMembers(p => [...p, { ...dataToSave, id: genId() }]);
    else setMembers(p => p.map(m => m.id === form.id ? dataToSave : m));
    setModal(null);
  };

  const del = id => { setMembers(p => p.filter(m => m.id !== id)); setConfirm(null); };

  const handleCSV = e => {
    /* (MANTENHA A SUA FUNÇÃO DE IMPORTAÇÃO handleCSV AQUI PARA NÃO PERDER O CÓDIGO GIGANTE DELA) */
  };
  const doImport = () => {
    /* (MANTENHA A SUA FUNÇÃO doImport AQUI) */
  };

  const filtered = members
    .filter(m => normalizeStr(m.name).includes(normalizeStr(search)))
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' }));

  return (
    <div style={{ padding: 24, maxWidth: 860 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontFamily: 'Cinzel, serif', fontSize: 21, color: C.accent }}>Membros</h1>
          <p style={{ color: C.textSecondary, fontSize: 13 }}>{members.length} membro{members.length !== 1 ? 's' : ''}</p>
        </div>
        <Btn onClick={openAdd}><Plus size={15} />Novo Membro</Btn>
      </div>

      <div className="search-wrap">
        <Search size={15} color={C.textSecondary} />
        <input className="input-field" placeholder="Buscar membros..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state"><Users size={38} style={{ marginBottom: 12, opacity: 0.25 }} /><p>Nenhum membro encontrado</p></div>
      ) : (
        <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
          {filtered.map(m => (
            <div key={m.id} className="card" style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <Avatar member={m} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, color: C.textPrimary, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</div>
                {m.email && <div style={{ fontSize: 12, color: C.textSecondary, marginBottom: 6 }}>{m.email}</div>}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                  {(m.roles || []).map(r => { const ro = ROLES.find(x => x.key === r); return ro ? <span key={r} className="tag">{ro.emoji} {ro.label}</span> : null; })}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                <Btn variant="ghost" onClick={() => openEdit(m)}><Edit2 size={14} /></Btn>
                <Btn variant="ghost" className="del" onClick={() => setConfirm(m.id)}><Trash2 size={14} /></Btn>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <Modal title={modal === 'add' ? 'Novo Membro' : 'Editar Membro'} onClose={() => setModal(null)}>
          <Inp label="Nome *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nome completo" />
          <div className="grid-2">
            <Inp label="Data de Nascimento *" type="date" value={form.birthdate} onChange={e => setForm(f => ({ ...f, birthdate: e.target.value }))} />
            <Inp label="Telefone" type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="(11) 99999-9999" />
          </div>
          <Inp label="E-mail" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@exemplo.com" />

          <Field label="Foto (Compactada Automaticamente)">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {form.photo && <img src={form.photo} alt="" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${C.accent}` }} />}
              <label style={{ cursor: 'pointer', padding: '8px 14px', border: `1px dashed ${C.border}`, borderRadius: 8, color: C.textSecondary, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Upload size={14} />Selecionar foto
                <input type="file" accept="image/*" onChange={handlePhoto} style={{ display: 'none' }} />
              </label>
              {form.photo && <Btn variant="ghost" style={{ padding: '4px 8px', fontSize: 12 }} onClick={() => setForm(f => ({ ...f, photo: '' }))}>Remover</Btn>}
            </div>
          </Field>

          <Field label="Funções">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
              {ROLES.map(r => (
                <div key={r.key} className={`role-chip${form.roles.includes(r.key) ? ' selected' : ''}`} onClick={() => toggleRole(r.key)}>
                  <span>{r.emoji}</span>{r.label}
                  {form.roles.includes(r.key) && <Check size={13} style={{ marginLeft: 'auto' }} />}
                </div>
              ))}
            </div>
          </Field>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
            <Btn variant="secondary" onClick={() => setModal(null)}>Cancelar</Btn>
            <Btn onClick={save}><Check size={14} />Salvar</Btn>
          </div>
        </Modal>
      )}
      {confirm && <Confirm msg="Excluir este membro permanentemente?" onOk={() => del(confirm)} onCancel={() => setConfirm(null)} />}
    </div>
  );
}

// ─── Groups ────────────────────────────────────────────────

function GroupsPage({ groups, setGroups, members }) {
  const [modal, setModal] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [form, setForm] = useState({ name: '', memberIds: [] });
  const [mSearch, setMSearch] = useState('');

  const openAdd = () => { setForm({ name: '', memberIds: [] }); setMSearch(''); setModal('add'); };
  const openEdit = g => { setForm({ ...g, memberIds: [...(g.memberIds || [])] }); setMSearch(''); setModal(g); };

  const toggleM = id => setForm(f => ({ ...f, memberIds: f.memberIds.includes(id) ? f.memberIds.filter(x => x !== id) : [...f.memberIds, id] }));

  const save = () => {
    if (!form.name.trim()) return;
    if (modal === 'add') setGroups(p => [...p, { ...form, id: genId() }]);
    else setGroups(p => p.map(g => g.id === form.id ? { ...form } : g));
    setModal(null);
  };
  const del = id => { setGroups(p => p.filter(g => g.id !== id)); setConfirm(null); };

  const filteredM = members.filter(m => m.name.toLowerCase().includes(mSearch.toLowerCase()));

  return (
    <div style={{ padding: 24, maxWidth: 860 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontFamily: 'Cinzel, serif', fontSize: 21, color: C.accent }}>Grupos</h1>
          <p style={{ color: C.textSecondary, fontSize: 13 }}>{groups.length} grupo{groups.length !== 1 ? 's' : ''}</p>
        </div>
        <Btn onClick={openAdd}><Plus size={15} />Novo Grupo</Btn>
      </div>

      {groups.length === 0 ? (
        <div className="empty-state"><Music size={38} style={{ marginBottom: 12, opacity: 0.25 }} /><p>Nenhum grupo cadastrado</p></div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {groups.map(g => {
            const gMembers = members.filter(m => (g.memberIds || []).includes(m.id));
            return (
              <div key={g.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, color: C.textPrimary, fontSize: 16, marginBottom: 10 }}>{g.name}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {gMembers.map(m => (
                        <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 10px', background: C.bgHover, borderRadius: 20, fontSize: 12 }}>
                          <Avatar member={m} size={20} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</span>
                        </div>
                      ))}
                      {gMembers.length === 0 && <span style={{ color: C.textSecondary, fontSize: 13 }}>Sem membros</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                    <Btn variant="ghost" onClick={() => openEdit(g)}><Edit2 size={14} /></Btn>
                    <Btn variant="ghost" className="del" onClick={() => setConfirm(g.id)}><Trash2 size={14} /></Btn>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal && (
        <Modal title={modal === 'add' ? 'Novo Grupo' : 'Editar Grupo'} onClose={() => setModal(null)} wide>
          <Inp label="Nome do Grupo *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Grupo Alpha" />
          <Field label={`Membros (${form.memberIds.length} selecionado${form.memberIds.length !== 1 ? 's' : ''})`}>
            <div className="search-wrap" style={{ marginBottom: 10 }}>
              <Search size={13} color={C.textSecondary} />
              <input className="input-field" placeholder="Filtrar membros..." value={mSearch} onChange={e => setMSearch(e.target.value)} style={{ fontSize: 13 }} />
            </div>
            <div style={{ maxHeight: 240, overflowY: 'auto', display: 'grid', gap: 5 }}>
              {filteredM.map(m => (
                <div key={m.id} className={`member-pick${form.memberIds.includes(m.id) ? ' selected' : ''}`} onClick={() => toggleM(m.id)}>
                  <Avatar member={m} size={32} />
                  <div style={{ flex: 1 }}>
                    <div style={{ color: form.memberIds.includes(m.id) ? C.accent : C.textPrimary, fontWeight: 500 }}>{m.name}</div>
                    <div style={{ fontSize: 11, color: C.textSecondary }}>{(m.roles || []).map(r => ROLES.find(x => x.key === r)?.label).filter(Boolean).join(', ') || 'Sem função'}</div>
                  </div>
                  {form.memberIds.includes(m.id) && <Check size={15} color={C.accent} />}
                </div>
              ))}
              {filteredM.length === 0 && <div style={{ textAlign: 'center', padding: 20, color: C.textSecondary, fontSize: 13 }}>Nenhum membro</div>}
            </div>
          </Field>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
            <Btn variant="secondary" onClick={() => setModal(null)}>Cancelar</Btn>
            <Btn onClick={save}><Check size={14} />Salvar</Btn>
          </div>
        </Modal>
      )}
      {confirm && <Confirm msg="Excluir este grupo?" onOk={() => del(confirm)} onCancel={() => setConfirm(null)} />}
    </div>
  );
}

// ─── Songs ────────────────────────────────────────────────

function SongsPage({ songs, setSongs }) {
  const [modal, setModal] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [form, setForm] = useState({ title: '', artist: '', link: '', bpm: '' });

  const openAdd = () => { setForm({ title: '', artist: '', link: '', bpm: '' }); setModal('add'); };
  const openEdit = s => { setForm(s); setModal(s); };

  const save = () => {
    if (!form.title.trim()) return;
    if (modal === 'add') setSongs(p => [...p, { ...form, id: genId() }]);
    else setSongs(p => p.map(s => s.id === form.id ? { ...form } : s));
    setModal(null);
  };
  const del = id => { setSongs(p => p.filter(s => s.id !== id)); setConfirm(null); };

  return (
    <div style={{ padding: 24, maxWidth: 860 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'Cinzel, serif', fontSize: 21, color: C.accent }}>Músicas</h1>
          <p style={{ color: C.textSecondary, fontSize: 13 }}>{songs.length} música{songs.length !== 1 ? 's' : ''}</p>
        </div>
        <Btn onClick={openAdd}><Plus size={15} />Nova Música</Btn>
      </div>

      {songs.length === 0 ? (
        <div className="empty-state"><p>Nenhuma música cadastrada</p></div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {songs.sort((a,b) => a.title.localeCompare(b.title)).map(s => (
            <div key={s.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: 8, background: C.bgHover, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Music size={18} color={C.textSecondary} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, color: C.textPrimary, marginBottom: 2 }}>{s.title}</div>
                <div style={{ fontSize: 13, color: C.textSecondary, display: 'flex', gap: 8, alignItems: 'center' }}>
                  {s.artist && <span>{s.artist}</span>}
                  {s.bpm && <span className="tag">⏱️ {s.bpm} BPM</span>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                {s.link && <Btn variant="ghost" onClick={() => window.open(s.link, '_blank')}><Link size={15} /></Btn>}
                <Btn variant="ghost" onClick={() => openEdit(s)}><Edit2 size={15} /></Btn>
                <Btn variant="ghost" className="del" onClick={() => setConfirm(s.id)}><Trash2 size={15} /></Btn>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <Modal title={modal === 'add' ? 'Nova Música' : 'Editar Música'} onClose={() => setModal(null)}>
          <Inp label="Título *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          <div className="grid-2">
            <Inp label="Artista" value={form.artist} onChange={e => setForm(f => ({ ...f, artist: e.target.value }))} />
            <Inp label="BPM" type="number" value={form.bpm} onChange={e => setForm(f => ({ ...f, bpm: e.target.value }))} placeholder="Ex: 74" />
          </div>
          <Inp label="Link (YouTube / CifraClub)" value={form.link} onChange={e => setForm(f => ({ ...f, link: e.target.value }))} />
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
            <Btn variant="secondary" onClick={() => setModal(null)}>Cancelar</Btn>
            <Btn onClick={save}><Check size={14} />Salvar</Btn>
          </div>
        </Modal>
      )}
      {confirm && <Confirm msg="Excluir esta música?" onOk={() => del(confirm)} onCancel={() => setConfirm(null)} />}
    </div>
  );
}

// ─── Archived collapsible helper ───────────────────────────

function ArchivedSection({ archived, ScaleCard }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <div
        onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none', marginBottom: open ? 10 : 0 }}
      >
        <div className="section-header" style={{ marginBottom: 0, flex: 1 }}>
          📦 Arquivadas ({archived.length})
        </div>
        <span style={{ fontSize: 11, color: C.textSecondary }}>{open ? '▲ ocultar' : '▼ mostrar'}</span>
      </div>
      {open && (
        <div style={{ display: 'grid', gap: 8 }}>
          {archived.map(sc => (
            <div key={sc.id} style={{ opacity: 0.65 }}>
              <ScaleCard sc={sc} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Scales ────────────────────────────────────────────────

function ScalesPage({ scales, setScales, members, groups, songs }) {
  const [modal, setModal] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [form, setForm] = useState({ date: '', title: '', members: [], songs: [] });

  // Normaliza membros das escalas antigas para o formato novo [{id, roles}]
  const normalizeScaleMembers = (membersArray) => {
    if (!membersArray) return [];
    return membersArray.map(m => {
      if (typeof m === 'string') {
        const globalM = members.find(x => x.id === m);
        return { id: m, roles: globalM ? globalM.roles.filter(r => r !== 'vozes' && r !== 'vocal') : [] };
      }
      return m;
    });
  };

  const openAdd = () => { setForm({ date: '', title: '', members: [], songs: [] }); setModal('add'); };
  
  const openEdit = (s) => {
    const formattedSongs = (s.songs || []).map(song => typeof song === 'string' ? { songId: song, solos: [] } : song);
    setForm({ ...s, songs: formattedSongs, members: normalizeScaleMembers(s.members) });
    setModal(s);
  };

  const save = () => {
    if (!form.date) return alert('Por favor, informe a data da escala.');
    if (modal === 'add') setScales(p => [...p, { ...form, id: genId() }]);
    else setScales(p => p.map(x => x.id === form.id ? { ...form } : x));
    setModal(null);
  };

  const del = id => { setScales(p => p.filter(x => x.id !== id)); setConfirm(null); };

  // Adiciona ou remove membro da escala (padrão com todas as funções dele)
  const toggleMember = id => {
    setForm(f => {
      const exists = f.members.find(m => m.id === id);
      if (exists) return { ...f, members: f.members.filter(m => m.id !== id) };
      const globalM = members.find(x => x.id === id);
      const cleanRoles = (globalM?.roles || []).filter(r => r !== 'vozes' && r !== 'vocal');
      return { ...f, members: [...f.members, { id, roles: cleanRoles }] };
    });
  };

  // Liga/desliga qual função a pessoa fará NESSE dia específico
  const toggleScaleRole = (memberId, roleKey) => {
    setForm(f => ({
      ...f,
      members: f.members.map(m => {
        if (m.id !== memberId) return m;
        const newRoles = m.roles.includes(roleKey) ? m.roles.filter(r => r !== roleKey) : [...m.roles, roleKey];
        return { ...m, roles: newRoles };
      })
    })
  )};

  const addSong = e => {
    const id = e.target.value;
    if (!id || form.songs.find(s => s.songId === id)) return;
    setForm(f => ({ ...f, songs: [...f.songs, { songId: id, solos: [] }] }));
    e.target.value = '';
  };
  const removeSong = id => setForm(f => ({ ...f, songs: f.songs.filter(s => s.songId !== id) }));
  const toggleSolo = (songId, memberId) => {
    setForm(f => ({
      ...f, songs: f.songs.map(s => {
        if (s.songId !== songId) return s;
        return { ...s, solos: s.solos.includes(memberId) ? s.solos.filter(x => x !== memberId) : [...s.solos, memberId] };
      })
    }));
  };

  const shareWhatsApp = (scale) => {
    let text = `🗓️ *ESCALA DE LOUVOR - OITAVA MUSIC*\n`;
    if (scale.title) text += `📌 *${scale.title}*\n`;
    const [y, m, d] = scale.date.split('-');
    text += `📅 *Data:* ${d}/${m}/${y}\n\n`;
    text += `👥 *EQUIPE:*\n`;

    const normalizedMembers = normalizeScaleMembers(scale.members);

    ROLES.forEach(role => {
      const peeps = normalizedMembers.filter(sm => sm.roles && sm.roles.includes(role.key));
      if (peeps.length > 0) {
        const firstNames = peeps.map(p => {
          const globalM = members.find(x => x.id === p.id);
          return globalM ? globalM.name.split(' ')[0] : 'Desconhecido';
        }).join(', ');
        text += `${role.emoji} *${role.label}:* ${firstNames}\n`;
      }
    });

    text += `\n🎵 *REPERTÓRIO:*\n`;
    if (!scale.songs || scale.songs.length === 0) text += `_(Repertório ainda não definido)_\n`;
    else {
       scale.songs.forEach((s, idx) => {
         const songObj = songs.find(x => x.id === s.songId);
         if (songObj) {
           text += `${idx + 1}️⃣ ${songObj.title}`;
           if (s.solos && s.solos.length > 0) {
             const soloNames = members.filter(x => s.solos.includes(x.id)).map(x => x.name.split(' ')[0]).join(', ');
             text += ` *(Solo: ${soloNames})*`;
           }
           text += `\n`;
         }
       });
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Filtra APENAS quem assumiu as funções de voz na escala atual
  const availableVocals = members.filter(m => {
    const scaleMember = form.members.find(fm => fm.id === m.id);
    if (!scaleMember) return false;
    return scaleMember.roles.some(r => ['soprano', 'contralto', 'tenor'].includes(r));
  });

  return (
    <div style={{ padding: 24, maxWidth: 860 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'Cinzel, serif', fontSize: 21, color: C.accent }}>Escalas</h1>
          <p style={{ color: C.textSecondary, fontSize: 13 }}>Organize a equipe e o repertório</p>
        </div>
        <Btn onClick={openAdd}><Plus size={15} />Nova Escala</Btn>
      </div>

      {scales.length === 0 ? (
        <div className="empty-state"><p>Nenhuma escala montada</p></div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {scales.sort((a,b) => b.date.localeCompare(a.date)).map(s => {
            const [y, m, d] = s.date.split('-');
            return (
              <div key={s.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ background: C.bgInput, padding: '10px 14px', borderRadius: 8, textAlign: 'center', border: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: 11, color: C.textSecondary, textTransform: 'uppercase' }}>{m}/{y}</div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: C.accent }}>{d}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 16, color: C.textPrimary, marginBottom: 4 }}>{s.title || 'Culto'}</div>
                  <div style={{ fontSize: 13, color: C.textSecondary }}>
                    {s.members?.length || 0} na equipe • {s.songs?.length || 0} músicas
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <Btn variant="secondary" onClick={() => shareWhatsApp(s)} title="Enviar WhatsApp">
                    <Share2 size={16} color="#25D366" />
                  </Btn>
                  <Btn variant="ghost" onClick={() => openEdit(s)}><Edit2 size={15} /></Btn>
                  <Btn variant="ghost" className="del" onClick={() => setConfirm(s.id)}><Trash2 size={15} /></Btn>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {modal && (
        <Modal title={modal === 'add' ? 'Nova Escala' : 'Editar Escala'} onClose={() => setModal(null)} wide>
          <div className="grid-2">
            <Inp label="Data *" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            <Inp label="Título (Ex: Culto de Domingo)" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Opcional" />
          </div>

          <Field label="Equipe Escalada e Funções no Dia">
            <div style={{ maxHeight: 280, overflowY: 'auto', padding: 10, background: C.bgInput, borderRadius: 8, border: `1px solid ${C.border}` }}>
              {members.sort((a,b) => a.name.localeCompare(b.name)).map(m => {
                const scaleMember = form.members.find(fm => fm.id === m.id);
                const isSelected = !!scaleMember;
                
                return (
                  <div key={m.id} style={{ marginBottom: 8, paddingBottom: 8, borderBottom: `1px dashed ${C.border}` }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontWeight: isSelected ? 700 : 400 }}>
                      <input type="checkbox" checked={isSelected} onChange={() => toggleMember(m.id)} />
                      <span style={{ color: isSelected ? C.textPrimary : C.textSecondary }}>{m.name}</span>
                    </label>
                    
                    {isSelected && (
                      <div style={{ marginTop: 8, marginLeft: 24, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {(m.roles || []).filter(r => r !== 'vozes' && r !== 'vocal').map(roleKey => {
                          const rObj = ROLES.find(x => x.key === roleKey);
                          if (!rObj) return null;
                          const isActingRole = scaleMember.roles.includes(roleKey);
                          
                          return (
                            <div 
                              key={roleKey} onClick={() => toggleScaleRole(m.id, roleKey)}
                              style={{ 
                                padding: '2px 8px', fontSize: 11, borderRadius: 12, cursor: 'pointer',
                                background: isActingRole ? C.accent : C.bgHover,
                                color: isActingRole ? '#000' : C.textSecondary,
                                border: `1px solid ${isActingRole ? C.accent : C.border}`
                              }}
                            >
                              {rObj.emoji} {rObj.label}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </Field>

          <Field label="Repertório e Solistas">
            <select className="input-field" onChange={addSong} value="" style={{ marginBottom: 12 }}>
              <option value="">+ Adicionar música à escala...</option>
              {songs.sort((a,b) => a.title.localeCompare(b.title)).map(s => (
                <option key={s.id} value={s.id}>{s.title} {s.artist ? `- ${s.artist}` : ''}</option>
              ))}
            </select>

            <div style={{ display: 'grid', gap: 8 }}>
              {form.songs.map((songItem, index) => {
                const sObj = songs.find(x => x.id === songItem.songId);
                if (!sObj) return null;
                
                return (
                  <div key={index} style={{ background: C.bgSecondary, padding: 12, borderRadius: 8, border: `1px solid ${C.border}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, color: C.textPrimary }}>{index + 1}. {sObj.title} {sObj.bpm && <span style={{fontSize: 11, color: C.accent}}>({sObj.bpm} BPM)</span>}</span>
                      <Btn variant="ghost" style={{ padding: '4px 8px' }} onClick={() => removeSong(songItem.songId)}>Remover</Btn>
                    </div>
                    
                    {availableVocals.length > 0 ? (
                      <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px dashed ${C.border}` }}>
                        <span style={{ fontSize: 11, color: C.textSecondary, display: 'block', marginBottom: 6 }}>🎤 Quem fará o solo? (Apenas Soprano, Contralto e Tenor)</span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {availableVocals.map(v => {
                            const isSolo = songItem.solos.includes(v.id);
                            return (
                              <div 
                                key={v.id} onClick={() => toggleSolo(songItem.songId, v.id)}
                                style={{ 
                                  padding: '4px 10px', fontSize: 12, borderRadius: 20, cursor: 'pointer',
                                  background: isSolo ? C.accent : C.bgInput, 
                                  color: isSolo ? '#000' : C.textSecondary,
                                  fontWeight: isSolo ? 700 : 400, border: `1px solid ${isSolo ? C.accent : C.border}`
                                }}
                              >
                                {v.name.split(' ')[0]}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ) : (
                      <div style={{ marginTop: 8, fontSize: 11, color: C.textSecondary }}>
                        (Adicione tenores, contraltos ou sopranos na equipe acima para designar solos)
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </Field>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
            <Btn variant="secondary" onClick={() => setModal(null)}>Cancelar</Btn>
            <Btn onClick={save}><Check size={14} />Salvar Escala</Btn>
          </div>
        </Modal>
      )}

      {confirm && <Confirm msg="Excluir esta escala?" onOk={() => del(confirm)} onCancel={() => setConfirm(null)} />}
    </div>
  );
}

// ─── Reports ────────────────────────────────────────────────

function ReportsPage({ scales, songs }) {
  const today = new Date().toISOString().split('T')[0];
  const threeMonthsAgo = (() => { const d = new Date(); d.setMonth(d.getMonth() - 3); return d.toISOString().split('T')[0]; })();

  const [start, setStart] = useState(threeMonthsAgo);
  const [end, setEnd] = useState(today);

  const inRange = scales.filter(s => s.date >= start && s.date <= end);
  const counts = {};
  inRange.forEach(sc => (sc.scaleSongs || []).forEach(ss => { counts[ss.songId] = (counts[ss.songId] || 0) + 1; }));
  const ranked = Object.entries(counts)
    .map(([id, n]) => ({ song: songs.find(s => s.id === id), n }))
    .filter(r => r.song)
    .sort((a, b) => b.n - a.n);
  const max = ranked[0]?.n || 1;

  return (
    <div style={{ padding: 24, maxWidth: 760 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'Cinzel, serif', fontSize: 21, color: C.accent, marginBottom: 3 }}>Relatórios</h1>
        <p style={{ color: C.textSecondary, fontSize: 13 }}>Músicas mais escaladas no período selecionado</p>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="grid-2">
          <div>
            <label className="field-label">Data Inicial</label>
            <input className="input-field" type="date" value={start} onChange={e => setStart(e.target.value)} />
          </div>
          <div>
            <label className="field-label">Data Final</label>
            <input className="input-field" type="date" value={end} onChange={e => setEnd(e.target.value)} />
          </div>
        </div>
        <div style={{ marginTop: 12, fontSize: 13, color: C.textSecondary }}>
          <strong style={{ color: C.textPrimary }}>{inRange.length}</strong> escala{inRange.length !== 1 ? 's' : ''} no período ·{' '}
          <strong style={{ color: C.textPrimary }}>{ranked.length}</strong> música{ranked.length !== 1 ? 's' : ''} escalada{ranked.length !== 1 ? 's' : ''}
        </div>
      </div>

      {ranked.length === 0 ? (
        <div className="empty-state"><BarChart2 size={38} style={{ marginBottom: 12, opacity: 0.25 }} /><p>Nenhuma música escalada neste período</p></div>
      ) : (
        <div style={{ display: 'grid', gap: 8 }}>
          {ranked.map((r, i) => (
            <div key={r.song.id} className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: 13,
                  background: i < 3 ? C.accentGlow : C.bgHover,
                  color: i < 3 ? C.accent : C.textSecondary,
                  border: `1px solid ${i < 3 ? C.accent + '44' : C.border}`,
                }}>
                  {i < 3 ? ['🥇','🥈','🥉'][i] : i + 1}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: C.textPrimary, marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.song.name}</div>
                  <div className="bar-bg"><div className="bar-fill" style={{ width: `${(r.n / max) * 100}%` }} /></div>
                </div>
                <div style={{ fontWeight: 700, color: C.accent, fontSize: 20, fontFamily: 'Cinzel, serif', flexShrink: 0 }}>{r.n}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════
// APP ROOT
// ═══════════════════════════════════

export default function App() {
  const [page, setPage] = useState('home');
  const [members, setMembers] = useState([]);
  const [groups, setGroups]   = useState([]);
  const [songs, setSongs]     = useState([]);
  const [scales, setScales]   = useState([]);
  const [ready, setReady]     = useState(false);
  const [sideOpen, setSideOpen] = useState(false);
  const [syncing, setSyncing]   = useState(false);
  const [syncOk, setSyncOk]     = useState(null);

  const [autenticado, setAutenticado] = useState(false);
  const [codigo, setCodigo] = useState('');

  // --- NOVO: GERENCIADOR DO BOTÃO VOLTAR DO CELULAR ---
  useEffect(() => {
    // Ao carregar, define a página inicial no histórico do celular
    window.history.replaceState({ page: 'home' }, '', '#home');

    const handlePopState = (event) => {
      // Quando o usuário aperta o botão de voltar do Android/iOS, este evento dispara
      if (event.state && event.state.page) {
        setPage(event.state.page); // Volta pra página anterior que estava salva
        setSideOpen(false); // Garante que o menu fecha se estiver aberto
      } else {
        setPage('home'); // Prevenção: na dúvida, joga pra tela inicial
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);
  // ----------------------------------------------------

  const loadAll = async () => {
    const [m, g, s, sc] = await Promise.all([
      dbGet('members'), dbGet('groups'), dbGet('songs'), dbGet('scales')
    ]);
    if (m) setMembers(m);
    if (g) setGroups(g);
    if (s) setSongs(s);
    if (sc) setScales(sc);
  };

  useEffect(() => {
    setSyncing(true);
    loadAll()
      .then(() => { setSyncOk(true); setReady(true); })
      .catch(() => { setSyncOk(false); setReady(true); })
      .finally(() => setSyncing(false));
  }, []);

  const save = async (key, val) => {
    setSyncing(true); setSyncOk(null);
    try { await dbSet(key, val); setSyncOk(true); }
    catch { setSyncOk(false); }
    finally { setSyncing(false); }
  };

  useEffect(() => {
    const onFocus = () => { if (ready) loadAll(); };
    window.addEventListener('focus', onFocus);
    const interval = setInterval(() => { if (document.hasFocus() && ready) loadAll(); }, 30000);
    return () => { window.removeEventListener('focus', onFocus); clearInterval(interval); };
  }, [ready]);

  useEffect(() => { if (ready) save('members', members); }, [members]);
  useEffect(() => { if (ready) save('groups',  groups);  }, [groups]);
  useEffect(() => { if (ready) save('songs',   songs);   }, [songs]);
  useEffect(() => { if (ready) save('scales',  scales);  }, [scales]);

  // --- ATUALIZADO: FUNÇÃO DE NAVEGAÇÃO ---
  const nav = id => {
    if (page !== id) {
      // Adiciona a nova tela ao histórico para o botão voltar funcionar
      window.history.pushState({ page: id }, '', `#${id}`);
      setPage(id);
    }
    setSideOpen(false);
  };
  // ---------------------------------------

  const current = NAV.find(n => n.id === page);

  // 1. TELA DE CARREGAMENTO
  if (!ready) return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', color: C.textSecondary, gap: 16 }}>
        <img src={LOGO_HOME} alt="" style={{ width: 64, height: 64, borderRadius: '50%', border: `2px solid ${C.accent}` }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 18, height: 18, border: `2px solid ${C.accent}44`, borderTopColor: C.accent, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          Conectando ao Firebase...
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </>
  );

  // 2. TELA DE SENHA
  if (!autenticado) return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div style={{ 
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
        minHeight: '100dvh', padding: 24, background: C.bg 
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ 
            width: 80, height: 80, borderRadius: '50%', margin: '0 auto 16px',
            overflow: 'hidden', border: `2px solid ${C.accent}`, boxShadow: `0 8px 24px ${C.accentGlow}`
          }}>
            <img src={LOGO_HOME} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <h2 style={{ fontFamily: 'Cinzel, serif', color: C.accent, marginBottom: 8, fontSize: 22 }}>Acesso Restrito</h2>
          <p style={{ color: C.textSecondary, fontSize: 13 }}>Insira o código de acesso da equipe</p>
        </div>
        
        <div style={{ width: '100%', maxWidth: 280 }}>
          <input 
            className="input-field" 
            type="password" 
            placeholder="••••" 
            value={codigo} 
            onChange={e => setCodigo(e.target.value)} 
            style={{ textAlign: 'center', marginBottom: 16, fontSize: 24, letterSpacing: 8, padding: '12px' }}
          />
          <Btn style={{ width: '100%', justifyContent: 'center', padding: '12px' }} onClick={() => {
            if (codigo === "8itav@123") {
              setAutenticado(true);
            } else {
              alert("Código incorreto!");
              setCodigo('');
            }
          }}>Entrar</Btn>
        </div>
      </div>
    </>
  );

  // 3. O SEU APP PRINCIPAL
  return (
    <>
      <style>{GLOBAL_CSS}</style>

      {/* Sidebar */}
      <div className={`sidebar${sideOpen ? ' open' : ''}`}>
        <div style={{ padding: '16px 18px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src={LOGO_SIDEBAR} alt="Logo" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
          <div style={{ fontFamily: 'Montserrat, sans-serif', color: C.accent, fontSize: 13, fontWeight: 900, lineHeight: 1.3 }}>
            Oitava Music<br />Betim
          </div>
        </div>
        <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto' }}>
          {NAV.map(n => (
            <div key={n.id} className={`nav-item${page === n.id ? ' active' : ''}`} onClick={() => nav(n.id)}>
              <span style={{ fontSize: 18 }}>{n.emoji}</span>{n.label}
            </div>
          ))}
        </nav>
        <div style={{ padding: '12px 16px', borderTop: `1px solid ${C.border}`, fontSize: 11, color: C.textSecondary, lineHeight: 1.5 }}>
          ☁️ Sincronizado entre<br />todos os dispositivos
        </div>
      </div>

      {/* Mobile overlay */}
      {sideOpen && <div onClick={() => setSideOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 199 }} />}

      {/* Main */}
      <div className="main-content" style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', overflowX: 'hidden', width: '100%' }}>
        {/* Topbar */}
        <div style={{ height: 54, background: C.bgSecondary, borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', padding: '0 18px', gap: 12, position: 'sticky', top: 0, zIndex: 100 }}>
          <button className="topbar-menu-btn btn-ghost btn" onClick={() => setSideOpen(x => !x)} style={{ padding: '6px 8px' }}>
            <Menu size={19} />
          </button>
          <span style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, color: C.accent, fontSize: 13, flex: 1 }}>
            {current?.emoji} {current?.label}
          </span>
          {/* Sync status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: syncing ? C.textSecondary : syncOk === true ? C.success : syncOk === false ? C.danger : C.textSecondary }}>
            {syncing
              ? <div style={{ width: 8, height: 8, borderRadius: '50%', border: `1.5px solid ${C.textSecondary}44`, borderTopColor: C.textSecondary, animation: 'spin 0.8s linear infinite' }} />
              : <div style={{ width: 8, height: 8, borderRadius: '50%', background: syncOk === true ? C.success : syncOk === false ? C.danger : C.textSecondary + '44' }} />
            }
            <span style={{ display: 'none' }} className="sync-label">
              {syncing ? 'Salvando...' : syncOk === true ? 'Salvo' : syncOk === false ? 'Erro' : ''}
            </span>
          </div>
        </div>

        {/* Page */}
        <div style={{ flex: 1 }}>
          {page === 'home'    && <HomePage counts={{ members: members.length, groups: groups.length, songs: songs.length, scales: scales.length }} scales={scales} members={members} groups={groups} onNav={nav} />}
          {page === 'members' && <MembersPage members={members} setMembers={setMembers} />}
          {page === 'groups'  && <GroupsPage groups={groups} setGroups={setGroups} members={members} />}
          {page === 'songs'   && <SongsPage songs={songs} setSongs={setSongs} />}
          {page === 'scales'  && <ScalesPage scales={scales} setScales={setScales} members={members} groups={groups} songs={songs} />}
          {page === 'reports' && <ReportsPage scales={scales} songs={songs} />}
        </div>
      </div>
    </>
  );
}
