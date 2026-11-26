import * as THREE from 'three';
import {
  FloorFurniture,
  FloorOpening,
  FloorWall,
  SurfaceTextureId,
} from '../types/diagram';
import { LibraryItem } from './libraries';
import { createSurfaceMaterial, SURFACE_TEXTURE_MAP } from './floor3dMaterials';

export interface Asset3DBuildOptions {
  maxAnisotropy?: number;
  isSoftwareGl?: boolean;
  selected?: boolean;
}

export interface Asset3DMetrics {
  height: number;
  defaultTexture: SurfaceTextureId;
  elevation?: number;
}

export function getDefaultAsset3DMetrics(type: string): Asset3DMetrics {
  switch (type) {
    case 'rug':
      return { height: 0.025, defaultTexture: 'carpet' };
    case 'walkway':
      return { height: 0.05, defaultTexture: 'stone' };
    case 'driveway':
      return { height: 0.06, defaultTexture: 'concrete' };
    case 'patio-deck':
      return { height: 0.16, defaultTexture: 'hardwood' };
    case 'swimming-pool':
      return { height: 0.22, defaultTexture: 'tile' };
    case 'hot-tub':
      return { height: 0.92, defaultTexture: 'walnut' };
    case 'garden-bed':
      return { height: 0.45, defaultTexture: 'hardwood' };
    case 'coffee-table':
      return { height: 0.44, defaultTexture: 'hardwood' };
    case 'tv-console':
      return { height: 1.25, defaultTexture: 'walnut' };
    case 'nightstand':
      return { height: 0.58, defaultTexture: 'hardwood' };
    case 'sofa':
    case 'sectional-sofa':
    case 'armchair':
      return { height: 0.85, defaultTexture: 'fabric' };
    case 'lounger':
      return { height: 0.65, defaultTexture: 'fabric' };
    case 'king-bed':
    case 'bed':
    case 'twin-bed':
      return { height: 1.05, defaultTexture: 'fabric' };
    case 'wardrobe':
      return { height: 2.15, defaultTexture: 'hardwood' };
    case 'bookshelf':
    case 'garage-rack':
    case 'retail-shelf':
      return { height: 1.95, defaultTexture: 'hardwood' };
    case 'plant':
      return { height: 1.35, defaultTexture: 'plaster' };
    case 'tree':
      return { height: 3.4, defaultTexture: 'solid' };
    case 'hedge':
      return { height: 1.1, defaultTexture: 'solid' };
    case 'kitchen-counter':
    case 'kitchen-island':
      return { height: 0.92, defaultTexture: 'carrara' };
    case 'stove':
      return { height: 0.92, defaultTexture: 'metal' };
    case 'fridge':
      return { height: 1.92, defaultTexture: 'metal' };
    case 'dining-table':
    case 'round-table':
    case 'conference-table':
    case 'cafe-table':
      return { height: 0.76, defaultTexture: 'hardwood' };
    case 'bathtub':
      return { height: 0.58, defaultTexture: 'solid' };
    case 'shower':
      return { height: 2.15, defaultTexture: 'tile' };
    case 'toilet':
      return { height: 0.78, defaultTexture: 'solid' };
    case 'vanity':
      return { height: 0.86, defaultTexture: 'carrara' };
    case 'washer-dryer':
      return { height: 0.9, defaultTexture: 'metal' };
    case 'desk':
    case 'exec-desk':
      return { height: 0.75, defaultTexture: 'hardwood' };
    case 'cubicle':
      return { height: 1.45, defaultTexture: 'fabric' };
    case 'chair':
      return { height: 0.98, defaultTexture: 'fabric' };
    case 'reception-desk':
    case 'pos-counter':
      return { height: 1.12, defaultTexture: 'walnut' };
    case 'cabinet':
      return { height: 1.32, defaultTexture: 'metal' };
    case 'server-rack':
      return { height: 2.1, defaultTexture: 'metal' };
    case 'printer-station':
      return { height: 1.05, defaultTexture: 'solid' };
    case 'restroom-stall':
      return { height: 2.0, defaultTexture: 'solid' };
    case 'car-sedan':
      return { height: 1.46, defaultTexture: 'metal' };
    case 'car-suv':
      return { height: 1.82, defaultTexture: 'metal' };
    case 'ev-charger':
      return { height: 0.52, defaultTexture: 'metal', elevation: 1.05 };
    case 'elec-panel':
      return { height: 0.75, defaultTexture: 'metal', elevation: 1.15 };
    case 'workbench':
      return { height: 0.92, defaultTexture: 'hardwood' };
    case 'tool-chest':
      return { height: 1.08, defaultTexture: 'metal' };
    case 'hvac-unit':
      return { height: 1.55, defaultTexture: 'metal' };
    case 'bike-rack':
      return { height: 1.05, defaultTexture: 'metal' };
    case 'bbq-grill':
      return { height: 1.18, defaultTexture: 'stone' };
    case 'fence':
      return { height: 1.75, defaultTexture: 'hardwood' };
    case 'pergola':
      return { height: 2.65, defaultTexture: 'walnut' };
    case 'stairs':
    case 'spiral-stairs':
      return { height: 2.65, defaultTexture: 'hardwood' };
    case 'elevator':
      return { height: 2.65, defaultTexture: 'metal' };
    case 'column':
      return { height: 2.75, defaultTexture: 'marble' };
    case 'fireplace':
      return { height: 1.45, defaultTexture: 'stone' };
    default:
      return { height: 0.85, defaultTexture: 'solid' };
  }
}

// Helper to add a mesh grounded by its center (x, y, z)
function addBox(
  parent: THREE.Object3D,
  w: number,
  h: number,
  d: number,
  x: number,
  y: number,
  z: number,
  mat: THREE.Material,
  castShadow = true
): THREE.Mesh {
  const geo = new THREE.BoxGeometry(Math.max(0.01, w), Math.max(0.01, h), Math.max(0.01, d));
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, y, z);
  mesh.castShadow = castShadow;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function addCyl(
  parent: THREE.Object3D,
  rt: number,
  rb: number,
  h: number,
  x: number,
  y: number,
  z: number,
  mat: THREE.Material,
  seg = 18
): THREE.Mesh {
  const geo = new THREE.CylinderGeometry(rt, rb, Math.max(0.01, h), seg);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function addSphere(
  parent: THREE.Object3D,
  r: number,
  x: number,
  y: number,
  z: number,
  mat: THREE.Material,
  seg = 14
): THREE.Mesh {
  const geo = new THREE.SphereGeometry(r, seg, seg);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function makeAccentMat(
  hex: string,
  roughness = 0.45,
  metalness = 0.05
): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(hex),
    roughness,
    metalness,
  });
}

/**
 * Resolves a visually pleasant primary 3D color from a floorplan furniture color.
 * Default 2D library pastels look even better when slightly enriched for 3D materials,
 * while user-customized hex colors are respected directly.
 */
function resolvePrimaryColor(color: string, textureId: SurfaceTextureId): string {
  if (!color || color === 'transparent') {
    return SURFACE_TEXTURE_MAP[textureId]?.defaultTint ?? '#D6D3CD';
  }
  return color;
}

/**
 * Builds a realistic multi-part 3D model (THREE.Group) for ANY FloorFurniture asset,
 * pivoted at bottom-center (y = 0 at ground plane) and sized to (width, height, depth).
 */
export function buildFloorAsset3D(
  item: FloorFurniture,
  options: Asset3DBuildOptions = {}
): THREE.Group {
  const group = new THREE.Group();
  const metrics = getDefaultAsset3DMetrics(item.type);
  const W = Math.max(0.2, item.width);
  const D = Math.max(0.2, item.depth);
  const H = Math.max(0.02, item.height ?? metrics.height);
  const textureId = item.texture ?? metrics.defaultTexture;
  const primaryHex = resolvePrimaryColor(item.color, textureId);

  const primaryMat = createSurfaceMaterial({
    textureId,
    color: primaryHex,
    repeatX: Math.max(1, W / (SURFACE_TEXTURE_MAP[textureId]?.tileMeters ?? 1.2)),
    repeatY: Math.max(1, Math.max(D, H) / (SURFACE_TEXTURE_MAP[textureId]?.tileMeters ?? 1.2)),
    maxAnisotropy: options.maxAnisotropy,
    isSoftwareGl: options.isSoftwareGl,
  });

  const darkWoodMat = createSurfaceMaterial({
    textureId: 'walnut',
    color: '#6E4C32',
    maxAnisotropy: options.maxAnisotropy,
    isSoftwareGl: options.isSoftwareGl,
  });
  const oakWoodMat = createSurfaceMaterial({
    textureId: 'hardwood',
    color: '#C79B6B',
    maxAnisotropy: options.maxAnisotropy,
    isSoftwareGl: options.isSoftwareGl,
  });
  const chromeMat = makeAccentMat('#DCE3EA', 0.16, 0.92);
  const darkMetalMat = makeAccentMat('#27313F', 0.32, 0.78);
  const porcelainMat = makeAccentMat('#F9FAFB', 0.14, 0.04);
  const screenMat = makeAccentMat('#111827', 0.08, 0.25);
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#CBE8F8'),
    roughness: 0.08,
    metalness: 0.05,
    transparent: true,
    opacity: options.isSoftwareGl ? 0.38 : 0.45,
    transmission: options.isSoftwareGl ? 0 : 0.65,
    ior: 1.5,
  });
  const pillowMat = makeAccentMat('#F8FAFC', 0.85, 0.0);
  const foliageDarkMat = makeAccentMat('#2E6B3E', 0.78, 0.0);
  const foliageLightMat = makeAccentMat('#4B8B54', 0.74, 0.0);
  const waterMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#22A6DF'),
    roughness: 0.08,
    metalness: 0.05,
    transparent: true,
    opacity: 0.78,
    clearcoat: options.isSoftwareGl ? 0 : 0.9,
  });

  const t = item.type;

  // ------------------------------------------------------------------
  // 1. LIVING & BEDROOM FURNITURE
  // ------------------------------------------------------------------
  if (t === 'sofa' || t === 'armchair') {
    const legH = 0.12;
    const baseH = H * 0.34;
    const armW = Math.min(0.2, W * 0.16);
    const backD = Math.min(0.22, D * 0.24);
    // 4 tapered legs
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        addCyl(group, 0.025, 0.018, legH, sx * (W / 2 - 0.08), legH / 2, sz * (D / 2 - 0.08), darkWoodMat, 10);
      }
    }
    // Base deck
    addBox(group, W - 0.02, baseH * 0.55, D - 0.02, 0, legH + baseH * 0.275, 0, primaryMat);
    // Seat cushions
    const seats = t === 'armchair' ? 1 : Math.max(2, Math.round(W / 0.75));
    const innerW = W - armW * 2 - 0.04;
    const seatW = innerW / seats;
    for (let i = 0; i < seats; i++) {
      const cx = -innerW / 2 + seatW * (i + 0.5);
      addBox(
        group,
        seatW - 0.025,
        baseH * 0.65,
        D - backD - 0.04,
        cx,
        legH + baseH * 0.8,
        backD / 2,
        primaryMat
      );
      // Back pillow
      addBox(
        group,
        seatW - 0.03,
        H * 0.44,
        backD * 0.78,
        cx,
        legH + baseH + H * 0.19,
        -D / 2 + backD * 0.95,
        primaryMat
      );
    }
    // Armrests & back frame
    addBox(group, armW, H * 0.58, D, -W / 2 + armW / 2, legH + H * 0.29, 0, primaryMat);
    addBox(group, armW, H * 0.58, D, W / 2 - armW / 2, legH + H * 0.29, 0, primaryMat);
    addBox(group, W, H * 0.78, backD * 0.7, 0, legH + H * 0.39, -D / 2 + backD * 0.35, primaryMat);
    // Accent throw pillow
    addBox(group, 0.32, 0.3, 0.12, -W / 2 + armW + 0.2, legH + baseH + 0.15, -D / 2 + backD + 0.12, pillowMat);
  } else if (t === 'sectional-sofa') {
    const legH = 0.1;
    const mainD = D * 0.45;
    const chaiseW = W * 0.38;
    const armW = 0.18;
    // Main sofa bar (back)
    addBox(group, W, H * 0.36, mainD, 0, legH + H * 0.18, -D / 2 + mainD / 2, primaryMat);
    addBox(group, W, H * 0.82, 0.22, 0, legH + H * 0.41, -D / 2 + 0.11, primaryMat);
    // Chaise wing (right front)
    const chaiseD = D - mainD;
    addBox(
      group,
      chaiseW,
      H * 0.36,
      chaiseD + 0.04,
      W / 2 - chaiseW / 2,
      legH + H * 0.18,
      D / 2 - chaiseD / 2,
      primaryMat
    );
    // Left arm & right arm
    addBox(group, armW, H * 0.56, mainD, -W / 2 + armW / 2, legH + H * 0.28, -D / 2 + mainD / 2, primaryMat);
    addBox(group, armW, H * 0.56, D, W / 2 - armW / 2, legH + H * 0.28, 0, primaryMat);
    // Back cushions + throw pillows
    for (let i = 0; i < 3; i++) {
      const cx = -W / 2 + armW + ((W - armW * 2) / 3) * (i + 0.5);
      addBox(group, (W - armW * 2) / 3 - 0.04, H * 0.42, 0.18, cx, legH + H * 0.56, -D / 2 + 0.3, primaryMat);
    }
    addBox(group, 0.34, 0.32, 0.12, -W / 2 + armW + 0.22, legH + H * 0.52, -D / 2 + 0.42, pillowMat);
    addBox(group, 0.34, 0.32, 0.12, W / 2 - armW - 0.24, legH + H * 0.52, -D / 2 + 0.42, pillowMat);
    // Plinth shadow legs
    addBox(group, W - 0.12, legH, mainD - 0.12, 0, legH / 2, -D / 2 + mainD / 2, darkWoodMat);
    addBox(group, chaiseW - 0.12, legH, chaiseD - 0.08, W / 2 - chaiseW / 2, legH / 2, D / 2 - chaiseD / 2, darkWoodMat);
  } else if (t === 'bed' || t === 'king-bed' || t === 'twin-bed') {
    const frameH = 0.26;
    const mattH = 0.24;
    // Wooden/upholstered platform base
    addBox(group, W, frameH, D, 0, frameH / 2 + 0.04, 0, darkWoodMat);
    // 4 short feet
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        addBox(group, 0.08, 0.06, 0.08, sx * (W / 2 - 0.08), 0.03, sz * (D / 2 - 0.08), darkWoodMat);
      }
    }
    // Tall Headboard
    addBox(group, W + 0.06, H, 0.11, 0, H / 2, -D / 2 + 0.055, darkWoodMat);
    addBox(group, W - 0.04, H * 0.72, 0.06, 0, H * 0.58, -D / 2 + 0.12, primaryMat);
    // Crisp white mattress
    addBox(group, W - 0.08, mattH, D - 0.16, 0, frameH + 0.04 + mattH / 2, 0.04, porcelainMat);
    // Duvet blanket (lower 68% of bed)
    const duvetD = D * 0.66;
    addBox(
      group,
      W - 0.03,
      mattH * 0.65,
      duvetD,
      0,
      frameH + 0.04 + mattH * 0.76,
      D / 2 - duvetD / 2 - 0.05,
      primaryMat
    );
    // Pillows
    const pillowCount = t === 'twin-bed' ? 1 : 2;
    const pw = (W - 0.34) / pillowCount;
    for (let i = 0; i < pillowCount; i++) {
      const px = -((W - 0.34) / 2) + pw * (i + 0.5);
      addBox(group, pw - 0.06, 0.15, 0.38, px, frameH + mattH + 0.11, -D / 2 + 0.38, pillowMat);
    }
  } else if (t === 'coffee-table') {
    const topT = 0.05;
    addBox(group, W, topT, D, 0, H - topT / 2, 0, primaryMat);
    addBox(group, W - 0.14, 0.03, D - 0.14, 0, H * 0.32, 0, oakWoodMat);
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        addBox(group, 0.045, H - topT, 0.045, sx * (W / 2 - 0.08), (H - topT) / 2, sz * (D / 2 - 0.08), darkMetalMat);
      }
    }
  } else if (t === 'tv-console') {
    const cabH = Math.min(0.54, H * 0.45);
    addBox(group, W, cabH - 0.08, D, 0, (cabH - 0.08) / 2 + 0.08, 0, primaryMat);
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        addCyl(group, 0.02, 0.015, 0.08, sx * (W / 2 - 0.08), 0.04, sz * (D / 2 - 0.06), darkMetalMat, 8);
      }
    }
    // Drawer fronts
    addBox(group, W * 0.45, cabH * 0.52, 0.02, -W * 0.24, cabH * 0.56, D / 2 + 0.005, darkWoodMat);
    addBox(group, W * 0.45, cabH * 0.52, 0.02, W * 0.24, cabH * 0.56, D / 2 + 0.005, darkWoodMat);
    // Flatscreen TV
    const tvW = W * 0.78;
    const tvH = Math.max(0.45, H - cabH - 0.08);
    addBox(group, 0.18, 0.08, 0.14, 0, cabH + 0.04, 0, darkMetalMat);
    addBox(group, tvW, tvH, 0.045, 0, cabH + 0.08 + tvH / 2, -0.02, screenMat);
    addBox(group, tvW + 0.03, tvH + 0.03, 0.02, 0, cabH + 0.08 + tvH / 2, -0.04, darkMetalMat);
  } else if (t === 'rug') {
    addBox(group, W, H, D, 0, H / 2 + 0.008, 0, primaryMat, false);
    // Subtle woven inner border
    addBox(group, W * 0.92, 0.005, D * 0.92, 0, H + 0.01, 0, pillowMat, false);
  } else if (t === 'nightstand') {
    addBox(group, W, H - 0.08, D, 0, (H - 0.08) / 2 + 0.08, 0, primaryMat);
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        addBox(group, 0.035, 0.08, 0.035, sx * (W / 2 - 0.05), 0.04, sz * (D / 2 - 0.05), darkWoodMat);
      }
    }
    // Drawer knobs
    addSphere(group, 0.018, 0, H * 0.72, D / 2 + 0.02, chromeMat, 8);
    addSphere(group, 0.018, 0, H * 0.36, D / 2 + 0.02, chromeMat, 8);
    // Bedside lamp
    addCyl(group, 0.06, 0.07, 0.16, 0, H + 0.08, 0, porcelainMat, 12);
    addCyl(group, 0.09, 0.14, 0.18, 0, H + 0.24, 0, makeAccentMat('#FFF6E3', 0.85, 0), 14);
  } else if (t === 'wardrobe') {
    addBox(group, W, H, D, 0, H / 2, 0, primaryMat);
    const doors = W > 1.3 ? 3 : 2;
    const dw = (W - 0.06) / doors;
    for (let i = 0; i < doors; i++) {
      const dx = -W / 2 + 0.03 + dw * (i + 0.5);
      addBox(group, dw - 0.02, H - 0.12, 0.025, dx, H / 2, D / 2 + 0.01, primaryMat);
      addBox(group, 0.02, 0.28, 0.035, dx + (i === 0 ? dw * 0.32 : -dw * 0.32), H * 0.5, D / 2 + 0.035, chromeMat);
    }
  } else if (t === 'bookshelf') {
    const tWall = 0.035;
    addBox(group, tWall, H, D, -W / 2 + tWall / 2, H / 2, 0, primaryMat);
    addBox(group, tWall, H, D, W / 2 - tWall / 2, H / 2, 0, primaryMat);
    addBox(group, W, H, 0.02, 0, H / 2, -D / 2 + 0.01, primaryMat);
    const shelves = 5;
    const bookColors = ['#2563EB', '#0F766E', '#D97706', '#DC2626', '#475569', '#7C3AED'];
    for (let s = 0; s <= shelves; s++) {
      const sy = (s / shelves) * (H - 0.04) + 0.02;
      addBox(group, W, 0.03, D, 0, sy, 0, primaryMat);
      if (s < shelves) {
        for (let b = 0; b < 5; b++) {
          const bw = (W - 0.14) / 7;
          const bh = 0.2 + ((s + b) % 3) * 0.04;
          const bx = -W / 2 + 0.12 + b * (bw + 0.03);
          addBox(group, bw, bh, D * 0.65, bx, sy + 0.015 + bh / 2, 0.02, makeAccentMat(bookColors[(s * 3 + b) % bookColors.length], 0.75, 0));
        }
      }
    }
  } else if (t === 'plant') {
    const potH = H * 0.32;
    const potR = Math.min(W, D) * 0.36;
    addCyl(group, potR, potR * 0.72, potH, 0, potH / 2, 0, primaryMat, 16);
    addCyl(group, potR * 0.9, potR * 0.9, 0.03, 0, potH - 0.01, 0, makeAccentMat('#4B3621', 0.95, 0), 14);
    addCyl(group, 0.03, 0.045, H * 0.45, 0, potH + H * 0.2, 0, darkWoodMat, 8);
    // Multi-layered foliage
    const crownY = potH + H * 0.44;
    const cr = Math.min(W, D) * 0.34;
    addSphere(group, cr, 0, crownY, 0, foliageDarkMat, 12);
    addSphere(group, cr * 0.75, cr * 0.45, crownY - 0.06, cr * 0.3, foliageLightMat, 10);
    addSphere(group, cr * 0.72, -cr * 0.42, crownY + 0.06, -cr * 0.25, foliageLightMat, 10);
    addSphere(group, cr * 0.65, 0, crownY + cr * 0.55, 0.05, foliageLightMat, 10);

  // ------------------------------------------------------------------
  // 2. KITCHEN, DINING & BATH
  // ------------------------------------------------------------------
  } else if (t === 'kitchen-counter' || t === 'kitchen-island' || t === 'vanity') {
    const topH = 0.05;
    const cabH = H - topH;
    // Lower cabinets
    addBox(group, W - 0.02, cabH, D - 0.04, 0, cabH / 2, 0, t === 'kitchen-island' ? darkWoodMat : porcelainMat);
    // Countertop (takes user's texture/color — e.g. Marble, Granite, Hardwood!)
    addBox(group, W + 0.04, topH, D + 0.04, 0, H - topH / 2, 0, primaryMat);
    // Cabinet door seams & handles
    const doors = Math.max(2, Math.round(W / 0.6));
    for (let i = 0; i < doors; i++) {
      const dx = -W / 2 + (W / doors) * (i + 0.5);
      addBox(group, 0.018, 0.14, 0.025, dx + 0.1, cabH * 0.75, D / 2 - 0.005, chromeMat);
    }
    if (t === 'kitchen-counter' || t === 'vanity') {
      // Recessed basin & gooseneck faucet
      addBox(group, Math.min(0.65, W * 0.36), 0.03, D * 0.62, 0, H + 0.005, 0.02, chromeMat);
      addCyl(group, 0.015, 0.018, 0.24, 0, H + 0.12, -D * 0.28, chromeMat, 10);
      addBox(group, 0.025, 0.025, 0.14, 0, H + 0.23, -D * 0.2, chromeMat);
    }
    if (t === 'vanity') {
      // Wall mirror above vanity
      addBox(group, W * 0.85, 0.8, 0.03, 0, H + 0.55, -D / 2 + 0.02, chromeMat);
      addBox(group, W * 0.78, 0.73, 0.035, 0, H + 0.55, -D / 2 + 0.025, glassMat);
    }
  } else if (t === 'stove') {
    addBox(group, W, H, D, 0, H / 2, 0, primaryMat);
    // Oven glass door
    addBox(group, W * 0.82, H * 0.52, 0.03, 0, H * 0.42, D / 2 + 0.01, screenMat);
    addBox(group, W * 0.72, 0.025, 0.045, 0, H * 0.72, D / 2 + 0.03, chromeMat);
    // 4 burners on cooktop
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        addCyl(group, W * 0.16, W * 0.16, 0.02, sx * W * 0.23, H + 0.01, sz * D * 0.22, darkMetalMat, 16);
      }
    }
    // Back control riser
    addBox(group, W, 0.18, 0.08, 0, H + 0.09, -D / 2 + 0.04, primaryMat);
  } else if (t === 'fridge') {
    addBox(group, W, H, D - 0.06, 0, H / 2, -0.03, primaryMat);
    // French doors + freezer drawer
    addBox(group, W * 0.48, H * 0.62, 0.05, -W * 0.25, H * 0.67, D / 2 - 0.025, primaryMat);
    addBox(group, W * 0.48, H * 0.62, 0.05, W * 0.25, H * 0.67, D / 2 - 0.025, primaryMat);
    addBox(group, W * 0.97, H * 0.32, 0.05, 0, H * 0.18, D / 2 - 0.025, primaryMat);
    // Handles & dispenser
    addBox(group, 0.022, 0.55, 0.04, -0.05, H * 0.65, D / 2 + 0.025, chromeMat);
    addBox(group, 0.022, 0.55, 0.04, 0.05, H * 0.65, D / 2 + 0.025, chromeMat);
    addBox(group, 0.18, 0.28, 0.02, -W * 0.25, H * 0.68, D / 2 + 0.005, darkMetalMat);
  } else if (t === 'dining-table' || t === 'conference-table') {
    const topT = 0.055;
    addBox(group, W, topT, D, 0, H - topT / 2, 0, primaryMat);
    // 4 sturdy legs
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        addBox(group, 0.06, H - topT, 0.06, sx * (W / 2 - 0.14), (H - topT) / 2, sz * (D / 2 - 0.12), darkWoodMat);
      }
    }
    // Surrounding chairs
    const perSide = t === 'conference-table' ? 4 : 3;
    const chairMat = makeAccentMat('#475569', 0.78, 0.02);
    for (const sz of [-1, 1]) {
      for (let i = 0; i < perSide; i++) {
        const cx = -W / 2 + (W / perSide) * (i + 0.5);
        const cz = sz * (D / 2 + 0.2);
        addBox(group, 0.42, 0.05, 0.4, cx, 0.45, cz, chairMat);
        addBox(group, 0.42, 0.42, 0.045, cx, 0.68, cz + sz * 0.19, chairMat);
        addCyl(group, 0.02, 0.02, 0.44, cx - 0.15, 0.22, cz, darkMetalMat, 6);
        addCyl(group, 0.02, 0.02, 0.44, cx + 0.15, 0.22, cz, darkMetalMat, 6);
      }
    }
  } else if (t === 'round-table' || t === 'cafe-table') {
    const r = Math.min(W, D) / 2;
    addCyl(group, r, r, 0.05, 0, H - 0.025, 0, primaryMat, 24);
    addCyl(group, 0.06, 0.08, H - 0.06, 0, (H - 0.06) / 2, 0, darkMetalMat, 14);
    addCyl(group, r * 0.45, r * 0.5, 0.04, 0, 0.02, 0, darkMetalMat, 18);
    const chairCount = t === 'cafe-table' ? 2 : 4;
    const chairMat = makeAccentMat('#5B7A9D', 0.78, 0.02);
    for (let i = 0; i < chairCount; i++) {
      const ang = (i / chairCount) * Math.PI * 2;
      const cx = Math.cos(ang) * (r + 0.22);
      const cz = Math.sin(ang) * (r + 0.22);
      const cGroup = new THREE.Group();
      cGroup.position.set(cx, 0, cz);
      cGroup.rotation.y = -ang + Math.PI / 2;
      addBox(cGroup, 0.4, 0.05, 0.4, 0, 0.45, 0, chairMat);
      addBox(cGroup, 0.4, 0.4, 0.04, 0, 0.67, -0.18, chairMat);
      addCyl(cGroup, 0.02, 0.02, 0.44, 0, 0.22, 0, darkMetalMat, 8);
      group.add(cGroup);
    }
  } else if (t === 'bathtub') {
    const rim = 0.09;
    addBox(group, W, H, rim, 0, H / 2, -D / 2 + rim / 2, primaryMat);
    addBox(group, W, H, rim, 0, H / 2, D / 2 - rim / 2, primaryMat);
    addBox(group, rim, H, D, -W / 2 + rim / 2, H / 2, 0, primaryMat);
    addBox(group, rim, H, D, W / 2 - rim / 2, H / 2, 0, primaryMat);
    addBox(group, W - rim * 2, 0.14, D - rim * 2, 0, 0.07, 0, porcelainMat);
    addBox(group, W - rim * 2.2, 0.02, D - rim * 2.2, 0, H * 0.62, 0, waterMat, false);
    // Chrome spout
    addCyl(group, 0.02, 0.025, 0.22, -W / 2 + 0.12, H + 0.1, 0, chromeMat, 10);
    addBox(group, 0.16, 0.025, 0.03, -W / 2 + 0.2, H + 0.18, 0, chromeMat);
  } else if (t === 'shower') {
    // Tiled base pan
    addBox(group, W, 0.1, D, 0, 0.05, 0, primaryMat);
    // Glass enclosure panels
    addBox(group, W, H - 0.1, 0.025, 0, H / 2 + 0.05, D / 2 - 0.015, glassMat, false);
    addBox(group, 0.025, H - 0.1, D, W / 2 - 0.015, H / 2 + 0.05, 0, glassMat, false);
    // Chrome frame posts & rain showerhead
    addBox(group, 0.035, H, 0.035, W / 2 - 0.02, H / 2, D / 2 - 0.02, chromeMat);
    addCyl(group, 0.015, 0.015, H * 0.72, 0, H * 0.55, -D / 2 + 0.05, chromeMat, 8);
    addCyl(group, 0.12, 0.12, 0.025, 0, H * 0.9, -D / 2 + 0.28, chromeMat, 16);
  } else if (t === 'toilet') {
    // Tank
    addBox(group, W * 0.88, H * 0.58, D * 0.28, 0, H * 0.71, -D / 2 + D * 0.15, primaryMat);
    // Pedestal & bowl
    addCyl(group, W * 0.36, W * 0.28, H * 0.48, 0, H * 0.24, D * 0.08, primaryMat, 16);
    addCyl(group, W * 0.44, W * 0.36, 0.1, 0, H * 0.5, D * 0.12, primaryMat, 18);
    // Flush handle
    addBox(group, 0.08, 0.02, 0.02, -W * 0.46, H * 0.9, -D / 2 + D * 0.15, chromeMat);
  } else if (t === 'washer-dryer') {
    const unitW = W * 0.48;
    for (const sx of [-1, 1]) {
      const ux = sx * (W * 0.255);
      addBox(group, unitW, H, D, ux, H / 2, 0, primaryMat);
      addCyl(group, unitW * 0.32, unitW * 0.32, 0.05, ux, H * 0.46, D / 2 + 0.02, darkMetalMat, 20);
      const drum = addCyl(group, unitW * 0.24, unitW * 0.24, 0.06, ux, H * 0.46, D / 2 + 0.022, screenMat, 18);
      drum.rotation.x = Math.PI / 2;
      // Rotate outer bezel too
      const ring = group.children[group.children.length - 2];
      ring.rotation.x = Math.PI / 2;
      addBox(group, unitW * 0.8, 0.08, 0.02, ux, H * 0.86, D / 2 + 0.01, darkMetalMat);
    }

  // ------------------------------------------------------------------
  // 3. BUSINESS, OFFICE & COMMERCIAL
  // ------------------------------------------------------------------
  } else if (t === 'desk' || t === 'exec-desk' || t === 'workbench') {
    const topT = 0.05;
    addBox(group, W, topT, D * (t === 'exec-desk' ? 0.52 : 1), 0, H - topT / 2, t === 'exec-desk' ? -D * 0.24 : 0, primaryMat);
    if (t === 'exec-desk') {
      addBox(group, W * 0.44, topT, D * 0.48, W * 0.28, H - topT / 2, D * 0.26, primaryMat);
      addBox(group, 0.46, H - topT, 0.55, W * 0.28, (H - topT) / 2, D * 0.24, darkWoodMat);
    }
    for (const sx of [-1, 1]) {
      addBox(group, 0.05, H - topT, D * (t === 'exec-desk' ? 0.48 : 0.9), sx * (W / 2 - 0.06), (H - topT) / 2, t === 'exec-desk' ? -D * 0.24 : 0, darkMetalMat);
    }
    if (t !== 'workbench') {
      // Monitor & keyboard
      addBox(group, 0.56, 0.34, 0.025, 0, H + 0.24, -D * 0.22, screenMat);
      addBox(group, 0.06, 0.14, 0.04, 0, H + 0.07, -D * 0.24, darkMetalMat);
      addBox(group, 0.36, 0.018, 0.13, 0, H + 0.01, 0.04, darkMetalMat);
    } else {
      // Pegboard backsplash for workbench
      addBox(group, W, 0.65, 0.04, 0, H + 0.32, -D / 2 + 0.02, darkMetalMat);
    }
  } else if (t === 'cubicle') {
    const pT = 0.06;
    // 3-sided acoustic partitions
    addBox(group, W, H, pT, 0, H / 2, -D / 2 + pT / 2, primaryMat);
    addBox(group, pT, H, D, -W / 2 + pT / 2, H / 2, 0, primaryMat);
    addBox(group, pT, H, D, W / 2 - pT / 2, H / 2, 0, primaryMat);
    // Internal work desk & monitor
    addBox(group, W - pT * 2, 0.045, 0.68, 0, 0.74, -D / 2 + 0.38, oakWoodMat);
    addBox(group, 0.52, 0.32, 0.025, 0, 0.98, -D / 2 + 0.22, screenMat);
  } else if (t === 'chair') {
    // 5-star caster base
    addCyl(group, 0.03, 0.03, 0.42, 0, 0.24, 0, darkMetalMat, 10);
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const leg = addBox(group, 0.26, 0.03, 0.04, Math.cos(a) * 0.13, 0.05, Math.sin(a) * 0.13, darkMetalMat);
      leg.rotation.y = -a;
    }
    // Seat, back, armrests
    addBox(group, W * 0.78, 0.07, D * 0.76, 0, 0.47, 0.02, primaryMat);
    addBox(group, W * 0.72, H * 0.5, 0.06, 0, 0.74, -D * 0.34, primaryMat);
    addBox(group, 0.05, 0.2, D * 0.5, -W * 0.4, 0.58, 0, darkMetalMat);
    addBox(group, 0.05, 0.2, D * 0.5, W * 0.4, 0.58, 0, darkMetalMat);
  } else if (t === 'reception-desk' || t === 'pos-counter') {
    addBox(group, W, H * 0.7, D, 0, H * 0.35, 0, primaryMat);
    // Transaction counter riser
    addBox(group, W * 0.96, H * 0.3, 0.28, 0, H * 0.85, D / 2 - 0.14, oakWoodMat);
    // POS / Reception screen
    addBox(group, 0.4, 0.28, 0.04, 0, H * 0.85, -D * 0.15, screenMat);
  } else if (t === 'cabinet' || t === 'tool-chest') {
    addBox(group, W, H, D, 0, H / 2, 0, primaryMat);
    const drawers = t === 'tool-chest' ? 5 : 4;
    for (let i = 0; i < drawers; i++) {
      const dy = (i + 0.5) * ((H - 0.08) / drawers) + 0.04;
      addBox(group, W * 0.86, (H / drawers) * 0.78, 0.02, 0, dy, D / 2 + 0.01, primaryMat);
      addBox(group, W * 0.35, 0.02, 0.03, 0, dy, D / 2 + 0.025, chromeMat);
    }
  } else if (t === 'server-rack') {
    addBox(group, W, H, D, 0, H / 2, 0, darkMetalMat);
    // Illuminated server blades
    const ledMat = makeAccentMat('#14B8A6', 0.2, 0.1);
    for (let u = 0; u < 9; u++) {
      const uy = 0.2 + u * ((H - 0.36) / 9);
      addBox(group, W * 0.84, 0.12, 0.03, 0, uy, D / 2 + 0.005, primaryMat);
      addBox(group, W * 0.14, 0.022, 0.035, -W * 0.28, uy, D / 2 + 0.012, ledMat);
    }
  } else if (t === 'printer-station') {
    addBox(group, W, H * 0.72, D, 0, H * 0.36, 0, primaryMat);
    addBox(group, W * 0.92, H * 0.24, D * 0.88, 0, H * 0.84, 0, darkMetalMat);
    addBox(group, W * 0.6, 0.03, 0.22, 0, H * 0.75, D / 2 + 0.06, porcelainMat);
  } else if (t === 'retail-shelf' || t === 'garage-rack') {
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        addBox(group, 0.045, H, 0.045, sx * (W / 2 - 0.03), H / 2, sz * (D / 2 - 0.03), darkMetalMat);
      }
    }
    const levels = 4;
    for (let l = 0; l < levels; l++) {
      const ly = 0.18 + l * ((H - 0.26) / (levels - 1));
      addBox(group, W, 0.035, D, 0, ly, 0, primaryMat);
      if (l < levels - 1) {
        addBox(group, W * 0.32, 0.24, D * 0.7, -W * 0.24, ly + 0.14, 0, oakWoodMat);
        addBox(group, W * 0.28, 0.2, D * 0.7, W * 0.22, ly + 0.12, 0, makeAccentMat('#5B7A9D', 0.7, 0.05));
      }
    }
  } else if (t === 'restroom-stall') {
    addBox(group, 0.05, H, D, -W / 2 + 0.025, H / 2, 0, primaryMat);
    addBox(group, 0.05, H, D, W / 2 - 0.025, H / 2, 0, primaryMat);
    addBox(group, W * 0.85, H * 0.82, 0.04, 0, H * 0.52, D / 2 - 0.02, primaryMat);
    // Interior toilet
    addCyl(group, 0.18, 0.14, 0.42, 0, 0.21, -D * 0.22, porcelainMat, 14);
    addBox(group, 0.38, 0.42, 0.18, 0, 0.58, -D * 0.38, porcelainMat);

  // ------------------------------------------------------------------
  // 4. STRUCTURE & ARCHITECTURAL ITEMS
  // ------------------------------------------------------------------
  } else if (t === 'stairs') {
    const steps = 12;
    const stepH = H / steps;
    const stepD = D / steps;
    for (let i = 0; i < steps; i++) {
      const sy = (i + 1) * stepH;
      const sz = -D / 2 + (i + 0.5) * stepD;
      addBox(group, W - 0.08, stepH, stepD + 0.02, 0, sy - stepH / 2, sz, primaryMat);
    }
    // Side stringers & metal handrail
    addBox(group, 0.05, H * 0.9, 0.05, -W / 2 + 0.04, H * 0.55, D / 2 - 0.08, darkMetalMat);
    addBox(group, 0.05, 0.9, 0.05, -W / 2 + 0.04, 0.45, -D / 2 + 0.08, darkMetalMat);
    const railLen = Math.hypot(D, H);
    const rail = addBox(group, 0.05, 0.05, railLen, -W / 2 + 0.04, H / 2 + 0.45, 0, darkWoodMat);
    rail.rotation.x = -Math.atan2(H, D);
  } else if (t === 'spiral-stairs') {
    const r = Math.min(W, D) / 2;
    addCyl(group, 0.08, 0.09, H, 0, H / 2, 0, darkMetalMat, 14);
    const steps = 14;
    for (let i = 0; i < steps; i++) {
      const a = (i / steps) * Math.PI * 2;
      const sy = ((i + 0.5) / steps) * H;
      const stepGroup = new THREE.Group();
      stepGroup.position.set(0, sy, 0);
      stepGroup.rotation.y = a;
      addBox(stepGroup, r * 0.9, 0.05, 0.28, r * 0.48, 0, 0, primaryMat);
      addCyl(stepGroup, 0.015, 0.015, 0.85, r * 0.9, 0.42, 0, darkMetalMat, 6);
      group.add(stepGroup);
    }
  } else if (t === 'elevator') {
    addBox(group, W, H, D, 0, H / 2, 0, primaryMat);
    addBox(group, W * 0.4, H * 0.82, 0.04, -W * 0.21, H * 0.41, D / 2 + 0.01, chromeMat);
    addBox(group, W * 0.4, H * 0.82, 0.04, W * 0.21, H * 0.41, D / 2 + 0.01, chromeMat);
    addBox(group, 0.22, 0.09, 0.03, 0, H * 0.88, D / 2 + 0.02, screenMat);
  } else if (t === 'column') {
    addBox(group, W, 0.14, D, 0, 0.07, 0, primaryMat);
    addCyl(group, Math.min(W, D) * 0.42, Math.min(W, D) * 0.45, H - 0.28, 0, H / 2, 0, primaryMat, 18);
    addBox(group, W, 0.14, D, 0, H - 0.07, 0, primaryMat);
  } else if (t === 'fireplace') {
    // Hearth base
    addBox(group, W + 0.12, 0.12, D + 0.16, 0, 0.06, 0.06, primaryMat);
    // Left & right surround piers + header
    addBox(group, W * 0.26, H * 0.72, D, -W * 0.37, H * 0.36 + 0.1, 0, primaryMat);
    addBox(group, W * 0.26, H * 0.72, D, W * 0.37, H * 0.36 + 0.1, 0, primaryMat);
    addBox(group, W, H * 0.24, D, 0, H * 0.88, 0, primaryMat);
    // Mantel shelf
    addBox(group, W + 0.14, 0.09, D + 0.12, 0, H + 0.02, 0.04, darkWoodMat);
    // Dark firebox + warm glowing ember core
    addBox(group, W * 0.48, H * 0.62, D * 0.75, 0, H * 0.42, -D * 0.1, screenMat);
    addBox(group, W * 0.3, 0.12, 0.14, 0, 0.22, 0, makeAccentMat('#EA580C', 0.4, 0));

  // ------------------------------------------------------------------
  // 5. GARAGE & UTILITY
  // ------------------------------------------------------------------
  } else if (t === 'car-sedan' || t === 'car-suv') {
    const isSuv = t === 'car-suv';
    const bodyH = H * (isSuv ? 0.48 : 0.44);
    const cabinH = H * (isSuv ? 0.4 : 0.36);
    // Lower chassis body
    addBox(group, W * 0.94, bodyH, D * 0.96, 0, 0.24 + bodyH / 2, 0, primaryMat);
    // Upper cabin greenhouse
    addBox(
      group,
      W * 0.82,
      cabinH,
      D * (isSuv ? 0.56 : 0.46),
      0,
      0.24 + bodyH + cabinH / 2 - 0.02,
      isSuv ? -D * 0.04 : -D * 0.02,
      glassMat
    );
    // Roof cap
    addBox(
      group,
      W * 0.8,
      0.06,
      D * (isSuv ? 0.52 : 0.4),
      0,
      0.24 + bodyH + cabinH,
      isSuv ? -D * 0.04 : -D * 0.02,
      primaryMat
    );
    // 4 wheels (tires + alloy rims)
    const wheelR = isSuv ? 0.36 : 0.31;
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        const tire = addCyl(group, wheelR, wheelR, 0.22, sx * (W * 0.46), wheelR, sz * (D * 0.31), screenMat, 16);
        tire.rotation.z = Math.PI / 2;
        const rim = addCyl(group, wheelR * 0.58, wheelR * 0.58, 0.23, sx * (W * 0.46), wheelR, sz * (D * 0.31), chromeMat, 12);
        rim.rotation.z = Math.PI / 2;
      }
    }
    // Headlights & taillights
    const headMat = makeAccentMat('#FEF9C3', 0.1, 0.1);
    const tailMat = makeAccentMat('#DC2626', 0.2, 0.1);
    addBox(group, 0.28, 0.12, 0.04, -W * 0.32, 0.24 + bodyH * 0.6, D * 0.48, headMat);
    addBox(group, 0.28, 0.12, 0.04, W * 0.32, 0.24 + bodyH * 0.6, D * 0.48, headMat);
    addBox(group, 0.3, 0.1, 0.04, -W * 0.32, 0.24 + bodyH * 0.62, -D * 0.48, tailMat);
    addBox(group, 0.3, 0.1, 0.04, W * 0.32, 0.24 + bodyH * 0.62, -D * 0.48, tailMat);
  } else if (t === 'ev-charger' || t === 'elec-panel') {
    const elev = item.elevation ?? metrics.elevation ?? 1.05;
    addBox(group, W, H, D, 0, elev + H / 2, 0, primaryMat);
    addBox(
      group,
      W * 0.6,
      0.06,
      0.03,
      0,
      elev + H * 0.72,
      D / 2 + 0.01,
      t === 'ev-charger' ? makeAccentMat('#10B981', 0.2, 0.1) : darkMetalMat
    );
  } else if (t === 'hvac-unit') {
    addCyl(group, Math.min(W, D) * 0.45, Math.min(W, D) * 0.45, H, 0, H / 2, 0, primaryMat, 18);
    addCyl(group, 0.08, 0.08, 0.3, 0, H + 0.15, 0, chromeMat, 12);
  } else if (t === 'bike-rack') {
    addBox(group, W, 0.04, D * 0.65, 0, 0.02, 0, darkMetalMat);
    for (let i = 0; i < 3; i++) {
      const bx = -W * 0.32 + i * (W * 0.32);
      const wheel = addCyl(group, 0.32, 0.32, 0.05, bx, 0.34, 0, darkMetalMat, 16);
      wheel.rotation.z = Math.PI / 2;
      addBox(group, 0.03, 0.65, 0.03, bx, 0.58, 0.15, primaryMat);
    }

  // ------------------------------------------------------------------
  // 6. EXTERIORS & LANDSCAPING
  // ------------------------------------------------------------------
  } else if (t === 'patio-deck' || t === 'walkway' || t === 'driveway') {
    addBox(group, W, H, D, 0, H / 2, 0, primaryMat, false);
  } else if (t === 'swimming-pool') {
    const border = 0.28;
    addBox(group, W, H, border, 0, H / 2, -D / 2 + border / 2, porcelainMat);
    addBox(group, W, H, border, 0, H / 2, D / 2 - border / 2, porcelainMat);
    addBox(group, border, H, D, -W / 2 + border / 2, H / 2, 0, porcelainMat);
    addBox(group, border, H, D, W / 2 - border / 2, H / 2, 0, porcelainMat);
    addBox(group, W - border * 2, 0.04, D - border * 2, 0, 0.02, 0, primaryMat, false);
    addBox(group, W - border * 1.9, 0.05, D - border * 1.9, 0, H - 0.05, 0, waterMat, false);
    // Pool ladder
    addCyl(group, 0.02, 0.02, 0.55, W / 2 - border - 0.1, H + 0.18, -0.18, chromeMat, 8);
    addCyl(group, 0.02, 0.02, 0.55, W / 2 - border - 0.1, H + 0.18, 0.18, chromeMat, 8);
  } else if (t === 'hot-tub') {
    addBox(group, W, H, D, 0, H / 2, 0, primaryMat);
    addBox(group, W - 0.24, 0.08, D - 0.24, 0, H - 0.04, 0, porcelainMat);
    addBox(group, W - 0.3, 0.04, D - 0.3, 0, H - 0.01, 0, waterMat, false);
  } else if (t === 'bbq-grill') {
    addBox(group, W, H * 0.72, D, 0, H * 0.36, 0, primaryMat);
    addBox(group, W + 0.06, 0.05, D + 0.06, 0, H * 0.74, 0, porcelainMat);
    // Stainless steel grill hood
    addBox(group, W * 0.48, H * 0.28, D * 0.78, 0, H * 0.9, 0, chromeMat);
    addBox(group, W * 0.42, 0.025, 0.04, 0, H * 0.85, D * 0.42, darkMetalMat);
  } else if (t === 'lounger') {
    addBox(group, W, 0.08, D * 0.65, 0, 0.32, D * 0.17, primaryMat);
    const back = addBox(group, W, 0.08, D * 0.4, 0, 0.46, -D * 0.3, primaryMat);
    back.rotation.x = Math.PI / 5;
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        addBox(group, 0.04, 0.3, 0.04, sx * (W / 2 - 0.06), 0.15, sz * (D / 2 - 0.12), darkMetalMat);
      }
    }
  } else if (t === 'tree') {
    const trunkH = H * 0.44;
    addCyl(group, 0.12, 0.18, trunkH, 0, trunkH / 2, 0, darkWoodMat, 10);
    const cr = Math.min(W, D) * 0.38;
    addSphere(group, cr, 0, trunkH + cr * 0.7, 0, foliageDarkMat, 14);
    addSphere(group, cr * 0.78, cr * 0.48, trunkH + cr * 0.45, cr * 0.3, foliageLightMat, 12);
    addSphere(group, cr * 0.74, -cr * 0.45, trunkH + cr * 0.5, -cr * 0.32, foliageLightMat, 12);
    addSphere(group, cr * 0.68, 0.1, trunkH + cr * 1.25, -0.1, foliageLightMat, 12);
  } else if (t === 'hedge') {
    const puffs = Math.max(3, Math.round(W / 0.65));
    for (let i = 0; i < puffs; i++) {
      const px = -W / 2 + (W / puffs) * (i + 0.5);
      addBox(group, W / puffs + 0.04, H * 0.85, D * 0.9, px, H * 0.425, 0, i % 2 === 0 ? foliageDarkMat : foliageLightMat);
      addSphere(group, D * 0.46, px, H * 0.76, 0, foliageLightMat, 10);
    }
  } else if (t === 'garden-bed') {
    addBox(group, W, H, D, 0, H / 2, 0, primaryMat);
    addBox(group, W - 0.14, 0.06, D - 0.14, 0, H - 0.02, 0, makeAccentMat('#4B3621', 0.95, 0));
    for (let i = 0; i < 4; i++) {
      const px = -W * 0.32 + i * (W * 0.21);
      addSphere(group, 0.18, px, H + 0.1, (i % 2 === 0 ? 1 : -1) * 0.14, foliageLightMat, 8);
    }
  } else if (t === 'fence') {
    const posts = Math.max(2, Math.round(W / 1.4) + 1);
    for (let i = 0; i < posts; i++) {
      const px = -W / 2 + (W / (posts - 1)) * i;
      addBox(group, 0.1, H, 0.1, px, H / 2, 0, darkWoodMat);
    }
    addBox(group, W, H * 0.86, 0.045, 0, H * 0.5, 0, primaryMat);
  } else if (t === 'pergola') {
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        addBox(group, 0.14, H, 0.14, sx * (W / 2 - 0.1), H / 2, sz * (D / 2 - 0.1), primaryMat);
      }
    }
    // Perimeter beams
    addBox(group, W + 0.2, 0.16, 0.12, 0, H - 0.08, -D / 2 + 0.1, primaryMat);
    addBox(group, W + 0.2, 0.16, 0.12, 0, H - 0.08, D / 2 - 0.1, primaryMat);
    // Overhead rafters
    const rafters = Math.max(5, Math.round(W / 0.45));
    for (let i = 0; i < rafters; i++) {
      const rx = -W / 2 + (W / (rafters - 1)) * i;
      addBox(group, 0.07, 0.12, D + 0.25, rx, H + 0.04, 0, primaryMat);
    }

  // ------------------------------------------------------------------
  // 7. STRUCTURAL LIBRARY PREVIEW MODELS (Walls, Rooms, Doors, Windows)
  // ------------------------------------------------------------------
  } else if (t === 'fp-wall') {
    addBox(group, W, 1.5, 0.2, 0, 0.75, 0, primaryMat);
    addBox(group, W + 0.02, 0.12, 0.22, 0, 0.06, 0, porcelainMat);
  } else if (t === 'fp-room' || t === 'fp-room-large') {
    addBox(group, W, 0.06, D, 0, 0.03, 0, oakWoodMat);
    const wh = 1.25;
    addBox(group, W, wh, 0.12, 0, wh / 2, -D / 2 + 0.06, primaryMat);
    addBox(group, 0.12, wh, D, -W / 2 + 0.06, wh / 2, 0, primaryMat);
    addBox(group, 0.12, wh * 0.45, D, W / 2 - 0.06, wh * 0.225, 0, primaryMat);
    addBox(group, W, wh * 0.35, 0.12, 0, wh * 0.175, D / 2 - 0.06, primaryMat);
  } else if (t === 'fp-door' || t === 'fp-double-door' || t === 'fp-sliding-door' || t === 'fp-garage-door') {
    const dh = 2.0;
    addBox(group, 0.07, dh, 0.18, -W / 2 + 0.035, dh / 2, 0, darkWoodMat);
    addBox(group, 0.07, dh, 0.18, W / 2 - 0.035, dh / 2, 0, darkWoodMat);
    addBox(group, W, 0.08, 0.18, 0, dh - 0.04, 0, darkWoodMat);
    if (t === 'fp-sliding-door') {
      addBox(group, W * 0.48, dh - 0.12, 0.04, -W * 0.22, dh / 2, 0.02, glassMat);
      addBox(group, W * 0.48, dh - 0.12, 0.04, W * 0.22, dh / 2, -0.02, glassMat);
    } else {
      addBox(group, W - 0.14, dh - 0.08, 0.055, 0, (dh - 0.08) / 2, 0, oakWoodMat);
      addSphere(group, 0.035, W * 0.32, dh * 0.46, 0.055, chromeMat, 10);
    }
  } else if (t === 'fp-window' || t === 'fp-wide-window') {
    const wh = 1.3;
    addBox(group, W, 0.07, 0.2, 0, 0.035, 0, porcelainMat);
    addBox(group, W, 0.07, 0.18, 0, wh - 0.035, 0, porcelainMat);
    addBox(group, 0.07, wh, 0.18, -W / 2 + 0.035, wh / 2, 0, porcelainMat);
    addBox(group, 0.07, wh, 0.18, W / 2 - 0.035, wh / 2, 0, porcelainMat);
    addBox(group, 0.04, wh - 0.1, 0.06, 0, wh / 2, 0, porcelainMat);
    addBox(group, W - 0.12, wh - 0.12, 0.025, 0, wh / 2, 0, glassMat);
  } else {
    // Graceful multi-part architectural fallback
    addBox(group, W, H * 0.86, D, 0, H * 0.43 + 0.05, 0, primaryMat);
    addBox(group, W + 0.04, H * 0.1, D + 0.04, 0, H - H * 0.05, 0, oakWoodMat);
    addBox(group, W - 0.08, 0.05, D - 0.08, 0, 0.025, 0, darkMetalMat);
  }

  return group;
}

/**
 * Builds an architectural 3D wall with real cut-out openings for all attached doors & windows,
 * baseboards, door jambs, hinged door leaves, and glazed windows.
 */
export function buildWallWithOpenings3D(
  wall: FloorWall,
  wallOpenings: FloorOpening[],
  options: {
    defaultWallHeight: number;
    cutaway: boolean;
    maxAnisotropy?: number;
    isSoftwareGl?: boolean;
    selectedWall?: boolean;
    selectedOpeningId?: string | null;
  }
): THREE.Group {
  const group = new THREE.Group();
  const dx = wall.x2 - wall.x1;
  const dy = wall.y2 - wall.y1;
  const length = Math.hypot(dx, dy);
  if (length < 0.05) return group;

  const angle = Math.atan2(dy, dx);
  const fullHeight = wall.height ?? options.defaultWallHeight;
  const H = options.cutaway ? Math.min(fullHeight, 1.25) : fullHeight;
  const T = Math.max(0.08, wall.thickness);

  // Position group at wall midpoint, rotated so local +X runs along the wall (from -L/2 to +L/2)
  group.position.set((wall.x1 + wall.x2) / 2, 0, (wall.y1 + wall.y2) / 2);
  group.rotation.y = -angle;

  const texId: SurfaceTextureId = wall.texture ?? 'plaster';
  const baseColor = wall.color || (wall.kind === 'exterior' ? '#EAECEF' : '#F6F5F1');
  const tileM = SURFACE_TEXTURE_MAP[texId]?.tileMeters ?? 1.5;

  const wallMat = createSurfaceMaterial({
    textureId: texId,
    color: baseColor,
    repeatX: Math.max(1, length / tileM),
    repeatY: Math.max(1, H / tileM),
    maxAnisotropy: options.maxAnisotropy,
    isSoftwareGl: options.isSoftwareGl,
  });
  if (options.selectedWall) {
    wallMat.emissive = new THREE.Color('#0D9488');
    wallMat.emissiveIntensity = 0.24;
  }

  const trimMat = makeAccentMat('#F8FAFC', 0.35, 0.02);
  const capMat = makeAccentMat(options.selectedWall ? '#14B8A6' : '#CBD5E1', 0.6, 0.05);

  // Sort openings along the wall in meters from start (0 .. length)
  const sortedOps = [...wallOpenings]
    .map((op) => {
      const centerM = op.offsetRatio * length;
      const halfW = Math.min(op.width / 2, length / 2 - 0.05);
      return {
        op,
        start: Math.max(0.05, centerM - halfW),
        end: Math.min(length - 0.05, centerM + halfW),
      };
    })
    .filter((o) => o.end > o.start + 0.1)
    .sort((a, b) => a.start - b.start);

  // Helper to place a solid wall pier from s1..s2 (meters from wall start) and y1..y2 (height)
  const addWallSpan = (s1: number, s2: number, y1: number, y2: number) => {
    const segLen = s2 - s1;
    const segH = y2 - y1;
    if (segLen < 0.02 || segH < 0.02) return;
    const localX = -length / 2 + (s1 + s2) / 2;
    const mesh = addBox(group, segLen, segH, T, localX, y1 + segH / 2, 0, wallMat);
    mesh.userData = { kind: 'wall', id: wall.id };
    // Baseboard along bottom
    if (y1 <= 0.02 && segH > 0.18) {
      const bb = addBox(group, segLen, 0.1, T + 0.022, localX, 0.05, 0, trimMat, false);
      bb.userData = { kind: 'wall', id: wall.id };
    }
  };

  let cursor = 0;
  for (const entry of sortedOps) {
    const { op, start, end } = entry;
    if (start > cursor) {
      addWallSpan(cursor, start, 0, H);
    }

    const opW = end - start;
    const localX = -length / 2 + (start + end) / 2;
    const isWindow = op.kind === 'window';
    const sillH = isWindow ? Math.min(H - 0.15, op.sillHeight ?? 0.9) : 0;
    const opH = isWindow
      ? Math.min(H - sillH, op.height ?? 1.35)
      : Math.min(H, op.height ?? 2.12);
    const topY = sillH + opH;

    // Below window sill wall
    if (sillH > 0.02) {
      addWallSpan(start, end, 0, sillH);
    }
    // Header wall above door/window
    if (H - topY > 0.03) {
      addWallSpan(start, end, topY, H);
    }

    // Build Opening Frame + Leaf / Glass
    const opGroup = new THREE.Group();
    opGroup.position.set(localX, sillH, 0);
    const isSelOp = options.selectedOpeningId === op.id;

    const frameTex: SurfaceTextureId = op.texture ?? (isWindow ? 'solid' : 'hardwood');
    const frameColor = op.color || (isWindow ? '#F8FAFC' : '#B98A5D');
    const frameMat = createSurfaceMaterial({
      textureId: frameTex,
      color: frameColor,
      maxAnisotropy: options.maxAnisotropy,
      isSoftwareGl: options.isSoftwareGl,
    });
    if (isSelOp) {
      frameMat.emissive = new THREE.Color('#0D9488');
      frameMat.emissiveIntensity = 0.3;
    }

    const frameT = 0.055;
    const frameD = T + 0.03;
    // Left, right, top jambs
    addBox(opGroup, frameT, opH, frameD, -opW / 2 + frameT / 2, opH / 2, 0, frameMat);
    addBox(opGroup, frameT, opH, frameD, opW / 2 - frameT / 2, opH / 2, 0, frameMat);
    addBox(opGroup, opW, frameT, frameD, 0, opH - frameT / 2, 0, frameMat);

    const glassMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#CBE8F8'),
      roughness: 0.06,
      metalness: 0.05,
      transparent: true,
      opacity: options.isSoftwareGl ? 0.35 : 0.42,
      transmission: options.isSoftwareGl ? 0 : 0.72,
      ior: 1.5,
      depthWrite: false,
    });

    if (isWindow) {
      // Bottom sill
      addBox(opGroup, opW + 0.08, 0.06, frameD + 0.05, 0, 0.03, 0, trimMat);
      // Center mullion if wide
      if (opW > 1.2) {
        addBox(opGroup, 0.04, opH - frameT * 2, 0.06, 0, opH / 2, 0, frameMat);
      }
      // Glass pane
      addBox(opGroup, opW - frameT * 2, opH - frameT * 2, 0.02, 0, opH / 2, 0, glassMat, false);
    } else if (op.kind === 'sliding-door') {
      const panelW = (opW - frameT * 2) * 0.54;
      addBox(opGroup, panelW, opH - frameT, 0.04, -opW * 0.2, (opH - frameT) / 2, 0.025, glassMat, false);
      addBox(opGroup, panelW, opH - frameT, 0.04, opW * 0.2, (opH - frameT) / 2, -0.025, glassMat, false);
      // Frame rails around glass
      addBox(opGroup, 0.04, opH - frameT, 0.05, 0, (opH - frameT) / 2, 0.025, frameMat);
    } else if (op.kind === 'double-door') {
      const leafW = (opW - frameT * 2) / 2;
      const openDir = op.swingInward ? 1 : -1;
      for (const side of [-1, 1]) {
        const pivot = new THREE.Group();
        pivot.position.set(side * (opW / 2 - frameT), 0, 0);
        pivot.rotation.y = side * openDir * 0.42; // Slightly ajar so space feels open & navigable!
        addBox(pivot, leafW - 0.02, opH - frameT, 0.045, -side * (leafW / 2), (opH - frameT) / 2, 0, frameMat);
        addSphere(pivot, 0.028, -side * (leafW - 0.12), Math.min(0.98, opH * 0.46), 0.045, makeAccentMat('#D4AF37', 0.25, 0.85), 8);
        opGroup.add(pivot);
      }
    } else {
      // Single hinged door (slightly ajar at 32° for architectural clarity)
      const leafW = opW - frameT * 2;
      const hingeSide = op.swing === 'left' ? -1 : 1;
      const openDir = op.swingInward ? 1 : -1;
      const pivot = new THREE.Group();
      pivot.position.set(hingeSide * (opW / 2 - frameT), 0, 0);
      pivot.rotation.y = hingeSide * openDir * 0.55;
      addBox(pivot, leafW - 0.02, opH - frameT, 0.045, -hingeSide * (leafW / 2), (opH - frameT) / 2, 0, frameMat);
      addSphere(pivot, 0.028, -hingeSide * (leafW - 0.12), Math.min(0.98, opH * 0.46), 0.045, makeAccentMat('#D4AF37', 0.25, 0.85), 8);
      addSphere(pivot, 0.028, -hingeSide * (leafW - 0.12), Math.min(0.98, opH * 0.46), -0.045, makeAccentMat('#D4AF37', 0.25, 0.85), 8);
      opGroup.add(pivot);
    }

    opGroup.traverse((child) => {
      child.userData = { kind: 'opening', id: op.id };
    });
    group.add(opGroup);
    cursor = Math.max(cursor, end);
  }

  if (cursor < length) {
    addWallSpan(cursor, length, 0, H);
  }

  // Clean architectural top cap when in cutaway dollhouse mode
  if (options.cutaway) {
    const cap = addBox(group, length + 0.01, 0.03, T + 0.01, 0, H + 0.015, 0, capMat, false);
    cap.userData = { kind: 'wall', id: wall.id };
  }

  return group;
}

/**
 * Properly disposes geometries and non-shared materials on a Three.js Object3D subtree.
 */
export function disposeObject3D(root: THREE.Object3D): void {
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (mesh.geometry) {
      mesh.geometry.dispose();
    }
    if (mesh.material) {
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const m of mats) {
        m.dispose();
      }
    }
  });
}

// ============================================================================
// Shared Offscreen 3D Thumbnail Renderer for Library Assets
// ============================================================================
const thumbnailCache = new Map<string, string>();
let sharedThumbRenderer: THREE.WebGLRenderer | null = null;
let sharedThumbScene: THREE.Scene | null = null;
let sharedThumbCamera: THREE.PerspectiveCamera | null = null;

function ensureThumbRenderer() {
  if (sharedThumbRenderer && sharedThumbScene && sharedThumbCamera) {
    return {
      renderer: sharedThumbRenderer,
      scene: sharedThumbScene,
      camera: sharedThumbCamera,
    };
  }
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    preserveDrawingBuffer: true,
  });
  renderer.setSize(128, 128, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  const scene = new THREE.Scene();
  const hemi = new THREE.HemisphereLight('#FFFFFF', '#94A3B8', 1.35);
  scene.add(hemi);
  const key = new THREE.DirectionalLight('#FFF7ED', 1.6);
  key.position.set(4, 7, 5);
  scene.add(key);
  const rim = new THREE.DirectionalLight('#CBD5E1', 0.65);
  rim.position.set(-4, 3, -4);
  scene.add(rim);

  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
  sharedThumbRenderer = renderer;
  sharedThumbScene = scene;
  sharedThumbCamera = camera;
  return { renderer, scene, camera };
}

/**
 * Renders a crisp isometric 3D studio thumbnail of any Floor Plan LibraryItem
 * using the exact same procedural 3D model builder used in the live 3D viewport.
 */
export function renderLibraryItem3DThumbnail(item: LibraryItem): string {
  const cached = thumbnailCache.get(item.id);
  if (cached) return cached;

  try {
    const { renderer, scene, camera } = ensureThumbRenderer();
    const metrics = getDefaultAsset3DMetrics(item.type);
    const mockFurniture: FloorFurniture = {
      id: item.id,
      type: item.type,
      label: item.label,
      x: 0,
      y: 0,
      width: item.realWidthM ?? 1.4,
      depth: item.realDepthM ?? 0.9,
      height: metrics.height,
      elevation: 0,
      rotation: 0,
      color: item.fill,
      texture: metrics.defaultTexture,
      layerId: 'preview',
    };

    const model = buildFloorAsset3D(mockFurniture, { isSoftwareGl: true });
    scene.add(model);

    // Auto-frame bounding sphere in isometric 3/4 view
    const box = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const maxDim = Math.max(size.x, size.y, size.z, 0.6);
    const dist = maxDim * 1.95;

    camera.position.set(
      center.x + dist * 0.72,
      center.y + dist * 0.62,
      center.z + dist * 0.78
    );
    camera.lookAt(center);
    camera.updateProjectionMatrix();

    renderer.render(scene, camera);
    const dataUrl = renderer.domElement.toDataURL('image/png');

    scene.remove(model);
    disposeObject3D(model);

    thumbnailCache.set(item.id, dataUrl);
    return dataUrl;
  } catch {
    return '';
  }
}
