import { DiagramDocument, DiagramType } from '../types/diagram';
import {
  DIAGRAM_TYPE_MAP,
  getLibraryForType,
  NEXORA_MODULE_MAP,
} from './libraries';
import { serializePCanvasFile } from './pcanvasFile';
import {
  createApprovalFlowTemplate,
  createCloudArchTemplate,
  createErdSaaSTemplate,
  createJourneyTemplate,
  createNetworkTemplate,
  createOAuthSequenceTemplate,
  createOfficeFloorPlanTemplate,
  createOrgChartTemplate,
  createWhiteboardTemplate,
} from './templates';

const ORDERED_DESIGN_TYPES: Array<{
  type: DiagramType;
  builder: () => DiagramDocument;
  guidance: string;
}> = [
  {
    type: 'flowchart',
    builder: createApprovalFlowTemplate,
    guidance:
      'Use `objects` + `connections` in pixel coordinates. Include `start` and `end` nodes, label outgoing decision branches (e.g. "Yes" / "No"), and optionally group phases inside `swimlane` containers (`category: "container"`).',
  },
  {
    type: 'architecture',
    builder: createCloudArchTemplate,
    guidance:
      'Use icon-native `arch-*` node types inside `objects` + `connections`. Group cloud tiers inside `arch-container` boundaries (`category: "container"`, `metadata.isContainer: true`) and set `parentId` on child nodes. Annotate connections with `protocol` (HTTPS, REST, gRPC, SQL, Cache, Event, Auth).',
  },
  {
    type: 'sequence',
    builder: createOAuthSequenceTemplate,
    guidance:
      'Populate the `sequence` property (leave `objects` and `connections` as empty arrays `[]`). Define ordered `participants` (`order: 0, 1, 2...`), ordered `messages` (`order: 0, 1, 2...`, types `sync | async | return | self | create | destroy | event`), optional `fragments` (`alt | opt | loop | par | break | critical | ref`), and optional `notes`.',
  },
  {
    type: 'floorplan',
    builder: createOfficeFloorPlanTemplate,
    guidance:
      'Populate the `floorplan` property (leave `objects` and `connections` as empty arrays `[]`). ALL geometry (`walls`, `openings.width`, `rooms.polygon`, `furniture.x/y/width/depth`) is canonically stored in **meters** regardless of display `unit` (`"ft-in" | "ft" | "m" | "cm" | "mm"`). Connect walls at matching `(x, y)` coordinates to form enclosed spaces.',
  },
  {
    type: 'network',
    builder: createNetworkTemplate,
    guidance:
      'Use `net-*` node types in `objects` + `connections`. Wrap VLANs or network zones inside `net-subnet` containers (`category: "container"`). Include CIDR blocks or link speeds in `metadata.subtitle` and connection `label`s.',
  },
  {
    type: 'erd',
    builder: createErdSaaSTemplate,
    guidance:
      'Use `type: "erd-entity"`, `category: "entity"` for each table. Define columns inside `metadata.fields` with `{ id, name, type, key: "PK" | "FK" | "" }`. Use `arrowStart` / `arrowEnd` with `"crow"` or `"none"` and set relationship cardinality in `label` (e.g. `"1:N"`, `"1:1"`, `"N:M"`).',
  },
  {
    type: 'orgchart',
    builder: createOrgChartTemplate,
    guidance:
      'Use `org-exec`, `org-manager`, `org-member`, and `org-team` nodes in `objects` arranged top-down. Place job titles in `metadata.subtitle` and connect reporting lines with `fromPort: "bottom"`, `toPort: "top"`, `routing: "orthogonal"`.',
  },
  {
    type: 'journey',
    builder: createJourneyTemplate,
    guidance:
      'Arrange `journey-stage` header columns left-to-right, then align `journey-action`, `journey-touchpoint`, `journey-pain`, and `journey-opportunity` cards beneath each stage. Optionally set `metadata.emotion` to `"delighted" | "positive" | "neutral" | "frustrated"`.',
  },
  {
    type: 'whiteboard',
    builder: createWhiteboardTemplate,
    guidance:
      'Combine `sticky`, `callout`, `text-note`, `frame`, and standard shape nodes in `objects` with curved/dashed `connections`. Freehand strokes use `category: "freehand"` with `metadata.points: [{ x, y }, ...]`.',
  },
];

function formatLibraryCatalogMarkdown(type: DiagramType): string {
  const items = getLibraryForType(type);
  if (items.length === 0) return '_No library items defined._';

  const rows = items.map((it) => {
    const extra: string[] = [];
    if (it.participantRole) extra.push(`role: \`${it.participantRole}\``);
    if (it.floorItemKind) extra.push(`floorKind: \`${it.floorItemKind}\``);
    if (it.realWidthM && it.realDepthM) extra.push(`size: ${it.realWidthM}m × ${it.realDepthM}m`);
    else extra.push(`size: ${it.defaultWidth}×${it.defaultHeight}px`);
    return `| \`${it.type}\` | ${it.label} | \`${it.category}\` | ${it.section} | ${extra.join(', ')} |`;
  });

  return [
    '| `type` | Label | `category` | Section | Defaults / Hints |',
    '| :--- | :--- | :--- | :--- | :--- |',
    ...rows,
  ].join('\n');
}

export function buildNexoraAiSchemaGuide(): string {
  const generatedAt = new Date().toISOString();

  const sections = ORDERED_DESIGN_TYPES.map(({ type, builder, guidance }, index) => {
    const typeMeta = DIAGRAM_TYPE_MAP[type];
    const moduleMeta = NEXORA_MODULE_MAP[typeMeta.module];
    const sampleDoc = builder();
    const fullEnvelopeJson = serializePCanvasFile(sampleDoc);

    return [
      `## ${index + 1}. ${typeMeta.name} (\`type: "${type}"\`)`,
      '',
      `- **Module:** ${moduleMeta.name} (${moduleMeta.subtitle})`,
      `- **Document \`type\`:** \`"${type}"\``,
      `- **Purpose:** ${typeMeta.description}`,
      `- **Authoring Rules:** ${guidance}`,
      '',
      `### Allowed Component Types for \`${type}\``,
      '',
      formatLibraryCatalogMarkdown(type),
      '',
      `### Complete Extensive \`.nexora\` Example — ${typeMeta.name}`,
      '',
      '```json',
      fullEnvelopeJson,
      '```',
      '',
    ].join('\n');
  });

  return [
    '# Nexora Visual Workspace — AI Chat Engine Design Schema & Reference Guide',
    '',
    `> Generated by Nexora on ${generatedAt}. Upload this file directly to any AI chat engine (ChatGPT, Claude, Gemini, etc.) so it can generate valid, ready-to-import \`.nexora\` design files for every Nexora diagram type.`,
    '',
    '---',
    '',
    '## Instructions for AI Chat Engines',
    '',
    'When a user uploads this document and asks you to create a diagram, flowchart, architecture, network topology, ERD, org chart, user journey, whiteboard, sequence/call flow, or architectural floor plan for **Nexora**:',
    '',
    '1. **Output Format:** Return a single, strictly valid JSON document wrapped in the exact `.nexora` file envelope shown below. Instruct the user to save it with a `.nexora` extension (e.g., `my-design.nexora`) or provide it as a downloadable `.nexora` file.',
    '2. **No Comments or Trailing Commas:** Standard RFC 8259 JSON only. Do not include `//` comments, ellipsis (`...`), or markdown inside the JSON.',
    '3. **Unique IDs:** Every object, connection, participant, message, wall, opening, room, furniture item, and field must have a unique string `id` (e.g., `"obj_1"`, `"conn_1"`, `"p_1"`, `"w_1"`).',
    '4. **Valid References:** Every `connection.fromId` / `connection.toId`, `message.fromId` / `message.toId`, `opening.wallId`, and `object.parentId` MUST reference an existing `id` in the same document.',
    '5. **Coordinate System:**',
    '   - Standard diagrams (`flowchart`, `architecture`, `network`, `erd`, `orgchart`, `journey`, `whiteboard`): Canvas coordinates in **pixels (`px`)**. Keep nodes generously spaced (at least 60–100px gaps) so connectors route cleanly without overlapping.',
    '   - Floor plans (`floorplan`): All coordinates (`walls`, `rooms.polygon`, `furniture.x/y/width/depth`, `openings.width`) are strictly in **meters**, regardless of whether `floorplan.unit` is `"ft-in"`, `"ft"`, `"m"`, `"cm"`, or `"mm"`.',
    '   - Sequence diagrams (`sequence`): Layout is auto-computed from `participants[].order` (0-based left-to-right) and `messages[].order` (0-based top-to-bottom).',
    '6. **Use Valid Component Types:** Choose `object.type`, `participant.role`, `opening.kind`, and `furniture.type` strictly from the per-diagram tables below so Nexora renders native vector icons and domain behaviors.',
    '',
    '---',
    '',
    '## Top-Level `.nexora` File Envelope',
    '',
    '```json',
    '{',
    '  "format": "nexora",',
    '  "formatVersion": 1,',
    '  "extension": ".nexora",',
    '  "savedAt": "2026-01-01T00:00:00.000Z",',
    '  "document": {',
    '    "id": "diag_unique_id",',
    '    "schemaVersion": 1,',
    '    "type": "flowchart | architecture | sequence | floorplan | network | erd | orgchart | journey | whiteboard",',
    '    "title": "Human-readable diagram title",',
    '    "folder": "Engineering",',
    '    "tags": ["tag1", "tag2"],',
    '    "objects": [],',
    '    "connections": [],',
    '    "layers": [{ "id": "layer-main", "name": "Primary Layer", "visible": true, "locked": false }],',
    '    "settings": {',
    '      "theme": "modern",',
    '      "showGrid": true,',
    '      "snapToGrid": true,',
    '      "gridSize": 20,',
    '      "showSmartGuides": true,',
    '      "activeEnvironment": "all"',
    '    },',
    '    "snapshots": [],',
    '    "createdAt": "2026-01-01T00:00:00.000Z",',
    '    "updatedAt": "2026-01-01T00:00:00.000Z"',
    '  }',
    '}',
    '```',
    '',
    '### Shared Enum Values',
    '',
    '- **`settings.theme`**: `"minimal" | "modern" | "technical" | "presentation" | "blueprint"`',
    '- **`connection.fromPort` / `toPort`**: `"top" | "right" | "bottom" | "left" | "auto"`',
    '- **`connection.routing`**: `"orthogonal" | "curved" | "straight"`',
    '- **`connection.lineStyle`**: `"solid" | "dashed" | "dotted"`',
    '- **`connection.arrowStart`**: `"none" | "arrow" | "diamond" | "crow"`',
    '- **`connection.arrowEnd`**: `"none" | "arrow" | "open" | "diamond" | "crow"`',
    '- **`sequence.viewMode`**: `"modern" | "classic"`',
    '- **`sequence.participants[].role`**: `"actor" | "user" | "browser" | "mobile" | "web-ui" | "api" | "microservice" | "auth" | "event-bus" | "queue" | "cache" | "database" | "cloud" | "external"`',
    '- **`sequence.messages[].type`**: `"sync" | "async" | "return" | "self" | "create" | "destroy" | "event"`',
    '- **`sequence.fragments[].kind`**: `"alt" | "opt" | "loop" | "par" | "break" | "critical" | "ref"`',
    '- **`floorplan.unit`**: `"ft-in" | "ft" | "m" | "cm" | "mm"` (US Imperial: `"ft-in"` / `"ft"`; Metric: `"m"` / `"cm"` / `"mm"`)',
    '- **`floorplan.walls[].kind`**: `"exterior" | "interior"` (typical thickness: `0.22` m exterior, `0.14` m interior)',
    '- **`floorplan.openings[].kind`**: `"door" | "double-door" | "sliding-door" | "window"`',
    '- **`floorplan.rooms[].floorMaterial`**: `"hardwood" | "carpet" | "tile" | "concrete" | "marble"`',
    '',
    '---',
    '',
    ...sections,
    '---',
    '',
    '## Example Prompt to Give Your AI Chat Engine',
    '',
    '> "Using the uploaded `nexora-ai-design-schema.md` specification, generate a complete, valid `.nexora` JSON file for a **[flowchart / cloud architecture / sequence call flow / 2-bedroom home floor plan / SaaS ERD / network topology / org chart / user journey]** describing **[your scenario]**. Ensure all IDs, coordinates, object types, and connections strictly conform to the Nexora schema."',
    '',
  ].join('\n');
}

export function downloadNexoraAiSchemaGuide(): { fileName: string; byteSize: number } {
  const content = buildNexoraAiSchemaGuide();
  const fileName = 'nexora-ai-design-schema.md';
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  return { fileName, byteSize: blob.size };
}
