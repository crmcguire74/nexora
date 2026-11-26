export type DiagramType =
  | 'flowchart'
  | 'architecture'
  | 'sequence'
  | 'floorplan'
  | 'network'
  | 'erd'
  | 'orgchart'
  | 'journey'
  | 'whiteboard';

export type DiagramThemeId = 'minimal' | 'modern' | 'technical' | 'presentation' | 'blueprint';

export type MeasurementUnit = 'ft-in' | 'ft' | 'm' | 'cm' | 'mm';

export type ConnectorRouting = 'orthogonal' | 'curved' | 'straight';

export type ConnectorLineStyle = 'solid' | 'dashed' | 'dotted';

export type PortSide = 'top' | 'right' | 'bottom' | 'left' | 'auto';

export interface ObjectStyle {
  fill: string;
  stroke: string;
  strokeWidth: number;
  textColor: string;
  fontSize: number;
  borderRadius: number;
  opacity: number;
  dashed?: boolean;
  shadow?: boolean;
}

export interface ErdField {
  id: string;
  name: string;
  type: string;
  key?: 'PK' | 'FK' | '';
}

export interface ObjectMetadata {
  subtitle?: string;
  description?: string;
  technology?: string;
  version?: string;
  environment?: 'local' | 'dev' | 'staging' | 'production';
  owner?: string;
  endpoint?: string;
  tags?: string[];
  // Flowchart / Architecture
  isContainer?: boolean;
  collapsed?: boolean;
  semanticCategory?: string;
  // ERD
  fields?: ErdField[];
  // Org Chart
  department?: string;
  // User Journey
  emotion?: 'delighted' | 'positive' | 'neutral' | 'frustrated';
  // Whiteboard freehand
  points?: Array<{ x: number; y: number }>;
  // Floorplan furniture
  realWidthM?: number;
  realHeightM?: number;
}

export interface DiagramObject {
  id: string;
  type: string;
  category: 'shape' | 'container' | 'text' | 'annotation' | 'entity' | 'freehand' | 'furniture';
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  layerId: string;
  zIndex: number;
  visible: boolean;
  locked: boolean;
  groupId?: string;
  parentId?: string;
  style: ObjectStyle;
  metadata: ObjectMetadata;
}

export interface DiagramConnection {
  id: string;
  fromId: string;
  toId: string;
  fromPort: PortSide;
  toPort: PortSide;
  label?: string;
  protocol?: string;
  routing: ConnectorRouting;
  lineStyle: ConnectorLineStyle;
  color: string;
  strokeWidth: number;
  arrowStart: 'none' | 'arrow' | 'diamond' | 'crow';
  arrowEnd: 'none' | 'arrow' | 'open' | 'diamond' | 'crow';
  waypoints?: Array<{ x: number; y: number }>;
}

// ==========================================
// Sequence Diagram Semantic Model
// ==========================================

export type SequenceParticipantRole =
  | 'actor'
  | 'user'
  | 'browser'
  | 'mobile'
  | 'web-ui'
  | 'api'
  | 'microservice'
  | 'auth'
  | 'event-bus'
  | 'queue'
  | 'cache'
  | 'database'
  | 'cloud'
  | 'external';

export type SequenceMessageType =
  | 'sync'
  | 'async'
  | 'return'
  | 'self'
  | 'create'
  | 'destroy'
  | 'event';

export type FragmentKind = 'alt' | 'opt' | 'loop' | 'par' | 'break' | 'critical' | 'ref';

export interface SequenceParticipant {
  id: string;
  name: string;
  role: SequenceParticipantRole;
  subtitle?: string;
  color: string;
  order: number;
  linkedArchitectureNodeId?: string;
  width?: number;
}

export interface SequenceMessage {
  id: string;
  fromId: string;
  toId: string;
  label: string;
  type: SequenceMessageType;
  order: number;
  protocol?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'EVENT' | 'SQL' | '';
  endpoint?: string;
  requestPayload?: string;
  responsePayload?: string;
  status?: string;
  notes?: string;
  color?: string;
  activateTarget?: boolean;
}

export interface SequenceFragment {
  id: string;
  kind: FragmentKind;
  guard: string;
  elseGuard?: string;
  elseIndex?: number;
  startOrder: number;
  endOrder: number;
  color: string;
  collapsed?: boolean;
}

export interface SequenceNote {
  id: string;
  text: string;
  participantId: string;
  afterOrder: number;
  placement: 'right' | 'left' | 'over';
}

export interface SequenceData {
  viewMode: 'modern' | 'classic';
  autoActivation: boolean;
  participantSpacing: number;
  rowSpacing: number;
  participants: SequenceParticipant[];
  messages: SequenceMessage[];
  fragments: SequenceFragment[];
  notes: SequenceNote[];
}

// ==========================================
// Floor Plan Semantic Model (Meters canonical)
// ==========================================

export type SurfaceTextureId =
  | 'solid'
  | 'plaster'
  | 'hardwood'
  | 'walnut'
  | 'parquet'
  | 'marble'
  | 'carrara'
  | 'granite'
  | 'tile'
  | 'subway-tile'
  | 'terrazzo'
  | 'carpet'
  | 'fabric'
  | 'leather'
  | 'brick'
  | 'stone'
  | 'concrete'
  | 'slate'
  | 'metal'
  | 'glass';

export type FloorLightingPreset = 'daylight' | 'golden' | 'evening';
export type FloorWallVisibility = 'full' | 'cutaway';

export interface FloorWall {
  id: string;
  x1: number; // meters
  y1: number; // meters
  x2: number; // meters
  y2: number; // meters
  thickness: number; // meters (0.2 exterior, 0.12 interior)
  kind: 'exterior' | 'interior';
  height?: number; // meters (default 2.75)
  color?: string; // hex surface tint/paint color
  texture?: SurfaceTextureId; // procedural PBR material finish
}

export interface FloorOpening {
  id: string;
  wallId: string;
  kind: 'door' | 'double-door' | 'sliding-door' | 'window';
  offsetRatio: number; // 0..1 along wall
  width: number; // meters
  swing: 'left' | 'right';
  swingInward: boolean;
  height?: number; // meters (doors ~2.1m, windows ~1.35m)
  sillHeight?: number; // meters above floor for windows (~0.9m)
  color?: string;
  texture?: SurfaceTextureId;
}

export interface FloorRoom {
  id: string;
  name: string;
  roomType: string;
  floorMaterial:
    | 'hardwood'
    | 'walnut'
    | 'parquet'
    | 'carpet'
    | 'tile'
    | 'terrazzo'
    | 'concrete'
    | 'marble'
    | 'carrara'
    | 'stone'
    | 'slate'
    | 'solid';
  color: string;
  polygon: Array<{ x: number; y: number }>; // meters
  areaSqM: number;
  autoDetected?: boolean;
}

export interface FloorFurniture {
  id: string;
  type: string;
  label: string;
  x: number; // meters (center)
  y: number; // meters (center)
  width: number; // meters
  depth: number; // meters
  height?: number; // meters (3D height override)
  elevation?: number; // meters off ground
  rotation: number; // degrees
  color: string;
  texture?: SurfaceTextureId;
  layerId: string;
  locked?: boolean;
}

export interface FloorPlanData {
  unit: MeasurementUnit;
  pixelsPerMeter: number;
  floorName: string;
  showDimensions: boolean;
  showFurniture: boolean;
  showRooms: boolean;
  viewMode?: '2d' | '3d';
  wallHeight?: number; // default wall height in meters (2.75)
  lightingPreset?: FloorLightingPreset;
  wallVisibility?: FloorWallVisibility;
  walls: FloorWall[];
  openings: FloorOpening[];
  rooms: FloorRoom[];
  furniture: FloorFurniture[];
}

// ==========================================
// Core Document Container
// ==========================================

export interface DiagramLayer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
}

export interface DiagramSettings {
  theme: DiagramThemeId;
  showGrid: boolean;
  snapToGrid: boolean;
  gridSize: number;
  showSmartGuides: boolean;
  activeEnvironment?: 'all' | 'local' | 'dev' | 'staging' | 'production';
}

export interface DiagramSnapshot {
  id: string;
  label: string;
  createdAt: string;
  document: Omit<DiagramDocument, 'snapshots'>;
}

export interface DiagramDocument {
  id: string;
  schemaVersion: number;
  type: DiagramType;
  title: string;
  folder: string;
  tags: string[];
  starred?: boolean;
  objects: DiagramObject[];
  connections: DiagramConnection[];
  layers: DiagramLayer[];
  sequence?: SequenceData;
  floorplan?: FloorPlanData;
  settings: DiagramSettings;
  snapshots?: DiagramSnapshot[];
  createdAt: string;
  updatedAt: string;
}

export interface CustomComponent {
  id: string;
  name: string;
  diagramType: DiagramType;
  objectTemplate: Omit<DiagramObject, 'id' | 'x' | 'y' | 'zIndex'>;
  createdAt: string;
}

export interface CustomTemplate {
  id: string;
  name: string;
  description: string;
  category: DiagramType;
  isCustom?: boolean;
  popular?: boolean;
  createDocument: () => DiagramDocument;
  savedDocument?: DiagramDocument;
}

export interface ValidationIssue {
  id: string;
  severity: 'warning' | 'info';
  message: string;
  objectId?: string;
}

export interface ViewportState {
  x: number;
  y: number;
  zoom: number;
}

export type LocalUserRole = 'owner' | 'editor' | 'viewer';

export interface LocalProfile {
  name: string;
  email: string;
  role: LocalUserRole;
  workspaceName: string;
}
