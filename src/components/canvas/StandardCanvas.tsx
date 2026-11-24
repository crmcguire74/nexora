import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  DiagramConnection,
  DiagramDocument,
  DiagramObject,
  PortSide,
  ViewportState,
} from '../../types/diagram';
import {
  adaptFillForDark,
  adaptTextForDark,
  DIAGRAM_THEMES,
  liftStrokeForDark,
} from '../../engine/themes';
import {
  AlignmentGuide,
  buildConnectorPath,
  computeSmartSnap,
  getPortPoint,
} from '../../engine/geometry';
import { createObjectFromLibraryItem, LibraryItem } from '../../engine/libraries';
import { makeId } from '../../engine/templates';
import {
  DiagramObjectIconPaths,
  hasCanvasInlineIcon,
  isIconNativeObjectType,
} from '../icons/ShapeIcons';

interface StandardCanvasProps {
  doc: DiagramDocument;
  darkMode: boolean;
  viewport: ViewportState;
  onViewportChange: (vp: ViewportState) => void;
  selectedIds: string[];
  selectedConnectionId: string | null;
  onSelect: (ids: string[], connectionId?: string | null) => void;
  onUpdateDoc: (next: DiagramDocument, recordHistory?: boolean) => void;
  activeTool: 'select' | 'pan' | 'pen';
  showMinimap: boolean;
  readOnly?: boolean;
  svgRef: React.RefObject<SVGSVGElement | null>;
  draggingLibraryItem: LibraryItem | null;
  onDropLibraryItemDone: () => void;
  editingObjectId: string | null;
  onSetEditingObjectId: (id: string | null) => void;
}

const RAPID_FLOW_CHOICES: Array<{
  type: string;
  label: string;
  fill: string;
  stroke: string;
  textColor: string;
  w: number;
  h: number;
  radius: number;
}> = [
  { type: 'process', label: 'Process', fill: '#FFFFFF', stroke: '#2563EB', textColor: '#0F172A', w: 168, h: 66, radius: 10 },
  { type: 'decision', label: 'Decision?', fill: '#FFFBEB', stroke: '#D97706', textColor: '#78350F', w: 152, h: 96, radius: 4 },
  { type: 'io', label: 'Input / Output', fill: '#F0F9FF', stroke: '#0284C7', textColor: '#0C4A6E', w: 168, h: 64, radius: 6 },
  { type: 'database', label: 'Database', fill: '#F0FDFA', stroke: '#0D9488', textColor: '#134E4A', w: 144, h: 80, radius: 8 },
  { type: 'start', label: 'End', fill: '#ECFDF5', stroke: '#16A34A', textColor: '#14532D', w: 152, h: 54, radius: 27 },
];

export const StandardCanvas: React.FC<StandardCanvasProps> = ({
  doc,
  darkMode,
  viewport,
  onViewportChange,
  selectedIds,
  selectedConnectionId,
  onSelect,
  onUpdateDoc,
  activeTool,
  showMinimap,
  readOnly = false,
  svgRef,
  draggingLibraryItem,
  onDropLibraryItemDone,
  editingObjectId,
  onSetEditingObjectId,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [spacePressed, setSpacePressed] = useState(false);
  const [hoveredObjId, setHoveredObjId] = useState<string | null>(null);
  const [guides, setGuides] = useState<AlignmentGuide[]>([]);
  const [highlightContainerId, setHighlightContainerId] = useState<string | null>(null);

  // Interactive gesture states
  const [panState, setPanState] = useState<{ startX: number; startY: number; vpX: number; vpY: number } | null>(null);
  const [dragState, setDragState] = useState<{
    ids: string[];
    startWorldX: number;
    startWorldY: number;
    initialPositions: Record<string, { x: number; y: number }>;
    hasMoved: boolean;
  } | null>(null);
  const [resizeState, setResizeState] = useState<{
    id: string;
    handle: 'nw' | 'ne' | 'sw' | 'se';
    startWorldX: number;
    startWorldY: number;
    orig: { x: number; y: number; width: number; height: number };
  } | null>(null);
  const [marquee, setMarquee] = useState<{
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    additive: boolean;
  } | null>(null);
  const [connecting, setConnecting] = useState<{
    fromId: string;
    fromPort: Exclude<PortSide, 'auto'>;
    currX: number;
    currY: number;
  } | null>(null);
  const [freehandPoints, setFreehandPoints] = useState<Array<{ x: number; y: number }> | null>(null);
  const [editingConnId, setEditingConnId] = useState<string | null>(null);
  const [rapidPicker, setRapidPicker] = useState<{
    sourceId: string;
    side: Exclude<PortSide, 'auto'>;
    x: number;
    y: number;
  } | null>(null);
  const [dropPreviewPos, setDropPreviewPos] = useState<{ x: number; y: number } | null>(null);

  const theme = DIAGRAM_THEMES[doc.settings.theme] ?? DIAGRAM_THEMES.modern;
  const isBlueprint = doc.settings.theme === 'blueprint';
  const canvasBg = darkMode ? theme.canvasBgDark : theme.canvasBgLight;
  const gridColor = darkMode ? theme.gridColorDark : theme.gridColorLight;
  const selectionAccent = darkMode ? '#14B8A6' : '#0D9488';

  // Keep doc ref fresh during rapid mousemove
  const docRef = useRef(doc);
  docRef.current = doc;

  const screenToWorld = useCallback(
    (clientX: number, clientY: number) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return { x: 0, y: 0 };
      return {
        x: (clientX - rect.left - viewport.x) / viewport.zoom,
        y: (clientY - rect.top - viewport.y) / viewport.zoom,
      };
    },
    [viewport]
  );

  // Spacebar pan shortcut & Escape cancel
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        setSpacePressed(true);
      }
      if (e.key === 'Escape') {
        setConnecting(null);
        setRapidPicker(null);
        setMarquee(null);
        setDropPreviewPos(null);
        onSetEditingObjectId(null);
        setEditingConnId(null);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') setSpacePressed(false);
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [onSetEditingObjectId]);

  // Wheel zoom around pointer
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      if (e.ctrlKey || e.metaKey || Math.abs(e.deltaY) >= 4) {
        const zoomFactor = e.deltaY < 0 ? 1.09 : 0.92;
        const nextZoom = Math.min(2.8, Math.max(0.25, viewport.zoom * zoomFactor));
        const worldX = (mouseX - viewport.x) / viewport.zoom;
        const worldY = (mouseY - viewport.y) / viewport.zoom;
        onViewportChange({
          zoom: nextZoom,
          x: mouseX - worldX * nextZoom,
          y: mouseY - worldY * nextZoom,
        });
      }
    },
    [viewport, onViewportChange]
  );

  // Sorted objects: containers behind normal shapes
  const visibleObjects = useMemo(() => {
    const visibleLayerIds = new Set(doc.layers.filter((l) => l.visible).map((l) => l.id));
    const env = doc.settings.activeEnvironment ?? 'all';
    return [...doc.objects]
      .filter((o) => o.visible && (visibleLayerIds.size === 0 || visibleLayerIds.has(o.layerId)))
      .filter((o) => {
        if (doc.type !== 'architecture' || env === 'all') return true;
        return !o.metadata.environment || o.metadata.environment === env;
      })
      .sort((a, b) => {
        const ca = a.category === 'container' ? 0 : 1;
        const cb = b.category === 'container' ? 0 : 1;
        if (ca !== cb) return ca - cb;
        return a.zIndex - b.zIndex;
      });
  }, [doc.objects, doc.layers, doc.settings.activeEnvironment, doc.type]);

  const objectMap = useMemo(() => new Map(doc.objects.map((o) => [o.id, o])), [doc.objects]);

  // Start canvas background pointer down (pan / marquee / freehand)
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || activeTool === 'pan' || spacePressed) {
      e.preventDefault();
      setPanState({ startX: e.clientX, startY: e.clientY, vpX: viewport.x, vpY: viewport.y });
      return;
    }

    if (readOnly) return;

    setRapidPicker(null);
    onSetEditingObjectId(null);
    setEditingConnId(null);

    const pt = screenToWorld(e.clientX, e.clientY);

    if (activeTool === 'pen') {
      setFreehandPoints([pt]);
      return;
    }

    if (!e.shiftKey) {
      onSelect([], null);
    }
    setMarquee({ x1: pt.x, y1: pt.y, x2: pt.x, y2: pt.y, additive: e.shiftKey });
  };

  // Helper to initiate dragging a set of selected objects from any point
  const startGroupDrag = (clientX: number, clientY: number, idsToDrag: string[]) => {
    const worldPt = screenToWorld(clientX, clientY);
    const dragIds = new Set(idsToDrag);
    for (const id of idsToDrag) {
      const target = objectMap.get(id);
      if (target?.category === 'container') {
        doc.objects.forEach((child) => {
          if (child.parentId === target.id && !child.locked) dragIds.add(child.id);
        });
      }
    }

    const initialPositions: Record<string, { x: number; y: number }> = {};
    dragIds.forEach((id) => {
      const o = objectMap.get(id);
      if (o && !o.locked) initialPositions[id] = { x: o.x, y: o.y };
    });

    if (Object.keys(initialPositions).length === 0) return;

    setDragState({
      ids: Object.keys(initialPositions),
      startWorldX: worldPt.x,
      startWorldY: worldPt.y,
      initialPositions,
      hasMoved: false,
    });
  };

  // Start dragging an object
  const handleObjectMouseDown = (e: React.MouseEvent, obj: DiagramObject) => {
    e.stopPropagation();
    if (e.button === 1 || activeTool === 'pan' || spacePressed) {
      setPanState({ startX: e.clientX, startY: e.clientY, vpX: viewport.x, vpY: viewport.y });
      return;
    }

    setRapidPicker(null);
    setEditingConnId(null);

    // Clicking inside the open interior of an unselected container starts a marquee box
    // so users can easily drag-select multiple items inside VPCs / Cloud Zones / Frames.
    if (obj.category === 'container' && !selectedIds.includes(obj.id) && !e.shiftKey && !readOnly) {
      const pt = screenToWorld(e.clientX, e.clientY);
      const localX = pt.x - obj.x;
      const localY = pt.y - obj.y;
      const onHeader = obj.type === 'swimlane' ? localX <= 42 : localY <= 44;
      const onBorder =
        localX <= 14 || localX >= obj.width - 14 || localY <= 14 || localY >= obj.height - 14;
      if (!onHeader && !onBorder) {
        onSelect([], null);
        setMarquee({ x1: pt.x, y1: pt.y, x2: pt.x, y2: pt.y, additive: false });
        return;
      }
    }

    let nextSelection = selectedIds;
    if (e.shiftKey) {
      nextSelection = selectedIds.includes(obj.id)
        ? selectedIds.filter((id) => id !== obj.id)
        : [...selectedIds, obj.id];
      onSelect(nextSelection, null);
    } else if (!selectedIds.includes(obj.id)) {
      nextSelection = [obj.id];
      onSelect(nextSelection, null);
    }

    if (readOnly || obj.locked) return;
    startGroupDrag(e.clientX, e.clientY, nextSelection);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (panState) {
      onViewportChange({
        ...viewport,
        x: panState.vpX + (e.clientX - panState.startX),
        y: panState.vpY + (e.clientY - panState.startY),
      });
      return;
    }

    const worldPt = screenToWorld(e.clientX, e.clientY);

    if (freehandPoints) {
      setFreehandPoints((prev) => (prev ? [...prev, worldPt] : null));
      return;
    }

    if (connecting) {
      setConnecting((prev) => (prev ? { ...prev, currX: worldPt.x, currY: worldPt.y } : null));
      return;
    }

    if (marquee) {
      setMarquee((prev) => (prev ? { ...prev, x2: worldPt.x, y2: worldPt.y } : null));
      return;
    }

    if (resizeState) {
      const dx = worldPt.x - resizeState.startWorldX;
      const dy = worldPt.y - resizeState.startWorldY;
      const { orig, handle } = resizeState;
      const minW = 84;
      const minH = 44;
      let x = orig.x;
      let y = orig.y;
      let width = orig.width;
      let height = orig.height;

      if (handle.includes('e')) width = Math.max(minW, orig.width + dx);
      if (handle.includes('s')) height = Math.max(minH, orig.height + dy);
      if (handle.includes('w')) {
        const nextW = Math.max(minW, orig.width - dx);
        x = orig.x + (orig.width - nextW);
        width = nextW;
      }
      if (handle.includes('n')) {
        const nextH = Math.max(minH, orig.height - dy);
        y = orig.y + (orig.height - nextH);
        height = nextH;
      }

      const grid = doc.settings.snapToGrid ? doc.settings.gridSize : 1;
      const nextObjects = doc.objects.map((o) =>
        o.id === resizeState.id
          ? {
              ...o,
              x: Math.round(x / grid) * grid,
              y: Math.round(y / grid) * grid,
              width: Math.round(width / grid) * grid,
              height: Math.round(height / grid) * grid,
            }
          : o
      );
      onUpdateDoc({ ...doc, objects: nextObjects }, false);
      return;
    }

    if (dragState) {
      let dx = worldPt.x - dragState.startWorldX;
      let dy = worldPt.y - dragState.startWorldY;
      if (!dragState.hasMoved && Math.hypot(dx, dy) < 2) return;

      const primaryId = dragState.ids[0];
      const primaryInit = dragState.initialPositions[primaryId];
      const primaryObj = objectMap.get(primaryId);

      let nextGuides: AlignmentGuide[] = [];
      if (primaryObj && primaryInit) {
        let candidateX = primaryInit.x + dx;
        let candidateY = primaryInit.y + dy;

        if (doc.settings.showSmartGuides && dragState.ids.length === 1) {
          const others = doc.objects.filter(
            (o) => !dragState.ids.includes(o.id) && o.category !== 'container'
          );
          const snap = computeSmartSnap(
            { x: candidateX, y: candidateY, width: primaryObj.width, height: primaryObj.height },
            others,
            7
          );
          candidateX = snap.snappedX;
          candidateY = snap.snappedY;
          nextGuides = snap.guides;
        }

        if (doc.settings.snapToGrid && nextGuides.length === 0) {
          const g = doc.settings.gridSize;
          candidateX = Math.round(candidateX / g) * g;
          candidateY = Math.round(candidateY / g) * g;
        }

        dx = candidateX - primaryInit.x;
        dy = candidateY - primaryInit.y;

        // Detect container drop target for non-containers
        if (primaryObj.category !== 'container') {
          const cx = candidateX + primaryObj.width / 2;
          const cy = candidateY + primaryObj.height / 2;
          const container = doc.objects.find(
            (c) =>
              c.category === 'container' &&
              c.id !== primaryObj.id &&
              cx >= c.x &&
              cx <= c.x + c.width &&
              cy >= c.y &&
              cy <= c.y + c.height
          );
          setHighlightContainerId(container?.id ?? null);
        }
      }

      setGuides(nextGuides);
      setDragState((prev) => (prev ? { ...prev, hasMoved: true } : null));

      const nextObjects = doc.objects.map((o) => {
        const init = dragState.initialPositions[o.id];
        if (!init) return o;
        return { ...o, x: Math.round(init.x + dx), y: Math.round(init.y + dy) };
      });
      onUpdateDoc({ ...doc, objects: nextObjects }, false);
    }
  };

  const handleMouseUp = () => {
    if (panState) {
      setPanState(null);
      return;
    }

    if (freehandPoints) {
      if (freehandPoints.length > 2) {
        const minX = Math.min(...freehandPoints.map((p) => p.x));
        const minY = Math.min(...freehandPoints.map((p) => p.y));
        const maxX = Math.max(...freehandPoints.map((p) => p.x));
        const maxY = Math.max(...freehandPoints.map((p) => p.y));
        const relPoints = freehandPoints.map((p) => ({ x: p.x - minX, y: p.y - minY }));
        const newStroke: DiagramObject = {
          id: makeId('ink'),
          type: 'freehand',
          category: 'freehand',
          label: 'Sketch',
          x: minX,
          y: minY,
          width: Math.max(12, maxX - minX),
          height: Math.max(12, maxY - minY),
          rotation: 0,
          layerId: 'layer-main',
          zIndex: doc.objects.length + 1,
          visible: true,
          locked: false,
          style: {
            fill: 'none',
            stroke: darkMode ? '#2DD4BF' : '#0F766E',
            strokeWidth: 2.5,
            textColor: '#0F172A',
            fontSize: 13,
            borderRadius: 0,
            opacity: 1,
          },
          metadata: { points: relPoints },
        };
        onUpdateDoc({ ...doc, objects: [...doc.objects, newStroke] }, true);
      }
      setFreehandPoints(null);
      return;
    }

    if (connecting) {
      // Find object under endpoint
      const target = [...visibleObjects]
        .reverse()
        .find(
          (o) =>
            o.id !== connecting.fromId &&
            o.category !== 'container' &&
            connecting.currX >= o.x - 10 &&
            connecting.currX <= o.x + o.width + 10 &&
            connecting.currY >= o.y - 10 &&
            connecting.currY <= o.y + o.height + 10
        );
      if (target) {
        const newConn: DiagramConnection = {
          id: makeId('conn'),
          fromId: connecting.fromId,
          toId: target.id,
          fromPort: connecting.fromPort,
          toPort: 'auto',
          routing: 'orthogonal',
          lineStyle: 'solid',
          color: darkMode ? theme.connectorDark : theme.connectorLight,
          strokeWidth: 1.75,
          arrowStart: 'none',
          arrowEnd: doc.type === 'erd' ? 'crow' : 'arrow',
        };
        onUpdateDoc({ ...doc, connections: [...doc.connections, newConn] }, true);
        onSelect([], newConn.id);
      }
      setConnecting(null);
      return;
    }

    if (marquee) {
      const minX = Math.min(marquee.x1, marquee.x2);
      const maxX = Math.max(marquee.x1, marquee.x2);
      const minY = Math.min(marquee.y1, marquee.y2);
      const maxY = Math.max(marquee.y1, marquee.y2);
      if (maxX - minX > 6 || maxY - minY > 6) {
        const hitShapes = visibleObjects
          .filter(
            (o) =>
              o.category !== 'container' &&
              o.x + o.width >= minX &&
              o.x <= maxX &&
              o.y + o.height >= minY &&
              o.y <= maxY
          )
          .map((o) => o.id);

        // Include containers that are fully enclosed inside the marquee box
        const hitContainers = visibleObjects
          .filter(
            (o) =>
              o.category === 'container' &&
              o.x >= minX &&
              o.x + o.width <= maxX &&
              o.y >= minY &&
              o.y + o.height <= maxY
          )
          .map((o) => o.id);

        const combinedHits = [...hitShapes, ...hitContainers];
        const nextIds = marquee.additive
          ? Array.from(new Set([...selectedIds, ...combinedHits]))
          : combinedHits;
        onSelect(nextIds, null);
      }
      setMarquee(null);
      return;
    }

    if (resizeState) {
      setResizeState(null);
      onUpdateDoc(docRef.current, true);
      return;
    }

    if (dragState) {
      const wasMoved = dragState.hasMoved;
      const movedIds = dragState.ids;
      setDragState(null);
      setGuides([]);
      setHighlightContainerId(null);

      if (wasMoved) {
        // Assign parentId if dragged inside/outside a container
        const nextObjects = docRef.current.objects.map((o) => {
          if (!movedIds.includes(o.id) || o.category === 'container') return o;
          const cx = o.x + o.width / 2;
          const cy = o.y + o.height / 2;
          const container = docRef.current.objects.find(
            (c) =>
              c.category === 'container' &&
              c.id !== o.id &&
              cx >= c.x &&
              cx <= c.x + c.width &&
              cy >= c.y &&
              cy <= c.y + c.height
          );
          return { ...o, parentId: container?.id };
        });
        onUpdateDoc({ ...docRef.current, objects: nextObjects }, true);
      }
    }
  };

  // Drag and Drop from Library Panel
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggingLibraryItem) return;
    const pt = screenToWorld(e.clientX, e.clientY);
    setDropPreviewPos(pt);
    const container = doc.objects.find(
      (c) =>
        c.category === 'container' &&
        pt.x >= c.x &&
        pt.x <= c.x + c.width &&
        pt.y >= c.y &&
        pt.y <= c.y + c.height
    );
    setHighlightContainerId(container?.id ?? null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const rawItem = draggingLibraryItem;
    setDropPreviewPos(null);
    setHighlightContainerId(null);
    if (!rawItem || readOnly) return;

    const pt = screenToWorld(e.clientX, e.clientY);
    const g = doc.settings.snapToGrid ? doc.settings.gridSize : 1;
    const snappedX = Math.round(pt.x / g) * g;
    const snappedY = Math.round(pt.y / g) * g;
    const maxZ = doc.objects.reduce((m, o) => Math.max(m, o.zIndex), 0);
    const created = createObjectFromLibraryItem(rawItem, snappedX, snappedY, maxZ + 1);

    if (created.category !== 'container') {
      const container = doc.objects.find(
        (c) =>
          c.category === 'container' &&
          snappedX >= c.x &&
          snappedX <= c.x + c.width &&
          snappedY >= c.y &&
          snappedY <= c.y + c.height
      );
      if (container) created.parentId = container.id;
    }

    onUpdateDoc({ ...doc, objects: [...doc.objects, created] }, true);
    onSelect([created.id], null);
    onDropLibraryItemDone();
  };

  // Rapid Flow Creation handler (Scenario A)
  const handleRapidCreate = (
    choice: (typeof RAPID_FLOW_CHOICES)[number]
  ) => {
    if (!rapidPicker) return;
    const source = objectMap.get(rapidPicker.sourceId);
    if (!source) return;

    const gap = 82;
    let nx = source.x + (source.width - choice.w) / 2;
    let ny = source.y + (source.height - choice.h) / 2;
    let toPort: Exclude<PortSide, 'auto'> = 'top';

    if (rapidPicker.side === 'bottom') {
      ny = source.y + source.height + gap;
      toPort = 'top';
    } else if (rapidPicker.side === 'top') {
      ny = source.y - choice.h - gap;
      toPort = 'bottom';
    } else if (rapidPicker.side === 'right') {
      nx = source.x + source.width + gap;
      toPort = 'left';
    } else {
      nx = source.x - choice.w - gap;
      toPort = 'right';
    }

    const newObj: DiagramObject = {
      id: makeId('obj'),
      type: choice.type,
      category: 'shape',
      label: choice.label,
      x: Math.round(nx),
      y: Math.round(ny),
      width: choice.w,
      height: choice.h,
      rotation: 0,
      layerId: source.layerId,
      zIndex: doc.objects.reduce((m, o) => Math.max(m, o.zIndex), 0) + 1,
      visible: true,
      locked: false,
      parentId: source.parentId,
      style: {
        fill: choice.fill,
        stroke: choice.stroke,
        strokeWidth: 1.5,
        textColor: choice.textColor,
        fontSize: 13,
        borderRadius: choice.radius,
        opacity: 1,
        shadow: true,
      },
      metadata: {},
    };

    // Smart branch label if branching from a decision node
    let branchLabel: string | undefined;
    if (source.type === 'decision') {
      const existingOut = doc.connections.filter((c) => c.fromId === source.id);
      if (existingOut.length === 0) branchLabel = 'Yes';
      else if (existingOut.length === 1) branchLabel = 'No';
    }

    const newConn: DiagramConnection = {
      id: makeId('conn'),
      fromId: source.id,
      toId: newObj.id,
      fromPort: rapidPicker.side,
      toPort,
      label: branchLabel,
      routing: 'orthogonal',
      lineStyle: 'solid',
      color: darkMode ? theme.connectorDark : theme.connectorLight,
      strokeWidth: 1.75,
      arrowStart: 'none',
      arrowEnd: 'arrow',
    };

    onUpdateDoc(
      {
        ...doc,
        objects: [...doc.objects, newObj],
        connections: [...doc.connections, newConn],
      },
      true
    );
    setRapidPicker(null);
    onSelect([newObj.id], null);
    onSetEditingObjectId(newObj.id);
  };

  // Render individual shape geometry (Icon-native architecture/network objects, containers with icons, cards with inline icons)
  const renderObjectShape = (obj: DiagramObject) => {
    const inMarqueePreview =
      marquee !== null &&
      (obj.category === 'container'
        ? obj.x >= Math.min(marquee.x1, marquee.x2) &&
          obj.x + obj.width <= Math.max(marquee.x1, marquee.x2) &&
          obj.y >= Math.min(marquee.y1, marquee.y2) &&
          obj.y + obj.height <= Math.max(marquee.y1, marquee.y2)
        : obj.x + obj.width >= Math.min(marquee.x1, marquee.x2) &&
          obj.x <= Math.max(marquee.x1, marquee.x2) &&
          obj.y + obj.height >= Math.min(marquee.y1, marquee.y2) &&
          obj.y <= Math.max(marquee.y1, marquee.y2));
    const isSelected = selectedIds.includes(obj.id) || inMarqueePreview;
    const isHovered = hoveredObjId === obj.id;
    const isIconNative = isIconNativeObjectType(obj.type) && obj.category !== 'container';

    const fill = isBlueprint
      ? theme.nodeBgLight
      : adaptFillForDark(obj.style.fill, darkMode);

    const liftedStroke = isBlueprint
      ? theme.nodeBorderLight
      : liftStrokeForDark(obj.style.stroke, darkMode);

    const stroke = isSelected ? selectionAccent : liftedStroke;

    const textColor = isBlueprint
      ? theme.textLight
      : adaptTextForDark(obj.style.textColor, obj.style.fill, darkMode);

    const strokeDash = obj.style.dashed ? '6 4' : undefined;
    const strokeW = isSelected ? Math.max(2, obj.style.strokeWidth) : obj.style.strokeWidth;
    const filterAttr =
      theme.useShadow && obj.style.shadow && !isBlueprint && obj.category !== 'container'
        ? 'url(#node-shadow)'
        : undefined;

    if (obj.category === 'freehand' && obj.metadata.points && obj.metadata.points.length > 1) {
      const d = obj.metadata.points
        .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
        .join(' ');
      return (
        <path
          d={d}
          fill="none"
          stroke={isSelected ? selectionAccent : liftedStroke}
          strokeWidth={obj.style.strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );
    }

    if (obj.category === 'container') {
      const isHighlight = highlightContainerId === obj.id;
      const isSwimlane = obj.type === 'swimlane';
      const showContainerIcon = !isSwimlane && hasCanvasInlineIcon(obj.type);
      return (
        <g>
          <rect
            width={obj.width}
            height={obj.height}
            rx={obj.style.borderRadius}
            fill={isHighlight ? (darkMode ? 'rgba(20, 184, 166, 0.12)' : 'rgba(13, 148, 136, 0.08)') : fill}
            fillOpacity={isBlueprint ? 0.4 : darkMode ? 0.36 : 0.72}
            stroke={isHighlight ? selectionAccent : stroke}
            strokeWidth={isHighlight ? 2 : strokeW}
            strokeDasharray={isSwimlane ? undefined : strokeDash || '6 4'}
          />
          {isSwimlane ? (
            <>
              <rect
                width={38}
                height={obj.height}
                rx={obj.style.borderRadius}
                fill={darkMode ? '#121B2B' : '#E2E8F0'}
                stroke={stroke}
                strokeWidth={1}
              />
              <text
                x={19}
                y={obj.height / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                transform={`rotate(-90 19 ${obj.height / 2})`}
                fill={darkMode ? '#E2E8F0' : '#334155'}
                fontSize={12}
                fontWeight={600}
              >
                {obj.label}
              </text>
            </>
          ) : (
            <g>
              {showContainerIcon && (
                <g transform="translate(12, 10) scale(0.72)">
                  <DiagramObjectIconPaths
                    type={obj.type}
                    stroke={isBlueprint ? '#93C5FD' : liftedStroke}
                    fill={darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.8)'}
                    strokeWidth={1.85}
                  />
                </g>
              )}
              <text
                x={showContainerIcon ? 34 : 14}
                y={22}
                fill={isBlueprint ? '#93C5FD' : darkMode ? '#E2E8F0' : '#334155'}
                fontSize={12}
                fontWeight={600}
                fontFamily="Plus Jakarta Sans, sans-serif"
              >
                {obj.label}
              </text>
              {obj.metadata.subtitle && (
                <text
                  x={showContainerIcon ? 34 : 14}
                  y={38}
                  fill={isBlueprint ? '#BFDBFE' : darkMode ? '#94A3B8' : '#64748B'}
                  fontSize={10.5}
                  fontFamily="JetBrains Mono, monospace"
                >
                  {obj.metadata.subtitle}
                </text>
              )}
            </g>
          )}
        </g>
      );
    }

    // TRUE ICON-FIRST RENDERING for System Architecture & Network components (no enclosing box!)
    if (isIconNative) {
      const iconSize = Math.min(48, Math.max(30, Math.min(obj.width * 0.38, obj.height * 0.5)));
      const iconX = (obj.width - iconSize) / 2;
      const iconY = 4;
      const scale = iconSize / 24;
      const iconStroke = isBlueprint ? '#93C5FD' : liftedStroke;
      const iconTintFill = isBlueprint
        ? 'rgba(30, 58, 95, 0.55)'
        : darkMode
          ? `${liftedStroke}26`
          : obj.style.fill === 'transparent' || obj.style.fill.toUpperCase() === '#FFFFFF'
            ? `${obj.style.stroke}14`
            : obj.style.fill;

      return (
        <g>
          {/* Transparent hit target across entire bounding area */}
          <rect width={obj.width} height={obj.height} rx={14} fill="transparent" />
          {/* Subtle selection/hover halo ONLY when selected or hovered — never a static box */}
          {(isSelected || isHovered) && (
            <rect
              x={1}
              y={1}
              width={obj.width - 2}
              height={obj.height - 2}
              rx={14}
              fill={
                isSelected
                  ? darkMode
                    ? 'rgba(20, 184, 166, 0.10)'
                    : 'rgba(13, 148, 136, 0.06)'
                  : darkMode
                    ? 'rgba(148, 163, 184, 0.06)'
                    : 'rgba(15, 23, 42, 0.03)'
              }
              stroke={isSelected ? selectionAccent : darkMode ? 'rgba(148, 163, 184, 0.35)' : 'rgba(148, 163, 184, 0.5)'}
              strokeWidth={isSelected ? 1.75 : 1}
              strokeDasharray={isSelected ? undefined : '4 3'}
              data-export-ignore="true"
            />
          )}
          {/* Subtle ambient radial backing behind icon in dark mode for optical pop */}
          {darkMode && !isBlueprint && (
            <circle
              cx={obj.width / 2}
              cy={iconY + iconSize / 2}
              r={iconSize * 0.54}
              fill={iconStroke}
              fillOpacity={0.09}
            />
          )}
          {/* Crisp, true vector icon silhouette */}
          <g
            transform={`translate(${iconX}, ${iconY}) scale(${scale})`}
            filter={filterAttr}
          >
            <DiagramObjectIconPaths
              type={obj.type}
              stroke={iconStroke}
              fill={iconTintFill}
              strokeWidth={1.65}
            />
          </g>
        </g>
      );
    }

    if (obj.category === 'entity' || obj.type === 'erd-entity') {
      const fields = obj.metadata.fields ?? [];
      const headerH = 34;
      const rowH = 26;
      return (
        <g filter={filterAttr}>
          <rect
            width={obj.width}
            height={obj.height}
            rx={8}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeW}
          />
          <path
            d={`M 0 8 Q 0 0 8 0 L ${obj.width - 8} 0 Q ${obj.width} 0 ${obj.width} 8 L ${obj.width} ${headerH} L 0 ${headerH} Z`}
            fill={liftedStroke}
            fillOpacity={darkMode ? 0.24 : 0.12}
          />
          <line x1={0} y1={headerH} x2={obj.width} y2={headerH} stroke={stroke} strokeOpacity={0.35} strokeWidth={1} />
          <text
            x={12}
            y={21}
            fill={textColor}
            fontSize={12.5}
            fontWeight={700}
            fontFamily="JetBrains Mono, monospace"
          >
            {obj.label}
          </text>
          {fields.map((f, idx) => {
            const ry = headerH + idx * rowH + 17;
            if (ry > obj.height - 6) return null;
            return (
              <g key={f.id}>
                {f.key && (
                  <text
                    x={12}
                    y={ry}
                    fill={f.key === 'PK' ? (darkMode ? '#FBBF24' : '#D97706') : selectionAccent}
                    fontSize={10}
                    fontWeight={700}
                    fontFamily="JetBrains Mono, monospace"
                  >
                    {f.key}
                  </text>
                )}
                <text
                  x={f.key ? 34 : 12}
                  y={ry}
                  fill={textColor}
                  fontSize={11.5}
                  fontFamily="JetBrains Mono, monospace"
                >
                  {f.name}
                </text>
                <text
                  x={obj.width - 12}
                  y={ry}
                  textAnchor="end"
                  fill={darkMode ? '#94A3B8' : '#64748B'}
                  fontSize={10.5}
                  fontFamily="JetBrains Mono, monospace"
                >
                  {f.type}
                </text>
              </g>
            );
          })}
        </g>
      );
    }

    if (obj.type === 'decision') {
      const hw = obj.width / 2;
      const hh = obj.height / 2;
      return (
        <g filter={filterAttr}>
          <polygon
            points={`${hw},2 ${obj.width - 2},${hh} ${hw},${obj.height - 2} 2,${hh}`}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeW}
            strokeLinejoin="round"
          />
        </g>
      );
    }

    if (obj.type === 'io') {
      const skew = 18;
      return (
        <g filter={filterAttr}>
          <polygon
            points={`${skew},0 ${obj.width},0 ${obj.width - skew},${obj.height} 0,${obj.height}`}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeW}
            strokeLinejoin="round"
          />
        </g>
      );
    }

    if (obj.type === 'database') {
      const ry = 11;
      const w = obj.width;
      const h = obj.height;
      return (
        <g filter={filterAttr}>
          <path
            d={`M 0 ${ry} A ${w / 2} ${ry} 0 0 1 ${w} ${ry} L ${w} ${h - ry} A ${w / 2} ${ry} 0 0 1 0 ${h - ry} Z`}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeW}
          />
          <ellipse cx={w / 2} cy={ry} rx={w / 2} ry={ry} fill={fill} stroke={stroke} strokeWidth={strokeW} />
        </g>
      );
    }

    if (obj.type === 'document') {
      const w = obj.width;
      const h = obj.height;
      return (
        <g filter={filterAttr}>
          <path
            d={`M 0 6 Q 0 0 6 0 L ${w - 6} 0 Q ${w} 0 ${w} 6 L ${w} ${h - 10} Q ${w * 0.75} ${h - 22} ${w * 0.5} ${h - 10} Q ${w * 0.25} ${h + 2} 0 ${h - 10} Z`}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeW}
          />
        </g>
      );
    }

    if (obj.type === 'delay') {
      const w = obj.width;
      const h = obj.height;
      const r = h / 2;
      return (
        <g filter={filterAttr}>
          <path
            d={`M 0 4 Q 0 0 4 0 L ${w - r} 0 A ${r} ${r} 0 0 1 ${w - r} ${h} L 4 ${h} Q 0 ${h} 0 ${h - 4} Z`}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeW}
          />
        </g>
      );
    }

    if (obj.type === 'text') {
      return (
        <rect
          width={obj.width}
          height={obj.height}
          rx={6}
          fill="transparent"
          stroke={isSelected ? selectionAccent : 'transparent'}
          strokeWidth={1.25}
          strokeDasharray="4 3"
        />
      );
    }

    // Standard rounded card (Process, Start/End, Org card, Journey card, Flowchart specialty, Sticky)
    const radius = obj.type === 'start' ? obj.height / 2 : obj.style.borderRadius;
    const isSubprocess = obj.type === 'subprocess';
    const showInlineIcon = hasCanvasInlineIcon(obj.type) && obj.width >= 110;

    return (
      <g filter={filterAttr}>
        <rect
          width={obj.width}
          height={obj.height}
          rx={radius}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeW}
          strokeDasharray={strokeDash}
        />
        {isSubprocess && (
          <>
            <line x1={12} y1={0} x2={12} y2={obj.height} stroke={stroke} strokeWidth={1.25} />
            <line x1={obj.width - 12} y1={0} x2={obj.width - 12} y2={obj.height} stroke={stroke} strokeWidth={1.25} />
          </>
        )}
        {showInlineIcon && (
          <g transform={`translate(11, ${Math.max(8, (obj.height - 19) / 2)}) scale(0.8)`}>
            <DiagramObjectIconPaths
              type={obj.type}
              stroke={isBlueprint ? '#93C5FD' : liftedStroke}
              fill={darkMode ? `${liftedStroke}22` : `${obj.style.stroke}14`}
              strokeWidth={1.85}
            />
          </g>
        )}
      </g>
    );
  };

  // Minimap bounds
  const minimapBounds = useMemo(() => {
    if (doc.objects.length === 0) return { minX: 0, minY: 0, width: 1000, height: 700 };
    const minX = Math.min(...doc.objects.map((o) => o.x)) - 80;
    const minY = Math.min(...doc.objects.map((o) => o.y)) - 80;
    const maxX = Math.max(...doc.objects.map((o) => o.x + o.width)) + 80;
    const maxY = Math.max(...doc.objects.map((o) => o.y + o.height)) + 80;
    return {
      minX,
      minY,
      width: Math.max(400, maxX - minX),
      height: Math.max(300, maxY - minY),
    };
  }, [doc.objects]);

  const singleSelectedObj =
    selectedIds.length === 1 ? objectMap.get(selectedIds[0]) ?? null : null;

  // Unified bounding box when 2+ items are selected so users can drag anywhere inside the group to move all
  const multiSelectionBounds = useMemo(() => {
    if (selectedIds.length < 2) return null;
    const objs = selectedIds
      .map((id) => objectMap.get(id))
      .filter((o): o is DiagramObject => Boolean(o && o.visible));
    if (objs.length < 2) return null;
    const minX = Math.min(...objs.map((o) => o.x)) - 8;
    const minY = Math.min(...objs.map((o) => o.y)) - 8;
    const maxX = Math.max(...objs.map((o) => o.x + o.width)) + 8;
    const maxY = Math.max(...objs.map((o) => o.y + o.height)) + 8;
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  }, [selectedIds, objectMap]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden select-none"
      style={{
        backgroundColor: canvasBg,
        cursor:
          panState || activeTool === 'pan' || spacePressed
            ? 'grab'
            : activeTool === 'pen'
            ? 'crosshair'
            : 'default',
      }}
      onWheel={handleWheel}
      onDragOver={handleDragOver}
      onDragLeave={() => {
        setDropPreviewPos(null);
        setHighlightContainerId(null);
      }}
      onDrop={handleDrop}
    >
      <svg
        ref={svgRef}
        className="w-full h-full block"
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        role="application"
        aria-label={`${doc.title} interactive diagram canvas`}
      >
        <defs>
          <pattern
            id="canvas-grid-pattern"
            width={doc.settings.gridSize * viewport.zoom}
            height={doc.settings.gridSize * viewport.zoom}
            patternUnits="userSpaceOnUse"
            x={viewport.x % (doc.settings.gridSize * viewport.zoom)}
            y={viewport.y % (doc.settings.gridSize * viewport.zoom)}
          >
            {isBlueprint ? (
              <path
                d={`M ${doc.settings.gridSize * viewport.zoom} 0 L 0 0 0 ${doc.settings.gridSize * viewport.zoom}`}
                fill="none"
                stroke={gridColor}
                strokeWidth="1"
              />
            ) : (
              <circle cx="1.2" cy="1.2" r="1.1" fill={gridColor} />
            )}
          </pattern>

          <filter id="node-shadow" x="-15%" y="-15%" width="130%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#0F172A" floodOpacity={darkMode ? 0.35 : 0.07} />
          </filter>

          <marker id="arrow-end" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse">
            <path d="M 0 1.2 L 9 5 L 0 8.8 z" fill="context-stroke" />
          </marker>
          <marker id="arrow-open" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto">
            <path d="M 1 1.5 L 8.5 5 L 1 8.5" fill="none" stroke="context-stroke" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </marker>
          <marker id="crow-end" viewBox="0 0 12 12" refX="10" refY="6" markerWidth="8" markerHeight="8" orient="auto">
            <path d="M 1 6 L 11 1 M 1 6 L 11 6 M 1 6 L 11 11" fill="none" stroke="context-stroke" strokeWidth="1.4" />
          </marker>
        </defs>

        {/* Background Grid */}
        {doc.settings.showGrid && (
          <rect width="100%" height="100%" fill="url(#canvas-grid-pattern)" data-export-ignore="true" />
        )}

        {/* World Viewport Group */}
        <g
          data-canvas-content="true"
          transform={`translate(${viewport.x}, ${viewport.y}) scale(${viewport.zoom})`}
        >
          {/* 1. Containers first */}
          {visibleObjects
            .filter((o) => o.category === 'container')
            .map((obj) => (
              <g
                key={obj.id}
                transform={`translate(${obj.x}, ${obj.y})`}
                onMouseDown={(e) => handleObjectMouseDown(e, obj)}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  if (!readOnly && !obj.locked) onSetEditingObjectId(obj.id);
                }}
                style={{ cursor: obj.locked ? 'not-allowed' : 'move', opacity: obj.style.opacity }}
              >
                {renderObjectShape(obj)}
              </g>
            ))}

          {/* 2. Smart Connectors */}
          {doc.connections.map((conn) => {
            const from = objectMap.get(conn.fromId);
            const to = objectMap.get(conn.toId);
            if (!from || !to || !from.visible || !to.visible) return null;
            const { path, labelPos } = buildConnectorPath(conn, from, to);
            const isSelected = selectedConnectionId === conn.id;
            const strokeColor = isSelected
              ? selectionAccent
              : isBlueprint
              ? theme.connectorLight
              : liftStrokeForDark(conn.color, darkMode);
            const dashArray =
              conn.lineStyle === 'dashed'
                ? '6 4'
                : conn.lineStyle === 'dotted'
                ? '2 4'
                : undefined;

            const markerEnd =
              conn.arrowEnd === 'arrow'
                ? 'url(#arrow-end)'
                : conn.arrowEnd === 'open'
                ? 'url(#arrow-open)'
                : conn.arrowEnd === 'crow'
                ? 'url(#crow-end)'
                : undefined;

            return (
              <g
                key={conn.id}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  onSelect([], conn.id);
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  if (!readOnly) setEditingConnId(conn.id);
                }}
                style={{ cursor: 'pointer' }}
              >
                {/* Wide invisible hit target */}
                <path d={path} fill="none" stroke="transparent" strokeWidth={14} data-export-ignore="true" />
                <path
                  d={path}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={isSelected ? conn.strokeWidth + 1 : conn.strokeWidth}
                  strokeDasharray={dashArray}
                  markerEnd={markerEnd}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {(conn.label || editingConnId === conn.id) && (
                  <g transform={`translate(${labelPos.x}, ${labelPos.y})`}>
                    {editingConnId === conn.id ? (
                      <foreignObject x={-64} y={-14} width={128} height={28} data-export-ignore="true">
                        <input
                          autoFocus
                          defaultValue={conn.label ?? ''}
                          onBlur={(e) => {
                            const val = e.target.value.trim();
                            onUpdateDoc(
                              {
                                ...doc,
                                connections: doc.connections.map((c) =>
                                  c.id === conn.id ? { ...c, label: val || undefined } : c
                                ),
                              },
                              true
                            );
                            setEditingConnId(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                          }}
                          className="w-full h-full text-center text-xs font-medium bg-white dark:bg-[#0D1422] text-slate-900 dark:text-slate-100 border border-teal-500 rounded px-1.5 outline-none shadow-sm"
                        />
                      </foreignObject>
                    ) : (
                      <>
                        <rect
                          x={-Math.max(24, (conn.label!.length * 6.5 + 14) / 2)}
                          y={-11}
                          width={Math.max(48, conn.label!.length * 6.5 + 14)}
                          height={22}
                          rx={5}
                          fill={isBlueprint ? '#1E3A5F' : darkMode ? '#0C121E' : '#FFFFFF'}
                          stroke={isSelected ? selectionAccent : isBlueprint ? '#60A5FA' : darkMode ? '#26344B' : '#E2E8F0'}
                          strokeWidth={1}
                        />
                        <text
                          textAnchor="middle"
                          dominantBaseline="middle"
                          y={0.5}
                          fontSize={11}
                          fontWeight={500}
                          fill={isBlueprint ? '#EFF6FF' : darkMode ? '#CBD5E1' : '#334155'}
                          fontFamily={conn.protocol ? 'JetBrains Mono, monospace' : 'DM Sans, sans-serif'}
                        >
                          {conn.label}
                        </text>
                      </>
                    )}
                  </g>
                )}
              </g>
            );
          })}

          {/* 3. Foreground Objects */}
          {visibleObjects
            .filter((o) => o.category !== 'container')
            .map((obj) => {
              const isSelected = selectedIds.includes(obj.id);
              const isHovered = hoveredObjId === obj.id;
              const isIconNative = isIconNativeObjectType(obj.type);
              const showInlineIcon = !isIconNative && hasCanvasInlineIcon(obj.type) && obj.width >= 110;
              const textColor = isIconNative
                ? isBlueprint
                  ? '#F0F9FF'
                  : darkMode
                    ? '#F1F5F9'
                    : '#0F172A'
                : isBlueprint
                  ? theme.textLight
                  : adaptTextForDark(obj.style.textColor, obj.style.fill, darkMode);

              const iconSize = isIconNative
                ? Math.min(48, Math.max(30, Math.min(obj.width * 0.38, obj.height * 0.5)))
                : 0;
              const labelX = isIconNative ? 2 : showInlineIcon ? 34 : 10;
              const labelW = isIconNative
                ? obj.width - 4
                : showInlineIcon
                  ? obj.width - 42
                  : obj.width - 20;
              const labelY = isIconNative
                ? iconSize + 6
                : obj.type === 'database'
                  ? 18
                  : 6;
              const labelH = isIconNative
                ? Math.max(24, obj.height - iconSize - 6)
                : obj.height - (obj.type === 'database' ? 24 : 12);

              return (
                <g
                  key={obj.id}
                  transform={`translate(${obj.x}, ${obj.y}) rotate(${obj.rotation || 0} ${obj.width / 2} ${obj.height / 2})`}
                  onMouseDown={(e) => handleObjectMouseDown(e, obj)}
                  onMouseEnter={() => setHoveredObjId(obj.id)}
                  onMouseLeave={() => setHoveredObjId((cur) => (cur === obj.id ? null : cur))}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    if (!readOnly && !obj.locked) onSetEditingObjectId(obj.id);
                  }}
                  style={{ cursor: obj.locked ? 'not-allowed' : 'move', opacity: obj.style.opacity }}
                >
                  {renderObjectShape(obj)}

                  {/* Label & optional subtitle (not for ERD or freehand which render their own content) */}
                  {obj.category !== 'entity' && obj.category !== 'freehand' && (
                    editingObjectId === obj.id ? (
                      <foreignObject x={4} y={isIconNative ? iconSize + 4 : 6} width={obj.width - 8} height={isIconNative ? Math.max(28, obj.height - iconSize - 4) : obj.height - 12} data-export-ignore="true">
                        <div className="w-full h-full flex items-center justify-center">
                          <input
                            autoFocus
                            defaultValue={obj.label}
                            onMouseDown={(e) => e.stopPropagation()}
                            onBlur={(e) => {
                              const nextLabel = e.target.value.trim() || obj.label;
                              onUpdateDoc(
                                {
                                  ...doc,
                                  objects: doc.objects.map((o) =>
                                    o.id === obj.id ? { ...o, label: nextLabel } : o
                                  ),
                                },
                                true
                              );
                              onSetEditingObjectId(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                            }}
                            className="w-full text-center text-xs font-medium bg-white/95 dark:bg-[#0D1422]/95 text-slate-900 dark:text-slate-100 border border-teal-500 rounded px-1.5 py-1 outline-none"
                          />
                        </div>
                      </foreignObject>
                    ) : (
                      <foreignObject x={labelX} y={labelY} width={labelW} height={labelH} style={{ pointerEvents: 'none' }}>
                        <div
                          className={`w-full h-full flex flex-col leading-tight px-1 ${
                            isIconNative
                              ? 'items-center justify-start text-center pt-0.5'
                              : showInlineIcon
                                ? 'items-start justify-center text-left'
                                : 'items-center justify-center text-center'
                          }`}
                        >
                          <span
                            style={{
                              color: textColor,
                              fontSize: isIconNative ? Math.min(12.5, obj.style.fontSize) : obj.style.fontSize,
                              fontWeight: obj.type === 'text' ? 700 : 600,
                            }}
                            className={isIconNative ? 'line-clamp-2 break-words' : 'line-clamp-3 break-words'}
                          >
                            {obj.label}
                          </span>
                          {obj.metadata.subtitle && (
                            <span
                              style={{ color: textColor, opacity: 0.68, fontSize: 10 }}
                              className="mt-0.5 truncate max-w-full"
                            >
                              {obj.metadata.subtitle}
                            </span>
                          )}
                          {obj.metadata.technology && doc.type === 'architecture' && (
                            <span
                              style={{ color: textColor, opacity: 0.56, fontSize: 9.5 }}
                              className="font-mono mt-0.5 truncate max-w-full"
                            >
                              {obj.metadata.technology}
                            </span>
                          )}
                        </div>
                      </foreignObject>
                    )
                  )}

                  {/* Subtle Connection Ports on Hover or Single Selection */}
                  {!readOnly && !obj.locked && (isHovered || isSelected) && obj.category !== 'freehand' && (
                    <g data-export-ignore="true">
                      {(['top', 'right', 'bottom', 'left'] as const).map((side) => {
                        const pt = getPortPoint(obj, side);
                        const lx = pt.x - obj.x;
                        const ly = pt.y - obj.y;
                        return (
                          <circle
                            key={side}
                            cx={lx}
                            cy={ly}
                            r={4.5}
                            fill={darkMode ? '#0C121E' : '#FFFFFF'}
                            stroke={selectionAccent}
                            strokeWidth={1.75}
                            style={{ cursor: 'crosshair' }}
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              setConnecting({ fromId: obj.id, fromPort: side, currX: pt.x, currY: pt.y });
                            }}
                          />
                        );
                      })}
                    </g>
                  )}

                  {/* Resize handles when single-selected */}
                  {!readOnly && !obj.locked && isSelected && selectedIds.length === 1 && obj.category !== 'freehand' && (
                    <g data-export-ignore="true">
                      {(
                        [
                          ['nw', 0, 0, 'nwse-resize'],
                          ['ne', obj.width, 0, 'nesw-resize'],
                          ['sw', 0, obj.height, 'nesw-resize'],
                          ['se', obj.width, obj.height, 'nwse-resize'],
                        ] as const
                      ).map(([handle, hx, hy, cursor]) => (
                        <rect
                          key={handle}
                          x={hx - 4}
                          y={hy - 4}
                          width={8}
                          height={8}
                          rx={2}
                          fill={darkMode ? '#0C121E' : '#FFFFFF'}
                          stroke={selectionAccent}
                          strokeWidth={1.5}
                          style={{ cursor }}
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            const wp = screenToWorld(e.clientX, e.clientY);
                            setResizeState({
                              id: obj.id,
                              handle,
                              startWorldX: wp.x,
                              startWorldY: wp.y,
                              orig: { x: obj.x, y: obj.y, width: obj.width, height: obj.height },
                            });
                          }}
                        />
                      ))}
                    </g>
                  )}
                </g>
              );
            })}

          {/* Rapid Flow Insertion '+' Handles (Flowchart / Journey / Org Chart) */}
          {!readOnly &&
            singleSelectedObj &&
            singleSelectedObj.category === 'shape' &&
            !singleSelectedObj.locked &&
            (doc.type === 'flowchart' || doc.type === 'journey' || doc.type === 'orgchart') && (
              <g data-export-ignore="true">
                {(['top', 'right', 'bottom', 'left'] as const).map((side) => {
                  const pt = getPortPoint(singleSelectedObj, side);
                  const offset = 24;
                  const bx =
                    side === 'right' ? pt.x + offset : side === 'left' ? pt.x - offset : pt.x;
                  const by =
                    side === 'bottom' ? pt.y + offset : side === 'top' ? pt.y - offset : pt.y;
                  return (
                    <g
                      key={`add-${side}`}
                      transform={`translate(${bx}, ${by})`}
                      style={{ cursor: 'pointer' }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setRapidPicker({
                          sourceId: singleSelectedObj.id,
                          side,
                          x: bx,
                          y: by,
                        });
                      }}
                    >
                      <circle r={10} fill={selectionAccent} fillOpacity={0.14} stroke={selectionAccent} strokeWidth={1.25} />
                      <path d="M -4 0 H 4 M 0 -4 V 4" stroke={selectionAccent} strokeWidth={1.6} strokeLinecap="round" />
                    </g>
                  );
                })}
              </g>
            )}

          {/* Live Connection Drag Wire */}
          {connecting && (() => {
            const from = objectMap.get(connecting.fromId);
            if (!from) return null;
            const start = getPortPoint(from, connecting.fromPort);
            return (
              <line
                x1={start.x}
                y1={start.y}
                x2={connecting.currX}
                y2={connecting.currY}
                stroke={selectionAccent}
                strokeWidth={2}
                strokeDasharray="5 4"
                markerEnd="url(#arrow-end)"
                data-export-ignore="true"
              />
            );
          })()}

          {/* Live Freehand Stroke */}
          {freehandPoints && freehandPoints.length > 1 && (
            <path
              d={freehandPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')}
              fill="none"
              stroke={selectionAccent}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              data-export-ignore="true"
            />
          )}

          {/* Smart Alignment Guides */}
          {guides.map((g, idx) =>
            g.orientation === 'vertical' ? (
              <line
                key={`vg-${idx}`}
                x1={g.position}
                y1={g.start}
                x2={g.position}
                y2={g.end}
                stroke={selectionAccent}
                strokeWidth={1 / viewport.zoom}
                strokeDasharray={`${4 / viewport.zoom} ${3 / viewport.zoom}`}
                data-export-ignore="true"
              />
            ) : (
              <line
                key={`hg-${idx}`}
                x1={g.start}
                y1={g.position}
                x2={g.end}
                y2={g.position}
                stroke={selectionAccent}
                strokeWidth={1 / viewport.zoom}
                strokeDasharray={`${4 / viewport.zoom} ${3 / viewport.zoom}`}
                data-export-ignore="true"
              />
            )
          )}

          {/* Library Drop Ghost Preview with live icon silhouette */}
          {draggingLibraryItem && dropPreviewPos && (
            <g
              transform={`translate(${dropPreviewPos.x - draggingLibraryItem.defaultWidth / 2}, ${dropPreviewPos.y - draggingLibraryItem.defaultHeight / 2})`}
              opacity={0.85}
              data-export-ignore="true"
            >
              <rect
                width={draggingLibraryItem.defaultWidth}
                height={draggingLibraryItem.defaultHeight}
                rx={draggingLibraryItem.borderRadius ?? 12}
                fill={darkMode ? 'rgba(20, 184, 166, 0.10)' : 'rgba(13, 148, 136, 0.08)'}
                stroke={selectionAccent}
                strokeWidth={1.5}
                strokeDasharray="5 4"
              />
              <g
                transform={`translate(${draggingLibraryItem.defaultWidth / 2 - 18}, ${draggingLibraryItem.defaultHeight / 2 - 22}) scale(1.5)`}
              >
                <DiagramObjectIconPaths
                  type={draggingLibraryItem.type}
                  stroke={selectionAccent}
                  fill={darkMode ? 'rgba(20, 184, 166, 0.18)' : 'rgba(13, 148, 136, 0.14)'}
                  strokeWidth={1.65}
                />
              </g>
            </g>
          )}

          {/* Multi-Selection Group Bounding Box (Drag anywhere in bounds to move all selected!) */}
          {!readOnly && multiSelectionBounds && !marquee && (
            <g data-export-ignore="true">
              <rect
                x={multiSelectionBounds.x}
                y={multiSelectionBounds.y}
                width={multiSelectionBounds.width}
                height={multiSelectionBounds.height}
                rx={10}
                fill={darkMode ? 'rgba(20, 184, 166, 0.06)' : 'rgba(13, 148, 136, 0.04)'}
                stroke={selectionAccent}
                strokeWidth={1.5 / viewport.zoom}
                strokeDasharray={`${6 / viewport.zoom} ${4 / viewport.zoom}`}
                style={{ cursor: 'move' }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  if (e.button === 1 || activeTool === 'pan' || spacePressed) {
                    setPanState({ startX: e.clientX, startY: e.clientY, vpX: viewport.x, vpY: viewport.y });
                    return;
                  }
                  startGroupDrag(e.clientX, e.clientY, selectedIds);
                }}
              />
            </g>
          )}

          {/* Marquee Selection Box */}
          {marquee && (
            <rect
              x={Math.min(marquee.x1, marquee.x2)}
              y={Math.min(marquee.y1, marquee.y2)}
              width={Math.abs(marquee.x2 - marquee.x1)}
              height={Math.abs(marquee.y2 - marquee.y1)}
              rx={4}
              fill={darkMode ? 'rgba(20, 184, 166, 0.12)' : 'rgba(13, 148, 136, 0.09)'}
              stroke={selectionAccent}
              strokeWidth={1.25 / viewport.zoom}
              strokeDasharray={`${5 / viewport.zoom} ${3 / viewport.zoom}`}
              data-export-ignore="true"
            />
          )}
        </g>
      </svg>

      {/* Compact Rapid Flow Creation Menu */}
      {rapidPicker && (
        <div
          className="absolute z-30 bg-white dark:bg-[#0D1422] border border-slate-200 dark:border-slate-700/80 rounded-lg shadow-xl p-1.5 flex items-center gap-1"
          style={{
            left: Math.max(12, rapidPicker.x * viewport.zoom + viewport.x - 110),
            top: Math.max(12, rapidPicker.y * viewport.zoom + viewport.y + 14),
          }}
        >
          {RAPID_FLOW_CHOICES.map((choice) => (
            <button
              key={choice.type}
              type="button"
              onClick={() => handleRapidCreate(choice)}
              className="px-2.5 py-1.5 text-xs font-medium rounded-md text-slate-700 dark:text-slate-200 hover:bg-teal-50 hover:text-teal-800 dark:hover:bg-teal-950/60 dark:hover:text-teal-300 transition-colors whitespace-nowrap"
            >
              {choice.label.replace('?', '')}
            </button>
          ))}
        </div>
      )}

      {/* Interactive Mini-Map */}
      {showMinimap && (
        <div className="absolute right-4 bottom-16 z-20 w-44 h-28 rounded-xl bg-white/90 dark:bg-[#0C121E]/90 backdrop-blur border border-slate-200 dark:border-slate-800 shadow-lg overflow-hidden">
          <svg
            viewBox={`${minimapBounds.minX} ${minimapBounds.minY} ${minimapBounds.width} ${minimapBounds.height}`}
            className="w-full h-full"
          >
            {doc.objects.map((o) => (
              <rect
                key={o.id}
                x={o.x}
                y={o.y}
                width={o.width}
                height={o.height}
                rx={4}
                fill={selectedIds.includes(o.id) ? selectionAccent : o.category === 'container' ? 'rgba(148,163,184,0.18)' : darkMode ? '#475569' : '#94A3B8'}
                stroke={o.category === 'container' ? '#64748B' : 'none'}
                strokeWidth={4}
              />
            ))}
          </svg>
        </div>
      )}
    </div>
  );
};
