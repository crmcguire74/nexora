import { DiagramThemeId } from '../types/diagram';

export interface DiagramThemeConfig {
  id: DiagramThemeId;
  name: string;
  description: string;
  canvasBgLight: string;
  canvasBgDark: string;
  gridColorLight: string;
  gridColorDark: string;
  nodeBgLight: string;
  nodeBgDark: string;
  nodeBorderLight: string;
  nodeBorderDark: string;
  textLight: string;
  textDark: string;
  connectorLight: string;
  connectorDark: string;
  accent: string;
  borderRadius: number;
  strokeWidth: number;
  useShadow: boolean;
  fontWeight: number;
  palette: string[];
}

export const DIAGRAM_THEMES: Record<DiagramThemeId, DiagramThemeConfig> = {
  modern: {
    id: 'modern',
    name: 'Modern',
    description: 'Refined studio surfaces, luminous dark depth, crisp Nexora accents',
    canvasBgLight: '#F7F9FC',
    canvasBgDark: '#070B12',
    gridColorLight: '#DCE4EE',
    gridColorDark: '#1B273B',
    nodeBgLight: '#FFFFFF',
    nodeBgDark: '#101827',
    nodeBorderLight: '#CBD5E1',
    nodeBorderDark: '#26354D',
    textLight: '#0F172A',
    textDark: '#F1F5F9',
    connectorLight: '#475569',
    connectorDark: '#7C93B4',
    accent: '#0F766E',
    borderRadius: 10,
    strokeWidth: 1.5,
    useShadow: true,
    fontWeight: 500,
    palette: ['#0F766E', '#0284C7', '#2563EB', '#16A34A', '#D97706', '#E11D48', '#7C3AED', '#334155'],
  },
  minimal: {
    id: 'minimal',
    name: 'Minimal',
    description: 'Neutral matte paper, hairline strokes, editorial restraint',
    canvasBgLight: '#FFFFFF',
    canvasBgDark: '#080A0F',
    gridColorLight: '#ECEFF4',
    gridColorDark: '#1A202C',
    nodeBgLight: '#FAFAFA',
    nodeBgDark: '#11151F',
    nodeBorderLight: '#D4D4D8',
    nodeBorderDark: '#2A3342',
    textLight: '#18181B',
    textDark: '#F4F4F5',
    connectorLight: '#52525B',
    connectorDark: '#8E99AD',
    accent: '#14B8A6',
    borderRadius: 6,
    strokeWidth: 1.25,
    useShadow: false,
    fontWeight: 500,
    palette: ['#18181B', '#52525B', '#0F766E', '#0284C7', '#D97706', '#DC2626', '#71717A', '#A1A1AA'],
  },
  technical: {
    id: 'technical',
    name: 'Technical',
    description: 'High-clarity engineering notation with sharp geometry',
    canvasBgLight: '#F3F6FA',
    canvasBgDark: '#090E17',
    gridColorLight: '#D8E1EC',
    gridColorDark: '#1A263A',
    nodeBgLight: '#FFFFFF',
    nodeBgDark: '#111B2D',
    nodeBorderLight: '#64748B',
    nodeBorderDark: '#334763',
    textLight: '#0F172A',
    textDark: '#E6EEF8',
    connectorLight: '#334155',
    connectorDark: '#94A8C4',
    accent: '#0284C7',
    borderRadius: 4,
    strokeWidth: 1.5,
    useShadow: false,
    fontWeight: 600,
    palette: ['#0284C7', '#0F766E', '#4F46E5', '#B45309', '#DC2626', '#334155', '#475569', '#0F172A'],
  },
  presentation: {
    id: 'presentation',
    name: 'Presentation',
    description: 'Expressive contrast and bold legibility for slides and decks',
    canvasBgLight: '#FFFFFF',
    canvasBgDark: '#0A101D',
    gridColorLight: '#E2E8F0',
    gridColorDark: '#1E2B42',
    nodeBgLight: '#FFFFFF',
    nodeBgDark: '#141F35',
    nodeBorderLight: '#94A3B8',
    nodeBorderDark: '#3A4E6E',
    textLight: '#0F172A',
    textDark: '#FFFFFF',
    connectorLight: '#1E293B',
    connectorDark: '#A5B8D4',
    accent: '#14B8A6',
    borderRadius: 14,
    strokeWidth: 2,
    useShadow: true,
    fontWeight: 600,
    palette: ['#0F766E', '#0891B2', '#2563EB', '#059669', '#D97706', '#E11D48', '#4F46E5', '#0F172A'],
  },
  blueprint: {
    id: 'blueprint',
    name: 'Blueprint',
    description: 'Architectural drafting surface with crisp cyan-white lines',
    canvasBgLight: '#14335B',
    canvasBgDark: '#091B34',
    gridColorLight: 'rgba(147, 197, 253, 0.18)',
    gridColorDark: 'rgba(56, 189, 248, 0.14)',
    nodeBgLight: 'rgba(24, 62, 108, 0.78)',
    nodeBgDark: 'rgba(15, 42, 78, 0.84)',
    nodeBorderLight: '#7DD3FC',
    nodeBorderDark: '#38BDF8',
    textLight: '#F0F9FF',
    textDark: '#F0F9FF',
    connectorLight: '#BAE6FD',
    connectorDark: '#7DD3FC',
    accent: '#38BDF8',
    borderRadius: 2,
    strokeWidth: 1.5,
    useShadow: false,
    fontWeight: 500,
    palette: ['#38BDF8', '#7DD3FC', '#E0F2FE', '#FDE047', '#6EE7B7', '#FDA4AF', '#1E40AF', '#0C4A6E'],
  },
};

export const SWATCH_COLORS = [
  { name: 'Slate', fill: '#FFFFFF', stroke: '#475569', text: '#0F172A' },
  { name: 'Teal', fill: '#F0FDFA', stroke: '#0F766E', text: '#134E4A' },
  { name: 'Cobalt', fill: '#EFF6FF', stroke: '#2563EB', text: '#1E3A8A' },
  { name: 'Sky', fill: '#F0F9FF', stroke: '#0284C7', text: '#0C4A6E' },
  { name: 'Emerald', fill: '#ECFDF5', stroke: '#16A34A', text: '#14532D' },
  { name: 'Violet', fill: '#F5F3FF', stroke: '#7C3AED', text: '#4C1D95' },
  { name: 'Amber', fill: '#FFFBEB', stroke: '#D97706', text: '#78350F' },
  { name: 'Crimson', fill: '#FEF2F2', stroke: '#DC2626', text: '#7F1D1D' },
  { name: 'Charcoal', fill: '#1E293B', stroke: '#0F172A', text: '#F8FAFC' },
];

export const PROTOCOL_STYLES: Record<
  string,
  { color: string; lineStyle: 'solid' | 'dashed' | 'dotted'; label: string }
> = {
  HTTPS: { color: '#2563EB', lineStyle: 'solid', label: 'HTTPS' },
  REST: { color: '#0284C7', lineStyle: 'solid', label: 'REST API' },
  GraphQL: { color: '#0D9488', lineStyle: 'solid', label: 'GraphQL' },
  gRPC: { color: '#4F46E5', lineStyle: 'solid', label: 'gRPC' },
  WebSocket: { color: '#16A34A', lineStyle: 'dashed', label: 'WebSocket' },
  Event: { color: '#D97706', lineStyle: 'dashed', label: 'Event / Queue' },
  SQL: { color: '#475569', lineStyle: 'solid', label: 'Database' },
  Auth: { color: '#DC2626', lineStyle: 'dotted', label: 'Auth / OIDC' },
};

/**
 * Maps light-mode brand strokes to luminous, high-contrast studio equivalents
 * on obsidian dark canvases so every icon, border, and wire pops clearly.
 */
const DARK_STROKE_LIFT_MAP: Record<string, string> = {
  '#0F172A': '#CBD5E1',
  '#1E293B': '#CBD5E1',
  '#334155': '#94A3B8',
  '#475569': '#94A3B8',
  '#64748B': '#94A3B8',
  '#0F766E': '#2DD4BF',
  '#0D9488': '#2DD4BF',
  '#115E59': '#2DD4BF',
  '#0284C7': '#38BDF8',
  '#0369A1': '#38BDF8',
  '#2563EB': '#60A5FA',
  '#1D4ED8': '#60A5FA',
  '#4338CA': '#818CF8',
  '#4F46E5': '#818CF8',
  '#7C3AED': '#A78BFA',
  '#9333EA': '#C084FC',
  '#16A34A': '#4ADE80',
  '#059669': '#34D399',
  '#15803D': '#4ADE80',
  '#D97706': '#FBBF24',
  '#B45309': '#FBBF24',
  '#CA8A04': '#FACC15',
  '#EA580C': '#FB923C',
  '#C2410C': '#FB923C',
  '#DC2626': '#F87171',
  '#B91C1C': '#F87171',
  '#E11D48': '#FB7185',
};

export function liftStrokeForDark(color: string, darkMode: boolean): string {
  if (!darkMode || !color) return color;
  const upper = color.trim().toUpperCase();
  return DARK_STROKE_LIFT_MAP[upper] ?? color;
}

/**
 * Converts light-mode pastel node fills into subtle obsidian-tinted card fills in dark mode
 * so cards never glare blindingly white on a dark canvas.
 */
const DARK_FILL_MAP: Record<string, string> = {
  '#FFFFFF': '#101827',
  '#F8FAFC': '#0F1726',
  '#F1F5F9': '#131C2E',
  '#EFF6FF': '#10203A',
  '#F0F9FF': '#0D2235',
  '#F0FDFA': '#0B2427',
  '#CCFBF1': '#0D2B2E',
  '#ECFDF5': '#0C241C',
  '#DCFCE7': '#0E291E',
  '#FFFBEB': '#241D0F',
  '#FEF3C7': '#271E10',
  '#FFF7ED': '#271910',
  '#FEF2F2': '#28131A',
  '#F5F3FF': '#1C1633',
  '#FEF9C3': '#2B2410',
  '#E0F2FE': '#0E2438',
  '#FFE4E6': '#2B141E',
  '#F3E8FF': '#201736',
  '#1E293B': '#1A2438',
  '#0F172A': '#162033',
};

export function adaptFillForDark(fill: string, darkMode: boolean): string {
  if (!darkMode || !fill || fill === 'transparent' || fill === 'none') return fill;
  const upper = fill.trim().toUpperCase();
  return DARK_FILL_MAP[upper] ?? fill;
}

export function adaptTextForDark(textColor: string, fill: string, darkMode: boolean): string {
  if (!darkMode) return textColor;
  const upperFill = (fill || '').trim().toUpperCase();
  if (upperFill === 'TRANSPARENT' || upperFill === 'NONE' || DARK_FILL_MAP[upperFill]) {
    return '#F1F5F9';
  }
  return textColor;
}
