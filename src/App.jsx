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
  html, body { background: ${C.bg}; font-family: 'Nunito', sans-serif; color: ${C.textPrimary}; }
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

  .modal-overlay {
    position: fixed; inset: 0; z-index: 500;
    background: rgba(0,0,0,0.72); backdrop-filter: blur(6px);
    display: flex; align-items: center; justify-content: center;
    padding: 12px; box-sizing: border-box;
  }
  .modal-box {
    background: ${C.bgCard}; border-radius: 16px;
    border: 1px solid ${C.border};
    width: 100%; max-width: 100%; max-height: 92vh; overflow-y: auto;
    box-sizing: border-box;
    box-shadow: 0 32px 64px rgba(0,0,0,0.6);
  }
  .modal-header {
    padding: 18px 24px; border-bottom: 1px solid ${C.border};
    display: flex; align-items: center; justify-content: space-between;
    position: sticky; top: 0; background: ${C.bgCard}; z-index: 1;
    border-radius: 16px 16px 0 0;
  }
  .modal-body { padding: 24px; }

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

function buildPlaylistUrl(songList) {
  const ids = songList.map(s => getYtId(s.youtubeUrl)).filter(Boolean);
  if (ids.length === 0) return null;
  if (ids.length === 1) return `https://youtu.be/${ids[0]}`;
  return `https://www.youtube.com/watch_videos?video_ids=${ids.join(',')}`;
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
      <div className="modal-box" style={{ maxWidth: 340, padding: 28, textAlign: 'center', borderRadius: 14 }}>
        <AlertCircle size={32} color={C.danger} style={{ marginBottom: 12 }} />
        <p style={{ color: C.textPrimary, marginBottom: 20 }}>{msg}</p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          <Btn variant="secondary" onClick={onCancel}>Cancelar</Btn>
          <Btn variant="danger" onClick={onOk}><Trash2 size={14} />Excluir</Btn>
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
const LOGO_B64 = "data:image/png;base64,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";

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
                  <div>
                    <div style={{ fontWeight: 700, color: C.textPrimary, fontSize: 14, marginBottom: 3 }}>{sc.name}</div>
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
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: C.textPrimary, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                      {m.name}
                      {isBday && <span style={{ fontSize: 14 }}>🎂</span>}
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
  const [importPreview, setImportPreview] = useState([]);

  const handleMemberCSV = e => {
    const file = e.target.files[0]; if (!file) return;
    Papa.parse(file, {
      header: true, skipEmptyLines: true,
      complete: ({ data }) => {
        const rows = data.map(row => {
          const keys = Object.keys(row);
          const nk  = keys.find(k => /nome|name/i.test(k)) || keys[0];
          const bk  = keys.find(k => /nasc|birth|data/i.test(k)) || '';
          const ek  = keys.find(k => /email|e-mail/i.test(k)) || '';
          const pk  = keys.find(k => /tel|fone|phone|cel/i.test(k)) || '';
          const rk  = keys.find(k => /fun[çc]|role|instrumento/i.test(k)) || '';
          const rawRoles = rk ? (row[rk] || '').split(/[,;/]/).map(r => r.trim().toLowerCase()) : [];
          const roles = rawRoles.map(r => {
            if (/bat/i.test(r)) return 'bateria';
            if (/baix/i.test(r)) return 'baixo';
            if (/viol/i.test(r)) return 'violao';
            if (/tecl/i.test(r)) return 'teclado';
            if (/voc|cant/i.test(r)) return 'vocal';
            if (/minist/i.test(r)) return 'ministro';
            return null;
          }).filter(Boolean);
          return {
            name:      (row[nk] || '').trim(),
            birthdate: (bk ? row[bk] || '' : '').trim(),
            email:     (ek ? row[ek] || '' : '').trim(),
            phone:     (pk ? row[pk] || '' : '').trim(),
            roles,
            photo: '',
          };
        }).filter(r => r.name);
        setImportPreview(rows);
      }
    });
    e.target.value = '';
  };

  const doImportMembers = () => {
    setMembers(p => [...p, ...importPreview.map(m => ({ ...m, id: genId() }))]);
    setImportModal(false); setImportPreview([]);
  };

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
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn variant="secondary" onClick={() => { setImportPreview([]); setImportModal(true); }}><Upload size={15} />Importar CSV</Btn>
          <Btn onClick={openAdd}><Plus size={15} />Novo Membro</Btn>
        </div>
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

      {importModal && (
        <Modal title="Importar Membros via CSV" onClose={() => { setImportModal(false); setImportPreview([]); }} wide>
          <div style={{ padding: 14, background: C.bgInput, borderRadius: 8, marginBottom: 16, fontSize: 13, color: C.textSecondary, lineHeight: 1.7 }}>
            <strong style={{ color: C.accent }}>Formato esperado:</strong> arquivo <code>.csv</code> com coluna <code>nome</code> (obrigatória) e opcionais: <code>nascimento</code>, <code>email</code>, <code>telefone</code>, <code>funcao</code>.<br />
            Para funções, use: <em>bateria, baixo, violao, teclado, vocal, ministro</em> (separadas por vírgula).<br />
            Exemplo: <code>nome,funcao</code> → <code>João Silva,bateria</code>
          </div>
          <label style={{ display: 'block', padding: '24px 16px', border: `2px dashed ${C.border}`, borderRadius: 10, textAlign: 'center', cursor: 'pointer', color: C.textSecondary, marginBottom: 16 }}>
            <Upload size={26} style={{ display: 'block', margin: '0 auto 8px' }} />
            Clique para selecionar o arquivo CSV
            <input type="file" accept=".csv" onChange={handleMemberCSV} style={{ display: 'none' }} />
          </label>
          {importPreview.length > 0 && (
            <>
              <p style={{ color: C.success, fontSize: 13, marginBottom: 10 }}>✓ {importPreview.length} membro{importPreview.length !== 1 ? 's' : ''} encontrado{importPreview.length !== 1 ? 's' : ''} para importar</p>
              <div style={{ maxHeight: 220, overflowY: 'auto', display: 'grid', gap: 5, marginBottom: 16 }}>
                {importPreview.map((m, i) => (
                  <div key={i} style={{ padding: '8px 12px', background: C.bgHover, borderRadius: 7, display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
                    <div style={{ width: 30, height: 30, borderRadius: '50%', background: C.accentGlow, border: `1px solid ${C.accent}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: C.accent, fontSize: 12, flexShrink: 0 }}>
                      {m.name[0]?.toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: C.textPrimary, fontWeight: 600 }}>{m.name}</div>
                      <div style={{ fontSize: 11, color: C.textSecondary }}>
                        {m.roles.map(r => ROLES.find(x => x.key === r)?.emoji).filter(Boolean).join(' ')}
                        {m.email && ` · ${m.email}`}
                        {m.phone && ` · ${m.phone}`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Btn onClick={doImportMembers}><Check size={14} />Importar {importPreview.length} membro{importPreview.length !== 1 ? 's' : ''}</Btn>
            </>
          )}
        </Modal>
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
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: C.textPrimary, fontSize: 16, marginBottom: 10 }}>{g.name}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {gMembers.map(m => (
                        <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 10px', background: C.bgHover, borderRadius: 20, fontSize: 12 }}>
                          <Avatar member={m} size={20} />
                          {m.name}
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
                <div style={{ flex: 1 }}>
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

const APP_PASSWORD = '8itav@123';

const LOGO_B64 = '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';

function LoginScreen({ onLogin }) {
  const [pwd, setPwd] = useState('');
  const [error, setError] = useState(false);
  const [show, setShow] = useState(false);

  const attempt = () => {
    if (pwd === APP_PASSWORD) { onLogin(); }
    else { setError(true); setPwd(''); setTimeout(() => setError(false), 2000); }
  };

  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: "'Nunito', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@800;900&family=Nunito:wght@400;600;700&display=swap');`}</style>
      <div style={{ width: '100%', maxWidth: 380, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 36 }}>

        {/* Logo + Título */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 96, height: 96, borderRadius: '50%',
            background: 'linear-gradient(135deg, #1a0a2e, #2d1245)',
            border: `2px solid ${C.accent}55`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
            boxShadow: `0 0 32px ${C.accent}33`,
          }}>
            <img src={`data:image/jpeg;base64,${LOGO_B64}`} alt="Logo" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover' }} />
          </div>
          <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 900, fontSize: 24, color: C.accent, letterSpacing: 1, lineHeight: 1.2 }}>
            Oitava Music Betim
          </div>
          <div style={{ color: C.textSecondary, fontSize: 13, marginTop: 6, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase' }}>
            Ministério de Louvor
          </div>
        </div>

        {/* Card de login */}
        <div style={{ width: '100%', background: C.bgCard, borderRadius: 18, border: `1px solid ${C.border}`, padding: '32px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ color: C.textSecondary, fontWeight: 700, fontSize: 12, textAlign: 'center', letterSpacing: 2, textTransform: 'uppercase' }}>
            Acesso Restrito
          </div>
          <div style={{ position: 'relative' }}>
            <input
              type={show ? 'text' : 'password'}
              placeholder="Digite a senha"
              value={pwd}
              onChange={e => { setPwd(e.target.value); setError(false); }}
              onKeyDown={e => e.key === 'Enter' && attempt()}
              style={{
                width: '100%', padding: '14px 48px 14px 18px',
                background: error ? 'rgba(217,82,82,0.08)' : C.bgInput,
                border: `1.5px solid ${error ? C.danger : C.border}`,
                borderRadius: 12, color: C.textPrimary, fontSize: 15,
                outline: 'none', fontFamily: "'Nunito', sans-serif",
                transition: 'border 0.2s',
              }}
              autoFocus
            />
            <button onClick={() => setShow(s => !s)} style={{
              position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', color: C.textSecondary,
              cursor: 'pointer', fontSize: 17, padding: 4, lineHeight: 1,
            }}>
              {show ? '🙈' : '👁️'}
            </button>
          </div>

          {error && (
            <div style={{ color: C.danger, fontSize: 13, textAlign: 'center', fontWeight: 600 }}>
              ✕ Senha incorreta. Tente novamente.
            </div>
          )}

          <button onClick={attempt} style={{
            padding: '14px 0',
            background: `linear-gradient(135deg, ${C.accent}, ${C.accentDark})`,
            border: 'none', borderRadius: 12, color: '#000',
            fontWeight: 800, fontSize: 15, cursor: 'pointer',
            fontFamily: "'Montserrat', sans-serif", letterSpacing: 1,
            boxShadow: `0 4px 20px ${C.accent}44`,
            transition: 'opacity 0.2s',
          }}>
            ENTRAR
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [loggedIn, setLoggedIn] = useState(() => sessionStorage.getItem('oitava_auth') === '1');
  const [page, setPage] = useState('home');
  const [members, setMembers] = useState([]);
  const [groups, setGroups]   = useState([]);
  const [songs, setSongs]     = useState([]);
  const [scales, setScales]   = useState([]);
  const [ready, setReady]     = useState(false);
  const [sideOpen, setSideOpen] = useState(false);
  const [syncing, setSyncing]   = useState(false);
  const [syncOk, setSyncOk]     = useState(null); // true | false | null

  const handleLogin = () => { sessionStorage.setItem('oitava_auth', '1'); setLoggedIn(true); };
  if (!loggedIn) return <LoginScreen onLogin={handleLogin} />;

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
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', color: C.textSecondary, gap: 16 }}>
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
      <div className="main-content" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
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
