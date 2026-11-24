import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowDownUp,
  ArrowLeftRight,
  Download,
  FilePlus2,
  FolderOpen,
  MonitorDown,
  Moon,
  Plus,
  Save,
  Search,
  Sparkles,
  Sun,
  Trash2,
} from 'lucide-react';
import { DiagramDocument, DiagramThemeId } from '../../types/diagram';
import { getLibraryForType, LibraryItem } from '../../engine/libraries';
import { LayoutDirection } from '../../engine/layout';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface CommandAction {
  id: string;
  label: string;
  group: string;
  shortcut?: string;
  run: () => void;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  doc: DiagramDocument;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onAddLibraryItem: (item: LibraryItem) => void;
  onApplyLayout: (dir: LayoutDirection) => void;
  onChangeTheme: (theme: DiagramThemeId) => void;
  onOpenExport: () => void;
  onSaveToDesktop: () => void;
  onOpenDesktopFile: () => void;
  onClearCanvas: () => void;
  onOpenNewDesignModal: () => void;
  onOpenAi: () => void;
  onFocusObject: (id: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  open,
  onClose,
  doc,
  darkMode,
  onToggleDarkMode,
  onAddLibraryItem,
  onApplyLayout,
  onChangeTheme,
  onOpenExport,
  onSaveToDesktop,
  onOpenDesktopFile,
  onClearCanvas,
  onOpenNewDesignModal,
  onOpenAi,
  onFocusObject,
}) => {
  const [query, setQuery] = useState('');
  const { isInstalled, triggerInstall } = usePWAInstall();

  useEffect(() => {
    if (open) setQuery('');
  }, [open]);

  const actions = useMemo<CommandAction[]>(() => {
    const list: CommandAction[] = [];

    // Diagram library insertions
    const lib = getLibraryForType(doc.type);
    lib.slice(0, 10).forEach((item) => {
      list.push({
        id: `add-${item.id}`,
        label: `Add ${item.label}`,
        group: 'Insert Component',
        run: () => onAddLibraryItem(item),
      });
    });

    // Layout & Productivity
    if (doc.type !== 'sequence' && doc.type !== 'floorplan') {
      list.push(
        {
          id: 'layout-tb',
          label: 'Auto-Layout: Top to Bottom',
          group: 'Layout',
          run: () => onApplyLayout('TB'),
        },
        {
          id: 'layout-lr',
          label: 'Auto-Layout: Left to Right',
          group: 'Layout',
          run: () => onApplyLayout('LR'),
        }
      );
    }

    // Theme switches
    (['modern', 'minimal', 'technical', 'presentation', 'blueprint'] as DiagramThemeId[]).forEach(
      (t) => {
        list.push({
          id: `theme-${t}`,
          label: `Switch Diagram Theme to ${t.charAt(0).toUpperCase() + t.slice(1)}`,
          group: 'Appearance',
          run: () => onChangeTheme(t),
        });
      }
    );

    list.push(
      {
        id: 'new-design',
        label: 'Start New Design (Choose Any Diagram Type)',
        group: 'File',
        run: onOpenNewDesignModal,
      },
      {
        id: 'clear-canvas',
        label: 'Clear Current Canvas',
        group: 'Edit',
        run: onClearCanvas,
      },
      {
        id: 'save-pcanvas',
        label: 'Download / Save Design to Desktop (.nexora)',
        group: 'File',
        shortcut: 'Cmd+S',
        run: onSaveToDesktop,
      },
      {
        id: 'open-pcanvas',
        label: 'Open Design File (.nexora / .pcanvas)',
        group: 'File',
        shortcut: 'Cmd+O',
        run: onOpenDesktopFile,
      },
      {
        id: 'ai-assist',
        label: 'Open AI Diagram Assistant',
        group: 'Tools',
        run: onOpenAi,
      },
      {
        id: 'export-modal',
        label: 'Export Diagram (SVG, PNG, .nexora, Mermaid)',
        group: 'File',
        shortcut: 'Cmd+E',
        run: onOpenExport,
      },
      {
        id: 'toggle-dark',
        label: darkMode ? 'Switch Interface to Light Mode' : 'Switch Interface to Dark Mode',
        group: 'Appearance',
        run: onToggleDarkMode,
      }
    );

    if (!isInstalled) {
      list.push({
        id: 'install-pwa',
        label: 'Install Nexora Locally as Desktop App (PWA)',
        group: 'App',
        run: () => {
          void triggerInstall();
        },
      });
    }

    // Search objects in current diagram
    doc.objects.forEach((o) => {
      list.push({
        id: `find-${o.id}`,
        label: `Focus "${o.label}"`,
        group: 'Find in Diagram',
        run: () => onFocusObject(o.id),
      });
    });

    return list;
  }, [
    doc,
    darkMode,
    onAddLibraryItem,
    onApplyLayout,
    onChangeTheme,
    onOpenExport,
    onSaveToDesktop,
    onOpenDesktopFile,
    onClearCanvas,
    onOpenNewDesignModal,
    onOpenAi,
    onToggleDarkMode,
    onFocusObject,
    isInstalled,
    triggerInstall,
  ]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return actions.slice(0, 14);
    return actions.filter(
      (a) => a.label.toLowerCase().includes(q) || a.group.toLowerCase().includes(q)
    );
  }, [actions, query]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-start justify-center pt-24 px-4"
      onMouseDown={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#0D1422] border border-slate-200 dark:border-slate-800/90 shadow-2xl dark:shadow-black/70 overflow-hidden nx-menu-enter"
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Universal Command Palette"
      >
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-slate-200 dark:border-slate-800/80">
          <Search className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') onClose();
              if (e.key === 'Enter' && filtered[0]) {
                filtered[0].run();
                onClose();
              }
            }}
            placeholder="Type a command, component to insert, or element to find..."
            className="flex-1 bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none"
          />
          <kbd className="text-[11px] font-mono text-slate-400 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#080D16] rounded px-1.5 py-0.5">
            ESC
          </kbd>
        </div>

        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.map((act) => (
            <button
              key={act.id}
              type="button"
              onClick={() => {
                act.run();
                onClose();
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs text-slate-700 dark:text-slate-200 hover:bg-teal-50 dark:hover:bg-teal-950/50 hover:text-teal-800 dark:hover:text-teal-300 transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {act.id.startsWith('add-') ? (
                  <Plus className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                ) : act.id === 'layout-tb' ? (
                  <ArrowDownUp className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                ) : act.id === 'layout-lr' ? (
                  <ArrowLeftRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                ) : act.id === 'new-design' ? (
                  <FilePlus2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                ) : act.id === 'clear-canvas' ? (
                  <Trash2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                ) : act.id === 'save-pcanvas' ? (
                  <Save className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                ) : act.id === 'open-pcanvas' ? (
                  <FolderOpen className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                ) : act.id === 'export-modal' ? (
                  <Download className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                ) : act.id === 'ai-assist' ? (
                  <Sparkles className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                ) : act.id === 'install-pwa' ? (
                  <MonitorDown className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                ) : act.id === 'toggle-dark' ? (
                  darkMode ? (
                    <Sun className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  ) : (
                    <Moon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  )
                ) : (
                  <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                )}
                <span className="font-medium truncate">{act.label}</span>
              </div>
              <span className="text-[11px] text-slate-400 shrink-0 ml-3">{act.group}</span>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="py-8 text-center text-xs text-slate-500">
              No matching commands found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
