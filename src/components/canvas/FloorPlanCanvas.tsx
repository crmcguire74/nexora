import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  DiagramDocument,
  FloorFurniture,
  FloorOpening,
  FloorWall,
  ViewportState,
} from '../../types/diagram';
import { DIAGRAM_THEMES } from '../../engine/themes';
import {
  detectRoomsFromWalls,
  formatArea,
  formatLength,
  polygonCentroid,
  projectPointToWall,
} from '../../engine/geometry';
import { createFurnitureFromLibraryItem, LibraryItem } from '../../engine/libraries';
import { makeId } from '../../engine/templates';

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

  const [dragOpening, setDragOpening] = useState<{ openingId: string } | null>(null);

  const docRef = useRef(doc);
  docRef.current = doc;

  const isSelectedItem = (kind: FloorSelectionItem['kind'], id: string) =>
    selectedItems.some((s) => s.kind === kind && s.id === id);

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

    if (dragWallEnd) {
      const snapped = snapWallPoint(m, null);
      const nextWalls = fp.walls.map((w) => {
        if (w.id !== dragWallEnd.wallId) return w;
        return dragWallEnd.end === 1
          ? { ...w, x1: snapped.x, y1: snapped.y }
          : { ...w, x2: snapped.x, y2: snapped.y };
      });
      const nextRooms = detectRoomsFromWalls(nextWalls, fp.rooms);
      onUpdateDoc({ ...doc, floorplan: { ...fp, walls: nextWalls, rooms: nextRooms } }, false);
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

    if (dragGroup || dragWallEnd || dragOpening) {
      const didMove = dragGroup ? dragGroup.hasMoved : true;
      setDragGroup(null);
      setDragWallEnd(null);
      setDragOpening(null);
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

    if (f.type === 'bed') {
      return (
        <g>
          <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={4} fill={fill} stroke={stroke} strokeWidth={1.5} />
          <rect x={-w / 2 + 6} y={-h / 2 + 6} width={w / 2 - 10} height={h * 0.2} rx={3} fill={darkMode ? '#334155' : '#FFFFFF'} stroke={stroke} strokeWidth={1} />
          <rect x={4} y={-h / 2 + 6} width={w / 2 - 10} height={h * 0.2} rx={3} fill={darkMode ? '#334155' : '#FFFFFF'} stroke={stroke} strokeWidth={1} />
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

    if (f.type === 'chair') {
      return (
        <g>
          <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={8} fill={fill} stroke={stroke} strokeWidth={1.4} />
          <rect x={-w / 2 + 4} y={h / 2 - 9} width={w - 8} height={6} rx={3} fill={stroke} fillOpacity={0.35} />
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
          fontSize={10.5}
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

            return (
              <g
                key={w.id}
                onMouseDown={(e) => {
                  if (activeTool === 'wall') return;
                  if (e.button === 1 || activeTool === 'pan' || spacePressed) return;
                  e.stopPropagation();
                  let nextSelection = selectedItems;
                  if (e.shiftKey) {
                    nextSelection = isSelectedItem('wall', w.id)
                      ? selectedItems.filter((s) => !(s.kind === 'wall' && s.id === w.id))
                      : [...selectedItems, { kind: 'wall', id: w.id }];
                    onSelectItems(nextSelection);
                  } else if (!isSelectedItem('wall', w.id)) {
                    nextSelection = [{ kind: 'wall', id: w.id }];
                    onSelectItems(nextSelection);
                  }
                  if (!readOnly && nextSelection.length > 1) {
                    startFloorGroupDrag(e.clientX, e.clientY, nextSelection);
                  }
                }}
                style={{ cursor: activeTool === 'wall' ? 'crosshair' : 'pointer' }}
              >
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={wallColor}
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

                {/* Draggable Wall Endpoints when single-selected */}
                {isSel && selectedItems.length === 1 && !readOnly && (
                  <g data-export-ignore="true">
                    {[
                      { end: 1 as const, cx: x1, cy: y1 },
                      { end: 2 as const, cx: x2, cy: y2 },
                    ].map((pt) => (
                      <circle
                        key={pt.end}
                        cx={pt.cx}
                        cy={pt.cy}
                        r={6}
                        fill="#FFFFFF"
                        stroke="#2563EB"
                        strokeWidth={2}
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
          {/* 6. Multi-Selection Group Bounding Box (Drag anywhere in bounds to move all selected!) */}
          {!readOnly && selectedItems.length >= 2 && !marquee && (() => {
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

      {/* Architectural Scale Bar & Active Wall Mode Hint */}
      <div className="pointer-events-none absolute left-4 bottom-16 z-20 flex items-center gap-3">
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur border border-slate-200 dark:border-slate-800 rounded-md px-3 py-1.5 flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-300 font-mono tabular-nums">
          <div className="h-2 border-x border-b border-slate-700 dark:border-slate-300" style={{ width: Math.round(ppm * 2 * viewport.zoom) }} />
          <span>{formatLength(2, fp.unit)}</span>
        </div>
        {activeTool === 'wall' && (
          <div className="bg-blue-600 text-white rounded-md px-3 py-1.5 text-xs font-medium shadow-sm">
            Wall Tool Active · Click to place connected walls · Esc to finish
          </div>
        )}
      </div>
    </div>
  );
};
