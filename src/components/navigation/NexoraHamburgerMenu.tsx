import React, { useEffect, useRef, useState } from 'react';
import {
  BookmarkPlus,
  Check,
  FilePlus2,
  FolderOpen,
  HardDriveDownload,
  History,
  LayoutTemplate,
  Menu,
  MonitorDown,
  MonitorX,
  Settings2,
  XCircle,
} from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

export interface NexoraHamburgerMenuProps {
  hasActiveDoc?: boolean;
  readOnly?: boolean;
  snapshotCount?: number;
  hasUndownloadedChanges?: boolean;
  onNewFile: () => void;
  onNewFromTemplate: () => void;
  onOpenFile: () => void;
  onCloseFile?: () => void;
  onSaveToDrive?: () => void;
  onOpenHistory?: () => void;
  onSaveAsTemplate?: () => void;
  onOpenSettings: () => void;
}

export const NexoraHamburgerMenu: React.FC<NexoraHamburgerMenuProps> = ({
  hasActiveDoc = false,
  readOnly = false,
  snapshotCount = 0,
  hasUndownloadedChanges = false,
  onNewFile,
  onNewFromTemplate,
  onOpenFile,
  onCloseFile,
  onSaveToDrive,
  onOpenHistory,
  onSaveAsTemplate,
  onOpenSettings,
}) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { isInstalled, triggerInstall, openUninstall } = usePWAInstall();

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const run = (fn?: () => void) => {
    setOpen(false);
    fn?.();
  };

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Open Nexora menu"
        title="Nexora Menu (File, Templates, Snapshots, PWA, Settings)"
        className={`inline-flex items-center justify-center w-8 h-8 rounded-lg border transition-colors ${
          open
            ? 'border-teal-500/60 bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300'
            : 'border-slate-200/80 dark:border-slate-800 bg-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#141F32] hover:text-slate-900 dark:hover:text-white'
        }`}
      >
        <Menu className="w-4 h-4" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute left-0 top-full mt-2 w-72 rounded-xl bg-white dark:bg-[#0D1422] border border-slate-200/90 dark:border-slate-700/80 shadow-2xl py-1.5 z-50 nx-menu-enter"
        >
          {/* File Section */}
          <div className="px-3 pt-1.5 pb-1 text-[10.5px] font-semibold tracking-wider uppercase text-slate-400 dark:text-slate-500">
            File
          </div>

          <button
            type="button"
            role="menuitem"
            onClick={() => run(onNewFile)}
            className="w-full px-3 py-2 flex items-center justify-between gap-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-teal-50/70 dark:hover:bg-teal-950/45 hover:text-teal-800 dark:hover:text-teal-200 transition-colors text-left"
          >
            <span className="flex items-center gap-2.5 min-w-0">
              <FilePlus2 className="w-4 h-4 text-slate-400 dark:text-slate-400 shrink-0" />
              <span className="font-medium truncate">New File&hellip;</span>
            </span>
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={() => run(onNewFromTemplate)}
            className="w-full px-3 py-2 flex items-center justify-between gap-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-teal-50/70 dark:hover:bg-teal-950/45 hover:text-teal-800 dark:hover:text-teal-200 transition-colors text-left"
          >
            <span className="flex items-center gap-2.5 min-w-0">
              <LayoutTemplate className="w-4 h-4 text-slate-400 dark:text-slate-400 shrink-0" />
              <span className="font-medium truncate">New from Template&hellip;</span>
            </span>
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={() => run(onOpenFile)}
            className="w-full px-3 py-2 flex items-center justify-between gap-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-teal-50/70 dark:hover:bg-teal-950/45 hover:text-teal-800 dark:hover:text-teal-200 transition-colors text-left"
          >
            <span className="flex items-center gap-2.5 min-w-0">
              <FolderOpen className="w-4 h-4 text-slate-400 dark:text-slate-400 shrink-0" />
              <span className="font-medium truncate">Open File (.nexora)&hellip;</span>
            </span>
            <kbd className="font-mono text-[10px] text-slate-400 dark:text-slate-500 shrink-0">⌘O</kbd>
          </button>

          <button
            type="button"
            role="menuitem"
            disabled={!hasActiveDoc}
            onClick={() => run(onSaveToDrive)}
            className="w-full px-3 py-2 flex items-center justify-between gap-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-teal-50/70 dark:hover:bg-teal-950/45 hover:text-teal-800 dark:hover:text-teal-200 disabled:opacity-40 disabled:pointer-events-none transition-colors text-left"
          >
            <span className="flex items-center gap-2.5 min-w-0">
              <HardDriveDownload
                className={`w-4 h-4 shrink-0 ${
                  hasActiveDoc && hasUndownloadedChanges
                    ? 'text-teal-600 dark:text-teal-400'
                    : 'text-slate-400 dark:text-slate-400'
                }`}
              />
              <span className="font-medium truncate">Save / Download to Local Drive</span>
            </span>
            <kbd className="font-mono text-[10px] text-slate-400 dark:text-slate-500 shrink-0">⌘S</kbd>
          </button>

          <button
            type="button"
            role="menuitem"
            disabled={!hasActiveDoc || readOnly}
            onClick={() => run(onSaveAsTemplate)}
            className="w-full px-3 py-2 flex items-center justify-between gap-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-teal-50/70 dark:hover:bg-teal-950/45 hover:text-teal-800 dark:hover:text-teal-200 disabled:opacity-40 disabled:pointer-events-none transition-colors text-left"
          >
            <span className="flex items-center gap-2.5 min-w-0">
              <BookmarkPlus className="w-4 h-4 text-slate-400 dark:text-slate-400 shrink-0" />
              <span className="font-medium truncate">Save Design as Template&hellip;</span>
            </span>
          </button>

          <button
            type="button"
            role="menuitem"
            disabled={!hasActiveDoc}
            onClick={() => run(onCloseFile)}
            className="w-full px-3 py-2 flex items-center justify-between gap-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#141F32] disabled:opacity-40 disabled:pointer-events-none transition-colors text-left"
          >
            <span className="flex items-center gap-2.5 min-w-0">
              <XCircle className="w-4 h-4 text-slate-400 dark:text-slate-400 shrink-0" />
              <span className="font-medium truncate">Close Current File</span>
            </span>
          </button>

          <div className="my-1.5 border-t border-slate-100 dark:border-slate-800/80" />

          {/* Workspace Section */}
          <div className="px-3 pt-1 pb-1 text-[10.5px] font-semibold tracking-wider uppercase text-slate-400 dark:text-slate-500">
            Workspace
          </div>

          <button
            type="button"
            role="menuitem"
            disabled={!hasActiveDoc}
            onClick={() => run(onOpenHistory)}
            className="w-full px-3 py-2 flex items-center justify-between gap-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-teal-50/70 dark:hover:bg-teal-950/45 hover:text-teal-800 dark:hover:text-teal-200 disabled:opacity-40 disabled:pointer-events-none transition-colors text-left"
          >
            <span className="flex items-center gap-2.5 min-w-0">
              <History className="w-4 h-4 text-slate-400 dark:text-slate-400 shrink-0" />
              <span className="font-medium truncate">History &amp; Snapshots</span>
            </span>
            {hasActiveDoc && snapshotCount > 0 && (
              <span className="font-mono text-[10.5px] text-teal-700 dark:text-teal-400 tabular-nums shrink-0">
                {snapshotCount}
              </span>
            )}
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={() => run(onOpenSettings)}
            className="w-full px-3 py-2 flex items-center justify-between gap-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-teal-50/70 dark:hover:bg-teal-950/45 hover:text-teal-800 dark:hover:text-teal-200 transition-colors text-left"
          >
            <span className="flex items-center gap-2.5 min-w-0">
              <Settings2 className="w-4 h-4 text-slate-400 dark:text-slate-400 shrink-0" />
              <span className="font-medium truncate">Local Workspace &amp; Nexora Settings</span>
            </span>
          </button>

          <div className="my-1.5 border-t border-slate-100 dark:border-slate-800/80" />

          {/* Desktop App (PWA) Section */}
          <div className="px-3 pt-1 pb-1 text-[10.5px] font-semibold tracking-wider uppercase text-slate-400 dark:text-slate-500">
            Desktop App (PWA)
          </div>

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              void triggerInstall();
            }}
            className="w-full px-3 py-2 flex items-center justify-between gap-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-teal-50/70 dark:hover:bg-teal-950/45 hover:text-teal-800 dark:hover:text-teal-200 transition-colors text-left"
          >
            <span className="flex items-center gap-2.5 min-w-0">
              <MonitorDown className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
              <span className="font-medium truncate">
                {isInstalled ? 'Desktop App Installed (PWA)' : 'Save / Install as PWA'}
              </span>
            </span>
            {isInstalled && <Check className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />}
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              openUninstall();
            }}
            className="w-full px-3 py-2 flex items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-300 hover:bg-red-50/70 dark:hover:bg-red-950/40 hover:text-red-600 dark:hover:text-red-400 transition-colors text-left"
          >
            <span className="flex items-center gap-2.5 min-w-0">
              <MonitorX className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="font-medium truncate">Uninstall PWA&hellip;</span>
            </span>
          </button>
        </div>
      )}
    </div>
  );
};
