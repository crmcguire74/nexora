import React, { useMemo, useRef, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Layers,
  Lock,
  Search,
  Shapes,
  Star,
  Trash2,
  Unlock,
} from 'lucide-react';
import { CustomComponent, DiagramDocument } from '../../types/diagram';
import { getLibraryForType, LibraryItem } from '../../engine/libraries';
import { LibraryItemMiniIcon, SequenceRoleMiniIcon } from '../icons/ShapeIcons';

interface LeftLibraryPanelProps {
  doc: DiagramDocument;
  darkMode: boolean;
  width: number;
  customComponents: CustomComponent[];
  favoriteIds: string[];
  recentIds: string[];
  onToggleFavorite: (id: string) => void;
  onStartDragItem: (item: LibraryItem) => void;
  onEndDragItem?: () => void;
  onClickAddItem: (item: LibraryItem) => void;
  onAddCustomComponent: (comp: CustomComponent) => void;
  onDeleteCustomComponent: (id: string) => void;
  onFocusObject: (id: string) => void;
  onToggleObjectVisible: (id: string) => void;
  onToggleObjectLock: (id: string) => void;
  onSelectSequenceParticipant?: (id: string) => void;
  onSelectSequenceMessage?: (id: string) => void;
  onSelectFloorItem?: (item: { kind: 'room' | 'furniture' | 'wall'; id: string }) => void;
  selectedIds: string[];
}

export const LeftLibraryPanel: React.FC<LeftLibraryPanelProps> = ({
  doc,
  darkMode,
  width,
  customComponents,
  favoriteIds,
  recentIds,
  onToggleFavorite,
  onStartDragItem,
  onEndDragItem,
  onClickAddItem,
  onAddCustomComponent,
  onDeleteCustomComponent,
  onFocusObject,
  onToggleObjectVisible,
  onToggleObjectLock,
  onSelectSequenceParticipant,
  onSelectSequenceMessage,
  onSelectFloorItem,
  selectedIds,
}) => {
  const [tab, setTab] = useState<'library' | 'outline'>('library');
  const [query, setQuery] = useState('');
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const isDraggingRef = useRef(false);
  const lastDragEndRef = useRef(0);

  const items = useMemo(() => getLibraryForType(doc.type), [doc.type]);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (it) =>
        it.label.toLowerCase().includes(q) ||
        it.section.toLowerCase().includes(q) ||
        (it.subtitle && it.subtitle.toLowerCase().includes(q)) ||
        (it.technology && it.technology.toLowerCase().includes(q))
    );
  }, [items, query]);

  const groupedSections = useMemo(() => {
    const map = new Map<string, LibraryItem[]>();
    for (const it of filteredItems) {
      const list = map.get(it.section) ?? [];
      list.push(it);
      map.set(it.section, list);
    }
    return Array.from(map.entries());
  }, [filteredItems]);

  const favoriteItems = useMemo(
    () => items.filter((it) => favoriteIds.includes(it.id)),
    [items, favoriteIds]
  );

  const recentItems = useMemo(
    () => recentIds.map((id) => items.find((i) => i.id === id)).filter(Boolean) as LibraryItem[],
    [items, recentIds]
  );

  const matchingCustom = useMemo(
    () => customComponents.filter((c) => c.diagramType === doc.type),
    [customComponents, doc.type]
  );

  const toggleSection = (sec: string) =>
    setCollapsedSections((prev) => ({ ...prev, [sec]: !prev[sec] }));

  const renderLibraryCard = (item: LibraryItem) => {
    const isFav = favoriteIds.includes(item.id);
    return (
      <div
        key={item.id}
        draggable
        onDragStart={(e) => {
          isDraggingRef.current = true;
          e.dataTransfer.effectAllowed = 'copy';
          e.dataTransfer.setData('text/plain', item.id);
          onStartDragItem(item);
        }}
        onDragEnd={() => {
          isDraggingRef.current = false;
          lastDragEndRef.current = Date.now();
          onEndDragItem?.();
        }}
        onClick={(e) => {
          if (isDraggingRef.current || Date.now() - lastDragEndRef.current < 250) return;
          (e.currentTarget as HTMLElement).blur();
          onClickAddItem(item);
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.repeat) return;
          if (e.key === 'Enter') {
            e.preventDefault();
            (e.currentTarget as HTMLElement).blur();
            onClickAddItem(item);
          }
        }}
        className="group relative flex items-center gap-2.5 px-2.5 py-2 rounded-lg border border-transparent hover:border-teal-500/40 dark:hover:border-teal-400/35 bg-slate-50/70 dark:bg-[#111928]/75 hover:bg-teal-50/50 dark:hover:bg-teal-950/35 transition-all cursor-grab active:cursor-grabbing text-left focus-visible:outline-2 focus-visible:outline-teal-500"
      >
        {/* Pure, borderless icon silhouette stage — no square box trapping the icon */}
        <div className="w-9 h-9 shrink-0 flex items-center justify-center transition-transform duration-150 group-hover:scale-110">
          <LibraryItemMiniIcon item={item} darkMode={darkMode} className="w-7 h-7" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-medium text-slate-800 dark:text-slate-100 truncate">
            {item.label}
          </div>
          {item.subtitle && (
            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {item.subtitle}
            </div>
          )}
        </div>
        <button
          type="button"
          title={isFav ? 'Remove from favorites' : 'Pin to favorites'}
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(item.id);
          }}
          className={`p-1 rounded transition-opacity ${
            isFav
              ? 'opacity-100 text-amber-500'
              : 'opacity-0 group-hover:opacity-100 text-slate-400 hover:text-amber-500'
          }`}
        >
          <Star className="w-3.5 h-3.5" fill={isFav ? 'currentColor' : 'none'} />
        </button>
      </div>
    );
  };

  return (
    <aside
      style={{ width }}
      className="h-full shrink-0 bg-white dark:bg-[#0C121E] border-r border-slate-200/90 dark:border-slate-800/80 flex flex-col overflow-hidden"
      aria-label="Shape library and diagram outline"
    >
      {/* Segmented Tabs */}
      <div className="p-2.5 border-b border-slate-200/90 dark:border-slate-800/80">
        <div className="grid grid-cols-2 gap-1 p-1 rounded-lg bg-slate-100/90 dark:bg-[#070B12] border border-slate-200/60 dark:border-slate-800/80">
          <button
            type="button"
            onClick={() => setTab('library')}
            className={`flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              tab === 'library'
                ? 'bg-white dark:bg-[#141F32] text-teal-800 dark:text-teal-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Shapes className="w-3.5 h-3.5" />
            <span>Library</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('outline')}
            className={`flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              tab === 'outline'
                ? 'bg-white dark:bg-[#141F32] text-teal-800 dark:text-teal-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Outline</span>
          </button>
        </div>
      </div>

      {tab === 'library' ? (
        <>
          <div className="px-3 py-2.5 border-b border-slate-100 dark:border-slate-800/70">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search components..."
                aria-label="Search library components"
                className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-[#080D16] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-teal-500 dark:focus:border-teal-400 transition-colors"
              />
            </div>
            <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
              Drag onto canvas or click to insert
            </p>
          </div>

          <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-4">
            {/* Favorites */}
            {!query && favoriteItems.length > 0 && (
              <div>
                <div className="px-1 text-[11px] font-semibold tracking-wide text-slate-500 dark:text-slate-400 mb-1.5">
                  Pinned Favorites
                </div>
                <div className="space-y-1">{favoriteItems.map(renderLibraryCard)}</div>
              </div>
            )}

            {/* Recently Used */}
            {!query && recentItems.length > 0 && (
              <div>
                <div className="px-1 text-[11px] font-semibold tracking-wide text-slate-500 dark:text-slate-400 mb-1.5">
                  Recently Used
                </div>
                <div className="space-y-1">{recentItems.slice(0, 3).map(renderLibraryCard)}</div>
              </div>
            )}

            {/* Custom Reusable Components */}
            {!query && matchingCustom.length > 0 && (
              <div>
                <div className="px-1 text-[11px] font-semibold tracking-wide text-slate-500 dark:text-slate-400 mb-1.5">
                  Saved Components
                </div>
                <div className="space-y-1">
                  {matchingCustom.map((comp) => (
                    <div
                      key={comp.id}
                      onClick={() => onAddCustomComponent(comp)}
                      className="group flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg border border-transparent hover:border-teal-500/40 bg-slate-50/70 dark:bg-[#111928]/75 hover:bg-teal-50/50 dark:hover:bg-teal-950/35 cursor-pointer transition-all"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 shrink-0 flex items-center justify-center">
                          <LibraryItemMiniIcon
                            item={{
                              id: comp.id,
                              type: comp.objectTemplate.type,
                              fill: comp.objectTemplate.style.fill,
                              stroke: comp.objectTemplate.style.stroke,
                              textColor: comp.objectTemplate.style.textColor,
                              dashed: comp.objectTemplate.style.dashed,
                            }}
                            darkMode={darkMode}
                            className="w-6 h-6"
                          />
                        </div>
                        <span className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                          {comp.name}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteCustomComponent(comp.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 p-0.5 transition-opacity"
                        title="Delete custom component"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Categorized Diagram Library */}
            {groupedSections.map(([section, secItems]) => {
              const isCollapsed = collapsedSections[section];
              return (
                <div key={section}>
                  <button
                    type="button"
                    onClick={() => toggleSection(section)}
                    className="w-full px-1 flex items-center justify-between text-[11px] font-semibold tracking-wide text-slate-600 dark:text-slate-300 mb-1.5 hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    <span>{section}</span>
                    {isCollapsed ? (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </button>
                  {!isCollapsed && (
                    <div className="space-y-1">{secItems.map(renderLibraryCard)}</div>
                  )}
                </div>
              );
            })}

            {groupedSections.length === 0 && (
              <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
                No matching components for &quot;{query}&quot;
              </div>
            )}
          </div>
        </>
      ) : (
        /* Accessible Outline & Layers Tree */
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
          {doc.type === 'sequence' && doc.sequence ? (
            <>
              <div>
                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-2">
                  Participants ({doc.sequence.participants.length})
                </div>
                <div className="space-y-1">
                  {[...doc.sequence.participants]
                    .sort((a, b) => a.order - b.order)
                    .map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => onSelectSequenceParticipant?.(p.id)}
                        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#141F32] text-left transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <SequenceRoleMiniIcon role={p.role} color={p.color} className="w-4 h-4 shrink-0" />
                          <span className="truncate font-medium">{p.name}</span>
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono shrink-0 ml-2">{p.role}</span>
                      </button>
                    ))}
                </div>
              </div>
              <div>
                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-2">
                  Call Sequence ({doc.sequence.messages.length})
                </div>
                <div className="space-y-1">
                  {[...doc.sequence.messages]
                    .sort((a, b) => a.order - b.order)
                    .map((m, i) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => onSelectSequenceMessage?.(m.id)}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#141F32] text-left transition-colors"
                      >
                        <span className="font-mono text-[11px] text-slate-400 tabular-nums">
                          {i + 1}.
                        </span>
                        <span className="truncate">{m.label}</span>
                      </button>
                    ))}
                </div>
              </div>
            </>
          ) : doc.type === 'floorplan' && doc.floorplan ? (
            <>
              <div>
                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-2">
                  Rooms ({doc.floorplan.rooms.length})
                </div>
                <div className="space-y-1">
                  {doc.floorplan.rooms.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => onSelectFloorItem?.({ kind: 'room', id: r.id })}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#141F32] text-left transition-colors"
                    >
                      <span className="truncate font-medium">{r.name}</span>
                      <span className="font-mono text-[11px] text-slate-400 tabular-nums">
                        {r.areaSqM.toFixed(1)} m²
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-2">
                  Furniture ({doc.floorplan.furniture.length})
                </div>
                <div className="space-y-1">
                  {doc.floorplan.furniture.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => onSelectFloorItem?.({ kind: 'furniture', id: f.id })}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#141F32] text-left transition-colors"
                    >
                      <span className="truncate">{f.label}</span>
                      <span className="font-mono text-[10.5px] text-slate-400">
                        {f.width}×{f.depth}m
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div>
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-2">
                Canvas Elements ({doc.objects.length})
              </div>
              {doc.objects.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400 py-4">
                  No elements on canvas yet. Drag shapes from the Library tab to begin.
                </p>
              ) : (
                <div className="space-y-1">
                  {doc.objects.map((o) => {
                    const isSel = selectedIds.includes(o.id);
                    return (
                      <div
                        key={o.id}
                        className={`flex items-center justify-between gap-1.5 px-2 py-1.5 rounded-md text-xs transition-colors ${
                          isSel
                            ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 font-medium'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#141F32]'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => onFocusObject(o.id)}
                          className="flex-1 flex items-center gap-2 text-left min-w-0"
                        >
                          <LibraryItemMiniIcon
                            item={{
                              id: o.id,
                              type: o.type,
                              fill: o.style.fill,
                              stroke: o.style.stroke,
                              textColor: o.style.textColor,
                              dashed: o.style.dashed,
                            }}
                            darkMode={darkMode}
                            className="w-4 h-4 shrink-0"
                          />
                          <span className="truncate">{o.label}</span>
                        </button>
                        <div className="flex items-center gap-0.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => onToggleObjectVisible(o.id)}
                            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                            title={o.visible ? 'Hide element' : 'Show element'}
                          >
                            {o.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => onToggleObjectLock(o.id)}
                            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                            title={o.locked ? 'Unlock element' : 'Lock element'}
                          >
                            {o.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </aside>
  );
};
