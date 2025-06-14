'use client';

import { useEffect, useState } from 'react';

interface KioskModeProps {
  children: React.ReactNode;
  enableKiosk?: boolean;
}

export default function KioskMode({ children, enableKiosk = false }: KioskModeProps) {
  const [isKioskMode, setIsKioskMode] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  useEffect(() => {
    // Detectar se está em modo kiosk
    const detectKioskMode = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isFullscreen = window.matchMedia('(display-mode: fullscreen)').matches;
      const isInWebAppiOS = (window.navigator as any).standalone === true;
      const isInWebAppChrome = window.matchMedia('(display-mode: standalone)').matches;
      
      return isStandalone || isFullscreen || isInWebAppiOS || isInWebAppChrome;
    };

    setIsKioskMode(detectKioskMode());

    // Capturar evento de instalação PWA
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Configurações específicas do kiosk se habilitado
    if (enableKiosk) {
      // Desabilitar seleção de texto
      document.body.style.userSelect = 'none';
      document.body.style.webkitUserSelect = 'none';
      
      // Desabilitar menu de contexto
      document.addEventListener('contextmenu', (e) => e.preventDefault());
      
      // Desabilitar teclas de atalho
      document.addEventListener('keydown', (e) => {
        // Bloquear F12, Ctrl+Shift+I, Ctrl+U, etc.
        if (
          e.key === 'F12' ||
          (e.ctrlKey && e.shiftKey && e.key === 'I') ||
          (e.ctrlKey && e.shiftKey && e.key === 'C') ||
          (e.ctrlKey && e.key === 'u') ||
          (e.ctrlKey && e.key === 'r') ||
          e.key === 'F5'
        ) {
          e.preventDefault();
        }
      });

      // Desabilitar zoom
      document.addEventListener('wheel', (e) => {
        if (e.ctrlKey) {
          e.preventDefault();
        }
      }, { passive: false });

      // Desabilitar gestos de zoom no touch
      document.addEventListener('touchstart', (e) => {
        if (e.touches.length > 1) {
          e.preventDefault();
        }
      }, { passive: false });

      // Manter tela sempre ativa (se suportado)
      if ('wakeLock' in navigator) {
        (navigator as any).wakeLock.request('screen').catch((err: any) => {
          console.log('Wake Lock não suportado:', err);
        });
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [enableKiosk]);

  const installPWA = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      console.log(`PWA install: ${outcome}`);
      setInstallPrompt(null);
    }
  };

  return (
    <div className={`${enableKiosk ? 'kiosk-mode' : ''}`}>
      {children}
      
      {/* Botão de instalação PWA (só aparece se não estiver instalado) */}
      {enableKiosk && !isKioskMode && installPrompt && (
        <div className="fixed bottom-4 right-4 z-50">
          <button
            onClick={installPWA}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Instalar App
          </button>
        </div>
      )}

      {/* Indicador de modo kiosk */}
      {enableKiosk && isKioskMode && (
        <div className="fixed top-2 right-2 z-50">
          <div className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold">
            🔒 MODO KIOSK
          </div>
        </div>
      )}

      <style jsx>{`
        .kiosk-mode {
          -webkit-touch-callout: none;
          -webkit-user-select: none;
          -khtml-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
          -webkit-tap-highlight-color: transparent;
        }
      `}</style>
    </div>
  );
} 