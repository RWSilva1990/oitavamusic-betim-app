import { useEffect, useState } from 'react';
import { C } from '@/lib/theme';

const DISMISS_KEY = 'oitava-ios-pwa-install-hint-dismissed';

function isIosDevice() {
  if (typeof navigator === 'undefined') return false;
  const userAgent = navigator.userAgent || '';
  const classicIos = /iPad|iPhone|iPod/i.test(userAgent);
  const ipadDesktopMode = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  return classicIos || ipadDesktopMode;
}

function isStandalone() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  const navigatorWithStandalone = navigator;
  return window.matchMedia('(display-mode: standalone)').matches || navigatorWithStandalone.standalone === true;
}

export default function IosInstallHint() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isIosDevice() || isStandalone()) return;

    try {
      if (window.sessionStorage.getItem(DISMISS_KEY) === '1') return;
    } catch {
      // Session storage may be unavailable in private/restricted contexts.
    }

    setVisible(true);
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    try {
      window.sessionStorage.setItem(DISMISS_KEY, '1');
    } catch {
      // Keep dismissal in memory when storage is unavailable.
    }
    setVisible(false);
  };

  return (
    <div
      role="status"
      style={{
        position: 'fixed',
        left: 14,
        right: 14,
        bottom: 'calc(env(safe-area-inset-bottom, 0px) + 14px)',
        zIndex: 1100,
        maxWidth: 520,
        margin: '0 auto',
        padding: '14px 42px 14px 14px',
        borderRadius: 16,
        border: `1px solid ${C.accent}55`,
        background: C.bgCard,
        boxShadow: '0 14px 42px var(--app-shadow)',
        color: C.textPrimary,
      }}
    >
      <button
        type="button"
        aria-label="Fechar orientação de instalação"
        onClick={dismiss}
        style={{
          position: 'absolute',
          top: 8,
          right: 8,
          width: 28,
          height: 28,
          border: 0,
          borderRadius: 9,
          background: 'transparent',
          color: C.textSecondary,
          fontSize: 20,
          lineHeight: 1,
          cursor: 'pointer',
        }}
      >
        ×
      </button>

      <div style={{ fontSize: 13.5, fontWeight: 800, color: C.accent, marginBottom: 6 }}>
        Usar o Oitava Music como app no iPhone/iPad
      </div>
      <div style={{ fontSize: 12, lineHeight: 1.55, color: C.textSecondary }}>
        No Safari, toque em <strong>Compartilhar</strong> → <strong>Adicionar à Tela de Início</strong> e mantenha
        <strong> “Abrir como App da Web”</strong> ativado. Assim o Oitava Music abre pelo ícone sem a barra de navegação do Safari.
      </div>
      <div style={{ marginTop: 7, fontSize: 11.5, lineHeight: 1.5, color: C.textSecondary }}>
        Se o ícone que você já criou ainda abre como site, remova-o da Tela de Início e adicione novamente com essa opção ativada.
      </div>
    </div>
  );
}
