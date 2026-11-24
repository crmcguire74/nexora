import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Copy,
  Database,
  FolderOpen,
  HardDriveDownload,
  Moon,
  Plus,
  Search,
  Star,
  Sun,
  Trash2,
  Upload,
} from 'lucide-react';
import {
  CustomComponent,
  DiagramDocument,
  DiagramType,
  LocalProfile,
} from '../../types/diagram';
import {
  DIAGRAM_TYPE_MAP,
  DIAGRAM_TYPES,
  NEXORA_MODULE_MAP,
  NEXORA_MODULES,
  NexoraModuleId,
} from '../../engine/libraries';
import { BUILTIN_TEMPLATES } from '../../engine/templates';
import {
  DiagramTypeIllustration,
  NexoraBrandLogo,
  NexoraModuleIcon,
} from '../icons/ShapeIcons';
import { NexoraHamburgerMenu } from '../navigation/NexoraHamburgerMenu';
import { NewDesignModal } from '../modals/NewDesignModal';
import { importFromMermaid, importFromNativeJson } from '../../engine/exportImport';
import {
  DesktopFileHandle,
  openDesignFromDesktop,
  readDroppedPCanvasFile,
  saveDesignToDesktop,
} from '../../engine/pcanvasFile';

type HomeSection = 'home' | 'templates' | 'components';

interface HomeDashboardProps {
  diagrams: DiagramDocument[];
  customTemplates: DiagramDocument[];
  customComponents: CustomComponent[];
  darkMode: boolean;
  onToggleDarkMode: () => void;
  profile: LocalProfile;
  onOpenDiagram: (doc: DiagramDocument) => void;
  onOpenDesktopFile: (
    doc: DiagramDocument,
    handle: DesktopFileHandle | null,
    fileName: string
  ) => void;
  onCreateBlank: (type: DiagramType) => void;
  onUseTemplate: (doc: DiagramDocument) => void;
  onDuplicateDiagram: (doc: DiagramDocument) => void;
  onDeleteDiagram: (id: string) => void;
  onToggleStarDiagram: (id: string) => void;
  onDeleteCustomComponent: (id: string) => void;
  onDeleteCustomTemplate: (id: string) => void;
  onOpenWorkspaceSettings: () => void;
}

function formatRelativeDate(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  diagrams,
  customTemplates,
  customComponents,
  darkMode,
  onToggleDarkMode,
  profile,
  onOpenDiagram,
  onOpenDesktopFile,
  onCreateBlank,
  onUseTemplate,
  onDuplicateDiagram,
  onDeleteDiagram,
  onToggleStarDiagram,
  onDeleteCustomComponent,
  onDeleteCustomTemplate,
  onOpenWorkspaceSettings,
}) => {
  const [section, setSection] = useState<HomeSection>('home');
  const [activeModule, setActiveModule] = useState<NexoraModuleId | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [folderFilter, setFolderFilter] = useState<string>('All');
  const [templateModuleFilter, setTemplateModuleFilter] = useState<NexoraModuleId | 'all'>('all');
  const [templateFilter, setTemplateFilter] = useState<DiagramType | 'all'>('all');
  const [importError, setImportError] = useState<string | null>(null);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [fileDropActive, setFileDropActive] = useState(false);
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [newModalTab, setNewModalTab] = useState<'blank' | 'templates'>('blank');
  const [recentExpanded, setRecentExpanded] = useState(false);

  const folders = useMemo(() => {
    const set = new Set<string>(['All']);
    diagrams.forEach((d) => {
      if (d.folder) set.add(d.folder);
    });
    return Array.from(set);
  }, [diagrams]);

  const filteredDiagrams = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return diagrams.filter((d) => {
      if (folderFilter !== 'All' && d.folder !== folderFilter) return false;
      if (!q) return true;
      return (
        d.title.toLowerCase().includes(q) ||
        d.type.toLowerCase().includes(q) ||
        d.folder.toLowerCase().includes(q) ||
        d.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [diagrams, folderFilter, searchQuery]);

  const allTemplates = useMemo(() => {
    const customMapped = customTemplates.map((ct) => ({
      id: ct.id,
      name: ct.title,
      description: `Custom saved ${DIAGRAM_TYPE_MAP[ct.type].name.toLowerCase()} template`,
      category: ct.type,
      isCustom: true,
      popular: false,
      createDocument: () => ({
        ...structuredClone(ct),
        id: `diag_${Date.now().toString(36)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
    }));
    return [...customMapped, ...BUILTIN_TEMPLATES];
  }, [customTemplates]);

  const filteredTemplates = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allTemplates.filter((t) => {
      if (templateModuleFilter !== 'all' && DIAGRAM_TYPE_MAP[t.category].module !== templateModuleFilter) {
        return false;
      }
      if (templateFilter !== 'all' && t.category !== templateFilter) return false;
      if (!q) return true;
      return (
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
      );
    });
  }, [allTemplates, templateModuleFilter, templateFilter, searchQuery]);

  const visibleStudios = useMemo(() => {
    if (activeModule === 'all') return DIAGRAM_TYPES;
    return DIAGRAM_TYPES.filter((dt) => dt.module === activeModule);
  }, [activeModule]);

  const showNotice = (msg: string) => {
    setStatusNotice(msg);
    setTimeout(() => {
      setStatusNotice((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  const handleOpenPCanvasPicker = async () => {
    setImportError(null);
    try {
      const opened = await openDesignFromDesktop();
      if (opened) {
        onOpenDesktopFile(opened.doc, opened.handle, opened.fileName);
      }
    } catch (err) {
      setImportError(
        err instanceof Error ? err.message : 'Unable to open .nexora design file.'
      );
    }
  };

  const handleSaveRowToDesktop = async (doc: DiagramDocument) => {
    setImportError(null);
    try {
      const result = await saveDesignToDesktop(doc, { saveAs: true });
      if (result.saved) {
        showNotice(`Downloaded ${result.fileName} to your computer`);
      }
    } catch (err) {
      setImportError(
        err instanceof Error ? err.message : 'Unable to download design file.'
      );
    }
  };

  const handleDragOverRoot = (e: React.DragEvent<HTMLDivElement>) => {
    if (e.dataTransfer?.types?.includes('Files')) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      if (!fileDropActive) setFileDropActive(true);
    }
  };

  const handleDragLeaveRoot = (e: React.DragEvent<HTMLDivElement>) => {
    if (e.currentTarget === e.target || !e.currentTarget.contains(e.relatedTarget as Node)) {
      setFileDropActive(false);
    }
  };

  const handleDropRoot = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setFileDropActive(false);
    const file = e.dataTransfer?.files?.[0];
    if (!file) return;
    setImportError(null);
    try {
      const lower = file.name.toLowerCase();
      if (lower.endsWith('.nexora') || lower.endsWith('.pcanvas') || lower.endsWith('.json')) {
        const opened = await readDroppedPCanvasFile(file);
        onOpenDesktopFile(opened.doc, null, opened.fileName);
      } else {
        const text = (await file.text()).trim();
        const doc = text.startsWith('{')
          ? importFromNativeJson(text)
          : importFromMermaid(text, file.name.replace(/\.[^.]+$/, ''));
        onUseTemplate(doc);
      }
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Unable to open dropped file.');
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError(null);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result || '').trim();
        const lower = file.name.toLowerCase();
        if (lower.endsWith('.nexora') || lower.endsWith('.pcanvas')) {
          const doc = importFromNativeJson(text);
          onOpenDesktopFile(doc, null, file.name);
        } else {
          const doc = text.startsWith('{')
            ? importFromNativeJson(text)
            : importFromMermaid(text, file.name.replace(/\.[^.]+$/, ''));
          onUseTemplate(doc);
        }
      } catch (err) {
        setImportError(err instanceof Error ? err.message : 'Unable to import file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div
      className="min-h-screen nexora-studio-backdrop text-slate-900 dark:text-slate-100 flex flex-col relative"
      onDragOver={handleDragOverRoot}
      onDragLeave={handleDragLeaveRoot}
      onDrop={handleDropRoot}
    >
      {fileDropActive && (
        <div className="fixed inset-0 z-50 bg-teal-600/15 dark:bg-teal-500/20 backdrop-blur-[2px] flex items-center justify-center p-6 pointer-events-none">
          <div className="px-8 py-6 rounded-2xl bg-white dark:bg-[#0D1422] border-2 border-dashed border-teal-500 shadow-2xl text-center space-y-2">
            <FolderOpen className="w-8 h-8 text-teal-600 dark:text-teal-400 mx-auto" />
            <div className="font-display text-base font-semibold text-slate-900 dark:text-white">
              Drop .nexora file to view &amp; edit
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Supports Nexora (.nexora), legacy .pcanvas, JSON, and Mermaid files
            </p>
          </div>
        </div>
      )}
      {/* Clean 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-30 h-16 bg-white/95 dark:bg-[#0C121E]/95 backdrop-blur-md border-b border-slate-300/75 dark:border-slate-800/90 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="max-w-7xl mx-auto h-full px-6 flex items-center justify-between gap-6">
          {/* Zone 1: Hamburger Menu + Nexora Brand Logo & Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <NexoraHamburgerMenu
              hasActiveDoc={false}
              onNewFile={() => {
                setNewModalTab('blank');
                setNewModalOpen(true);
              }}
              onNewFromTemplate={() => {
                setNewModalTab('templates');
                setNewModalOpen(true);
              }}
              onOpenFile={() => void handleOpenPCanvasPicker()}
              onOpenSettings={onOpenWorkspaceSettings}
            />
            <button
              type="button"
              onClick={() => {
                setSection('home');
                setActiveModule('all');
              }}
              className="inline-flex items-center gap-2.5 whitespace-nowrap shrink-0 group"
            >
              <NexoraBrandLogo className="w-7 h-7 transition-transform group-hover:scale-105" />
              <span className="font-display text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                nexora
              </span>
            </button>
          </div>

          {/* Zone 2: Clean Text Nav Links (Workspace settings live inside the Hamburger Menu) */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
            {(
              [
                ['home', 'Home'],
                ['templates', 'Templates'],
                ['components', 'Components'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setSection(key);
                  setSearchQuery('');
                }}
                className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                  section === key
                    ? 'text-slate-900 dark:text-white border-teal-600 dark:border-teal-400'
                    : 'text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                {label}
              </button>
            ))}
          </nav>

          {/* Zone 3: Theme Switcher */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onToggleDarkMode}
              className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-slate-300/80 dark:border-slate-800 bg-slate-50/80 dark:bg-[#111928] text-xs font-medium text-slate-700 dark:text-slate-200 hover:border-teal-500/60 hover:bg-white dark:hover:bg-[#172338] transition-colors shrink-0"
              title={darkMode ? 'Switch to Light Studio' : 'Switch to Obsidian Dark'}
              aria-label={darkMode ? 'Switch to Light Studio' : 'Switch to Obsidian Dark'}
            >
              {darkMode ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span className="hidden sm:inline">Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-teal-700" />
                  <span className="hidden sm:inline">Dark</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Nav Strip */}
      <div className="md:hidden flex items-center gap-5 px-6 py-2.5 bg-white dark:bg-[#0C121E] border-b border-slate-300/75 dark:border-slate-800 overflow-x-auto text-xs font-medium">
        {(
          [
            ['home', 'Home'],
            ['templates', 'Templates'],
            ['components', 'Components'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setSection(key)}
            className={`whitespace-nowrap shrink-0 pb-0.5 ${
              section === key ? 'text-teal-700 dark:text-teal-400 font-semibold' : 'text-slate-500'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 space-y-8">
        {section === 'home' && (
          <>
            {/* Section 1: Nexora Suite Brand Hero & 4-Module Hierarchy */}
            <section className="space-y-6">
              <div className="rounded-2xl bg-white dark:bg-[#0D1422] border border-slate-300/80 dark:border-slate-800/90 p-6 sm:p-8 space-y-6 shadow-[0_2px_8px_rgba(15,23,42,0.06)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.35)]">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                  <div className="flex items-center gap-4">
                    <NexoraBrandLogo className="w-12 h-12 shrink-0" />
                    <div className="space-y-0.5">
                      <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white leading-none">
                        nexora
                      </h1>
                      <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                        The visual workspace
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleOpenPCanvasPicker}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300/85 dark:border-slate-700/90 bg-slate-50 dark:bg-[#131E32] text-xs font-medium text-slate-700 dark:text-slate-200 hover:border-teal-500/70 hover:text-teal-700 dark:hover:text-teal-300 transition-colors whitespace-nowrap shrink-0"
                      title="Open a .nexora or .pcanvas design file from your computer"
                    >
                      <FolderOpen className="w-3.5 h-3.5" />
                      <span>Open .nexora</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setNewModalTab('blank');
                        setNewModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-teal-700 hover:bg-teal-600 text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0 shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>New Creation</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSection('templates')}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300/85 dark:border-slate-700/90 bg-slate-50 dark:bg-[#131E32] text-xs font-medium text-slate-700 dark:text-slate-200 hover:border-teal-500/70 hover:text-teal-700 dark:hover:text-teal-300 transition-colors whitespace-nowrap shrink-0"
                    >
                      <span>Templates</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Subtle architectural connector bracket mirroring the Nexora brand system */}
                <div className="hidden sm:block relative h-5 -mb-2" aria-hidden="true">
                  <div className="absolute left-1/2 top-0 w-px h-2.5 bg-slate-300 dark:bg-slate-700" />
                  <div className="absolute left-[12.5%] right-[12.5%] top-2.5 h-px bg-slate-300 dark:bg-slate-700" />
                  <div className="absolute left-[12.5%] top-2.5 w-px h-2.5 bg-slate-300 dark:bg-slate-700" />
                  <div className="absolute left-[37.5%] top-2.5 w-px h-2.5 bg-slate-300 dark:bg-slate-700" />
                  <div className="absolute left-[62.5%] top-2.5 w-px h-2.5 bg-slate-300 dark:bg-slate-700" />
                  <div className="absolute left-[87.5%] top-2.5 w-px h-2.5 bg-slate-300 dark:bg-slate-700" />
                </div>

                {/* 4 Nexora Module Suite Cards: Flow, Space, Sequence, Architect */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {NEXORA_MODULES.map((mod) => {
                    const isSelected = activeModule === mod.id;
                    const count = DIAGRAM_TYPES.filter((dt) => dt.module === mod.id).length;
                    return (
                      <button
                        key={mod.id}
                        type="button"
                        onClick={() =>
                          setActiveModule((cur) => (cur === mod.id ? 'all' : mod.id))
                        }
                        className={`group flex flex-col items-center text-center p-5 rounded-xl border transition-all ${
                          isSelected
                            ? 'bg-teal-50/90 dark:bg-teal-950/45 border-teal-600 dark:border-teal-400/80 ring-1 ring-teal-500/25 shadow-xs'
                            : 'bg-slate-100/75 dark:bg-[#121C2E] border-slate-300/75 dark:border-slate-800 hover:border-teal-500/60 dark:hover:border-teal-400/60 hover:bg-white dark:hover:bg-[#162339]'
                        }`}
                      >
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-colors ${
                            isSelected
                              ? 'bg-teal-700 text-white'
                              : 'bg-white dark:bg-[#0A101D] border border-slate-300/80 dark:border-slate-700/80 text-slate-700 dark:text-teal-300 group-hover:text-teal-700 dark:group-hover:text-teal-300 shadow-2xs'
                          }`}
                        >
                          <NexoraModuleIcon module={mod.id} className="w-5 h-5" />
                        </div>
                        <div className="font-display text-sm font-bold text-slate-900 dark:text-white">
                          {mod.name}
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                          {mod.subtitle}
                        </div>
                        <div className="mt-2.5 text-[11px] font-medium text-teal-700 dark:text-teal-400">
                          {count} {count === 1 ? 'studio' : 'studios'}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Studio Filter Header & Creation Cards */}
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                      {activeModule === 'all'
                        ? 'All Nexora Studios'
                        : `Nexora ${NEXORA_MODULE_MAP[activeModule].name} Studios`}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {activeModule === 'all'
                        ? 'Select any module above to filter, or launch a blank studio below.'
                        : NEXORA_MODULE_MAP[activeModule].description}
                    </p>
                  </div>
                  {activeModule !== 'all' && (
                    <button
                      type="button"
                      onClick={() => setActiveModule('all')}
                      className="text-xs font-medium text-teal-700 dark:text-teal-400 hover:underline"
                    >
                      Show all 9 studios
                    </button>
                  )}
                </div>

                {/* Visually Distinct Creation Cards (crisp light-mode elevation & luminous dark-mode preview wells) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {visibleStudios.map((item) => {
                    const mod = NEXORA_MODULE_MAP[item.module];
                    return (
                      <button
                        key={item.type}
                        type="button"
                        onClick={() => onCreateBlank(item.type)}
                        className="group flex flex-col text-left rounded-xl bg-white dark:bg-[#0D1422] border border-slate-300/80 dark:border-slate-800/90 hover:border-teal-500/80 dark:hover:border-teal-400/70 shadow-[0_2px_6px_rgba(15,23,42,0.055)] hover:shadow-[0_6px_18px_rgba(15,23,42,0.09)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.3)] transition-all overflow-hidden focus-visible:outline-2 focus-visible:outline-teal-600"
                      >
                        <div className="w-full px-5 pt-4 pb-2.5 nx-preview-stage border-b border-slate-200/90 dark:border-slate-800/90">
                          <DiagramTypeIllustration
                            type={item.type}
                            className="w-full h-22 transition-transform duration-200 group-hover:scale-[1.03]"
                          />
                        </div>
                        <div className="p-4 space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-teal-700 dark:group-hover:text-teal-300 transition-colors truncate">
                              {item.name}
                            </span>
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 shrink-0">
                              <NexoraModuleIcon module={mod.id} className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                              <span>{mod.name}</span>
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2">
                            {item.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* Always-Visible IndexedDB & Desktop Download Reminder */}
            <section className="rounded-xl bg-white dark:bg-[#0A1824] border border-teal-600/30 dark:border-teal-800/70 px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[0_1px_4px_rgba(15,23,42,0.05)]">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-teal-600/12 dark:bg-teal-400/15 text-teal-700 dark:text-teal-300 shrink-0 mt-0.5">
                  <Database className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <div className="text-xs font-semibold text-teal-950 dark:text-teal-100">
                    Auto-saved in Browser IndexedDB — Always Remember to Download Your Creations
                  </div>
                  <p className="text-xs text-slate-600 dark:text-teal-200/80 leading-relaxed">
                    Every edit is automatically stored locally in IndexedDB so you can work offline anytime. Click <strong>Download .nexora</strong> on any project to keep a permanent copy on your local drive.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleOpenPCanvasPicker}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-teal-600/40 dark:border-teal-500/50 bg-teal-50/70 dark:bg-[#0D1A28] text-xs font-semibold text-teal-800 dark:text-teal-200 hover:bg-teal-100/80 dark:hover:bg-teal-900/50 whitespace-nowrap shrink-0 transition-colors"
              >
                <FolderOpen className="w-3.5 h-3.5" />
                <span>Open Saved .nexora</span>
              </button>
            </section>

            {/* Section 2: Collapsible Recent Creations Panel */}
            <section className="rounded-2xl bg-white dark:bg-[#0D1422] border border-slate-300/80 dark:border-slate-800/90 shadow-[0_2px_8px_rgba(15,23,42,0.06)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] overflow-hidden">
              <button
                type="button"
                onClick={() => setRecentExpanded((open) => !open)}
                aria-expanded={recentExpanded}
                className="w-full px-5 py-4 flex items-center justify-between gap-4 text-left hover:bg-slate-50/90 dark:hover:bg-[#121C2E] transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-[#141F32] border border-slate-200/90 dark:border-slate-700/80 flex items-center justify-center text-slate-600 dark:text-teal-300 shrink-0">
                    {recentExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </span>
                  <div className="min-w-0">
                    <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white leading-tight">
                      Recent Creations
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums truncate">
                      {profile.workspaceName} · {diagrams.length}{' '}
                      {diagrams.length === 1 ? 'creation' : 'creations'} stored in IndexedDB
                    </p>
                  </div>
                </div>

                <span className="text-xs font-medium text-teal-700 dark:text-teal-300 shrink-0">
                  {recentExpanded ? 'Collapse' : 'Expand'}
                </span>
              </button>

              {recentExpanded && (
                <div className="border-t border-slate-200/80 dark:border-slate-800/80 p-5 space-y-4 bg-slate-50/50 dark:bg-[#0A101C]">
                  <div className="flex flex-wrap items-center justify-between gap-2.5">
                    <div className="flex flex-wrap items-center gap-2.5">
                      {/* Search input */}
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search creations..."
                          className="pl-8 pr-3 py-1.5 text-xs rounded-lg bg-white dark:bg-[#0D1422] border border-slate-300/80 dark:border-slate-800 text-slate-900 dark:text-slate-100 w-52 focus:outline-none focus:border-teal-500"
                        />
                      </div>

                      {/* Folder Filter Segmented Buttons */}
                      <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-200/70 dark:bg-[#0D1422] border border-slate-300/70 dark:border-slate-800">
                        {folders.map((folder) => (
                          <button
                            key={folder}
                            type="button"
                            onClick={() => setFolderFilter(folder)}
                            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                              folderFilter === folder
                                ? 'bg-white dark:bg-[#17243A] text-teal-800 dark:text-teal-300 shadow-xs'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                            }`}
                          >
                            {folder}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Import File Action */}
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300/80 dark:border-slate-800 bg-white dark:bg-[#0D1422] text-xs font-medium text-slate-700 dark:text-slate-200 hover:border-teal-500 cursor-pointer whitespace-nowrap shrink-0 transition-colors">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Import .nexora / Mermaid</span>
                      <input
                        type="file"
                        accept=".nexora,.pcanvas,.json,.mmd,.txt"
                        onChange={handleImportFile}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {statusNotice && (
                    <div className="p-3 rounded-lg bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-900 text-xs text-teal-800 dark:text-teal-300">
                      {statusNotice}
                    </div>
                  )}

                  {importError && (
                    <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300">
                      {importError}
                    </div>
                  )}

                  {filteredDiagrams.length === 0 ? (
                    <div className="py-10 text-center rounded-xl bg-white dark:bg-[#0D1422] border border-dashed border-slate-300 dark:border-slate-800 space-y-2">
                      <FolderOpen className="w-6 h-6 text-slate-400 mx-auto" />
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        No matching diagrams found
                      </p>
                      <p className="text-xs text-slate-500">
                        Create a new diagram above or start from the Template Library.
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-xl bg-white dark:bg-[#0D1422] border border-slate-300/75 dark:border-slate-800/90 divide-y divide-slate-200/75 dark:divide-slate-800/80 overflow-hidden">
                      {filteredDiagrams.map((d) => {
                        const meta = DIAGRAM_TYPE_MAP[d.type];
                        const mod = NEXORA_MODULE_MAP[meta.module];
                        const itemCount =
                          d.type === 'sequence'
                            ? `${d.sequence?.participants.length ?? 0} participants · ${d.sequence?.messages.length ?? 0} calls`
                            : d.type === 'floorplan'
                            ? `${d.floorplan?.rooms.length ?? 0} rooms · ${d.floorplan?.walls.length ?? 0} walls`
                            : `${d.objects.length} elements`;

                        return (
                          <div
                            key={d.id}
                            className="group flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-[#131E32] transition-colors"
                          >
                            <button
                              type="button"
                              onClick={() => onOpenDiagram(d)}
                              className="flex items-center gap-4 min-w-0 flex-1 text-left"
                            >
                              <div className="w-16 h-11 rounded-md nx-preview-stage border border-slate-300/75 dark:border-slate-700/80 p-1 shrink-0">
                                <DiagramTypeIllustration type={d.type} className="w-full h-full" />
                              </div>
                              <div className="min-w-0">
                                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-teal-700 dark:group-hover:text-teal-300 truncate transition-colors">
                                  {d.title}
                                </div>
                                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
                                  <span className="inline-flex items-center gap-1 font-medium text-teal-700 dark:text-teal-400">
                                    <NexoraModuleIcon module={mod.id} className="w-3 h-3" />
                                    <span>{mod.name}</span>
                                  </span>
                                  <span aria-hidden="true">·</span>
                                  <span>{meta.shortName}</span>
                                  <span aria-hidden="true">·</span>
                                  <span>{itemCount}</span>
                                  <span aria-hidden="true">·</span>
                                  <span>Updated {formatRelativeDate(d.updatedAt)}</span>
                                </div>
                              </div>
                            </button>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleSaveRowToDesktop(d)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-teal-600/35 dark:border-teal-500/45 bg-teal-50/75 dark:bg-teal-950/45 text-teal-800 dark:text-teal-200 hover:bg-teal-100 dark:hover:bg-teal-900/60 text-xs font-medium transition-colors whitespace-nowrap"
                                title="Download .nexora backup to your desktop"
                              >
                                <HardDriveDownload className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Download .nexora</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => onToggleStarDiagram(d.id)}
                                className={`p-1.5 rounded-md transition-colors ${
                                  d.starred
                                    ? 'text-amber-500'
                                    : 'text-slate-400 opacity-0 group-hover:opacity-100 hover:text-amber-500'
                                }`}
                                title={d.starred ? 'Unstar' : 'Star diagram'}
                              >
                                <Star className="w-4 h-4" fill={d.starred ? 'currentColor' : 'none'} />
                              </button>
                              <button
                                type="button"
                                onClick={() => onDuplicateDiagram(d)}
                                className="p-1.5 rounded-md text-slate-400 opacity-0 group-hover:opacity-100 hover:text-slate-800 dark:hover:text-slate-100"
                                title="Duplicate diagram"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeleteDiagram(d.id)}
                                className="p-1.5 rounded-md text-slate-400 opacity-0 group-hover:opacity-100 hover:text-red-600"
                                title="Delete diagram"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </section>
          </>
        )}

        {/* Template Library View */}
        {section === 'templates' && (
          <section className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="space-y-1">
                <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Template Library
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Presentation-ready starter architectures, call flows, workflows, and measured floor plans.
                </p>
              </div>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search templates..."
                  className="pl-8 pr-3 py-2 text-xs rounded-lg bg-white dark:bg-[#0C121E] border border-slate-200 dark:border-slate-800 w-64 focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            {/* Nexora Module Filter Bar */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex flex-wrap items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-[#0C121E] border border-slate-200/80 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setTemplateModuleFilter('all');
                    setTemplateFilter('all');
                  }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                    templateModuleFilter === 'all' && templateFilter === 'all'
                      ? 'bg-white dark:bg-[#141F32] text-teal-800 dark:text-teal-300 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  All Modules
                </button>
                {NEXORA_MODULES.map((mod) => (
                  <button
                    key={mod.id}
                    type="button"
                    onClick={() => {
                      setTemplateModuleFilter(mod.id);
                      setTemplateFilter('all');
                    }}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                      templateModuleFilter === mod.id
                        ? 'bg-white dark:bg-[#141F32] text-teal-800 dark:text-teal-300 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <NexoraModuleIcon module={mod.id} className="w-3.5 h-3.5" />
                    <span>{mod.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredTemplates.map((tpl) => {
                const tplType = DIAGRAM_TYPE_MAP[tpl.category];
                const tplMod = NEXORA_MODULE_MAP[tplType.module];
                return (
                  <div
                    key={tpl.id}
                    className="flex flex-col rounded-xl bg-white dark:bg-[#0D1422] border border-slate-300/80 dark:border-slate-800/90 shadow-[0_2px_6px_rgba(15,23,42,0.055)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.3)] overflow-hidden"
                  >
                    <div className="px-6 py-5 nx-preview-stage border-b border-slate-200/90 dark:border-slate-800/90">
                      <DiagramTypeIllustration type={tpl.category} className="w-full h-24" />
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                          <NexoraModuleIcon module={tplMod.id} className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400" />
                          <span className="font-medium text-teal-700 dark:text-teal-400">{tplMod.name}</span>
                          <span>·</span>
                          <span>{tplType.name}</span>
                          {tpl.isCustom ? ' · Custom' : tpl.popular ? ' · Featured' : ''}
                        </div>
                        <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {tpl.name}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                          {tpl.description}
                        </p>
                      </div>
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <button
                          type="button"
                          onClick={() => onUseTemplate(tpl.createDocument())}
                          className="px-3.5 py-1.5 rounded-lg bg-teal-700 text-white text-xs font-medium hover:bg-teal-800 transition-colors"
                        >
                          Use Template
                        </button>
                        {tpl.isCustom && (
                          <button
                            type="button"
                            onClick={() => onDeleteCustomTemplate(tpl.id)}
                            className="p-1.5 rounded-md text-slate-400 hover:text-red-600"
                            title="Delete custom template"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Component Library View */}
        {section === 'components' && (
          <section className="space-y-6">
            <div className="space-y-1">
              <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Reusable Component Library
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Select any element inside an editor and click "Save as Component" on the floating toolbar to store reusable symbols here.
              </p>
            </div>

            {customComponents.length === 0 ? (
              <div className="py-14 px-6 text-center rounded-xl bg-white dark:bg-[#0D1422] border border-slate-300/80 dark:border-slate-800/90 shadow-[0_2px_6px_rgba(15,23,42,0.05)] space-y-3">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  No custom components saved yet
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  Built-in libraries for Flowcharts, Cloud Architecture, Sequence Participants, Floor Plan Furniture, Networks, and ERDs are always available in the editor sidebar.
                </p>
                <button
                  type="button"
                  onClick={() => onCreateBlank('architecture')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-teal-700 text-white text-xs font-medium hover:bg-teal-600 transition-colors"
                >
                  Open Nexora Architect
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {customComponents.map((comp) => (
                  <div
                    key={comp.id}
                    className="p-4 rounded-xl bg-white dark:bg-[#0D1422] border border-slate-300/80 dark:border-slate-800/90 shadow-[0_2px_6px_rgba(15,23,42,0.05)] flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {comp.name}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {DIAGRAM_TYPE_MAP[comp.diagramType].name} · {comp.objectTemplate.type}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onDeleteCustomComponent(comp.id)}
                      className="p-1.5 rounded-md text-slate-400 hover:text-red-600"
                      title="Delete component"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      <NewDesignModal
        open={newModalOpen}
        initialTab={newModalTab}
        onClose={() => setNewModalOpen(false)}
        customTemplates={customTemplates}
        onCreateBlank={onCreateBlank}
        onUseTemplate={onUseTemplate}
        onDeleteCustomTemplate={onDeleteCustomTemplate}
      />
    </div>
  );
};
