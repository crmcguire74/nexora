import {
  DiagramObject,
  DiagramType,
  FloorFurniture,
  SequenceParticipantRole,
} from '../types/diagram';

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
  name: string;
  shortName: string;
  description: string;
  accent: string;
}

export const DIAGRAM_TYPES: DiagramTypeMeta[] = [
  {
    type: 'flowchart',
    name: 'Flowchart',
    shortName: 'Flowchart',
    description: 'Workflows, decision trees, swimlanes, and rapid process mapping',
    accent: '#2563EB',
  },
  {
    type: 'architecture',
    name: 'System Architecture',
    shortName: 'Architecture',
    description: 'Layered cloud services, APIs, databases, and nested VPC boundaries',
    accent: '#0284C7',
  },
  {
    type: 'sequence',
    name: 'Sequence Diagram',
    shortName: 'Sequence',
    description: 'Interactive lifelines, drag-to-connect calls, activations, and fragments',
    accent: '#0D9488',
  },
  {
    type: 'floorplan',
    name: 'Floor Plan',
    shortName: 'Floor Plan',
    description: 'Measured walls, auto-detected rooms, doors, windows, and furniture',
    accent: '#D97706',
  },
  {
    type: 'network',
    name: 'Network Diagram',
    shortName: 'Network',
    description: 'Routers, firewalls, switches, subnets, and infrastructure topology',
    accent: '#4338CA',
  },
  {
    type: 'erd',
    name: 'Entity Relationship',
    shortName: 'ERD',
    description: 'Database tables, primary and foreign keys, and cardinality links',
    accent: '#059669',
  },
  {
    type: 'orgchart',
    name: 'Organization Chart',
    shortName: 'Org Chart',
    description: 'Reporting hierarchies, leadership teams, and department groups',
    accent: '#475569',
  },
  {
    type: 'journey',
    name: 'User Journey',
    shortName: 'Journey',
    description: 'Stages, user actions, touchpoints, pain points, and opportunities',
    accent: '#E11D48',
  },
  {
    type: 'whiteboard',
    name: 'Blank Canvas',
    shortName: 'Whiteboard',
    description: 'Freeform sticky notes, frames, sketches, and open concept mapping',
    accent: '#1E293B',
  },
];

export const DIAGRAM_TYPE_MAP: Record<DiagramType, DiagramTypeMeta> = DIAGRAM_TYPES.reduce(
  (acc, item) => {
    acc[item.type] = item;
    return acc;
  },
  {} as Record<DiagramType, DiagramTypeMeta>
);

export const FLOWCHART_LIBRARY: LibraryItem[] = [
  { id: 'fc-start', type: 'start', label: 'Start / End', section: 'Core Flow', category: 'shape', defaultWidth: 152, defaultHeight: 54, fill: '#ECFDF5', stroke: '#16A34A', textColor: '#14532D', borderRadius: 27 },
  { id: 'fc-process', type: 'process', label: 'Process', section: 'Core Flow', category: 'shape', defaultWidth: 168, defaultHeight: 68, fill: '#FFFFFF', stroke: '#2563EB', textColor: '#0F172A', borderRadius: 10 },
  { id: 'fc-decision', type: 'decision', label: 'Decision', section: 'Core Flow', category: 'shape', defaultWidth: 152, defaultHeight: 96, fill: '#FFFBEB', stroke: '#D97706', textColor: '#78350F', borderRadius: 4 },
  { id: 'fc-io', type: 'io', label: 'Input / Output', section: 'Core Flow', category: 'shape', defaultWidth: 168, defaultHeight: 64, fill: '#F0F9FF', stroke: '#0284C7', textColor: '#0C4A6E', borderRadius: 6 },
  { id: 'fc-subprocess', type: 'subprocess', label: 'Subprocess', section: 'Core Flow', category: 'shape', defaultWidth: 176, defaultHeight: 68, fill: '#F8FAFC', stroke: '#475569', textColor: '#0F172A', borderRadius: 8 },
  { id: 'fc-document', type: 'document', label: 'Document', section: 'Data & Artifacts', category: 'shape', defaultWidth: 160, defaultHeight: 74, fill: '#FFFFFF', stroke: '#64748B', textColor: '#0F172A', borderRadius: 6 },
  { id: 'fc-database', type: 'database', label: 'Database', section: 'Data & Artifacts', category: 'shape', defaultWidth: 144, defaultHeight: 82, fill: '#F0FDFA', stroke: '#0D9488', textColor: '#134E4A', borderRadius: 8 },
  { id: 'fc-delay', type: 'delay', label: 'Delay / Wait', section: 'Data & Artifacts', category: 'shape', defaultWidth: 156, defaultHeight: 64, fill: '#FEF2F2', stroke: '#DC2626', textColor: '#7F1D1D', borderRadius: 8 },
  { id: 'fc-swimlane', type: 'swimlane', label: 'Swimlane', section: 'Structure', category: 'container', defaultWidth: 640, defaultHeight: 200, fill: '#F8FAFC', stroke: '#94A3B8', textColor: '#334155', borderRadius: 10, isContainer: true },
  { id: 'fc-container', type: 'container', label: 'Phase Group', section: 'Structure', category: 'container', defaultWidth: 340, defaultHeight: 240, fill: '#F8FAFC', stroke: '#94A3B8', textColor: '#334155', borderRadius: 12, dashed: true, isContainer: true },
  { id: 'fc-note', type: 'note', label: 'Annotation', section: 'Structure', category: 'annotation', defaultWidth: 180, defaultHeight: 76, fill: '#FEF9C3', stroke: '#CA8A04', textColor: '#713F12', borderRadius: 6 },
];

export const ARCHITECTURE_LIBRARY: LibraryItem[] = [
  // Client Layer
  { id: 'arch-user', type: 'arch-user', label: 'User / Actor', section: 'Client Layer', category: 'shape', defaultWidth: 152, defaultHeight: 68, fill: '#F8FAFC', stroke: '#475569', textColor: '#0F172A', subtitle: 'End User' },
  { id: 'arch-browser', type: 'arch-browser', label: 'Web Browser', section: 'Client Layer', category: 'shape', defaultWidth: 168, defaultHeight: 72, fill: '#EFF6FF', stroke: '#2563EB', textColor: '#1E3A8A', subtitle: 'React / SPA', technology: 'React 19' },
  { id: 'arch-mobile', type: 'arch-mobile', label: 'Mobile Client', section: 'Client Layer', category: 'shape', defaultWidth: 164, defaultHeight: 72, fill: '#EFF6FF', stroke: '#2563EB', textColor: '#1E3A8A', subtitle: 'iOS / Android', technology: 'Native' },
  // Presentation & Edge
  { id: 'arch-cdn', type: 'arch-cdn', label: 'Edge CDN', section: 'Edge & API', category: 'shape', defaultWidth: 168, defaultHeight: 72, fill: '#F0F9FF', stroke: '#0284C7', textColor: '#0C4A6E', subtitle: 'Global Cache', technology: 'CloudFront' },
  { id: 'arch-gateway', type: 'arch-gateway', label: 'API Gateway', section: 'Edge & API', category: 'shape', defaultWidth: 176, defaultHeight: 74, fill: '#F0F9FF', stroke: '#0284C7', textColor: '#0C4A6E', subtitle: 'Routing & Rate Limit', technology: 'Kong / Envoy' },
  { id: 'arch-lb', type: 'arch-lb', label: 'Load Balancer', section: 'Edge & API', category: 'shape', defaultWidth: 168, defaultHeight: 72, fill: '#F0F9FF', stroke: '#0284C7', textColor: '#0C4A6E', subtitle: 'L7 Ingress', technology: 'ALB' },
  // Application Services
  { id: 'arch-api', type: 'arch-api', label: 'REST / GraphQL API', section: 'Application Layer', category: 'shape', defaultWidth: 180, defaultHeight: 76, fill: '#FFFFFF', stroke: '#2563EB', textColor: '#0F172A', subtitle: 'Core API', technology: 'Node.js / Go' },
  { id: 'arch-service', type: 'arch-service', label: 'Microservice', section: 'Application Layer', category: 'shape', defaultWidth: 176, defaultHeight: 76, fill: '#FFFFFF', stroke: '#2563EB', textColor: '#0F172A', subtitle: 'Domain Service', technology: 'Container' },
  { id: 'arch-function', type: 'arch-function', label: 'Serverless Fn', section: 'Application Layer', category: 'shape', defaultWidth: 172, defaultHeight: 74, fill: '#FFFBEB', stroke: '#D97706', textColor: '#78350F', subtitle: 'Event Triggered', technology: 'Lambda / Cloud Run' },
  { id: 'arch-auth', type: 'arch-auth', label: 'Identity Provider', section: 'Application Layer', category: 'shape', defaultWidth: 176, defaultHeight: 74, fill: '#FEF2F2', stroke: '#DC2626', textColor: '#7F1D1D', subtitle: 'OAuth 2.0 / OIDC', technology: 'Entra ID / Auth0' },
  // Data & Messaging
  { id: 'arch-db', type: 'arch-db', label: 'Relational DB', section: 'Data & Events', category: 'shape', defaultWidth: 164, defaultHeight: 80, fill: '#F0FDFA', stroke: '#0D9488', textColor: '#134E4A', subtitle: 'Primary Store', technology: 'PostgreSQL' },
  { id: 'arch-cache', type: 'arch-cache', label: 'In-Memory Cache', section: 'Data & Events', category: 'shape', defaultWidth: 164, defaultHeight: 74, fill: '#FEF2F2', stroke: '#DC2626', textColor: '#7F1D1D', subtitle: 'Sub-ms Cache', technology: 'Redis' },
  { id: 'arch-queue', type: 'arch-queue', label: 'Event Bus / Queue', section: 'Data & Events', category: 'shape', defaultWidth: 176, defaultHeight: 74, fill: '#FFFBEB', stroke: '#D97706', textColor: '#78350F', subtitle: 'Async Broker', technology: 'Kafka / SQS' },
  { id: 'arch-storage', type: 'arch-storage', label: 'Object Storage', section: 'Data & Events', category: 'shape', defaultWidth: 168, defaultHeight: 74, fill: '#ECFDF5', stroke: '#16A34A', textColor: '#14532D', subtitle: 'Blob Assets', technology: 'S3 / GCS' },
  { id: 'arch-external', type: 'arch-external', label: 'External System', section: 'Data & Events', category: 'shape', defaultWidth: 172, defaultHeight: 72, fill: '#F8FAFC', stroke: '#64748B', textColor: '#334155', dashed: true, subtitle: '3rd Party API' },
  // Cloud Boundaries / Containers
  { id: 'arch-cloud', type: 'arch-container', label: 'Cloud Environment', section: 'Boundaries', category: 'container', defaultWidth: 520, defaultHeight: 320, fill: '#F8FAFC', stroke: '#64748B', textColor: '#334155', dashed: true, isContainer: true, subtitle: 'AWS / Azure / GCP' },
  { id: 'arch-vpc', type: 'arch-vpc', label: 'Virtual Network (VPC)', section: 'Boundaries', category: 'container', defaultWidth: 420, defaultHeight: 260, fill: '#F0F9FF', stroke: '#0284C7', textColor: '#0C4A6E', dashed: true, isContainer: true, subtitle: '10.0.0.0/16' },
  { id: 'arch-k8s', type: 'arch-k8s', label: 'Kubernetes Cluster', section: 'Boundaries', category: 'container', defaultWidth: 380, defaultHeight: 240, fill: '#EFF6FF', stroke: '#2563EB', textColor: '#1E3A8A', dashed: true, isContainer: true, subtitle: 'Production Namespace' },
];

export const SEQUENCE_LIBRARY: LibraryItem[] = [
  { id: 'seq-user', type: 'seq-participant', label: 'User', section: 'Actors & Clients', category: 'shape', defaultWidth: 140, defaultHeight: 54, fill: '#F8FAFC', stroke: '#475569', textColor: '#0F172A', participantRole: 'user', subtitle: 'Actor' },
  { id: 'seq-browser', type: 'seq-participant', label: 'Web Browser', section: 'Actors & Clients', category: 'shape', defaultWidth: 140, defaultHeight: 54, fill: '#EFF6FF', stroke: '#2563EB', textColor: '#1E3A8A', participantRole: 'browser', subtitle: 'React SPA' },
  { id: 'seq-mobile', type: 'seq-participant', label: 'Mobile App', section: 'Actors & Clients', category: 'shape', defaultWidth: 140, defaultHeight: 54, fill: '#EFF6FF', stroke: '#2563EB', textColor: '#1E3A8A', participantRole: 'mobile', subtitle: 'iOS / Android' },
  { id: 'seq-api', type: 'seq-participant', label: 'API Gateway', section: 'Services', category: 'shape', defaultWidth: 140, defaultHeight: 54, fill: '#F0F9FF', stroke: '#0284C7', textColor: '#0C4A6E', participantRole: 'api', subtitle: 'REST / GraphQL' },
  { id: 'seq-micro', type: 'seq-participant', label: 'Microservice', section: 'Services', category: 'shape', defaultWidth: 140, defaultHeight: 54, fill: '#FFFFFF', stroke: '#2563EB', textColor: '#0F172A', participantRole: 'microservice', subtitle: 'Service' },
  { id: 'seq-auth', type: 'seq-participant', label: 'Identity Provider', section: 'Services', category: 'shape', defaultWidth: 140, defaultHeight: 54, fill: '#FEF2F2', stroke: '#DC2626', textColor: '#7F1D1D', participantRole: 'auth', subtitle: 'OAuth / OIDC' },
  { id: 'seq-queue', type: 'seq-participant', label: 'Event Bus / Queue', section: 'Data & Events', category: 'shape', defaultWidth: 140, defaultHeight: 54, fill: '#FFFBEB', stroke: '#D97706', textColor: '#78350F', participantRole: 'queue', subtitle: 'Async Broker' },
  { id: 'seq-cache', type: 'seq-participant', label: 'Redis Cache', section: 'Data & Events', category: 'shape', defaultWidth: 140, defaultHeight: 54, fill: '#FEF2F2', stroke: '#DC2626', textColor: '#7F1D1D', participantRole: 'cache', subtitle: 'Key-Value' },
  { id: 'seq-db', type: 'seq-participant', label: 'Database', section: 'Data & Events', category: 'shape', defaultWidth: 140, defaultHeight: 54, fill: '#F0FDFA', stroke: '#0D9488', textColor: '#134E4A', participantRole: 'database', subtitle: 'PostgreSQL' },
  { id: 'seq-ext', type: 'seq-participant', label: 'External System', section: 'Data & Events', category: 'shape', defaultWidth: 140, defaultHeight: 54, fill: '#F8FAFC', stroke: '#64748B', textColor: '#334155', participantRole: 'external', subtitle: '3rd Party' },
];

export const FLOORPLAN_LIBRARY: LibraryItem[] = [
  // Structural
  { id: 'fp-wall', type: 'fp-wall', label: 'Draw Wall Tool', section: 'Structure', category: 'furniture', defaultWidth: 120, defaultHeight: 40, fill: '#1E293B', stroke: '#0F172A', textColor: '#0F172A', floorItemKind: 'wall' },
  { id: 'fp-room', type: 'fp-room', label: 'Quick Room (4×3.5m)', section: 'Structure', category: 'furniture', defaultWidth: 120, defaultHeight: 80, fill: '#F8FAFC', stroke: '#334155', textColor: '#0F172A', floorItemKind: 'room-rect', realWidthM: 4, realDepthM: 3.5 },
  { id: 'fp-door', type: 'fp-door', label: 'Single Door', section: 'Openings', category: 'furniture', defaultWidth: 90, defaultHeight: 40, fill: '#FFFFFF', stroke: '#2563EB', textColor: '#0F172A', floorItemKind: 'door', realWidthM: 0.9, realDepthM: 0.2 },
  { id: 'fp-double-door', type: 'fp-double-door', label: 'Double Door', section: 'Openings', category: 'furniture', defaultWidth: 110, defaultHeight: 40, fill: '#FFFFFF', stroke: '#2563EB', textColor: '#0F172A', floorItemKind: 'double-door', realWidthM: 1.6, realDepthM: 0.2 },
  { id: 'fp-window', type: 'fp-window', label: 'Window', section: 'Openings', category: 'furniture', defaultWidth: 100, defaultHeight: 30, fill: '#E0F2FE', stroke: '#0284C7', textColor: '#0F172A', floorItemKind: 'window', realWidthM: 1.5, realDepthM: 0.2 },
  // Office Furniture
  { id: 'fp-desk', type: 'desk', label: 'Work Desk', section: 'Office Furniture', category: 'furniture', defaultWidth: 120, defaultHeight: 60, fill: '#E2E8F0', stroke: '#475569', textColor: '#0F172A', floorItemKind: 'furniture', realWidthM: 1.6, realDepthM: 0.8 },
  { id: 'fp-chair', type: 'chair', label: 'Office Chair', section: 'Office Furniture', category: 'furniture', defaultWidth: 50, defaultHeight: 50, fill: '#CBD5E1', stroke: '#475569', textColor: '#0F172A', floorItemKind: 'furniture', realWidthM: 0.65, realDepthM: 0.65 },
  { id: 'fp-conf-table', type: 'conference-table', label: 'Conference Table', section: 'Office Furniture', category: 'furniture', defaultWidth: 160, defaultHeight: 80, fill: '#F1F5F9', stroke: '#475569', textColor: '#0F172A', floorItemKind: 'furniture', realWidthM: 3.0, realDepthM: 1.2 },
  { id: 'fp-cabinet', type: 'cabinet', label: 'Storage Cabinet', section: 'Office Furniture', category: 'furniture', defaultWidth: 90, defaultHeight: 40, fill: '#E2E8F0', stroke: '#64748B', textColor: '#0F172A', floorItemKind: 'furniture', realWidthM: 1.2, realDepthM: 0.5 },
  // Residential Furniture
  { id: 'fp-sofa', type: 'sofa', label: '3-Seat Sofa', section: 'Living & Lounge', category: 'furniture', defaultWidth: 140, defaultHeight: 60, fill: '#DBEAFE', stroke: '#3B82F6', textColor: '#1E3A8A', floorItemKind: 'furniture', realWidthM: 2.2, realDepthM: 0.95 },
  { id: 'fp-bed', type: 'bed', label: 'Queen Bed', section: 'Living & Lounge', category: 'furniture', defaultWidth: 120, defaultHeight: 140, fill: '#F1F5F9', stroke: '#475569', textColor: '#0F172A', floorItemKind: 'furniture', realWidthM: 1.6, realDepthM: 2.0 },
  { id: 'fp-dining', type: 'dining-table', label: 'Dining Table', section: 'Living & Lounge', category: 'furniture', defaultWidth: 120, defaultHeight: 75, fill: '#FEF3C7', stroke: '#B45309', textColor: '#78350F', floorItemKind: 'furniture', realWidthM: 1.8, realDepthM: 1.0 },
  { id: 'fp-kitchen', type: 'kitchen-counter', label: 'Kitchen Counter', section: 'Living & Lounge', category: 'furniture', defaultWidth: 140, defaultHeight: 50, fill: '#E2E8F0', stroke: '#475569', textColor: '#0F172A', floorItemKind: 'furniture', realWidthM: 2.4, realDepthM: 0.65 },
  { id: 'fp-plant', type: 'plant', label: 'Indoor Plant', section: 'Living & Lounge', category: 'furniture', defaultWidth: 48, defaultHeight: 48, fill: '#DCFCE7', stroke: '#16A34A', textColor: '#14532D', floorItemKind: 'furniture', realWidthM: 0.6, realDepthM: 0.6 },
];

export const NETWORK_LIBRARY: LibraryItem[] = [
  { id: 'net-internet', type: 'net-internet', label: 'Internet / WAN', section: 'Perimeter', category: 'shape', defaultWidth: 164, defaultHeight: 72, fill: '#F0F9FF', stroke: '#0284C7', textColor: '#0C4A6E', subtitle: 'ISP Uplink' },
  { id: 'net-firewall', type: 'net-firewall', label: 'Firewall', section: 'Perimeter', category: 'shape', defaultWidth: 164, defaultHeight: 72, fill: '#FEF2F2', stroke: '#DC2626', textColor: '#7F1D1D', subtitle: 'Next-Gen FW' },
  { id: 'net-router', type: 'net-router', label: 'Core Router', section: 'Switching & Routing', category: 'shape', defaultWidth: 164, defaultHeight: 72, fill: '#EFF6FF', stroke: '#2563EB', textColor: '#1E3A8A', subtitle: 'BGP / OSPF' },
  { id: 'net-switch', type: 'net-switch', label: 'L3 Switch', section: 'Switching & Routing', category: 'shape', defaultWidth: 164, defaultHeight: 72, fill: '#F0FDFA', stroke: '#0D9488', textColor: '#134E4A', subtitle: '48-Port 10GbE' },
  { id: 'net-ap', type: 'net-ap', label: 'Wireless AP', section: 'Endpoints', category: 'shape', defaultWidth: 160, defaultHeight: 70, fill: '#ECFDF5', stroke: '#16A34A', textColor: '#14532D', subtitle: 'Wi-Fi 7' },
  { id: 'net-server', type: 'net-server', label: 'Rack Server', section: 'Endpoints', category: 'shape', defaultWidth: 164, defaultHeight: 72, fill: '#FFFFFF', stroke: '#475569', textColor: '#0F172A', subtitle: '10.10.2.15' },
  { id: 'net-workstation', type: 'net-workstation', label: 'Workstation', section: 'Endpoints', category: 'shape', defaultWidth: 160, defaultHeight: 70, fill: '#F8FAFC', stroke: '#64748B', textColor: '#0F172A', subtitle: 'VLAN 20' },
  { id: 'net-subnet', type: 'net-subnet', label: 'VLAN / Subnet', section: 'Zones', category: 'container', defaultWidth: 400, defaultHeight: 240, fill: '#F8FAFC', stroke: '#64748B', textColor: '#334155', dashed: true, isContainer: true, subtitle: '10.10.0.0/24' },
];

export const ERD_LIBRARY: LibraryItem[] = [
  { id: 'erd-entity', type: 'erd-entity', label: 'Entity Table', section: 'Data Modeling', category: 'entity', defaultWidth: 224, defaultHeight: 156, fill: '#FFFFFF', stroke: '#0D9488', textColor: '#0F172A', subtitle: 'Table' },
  { id: 'erd-join', type: 'erd-entity', label: 'Join Table', section: 'Data Modeling', category: 'entity', defaultWidth: 216, defaultHeight: 132, fill: '#F0FDFA', stroke: '#0D9488', textColor: '#134E4A', subtitle: 'Many-to-Many' },
  { id: 'erd-group', type: 'container', label: 'Schema Domain', section: 'Organization', category: 'container', defaultWidth: 480, defaultHeight: 300, fill: '#F8FAFC', stroke: '#94A3B8', textColor: '#334155', dashed: true, isContainer: true },
  { id: 'erd-note', type: 'note', label: 'Schema Note', section: 'Organization', category: 'annotation', defaultWidth: 184, defaultHeight: 78, fill: '#FEF9C3', stroke: '#CA8A04', textColor: '#713F12' },
];

export const ORGCHART_LIBRARY: LibraryItem[] = [
  { id: 'org-exec', type: 'org-exec', label: 'Executive', section: 'Roles', category: 'shape', defaultWidth: 196, defaultHeight: 78, fill: '#1E293B', stroke: '#0F172A', textColor: '#F8FAFC', subtitle: 'Chief Executive Officer' },
  { id: 'org-manager', type: 'org-manager', label: 'Director / Lead', section: 'Roles', category: 'shape', defaultWidth: 188, defaultHeight: 76, fill: '#EFF6FF', stroke: '#2563EB', textColor: '#1E3A8A', subtitle: 'Engineering Lead' },
  { id: 'org-member', type: 'org-member', label: 'Team Member', section: 'Roles', category: 'shape', defaultWidth: 180, defaultHeight: 72, fill: '#FFFFFF', stroke: '#94A3B8', textColor: '#0F172A', subtitle: 'Senior Engineer' },
  { id: 'org-team', type: 'container', label: 'Department Group', section: 'Structure', category: 'container', defaultWidth: 440, defaultHeight: 240, fill: '#F8FAFC', stroke: '#94A3B8', textColor: '#334155', dashed: true, isContainer: true, subtitle: 'Product & Engineering' },
];

export const JOURNEY_LIBRARY: LibraryItem[] = [
  { id: 'j-stage', type: 'journey-stage', label: 'Journey Stage', section: 'Journey Map', category: 'shape', defaultWidth: 190, defaultHeight: 62, fill: '#1E293B', stroke: '#0F172A', textColor: '#FFFFFF', subtitle: 'Phase' },
  { id: 'j-action', type: 'journey-action', label: 'User Action', section: 'Journey Map', category: 'shape', defaultWidth: 190, defaultHeight: 82, fill: '#FFFFFF', stroke: '#2563EB', textColor: '#0F172A', subtitle: 'Touchpoint' },
  { id: 'j-touchpoint', type: 'journey-touchpoint', label: 'Touchpoint', section: 'Journey Map', category: 'shape', defaultWidth: 190, defaultHeight: 72, fill: '#F0F9FF', stroke: '#0284C7', textColor: '#0C4A6E', subtitle: 'Channel' },
  { id: 'j-pain', type: 'journey-pain', label: 'Pain Point', section: 'Insights', category: 'shape', defaultWidth: 190, defaultHeight: 82, fill: '#FEF2F2', stroke: '#DC2626', textColor: '#7F1D1D', subtitle: 'Friction' },
  { id: 'j-opp', type: 'journey-opportunity', label: 'Opportunity', section: 'Insights', category: 'shape', defaultWidth: 190, defaultHeight: 82, fill: '#ECFDF5', stroke: '#16A34A', textColor: '#14532D', subtitle: 'Improvement' },
];

export const WHITEBOARD_LIBRARY: LibraryItem[] = [
  { id: 'wb-sticky-yellow', type: 'sticky', label: 'Amber Sticky', section: 'Ideation', category: 'annotation', defaultWidth: 180, defaultHeight: 132, fill: '#FEF9C3', stroke: '#EAB308', textColor: '#713F12', borderRadius: 4 },
  { id: 'wb-sticky-blue', type: 'sticky', label: 'Sky Sticky', section: 'Ideation', category: 'annotation', defaultWidth: 180, defaultHeight: 132, fill: '#E0F2FE', stroke: '#0284C7', textColor: '#0C4A6E', borderRadius: 4 },
  { id: 'wb-sticky-green', type: 'sticky', label: 'Mint Sticky', section: 'Ideation', category: 'annotation', defaultWidth: 180, defaultHeight: 132, fill: '#DCFCE7', stroke: '#16A34A', textColor: '#14532D', borderRadius: 4 },
  { id: 'wb-sticky-rose', type: 'sticky', label: 'Rose Sticky', section: 'Ideation', category: 'annotation', defaultWidth: 180, defaultHeight: 132, fill: '#FFE4E6', stroke: '#E11D48', textColor: '#881337', borderRadius: 4 },
  { id: 'wb-card', type: 'process', label: 'Concept Card', section: 'Shapes', category: 'shape', defaultWidth: 180, defaultHeight: 80, fill: '#FFFFFF', stroke: '#334155', textColor: '#0F172A', borderRadius: 10 },
  { id: 'wb-pill', type: 'start', label: 'Topic Oval', section: 'Shapes', category: 'shape', defaultWidth: 164, defaultHeight: 58, fill: '#EFF6FF', stroke: '#2563EB', textColor: '#1E3A8A', borderRadius: 29 },
  { id: 'wb-text', type: 'text', label: 'Text Heading', section: 'Shapes', category: 'text', defaultWidth: 200, defaultHeight: 46, fill: 'transparent', stroke: 'transparent', textColor: '#0F172A' },
  { id: 'wb-frame', type: 'container', label: 'Board Frame', section: 'Structure', category: 'container', defaultWidth: 520, defaultHeight: 340, fill: '#FFFFFF', stroke: '#94A3B8', textColor: '#334155', isContainer: true, subtitle: 'Section Frame' },
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
  const isErd = item.type === 'erd-entity';
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
      fields: isErd
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
