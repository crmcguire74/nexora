import React, { useEffect, useMemo, useState } from 'react';
import {
  Bookmark,
  Eraser,
  FilePlus2,
  HardDriveDownload,
  LayoutTemplate,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { DiagramDocument, DiagramType } from '../../types/diagram';
import {
  DIAGRAM_TYPE_MAP,
  DIAGRAM_TYPES,
  NEXORA_MODULE_MAP,
  NEXORA_MODULES,
  NexoraModuleId,
} from '../../engine/libraries';
import { BUILTIN_TEMPLATES, makeId } from '../../engine/templates';
import { DiagramTypeIllustration, NexoraModuleIcon } from '../icons/ShapeIcons';

interface NewDesignModalProps {
  open: boolean;
  initialTab?: 'blank' | 'templates';
  onClose: () => void;
  customTemplates: DiagramDocument[];
  onCreateBlank: (type: DiagramType) => void;
  onUseTemplate: (doc: DiagramDocument) => void;
  onDeleteCustomTemplate: (id: string) => void;
  // Optional editor-only clear current canvas helpers
  activeDocTitle?: string;
  activeDocTypeName?: string;
  hasUndownloadedChanges?: boolean;
  onClearCurrentCanvas?: () => void;
  onDownloadBackup?: () => void;
}

export const NewDesignModal: React.FC<NewDesignModalProps> = ({
  open,
  initialTab = 'blank',
  onClose,
  customTemplates,
  onCreateBlank,
  onUseTemplate,
  onDeleteCustomTemplate,
  activeDocTitle,
  activeDocTypeName,
  hasUndownloadedChanges = false,
  onClearCurrentCanvas,
  onDownloadBackup,
}) => {
  const [tab, setTab] = useState<'blank' | 'templates'>(initialTab);
  const [moduleFilter, setModuleFilter] = useState<NexoraModuleId | 'all'>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (open) {
      setTab(initialTab);
      setModuleFilter('all');
      setSearch('');
    }
  }, [open, initialTab]);

  const filteredCustomTemplates = useMemo(() => {
    const q = search.trim().toLowerCase();
    return customTemplates.filter((ct) => {
      if (moduleFilter !== 'all' && DIAGRAM_TYPE_MAP[ct.type].module !== moduleFilter) return false;
      if (!q) return true;
      return (
        ct.title.toLowerCase().includes(q) ||
        DIAGRAM_TYPE_MAP[ct.type].name.toLowerCase().includes(q)
      );
    });
  }, [customTemplates, moduleFilter, search]);

  const filteredBuiltinTemplates = useMemo(() => {
    const q = search.trim().toLowerCase();
    return BUILTIN_TEMPLATES.filter((t) => {
      if (moduleFilter !== 'all' && DIAGRAM_TYPE_MAP[t.category].module !== moduleFilter) {
        return false;
      }
      if (!q) return true;
      return (
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
      );
    });
  }, [moduleFilter, search]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-4"
      onMouseDown={onClose}
    >
      <div
        className="w-full max-w-3xl rounded-2xl bg-white dark:bg-[#0D1422] border border-slate-200 dark:border-slate-800/90 shadow-2xl overflow-hidden nx-menu-enter"
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Start New File or Use Template"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800/80">
          <div className="flex items-center gap-4">
            <div>
              <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
                {tab === 'blank' ? 'Start a New Design' : 'New Design from Template'}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {tab === 'blank'
                  ? 'Launch a clean canvas in any Nexora studio module.'
                  : 'Start from your saved custom templates or curated studio blueprints.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-[#070B12] border border-slate-200/70 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setTab('blank')}
                className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  tab === 'blank'
                    ? 'bg-white dark:bg-[#141F32] text-teal-800 dark:text-teal-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <FilePlus2 className="w-3.5 h-3.5" />
                <span>Blank Studios</span>
              </button>
              <button
                type="button"
                onClick={() => setTab('templates')}
                className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  tab === 'templates'
                    ? 'bg-white dark:bg-[#141F32] text-teal-800 dark:text-teal-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <LayoutTemplate className="w-3.5 h-3.5" />
                <span>Templates ({customTemplates.length + BUILTIN_TEMPLATES.length})</span>
              </button>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5 max-h-[76vh] overflow-y-auto">
          {/* Optional Backup Reminder when switching inside Editor */}
          {hasUndownloadedChanges && onDownloadBackup && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-teal-50/80 dark:bg-teal-950/35 border border-teal-200/80 dark:border-teal-800/70">
              <div className="space-y-0.5">
                <div className="text-xs font-semibold text-teal-950 dark:text-teal-100">
                  Download a .nexora backup of &quot;{activeDocTitle}&quot; first?
                </div>
                <div className="text-[11px] text-teal-800/80 dark:text-teal-300/80">
                  Your work is auto-saved in IndexedDB, and downloading keeps a permanent local file copy.
                </div>
              </div>
              <button
                type="button"
                onClick={onDownloadBackup}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-700 text-white text-xs font-medium hover:bg-teal-600 transition-colors whitespace-nowrap shrink-0"
              >
                <HardDriveDownload className="w-3.5 h-3.5" />
                <span>Download .nexora</span>
              </button>
            </div>
          )}

          {tab === 'blank' ? (
            <>
              {/* Clear Current Canvas option when in Editor */}
              {onClearCurrentCanvas && activeDocTitle && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-50 dark:bg-[#080D16] border border-slate-200/80 dark:border-slate-800">
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                      Clear Current {activeDocTypeName ?? 'Canvas'}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Wipes all elements on &quot;{activeDocTitle}&quot; while keeping your settings (undoable with Cmd+Z).
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClearCurrentCanvas();
                      onClose();
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-red-200 dark:border-red-900/60 bg-white dark:bg-[#121B2B] text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors whitespace-nowrap shrink-0"
                  >
                    <Eraser className="w-3.5 h-3.5" />
                    <span>Clear Canvas</span>
                  </button>
                </div>
              )}

              {/* Blank Studios organized by Nexora's 4 Modules */}
              <div className="space-y-4">
                {NEXORA_MODULES.map((mod) => {
                  const modTypes = DIAGRAM_TYPES.filter((dt) => dt.module === mod.id);
                  return (
                    <div key={mod.id} className="space-y-2">
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
                        <NexoraModuleIcon module={mod.id} className="w-4 h-4 text-teal-700 dark:text-teal-400" />
                        <span>{mod.name}</span>
                        <span className="text-[11px] font-normal text-slate-400">
                          — {mod.subtitle}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        {modTypes.map((dt) => (
                          <button
                            key={dt.type}
                            type="button"
                            onClick={() => {
                              onClose();
                              onCreateBlank(dt.type);
                            }}
                            className="group flex flex-col text-left rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111928] hover:border-teal-500 dark:hover:border-teal-400 transition-colors overflow-hidden"
                          >
                            <div className="px-3 pt-2.5 pb-1.5 nx-preview-stage border-b border-slate-200/80 dark:border-slate-800/90">
                              <DiagramTypeIllustration type={dt.type} className="w-full h-14 transition-transform duration-150 group-hover:scale-[1.03]" />
                            </div>
                            <div className="p-2.5">
                              <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 group-hover:text-teal-700 dark:group-hover:text-teal-400 transition-colors">
                                {dt.name}
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                                {dt.shortName} studio
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            /* Templates Tab: My Saved Templates + Built-in Blueprints */
            <div className="space-y-5">
              {/* Filter & Search bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-[#070B12] border border-slate-200/70 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setModuleFilter('all')}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                      moduleFilter === 'all'
                        ? 'bg-white dark:bg-[#141F32] text-teal-800 dark:text-teal-300 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    All
                  </button>
                  {NEXORA_MODULES.map((mod) => (
                    <button
                      key={mod.id}
                      type="button"
                      onClick={() => setModuleFilter(mod.id)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                        moduleFilter === mod.id
                          ? 'bg-white dark:bg-[#141F32] text-teal-800 dark:text-teal-300 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <NexoraModuleIcon module={mod.id} className="w-3 h-3" />
                      <span>{mod.name}</span>
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search templates..."
                    className="w-full sm:w-52 pl-8 pr-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-[#080D16] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              {/* My Saved Custom Templates */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                    <Bookmark className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                    <span>My Saved Templates ({filteredCustomTemplates.length})</span>
                  </div>
                </div>
                {filteredCustomTemplates.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-slate-300/80 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                    {customTemplates.length === 0
                      ? 'No custom templates saved yet. Open any design and choose "Save Design as Template…" in the menu to build your personal template library.'
                      : 'No saved templates match your current filter.'}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filteredCustomTemplates.map((ct) => {
                      const dt = DIAGRAM_TYPE_MAP[ct.type];
                      const mod = NEXORA_MODULE_MAP[dt.module];
                      return (
                        <div
                          key={ct.id}
                          className="group flex flex-col rounded-xl border border-teal-500/35 dark:border-teal-500/30 bg-teal-50/25 dark:bg-[#101B29] overflow-hidden"
                        >
                          <div className="px-4 py-3 nx-preview-stage border-b border-slate-200/80 dark:border-slate-800/90">
                            <DiagramTypeIllustration type={ct.type} className="w-full h-16" />
                          </div>
                          <div className="p-3 flex-1 flex flex-col justify-between gap-2.5">
                            <div>
                              <div className="flex items-center gap-1.5 text-[11px] text-teal-700 dark:text-teal-400 font-medium">
                                <NexoraModuleIcon module={mod.id} className="w-3 h-3" />
                                <span>{mod.name}</span>
                                <span aria-hidden="true">·</span>
                                <span className="text-slate-500 dark:text-slate-400 font-normal">
                                  {dt.shortName}
                                </span>
                              </div>
                              <div className="text-xs font-semibold text-slate-900 dark:text-white mt-0.5 truncate">
                                {ct.title}
                              </div>
                            </div>
                            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/80">
                              <button
                                type="button"
                                onClick={() => {
                                  const cloned: DiagramDocument = {
                                    ...structuredClone(ct),
                                    id: makeId('diag'),
                                    createdAt: new Date().toISOString(),
                                    updatedAt: new Date().toISOString(),
                                  };
                                  onClose();
                                  onUseTemplate(cloned);
                                }}
                                className="px-3 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-600 text-white text-[11px] font-semibold transition-colors"
                              >
                                Use Template
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeleteCustomTemplate(ct.id)}
                                className="p-1.5 rounded-md text-slate-400 hover:text-red-500 transition-colors"
                                title="Delete saved template"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Built-in Studio Blueprints */}
              <div className="space-y-2.5">
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Built-in Studio Templates ({filteredBuiltinTemplates.length})
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredBuiltinTemplates.map((tpl) => {
                    const dt = DIAGRAM_TYPE_MAP[tpl.category];
                    const mod = NEXORA_MODULE_MAP[dt.module];
                    return (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => {
                          onClose();
                          onUseTemplate(tpl.createDocument());
                        }}
                        className="group flex flex-col text-left rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111928] hover:border-teal-500 dark:hover:border-teal-400 transition-colors overflow-hidden"
                      >
                        <div className="px-4 py-3 nx-preview-stage border-b border-slate-200/80 dark:border-slate-800/90">
                          <DiagramTypeIllustration type={tpl.category} className="w-full h-16 transition-transform duration-150 group-hover:scale-[1.03]" />
                        </div>
                        <div className="p-3 space-y-1">
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                            <NexoraModuleIcon module={mod.id} className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                            <span className="font-medium text-teal-700 dark:text-teal-400">{mod.name}</span>
                            <span aria-hidden="true">·</span>
                            <span>{dt.shortName}</span>
                          </div>
                          <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 group-hover:text-teal-700 dark:group-hover:text-teal-400 transition-colors">
                            {tpl.name}
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                            {tpl.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
