import {
  DiagramConnection,
  DiagramObject,
  FloorRoom,
  FloorWall,
  MeasurementUnit,
  PortSide,
} from '../types/diagram';

export interface Point {
  x: number;
  y: number;
}

export interface AlignmentGuide {
  orientation: 'horizontal' | 'vertical';
  position: number;
  start: number;
  end: number;
}

export function getPortPoint(obj: DiagramObject, side: Exclude<PortSide, 'auto'>): Point {
  const cx = obj.x + obj.width / 2;
  const cy = obj.y + obj.height / 2;
  switch (side) {
    case 'top':
      return { x: cx, y: obj.y };
    case 'right':
      return { x: obj.x + obj.width, y: cy };
    case 'bottom':
      return { x: cx, y: obj.y + obj.height };
    case 'left':
      return { x: obj.x, y: cy };
  }
}

export function resolvePorts(
  from: DiagramObject,
  to: DiagramObject,
  fromPort: PortSide,
  toPort: PortSide
): { start: Point; end: Point; startSide: Exclude<PortSide, 'auto'>; endSide: Exclude<PortSide, 'auto'> } {
  const fcx = from.x + from.width / 2;
  const fcy = from.y + from.height / 2;
  const tcx = to.x + to.width / 2;
  const tcy = to.y + to.height / 2;
  const dx = tcx - fcx;
  const dy = tcy - fcy;

  let startSide: Exclude<PortSide, 'auto'>;
  let endSide: Exclude<PortSide, 'auto'>;

  if (fromPort !== 'auto') {
    startSide = fromPort;
  } else if (Math.abs(dx) >= Math.abs(dy)) {
    startSide = dx >= 0 ? 'right' : 'left';
  } else {
    startSide = dy >= 0 ? 'bottom' : 'top';
  }

  if (toPort !== 'auto') {
    endSide = toPort;
  } else if (Math.abs(dx) >= Math.abs(dy)) {
    endSide = dx >= 0 ? 'left' : 'right';
  } else {
    endSide = dy >= 0 ? 'top' : 'bottom';
  }

  return {
    start: getPortPoint(from, startSide),
    end: getPortPoint(to, endSide),
    startSide,
    endSide,
  };
}

function getNormalOffset(side: Exclude<PortSide, 'auto'>, dist: number): Point {
  switch (side) {
    case 'top':
      return { x: 0, y: -dist };
    case 'right':
      return { x: dist, y: 0 };
    case 'bottom':
      return { x: 0, y: dist };
    case 'left':
      return { x: -dist, y: 0 };
  }
}

function buildRoundedPolylinePath(pts: Point[], radius = 10): string {
  if (pts.length < 2) return '';
  if (pts.length === 2) {
    return `M ${pts[0].x} ${pts[0].y} L ${pts[1].x} ${pts[1].y}`;
  }
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const prev = pts[i - 1];
    const curr = pts[i];
    const next = pts[i + 1];
    const v1x = curr.x - prev.x;
    const v1y = curr.y - prev.y;
    const v2x = next.x - curr.x;
    const v2y = next.y - curr.y;
    const len1 = Math.hypot(v1x, v1y);
    const len2 = Math.hypot(v2x, v2y);
    if (len1 < 1 || len2 < 1) {
      d += ` L ${curr.x} ${curr.y}`;
      continue;
    }
    const r = Math.min(radius, len1 / 2, len2 / 2);
    const p1x = curr.x - (v1x / len1) * r;
    const p1y = curr.y - (v1y / len1) * r;
    const p2x = curr.x + (v2x / len2) * r;
    const p2y = curr.y + (v2y / len2) * r;
    d += ` L ${p1x} ${p1y} Q ${curr.x} ${curr.y} ${p2x} ${p2y}`;
  }
  const last = pts[pts.length - 1];
  d += ` L ${last.x} ${last.y}`;
  return d;
}

export function buildConnectorPath(
  conn: DiagramConnection,
  from: DiagramObject,
  to: DiagramObject
): { path: string; labelPos: Point; start: Point; end: Point } {
  const { start, end, startSide, endSide } = resolvePorts(from, to, conn.fromPort, conn.toPort);

  if (conn.routing === 'straight') {
    const path = `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
    return {
      path,
      labelPos: { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 },
      start,
      end,
    };
  }

  if (conn.routing === 'curved') {
    const dist = Math.max(48, Math.hypot(end.x - start.x, end.y - start.y) * 0.35);
    const n1 = getNormalOffset(startSide, dist);
    const n2 = getNormalOffset(endSide, dist);
    const c1 = { x: start.x + n1.x, y: start.y + n1.y };
    const c2 = { x: end.x + n2.x, y: end.y + n2.y };
    const path = `M ${start.x} ${start.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${end.x} ${end.y}`;
    // Cubic bezier midpoint at t=0.5
    const mx = 0.125 * start.x + 0.375 * c1.x + 0.375 * c2.x + 0.125 * end.x;
    const my = 0.125 * start.y + 0.375 * c1.y + 0.375 * c2.y + 0.125 * end.y;
    return { path, labelPos: { x: mx, y: my }, start, end };
  }

  // Orthogonal smart routing with rounded elbows
  const pad = 24;
  const n1 = getNormalOffset(startSide, pad);
  const n2 = getNormalOffset(endSide, pad);
  const p1 = { x: start.x + n1.x, y: start.y + n1.y };
  const p2 = { x: end.x + n2.x, y: end.y + n2.y };

  const horizontalStart = startSide === 'left' || startSide === 'right';
  const horizontalEnd = endSide === 'left' || endSide === 'right';

  const pts: Point[] = [start];

  if (horizontalStart && horizontalEnd) {
    const midX = (p1.x + p2.x) / 2;
    const facingDirectly =
      (startSide === 'right' && endSide === 'left' && end.x >= start.x + 12) ||
      (startSide === 'left' && endSide === 'right' && start.x >= end.x + 12);
    if (facingDirectly) {
      if (Math.abs(start.y - end.y) < 3) {
        pts.push(end);
      } else {
        pts.push({ x: midX, y: start.y }, { x: midX, y: end.y }, end);
      }
    } else {
      const midY = (start.y + end.y) / 2;
      pts.push(p1, { x: p1.x, y: midY }, { x: p2.x, y: midY }, p2, end);
    }
  } else if (!horizontalStart && !horizontalEnd) {
    const midY = (p1.y + p2.y) / 2;
    const facingDirectly =
      (startSide === 'bottom' && endSide === 'top' && end.y >= start.y + 12) ||
      (startSide === 'top' && endSide === 'bottom' && start.y >= end.y + 12);
    if (facingDirectly) {
      if (Math.abs(start.x - end.x) < 3) {
        pts.push(end);
      } else {
        pts.push({ x: start.x, y: midY }, { x: end.x, y: midY }, end);
      }
    } else {
      const midX = (start.x + end.x) / 2;
      pts.push(p1, { x: midX, y: p1.y }, { x: midX, y: p2.y }, p2, end);
    }
  } else if (horizontalStart && !horizontalEnd) {
    pts.push({ x: end.x, y: start.y }, end);
  } else {
    pts.push({ x: start.x, y: end.y }, end);
  }

  // Deduplicate near-identical points
  const clean: Point[] = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const prev = clean[clean.length - 1];
    if (Math.hypot(pts[i].x - prev.x, pts[i].y - prev.y) > 2) {
      clean.push(pts[i]);
    }
  }

  // Compute midpoint along polyline length for crisp label placement
  let totalLen = 0;
  const segLens: number[] = [];
  for (let i = 0; i < clean.length - 1; i++) {
    const l = Math.hypot(clean[i + 1].x - clean[i].x, clean[i + 1].y - clean[i].y);
    segLens.push(l);
    totalLen += l;
  }
  let target = totalLen / 2;
  let labelPos = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
  for (let i = 0; i < segLens.length; i++) {
    if (target <= segLens[i] && segLens[i] > 0) {
      const ratio = target / segLens[i];
      labelPos = {
        x: clean[i].x + (clean[i + 1].x - clean[i].x) * ratio,
        y: clean[i].y + (clean[i + 1].y - clean[i].y) * ratio,
      };
      break;
    }
    target -= segLens[i];
  }

  return {
    path: buildRoundedPolylinePath(clean, 10),
    labelPos,
    start,
    end,
  };
}

export function computeSmartSnap(
  moving: { x: number; y: number; width: number; height: number },
  others: DiagramObject[],
  threshold = 7
): { snappedX: number; snappedY: number; guides: AlignmentGuide[] } {
  let snappedX = moving.x;
  let snappedY = moving.y;
  const guides: AlignmentGuide[] = [];

  const mLeft = moving.x;
  const mCenterX = moving.x + moving.width / 2;
  const mRight = moving.x + moving.width;
  const mTop = moving.y;
  const mCenterY = moving.y + moving.height / 2;
  const mBottom = moving.y + moving.height;

  let bestDx = threshold + 1;
  let bestDy = threshold + 1;
  let bestVGuide: AlignmentGuide | null = null;
  let bestHGuide: AlignmentGuide | null = null;

  for (const other of others) {
    if (!other.visible) continue;
    const oLeft = other.x;
    const oCenterX = other.x + other.width / 2;
    const oRight = other.x + other.width;
    const oTop = other.y;
    const oCenterY = other.y + other.height / 2;
    const oBottom = other.y + other.height;

    const xPairs: Array<[number, number, number]> = [
      [mLeft, oLeft, oLeft],
      [mCenterX, oCenterX, oCenterX - moving.width / 2],
      [mRight, oRight, oRight - moving.width],
      [mLeft, oRight, oRight],
      [mRight, oLeft, oLeft - moving.width],
    ];

    for (const [mVal, oVal, newX] of xPairs) {
      const diff = Math.abs(mVal - oVal);
      if (diff < bestDx) {
        bestDx = diff;
        snappedX = newX;
        bestVGuide = {
          orientation: 'vertical',
          position: oVal,
          start: Math.min(mTop, oTop) - 24,
          end: Math.max(mBottom, oBottom) + 24,
        };
      }
    }

    const yPairs: Array<[number, number, number]> = [
      [mTop, oTop, oTop],
      [mCenterY, oCenterY, oCenterY - moving.height / 2],
      [mBottom, oBottom, oBottom - moving.height],
      [mTop, oBottom, oBottom],
      [mBottom, oTop, oTop - moving.height],
    ];

    for (const [mVal, oVal, newY] of yPairs) {
      const diff = Math.abs(mVal - oVal);
      if (diff < bestDy) {
        bestDy = diff;
        snappedY = newY;
        bestHGuide = {
          orientation: 'horizontal',
          position: oVal,
          start: Math.min(mLeft, oLeft) - 24,
          end: Math.max(mRight, oRight) + 24,
        };
      }
    }
  }

  if (bestVGuide) guides.push(bestVGuide);
  if (bestHGuide) guides.push(bestHGuide);

  return { snappedX, snappedY, guides };
}

// ==========================================
// Floor Plan Measurement & Room Detection
// ==========================================

export function formatLength(meters: number, unit: MeasurementUnit): string {
  switch (unit) {
    case 'm':
      return `${meters.toFixed(2)} m`;
    case 'cm':
      return `${Math.round(meters * 100)} cm`;
    case 'mm':
      return `${Math.round(meters * 1000)} mm`;
    case 'ft':
      return `${(meters * 3.28084).toFixed(1)} ft`;
    case 'ft-in': {
      const totalInches = Math.round(meters * 39.3701);
      const feet = Math.floor(totalInches / 12);
      const inches = totalInches % 12;
      return `${feet}' ${inches}"`;
    }
  }
}

export function formatArea(sqMeters: number, unit: MeasurementUnit): string {
  if (unit === 'ft' || unit === 'ft-in') {
    return `${Math.round(sqMeters * 10.7639)} sq ft`;
  }
  return `${sqMeters.toFixed(1)} m²`;
}

export function projectPointToWall(
  px: number,
  py: number,
  wall: FloorWall
): { x: number; y: number; dist: number; ratio: number } {
  const dx = wall.x2 - wall.x1;
  const dy = wall.y2 - wall.y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq < 1e-6) {
    return { x: wall.x1, y: wall.y1, dist: Math.hypot(px - wall.x1, py - wall.y1), ratio: 0.5 };
  }
  const t = Math.max(0.08, Math.min(0.92, ((px - wall.x1) * dx + (py - wall.y1) * dy) / lenSq));
  const projX = wall.x1 + t * dx;
  const projY = wall.y1 + t * dy;
  return { x: projX, y: projY, dist: Math.hypot(px - projX, py - projY), ratio: t };
}

export function polygonArea(poly: Point[]): number {
  let area = 0;
  for (let i = 0; i < poly.length; i++) {
    const j = (i + 1) % poly.length;
    area += poly[i].x * poly[j].y - poly[j].x * poly[i].y;
  }
  return Math.abs(area) / 2;
}

export function polygonCentroid(poly: Point[]): Point {
  if (poly.length === 0) return { x: 0, y: 0 };
  let x = 0;
  let y = 0;
  for (const p of poly) {
    x += p.x;
    y += p.y;
  }
  return { x: x / poly.length, y: y / poly.length };
}

/**
 * Detects enclosed wall loops (minimal cycles) and reconciles them with existing named rooms.
 */
export function detectRoomsFromWalls(walls: FloorWall[], existingRooms: FloorRoom[]): FloorRoom[] {
  if (walls.length < 3) return existingRooms.filter((r) => !r.autoDetected);

  // Snap vertices within 0.12m tolerance
  const vertices: Point[] = [];
  const getVertexId = (x: number, y: number): number => {
    for (let i = 0; i < vertices.length; i++) {
      if (Math.hypot(vertices[i].x - x, vertices[i].y - y) < 0.15) {
        return i;
      }
    }
    vertices.push({ x: Number(x.toFixed(2)), y: Number(y.toFixed(2)) });
    return vertices.length - 1;
  };

  // Build adjacency graph (also split walls at T-junctions where another wall endpoint sits on the segment)
  const edges: Array<[number, number]> = [];
  for (const w of walls) {
    const ptsOnWall: Array<{ t: number; id: number }> = [
      { t: 0, id: getVertexId(w.x1, w.y1) },
      { t: 1, id: getVertexId(w.x2, w.y2) },
    ];
    for (const other of walls) {
      if (other.id === w.id) continue;
      for (const ep of [
        { x: other.x1, y: other.y1 },
        { x: other.x2, y: other.y2 },
      ]) {
        const proj = projectPointToWall(ep.x, ep.y, w);
        if (proj.dist < 0.14 && proj.ratio > 0.05 && proj.ratio < 0.95) {
          ptsOnWall.push({ t: proj.ratio, id: getVertexId(ep.x, ep.y) });
        }
      }
    }
    ptsOnWall.sort((a, b) => a.t - b.t);
    for (let i = 0; i < ptsOnWall.length - 1; i++) {
      if (ptsOnWall[i].id !== ptsOnWall[i + 1].id) {
        edges.push([ptsOnWall[i].id, ptsOnWall[i + 1].id]);
      }
    }
  }

  // Planar face traversal using half-edges
  const adj = new Map<number, number[]>();
  const addNeighbor = (u: number, v: number) => {
    const list = adj.get(u) ?? [];
    if (!list.includes(v)) list.push(v);
    adj.set(u, list);
  };
  for (const [u, v] of edges) {
    addNeighbor(u, v);
    addNeighbor(v, u);
  }

  // Sort neighbors counter-clockwise around each vertex
  for (const [u, neighbors] of adj.entries()) {
    const vu = vertices[u];
    neighbors.sort((a, b) => {
      const angA = Math.atan2(vertices[a].y - vu.y, vertices[a].x - vu.x);
      const angB = Math.atan2(vertices[b].y - vu.y, vertices[b].x - vu.x);
      return angA - angB;
    });
  }

  const visitedHalfEdges = new Set<string>();
  const detectedPolys: Point[][] = [];

  for (const [u, neighbors] of adj.entries()) {
    for (const v of neighbors) {
      const key = `${u}->${v}`;
      if (visitedHalfEdges.has(key)) continue;
      const cycle: number[] = [];
      let currU = u;
      let currV = v;
      let steps = 0;
      while (steps < 30) {
        const hKey = `${currU}->${currV}`;
        if (visitedHalfEdges.has(hKey)) break;
        visitedHalfEdges.add(hKey);
        cycle.push(currU);
        const nextNeighbors = adj.get(currV);
        if (!nextNeighbors || nextNeighbors.length < 2) break;
        const idx = nextNeighbors.indexOf(currU);
        if (idx === -1) break;
        const nextV = nextNeighbors[(idx - 1 + nextNeighbors.length) % nextNeighbors.length];
        currU = currV;
        currV = nextV;
        steps++;
        if (currU === u && currV === v) {
          // Valid closed face! Check signed area to exclude the outer unbounded face
          const poly = cycle.map((id) => vertices[id]);
          let signed = 0;
          for (let i = 0; i < poly.length; i++) {
            const j = (i + 1) % poly.length;
            signed += poly[i].x * poly[j].y - poly[j].x * poly[i].y;
          }
          const area = Math.abs(signed) / 2;
          if (signed > 0 && area >= 1.0 && area <= 800 && poly.length >= 3) {
            detectedPolys.push(poly);
          }
          break;
        }
      }
    }
  }

  const roomColors = ['#F8FAFC', '#F0F9FF', '#F0FDFA', '#FFFBEB', '#FEF2F2'];
  const result: FloorRoom[] = [];
  const usedExisting = new Set<string>();

  detectedPolys.forEach((poly, idx) => {
    const center = polygonCentroid(poly);
    const areaSqM = Number(polygonArea(poly).toFixed(2));

    // Match closest existing room by centroid proximity
    let match: FloorRoom | undefined;
    let bestDist = 2.0;
    for (const er of existingRooms) {
      if (usedExisting.has(er.id)) continue;
      const ec = polygonCentroid(er.polygon);
      const d = Math.hypot(ec.x - center.x, ec.y - center.y);
      if (d < bestDist) {
        bestDist = d;
        match = er;
      }
    }

    if (match) {
      usedExisting.add(match.id);
      result.push({
        ...match,
        polygon: poly,
        areaSqM,
      });
    } else {
      result.push({
        id: `room_${Date.now().toString(36)}_${idx}`,
        name: `Room ${idx + 1}`,
        roomType: 'Workspace',
        floorMaterial: 'hardwood',
        color: roomColors[idx % roomColors.length],
        polygon: poly,
        areaSqM,
        autoDetected: true,
      });
    }
  });

  return result;
}

// ==========================================
// Floor Plan Connected Wall & Space Resizing
// ==========================================

export interface FloorBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
}

export function pointInPolygon(pt: Point, poly: Point[], edgeTolerance = 0.16): boolean {
  if (poly.length < 3) return false;
  // Check proximity to polygon edges first so items flush against walls count as inside
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const lenSq = dx * dx + dy * dy;
    if (lenSq < 1e-6) continue;
    const t = Math.max(0, Math.min(1, ((pt.x - a.x) * dx + (pt.y - a.y) * dy) / lenSq));
    const px = a.x + t * dx;
    const py = a.y + t * dy;
    if (Math.hypot(pt.x - px, pt.y - py) <= edgeTolerance) return true;
  }

  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x;
    const yi = poly[i].y;
    const xj = poly[j].x;
    const yj = poly[j].y;
    const intersect =
      yi > pt.y !== yj > pt.y &&
      pt.x < ((xj - xi) * (pt.y - yi)) / (yj - yi + 1e-12) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function pointOnSegmentDist(px: number, py: number, w: FloorWall): { dist: number; t: number } {
  const dx = w.x2 - w.x1;
  const dy = w.y2 - w.y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq < 1e-6) {
    return { dist: Math.hypot(px - w.x1, py - w.y1), t: 0 };
  }
  const t = Math.max(0, Math.min(1, ((px - w.x1) * dx + (py - w.y1) * dy) / lenSq));
  return {
    dist: Math.hypot(px - (w.x1 + t * dx), py - (w.y1 + t * dy)),
    t,
  };
}

export function areWallsConnected(a: FloorWall, b: FloorWall, tol = 0.16): boolean {
  if (a.id === b.id) return false;
  const aPts = [
    { x: a.x1, y: a.y1 },
    { x: a.x2, y: a.y2 },
  ];
  const bPts = [
    { x: b.x1, y: b.y1 },
    { x: b.x2, y: b.y2 },
  ];
  for (const ap of aPts) {
    if (pointOnSegmentDist(ap.x, ap.y, b).dist <= tol) return true;
  }
  for (const bp of bPts) {
    if (pointOnSegmentDist(bp.x, bp.y, a).dist <= tol) return true;
  }
  return false;
}

export function getConnectedWallCluster(
  startWallId: string,
  walls: FloorWall[],
  tol = 0.16
): FloorWall[] {
  const start = walls.find((w) => w.id === startWallId);
  if (!start) return [];
  const visited = new Set<string>([start.id]);
  const queue: FloorWall[] = [start];

  while (queue.length > 0) {
    const curr = queue.shift()!;
    for (const candidate of walls) {
      if (visited.has(candidate.id)) continue;
      if (areWallsConnected(curr, candidate, tol)) {
        visited.add(candidate.id);
        queue.push(candidate);
      }
    }
  }
  return walls.filter((w) => visited.has(w.id));
}

export function isWallInEnclosedSpace(
  wallId: string,
  walls: FloorWall[],
  rooms: FloorRoom[],
  tol = 0.18
): boolean {
  const cluster = getConnectedWallCluster(wallId, walls, tol);
  if (cluster.length < 3) return false;

  // If any detected room has a vertex lying on any wall in this cluster, it's enclosed
  for (const room of rooms) {
    for (const pt of room.polygon) {
      if (cluster.some((w) => pointOnSegmentDist(pt.x, pt.y, w).dist <= tol)) {
        return true;
      }
    }
  }

  // Fallback check: detect if the cluster itself contains a cycle (degree >= 2 loop)
  const clusterRooms = detectRoomsFromWalls(cluster, []);
  return clusterRooms.length > 0;
}

export function getWallsBounds(walls: FloorWall[]): FloorBounds | null {
  if (walls.length === 0) return null;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const w of walls) {
    minX = Math.min(minX, w.x1, w.x2);
    minY = Math.min(minY, w.y1, w.y2);
    maxX = Math.max(maxX, w.x1, w.x2);
    maxY = Math.max(maxY, w.y1, w.y2);
  }
  return {
    minX,
    minY,
    maxX,
    maxY,
    width: Math.max(0.01, maxX - minX),
    height: Math.max(0.01, maxY - minY),
  };
}

export function getPolygonBounds(poly: Point[]): FloorBounds | null {
  if (poly.length === 0) return null;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of poly) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  return {
    minX,
    minY,
    maxX,
    maxY,
    width: Math.max(0.01, maxX - minX),
    height: Math.max(0.01, maxY - minY),
  };
}

export function clampOpeningRatioForWall(
  offsetRatio: number,
  openingWidth: number,
  wall: FloorWall
): number {
  const len = Math.hypot(wall.x2 - wall.x1, wall.y2 - wall.y1);
  if (len <= 0.25) return 0.5;
  const halfFrac = (openingWidth / 2 + 0.05) / len;
  const minR = Math.min(0.45, Math.max(0.05, halfFrac));
  return Number(Math.max(minR, Math.min(1 - minR, offsetRatio)).toFixed(3));
}

function areWallsCollinear(a: FloorWall, b: FloorWall, tol = 0.16): boolean {
  const ax = a.x2 - a.x1;
  const ay = a.y2 - a.y1;
  const aLen = Math.hypot(ax, ay);
  const bx = b.x2 - b.x1;
  const by = b.y2 - b.y1;
  const bLen = Math.hypot(bx, by);
  if (aLen < 1e-4 || bLen < 1e-4) return false;
  const cross = Math.abs((ax * by - ay * bx) / (aLen * bLen));
  if (cross > 0.08) return false;
  // Check distance of b's midpoint to line a
  const bmx = (b.x1 + b.x2) / 2;
  const bmy = (b.y1 + b.y2) / 2;
  const perpDist = Math.abs(((bmx - a.x1) * -ay + (bmy - a.y1) * ax) / aLen);
  return perpDist <= tol;
}

/**
 * Computes updated walls, openings, rooms, and furniture when pushing/pulling a wall
 * in a connected space along its perpendicular normal. Keeps all corners, T-junctions,
 * collinear divider segments, windows, doors, and interior elements moving cleanly.
 */
export function resizeConnectedWall(params: {
  targetWallId: string;
  rawDx: number;
  rawDy: number;
  origWalls: FloorWall[];
  origOpenings: Array<{ id: string; wallId: string; offsetRatio: number; width: number }>;
  origRooms: FloorRoom[];
  origFurniture: Array<{ id: string; x: number; y: number }>;
  snapStep?: number;
}): {
  walls: FloorWall[];
  openingRatios: Record<string, number>;
  rooms: FloorRoom[];
  furniturePos: Record<string, { x: number; y: number }>;
} | null {
  const { targetWallId, rawDx, rawDy, origWalls, origOpenings, origRooms, origFurniture } = params;
  const snapStep = params.snapStep ?? 0.1;
  const target = origWalls.find((w) => w.id === targetWallId);
  if (!target) return null;

  const wLen = Math.hypot(target.x2 - target.x1, target.y2 - target.y1);
  if (wLen < 1e-4) return null;

  // Unit normal perpendicular to target wall
  const nx = -(target.y2 - target.y1) / wLen;
  const ny = (target.x2 - target.x1) / wLen;
  const rawNormalMove = rawDx * nx + rawDy * ny;
  const snappedNormalMove = Math.round(rawNormalMove / snapStep) * snapStep;
  const dx = Number((snappedNormalMove * nx).toFixed(3));
  const dy = Number((snappedNormalMove * ny).toFixed(3));

  // Collect target wall + any directly connected collinear continuation walls so straight
  // multi-segment partitions stay straight and watertight
  const movingWallIds = new Set<string>([target.id]);
  let expanded = true;
  while (expanded) {
    expanded = false;
    for (const w of origWalls) {
      if (movingWallIds.has(w.id)) continue;
      for (const mId of movingWallIds) {
        const mw = origWalls.find((item) => item.id === mId)!;
        if (areWallsConnected(mw, w, 0.16) && areWallsCollinear(mw, w, 0.16)) {
          movingWallIds.add(w.id);
          expanded = true;
          break;
        }
      }
    }
  }

  const movingWalls = origWalls.filter((w) => movingWallIds.has(w.id));
  const touchesMovingWalls = (px: number, py: number): boolean =>
    movingWalls.some((mw) => pointOnSegmentDist(px, py, mw).dist <= 0.16);

  const nextWalls = origWalls.map((w) => {
    if (movingWallIds.has(w.id)) {
      return {
        ...w,
        x1: Number((w.x1 + dx).toFixed(2)),
        y1: Number((w.y1 + dy).toFixed(2)),
        x2: Number((w.x2 + dx).toFixed(2)),
        y2: Number((w.y2 + dy).toFixed(2)),
      };
    }
    const moveEnd1 = touchesMovingWalls(w.x1, w.y1);
    const moveEnd2 = touchesMovingWalls(w.x2, w.y2);
    if (!moveEnd1 && !moveEnd2) return w;
    return {
      ...w,
      x1: moveEnd1 ? Number((w.x1 + dx).toFixed(2)) : w.x1,
      y1: moveEnd1 ? Number((w.y1 + dy).toFixed(2)) : w.y1,
      x2: moveEnd2 ? Number((w.x2 + dx).toFixed(2)) : w.x2,
      y2: moveEnd2 ? Number((w.y2 + dy).toFixed(2)) : w.y2,
    };
  });

  // Prevent collapsing any wall shorter than 0.45m
  for (const w of nextWalls) {
    if (Math.hypot(w.x2 - w.x1, w.y2 - w.y1) < 0.45) {
      return null;
    }
  }

  // Clamp openings on resized walls so doors & windows stay cleanly seated
  const openingRatios: Record<string, number> = {};
  for (const op of origOpenings) {
    const w = nextWalls.find((item) => item.id === op.wallId);
    if (w) {
      openingRatios[op.id] = clampOpeningRatioForWall(op.offsetRatio, op.width, w);
    }
  }

  // Recompute rooms & proportionally remap furniture inside rooms touched by the moved wall(s)
  const nextRooms = detectRoomsFromWalls(nextWalls, origRooms);
  const furniturePos: Record<string, { x: number; y: number }> = {};

  const touchedRoomIds = new Set<string>();
  for (const r of origRooms) {
    const touches = r.polygon.some((pt) => touchesMovingWalls(pt.x, pt.y));
    if (touches) touchedRoomIds.add(r.id);
  }

  for (const origRoom of origRooms) {
    if (!touchedRoomIds.has(origRoom.id)) continue;
    const nextRoom = nextRooms.find((nr) => nr.id === origRoom.id);
    if (!nextRoom) continue;
    const ob = getPolygonBounds(origRoom.polygon);
    const nb = getPolygonBounds(nextRoom.polygon);
    if (!ob || !nb || ob.width < 0.2 || ob.height < 0.2) continue;

    for (const f of origFurniture) {
      if (furniturePos[f.id]) continue;
      if (pointInPolygon({ x: f.x, y: f.y }, origRoom.polygon, 0.16)) {
        const rx = (f.x - ob.minX) / ob.width;
        const ry = (f.y - ob.minY) / ob.height;
        furniturePos[f.id] = {
          x: Number((nb.minX + rx * nb.width).toFixed(2)),
          y: Number((nb.minY + ry * nb.height).toFixed(2)),
        };
      }
    }
  }

  return { walls: nextWalls, openingRatios, rooms: nextRooms, furniturePos };
}

/**
 * Scales an entire enclosed connected space (walls + doors/windows + interior furniture)
 * smoothly from origBounds to nextBounds when dragging any of the 8 resize handles.
 */
export function scaleConnectedSpace(params: {
  spaceWallIds: Set<string>;
  origBounds: FloorBounds;
  nextBounds: FloorBounds;
  origWalls: FloorWall[];
  origOpenings: Array<{ id: string; wallId: string; offsetRatio: number; width: number }>;
  origRooms: FloorRoom[];
  origFurniture: Array<{ id: string; x: number; y: number }>;
  interiorFurnitureIds: Set<string>;
}): {
  walls: FloorWall[];
  openingRatios: Record<string, number>;
  rooms: FloorRoom[];
  furniturePos: Record<string, { x: number; y: number }>;
} | null {
  const {
    spaceWallIds,
    origBounds,
    nextBounds,
    origWalls,
    origOpenings,
    origRooms,
    origFurniture,
    interiorFurnitureIds,
  } = params;

  if (nextBounds.width < 0.9 || nextBounds.height < 0.9) return null;

  const mapX = (x: number) =>
    Number((nextBounds.minX + ((x - origBounds.minX) / origBounds.width) * nextBounds.width).toFixed(2));
  const mapY = (y: number) =>
    Number((nextBounds.minY + ((y - origBounds.minY) / origBounds.height) * nextBounds.height).toFixed(2));

  const nextWalls = origWalls.map((w) => {
    if (!spaceWallIds.has(w.id)) return w;
    return {
      ...w,
      x1: mapX(w.x1),
      y1: mapY(w.y1),
      x2: mapX(w.x2),
      y2: mapY(w.y2),
    };
  });

  for (const w of nextWalls) {
    if (spaceWallIds.has(w.id) && Math.hypot(w.x2 - w.x1, w.y2 - w.y1) < 0.45) {
      return null;
    }
  }

  const openingRatios: Record<string, number> = {};
  for (const op of origOpenings) {
    if (!spaceWallIds.has(op.wallId)) continue;
    const w = nextWalls.find((item) => item.id === op.wallId);
    if (w) {
      openingRatios[op.id] = clampOpeningRatioForWall(op.offsetRatio, op.width, w);
    }
  }

  const furniturePos: Record<string, { x: number; y: number }> = {};
  for (const f of origFurniture) {
    if (!interiorFurnitureIds.has(f.id)) continue;
    furniturePos[f.id] = {
      x: mapX(f.x),
      y: mapY(f.y),
    };
  }

  const nextRooms = detectRoomsFromWalls(nextWalls, origRooms);
  return { walls: nextWalls, openingRatios, rooms: nextRooms, furniturePos };
}

