import {
  CustomTemplate,
  DiagramDocument,
  DiagramType,
  FloorPlanData,
  SequenceData,
} from '../types/diagram';
import { detectRoomsFromWalls } from './geometry';

export function makeId(prefix = 'doc'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function baseDoc(type: DiagramType, title: string, folder = 'General'): DiagramDocument {
  const now = new Date().toISOString();
  return {
    id: makeId('diag'),
    schemaVersion: 1,
    type,
    title,
    folder,
    tags: [type],
    objects: [],
    connections: [],
    layers: [{ id: 'layer-main', name: 'Primary Layer', visible: true, locked: false }],
    settings: {
      theme: 'modern',
      showGrid: true,
      snapToGrid: true,
      gridSize: 20,
      showSmartGuides: true,
      activeEnvironment: 'all',
    },
    snapshots: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function createBlankDiagram(type: DiagramType): DiagramDocument {
  if (type === 'sequence') {
    const doc = baseDoc('sequence', 'Untitled Sequence Diagram', 'Engineering');
    doc.sequence = {
      viewMode: 'modern',
      autoActivation: true,
      participantSpacing: 210,
      rowSpacing: 64,
      participants: [
        { id: 'p_user', name: 'User', role: 'user', subtitle: 'Client', color: '#475569', order: 0 },
        { id: 'p_ui', name: 'Web App', role: 'browser', subtitle: 'React SPA', color: '#2563EB', order: 1 },
        { id: 'p_api', name: 'Core API', role: 'api', subtitle: 'REST Gateway', color: '#0284C7', order: 2 },
      ],
      messages: [
        {
          id: 'm_1',
          fromId: 'p_user',
          toId: 'p_ui',
          label: 'Trigger action',
          type: 'sync',
          order: 0,
          activateTarget: true,
        },
        {
          id: 'm_2',
          fromId: 'p_ui',
          toId: 'p_api',
          label: 'POST /api/v1/resource',
          type: 'sync',
          order: 1,
          protocol: 'HTTPS',
          method: 'POST',
          endpoint: '/api/v1/resource',
          activateTarget: true,
        },
        {
          id: 'm_3',
          fromId: 'p_api',
          toId: 'p_ui',
          label: '200 OK { id }',
          type: 'return',
          order: 2,
          status: '200 OK',
        },
      ],
      fragments: [],
      notes: [],
    };
    return doc;
  }

  if (type === 'floorplan') {
    const doc = baseDoc('floorplan', 'Untitled Floor Plan', 'Spaces');
    const walls: FloorPlanData['walls'] = [
      { id: 'w1', x1: 1, y1: 1, x2: 7, y2: 1, thickness: 0.2, kind: 'exterior' },
      { id: 'w2', x1: 7, y1: 1, x2: 7, y2: 5.5, thickness: 0.2, kind: 'exterior' },
      { id: 'w3', x1: 7, y1: 5.5, x2: 1, y2: 5.5, thickness: 0.2, kind: 'exterior' },
      { id: 'w4', x1: 1, y1: 5.5, x2: 1, y2: 1, thickness: 0.2, kind: 'exterior' },
    ];
    doc.floorplan = {
      unit: 'ft-in',
      pixelsPerMeter: 78,
      floorName: 'Ground Floor',
      showDimensions: true,
      showFurniture: true,
      showRooms: true,
      walls,
      openings: [
        { id: 'op1', wallId: 'w3', kind: 'door', offsetRatio: 0.28, width: 0.9, swing: 'right', swingInward: true },
        { id: 'op2', wallId: 'w1', kind: 'window', offsetRatio: 0.5, width: 2.0, swing: 'left', swingInward: true },
      ],
      rooms: detectRoomsFromWalls(walls, [
        {
          id: 'room_main',
          name: 'Main Studio',
          roomType: 'Office',
          floorMaterial: 'hardwood',
          color: '#F8FAFC',
          polygon: [
            { x: 1, y: 1 },
            { x: 7, y: 1 },
            { x: 7, y: 5.5 },
            { x: 1, y: 5.5 },
          ],
          areaSqM: 27,
          autoDetected: true,
        },
      ]),
      furniture: [
        { id: 'f1', type: 'desk', label: 'Work Desk', x: 3.2, y: 2.2, width: 1.6, depth: 0.8, rotation: 0, color: '#E2E8F0', layerId: 'layer-furniture' },
        { id: 'f2', type: 'chair', label: 'Chair', x: 3.2, y: 3.1, width: 0.65, depth: 0.65, rotation: 0, color: '#CBD5E1', layerId: 'layer-furniture' },
      ],
    };
    return doc;
  }

  if (type === 'flowchart') {
    const doc = baseDoc('flowchart', 'Untitled Flowchart', 'Workflows');
    doc.objects = [
      {
        id: 'n_start',
        type: 'start',
        category: 'shape',
        label: 'Start Process',
        x: 360,
        y: 120,
        width: 152,
        height: 54,
        rotation: 0,
        layerId: 'layer-main',
        zIndex: 1,
        visible: true,
        locked: false,
        style: { fill: '#ECFDF5', stroke: '#16A34A', strokeWidth: 1.5, textColor: '#14532D', fontSize: 13, borderRadius: 27, opacity: 1, shadow: true },
        metadata: {},
      },
    ];
    return doc;
  }

  return baseDoc(type, `Untitled ${type.charAt(0).toUpperCase() + type.slice(1)}`, 'General');
}

// ==========================================
// Rich Starter Templates
// ==========================================

export function createApprovalFlowTemplate(): DiagramDocument {
  const doc = baseDoc('flowchart', 'Purchase Approval Workflow', 'Workflows');
  doc.tags = ['flowchart', 'approval', 'operations'];
  doc.objects = [
    {
      id: 'fc_1',
      type: 'start',
      category: 'shape',
      label: 'Submit Request',
      x: 340,
      y: 60,
      width: 164,
      height: 54,
      rotation: 0,
      layerId: 'layer-main',
      zIndex: 2,
      visible: true,
      locked: false,
      style: { fill: '#ECFDF5', stroke: '#16A34A', strokeWidth: 1.5, textColor: '#14532D', fontSize: 13, borderRadius: 27, opacity: 1, shadow: true },
      metadata: {},
    },
    {
      id: 'fc_2',
      type: 'process',
      category: 'shape',
      label: 'Validate Budget Code',
      x: 332,
      y: 170,
      width: 180,
      height: 66,
      rotation: 0,
      layerId: 'layer-main',
      zIndex: 3,
      visible: true,
      locked: false,
      style: { fill: '#FFFFFF', stroke: '#2563EB', strokeWidth: 1.5, textColor: '#0F172A', fontSize: 13, borderRadius: 10, opacity: 1, shadow: true },
      metadata: { subtitle: 'Finance Policy Check' },
    },
    {
      id: 'fc_3',
      type: 'decision',
      category: 'shape',
      label: 'Amount > $5,000?',
      x: 342,
      y: 292,
      width: 160,
      height: 100,
      rotation: 0,
      layerId: 'layer-main',
      zIndex: 4,
      visible: true,
      locked: false,
      style: { fill: '#FFFBEB', stroke: '#D97706', strokeWidth: 1.5, textColor: '#78350F', fontSize: 13, borderRadius: 4, opacity: 1, shadow: true },
      metadata: {},
    },
    {
      id: 'fc_4',
      type: 'process',
      category: 'shape',
      label: 'VP Finance Review',
      x: 590,
      y: 309,
      width: 176,
      height: 66,
      rotation: 0,
      layerId: 'layer-main',
      zIndex: 5,
      visible: true,
      locked: false,
      style: { fill: '#EFF6FF', stroke: '#2563EB', strokeWidth: 1.5, textColor: '#1E3A8A', fontSize: 13, borderRadius: 10, opacity: 1, shadow: true },
      metadata: { subtitle: 'Executive Sign-Off' },
    },
    {
      id: 'fc_5',
      type: 'process',
      category: 'shape',
      label: 'Manager Approval',
      x: 100,
      y: 309,
      width: 172,
      height: 66,
      rotation: 0,
      layerId: 'layer-main',
      zIndex: 6,
      visible: true,
      locked: false,
      style: { fill: '#FFFFFF', stroke: '#0284C7', strokeWidth: 1.5, textColor: '#0F172A', fontSize: 13, borderRadius: 10, opacity: 1, shadow: true },
      metadata: { subtitle: 'Standard SLA 24h' },
    },
    {
      id: 'fc_6',
      type: 'database',
      category: 'shape',
      label: 'Record PO in ERP',
      x: 344,
      y: 454,
      width: 156,
      height: 82,
      rotation: 0,
      layerId: 'layer-main',
      zIndex: 7,
      visible: true,
      locked: false,
      style: { fill: '#F0FDFA', stroke: '#0D9488', strokeWidth: 1.5, textColor: '#134E4A', fontSize: 13, borderRadius: 8, opacity: 1, shadow: true },
      metadata: {},
    },
    {
      id: 'fc_7',
      type: 'start',
      category: 'shape',
      label: 'Order Dispatched',
      x: 340,
      y: 594,
      width: 164,
      height: 54,
      rotation: 0,
      layerId: 'layer-main',
      zIndex: 8,
      visible: true,
      locked: false,
      style: { fill: '#ECFDF5', stroke: '#16A34A', strokeWidth: 1.5, textColor: '#14532D', fontSize: 13, borderRadius: 27, opacity: 1, shadow: true },
      metadata: {},
    },
  ];
  doc.connections = [
    { id: 'c1', fromId: 'fc_1', toId: 'fc_2', fromPort: 'bottom', toPort: 'top', routing: 'orthogonal', lineStyle: 'solid', color: '#475569', strokeWidth: 1.75, arrowStart: 'none', arrowEnd: 'arrow' },
    { id: 'c2', fromId: 'fc_2', toId: 'fc_3', fromPort: 'bottom', toPort: 'top', routing: 'orthogonal', lineStyle: 'solid', color: '#475569', strokeWidth: 1.75, arrowStart: 'none', arrowEnd: 'arrow' },
    { id: 'c3', fromId: 'fc_3', toId: 'fc_4', fromPort: 'right', toPort: 'left', label: 'Yes', routing: 'orthogonal', lineStyle: 'solid', color: '#D97706', strokeWidth: 1.75, arrowStart: 'none', arrowEnd: 'arrow' },
    { id: 'c4', fromId: 'fc_3', toId: 'fc_5', fromPort: 'left', toPort: 'right', label: 'No', routing: 'orthogonal', lineStyle: 'solid', color: '#16A34A', strokeWidth: 1.75, arrowStart: 'none', arrowEnd: 'arrow' },
    { id: 'c5', fromId: 'fc_5', toId: 'fc_6', fromPort: 'bottom', toPort: 'left', label: 'Approved', routing: 'orthogonal', lineStyle: 'solid', color: '#475569', strokeWidth: 1.75, arrowStart: 'none', arrowEnd: 'arrow' },
    { id: 'c6', fromId: 'fc_4', toId: 'fc_6', fromPort: 'bottom', toPort: 'right', label: 'Approved', routing: 'orthogonal', lineStyle: 'solid', color: '#475569', strokeWidth: 1.75, arrowStart: 'none', arrowEnd: 'arrow' },
    { id: 'c7', fromId: 'fc_6', toId: 'fc_7', fromPort: 'bottom', toPort: 'top', routing: 'orthogonal', lineStyle: 'solid', color: '#475569', strokeWidth: 1.75, arrowStart: 'none', arrowEnd: 'arrow' },
  ];
  return doc;
}

export function createCloudArchTemplate(): DiagramDocument {
  const doc = baseDoc('architecture', 'Cloud Platform Architecture', 'Engineering');
  doc.tags = ['architecture', 'cloud', 'microservices'];
  doc.objects = [
    {
      id: 'a_vpc',
      type: 'arch-vpc',
      category: 'container',
      label: 'Production Cloud VPC (us-east-1)',
      x: 330,
      y: 64,
      width: 660,
      height: 460,
      rotation: 0,
      layerId: 'layer-main',
      zIndex: 0,
      visible: true,
      locked: false,
      style: { fill: '#F0F9FF', stroke: '#0284C7', strokeWidth: 1.5, textColor: '#0C4A6E', fontSize: 13, borderRadius: 12, opacity: 1, dashed: true },
      metadata: { isContainer: true, subtitle: '10.20.0.0/16 · Multi-AZ', environment: 'production' },
    },
    {
      id: 'a_browser',
      type: 'arch-browser',
      category: 'shape',
      label: 'Web Application',
      x: 70,
      y: 150,
      width: 176,
      height: 76,
      rotation: 0,
      layerId: 'layer-main',
      zIndex: 2,
      visible: true,
      locked: false,
      style: { fill: '#EFF6FF', stroke: '#2563EB', strokeWidth: 1.5, textColor: '#1E3A8A', fontSize: 13, borderRadius: 10, opacity: 1, shadow: true },
      metadata: { subtitle: 'React 19 SPA', technology: 'TypeScript', environment: 'production', owner: 'Frontend Platform' },
    },
    {
      id: 'a_mobile',
      type: 'arch-mobile',
      category: 'shape',
      label: 'Mobile Client',
      x: 70,
      y: 290,
      width: 176,
      height: 76,
      rotation: 0,
      layerId: 'layer-main',
      zIndex: 3,
      visible: true,
      locked: false,
      style: { fill: '#EFF6FF', stroke: '#2563EB', strokeWidth: 1.5, textColor: '#1E3A8A', fontSize: 13, borderRadius: 10, opacity: 1, shadow: true },
      metadata: { subtitle: 'iOS & Android', technology: 'Swift / Kotlin', environment: 'production', owner: 'Mobile Team' },
    },
    {
      id: 'a_gw',
      type: 'arch-gateway',
      category: 'shape',
      label: 'API Gateway',
      x: 372,
      y: 220,
      width: 176,
      height: 78,
      rotation: 0,
      layerId: 'layer-main',
      zIndex: 4,
      visible: true,
      locked: false,
      parentId: 'a_vpc',
      style: { fill: '#FFFFFF', stroke: '#0284C7', strokeWidth: 1.5, textColor: '#0C4A6E', fontSize: 13, borderRadius: 10, opacity: 1, shadow: true },
      metadata: { subtitle: 'TLS / Rate Limit', technology: 'Envoy', endpoint: 'https://api.acme.io', environment: 'production' },
    },
    {
      id: 'a_auth',
      type: 'arch-auth',
      category: 'shape',
      label: 'Identity Service',
      x: 604,
      y: 120,
      width: 176,
      height: 74,
      rotation: 0,
      layerId: 'layer-main',
      zIndex: 5,
      visible: true,
      locked: false,
      parentId: 'a_vpc',
      style: { fill: '#FEF2F2', stroke: '#DC2626', strokeWidth: 1.5, textColor: '#7F1D1D', fontSize: 13, borderRadius: 10, opacity: 1, shadow: true },
      metadata: { subtitle: 'OAuth 2.0 / JWT', technology: 'OIDC', environment: 'production' },
    },
    {
      id: 'a_orders',
      type: 'arch-service',
      category: 'shape',
      label: 'Core Domain API',
      x: 604,
      y: 230,
      width: 176,
      height: 76,
      rotation: 0,
      layerId: 'layer-main',
      zIndex: 6,
      visible: true,
      locked: false,
      parentId: 'a_vpc',
      style: { fill: '#FFFFFF', stroke: '#2563EB', strokeWidth: 1.5, textColor: '#0F172A', fontSize: 13, borderRadius: 10, opacity: 1, shadow: true },
      metadata: { subtitle: 'Order & Billing', technology: 'Go 1.23', environment: 'production' },
    },
    {
      id: 'a_queue',
      type: 'arch-queue',
      category: 'shape',
      label: 'Event Bus',
      x: 604,
      y: 360,
      width: 176,
      height: 74,
      rotation: 0,
      layerId: 'layer-main',
      zIndex: 7,
      visible: true,
      locked: false,
      parentId: 'a_vpc',
      style: { fill: '#FFFBEB', stroke: '#D97706', strokeWidth: 1.5, textColor: '#78350F', fontSize: 13, borderRadius: 10, opacity: 1, shadow: true },
      metadata: { subtitle: 'Async Workers', technology: 'Kafka', environment: 'production' },
    },
    {
      id: 'a_cache',
      type: 'arch-cache',
      category: 'shape',
      label: 'Redis Cache',
      x: 822,
      y: 132,
      width: 144,
      height: 72,
      rotation: 0,
      layerId: 'layer-main',
      zIndex: 8,
      visible: true,
      locked: false,
      parentId: 'a_vpc',
      style: { fill: '#FEF2F2', stroke: '#DC2626', strokeWidth: 1.5, textColor: '#7F1D1D', fontSize: 13, borderRadius: 10, opacity: 1, shadow: true },
      metadata: { subtitle: 'Session & Hot Data', technology: 'Redis 7', environment: 'production' },
    },
    {
      id: 'a_db',
      type: 'arch-db',
      category: 'shape',
      label: 'Primary Postgres',
      x: 822,
      y: 256,
      width: 144,
      height: 82,
      rotation: 0,
      layerId: 'layer-main',
      zIndex: 9,
      visible: true,
      locked: false,
      parentId: 'a_vpc',
      style: { fill: '#F0FDFA', stroke: '#0D9488', strokeWidth: 1.5, textColor: '#134E4A', fontSize: 13, borderRadius: 8, opacity: 1, shadow: true },
      metadata: { subtitle: 'Multi-AZ RDS', technology: 'PostgreSQL 16', environment: 'production' },
    },
  ];
  doc.connections = [
    { id: 'ac1', fromId: 'a_browser', toId: 'a_gw', fromPort: 'right', toPort: 'left', label: 'HTTPS', protocol: 'HTTPS', routing: 'orthogonal', lineStyle: 'solid', color: '#2563EB', strokeWidth: 1.75, arrowStart: 'none', arrowEnd: 'arrow' },
    { id: 'ac2', fromId: 'a_mobile', toId: 'a_gw', fromPort: 'right', toPort: 'left', label: 'GraphQL', protocol: 'GraphQL', routing: 'orthogonal', lineStyle: 'solid', color: '#0D9488', strokeWidth: 1.75, arrowStart: 'none', arrowEnd: 'arrow' },
    { id: 'ac3', fromId: 'a_gw', toId: 'a_auth', fromPort: 'top', toPort: 'left', label: 'OIDC', protocol: 'Auth', routing: 'orthogonal', lineStyle: 'dotted', color: '#DC2626', strokeWidth: 1.75, arrowStart: 'none', arrowEnd: 'arrow' },
    { id: 'ac4', fromId: 'a_gw', toId: 'a_orders', fromPort: 'right', toPort: 'left', label: 'gRPC', protocol: 'gRPC', routing: 'orthogonal', lineStyle: 'solid', color: '#4338CA', strokeWidth: 1.75, arrowStart: 'none', arrowEnd: 'arrow' },
    { id: 'ac5', fromId: 'a_orders', toId: 'a_cache', fromPort: 'right', toPort: 'left', label: 'Read/Write', protocol: 'REST', routing: 'orthogonal', lineStyle: 'solid', color: '#DC2626', strokeWidth: 1.5, arrowStart: 'none', arrowEnd: 'arrow' },
    { id: 'ac6', fromId: 'a_orders', toId: 'a_db', fromPort: 'right', toPort: 'left', label: 'SQL', protocol: 'SQL', routing: 'orthogonal', lineStyle: 'solid', color: '#0D9488', strokeWidth: 1.75, arrowStart: 'none', arrowEnd: 'arrow' },
    { id: 'ac7', fromId: 'a_orders', toId: 'a_queue', fromPort: 'bottom', toPort: 'top', label: 'OrderCreated', protocol: 'Event', routing: 'orthogonal', lineStyle: 'dashed', color: '#D97706', strokeWidth: 1.75, arrowStart: 'none', arrowEnd: 'arrow' },
  ];
  return doc;
}

export function createOAuthSequenceTemplate(): DiagramDocument {
  const doc = baseDoc('sequence', 'OAuth 2.0 Login Call Flow', 'Engineering');
  doc.tags = ['sequence', 'oauth', 'authentication'];
  const sequence: SequenceData = {
    viewMode: 'modern',
    autoActivation: true,
    participantSpacing: 205,
    rowSpacing: 64,
    participants: [
      { id: 'p_user', name: 'User', role: 'user', subtitle: 'Browser Actor', color: '#475569', order: 0 },
      { id: 'p_spa', name: 'React Frontend', role: 'browser', subtitle: 'Client App', color: '#2563EB', order: 1 },
      { id: 'p_api', name: 'Auth API', role: 'api', subtitle: 'Gateway Service', color: '#0284C7', order: 2 },
      { id: 'p_idp', name: 'Identity Provider', role: 'auth', subtitle: 'OIDC / SSO', color: '#DC2626', order: 3 },
      { id: 'p_db', name: 'Permissions DB', role: 'database', subtitle: 'PostgreSQL', color: '#0D9488', order: 4 },
    ],
    messages: [
      {
        id: 'sm_1',
        fromId: 'p_user',
        toId: 'p_spa',
        label: 'Submit login credentials',
        type: 'sync',
        order: 0,
        activateTarget: true,
      },
      {
        id: 'sm_2',
        fromId: 'p_spa',
        toId: 'p_api',
        label: 'Authenticate user',
        type: 'sync',
        order: 1,
        protocol: 'HTTPS',
        method: 'POST',
        endpoint: '/api/auth/login',
        requestPayload: '{\n  "email": "alex@acme.io",\n  "mfaCode": "482910"\n}',
        responsePayload: '{\n  "sessionId": "sess_9f2a1",\n  "expiresIn": 3600\n}',
        activateTarget: true,
      },
      {
        id: 'sm_3',
        fromId: 'p_api',
        toId: 'p_idp',
        label: 'Validate credentials & MFA',
        type: 'sync',
        order: 2,
        protocol: 'OIDC',
        method: 'POST',
        endpoint: '/oauth2/token',
        activateTarget: true,
      },
      {
        id: 'sm_4',
        fromId: 'p_idp',
        toId: 'p_api',
        label: 'Return signed JWT token',
        type: 'return',
        order: 3,
        status: '200 OK',
      },
      {
        id: 'sm_5',
        fromId: 'p_api',
        toId: 'p_db',
        label: 'Fetch workspace roles',
        type: 'sync',
        order: 4,
        protocol: 'SQL',
        method: 'SQL',
        endpoint: 'SELECT role FROM memberships',
        activateTarget: true,
      },
      {
        id: 'sm_6',
        fromId: 'p_db',
        toId: 'p_api',
        label: 'Return role claims',
        type: 'return',
        order: 5,
      },
      {
        id: 'sm_7',
        fromId: 'p_api',
        toId: 'p_spa',
        label: 'Set HttpOnly session cookie',
        type: 'return',
        order: 6,
        status: '200 OK',
      },
      {
        id: 'sm_8',
        fromId: 'p_spa',
        toId: 'p_user',
        label: 'Render Workspace Dashboard',
        type: 'async',
        order: 7,
      },
    ],
    fragments: [
      {
        id: 'frag_1',
        kind: 'alt',
        guard: 'credentials valid & MFA verified',
        elseGuard: 'invalid credentials → 401',
        startOrder: 2,
        endOrder: 5,
        color: '#0284C7',
      },
    ],
    notes: [
      {
        id: 'sn_1',
        text: 'PKCE & short-lived 15m tokens enforced',
        participantId: 'p_idp',
        afterOrder: 3,
        placement: 'right',
      },
    ],
  };
  doc.sequence = sequence;
  return doc;
}

export function createOfficeFloorPlanTemplate(): DiagramDocument {
  const doc = baseDoc('floorplan', 'Design Studio Open Office', 'Spaces');
  doc.tags = ['floorplan', 'office', 'architecture'];
  const walls: FloorPlanData['walls'] = [
    // Outer perimeter (12m x 7.5m)
    { id: 'ow1', x1: 1, y1: 1, x2: 13, y2: 1, thickness: 0.22, kind: 'exterior' },
    { id: 'ow2', x1: 13, y1: 1, x2: 13, y2: 8.5, thickness: 0.22, kind: 'exterior' },
    { id: 'ow3', x1: 13, y1: 8.5, x2: 1, y2: 8.5, thickness: 0.22, kind: 'exterior' },
    { id: 'ow4', x1: 1, y1: 8.5, x2: 1, y2: 1, thickness: 0.22, kind: 'exterior' },
    // Interior partition: Conference Room (top-right 5m x 4m)
    { id: 'iw1', x1: 8, y1: 1, x2: 8, y2: 5, thickness: 0.14, kind: 'interior' },
    { id: 'iw2', x1: 8, y1: 5, x2: 13, y2: 5, thickness: 0.14, kind: 'interior' },
    // Interior partition: Focus Lounge (bottom-right 5m x 3.5m)
    { id: 'iw3', x1: 8, y1: 5, x2: 8, y2: 8.5, thickness: 0.14, kind: 'interior' },
  ];

  const rooms = detectRoomsFromWalls(walls, [
    {
      id: 'r_open',
      name: 'Open Studio Workspace',
      roomType: 'Workspace',
      floorMaterial: 'hardwood',
      color: '#F8FAFC',
      polygon: [
        { x: 1, y: 1 },
        { x: 8, y: 1 },
        { x: 8, y: 8.5 },
        { x: 1, y: 8.5 },
      ],
      areaSqM: 52.5,
      autoDetected: true,
    },
    {
      id: 'r_conf',
      name: 'Boardroom',
      roomType: 'Conference',
      floorMaterial: 'carpet',
      color: '#F0F9FF',
      polygon: [
        { x: 8, y: 1 },
        { x: 13, y: 1 },
        { x: 13, y: 5 },
        { x: 8, y: 5 },
      ],
      areaSqM: 20,
      autoDetected: true,
    },
    {
      id: 'r_lounge',
      name: 'Collaboration Lounge',
      roomType: 'Lounge',
      floorMaterial: 'hardwood',
      color: '#FFFBEB',
      polygon: [
        { x: 8, y: 5 },
        { x: 13, y: 5 },
        { x: 13, y: 8.5 },
        { x: 8, y: 8.5 },
      ],
      areaSqM: 17.5,
      autoDetected: true,
    },
  ]);

  doc.floorplan = {
    unit: 'ft-in',
    pixelsPerMeter: 72,
    floorName: 'Level 04 — Studio Suite',
    showDimensions: true,
    showFurniture: true,
    showRooms: true,
    walls,
    openings: [
      { id: 'op_entry', wallId: 'ow3', kind: 'double-door', offsetRatio: 0.25, width: 1.6, swing: 'right', swingInward: true },
      { id: 'op_conf', wallId: 'iw1', kind: 'door', offsetRatio: 0.65, width: 0.9, swing: 'left', swingInward: true },
      { id: 'op_lounge', wallId: 'iw3', kind: 'door', offsetRatio: 0.5, width: 0.9, swing: 'right', swingInward: true },
      { id: 'op_win1', wallId: 'ow1', kind: 'window', offsetRatio: 0.28, width: 2.6, swing: 'left', swingInward: true },
      { id: 'op_win2', wallId: 'ow1', kind: 'window', offsetRatio: 0.78, width: 2.4, swing: 'left', swingInward: true },
      { id: 'op_win3', wallId: 'ow2', kind: 'window', offsetRatio: 0.72, width: 1.8, swing: 'left', swingInward: true },
    ],
    rooms,
    furniture: [
      { id: 'fn_1', type: 'desk', label: 'Desk A1', x: 3.0, y: 2.7, width: 1.6, depth: 0.8, rotation: 0, color: '#E2E8F0', layerId: 'layer-furniture' },
      { id: 'fn_2', type: 'desk', label: 'Desk A2', x: 5.0, y: 2.7, width: 1.6, depth: 0.8, rotation: 0, color: '#E2E8F0', layerId: 'layer-furniture' },
      { id: 'fn_3', type: 'desk', label: 'Desk B1', x: 3.0, y: 5.2, width: 1.6, depth: 0.8, rotation: 0, color: '#E2E8F0', layerId: 'layer-furniture' },
      { id: 'fn_4', type: 'desk', label: 'Desk B2', x: 5.0, y: 5.2, width: 1.6, depth: 0.8, rotation: 0, color: '#E2E8F0', layerId: 'layer-furniture' },
      { id: 'fn_5', type: 'conference-table', label: 'Conference Table', x: 10.5, y: 3.0, width: 3.0, depth: 1.2, rotation: 0, color: '#DBEAFE', layerId: 'layer-furniture' },
      { id: 'fn_6', type: 'sofa', label: 'Lounge Sofa', x: 10.6, y: 7.4, width: 2.2, depth: 0.95, rotation: 0, color: '#FEF3C7', layerId: 'layer-furniture' },
      { id: 'fn_7', type: 'plant', label: 'Ficus', x: 1.7, y: 1.7, width: 0.65, depth: 0.65, rotation: 0, color: '#DCFCE7', layerId: 'layer-furniture' },
      { id: 'fn_8', type: 'plant', label: 'Ficus', x: 12.2, y: 5.7, width: 0.65, depth: 0.65, rotation: 0, color: '#DCFCE7', layerId: 'layer-furniture' },
    ],
  };
  return doc;
}

export function createErdSaaSTemplate(): DiagramDocument {
  const doc = baseDoc('erd', 'SaaS Core Data Schema', 'Engineering');
  doc.tags = ['erd', 'database', 'schema'];
  doc.objects = [
    {
      id: 'e_org',
      type: 'erd-entity',
      category: 'entity',
      label: 'organizations',
      x: 110,
      y: 120,
      width: 230,
      height: 158,
      rotation: 0,
      layerId: 'layer-main',
      zIndex: 1,
      visible: true,
      locked: false,
      style: { fill: '#FFFFFF', stroke: '#0D9488', strokeWidth: 1.5, textColor: '#0F172A', fontSize: 13, borderRadius: 8, opacity: 1, shadow: true },
      metadata: {
        fields: [
          { id: 'f1', name: 'id', type: 'uuid', key: 'PK' },
          { id: 'f2', name: 'name', type: 'varchar(120)', key: '' },
          { id: 'f3', name: 'plan_tier', type: 'enum', key: '' },
          { id: 'f4', name: 'created_at', type: 'timestamptz', key: '' },
        ],
      },
    },
    {
      id: 'e_user',
      type: 'erd-entity',
      category: 'entity',
      label: 'users',
      x: 450,
      y: 90,
      width: 236,
      height: 182,
      rotation: 0,
      layerId: 'layer-main',
      zIndex: 2,
      visible: true,
      locked: false,
      style: { fill: '#FFFFFF', stroke: '#2563EB', strokeWidth: 1.5, textColor: '#0F172A', fontSize: 13, borderRadius: 8, opacity: 1, shadow: true },
      metadata: {
        fields: [
          { id: 'u1', name: 'id', type: 'uuid', key: 'PK' },
          { id: 'u2', name: 'org_id', type: 'uuid', key: 'FK' },
          { id: 'u3', name: 'email', type: 'varchar(255)', key: '' },
          { id: 'u4', name: 'role', type: 'varchar(32)', key: '' },
          { id: 'u5', name: 'last_login', type: 'timestamptz', key: '' },
        ],
      },
    },
    {
      id: 'e_proj',
      type: 'erd-entity',
      category: 'entity',
      label: 'diagrams',
      x: 450,
      y: 330,
      width: 236,
      height: 162,
      rotation: 0,
      layerId: 'layer-main',
      zIndex: 3,
      visible: true,
      locked: false,
      style: { fill: '#FFFFFF', stroke: '#0284C7', strokeWidth: 1.5, textColor: '#0F172A', fontSize: 13, borderRadius: 8, opacity: 1, shadow: true },
      metadata: {
        fields: [
          { id: 'd1', name: 'id', type: 'uuid', key: 'PK' },
          { id: 'd2', name: 'org_id', type: 'uuid', key: 'FK' },
          { id: 'd3', name: 'owner_id', type: 'uuid', key: 'FK' },
          { id: 'd4', name: 'diagram_type', type: 'varchar(40)', key: '' },
        ],
      },
    },
  ];
  doc.connections = [
    { id: 'ec1', fromId: 'e_org', toId: 'e_user', fromPort: 'right', toPort: 'left', label: '1 : N', routing: 'orthogonal', lineStyle: 'solid', color: '#0D9488', strokeWidth: 1.75, arrowStart: 'none', arrowEnd: 'crow' },
    { id: 'ec2', fromId: 'e_org', toId: 'e_proj', fromPort: 'bottom', toPort: 'left', label: '1 : N', routing: 'orthogonal', lineStyle: 'solid', color: '#0284C7', strokeWidth: 1.75, arrowStart: 'none', arrowEnd: 'crow' },
    { id: 'ec3', fromId: 'e_user', toId: 'e_proj', fromPort: 'bottom', toPort: 'top', label: 'authors (1:N)', routing: 'orthogonal', lineStyle: 'dashed', color: '#475569', strokeWidth: 1.5, arrowStart: 'none', arrowEnd: 'crow' },
  ];
  return doc;
}

export function createNetworkTemplate(): DiagramDocument {
  const doc = baseDoc('network', 'Enterprise Branch Network', 'Infrastructure');
  doc.tags = ['network', 'security', 'vlan'];
  doc.objects = [
    {
      id: 'n_vlan',
      type: 'net-subnet',
      category: 'container',
      label: 'Internal Production Subnet (VLAN 20)',
      x: 470,
      y: 80,
      width: 440,
      height: 320,
      rotation: 0,
      layerId: 'layer-main',
      zIndex: 0,
      visible: true,
      locked: false,
      style: { fill: '#F8FAFC', stroke: '#64748B', strokeWidth: 1.5, textColor: '#334155', fontSize: 13, borderRadius: 12, opacity: 1, dashed: true },
      metadata: { isContainer: true, subtitle: '10.10.20.0/24' },
    },
    {
      id: 'n_wan',
      type: 'net-internet',
      category: 'shape',
      label: 'Fiber WAN Uplink',
      x: 60,
      y: 204,
      width: 164,
      height: 72,
      rotation: 0,
      layerId: 'layer-main',
      zIndex: 2,
      visible: true,
      locked: false,
      style: { fill: '#F0F9FF', stroke: '#0284C7', strokeWidth: 1.5, textColor: '#0C4A6E', fontSize: 13, borderRadius: 10, opacity: 1, shadow: true },
      metadata: { subtitle: '10 Gbps Symmetrical' },
    },
    {
      id: 'n_fw',
      type: 'net-firewall',
      category: 'shape',
      label: 'Edge Firewall HA',
      x: 268,
      y: 204,
      width: 164,
      height: 72,
      rotation: 0,
      layerId: 'layer-main',
      zIndex: 3,
      visible: true,
      locked: false,
      style: { fill: '#FEF2F2', stroke: '#DC2626', strokeWidth: 1.5, textColor: '#7F1D1D', fontSize: 13, borderRadius: 10, opacity: 1, shadow: true },
      metadata: { subtitle: 'Active / Passive' },
    },
    {
      id: 'n_sw',
      type: 'net-switch',
      category: 'shape',
      label: 'Core L3 Switch',
      x: 504,
      y: 204,
      width: 164,
      height: 72,
      rotation: 0,
      layerId: 'layer-main',
      zIndex: 4,
      visible: true,
      locked: false,
      parentId: 'n_vlan',
      style: { fill: '#F0FDFA', stroke: '#0D9488', strokeWidth: 1.5, textColor: '#134E4A', fontSize: 13, borderRadius: 10, opacity: 1, shadow: true },
      metadata: { subtitle: '48p 10GbE SFP+' },
    },
    {
      id: 'n_srv',
      type: 'net-server',
      category: 'shape',
      label: 'App Cluster Node',
      x: 718,
      y: 132,
      width: 164,
      height: 72,
      rotation: 0,
      layerId: 'layer-main',
      zIndex: 5,
      visible: true,
      locked: false,
      parentId: 'n_vlan',
      style: { fill: '#FFFFFF', stroke: '#475569', strokeWidth: 1.5, textColor: '#0F172A', fontSize: 13, borderRadius: 10, opacity: 1, shadow: true },
      metadata: { subtitle: '10.10.20.11' },
    },
    {
      id: 'n_ap',
      type: 'net-ap',
      category: 'shape',
      label: 'Studio Wi-Fi 7 AP',
      x: 718,
      y: 274,
      width: 164,
      height: 72,
      rotation: 0,
      layerId: 'layer-main',
      zIndex: 6,
      visible: true,
      locked: false,
      parentId: 'n_vlan',
      style: { fill: '#ECFDF5', stroke: '#16A34A', strokeWidth: 1.5, textColor: '#14532D', fontSize: 13, borderRadius: 10, opacity: 1, shadow: true },
      metadata: { subtitle: 'PoE++ · 6GHz' },
    },
  ];
  doc.connections = [
    { id: 'nc1', fromId: 'n_wan', toId: 'n_fw', fromPort: 'right', toPort: 'left', label: 'BGP', routing: 'orthogonal', lineStyle: 'solid', color: '#0284C7', strokeWidth: 2, arrowStart: 'none', arrowEnd: 'arrow' },
    { id: 'nc2', fromId: 'n_fw', toId: 'n_sw', fromPort: 'right', toPort: 'left', label: 'Trunk', routing: 'orthogonal', lineStyle: 'solid', color: '#DC2626', strokeWidth: 2, arrowStart: 'none', arrowEnd: 'arrow' },
    { id: 'nc3', fromId: 'n_sw', toId: 'n_srv', fromPort: 'right', toPort: 'left', label: '10GbE', routing: 'orthogonal', lineStyle: 'solid', color: '#0D9488', strokeWidth: 1.75, arrowStart: 'none', arrowEnd: 'arrow' },
    { id: 'nc4', fromId: 'n_sw', toId: 'n_ap', fromPort: 'right', toPort: 'left', label: 'PoE++', routing: 'orthogonal', lineStyle: 'dashed', color: '#16A34A', strokeWidth: 1.75, arrowStart: 'none', arrowEnd: 'arrow' },
  ];
  return doc;
}

export function createOrgChartTemplate(): DiagramDocument {
  const doc = baseDoc('orgchart', 'Product & Engineering Org', 'Organization');
  doc.tags = ['orgchart', 'team'];
  doc.objects = [
    { id: 'o1', type: 'org-exec', category: 'shape', label: 'Elena Rostova', x: 350, y: 64, width: 204, height: 76, rotation: 0, layerId: 'layer-main', zIndex: 1, visible: true, locked: false, style: { fill: '#1E293B', stroke: '#0F172A', strokeWidth: 1.5, textColor: '#F8FAFC', fontSize: 13, borderRadius: 10, opacity: 1, shadow: true }, metadata: { subtitle: 'VP of Engineering' } },
    { id: 'o2', type: 'org-manager', category: 'shape', label: 'Marcus Vance', x: 130, y: 200, width: 196, height: 74, rotation: 0, layerId: 'layer-main', zIndex: 2, visible: true, locked: false, style: { fill: '#EFF6FF', stroke: '#2563EB', strokeWidth: 1.5, textColor: '#1E3A8A', fontSize: 13, borderRadius: 10, opacity: 1, shadow: true }, metadata: { subtitle: 'Director, Core Platform' } },
    { id: 'o3', type: 'org-manager', category: 'shape', label: 'Priya Nair', x: 570, y: 200, width: 196, height: 74, rotation: 0, layerId: 'layer-main', zIndex: 3, visible: true, locked: false, style: { fill: '#EFF6FF', stroke: '#2563EB', strokeWidth: 1.5, textColor: '#1E3A8A', fontSize: 13, borderRadius: 10, opacity: 1, shadow: true }, metadata: { subtitle: 'Director, Design Systems' } },
    { id: 'o4', type: 'org-member', category: 'shape', label: 'David Chen', x: 40, y: 336, width: 176, height: 70, rotation: 0, layerId: 'layer-main', zIndex: 4, visible: true, locked: false, style: { fill: '#FFFFFF', stroke: '#94A3B8', strokeWidth: 1.5, textColor: '#0F172A', fontSize: 13, borderRadius: 10, opacity: 1, shadow: true }, metadata: { subtitle: 'Staff Canvas Engineer' } },
    { id: 'o5', type: 'org-member', category: 'shape', label: 'Hannah Lindqvist', x: 236, y: 336, width: 176, height: 70, rotation: 0, layerId: 'layer-main', zIndex: 5, visible: true, locked: false, style: { fill: '#FFFFFF', stroke: '#94A3B8', strokeWidth: 1.5, textColor: '#0F172A', fontSize: 13, borderRadius: 10, opacity: 1, shadow: true }, metadata: { subtitle: 'Distributed Systems' } },
    { id: 'o6', type: 'org-member', category: 'shape', label: 'Samira Al-Mansoor', x: 580, y: 336, width: 176, height: 70, rotation: 0, layerId: 'layer-main', zIndex: 6, visible: true, locked: false, style: { fill: '#FFFFFF', stroke: '#94A3B8', strokeWidth: 1.5, textColor: '#0F172A', fontSize: 13, borderRadius: 10, opacity: 1, shadow: true }, metadata: { subtitle: 'Principal UX Architect' } },
  ];
  doc.connections = [
    { id: 'oc1', fromId: 'o1', toId: 'o2', fromPort: 'bottom', toPort: 'top', routing: 'orthogonal', lineStyle: 'solid', color: '#64748B', strokeWidth: 1.5, arrowStart: 'none', arrowEnd: 'none' },
    { id: 'oc2', fromId: 'o1', toId: 'o3', fromPort: 'bottom', toPort: 'top', routing: 'orthogonal', lineStyle: 'solid', color: '#64748B', strokeWidth: 1.5, arrowStart: 'none', arrowEnd: 'none' },
    { id: 'oc3', fromId: 'o2', toId: 'o4', fromPort: 'bottom', toPort: 'top', routing: 'orthogonal', lineStyle: 'solid', color: '#94A3B8', strokeWidth: 1.5, arrowStart: 'none', arrowEnd: 'none' },
    { id: 'oc4', fromId: 'o2', toId: 'o5', fromPort: 'bottom', toPort: 'top', routing: 'orthogonal', lineStyle: 'solid', color: '#94A3B8', strokeWidth: 1.5, arrowStart: 'none', arrowEnd: 'none' },
    { id: 'oc5', fromId: 'o3', toId: 'o6', fromPort: 'bottom', toPort: 'top', routing: 'orthogonal', lineStyle: 'solid', color: '#94A3B8', strokeWidth: 1.5, arrowStart: 'none', arrowEnd: 'none' },
  ];
  return doc;
}

export function createJourneyTemplate(): DiagramDocument {
  const doc = baseDoc('journey', 'First-Time Creator Journey', 'Product Design');
  doc.tags = ['journey', 'ux', 'onboarding'];
  doc.objects = [
    { id: 'j1', type: 'journey-stage', category: 'shape', label: '01. Discovery', x: 80, y: 70, width: 200, height: 56, rotation: 0, layerId: 'layer-main', zIndex: 1, visible: true, locked: false, style: { fill: '#1E293B', stroke: '#0F172A', strokeWidth: 1.5, textColor: '#FFFFFF', fontSize: 13, borderRadius: 8, opacity: 1, shadow: true }, metadata: { subtitle: 'Landing & Welcome' } },
    { id: 'j2', type: 'journey-stage', category: 'shape', label: '02. First Diagram', x: 330, y: 70, width: 200, height: 56, rotation: 0, layerId: 'layer-main', zIndex: 2, visible: true, locked: false, style: { fill: '#1E293B', stroke: '#0F172A', strokeWidth: 1.5, textColor: '#FFFFFF', fontSize: 13, borderRadius: 8, opacity: 1, shadow: true }, metadata: { subtitle: 'Direct Creation' } },
    { id: 'j3', type: 'journey-stage', category: 'shape', label: '03. Export & Share', x: 580, y: 70, width: 200, height: 56, rotation: 0, layerId: 'layer-main', zIndex: 3, visible: true, locked: false, style: { fill: '#1E293B', stroke: '#0F172A', strokeWidth: 1.5, textColor: '#FFFFFF', fontSize: 13, borderRadius: 8, opacity: 1, shadow: true }, metadata: { subtitle: 'Team Review' } },
    { id: 'j4', type: 'journey-action', category: 'shape', label: 'Picks Sequence Template', x: 80, y: 164, width: 200, height: 76, rotation: 0, layerId: 'layer-main', zIndex: 4, visible: true, locked: false, style: { fill: '#FFFFFF', stroke: '#2563EB', strokeWidth: 1.5, textColor: '#0F172A', fontSize: 13, borderRadius: 10, opacity: 1, shadow: true }, metadata: { subtitle: 'One-click start' } },
    { id: 'j5', type: 'journey-action', category: 'shape', label: 'Drags Lifelines & Calls', x: 330, y: 164, width: 200, height: 76, rotation: 0, layerId: 'layer-main', zIndex: 5, visible: true, locked: false, style: { fill: '#FFFFFF', stroke: '#2563EB', strokeWidth: 1.5, textColor: '#0F172A', fontSize: 13, borderRadius: 10, opacity: 1, shadow: true }, metadata: { subtitle: 'Inline editing' } },
    { id: 'j6', type: 'journey-opportunity', category: 'shape', label: 'Exports Crisp SVG Deck', x: 580, y: 164, width: 200, height: 76, rotation: 0, layerId: 'layer-main', zIndex: 6, visible: true, locked: false, style: { fill: '#ECFDF5', stroke: '#16A34A', strokeWidth: 1.5, textColor: '#14532D', fontSize: 13, borderRadius: 10, opacity: 1, shadow: true }, metadata: { subtitle: 'Zero manual cleanup' } },
  ];
  doc.connections = [
    { id: 'jc1', fromId: 'j1', toId: 'j2', fromPort: 'right', toPort: 'left', routing: 'straight', lineStyle: 'solid', color: '#94A3B8', strokeWidth: 1.5, arrowStart: 'none', arrowEnd: 'arrow' },
    { id: 'jc2', fromId: 'j2', toId: 'j3', fromPort: 'right', toPort: 'left', routing: 'straight', lineStyle: 'solid', color: '#94A3B8', strokeWidth: 1.5, arrowStart: 'none', arrowEnd: 'arrow' },
    { id: 'jc3', fromId: 'j4', toId: 'j5', fromPort: 'right', toPort: 'left', routing: 'curved', lineStyle: 'solid', color: '#2563EB', strokeWidth: 1.75, arrowStart: 'none', arrowEnd: 'arrow' },
    { id: 'jc4', fromId: 'j5', toId: 'j6', fromPort: 'right', toPort: 'left', routing: 'curved', lineStyle: 'solid', color: '#16A34A', strokeWidth: 1.75, arrowStart: 'none', arrowEnd: 'arrow' },
  ];
  return doc;
}

export function createWhiteboardTemplate(): DiagramDocument {
  const doc = baseDoc('whiteboard', 'Q4 Architecture Brainstorm', 'Product Design');
  doc.tags = ['whiteboard', 'ideation'];
  doc.objects = [
    { id: 'wb1', type: 'sticky', category: 'annotation', label: 'Reduce p99 API latency below 120ms', x: 120, y: 120, width: 190, height: 130, rotation: -1, layerId: 'layer-main', zIndex: 1, visible: true, locked: false, style: { fill: '#FEF9C3', stroke: '#EAB308', strokeWidth: 1.5, textColor: '#713F12', fontSize: 13, borderRadius: 4, opacity: 1, shadow: true }, metadata: {} },
    { id: 'wb2', type: 'sticky', category: 'annotation', label: 'Introduce edge caching for static catalog reads', x: 350, y: 124, width: 190, height: 130, rotation: 1, layerId: 'layer-main', zIndex: 2, visible: true, locked: false, style: { fill: '#E0F2FE', stroke: '#0284C7', strokeWidth: 1.5, textColor: '#0C4A6E', fontSize: 13, borderRadius: 4, opacity: 1, shadow: true }, metadata: {} },
    { id: 'wb3', type: 'sticky', category: 'annotation', label: 'Ship keyboard-first diagram outline view', x: 580, y: 120, width: 190, height: 130, rotation: 0, layerId: 'layer-main', zIndex: 3, visible: true, locked: false, style: { fill: '#DCFCE7', stroke: '#16A34A', strokeWidth: 1.5, textColor: '#14532D', fontSize: 13, borderRadius: 4, opacity: 1, shadow: true }, metadata: {} },
  ];
  doc.connections = [
    { id: 'wc1', fromId: 'wb1', toId: 'wb2', fromPort: 'right', toPort: 'left', label: 'mitigated by', routing: 'curved', lineStyle: 'dashed', color: '#64748B', strokeWidth: 1.5, arrowStart: 'none', arrowEnd: 'arrow' },
  ];
  return doc;
}

export const BUILTIN_TEMPLATES: CustomTemplate[] = [
  {
    id: 'tpl-seq-oauth',
    name: 'OAuth 2.0 Login Call Flow',
    description: 'Interactive 5-participant sequence with JWT exchange, SQL lookup, and alt fragment.',
    category: 'sequence',
    popular: true,
    createDocument: createOAuthSequenceTemplate,
  },
  {
    id: 'tpl-arch-cloud',
    name: 'Cloud Platform Architecture',
    description: 'Multi-AZ VPC with React SPA, Envoy Gateway, Identity Service, Redis, and PostgreSQL.',
    category: 'architecture',
    popular: true,
    createDocument: createCloudArchTemplate,
  },
  {
    id: 'tpl-fc-approval',
    name: 'Purchase Approval Workflow',
    description: 'Decision-branched procurement process with automatic escalation and ERP logging.',
    category: 'flowchart',
    popular: true,
    createDocument: createApprovalFlowTemplate,
  },
  {
    id: 'tpl-fp-office',
    name: 'Design Studio Open Office',
    description: 'Measured 12m × 7.5m floor plan with auto-detected rooms, boardroom, doors, and desks.',
    category: 'floorplan',
    popular: true,
    createDocument: createOfficeFloorPlanTemplate,
  },
  {
    id: 'tpl-erd-saas',
    name: 'SaaS Core Data Schema',
    description: 'Organizations, users, and diagrams tables with PK/FK attributes and 1:N cardinality.',
    category: 'erd',
    createDocument: createErdSaaSTemplate,
  },
  {
    id: 'tpl-net-branch',
    name: 'Enterprise Branch Network',
    description: 'Fiber WAN, HA firewall, core L3 switch, VLAN 20 subnet, cluster node, and Wi-Fi 7 AP.',
    category: 'network',
    createDocument: createNetworkTemplate,
  },
  {
    id: 'tpl-org-eng',
    name: 'Product & Engineering Org',
    description: 'Clean executive-to-staff reporting hierarchy ready for team planning.',
    category: 'orgchart',
    createDocument: createOrgChartTemplate,
  },
  {
    id: 'tpl-journey-creator',
    name: 'First-Time Creator Journey',
    description: 'Three-stage user journey mapping actions, touchpoints, and product opportunities.',
    category: 'journey',
    createDocument: createJourneyTemplate,
  },
  {
    id: 'tpl-wb-brainstorm',
    name: 'Q4 Architecture Brainstorm',
    description: 'Freeform ideation board with color-coded sticky notes and relationship threads.',
    category: 'whiteboard',
    createDocument: createWhiteboardTemplate,
  },
];

export function createSeedDiagrams(): DiagramDocument[] {
  return [
    createOAuthSequenceTemplate(),
    createCloudArchTemplate(),
    createApprovalFlowTemplate(),
    createOfficeFloorPlanTemplate(),
  ];
}
