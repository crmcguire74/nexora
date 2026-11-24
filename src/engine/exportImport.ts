import { DiagramDocument, SequenceMessage, SequenceParticipant } from '../types/diagram';
import { applyAutoLayout } from './layout';
import { makeId } from './templates';

export function exportDocumentJSON(doc: DiagramDocument): string {
  return JSON.stringify(doc, null, 2);
}

export function downloadFile(filename: string, content: string | Blob, mimeType?: string): void {
  const blob =
    content instanceof Blob ? content : new Blob([content], { type: mimeType ?? 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportSvgElementToSvgString(
  svgEl: SVGSVGElement,
  options: { background: string | 'transparent'; padding?: number }
): string {
  const clone = svgEl.cloneNode(true) as SVGSVGElement;

  // Remove interactive-only overlays marked with data-export-ignore="true"
  clone.querySelectorAll('[data-export-ignore="true"]').forEach((el) => el.remove());

  // Compute tight bounding box of the content group
  const contentGroup = svgEl.querySelector('[data-canvas-content="true"]') as SVGGElement | null;
  let minX = 0;
  let minY = 0;
  let width = 1200;
  let height = 800;

  if (contentGroup) {
    try {
      const bbox = contentGroup.getBBox();
      if (bbox.width > 1 && bbox.height > 1) {
        const pad = options.padding ?? 48;
        minX = bbox.x - pad;
        minY = bbox.y - pad;
        width = bbox.width + pad * 2;
        height = bbox.height + pad * 2;
      }
    } catch {
      // fallback to default bounds
    }
  }

  // Strip viewport transform on cloned content group so export is clean 1:1 vector coordinates
  const clonedContent = clone.querySelector('[data-canvas-content="true"]') as SVGGElement | null;
  if (clonedContent) {
    clonedContent.removeAttribute('transform');
  }

  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('viewBox', `${minX} ${minY} ${width} ${height}`);
  clone.setAttribute('width', `${Math.round(width)}`);
  clone.setAttribute('height', `${Math.round(height)}`);
  clone.style.fontFamily = '"DM Sans", -apple-system, BlinkMacSystemFont, sans-serif';

  if (options.background !== 'transparent') {
    const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bgRect.setAttribute('x', `${minX}`);
    bgRect.setAttribute('y', `${minY}`);
    bgRect.setAttribute('width', `${width}`);
    bgRect.setAttribute('height', `${height}`);
    bgRect.setAttribute('fill', options.background);
    clone.insertBefore(bgRect, clone.firstChild);
  }

  const serializer = new XMLSerializer();
  return `<?xml version="1.0" encoding="UTF-8"?>\n${serializer.serializeToString(clone)}`;
}

export async function exportSvgElementToPngBlob(
  svgEl: SVGSVGElement,
  options: { background: string | 'transparent'; scale?: number; padding?: number }
): Promise<Blob> {
  const svgStr = exportSvgElementToSvgString(svgEl, {
    background: options.background,
    padding: options.padding,
  });

  const parser = new DOMParser();
  const parsed = parser.parseFromString(svgStr, 'image/svg+xml');
  const root = parsed.documentElement;
  const width = Number(root.getAttribute('width') || 1200);
  const height = Number(root.getAttribute('height') || 800);
  const scale = options.scale ?? 2;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error('Canvas context unavailable'));
        return;
      }
      ctx.scale(scale, scale);
      if (options.background !== 'transparent') {
        ctx.fillStyle = options.background;
        ctx.fillRect(0, 0, width, height);
      }
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to encode PNG'));
      }, 'image/png');
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to render SVG to PNG'));
    };
    img.src = url;
  });
}

// ==========================================
// Mermaid Interoperability
// ==========================================

export function exportDocumentToMermaid(doc: DiagramDocument): string {
  if (doc.type === 'sequence' && doc.sequence) {
    const lines: string[] = ['sequenceDiagram'];
    const sortedP = [...doc.sequence.participants].sort((a, b) => a.order - b.order);
    const idToAlias = new Map<string, string>();
    sortedP.forEach((p, idx) => {
      const alias = `P${idx + 1}`;
      idToAlias.set(p.id, alias);
      const keyword = p.role === 'user' || p.role === 'actor' ? 'actor' : 'participant';
      lines.push(`    ${keyword} ${alias} as ${p.name}`);
    });
    const sortedM = [...doc.sequence.messages].sort((a, b) => a.order - b.order);
    for (const m of sortedM) {
      const from = idToAlias.get(m.fromId) ?? 'P1';
      const to = idToAlias.get(m.toId) ?? 'P1';
      const arrow =
        m.type === 'return'
          ? '-->>'
          : m.type === 'async' || m.type === 'event'
          ? '-)'
          : '->>';
      lines.push(`    ${from}${arrow}${to}: ${m.label}`);
    }
    return lines.join('\n');
  }

  const lines: string[] = ['flowchart TD'];
  const idToAlias = new Map<string, string>();
  doc.objects
    .filter((o) => o.category !== 'container')
    .forEach((o, idx) => {
      const alias = `N${idx + 1}`;
      idToAlias.set(o.id, alias);
      const safe = o.label.replace(/"/g, "'");
      if (o.type === 'decision') {
        lines.push(`    ${alias}{"${safe}"}`);
      } else if (o.type === 'start') {
        lines.push(`    ${alias}(["${safe}"])`);
      } else if (o.type === 'database' || o.type === 'arch-db') {
        lines.push(`    ${alias}[("${safe}")]`);
      } else {
        lines.push(`    ${alias}["${safe}"]`);
      }
    });

  for (const c of doc.connections) {
    const from = idToAlias.get(c.fromId);
    const to = idToAlias.get(c.toId);
    if (!from || !to) continue;
    const edge = c.lineStyle === 'dashed' ? '-.->' : '-->';
    if (c.label) {
      lines.push(`    ${from} ${edge}|"${c.label}"| ${to}`);
    } else {
      lines.push(`    ${from} ${edge} ${to}`);
    }
  }
  return lines.join('\n');
}

export function importFromMermaid(source: string, title = 'Imported Mermaid Diagram'): DiagramDocument {
  const lines = source
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('%%'));

  const now = new Date().toISOString();

  if (lines[0]?.toLowerCase().startsWith('sequencediagram')) {
    const participants: SequenceParticipant[] = [];
    const aliasToId = new Map<string, string>();
    const messages: SequenceMessage[] = [];
    const colors = ['#2563EB', '#0284C7', '#0D9488', '#475569', '#D97706', '#DC2626'];

    const ensureParticipant = (alias: string, label?: string, isActor = false): string => {
      const existing = aliasToId.get(alias);
      if (existing) return existing;
      const id = makeId('p');
      aliasToId.set(alias, id);
      participants.push({
        id,
        name: label || alias,
        role: isActor ? 'user' : 'microservice',
        color: colors[participants.length % colors.length],
        order: participants.length,
      });
      return id;
    };

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const partMatch = line.match(/^(participant|actor)\s+(\S+)(?:\s+as\s+(.+))?$/i);
      if (partMatch) {
        ensureParticipant(partMatch[2], partMatch[3]?.trim(), partMatch[1].toLowerCase() === 'actor');
        continue;
      }
      const msgMatch = line.match(/^(\S+?)\s*(-->>|->>|-->|->|-\)|--\))\s*(\S+?)\s*:\s*(.+)$/);
      if (msgMatch) {
        const [, fromAlias, arrow, toAlias, label] = msgMatch;
        const fromId = ensureParticipant(fromAlias);
        const toId = ensureParticipant(toAlias);
        const type =
          fromId === toId
            ? 'self'
            : arrow.startsWith('--')
            ? 'return'
            : arrow.endsWith(')')
            ? 'async'
            : 'sync';
        messages.push({
          id: makeId('m'),
          fromId,
          toId,
          label: label.trim(),
          type,
          order: messages.length,
          activateTarget: type === 'sync',
        });
      }
    }

    return {
      id: makeId('diag'),
      schemaVersion: 1,
      type: 'sequence',
      title,
      folder: 'Imports',
      tags: ['sequence', 'mermaid'],
      objects: [],
      connections: [],
      layers: [{ id: 'layer-main', name: 'Primary Layer', visible: true, locked: false }],
      sequence: {
        viewMode: 'modern',
        autoActivation: true,
        participantSpacing: 205,
        rowSpacing: 64,
        participants,
        messages,
        fragments: [],
        notes: [],
      },
      settings: {
        theme: 'modern',
        showGrid: true,
        snapToGrid: true,
        gridSize: 20,
        showSmartGuides: true,
      },
      createdAt: now,
      updatedAt: now,
    };
  }

  // Flowchart / graph parser
  const aliasToId = new Map<string, string>();
  const doc: DiagramDocument = {
    id: makeId('diag'),
    schemaVersion: 1,
    type: 'flowchart',
    title,
    folder: 'Imports',
    tags: ['flowchart', 'mermaid'],
    objects: [],
    connections: [],
    layers: [{ id: 'layer-main', name: 'Primary Layer', visible: true, locked: false }],
    settings: {
      theme: 'modern',
      showGrid: true,
      snapToGrid: true,
      gridSize: 20,
      showSmartGuides: true,
    },
    createdAt: now,
    updatedAt: now,
  };

  const ensureNode = (rawToken: string): string => {
    const token = rawToken.trim();
    const shapeMatch = token.match(/^([A-Za-z0-9_-]+)(?:\(\["?(.+?)"?\]\)|\[\("?(.+?)"?\)\]|\{"?(.+?)"?\}|\["?(.+?)"?\]|\("?(.+?)"?\))?$/);
    const alias = shapeMatch ? shapeMatch[1] : token;
    if (aliasToId.has(alias)) return aliasToId.get(alias)!;
    const id = makeId('obj');
    aliasToId.set(alias, id);
    let type = 'process';
    let label = alias;
    let fill = '#FFFFFF';
    let stroke = '#2563EB';
    let textColor = '#0F172A';
    let borderRadius = 10;
    let width = 168;
    let height = 66;

    if (shapeMatch) {
      if (shapeMatch[2]) {
        type = 'start';
        label = shapeMatch[2];
        fill = '#ECFDF5';
        stroke = '#16A34A';
        textColor = '#14532D';
        borderRadius = 27;
        height = 54;
      } else if (shapeMatch[3]) {
        type = 'database';
        label = shapeMatch[3];
        fill = '#F0FDFA';
        stroke = '#0D9488';
        textColor = '#134E4A';
        height = 80;
      } else if (shapeMatch[4]) {
        type = 'decision';
        label = shapeMatch[4];
        fill = '#FFFBEB';
        stroke = '#D97706';
        textColor = '#78350F';
        width = 152;
        height = 96;
      } else if (shapeMatch[5] || shapeMatch[6]) {
        label = shapeMatch[5] || shapeMatch[6];
      }
    }

    doc.objects.push({
      id,
      type,
      category: 'shape',
      label,
      x: 100,
      y: 100,
      width,
      height,
      rotation: 0,
      layerId: 'layer-main',
      zIndex: doc.objects.length + 1,
      visible: true,
      locked: false,
      style: {
        fill,
        stroke,
        strokeWidth: 1.5,
        textColor,
        fontSize: 13,
        borderRadius,
        opacity: 1,
        shadow: true,
      },
      metadata: {},
    });
    return id;
  };

  const isLR = /^flowchart\s+LR|^graph\s+LR/i.test(lines[0] ?? '');

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const edgeMatch = line.match(/^(.+?)\s*(-->|-\.->|==>)\s*(?:\|"?([^"|]+)"?\|)?\s*(.+)$/);
    if (edgeMatch) {
      const [, leftTok, arrow, edgeLabel, rightTok] = edgeMatch;
      const fromId = ensureNode(leftTok);
      const toId = ensureNode(rightTok);
      doc.connections.push({
        id: makeId('conn'),
        fromId,
        toId,
        fromPort: 'auto',
        toPort: 'auto',
        label: edgeLabel?.trim(),
        routing: 'orthogonal',
        lineStyle: arrow === '-.->' ? 'dashed' : 'solid',
        color: '#475569',
        strokeWidth: 1.75,
        arrowStart: 'none',
        arrowEnd: 'arrow',
      });
    } else if (/^[A-Za-z0-9_-]+[\[\(\{]/.test(line)) {
      ensureNode(line);
    }
  }

  return applyAutoLayout(doc, isLR ? 'LR' : 'TB');
}

export function importFromNativeJson(raw: string): DiagramDocument {
  const root = JSON.parse(raw) as Record<string, unknown>;
  const parsed = (
    root &&
    (root.format === 'nexora' || root.format === 'project-canvas') &&
    root.document &&
    typeof root.document === 'object'
      ? root.document
      : root
  ) as Partial<DiagramDocument>;
  if (!parsed || typeof parsed !== 'object' || !parsed.type) {
    throw new Error('Invalid Nexora (.nexora / .pcanvas / JSON) file: missing required diagram type.');
  }
  const now = new Date().toISOString();
  return {
    id: makeId('diag'),
    schemaVersion: parsed.schemaVersion ?? 1,
    type: parsed.type,
    title: parsed.title || 'Imported Diagram',
    folder: parsed.folder ?? 'Imports',
    tags: Array.isArray(parsed.tags) ? parsed.tags : [parsed.type],
    objects: Array.isArray(parsed.objects) ? parsed.objects : [],
    connections: Array.isArray(parsed.connections) ? parsed.connections : [],
    layers: Array.isArray(parsed.layers) && parsed.layers.length > 0
      ? parsed.layers
      : [{ id: 'layer-main', name: 'Primary Layer', visible: true, locked: false }],
    sequence: parsed.sequence,
    floorplan: parsed.floorplan,
    settings: {
      theme: parsed.settings?.theme ?? 'modern',
      showGrid: parsed.settings?.showGrid ?? true,
      snapToGrid: parsed.settings?.snapToGrid ?? true,
      gridSize: parsed.settings?.gridSize ?? 20,
      showSmartGuides: parsed.settings?.showSmartGuides ?? true,
    },
    createdAt: now,
    updatedAt: now,
  };
}
