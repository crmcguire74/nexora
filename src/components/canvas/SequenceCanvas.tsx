import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  DiagramDocument,
  SequenceMessage,
  SequenceParticipant,
  ViewportState,
} from '../../types/diagram';
import { DIAGRAM_THEMES } from '../../engine/themes';
import { LibraryItem } from '../../engine/libraries';
import { makeId } from '../../engine/templates';
import { SequenceRoleIconPaths } from '../icons/ShapeIcons';

interface SequenceCanvasProps {
  doc: DiagramDocument;
  darkMode: boolean;
  viewport: ViewportState;
  onViewportChange: (vp: ViewportState) => void;
  selectedParticipantIds: string[];
  selectedMessageIds: string[];
  selectedFragmentId: string | null;
  onSelectParticipants: (ids: string[]) => void;
  onSelectMessages: (ids: string[]) => void;
  onSelectFragment: (id: string | null) => void;
  onUpdateDoc: (next: DiagramDocument, recordHistory?: boolean) => void;
  readOnly?: boolean;
  svgRef: React.RefObject<SVGSVGElement | null>;
  draggingLibraryItem: LibraryItem | null;
  onDropLibraryItemDone: () => void;
}

const HEADER_TOP = 64;
const HEADER_HEIGHT = 64;
const PARTICIPANT_W = 164;
const FIRST_MSG_Y = HEADER_TOP + HEADER_HEIGHT + 58;

export const SequenceCanvas: React.FC<SequenceCanvasProps> = ({
  doc,
  darkMode,
  viewport,
  onViewportChange,
  selectedParticipantIds,
  selectedMessageIds,
  selectedFragmentId,
  onSelectParticipants,
  onSelectMessages,
  onSelectFragment,
  onUpdateDoc,
  readOnly = false,
  svgRef,
  draggingLibraryItem,
  onDropLibraryItemDone,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const lastDropAtRef = useRef(0);
  const seq = doc.sequence!;
  const theme = DIAGRAM_THEMES[doc.settings.theme] ?? DIAGRAM_THEMES.modern;
  const isBlueprint = doc.settings.theme === 'blueprint';
  const canvasBg = darkMode ? theme.canvasBgDark : theme.canvasBgLight;
  const gridColor = darkMode ? theme.gridColorDark : theme.gridColorLight;

  const [panState, setPanState] = useState<{ startX: number; startY: number; vpX: number; vpY: number } | null>(null);
  const [spacePressed, setSpacePressed] = useState(false);

  // Dragging a participant header to reorder horizontally
  const [dragPart, setDragPart] = useState<{ id: string; currX: number; targetOrder: number } | null>(null);

  // Hovering a lifeline to show the subtle "+" connection handle
  const [hoverLifeline, setHoverLifeline] = useState<{ participantId: string; insertOrder: number; y: number } | null>(null);

  // Drag-to-connect message between lifelines
  const [connectMsg, setConnectMsg] = useState<{
    fromId: string;
    insertOrder: number;
    y: number;
    currX: number;
    targetId: string | null;
  } | null>(null);

  // Dragging an existing message (or selected block) vertically to reorder
  const [dragMsg, setDragMsg] = useState<{ id: string; currY: number; targetOrder: number } | null>(null);

  // Marquee multi-select rectangle
  const [marquee, setMarquee] = useState<{ x1: number; y1: number; x2: number; y2: number; additive: boolean } | null>(null);

  // Inline label editing
  const [editingPartId, setEditingPartId] = useState<string | null>(null);
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editingFragId, setEditingFragId] = useState<string | null>(null);

  // Library drop indicator for new participant
  const [dropSlotIndex, setDropSlotIndex] = useState<number | null>(null);

  const participants = useMemo(
    () => [...seq.participants].sort((a, b) => a.order - b.order),
    [seq.participants]
  );

  const messages = useMemo(
    () => [...seq.messages].sort((a, b) => a.order - b.order),
    [seq.messages]
  );

  const spacing = seq.participantSpacing || 205;
  const rowGap = seq.rowSpacing || 64;
  const startX = 120;

  const participantXMap = useMemo(() => {
    const map = new Map<string, number>();
    participants.forEach((p, idx) => {
      map.set(p.id, startX + idx * spacing);
    });
    return map;
  }, [participants, spacing]);

  const lifelineBottom = FIRST_MSG_Y + Math.max(messages.length + 1.5, 4) * rowGap + 48;

  // Compute automatic activation bars from semantic calls & returns
  const activations = useMemo(() => {
    if (!seq.autoActivation) return [];
    const bars: Array<{ participantId: string; startY: number; endY: number; depth: number }> = [];
    const activeStack = new Map<string, Array<{ startY: number }>>();

    messages.forEach((m, idx) => {
      const y = FIRST_MSG_Y + idx * rowGap;
      if (m.type === 'sync' || m.type === 'create') {
        const stack = activeStack.get(m.toId) ?? [];
        stack.push({ startY: y });
        activeStack.set(m.toId, stack);
      } else if (m.type === 'return') {
        const stack = activeStack.get(m.fromId);
        if (stack && stack.length > 0) {
          const popped = stack.pop()!;
          bars.push({
            participantId: m.fromId,
            startY: popped.startY,
            endY: y,
            depth: stack.length,
          });
        }
      } else if (m.type === 'self') {
        bars.push({ participantId: m.fromId, startY: y, endY: y + 30, depth: 0 });
      }
    });

    // Close any unreturned activations gracefully
    for (const [pid, stack] of activeStack.entries()) {
      stack.forEach((entry, depth) => {
        bars.push({
          participantId: pid,
          startY: entry.startY,
          endY: Math.min(lifelineBottom - 36, entry.startY + rowGap * 1.4),
          depth,
        });
      });
    }
    return bars;
  }, [messages, seq.autoActivation, rowGap, lifelineBottom]);

  const screenToWorld = useCallback(
    (clientX: number, clientY: number) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return { x: 0, y: 0 };
      return {
        x: (clientX - rect.left - viewport.x) / viewport.zoom,
        y: (clientY - rect.top - viewport.y) / viewport.zoom,
      };
    },
    [viewport]
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const targetTag = (e.target as HTMLElement)?.tagName;
      if (e.code === 'Space' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(targetTag)) {
        e.preventDefault();
        setSpacePressed(true);
      }
      if (e.key === 'Escape') {
        setConnectMsg(null);
        setDragPart(null);
        setDragMsg(null);
        setMarquee(null);
        setEditingMsgId(null);
        setEditingPartId(null);
        setEditingFragId(null);
      }
      // Keyboard reorder selected message with Alt+ArrowUp / Alt+ArrowDown (PRD 7.9)
      if (
        !readOnly &&
        e.altKey &&
        selectedMessageIds.length === 1 &&
        (e.key === 'ArrowUp' || e.key === 'ArrowDown')
      ) {
        e.preventDefault();
        const currIdx = messages.findIndex((m) => m.id === selectedMessageIds[0]);
        if (currIdx < 0) return;
        const targetIdx = e.key === 'ArrowUp' ? Math.max(0, currIdx - 1) : Math.min(messages.length - 1, currIdx + 1);
        if (targetIdx === currIdx) return;
        const reordered = [...messages];
        const [moved] = reordered.splice(currIdx, 1);
        reordered.splice(targetIdx, 0, moved);
        const normalized = reordered.map((m, i) => ({ ...m, order: i }));
        onUpdateDoc({ ...doc, sequence: { ...seq, messages: normalized } }, true);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') setSpacePressed(false);
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [doc, messages, onUpdateDoc, readOnly, selectedMessageIds, seq]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    const nextZoom = Math.min(2.4, Math.max(0.35, viewport.zoom * zoomFactor));
    const worldX = (mouseX - viewport.x) / viewport.zoom;
    const worldY = (mouseY - viewport.y) / viewport.zoom;
    onViewportChange({
      zoom: nextZoom,
      x: mouseX - worldX * nextZoom,
      y: mouseY - worldY * nextZoom,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (panState) {
      onViewportChange({
        ...viewport,
        x: panState.vpX + (e.clientX - panState.startX),
        y: panState.vpY + (e.clientY - panState.startY),
      });
      return;
    }

    const pt = screenToWorld(e.clientX, e.clientY);

    if (marquee) {
      setMarquee((prev) => (prev ? { ...prev, x2: pt.x, y2: pt.y } : null));
      return;
    }

    if (dragPart) {
      const targetOrder = Math.max(
        0,
        Math.min(participants.length - 1, Math.round((pt.x - startX) / spacing))
      );
      setDragPart({ ...dragPart, currX: pt.x, targetOrder });
      return;
    }

    if (connectMsg) {
      // Find nearest lifeline within 70px
      let closest: string | null = null;
      let minD = 75;
      for (const p of participants) {
        const px = participantXMap.get(p.id)!;
        const d = Math.abs(pt.x - px);
        if (d < minD) {
          minD = d;
          closest = p.id;
        }
      }
      setConnectMsg({ ...connectMsg, currX: pt.x, targetId: closest });
      return;
    }

    if (dragMsg) {
      const targetOrder = Math.max(
        0,
        Math.min(messages.length - 1, Math.round((pt.y - FIRST_MSG_Y) / rowGap))
      );
      setDragMsg({ ...dragMsg, currY: pt.y, targetOrder });
      return;
    }

    // Check hover over any lifeline to offer direct drag-to-connect handle
    if (!readOnly && pt.y >= HEADER_TOP + HEADER_HEIGHT + 16 && pt.y <= lifelineBottom) {
      let matchedPid: string | null = null;
      for (const p of participants) {
        const px = participantXMap.get(p.id)!;
        if (Math.abs(pt.x - px) < 26) {
          matchedPid = p.id;
          break;
        }
      }
      if (matchedPid) {
        // Compute insertion index (can insert cleanly between existing calls or at the end!)
        const rawSlot = Math.max(0, Math.min(messages.length, Math.round((pt.y - (FIRST_MSG_Y - rowGap / 2)) / rowGap)));
        const snapY =
          rawSlot === messages.length
            ? FIRST_MSG_Y + messages.length * rowGap
            : FIRST_MSG_Y + rawSlot * rowGap - rowGap * 0.5;
        setHoverLifeline({ participantId: matchedPid, insertOrder: rawSlot, y: snapY });
      } else {
        setHoverLifeline(null);
      }
    } else {
      setHoverLifeline(null);
    }
  };

  const handleMouseUp = () => {
    if (panState) {
      setPanState(null);
      return;
    }

    // Complete marquee multi-selection across participants and messages
    if (marquee) {
      const minX = Math.min(marquee.x1, marquee.x2);
      const maxX = Math.max(marquee.x1, marquee.x2);
      const minY = Math.min(marquee.y1, marquee.y2);
      const maxY = Math.max(marquee.y1, marquee.y2);
      if (maxX - minX > 6 || maxY - minY > 6) {
        const hitParts = participants
          .filter((p) => {
            const cx = participantXMap.get(p.id)!;
            const px1 = cx - PARTICIPANT_W / 2;
            const px2 = cx + PARTICIPANT_W / 2;
            const py1 = HEADER_TOP;
            const py2 = HEADER_TOP + HEADER_HEIGHT;
            return px2 >= minX && px1 <= maxX && py2 >= minY && py1 <= maxY;
          })
          .map((p) => p.id);

        const hitMsgs = messages
          .filter((m, idx) => {
            const x1 = participantXMap.get(m.fromId);
            const x2 = participantXMap.get(m.toId);
            if (x1 === undefined || x2 === undefined) return false;
            const y = FIRST_MSG_Y + idx * rowGap;
            const left = Math.min(x1, x2);
            const right = m.fromId === m.toId ? x1 + 64 : Math.max(x1, x2);
            return right >= minX && left <= maxX && y + 14 >= minY && y - 22 <= maxY;
          })
          .map((m) => m.id);

        if (marquee.additive) {
          onSelectParticipants(Array.from(new Set([...selectedParticipantIds, ...hitParts])));
          onSelectMessages(Array.from(new Set([...selectedMessageIds, ...hitMsgs])));
        } else {
          onSelectParticipants(hitParts);
          onSelectMessages(hitMsgs);
        }
        onSelectFragment(null);
      }
      setMarquee(null);
      return;
    }

    // Complete participant horizontal reorder (supports single or multi-selected block!)
    if (dragPart) {
      const movingIds = selectedParticipantIds.includes(dragPart.id)
        ? selectedParticipantIds
        : [dragPart.id];
      const anchorOldIdx = participants.findIndex((p) => p.id === dragPart.id);
      if (anchorOldIdx >= 0 && anchorOldIdx !== dragPart.targetOrder) {
        const movingSet = new Set(movingIds);
        const moving = participants.filter((p) => movingSet.has(p.id));
        const remaining = participants.filter((p) => !movingSet.has(p.id));
        const insertAt = Math.max(0, Math.min(remaining.length, dragPart.targetOrder));
        remaining.splice(insertAt, 0, ...moving);
        const normalized = remaining.map((p, idx) => ({ ...p, order: idx }));
        onUpdateDoc({ ...doc, sequence: { ...seq, participants: normalized } }, true);
      }
      setDragPart(null);
      return;
    }

    // Complete message drag-to-connect creation (Scenario B: auto-shifts subsequent messages!)
    if (connectMsg) {
      const targetId = connectMsg.targetId;
      if (targetId) {
        const isSelf = targetId === connectMsg.fromId;
        const newMsg: SequenceMessage = {
          id: makeId('sm'),
          fromId: connectMsg.fromId,
          toId: targetId,
          label: isSelf ? 'Process internally' : 'Call service',
          type: isSelf ? 'self' : 'sync',
          order: connectMsg.insertOrder,
          activateTarget: !isSelf,
        };
        const nextMessages = [...messages];
        nextMessages.splice(connectMsg.insertOrder, 0, newMsg);
        const normalized = nextMessages.map((m, i) => ({ ...m, order: i }));

        // Expand fragments that span the insertion point
        const nextFragments = seq.fragments.map((f) => {
          if (connectMsg.insertOrder <= f.startOrder) {
            return { ...f, startOrder: f.startOrder + 1, endOrder: f.endOrder + 1 };
          }
          if (connectMsg.insertOrder > f.startOrder && connectMsg.insertOrder <= f.endOrder) {
            return { ...f, endOrder: f.endOrder + 1 };
          }
          return f;
        });

        onUpdateDoc(
          {
            ...doc,
            sequence: { ...seq, messages: normalized, fragments: nextFragments },
          },
          true
        );
        onSelectParticipants([]);
        onSelectFragment(null);
        onSelectMessages([newMsg.id]);
        setEditingMsgId(newMsg.id);
      }
      setConnectMsg(null);
      return;
    }

    // Complete vertical message reorder (moves entire multi-selected message group together!)
    if (dragMsg) {
      const movingIds = selectedMessageIds.includes(dragMsg.id)
        ? selectedMessageIds
        : [dragMsg.id];
      const oldIdx = messages.findIndex((m) => m.id === dragMsg.id);
      if (oldIdx >= 0 && oldIdx !== dragMsg.targetOrder) {
        const movingSet = new Set(movingIds);
        const moving = messages.filter((m) => movingSet.has(m.id));
        const remaining = messages.filter((m) => !movingSet.has(m.id));
        const insertAt = Math.max(0, Math.min(remaining.length, dragMsg.targetOrder));
        remaining.splice(insertAt, 0, ...moving);
        const normalized = remaining.map((m, i) => ({ ...m, order: i }));
        onUpdateDoc({ ...doc, sequence: { ...seq, messages: normalized } }, true);
      }
      setDragMsg(null);
      return;
    }
  };

  // Drag-and-drop new participant from Left Library into header
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggingLibraryItem) return;
    const pt = screenToWorld(e.clientX, e.clientY);
    const slot = Math.max(0, Math.min(participants.length, Math.round((pt.x - startX + spacing / 2) / spacing)));
    setDropSlotIndex(slot);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const slot = dropSlotIndex ?? participants.length;
    setDropSlotIndex(null);
    if (!draggingLibraryItem || readOnly) return;
    const now = Date.now();
    if (now - lastDropAtRef.current < 150) return;
    lastDropAtRef.current = now;
    const droppedItem = draggingLibraryItem;
    onDropLibraryItemDone();

    const newP: SequenceParticipant = {
      id: makeId('p'),
      name: droppedItem.label,
      role: droppedItem.participantRole ?? 'microservice',
      subtitle: droppedItem.subtitle,
      color: droppedItem.stroke,
      order: slot,
    };

    const nextList = [...participants];
    nextList.splice(slot, 0, newP);
    const normalized = nextList.map((p, idx) => ({ ...p, order: idx }));
    onUpdateDoc({ ...doc, sequence: { ...seq, participants: normalized } }, true);
    onSelectParticipants([newP.id]);
    onSelectMessages([]);
  };

  const isModern = seq.viewMode === 'modern';

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden select-none"
      style={{
        backgroundColor: canvasBg,
        cursor: panState || spacePressed ? 'grab' : connectMsg ? 'crosshair' : 'default',
      }}
      onWheel={handleWheel}
      onDragOver={handleDragOver}
      onDragLeave={() => setDropSlotIndex(null)}
      onDrop={handleDrop}
    >
      <svg
        ref={svgRef}
        className="w-full h-full block"
        onMouseDown={(e) => {
          if (
            document.activeElement instanceof HTMLElement &&
            !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)
          ) {
            document.activeElement.blur();
          }
          if (e.button === 1 || spacePressed) {
            e.preventDefault();
            setPanState({ startX: e.clientX, startY: e.clientY, vpX: viewport.x, vpY: viewport.y });
            return;
          }
          setEditingMsgId(null);
          setEditingPartId(null);
          setEditingFragId(null);
          if (!e.shiftKey) {
            onSelectParticipants([]);
            onSelectMessages([]);
            onSelectFragment(null);
          }
          if (!readOnly) {
            const pt = screenToWorld(e.clientX, e.clientY);
            setMarquee({ x1: pt.x, y1: pt.y, x2: pt.x, y2: pt.y, additive: e.shiftKey });
          }
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        role="application"
        aria-label={`${doc.title} sequence diagram canvas`}
      >
        <defs>
          <pattern
            id="seq-grid"
            width={24 * viewport.zoom}
            height={24 * viewport.zoom}
            patternUnits="userSpaceOnUse"
            x={viewport.x % (24 * viewport.zoom)}
            y={viewport.y % (24 * viewport.zoom)}
          >
            <circle cx="1.2" cy="1.2" r="1" fill={gridColor} />
          </pattern>
          <filter id="seq-shadow" x="-15%" y="-15%" width="130%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#0F172A" floodOpacity={darkMode ? 0.35 : 0.08} />
          </filter>
          <marker id="seq-arrow-solid" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto">
            <path d="M 0 1 L 9 5 L 0 9 z" fill="context-stroke" />
          </marker>
          <marker id="seq-arrow-open" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto">
            <path d="M 1 1.5 L 8.5 5 L 1 8.5" fill="none" stroke="context-stroke" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </marker>
        </defs>

        {doc.settings.showGrid && (
          <rect width="100%" height="100%" fill="url(#seq-grid)" data-export-ignore="true" />
        )}

        <g
          data-canvas-content="true"
          transform={`translate(${viewport.x}, ${viewport.y}) scale(${viewport.zoom})`}
        >
          {/* 1. Combined Fragments (alt, opt, loop, par, break, critical) */}
          {seq.fragments.map((frag) => {
            const leftX = startX - PARTICIPANT_W / 2 - 20;
            const rightX =
              participants.length > 0
                ? startX + (participants.length - 1) * spacing + PARTICIPANT_W / 2 + 20
                : 600;
            const topY = FIRST_MSG_Y + frag.startOrder * rowGap - 34;
            const botY = FIRST_MSG_Y + frag.endOrder * rowGap + 28;
            const isSel = selectedFragmentId === frag.id;

            return (
              <g
                key={frag.id}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  onSelectParticipants([]);
                  onSelectMessages([]);
                  onSelectFragment(frag.id);
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  if (!readOnly) setEditingFragId(frag.id);
                }}
                style={{ cursor: 'pointer' }}
              >
                <rect
                  x={leftX}
                  y={topY}
                  width={rightX - leftX}
                  height={Math.max(70, botY - topY)}
                  rx={isModern ? 10 : 2}
                  fill={frag.color}
                  fillOpacity={darkMode ? 0.09 : 0.045}
                  stroke={isSel ? '#2563EB' : frag.color}
                  strokeWidth={isSel ? 2 : 1.3}
                  strokeDasharray={frag.kind === 'opt' ? '6 4' : undefined}
                />
                {/* Pentagon operator badge */}
                <path
                  d={`M ${leftX} ${topY} H ${leftX + 64} L ${leftX + 56} ${topY + 22} H ${leftX} Z`}
                  fill={frag.color}
                />
                <text
                  x={leftX + 10}
                  y={topY + 14.5}
                  fill="#FFFFFF"
                  fontSize={11}
                  fontWeight={700}
                  fontFamily="JetBrains Mono, monospace"
                >
                  {frag.kind}
                </text>
                {editingFragId === frag.id ? (
                  <foreignObject x={leftX + 70} y={topY + 2} width={260} height={22} data-export-ignore="true">
                    <input
                      autoFocus
                      defaultValue={frag.guard}
                      onMouseDown={(e) => e.stopPropagation()}
                      onBlur={(e) => {
                        const guard = e.target.value.trim() || frag.guard;
                        onUpdateDoc(
                          {
                            ...doc,
                            sequence: {
                              ...seq,
                              fragments: seq.fragments.map((f) =>
                                f.id === frag.id ? { ...f, guard } : f
                              ),
                            },
                          },
                          true
                        );
                        setEditingFragId(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                      }}
                      className="w-full h-full text-xs font-mono px-1.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-blue-500 rounded outline-none"
                    />
                  </foreignObject>
                ) : (
                  <text
                    x={leftX + 72}
                    y={topY + 14.5}
                    fill={isBlueprint ? '#E0F2FE' : darkMode ? '#CBD5E1' : '#334155'}
                    fontSize={11.5}
                    fontWeight={500}
                    fontFamily="JetBrains Mono, monospace"
                  >
                    [{frag.guard}]
                  </text>
                )}

                {frag.elseGuard && (
                  <g>
                    <line
                      x1={leftX}
                      y1={botY - 26}
                      x2={rightX}
                      y2={botY - 26}
                      stroke={frag.color}
                      strokeOpacity={0.5}
                      strokeWidth={1.2}
                      strokeDasharray="5 4"
                    />
                    <text
                      x={leftX + 12}
                      y={botY - 10}
                      fill={isBlueprint ? '#BFDBFE' : darkMode ? '#94A3B8' : '#64748B'}
                      fontSize={11}
                      fontFamily="JetBrains Mono, monospace"
                    >
                      else [{frag.elseGuard}]
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* 2. Participant Lifelines */}
          {participants.map((p) => {
            const cx = participantXMap.get(p.id)!;
            const isTarget = connectMsg?.targetId === p.id;
            const isSel = selectedParticipantIds.includes(p.id);

            return (
              <g key={`life-${p.id}`}>
                {/* Subtle column highlight when connecting */}
                {isTarget && (
                  <rect
                    x={cx - 16}
                    y={HEADER_TOP + HEADER_HEIGHT}
                    width={32}
                    height={lifelineBottom - (HEADER_TOP + HEADER_HEIGHT)}
                    rx={8}
                    fill="#2563EB"
                    fillOpacity={0.1}
                    data-export-ignore="true"
                  />
                )}
                <line
                  x1={cx}
                  y1={HEADER_TOP + HEADER_HEIGHT}
                  x2={cx}
                  y2={lifelineBottom}
                  stroke={isTarget || isSel ? '#2563EB' : isBlueprint ? '#60A5FA' : darkMode ? '#334155' : '#CBD5E1'}
                  strokeWidth={isTarget ? 2.2 : 1.5}
                  strokeDasharray="5 5"
                />
              </g>
            );
          })}

          {/* 3. Activation Bars */}
          {activations.map((bar, idx) => {
            const cx = participantXMap.get(bar.participantId);
            if (cx === undefined) return null;
            const p = participants.find((item) => item.id === bar.participantId);
            const offsetX = bar.depth * 4;
            return (
              <rect
                key={`act-${idx}`}
                x={cx - 6 + offsetX}
                y={bar.startY}
                width={12}
                height={Math.max(20, bar.endY - bar.startY)}
                rx={isModern ? 4 : 1}
                fill={darkMode ? '#1E293B' : '#FFFFFF'}
                stroke={p?.color || '#2563EB'}
                strokeWidth={1.5}
              />
            );
          })}

          {/* 4. Participant Headers with Unique Role Icons (Draggable horizontally to reorder!) */}
          {participants.map((p) => {
            const baseCx = participantXMap.get(p.id)!;
            const cx = dragPart?.id === p.id ? dragPart.currX : baseCx;
            const isSel = selectedParticipantIds.includes(p.id);
            const inMarquee =
              marquee &&
              baseCx + PARTICIPANT_W / 2 >= Math.min(marquee.x1, marquee.x2) &&
              baseCx - PARTICIPANT_W / 2 <= Math.max(marquee.x1, marquee.x2) &&
              HEADER_TOP + HEADER_HEIGHT >= Math.min(marquee.y1, marquee.y2) &&
              HEADER_TOP <= Math.max(marquee.y1, marquee.y2);
            const highlighted = isSel || Boolean(inMarquee);
            const x = cx - PARTICIPANT_W / 2;
            const iconColor = isBlueprint ? '#93C5FD' : p.color;
            const isClassicActor = !isModern && (p.role === 'actor' || p.role === 'user');
            const isClassicDb = !isModern && p.role === 'database';

            return (
              <g
                key={p.id}
                transform={`translate(${x}, ${HEADER_TOP})`}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  onSelectFragment(null);
                  if (e.shiftKey) {
                    const next = selectedParticipantIds.includes(p.id)
                      ? selectedParticipantIds.filter((id) => id !== p.id)
                      : [...selectedParticipantIds, p.id];
                    onSelectParticipants(next);
                  } else if (!selectedParticipantIds.includes(p.id)) {
                    onSelectMessages([]);
                    onSelectParticipants([p.id]);
                  }
                  if (!readOnly) {
                    const pt = screenToWorld(e.clientX, e.clientY);
                    setDragPart({ id: p.id, currX: pt.x, targetOrder: p.order });
                  }
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  if (!readOnly) setEditingPartId(p.id);
                }}
                style={{ cursor: readOnly ? 'pointer' : 'grab' }}
              >
                {isClassicActor ? (
                  <>
                    <rect
                      width={PARTICIPANT_W}
                      height={HEADER_HEIGHT}
                      rx={6}
                      fill={highlighted ? 'rgba(37,99,235,0.08)' : 'transparent'}
                      stroke={highlighted ? '#2563EB' : 'transparent'}
                      strokeWidth={1.5}
                      strokeDasharray={highlighted ? '4 3' : undefined}
                    />
                    <g transform={`translate(${PARTICIPANT_W / 2 - 15}, 2) scale(1.25)`}>
                      <SequenceRoleIconPaths role="actor" color={iconColor} strokeWidth={1.7} />
                    </g>
                  </>
                ) : isClassicDb ? (
                  <>
                    <rect
                      width={PARTICIPANT_W}
                      height={HEADER_HEIGHT}
                      rx={6}
                      fill={highlighted ? 'rgba(37,99,235,0.08)' : 'transparent'}
                      stroke={highlighted ? '#2563EB' : 'transparent'}
                      strokeWidth={1.5}
                      strokeDasharray={highlighted ? '4 3' : undefined}
                    />
                    <g transform={`translate(${PARTICIPANT_W / 2 - 15}, 4) scale(1.25)`}>
                      <SequenceRoleIconPaths role="database" color={iconColor} strokeWidth={1.7} />
                    </g>
                  </>
                ) : (
                  <>
                    <rect
                      width={PARTICIPANT_W}
                      height={HEADER_HEIGHT}
                      rx={isModern ? 10 : 3}
                      fill={isBlueprint ? theme.nodeBgLight : darkMode ? '#131C31' : '#FFFFFF'}
                      stroke={highlighted ? '#2563EB' : isBlueprint ? '#93C5FD' : p.color}
                      strokeWidth={highlighted ? 2.2 : 1.5}
                      filter={isModern && !isBlueprint ? 'url(#seq-shadow)' : undefined}
                    />
                    {isModern && (
                      <rect
                        x={0}
                        y={0}
                        width={PARTICIPANT_W}
                        height={4.5}
                        rx={2.25}
                        fill={p.color}
                      />
                    )}
                    {/* Unique Role Icon Chip */}
                    <rect
                      x={10}
                      y={18}
                      width={30}
                      height={30}
                      rx={isModern ? 7 : 3}
                      fill={p.color}
                      fillOpacity={darkMode ? 0.2 : 0.11}
                    />
                    <g transform="translate(15, 23) scale(0.84)">
                      <SequenceRoleIconPaths role={p.role} color={iconColor} strokeWidth={2} />
                    </g>
                  </>
                )}

                {editingPartId === p.id ? (
                  <foreignObject
                    x={isClassicActor || isClassicDb ? 8 : 44}
                    y={isClassicActor || isClassicDb ? 36 : 18}
                    width={isClassicActor || isClassicDb ? PARTICIPANT_W - 16 : PARTICIPANT_W - 52}
                    height={26}
                    data-export-ignore="true"
                  >
                    <input
                      autoFocus
                      defaultValue={p.name}
                      onMouseDown={(e) => e.stopPropagation()}
                      onBlur={(e) => {
                        const name = e.target.value.trim() || p.name;
                        onUpdateDoc(
                          {
                            ...doc,
                            sequence: {
                              ...seq,
                              participants: seq.participants.map((item) =>
                                item.id === p.id ? { ...item, name } : item
                              ),
                            },
                          },
                          true
                        );
                        setEditingPartId(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                      }}
                      className="w-full h-full text-center text-xs font-semibold bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-blue-500 rounded px-1 outline-none"
                    />
                  </foreignObject>
                ) : isClassicActor || isClassicDb ? (
                  <text
                    x={PARTICIPANT_W / 2}
                    y={52}
                    textAnchor="middle"
                    fill={isBlueprint ? '#EFF6FF' : darkMode ? '#F1F5F9' : '#0F172A'}
                    fontSize={12.5}
                    fontWeight={600}
                    fontFamily="Plus Jakarta Sans, sans-serif"
                  >
                    {p.name.length > 18 ? `${p.name.slice(0, 17)}…` : p.name}
                  </text>
                ) : (
                  <>
                    <text
                      x={48}
                      y={p.subtitle && isModern ? 30 : 37}
                      textAnchor="start"
                      fill={isBlueprint ? '#EFF6FF' : darkMode ? '#F1F5F9' : '#0F172A'}
                      fontSize={12.5}
                      fontWeight={600}
                      fontFamily="Plus Jakarta Sans, sans-serif"
                    >
                      {p.name.length > 15 ? `${p.name.slice(0, 14)}…` : p.name}
                    </text>
                    {p.subtitle && isModern && (
                      <text
                        x={48}
                        y={46}
                        textAnchor="start"
                        fill={isBlueprint ? '#BFDBFE' : darkMode ? '#94A3B8' : '#64748B'}
                        fontSize={10}
                      >
                        {p.subtitle.length > 18 ? `${p.subtitle.slice(0, 17)}…` : p.subtitle}
                      </text>
                    )}
                  </>
                )}
              </g>
            );
          })}

          {/* Participant Drop Slot Indicator */}
          {(dropSlotIndex !== null || dragPart) && (
            <line
              x1={
                startX +
                (dragPart ? dragPart.targetOrder : dropSlotIndex!) * spacing -
                (dragPart ? 0 : spacing / 2)
              }
              y1={HEADER_TOP - 10}
              x2={
                startX +
                (dragPart ? dragPart.targetOrder : dropSlotIndex!) * spacing -
                (dragPart ? 0 : spacing / 2)
              }
              y2={lifelineBottom}
              stroke="#2563EB"
              strokeWidth={2.5}
              strokeDasharray="6 4"
              data-export-ignore="true"
            />
          )}

          {/* 5. Ordered Semantic Messages (Vertically draggable to reorder!) */}
          {messages.map((msg, idx) => {
            const x1 = participantXMap.get(msg.fromId);
            const x2 = participantXMap.get(msg.toId);
            if (x1 === undefined || x2 === undefined) return null;

            const baseY = FIRST_MSG_Y + idx * rowGap;
            const y = dragMsg?.id === msg.id ? dragMsg.currY : baseY;
            const isSel = selectedMessageIds.includes(msg.id);
            const isSelf = msg.fromId === msg.toId || msg.type === 'self';
            const inMsgMarquee =
              marquee &&
              (isSelf ? x1 + 64 : Math.max(x1, x2)) >= Math.min(marquee.x1, marquee.x2) &&
              Math.min(x1, x2) <= Math.max(marquee.x1, marquee.x2) &&
              baseY + 14 >= Math.min(marquee.y1, marquee.y2) &&
              baseY - 22 <= Math.max(marquee.y1, marquee.y2);
            const highlighted = isSel || Boolean(inMsgMarquee);
            const isReturn = msg.type === 'return';
            const isAsync = msg.type === 'async' || msg.type === 'event';

            const stroke = highlighted
              ? '#2563EB'
              : msg.color ||
                (isBlueprint
                  ? '#93C5FD'
                  : isReturn
                  ? darkMode
                    ? '#94A3B8'
                    : '#64748B'
                  : darkMode
                  ? '#E2E8F0'
                  : '#1E293B');

            const dir = x2 >= x1 ? 1 : -1;
            const startXAdj = isSelf ? x1 + 6 : x1 + dir * 7;
            const endXAdj = isSelf ? x1 + 6 : x2 - dir * 8;
            const midX = isSelf ? x1 + 64 : (startXAdj + endXAdj) / 2;

            return (
              <g
                key={msg.id}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  onSelectFragment(null);
                  if (e.shiftKey) {
                    const next = selectedMessageIds.includes(msg.id)
                      ? selectedMessageIds.filter((id) => id !== msg.id)
                      : [...selectedMessageIds, msg.id];
                    onSelectMessages(next);
                  } else if (!selectedMessageIds.includes(msg.id)) {
                    onSelectParticipants([]);
                    onSelectMessages([msg.id]);
                  }
                  if (!readOnly) {
                    const pt = screenToWorld(e.clientX, e.clientY);
                    setDragMsg({ id: msg.id, currY: pt.y, targetOrder: idx });
                  }
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  if (!readOnly) setEditingMsgId(msg.id);
                }}
                style={{ cursor: readOnly ? 'pointer' : 'ns-resize' }}
              >
                {/* Invisible hit strip */}
                <rect
                  x={Math.min(startXAdj, endXAdj) - 10}
                  y={y - 24}
                  width={isSelf ? 96 : Math.abs(endXAdj - startXAdj) + 20}
                  height={38}
                  fill="transparent"
                  data-export-ignore="true"
                />

                {isSelf ? (
                  <path
                    d={`M ${startXAdj} ${y} H ${x1 + 56} V ${y + 28} H ${endXAdj + 2}`}
                    fill="none"
                    stroke={stroke}
                    strokeWidth={isSel ? 2.4 : 1.75}
                    markerEnd="url(#seq-arrow-solid)"
                    strokeLinejoin="round"
                  />
                ) : (
                  <line
                    x1={startXAdj}
                    y1={y}
                    x2={endXAdj}
                    y2={y}
                    stroke={stroke}
                    strokeWidth={isSel ? 2.4 : 1.75}
                    strokeDasharray={isReturn ? '6 4' : undefined}
                    markerEnd={isAsync ? 'url(#seq-arrow-open)' : 'url(#seq-arrow-solid)'}
                  />
                )}

                {/* Sequence index badge + Message Label */}
                {editingMsgId === msg.id ? (
                  <foreignObject x={midX - 100} y={y - 28} width={200} height={24} data-export-ignore="true">
                    <input
                      autoFocus
                      defaultValue={msg.label}
                      onMouseDown={(e) => e.stopPropagation()}
                      onBlur={(e) => {
                        const label = e.target.value.trim() || msg.label;
                        onUpdateDoc(
                          {
                            ...doc,
                            sequence: {
                              ...seq,
                              messages: seq.messages.map((item) =>
                                item.id === msg.id ? { ...item, label } : item
                              ),
                            },
                          },
                          true
                        );
                        setEditingMsgId(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                      }}
                      className="w-full h-full text-center text-xs font-medium bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-blue-500 rounded px-1.5 outline-none shadow"
                    />
                  </foreignObject>
                ) : (
                  <g transform={`translate(${isSelf ? x1 + 66 : midX}, ${isSelf ? y + 12 : y - 11})`}>
                    <text
                      textAnchor={isSelf ? 'start' : 'middle'}
                      fill={isBlueprint ? '#EFF6FF' : darkMode ? '#F1F5F9' : '#0F172A'}
                      fontSize={12}
                      fontWeight={isSel ? 600 : 500}
                    >
                      <tspan
                        fill={isSel ? '#2563EB' : darkMode ? '#64748B' : '#94A3B8'}
                        fontFamily="JetBrains Mono, monospace"
                        fontSize={10.5}
                      >
                        {idx + 1}.{' '}
                      </tspan>
                      {msg.label}
                    </text>

                    {/* Compact API/Endpoint preview (PRD 7.13) */}
                    {isModern && (msg.method || msg.endpoint) && !isSelf && (
                      <text
                        y={24}
                        textAnchor="middle"
                        fill={isBlueprint ? '#93C5FD' : darkMode ? '#94A3B8' : '#64748B'}
                        fontSize={10}
                        fontFamily="JetBrains Mono, monospace"
                      >
                        {[msg.method, msg.endpoint].filter(Boolean).join(' ')}
                      </text>
                    )}
                  </g>
                )}
              </g>
            );
          })}

          {/* Vertical Reorder Insertion Line */}
          {dragMsg && (
            <line
              x1={startX - 40}
              y1={FIRST_MSG_Y + dragMsg.targetOrder * rowGap - rowGap * 0.4}
              x2={startX + Math.max(1, participants.length - 1) * spacing + 40}
              y2={FIRST_MSG_Y + dragMsg.targetOrder * rowGap - rowGap * 0.4}
              stroke="#2563EB"
              strokeWidth={2.5}
              strokeDasharray="6 4"
              data-export-ignore="true"
            />
          )}

          {/* 6. Attached Sequence Notes */}
          {seq.notes.map((note) => {
            const px = participantXMap.get(note.participantId);
            if (px === undefined) return null;
            const ny = FIRST_MSG_Y + note.afterOrder * rowGap - 14;
            const nx = note.placement === 'left' ? px - 178 : px + 20;
            return (
              <g key={note.id} transform={`translate(${nx}, ${ny})`}>
                <rect
                  width={158}
                  height={44}
                  rx={6}
                  fill={darkMode ? '#422006' : '#FEF9C3'}
                  stroke="#CA8A04"
                  strokeWidth={1.2}
                />
                <foreignObject x={8} y={5} width={142} height={34}>
                  <div className="text-[10.5px] leading-snug text-amber-950 dark:text-amber-100 line-clamp-2">
                    {note.text}
                  </div>
                </foreignObject>
              </g>
            );
          })}

          {/* 7. Subtle Hover Connection Handle on Lifeline (Drag horizontally to create message!) */}
          {!readOnly && hoverLifeline && !connectMsg && !dragMsg && !dragPart && (() => {
            const hx = participantXMap.get(hoverLifeline.participantId);
            if (hx === undefined) return null;
            return (
              <g
                transform={`translate(${hx}, ${hoverLifeline.y})`}
                style={{ cursor: 'crosshair' }}
                data-export-ignore="true"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  setConnectMsg({
                    fromId: hoverLifeline.participantId,
                    insertOrder: hoverLifeline.insertOrder,
                    y: hoverLifeline.y,
                    currX: hx,
                    targetId: hoverLifeline.participantId,
                  });
                }}
              >
                <circle r={10} fill="#2563EB" fillOpacity={0.14} stroke="#2563EB" strokeWidth={1.5} />
                <path d="M -3.5 0 H 3.5 M 0 -3.5 V 3.5" stroke="#2563EB" strokeWidth={1.6} strokeLinecap="round" />
              </g>
            );
          })()}

          {/* 8. Live Drag-to-Connect Preview Arrow */}
          {connectMsg && (() => {
            const fromX = participantXMap.get(connectMsg.fromId);
            if (fromX === undefined) return null;
            const snapX = connectMsg.targetId
              ? participantXMap.get(connectMsg.targetId) ?? connectMsg.currX
              : connectMsg.currX;
            const isSelf = connectMsg.targetId === connectMsg.fromId;
            return (
              <g data-export-ignore="true">
                {isSelf ? (
                  <path
                    d={`M ${fromX + 6} ${connectMsg.y} H ${fromX + 54} V ${connectMsg.y + 24} H ${fromX + 8}`}
                    fill="none"
                    stroke="#2563EB"
                    strokeWidth={2}
                    strokeDasharray="5 3"
                    markerEnd="url(#seq-arrow-solid)"
                  />
                ) : (
                  <line
                    x1={fromX}
                    y1={connectMsg.y}
                    x2={snapX}
                    y2={connectMsg.y}
                    stroke="#2563EB"
                    strokeWidth={2.2}
                    strokeDasharray="5 3"
                    markerEnd="url(#seq-arrow-solid)"
                  />
                )}
              </g>
            );
          })()}
          {/* 9. Marquee Multi-Select Rectangle */}
          {marquee && (
            <rect
              x={Math.min(marquee.x1, marquee.x2)}
              y={Math.min(marquee.y1, marquee.y2)}
              width={Math.abs(marquee.x2 - marquee.x1)}
              height={Math.abs(marquee.y2 - marquee.y1)}
              fill="rgba(37, 99, 235, 0.09)"
              stroke="#2563EB"
              strokeWidth={1.25 / viewport.zoom}
              strokeDasharray={`${5 / viewport.zoom} ${3 / viewport.zoom}`}
              data-export-ignore="true"
            />
          )}
        </g>
      </svg>

      {/* Non-intrusive interaction hint on empty/few-message canvas */}
      {!readOnly && messages.length < 2 && (
        <div className="pointer-events-none absolute bottom-16 left-1/2 -translate-x-1/2 px-3.5 py-1.5 rounded-lg bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 shadow-sm">
          Hover any lifeline and drag across to create a call · Drag participant headers to reorder
        </div>
      )}
    </div>
  );
};
