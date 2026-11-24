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
          {/* Identity & Permissions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                className="mt-1.5 w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-[#080D16] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500"
              />
            </label>

            <label className="block">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Active Permission Role
              </span>
              <select
                value={profile.role}
                onChange={(e) =>
                  onUpdateProfile({ ...profile, role: e.target.value as LocalUserRole })
                }
                className="mt-1.5 w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-[#080D16] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500"
              >
                <option value="owner">Owner (Full Studio Access)</option>
                <option value="editor">Editor (Can Modify Designs)</option>
                <option value="viewer">Viewer (Read-Only Canvas)</option>
              </select>
            </label>
          </div>

          {/* Theme Toggle */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-4">
            <div>
              <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                Studio Color Theme
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Toggle between Obsidian Dark and Crisp Light Studio workspaces.
              </div>
            </div>
            <button
              type="button"
              onClick={onToggleDarkMode}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#121B2B] text-xs font-medium text-slate-800 dark:text-slate-100 hover:border-teal-500/60 transition-colors whitespace-nowrap shrink-0"
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

          {/* IndexedDB Local Storage Overview */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-900 dark:text-slate-100">
              <Database className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>Local Browser Storage (IndexedDB)</span>
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#080D16] border border-slate-200/80 dark:border-slate-800">
                <div className="text-lg font-display font-bold text-slate-900 dark:text-white tabular-nums">
                  {diagramCount}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Saved Designs
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#080D16] border border-slate-200/80 dark:border-slate-800">
                <div className="text-lg font-display font-bold text-slate-900 dark:text-white tabular-nums">
                  {customTemplateCount}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  My Templates
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#080D16] border border-slate-200/80 dark:border-slate-800">
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
