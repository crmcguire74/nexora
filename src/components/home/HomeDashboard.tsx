import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  Copy,
  FolderOpen,
  Moon,
  Plus,
  Save,
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
  LocalUserRole,
} from '../../types/diagram';
import { DIAGRAM_TYPE_MAP, DIAGRAM_TYPES } from '../../engine/libraries';
import { BUILTIN_TEMPLATES } from '../../engine/templates';
import { DiagramTypeIllustration } from '../icons/ShapeIcons';
import { importFromMermaid, importFromNativeJson } from '../../engine/exportImport';
import {
  DesktopFileHandle,
  openDesignFromDesktop,
  readDroppedPCanvasFile,
  saveDesignToDesktop,
} from '../../engine/pcanvasFile';

type HomeSection = 'home' | 'templates' | 'components' | 'workspace';

interface HomeDashboardProps {
  diagrams: DiagramDocument[];
  customTemplates: DiagramDocument[];
  customComponents: CustomComponent[];
  darkMode: boolean;
  onToggleDarkMode: () => void;
  profile: LocalProfile;
  onUpdateProfile: (next: LocalProfile) => void;
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
  onUpdateProfile,
  onOpenDiagram,
  onOpenDesktopFile,
  onCreateBlank,
  onUseTemplate,
  onDuplicateDiagram,
  onDeleteDiagram,
  onToggleStarDiagram,
  onDeleteCustomComponent,
  onDeleteCustomTemplate,
}) => {
  const [section, setSection] = useState<HomeSection>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [folderFilter, setFolderFilter] = useState<string>('All');
  const [templateFilter, setTemplateFilter] = useState<DiagramType | 'all'>('all');
  const [importError, setImportError] = useState<string | null>(null);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [fileDropActive, setFileDropActive] = useState(false);

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
      if (templateFilter !== 'all' && t.category !== templateFilter) return false;
      if (!q) return true;
      return (
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
      );
    });
  }, [allTemplates, templateFilter, searchQuery]);

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
        err instanceof Error ? err.message : 'Unable to open .pcanvas design file.'
      );
    }
  };

  const handleSaveRowToDesktop = async (doc: DiagramDocument) => {
    setImportError(null);
    try {
      const result = await saveDesignToDesktop(doc, { saveAs: true });
      if (result.saved) {
        showNotice(`Saved ${result.fileName}`);
      }
    } catch (err) {
      setImportError(
        err instanceof Error ? err.message : 'Unable to save design file.'
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
      if (lower.endsWith('.pcanvas') || lower.endsWith('.json')) {
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
        if (file.name.toLowerCase().endsWith('.pcanvas')) {
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
      className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col relative"
      onDragOver={handleDragOverRoot}
      onDragLeave={handleDragLeaveRoot}
      onDrop={handleDropRoot}
    >
      {fileDropActive && (
        <div className="fixed inset-0 z-50 bg-blue-600/15 dark:bg-blue-500/20 backdrop-blur-[2px] flex items-center justify-center p-6 pointer-events-none">
          <div className="px-8 py-6 rounded-2xl bg-white dark:bg-slate-900 border-2 border-dashed border-blue-500 shadow-2xl text-center space-y-2">
            <FolderOpen className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto" />
            <div className="font-display text-base font-semibold text-slate-900 dark:text-white">
              Drop .pcanvas file to view &amp; edit
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Supports Project Canvas (.pcanvas), JSON, and Mermaid files
            </p>
          </div>
        </div>
      )}
      {/* Clean 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-30 h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto h-full px-6 flex items-center justify-between gap-8">
          {/* Zone 1: Single-line Brand Wordmark */}
          <button
            type="button"
            onClick={() => setSection('home')}
            className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0"
          >
            Project Canvas
          </button>

          {/* Zone 2: 4 Clean Text Nav Links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
            {(
              [
                ['home', 'Home'],
                ['templates', 'Templates'],
                ['components', 'Components'],
                ['workspace', 'Workspace'],
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
                    ? 'text-slate-900 dark:text-white border-blue-600'
                    : 'text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                {label}
              </button>
            ))}
          </nav>

          {/* Zone 3: 1 Primary Action */}
          <div className="shrink-0">
            <button
              type="button"
              onClick={() => onCreateBlank('flowchart')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Diagram</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Nav Strip */}
      <div className="md:hidden flex items-center gap-4 px-6 py-2.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 overflow-x-auto text-xs font-medium">
        {(
          [
            ['home', 'Home'],
            ['templates', 'Templates'],
            ['components', 'Components'],
            ['workspace', 'Workspace'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setSection(key)}
            className={`whitespace-nowrap shrink-0 pb-0.5 ${
              section === key ? 'text-blue-600 font-semibold' : 'text-slate-500'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-10 space-y-12">
        {section === 'home' && (
          <>
            {/* Section 1: First-Launch Welcome — "What would you like to create?" */}
            <section className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div className="space-y-1.5 max-w-2xl">
                  <h1
                    className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white"
                    style={{ textWrap: 'balance' }}
                  >
                    What would you like to create?
                  </h1>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Start with a specialized visual studio built on one fluid canvas engine. Everything saves locally in your browser automatically.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleOpenPCanvasPicker}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-300 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors whitespace-nowrap shrink-0"
                    title="Open a .pcanvas design file from your computer"
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                    <span>Open .pcanvas</span>
                  </button>
                  <button
                    type="button"
                    onClick={onToggleDarkMode}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
                  >
                    {darkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                    <span>{darkMode ? 'Light Theme' : 'Dark Theme'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSection('templates')}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-300 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors whitespace-nowrap shrink-0"
                  >
                    <span>Browse Templates</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Visually Distinct Creation Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {DIAGRAM_TYPES.map((item) => (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => onCreateBlank(item.type)}
                    className="group flex flex-col text-left rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500/70 dark:hover:border-blue-500/70 transition-colors overflow-hidden focus-visible:outline-2 focus-visible:outline-blue-600"
                  >
                    <div className="w-full px-5 pt-4 pb-2 bg-slate-50/70 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800/80">
                      <DiagramTypeIllustration
                        type={item.type}
                        className="w-full h-22 transition-transform duration-200 group-hover:scale-[1.03]"
                      />
                    </div>
                    <div className="p-4 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {item.name}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                        {item.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {/* Section 2: Recent Diagrams */}
            <section className="space-y-5 pt-4 border-t border-slate-200/80 dark:border-slate-800">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
                    Recent Diagrams
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
                    {profile.workspaceName} · {diagrams.length} saved locally
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Search input */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search diagrams..."
                      className="pl-8 pr-3 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 w-52 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Folder Filter Segmented Buttons */}
                  <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                    {folders.map((folder) => (
                      <button
                        key={folder}
                        type="button"
                        onClick={() => setFolderFilter(folder)}
                        className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                          folderFilter === folder
                            ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                      >
                        {folder}
                      </button>
                    ))}
                  </div>

                  {/* Import File Action */}
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-300 hover:border-blue-500 cursor-pointer whitespace-nowrap shrink-0">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Import .pcanvas / Mermaid</span>
                    <input
                      type="file"
                      accept=".pcanvas,.json,.mmd,.txt"
                      onChange={handleImportFile}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {statusNotice && (
                <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-700 dark:text-emerald-300">
                  {statusNotice}
                </div>
              )}

              {importError && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300">
                  {importError}
                </div>
              )}

              {filteredDiagrams.length === 0 ? (
                <div className="py-12 text-center rounded-xl border border-dashed border-slate-300 dark:border-slate-800 space-y-2">
                  <FolderOpen className="w-6 h-6 text-slate-400 mx-auto" />
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    No matching diagrams found
                  </p>
                  <p className="text-xs text-slate-500">
                    Create a new diagram above or start from the Template Library.
                  </p>
                </div>
              ) : (
                <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredDiagrams.map((d) => {
                    const meta = DIAGRAM_TYPE_MAP[d.type];
                    const itemCount =
                      d.type === 'sequence'
                        ? `${d.sequence?.participants.length ?? 0} participants · ${d.sequence?.messages.length ?? 0} calls`
                        : d.type === 'floorplan'
                        ? `${d.floorplan?.rooms.length ?? 0} rooms · ${d.floorplan?.walls.length ?? 0} walls`
                        : `${d.objects.length} elements`;

                    return (
                      <div
                        key={d.id}
                        className="group flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <button
                          type="button"
                          onClick={() => onOpenDiagram(d)}
                          className="flex items-center gap-4 min-w-0 flex-1 text-left"
                        >
                          <div className="w-16 h-11 rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 p-1 shrink-0">
                            <DiagramTypeIllustration type={d.type} className="w-full h-full" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate transition-colors">
                              {d.title}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
                              <span>{meta.shortName}</span>
                              <span aria-hidden="true">·</span>
                              <span>{d.folder}</span>
                              <span aria-hidden="true">·</span>
                              <span>{itemCount}</span>
                              <span aria-hidden="true">·</span>
                              <span>Updated {formatRelativeDate(d.updatedAt)}</span>
                            </div>
                          </div>
                        </button>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleSaveRowToDesktop(d)}
                            className="p-1.5 rounded-md text-slate-400 opacity-0 group-hover:opacity-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            title="Save as .pcanvas file to desktop"
                          >
                            <Save className="w-4 h-4" />
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
                  className="pl-8 pr-3 py-2 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-64 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Category Filter Bar */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 w-fit">
              <button
                type="button"
                onClick={() => setTemplateFilter('all')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  templateFilter === 'all'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                All Templates
              </button>
              {DIAGRAM_TYPES.map((dt) => (
                <button
                  key={dt.type}
                  type="button"
                  onClick={() => setTemplateFilter(dt.type)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                    templateFilter === dt.type
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {dt.shortName}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredTemplates.map((tpl) => (
                <div
                  key={tpl.id}
                  className="flex flex-col rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden"
                >
                  <div className="px-6 py-5 bg-slate-50/70 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800">
                    <DiagramTypeIllustration type={tpl.category} className="w-full h-24" />
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between gap-4">
                    <div className="space-y-1">
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {DIAGRAM_TYPE_MAP[tpl.category].name}
                        {tpl.isCustom ? ' · Custom Template' : tpl.popular ? ' · Featured' : ''}
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
                        className="px-3.5 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors"
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
              ))}
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
              <div className="py-14 px-6 text-center rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  No custom components saved yet
                </p>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Built-in libraries for Flowcharts, Cloud Architecture, Sequence Participants, Floor Plan Furniture, Networks, and ERDs are always available in the editor sidebar.
                </p>
                <button
                  type="button"
                  onClick={() => onCreateBlank('architecture')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700"
                >
                  Open Architecture Editor
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {customComponents.map((comp) => (
                  <div
                    key={comp.id}
                    className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {comp.name}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
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

        {/* Workspace Management View (PRD 3.1, 16, 19.1) */}
        {section === 'workspace' && (
          <section className="max-w-3xl space-y-8">
            <div className="space-y-1">
              <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Workspace & Local Studio Settings
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Local-first IndexedDB persistence and development role simulation.
              </p>
            </div>

            <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-5">
              <div className="space-y-1">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Local Development Identity
                </h2>
                <p className="text-xs text-slate-500">
                  Switch roles to verify read-only Viewer mode versus full Owner/Editor workflows without configuring external cloud auth.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    Workspace Name
                  </span>
                  <input
                    type="text"
                    value={profile.workspaceName}
                    onChange={(e) =>
                      onUpdateProfile({ ...profile, workspaceName: e.target.value })
                    }
                    className="mt-1 w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    Active Permission Role
                  </span>
                  <select
                    value={profile.role}
                    onChange={(e) =>
                      onUpdateProfile({ ...profile, role: e.target.value as LocalUserRole })
                    }
                    className="mt-1 w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  >
                    <option value="owner">Diagram Owner (Full Control)</option>
                    <option value="editor">Editor (Can Modify)</option>
                    <option value="viewer">Viewer (Read-Only Canvas)</option>
                  </select>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    Interface Appearance
                  </div>
                  <div className="text-xs text-slate-500">
                    Switch between Light Studio and Dark Slate workspace themes.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onToggleDarkMode}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  {darkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                  <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
                </button>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 tabular-nums">
                <span>Persistence Engine</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">
                  IndexedDB · {diagrams.length} documents · Schema v1
                </span>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};
