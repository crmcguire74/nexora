import React from 'react';
import {
  Database,
  MonitorDown,
  MonitorX,
  Moon,
  Settings2,
  Sun,
  X,
} from 'lucide-react';
import { LocalProfile, LocalUserRole } from '../../types/diagram';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface WorkspaceSettingsModalProps {
  open: boolean;
  onClose: () => void;
  profile: LocalProfile;
  onUpdateProfile: (next: LocalProfile) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  diagramCount: number;
  customTemplateCount: number;
  customComponentCount: number;
  showSplashOnStartup?: boolean;
  onToggleShowSplashOnStartup?: (show: boolean) => void;
  onPreviewSplash?: () => void;
}

export const WorkspaceSettingsModal: React.FC<WorkspaceSettingsModalProps> = ({
  open,
  onClose,
  profile,
  onUpdateProfile,
  darkMode,
  onToggleDarkMode,
  diagramCount,
  customTemplateCount,
  customComponentCount,
  showSplashOnStartup = true,
  onToggleShowSplashOnStartup,
  onPreviewSplash,
}) => {
  const { isInstalled, triggerInstall, openUninstall } = usePWAInstall();

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 backdrop-blur-xs p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Local Workspace and Nexora Settings"
    >
      <div
        className="w-full max-w-xl rounded-2xl bg-white dark:bg-[#0D1422] border border-slate-200 dark:border-slate-800/90 shadow-2xl overflow-hidden nx-menu-enter"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/60 border border-teal-200/80 dark:border-teal-800/70 flex items-center justify-center text-teal-700 dark:text-teal-400">
              <Settings2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
                Local Workspace &amp; Nexora Settings
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Studio preferences, local identity, IndexedDB storage, and desktop PWA controls
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            aria-label="Close workspace settings"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5 max-h-[76vh] overflow-y-auto">
          {/* Local Identity & Permission Role Simulation */}
          <div className="space-y-3">
            <div className="space-y-0.5">
              <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                Local Workspace Identity &amp; Permissions
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Customize your local workspace name or switch roles to verify read-only Viewer mode versus full Owner/Editor workflows without external cloud auth.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Developer / Owner Name
                </span>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) =>
                    onUpdateProfile({ ...profile, name: e.target.value })
                  }
                  className="mt-1.5 w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-[#080D16] border border-slate-300/80 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500"
                />
              </label>

              <label className="block">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Workspace Name
                </span>
                <input
                  type="text"
                  value={profile.workspaceName}
                  onChange={(e) =>
                    onUpdateProfile({ ...profile, workspaceName: e.target.value })
                  }
                  className="mt-1.5 w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-[#080D16] border border-slate-300/80 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500"
                />
              </label>

              <label className="block sm:col-span-2">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Active Permission Role
                </span>
                <select
                  value={profile.role}
                  onChange={(e) =>
                    onUpdateProfile({ ...profile, role: e.target.value as LocalUserRole })
                  }
                  className="mt-1.5 w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-[#080D16] border border-slate-300/80 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500"
                >
                  <option value="owner">Diagram Owner (Full Control)</option>
                  <option value="editor">Editor (Can Modify Designs)</option>
                  <option value="viewer">Viewer (Read-Only Canvas)</option>
                </select>
              </label>
            </div>
          </div>

          {/* Theme Toggle */}
          <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between gap-4">
            <div>
              <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                Interface Appearance
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Switch between Crisp Light Studio and Obsidian Dark workspace themes.
              </div>
            </div>
            <button
              type="button"
              onClick={onToggleDarkMode}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-300/80 dark:border-slate-700 bg-slate-50 dark:bg-[#121B2B] text-xs font-medium text-slate-800 dark:text-slate-100 hover:border-teal-500/60 transition-colors whitespace-nowrap shrink-0"
            >
              {darkMode ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>Switch to Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-teal-600" />
                  <span>Switch to Obsidian Dark</span>
                </>
              )}
            </button>
          </div>

          {/* Startup Splash Screen Preference */}
          {onToggleShowSplashOnStartup && (
            <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                  Startup Splash Screen
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Display the Nexora welcome splash screen when launching the application.
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <label className="inline-flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={showSplashOnStartup}
                    onChange={(e) => onToggleShowSplashOnStartup(e.target.checked)}
                    className="rounded border-slate-300 dark:border-slate-700 accent-teal-600"
                  />
                  <span>Show on startup</span>
                </label>
                {onPreviewSplash && (
                  <button
                    type="button"
                    onClick={onPreviewSplash}
                    className="px-3 py-1.5 rounded-lg border border-slate-300/80 dark:border-slate-700 bg-slate-50 dark:bg-[#121B2B] text-xs font-medium text-slate-700 dark:text-slate-200 hover:border-teal-500/60 transition-colors whitespace-nowrap"
                  >
                    Preview
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Local Auto-Save Engine & IndexedDB Storage Overview */}
          <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800/80 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-900 dark:text-slate-100">
                <Database className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                <span>Local Auto-Save Engine (IndexedDB)</span>
              </div>
              <span className="text-[11px] font-mono text-teal-700 dark:text-teal-400">
                Active · Offline Ready
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              <div className="p-3 rounded-xl bg-slate-100/80 dark:bg-[#080D16] border border-slate-200 dark:border-slate-800">
                <div className="text-lg font-display font-bold text-slate-900 dark:text-white tabular-nums">
                  {diagramCount}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Saved Designs
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-100/80 dark:bg-[#080D16] border border-slate-200 dark:border-slate-800">
                <div className="text-lg font-display font-bold text-slate-900 dark:text-white tabular-nums">
                  {customTemplateCount}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  My Templates
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-100/80 dark:bg-[#080D16] border border-slate-200 dark:border-slate-800">
                <div className="text-lg font-display font-bold text-slate-900 dark:text-white tabular-nums">
                  {customComponentCount}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Saved Symbols
                </div>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Nexora automatically persists every change in IndexedDB. Remember to periodically download important projects as <code className="font-mono text-teal-700 dark:text-teal-400">.nexora</code> files to keep permanent copies on your local drive.
            </p>
          </div>

          {/* Desktop App (PWA) Controls */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                Desktop App Installation (PWA)
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {isInstalled
                  ? 'Running as a standalone installed desktop app.'
                  : 'Install Nexora locally for offline access and standalone windows.'}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  void triggerInstall();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-600 text-white text-xs font-medium transition-colors whitespace-nowrap"
              >
                <MonitorDown className="w-3.5 h-3.5" />
                <span>{isInstalled ? 'App Status' : 'Install PWA'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  openUninstall();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 hover:border-red-400/60 hover:text-red-600 dark:hover:text-red-400 transition-colors whitespace-nowrap"
              >
                <MonitorX className="w-3.5 h-3.5" />
                <span>Uninstall</span>
              </button>
            </div>
          </div>
        </div>

        <div className="px-5 py-3.5 border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-50/70 dark:bg-[#080D16] flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
