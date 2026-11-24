import React, { useMemo } from 'react';
import {
  AlertTriangle,
  ArrowDownUp,
  ArrowLeftRight,
  Grid,
  Info,
  Plus,
  RotateCw,
  Trash2,
} from 'lucide-react';
import {
  ConnectorLineStyle,
  ConnectorRouting,
  DiagramConnection,
  DiagramDocument,
  DiagramObject,
  DiagramThemeId,
  FragmentKind,
  MeasurementUnit,
  SequenceMessageType,
} from '../../types/diagram';
import { DIAGRAM_THEMES, PROTOCOL_STYLES, SWATCH_COLORS } from '../../engine/themes';
import { LayoutDirection, validateDiagram } from '../../engine/layout';
import { formatArea, formatLength } from '../../engine/geometry';
import { makeId } from '../../engine/templates';

interface RightPropertiesPanelProps {
  doc: DiagramDocument;
  selectedObject: DiagramObject | null;
  selectedConnection: DiagramConnection | null;
  selectedParticipantId: string | null;
  selectedMessageIds: string[];
  selectedFragmentId: string | null;
  selectedFloorItem: { kind: 'wall' | 'opening' | 'room' | 'furniture'; id: string } | null;
  onUpdateDoc: (next: DiagramDocument, recordHistory?: boolean) => void;
  onApplyLayout: (dir: LayoutDirection) => void;
  onFocusObject: (id: string) => void;
  onSaveAsTemplate: () => void;
  readOnly?: boolean;
}

export const RightPropertiesPanel: React.FC<RightPropertiesPanelProps> = ({
  doc,
  selectedObject,
  selectedConnection,
  selectedParticipantId,
  selectedMessageIds,
  selectedFragmentId,
  selectedFloorItem,
  onUpdateDoc,
  onApplyLayout,
  onFocusObject,
  onSaveAsTemplate,
  readOnly = false,
}) => {
  const issues = useMemo(() => validateDiagram(doc), [doc]);

  const updateObj = (patch: Partial<DiagramObject>, record = true) => {
    if (!selectedObject || readOnly) return;
    onUpdateDoc(
      {
        ...doc,
        objects: doc.objects.map((o) =>
          o.id === selectedObject.id ? { ...o, ...patch } : o
        ),
      },
      record
    );
  };

  const updateObjStyle = (patch: Partial<DiagramObject['style']>) => {
    if (!selectedObject || readOnly) return;
    updateObj({ style: { ...selectedObject.style, ...patch } }, true);
  };

  const updateObjMeta = (patch: Partial<DiagramObject['metadata']>) => {
    if (!selectedObject || readOnly) return;
    updateObj({ metadata: { ...selectedObject.metadata, ...patch } }, true);
  };

  const updateConn = (patch: Partial<DiagramConnection>) => {
    if (!selectedConnection || readOnly) return;
    onUpdateDoc(
      {
        ...doc,
        connections: doc.connections.map((c) =>
          c.id === selectedConnection.id ? { ...c, ...patch } : c
        ),
      },
      true
    );
  };

  // ==========================================
  // 1. Sequence Diagram Selection Properties
  // ==========================================
  if (doc.type === 'sequence' && doc.sequence) {
    const seq = doc.sequence;
    const participant = selectedParticipantId
      ? seq.participants.find((p) => p.id === selectedParticipantId)
      : null;
    const message =
      selectedMessageIds.length === 1
        ? seq.messages.find((m) => m.id === selectedMessageIds[0])
        : null;
    const fragment = selectedFragmentId
      ? seq.fragments.find((f) => f.id === selectedFragmentId)
      : null;

    if (participant) {
      return (
        <aside className="w-72 h-full shrink-0 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 overflow-y-auto p-4 space-y-5">
          <div>
            <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
              Participant
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Lifeline identity and header styling
            </p>
          </div>

          <div className="space-y-3">
            <label className="block">
              <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Name</span>
              <input
                type="text"
                value={participant.name}
                disabled={readOnly}
                onChange={(e) =>
                  onUpdateDoc(
                    {
                      ...doc,
                      sequence: {
                        ...seq,
                        participants: seq.participants.map((p) =>
                          p.id === participant.id ? { ...p, name: e.target.value } : p
                        ),
                      },
                    },
                    true
                  )
                }
                className="mt-1 w-full px-2.5 py-1.5 text-xs rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              />
            </label>

            <label className="block">
              <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Subtitle / Tech</span>
              <input
                type="text"
                value={participant.subtitle ?? ''}
                disabled={readOnly}
                onChange={(e) =>
                  onUpdateDoc(
                    {
                      ...doc,
                      sequence: {
                        ...seq,
                        participants: seq.participants.map((p) =>
                          p.id === participant.id ? { ...p, subtitle: e.target.value } : p
                        ),
                      },
                    },
                    true
                  )
                }
                placeholder="e.g. REST Gateway"
                className="mt-1 w-full px-2.5 py-1.5 text-xs rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              />
            </label>

            <div>
              <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1.5">
                Accent Color
              </span>
              <div className="flex flex-wrap gap-1.5">
                {SWATCH_COLORS.map((sw) => (
                  <button
                    key={sw.name}
                    type="button"
                    disabled={readOnly}
                    onClick={() =>
                      onUpdateDoc(
                        {
                          ...doc,
                          sequence: {
                            ...seq,
                            participants: seq.participants.map((p) =>
                              p.id === participant.id ? { ...p, color: sw.stroke } : p
                            ),
                          },
                        },
                        true
                      )
                    }
                    className={`w-6 h-6 rounded-md border ${
                      participant.color === sw.stroke ? 'ring-2 ring-blue-600 ring-offset-1' : ''
                    }`}
                    style={{ backgroundColor: sw.stroke, borderColor: sw.stroke }}
                    title={sw.name}
                  />
                ))}
              </div>
            </div>

            {!readOnly && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    const note = {
                      id: makeId('sn'),
                      text: 'Add callout note...',
                      participantId: participant.id,
                      afterOrder: Math.max(0, seq.messages.length - 1),
                      placement: 'right' as const,
                    };
                    onUpdateDoc({ ...doc, sequence: { ...seq, notes: [...seq.notes, note] } }, true);
                  }}
                  className="w-full py-1.5 px-3 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Attach Lifeline Note
                </button>
              </div>
            )}
          </div>
        </aside>
      );
    }

    if (message) {
      return (
        <aside className="w-72 h-full shrink-0 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 overflow-y-auto p-4 space-y-4">
          <div>
            <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
              Sequence Call #{message.order + 1}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Message semantics & API contract
            </p>
          </div>

          <div className="space-y-3">
            <label className="block">
              <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Label</span>
              <input
                type="text"
                value={message.label}
                disabled={readOnly}
                onChange={(e) =>
                  onUpdateDoc(
                    {
                      ...doc,
                      sequence: {
                        ...seq,
                        messages: seq.messages.map((m) =>
                          m.id === message.id ? { ...m, label: e.target.value } : m
                        ),
                      },
                    },
                    true
                  )
                }
                className="mt-1 w-full px-2.5 py-1.5 text-xs rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              />
            </label>

            <label className="block">
              <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Message Type</span>
              <select
                value={message.type}
                disabled={readOnly}
                onChange={(e) =>
                  onUpdateDoc(
                    {
                      ...doc,
                      sequence: {
                        ...seq,
                        messages: seq.messages.map((m) =>
                          m.id === message.id
                            ? { ...m, type: e.target.value as SequenceMessageType }
                            : m
                        ),
                      },
                    },
                    true
                  )
                }
                className="mt-1 w-full px-2.5 py-1.5 text-xs rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              >
                <option value="sync">Synchronous Call</option>
                <option value="async">Asynchronous Call</option>
                <option value="return">Return Message (Dashed)</option>
                <option value="self">Self Message</option>
                <option value="event">Event Publication</option>
              </select>
            </label>

            <div className="grid grid-cols-3 gap-2">
              <label className="col-span-1">
                <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Method</span>
                <select
                  value={message.method ?? ''}
                  disabled={readOnly}
                  onChange={(e) =>
                    onUpdateDoc(
                      {
                        ...doc,
                        sequence: {
                          ...seq,
                          messages: seq.messages.map((m) =>
                            m.id === message.id
                              ? { ...m, method: e.target.value as typeof m.method }
                              : m
                          ),
                        },
                      },
                      true
                    )
                  }
                  className="mt-1 w-full px-1.5 py-1.5 text-xs font-mono rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                >
                  <option value="">—</option>
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DEL</option>
                  <option value="EVENT">EVT</option>
                  <option value="SQL">SQL</option>
                </select>
              </label>
              <label className="col-span-2">
                <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Endpoint / Op</span>
                <input
                  type="text"
                  value={message.endpoint ?? ''}
                  disabled={readOnly}
                  placeholder="/api/auth/login"
                  onChange={(e) =>
                    onUpdateDoc(
                      {
                        ...doc,
                        sequence: {
                          ...seq,
                          messages: seq.messages.map((m) =>
                            m.id === message.id ? { ...m, endpoint: e.target.value } : m
                          ),
                        },
                      },
                      true
                    )
                  }
                  className="mt-1 w-full px-2 py-1.5 text-xs font-mono rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                />
              </label>
            </div>

            <label className="block">
              <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Request Payload (JSON)</span>
              <textarea
                rows={4}
                value={message.requestPayload ?? ''}
                disabled={readOnly}
                placeholder='{"id": "usr_123"}'
                onChange={(e) =>
                  onUpdateDoc(
                    {
                      ...doc,
                      sequence: {
                        ...seq,
                        messages: seq.messages.map((m) =>
                          m.id === message.id ? { ...m, requestPayload: e.target.value } : m
                        ),
                      },
                    },
                    true
                  )
                }
                className="mt-1 w-full px-2.5 py-1.5 text-[11px] font-mono rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              />
            </label>

            <label className="block">
              <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Response Payload (JSON)</span>
              <textarea
                rows={3}
                value={message.responsePayload ?? ''}
                disabled={readOnly}
                placeholder='{"status": "ok"}'
                onChange={(e) =>
                  onUpdateDoc(
                    {
                      ...doc,
                      sequence: {
                        ...seq,
                        messages: seq.messages.map((m) =>
                          m.id === message.id ? { ...m, responsePayload: e.target.value } : m
                        ),
                      },
                    },
                    true
                  )
                }
                className="mt-1 w-full px-2.5 py-1.5 text-[11px] font-mono rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              />
            </label>
          </div>
        </aside>
      );
    }

    if (fragment) {
      return (
        <aside className="w-72 h-full shrink-0 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 overflow-y-auto p-4 space-y-4">
          <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
            Combined Fragment
          </h3>
          <label className="block">
            <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Operator</span>
            <select
              value={fragment.kind}
              disabled={readOnly}
              onChange={(e) =>
                onUpdateDoc(
                  {
                    ...doc,
                    sequence: {
                      ...seq,
                      fragments: seq.fragments.map((f) =>
                        f.id === fragment.id ? { ...f, kind: e.target.value as FragmentKind } : f
                      ),
                    },
                  },
                  true
                )
              }
              className="mt-1 w-full px-2.5 py-1.5 text-xs font-mono rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            >
              <option value="alt">alt (Alternative)</option>
              <option value="opt">opt (Optional)</option>
              <option value="loop">loop (Iteration)</option>
              <option value="par">par (Parallel)</option>
              <option value="break">break</option>
              <option value="critical">critical</option>
            </select>
          </label>
          <label className="block">
            <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Guard Expression</span>
            <input
              type="text"
              value={fragment.guard}
              disabled={readOnly}
              onChange={(e) =>
                onUpdateDoc(
                  {
                    ...doc,
                    sequence: {
                      ...seq,
                      fragments: seq.fragments.map((f) =>
                        f.id === fragment.id ? { ...f, guard: e.target.value } : f
                      ),
                    },
                  },
                  true
                )
              }
              className="mt-1 w-full px-2.5 py-1.5 text-xs font-mono rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
          </label>
          <label className="block">
            <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Else Branch (Optional)</span>
            <input
              type="text"
              value={fragment.elseGuard ?? ''}
              disabled={readOnly}
              placeholder="e.g. token expired"
              onChange={(e) =>
                onUpdateDoc(
                  {
                    ...doc,
                    sequence: {
                      ...seq,
                      fragments: seq.fragments.map((f) =>
                        f.id === fragment.id ? { ...f, elseGuard: e.target.value || undefined } : f
                      ),
                    },
                  },
                  true
                )
              }
              className="mt-1 w-full px-2.5 py-1.5 text-xs font-mono rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
          </label>
        </aside>
      );
    }
  }

  // ==========================================
  // 2. Floor Plan Selection Properties
  // ==========================================
  if (doc.type === 'floorplan' && doc.floorplan && selectedFloorItem) {
    const fp = doc.floorplan;

    if (selectedFloorItem.kind === 'room') {
      const room = fp.rooms.find((r) => r.id === selectedFloorItem.id);
      if (room) {
        return (
          <aside className="w-72 h-full shrink-0 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 overflow-y-auto p-4 space-y-4">
            <div>
              <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100">Room</h3>
              <p className="text-xs font-mono text-slate-500 dark:text-slate-400 tabular-nums mt-0.5">
                Area: {formatArea(room.areaSqM, fp.unit)}
              </p>
            </div>
            <label className="block">
              <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Room Name</span>
              <input
                type="text"
                value={room.name}
                disabled={readOnly}
                onChange={(e) =>
                  onUpdateDoc(
                    {
                      ...doc,
                      floorplan: {
                        ...fp,
                        rooms: fp.rooms.map((r) =>
                          r.id === room.id ? { ...r, name: e.target.value } : r
                        ),
                      },
                    },
                    true
                  )
                }
                className="mt-1 w-full px-2.5 py-1.5 text-xs rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </label>
            <label className="block">
              <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Floor Material</span>
              <select
                value={room.floorMaterial}
                disabled={readOnly}
                onChange={(e) =>
                  onUpdateDoc(
                    {
                      ...doc,
                      floorplan: {
                        ...fp,
                        rooms: fp.rooms.map((r) =>
                          r.id === room.id
                            ? { ...r, floorMaterial: e.target.value as typeof r.floorMaterial }
                            : r
                        ),
                      },
                    },
                    true
                  )
                }
                className="mt-1 w-full px-2.5 py-1.5 text-xs rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              >
                <option value="hardwood">Hardwood</option>
                <option value="carpet">Carpet</option>
                <option value="tile">Ceramic Tile</option>
                <option value="concrete">Polished Concrete</option>
                <option value="marble">Stone / Marble</option>
              </select>
            </label>
            <div>
              <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1.5">
                Tint
              </span>
              <div className="flex gap-1.5">
                {['#F8FAFC', '#F0F9FF', '#F0FDFA', '#FFFBEB', '#FEF2F2'].map((col) => (
                  <button
                    key={col}
                    type="button"
                    onClick={() =>
                      onUpdateDoc(
                        {
                          ...doc,
                          floorplan: {
                            ...fp,
                            rooms: fp.rooms.map((r) => (r.id === room.id ? { ...r, color: col } : r)),
                          },
                        },
                        true
                      )
                    }
                    className={`w-6 h-6 rounded border border-slate-300 ${room.color === col ? 'ring-2 ring-blue-600' : ''}`}
                    style={{ backgroundColor: col }}
                  />
                ))}
              </div>
            </div>
          </aside>
        );
      }
    }

    if (selectedFloorItem.kind === 'furniture') {
      const f = fp.furniture.find((item) => item.id === selectedFloorItem.id);
      if (f) {
        return (
          <aside className="w-72 h-full shrink-0 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 overflow-y-auto p-4 space-y-4">
            <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100">Furniture</h3>
            <label className="block">
              <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Label</span>
              <input
                type="text"
                value={f.label}
                disabled={readOnly}
                onChange={(e) =>
                  onUpdateDoc(
                    {
                      ...doc,
                      floorplan: {
                        ...fp,
                        furniture: fp.furniture.map((it) =>
                          it.id === f.id ? { ...it, label: e.target.value } : it
                        ),
                      },
                    },
                    true
                  )
                }
                className="mt-1 w-full px-2.5 py-1.5 text-xs rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label>
                <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Width (m)</span>
                <input
                  type="number"
                  step="0.1"
                  min="0.3"
                  value={f.width}
                  disabled={readOnly}
                  onChange={(e) =>
                    onUpdateDoc(
                      {
                        ...doc,
                        floorplan: {
                          ...fp,
                          furniture: fp.furniture.map((it) =>
                            it.id === f.id ? { ...it, width: Math.max(0.3, Number(e.target.value)) } : it
                          ),
                        },
                      },
                      true
                    )
                  }
                  className="mt-1 w-full px-2 py-1.5 text-xs font-mono tabular-nums rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </label>
              <label>
                <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Depth (m)</span>
                <input
                  type="number"
                  step="0.1"
                  min="0.3"
                  value={f.depth}
                  disabled={readOnly}
                  onChange={(e) =>
                    onUpdateDoc(
                      {
                        ...doc,
                        floorplan: {
                          ...fp,
                          furniture: fp.furniture.map((it) =>
                            it.id === f.id ? { ...it, depth: Math.max(0.3, Number(e.target.value)) } : it
                          ),
                        },
                      },
                      true
                    )
                  }
                  className="mt-1 w-full px-2 py-1.5 text-xs font-mono tabular-nums rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </label>
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                Rotation ({f.rotation}°)
              </span>
              <button
                type="button"
                disabled={readOnly}
                onClick={() =>
                  onUpdateDoc(
                    {
                      ...doc,
                      floorplan: {
                        ...fp,
                        furniture: fp.furniture.map((it) =>
                          it.id === f.id ? { ...it, rotation: (it.rotation + 45) % 360 } : it
                        ),
                      },
                    },
                    true
                  )
                }
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>+45°</span>
              </button>
            </div>
          </aside>
        );
      }
    }

    if (selectedFloorItem.kind === 'wall') {
      const w = fp.walls.find((item) => item.id === selectedFloorItem.id);
      if (w) {
        const len = Math.hypot(w.x2 - w.x1, w.y2 - w.y1);
        return (
          <aside className="w-72 h-full shrink-0 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 overflow-y-auto p-4 space-y-4">
            <div>
              <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100">Wall Segment</h3>
              <p className="text-xs font-mono text-slate-500 tabular-nums mt-0.5">
                Length: {formatLength(len, fp.unit)}
              </p>
            </div>
            <label className="block">
              <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Wall Type</span>
              <select
                value={w.kind}
                disabled={readOnly}
                onChange={(e) => {
                  const kind = e.target.value as 'exterior' | 'interior';
                  onUpdateDoc(
                    {
                      ...doc,
                      floorplan: {
                        ...fp,
                        walls: fp.walls.map((it) =>
                          it.id === w.id
                            ? { ...it, kind, thickness: kind === 'exterior' ? 0.22 : 0.14 }
                            : it
                        ),
                      },
                    },
                    true
                  );
                }}
                className="mt-1 w-full px-2.5 py-1.5 text-xs rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              >
                <option value="exterior">Exterior Wall (22 cm)</option>
                <option value="interior">Interior Partition (14 cm)</option>
              </select>
            </label>
          </aside>
        );
      }
    }
  }

  // ==========================================
  // 3. Standard Object Properties
  // ==========================================
  if (selectedObject) {
    return (
      <aside className="w-72 h-full shrink-0 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 overflow-y-auto p-4 space-y-5">
        <div>
          <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
            Selected Object
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            {selectedObject.type}
          </p>
        </div>

        {/* Content */}
        <div className="space-y-3">
          <label className="block">
            <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Label</span>
            <input
              type="text"
              value={selectedObject.label}
              disabled={readOnly}
              onChange={(e) => updateObj({ label: e.target.value })}
              className="mt-1 w-full px-2.5 py-1.5 text-xs rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
            />
          </label>

          {selectedObject.category !== 'entity' && (
            <label className="block">
              <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Subtitle</span>
              <input
                type="text"
                value={selectedObject.metadata.subtitle ?? ''}
                disabled={readOnly}
                placeholder="Optional descriptor"
                onChange={(e) => updateObjMeta({ subtitle: e.target.value || undefined })}
                className="mt-1 w-full px-2.5 py-1.5 text-xs rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              />
            </label>
          )}
        </div>

        {/* Geometry */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Geometry</div>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                ['X', 'x'],
                ['Y', 'y'],
                ['W', 'width'],
                ['H', 'height'],
              ] as const
            ).map(([lbl, key]) => (
              <label key={key} className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-2 py-1">
                <span className="text-[10.5px] font-mono text-slate-400">{lbl}</span>
                <input
                  type="number"
                  value={Math.round(selectedObject[key])}
                  disabled={readOnly}
                  onChange={(e) => updateObj({ [key]: Number(e.target.value) })}
                  className="w-full text-xs font-mono tabular-nums bg-transparent text-slate-900 dark:text-slate-100 outline-none text-right"
                />
              </label>
            ))}
          </div>
        </div>

        {/* Appearance */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Appearance</div>
          <div className="flex flex-wrap gap-1.5">
            {SWATCH_COLORS.map((sw) => (
              <button
                key={sw.name}
                type="button"
                disabled={readOnly}
                onClick={() =>
                  updateObjStyle({ fill: sw.fill, stroke: sw.stroke, textColor: sw.text })
                }
                className="w-6 h-6 rounded-md border transition-transform hover:scale-105"
                style={{ backgroundColor: sw.fill, borderColor: sw.stroke, borderWidth: 2 }}
                title={sw.name}
              />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Radius</span>
              <input
                type="number"
                min={0}
                max={40}
                value={selectedObject.style.borderRadius}
                disabled={readOnly}
                onChange={(e) => updateObjStyle({ borderRadius: Number(e.target.value) })}
                className="mt-1 w-full px-2 py-1 text-xs font-mono tabular-nums rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </label>
            <label>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Opacity</span>
              <input
                type="number"
                min={0.1}
                max={1}
                step={0.1}
                value={selectedObject.style.opacity}
                disabled={readOnly}
                onChange={(e) => updateObjStyle({ opacity: Number(e.target.value) })}
                className="mt-1 w-full px-2 py-1 text-xs font-mono tabular-nums rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </label>
          </div>
        </div>

        {/* Architecture Metadata */}
        {doc.type === 'architecture' && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Architecture Metadata
            </div>
            <label className="block">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Technology</span>
              <input
                type="text"
                value={selectedObject.metadata.technology ?? ''}
                disabled={readOnly}
                placeholder="e.g. PostgreSQL 16"
                onChange={(e) => updateObjMeta({ technology: e.target.value || undefined })}
                className="mt-1 w-full px-2 py-1.5 text-xs font-mono rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </label>
            <label className="block">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Environment</span>
              <select
                value={selectedObject.metadata.environment ?? 'production'}
                disabled={readOnly}
                onChange={(e) =>
                  updateObjMeta({
                    environment: e.target.value as DiagramObject['metadata']['environment'],
                  })
                }
                className="mt-1 w-full px-2 py-1.5 text-xs rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              >
                <option value="production">Production</option>
                <option value="staging">Staging</option>
                <option value="dev">Development</option>
                <option value="local">Local</option>
              </select>
            </label>
            <label className="block">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Owner / Team</span>
              <input
                type="text"
                value={selectedObject.metadata.owner ?? ''}
                disabled={readOnly}
                placeholder="e.g. Platform Core"
                onChange={(e) => updateObjMeta({ owner: e.target.value || undefined })}
                className="mt-1 w-full px-2 py-1.5 text-xs rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </label>
          </div>
        )}

        {/* ERD Fields Editor */}
        {selectedObject.category === 'entity' && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Columns
              </span>
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => {
                    const nextFields = [
                      ...(selectedObject.metadata.fields ?? []),
                      { id: makeId('f'), name: 'new_col', type: 'varchar', key: '' as const },
                    ];
                    updateObj({
                      height: Math.max(selectedObject.height, 44 + nextFields.length * 26),
                      metadata: { ...selectedObject.metadata, fields: nextFields },
                    });
                  }}
                  className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-0.5 font-medium"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              )}
            </div>
            <div className="space-y-1.5">
              {(selectedObject.metadata.fields ?? []).map((f) => (
                <div key={f.id} className="flex items-center gap-1">
                  <select
                    value={f.key ?? ''}
                    disabled={readOnly}
                    onChange={(e) => {
                      const next = (selectedObject.metadata.fields ?? []).map((item) =>
                        item.id === f.id ? { ...item, key: e.target.value as typeof f.key } : item
                      );
                      updateObjMeta({ fields: next });
                    }}
                    className="w-12 px-1 py-1 text-[10.5px] font-mono rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  >
                    <option value="">—</option>
                    <option value="PK">PK</option>
                    <option value="FK">FK</option>
                  </select>
                  <input
                    type="text"
                    value={f.name}
                    disabled={readOnly}
                    onChange={(e) => {
                      const next = (selectedObject.metadata.fields ?? []).map((item) =>
                        item.id === f.id ? { ...item, name: e.target.value } : item
                      );
                      updateObjMeta({ fields: next });
                    }}
                    className="flex-1 min-w-0 px-1.5 py-1 text-[11px] font-mono rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                  <input
                    type="text"
                    value={f.type}
                    disabled={readOnly}
                    onChange={(e) => {
                      const next = (selectedObject.metadata.fields ?? []).map((item) =>
                        item.id === f.id ? { ...item, type: e.target.value } : item
                      );
                      updateObjMeta({ fields: next });
                    }}
                    className="w-16 px-1.5 py-1 text-[10.5px] font-mono rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => {
                        const next = (selectedObject.metadata.fields ?? []).filter((item) => item.id !== f.id);
                        updateObjMeta({ fields: next });
                      }}
                      className="p-1 text-slate-400 hover:text-red-600"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </aside>
    );
  }

  // ==========================================
  // 4. Connection Properties
  // ==========================================
  if (selectedConnection) {
    return (
      <aside className="w-72 h-full shrink-0 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 overflow-y-auto p-4 space-y-4">
        <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100">Connector</h3>
        <label className="block">
          <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Label</span>
          <input
            type="text"
            value={selectedConnection.label ?? ''}
            disabled={readOnly}
            placeholder="e.g. Yes, HTTPS, 1:N"
            onChange={(e) => updateConn({ label: e.target.value || undefined })}
            className="mt-1 w-full px-2.5 py-1.5 text-xs rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
          />
        </label>

        {doc.type === 'architecture' && (
          <label className="block">
            <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
              Protocol Semantics
            </span>
            <select
              value={selectedConnection.protocol ?? ''}
              disabled={readOnly}
              onChange={(e) => {
                const proto = e.target.value;
                const preset = PROTOCOL_STYLES[proto];
                if (preset) {
                  updateConn({
                    protocol: proto,
                    label: proto,
                    color: preset.color,
                    lineStyle: preset.lineStyle,
                  });
                } else {
                  updateConn({ protocol: undefined });
                }
              }}
              className="mt-1 w-full px-2.5 py-1.5 text-xs rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            >
              <option value="">Custom</option>
              {Object.entries(PROTOCOL_STYLES).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
          </label>
        )}

        <div className="grid grid-cols-2 gap-2">
          <label>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Routing</span>
            <select
              value={selectedConnection.routing}
              disabled={readOnly}
              onChange={(e) => updateConn({ routing: e.target.value as ConnectorRouting })}
              className="mt-1 w-full px-2 py-1.5 text-xs rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            >
              <option value="orthogonal">Orthogonal</option>
              <option value="curved">Curved</option>
              <option value="straight">Straight</option>
            </select>
          </label>
          <label>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Line Style</span>
            <select
              value={selectedConnection.lineStyle}
              disabled={readOnly}
              onChange={(e) => updateConn({ lineStyle: e.target.value as ConnectorLineStyle })}
              className="mt-1 w-full px-2 py-1.5 text-xs rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            >
              <option value="solid">Solid</option>
              <option value="dashed">Dashed</option>
              <option value="dotted">Dotted</option>
            </select>
          </label>
        </div>

        <label className="block">
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Arrowhead</span>
          <select
            value={selectedConnection.arrowEnd}
            disabled={readOnly}
            onChange={(e) =>
              updateConn({ arrowEnd: e.target.value as DiagramConnection['arrowEnd'] })
            }
            className="mt-1 w-full px-2.5 py-1.5 text-xs rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
          >
            <option value="arrow">Solid Arrow</option>
            <option value="open">Open Arrow</option>
            <option value="crow">Crow's Foot (1:N)</option>
            <option value="none">None</option>
          </select>
        </label>
      </aside>
    );
  }

  // ==========================================
  // 5. Diagram-Level Settings (Nothing Selected)
  // ==========================================
  return (
    <aside className="w-72 h-full shrink-0 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 overflow-y-auto p-4 space-y-5">
      <div>
        <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
          Diagram Settings
        </h3>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          Theme, layout, and canvas behavior
        </p>
      </div>

      {/* Visual Themes (PRD 11.4) */}
      <div className="space-y-2">
        <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
          Diagram Theme
        </div>
        <div className="grid grid-cols-1 gap-1.5">
          {(Object.keys(DIAGRAM_THEMES) as DiagramThemeId[]).map((tid) => {
            const t = DIAGRAM_THEMES[tid];
            const active = doc.settings.theme === tid;
            return (
              <button
                key={tid}
                type="button"
                onClick={() =>
                  onUpdateDoc({ ...doc, settings: { ...doc.settings, theme: tid } }, true)
                }
                className={`flex items-center justify-between px-2.5 py-2 rounded-lg border text-left transition-colors ${
                  active
                    ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <div>
                  <div className="text-xs font-medium text-slate-900 dark:text-slate-100">
                    {t.name}
                  </div>
                  <div className="text-[10.5px] text-slate-500 dark:text-slate-400 line-clamp-1">
                    {t.description}
                  </div>
                </div>
                <span
                  className="w-4 h-4 rounded-full border border-slate-300 shrink-0"
                  style={{ backgroundColor: tid === 'blueprint' ? '#173A66' : t.accent }}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* Sequence-specific View Controls */}
      {doc.type === 'sequence' && doc.sequence && (
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            Sequence Mode
          </div>
          <div className="grid grid-cols-2 gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800">
            {(['modern', 'classic'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() =>
                  onUpdateDoc(
                    { ...doc, sequence: { ...doc.sequence!, viewMode: mode } },
                    true
                  )
                }
                className={`py-1.5 text-xs font-medium rounded-md capitalize transition-colors ${
                  doc.sequence!.viewMode === mode
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
          <label className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
            <span>Auto Activation Bars</span>
            <input
              type="checkbox"
              checked={doc.sequence.autoActivation}
              onChange={(e) =>
                onUpdateDoc(
                  { ...doc, sequence: { ...doc.sequence!, autoActivation: e.target.checked } },
                  true
                )
              }
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
          </label>
        </div>
      )}

      {/* Floor Plan Units & Visibility */}
      {doc.type === 'floorplan' && doc.floorplan && (
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            Measurement System
          </div>
          <select
            value={doc.floorplan.unit}
            onChange={(e) =>
              onUpdateDoc(
                {
                  ...doc,
                  floorplan: { ...doc.floorplan!, unit: e.target.value as MeasurementUnit },
                },
                true
              )
            }
            className="w-full px-2.5 py-1.5 text-xs rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
          >
            <option value="ft-in">Feet & Inches (14' 6")</option>
            <option value="ft">Decimal Feet (14.5 ft)</option>
            <option value="m">Meters (4.42 m)</option>
            <option value="cm">Centimeters (442 cm)</option>
            <option value="mm">Millimeters (4420 mm)</option>
          </select>

          <div className="space-y-2 pt-1">
            {(
              [
                ['Show Dimensions', 'showDimensions'],
                ['Show Rooms & Areas', 'showRooms'],
                ['Show Furniture', 'showFurniture'],
              ] as const
            ).map(([label, key]) => (
              <label key={key} className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                <span>{label}</span>
                <input
                  type="checkbox"
                  checked={doc.floorplan![key]}
                  onChange={(e) =>
                    onUpdateDoc(
                      { ...doc, floorplan: { ...doc.floorplan!, [key]: e.target.checked } },
                      true
                    )
                  }
                  className="rounded border-slate-300 text-blue-600"
                />
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Architecture Environment Filter */}
      {doc.type === 'architecture' && (
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            Environment View
          </div>
          <select
            value={doc.settings.activeEnvironment ?? 'all'}
            onChange={(e) =>
              onUpdateDoc(
                {
                  ...doc,
                  settings: {
                    ...doc.settings,
                    activeEnvironment: e.target.value as DiagramDocument['settings']['activeEnvironment'],
                  },
                },
                false
              )
            }
            className="w-full px-2.5 py-1.5 text-xs rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
          >
            <option value="all">All Environments</option>
            <option value="production">Production Only</option>
            <option value="staging">Staging Only</option>
            <option value="dev">Development Only</option>
            <option value="local">Local Only</option>
          </select>
        </div>
      )}

      {/* Auto-Layout Controls (for graph-based editors) */}
      {doc.type !== 'sequence' && doc.type !== 'floorplan' && !readOnly && (
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            Auto-Layout
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => onApplyLayout('TB')}
              className="flex flex-col items-center gap-1 py-2 px-1.5 rounded-md border border-slate-200 dark:border-slate-700 text-[11px] font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <ArrowDownUp className="w-3.5 h-3.5" />
              <span>Vertical</span>
            </button>
            <button
              type="button"
              onClick={() => onApplyLayout('LR')}
              className="flex flex-col items-center gap-1 py-2 px-1.5 rounded-md border border-slate-200 dark:border-slate-700 text-[11px] font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>Horizontal</span>
            </button>
            <button
              type="button"
              onClick={() => onApplyLayout('GRID')}
              className="flex flex-col items-center gap-1 py-2 px-1.5 rounded-md border border-slate-200 dark:border-slate-700 text-[11px] font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Grid</span>
            </button>
          </div>
        </div>
      )}

      {/* Non-blocking Validation Diagnostics */}
      {issues.length > 0 && (
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            Diagram Checks ({issues.length})
          </div>
          <div className="space-y-1.5">
            {issues.slice(0, 6).map((issue) => (
              <button
                key={issue.id}
                type="button"
                onClick={() => issue.objectId && onFocusObject(issue.objectId)}
                className="w-full flex items-start gap-2 p-2 rounded-md bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 text-left text-[11px] text-slate-700 dark:text-slate-300"
              >
                {issue.severity === 'warning' ? (
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                ) : (
                  <Info className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                )}
                <span>{issue.message}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {!readOnly && (
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onSaveAsTemplate}
            className="w-full py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Save Diagram as Template
          </button>
        </div>
      )}
    </aside>
  );
};
