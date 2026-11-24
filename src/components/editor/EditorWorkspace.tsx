import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  BookmarkPlus,
  CheckCircle2,
  Command,
  Database,
  Download,
  Grid,
  Hand,
  HardDriveDownload,
  History,
  Keyboard,
  Magnet,
  Map as MapIcon,
  Maximize2,
  Moon,
  MousePointer2,
  PanelLeft,
  PanelRight,
  PenTool,
  Play,
  Redo2,
  RotateCcw,
  Ruler,
  Save,
  Sparkles,
  Sun,
  Trash2,
  Undo2,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import {
  CustomComponent,
  DiagramDocument,
  DiagramSnapshot,
  DiagramThemeId,
  DiagramType,
  FragmentKind,
  LocalProfile,
  SequenceMessageType,
  ViewportState,
} from '../../types/diagram';
import {
  createFurnitureFromLibraryItem,
  createObjectFromLibraryItem,
  DIAGRAM_TYPE_MAP,
  getLibraryForType,
  LibraryItem,
  NEXORA_MODULE_MAP,
} from '../../engine/libraries';
import { applyAutoLayout, LayoutDirection } from '../../engine/layout';
import { detectRoomsFromWalls, isUSUnit } from '../../engine/geometry';
import { makeId } from '../../engine/templates';
import {
  DesktopFileHandle,
  openDesignFromDesktop,
  readDroppedPCanvasFile,
  saveDesignToDesktop,
} from '../../engine/pcanvasFile';
import {
  NexoraBrandLogo,
  NexoraModuleIcon,
} from '../icons/ShapeIcons';
import { NexoraHamburgerMenu } from '../navigation/NexoraHamburgerMenu';
import { NewDesignModal } from '../modals/NewDesignModal';
import { StandardCanvas } from '../canvas/StandardCanvas';
import { SequenceCanvas } from '../canvas/SequenceCanvas';
import { FloorPlanCanvas, FloorSelectionItem } from '../canvas/FloorPlanCanvas';
import { LeftLibraryPanel } from './LeftLibraryPanel';
import { RightPropertiesPanel } from './RightPropertiesPanel';
import { FloatingToolbar } from './FloatingToolbar';
import { CommandPalette } from './CommandPalette';
import { ExportImportModal } from './ExportImportModal';
import { AiStudioModal } from './AiStudioModal';
import { Tooltip } from '../ui/Tooltip';

// Fallback brick/wall icon helper using standard SVG since lucide doesn't export WallIcon
const BrickWallSvg: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <line x1="3" y1="10" x2="21" y2="10" />
    <line x1="3" y1="15" x2="21" y2="15" />
    <line x1="12" y1="4" x2="12" y2="10" />
    <line x1="8" y1="10" x2="8" y2="15" />
    <line x1="16" y1="10" x2="16" y2="15" />
    <line x1="12" y1="15" x2="12" y2="20" />
  </svg>
);

interface EditorWorkspaceProps {
  initialDoc: DiagramDocument;
  initialFileHandle?: DesktopFileHandle | null;
  initialFileName?: string | null;
  isNewDesign?: boolean;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  profile: LocalProfile;
  customComponents: CustomComponent[];
  customTemplates: DiagramDocument[];
  onSaveDiagram: (doc: DiagramDocument) => Promise<void>;
  onSaveCustomComponent: (comp: CustomComponent) => Promise<void>;
  onDeleteCustomComponent: (id: string) => Promise<void>;
  onSaveCustomTemplate: (doc: DiagramDocument) => Promise<void>;
  onDeleteCustomTemplate: (id: string) => Promise<void>;
  onImportNewDiagram: (doc: DiagramDocument) => void;
  onOpenDesktopDesign: (
    doc: DiagramDocument,
    handle: DesktopFileHandle | null,
    fileName: string
  ) => void;
  onStartNewDesign: (type: DiagramType) => void;
  onUseTemplate: (doc: DiagramDocument) => void;
  onOpenWorkspaceSettings: () => void;
  onOpenHelp: () => void;
  onExportAiSchema: () => void;
  onBackHome: () => void;
  onDiscardAndBackHome: (id: string) => Promise<void>;
}

export const EditorWorkspace: React.FC<EditorWorkspaceProps> = ({
  initialDoc,
  initialFileHandle = null,
  initialFileName = null,
  isNewDesign = false,
  darkMode,
  onToggleDarkMode,
  profile,
  customComponents,
  customTemplates,
  onSaveDiagram,
  onSaveCustomComponent,
  onDeleteCustomComponent,
  onSaveCustomTemplate,
  onDeleteCustomTemplate,
  onImportNewDiagram,
  onOpenDesktopDesign,
  onStartNewDesign,
  onUseTemplate,
  onOpenWorkspaceSettings,
  onOpenHelp,
  onExportAiSchema,
  onBackHome,
  onDiscardAndBackHome,
}) => {
  const [doc, setDoc] = useState<DiagramDocument>(initialDoc);
  const [historyPast, setHistoryPast] = useState<DiagramDocument[]>([]);
  const [historyFuture, setHistoryFuture] = useState<DiagramDocument[]>([]);
  const [saveState, setSaveState] = useState<'Saved' | 'Saving...'>('Saved');
  const [toast, setToast] = useState<string | null>(null);
  const [fileHandle, setFileHandle] = useState<DesktopFileHandle | null>(initialFileHandle);
  const [linkedFileName, setLinkedFileName] = useState<string | null>(initialFileName);
  const [hasUndownloadedChanges, setHasUndownloadedChanges] = useState(false);
  const [lastDownloadedAt, setLastDownloadedAt] = useState<string | null>(
    initialFileName ? 'Opened from file' : null
  );
  const [fileDropActive, setFileDropActive] = useState(false);

  // Viewport & Panel states
  const [viewport, setViewport] = useState<ViewportState>({ x: 40, y: 30, zoom: 1 });
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [showMinimap, setShowMinimap] = useState(false);
  const [presentationMode, setPresentationMode] = useState(false);

  // Tool states
  const [standardTool, setStandardTool] = useState<'select' | 'pan' | 'pen'>('select');
  const [floorTool, setFloorTool] = useState<'select' | 'pan' | 'wall'>('select');

  // Selection states
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [editingObjectId, setEditingObjectId] = useState<string | null>(null);

  // Sequence selections (multi-select supported)
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<string[]>([]);
  const [selectedMessageIds, setSelectedMessageIds] = useState<string[]>([]);
  const [selectedFragmentId, setSelectedFragmentId] = useState<string | null>(null);

  // Floor plan selections (multi-select supported)
  const [selectedFloorItems, setSelectedFloorItems] = useState<FloorSelectionItem[]>([]);

  // Library helpers
  const [draggingLibraryItem, setDraggingLibraryItem] = useState<LibraryItem | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('pc_fav_shapes') || '[]');
    } catch {
      return [];
    }
  });
  const [recentIds, setRecentIds] = useState<string[]>([]);

  // Modals & Drawers
  const [cmdOpen, setCmdOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
  const [newClearOpen, setNewClearOpen] = useState(false);
  const [newModalTab, setNewModalTab] = useState<'blank' | 'templates'>('blank');
  const [saveTemplateOpen, setSaveTemplateOpen] = useState(false);
  const [templateNameInput, setTemplateNameInput] = useState('');
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [keepInIndexedDbAfterDownload, setKeepInIndexedDbAfterDownload] = useState(false);
  const [leavingBusy, setLeavingBusy] = useState(false);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const saveTimerRef = useRef<number | null>(null);
  const docRef = useRef(doc);
  docRef.current = doc;

  const readOnly = profile.role === 'viewer' || presentationMode;

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast((cur) => (cur === msg ? null : cur)), 2600);
  }, []);

  // Reset editor when switching diagram ID or opening a new desktop file
  useEffect(() => {
    setDoc(initialDoc);
    setFileHandle(initialFileHandle ?? null);
    setLinkedFileName(initialFileName ?? null);
    setHasUndownloadedChanges(false);
    setLastDownloadedAt(initialFileName ? 'Opened from file' : null);
    setHistoryPast([]);
    setHistoryFuture([]);
    setSelectedIds([]);
    setSelectedConnectionId(null);
    setSelectedParticipantIds([]);
    setSelectedMessageIds([]);
    setSelectedFragmentId(null);
    setSelectedFloorItems([]);
    setViewport({ x: 48, y: 36, zoom: 1 });
  }, [initialDoc.id, initialFileHandle, initialFileName]);

  // Debounced autosave to IndexedDB
  const scheduleSave = useCallback(
    (nextDoc: DiagramDocument) => {
      setSaveState('Saving...');
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = window.setTimeout(async () => {
        await onSaveDiagram(nextDoc);
        setSaveState('Saved');
      }, 450);
    },
    [onSaveDiagram]
  );

  // Command-based history update
  const updateDoc = useCallback(
    (next: DiagramDocument, recordHistory = true) => {
      if (recordHistory) {
        setHistoryPast((prev) => [...prev.slice(-49), docRef.current]);
        setHistoryFuture([]);
      }
      const stamped = { ...next, updatedAt: new Date().toISOString() };
      setDoc(stamped);
      setHasUndownloadedChanges(true);
      scheduleSave(stamped);
    },
    [scheduleSave]
  );

  const handleUndo = useCallback(() => {
    setHistoryPast((prev) => {
      if (prev.length === 0) return prev;
      const previous = prev[prev.length - 1];
      setHistoryFuture((f) => [docRef.current, ...f]);
      setDoc(previous);
      scheduleSave(previous);
      return prev.slice(0, -1);
    });
  }, [scheduleSave]);

  const handleRedo = useCallback(() => {
    setHistoryFuture((prev) => {
      if (prev.length === 0) return prev;
      const next = prev[0];
      setHistoryPast((p) => [...p, docRef.current]);
      setDoc(next);
      scheduleSave(next);
      return prev.slice(1);
    });
  }, [scheduleSave]);

  const cancelPendingAutosave = useCallback(() => {
    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
  }, []);

  // Save current design to desktop (.nexora)
  const handleSaveToDesktop = useCallback(
    async (saveAs = false, persistToIndexedDb = true): Promise<boolean> => {
      try {
        if (persistToIndexedDb) {
          cancelPendingAutosave();
          await onSaveDiagram(docRef.current);
          setSaveState('Saved');
        }
        const res = await saveDesignToDesktop(docRef.current, {
          existingHandle: fileHandle,
          saveAs,
        });
        if (res.saved) {
          if (res.handle) setFileHandle(res.handle);
          setLinkedFileName(res.fileName);
          setHasUndownloadedChanges(false);
          setLastDownloadedAt(
            new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          );
          showToast(`Downloaded "${res.fileName}"`);
          return true;
        }
        return false;
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Unable to save .nexora file');
        return false;
      }
    },
    [cancelPendingAutosave, fileHandle, onSaveDiagram, showToast]
  );

  // Navigation back to primary Home view confirmation actions
  const handleRequestLeaveDesign = useCallback(() => {
    setKeepInIndexedDbAfterDownload(false);
    setLeaveModalOpen(true);
  }, []);

  const handleLeavePersistIndexedDb = useCallback(async () => {
    setLeavingBusy(true);
    try {
      cancelPendingAutosave();
      await onSaveDiagram(docRef.current);
      setSaveState('Saved');
      setLeaveModalOpen(false);
      onBackHome();
    } finally {
      setLeavingBusy(false);
    }
  }, [cancelPendingAutosave, onBackHome, onSaveDiagram]);

  const handleLeaveDownloadLocal = useCallback(async () => {
    setLeavingBusy(true);
    try {
      const saved = await handleSaveToDesktop(false, keepInIndexedDbAfterDownload);
      if (!saved) return;
      setLeaveModalOpen(false);
      if (keepInIndexedDbAfterDownload) {
        onBackHome();
      } else {
        cancelPendingAutosave();
        await onDiscardAndBackHome(docRef.current.id);
      }
    } finally {
      setLeavingBusy(false);
    }
  }, [
    cancelPendingAutosave,
    handleSaveToDesktop,
    keepInIndexedDbAfterDownload,
    onBackHome,
    onDiscardAndBackHome,
  ]);

  const handleLeaveDiscardDesign = useCallback(async () => {
    setLeavingBusy(true);
    try {
      cancelPendingAutosave();
      setLeaveModalOpen(false);
      await onDiscardAndBackHome(docRef.current.id);
    } finally {
      setLeavingBusy(false);
    }
  }, [cancelPendingAutosave, onDiscardAndBackHome]);

  // Open a .nexora / .pcanvas file from desktop for viewing & editing
  const handleOpenDesktopFile = useCallback(async () => {
    try {
      const opened = await openDesignFromDesktop();
      if (!opened) return;
      onOpenDesktopDesign(opened.doc, opened.handle, opened.fileName);
      showToast(`Opened "${opened.fileName}"`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not open .nexora file');
    }
  }, [onOpenDesktopDesign, showToast]);

  // Clear all elements on the current canvas (reversible via Cmd+Z)
  const handleClearCurrentCanvas = useCallback(() => {
    if (readOnly) return;
    if (docRef.current.type === 'sequence' && docRef.current.sequence) {
      updateDoc(
        {
          ...docRef.current,
          sequence: {
            ...docRef.current.sequence,
            participants: [],
            messages: [],
            fragments: [],
            notes: [],
          },
        },
        true
      );
    } else if (docRef.current.type === 'floorplan' && docRef.current.floorplan) {
      updateDoc(
        {
          ...docRef.current,
          floorplan: {
            ...docRef.current.floorplan,
            walls: [],
            openings: [],
            rooms: [],
            furniture: [],
          },
        },
        true
      );
    } else {
      updateDoc(
        {
          ...docRef.current,
          objects: [],
          connections: [],
        },
        true
      );
    }
    setSelectedIds([]);
    setSelectedConnectionId(null);
    setSelectedParticipantIds([]);
    setSelectedMessageIds([]);
    setSelectedFragmentId(null);
    setSelectedFloorItems([]);
    setNewClearOpen(false);
    showToast('Canvas cleared (Cmd+Z to undo)');
  }, [readOnly, showToast, updateDoc]);

  // Delete currently selected items cleanly across all 3 engines (single or multi-selection)
  const handleDeleteSelection = useCallback(() => {
    if (readOnly) return;

    if (doc.type === 'sequence' && doc.sequence) {
      const seq = doc.sequence;
      if (selectedParticipantIds.length > 0 || selectedMessageIds.length > 0) {
        const delParts = new Set(selectedParticipantIds);
        const delMsgs = new Set(selectedMessageIds);
        const nextParts = seq.participants
          .filter((p) => !delParts.has(p.id))
          .map((p, i) => ({ ...p, order: i }));
        const nextMsgs = seq.messages
          .filter(
            (m) => !delMsgs.has(m.id) && !delParts.has(m.fromId) && !delParts.has(m.toId)
          )
          .map((m, i) => ({ ...m, order: i }));
        updateDoc({ ...doc, sequence: { ...seq, participants: nextParts, messages: nextMsgs } }, true);
        setSelectedParticipantIds([]);
        setSelectedMessageIds([]);
        return;
      }
      if (selectedFragmentId) {
        const nextFrags = seq.fragments.filter((f) => f.id !== selectedFragmentId);
        updateDoc({ ...doc, sequence: { ...seq, fragments: nextFrags } }, true);
        setSelectedFragmentId(null);
        return;
      }
      return;
    }

    if (doc.type === 'floorplan' && doc.floorplan && selectedFloorItems.length > 0) {
      const fp = doc.floorplan;
      const delFurn = new Set(selectedFloorItems.filter((s) => s.kind === 'furniture').map((s) => s.id));
      const delOpen = new Set(selectedFloorItems.filter((s) => s.kind === 'opening').map((s) => s.id));
      const delWalls = new Set(selectedFloorItems.filter((s) => s.kind === 'wall').map((s) => s.id));

      if (delFurn.size > 0 || delOpen.size > 0 || delWalls.size > 0) {
        const nextWalls = fp.walls.filter((w) => !delWalls.has(w.id));
        const nextOpenings = fp.openings.filter((o) => !delOpen.has(o.id) && !delWalls.has(o.wallId));
        const nextFurniture = fp.furniture.filter((f) => !delFurn.has(f.id));
        const nextRooms = delWalls.size > 0 ? detectRoomsFromWalls(nextWalls, fp.rooms) : fp.rooms;
        updateDoc(
          {
            ...doc,
            floorplan: {
              ...fp,
              walls: nextWalls,
              openings: nextOpenings,
              furniture: nextFurniture,
              rooms: nextRooms,
            },
          },
          true
        );
      }
      setSelectedFloorItems([]);
      return;
    }

    if (selectedConnectionId) {
      updateDoc(
        {
          ...doc,
          connections: doc.connections.filter((c) => c.id !== selectedConnectionId),
        },
        true
      );
      setSelectedConnectionId(null);
      return;
    }

    if (selectedIds.length > 0) {
      const delSet = new Set(selectedIds);
      updateDoc(
        {
          ...doc,
          objects: doc.objects.filter((o) => !delSet.has(o.id) || o.locked),
          connections: doc.connections.filter(
            (c) => !delSet.has(c.fromId) && !delSet.has(c.toId)
          ),
        },
        true
      );
      setSelectedIds([]);
    }
  }, [
    doc,
    readOnly,
    selectedConnectionId,
    selectedFloorItems,
    selectedFragmentId,
    selectedIds,
    selectedMessageIds,
    selectedParticipantIds,
    updateDoc,
  ]);

  const handleDuplicate = useCallback(() => {
    if (readOnly || selectedIds.length === 0) return;
    const toDup = doc.objects.filter((o) => selectedIds.includes(o.id));
    const maxZ = doc.objects.reduce((m, o) => Math.max(m, o.zIndex), 0);
    const copies = toDup.map((o, idx) => ({
      ...o,
      id: makeId('obj'),
      x: o.x + 32,
      y: o.y + 32,
      zIndex: maxZ + idx + 1,
    }));
    updateDoc({ ...doc, objects: [...doc.objects, ...copies] }, true);
    setSelectedIds(copies.map((c) => c.id));
  }, [doc, readOnly, selectedIds, updateDoc]);

  // Global keyboard shortcuts (Undo/Redo, Cmd+K, Delete, Duplicate, Arrow nudge, Escape)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const inInput = target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCmdOpen((o) => !o);
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        void handleSaveToDesktop(e.shiftKey);
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        void handleOpenDesktopFile();
        return;
      }

      if (inInput) return;

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        setExportOpen(true);
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        handleDuplicate();
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        if (doc.type === 'sequence' && doc.sequence) {
          setSelectedParticipantIds(doc.sequence.participants.map((p) => p.id));
          setSelectedMessageIds(doc.sequence.messages.map((m) => m.id));
        } else if (doc.type === 'floorplan' && doc.floorplan) {
          setSelectedFloorItems([
            ...doc.floorplan.furniture.map((f) => ({ kind: 'furniture' as const, id: f.id })),
            ...doc.floorplan.walls.map((w) => ({ kind: 'wall' as const, id: w.id })),
          ]);
        } else {
          setSelectedIds(doc.objects.filter((o) => o.category !== 'container').map((o) => o.id));
        }
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        handleDeleteSelection();
        return;
      }

      if (e.key === 'Escape' && presentationMode) {
        setPresentationMode(false);
        return;
      }

      // Keyboard arrow nudge for accessibility & precision
      if (
        !readOnly &&
        selectedIds.length > 0 &&
        ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)
      ) {
        e.preventDefault();
        const step = e.shiftKey ? 20 : 4;
        const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0;
        const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0;
        updateDoc(
          {
            ...doc,
            objects: doc.objects.map((o) =>
              selectedIds.includes(o.id) && !o.locked ? { ...o, x: o.x + dx, y: o.y + dy } : o
            ),
          },
          true
        );
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    doc,
    handleDeleteSelection,
    handleDuplicate,
    handleOpenDesktopFile,
    handleRedo,
    handleSaveToDesktop,
    handleUndo,
    presentationMode,
    readOnly,
    selectedIds,
    updateDoc,
  ]);

  // Fit diagram to viewport
  const handleFitToScreen = useCallback(() => {
    const svg = svgRef.current;
    const content = svg?.querySelector('[data-canvas-content="true"]') as SVGGElement | null;
    if (!svg || !content) {
      setViewport({ x: 48, y: 36, zoom: 1 });
      return;
    }
    try {
      const bbox = content.getBBox();
      const rect = svg.getBoundingClientRect();
      if (bbox.width < 10 || bbox.height < 10) {
        setViewport({ x: 48, y: 36, zoom: 1 });
        return;
      }
      const pad = 72;
      const scaleX = (rect.width - pad * 2) / bbox.width;
      const scaleY = (rect.height - pad * 2) / bbox.height;
      const zoom = Math.min(1.25, Math.max(0.35, Math.min(scaleX, scaleY)));
      const x = rect.width / 2 - (bbox.x + bbox.width / 2) * zoom;
      const y = rect.height / 2 - (bbox.y + bbox.height / 2) * zoom;
      setViewport({ x, y, zoom });
    } catch {
      setViewport({ x: 48, y: 36, zoom: 1 });
    }
  }, []);

  // Add item from Library click
  const handleClickAddLibraryItem = (item: LibraryItem) => {
    if (readOnly) return;
    setRecentIds((prev) => [item.id, ...prev.filter((i) => i !== item.id)].slice(0, 6));

    const curDoc = docRef.current;
    if (curDoc.type === 'sequence' && curDoc.sequence) {
      const seq = curDoc.sequence;
      const newP = {
        id: makeId('p'),
        name: item.label,
        role: item.participantRole ?? 'microservice',
        subtitle: item.subtitle,
        color: item.stroke,
        order: seq.participants.length,
      };
      updateDoc({ ...curDoc, sequence: { ...seq, participants: [...seq.participants, newP] } }, true);
      setSelectedParticipantIds([newP.id]);
      return;
    }

    if (doc.type === 'floorplan' && doc.floorplan) {
      const fp = doc.floorplan;
      if (item.floorItemKind === 'wall') {
        setFloorTool('wall');
        showToast('Wall Tool active: click canvas to draw walls');
        return;
      }
      if (item.floorItemKind === 'room-rect') {
        const offset = 2 + (fp.rooms.length % 3) * 1.5;
        const w = item.realWidthM ?? 4;
        const d = item.realDepthM ?? 3.5;
        const newWalls = [
          { id: makeId('w'), x1: offset, y1: offset, x2: offset + w, y2: offset, thickness: 0.16, kind: 'interior' as const },
          { id: makeId('w'), x1: offset + w, y1: offset, x2: offset + w, y2: offset + d, thickness: 0.16, kind: 'interior' as const },
          { id: makeId('w'), x1: offset + w, y1: offset + d, x2: offset, y2: offset + d, thickness: 0.16, kind: 'interior' as const },
          { id: makeId('w'), x1: offset, y1: offset + d, x2: offset, y2: offset, thickness: 0.16, kind: 'interior' as const },
        ];
        const nextWalls = [...fp.walls, ...newWalls];
        const nextRooms = detectRoomsFromWalls(nextWalls, fp.rooms);
        updateDoc({ ...doc, floorplan: { ...fp, walls: nextWalls, rooms: nextRooms } }, true);
        return;
      }
      if (
        (item.floorItemKind === 'door' ||
          item.floorItemKind === 'double-door' ||
          item.floorItemKind === 'sliding-door' ||
          item.floorItemKind === 'window') &&
        fp.walls.length > 0
      ) {
        const targetWall = fp.walls[0];
        const newOp = {
          id: makeId('op'),
          wallId: targetWall.id,
          kind: item.floorItemKind,
          offsetRatio: 0.5,
          width: item.realWidthM ?? 0.9,
          swing: 'right' as const,
          swingInward: true,
        };
        updateDoc({ ...doc, floorplan: { ...fp, openings: [...fp.openings, newOp] } }, true);
        setSelectedFloorItems([{ kind: 'opening', id: newOp.id }]);
        return;
      }
      const furn = createFurnitureFromLibraryItem(item, 4.5 + Math.random() * 1.5, 3.5 + Math.random() * 1.5);
      updateDoc({ ...doc, floorplan: { ...fp, furniture: [...fp.furniture, furn] } }, true);
      setSelectedFloorItems([{ kind: 'furniture', id: furn.id }]);
      return;
    }

    const centerX = (420 - viewport.x) / viewport.zoom + (doc.objects.length % 5) * 24;
    const centerY = (260 - viewport.y) / viewport.zoom + (doc.objects.length % 5) * 24;
    const maxZ = doc.objects.reduce((m, o) => Math.max(m, o.zIndex), 0);
    const created = createObjectFromLibraryItem(item, centerX, centerY, maxZ + 1);
    updateDoc({ ...doc, objects: [...doc.objects, created] }, true);
    setSelectedIds([created.id]);
    setSelectedConnectionId(null);
  };

  // Smart Shape Replacement (Scenario G: preserves connectors & metadata!)
  const handleReplaceShape = (newType: string) => {
    if (readOnly || selectedIds.length !== 1) return;
    const libItem = getLibraryForType(doc.type).find((l) => l.type === newType);
    if (!libItem) return;
    const targetId = selectedIds[0];
    updateDoc(
      {
        ...doc,
        objects: doc.objects.map((o) =>
          o.id === targetId
            ? {
                ...o,
                type: libItem.type,
                width: libItem.defaultWidth,
                height: libItem.defaultHeight,
                style: {
                  ...o.style,
                  fill: libItem.fill,
                  stroke: libItem.stroke,
                  textColor: libItem.textColor,
                  borderRadius: libItem.borderRadius ?? o.style.borderRadius,
                },
              }
            : o
        ),
      },
      true
    );
    showToast(`Replaced shape with ${libItem.label} (connections preserved)`);
  };

  // Sequence Wrap in Fragment
  const handleWrapInFragment = (kind: FragmentKind) => {
    if (!doc.sequence || selectedMessageIds.length === 0) return;
    const seq = doc.sequence;
    const selectedMsgs = seq.messages.filter((m) => selectedMessageIds.includes(m.id));
    if (selectedMsgs.length === 0) return;
    const startOrder = Math.min(...selectedMsgs.map((m) => m.order));
    const endOrder = Math.max(...selectedMsgs.map((m) => m.order));
    const colors: Record<FragmentKind, string> = {
      alt: '#0284C7',
      opt: '#0D9488',
      loop: '#D97706',
      par: '#4338CA',
      break: '#DC2626',
      critical: '#B91C1C',
      ref: '#475569',
    };
    const newFrag = {
      id: makeId('frag'),
      kind,
      guard: kind === 'loop' ? 'for each item' : kind === 'par' ? 'concurrent tasks' : 'condition met',
      startOrder,
      endOrder,
      color: colors[kind],
    };
    updateDoc(
      { ...doc, sequence: { ...seq, fragments: [...seq.fragments, newFrag] } },
      true
    );
    setSelectedMessageIds([]);
    setSelectedFragmentId(newFrag.id);
  };

  // Open Save Design as Template dialog
  const handlePromptSaveAsTemplate = useCallback(() => {
    setTemplateNameInput(`${docRef.current.title} Template`);
    setSaveTemplateOpen(true);
  }, []);

  const handleConfirmSaveAsTemplate = async () => {
    const cleanName = templateNameInput.trim() || `${docRef.current.title} Template`;
    const { snapshots: _snaps, ...rest } = docRef.current;
    const templateDoc: DiagramDocument = {
      ...structuredClone(rest),
      id: makeId('ctpl'),
      title: cleanName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await onSaveCustomTemplate(templateDoc);
    setSaveTemplateOpen(false);
    showToast(`Saved "${cleanName}" to My Templates`);
  };

  // Save named version snapshot
  const handleCreateSnapshot = () => {
    const { snapshots: _prev, ...rest } = doc;
    const snap: DiagramSnapshot = {
      id: makeId('snap'),
      label: `Version ${(doc.snapshots?.length ?? 0) + 1}`,
      createdAt: new Date().toISOString(),
      document: structuredClone(rest),
    };
    updateDoc({ ...doc, snapshots: [snap, ...(doc.snapshots ?? [])] }, false);
    showToast(`Saved ${snap.label}`);
  };

  const selectedObjects = useMemo(
    () => doc.objects.filter((o) => selectedIds.includes(o.id)),
    [doc.objects, selectedIds]
  );

  const selectedConnection = useMemo(
    () => doc.connections.find((c) => c.id === selectedConnectionId) ?? null,
    [doc.connections, selectedConnectionId]
  );

  const typeMeta = DIAGRAM_TYPE_MAP[doc.type];
  const moduleMeta = NEXORA_MODULE_MAP[typeMeta.module];

  const singleFloorItem = selectedFloorItems.length === 1 ? selectedFloorItems[0] : null;
  const singleParticipantId =
    selectedParticipantIds.length === 1 ? selectedParticipantIds[0] : null;

  return (
    <div
      className="h-screen w-screen flex flex-col overflow-hidden bg-[#F6F8FB] dark:bg-[#070B12] text-slate-900 dark:text-slate-100 relative"
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes('Files')) {
          e.preventDefault();
          setFileDropActive(true);
        }
      }}
      onDragLeave={(e) => {
        if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
        setFileDropActive(false);
      }}
      onDrop={async (e) => {
        if (!e.dataTransfer.types.includes('Files')) return;
        e.preventDefault();
        setFileDropActive(false);
        const file = e.dataTransfer.files?.[0];
        if (!file) return;
        try {
          const opened = await readDroppedPCanvasFile(file);
          onOpenDesktopDesign(opened.doc, null, opened.fileName);
          showToast(`Opened "${opened.fileName}"`);
        } catch (err) {
          showToast(err instanceof Error ? err.message : 'Unsupported file dropped');
        }
      }}
    >
      {/* Drag-and-drop .nexora / .pcanvas file overlay */}
      {fileDropActive && (
        <div className="pointer-events-none absolute inset-0 z-50 bg-teal-600/12 backdrop-blur-[2px] border-2 border-dashed border-teal-500 flex items-center justify-center">
          <div className="px-6 py-4 rounded-xl bg-white dark:bg-[#0D1422] border border-slate-200 dark:border-slate-700 shadow-2xl text-center space-y-1">
            <div className="text-sm font-semibold text-slate-900 dark:text-white">
              Drop .nexora or .pcanvas file to view &amp; edit
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Loads the design directly into Nexora
            </div>
          </div>
        </div>
      )}

      {/* Top Application Bar (Hidden in Presentation Mode) */}
      {!presentationMode && (
        <header className="h-13 shrink-0 bg-white dark:bg-[#0C121E] border-b border-slate-200/90 dark:border-slate-800/80 px-3 flex items-center justify-between gap-3 z-30">
          {/* Left Zone: Hamburger Menu + Nexora Mark + Editable Title + Module Breadcrumb */}
          <div className="flex items-center gap-2 min-w-0">
            <NexoraHamburgerMenu
              hasActiveDoc
              readOnly={readOnly}
              snapshotCount={doc.snapshots?.length ?? 0}
              hasUndownloadedChanges={hasUndownloadedChanges}
              onNewFile={() => {
                setNewModalTab('blank');
                setNewClearOpen(true);
              }}
              onNewFromTemplate={() => {
                setNewModalTab('templates');
                setNewClearOpen(true);
              }}
              onOpenFile={() => void handleOpenDesktopFile()}
              onCloseFile={handleRequestLeaveDesign}
              onSaveToDrive={() => void handleSaveToDesktop(false)}
              onOpenHistory={() => setHistoryDrawerOpen(true)}
              onSaveAsTemplate={handlePromptSaveAsTemplate}
              onOpenSettings={onOpenWorkspaceSettings}
              onExportAiSchema={() => {
                onExportAiSchema();
                showToast('Downloaded nexora-ai-design-schema.md for AI chat engines');
              }}
              onOpenHelp={onOpenHelp}
            />
            <Tooltip
              label="Return to Nexora Home"
              description="Save, download, or discard this design and go back to your workspace dashboard"
            >
              <button
                type="button"
                onClick={handleRequestLeaveDesign}
                className="shrink-0 rounded-md hover:opacity-90 transition-opacity"
                aria-label="Back to Nexora Home"
              >
                <NexoraBrandLogo className="w-6 h-6" />
              </button>
            </Tooltip>
            <div className="w-px h-5 bg-slate-200 dark:bg-slate-800 shrink-0" />
            <input
              type="text"
              value={doc.title}
              disabled={readOnly}
              onChange={(e) => updateDoc({ ...doc, title: e.target.value }, false)}
              aria-label="Diagram title"
              className="font-display text-sm font-semibold bg-transparent text-slate-900 dark:text-slate-100 px-1.5 py-1 rounded hover:bg-slate-100 dark:hover:bg-[#141F32] focus:bg-slate-100 dark:focus:bg-[#141F32] outline-none truncate max-w-[190px]"
            />
            <span className="hidden lg:inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap shrink-0">
              <NexoraModuleIcon module={moduleMeta.id} className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span className="font-medium text-slate-700 dark:text-slate-300">{moduleMeta.name}</span>
              <span aria-hidden="true">·</span>
              <span>{typeMeta.shortName}</span>
            </span>
          </div>

          {/* Center Zone: Primary Canvas Mode Tools + Undo/Redo */}
          <div className="flex items-center gap-1 shrink-0">
            <Tooltip
              label="Undo"
              description="Revert the last change on the canvas"
              shortcut="⌘Z"
            >
              <button
                type="button"
                onClick={handleUndo}
                disabled={historyPast.length === 0 || readOnly}
                className="p-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#141F32] disabled:opacity-35 transition-colors"
                aria-label="Undo"
              >
                <Undo2 className="w-4 h-4" />
              </button>
            </Tooltip>
            <Tooltip
              label="Redo"
              description="Reapply the most recently undone change"
              shortcut="⌘⇧Z"
            >
              <button
                type="button"
                onClick={handleRedo}
                disabled={historyFuture.length === 0 || readOnly}
                className="p-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#141F32] disabled:opacity-35 transition-colors"
                aria-label="Redo"
              >
                <Redo2 className="w-4 h-4" />
              </button>
            </Tooltip>

            <div className="w-px h-5 bg-slate-200 dark:bg-slate-800 mx-1.5" />

            {doc.type === 'floorplan' && doc.floorplan ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-slate-100 dark:bg-[#070B12] border border-slate-200/70 dark:border-slate-800">
                  <Tooltip
                    label="Select & Resize Tool"
                    description="Click walls to resize enclosed spaces, double-click for a single wall, or move furniture"
                    shortcut="V"
                  >
                    <button
                      type="button"
                      onClick={() => setFloorTool('select')}
                      className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                        floorTool === 'select'
                          ? 'bg-white dark:bg-[#141F32] text-teal-800 dark:text-teal-300 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <MousePointer2 className="w-3.5 h-3.5" />
                      <span>Select</span>
                    </button>
                  </Tooltip>
                  <Tooltip
                    label="Draw Connected Walls"
                    description="Click corner points to chain exterior or interior walls; press Esc to finish"
                  >
                    <button
                      type="button"
                      onClick={() => setFloorTool('wall')}
                      className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                        floorTool === 'wall'
                          ? 'bg-teal-700 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <BrickWallSvg className="w-3.5 h-3.5" />
                      <span>Draw Wall</span>
                    </button>
                  </Tooltip>
                  <Tooltip
                    label="Pan Canvas"
                    description="Drag anywhere to move across the floor plan without selecting items"
                    shortcut="Space"
                  >
                    <button
                      type="button"
                      onClick={() => setFloorTool('pan')}
                      className={`p-1.5 rounded-md transition-colors ${
                        floorTool === 'pan'
                          ? 'bg-white dark:bg-[#141F32] text-teal-800 dark:text-teal-300 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                      aria-label="Pan Canvas"
                    >
                      <Hand className="w-3.5 h-3.5" />
                    </button>
                  </Tooltip>
                </div>

                {/* Quick US / Metric Measurement Switcher */}
                <div
                  className="flex items-center gap-0.5 p-0.5 rounded-lg bg-slate-100 dark:bg-[#070B12] border border-slate-200/70 dark:border-slate-800"
                  role="group"
                  aria-label="Floor plan measurement system"
                >
                  <span className="pl-1.5 pr-1 text-slate-400 dark:text-slate-500 hidden sm:inline-flex items-center">
                    <Ruler className="w-3.5 h-3.5" />
                  </span>
                  <Tooltip
                    label="US Imperial Units"
                    description="Display dimensions in feet & inches and room areas in sq ft"
                  >
                    <button
                      type="button"
                      disabled={readOnly}
                      onClick={() => {
                        if (!isUSUnit(doc.floorplan!.unit)) {
                          updateDoc(
                            {
                              ...doc,
                              floorplan: { ...doc.floorplan!, unit: 'ft-in' },
                            },
                            true
                          );
                          showToast('Measurements switched to US (ft & in)');
                        }
                      }}
                      className={`px-2 py-1 text-xs font-semibold rounded-md whitespace-nowrap transition-colors ${
                        isUSUnit(doc.floorplan.unit)
                          ? 'bg-white dark:bg-[#141F32] text-teal-800 dark:text-teal-300 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      US
                    </button>
                  </Tooltip>
                  <Tooltip
                    label="Metric Units"
                    description="Display dimensions in meters/cm/mm and room areas in m²"
                  >
                    <button
                      type="button"
                      disabled={readOnly}
                      onClick={() => {
                        if (isUSUnit(doc.floorplan!.unit)) {
                          updateDoc(
                            {
                              ...doc,
                              floorplan: { ...doc.floorplan!, unit: 'm' },
                            },
                            true
                          );
                          showToast('Measurements switched to Metric (m)');
                        }
                      }}
                      className={`px-2 py-1 text-xs font-semibold rounded-md whitespace-nowrap transition-colors ${
                        !isUSUnit(doc.floorplan.unit)
                          ? 'bg-white dark:bg-[#141F32] text-teal-800 dark:text-teal-300 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      Metric
                    </button>
                  </Tooltip>
                </div>
              </div>
            ) : doc.type !== 'sequence' ? (
              <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-slate-100 dark:bg-[#070B12] border border-slate-200/70 dark:border-slate-800">
                <Tooltip
                  label="Select Tool"
                  description="Click or drag a marquee box to select, move, resize, and connect nodes"
                  shortcut="V"
                >
                  <button
                    type="button"
                    onClick={() => setStandardTool('select')}
                    className={`p-1.5 rounded-md transition-colors ${
                      standardTool === 'select'
                        ? 'bg-white dark:bg-[#141F32] text-teal-800 dark:text-teal-300 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                    aria-label="Select Tool"
                  >
                    <MousePointer2 className="w-3.5 h-3.5" />
                  </button>
                </Tooltip>
                <Tooltip
                  label="Pan Canvas Tool"
                  description="Click and drag to scroll freely across the canvas"
                  shortcut="Space"
                >
                  <button
                    type="button"
                    onClick={() => setStandardTool('pan')}
                    className={`p-1.5 rounded-md transition-colors ${
                      standardTool === 'pan'
                        ? 'bg-white dark:bg-[#141F32] text-teal-800 dark:text-teal-300 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                    aria-label="Pan Tool"
                  >
                    <Hand className="w-3.5 h-3.5" />
                  </button>
                </Tooltip>
                {doc.type === 'whiteboard' && (
                  <Tooltip
                    label="Freehand Sketch Pen"
                    description="Draw smooth freehand strokes and annotations on the whiteboard"
                  >
                    <button
                      type="button"
                      onClick={() => setStandardTool('pen')}
                      className={`p-1.5 rounded-md transition-colors ${
                        standardTool === 'pen'
                          ? 'bg-white dark:bg-[#141F32] text-teal-800 dark:text-teal-300 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                      aria-label="Freehand Sketch Pen"
                    >
                      <PenTool className="w-3.5 h-3.5" />
                    </button>
                  </Tooltip>
                )}
              </div>
            ) : (
              <div className="hidden lg:flex items-center gap-1 p-0.5 rounded-lg bg-slate-100 dark:bg-[#070B12] border border-slate-200/70 dark:border-slate-800">
                {(
                  [
                    ['modern', 'Modern Card View', 'Render participants with modern icon cards and HTTP endpoint tags'],
                    ['classic', 'Classic UML View', 'Render traditional UML stick actors, cylinders, and concise boxes'],
                  ] as const
                ).map(([m, label, desc]) => (
                  <Tooltip key={m} label={label} description={desc}>
                    <button
                      type="button"
                      onClick={() =>
                        doc.sequence &&
                        updateDoc({ ...doc, sequence: { ...doc.sequence, viewMode: m } }, true)
                      }
                      className={`px-2.5 py-1 text-xs font-medium rounded-md capitalize whitespace-nowrap transition-colors ${
                        doc.sequence?.viewMode === m
                          ? 'bg-white dark:bg-[#141F32] text-teal-800 dark:text-teal-300 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {m} View
                    </button>
                  </Tooltip>
                ))}
              </div>
            )}
          </div>

          {/* Right Zone: Clean, Focused Primary Actions (Full File/PWA/Settings in Hamburger Menu) */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Tooltip
              label="Save .nexora to Local Drive"
              description="Download or update your portable .nexora backup file on disk"
              shortcut="⌘S"
            >
              <button
                type="button"
                onClick={() => void handleSaveToDesktop(false)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  hasUndownloadedChanges
                    ? 'border-teal-500/60 bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-200 hover:bg-teal-100 dark:hover:bg-teal-900/60'
                    : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-teal-500/60 hover:text-teal-700 dark:hover:text-teal-300'
                }`}
              >
                <Save className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Save .nexora</span>
              </button>
            </Tooltip>

            <Tooltip
              label="Command Palette"
              description="Quickly search commands, insert components, switch themes, or export"
              shortcut="⌘K"
            >
              <button
                type="button"
                onClick={() => setCmdOpen(true)}
                className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#141F32] whitespace-nowrap shrink-0 transition-colors"
                aria-label="Open Command Palette"
              >
                <Command className="w-3.5 h-3.5" />
                <span className="font-mono text-[10px] opacity-80">⌘K</span>
              </button>
            </Tooltip>

            {!readOnly && doc.type !== 'floorplan' && (
              <Tooltip
                label="AI Diagram Assistant"
                description="Generate an editable diagram from a prompt or analyze your current design"
              >
                <button
                  type="button"
                  onClick={() => setAiOpen(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 hover:border-teal-500/60 hover:text-teal-700 dark:hover:text-teal-300 transition-colors whitespace-nowrap shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline">AI Assist</span>
                </button>
              </Tooltip>
            )}

            <Tooltip
              label="History & Snapshots"
              description="Create named version checkpoints and restore earlier states"
            >
              <button
                type="button"
                onClick={() => setHistoryDrawerOpen((v) => !v)}
                className={`p-1.5 rounded-lg shrink-0 transition-colors ${
                  historyDrawerOpen
                    ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#141F32]'
                }`}
                aria-label="History and Snapshots"
              >
                <History className="w-4 h-4" />
              </button>
            </Tooltip>

            <Tooltip
              label="Presentation Mode"
              description="Hide sidebars and toolbars for a clean full-screen review"
            >
              <button
                type="button"
                onClick={() => setPresentationMode(true)}
                className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#141F32] shrink-0 transition-colors"
                aria-label="Presentation Preview"
              >
                <Play className="w-4 h-4" />
              </button>
            </Tooltip>

            <Tooltip
              label={darkMode ? 'Switch to Light Studio' : 'Switch to Obsidian Dark'}
              description="Toggle between Crisp Light Studio and Obsidian Dark color themes"
            >
              <button
                type="button"
                onClick={onToggleDarkMode}
                className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#141F32] shrink-0 transition-colors"
                aria-label="Toggle dark mode"
              >
                {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
              </button>
            </Tooltip>

            <Tooltip
              label="Export & Import"
              description="Download crisp SVG, PNG, JSON, Mermaid, or .nexora deliverables"
              shortcut="⌘E"
            >
              <button
                type="button"
                onClick={() => setExportOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-600 text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export</span>
              </button>
            </Tooltip>
          </div>
        </header>
      )}

      {/* Persistent IndexedDB Auto-Save & Desktop Download Reminder Bar */}
      {!presentationMode && (
        <div className="shrink-0 px-3 py-1.5 bg-teal-50/75 dark:bg-[#091521] border-b border-teal-200/70 dark:border-teal-900/45 flex items-center justify-between gap-3 text-[11px] z-20">
          <div className="flex items-center gap-2 min-w-0">
            <span className="inline-flex items-center gap-1.5 font-medium text-teal-800 dark:text-teal-300 shrink-0">
              <Database className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400" />
              <span>IndexedDB: {saveState === 'Saving...' ? 'Saving...' : 'Auto-saved'}</span>
            </span>
            <span className="text-teal-400 dark:text-teal-800 shrink-0" aria-hidden="true">·</span>
            {hasUndownloadedChanges ? (
              <span className="text-amber-800 dark:text-amber-300 font-medium truncate">
                Changes are only in browser IndexedDB — remember to download a <code className="font-mono">.nexora</code> backup to your local drive.
              </span>
            ) : lastDownloadedAt ? (
              <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-300 truncate">
                <CheckCircle2 className="w-3 h-3 text-teal-600 dark:text-teal-400 shrink-0" />
                <span className="truncate">
                  Backed up ({linkedFileName ?? lastDownloadedAt}). Download a fresh <code className="font-mono">.nexora</code> copy after major edits.
                </span>
              </span>
            ) : (
              <span className="text-slate-600 dark:text-slate-300 truncate">
                Auto-stored locally in IndexedDB. Remember to download your creation as a <code className="font-mono">.nexora</code> file for permanent desktop backup.
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => void handleSaveToDesktop(false)}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors whitespace-nowrap shrink-0 ${
              hasUndownloadedChanges
                ? 'bg-teal-700 text-white hover:bg-teal-600 shadow-xs'
                : 'border border-teal-600/35 dark:border-teal-500/40 bg-white dark:bg-[#0D1422] text-teal-800 dark:text-teal-200 hover:bg-teal-50 dark:hover:bg-teal-900/40'
            }`}
          >
            <HardDriveDownload className="w-3 h-3" />
            <span>Download .nexora</span>
          </button>
        </div>
      )}

      {/* Main Workspace Area */}
      <div className="flex-1 flex min-h-0 relative">
        {/* Left Library Panel */}
        {!presentationMode && leftOpen && (
          <LeftLibraryPanel
            doc={doc}
            darkMode={darkMode}
            width={260}
            customComponents={customComponents}
            favoriteIds={favoriteIds}
            recentIds={recentIds}
            onToggleFavorite={(id) => {
              const next = favoriteIds.includes(id)
                ? favoriteIds.filter((i) => i !== id)
                : [...favoriteIds, id];
              setFavoriteIds(next);
              localStorage.setItem('pc_fav_shapes', JSON.stringify(next));
            }}
            onStartDragItem={(item) => setDraggingLibraryItem(item)}
            onEndDragItem={() => setDraggingLibraryItem(null)}
            onClickAddItem={handleClickAddLibraryItem}
            onAddCustomComponent={(comp) => {
              const created = {
                ...comp.objectTemplate,
                id: makeId('obj'),
                x: Math.round((420 - viewport.x) / viewport.zoom),
                y: Math.round((240 - viewport.y) / viewport.zoom),
                zIndex: doc.objects.length + 1,
              };
              updateDoc({ ...doc, objects: [...doc.objects, created] }, true);
              setSelectedIds([created.id]);
            }}
            onDeleteCustomComponent={onDeleteCustomComponent}
            onFocusObject={(id) => {
              const obj = doc.objects.find((o) => o.id === id);
              if (!obj) return;
              setSelectedIds([id]);
              setSelectedConnectionId(null);
              setViewport((vp) => ({
                ...vp,
                x: 420 - (obj.x + obj.width / 2) * vp.zoom,
                y: 280 - (obj.y + obj.height / 2) * vp.zoom,
              }));
            }}
            onToggleObjectVisible={(id) =>
              updateDoc(
                {
                  ...doc,
                  objects: doc.objects.map((o) => (o.id === id ? { ...o, visible: !o.visible } : o)),
                },
                true
              )
            }
            onToggleObjectLock={(id) =>
              updateDoc(
                {
                  ...doc,
                  objects: doc.objects.map((o) => (o.id === id ? { ...o, locked: !o.locked } : o)),
                },
                true
              )
            }
            onSelectSequenceParticipant={(id) => {
              setSelectedParticipantIds([id]);
              setSelectedMessageIds([]);
              setSelectedFragmentId(null);
            }}
            onSelectSequenceMessage={(id) => {
              setSelectedMessageIds([id]);
              setSelectedParticipantIds([]);
              setSelectedFragmentId(null);
            }}
            onSelectFloorItem={(it) => setSelectedFloorItems([it])}
            selectedIds={selectedIds}
          />
        )}

        {/* Central Canvas Viewport */}
        <main className="flex-1 relative min-w-0 h-full overflow-hidden">
          {/* Contextual Floating Toolbar */}
          {!readOnly && (
            <FloatingToolbar
              doc={doc}
              selectedObjects={selectedObjects}
              selectedConnectionId={selectedConnectionId}
              selectedMessageIds={selectedMessageIds}
              selectedParticipantIds={selectedParticipantIds}
              selectedFragmentId={selectedFragmentId}
              selectedFloorItems={selectedFloorItems}
              onEditLabel={() => {
                if (selectedIds.length === 1) setEditingObjectId(selectedIds[0]);
              }}
              onChangeColor={(fill, stroke, textColor) => {
                updateDoc(
                  {
                    ...doc,
                    objects: doc.objects.map((o) =>
                      selectedIds.includes(o.id)
                        ? { ...o, style: { ...o.style, fill, stroke, textColor } }
                        : o
                    ),
                  },
                  true
                );
              }}
              onReplaceShape={handleReplaceShape}
              onDuplicate={handleDuplicate}
              onDelete={handleDeleteSelection}
              onToggleLock={() => {
                if (selectedIds.length !== 1) return;
                updateDoc(
                  {
                    ...doc,
                    objects: doc.objects.map((o) =>
                      o.id === selectedIds[0] ? { ...o, locked: !o.locked } : o
                    ),
                  },
                  true
                );
              }}
              onAlignLeft={() => {
                const minX = Math.min(...selectedObjects.map((o) => o.x));
                updateDoc(
                  {
                    ...doc,
                    objects: doc.objects.map((o) =>
                      selectedIds.includes(o.id) ? { ...o, x: minX } : o
                    ),
                  },
                  true
                );
              }}
              onAlignCenter={() => {
                const avgCenter =
                  selectedObjects.reduce((s, o) => s + o.x + o.width / 2, 0) /
                  selectedObjects.length;
                updateDoc(
                  {
                    ...doc,
                    objects: doc.objects.map((o) =>
                      selectedIds.includes(o.id)
                        ? { ...o, x: Math.round(avgCenter - o.width / 2) }
                        : o
                    ),
                  },
                  true
                );
              }}
              onSaveComponent={async () => {
                if (selectedObjects.length !== 1) return;
                const obj = selectedObjects[0];
                const { id: _id, x: _x, y: _y, zIndex: _z, ...rest } = obj;
                await onSaveCustomComponent({
                  id: makeId('comp'),
                  name: obj.label,
                  diagramType: doc.type,
                  objectTemplate: structuredClone(rest),
                  createdAt: new Date().toISOString(),
                });
                showToast(`Saved "${obj.label}" to Reusable Components`);
              }}
              onChangeMessageType={(t: SequenceMessageType) => {
                if (!doc.sequence) return;
                updateDoc(
                  {
                    ...doc,
                    sequence: {
                      ...doc.sequence,
                      messages: doc.sequence.messages.map((m) =>
                        selectedMessageIds.includes(m.id) ? { ...m, type: t } : m
                      ),
                    },
                  },
                  true
                );
              }}
              onMoveMessage={(delta) => {
                if (!doc.sequence || selectedMessageIds.length !== 1) return;
                const sorted = [...doc.sequence.messages].sort((a, b) => a.order - b.order);
                const idx = sorted.findIndex((m) => m.id === selectedMessageIds[0]);
                const nextIdx = Math.max(0, Math.min(sorted.length - 1, idx + delta));
                if (idx < 0 || idx === nextIdx) return;
                const [moved] = sorted.splice(idx, 1);
                sorted.splice(nextIdx, 0, moved);
                updateDoc(
                  {
                    ...doc,
                    sequence: {
                      ...doc.sequence,
                      messages: sorted.map((m, i) => ({ ...m, order: i })),
                    },
                  },
                  true
                );
              }}
              onWrapInFragment={handleWrapInFragment}
              onFlipDoorSwing={() => {
                if (!doc.floorplan || singleFloorItem?.kind !== 'opening') return;
                updateDoc(
                  {
                    ...doc,
                    floorplan: {
                      ...doc.floorplan,
                      openings: doc.floorplan.openings.map((op) =>
                        op.id === singleFloorItem.id
                          ? { ...op, swingInward: !op.swingInward }
                          : op
                      ),
                    },
                  },
                  true
                );
              }}
              onRotateFurniture={() => {
                if (!doc.floorplan || singleFloorItem?.kind !== 'furniture') return;
                updateDoc(
                  {
                    ...doc,
                    floorplan: {
                      ...doc.floorplan,
                      furniture: doc.floorplan.furniture.map((f) =>
                        f.id === singleFloorItem.id
                          ? { ...f, rotation: (f.rotation + 45) % 360 }
                          : f
                      ),
                    },
                  },
                  true
                );
              }}
            />
          )}

          {/* Active Specialized Canvas Engine */}
          {doc.type === 'sequence' && doc.sequence ? (
            <SequenceCanvas
              doc={doc}
              darkMode={darkMode}
              viewport={viewport}
              onViewportChange={setViewport}
              selectedParticipantIds={selectedParticipantIds}
              selectedMessageIds={selectedMessageIds}
              selectedFragmentId={selectedFragmentId}
              onSelectParticipants={setSelectedParticipantIds}
              onSelectMessages={setSelectedMessageIds}
              onSelectFragment={setSelectedFragmentId}
              onUpdateDoc={updateDoc}
              readOnly={readOnly}
              svgRef={svgRef}
              draggingLibraryItem={draggingLibraryItem}
              onDropLibraryItemDone={() => setDraggingLibraryItem(null)}
            />
          ) : doc.type === 'floorplan' && doc.floorplan ? (
            <FloorPlanCanvas
              doc={doc}
              darkMode={darkMode}
              viewport={viewport}
              onViewportChange={setViewport}
              activeTool={floorTool}
              onSetTool={setFloorTool}
              selectedItems={selectedFloorItems}
              onSelectItems={setSelectedFloorItems}
              onUpdateDoc={updateDoc}
              readOnly={readOnly}
              svgRef={svgRef}
              draggingLibraryItem={draggingLibraryItem}
              onDropLibraryItemDone={() => setDraggingLibraryItem(null)}
            />
          ) : (
            <StandardCanvas
              doc={doc}
              darkMode={darkMode}
              viewport={viewport}
              onViewportChange={setViewport}
              selectedIds={selectedIds}
              selectedConnectionId={selectedConnectionId}
              onSelect={(ids, connId = null) => {
                setSelectedIds(ids);
                setSelectedConnectionId(connId ?? null);
              }}
              onUpdateDoc={updateDoc}
              activeTool={standardTool}
              showMinimap={showMinimap}
              readOnly={readOnly}
              svgRef={svgRef}
              draggingLibraryItem={draggingLibraryItem}
              onDropLibraryItemDone={() => setDraggingLibraryItem(null)}
              editingObjectId={editingObjectId}
              onSetEditingObjectId={setEditingObjectId}
            />
          )}

          {/* Presentation Mode Exit Pill */}
          {presentationMode && (
            <button
              type="button"
              onClick={() => setPresentationMode(false)}
              className="absolute top-4 right-4 z-40 flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900/90 text-white text-xs font-medium hover:bg-slate-800 shadow-lg"
            >
              <X className="w-3.5 h-3.5" />
              <span>Exit Presentation (Esc)</span>
            </button>
          )}

          {/* Bottom Canvas Toolbar */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 px-2 py-1 rounded-xl bg-white/95 dark:bg-[#0C121E]/95 backdrop-blur border border-slate-200/90 dark:border-slate-800 shadow-lg">
            {!presentationMode && (
              <Tooltip
                label={leftOpen ? 'Hide Component Library' : 'Show Component Library'}
                description="Toggle the left stencil library and outline drawer"
                side="top"
              >
                <button
                  type="button"
                  onClick={() => setLeftOpen((v) => !v)}
                  className={`p-1.5 rounded-md ${
                    leftOpen
                      ? 'text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60'
                      : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <PanelLeft className="w-3.5 h-3.5" />
                </button>
              </Tooltip>
            )}

            <Tooltip
              label="Zoom Out"
              description="Decrease canvas magnification"
              shortcut="Ctrl −"
              side="top"
            >
              <button
                type="button"
                onClick={() =>
                  setViewport((vp) => ({ ...vp, zoom: Math.max(0.25, vp.zoom - 0.12) }))
                }
                className="p-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
            </Tooltip>
            <Tooltip
              label="Reset Zoom to 100%"
              description="Return viewport to 1:1 scale"
              shortcut="Ctrl 0"
              side="top"
            >
              <button
                type="button"
                onClick={() => setViewport({ x: 48, y: 36, zoom: 1 })}
                className="px-2 py-1 text-xs font-mono tabular-nums text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md min-w-[48px]"
              >
                {Math.round(viewport.zoom * 100)}%
              </button>
            </Tooltip>
            <Tooltip
              label="Zoom In"
              description="Increase canvas magnification"
              shortcut="Ctrl +"
              side="top"
            >
              <button
                type="button"
                onClick={() =>
                  setViewport((vp) => ({ ...vp, zoom: Math.min(2.8, vp.zoom + 0.12) }))
                }
                className="p-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </Tooltip>
            <Tooltip
              label="Fit to Screen"
              description="Auto-center and scale the full design to fit the viewport"
              side="top"
            >
              <button
                type="button"
                onClick={handleFitToScreen}
                className="p-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </Tooltip>

            <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-0.5" />

            <Tooltip
              label={doc.settings.showGrid ? 'Hide Grid' : 'Show Grid'}
              description="Toggle the visual alignment grid background"
              side="top"
            >
              <button
                type="button"
                onClick={() =>
                  updateDoc(
                    { ...doc, settings: { ...doc.settings, showGrid: !doc.settings.showGrid } },
                    false
                  )
                }
                className={`p-1.5 rounded-md ${
                  doc.settings.showGrid
                    ? 'text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60'
                    : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
              </button>
            </Tooltip>

            <Tooltip
              label={doc.settings.snapToGrid ? 'Disable Snap to Grid' : 'Enable Snap to Grid'}
              description="Magnetically align dragged elements to grid increments"
              side="top"
            >
              <button
                type="button"
                onClick={() =>
                  updateDoc(
                    { ...doc, settings: { ...doc.settings, snapToGrid: !doc.settings.snapToGrid } },
                    false
                  )
                }
                className={`p-1.5 rounded-md ${
                  doc.settings.snapToGrid
                    ? 'text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60'
                    : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Magnet className="w-3.5 h-3.5" />
              </button>
            </Tooltip>

            {doc.type !== 'sequence' && doc.type !== 'floorplan' && (
              <Tooltip
                label={showMinimap ? 'Hide Mini-Map' : 'Show Mini-Map'}
                description="Toggle the corner overview map for large diagrams"
                side="top"
              >
                <button
                  type="button"
                  onClick={() => setShowMinimap((m) => !m)}
                  className={`p-1.5 rounded-md ${
                    showMinimap
                      ? 'text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60'
                      : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <MapIcon className="w-3.5 h-3.5" />
                </button>
              </Tooltip>
            )}

            <Tooltip
              label="Keyboard Shortcuts"
              description="View all editor hotkeys and navigation controls"
              shortcut="?"
              side="top"
            >
              <button
                type="button"
                onClick={() => setShortcutsOpen(true)}
                className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Keyboard className="w-3.5 h-3.5" />
              </button>
            </Tooltip>

            {!presentationMode && (
              <Tooltip
                label={rightOpen ? 'Hide Inspector Panel' : 'Show Inspector Panel'}
                description="Toggle the right properties, styling, and auto-layout inspector"
                side="top"
              >
                <button
                  type="button"
                  onClick={() => setRightOpen((v) => !v)}
                  className={`p-1.5 rounded-md ${
                    rightOpen
                      ? 'text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60'
                      : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <PanelRight className="w-3.5 h-3.5" />
                </button>
              </Tooltip>
            )}
          </div>

          {/* Subtle Toast Feedback */}
          {toast && (
            <div className="absolute bottom-16 right-4 z-40 px-3.5 py-2 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-medium shadow-lg">
              {toast}
            </div>
          )}
        </main>

        {/* Right Properties Panel */}
        {!presentationMode && rightOpen && (
          <RightPropertiesPanel
            doc={doc}
            selectedObject={selectedObjects.length === 1 ? selectedObjects[0] : null}
            selectedConnection={selectedConnection}
            selectedParticipantId={singleParticipantId}
            selectedMessageIds={selectedMessageIds}
            selectedFragmentId={selectedFragmentId}
            selectedFloorItem={singleFloorItem}
            onUpdateDoc={updateDoc}
            onApplyLayout={(dir: LayoutDirection) => {
              const laidOut = applyAutoLayout(
                doc,
                dir,
                selectedIds.length > 1 ? selectedIds : undefined
              );
              updateDoc(laidOut, true);
              showToast(`Applied ${dir} Auto-Layout`);
            }}
            onFocusObject={(id) => {
              const obj = doc.objects.find((o) => o.id === id);
              if (!obj) return;
              setSelectedIds([id]);
              setSelectedConnectionId(null);
              setViewport((vp) => ({
                ...vp,
                x: 420 - (obj.x + obj.width / 2) * vp.zoom,
                y: 280 - (obj.y + obj.height / 2) * vp.zoom,
              }));
            }}
            onSaveAsTemplate={handlePromptSaveAsTemplate}
            readOnly={readOnly}
          />
        )}

        {/* Version History Slide-over */}
        {historyDrawerOpen && !presentationMode && (
          <div className="absolute right-0 top-0 bottom-0 w-72 z-40 bg-white dark:bg-[#0C121E] border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800/80">
              <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                History &amp; Snapshots
              </h3>
              <button
                type="button"
                onClick={() => setHistoryDrawerOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-3 border-b border-slate-100 dark:border-slate-800/80">
              <button
                type="button"
                disabled={readOnly}
                onClick={handleCreateSnapshot}
                className="w-full py-2 px-3 rounded-lg bg-teal-700 text-white text-xs font-medium hover:bg-teal-600 disabled:opacity-50 transition-colors"
              >
                Create Named Snapshot
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {(doc.snapshots ?? []).length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-6">
                  No saved snapshots yet. Create a version snapshot before major structural changes.
                </p>
              ) : (
                (doc.snapshots ?? []).map((snap) => (
                  <div
                    key={snap.id}
                    className="p-3 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-[#111928] space-y-1.5"
                  >
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                      {snap.label}
                    </div>
                    <div className="text-[11px] font-mono text-slate-400">
                      {new Date(snap.createdAt).toLocaleString()}
                    </div>
                    {!readOnly && (
                      <button
                        type="button"
                        onClick={() => {
                          updateDoc({ ...snap.document, snapshots: doc.snapshots }, true);
                          showToast(`Restored ${snap.label}`);
                        }}
                        className="flex items-center gap-1 text-xs font-medium text-teal-700 dark:text-teal-400 hover:underline pt-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Restore version</span>
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <CommandPalette
        open={cmdOpen}
        onClose={() => setCmdOpen(false)}
        doc={doc}
        darkMode={darkMode}
        onToggleDarkMode={onToggleDarkMode}
        onAddLibraryItem={handleClickAddLibraryItem}
        onApplyLayout={(dir) => {
          updateDoc(applyAutoLayout(doc, dir), true);
          showToast(`Applied ${dir} Auto-Layout`);
        }}
        onChangeTheme={(theme: DiagramThemeId) =>
          updateDoc({ ...doc, settings: { ...doc.settings, theme } }, true)
        }
        onOpenExport={() => setExportOpen(true)}
        onSaveToDesktop={() => void handleSaveToDesktop(false)}
        onOpenDesktopFile={() => void handleOpenDesktopFile()}
        onClearCanvas={handleClearCurrentCanvas}
        onOpenNewDesignModal={() => setNewClearOpen(true)}
        onOpenAi={() => setAiOpen(true)}
        onFocusObject={(id) => {
          const obj = doc.objects.find((o) => o.id === id);
          if (!obj) return;
          setSelectedIds([id]);
          setViewport((vp) => ({
            ...vp,
            x: 420 - (obj.x + obj.width / 2) * vp.zoom,
            y: 280 - (obj.y + obj.height / 2) * vp.zoom,
          }));
        }}
      />

      <ExportImportModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        doc={doc}
        darkMode={darkMode}
        svgRef={svgRef}
        onImportDocument={(imported) => {
          onImportNewDiagram(imported);
          showToast(`Imported "${imported.title}"`);
        }}
      />

      <AiStudioModal
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        doc={doc}
        onApplyGeneratedDoc={(nextDoc) => {
          updateDoc(nextDoc, true);
          showToast('Generated editable diagram (Cmd+Z to undo)');
          setTimeout(handleFitToScreen, 120);
        }}
      />

      {/* New File / New from Template / Clear Canvas Modal */}
      <NewDesignModal
        open={newClearOpen}
        initialTab={newModalTab}
        onClose={() => setNewClearOpen(false)}
        customTemplates={customTemplates}
        onCreateBlank={onStartNewDesign}
        onUseTemplate={onUseTemplate}
        onDeleteCustomTemplate={(id) => void onDeleteCustomTemplate(id)}
        activeDocTitle={doc.title}
        activeDocTypeName={typeMeta.name}
        hasUndownloadedChanges={hasUndownloadedChanges}
        onClearCurrentCanvas={readOnly ? undefined : handleClearCurrentCanvas}
        onDownloadBackup={() => void handleSaveToDesktop(false)}
      />

      {/* Save Current Design as Reusable Template Modal */}
      {saveTemplateOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-4"
          onMouseDown={() => setSaveTemplateOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white dark:bg-[#0D1422] border border-slate-200 dark:border-slate-800/90 shadow-2xl overflow-hidden nx-menu-enter"
            onMouseDown={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Save Design as Template"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/60 border border-teal-200/80 dark:border-teal-800/70 flex items-center justify-center text-teal-700 dark:text-teal-400">
                  <BookmarkPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
                    Save Design as Template
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Reuse this {typeMeta.shortName.toLowerCase()} layout anytime via New from Template
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSaveTemplateOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form
              className="p-5 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                void handleConfirmSaveAsTemplate();
              }}
            >
              <label className="block">
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Template Name
                </span>
                <input
                  autoFocus
                  type="text"
                  value={templateNameInput}
                  onChange={(e) => setTemplateNameInput(e.target.value)}
                  placeholder="e.g. Multi-Region AWS Architecture"
                  className="mt-1.5 w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-[#080D16] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500"
                />
              </label>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setSaveTemplateOpen(false)}
                  className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#141F32]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-teal-700 hover:bg-teal-600 text-white text-xs font-semibold transition-colors"
                >
                  Save Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Help Modal */}
      {shortcutsOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-4"
          onMouseDown={() => setShortcutsOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white dark:bg-[#0D1422] border border-slate-200 dark:border-slate-800/90 shadow-2xl p-5 space-y-4 nx-menu-enter"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
                Nexora Keyboard Shortcuts
              </h3>
              <button
                type="button"
                onClick={() => setShortcutsOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2 text-xs">
              {[
                ['Download Design to Desktop (.nexora)', '⌘ / Ctrl + S'],
                ['Open Design File (.nexora / .pcanvas)', '⌘ / Ctrl + O'],
                ['Universal Command Palette', '⌘ / Ctrl + K'],
                ['Undo / Redo', '⌘Z / ⌘⇧Z'],
                ['Marquee Multi-Select', 'Drag on Canvas'],
                ['Select All Items', '⌘ / Ctrl + A'],
                ['Duplicate Selected', '⌘ / Ctrl + D'],
                ['Export Diagram', '⌘ / Ctrl + E'],
                ['Pan Canvas', 'Space + Drag'],
                ['Zoom Around Pointer', 'Mouse Wheel'],
                ['Nudge Selected Objects', 'Arrow Keys (Shift = 20px)'],
                ['Reorder Sequence Message', 'Alt + ↑ / ↓'],
                ['Edit Object or Message Label', 'Double-click'],
                ['Delete Selected Items', 'Backspace / Delete'],
              ].map(([desc, keys]) => (
                <div
                  key={desc}
                  className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/80 last:border-0"
                >
                  <span className="text-slate-600 dark:text-slate-300">{desc}</span>
                  <kbd className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-[#141F32] text-slate-700 dark:text-slate-200 border border-slate-200/70 dark:border-slate-700/70">
                    {keys}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Leave Design / Return to Home Confirmation Modal */}
      {leaveModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-4"
          onMouseDown={() => {
            if (!leavingBusy) setLeaveModalOpen(false);
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white dark:bg-[#0D1422] border border-slate-200 dark:border-slate-800/90 shadow-2xl overflow-hidden nx-menu-enter"
            onMouseDown={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Save or discard design before returning home"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800/80">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/60 border border-teal-200/80 dark:border-teal-800/70 flex items-center justify-center text-teal-700 dark:text-teal-400 shrink-0">
                  <ArrowLeft className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white truncate">
                    {isNewDesign ? 'Leaving New Design' : 'Return to Nexora Home'}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    Choose how to handle "{doc.title || 'Untitled Design'}"
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={leavingBusy}
                onClick={() => setLeaveModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-40"
                aria-label="Continue editing"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-2.5">
              {/* Option 1: Persist in IndexedDB */}
              <button
                type="button"
                disabled={leavingBusy}
                onClick={() => void handleLeavePersistIndexedDb()}
                className="w-full text-left flex items-start gap-3 p-3.5 rounded-xl border border-teal-200/90 dark:border-teal-800/70 bg-teal-50/70 dark:bg-teal-950/35 hover:bg-teal-50 dark:hover:bg-teal-950/55 transition-colors disabled:opacity-50"
              >
                <div className="w-8 h-8 rounded-lg bg-teal-700 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <Database className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-slate-900 dark:text-white">
                    Persist in IndexedDB
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                    Keep this design stored in your browser workspace so it stays available in Recent Creations.
                  </p>
                </div>
              </button>

              {/* Option 2: Download Locally (.nexora) */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#080D16] overflow-hidden">
                <button
                  type="button"
                  disabled={leavingBusy}
                  onClick={() => void handleLeaveDownloadLocal()}
                  className="w-full text-left flex items-start gap-3 p-3.5 hover:bg-slate-100/80 dark:hover:bg-[#141F32]/70 transition-colors disabled:opacity-50"
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-900 dark:bg-[#141F32] text-white dark:text-teal-300 border border-slate-700/60 flex items-center justify-center shrink-0 mt-0.5">
                    <HardDriveDownload className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-slate-900 dark:text-white">
                      Download Locally (.nexora)
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                      {keepInIndexedDbAfterDownload
                        ? 'Save a .nexora file to your drive and keep a copy in Recent Creations.'
                        : 'Save a .nexora file to your drive only and clear it from Recent Creations.'}
                    </p>
                  </div>
                </button>
                <label className="flex items-center gap-2 px-3.5 py-2 border-t border-slate-200/80 dark:border-slate-800/80 text-[11px] text-slate-600 dark:text-slate-400 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={keepInIndexedDbAfterDownload}
                    disabled={leavingBusy}
                    onChange={(e) => setKeepInIndexedDbAfterDownload(e.target.checked)}
                    className="rounded border-slate-300 dark:border-slate-700 accent-teal-600"
                  />
                  <span>Also keep in browser IndexedDB (Recent Creations)</span>
                </label>
              </div>

              {/* Option 3: Delete & Clear Design */}
              <button
                type="button"
                disabled={leavingBusy}
                onClick={() => void handleLeaveDiscardDesign()}
                className="w-full text-left flex items-start gap-3 p-3.5 rounded-xl border border-rose-200/80 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/25 hover:bg-rose-50 dark:hover:bg-rose-950/45 transition-colors disabled:opacity-50"
              >
                <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-rose-700 dark:text-rose-300">
                    Delete &amp; Clear Design
                  </div>
                  <p className="text-[11px] text-rose-700/80 dark:text-rose-300/75 mt-0.5 leading-relaxed">
                    Remove this design completely so it will not appear in Recent Creations.
                  </p>
                </div>
              </button>
            </div>

            <div className="flex items-center justify-end px-5 py-3 bg-slate-50/80 dark:bg-[#080D16] border-t border-slate-200 dark:border-slate-800/80">
              <button
                type="button"
                disabled={leavingBusy}
                onClick={() => setLeaveModalOpen(false)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-[#141F32] transition-colors disabled:opacity-50"
              >
                Continue Editing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
