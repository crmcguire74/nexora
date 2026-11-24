import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface PWAInstallSnapshot {
  deferredPrompt: BeforeInstallPromptEvent | null;
  isInstalled: boolean;
  justInstalled: boolean;
  isIOS: boolean;
  isMacSafari: boolean;
  isInIframe: boolean;
  swReady: boolean;
  manifestReady: boolean;
  guideOpen: boolean;
  uninstallOpen: boolean;
}

function detectStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: window-controls-overlay)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function detectIOS(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent.toLowerCase();
  const isClassicIOS = /iphone|ipad|ipod/.test(ua);
  const isIPadOS =
    ua.includes('macintosh') &&
    typeof navigator.maxTouchPoints === 'number' &&
    navigator.maxTouchPoints > 1;
  return isClassicIOS || isIPadOS;
}

function detectMacSafari(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent.toLowerCase();
  return (
    ua.includes('macintosh') &&
    ua.includes('safari') &&
    !ua.includes('chrome') &&
    !ua.includes('chromium') &&
    !ua.includes('edg') &&
    !detectIOS()
  );
}

function detectInIframe(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

let state: PWAInstallSnapshot = {
  deferredPrompt: null,
  isInstalled: detectStandalone(),
  justInstalled: false,
  isIOS: detectIOS(),
  isMacSafari: detectMacSafari(),
  isInIframe: detectInIframe(),
  swReady: false,
  manifestReady: false,
  guideOpen: false,
  uninstallOpen: false,
};

const listeners = new Set<() => void>();
let initialized = false;

function emit() {
  listeners.forEach((fn) => fn());
}

function setState(patch: Partial<PWAInstallSnapshot>) {
  state = { ...state, ...patch };
  emit();
}

export function initPWAInstallListener() {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;

  const checkManifest = () => {
    const link = document.querySelector('link[rel="manifest"]');
    if (link && !state.manifestReady) {
      setState({ manifestReady: true });
    }
  };

  checkManifest();
  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', checkManifest, { once: true });
  }

  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    setState({
      deferredPrompt: e as BeforeInstallPromptEvent,
      manifestReady: true,
    });
  });

  window.addEventListener('appinstalled', () => {
    setState({
      isInstalled: true,
      justInstalled: true,
      deferredPrompt: null,
      guideOpen: false,
    });
  });

  const standaloneMedia = window.matchMedia('(display-mode: standalone)');
  const onDisplayModeChange = () => {
    setState({ isInstalled: detectStandalone() });
  };
  if (typeof standaloneMedia.addEventListener === 'function') {
    standaloneMedia.addEventListener('change', onDisplayModeChange);
  }

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .getRegistration()
      .then((reg) => {
        if (reg && (reg.active || reg.waiting || reg.installing)) {
          setState({ swReady: true });
        }
      })
      .catch(() => {
        // ignore
      });

    navigator.serviceWorker.ready
      .then(() => {
        setState({ swReady: true });
      })
      .catch(() => {
        // ignore
      });
  }
}

initPWAInstallListener();

export async function promptNativePWAInstall(): Promise<boolean> {
  const promptEvent = state.deferredPrompt;
  if (!promptEvent) return false;
  try {
    await promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    if (outcome === 'accepted') {
      setState({
        isInstalled: true,
        justInstalled: true,
        deferredPrompt: null,
        guideOpen: false,
      });
      return true;
    }
    setState({ deferredPrompt: null });
    return false;
  } catch {
    return false;
  }
}

export function openPWAInstallGuide() {
  setState({ guideOpen: true, uninstallOpen: false });
}

export function closePWAInstallGuide() {
  setState({ guideOpen: false });
}

export function openPWAUninstallGuide() {
  setState({ uninstallOpen: true, guideOpen: false });
}

export function closePWAUninstallGuide() {
  setState({ uninstallOpen: false });
}

export async function triggerPWAInstall(): Promise<boolean> {
  if (state.deferredPrompt) {
    return promptNativePWAInstall();
  }
  openPWAInstallGuide();
  return false;
}

/**
 * Cleanly unregisters active Nexora service workers and clears offline Cache Storage
 * while leaving the user's IndexedDB diagrams untouched.
 */
export async function unregisterPWAServiceWorkerAndCaches(): Promise<{
  unregisteredCount: number;
  clearedCachesCount: number;
}> {
  let unregisteredCount = 0;
  let clearedCachesCount = 0;

  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      for (const reg of regs) {
        const ok = await reg.unregister();
        if (ok) unregisteredCount += 1;
      }
    } catch {
      // ignore
    }
  }

  if (typeof window !== 'undefined' && 'caches' in window) {
    try {
      const keys = await window.caches.keys();
      for (const key of keys) {
        const ok = await window.caches.delete(key);
        if (ok) clearedCachesCount += 1;
      }
    } catch {
      // ignore
    }
  }

  setState({ swReady: false });
  return { unregisteredCount, clearedCachesCount };
}

export function usePWAInstall() {
  const [snapshot, setSnapshot] = useState<PWAInstallSnapshot>(state);

  useEffect(() => {
    initPWAInstallListener();
    const sync = () => setSnapshot({ ...state });
    listeners.add(sync);
    sync();
    return () => {
      listeners.delete(sync);
    };
  }, []);

  return {
    isInstallable: Boolean(snapshot.deferredPrompt),
    isInstalled: snapshot.isInstalled,
    justInstalled: snapshot.justInstalled,
    isIOS: snapshot.isIOS,
    isMacSafari: snapshot.isMacSafari,
    isInIframe: snapshot.isInIframe,
    swReady: snapshot.swReady,
    manifestReady: snapshot.manifestReady,
    guideOpen: snapshot.guideOpen,
    uninstallOpen: snapshot.uninstallOpen,
    install: promptNativePWAInstall,
    triggerInstall: triggerPWAInstall,
    openGuide: openPWAInstallGuide,
    closeGuide: closePWAInstallGuide,
    openUninstall: openPWAUninstallGuide,
    closeUninstall: closePWAUninstallGuide,
    unregisterOfflineEngine: unregisterPWAServiceWorkerAndCaches,
  };
}

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
