import React, { useState } from 'react';
import {
  Check,
  CheckCircle2,
  Compass,
  Copy,
  Download,
  HardDrive,
  Laptop,
  MonitorDown,
  Share,
  ShieldCheck,
  WifiOff,
  X,
} from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  compact?: boolean;
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  compact = false,
  className = '',
}) => {
  const { isInstallable, isInstalled, justInstalled, triggerInstall } = usePWAInstall();

  if (isInstalled && !justInstalled) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={() => void triggerInstall()}
      className={`inline-flex items-center gap-1.5 rounded-lg transition-colors text-xs font-medium whitespace-nowrap shrink-0 ${
        justInstalled
          ? 'border border-teal-600/40 bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-200'
          : isInstallable
            ? 'bg-teal-700 hover:bg-teal-800 text-white border border-teal-700 shadow-xs'
            : 'border border-teal-600/35 dark:border-teal-500/45 bg-teal-50/90 dark:bg-teal-950/50 text-teal-800 dark:text-teal-200 hover:bg-teal-100 dark:hover:bg-teal-900/60'
      } ${compact ? 'px-2.5 py-1.5' : 'px-3 py-2'} ${className}`}
      title={
        isInstallable
          ? 'Install Nexora locally as a standalone desktop app (1-click PWA install)'
          : 'Install Nexora locally as a standalone offline-ready app (PWA)'
      }
    >
      {justInstalled ? (
        <>
          <Check className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
          <span>Installed</span>
        </>
      ) : (
        <>
          <MonitorDown
            className={`w-3.5 h-3.5 ${
              isInstallable ? 'text-white' : 'text-teal-700 dark:text-teal-400'
            }`}
          />
          <span>
            {compact
              ? 'Install App'
              : isInstallable
                ? 'Install Nexora App'
                : 'Install Desktop App'}
          </span>
        </>
      )}
    </button>
  );
};

export const PWAInstallModal: React.FC = () => {
  const {
    isInstallable,
    isInstalled,
    isIOS,
    isMacSafari,
    isInIframe,
    swReady,
    manifestReady,
    guideOpen,
    install,
    closeGuide,
  } = usePWAInstall();
  const [copiedUrl, setCopiedUrl] = useState(false);

  if (!guideOpen) return null;

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2400);
    } catch {
      // ignore clipboard errors
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4"
      onClick={closeGuide}
      role="dialog"
      aria-modal="true"
      aria-label="Install Nexora Locally as a Desktop App"
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <img
              src="/assets/aistudio/image_db9637f7.png"
              alt="Nexora"
              className="w-8 h-8 rounded-lg shadow-xs"
            />
            <div>
              <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
                Install Nexora Locally (PWA)
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Standalone window · Offline workspace · Local IndexedDB storage
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeGuide}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            aria-label="Close install dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs text-slate-600 dark:text-slate-300">
          {/* Live PWA Readiness Strip */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/50 p-2.5 flex items-start gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <div className="font-semibold text-[11px] text-slate-800 dark:text-slate-200">
                  Web Manifest
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                  {manifestReady ? 'Verified' : 'Linked'}
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/50 p-2.5 flex items-start gap-2">
              <WifiOff className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <div className="font-semibold text-[11px] text-slate-800 dark:text-slate-200">
                  Offline Cache
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                  {swReady ? 'SW Active' : 'Enabled'}
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/50 p-2.5 flex items-start gap-2">
              <HardDrive className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <div className="font-semibold text-[11px] text-slate-800 dark:text-slate-200">
                  Local Data
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                  IndexedDB
                </div>
              </div>
            </div>
          </div>

          {isInstalled ? (
            <div className="p-3.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/70 flex items-center gap-2.5 text-teal-900 dark:text-teal-200">
              <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
              <span>Nexora is already installed and running as a standalone local app.</span>
            </div>
          ) : isInstallable ? (
            <div className="p-4 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/70 space-y-3">
              <div className="text-teal-950 dark:text-teal-100 font-semibold">
                Ready for one-click desktop installation
              </div>
              <p className="text-teal-900/80 dark:text-teal-200/80 leading-relaxed">
                Your browser supports direct PWA installation. Click below to install Nexora to your Dock, Taskbar, or Applications folder for offline access.
              </p>
              <button
                type="button"
                onClick={() => void install()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Install Nexora Now</span>
              </button>
            </div>
          ) : isIOS ? (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                <Share className="w-4 h-4 text-teal-600" />
                <span>Install on iPhone or iPad (Safari)</span>
              </div>
              <ol className="list-decimal list-inside space-y-1.5 leading-relaxed">
                <li>
                  Tap the <strong>Share</strong> button in Safari&apos;s toolbar.
                </li>
                <li>
                  Scroll down and choose <strong>Add to Home Screen</strong>.
                </li>
                <li>
                  Tap <strong>Add</strong> to launch Nexora full-screen offline.
                </li>
              </ol>
            </div>
          ) : (
            <div className="space-y-3">
              {isInIframe && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/70 text-amber-900 dark:text-amber-200 space-y-2">
                  <p className="leading-relaxed">
                    You are viewing Nexora inside an embedded preview frame. Browsers only show the one-click install prompt when opened directly in a top-level browser tab.
                  </p>
                  <button
                    type="button"
                    onClick={() => void handleCopyUrl()}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800 text-[11px] font-medium text-amber-900 dark:text-amber-200 hover:bg-amber-100/70 dark:hover:bg-amber-950 transition-colors"
                  >
                    {copiedUrl ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-teal-600" />
                        <span>URL Copied — paste in a new browser tab</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy App URL to Open in Browser Tab</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {isMacSafari ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                    <Compass className="w-4 h-4 text-teal-600" />
                    <span>Install with Safari on macOS</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1.5 leading-relaxed">
                    <li>
                      In the macOS menu bar, click <strong>File &rarr; Add to Dock&hellip;</strong>
                    </li>
                    <li>
                      Keep the name <strong>Nexora</strong> and click <strong>Add</strong>.
                    </li>
                    <li>Launch Nexora anytime from your Dock or Spotlight.</li>
                  </ol>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                      <Laptop className="w-4 h-4 text-teal-600" />
                      <span>Chrome, Edge, Brave &amp; Arc (Desktop)</span>
                    </div>
                    <ol className="list-decimal list-inside space-y-1 leading-relaxed">
                      <li>Open Nexora in a standard top-level browser tab.</li>
                      <li>
                        Click <strong>Install App</strong> here or the{' '}
                        <strong>Install Nexora</strong> icon on the right side of your address bar
                        (or Menu &rarr; <strong>Cast, save, and share</strong> &rarr;{' '}
                        <strong>Install page as app</strong>).
                      </li>
                      <li>
                        Confirm <strong>Install</strong> to pin Nexora to your Dock, Start Menu, or
                        Taskbar.
                      </li>
                    </ol>
                  </div>
                  <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="font-semibold text-slate-900 dark:text-white">
                      Safari on macOS
                    </div>
                    <p className="leading-relaxed">
                      Choose <strong>File &rarr; Add to Dock&hellip;</strong> from the macOS menu
                      bar to run Nexora as a standalone desktop window.
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          <div className="pt-2 flex items-center justify-end">
            <button
              type="button"
              onClick={closeGuide}
              className="px-4 py-2 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-medium hover:opacity-90 transition-opacity"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
