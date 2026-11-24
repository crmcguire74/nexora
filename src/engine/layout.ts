import { DiagramDocument, DiagramObject, ValidationIssue } from '../types/diagram';

export type LayoutDirection = 'LR' | 'TB' | 'GRID';

/**
 * Deterministic, undo-friendly auto-layout for graph-based diagrams.
 * Preserves containers by laying out top-level items cleanly and keeping children aligned.
 */
export function applyAutoLayout(
  doc: DiagramDocument,
  direction: LayoutDirection,
  subsetIds?: string[]
): DiagramDocument {
  const targetObjects = doc.objects.filter(
    (o) =>
      o.category !== 'container' &&
      o.category !== 'freehand' &&
      (!subsetIds || subsetIds.length === 0 || subsetIds.includes(o.id))
  );

  if (targetObjects.length === 0) return doc;

  const idSet = new Set(targetObjects.map((o) => o.id));
  const objectMap = new Map(doc.objects.map((o) => [o.id, { ...o }]));

  if (direction === 'GRID') {
    const cols = Math.max(2, Math.ceil(Math.sqrt(targetObjects.length)));
    const startX = 120;
    const startY = 120;
    const cellW = 240;
    const cellH = 140;
    targetObjects.forEach((obj, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const updated = objectMap.get(obj.id);
      if (updated) {
        updated.x = startX + col * cellW;
        updated.y = startY + row * cellH;
      }
    });
  } else {
    // Topological layering (BFS from roots / lowest in-degree)
    const inDegree = new Map<string, number>();
    const outgoing = new Map<string, string[]>();
    for (const obj of targetObjects) {
      inDegree.set(obj.id, 0);
      outgoing.set(obj.id, []);
    }
    for (const conn of doc.connections) {
      if (idSet.has(conn.fromId) && idSet.has(conn.toId) && conn.fromId !== conn.toId) {
        outgoing.get(conn.fromId)!.push(conn.toId);
        inDegree.set(conn.toId, (inDegree.get(conn.toId) ?? 0) + 1);
      }
    }

    const rank = new Map<string, number>();
    const queue: string[] = [];
    for (const [id, deg] of inDegree.entries()) {
      if (deg === 0) {
        queue.push(id);
        rank.set(id, 0);
      }
    }
    if (queue.length === 0 && targetObjects.length > 0) {
      queue.push(targetObjects[0].id);
      rank.set(targetObjects[0].id, 0);
    }

    const visited = new Set<string>(queue);
    while (queue.length > 0) {
      const curr = queue.shift()!;
      const currRank = rank.get(curr) ?? 0;
      for (const next of outgoing.get(curr) ?? []) {
        const nextRank = Math.max(rank.get(next) ?? 0, currRank + 1);
        rank.set(next, nextRank);
        if (!visited.has(next)) {
          visited.add(next);
          queue.push(next);
        }
      }
    }

    // Assign any disconnected nodes to rank 0 or maxRank + 1
    for (const obj of targetObjects) {
      if (!rank.has(obj.id)) {
        rank.set(obj.id, 0);
      }
    }

    const layers = new Map<number, DiagramObject[]>();
    for (const obj of targetObjects) {
      const r = rank.get(obj.id) ?? 0;
      const list = layers.get(r) ?? [];
      list.push(obj);
      layers.set(r, list);
    }

    const sortedRanks = Array.from(layers.keys()).sort((a, b) => a - b);
    const gapMain = direction === 'LR' ? 260 : 152;
    const gapCross = direction === 'LR' ? 136 : 240;

    let maxCrossCount = 1;
    for (const r of sortedRanks) {
      maxCrossCount = Math.max(maxCrossCount, layers.get(r)!.length);
    }

    sortedRanks.forEach((r, layerIdx) => {
      const nodes = layers.get(r)!;
      const totalCross = (nodes.length - 1) * gapCross;
      const centerOffset = ((maxCrossCount - 1) * gapCross - totalCross) / 2;

      nodes.forEach((node, idx) => {
        const updated = objectMap.get(node.id);
        if (!updated) return;
        if (direction === 'LR') {
          updated.x = Math.round(110 + layerIdx * gapMain);
          updated.y = Math.round(110 + centerOffset + idx * gapCross + (80 - updated.height) / 2);
        } else {
          updated.x = Math.round(110 + centerOffset + idx * gapCross + (180 - updated.width) / 2);
          updated.y = Math.round(90 + layerIdx * gapMain);
        }
      });
    });
  }

  // Fit containers neatly around their children
  for (const obj of objectMap.values()) {
    if (obj.category === 'container') {
      const children = Array.from(objectMap.values()).filter((c) => c.parentId === obj.id);
      if (children.length > 0) {
        const minX = Math.min(...children.map((c) => c.x));
        const minY = Math.min(...children.map((c) => c.y));
        const maxX = Math.max(...children.map((c) => c.x + c.width));
        const maxY = Math.max(...children.map((c) => c.y + c.height));
        obj.x = minX - 36;
        obj.y = minY - 56;
        obj.width = Math.max(240, maxX - minX + 72);
        obj.height = Math.max(160, maxY - minY + 92);
      }
    }
  }

  return {
    ...doc,
    objects: doc.objects.map((o) => objectMap.get(o.id) ?? o),
    updatedAt: new Date().toISOString(),
  };
}

export function validateDiagram(doc: DiagramDocument): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (doc.type === 'flowchart') {
    const flowNodes = doc.objects.filter(
      (o) => o.category === 'shape' && o.type !== 'note'
    );
    const hasStart = flowNodes.some((n) => n.type === 'start');
    if (flowNodes.length > 0 && !hasStart) {
      issues.push({
        id: 'val-no-start',
        severity: 'warning',
        message: 'No Start/End terminator node found in this flowchart.',
      });
    }

    for (const node of flowNodes) {
      const incoming = doc.connections.filter((c) => c.toId === node.id);
      const outgoing = doc.connections.filter((c) => c.fromId === node.id);
      if (flowNodes.length > 1 && incoming.length === 0 && outgoing.length === 0) {
        issues.push({
          id: `val-disc-${node.id}`,
          severity: 'warning',
          message: `"${node.label}" is disconnected from the flow.`,
          objectId: node.id,
        });
      }
      if (node.type === 'decision') {
        if (outgoing.length < 2) {
          issues.push({
            id: `val-dec-branch-${node.id}`,
            severity: 'info',
            message: `Decision "${node.label}" has fewer than two outgoing branches.`,
            objectId: node.id,
          });
        }
        const unlabeled = outgoing.filter((c) => !c.label || c.label.trim() === '');
        if (unlabeled.length > 0) {
          issues.push({
            id: `val-dec-label-${node.id}`,
            severity: 'warning',
            message: `Decision "${node.label}" has an unlabeled outgoing branch.`,
            objectId: node.id,
          });
        }
      }
    }
  } else if (doc.type === 'architecture') {
    const nodes = doc.objects.filter((o) => o.category === 'shape');
    for (const node of nodes) {
      const hasEdge = doc.connections.some((c) => c.fromId === node.id || c.toId === node.id);
      if (nodes.length > 1 && !hasEdge) {
        issues.push({
          id: `val-arch-iso-${node.id}`,
          severity: 'info',
          message: `Component "${node.label}" has no documented connections.`,
          objectId: node.id,
        });
      }
    }
  } else if (doc.type === 'sequence' && doc.sequence) {
    const usedIds = new Set<string>();
    for (const m of doc.sequence.messages) {
      usedIds.add(m.fromId);
      usedIds.add(m.toId);
    }
    for (const p of doc.sequence.participants) {
      if (doc.sequence.messages.length > 0 && !usedIds.has(p.id)) {
        issues.push({
          id: `val-seq-unused-${p.id}`,
          severity: 'info',
          message: `Participant "${p.name}" has no incoming or outgoing messages.`,
        });
      }
    }
  }

  return issues;
}
