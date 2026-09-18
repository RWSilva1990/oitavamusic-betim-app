import { ExternalLink, Headphones, Share2 } from 'lucide-react';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { C } from '@/lib/theme';
import { Btn, Modal } from './ui-kit';

const PitchHandoff = registerPlugin('PitchHandoff');
const TRANSPOSE_PLAY_URL = 'https://github.com/joh9911/Transpose/releases/latest';

export default function KeyTestAssistant({ song, currentKey, onApply, onClose }) {
  if (!song) return null;
  const youtubeUrl = String(song.youtubeUrl || '').trim();
  const originalKey = String(song.originalKey || '').trim();

  async function openInTranspose() {
    if (!youtubeUrl) return;
    try { await PitchHandoff.openInTranspose({ url: youtubeUrl }); }
    catch {
      try { await PitchHandoff.shareLink({ url: youtubeUrl }); }
      catch { window.open(TRANSPOSE_PLAY_URL, '_blank', 'noopener,noreferrer'); }
    }
  }

  async function shareWithAnotherApp() {
    if (!youtubeUrl) return;
    try { await PitchHandoff.shareLink({ url: youtubeUrl }); }
    catch { window.open(youtubeUrl, '_blank', 'noopener,noreferrer'); }
  }

  async function openTransposeStore() {
    try { await PitchHandoff.openTransposeStore(); }
    catch { window.open(TRANSPOSE_PLAY_URL, '_blank', 'noopener,noreferrer'); }
  }

  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') return null;

  return (
    <Modal title={`Testar tom · ${song.name}`} onClose={onClose}>
      <div style={{ padding: '12px 14px', background: C.bgInput, borderRadius: 10, marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: C.textSecondary, marginBottom: 4 }}>Tom original do repertório</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: C.textPrimary }}>{originalKey || 'Não informado'}</div>
      </div>
      {!youtubeUrl ? (
        <div style={{ padding: '12px 14px', background: C.bgInput, borderRadius: 9, color: C.textSecondary, fontSize: 13, lineHeight: 1.6 }}>Esta música ainda não possui uma referência do YouTube cadastrada no Repertório.</div>
      ) : (<>
        <div style={{ fontSize: 13, color: C.textSecondary, lineHeight: 1.6, marginBottom: 14 }}>Abra esta referência no Transpose para testar o tom em tempo real.</div>
        <button type="button" onClick={openInTranspose} style={{ width: '100%', padding: '13px 14px', marginBottom: 9, border: `1px solid ${C.accent}`, borderRadius: 9, background: C.accentGlow, color: C.accent, fontWeight: 800 }}><Headphones size={16} /> Abrir no Transpose e ouvir</button>
        <button type="button" onClick={shareWithAnotherApp} style={{ width: '100%', padding: '10px 14px', marginBottom: 9, border: `1px solid ${C.border}`, borderRadius: 9, background: C.bgHover, color: C.textPrimary }}><Share2 size={14} /> Usar outro aplicativo compatível</button>
        <a href={youtubeUrl} target="_blank" rel="noopener noreferrer" style={{ width: '100%', boxSizing: 'border-box', display: 'flex', justifyContent: 'center', gap: 8, padding: '10px 14px', marginBottom: 14, border: `1px solid ${C.border}`, borderRadius: 9, color: C.textPrimary, textDecoration: 'none' }}><ExternalLink size={14} />Ouvir original no YouTube</a>
        <div style={{ padding: '12px 14px', borderRadius: 9, background: C.bgInput }}>
          <div style={{ fontSize: 12, color: C.textSecondary, marginBottom: 6 }}>Depois de testar, informe o tom escolhido para esta escala:</div>
          <input className="input-field" value={currentKey || ''} onChange={(e) => onApply(e.target.value)} placeholder={originalKey ? `Ex: ${originalKey}` : 'Ex: D, Eb, F#'} />
        </div>
        <button type="button" onClick={openTransposeStore} style={{ width: '100%', marginTop: 10, border: 0, background: 'transparent', color: C.textSecondary, textDecoration: 'underline' }}>Instalar / abrir Transpose</button>
      </>)}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}><Btn onClick={onClose}>{currentKey ? 'Usar este tom' : 'Fechar'}</Btn></div>
    </Modal>
  );
}
