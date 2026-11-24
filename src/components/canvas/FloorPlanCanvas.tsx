import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  DiagramDocument,
  FloorFurniture,
  FloorOpening,
  FloorRoom,
  FloorWall,
  ViewportState,
} from '../../types/diagram';
import { DIAGRAM_THEMES } from '../../engine/themes';
import {
  clampOpeningRatioForWall,
  detectRoomsFromWalls,
  FloorBounds,
  formatArea,
  formatLength,
  getConnectedWallCluster,
  getPolygonBounds,
  getWallsBounds,
  isWallInEnclosedSpace,
  pointInPolygon,
  polygonCentroid,
  projectPointToWall,
  resizeConnectedWall,
  scaleConnectedSpace,
} from '../../engine/geometry';
import { createFurnitureFromLibraryItem, LibraryItem } from '../../engine/libraries';
import { makeId } from '../../engine/templates';

type SpaceResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

export type FloorSelectionItem = {
  kind: 'wall' | 'opening' | 'room' | 'furniture';
  id: string;
};

interface FloorPlanCanvasProps {
  doc: DiagramDocument;
  darkMode: boolean;
  viewport: ViewportState;
  onViewportChange: (vp: ViewportState) => void;
  activeTool: 'select' | 'pan' | 'wall';
  onSetTool: (tool: 'select' | 'pan' | 'wall') => void;
  selectedItems: FloorSelectionItem[];
  onSelectItems: (items: FloorSelectionItem[]) => void;
  onUpdateDoc: (next: DiagramDocument, recordHistory?: boolean) => void;
  readOnly?: boolean;
  svgRef: React.RefObject<SVGSVGElement | null>;
  draggingLibraryItem: LibraryItem | null;
  onDropLibraryItemDone: () => void;
}

export const FloorPlanCanvas: React.FC<FloorPlanCanvasProps> = ({
  doc,
  darkMode,
  viewport,
  onViewportChange,
  activeTool,
  onSetTool,
  selectedItems,
  onSelectItems,
  onUpdateDoc,
  readOnly = false,
  svgRef,
  draggingLibraryItem,
  onDropLibraryItemDone,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const fp = doc.floorplan!;
  const ppm = fp.pixelsPerMeter || 72;
  const theme = DIAGRAM_THEMES[doc.settings.theme] ?? DIAGRAM_THEMES.modern;
  const isBlueprint = doc.settings.theme === 'blueprint';
  const canvasBg = darkMode ? theme.canvasBgDark : theme.canvasBgLight;
  const gridColor = darkMode ? theme.gridColorDark : theme.gridColorLight;

  const [panState, setPanState] = useState<{ startX: number; startY: number; vpX: number; vpY: number } | null>(null);
  const [spacePressed, setSpacePressed] = useState(false);

  // Connected Wall Drawing State (meters)
  const [wallStart, setWallStart] = useState<{ x: number; y: number } | null>(null);
  const [wallCursor, setWallCursor] = useState<{ x: number; y: number } | null>(null);

  // Multi-item group drag state (furniture + walls in meters)
  const [dragGroup, setDragGroup] = useState<{
    startMX: number;
    startMY: number;
    furnitureOrig: Record<string, { x: number; y: number }>;
    wallsOrig: Record<string, { x1: number; y1: number; x2: number; y2: number }>;
    hasMoved: boolean;
  } | null>(null);

  // Marquee multi-select rectangle (meters)
  const [marquee, setMarquee] = useState<{
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    additive: boolean;
    clickedRoomId?: string;
  } | null>(null);

  const [dragWallEnd, setDragWallEnd] = useState<{
    wallId: string;
    end: 1 | 2;
  } | null>(null);

  // Direct push/pull resize of a wall inside a connected enclosed space
  const [dragConnectedWall, setDragConnectedWall] = useState<{
    wallId: string;
    startMX: number;
    startMY: number;
    origWalls: FloorWall[];
    origOpenings: FloorOpening[];
    origRooms: FloorRoom[];
    origFurniture: FloorFurniture[];
    hasMoved: boolean;
  } | null>(null);

  // 8-handle bounding-box resize of an entire selected enclosed space or room
  const [dragSpaceResize, setDragSpaceResize] = useState<{
    mode: 'scale-cluster' | 'room-edges';
    handle: SpaceResizeHandle;
    spaceWallIds: Set<string>;
    interiorFurnitureIds: Set<string>;
    edgeWallIds?: { n?: string; s?: string; e?: string; w?: string };
    origBounds: FloorBounds;
    origWalls: FloorWall[];
    origOpenings: FloorOpening[];
    origRooms: FloorRoom[];
    origFurniture: FloorFurniture[];
    hasMoved: boolean;
  } | null>(null);

  const [dragOpening, setDragOpening] = useState<{ openingId: string } | null>(null);

  const docRef = useRef(doc);
  docRef.current = doc;

  const isSelectedItem = (kind: FloorSelectionItem['kind'], id: string) =>
    selectedItems.some((s) => s.kind === kind && s.id === id);

  // Determine whether the current selection represents an enclosed space (either via
  // single-clicking a connected wall or clicking inside a room) so we can show the 8 resize handles.
  const selectedSpaceInfo = useMemo(() => {
    if (readOnly || marquee || activeTool === 'wall') return null;

    // Case 1: Connected enclosed wall cluster selected (e.g., single-clicked any connected wall)
    const wallSel = selectedItems.filter((s) => s.kind === 'wall');
    if (wallSel.length >= 3 && wallSel.length === selectedItems.length) {
      const wallIdSet = new Set(wallSel.map((s) => s.id));
      const wallsInSel = fp.walls.filter((w) => wallIdSet.has(w.id));
      const bounds = getWallsBounds(wallsInSel);
      if (!bounds) return null;

      // Verify these walls enclose at least one space
      const hasEnclosed = isWallInEnclosedSpace(wallsInSel[0].id, fp.walls, fp.rooms);
      if (!hasEnclosed) return null;

      // Gather interior furniture inside any room touching this wall cluster (or within cluster bounds)
      const clusterRooms = fp.rooms.filter((r) =>
        r.polygon.some((pt) =>
          wallsInSel.some((w) => projectPointToWall(pt.x, pt.y, w).dist <= 0.2)
        )
      );
      const interiorFurnitureIds = new Set<string>();
      for (const f of fp.furniture) {
        if (f.locked) continue;
        const inRoom =
          clusterRooms.length > 0
            ? clusterRooms.some((r) => pointInPolygon({ x: f.x, y: f.y }, r.polygon, 0.16))
            : f.x >= bounds.minX - 0.12 &&
              f.x <= bounds.maxX + 0.12 &&
              f.y >= bounds.minY - 0.12 &&
              f.y <= bounds.maxY + 0.12;
        if (inRoom) interiorFurnitureIds.add(f.id);
      }

      return {
        mode: 'scale-cluster' as const,
        wallIds: wallIdSet,
        bounds,
        interiorFurnitureIds,
        label: clusterRooms.length === 1 ? clusterRooms[0].name : 'Enclosed Space',
      };
    }

    // Case 2: Single Room selected (clicked inside a room's floor area)
    if (selectedItems.length === 1 && selectedItems[0].kind === 'room') {
      const room = fp.rooms.find((r) => r.id === selectedItems[0].id);
      if (!room) return null;
      const roomBounds = getPolygonBounds(room.polygon);
      if (!roomBounds) return null;

      // Find walls forming/touching this room
      const touchingWalls = fp.walls.filter((w) => {
        const mx = (w.x1 + w.x2) / 2;
        const my = (w.y1 + w.y2) / 2;
        return (
          pointInPolygon({ x: mx, y: my }, room.polygon, 0.2) ||
          room.polygon.some((pt) => projectPointToWall(pt.x, pt.y, w).dist <= 0.18)
        );
      });
      if (touchingWalls.length < 3) return null;

      const cluster = getConnectedWallCluster(touchingWalls[0].id, fp.walls);
      const clusterBounds = getWallsBounds(cluster);
      const interiorFurnitureIds = new Set<string>(
        fp.furniture
          .filter((f) => !f.locked && pointInPolygon({ x: f.x, y: f.y }, room.polygon, 0.16))
          .map((f) => f.id)
      );

      const isStandaloneRoom =
        clusterBounds !== null &&
        Math.abs(clusterBounds.minX - roomBounds.minX) < 0.25 &&
        Math.abs(clusterBounds.maxX - roomBounds.maxX) < 0.25 &&
        Math.abs(clusterBounds.minY - roomBounds.minY) < 0.25 &&
        Math.abs(clusterBounds.maxY - roomBounds.maxY) < 0.25;

      if (isStandaloneRoom && clusterBounds) {
        return {
          mode: 'scale-cluster' as const,
          wallIds: new Set(cluster.map((w) => w.id)),
          bounds: clusterBounds,
          interiorFurnitureIds,
          label: room.name,
        };
      }

      // Multi-room building: identify the north/south/east/west boundary walls of this room
      const findEdgeWall = (side: 'n' | 's' | 'e' | 'w'): string | undefined => {
        for (const w of fp.walls) {
          const isHoriz = Math.abs(w.y1 - w.y2) < 0.18;
          const isVert = Math.abs(w.x1 - w.x2) < 0.18;
          if (side === 'n' && isHoriz && Math.abs((w.y1 + w.y2) / 2 - roomBounds.minY) < 0.22) {
            if (Math.max(w.x1, w.x2) > roomBounds.minX + 0.2 && Math.min(w.x1, w.x2) < roomBounds.maxX - 0.2) {
              return w.id;
            }
          }
          if (side === 's' && isHoriz && Math.abs((w.y1 + w.y2) / 2 - roomBounds.maxY) < 0.22) {
            if (Math.max(w.x1, w.x2) > roomBounds.minX + 0.2 && Math.min(w.x1, w.x2) < roomBounds.maxX - 0.2) {
              return w.id;
            }
          }
          if (side === 'w' && isVert && Math.abs((w.x1 + w.x2) / 2 - roomBounds.minX) < 0.22) {
            if (Math.max(w.y1, w.y2) > roomBounds.minY + 0.2 && Math.min(w.y1, w.y2) < roomBounds.maxY - 0.2) {
              return w.id;
            }
          }
          if (side === 'e' && isVert && Math.abs((w.x1 + w.x2) / 2 - roomBounds.maxX) < 0.22) {
            if (Math.max(w.y1, w.y2) > roomBounds.minY + 0.2 && Math.min(w.y1, w.y2) < roomBounds.maxY - 0.2) {
              return w.id;
            }
          }
        }
        return undefined;
      };

      return {
        mode: 'room-edges' as const,
        wallIds: new Set(cluster.map((w) => w.id)),
        bounds: roomBounds,
        interiorFurnitureIds,
        edgeWallIds: {
          n: findEdgeWall('n'),
          s: findEdgeWall('s'),
          e: findEdgeWall('e'),
          w: findEdgeWall('w'),
        },
        label: room.name,
      };
    }

    return null;
  }, [activeTool, fp.furniture, fp.rooms, fp.walls, marquee, readOnly, selectedItems]);

  const startFloorGroupDrag = (clientX: number, clientY: number, items: FloorSelectionItem[]) => {
    const m = screenToMeters(clientX, clientY);
    const furnitureOrig: Record<string, { x: number; y: number }> = {};
    const wallsOrig: Record<string, { x1: number; y1: number; x2: number; y2: number }> = {};
    for (const it of items) {
      if (it.kind === 'furniture') {
        const f = fp.furniture.find((item) => item.id === it.id);
        if (f && !f.locked) furnitureOrig[f.id] = { x: f.x, y: f.y };
      } else if (it.kind === 'wall') {
        const w = fp.walls.find((item) => item.id === it.id);
        if (w) wallsOrig[w.id] = { x1: w.x1, y1: w.y1, x2: w.x2, y2: w.y2 };
      }
    }
    if (Object.keys(furnitureOrig).length === 0 && Object.keys(wallsOrig).length === 0) return;
    setDragGroup({ startMX: m.x, startMY: m.y, furnitureOrig, wallsOrig, hasMoved: false });
  };

  const screenToMeters = useCallback(
    (clientX: number, clientY: number) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return { x: 0, y: 0 };
      const wx = (clientX - rect.left - viewport.x) / viewport.zoom;
      const wy = (clientY - rect.top - viewport.y) / viewport.zoom;
      return { x: wx / ppm, y: wy / ppm };
    },
    [viewport, ppm]
  );

  // Snap meters to existing wall endpoints or 0.25m grid + 90-degree orthogonality
  const snapWallPoint = useCallback(
    (raw: { x: number; y: number }, anchor?: { x: number; y: number } | null) => {
      let x = Math.round(raw.x * 4) / 4;
      let y = Math.round(raw.y * 4) / 4;

      // Orthogonal snap relative to anchor
      if (anchor) {
        if (Math.abs(raw.x - anchor.x) < 0.22) x = anchor.x;
        if (Math.abs(raw.y - anchor.y) < 0.22) y = anchor.y;
      }

      // Snap to existing wall endpoints within 0.25m
      for (const w of fp.walls) {
        if (Math.hypot(raw.x - w.x1, raw.y - w.y1) < 0.28) {
          return { x: w.x1, y: w.y1 };
        }
        if (Math.hypot(raw.x - w.x2, raw.y - w.y2) < 0.28) {
          return { x: w.x2, y: w.y2 };
        }
      }
      return { x, y };
    },
    [fp.walls]
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        setSpacePressed(true);
      }
      if (e.key === 'Escape' || e.key === 'Enter') {
        setMarquee(null);
        if (wallStart) {
          setWallStart(null);
          setWallCursor(null);
        } else if (e.key === 'Escape' && activeTool === 'wall') {
          onSetTool('select');
        }
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
  }, [activeTool, onSetTool, wallStart]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const zoomFactor = e.deltaY < 0 ? 1.09 : 0.92;
    const nextZoom = Math.min(2.6, Math.max(0.3, viewport.zoom * zoomFactor));
    const worldX = (mouseX - viewport.x) / viewport.zoom;
    const worldY = (mouseY - viewport.y) / viewport.zoom;
    onViewportChange({
      zoom: nextZoom,
      x: mouseX - worldX * nextZoom,
      y: mouseY - worldY * nextZoom,
    });
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || activeTool === 'pan' || spacePressed) {
      e.preventDefault();
      setPanState({ startX: e.clientX, startY: e.clientY, vpX: viewport.x, vpY: viewport.y });
      return;
    }

    if (readOnly) return;

    if (activeTool === 'wall') {
      const m = screenToMeters(e.clientX, e.clientY);
      const snapped = snapWallPoint(m, wallStart);

      if (!wallStart) {
        setWallStart(snapped);
        setWallCursor(snapped);
      } else {
        const len = Math.hypot(snapped.x - wallStart.x, snapped.y - wallStart.y);
        if (len >= 0.3) {
          const newWall: FloorWall = {
            id: makeId('w'),
            x1: wallStart.x,
            y1: wallStart.y,
            x2: snapped.x,
            y2: snapped.y,
            thickness: 0.16,
            kind: 'interior',
          };
          const nextWalls = [...fp.walls, newWall];
          const nextRooms = detectRoomsFromWalls(nextWalls, fp.rooms);
          onUpdateDoc(
            {
              ...doc,
              floorplan: { ...fp, walls: nextWalls, rooms: nextRooms },
            },
            true
          );
          // Continue connected wall chain; stop if closed onto an existing endpoint
          const closedLoop = fp.walls.some(
            (w) =>
              Math.hypot(w.x1 - snapped.x, w.y1 - snapped.y) < 0.08 ||
              Math.hypot(w.x2 - snapped.x, w.y2 - snapped.y) < 0.08
          );
          if (closedLoop) {
            setWallStart(null);
            setWallCursor(null);
          } else {
            setWallStart(snapped);
            setWallCursor(snapped);
          }
        }
      }
      return;
    }

    const m = screenToMeters(e.clientX, e.clientY);
    if (!e.shiftKey) onSelectItems([]);
    setMarquee({ x1: m.x, y1: m.y, x2: m.x, y2: m.y, additive: e.shiftKey });
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

    const m = screenToMeters(e.clientX, e.clientY);

    if (activeTool === 'wall') {
      setWallCursor(snapWallPoint(m, wallStart));
      return;
    }

    if (marquee) {
      setMarquee((prev) => (prev ? { ...prev, x2: m.x, y2: m.y } : null));
      return;
    }

    if (dragGroup) {
      const rawDx = m.x - dragGroup.startMX;
      const rawDy = m.y - dragGroup.startMY;
      if (!dragGroup.hasMoved && Math.hypot(rawDx, rawDy) < 0.04) return;
      const dx = Math.round(rawDx * 10) / 10;
      const dy = Math.round(rawDy * 10) / 10;

      const hasWallMove = Object.keys(dragGroup.wallsOrig).length > 0;
      const nextFurniture = fp.furniture.map((f) => {
        const orig = dragGroup.furnitureOrig[f.id];
        return orig ? { ...f, x: Number((orig.x + dx).toFixed(2)), y: Number((orig.y + dy).toFixed(2)) } : f;
      });
      const nextWalls = hasWallMove
        ? fp.walls.map((w) => {
            const orig = dragGroup.wallsOrig[w.id];
            return orig
              ? {
                  ...w,
                  x1: Number((orig.x1 + dx).toFixed(2)),
                  y1: Number((orig.y1 + dy).toFixed(2)),
                  x2: Number((orig.x2 + dx).toFixed(2)),
                  y2: Number((orig.y2 + dy).toFixed(2)),
                }
              : w;
          })
        : fp.walls;
      const nextRooms = hasWallMove ? detectRoomsFromWalls(nextWalls, fp.rooms) : fp.rooms;

      setDragGroup((prev) => (prev ? { ...prev, hasMoved: true } : null));
      onUpdateDoc(
        {
          ...doc,
          floorplan: { ...fp, furniture: nextFurniture, walls: nextWalls, rooms: nextRooms },
        },
        false
      );
      return;
    }

    if (dragConnectedWall) {
      const rawDx = m.x - dragConnectedWall.startMX;
      const rawDy = m.y - dragConnectedWall.startMY;
      if (!dragConnectedWall.hasMoved && Math.hypot(rawDx, rawDy) < 0.06) return;

      const res = resizeConnectedWall({
        targetWallId: dragConnectedWall.wallId,
        rawDx,
        rawDy,
        origWalls: dragConnectedWall.origWalls,
        origOpenings: dragConnectedWall.origOpenings,
        origRooms: dragConnectedWall.origRooms,
        origFurniture: dragConnectedWall.origFurniture,
        snapStep: 0.1,
      });

      if (res) {
        const nextOpenings = dragConnectedWall.origOpenings.map((op) =>
          res.openingRatios[op.id] !== undefined
            ? { ...op, offsetRatio: res.openingRatios[op.id] }
            : op
        );
        const nextFurniture = dragConnectedWall.origFurniture.map((f) =>
          res.furniturePos[f.id]
            ? { ...f, x: res.furniturePos[f.id].x, y: res.furniturePos[f.id].y }
            : f
        );
        setDragConnectedWall((prev) => (prev ? { ...prev, hasMoved: true } : null));
        onUpdateDoc(
          {
            ...doc,
            floorplan: {
              ...fp,
              walls: res.walls,
              openings: nextOpenings,
              rooms: res.rooms,
              furniture: nextFurniture,
            },
          },
          false
        );
      }
      return;
    }

    if (dragSpaceResize) {
      const { handle, origBounds } = dragSpaceResize;
      const snappedX = Math.round(m.x * 10) / 10;
      const snappedY = Math.round(m.y * 10) / 10;
      const minSpan = 1.0;

      let minX = origBounds.minX;
      let maxX = origBounds.maxX;
      let minY = origBounds.minY;
      let maxY = origBounds.maxY;

      if (handle.includes('w')) minX = Math.min(origBounds.maxX - minSpan, snappedX);
      if (handle.includes('e')) maxX = Math.max(origBounds.minX + minSpan, snappedX);
      if (handle.includes('n')) minY = Math.min(origBounds.maxY - minSpan, snappedY);
      if (handle.includes('s')) maxY = Math.max(origBounds.minY + minSpan, snappedY);

      if (dragSpaceResize.mode === 'scale-cluster') {
        const res = scaleConnectedSpace({
          spaceWallIds: dragSpaceResize.spaceWallIds,
          origBounds,
          nextBounds: {
            minX,
            minY,
            maxX,
            maxY,
            width: Math.max(minSpan, maxX - minX),
            height: Math.max(minSpan, maxY - minY),
          },
          origWalls: dragSpaceResize.origWalls,
          origOpenings: dragSpaceResize.origOpenings,
          origRooms: dragSpaceResize.origRooms,
          origFurniture: dragSpaceResize.origFurniture,
          interiorFurnitureIds: dragSpaceResize.interiorFurnitureIds,
        });

        if (res) {
          const nextOpenings = dragSpaceResize.origOpenings.map((op) =>
            res.openingRatios[op.id] !== undefined
              ? { ...op, offsetRatio: res.openingRatios[op.id] }
              : op
          );
          const nextFurniture = dragSpaceResize.origFurniture.map((f) =>
            res.furniturePos[f.id]
              ? { ...f, x: res.furniturePos[f.id].x, y: res.furniturePos[f.id].y }
              : f
          );
          setDragSpaceResize((prev) => (prev ? { ...prev, hasMoved: true } : null));
          onUpdateDoc(
            {
              ...doc,
              floorplan: {
                ...fp,
                walls: res.walls,
                openings: nextOpenings,
                rooms: res.rooms,
                furniture: nextFurniture,
              },
            },
            false
          );
        }
        return;
      }

      // Multi-room building: resize selected room by pushing/pulling its active edge wall(s)
      const edges = dragSpaceResize.edgeWallIds ?? {};
      let curWalls = dragSpaceResize.origWalls;
      let curOpenings = dragSpaceResize.origOpenings;
      let curRooms = dragSpaceResize.origRooms;
      let curFurniture = dragSpaceResize.origFurniture;
      let changed = false;

      const applyEdge = (wallId: string | undefined, dx: number, dy: number) => {
        if (!wallId || (Math.abs(dx) < 0.01 && Math.abs(dy) < 0.01)) return;
        const step = resizeConnectedWall({
          targetWallId: wallId,
          rawDx: dx,
          rawDy: dy,
          origWalls: curWalls,
          origOpenings: curOpenings,
          origRooms: curRooms,
          origFurniture: curFurniture,
          snapStep: 0.1,
        });
        if (step) {
          curWalls = step.walls;
          curOpenings = curOpenings.map((op) =>
            step.openingRatios[op.id] !== undefined
              ? { ...op, offsetRatio: step.openingRatios[op.id] }
              : op
          );
          curRooms = step.rooms;
          curFurniture = curFurniture.map((f) =>
            step.furniturePos[f.id]
              ? { ...f, x: step.furniturePos[f.id].x, y: step.furniturePos[f.id].y }
              : f
          );
          changed = true;
        }
      };

      if (handle.includes('w')) applyEdge(edges.w, minX - origBounds.minX, 0);
      if (handle.includes('e')) applyEdge(edges.e, maxX - origBounds.maxX, 0);
      if (handle.includes('n')) applyEdge(edges.n, 0, minY - origBounds.minY);
      if (handle.includes('s')) applyEdge(edges.s, 0, maxY - origBounds.maxY);

      if (changed) {
        setDragSpaceResize((prev) => (prev ? { ...prev, hasMoved: true } : null));
        onUpdateDoc(
          {
            ...doc,
            floorplan: {
              ...fp,
              walls: curWalls,
              openings: curOpenings,
              rooms: curRooms,
              furniture: curFurniture,
            },
          },
          false
        );
      }
      return;
    }

    if (dragWallEnd) {
      const snapped = snapWallPoint(m, null);
      const nextWalls = fp.walls.map((w) => {
        if (w.id !== dragWallEnd.wallId) return w;
        return dragWallEnd.end === 1
          ? { ...w, x1: snapped.x, y1: snapped.y }
          : { ...w, x2: snapped.x, y2: snapped.y };
      });
      const movedWall = nextWalls.find((w) => w.id === dragWallEnd.wallId);
      const nextOpenings = movedWall
        ? fp.openings.map((op) =>
            op.wallId === movedWall.id
              ? { ...op, offsetRatio: clampOpeningRatioForWall(op.offsetRatio, op.width, movedWall) }
              : op
          )
        : fp.openings;
      const nextRooms = detectRoomsFromWalls(nextWalls, fp.rooms);
      onUpdateDoc(
        { ...doc, floorplan: { ...fp, walls: nextWalls, openings: nextOpenings, rooms: nextRooms } },
        false
      );
      return;
    }

    if (dragOpening) {
      // Snap opening to nearest wall
      let bestWall: FloorWall | null = null;
      let bestRatio = 0.5;
      let bestDist = 1.2;
      for (const w of fp.walls) {
        const proj = projectPointToWall(m.x, m.y, w);
        if (proj.dist < bestDist) {
          bestDist = proj.dist;
          bestWall = w;
          bestRatio = proj.ratio;
        }
      }
      if (bestWall) {
        onUpdateDoc(
          {
            ...doc,
            floorplan: {
              ...fp,
              openings: fp.openings.map((op) =>
                op.id === dragOpening.openingId
                  ? { ...op, wallId: bestWall!.id, offsetRatio: Number(bestRatio.toFixed(3)) }
                  : op
              ),
            },
          },
          false
        );
      }
    }
  };

  const handleMouseUp = () => {
    if (panState) {
      setPanState(null);
      return;
    }
    if (marquee) {
      const minX = Math.min(marquee.x1, marquee.x2);
      const maxX = Math.max(marquee.x1, marquee.x2);
      const minY = Math.min(marquee.y1, marquee.y2);
      const maxY = Math.max(marquee.y1, marquee.y2);
      const draggedEnough = Math.hypot(maxX - minX, maxY - minY) > 0.14;

      if (draggedEnough) {
        const hits: FloorSelectionItem[] = [];
        for (const f of fp.furniture) {
          const hw = f.width / 2;
          const hd = f.depth / 2;
          if (f.x + hw >= minX && f.x - hw <= maxX && f.y + hd >= minY && f.y - hd <= maxY) {
            hits.push({ kind: 'furniture', id: f.id });
          }
        }
        for (const w of fp.walls) {
          const wMinX = Math.min(w.x1, w.x2);
          const wMaxX = Math.max(w.x1, w.x2);
          const wMinY = Math.min(w.y1, w.y2);
          const wMaxY = Math.max(w.y1, w.y2);
          if (wMaxX >= minX && wMinX <= maxX && wMaxY >= minY && wMinY <= maxY) {
            hits.push({ kind: 'wall', id: w.id });
          }
        }
        for (const op of fp.openings) {
          const wall = fp.walls.find((w) => w.id === op.wallId);
          if (!wall) continue;
          const ox = wall.x1 + (wall.x2 - wall.x1) * op.offsetRatio;
          const oy = wall.y1 + (wall.y2 - wall.y1) * op.offsetRatio;
          if (ox >= minX && ox <= maxX && oy >= minY && oy <= maxY) {
            hits.push({ kind: 'opening', id: op.id });
          }
        }

        if (marquee.additive) {
          const merged = [...selectedItems];
          for (const h of hits) {
            if (!merged.some((m) => m.kind === h.kind && m.id === h.id)) merged.push(h);
          }
          onSelectItems(merged);
        } else {
          onSelectItems(hits);
        }
      } else if (marquee.clickedRoomId) {
        onSelectItems([{ kind: 'room', id: marquee.clickedRoomId }]);
      }
      setMarquee(null);
      return;
    }

    if (dragGroup || dragWallEnd || dragOpening || dragConnectedWall || dragSpaceResize) {
      const didMove = dragGroup
        ? dragGroup.hasMoved
        : dragConnectedWall
        ? dragConnectedWall.hasMoved
        : dragSpaceResize
        ? dragSpaceResize.hasMoved
        : true;
      setDragGroup(null);
      setDragWallEnd(null);
      setDragOpening(null);
      setDragConnectedWall(null);
      setDragSpaceResize(null);
      if (didMove) onUpdateDoc(docRef.current, true);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggingLibraryItem || readOnly) return;
    const m = screenToMeters(e.clientX, e.clientY);

    if (draggingLibraryItem.floorItemKind === 'wall') {
      onSetTool('wall');
      onDropLibraryItemDone();
      return;
    }

    if (draggingLibraryItem.floorItemKind === 'room-rect') {
      const rw = draggingLibraryItem.realWidthM ?? 4;
      const rd = draggingLibraryItem.realDepthM ?? 3.5;
      const x1 = Math.round((m.x - rw / 2) * 2) / 2;
      const y1 = Math.round((m.y - rd / 2) * 2) / 2;
      const x2 = x1 + rw;
      const y2 = y1 + rd;
      const newWalls: FloorWall[] = [
        { id: makeId('w'), x1, y1, x2, y2: y1, thickness: 0.16, kind: 'interior' },
        { id: makeId('w'), x1: x2, y1, x2, y2, thickness: 0.16, kind: 'interior' },
        { id: makeId('w'), x1: x2, y1: y2, x2: x1, y2, thickness: 0.16, kind: 'interior' },
        { id: makeId('w'), x1, y1: y2, x2: x1, y2: y1, thickness: 0.16, kind: 'interior' },
      ];
      const nextWalls = [...fp.walls, ...newWalls];
      const nextRooms = detectRoomsFromWalls(nextWalls, fp.rooms);
      onUpdateDoc({ ...doc, floorplan: { ...fp, walls: nextWalls, rooms: nextRooms } }, true);
      onDropLibraryItemDone();
      return;
    }

    if (
      draggingLibraryItem.floorItemKind === 'door' ||
      draggingLibraryItem.floorItemKind === 'double-door' ||
      draggingLibraryItem.floorItemKind === 'sliding-door' ||
      draggingLibraryItem.floorItemKind === 'window'
    ) {
      let bestWall: FloorWall | null = null;
      let bestRatio = 0.5;
      let bestDist = Infinity;
      for (const w of fp.walls) {
        const proj = projectPointToWall(m.x, m.y, w);
        if (proj.dist < bestDist) {
          bestDist = proj.dist;
          bestWall = w;
          bestRatio = proj.ratio;
        }
      }
      if (bestWall) {
        const newOp: FloorOpening = {
          id: makeId('op'),
          wallId: bestWall.id,
          kind: draggingLibraryItem.floorItemKind,
          offsetRatio: Number(bestRatio.toFixed(3)),
          width: draggingLibraryItem.realWidthM ?? 0.9,
          swing: 'right',
          swingInward: true,
        };
        onUpdateDoc({ ...doc, floorplan: { ...fp, openings: [...fp.openings, newOp] } }, true);
        onSelectItems([{ kind: 'opening', id: newOp.id }]);
      }
      onDropLibraryItemDone();
      return;
    }

    // Furniture item
    const item = createFurnitureFromLibraryItem(draggingLibraryItem, m.x, m.y);
    onUpdateDoc({ ...doc, floorplan: { ...fp, furniture: [...fp.furniture, item] } }, true);
    onSelectItems([{ kind: 'furniture', id: item.id }]);
    onDropLibraryItemDone();
  };

  // Architectural top-down furniture renderer
  const renderFurnitureGraphic = (f: FloorFurniture) => {
    const w = f.width * ppm;
    const h = f.depth * ppm;
    const inMarquee =
      marquee !== null &&
      f.x + f.width / 2 >= Math.min(marquee.x1, marquee.x2) &&
      f.x - f.width / 2 <= Math.max(marquee.x1, marquee.x2) &&
      f.y + f.depth / 2 >= Math.min(marquee.y1, marquee.y2) &&
      f.y - f.depth / 2 <= Math.max(marquee.y1, marquee.y2);
    const isSel = isSelectedItem('furniture', f.id) || inMarquee;
    const stroke = isSel ? '#2563EB' : isBlueprint ? '#93C5FD' : darkMode ? '#64748B' : '#475569';
    const fill = isBlueprint ? 'rgba(56, 189, 248, 0.16)' : darkMode ? '#1E293B' : f.color;

    if (f.type === 'plant') {
      const r = Math.min(w, h) / 2;
      return (
        <g>
          <circle cx={0} cy={0} r={r} fill={fill} stroke={isSel ? '#2563EB' : '#16A34A'} strokeWidth={1.5} />
          <circle cx={0} cy={0} r={r * 0.45} fill="none" stroke="#16A34A" strokeWidth={1} strokeDasharray="3 2" />
        </g>
      );
    }

    if (f.type === 'tree') {
      const r = Math.min(w, h) / 2;
      return (
        <g>
          <circle cx={0} cy={0} r={r} fill={fill} fillOpacity={0.75} stroke={isSel ? '#2563EB' : '#15803D'} strokeWidth={1.6} />
          <circle cx={-r * 0.25} cy={-r * 0.18} r={r * 0.45} fill="none" stroke="#15803D" strokeOpacity={0.45} strokeWidth={1} />
          <circle cx={r * 0.25} cy={r * 0.15} r={r * 0.4} fill="none" stroke="#15803D" strokeOpacity={0.45} strokeWidth={1} />
          <circle cx={0} cy={0} r={Math.max(3, r * 0.12)} fill="#78350F" />
        </g>
      );
    }

    if (f.type === 'hedge') {
      return (
        <g>
          <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h / 2} fill={fill} stroke={isSel ? '#2563EB' : '#16A34A'} strokeWidth={1.5} />
          <path d={`M ${-w * 0.35} 0 Q ${-w * 0.18} ${-h * 0.3} 0 0 T ${w * 0.35} 0`} fill="none" stroke="#15803D" strokeOpacity={0.5} strokeWidth={1.2} />
        </g>
      );
    }

    if (f.type === 'bed' || f.type === 'king-bed' || f.type === 'twin-bed') {
      const isTwin = f.type === 'twin-bed';
      return (
        <g>
          <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={4} fill={fill} stroke={stroke} strokeWidth={1.5} />
          {isTwin ? (
            <rect x={-w / 2 + 6} y={-h / 2 + 6} width={w - 12} height={h * 0.2} rx={3} fill={darkMode ? '#334155' : '#FFFFFF'} stroke={stroke} strokeWidth={1} />
          ) : (
            <>
              <rect x={-w / 2 + 6} y={-h / 2 + 6} width={w / 2 - 10} height={h * 0.2} rx={3} fill={darkMode ? '#334155' : '#FFFFFF'} stroke={stroke} strokeWidth={1} />
              <rect x={4} y={-h / 2 + 6} width={w / 2 - 10} height={h * 0.2} rx={3} fill={darkMode ? '#334155' : '#FFFFFF'} stroke={stroke} strokeWidth={1} />
            </>
          )}
          <line x1={-w / 2} y1={-h / 2 + h * 0.34} x2={w / 2} y2={-h / 2 + h * 0.34} stroke={stroke} strokeWidth={1} />
        </g>
      );
    }

    if (f.type === 'sofa') {
      return (
        <g>
          <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={6} fill={fill} stroke={stroke} strokeWidth={1.5} />
          <rect x={-w / 2} y={-h / 2} width={w} height={h * 0.28} rx={4} fill={stroke} fillOpacity={0.14} />
          <line x1={-w / 6} y1={-h / 2 + h * 0.28} x2={-w / 6} y2={h / 2} stroke={stroke} strokeOpacity={0.4} strokeWidth={1} />
          <line x1={w / 6} y1={-h / 2 + h * 0.28} x2={w / 6} y2={h / 2} stroke={stroke} strokeOpacity={0.4} strokeWidth={1} />
        </g>
      );
    }

    if (f.type === 'sectional-sofa') {
      const arm = Math.min(w, h) * 0.42;
      return (
        <g>
          <path
            d={`M ${-w / 2} ${-h / 2} H ${w / 2} V ${h / 2} H ${w / 2 - arm} V ${-h / 2 + arm} H ${-w / 2} Z`}
            fill={fill}
            stroke={stroke}
            strokeWidth={1.5}
            strokeLinejoin="round"
          />
          <line x1={-w / 2} y1={-h / 2 + arm * 0.28} x2={w / 2} y2={-h / 2 + arm * 0.28} stroke={stroke} strokeOpacity={0.35} strokeWidth={1.2} />
          <line x1={w / 2 - arm * 0.28} y1={-h / 2 + arm * 0.28} x2={w / 2 - arm * 0.28} y2={h / 2} stroke={stroke} strokeOpacity={0.35} strokeWidth={1.2} />
        </g>
      );
    }

    if (f.type === 'armchair' || f.type === 'chair') {
      return (
        <g>
          <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={8} fill={fill} stroke={stroke} strokeWidth={1.4} />
          <rect x={-w / 2 + 4} y={h / 2 - 9} width={w - 8} height={6} rx={3} fill={stroke} fillOpacity={0.35} />
        </g>
      );
    }

    if (f.type === 'car-sedan' || f.type === 'car-suv') {
      const isSuv = f.type === 'car-suv';
      return (
        <g>
          <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={w * 0.24} fill={fill} stroke={stroke} strokeWidth={1.7} />
          {/* Windshield & rear glass */}
          <rect x={-w * 0.36} y={-h * 0.22} width={w * 0.72} height={h * 0.14} rx={4} fill={darkMode ? '#334155' : '#BAE6FD'} stroke={stroke} strokeWidth={1} />
          <rect x={-w * 0.34} y={h * (isSuv ? 0.22 : 0.16)} width={w * 0.68} height={h * 0.12} rx={3} fill={darkMode ? '#334155' : '#BAE6FD'} stroke={stroke} strokeWidth={1} />
          {/* Roof */}
          <rect x={-w * 0.34} y={-h * 0.06} width={w * 0.68} height={h * (isSuv ? 0.26 : 0.2)} rx={3} fill="none" stroke={stroke} strokeOpacity={0.45} strokeWidth={1} />
          {/* Side mirrors */}
          <rect x={-w / 2 - 4} y={-h * 0.22} width={4} height={8} rx={1.5} fill={stroke} />
          <rect x={w / 2} y={-h * 0.22} width={4} height={8} rx={1.5} fill={stroke} />
        </g>
      );
    }

    if (f.type === 'bathtub') {
      return (
        <g>
          <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={6} fill={fill} stroke={stroke} strokeWidth={1.5} />
          <rect x={-w / 2 + 6} y={-h / 2 + 6} width={w - 12} height={h - 12} rx={Math.min(w, h) * 0.3} fill={darkMode ? '#0F172A' : '#FFFFFF'} stroke={stroke} strokeWidth={1.1} />
          <circle cx={w / 2 - 14} cy={0} r={3.5} fill={stroke} fillOpacity={0.5} />
        </g>
      );
    }

    if (f.type === 'shower') {
      return (
        <g>
          <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={3} fill={fill} stroke={stroke} strokeWidth={1.5} />
          <line x1={-w / 2} y1={-h / 2} x2={w / 2} y2={h / 2} stroke={stroke} strokeOpacity={0.35} strokeWidth={1} />
          <line x1={w / 2} y1={-h / 2} x2={-w / 2} y2={h / 2} stroke={stroke} strokeOpacity={0.35} strokeWidth={1} />
          <circle cx={0} cy={0} r={4.5} fill="none" stroke={stroke} strokeWidth={1.3} />
        </g>
      );
    }

    if (f.type === 'toilet') {
      return (
        <g>
          <rect x={-w / 2} y={-h / 2} width={w} height={h * 0.3} rx={3} fill={fill} stroke={stroke} strokeWidth={1.4} />
          <ellipse cx={0} cy={h * 0.14} rx={w * 0.44} ry={h * 0.35} fill={fill} stroke={stroke} strokeWidth={1.4} />
        </g>
      );
    }

    if (f.type === 'vanity') {
      return (
        <g>
          <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={3} fill={fill} stroke={stroke} strokeWidth={1.4} />
          <ellipse cx={0} cy={0} rx={Math.min(w * 0.28, 16)} ry={Math.min(h * 0.34, 11)} fill={darkMode ? '#0F172A' : '#FFFFFF'} stroke={stroke} strokeWidth={1.1} />
        </g>
      );
    }

    if (f.type === 'stove') {
      const br = Math.min(w, h) * 0.16;
      return (
        <g>
          <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={3} fill={fill} stroke={stroke} strokeWidth={1.5} />
          <circle cx={-w * 0.22} cy={-h * 0.2} r={br} fill="none" stroke={stroke} strokeWidth={1.3} />
          <circle cx={w * 0.22} cy={-h * 0.2} r={br} fill="none" stroke={stroke} strokeWidth={1.3} />
          <circle cx={-w * 0.22} cy={h * 0.2} r={br} fill="none" stroke={stroke} strokeWidth={1.3} />
          <circle cx={w * 0.22} cy={h * 0.2} r={br} fill="none" stroke={stroke} strokeWidth={1.3} />
        </g>
      );
    }

    if (f.type === 'kitchen-counter') {
      return (
        <g>
          <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={3} fill={fill} stroke={stroke} strokeWidth={1.4} />
          <rect x={-w * 0.25} y={-h * 0.34} width={w * 0.28} height={h * 0.68} rx={3} fill={darkMode ? '#0F172A' : '#FFFFFF'} stroke={stroke} strokeWidth={1.1} />
          <circle cx={-w * 0.11} cy={0} r={2.5} fill={stroke} />
          <circle cx={w * 0.26} cy={-h * 0.16} r={Math.min(5, h * 0.15)} fill="none" stroke={stroke} strokeWidth={1.1} />
          <circle cx={w * 0.26} cy={h * 0.16} r={Math.min(5, h * 0.15)} fill="none" stroke={stroke} strokeWidth={1.1} />
        </g>
      );
    }

    if (f.type === 'stairs') {
      const steps = Math.max(5, Math.floor(h / 14));
      const lines = Array.from({ length: steps - 1 }, (_, i) => -h / 2 + ((i + 1) * h) / steps);
      return (
        <g>
          <rect x={-w / 2} y={-h / 2} width={w} height={h} fill={fill} stroke={stroke} strokeWidth={1.5} />
          {lines.map((y, idx) => (
            <line key={idx} x1={-w / 2} y1={y} x2={w / 2} y2={y} stroke={stroke} strokeWidth={1} />
          ))}
          <line x1={0} y1={h / 2 - 6} x2={0} y2={-h / 2 + 8} stroke={stroke} strokeWidth={1.3} />
          <path d={`M -5 ${-h / 2 + 14} L 0 ${-h / 2 + 6} L 5 ${-h / 2 + 14}`} fill="none" stroke={stroke} strokeWidth={1.3} />
        </g>
      );
    }

    if (f.type === 'spiral-stairs') {
      const r = Math.min(w, h) / 2;
      const spokes = Array.from({ length: 10 }, (_, i) => (i * Math.PI * 2) / 10);
      return (
        <g>
          <circle cx={0} cy={0} r={r} fill={fill} stroke={stroke} strokeWidth={1.5} />
          {spokes.map((ang, i) => (
            <line key={i} x1={0} y1={0} x2={Math.cos(ang) * r} y2={Math.sin(ang) * r} stroke={stroke} strokeWidth={1} />
          ))}
          <circle cx={0} cy={0} r={r * 0.18} fill={stroke} />
        </g>
      );
    }

    if (f.type === 'round-table' || f.type === 'cafe-table') {
      const r = Math.min(w, h) / 2;
      return (
        <g>
          <circle cx={0} cy={0} r={r} fill={fill} stroke={stroke} strokeWidth={1.5} />
          <text
            textAnchor="middle"
            dominantBaseline="middle"
            fill={isBlueprint ? '#EFF6FF' : darkMode ? '#CBD5E1' : '#334155'}
            fontSize={9.5}
            fontWeight={500}
          >
            {f.label}
          </text>
        </g>
      );
    }

    if (f.type === 'swimming-pool' || f.type === 'hot-tub') {
      return (
        <g>
          <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={f.type === 'hot-tub' ? 14 : 8} fill={fill} stroke={isSel ? '#2563EB' : '#0284C7'} strokeWidth={2} />
          <rect x={-w / 2 + 6} y={-h / 2 + 6} width={w - 12} height={h - 12} rx={f.type === 'hot-tub' ? 10 : 5} fill="none" stroke="#0284C7" strokeOpacity={0.45} strokeWidth={1} strokeDasharray="6 4" />
          <text
            textAnchor="middle"
            dominantBaseline="middle"
            fill={isBlueprint ? '#EFF6FF' : '#0C4A6E'}
            fontSize={10.5}
            fontWeight={600}
          >
            {f.label}
          </text>
        </g>
      );
    }

    if (f.type === 'patio-deck' || f.type === 'pergola') {
      const planks = Math.max(4, Math.floor(h / 18));
      const ys = Array.from({ length: planks - 1 }, (_, i) => -h / 2 + ((i + 1) * h) / planks);
      return (
        <g>
          <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={3} fill={fill} fillOpacity={0.65} stroke={stroke} strokeWidth={1.5} strokeDasharray={f.type === 'pergola' ? '5 3' : undefined} />
          {ys.map((y, idx) => (
            <line key={idx} x1={-w / 2} y1={y} x2={w / 2} y2={y} stroke={stroke} strokeOpacity={0.28} strokeWidth={1} />
          ))}
          <text
            textAnchor="middle"
            dominantBaseline="middle"
            fill={isBlueprint ? '#EFF6FF' : darkMode ? '#CBD5E1' : '#78350F'}
            fontSize={10.5}
            fontWeight={600}
          >
            {f.label}
          </text>
        </g>
      );
    }

    if (f.type === 'exec-desk') {
      const d = Math.min(w, h) * 0.42;
      return (
        <g>
          <path
            d={`M ${-w / 2} ${-h / 2} H ${w / 2} V ${h / 2} H ${w / 2 - d} V ${-h / 2 + d} H ${-w / 2} Z`}
            fill={fill}
            stroke={stroke}
            strokeWidth={1.5}
            strokeLinejoin="round"
          />
          <text x={0} y={-h / 2 + d / 2} textAnchor="middle" dominantBaseline="middle" fill={isBlueprint ? '#EFF6FF' : darkMode ? '#CBD5E1' : '#334155'} fontSize={9.5} fontWeight={500}>
            {f.label}
          </text>
        </g>
      );
    }

    if (f.type === 'elevator') {
      return (
        <g>
          <rect x={-w / 2} y={-h / 2} width={w} height={h} fill={fill} stroke={stroke} strokeWidth={1.8} />
          <line x1={-w / 2} y1={-h / 2} x2={w / 2} y2={h / 2} stroke={stroke} strokeOpacity={0.45} strokeWidth={1.2} />
          <line x1={w / 2} y1={-h / 2} x2={-w / 2} y2={h / 2} stroke={stroke} strokeOpacity={0.45} strokeWidth={1.2} />
          <text textAnchor="middle" dominantBaseline="middle" fill={isBlueprint ? '#EFF6FF' : darkMode ? '#CBD5E1' : '#0F172A'} fontSize={9.5} fontWeight={600}>
            ELEV
          </text>
        </g>
      );
    }

    if (f.type === 'column') {
      return (
        <g>
          <rect x={-w / 2} y={-h / 2} width={w} height={h} fill={isSel ? '#2563EB' : stroke} stroke={stroke} strokeWidth={1.5} />
          <line x1={-w / 2} y1={-h / 2} x2={w / 2} y2={h / 2} stroke="#FFFFFF" strokeOpacity={0.5} strokeWidth={1} />
          <line x1={w / 2} y1={-h / 2} x2={-w / 2} y2={h / 2} stroke="#FFFFFF" strokeOpacity={0.5} strokeWidth={1} />
        </g>
      );
    }

    return (
      <g>
        <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={4} fill={fill} stroke={stroke} strokeWidth={isSel ? 2 : 1.4} />
        <text
          textAnchor="middle"
          dominantBaseline="middle"
          fill={isBlueprint ? '#EFF6FF' : darkMode ? '#CBD5E1' : '#334155'}
          fontSize={10}
          fontWeight={500}
        >
          {f.label}
        </text>
      </g>
    );
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden select-none"
      style={{
        backgroundColor: canvasBg,
        cursor:
          panState || activeTool === 'pan' || spacePressed
            ? 'grab'
            : activeTool === 'wall'
            ? 'crosshair'
            : 'default',
      }}
      onWheel={handleWheel}
      onDragOver={(e) => e.preventDefault()}
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
        aria-label={`${doc.title} floor plan canvas`}
      >
        <defs>
          <pattern
            id="fp-grid"
            width={(ppm * 0.5) * viewport.zoom}
            height={(ppm * 0.5) * viewport.zoom}
            patternUnits="userSpaceOnUse"
            x={viewport.x % ((ppm * 0.5) * viewport.zoom)}
            y={viewport.y % ((ppm * 0.5) * viewport.zoom)}
          >
            <path
              d={`M ${(ppm * 0.5) * viewport.zoom} 0 L 0 0 0 ${(ppm * 0.5) * viewport.zoom}`}
              fill="none"
              stroke={gridColor}
              strokeWidth="1"
            />
          </pattern>
        </defs>

        {doc.settings.showGrid && (
          <rect width="100%" height="100%" fill="url(#fp-grid)" data-export-ignore="true" />
        )}

        <g
          data-canvas-content="true"
          transform={`translate(${viewport.x}, ${viewport.y}) scale(${viewport.zoom})`}
        >
          {/* 1. Auto-Detected & Named Rooms */}
          {fp.showRooms &&
            fp.rooms.map((room) => {
              const pts = room.polygon.map((p) => `${p.x * ppm},${p.y * ppm}`).join(' ');
              const center = polygonCentroid(room.polygon);
              const isSel = isSelectedItem('room', room.id);

              return (
                <g
                  key={room.id}
                  onMouseDown={(e) => {
                    if (activeTool === 'wall') return;
                    if (e.button === 1 || activeTool === 'pan' || spacePressed) return;
                    e.stopPropagation();
                    if (readOnly) {
                      onSelectItems([{ kind: 'room', id: room.id }]);
                      return;
                    }
                    // Allow starting a marquee selection inside a room's open floor area;
                    // a simple click (no drag) still selects the room cleanly!
                    const m = screenToMeters(e.clientX, e.clientY);
                    if (!e.shiftKey) onSelectItems([]);
                    setMarquee({
                      x1: m.x,
                      y1: m.y,
                      x2: m.x,
                      y2: m.y,
                      additive: e.shiftKey,
                      clickedRoomId: room.id,
                    });
                  }}
                  style={{ cursor: activeTool === 'wall' ? 'crosshair' : 'default' }}
                >
                  <polygon
                    points={pts}
                    fill={isBlueprint ? 'rgba(56, 189, 248, 0.08)' : darkMode ? '#111827' : room.color}
                    stroke={isSel ? '#2563EB' : 'none'}
                    strokeWidth={2}
                  />
                  <text
                    x={center.x * ppm}
                    y={center.y * ppm - 5}
                    textAnchor="middle"
                    fill={isBlueprint ? '#EFF6FF' : darkMode ? '#E2E8F0' : '#334155'}
                    fontSize={13}
                    fontWeight={600}
                    fontFamily="Plus Jakarta Sans, sans-serif"
                    style={{ pointerEvents: 'none' }}
                  >
                    {room.name}
                  </text>
                  <text
                    x={center.x * ppm}
                    y={center.y * ppm + 12}
                    textAnchor="middle"
                    fill={isBlueprint ? '#93C5FD' : darkMode ? '#94A3B8' : '#64748B'}
                    fontSize={11}
                    fontFamily="JetBrains Mono, monospace"
                    style={{ pointerEvents: 'none' }}
                  >
                    {formatArea(room.areaSqM, fp.unit)}
                  </text>
                </g>
              );
            })}

          {/* 2. Furniture Layer */}
          {fp.showFurniture &&
            fp.furniture.map((f) => (
              <g
                key={f.id}
                transform={`translate(${f.x * ppm}, ${f.y * ppm}) rotate(${f.rotation})`}
                onMouseDown={(e) => {
                  if (activeTool === 'wall') return;
                  if (e.button === 1 || activeTool === 'pan' || spacePressed) return;
                  e.stopPropagation();
                  let nextSelection = selectedItems;
                  if (e.shiftKey) {
                    nextSelection = isSelectedItem('furniture', f.id)
                      ? selectedItems.filter((s) => !(s.kind === 'furniture' && s.id === f.id))
                      : [...selectedItems, { kind: 'furniture', id: f.id }];
                    onSelectItems(nextSelection);
                  } else if (!isSelectedItem('furniture', f.id)) {
                    nextSelection = [{ kind: 'furniture', id: f.id }];
                    onSelectItems(nextSelection);
                  }
                  if (!readOnly && !f.locked) {
                    startFloorGroupDrag(e.clientX, e.clientY, nextSelection);
                  }
                }}
                style={{ cursor: activeTool === 'wall' ? 'crosshair' : 'move' }}
              >
                {renderFurnitureGraphic(f)}
              </g>
            ))}

          {/* 3. Walls & Live Dimension Labels */}
          {fp.walls.map((w) => {
            const x1 = w.x1 * ppm;
            const y1 = w.y1 * ppm;
            const x2 = w.x2 * ppm;
            const y2 = w.y2 * ppm;
            const lenM = Math.hypot(w.x2 - w.x1, w.y2 - w.y1);
            const inMarquee =
              marquee !== null &&
              Math.max(w.x1, w.x2) >= Math.min(marquee.x1, marquee.x2) &&
              Math.min(w.x1, w.x2) <= Math.max(marquee.x1, marquee.x2) &&
              Math.max(w.y1, w.y2) >= Math.min(marquee.y1, marquee.y2) &&
              Math.min(w.y1, w.y2) <= Math.max(marquee.y1, marquee.y2);
            const isSel = isSelectedItem('wall', w.id) || inMarquee;
            const wallColor = isSel
              ? '#2563EB'
              : isBlueprint
              ? '#E0F2FE'
              : darkMode
              ? '#CBD5E1'
              : '#1E293B';

            const mx = (x1 + x2) / 2;
            const my = (y1 + y2) / 2;
            const angleRad = Math.atan2(y2 - y1, x2 - x1);
            let angleDeg = (angleRad * 180) / Math.PI;
            if (angleDeg > 90 || angleDeg < -90) angleDeg += 180;
            const nx = -Math.sin(angleRad) * 18;
            const ny = Math.cos(angleRad) * 18;

            const isWallInEnclosed = isWallInEnclosedSpace(w.id, fp.walls, fp.rooms);
            const isSingleWallSelected =
              selectedItems.length === 1 &&
              selectedItems[0].kind === 'wall' &&
              selectedItems[0].id === w.id;
            const isHorizWall = Math.abs(w.y2 - w.y1) <= Math.abs(w.x2 - w.x1) * 0.35;
            const isVertWall = Math.abs(w.x2 - w.x1) <= Math.abs(w.y2 - w.y1) * 0.35;
            const wallCursor =
              activeTool === 'wall'
                ? 'crosshair'
                : isSingleWallSelected
                ? 'move'
                : isWallInEnclosed
                ? isHorizWall
                  ? 'ns-resize'
                  : isVertWall
                  ? 'ew-resize'
                  : 'move'
                : 'pointer';
            const wallStrokeColor = isSel
              ? selectedSpaceInfo
                ? '#0F766E'
                : '#2563EB'
              : wallColor;

            return (
              <g
                key={w.id}
                onMouseDown={(e) => {
                  if (activeTool === 'wall') return;
                  if (e.button === 1 || activeTool === 'pan' || spacePressed) return;
                  e.stopPropagation();

                  // Double-click selects ONLY this single wall
                  if (e.detail >= 2) {
                    setDragConnectedWall(null);
                    setDragGroup(null);
                    onSelectItems([{ kind: 'wall', id: w.id }]);
                    return;
                  }

                  // Shift-click toggles this wall in multi-selection
                  if (e.shiftKey) {
                    const nextSelection: FloorSelectionItem[] = isSelectedItem('wall', w.id)
                      ? selectedItems.filter((s) => !(s.kind === 'wall' && s.id === w.id))
                      : [...selectedItems, { kind: 'wall', id: w.id }];
                    onSelectItems(nextSelection);
                    return;
                  }

                  // If user already isolated this single wall via double-click, allow dragging just this wall
                  if (isSingleWallSelected) {
                    if (!readOnly) {
                      startFloorGroupDrag(e.clientX, e.clientY, [{ kind: 'wall', id: w.id }]);
                    }
                    return;
                  }

                  // Single-clicking any wall in a connected enclosed space selects the enclosed space
                  // and arms direct wall push/pull resizing so dragging resizes immediately!
                  if (isWallInEnclosed) {
                    const cluster = getConnectedWallCluster(w.id, fp.walls);
                    const spaceSelection: FloorSelectionItem[] = cluster.map((cw) => ({
                      kind: 'wall',
                      id: cw.id,
                    }));
                    onSelectItems(spaceSelection);

                    if (!readOnly) {
                      const m = screenToMeters(e.clientX, e.clientY);
                      setDragConnectedWall({
                        wallId: w.id,
                        startMX: m.x,
                        startMY: m.y,
                        origWalls: fp.walls.map((item) => ({ ...item })),
                        origOpenings: fp.openings.map((item) => ({ ...item })),
                        origRooms: fp.rooms.map((item) => ({
                          ...item,
                          polygon: item.polygon.map((p) => ({ ...p })),
                        })),
                        origFurniture: fp.furniture.map((item) => ({ ...item })),
                        hasMoved: false,
                      });
                    }
                    return;
                  }

                  // Standalone disconnected wall
                  const nextSelection: FloorSelectionItem[] = [{ kind: 'wall', id: w.id }];
                  onSelectItems(nextSelection);
                  if (!readOnly) {
                    startFloorGroupDrag(e.clientX, e.clientY, nextSelection);
                  }
                }}
                onDoubleClick={(e) => {
                  if (activeTool === 'wall') return;
                  e.stopPropagation();
                  setDragConnectedWall(null);
                  setDragGroup(null);
                  onSelectItems([{ kind: 'wall', id: w.id }]);
                }}
                style={{ cursor: wallCursor }}
              >
                {/* Invisible wider hit target for effortless wall clicking & resizing */}
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="transparent"
                  strokeWidth={Math.max(16, w.thickness * ppm + 10)}
                  strokeLinecap="square"
                  data-export-ignore="true"
                />
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={wallStrokeColor}
                  strokeWidth={Math.max(5, w.thickness * ppm)}
                  strokeLinecap="square"
                />

                {fp.showDimensions && lenM > 0.4 && (
                  <g transform={`translate(${mx + nx}, ${my + ny}) rotate(${angleDeg})`}>
                    <rect
                      x={-28}
                      y={-9}
                      width={56}
                      height={18}
                      rx={4}
                      fill={isBlueprint ? '#173A66' : darkMode ? '#0F172A' : '#FFFFFF'}
                      fillOpacity={0.9}
                    />
                    <text
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill={isBlueprint ? '#93C5FD' : darkMode ? '#94A3B8' : '#475569'}
                      fontSize={10.5}
                      fontWeight={500}
                      fontFamily="JetBrains Mono, monospace"
                    >
                      {formatLength(lenM, fp.unit)}
                    </text>
                  </g>
                )}

                {/* Draggable Wall Endpoints when single-selected (via double-click or standalone) */}
                {isSingleWallSelected && !readOnly && (
                  <g data-export-ignore="true">
                    {[
                      { end: 1 as const, cx: x1, cy: y1 },
                      { end: 2 as const, cx: x2, cy: y2 },
                    ].map((pt) => (
                      <circle
                        key={pt.end}
                        cx={pt.cx}
                        cy={pt.cy}
                        r={6.5}
                        fill="#FFFFFF"
                        stroke="#2563EB"
                        strokeWidth={2.2}
                        style={{ cursor: 'move' }}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          setDragWallEnd({ wallId: w.id, end: pt.end });
                        }}
                      />
                    ))}
                  </g>
                )}
              </g>
            );
          })}

          {/* 4. Snapped Doors & Windows */}
          {fp.openings.map((op) => {
            const wall = fp.walls.find((w) => w.id === op.wallId);
            if (!wall) return null;
            const cx = (wall.x1 + (wall.x2 - wall.x1) * op.offsetRatio) * ppm;
            const cy = (wall.y1 + (wall.y2 - wall.y1) * op.offsetRatio) * ppm;
            const angleDeg = (Math.atan2(wall.y2 - wall.y1, wall.x2 - wall.x1) * 180) / Math.PI;
            const halfW = (op.width * ppm) / 2;
            const wallThickPx = Math.max(6, wall.thickness * ppm) + 2;
            const isSel = isSelectedItem('opening', op.id);
            const swingDir = op.swingInward ? 1 : -1;

            return (
              <g
                key={op.id}
                transform={`translate(${cx}, ${cy}) rotate(${angleDeg})`}
                onMouseDown={(e) => {
                  if (activeTool === 'wall') return;
                  e.stopPropagation();
                  if (e.shiftKey) {
                    const next: FloorSelectionItem[] = isSelectedItem('opening', op.id)
                      ? selectedItems.filter((s) => !(s.kind === 'opening' && s.id === op.id))
                      : [...selectedItems, { kind: 'opening', id: op.id }];
                    onSelectItems(next);
                  } else {
                    onSelectItems([{ kind: 'opening', id: op.id }]);
                  }
                  if (!readOnly) setDragOpening({ openingId: op.id });
                }}
                style={{ cursor: activeTool === 'wall' ? 'crosshair' : 'ew-resize' }}
              >
                {/* Carve wall background */}
                <rect
                  x={-halfW}
                  y={-wallThickPx / 2}
                  width={halfW * 2}
                  height={wallThickPx}
                  fill={canvasBg}
                />

                {op.kind === 'window' ? (
                  <g>
                    <rect
                      x={-halfW}
                      y={-4}
                      width={halfW * 2}
                      height={8}
                      fill={isBlueprint ? '#0C4A6E' : '#E0F2FE'}
                      stroke={isSel ? '#2563EB' : '#0284C7'}
                      strokeWidth={1.5}
                    />
                    <line x1={-halfW} y1={0} x2={halfW} y2={0} stroke="#0284C7" strokeWidth={1} />
                  </g>
                ) : op.kind === 'sliding-door' ? (
                  <g>
                    <line x1={-halfW} y1={-3} x2={4} y2={-3} stroke={isSel ? '#2563EB' : '#0F766E'} strokeWidth={2.5} />
                    <line x1={-4} y1={3} x2={halfW} y2={3} stroke={isSel ? '#2563EB' : '#0284C7'} strokeWidth={2.5} />
                    <line x1={-halfW} y1={-5} x2={-halfW} y2={5} stroke={isSel ? '#2563EB' : '#475569'} strokeWidth={1.5} />
                    <line x1={halfW} y1={-5} x2={halfW} y2={5} stroke={isSel ? '#2563EB' : '#475569'} strokeWidth={1.5} />
                  </g>
                ) : op.kind === 'double-door' ? (
                  <g>
                    <line x1={-halfW} y1={0} x2={-halfW} y2={swingDir * halfW} stroke={isSel ? '#2563EB' : '#0284C7'} strokeWidth={2} />
                    <path
                      d={`M ${-halfW} ${swingDir * halfW} A ${halfW} ${halfW} 0 0 ${swingDir > 0 ? 0 : 1} 0 0`}
                      fill="none"
                      stroke={isSel ? '#2563EB' : '#0284C7'}
                      strokeWidth={1.2}
                      strokeDasharray="3 2"
                    />
                    <line x1={halfW} y1={0} x2={halfW} y2={swingDir * halfW} stroke={isSel ? '#2563EB' : '#0284C7'} strokeWidth={2} />
                    <path
                      d={`M ${halfW} ${swingDir * halfW} A ${halfW} ${halfW} 0 0 ${swingDir > 0 ? 1 : 0} 0 0`}
                      fill="none"
                      stroke={isSel ? '#2563EB' : '#0284C7'}
                      strokeWidth={1.2}
                      strokeDasharray="3 2"
                    />
                  </g>
                ) : (
                  <g>
                    <line
                      x1={op.swing === 'left' ? -halfW : halfW}
                      y1={0}
                      x2={op.swing === 'left' ? -halfW : halfW}
                      y2={swingDir * halfW * 2}
                      stroke={isSel ? '#2563EB' : '#2563EB'}
                      strokeWidth={2}
                    />
                    <path
                      d={
                        op.swing === 'left'
                          ? `M ${-halfW} ${swingDir * halfW * 2} A ${halfW * 2} ${halfW * 2} 0 0 ${swingDir > 0 ? 0 : 1} ${halfW} 0`
                          : `M ${halfW} ${swingDir * halfW * 2} A ${halfW * 2} ${halfW * 2} 0 0 ${swingDir > 0 ? 1 : 0} ${-halfW} 0`
                      }
                      fill="none"
                      stroke="#2563EB"
                      strokeWidth={1.25}
                      strokeDasharray="3 2"
                    />
                  </g>
                )}
              </g>
            );
          })}

          {/* 5. Live Wall Drawing Preview */}
          {activeTool === 'wall' && wallStart && wallCursor && (
            <g data-export-ignore="true">
              <line
                x1={wallStart.x * ppm}
                y1={wallStart.y * ppm}
                x2={wallCursor.x * ppm}
                y2={wallCursor.y * ppm}
                stroke="#2563EB"
                strokeWidth={Math.max(5, 0.16 * ppm)}
                strokeOpacity={0.65}
                strokeLinecap="square"
              />
              <circle cx={wallStart.x * ppm} cy={wallStart.y * ppm} r={5} fill="#2563EB" />
              <circle cx={wallCursor.x * ppm} cy={wallCursor.y * ppm} r={5} fill="#FFFFFF" stroke="#2563EB" strokeWidth={2} />
              {Math.hypot(wallCursor.x - wallStart.x, wallCursor.y - wallStart.y) > 0.1 && (
                <g
                  transform={`translate(${((wallStart.x + wallCursor.x) / 2) * ppm}, ${((wallStart.y + wallCursor.y) / 2) * ppm - 18})`}
                >
                  <rect x={-32} y={-11} width={64} height={22} rx={5} fill="#2563EB" />
                  <text
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#FFFFFF"
                    fontSize={11}
                    fontWeight={600}
                    fontFamily="JetBrains Mono, monospace"
                  >
                    {formatLength(Math.hypot(wallCursor.x - wallStart.x, wallCursor.y - wallStart.y), fp.unit)}
                  </text>
                </g>
              )}
            </g>
          )}
          {/* 6A. Enclosed Space 8-Handle Resize Bounding Box (Corners + Edges + Move Grip) */}
          {!readOnly && selectedSpaceInfo && !marquee && (() => {
            const { bounds, mode, wallIds, interiorFurnitureIds, edgeWallIds, label } = selectedSpaceInfo;
            const bx = bounds.minX * ppm;
            const by = bounds.minY * ppm;
            const bw = bounds.width * ppm;
            const bh = bounds.height * ppm;
            const invZ = 1 / viewport.zoom;
            const pad = 10 * invZ;
            const handleSz = 10 * invZ;
            const edgeLong = 18 * invZ;
            const edgeShort = 7 * invZ;

            const startResize = (e: React.MouseEvent, handle: SpaceResizeHandle) => {
              e.stopPropagation();
              setDragSpaceResize({
                mode,
                handle,
                spaceWallIds: new Set(wallIds),
                interiorFurnitureIds: new Set(interiorFurnitureIds),
                edgeWallIds,
                origBounds: { ...bounds },
                origWalls: fp.walls.map((w) => ({ ...w })),
                origOpenings: fp.openings.map((op) => ({ ...op })),
                origRooms: fp.rooms.map((r) => ({
                  ...r,
                  polygon: r.polygon.map((p) => ({ ...p })),
                })),
                origFurniture: fp.furniture.map((f) => ({ ...f })),
                hasMoved: false,
              });
            };

            const corners: Array<{ h: SpaceResizeHandle; x: number; y: number; cursor: string }> = [
              { h: 'nw', x: bx - pad, y: by - pad, cursor: 'nwse-resize' },
              { h: 'ne', x: bx + bw + pad, y: by - pad, cursor: 'nesw-resize' },
              { h: 'se', x: bx + bw + pad, y: by + bh + pad, cursor: 'nwse-resize' },
              { h: 'sw', x: bx - pad, y: by + bh + pad, cursor: 'nesw-resize' },
            ];

            const edges: Array<{
              h: SpaceResizeHandle;
              x: number;
              y: number;
              w: number;
              ht: number;
              cursor: string;
            }> = [
              { h: 'n', x: bx + bw / 2, y: by - pad, w: edgeLong, ht: edgeShort, cursor: 'ns-resize' },
              { h: 's', x: bx + bw / 2, y: by + bh + pad, w: edgeLong, ht: edgeShort, cursor: 'ns-resize' },
              { h: 'w', x: bx - pad, y: by + bh / 2, w: edgeShort, ht: edgeLong, cursor: 'ew-resize' },
              { h: 'e', x: bx + bw + pad, y: by + bh / 2, w: edgeShort, ht: edgeLong, cursor: 'ew-resize' },
            ];

            const dimText = `${label} · ${formatLength(bounds.width, fp.unit)} × ${formatLength(bounds.height, fp.unit)}`;
            const badgeW = Math.max(150, dimText.length * 6.8 + 20) * invZ;
            const badgeH = 22 * invZ;

            return (
              <g data-export-ignore="true">
                {/* Dashed frame around enclosed space */}
                <rect
                  x={bx - pad}
                  y={by - pad}
                  width={bw + pad * 2}
                  height={bh + pad * 2}
                  rx={4 * invZ}
                  fill="none"
                  stroke="#0F766E"
                  strokeWidth={1.6 * invZ}
                  strokeDasharray={`${6 * invZ} ${4 * invZ}`}
                  style={{ pointerEvents: 'none' }}
                />

                {/* Top live dimension & whole-space move grip */}
                <g
                  transform={`translate(${bx + bw / 2}, ${by - pad - 18 * invZ})`}
                  style={{ cursor: mode === 'scale-cluster' ? 'move' : 'default' }}
                  onMouseDown={(e) => {
                    if (mode !== 'scale-cluster') return;
                    e.stopPropagation();
                    const moveItems: FloorSelectionItem[] = [
                      ...Array.from(wallIds).map((id) => ({ kind: 'wall' as const, id })),
                      ...Array.from(interiorFurnitureIds).map((id) => ({
                        kind: 'furniture' as const,
                        id,
                      })),
                    ];
                    startFloorGroupDrag(e.clientX, e.clientY, moveItems);
                  }}
                >
                  <rect
                    x={-badgeW / 2}
                    y={-badgeH / 2}
                    width={badgeW}
                    height={badgeH}
                    rx={5 * invZ}
                    fill="#0F766E"
                  />
                  <text
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#FFFFFF"
                    fontSize={10.5 * invZ}
                    fontWeight={600}
                    fontFamily="JetBrains Mono, monospace"
                  >
                    {dimText}
                  </text>
                </g>

                {/* 4 Edge Resize Handles */}
                {edges.map((ed) => (
                  <rect
                    key={ed.h}
                    x={ed.x - ed.w / 2}
                    y={ed.y - ed.ht / 2}
                    width={ed.w}
                    height={ed.ht}
                    rx={3 * invZ}
                    fill="#FFFFFF"
                    stroke="#0F766E"
                    strokeWidth={2 * invZ}
                    style={{ cursor: ed.cursor }}
                    onMouseDown={(e) => startResize(e, ed.h)}
                  />
                ))}

                {/* 4 Corner Resize Handles */}
                {corners.map((c) => (
                  <rect
                    key={c.h}
                    x={c.x - handleSz / 2}
                    y={c.y - handleSz / 2}
                    width={handleSz}
                    height={handleSz}
                    rx={2.5 * invZ}
                    fill="#FFFFFF"
                    stroke="#0F766E"
                    strokeWidth={2 * invZ}
                    style={{ cursor: c.cursor }}
                    onMouseDown={(e) => startResize(e, c.h)}
                  />
                ))}
              </g>
            );
          })()}

          {/* 6B. Multi-Selection Group Bounding Box (for mixed furniture/wall marquee selections) */}
          {!readOnly && selectedItems.length >= 2 && !selectedSpaceInfo && !marquee && (() => {
            const xs: number[] = [];
            const ys: number[] = [];
            for (const it of selectedItems) {
              if (it.kind === 'furniture') {
                const f = fp.furniture.find((item) => item.id === it.id);
                if (f) {
                  xs.push((f.x - f.width / 2) * ppm, (f.x + f.width / 2) * ppm);
                  ys.push((f.y - f.depth / 2) * ppm, (f.y + f.depth / 2) * ppm);
                }
              } else if (it.kind === 'wall') {
                const w = fp.walls.find((item) => item.id === it.id);
                if (w) {
                  xs.push(w.x1 * ppm, w.x2 * ppm);
                  ys.push(w.y1 * ppm, w.y2 * ppm);
                }
              }
            }
            if (xs.length < 2) return null;
            const minX = Math.min(...xs) - 10;
            const minY = Math.min(...ys) - 10;
            const maxX = Math.max(...xs) + 10;
            const maxY = Math.max(...ys) + 10;
            return (
              <rect
                x={minX}
                y={minY}
                width={maxX - minX}
                height={maxY - minY}
                rx={6}
                fill="rgba(37, 99, 235, 0.04)"
                stroke="#2563EB"
                strokeWidth={1.5 / viewport.zoom}
                strokeDasharray={`${6 / viewport.zoom} ${4 / viewport.zoom}`}
                style={{ cursor: 'move' }}
                data-export-ignore="true"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  if (e.button === 1 || activeTool === 'pan' || spacePressed) {
                    setPanState({ startX: e.clientX, startY: e.clientY, vpX: viewport.x, vpY: viewport.y });
                    return;
                  }
                  startFloorGroupDrag(e.clientX, e.clientY, selectedItems);
                }}
              />
            );
          })()}

          {/* 7. Marquee Multi-Select Rectangle */}
          {marquee && (
            <rect
              x={Math.min(marquee.x1, marquee.x2) * ppm}
              y={Math.min(marquee.y1, marquee.y2) * ppm}
              width={Math.abs(marquee.x2 - marquee.x1) * ppm}
              height={Math.abs(marquee.y2 - marquee.y1) * ppm}
              fill="rgba(37, 99, 235, 0.09)"
              stroke="#2563EB"
              strokeWidth={1.25 / viewport.zoom}
              strokeDasharray={`${5 / viewport.zoom} ${3 / viewport.zoom}`}
              data-export-ignore="true"
            />
          )}
        </g>
      </svg>

      {/* Architectural Scale Bar & Contextual Wall/Space Hint */}
      <div className="pointer-events-none absolute left-4 bottom-16 z-20 flex flex-wrap items-center gap-2.5">
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur border border-slate-200 dark:border-slate-800 rounded-md px-3 py-1.5 flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-300 font-mono tabular-nums">
          <div className="h-2 border-x border-b border-slate-700 dark:border-slate-300" style={{ width: Math.round(ppm * 2 * viewport.zoom) }} />
          <span>{formatLength(2, fp.unit)}</span>
        </div>
        {activeTool === 'wall' ? (
          <div className="bg-teal-700 text-white rounded-md px-3 py-1.5 text-xs font-medium shadow-sm">
            Wall Tool Active · Click to place connected walls · Esc to finish
          </div>
        ) : selectedSpaceInfo ? (
          <div className="bg-teal-700/95 text-white rounded-md px-3 py-1.5 text-xs font-medium shadow-sm">
            {selectedSpaceInfo.label} selected · Drag edges/corners or any wall to resize · Double-click a wall for single wall
          </div>
        ) : selectedItems.length === 1 && selectedItems[0].kind === 'wall' ? (
          <div className="bg-slate-900/90 dark:bg-slate-800/95 text-white rounded-md px-3 py-1.5 text-xs font-medium shadow-sm">
            Single wall selected · Drag endpoints to reshape · Click another wall to select enclosed space
          </div>
        ) : null}
      </div>
    </div>
  );
};
