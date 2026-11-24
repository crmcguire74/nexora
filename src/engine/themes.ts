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
    description: 'Refined surfaces, balanced accents, crisp visual hierarchy',
    canvasBgLight: '#F8FAFC',
    canvasBgDark: '#0B1120',
    gridColorLight: '#E2E8F0',
    gridColorDark: '#1E293B',
    nodeBgLight: '#FFFFFF',
    nodeBgDark: '#131C31',
    nodeBorderLight: '#CBD5E1',
    nodeBorderDark: '#334155',
    textLight: '#0F172A',
    textDark: '#F1F5F9',
    connectorLight: '#475569',
    connectorDark: '#94A3B8',
    accent: '#2563EB',
    borderRadius: 10,
    strokeWidth: 1.5,
    useShadow: true,
    fontWeight: 500,
    palette: ['#2563EB', '#0EA5E9', '#0D9488', '#16A34A', '#D97706', '#DC2626', '#475569', '#1E293B'],
  },
  minimal: {
    id: 'minimal',
    name: 'Minimal',
    description: 'Neutral matte paper, hairline strokes, editorial restraint',
    canvasBgLight: '#FFFFFF',
    canvasBgDark: '#090D16',
    gridColorLight: '#F1F5F9',
    gridColorDark: '#182030',
    nodeBgLight: '#FAFAFA',
    nodeBgDark: '#111827',
    nodeBorderLight: '#D4D4D8',
    nodeBorderDark: '#374151',
    textLight: '#18181B',
    textDark: '#F4F4F5',
    connectorLight: '#52525B',
    connectorDark: '#A1A1AA',
    accent: '#18181B',
    borderRadius: 6,
    strokeWidth: 1.25,
    useShadow: false,
    fontWeight: 500,
    palette: ['#18181B', '#52525B', '#2563EB', '#059669', '#D97706', '#DC2626', '#71717A', '#A1A1AA'],
  },
  technical: {
    id: 'technical',
    name: 'Technical',
    description: 'High-clarity engineering notation with sharp geometry',
    canvasBgLight: '#F4F6F9',
    canvasBgDark: '#0C121D',
    gridColorLight: '#DCE3EC',
    gridColorDark: '#1B2536',
    nodeBgLight: '#FFFFFF',
    nodeBgDark: '#141D2E',
    nodeBorderLight: '#64748B',
    nodeBorderDark: '#475569',
    textLight: '#0F172A',
    textDark: '#E2E8F0',
    connectorLight: '#334155',
    connectorDark: '#CBD5E1',
    accent: '#0284C7',
    borderRadius: 4,
    strokeWidth: 1.5,
    useShadow: false,
    fontWeight: 600,
    palette: ['#0284C7', '#0F766E', '#4338CA', '#B45309', '#B91C1C', '#334155', '#475569', '#0F172A'],
  },
  presentation: {
    id: 'presentation',
    name: 'Presentation',
    description: 'Expressive contrast and bold legibility for slides and decks',
    canvasBgLight: '#FFFFFF',
    canvasBgDark: '#0F172A',
    gridColorLight: '#E2E8F0',
    gridColorDark: '#1E293B',
    nodeBgLight: '#FFFFFF',
    nodeBgDark: '#1E293B',
    nodeBorderLight: '#94A3B8',
    nodeBorderDark: '#475569',
    textLight: '#0F172A',
    textDark: '#FFFFFF',
    connectorLight: '#1E293B',
    connectorDark: '#CBD5E1',
    accent: '#1D4ED8',
    borderRadius: 14,
    strokeWidth: 2,
    useShadow: true,
    fontWeight: 600,
    palette: ['#1D4ED8', '#0891B2', '#059669', '#D97706', '#E11D48', '#334155', '#0F172A', '#4F46E5'],
  },
  blueprint: {
    id: 'blueprint',
    name: 'Blueprint',
    description: 'Architectural drafting surface with crisp cyan-white lines',
    canvasBgLight: '#173A66',
    canvasBgDark: '#0D2442',
    gridColorLight: 'rgba(147, 197, 253, 0.18)',
    gridColorDark: 'rgba(147, 197, 253, 0.14)',
    nodeBgLight: 'rgba(30, 74, 128, 0.72)',
    nodeBgDark: 'rgba(20, 52, 94, 0.8)',
    nodeBorderLight: '#93C5FD',
    nodeBorderDark: '#60A5FA',
    textLight: '#EFF6FF',
    textDark: '#EFF6FF',
    connectorLight: '#BFDBFE',
    connectorDark: '#93C5FD',
    accent: '#38BDF8',
    borderRadius: 2,
    strokeWidth: 1.5,
    useShadow: false,
    fontWeight: 500,
    palette: ['#38BDF8', '#93C5FD', '#E0F2FE', '#FDE047', '#6EE7B7', '#FCA5A5', '#1E40AF', '#0C4A6E'],
  },
};

export const SWATCH_COLORS = [
  { name: 'Slate', fill: '#FFFFFF', stroke: '#475569', text: '#0F172A' },
  { name: 'Cobalt', fill: '#EFF6FF', stroke: '#2563EB', text: '#1E3A8A' },
  { name: 'Sky', fill: '#F0F9FF', stroke: '#0284C7', text: '#0C4A6E' },
  { name: 'Teal', fill: '#F0FDFA', stroke: '#0D9488', text: '#134E4A' },
  { name: 'Emerald', fill: '#ECFDF5', stroke: '#16A34A', text: '#14532D' },
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
  gRPC: { color: '#4338CA', lineStyle: 'solid', label: 'gRPC' },
  WebSocket: { color: '#16A34A', lineStyle: 'dashed', label: 'WebSocket' },
  Event: { color: '#D97706', lineStyle: 'dashed', label: 'Event / Queue' },
  SQL: { color: '#475569', lineStyle: 'solid', label: 'Database' },
  Auth: { color: '#DC2626', lineStyle: 'dotted', label: 'Auth / OIDC' },
};
