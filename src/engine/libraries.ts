import {
  DiagramObject,
  DiagramType,
  FloorFurniture,
  SequenceParticipantRole,
} from '../types/diagram';

export type NexoraModuleId = 'flow' | 'space' | 'sequence' | 'architect';

export interface NexoraModuleMeta {
  id: NexoraModuleId;
  name: string;
  subtitle: string;
  description: string;
  accent: string;
  diagramTypes: DiagramType[];
}

export const NEXORA_MODULES: NexoraModuleMeta[] = [
  {
    id: 'flow',
    name: 'Flow',
    subtitle: 'Flowcharts & processes',
    description: 'Flowcharts, organization charts, user journeys, and freeform ideation canvases',
    accent: '#0F766E',
    diagramTypes: ['flowchart', 'orgchart', 'journey', 'whiteboard'],
  },
  {
    id: 'space',
    name: 'Space',
    subtitle: 'Floorplans & layouts',
    description: 'Measured architectural floor plans for homes, businesses, interiors, garages, and exteriors',
    accent: '#D97706',
    diagramTypes: ['floorplan'],
  },
  {
    id: 'sequence',
    name: 'Sequence',
    subtitle: 'Call flows & interactions',
    description: 'Interactive lifelines, API call flows, async events, activations, and combined fragments',
    accent: '#0284C7',
    diagramTypes: ['sequence'],
  },
  {
    id: 'architect',
    name: 'Architect',
    subtitle: 'System architecture',
    description: 'Cloud system architectures, network topologies, and database entity relationship models',
    accent: '#4F46E5',
    diagramTypes: ['architecture', 'network', 'erd'],
  },
];

export const NEXORA_MODULE_MAP: Record<NexoraModuleId, NexoraModuleMeta> = NEXORA_MODULES.reduce(
  (acc, item) => {
    acc[item.id] = item;
    return acc;
  },
  {} as Record<NexoraModuleId, NexoraModuleMeta>
);

export interface LibraryItem {
  id: string;
  type: string;
  label: string;
  section: string;
  category: DiagramObject['category'];
  defaultWidth: number;
  defaultHeight: number;
  fill: string;
  stroke: string;
  textColor: string;
  borderRadius?: number;
  dashed?: boolean;
  isContainer?: boolean;
  subtitle?: string;
  technology?: string;
  // For sequence participants
  participantRole?: SequenceParticipantRole;
  // For floorplan items
  floorItemKind?: 'wall' | 'door' | 'double-door' | 'sliding-door' | 'window' | 'furniture' | 'room-rect';
  realWidthM?: number;
  realDepthM?: number;
}

export interface DiagramTypeMeta {
  type: DiagramType;
  module: NexoraModuleId;
  name: string;
  shortName: string;
  description: string;
  accent: string;
}

export const DIAGRAM_TYPES: DiagramTypeMeta[] = [
  // Nexora Flow
  {
    type: 'flowchart',
    module: 'flow',
    name: 'Flowchart',
    shortName: 'Flowchart',
    description: 'Workflows, decision trees, approvals, swimlanes, and rapid process mapping',
    accent: '#0F766E',
  },
  {
    type: 'orgchart',
    module: 'flow',
    name: 'Organization Chart',
    shortName: 'Org Chart',
    description: 'Executive hierarchies, leadership teams, squads, and department groups',
    accent: '#475569',
  },
  {
    type: 'journey',
    module: 'flow',
    name: 'User Journey',
    shortName: 'Journey',
    description: 'Personas, stages, user actions, channels, pain points, KPIs, and opportunities',
    accent: '#E11D48',
  },
  {
    type: 'whiteboard',
    module: 'flow',
    name: 'Freeform Canvas',
    shortName: 'Whiteboard',
    description: 'Sticky notes, kanban columns, 2×2 matrices, checklists, and open concept mapping',
    accent: '#1E293B',
  },
  // Nexora Space
  {
    type: 'floorplan',
    module: 'space',
    name: 'Floor Plan & Space',
    shortName: 'Floor Plan',
    description: 'Measured walls, auto-detected rooms, homes, commercial offices, garages, and exteriors',
    accent: '#D97706',
  },
  // Nexora Sequence
  {
    type: 'sequence',
    module: 'sequence',
    name: 'Sequence Diagram',
    shortName: 'Sequence',
    description: 'Interactive lifelines, drag-to-connect calls, activations, events, and fragments',
    accent: '#0284C7',
  },
  // Nexora Architect
  {
    type: 'architecture',
    module: 'architect',
    name: 'System Architecture',
    shortName: 'Architecture',
    description: 'Layered cloud services, APIs, AI/ML models, databases, and nested VPC boundaries',
    accent: '#2563EB',
  },
  {
    type: 'network',
    module: 'architect',
    name: 'Network Diagram',
    shortName: 'Network',
    description: 'Routers, firewalls, VPNs, switches, DMZs, IoT endpoints, and infrastructure topology',
    accent: '#4338CA',
  },
  {
    type: 'erd',
    module: 'architect',
    name: 'Entity Relationship',
    shortName: 'ERD',
    description: 'Database tables, views, enums, primary/foreign keys, and cardinality links',
    accent: '#059669',
  },
];

export const DIAGRAM_TYPE_MAP: Record<DiagramType, DiagramTypeMeta> = DIAGRAM_TYPES.reduce(
  (acc, item) => {
    acc[item.type] = item;
    return acc;
  },
  {} as Record<DiagramType, DiagramTypeMeta>
);

// ============================================================================
// FLOW MODULE LIBRARIES
// ============================================================================

export const FLOWCHART_LIBRARY: LibraryItem[] = [
  // Core Flow
  { id: 'fc-start', type: 'start', label: 'Start', section: 'Core Flow', category: 'shape', defaultWidth: 148, defaultHeight: 52, fill: '#ECFDF5', stroke: '#16A34A', textColor: '#14532D', borderRadius: 26 },
  { id: 'fc-end', type: 'end', label: 'End / Terminal', section: 'Core Flow', category: 'shape', defaultWidth: 148, defaultHeight: 52, fill: '#FEF2F2', stroke: '#DC2626', textColor: '#7F1D1D', borderRadius: 26 },
  { id: 'fc-process', type: 'process', label: 'Process Step', section: 'Core Flow', category: 'shape', defaultWidth: 168, defaultHeight: 68, fill: '#FFFFFF', stroke: '#0F766E', textColor: '#0F172A', borderRadius: 10 },
  { id: 'fc-decision', type: 'decision', label: 'Decision', section: 'Core Flow', category: 'shape', defaultWidth: 152, defaultHeight: 96, fill: '#FFFBEB', stroke: '#D97706', textColor: '#78350F', borderRadius: 4 },
  { id: 'fc-io', type: 'io', label: 'Input / Output', section: 'Core Flow', category: 'shape', defaultWidth: 168, defaultHeight: 64, fill: '#F0F9FF', stroke: '#0284C7', textColor: '#0C4A6E', borderRadius: 6 },
  { id: 'fc-subprocess', type: 'subprocess', label: 'Subprocess', section: 'Core Flow', category: 'shape', defaultWidth: 176, defaultHeight: 68, fill: '#F8FAFC', stroke: '#475569', textColor: '#0F172A', borderRadius: 8 },
  // Operations & Logic
  { id: 'fc-manual', type: 'manual-op', label: 'Manual Task', section: 'Operations & Logic', category: 'shape', defaultWidth: 164, defaultHeight: 64, fill: '#F5F3FF', stroke: '#7C3AED', textColor: '#4C1D95', borderRadius: 8, subtitle: 'Human Action' },
  { id: 'fc-approval', type: 'approval', label: 'Approval Gate', section: 'Operations & Logic', category: 'shape', defaultWidth: 168, defaultHeight: 68, fill: '#ECFDF5', stroke: '#059669', textColor: '#064E3B', borderRadius: 10, subtitle: 'Review & Sign-off' },
  { id: 'fc-loop', type: 'loop', label: 'Loop / Repeat', section: 'Operations & Logic', category: 'shape', defaultWidth: 160, defaultHeight: 64, fill: '#EFF6FF', stroke: '#2563EB', textColor: '#1E3A8A', borderRadius: 12, subtitle: 'Iterate' },
  { id: 'fc-merge', type: 'merge', label: 'Merge / Junction', section: 'Operations & Logic', category: 'shape', defaultWidth: 136, defaultHeight: 64, fill: '#F8FAFC', stroke: '#475569', textColor: '#0F172A', borderRadius: 6 },
  { id: 'fc-error', type: 'error-handler', label: 'Exception / Error', section: 'Operations & Logic', category: 'shape', defaultWidth: 168, defaultHeight: 66, fill: '#FEF2F2', stroke: '#DC2626', textColor: '#7F1D1D', borderRadius: 8, subtitle: 'Fallback Path' },
  { id: 'fc-connector-dot', type: 'connector-circle', label: 'Page Connector', section: 'Operations & Logic', category: 'shape', defaultWidth: 64, defaultHeight: 64, fill: '#FFFFFF', stroke: '#334155', textColor: '#0F172A', borderRadius: 32 },
  // Data, Triggers & Artifacts
  { id: 'fc-document', type: 'document', label: 'Document', section: 'Data & Triggers', category: 'shape', defaultWidth: 160, defaultHeight: 74, fill: '#FFFFFF', stroke: '#64748B', textColor: '#0F172A', borderRadius: 6 },
  { id: 'fc-multi-doc', type: 'multi-doc', label: 'Document Stack', section: 'Data & Triggers', category: 'shape', defaultWidth: 164, defaultHeight: 76, fill: '#F8FAFC', stroke: '#475569', textColor: '#0F172A', borderRadius: 6, subtitle: 'Batch Output' },
  { id: 'fc-database', type: 'database', label: 'Database', section: 'Data & Triggers', category: 'shape', defaultWidth: 144, defaultHeight: 82, fill: '#F0FDFA', stroke: '#0D9488', textColor: '#134E4A', borderRadius: 8 },
  { id: 'fc-delay', type: 'delay', label: 'Delay / Timer', section: 'Data & Triggers', category: 'shape', defaultWidth: 156, defaultHeight: 64, fill: '#FEF2F2', stroke: '#DC2626', textColor: '#7F1D1D', borderRadius: 8 },
  { id: 'fc-webhook', type: 'cloud-sync', label: 'API / Webhook', section: 'Data & Triggers', category: 'shape', defaultWidth: 168, defaultHeight: 68, fill: '#F0F9FF', stroke: '#0284C7', textColor: '#0C4A6E', borderRadius: 10, subtitle: 'Automated Trigger' },
  { id: 'fc-notify', type: 'email-notify', label: 'Notification', section: 'Data & Triggers', category: 'shape', defaultWidth: 164, defaultHeight: 64, fill: '#FFF7ED', stroke: '#EA580C', textColor: '#7C2D12', borderRadius: 10, subtitle: 'Email / Slack / SMS' },
  // Structure
  { id: 'fc-swimlane', type: 'swimlane', label: 'Swimlane', section: 'Structure', category: 'container', defaultWidth: 640, defaultHeight: 200, fill: '#F8FAFC', stroke: '#94A3B8', textColor: '#334155', borderRadius: 10, isContainer: true },
  { id: 'fc-container', type: 'container', label: 'Phase Group', section: 'Structure', category: 'container', defaultWidth: 340, defaultHeight: 240, fill: '#F8FAFC', stroke: '#94A3B8', textColor: '#334155', borderRadius: 12, dashed: true, isContainer: true },
  { id: 'fc-note', type: 'note', label: 'Annotation', section: 'Structure', category: 'annotation', defaultWidth: 180, defaultHeight: 76, fill: '#FEF9C3', stroke: '#CA8A04', textColor: '#713F12', borderRadius: 6 },
];

export const ORGCHART_LIBRARY: LibraryItem[] = [
  // Leadership
  { id: 'org-board', type: 'org-board', label: 'Board / Advisor', section: 'Leadership', category: 'shape', defaultWidth: 196, defaultHeight: 76, fill: '#0F172A', stroke: '#0F766E', textColor: '#F8FAFC', subtitle: 'Board of Directors' },
  { id: 'org-exec', type: 'org-exec', label: 'C-Suite Executive', section: 'Leadership', category: 'shape', defaultWidth: 196, defaultHeight: 78, fill: '#1E293B', stroke: '#0F172A', textColor: '#F8FAFC', subtitle: 'Chief Executive Officer' },
  { id: 'org-vp', type: 'org-vp', label: 'VP / SVP', section: 'Leadership', category: 'shape', defaultWidth: 192, defaultHeight: 76, fill: '#F0FDFA', stroke: '#0F766E', textColor: '#134E4A', subtitle: 'VP of Engineering' },
  { id: 'org-manager', type: 'org-manager', label: 'Director / Lead', section: 'Leadership', category: 'shape', defaultWidth: 188, defaultHeight: 76, fill: '#EFF6FF', stroke: '#2563EB', textColor: '#1E3A8A', subtitle: 'Engineering Manager' },
  // Team Roles
  { id: 'org-member', type: 'org-member', label: 'Team Member', section: 'Team Roles', category: 'shape', defaultWidth: 180, defaultHeight: 72, fill: '#FFFFFF', stroke: '#94A3B8', textColor: '#0F172A', subtitle: 'Senior Engineer' },
  { id: 'org-assistant', type: 'org-assistant', label: 'Chief of Staff / EA', section: 'Team Roles', category: 'shape', defaultWidth: 184, defaultHeight: 72, fill: '#F8FAFC', stroke: '#64748B', textColor: '#334155', dashed: true, subtitle: 'Staff Support' },
  { id: 'org-contractor', type: 'org-contractor', label: 'Contractor / Agency', section: 'Team Roles', category: 'shape', defaultWidth: 184, defaultHeight: 72, fill: '#FFFBEB', stroke: '#D97706', textColor: '#78350F', dashed: true, subtitle: 'External Partner' },
  { id: 'org-open-role', type: 'org-open-role', label: 'Open Role (Hiring)', section: 'Team Roles', category: 'shape', defaultWidth: 184, defaultHeight: 72, fill: '#ECFDF5', stroke: '#16A34A', textColor: '#14532D', dashed: true, subtitle: 'Q3 Headcount' },
  // Structure
  { id: 'org-team', type: 'container', label: 'Department Group', section: 'Structure', category: 'container', defaultWidth: 440, defaultHeight: 240, fill: '#F8FAFC', stroke: '#94A3B8', textColor: '#334155', dashed: true, isContainer: true, subtitle: 'Product & Engineering' },
  { id: 'org-squad', type: 'org-squad', label: 'Cross-Functional Squad', section: 'Structure', category: 'container', defaultWidth: 380, defaultHeight: 220, fill: '#F0FDFA', stroke: '#0D9488', textColor: '#134E4A', dashed: true, isContainer: true, subtitle: 'Pod / Mission Team' },
  { id: 'org-note', type: 'note', label: 'Org Note', section: 'Structure', category: 'annotation', defaultWidth: 180, defaultHeight: 74, fill: '#FEF9C3', stroke: '#CA8A04', textColor: '#713F12' },
];

export const JOURNEY_LIBRARY: LibraryItem[] = [
  // Stages & Personas
  { id: 'j-persona', type: 'journey-persona', label: 'User Persona', section: 'Stages & Personas', category: 'shape', defaultWidth: 196, defaultHeight: 78, fill: '#F0FDFA', stroke: '#0F766E', textColor: '#134E4A', subtitle: 'Target Customer' },
  { id: 'j-stage', type: 'journey-stage', label: 'Journey Stage', section: 'Stages & Personas', category: 'shape', defaultWidth: 190, defaultHeight: 62, fill: '#1E293B', stroke: '#0F172A', textColor: '#FFFFFF', subtitle: 'Phase' },
  { id: 'j-action', type: 'journey-action', label: 'User Action', section: 'Stages & Personas', category: 'shape', defaultWidth: 190, defaultHeight: 82, fill: '#FFFFFF', stroke: '#2563EB', textColor: '#0F172A', subtitle: 'Customer Step' },
  // Channels & Touchpoints
  { id: 'j-touchpoint', type: 'journey-touchpoint', label: 'Touchpoint', section: 'Channels', category: 'shape', defaultWidth: 190, defaultHeight: 72, fill: '#F0F9FF', stroke: '#0284C7', textColor: '#0C4A6E', subtitle: 'Interaction' },
  { id: 'j-channel-web', type: 'journey-channel-web', label: 'Web / Mobile App', section: 'Channels', category: 'shape', defaultWidth: 190, defaultHeight: 72, fill: '#EFF6FF', stroke: '#2563EB', textColor: '#1E3A8A', subtitle: 'Digital Channel' },
  { id: 'j-channel-support', type: 'journey-channel-support', label: 'Support / Sales', section: 'Channels', category: 'shape', defaultWidth: 190, defaultHeight: 72, fill: '#F5F3FF', stroke: '#7C3AED', textColor: '#4C1D95', subtitle: 'Human Touchpoint' },
  // Insights & Metrics
  { id: 'j-delight', type: 'journey-emotion-high', label: 'Peak / Delight', section: 'Insights & Metrics', category: 'shape', defaultWidth: 190, defaultHeight: 78, fill: '#ECFDF5', stroke: '#16A34A', textColor: '#14532D', subtitle: 'Positive Emotion' },
  { id: 'j-pain', type: 'journey-pain', label: 'Pain Point', section: 'Insights & Metrics', category: 'shape', defaultWidth: 190, defaultHeight: 82, fill: '#FEF2F2', stroke: '#DC2626', textColor: '#7F1D1D', subtitle: 'Friction' },
  { id: 'j-dropoff', type: 'journey-emotion-low', label: 'Drop-off Risk', section: 'Insights & Metrics', category: 'shape', defaultWidth: 190, defaultHeight: 78, fill: '#FFF7ED', stroke: '#EA580C', textColor: '#7C2D12', subtitle: 'Churn Signal' },
  { id: 'j-opp', type: 'journey-opportunity', label: 'Opportunity', section: 'Insights & Metrics', category: 'shape', defaultWidth: 190, defaultHeight: 82, fill: '#F0FDFA', stroke: '#0D9488', textColor: '#134E4A', subtitle: 'Improvement Idea' },
  { id: 'j-metric', type: 'journey-metric', label: 'KPI / Metric', section: 'Insights & Metrics', category: 'shape', defaultWidth: 184, defaultHeight: 72, fill: '#FFFBEB', stroke: '#D97706', textColor: '#78350F', subtitle: 'Conversion / NPS' },
  // Structure
  { id: 'j-lane', type: 'swimlane', label: 'Journey Lane', section: 'Structure', category: 'container', defaultWidth: 680, defaultHeight: 180, fill: '#F8FAFC', stroke: '#94A3B8', textColor: '#334155', isContainer: true, subtitle: 'Frontstage / Backstage' },
];

export const WHITEBOARD_LIBRARY: LibraryItem[] = [
  // Ideation Stickies
  { id: 'wb-sticky-yellow', type: 'sticky', label: 'Amber Sticky', section: 'Ideation', category: 'annotation', defaultWidth: 180, defaultHeight: 132, fill: '#FEF9C3', stroke: '#EAB308', textColor: '#713F12', borderRadius: 4 },
  { id: 'wb-sticky-blue', type: 'sticky', label: 'Sky Sticky', section: 'Ideation', category: 'annotation', defaultWidth: 180, defaultHeight: 132, fill: '#E0F2FE', stroke: '#0284C7', textColor: '#0C4A6E', borderRadius: 4 },
  { id: 'wb-sticky-green', type: 'sticky', label: 'Mint Sticky', section: 'Ideation', category: 'annotation', defaultWidth: 180, defaultHeight: 132, fill: '#DCFCE7', stroke: '#16A34A', textColor: '#14532D', borderRadius: 4 },
  { id: 'wb-sticky-rose', type: 'sticky', label: 'Rose Sticky', section: 'Ideation', category: 'annotation', defaultWidth: 180, defaultHeight: 132, fill: '#FFE4E6', stroke: '#E11D48', textColor: '#881337', borderRadius: 4 },
  { id: 'wb-sticky-purple', type: 'sticky', label: 'Violet Sticky', section: 'Ideation', category: 'annotation', defaultWidth: 180, defaultHeight: 132, fill: '#F3E8FF', stroke: '#9333EA', textColor: '#581C87', borderRadius: 4 },
  { id: 'wb-vote', type: 'wb-dot-vote', label: 'Priority Dot', section: 'Ideation', category: 'annotation', defaultWidth: 68, defaultHeight: 68, fill: '#0F766E', stroke: '#115E59', textColor: '#FFFFFF', borderRadius: 34 },
  // Cards & Shapes
  { id: 'wb-card', type: 'process', label: 'Concept Card', section: 'Shapes & Cards', category: 'shape', defaultWidth: 180, defaultHeight: 80, fill: '#FFFFFF', stroke: '#334155', textColor: '#0F172A', borderRadius: 10 },
  { id: 'wb-pill', type: 'start', label: 'Topic Oval', section: 'Shapes & Cards', category: 'shape', defaultWidth: 164, defaultHeight: 58, fill: '#F0FDFA', stroke: '#0F766E', textColor: '#134E4A', borderRadius: 29 },
  { id: 'wb-diamond', type: 'decision', label: 'Decision Diamond', section: 'Shapes & Cards', category: 'shape', defaultWidth: 144, defaultHeight: 92, fill: '#FFFBEB', stroke: '#D97706', textColor: '#78350F', borderRadius: 4 },
  { id: 'wb-callout', type: 'wb-callout', label: 'Speech Callout', section: 'Shapes & Cards', category: 'annotation', defaultWidth: 196, defaultHeight: 84, fill: '#FFFFFF', stroke: '#0F766E', textColor: '#0F172A', borderRadius: 12, subtitle: 'Feedback' },
  { id: 'wb-checklist', type: 'wb-checklist', label: 'Action Checklist', section: 'Shapes & Cards', category: 'shape', defaultWidth: 204, defaultHeight: 112, fill: '#FFFFFF', stroke: '#475569', textColor: '#0F172A', borderRadius: 10, subtitle: 'Next Steps' },
  { id: 'wb-text', type: 'text', label: 'Text Heading', section: 'Shapes & Cards', category: 'text', defaultWidth: 200, defaultHeight: 46, fill: 'transparent', stroke: 'transparent', textColor: '#0F172A' },
  // Boards & Frames
  { id: 'wb-frame', type: 'container', label: 'Board Frame', section: 'Boards & Frames', category: 'container', defaultWidth: 520, defaultHeight: 340, fill: '#FFFFFF', stroke: '#94A3B8', textColor: '#334155', isContainer: true, subtitle: 'Section Frame' },
  { id: 'wb-kanban', type: 'wb-kanban-col', label: 'Kanban Column', section: 'Boards & Frames', category: 'container', defaultWidth: 240, defaultHeight: 420, fill: '#F8FAFC', stroke: '#94A3B8', textColor: '#0F172A', isContainer: true, subtitle: 'To Do / In Progress' },
  { id: 'wb-quadrant', type: 'wb-quadrant', label: '2×2 Matrix Frame', section: 'Boards & Frames', category: 'container', defaultWidth: 460, defaultHeight: 360, fill: '#F8FAFC', stroke: '#64748B', textColor: '#334155', dashed: true, isContainer: true, subtitle: 'Impact vs Effort' },
];

// ============================================================================
// SPACE MODULE LIBRARY (FLOOR PLANS — HOMES, BUSINESSES, GARAGES, EXTERIORS)
// ============================================================================

export const FLOORPLAN_LIBRARY: LibraryItem[] = [
  // 1. Structure & Architecture
  { id: 'fp-wall', type: 'fp-wall', label: 'Draw Wall Tool', section: 'Structure', category: 'furniture', defaultWidth: 120, defaultHeight: 40, fill: '#1E293B', stroke: '#0F172A', textColor: '#0F172A', floorItemKind: 'wall' },
  { id: 'fp-room', type: 'fp-room', label: 'Room Box (4×3.5m)', section: 'Structure', category: 'furniture', defaultWidth: 120, defaultHeight: 80, fill: '#F8FAFC', stroke: '#334155', textColor: '#0F172A', floorItemKind: 'room-rect', realWidthM: 4, realDepthM: 3.5 },
  { id: 'fp-room-large', type: 'fp-room-large', label: 'Large Space (6×4.5m)', section: 'Structure', category: 'furniture', defaultWidth: 140, defaultHeight: 90, fill: '#F8FAFC', stroke: '#0F766E', textColor: '#0F172A', floorItemKind: 'room-rect', realWidthM: 6, realDepthM: 4.5 },
  { id: 'fp-stairs', type: 'stairs', label: 'Straight Stairs', section: 'Structure', category: 'furniture', defaultWidth: 100, defaultHeight: 160, fill: '#F1F5F9', stroke: '#334155', textColor: '#0F172A', floorItemKind: 'furniture', realWidthM: 1.1, realDepthM: 2.8 },
  { id: 'fp-spiral-stairs', type: 'spiral-stairs', label: 'Spiral Staircase', section: 'Structure', category: 'furniture', defaultWidth: 96, defaultHeight: 96, fill: '#F1F5F9', stroke: '#334155', textColor: '#0F172A', floorItemKind: 'furniture', realWidthM: 1.6, realDepthM: 1.6 },
  { id: 'fp-elevator', type: 'elevator', label: 'Elevator / Lift', section: 'Structure', category: 'furniture', defaultWidth: 100, defaultHeight: 100, fill: '#E2E8F0', stroke: '#334155', textColor: '#0F172A', floorItemKind: 'furniture', realWidthM: 1.8, realDepthM: 1.8 },
  { id: 'fp-column', type: 'column', label: 'Structural Column', section: 'Structure', category: 'furniture', defaultWidth: 36, defaultHeight: 36, fill: '#334155', stroke: '#0F172A', textColor: '#FFFFFF', floorItemKind: 'furniture', realWidthM: 0.45, realDepthM: 0.45 },
  { id: 'fp-fireplace', type: 'fireplace', label: 'Fireplace & Hearth', section: 'Structure', category: 'furniture', defaultWidth: 120, defaultHeight: 50, fill: '#FFEDD5', stroke: '#C2410C', textColor: '#7C2D12', floorItemKind: 'furniture', realWidthM: 1.6, realDepthM: 0.65 },

  // 2. Doors & Windows
  { id: 'fp-door', type: 'fp-door', label: 'Single Door', section: 'Doors & Windows', category: 'furniture', defaultWidth: 90, defaultHeight: 40, fill: '#FFFFFF', stroke: '#0F766E', textColor: '#0F172A', floorItemKind: 'door', realWidthM: 0.9, realDepthM: 0.2 },
  { id: 'fp-double-door', type: 'fp-double-door', label: 'Double Entry Door', section: 'Doors & Windows', category: 'furniture', defaultWidth: 110, defaultHeight: 40, fill: '#FFFFFF', stroke: '#0F766E', textColor: '#0F172A', floorItemKind: 'double-door', realWidthM: 1.6, realDepthM: 0.2 },
  { id: 'fp-sliding-door', type: 'fp-sliding-door', label: 'Sliding Glass Door', section: 'Doors & Windows', category: 'furniture', defaultWidth: 130, defaultHeight: 34, fill: '#E0F2FE', stroke: '#0284C7', textColor: '#0C4A6E', floorItemKind: 'sliding-door', realWidthM: 2.2, realDepthM: 0.2 },
  { id: 'fp-garage-door', type: 'fp-garage-door', label: 'Garage Overhead Door', section: 'Doors & Windows', category: 'furniture', defaultWidth: 160, defaultHeight: 34, fill: '#E2E8F0', stroke: '#475569', textColor: '#0F172A', floorItemKind: 'sliding-door', realWidthM: 4.8, realDepthM: 0.25 },
  { id: 'fp-window', type: 'fp-window', label: 'Standard Window', section: 'Doors & Windows', category: 'furniture', defaultWidth: 100, defaultHeight: 30, fill: '#E0F2FE', stroke: '#0284C7', textColor: '#0F172A', floorItemKind: 'window', realWidthM: 1.4, realDepthM: 0.2 },
  { id: 'fp-wide-window', type: 'fp-wide-window', label: 'Picture / Bay Window', section: 'Doors & Windows', category: 'furniture', defaultWidth: 140, defaultHeight: 30, fill: '#E0F2FE', stroke: '#0284C7', textColor: '#0F172A', floorItemKind: 'window', realWidthM: 2.6, realDepthM: 0.2 },

  // 3. Home Interiors — Living & Bedroom
  { id: 'fp-sofa', type: 'sofa', label: '3-Seat Sofa', section: 'Home Living & Bed', category: 'furniture', defaultWidth: 140, defaultHeight: 60, fill: '#DBEAFE', stroke: '#2563EB', textColor: '#1E3A8A', floorItemKind: 'furniture', realWidthM: 2.2, realDepthM: 0.95 },
  { id: 'fp-sectional', type: 'sectional-sofa', label: 'L-Sectional Sofa', section: 'Home Living & Bed', category: 'furniture', defaultWidth: 160, defaultHeight: 120, fill: '#DBEAFE', stroke: '#2563EB', textColor: '#1E3A8A', floorItemKind: 'furniture', realWidthM: 2.8, realDepthM: 2.1 },
  { id: 'fp-armchair', type: 'armchair', label: 'Lounge Armchair', section: 'Home Living & Bed', category: 'furniture', defaultWidth: 64, defaultHeight: 64, fill: '#E0E7FF', stroke: '#4F46E5', textColor: '#312E81', floorItemKind: 'furniture', realWidthM: 0.9, realDepthM: 0.9 },
  { id: 'fp-coffee-table', type: 'coffee-table', label: 'Coffee Table', section: 'Home Living & Bed', category: 'furniture', defaultWidth: 100, defaultHeight: 54, fill: '#FEF3C7', stroke: '#B45309', textColor: '#78350F', floorItemKind: 'furniture', realWidthM: 1.2, realDepthM: 0.65 },
  { id: 'fp-tv-console', type: 'tv-console', label: 'TV / Media Console', section: 'Home Living & Bed', category: 'furniture', defaultWidth: 130, defaultHeight: 40, fill: '#E2E8F0', stroke: '#334155', textColor: '#0F172A', floorItemKind: 'furniture', realWidthM: 1.8, realDepthM: 0.45 },
  { id: 'fp-rug', type: 'rug', label: 'Area Rug', section: 'Home Living & Bed', category: 'furniture', defaultWidth: 160, defaultHeight: 110, fill: '#F5F5F4', stroke: '#A8A29E', textColor: '#57534E', floorItemKind: 'furniture', realWidthM: 2.8, realDepthM: 2.0 },
  { id: 'fp-king-bed', type: 'king-bed', label: 'King Bed', section: 'Home Living & Bed', category: 'furniture', defaultWidth: 140, defaultHeight: 145, fill: '#F1F5F9', stroke: '#475569', textColor: '#0F172A', floorItemKind: 'furniture', realWidthM: 1.95, realDepthM: 2.05 },
  { id: 'fp-bed', type: 'bed', label: 'Queen Bed', section: 'Home Living & Bed', category: 'furniture', defaultWidth: 120, defaultHeight: 140, fill: '#F1F5F9', stroke: '#475569', textColor: '#0F172A', floorItemKind: 'furniture', realWidthM: 1.6, realDepthM: 2.0 },
  { id: 'fp-twin-bed', type: 'twin-bed', label: 'Single / Twin Bed', section: 'Home Living & Bed', category: 'furniture', defaultWidth: 85, defaultHeight: 135, fill: '#F1F5F9', stroke: '#475569', textColor: '#0F172A', floorItemKind: 'furniture', realWidthM: 1.0, realDepthM: 1.95 },
  { id: 'fp-nightstand', type: 'nightstand', label: 'Nightstand', section: 'Home Living & Bed', category: 'furniture', defaultWidth: 44, defaultHeight: 44, fill: '#FEF3C7', stroke: '#92400E', textColor: '#78350F', floorItemKind: 'furniture', realWidthM: 0.55, realDepthM: 0.5 },
  { id: 'fp-wardrobe', type: 'wardrobe', label: 'Wardrobe / Closet', section: 'Home Living & Bed', category: 'furniture', defaultWidth: 120, defaultHeight: 48, fill: '#E2E8F0', stroke: '#475569', textColor: '#0F172A', floorItemKind: 'furniture', realWidthM: 1.8, realDepthM: 0.6 },
  { id: 'fp-bookshelf', type: 'bookshelf', label: 'Bookshelf', section: 'Home Living & Bed', category: 'furniture', defaultWidth: 100, defaultHeight: 34, fill: '#FEF3C7', stroke: '#B45309', textColor: '#78350F', floorItemKind: 'furniture', realWidthM: 1.4, realDepthM: 0.35 },
  { id: 'fp-plant', type: 'plant', label: 'Indoor Plant', section: 'Home Living & Bed', category: 'furniture', defaultWidth: 48, defaultHeight: 48, fill: '#DCFCE7', stroke: '#16A34A', textColor: '#14532D', floorItemKind: 'furniture', realWidthM: 0.6, realDepthM: 0.6 },

  // 4. Home Interiors — Kitchen, Dining & Bath
  { id: 'fp-kitchen', type: 'kitchen-counter', label: 'Kitchen Counter & Sink', section: 'Kitchen & Bath', category: 'furniture', defaultWidth: 140, defaultHeight: 50, fill: '#E2E8F0', stroke: '#475569', textColor: '#0F172A', floorItemKind: 'furniture', realWidthM: 2.4, realDepthM: 0.65 },
  { id: 'fp-island', type: 'kitchen-island', label: 'Kitchen Island', section: 'Kitchen & Bath', category: 'furniture', defaultWidth: 140, defaultHeight: 72, fill: '#F1F5F9', stroke: '#475569', textColor: '#0F172A', floorItemKind: 'furniture', realWidthM: 2.2, realDepthM: 1.0 },
  { id: 'fp-stove', type: 'stove', label: 'Range / Cooktop', section: 'Kitchen & Bath', category: 'furniture', defaultWidth: 64, defaultHeight: 58, fill: '#E2E8F0', stroke: '#334155', textColor: '#0F172A', floorItemKind: 'furniture', realWidthM: 0.8, realDepthM: 0.65 },
  { id: 'fp-fridge', type: 'fridge', label: 'Refrigerator', section: 'Kitchen & Bath', category: 'furniture', defaultWidth: 68, defaultHeight: 62, fill: '#F8FAFC', stroke: '#475569', textColor: '#0F172A', floorItemKind: 'furniture', realWidthM: 0.9, realDepthM: 0.8 },
  { id: 'fp-dining', type: 'dining-table', label: 'Dining Table (6-Seat)', section: 'Kitchen & Bath', category: 'furniture', defaultWidth: 120, defaultHeight: 75, fill: '#FEF3C7', stroke: '#B45309', textColor: '#78350F', floorItemKind: 'furniture', realWidthM: 1.9, realDepthM: 1.0 },
  { id: 'fp-round-table', type: 'round-table', label: 'Round Dining Table', section: 'Kitchen & Bath', category: 'furniture', defaultWidth: 92, defaultHeight: 92, fill: '#FEF3C7', stroke: '#B45309', textColor: '#78350F', floorItemKind: 'furniture', realWidthM: 1.3, realDepthM: 1.3 },
  { id: 'fp-bathtub', type: 'bathtub', label: 'Bathtub', section: 'Kitchen & Bath', category: 'furniture', defaultWidth: 120, defaultHeight: 60, fill: '#F0F9FF', stroke: '#0284C7', textColor: '#0C4A6E', floorItemKind: 'furniture', realWidthM: 1.7, realDepthM: 0.8 },
  { id: 'fp-shower', type: 'shower', label: 'Walk-in Shower', section: 'Kitchen & Bath', category: 'furniture', defaultWidth: 76, defaultHeight: 76, fill: '#F0F9FF', stroke: '#0284C7', textColor: '#0C4A6E', floorItemKind: 'furniture', realWidthM: 1.0, realDepthM: 1.0 },
  { id: 'fp-toilet', type: 'toilet', label: 'Toilet', section: 'Kitchen & Bath', category: 'furniture', defaultWidth: 44, defaultHeight: 58, fill: '#FFFFFF', stroke: '#475569', textColor: '#0F172A', floorItemKind: 'furniture', realWidthM: 0.45, realDepthM: 0.7 },
  { id: 'fp-vanity', type: 'vanity', label: 'Bath Vanity / Sink', section: 'Kitchen & Bath', category: 'furniture', defaultWidth: 90, defaultHeight: 46, fill: '#F0F9FF', stroke: '#0284C7', textColor: '#0C4A6E', floorItemKind: 'furniture', realWidthM: 1.2, realDepthM: 0.55 },
  { id: 'fp-washer', type: 'washer-dryer', label: 'Washer & Dryer', section: 'Kitchen & Bath', category: 'furniture', defaultWidth: 100, defaultHeight: 56, fill: '#F1F5F9', stroke: '#475569', textColor: '#0F172A', floorItemKind: 'furniture', realWidthM: 1.4, realDepthM: 0.75 },

  // 5. Business & Commercial
  { id: 'fp-desk', type: 'desk', label: 'Work Desk', section: 'Business & Office', category: 'furniture', defaultWidth: 120, defaultHeight: 60, fill: '#E2E8F0', stroke: '#475569', textColor: '#0F172A', floorItemKind: 'furniture', realWidthM: 1.6, realDepthM: 0.8 },
  { id: 'fp-exec-desk', type: 'exec-desk', label: 'Executive L-Desk', section: 'Business & Office', category: 'furniture', defaultWidth: 145, defaultHeight: 110, fill: '#E2E8F0', stroke: '#334155', textColor: '#0F172A', floorItemKind: 'furniture', realWidthM: 2.0, realDepthM: 1.6 },
  { id: 'fp-cubicle', type: 'cubicle', label: 'Cubicle Pod', section: 'Business & Office', category: 'furniture', defaultWidth: 130, defaultHeight: 110, fill: '#F1F5F9', stroke: '#64748B', textColor: '#0F172A', floorItemKind: 'furniture', realWidthM: 1.8, realDepthM: 1.6 },
  { id: 'fp-chair', type: 'chair', label: 'Office Chair', section: 'Business & Office', category: 'furniture', defaultWidth: 50, defaultHeight: 50, fill: '#CBD5E1', stroke: '#475569', textColor: '#0F172A', floorItemKind: 'furniture', realWidthM: 0.65, realDepthM: 0.65 },
  { id: 'fp-conf-table', type: 'conference-table', label: 'Conference Table', section: 'Business & Office', category: 'furniture', defaultWidth: 160, defaultHeight: 80, fill: '#F1F5F9', stroke: '#475569', textColor: '#0F172A', floorItemKind: 'furniture', realWidthM: 3.2, realDepthM: 1.3 },
  { id: 'fp-reception', type: 'reception-desk', label: 'Reception Desk', section: 'Business & Office', category: 'furniture', defaultWidth: 160, defaultHeight: 68, fill: '#CCFBF1', stroke: '#0F766E', textColor: '#134E4A', floorItemKind: 'furniture', realWidthM: 2.6, realDepthM: 0.9 },
  { id: 'fp-cabinet', type: 'cabinet', label: 'Filing Cabinet', section: 'Business & Office', category: 'furniture', defaultWidth: 90, defaultHeight: 40, fill: '#E2E8F0', stroke: '#64748B', textColor: '#0F172A', floorItemKind: 'furniture', realWidthM: 1.2, realDepthM: 0.5 },
  { id: 'fp-server-rack', type: 'server-rack', label: 'IT Server Rack', section: 'Business & Office', category: 'furniture', defaultWidth: 68, defaultHeight: 80, fill: '#E0F2FE', stroke: '#0369A1', textColor: '#0C4A6E', floorItemKind: 'furniture', realWidthM: 0.8, realDepthM: 1.0 },
  { id: 'fp-printer', type: 'printer-station', label: 'Print / Copy Station', section: 'Business & Office', category: 'furniture', defaultWidth: 92, defaultHeight: 52, fill: '#F1F5F9', stroke: '#475569', textColor: '#0F172A', floorItemKind: 'furniture', realWidthM: 1.2, realDepthM: 0.7 },
  { id: 'fp-retail-shelf', type: 'retail-shelf', label: 'Retail Display Gondola', section: 'Business & Office', category: 'furniture', defaultWidth: 150, defaultHeight: 54, fill: '#FEF9C3', stroke: '#CA8A04', textColor: '#713F12', floorItemKind: 'furniture', realWidthM: 2.4, realDepthM: 0.8 },
  { id: 'fp-pos', type: 'pos-counter', label: 'Checkout / POS Counter', section: 'Business & Office', category: 'furniture', defaultWidth: 140, defaultHeight: 56, fill: '#ECFDF5', stroke: '#059669', textColor: '#064E3B', floorItemKind: 'furniture', realWidthM: 2.0, realDepthM: 0.75 },
  { id: 'fp-cafe-table', type: 'cafe-table', label: 'Cafe / Bistro Table', section: 'Business & Office', category: 'furniture', defaultWidth: 64, defaultHeight: 64, fill: '#FEF3C7', stroke: '#D97706', textColor: '#78350F', floorItemKind: 'furniture', realWidthM: 0.85, realDepthM: 0.85 },
  { id: 'fp-restroom-stall', type: 'restroom-stall', label: 'Commercial Restroom Stall', section: 'Business & Office', category: 'furniture', defaultWidth: 80, defaultHeight: 110, fill: '#F8FAFC', stroke: '#475569', textColor: '#0F172A', floorItemKind: 'furniture', realWidthM: 1.0, realDepthM: 1.5 },

  // 6. Garage & Utility
  { id: 'fp-car-sedan', type: 'car-sedan', label: 'Sedan / Car', section: 'Garage & Utility', category: 'furniture', defaultWidth: 140, defaultHeight: 280, fill: '#E2E8F0', stroke: '#334155', textColor: '#0F172A', floorItemKind: 'furniture', realWidthM: 1.9, realDepthM: 4.6 },
  { id: 'fp-car-suv', type: 'car-suv', label: 'SUV / Pickup Truck', section: 'Garage & Utility', category: 'furniture', defaultWidth: 155, defaultHeight: 320, fill: '#CBD5E1', stroke: '#1E293B', textColor: '#0F172A', floorItemKind: 'furniture', realWidthM: 2.1, realDepthM: 5.3 },
  { id: 'fp-ev-charger', type: 'ev-charger', label: 'EV Wall Charger', section: 'Garage & Utility', category: 'furniture', defaultWidth: 44, defaultHeight: 36, fill: '#DCFCE7', stroke: '#16A34A', textColor: '#14532D', floorItemKind: 'furniture', realWidthM: 0.45, realDepthM: 0.35 },
  { id: 'fp-workbench', type: 'workbench', label: 'Garage Workbench', section: 'Garage & Utility', category: 'furniture', defaultWidth: 140, defaultHeight: 54, fill: '#FEF3C7', stroke: '#92400E', textColor: '#78350F', floorItemKind: 'furniture', realWidthM: 2.1, realDepthM: 0.7 },
  { id: 'fp-tool-chest', type: 'tool-chest', label: 'Rolling Tool Chest', section: 'Garage & Utility', category: 'furniture', defaultWidth: 80, defaultHeight: 46, fill: '#FEE2E2', stroke: '#DC2626', textColor: '#7F1D1D', floorItemKind: 'furniture', realWidthM: 1.1, realDepthM: 0.55 },
  { id: 'fp-garage-rack', type: 'garage-rack', label: 'Heavy Shelving Rack', section: 'Garage & Utility', category: 'furniture', defaultWidth: 120, defaultHeight: 42, fill: '#E2E8F0', stroke: '#475569', textColor: '#0F172A', floorItemKind: 'furniture', realWidthM: 1.8, realDepthM: 0.55 },
  { id: 'fp-hvac', type: 'hvac-unit', label: 'HVAC / Water Heater', section: 'Garage & Utility', category: 'furniture', defaultWidth: 60, defaultHeight: 60, fill: '#E0F2FE', stroke: '#0369A1', textColor: '#0C4A6E', floorItemKind: 'furniture', realWidthM: 0.8, realDepthM: 0.8 },
  { id: 'fp-elec-panel', type: 'elec-panel', label: 'Electrical Panel', section: 'Garage & Utility', category: 'furniture', defaultWidth: 48, defaultHeight: 24, fill: '#FEF9C3', stroke: '#CA8A04', textColor: '#713F12', floorItemKind: 'furniture', realWidthM: 0.6, realDepthM: 0.25 },
  { id: 'fp-bike-rack', type: 'bike-rack', label: 'Bicycle / Bike Rack', section: 'Garage & Utility', category: 'furniture', defaultWidth: 110, defaultHeight: 52, fill: '#F1F5F9', stroke: '#0F766E', textColor: '#134E4A', floorItemKind: 'furniture', realWidthM: 1.7, realDepthM: 0.7 },

  // 7. Exteriors & Landscaping
  { id: 'fp-patio', type: 'patio-deck', label: 'Patio / Wood Deck', section: 'Exteriors & Grounds', category: 'furniture', defaultWidth: 220, defaultHeight: 150, fill: '#FEF3C7', stroke: '#B45309', textColor: '#78350F', floorItemKind: 'furniture', realWidthM: 4.5, realDepthM: 3.0 },
  { id: 'fp-pool', type: 'swimming-pool', label: 'Swimming Pool', section: 'Exteriors & Grounds', category: 'furniture', defaultWidth: 260, defaultHeight: 150, fill: '#BAE6FD', stroke: '#0284C7', textColor: '#0C4A6E', floorItemKind: 'furniture', realWidthM: 6.5, realDepthM: 3.5 },
  { id: 'fp-hottub', type: 'hot-tub', label: 'Hot Tub / Spa', section: 'Exteriors & Grounds', category: 'furniture', defaultWidth: 110, defaultHeight: 110, fill: '#BAE6FD', stroke: '#0284C7', textColor: '#0C4A6E', floorItemKind: 'furniture', realWidthM: 2.1, realDepthM: 2.1 },
  { id: 'fp-bbq', type: 'bbq-grill', label: 'Outdoor Kitchen / BBQ', section: 'Exteriors & Grounds', category: 'furniture', defaultWidth: 120, defaultHeight: 54, fill: '#FFEDD5', stroke: '#EA580C', textColor: '#7C2D12', floorItemKind: 'furniture', realWidthM: 1.8, realDepthM: 0.75 },
  { id: 'fp-lounger', type: 'lounger', label: 'Patio Lounge Chair', section: 'Exteriors & Grounds', category: 'furniture', defaultWidth: 56, defaultHeight: 120, fill: '#DBEAFE', stroke: '#2563EB', textColor: '#1E3A8A', floorItemKind: 'furniture', realWidthM: 0.75, realDepthM: 1.9 },
  { id: 'fp-tree', type: 'tree', label: 'Shade Tree', section: 'Exteriors & Grounds', category: 'furniture', defaultWidth: 110, defaultHeight: 110, fill: '#BBF7D0', stroke: '#15803D', textColor: '#14532D', floorItemKind: 'furniture', realWidthM: 2.6, realDepthM: 2.6 },
  { id: 'fp-hedge', type: 'hedge', label: 'Hedge / Shrub Row', section: 'Exteriors & Grounds', category: 'furniture', defaultWidth: 150, defaultHeight: 46, fill: '#DCFCE7', stroke: '#16A34A', textColor: '#14532D', floorItemKind: 'furniture', realWidthM: 3.0, realDepthM: 0.7 },
  { id: 'fp-garden-bed', type: 'garden-bed', label: 'Raised Garden Bed', section: 'Exteriors & Grounds', category: 'furniture', defaultWidth: 140, defaultHeight: 70, fill: '#ECFCCB', stroke: '#65A30D', textColor: '#365314', floorItemKind: 'furniture', realWidthM: 2.4, realDepthM: 1.1 },
  { id: 'fp-walkway', type: 'walkway', label: 'Stone Walkway', section: 'Exteriors & Grounds', category: 'furniture', defaultWidth: 160, defaultHeight: 68, fill: '#E7E5E4', stroke: '#78716C', textColor: '#44403C', floorItemKind: 'furniture', realWidthM: 3.2, realDepthM: 1.1 },
  { id: 'fp-driveway', type: 'driveway', label: 'Driveway Pad', section: 'Exteriors & Grounds', category: 'furniture', defaultWidth: 220, defaultHeight: 240, fill: '#E2E8F0', stroke: '#64748B', textColor: '#334155', floorItemKind: 'furniture', realWidthM: 5.2, realDepthM: 6.0 },
  { id: 'fp-fence', type: 'fence', label: 'Perimeter Fence', section: 'Exteriors & Grounds', category: 'furniture', defaultWidth: 180, defaultHeight: 18, fill: '#D6D3D1', stroke: '#57534E', textColor: '#44403C', floorItemKind: 'furniture', realWidthM: 4.0, realDepthM: 0.2 },
  { id: 'fp-pergola', type: 'pergola', label: 'Gazebo / Pergola', section: 'Exteriors & Grounds', category: 'furniture', defaultWidth: 180, defaultHeight: 160, fill: '#FEF9C3', stroke: '#A16207', textColor: '#713F12', floorItemKind: 'furniture', realWidthM: 3.6, realDepthM: 3.2 },
];

// ============================================================================
// SEQUENCE MODULE LIBRARY
// ============================================================================

export const SEQUENCE_LIBRARY: LibraryItem[] = [
  // Actors & Clients
  { id: 'seq-actor', type: 'seq-participant', label: 'UML Actor', section: 'Actors & Clients', category: 'shape', defaultWidth: 140, defaultHeight: 54, fill: '#F8FAFC', stroke: '#334155', textColor: '#0F172A', participantRole: 'actor', subtitle: 'External Actor' },
  { id: 'seq-user', type: 'seq-participant', label: 'User Persona', section: 'Actors & Clients', category: 'shape', defaultWidth: 140, defaultHeight: 54, fill: '#F8FAFC', stroke: '#475569', textColor: '#0F172A', participantRole: 'user', subtitle: 'End User' },
  { id: 'seq-browser', type: 'seq-participant', label: 'Web Browser', section: 'Actors & Clients', category: 'shape', defaultWidth: 140, defaultHeight: 54, fill: '#EFF6FF', stroke: '#2563EB', textColor: '#1E3A8A', participantRole: 'browser', subtitle: 'Browser Client' },
  { id: 'seq-web-ui', type: 'seq-participant', label: 'Web Frontend', section: 'Actors & Clients', category: 'shape', defaultWidth: 140, defaultHeight: 54, fill: '#F0FDFA', stroke: '#0F766E', textColor: '#134E4A', participantRole: 'web-ui', subtitle: 'React / Next.js' },
  { id: 'seq-mobile', type: 'seq-participant', label: 'Mobile App', section: 'Actors & Clients', category: 'shape', defaultWidth: 140, defaultHeight: 54, fill: '#EFF6FF', stroke: '#2563EB', textColor: '#1E3A8A', participantRole: 'mobile', subtitle: 'iOS / Android' },
  // Services & Compute
  { id: 'seq-api', type: 'seq-participant', label: 'API Gateway', section: 'Services & Compute', category: 'shape', defaultWidth: 140, defaultHeight: 54, fill: '#F0F9FF', stroke: '#0284C7', textColor: '#0C4A6E', participantRole: 'api', subtitle: 'REST / GraphQL' },
  { id: 'seq-micro', type: 'seq-participant', label: 'Microservice', section: 'Services & Compute', category: 'shape', defaultWidth: 140, defaultHeight: 54, fill: '#FFFFFF', stroke: '#2563EB', textColor: '#0F172A', participantRole: 'microservice', subtitle: 'Domain Service' },
  { id: 'seq-auth', type: 'seq-participant', label: 'Identity Provider', section: 'Services & Compute', category: 'shape', defaultWidth: 140, defaultHeight: 54, fill: '#FEF2F2', stroke: '#DC2626', textColor: '#7F1D1D', participantRole: 'auth', subtitle: 'OAuth / OIDC' },
  { id: 'seq-cloud', type: 'seq-participant', label: 'Serverless / Cloud Fn', section: 'Services & Compute', category: 'shape', defaultWidth: 140, defaultHeight: 54, fill: '#F0F9FF', stroke: '#0284C7', textColor: '#0C4A6E', participantRole: 'cloud', subtitle: 'Cloud Function' },
  { id: 'seq-worker', type: 'seq-participant', label: 'Async Worker', section: 'Services & Compute', category: 'shape', defaultWidth: 140, defaultHeight: 54, fill: '#F5F3FF', stroke: '#7C3AED', textColor: '#4C1D95', participantRole: 'microservice', subtitle: 'Background Job' },
  // Data, Events & External
  { id: 'seq-queue', type: 'seq-participant', label: 'Message Queue', section: 'Data & Events', category: 'shape', defaultWidth: 140, defaultHeight: 54, fill: '#FFFBEB', stroke: '#D97706', textColor: '#78350F', participantRole: 'queue', subtitle: 'SQS / RabbitMQ' },
  { id: 'seq-event-bus', type: 'seq-participant', label: 'Event Stream / Bus', section: 'Data & Events', category: 'shape', defaultWidth: 140, defaultHeight: 54, fill: '#FFF7ED', stroke: '#EA580C', textColor: '#7C2D12', participantRole: 'event-bus', subtitle: 'Kafka / PubSub' },
  { id: 'seq-cache', type: 'seq-participant', label: 'Redis Cache', section: 'Data & Events', category: 'shape', defaultWidth: 140, defaultHeight: 54, fill: '#FEF2F2', stroke: '#DC2626', textColor: '#7F1D1D', participantRole: 'cache', subtitle: 'In-Memory KV' },
  { id: 'seq-db', type: 'seq-participant', label: 'Database', section: 'Data & Events', category: 'shape', defaultWidth: 140, defaultHeight: 54, fill: '#F0FDFA', stroke: '#0D9488', textColor: '#134E4A', participantRole: 'database', subtitle: 'PostgreSQL' },
  { id: 'seq-ext', type: 'seq-participant', label: 'External System', section: 'Data & Events', category: 'shape', defaultWidth: 140, defaultHeight: 54, fill: '#F8FAFC', stroke: '#64748B', textColor: '#334155', participantRole: 'external', subtitle: '3rd Party API' },
  { id: 'seq-payment', type: 'seq-participant', label: 'Payment / Webhook', section: 'Data & Events', category: 'shape', defaultWidth: 140, defaultHeight: 54, fill: '#ECFDF5', stroke: '#059669', textColor: '#064E3B', participantRole: 'external', subtitle: 'Stripe / Provider' },
];

// ============================================================================
// ARCHITECT MODULE LIBRARIES (ARCHITECTURE, NETWORK, ERD)
// ============================================================================

export const ARCHITECTURE_LIBRARY: LibraryItem[] = [
  // Client Layer
  { id: 'arch-user', type: 'arch-user', label: 'User / Actor', section: 'Client Layer', category: 'shape', defaultWidth: 136, defaultHeight: 96, fill: '#F8FAFC', stroke: '#475569', textColor: '#0F172A', subtitle: 'End User' },
  { id: 'arch-browser', type: 'arch-browser', label: 'Web Browser', section: 'Client Layer', category: 'shape', defaultWidth: 148, defaultHeight: 100, fill: '#EFF6FF', stroke: '#2563EB', textColor: '#1E3A8A', subtitle: 'React / SPA', technology: 'React 19' },
  { id: 'arch-mobile', type: 'arch-mobile', label: 'Mobile Client', section: 'Client Layer', category: 'shape', defaultWidth: 144, defaultHeight: 100, fill: '#EFF6FF', stroke: '#2563EB', textColor: '#1E3A8A', subtitle: 'iOS / Android', technology: 'Native' },
  // Edge & Security
  { id: 'arch-cdn', type: 'arch-cdn', label: 'Edge CDN', section: 'Edge & Security', category: 'shape', defaultWidth: 148, defaultHeight: 100, fill: '#F0F9FF', stroke: '#0284C7', textColor: '#0C4A6E', subtitle: 'Global Cache', technology: 'CloudFront' },
  { id: 'arch-waf', type: 'arch-waf', label: 'WAF / DDoS Shield', section: 'Edge & Security', category: 'shape', defaultWidth: 152, defaultHeight: 100, fill: '#FEF2F2', stroke: '#DC2626', textColor: '#7F1D1D', subtitle: 'Edge Protection', technology: 'Cloud Armor' },
  { id: 'arch-gateway', type: 'arch-gateway', label: 'API Gateway', section: 'Edge & Security', category: 'shape', defaultWidth: 152, defaultHeight: 100, fill: '#F0F9FF', stroke: '#0284C7', textColor: '#0C4A6E', subtitle: 'Routing & Rate Limit', technology: 'Kong / Envoy' },
  { id: 'arch-lb', type: 'arch-lb', label: 'Load Balancer', section: 'Edge & Security', category: 'shape', defaultWidth: 148, defaultHeight: 100, fill: '#F0F9FF', stroke: '#0284C7', textColor: '#0C4A6E', subtitle: 'L7 Ingress', technology: 'ALB' },
  { id: 'arch-auth', type: 'arch-auth', label: 'Identity Provider', section: 'Edge & Security', category: 'shape', defaultWidth: 152, defaultHeight: 100, fill: '#FEF2F2', stroke: '#DC2626', textColor: '#7F1D1D', subtitle: 'OAuth 2.0 / OIDC', technology: 'Auth0 / Entra' },
  { id: 'arch-secrets', type: 'arch-secrets', label: 'Secrets / KMS Vault', section: 'Edge & Security', category: 'shape', defaultWidth: 152, defaultHeight: 100, fill: '#FEF2F2', stroke: '#B91C1C', textColor: '#7F1D1D', subtitle: 'Key Management', technology: 'Vault / KMS' },
  // Application & AI Services
  { id: 'arch-api', type: 'arch-api', label: 'REST / GraphQL API', section: 'Application Layer', category: 'shape', defaultWidth: 156, defaultHeight: 102, fill: '#FFFFFF', stroke: '#2563EB', textColor: '#0F172A', subtitle: 'Core API', technology: 'Node.js / Go' },
  { id: 'arch-service', type: 'arch-service', label: 'Microservice', section: 'Application Layer', category: 'shape', defaultWidth: 152, defaultHeight: 102, fill: '#FFFFFF', stroke: '#2563EB', textColor: '#0F172A', subtitle: 'Domain Service', technology: 'Container' },
  { id: 'arch-function', type: 'arch-function', label: 'Serverless Fn', section: 'Application Layer', category: 'shape', defaultWidth: 148, defaultHeight: 100, fill: '#FFFBEB', stroke: '#D97706', textColor: '#78350F', subtitle: 'Event Triggered', technology: 'Cloud Run / Lambda' },
  { id: 'arch-worker', type: 'arch-worker', label: 'Async Worker / Cron', section: 'Application Layer', category: 'shape', defaultWidth: 152, defaultHeight: 100, fill: '#F5F3FF', stroke: '#7C3AED', textColor: '#4C1D95', subtitle: 'Job Processor', technology: 'Worker Pool' },
  { id: 'arch-ml', type: 'arch-ml', label: 'AI / ML Model Service', section: 'Application Layer', category: 'shape', defaultWidth: 156, defaultHeight: 102, fill: '#F0FDFA', stroke: '#0F766E', textColor: '#134E4A', subtitle: 'Inference & Embeddings', technology: 'LLM / GPU' },
  { id: 'arch-monitoring', type: 'arch-monitoring', label: 'Observability / Logs', section: 'Application Layer', category: 'shape', defaultWidth: 154, defaultHeight: 100, fill: '#FFF7ED', stroke: '#EA580C', textColor: '#7C2D12', subtitle: 'Metrics & Traces', technology: 'OpenTelemetry' },
  // Data & Messaging
  { id: 'arch-db', type: 'arch-db', label: 'Relational DB', section: 'Data & Events', category: 'shape', defaultWidth: 148, defaultHeight: 102, fill: '#F0FDFA', stroke: '#0D9488', textColor: '#134E4A', subtitle: 'Primary Store', technology: 'PostgreSQL' },
  { id: 'arch-nosql', type: 'arch-nosql', label: 'NoSQL / Document DB', section: 'Data & Events', category: 'shape', defaultWidth: 152, defaultHeight: 100, fill: '#ECFDF5', stroke: '#059669', textColor: '#064E3B', subtitle: 'Document Store', technology: 'Firestore / Mongo' },
  { id: 'arch-warehouse', type: 'arch-warehouse', label: 'Data Warehouse', section: 'Data & Events', category: 'shape', defaultWidth: 152, defaultHeight: 100, fill: '#EFF6FF', stroke: '#1D4ED8', textColor: '#1E3A8A', subtitle: 'Analytics OLAP', technology: 'BigQuery / Snowflake' },
  { id: 'arch-search', type: 'arch-search', label: 'Search / Vector Index', section: 'Data & Events', category: 'shape', defaultWidth: 154, defaultHeight: 100, fill: '#F5F3FF', stroke: '#7C3AED', textColor: '#4C1D95', subtitle: 'Full-Text & Vector', technology: 'Elasticsearch' },
  { id: 'arch-cache', type: 'arch-cache', label: 'In-Memory Cache', section: 'Data & Events', category: 'shape', defaultWidth: 148, defaultHeight: 100, fill: '#FEF2F2', stroke: '#DC2626', textColor: '#7F1D1D', subtitle: 'Sub-ms Cache', technology: 'Redis' },
  { id: 'arch-queue', type: 'arch-queue', label: 'Event Bus / Queue', section: 'Data & Events', category: 'shape', defaultWidth: 152, defaultHeight: 100, fill: '#FFFBEB', stroke: '#D97706', textColor: '#78350F', subtitle: 'Async Broker', technology: 'Kafka / PubSub' },
  { id: 'arch-storage', type: 'arch-storage', label: 'Object Storage', section: 'Data & Events', category: 'shape', defaultWidth: 148, defaultHeight: 100, fill: '#ECFDF5', stroke: '#16A34A', textColor: '#14532D', subtitle: 'Blob Assets', technology: 'GCS / S3' },
  { id: 'arch-external', type: 'arch-external', label: 'External System', section: 'Data & Events', category: 'shape', defaultWidth: 152, defaultHeight: 98, fill: '#F8FAFC', stroke: '#64748B', textColor: '#334155', dashed: true, subtitle: '3rd Party API' },
  // Cloud Boundaries / Containers
  { id: 'arch-cloud', type: 'arch-container', label: 'Cloud Environment', section: 'Boundaries', category: 'container', defaultWidth: 520, defaultHeight: 320, fill: '#F8FAFC', stroke: '#64748B', textColor: '#334155', dashed: true, isContainer: true, subtitle: 'GCP / AWS / Azure' },
  { id: 'arch-region', type: 'arch-region', label: 'Cloud Region / AZ', section: 'Boundaries', category: 'container', defaultWidth: 460, defaultHeight: 280, fill: '#F0FDFA', stroke: '#0F766E', textColor: '#134E4A', dashed: true, isContainer: true, subtitle: 'us-west1' },
  { id: 'arch-vpc', type: 'arch-vpc', label: 'Virtual Network (VPC)', section: 'Boundaries', category: 'container', defaultWidth: 420, defaultHeight: 260, fill: '#F0F9FF', stroke: '#0284C7', textColor: '#0C4A6E', dashed: true, isContainer: true, subtitle: '10.0.0.0/16' },
  { id: 'arch-subnet-pub', type: 'arch-subnet-pub', label: 'Public Subnet', section: 'Boundaries', category: 'container', defaultWidth: 340, defaultHeight: 210, fill: '#ECFDF5', stroke: '#16A34A', textColor: '#14532D', dashed: true, isContainer: true, subtitle: 'Internet Routable' },
  { id: 'arch-subnet-priv', type: 'arch-subnet-priv', label: 'Private Subnet', section: 'Boundaries', category: 'container', defaultWidth: 340, defaultHeight: 210, fill: '#FFFBEB', stroke: '#D97706', textColor: '#78350F', dashed: true, isContainer: true, subtitle: 'Internal Only' },
  { id: 'arch-k8s', type: 'arch-k8s', label: 'Kubernetes Cluster', section: 'Boundaries', category: 'container', defaultWidth: 380, defaultHeight: 240, fill: '#EFF6FF', stroke: '#2563EB', textColor: '#1E3A8A', dashed: true, isContainer: true, subtitle: 'Production Namespace' },
];

export const NETWORK_LIBRARY: LibraryItem[] = [
  // Perimeter & Security
  { id: 'net-internet', type: 'net-internet', label: 'Internet / WAN', section: 'Perimeter & Security', category: 'shape', defaultWidth: 144, defaultHeight: 96, fill: '#F0F9FF', stroke: '#0284C7', textColor: '#0C4A6E', subtitle: 'ISP Uplink' },
  { id: 'net-firewall', type: 'net-firewall', label: 'Firewall', section: 'Perimeter & Security', category: 'shape', defaultWidth: 144, defaultHeight: 96, fill: '#FEF2F2', stroke: '#DC2626', textColor: '#7F1D1D', subtitle: 'Next-Gen FW' },
  { id: 'net-vpn', type: 'net-vpn', label: 'VPN Gateway', section: 'Perimeter & Security', category: 'shape', defaultWidth: 148, defaultHeight: 96, fill: '#F0FDFA', stroke: '#0F766E', textColor: '#134E4A', subtitle: 'IPSec / WireGuard' },
  { id: 'net-ids', type: 'net-ids', label: 'IDS / IPS Sensor', section: 'Perimeter & Security', category: 'shape', defaultWidth: 148, defaultHeight: 96, fill: '#FFF7ED', stroke: '#EA580C', textColor: '#7C2D12', subtitle: 'Threat Detection' },
  // Switching & Routing
  { id: 'net-router', type: 'net-router', label: 'Core Router', section: 'Switching & Routing', category: 'shape', defaultWidth: 144, defaultHeight: 96, fill: '#EFF6FF', stroke: '#2563EB', textColor: '#1E3A8A', subtitle: 'BGP / OSPF' },
  { id: 'net-switch', type: 'net-switch', label: 'L3 Switch', section: 'Switching & Routing', category: 'shape', defaultWidth: 144, defaultHeight: 96, fill: '#F0FDFA', stroke: '#0D9488', textColor: '#134E4A', subtitle: '48-Port 10GbE' },
  { id: 'net-lb', type: 'net-lb', label: 'Load Balancer', section: 'Switching & Routing', category: 'shape', defaultWidth: 148, defaultHeight: 96, fill: '#F0F9FF', stroke: '#0284C7', textColor: '#0C4A6E', subtitle: 'HA VIP Cluster' },
  { id: 'net-ap', type: 'net-ap', label: 'Wireless AP', section: 'Switching & Routing', category: 'shape', defaultWidth: 140, defaultHeight: 94, fill: '#ECFDF5', stroke: '#16A34A', textColor: '#14532D', subtitle: 'Wi-Fi 7' },
  // Servers & Storage
  { id: 'net-server', type: 'net-server', label: 'Rack Server', section: 'Servers & Storage', category: 'shape', defaultWidth: 144, defaultHeight: 96, fill: '#FFFFFF', stroke: '#475569', textColor: '#0F172A', subtitle: '10.10.2.15' },
  { id: 'net-dns', type: 'net-dns', label: 'DNS / DHCP Server', section: 'Servers & Storage', category: 'shape', defaultWidth: 148, defaultHeight: 96, fill: '#EFF6FF', stroke: '#4338CA', textColor: '#1E1B4B', subtitle: 'Core Services' },
  { id: 'net-nas', type: 'net-nas', label: 'NAS / SAN Storage', section: 'Servers & Storage', category: 'shape', defaultWidth: 148, defaultHeight: 96, fill: '#F0FDFA', stroke: '#0D9488', textColor: '#134E4A', subtitle: 'RAID Array' },
  // Endpoints & IoT
  { id: 'net-workstation', type: 'net-workstation', label: 'Workstation', section: 'Endpoints & IoT', category: 'shape', defaultWidth: 140, defaultHeight: 94, fill: '#F8FAFC', stroke: '#64748B', textColor: '#0F172A', subtitle: 'VLAN 20' },
  { id: 'net-phone', type: 'net-phone', label: 'VoIP Phone', section: 'Endpoints & IoT', category: 'shape', defaultWidth: 136, defaultHeight: 92, fill: '#F5F3FF', stroke: '#7C3AED', textColor: '#4C1D95', subtitle: 'Voice VLAN' },
  { id: 'net-printer', type: 'net-printer', label: 'Network Printer', section: 'Endpoints & IoT', category: 'shape', defaultWidth: 140, defaultHeight: 92, fill: '#F8FAFC', stroke: '#475569', textColor: '#0F172A', subtitle: '10.10.20.50' },
  { id: 'net-camera', type: 'net-camera', label: 'IP Camera / IoT', section: 'Endpoints & IoT', category: 'shape', defaultWidth: 140, defaultHeight: 92, fill: '#FFFBEB', stroke: '#D97706', textColor: '#78350F', subtitle: 'PoE / IoT VLAN' },
  // Zones & Racks
  { id: 'net-subnet', type: 'net-subnet', label: 'VLAN / Subnet', section: 'Zones & Racks', category: 'container', defaultWidth: 400, defaultHeight: 240, fill: '#F8FAFC', stroke: '#64748B', textColor: '#334155', dashed: true, isContainer: true, subtitle: '10.10.0.0/24' },
  { id: 'net-dmz', type: 'net-dmz', label: 'DMZ Zone', section: 'Zones & Racks', category: 'container', defaultWidth: 380, defaultHeight: 220, fill: '#FEF2F2', stroke: '#DC2626', textColor: '#7F1D1D', dashed: true, isContainer: true, subtitle: 'Exposed Perimeter' },
  { id: 'net-datacenter', type: 'net-datacenter', label: 'Data Center Rack', section: 'Zones & Racks', category: 'container', defaultWidth: 320, defaultHeight: 360, fill: '#F1F5F9', stroke: '#334155', textColor: '#0F172A', isContainer: true, subtitle: '42U Cabinet' },
];

export const ERD_LIBRARY: LibraryItem[] = [
  // Tables & Models
  { id: 'erd-entity', type: 'erd-entity', label: 'Entity Table', section: 'Data Modeling', category: 'entity', defaultWidth: 224, defaultHeight: 156, fill: '#FFFFFF', stroke: '#0D9488', textColor: '#0F172A', subtitle: 'Table' },
  { id: 'erd-join', type: 'erd-entity', label: 'Join Table', section: 'Data Modeling', category: 'entity', defaultWidth: 216, defaultHeight: 132, fill: '#F0FDFA', stroke: '#0D9488', textColor: '#134E4A', subtitle: 'Many-to-Many' },
  { id: 'erd-weak', type: 'erd-entity', label: 'Weak Entity', section: 'Data Modeling', category: 'entity', defaultWidth: 216, defaultHeight: 138, fill: '#FFFBEB', stroke: '#D97706', textColor: '#78350F', dashed: true, subtitle: 'Dependent Entity' },
  { id: 'erd-audit', type: 'erd-entity', label: 'Audit / Event Log', section: 'Data Modeling', category: 'entity', defaultWidth: 220, defaultHeight: 144, fill: '#F8FAFC', stroke: '#475569', textColor: '#0F172A', subtitle: 'Append-Only' },
  // Views & Types
  { id: 'erd-view', type: 'erd-view', label: 'SQL View', section: 'Views & Types', category: 'entity', defaultWidth: 216, defaultHeight: 132, fill: '#F0F9FF', stroke: '#0284C7', textColor: '#0C4A6E', dashed: true, subtitle: 'Materialized / Virtual' },
  { id: 'erd-enum', type: 'erd-enum', label: 'Enum / Lookup', section: 'Views & Types', category: 'entity', defaultWidth: 196, defaultHeight: 124, fill: '#F5F3FF', stroke: '#7C3AED', textColor: '#4C1D95', subtitle: 'ENUM Type' },
  { id: 'erd-index', type: 'erd-index', label: 'Index / Partition', section: 'Views & Types', category: 'shape', defaultWidth: 192, defaultHeight: 74, fill: '#ECFDF5', stroke: '#059669', textColor: '#064E3B', subtitle: 'B-Tree / GIN' },
  // Organization
  { id: 'erd-group', type: 'container', label: 'Schema Domain', section: 'Organization', category: 'container', defaultWidth: 480, defaultHeight: 300, fill: '#F8FAFC', stroke: '#94A3B8', textColor: '#334155', dashed: true, isContainer: true, subtitle: 'public schema' },
  { id: 'erd-note', type: 'note', label: 'Schema Note', section: 'Organization', category: 'annotation', defaultWidth: 184, defaultHeight: 78, fill: '#FEF9C3', stroke: '#CA8A04', textColor: '#713F12' },
];

export function getLibraryForType(type: DiagramType): LibraryItem[] {
  switch (type) {
    case 'flowchart':
      return FLOWCHART_LIBRARY;
    case 'architecture':
      return ARCHITECTURE_LIBRARY;
    case 'sequence':
      return SEQUENCE_LIBRARY;
    case 'floorplan':
      return FLOORPLAN_LIBRARY;
    case 'network':
      return NETWORK_LIBRARY;
    case 'erd':
      return ERD_LIBRARY;
    case 'orgchart':
      return ORGCHART_LIBRARY;
    case 'journey':
      return JOURNEY_LIBRARY;
    case 'whiteboard':
      return WHITEBOARD_LIBRARY;
  }
}

export function createObjectFromLibraryItem(
  item: LibraryItem,
  x: number,
  y: number,
  zIndex: number,
  layerId = 'layer-main'
): DiagramObject {
  const id = `obj_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  const isErdEntity =
    item.type === 'erd-entity' || item.type === 'erd-view' || item.type === 'erd-enum';
  return {
    id,
    type: item.type,
    category: item.category,
    label: item.label,
    x: Math.round(x - item.defaultWidth / 2),
    y: Math.round(y - item.defaultHeight / 2),
    width: item.defaultWidth,
    height: item.defaultHeight,
    rotation: 0,
    layerId,
    zIndex,
    visible: true,
    locked: false,
    style: {
      fill: item.fill,
      stroke: item.stroke,
      strokeWidth: item.type === 'text' ? 0 : 1.5,
      textColor: item.textColor,
      fontSize: item.type === 'text' ? 18 : 13,
      borderRadius: item.borderRadius ?? 10,
      opacity: 1,
      dashed: item.dashed,
      shadow: item.category !== 'container' && item.type !== 'text',
    },
    metadata: {
      subtitle: item.subtitle,
      technology: item.technology,
      isContainer: item.isContainer,
      environment: 'production',
      fields:
        item.type === 'erd-enum'
          ? [
              { id: 'f1', name: 'ACTIVE', type: 'value', key: '' },
              { id: 'f2', name: 'PENDING', type: 'value', key: '' },
              { id: 'f3', name: 'ARCHIVED', type: 'value', key: '' },
            ]
          : item.id === 'erd-audit'
          ? [
              { id: 'f1', name: 'event_id', type: 'uuid', key: 'PK' },
              { id: 'f2', name: 'actor_id', type: 'uuid', key: 'FK' },
              { id: 'f3', name: 'action', type: 'varchar', key: '' },
              { id: 'f4', name: 'created_at', type: 'timestamptz', key: '' },
            ]
          : isErdEntity
          ? [
              { id: 'f1', name: 'id', type: 'uuid', key: 'PK' },
              { id: 'f2', name: 'name', type: 'varchar', key: '' },
              { id: 'f3', name: 'created_at', type: 'timestamp', key: '' },
            ]
          : undefined,
    },
  };
}

export function createFurnitureFromLibraryItem(
  item: LibraryItem,
  xMeters: number,
  yMeters: number
): FloorFurniture {
  return {
    id: `furn_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    type: item.type,
    label: item.label,
    x: Number(xMeters.toFixed(2)),
    y: Number(yMeters.toFixed(2)),
    width: item.realWidthM ?? 1.2,
    depth: item.realDepthM ?? 0.8,
    rotation: 0,
    color: item.fill,
    layerId: 'layer-furniture',
  };
}
