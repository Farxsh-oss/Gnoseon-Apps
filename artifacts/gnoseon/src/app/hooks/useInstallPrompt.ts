import { useState, useEffect } from 'react';

type Platform = 'android' | 'ios' | 'desktop' | 'unknown';

interface InstallPromptState {
  canInstall: boolean;
  isInstalled: boolean;
  platform: Platform;
  isIos: boolean;
  promptInstall: () => Promise<boolean>;
}

function detectPlatform(): Platform {
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return 'ios';
  if (/android/.test(ua)) return 'android';
  if (/win|mac|linux/.test(navigator.platform?.toLowerCase() || '')) return 'desktop';
  return 'unknown';
}

function isRunningStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
}

let deferredPrompt: any = null;

export function useInstallPrompt(): InstallPromptState {
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(isRunningStandalone());
  const platform = detectPlatform();

  useEffect(() => {
    if (isRunningStandalone()) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt = e;
      setCanInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setCanInstall(false);
      deferredPrompt = null;
    });

    // iOS: can't detect beforeinstallprompt, but can prompt manually
    if (platform === 'ios' && !isRunningStandalone()) {
      setCanInstall(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [platform]);

  const promptInstall = async (): Promise<boolean> => {
    if (!deferredPrompt) return false;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    setCanInstall(false);
    return outcome === 'accepted';
  };

  return {
    canInstall,
    isInstalled,
    platform,
    isIos: platform === 'ios',
    promptInstall,
  };
}
