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
  { key: 'bateria',  label: 'Bateria',  emoji: '🥁' },
  { key: 'baixo',    label: 'Baixo',    emoji: '🎸' },
  { key: 'violao',   label: 'Violão',   emoji: '🎵' },
  { key: 'teclado',  label: 'Teclado',  emoji: '🎹' },
  { key: 'vocal',    label: 'Vocal',    emoji: '🎤' },
  { key: 'ministro', label: 'Ministro', emoji: '✨' },
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
    overscroll-behavior-y: none; /* EVITA A TELA "DANÇAR" PARA CIMA/BAIXO (PWA) */
    -webkit-tap-highlight-color: transparent; /* EVITA FUNDO AZUL AO CLICAR EM BOTÕES NO CELULAR */
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
  .modal-body { padding: 24px; overflow-y: auto; flex: 1; }

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
const LOGO_HOME = "/Logo1.png"; 
const LOGO_SIDEBAR = "Logo1.png";
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
          <img src={LOGO_B64} alt="Oitava Music" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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

  const openAdd = () => { setForm({ name: '', birthdate: '', email: '', phone: '', photo: '', roles: [] }); setModal('add'); };
  const openEdit = m => { setForm({ ...m, roles: [...(m.roles || [])] }); setModal(m); };

  const handlePhoto = e => {
    const file = e.target.files[0]; if (!file) return;
    const r = new FileReader();
    r.onload = ev => setForm(f => ({ ...f, photo: ev.target.result }));
    r.readAsDataURL(file);
  };

  const toggleRole = key => setForm(f => ({
    ...f, roles: f.roles.includes(key) ? f.roles.filter(r => r !== key) : [...f.roles, key]
  }));

  const save = () => {
    if (!form.name.trim()) return;
    if (modal === 'add') setMembers(p => [...p, { ...form, id: genId() }]);
    else setMembers(p => p.map(m => m.id === form.id ? { ...form } : m));
    setModal(null);
  };
  const del = id => { setMembers(p => p.filter(m => m.id !== id)); setConfirm(null); };

  const filtered = members.filter(m => m.name.toLowerCase().includes(search.toLowerCase()));

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
            <Inp label="Data de Nascimento" type="date" value={form.birthdate} onChange={e => setForm(f => ({ ...f, birthdate: e.target.value }))} />
            <Inp label="Telefone" type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="(11) 99999-9999" />
          </div>
          <Inp label="E-mail" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@exemplo.com" />

          <Field label="Foto">
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
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [form, setForm] = useState({ name: '', youtubeUrl: '' });
  const [importModal, setImportModal] = useState(false);
  const [preview, setPreview] = useState([]);

  const [dupWarning, setDupWarning] = useState('');

  const openAdd = () => { setForm({ name: '', youtubeUrl: '' }); setDupWarning(''); setModal('add'); };
  const openEdit = s => { setForm({ ...s }); setDupWarning(''); setModal(s); };

  const save = () => {
    if (!form.name.trim()) return;
    // Duplicate check
    const isDup = songs.some(s =>
      s.name.trim().toLowerCase() === form.name.trim().toLowerCase() &&
      (modal === 'add' || s.id !== form.id)
    );
    if (isDup) { setDupWarning(`"${form.name.trim()}" já está no repertório.`); return; }
    setDupWarning('');
    if (modal === 'add') setSongs(p => [...p, { ...form, id: genId() }]);
    else setSongs(p => p.map(s => s.id === form.id ? { ...form } : s));
    setModal(null);
  };
  const del = id => { setSongs(p => p.filter(s => s.id !== id)); setConfirm(null); };

  const ytThumb = url => {
    const m = url?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    return m ? `https://img.youtube.com/vi/${m[1]}/default.jpg` : null;
  };

  const handleCSV = e => {
    const file = e.target.files[0]; if (!file) return;
    Papa.parse(file, {
      header: true, skipEmptyLines: true,
      complete: ({ data }) => {
        const rows = data.map(row => {
          const keys = Object.keys(row);
          const nk = keys.find(k => /nome|name|musica|titulo|title/i.test(k)) || keys[0];
          const uk = keys.find(k => /url|link|youtube/i.test(k)) || keys[1];
          return { name: row[nk]?.trim() || '', youtubeUrl: row[uk]?.trim() || '' };
        }).filter(r => r.name);
        setPreview(rows);
      }
    });
    e.target.value = '';
  };

  const doImport = () => {
    setSongs(p => [...p, ...preview.map(s => ({ ...s, id: genId() }))]);
    setImportModal(false); setPreview([]);
  };

  const filtered = songs.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ padding: 24, maxWidth: 860 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontFamily: 'Cinzel, serif', fontSize: 21, color: C.accent }}>Repertório</h1>
          <p style={{ color: C.textSecondary, fontSize: 13 }}>{songs.length} música{songs.length !== 1 ? 's' : ''}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn variant="secondary" onClick={() => { setPreview([]); setImportModal(true); }}><Upload size={15} />Importar CSV</Btn>
          <Btn onClick={openAdd}><Plus size={15} />Nova Música</Btn>
        </div>
      </div>

      <div className="search-wrap">
        <Search size={15} color={C.textSecondary} />
        <input className="input-field" placeholder="Buscar músicas..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state"><Music size={38} style={{ marginBottom: 12, opacity: 0.25 }} /><p>Nenhuma música encontrada</p></div>
      ) : (
        <div style={{ display: 'grid', gap: 8 }}>
          {filtered.map((s, i) => {
            const hues = [200, 260, 320, 30, 160, 50, 290, 10];
            const hue = hues[i % hues.length];
            return (
              <div key={s.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, flexShrink: 0, background: `hsl(${hue},60%,22%)`, border: `1.5px solid hsl(${hue},60%,35%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: `hsl(${hue},80%,65%)`, fontFamily: 'Montserrat, sans-serif' }}>
                  {s.name.trim()[0]?.toUpperCase() || '🎵'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: C.textPrimary, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
                  {s.youtubeUrl
                    ? <a href={s.youtubeUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#E8463A', fontSize: 12, textDecoration: 'none' }}><Youtube size={12} />Abrir no YouTube</a>
                    : <span style={{ fontSize: 12, color: C.textSecondary }}>Sem link</span>
                  }
                </div>
                <div style={{ display: 'flex', gap: 2 }}>
                  <Btn variant="ghost" onClick={() => openEdit(s)}><Edit2 size={14} /></Btn>
                  <Btn variant="ghost" className="del" onClick={() => setConfirm(s.id)}><Trash2 size={14} /></Btn>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal && (
        <Modal title={modal === 'add' ? 'Nova Música' : 'Editar Música'} onClose={() => setModal(null)}>
          <Inp label="Nome da Música *" value={form.name} onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setDupWarning(''); }} placeholder="Ex: Oceanos" />
          {dupWarning && (
            <div style={{ marginTop: -10, marginBottom: 14, padding: '8px 12px', background: `${C.danger}18`, border: `1px solid ${C.danger}44`, borderRadius: 8, color: C.danger, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircle size={14} />{dupWarning}
            </div>
          )}
          <Inp label="Link do YouTube" value={form.youtubeUrl} onChange={e => setForm(f => ({ ...f, youtubeUrl: e.target.value }))} placeholder="https://youtube.com/watch?v=..." />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Btn variant="secondary" onClick={() => setModal(null)}>Cancelar</Btn>
            <Btn onClick={save}><Check size={14} />Salvar</Btn>
          </div>
        </Modal>
      )}

      {importModal && (
        <Modal title="Importar Músicas via CSV" onClose={() => { setImportModal(false); setPreview([]); }} wide>
          <div style={{ padding: 14, background: C.bgInput, borderRadius: 8, marginBottom: 16, fontSize: 13, color: C.textSecondary, lineHeight: 1.7 }}>
            <strong style={{ color: C.accent }}>Formato esperado:</strong> arquivo <code>.csv</code> com colunas <code>nome</code> e <code>url</code> (ou variações como <em>name / link / youtube</em>).<br />
            Exemplo: <code>nome,url</code><br /><code>Oceanos,https://youtu.be/xxx</code>
          </div>
          <label style={{ display: 'block', padding: '24px 16px', border: `2px dashed ${C.border}`, borderRadius: 10, textAlign: 'center', cursor: 'pointer', color: C.textSecondary, marginBottom: 16 }}>
            <Upload size={26} style={{ display: 'block', margin: '0 auto 8px' }} />
            Clique para selecionar o arquivo CSV
            <input type="file" accept=".csv" onChange={handleCSV} style={{ display: 'none' }} />
          </label>
          {preview.length > 0 && (
            <>
              <p style={{ color: C.success, fontSize: 13, marginBottom: 10 }}>✓ {preview.length} música{preview.length !== 1 ? 's' : ''} encontrada{preview.length !== 1 ? 's' : ''} para importar</p>
              <div style={{ maxHeight: 200, overflowY: 'auto', display: 'grid', gap: 4, marginBottom: 16 }}>
                {preview.map((s, i) => (
                  <div key={i} style={{ padding: '7px 12px', background: C.bgHover, borderRadius: 6, display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: C.textPrimary }}>{s.name}</span>
                    {s.youtubeUrl && <span style={{ color: C.success, fontSize: 11 }}>✓ YouTube</span>}
                  </div>
                ))}
              </div>
              <Btn onClick={doImport}><Check size={14} />Importar {preview.length} música{preview.length !== 1 ? 's' : ''}</Btn>
            </>
          )}
        </Modal>
      )}
      {confirm && <Confirm msg="Excluir esta música do repertório?" onOk={() => del(confirm)} onCancel={() => setConfirm(null)} />}
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
  const [viewModal, setViewModal] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [form, setForm] = useState({ name: '', date: '', groupId: '', scaleMembers: [], scaleSongs: [] });
  const [mSearch, setMSearch] = useState('');
  const [sSearch, setSSearch] = useState('');

  const fresh = () => ({ name: '', date: '', groupId: '', scaleMembers: [], scaleSongs: [] });

  const openAdd = () => { setForm(fresh()); setMSearch(''); setSSearch(''); setModal('add'); };
  const openEdit = sc => { setForm({ ...sc, scaleMembers: sc.scaleMembers.map(x => ({ ...x })), scaleSongs: sc.scaleSongs.map(x => ({ ...x })) }); setMSearch(''); setSSearch(''); setModal(sc); };

  const onGroupChange = gid => {
    const g = groups.find(x => x.id === gid);
    setForm(f => ({ ...f, groupId: gid, scaleMembers: (g?.memberIds || []).map(id => ({ memberId: id, isSub: false, role: '' })) }));
  };

  const removeMember = id => setForm(f => ({ ...f, scaleMembers: f.scaleMembers.filter(x => x.memberId !== id) }));
  const addSubstitute = id => {
    if (form.scaleMembers.find(x => x.memberId === id)) return;
    setForm(f => ({ ...f, scaleMembers: [...f.scaleMembers, { memberId: id, isSub: true, role: '' }] }));
    setMSearch('');
  };
  const updateMemberRole = (memberId, role) => setForm(f => ({ ...f, scaleMembers: f.scaleMembers.map(x => x.memberId === memberId ? { ...x, role } : x) }));
  const addSong = id => {
    if (form.scaleSongs.find(x => x.songId === id)) return;
    setForm(f => ({ ...f, scaleSongs: [...f.scaleSongs, { songId: id, key: '', notes: '' }] }));
    setSSearch('');
  };
  const removeSong = id => setForm(f => ({ ...f, scaleSongs: f.scaleSongs.filter(x => x.songId !== id) }));
  const updateSong = (id, field, val) => setForm(f => ({ ...f, scaleSongs: f.scaleSongs.map(x => x.songId === id ? { ...x, [field]: val } : x) }));

  const save = () => {
    if (!form.name.trim() || !form.date) return;
    if (modal === 'add') setScales(p => [...p, { ...form, id: genId() }]);
    else setScales(p => p.map(s => s.id === form.id ? { ...form } : s));
    setModal(null);
  };
  const del = id => { setScales(p => p.filter(s => s.id !== id)); setConfirm(null); };

  const existingIds = form.scaleMembers.map(x => x.memberId);
  const availSubs = members.filter(m => !existingIds.includes(m.id) && m.name.toLowerCase().includes(mSearch.toLowerCase()));
  const availSongs = songs.filter(s => s.name.toLowerCase().includes(sSearch.toLowerCase()) && !form.scaleSongs.find(x => x.songId === s.id));

  const scaleMembers = sc => (sc.scaleMembers || []).map(sm => ({ ...sm, member: members.find(m => m.id === sm.memberId) })).filter(x => x.member);
  const scaleSongs = sc => (sc.scaleSongs || []).map(ss => ({ ...ss, song: songs.find(s => s.id === ss.songId) })).filter(x => x.song);

  return (
    <div style={{ padding: 24, maxWidth: 860 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontFamily: 'Cinzel, serif', fontSize: 21, color: C.accent }}>Escalas</h1>
          <p style={{ color: C.textSecondary, fontSize: 13 }}>{scales.length} escala{scales.length !== 1 ? 's' : ''}</p>
        </div>
        <Btn onClick={openAdd}><Plus size={15} />Nova Escala</Btn>
      </div>

      {scales.length === 0 ? (
        <div className="empty-state"><Calendar size={38} style={{ marginBottom: 12, opacity: 0.25 }} /><p>Nenhuma escala criada</p></div>
      ) : (() => {
        const today = new Date().toISOString().split('T')[0];
        const active   = [...scales].filter(s => s.date >= today).sort((a, b) => a.date.localeCompare(b.date));
        const archived = [...scales].filter(s => s.date < today).sort((a, b) => b.date.localeCompare(a.date));

        const ScaleCard = ({ sc }) => {
          const g = groups.find(x => x.id === sc.groupId);
          const sm = scaleMembers(sc);
          const ss = scaleSongs(sc);
          return (
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, color: C.textPrimary, fontSize: 15 }}>{sc.name}</span>
                    {g && <span className="tag">{g.name}</span>}
                  </div>
                  <div style={{ color: C.textSecondary, fontSize: 12, marginBottom: 10 }}>📅 {fmtDate(sc.date)}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
                    {sm.map(x => <span key={x.memberId} className={`tag${x.isSub ? ' sub' : ''}`}>{x.isSub ? '↔ ' : ''}{x.member.name}</span>)}
                  </div>
                  <div style={{ fontSize: 12, color: C.textSecondary }}>{ss.length} música{ss.length !== 1 ? 's' : ''}</div>
                </div>
                <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                  <Btn variant="ghost" onClick={() => setViewModal(sc)} style={{ fontSize: 12 }}><Eye size={14} /></Btn>
                  <Btn variant="ghost" onClick={() => openEdit(sc)}><Edit2 size={14} /></Btn>
                  <Btn variant="ghost" style={{ color: '#1FAD4A' }} onClick={() => shareToWhatsApp(sc, members, groups, songs)}><Share2 size={14} /></Btn>
                  <Btn variant="ghost" className="del" onClick={() => setConfirm(sc.id)}><Trash2 size={14} /></Btn>
                </div>
              </div>
            </div>
          );
        };

        return (
          <div style={{ display: 'grid', gap: 16 }}>
            {/* Active / upcoming */}
            {active.length > 0 && (
              <div>
                <div className="section-header" style={{ marginBottom: 10 }}><Calendar size={13} />Agendadas ({active.length})</div>
                <div style={{ display: 'grid', gap: 8 }}>
                  {active.map(sc => <ScaleCard key={sc.id} sc={sc} />)}
                </div>
              </div>
            )}
            {active.length === 0 && (
              <div style={{ padding: '14px 16px', background: C.bgCard, borderRadius: 10, border: `1px solid ${C.border}`, fontSize: 13, color: C.textSecondary, textAlign: 'center' }}>
                Nenhuma escala agendada
              </div>
            )}

            {/* Archived */}
            {archived.length > 0 && (
              <ArchivedSection archived={archived} ScaleCard={ScaleCard} />
            )}
          </div>
        );
      })()}

      {/* View modal */}
      {viewModal && (
        <Modal title={viewModal.name} onClose={() => setViewModal(null)} wide>
          <div style={{ color: C.textSecondary, fontSize: 13, marginBottom: 18 }}>
            📅 {fmtDate(viewModal.date)} · {groups.find(g => g.id === viewModal.groupId)?.name || 'Sem grupo'}
          </div>
          <Field label="Membros na Escala">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {scaleMembers(viewModal).map(x => {
                const roleObj = x.role ? ROLES.find(r => r.key === x.role) : null;
                return (
                  <div key={x.memberId} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 12px', background: x.isSub ? 'rgba(79,128,225,0.1)' : C.accentGlow, borderRadius: 20, border: `1px solid ${x.isSub ? C.blue + '44' : C.accent + '44'}` }}>
                    <Avatar member={x.member} size={24} />
                    <div>
                      <span style={{ fontSize: 13, color: x.isSub ? C.blue : C.accent }}>{x.isSub ? '↔ ' : ''}{x.member.name}</span>
                      {roleObj && <span style={{ fontSize: 11, color: C.textSecondary, marginLeft: 4 }}>· {roleObj.emoji} {roleObj.label}</span>}
                    </div>
                  </div>
                );
              })}
              {scaleMembers(viewModal).length === 0 && <span style={{ color: C.textSecondary, fontSize: 13 }}>Nenhum membro</span>}
            </div>
          </Field>
          <Field label="Músicas">
            <div style={{ display: 'grid', gap: 8 }}>
              {scaleSongs(viewModal).map(x => (
                <div key={x.songId} style={{ padding: '10px 14px', background: C.bgHover, borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <span style={{ fontWeight: 600, color: C.textPrimary }}>{x.song.name}</span>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    {x.key && <span className="tag green">Tom: {x.key}</span>}
                    {x.notes && <span style={{ fontSize: 12, color: C.textSecondary }}>{x.notes}</span>}
                  </div>
                </div>
              ))}
              {scaleSongs(viewModal).length === 0 && <span style={{ color: C.textSecondary, fontSize: 13 }}>Nenhuma música</span>}
            </div>
          </Field>
          {/* Song links */}
          {scaleSongs(viewModal).some(x => x.song.youtubeUrl) && (
            <div style={{ marginTop: 4, display: 'grid', gap: 5 }}>
              <div className="field-label" style={{ marginBottom: 2 }}>Links do YouTube</div>
              {scaleSongs(viewModal).filter(x => x.song.youtubeUrl).map(x => (
                <a key={x.songId} href={x.song.youtubeUrl} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', background: C.bgHover, borderRadius: 8, textDecoration: 'none', color: C.textPrimary, fontSize: 13 }}>
                  <Youtube size={14} color="#E8463A" />
                  <span style={{ flex: 1 }}>{x.song.name}</span>
                  <span style={{ fontSize: 11, color: C.textSecondary }}>↗</span>
                </a>
              ))}
            </div>
          )}
          <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
            <Btn className="btn-whatsapp" onClick={() => shareToWhatsApp(viewModal, members, groups, songs)}>
              <Share2 size={15} />Enviar para WhatsApp
            </Btn>
          </div>
        </Modal>
      )}

      {/* Add/Edit modal */}
      {modal && (
        <Modal title={modal === 'add' ? 'Nova Escala' : 'Editar Escala'} onClose={() => setModal(null)} wide>
          <div className="grid-2">
            <Inp label="Nome da Escala *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Culto Domingo Manhã" />
            <Inp label="Data *" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          </div>

          <Field label="Grupo">
            <select className="input-field" value={form.groupId} onChange={e => onGroupChange(e.target.value)}>
              <option value="">Selecionar grupo...</option>
              {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </Field>

          {/* Members in scale */}
          <Field label={`Membros na Escala (${form.scaleMembers.length})`}>
            {form.scaleMembers.length === 0 && (
              <div style={{ marginBottom: 10, padding: '10px 14px', background: C.bgInput, borderRadius: 8, fontSize: 13, color: C.textSecondary }}>
                Selecione um grupo ou adicione membros manualmente
              </div>
            )}
            {form.scaleMembers.map(sm => {
              const m = members.find(x => x.id === sm.memberId);
              if (!m) return null;
              const memberRoles = (m.roles || []).map(r => ROLES.find(x => x.key === r)).filter(Boolean);
              return (
                <div key={sm.memberId} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', marginBottom: 6, background: sm.isSub ? 'rgba(79,128,225,0.08)' : C.accentGlow, border: `1px solid ${sm.isSub ? C.blue + '44' : C.accent + '33'}`, borderRadius: 10 }}>
                  <Avatar member={m} size={28} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: sm.isSub ? C.blue : C.accent }}>{sm.isSub ? '↔ ' : ''}{m.name}</div>
                    {memberRoles.length > 0 && (
                      <select
                        value={sm.role || ''}
                        onChange={e => updateMemberRole(sm.memberId, e.target.value)}
                        style={{ marginTop: 3, padding: '3px 8px', background: C.bgInput, border: `1px solid ${C.border}`, borderRadius: 6, color: sm.role ? C.textPrimary : C.textSecondary, fontSize: 11, width: '100%', maxWidth: 180 }}>
                        <option value="">Função nesta escala...</option>
                        {memberRoles.map(r => <option key={r.key} value={r.key}>{r.emoji} {r.label}</option>)}
                      </select>
                    )}
                    {memberRoles.length === 0 && <span style={{ fontSize: 11, color: C.textSecondary }}>Sem funções cadastradas</span>}
                  </div>
                  <button onClick={() => removeMember(sm.memberId)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textSecondary, display: 'flex', padding: 4, flexShrink: 0 }}>
                    <X size={13} />
                  </button>
                </div>
              );
            })}
            <div style={{ border: `1px dashed ${C.border}`, borderRadius: 8, padding: 10 }}>
              <div style={{ fontSize: 12, color: C.textSecondary, marginBottom: 7 }}>Adicionar membro / substituto:</div>
              <div style={{ position: 'relative', marginBottom: 7 }}>
                <Search size={12} color={C.textSecondary} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)' }} />
                <input className="input-field" placeholder="Buscar..." value={mSearch} onChange={e => setMSearch(e.target.value)} style={{ paddingLeft: 26, fontSize: 12 }} />
              </div>
              <div style={{ maxHeight: 120, overflowY: 'auto', display: 'grid', gap: 3 }}>
                {availSubs.slice(0, 10).map(m => (
                  <div key={m.id} className="song-item" onClick={() => addSubstitute(m.id)} style={{ padding: '6px 10px', fontSize: 13 }}>
                    <Plus size={12} color={C.accent} />{m.name}
                    <span style={{ marginLeft: 'auto', fontSize: 11, color: C.textSecondary }}>
                      {(m.roles || []).map(r => ROLES.find(x => x.key === r)?.emoji).filter(Boolean).join(' ')}
                    </span>
                  </div>
                ))}
                {availSubs.length === 0 && mSearch && <div style={{ fontSize: 12, color: C.textSecondary, textAlign: 'center', padding: 10 }}>Nenhum resultado</div>}
              </div>
            </div>
          </Field>

          {/* Songs */}
          <Field label={`Músicas (${form.scaleSongs.length})`}>
            {/* Search field always visible */}
            <div style={{ position: 'relative', marginBottom: 8 }}>
              <Search size={13} color={C.textSecondary} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input
                className="input-field"
                placeholder="Buscar música para adicionar..."
                value={sSearch}
                onChange={e => setSSearch(e.target.value)}
                style={{ paddingLeft: 30, fontSize: 13 }}
              />
            </div>

            {/* Search results dropdown */}
            {sSearch.trim() && (
              <div style={{ background: C.bgInput, border: `1px solid ${C.border}`, borderRadius: 8, marginBottom: 10, overflow: 'hidden' }}>
                {availSongs.slice(0, 8).length === 0 ? (
                  <div style={{ padding: '10px 14px', fontSize: 13, color: C.textSecondary }}>Nenhuma música encontrada</div>
                ) : (
                  availSongs.slice(0, 8).map(s => (
                    <div key={s.id} className="song-item" onClick={() => { addSong(s.id); setSSearch(''); }}
                      style={{ borderBottom: `1px solid ${C.border}`, borderRadius: 0, padding: '9px 14px' }}>
                      <Plus size={13} color={C.accent} />
                      <span style={{ flex: 1 }}>{s.name}</span>
                      {s.youtubeUrl && <Youtube size={12} color="#E8463A" />}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Added songs with key/notes */}
            {form.scaleSongs.length === 0 && !sSearch && (
              <div style={{ padding: '12px 14px', background: C.bgInput, borderRadius: 8, fontSize: 13, color: C.textSecondary, textAlign: 'center' }}>
                Use a busca acima para adicionar músicas
              </div>
            )}
            {form.scaleSongs.map((ss, idx) => {
              const song = songs.find(s => s.id === ss.songId);
              return (
                <div key={ss.songId} className="scale-song-row" style={{ marginBottom: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 11, color: C.textSecondary, fontWeight: 700, minWidth: 18 }}>{idx + 1}.</span>
                      <span style={{ fontWeight: 600, color: C.textPrimary, fontSize: 13 }}>{song?.name}</span>
                      {song?.youtubeUrl && (
                        <a href={song.youtubeUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', color: '#E8463A' }}><Youtube size={13} /></a>
                      )}
                    </div>
                    <button onClick={() => removeSong(ss.songId)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.danger, display: 'flex', padding: 2 }}><X size={14} /></button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 8 }}>
                    <input className="input-field" placeholder="Tom (ex: Ré)" value={ss.key}
                      onChange={e => updateSong(ss.songId, 'key', e.target.value)} style={{ fontSize: 12 }} />
                    <input className="input-field" placeholder="Observações..." value={ss.notes}
                      onChange={e => updateSong(ss.songId, 'notes', e.target.value)} style={{ fontSize: 12 }} />
                  </div>
                </div>
              );
            })}
          </Field>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
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
  const [syncOk, setSyncOk]     = useState(null); // true | false | null

  const loadAll = async () => {
    const [m, g, s, sc] = await Promise.all([
      dbGet('members'), dbGet('groups'), dbGet('songs'), dbGet('scales')
    ]);
    if (m) setMembers(m);
    if (g) setGroups(g);
    if (s) setSongs(s);
    if (sc) setScales(sc);
  };

  // Initial load
  useEffect(() => {
    setSyncing(true);
    loadAll()
      .then(() => { setSyncOk(true); setReady(true); })
      .catch(() => { setSyncOk(false); setReady(true); })
      .finally(() => setSyncing(false));
  }, []);

  // Save helpers with sync indicator
  const save = async (key, val) => {
    setSyncing(true); setSyncOk(null);
    try { await dbSet(key, val); setSyncOk(true); }
    catch { setSyncOk(false); }
    finally { setSyncing(false); }
  };

  // Auto-refresh every 30s when window has focus (catch changes from other devices)
  useEffect(() => {
    const onFocus = () => { if (ready) loadAll(); };
    window.addEventListener('focus', onFocus);
    const interval = setInterval(() => { if (document.hasFocus() && ready) loadAll(); }, 30000);
    return () => { window.removeEventListener('focus', onFocus); clearInterval(interval); };
  }, [ready]);

  // Persist changes upwards to Firebase
  useEffect(() => { if (ready) save('members', members); }, [members]);
  useEffect(() => { if (ready) save('groups',  groups);  }, [groups]);
  useEffect(() => { if (ready) save('songs',   songs);   }, [songs]);
  useEffect(() => { if (ready) save('scales',  scales);  }, [scales]);

  const nav = id => { setPage(id); setSideOpen(false); };
  const current = NAV.find(n => n.id === page);

  if (!ready) return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', color: C.textSecondary, gap: 16 }}>
        <img src={LOGO_B64} alt="" style={{ width: 64, height: 64, borderRadius: '50%', border: `2px solid ${C.accent}` }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 18, height: 18, border: `2px solid ${C.accent}44`, borderTopColor: C.accent, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          Conectando ao Firebase...
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </>
  );

  return (
    <>
      <style>{GLOBAL_CSS}</style>

      {/* Sidebar */}
      <div className={`sidebar${sideOpen ? ' open' : ''}`}>
        <div style={{ padding: '16px 18px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src={LOGO_B64} alt="Logo" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
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
