import * as THREE from 'three';
import { SurfaceTextureId } from '../types/diagram';

export interface SurfaceTextureMeta {
  id: SurfaceTextureId;
  name: string;
  category: 'paint' | 'wood' | 'stone' | 'tile' | 'textile' | 'masonry' | 'finish';
  defaultTint: string;
  roughness: number;
  metalness: number;
  bumpScale: number;
  tileMeters: number; // real-world size of one repeat tile in meters
  clearcoat?: number;
  clearcoatRoughness?: number;
  forWalls?: boolean;
  forFloors?: boolean;
  forAssets?: boolean;
}

export const SURFACE_TEXTURES: SurfaceTextureMeta[] = [
  {
    id: 'plaster',
    name: 'Matte Plaster',
    category: 'paint',
    defaultTint: '#F4F3EF',
    roughness: 0.86,
    metalness: 0.0,
    bumpScale: 0.008,
    tileMeters: 1.5,
    forWalls: true,
    forAssets: true,
  },
  {
    id: 'solid',
    name: 'Smooth Paint',
    category: 'paint',
    defaultTint: '#FFFFFF',
    roughness: 0.52,
    metalness: 0.02,
    bumpScale: 0.0,
    tileMeters: 1.0,
    forWalls: true,
    forFloors: true,
    forAssets: true,
  },
  {
    id: 'hardwood',
    name: 'Oak Hardwood',
    category: 'wood',
    defaultTint: '#C89B6E',
    roughness: 0.42,
    metalness: 0.0,
    bumpScale: 0.014,
    tileMeters: 1.6,
    clearcoat: 0.25,
    clearcoatRoughness: 0.3,
    forWalls: true,
    forFloors: true,
    forAssets: true,
  },
  {
    id: 'walnut',
    name: 'Dark Walnut',
    category: 'wood',
    defaultTint: '#6B462B',
    roughness: 0.38,
    metalness: 0.0,
    bumpScale: 0.015,
    tileMeters: 1.6,
    clearcoat: 0.3,
    clearcoatRoughness: 0.28,
    forWalls: true,
    forFloors: true,
    forAssets: true,
  },
  {
    id: 'parquet',
    name: 'Herringbone',
    category: 'wood',
    defaultTint: '#BA8B57',
    roughness: 0.36,
    metalness: 0.0,
    bumpScale: 0.015,
    tileMeters: 1.4,
    clearcoat: 0.35,
    clearcoatRoughness: 0.25,
    forFloors: true,
    forAssets: true,
  },
  {
    id: 'carrara',
    name: 'Carrara Marble',
    category: 'stone',
    defaultTint: '#F5F6F8',
    roughness: 0.14,
    metalness: 0.04,
    bumpScale: 0.005,
    tileMeters: 1.8,
    clearcoat: 0.75,
    clearcoatRoughness: 0.12,
    forWalls: true,
    forFloors: true,
    forAssets: true,
  },
  {
    id: 'marble',
    name: 'Warm Marble',
    category: 'stone',
    defaultTint: '#EAE0D2',
    roughness: 0.16,
    metalness: 0.04,
    bumpScale: 0.005,
    tileMeters: 1.8,
    clearcoat: 0.7,
    clearcoatRoughness: 0.14,
    forWalls: true,
    forFloors: true,
    forAssets: true,
  },
  {
    id: 'granite',
    name: 'Speckled Granite',
    category: 'stone',
    defaultTint: '#525861',
    roughness: 0.22,
    metalness: 0.08,
    bumpScale: 0.01,
    tileMeters: 1.2,
    clearcoat: 0.55,
    clearcoatRoughness: 0.18,
    forWalls: true,
    forAssets: true,
  },
  {
    id: 'tile',
    name: 'Ceramic Tile',
    category: 'tile',
    defaultTint: '#E9EDF0',
    roughness: 0.26,
    metalness: 0.03,
    bumpScale: 0.022,
    tileMeters: 1.2,
    clearcoat: 0.45,
    clearcoatRoughness: 0.2,
    forWalls: true,
    forFloors: true,
    forAssets: true,
  },
  {
    id: 'subway-tile',
    name: 'Subway Tile',
    category: 'tile',
    defaultTint: '#F8FAFC',
    roughness: 0.2,
    metalness: 0.02,
    bumpScale: 0.025,
    tileMeters: 1.0,
    clearcoat: 0.65,
    clearcoatRoughness: 0.15,
    forWalls: true,
    forAssets: true,
  },
  {
    id: 'terrazzo',
    name: 'Terrazzo',
    category: 'tile',
    defaultTint: '#EDEAE4',
    roughness: 0.24,
    metalness: 0.03,
    bumpScale: 0.008,
    tileMeters: 1.4,
    clearcoat: 0.5,
    clearcoatRoughness: 0.2,
    forWalls: true,
    forFloors: true,
    forAssets: true,
  },
  {
    id: 'carpet',
    name: 'Plush Carpet',
    category: 'textile',
    defaultTint: '#D6D3CD',
    roughness: 0.94,
    metalness: 0.0,
    bumpScale: 0.024,
    tileMeters: 0.9,
    forFloors: true,
    forAssets: true,
  },
  {
    id: 'fabric',
    name: 'Woven Fabric',
    category: 'textile',
    defaultTint: '#CBD5E1',
    roughness: 0.88,
    metalness: 0.0,
    bumpScale: 0.018,
    tileMeters: 0.6,
    forWalls: true,
    forAssets: true,
  },
  {
    id: 'leather',
    name: 'Supple Leather',
    category: 'textile',
    defaultTint: '#8B5A3C',
    roughness: 0.42,
    metalness: 0.02,
    bumpScale: 0.012,
    tileMeters: 0.7,
    clearcoat: 0.2,
    clearcoatRoughness: 0.4,
    forAssets: true,
  },
  {
    id: 'brick',
    name: 'Exposed Brick',
    category: 'masonry',
    defaultTint: '#B45D44',
    roughness: 0.84,
    metalness: 0.0,
    bumpScale: 0.035,
    tileMeters: 1.3,
    forWalls: true,
    forAssets: true,
  },
  {
    id: 'stone',
    name: 'Natural Stone',
    category: 'masonry',
    defaultTint: '#9CA09B',
    roughness: 0.82,
    metalness: 0.02,
    bumpScale: 0.036,
    tileMeters: 1.5,
    forWalls: true,
    forFloors: true,
    forAssets: true,
  },
  {
    id: 'concrete',
    name: 'Concrete',
    category: 'masonry',
    defaultTint: '#B8BFC7',
    roughness: 0.72,
    metalness: 0.03,
    bumpScale: 0.018,
    tileMeters: 2.0,
    forWalls: true,
    forFloors: true,
    forAssets: true,
  },
  {
    id: 'slate',
    name: 'Dark Slate',
    category: 'stone',
    defaultTint: '#475569',
    roughness: 0.62,
    metalness: 0.05,
    bumpScale: 0.024,
    tileMeters: 1.4,
    forWalls: true,
    forFloors: true,
    forAssets: true,
  },
  {
    id: 'metal',
    name: 'Brushed Metal',
    category: 'finish',
    defaultTint: '#CBD5E1',
    roughness: 0.24,
    metalness: 0.88,
    bumpScale: 0.008,
    tileMeters: 0.8,
    forAssets: true,
  },
  {
    id: 'glass',
    name: 'Frosted Glass',
    category: 'finish',
    defaultTint: '#E0F2FE',
    roughness: 0.1,
    metalness: 0.05,
    bumpScale: 0.0,
    tileMeters: 1.0,
    forAssets: true,
  },
];

export const SURFACE_TEXTURE_MAP: Record<SurfaceTextureId, SurfaceTextureMeta> =
  SURFACE_TEXTURES.reduce((acc, item) => {
    acc[item.id] = item;
    return acc;
  }, {} as Record<SurfaceTextureId, SurfaceTextureMeta>);

export const WALL_COLOR_SWATCHES = [
  { name: 'Gallery White', hex: '#F8FAFC' },
  { name: 'Warm Alabaster', hex: '#F5F0E6' },
  { name: 'Soft Greige', hex: '#E5E0D8' },
  { name: 'Sage Mist', hex: '#DCE7E0' },
  { name: 'Coastal Blue', hex: '#DCE8F2' },
  { name: 'Terracotta', hex: '#D68C72' },
  { name: 'Warm Charcoal', hex: '#3B4252' },
  { name: 'Deep Navy', hex: '#22344D' },
  { name: 'Forest Teal', hex: '#1E4E52' },
  { name: 'Exposed Brick', hex: '#B45D44' },
];

export const FLOOR_COLOR_SWATCHES = [
  { name: 'Natural Tint', hex: '#FFFFFF' },
  { name: 'Warm Honey', hex: '#F6E7D4' },
  { name: 'Scandi Pale', hex: '#F3EFEA' },
  { name: 'Smoked Oak', hex: '#A98A6C' },
  { name: 'Cool Mist', hex: '#E6EEF4' },
  { name: 'Sandstone', hex: '#E7DAC6' },
  { name: 'Slate Grey', hex: '#8894A3' },
  { name: 'Espresso', hex: '#634A38' },
];

export const ASSET_COLOR_SWATCHES = [
  { name: 'Ivory Cream', hex: '#F5F3EE' },
  { name: 'Warm Oak', hex: '#C89B6E' },
  { name: 'Espresso Walnut', hex: '#5C3D28' },
  { name: 'Slate Blue', hex: '#5B7A9D' },
  { name: 'Emerald Teal', hex: '#1E7A74' },
  { name: 'Terracotta Rust', hex: '#C86D51' },
  { name: 'Sage Green', hex: '#6D8F7B' },
  { name: 'Charcoal', hex: '#374151' },
  { name: 'Soft Sand', hex: '#D6C7B2' },
  { name: 'Blush Rose', hex: '#D69F9E' },
];

// Deterministic PRNG for procedural textures (zero flicker across rebuilds)
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function paintTextureToCanvas(
  textureId: SurfaceTextureId,
  size: number,
  isBump: boolean
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const rand = mulberry32(
    textureId.split('').reduce((s, c) => s * 31 + c.charCodeAt(0), 17) + (isBump ? 999 : 0)
  );

  // Helper to paint base neutral color (textures are neutral/light-anchored so material.color tints them cleanly!)
  const fillBg = (col: string) => {
    ctx.fillStyle = col;
    ctx.fillRect(0, 0, size, size);
  };

  if (textureId === 'solid' || textureId === 'glass') {
    fillBg(isBump ? '#808080' : '#FFFFFF');
    return canvas;
  }

  if (textureId === 'plaster') {
    fillBg(isBump ? '#808080' : '#FAFAFA');
    for (let i = 0; i < 1600; i++) {
      const x = rand() * size;
      const y = rand() * size;
      const r = 1 + rand() * 5;
      const v = isBump ? 114 + Math.floor(rand() * 28) : 240 + Math.floor(rand() * 14);
      ctx.fillStyle = `rgba(${v},${v},${v},0.22)`;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    return canvas;
  }

  if (textureId === 'hardwood' || textureId === 'walnut') {
    const isDark = textureId === 'walnut';
    fillBg(isBump ? '#808080' : isDark ? '#9E7B5D' : '#E2C6A5');
    const planks = 6;
    const plankH = size / planks;
    for (let row = 0; row < planks; row++) {
      const y = row * plankH;
      const stagger = ((row % 2) * 0.48 + (row % 3) * 0.17) * size;
      const shade = 0.88 + rand() * 0.22;
      if (isBump) {
        const bv = Math.floor(120 + rand() * 16);
        ctx.fillStyle = `rgb(${bv},${bv},${bv})`;
      } else {
        const baseR = isDark ? 152 : 216;
        const baseG = isDark ? 116 : 182;
        const baseB = isDark ? 88 : 144;
        ctx.fillStyle = `rgb(${Math.min(255, Math.floor(baseR * shade))},${Math.min(255, Math.floor(baseG * shade))},${Math.min(255, Math.floor(baseB * shade))})`;
      }
      ctx.fillRect(0, y, size, plankH);

      // Subtle wood grain fibers
      for (let g = 0; g < 26; g++) {
        const gy = y + rand() * plankH;
        ctx.strokeStyle = isBump
          ? `rgba(105,105,105,${0.18 + rand() * 0.2})`
          : isDark
          ? `rgba(74,48,30,${0.12 + rand() * 0.14})`
          : `rgba(138,94,52,${0.1 + rand() * 0.12})`;
        ctx.lineWidth = 0.8 + rand() * 1.4;
        ctx.beginPath();
        ctx.moveTo(0, gy);
        const wave = (rand() - 0.5) * 6;
        ctx.bezierCurveTo(size * 0.33, gy + wave, size * 0.66, gy - wave, size, gy);
        ctx.stroke();
      }

      // Plank seams
      ctx.fillStyle = isBump ? '#323232' : isDark ? 'rgba(42,24,12,0.55)' : 'rgba(98,64,34,0.42)';
      ctx.fillRect(0, y, size, 2);
      ctx.fillRect(stagger % size, y, 2, plankH);
    }
    return canvas;
  }

  if (textureId === 'parquet') {
    fillBg(isBump ? '#808080' : '#D8B48A');
    const step = size / 8;
    for (let r = -2; r < 10; r++) {
      for (let c = -2; c < 10; c++) {
        const x = c * step;
        const y = r * step;
        const horiz = (r + c) % 2 === 0;
        const shade = 0.86 + rand() * 0.24;
        ctx.fillStyle = isBump
          ? `rgb(${Math.floor(118 + rand() * 20)},${Math.floor(118 + rand() * 20)},${Math.floor(118 + rand() * 20)})`
          : `rgb(${Math.min(255, Math.floor(214 * shade))},${Math.min(255, Math.floor(178 * shade))},${Math.min(255, Math.floor(136 * shade))})`;
        ctx.fillRect(x + 1, y + 1, step - 2, step - 2);
        // Fine grain lines
        ctx.strokeStyle = isBump ? 'rgba(90,90,90,0.25)' : 'rgba(120,80,44,0.16)';
        ctx.lineWidth = 1;
        for (let k = 0; k < 4; k++) {
          ctx.beginPath();
          if (horiz) {
            const ly = y + (k + 0.5) * (step / 4);
            ctx.moveTo(x + 2, ly);
            ctx.lineTo(x + step - 2, ly);
          } else {
            const lx = x + (k + 0.5) * (step / 4);
            ctx.moveTo(lx, y + 2);
            ctx.lineTo(lx, y + step - 2);
          }
          ctx.stroke();
        }
        ctx.strokeStyle = isBump ? '#3a3a3a' : 'rgba(85,54,28,0.45)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x + 0.75, y + 0.75, step - 1.5, step - 1.5);
      }
    }
    return canvas;
  }

  if (textureId === 'carrara' || textureId === 'marble') {
    const warm = textureId === 'marble';
    fillBg(isBump ? '#828282' : warm ? '#F2EAE0' : '#F8F9FB');
    // Soft mineral clouds
    for (let i = 0; i < 28; i++) {
      const x = rand() * size;
      const y = rand() * size;
      const rad = size * (0.12 + rand() * 0.22);
      const grad = ctx.createRadialGradient(x, y, 2, x, y, rad);
      grad.addColorStop(
        0,
        isBump
          ? 'rgba(116,116,116,0.22)'
          : warm
          ? 'rgba(205,186,162,0.22)'
          : 'rgba(182,190,202,0.18)'
      );
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, size, size);
    }
    // Organic veins
    for (let v = 0; v < 14; v++) {
      let x = rand() * size;
      let y = 0;
      const angle = (rand() - 0.5) * 0.9;
      ctx.strokeStyle = isBump
        ? `rgba(100,100,100,${0.15 + rand() * 0.2})`
        : warm
        ? `rgba(155,134,112,${0.18 + rand() * 0.24})`
        : `rgba(128,138,154,${0.16 + rand() * 0.24})`;
      ctx.lineWidth = 0.8 + rand() * 2.4;
      ctx.beginPath();
      ctx.moveTo(x, y);
      for (let s = 0; s < 14; s++) {
        x += (rand() - 0.48 + angle) * (size / 10);
        y += size / 13;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    // Subtle large slab seam
    ctx.strokeStyle = isBump ? '#606060' : 'rgba(148,156,168,0.22)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(1, 1, size - 2, size - 2);
    return canvas;
  }

  if (textureId === 'granite') {
    fillBg(isBump ? '#808080' : '#B8BEC6');
    for (let i = 0; i < 4200; i++) {
      const x = rand() * size;
      const y = rand() * size;
      const r = 0.8 + rand() * 2.4;
      const roll = rand();
      ctx.fillStyle = isBump
        ? `rgb(${Math.floor(105 + rand() * 50)},${Math.floor(105 + rand() * 50)},${Math.floor(105 + rand() * 50)})`
        : roll < 0.35
        ? 'rgba(42,46,54,0.52)'
        : roll < 0.7
        ? 'rgba(235,238,242,0.55)'
        : 'rgba(128,136,148,0.45)';
      ctx.fillRect(x, y, r, r);
    }
    return canvas;
  }

  if (textureId === 'tile') {
    fillBg(isBump ? '#383838' : '#CBD5E1'); // Grout
    const grid = 4;
    const cell = size / grid;
    const grout = Math.max(3, Math.floor(size * 0.012));
    for (let r = 0; r < grid; r++) {
      for (let c = 0; c < grid; c++) {
        const shade = 0.96 + rand() * 0.04;
        ctx.fillStyle = isBump
          ? '#A8A8A8'
          : `rgb(${Math.floor(248 * shade)},${Math.floor(250 * shade)},${Math.floor(252 * shade)})`;
        ctx.fillRect(c * cell + grout, r * cell + grout, cell - grout * 2, cell - grout * 2);
        // Subtle bevel sheen
        if (!isBump) {
          ctx.strokeStyle = 'rgba(255,255,255,0.65)';
          ctx.lineWidth = 1;
          ctx.strokeRect(
            c * cell + grout + 0.5,
            r * cell + grout + 0.5,
            cell - grout * 2 - 1,
            cell - grout * 2 - 1
          );
        }
      }
    }
    return canvas;
  }

  if (textureId === 'subway-tile') {
    fillBg(isBump ? '#343434' : '#C8D1DC');
    const rows = 8;
    const cols = 4;
    const rowH = size / rows;
    const colW = size / cols;
    const grout = Math.max(2, Math.floor(size * 0.009));
    for (let r = 0; r < rows; r++) {
      const offset = r % 2 === 0 ? 0 : colW / 2;
      for (let c = -1; c <= cols; c++) {
        const x = c * colW + offset;
        const y = r * rowH;
        const shade = 0.96 + rand() * 0.04;
        ctx.fillStyle = isBump
          ? '#AEAEAE'
          : `rgb(${Math.floor(250 * shade)},${Math.floor(251 * shade)},${Math.floor(253 * shade)})`;
        ctx.fillRect(x + grout, y + grout, colW - grout * 2, rowH - grout * 2);
      }
    }
    return canvas;
  }

  if (textureId === 'terrazzo') {
    fillBg(isBump ? '#848484' : '#F3F0EA');
    const chipPalette = ['#C7A688', '#8D99A6', '#56616E', '#D9C2AC', '#B57B64', '#E2DDD5'];
    for (let i = 0; i < 420; i++) {
      const cx = rand() * size;
      const cy = rand() * size;
      const sides = 3 + Math.floor(rand() * 4);
      const rad = 2.5 + rand() * 9;
      ctx.fillStyle = isBump
        ? `rgb(${Math.floor(110 + rand() * 32)},${Math.floor(110 + rand() * 32)},${Math.floor(110 + rand() * 32)})`
        : chipPalette[Math.floor(rand() * chipPalette.length)];
      ctx.beginPath();
      for (let s = 0; s < sides; s++) {
        const a = (s / sides) * Math.PI * 2 + rand() * 0.6;
        const rr = rad * (0.55 + rand() * 0.45);
        const px = cx + Math.cos(a) * rr;
        const py = cy + Math.sin(a) * rr;
        if (s === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
    }
    return canvas;
  }

  if (textureId === 'carpet' || textureId === 'fabric') {
    const isCarpet = textureId === 'carpet';
    fillBg(isBump ? '#7A7A7A' : '#EFEFEF');
    const step = isCarpet ? 4 : 6;
    for (let y = 0; y < size; y += step) {
      for (let x = 0; x < size; x += step) {
        const odd = ((x / step) + (y / step)) % 2 === 0;
        const delta = Math.floor((rand() - 0.5) * (isCarpet ? 26 : 16));
        const base = isBump ? (odd ? 132 : 114) : odd ? 242 : 228;
        const v = Math.max(0, Math.min(255, base + delta));
        ctx.fillStyle = `rgb(${v},${v},${v})`;
        ctx.fillRect(x, y, step, step);
      }
    }
    if (!isCarpet) {
      ctx.strokeStyle = isBump ? 'rgba(95,95,95,0.3)' : 'rgba(180,180,180,0.22)';
      ctx.lineWidth = 1;
      for (let i = 0; i < size; i += step * 2) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(size, i);
        ctx.moveTo(i, 0);
        ctx.lineTo(i, size);
        ctx.stroke();
      }
    }
    return canvas;
  }

  if (textureId === 'leather') {
    fillBg(isBump ? '#808080' : '#E6DCD2');
    for (let i = 0; i < 950; i++) {
      const x = rand() * size;
      const y = rand() * size;
      const r = 2 + rand() * 6;
      ctx.strokeStyle = isBump ? 'rgba(95,95,95,0.26)' : 'rgba(130,108,92,0.14)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    return canvas;
  }

  if (textureId === 'brick') {
    fillBg(isBump ? '#2E2E2E' : '#CFC9C0'); // Mortar
    const rows = 8;
    const cols = 4;
    const rowH = size / rows;
    const colW = size / cols;
    const mortar = Math.max(3, Math.floor(size * 0.014));
    for (let r = 0; r < rows; r++) {
      const offset = r % 2 === 0 ? 0 : colW / 2;
      for (let c = -1; c <= cols; c++) {
        const x = c * colW + offset;
        const y = r * rowH;
        const shade = 0.8 + rand() * 0.3;
        ctx.fillStyle = isBump
          ? `rgb(${Math.floor(150 + rand() * 35)},${Math.floor(150 + rand() * 35)},${Math.floor(150 + rand() * 35)})`
          : `rgb(${Math.min(255, Math.floor(210 * shade))},${Math.min(255, Math.floor(142 * shade))},${Math.min(255, Math.floor(118 * shade))})`;
        ctx.fillRect(x + mortar, y + mortar, colW - mortar * 2, rowH - mortar * 2);
      }
    }
    return canvas;
  }

  if (textureId === 'stone' || textureId === 'slate') {
    const isSlate = textureId === 'slate';
    fillBg(isBump ? '#323232' : isSlate ? '#707B88' : '#A9ABA7');
    const rows = isSlate ? 4 : 6;
    const rowH = size / rows;
    for (let r = 0; r < rows; r++) {
      let x = -((r % 2) * size * 0.18);
      while (x < size) {
        const w = (isSlate ? 0.35 : 0.22 + rand() * 0.26) * size;
        const shade = 0.84 + rand() * 0.28;
        ctx.fillStyle = isBump
          ? `rgb(${Math.floor(135 + rand() * 45)},${Math.floor(135 + rand() * 45)},${Math.floor(135 + rand() * 45)})`
          : isSlate
          ? `rgb(${Math.floor(145 * shade)},${Math.floor(156 * shade)},${Math.floor(170 * shade)})`
          : `rgb(${Math.floor(204 * shade)},${Math.floor(202 * shade)},${Math.floor(194 * shade)})`;
        ctx.fillRect(x + 2, r * rowH + 2, w - 4, rowH - 4);
        x += w;
      }
    }
    return canvas;
  }

  if (textureId === 'concrete') {
    fillBg(isBump ? '#808080' : '#E2E6EA');
    for (let i = 0; i < 2400; i++) {
      const x = rand() * size;
      const y = rand() * size;
      const w = 1 + rand() * 6;
      const h = 1 + rand() * 4;
      const v = isBump ? 105 + Math.floor(rand() * 46) : 206 + Math.floor(rand() * 38);
      ctx.fillStyle = `rgba(${v},${v},${v},0.28)`;
      ctx.fillRect(x, y, w, h);
    }
    return canvas;
  }

  if (textureId === 'metal') {
    fillBg(isBump ? '#808080' : '#E8EDF2');
    for (let y = 0; y < size; y += 2) {
      const v = isBump ? 118 + Math.floor(rand() * 20) : 216 + Math.floor(rand() * 30);
      ctx.fillStyle = `rgba(${v},${v},${v},0.45)`;
      ctx.fillRect(0, y, size, 1.5);
    }
    return canvas;
  }

  fillBg('#FFFFFF');
  return canvas;
}

interface CachedTexturePair {
  albedo: THREE.CanvasTexture;
  bump: THREE.CanvasTexture;
}

const texturePairCache = new Map<SurfaceTextureId, CachedTexturePair>();

export function getTexturePair(
  textureId: SurfaceTextureId,
  maxAnisotropy = 4
): CachedTexturePair {
  const existing = texturePairCache.get(textureId);
  if (existing) return existing;

  const size = 256;
  const albedoCanvas = paintTextureToCanvas(textureId, size, false);
  const bumpCanvas = paintTextureToCanvas(textureId, size, true);

  const albedo = new THREE.CanvasTexture(albedoCanvas);
  albedo.colorSpace = THREE.SRGBColorSpace;
  albedo.wrapS = THREE.RepeatWrapping;
  albedo.wrapT = THREE.RepeatWrapping;
  albedo.anisotropy = Math.max(1, maxAnisotropy);
  albedo.needsUpdate = true;

  const bump = new THREE.CanvasTexture(bumpCanvas);
  bump.wrapS = THREE.RepeatWrapping;
  bump.wrapT = THREE.RepeatWrapping;
  bump.anisotropy = Math.max(1, maxAnisotropy);
  bump.needsUpdate = true;

  const pair = { albedo, bump };
  texturePairCache.set(textureId, pair);
  return pair;
}

/**
 * Creates a PBR MeshPhysicalMaterial or MeshStandardMaterial configured for a given
 * surface texture, tint color, and UV repeat scale in meters.
 */
export function createSurfaceMaterial(options: {
  textureId?: SurfaceTextureId;
  color?: string;
  repeatX?: number;
  repeatY?: number;
  maxAnisotropy?: number;
  isSoftwareGl?: boolean;
  side?: THREE.Side;
  polygonOffset?: boolean;
}): THREE.MeshStandardMaterial {
  const texId = options.textureId ?? 'plaster';
  const meta = SURFACE_TEXTURE_MAP[texId] ?? SURFACE_TEXTURE_MAP.plaster;
  const tintHex = options.color || meta.defaultTint;

  // Special case for frosted/architectural glass
  if (texId === 'glass') {
    return new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(tintHex),
      roughness: 0.08,
      metalness: 0.05,
      transparent: true,
      opacity: options.isSoftwareGl ? 0.42 : 0.55,
      transmission: options.isSoftwareGl ? 0 : 0.65,
      ior: 1.5,
      thickness: 0.08,
      side: options.side ?? THREE.FrontSide,
    });
  }

  const needsTexture = texId !== 'solid';
  let map: THREE.Texture | null = null;
  let bumpMap: THREE.Texture | null = null;

  if (needsTexture) {
    const pair = getTexturePair(texId, options.maxAnisotropy ?? 4);
    const rx = Math.max(0.25, options.repeatX ?? 1);
    const ry = Math.max(0.25, options.repeatY ?? 1);
    if (Math.abs(rx - 1) > 0.01 || Math.abs(ry - 1) > 0.01) {
      map = pair.albedo.clone();
      map.repeat.set(rx, ry);
      map.needsUpdate = true;
      bumpMap = pair.bump.clone();
      bumpMap.repeat.set(rx, ry);
      bumpMap.needsUpdate = true;
    } else {
      map = pair.albedo;
      bumpMap = pair.bump;
    }
  }

  // When combining a richly colored texture (like oak wood or brick) with a neutral white/default tint,
  // multiply cleanly so dark tints don't crush natural grain.
  const color = new THREE.Color(tintHex);

  if (meta.clearcoat && !options.isSoftwareGl) {
    return new THREE.MeshPhysicalMaterial({
      color,
      map,
      bumpMap,
      bumpScale: meta.bumpScale,
      roughness: meta.roughness,
      metalness: meta.metalness,
      clearcoat: meta.clearcoat,
      clearcoatRoughness: meta.clearcoatRoughness ?? 0.2,
      side: options.side ?? THREE.FrontSide,
      polygonOffset: options.polygonOffset ?? false,
      polygonOffsetFactor: options.polygonOffset ? -1 : 0,
      polygonOffsetUnits: options.polygonOffset ? -1 : 0,
    });
  }

  return new THREE.MeshStandardMaterial({
    color,
    map,
    bumpMap,
    bumpScale: meta.bumpScale,
    roughness: meta.roughness,
    metalness: meta.metalness,
    side: options.side ?? THREE.FrontSide,
    polygonOffset: options.polygonOffset ?? false,
    polygonOffsetFactor: options.polygonOffset ? -1 : 0,
    polygonOffsetUnits: options.polygonOffset ? -1 : 0,
  });
}

const swatchPreviewCache = new Map<string, string>();

/**
 * Generates a small cached data-URL swatch preview of any procedural texture tinted with a color,
 * used in the Inspector Material Picker & Floating Toolbar.
 */
export function getTextureSwatchDataUrl(textureId: SurfaceTextureId, tintHex?: string): string {
  const meta = SURFACE_TEXTURE_MAP[textureId] ?? SURFACE_TEXTURE_MAP.plaster;
  const tint = tintHex || meta.defaultTint;
  const key = `${textureId}_${tint}`;
  const cached = swatchPreviewCache.get(key);
  if (cached) return cached;

  const base = paintTextureToCanvas(textureId, 64, false);
  const out = document.createElement('canvas');
  out.width = 64;
  out.height = 64;
  const ctx = out.getContext('2d')!;
  ctx.drawImage(base, 0, 0);
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = tint;
  ctx.fillRect(0, 0, 64, 64);
  ctx.globalCompositeOperation = 'source-over';
  const url = out.toDataURL('image/png');
  swatchPreviewCache.set(key, url);
  return url;
}
