import React, { useState } from 'react';
import {
  AlignCenterHorizontal,
  AlignStartHorizontal,
  ArrowDown,
  ArrowUp,
  BookmarkPlus,
  Box,
  Copy,
  FlipHorizontal,
  Lock,
  Palette,
  RefreshCw,
  RotateCw,
  Trash2,
  Type,
  Unlock,
} from 'lucide-react';
import {
  DiagramDocument,
  DiagramObject,
  FragmentKind,
  SequenceMessageType,
} from '../../types/diagram';
import { SWATCH_COLORS } from '../../engine/themes';
import { getLibraryForType } from '../../engine/libraries';
import { FloorSelectionItem } from '../canvas/FloorPlanCanvas';
import { Tooltip } from '../ui/Tooltip';

interface FloatingToolbarProps {
  doc: DiagramDocument;
  selectedObjects: DiagramObject[];
  selectedConnectionId: string | null;
  selectedMessageIds: string[];
  selectedParticipantIds: string[];
  selectedFragmentId: string | null;
  selectedFloorItems: FloorSelectionItem[];
  onEditLabel: () => void;
  onChangeColor: (fill: string, stroke: string, textColor: string) => void;
  onReplaceShape: (newType: string, labelHint?: string) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onToggleLock: () => void;
  onAlignLeft: () => void;
  onAlignCenter: () => void;
  onSaveComponent: () => void;
  // Sequence actions
  onChangeMessageType: (t: SequenceMessageType) => void;
  onMoveMessage: (delta: -1 | 1) => void;
  onWrapInFragment: (kind: FragmentKind) => void;
  // Floorplan actions
  onFlipDoorSwing: () => void;
  onRotateFurniture: () => void;
}

export const FloatingToolbar: React.FC<FloatingToolbarProps> = ({
  doc,
  selectedObjects,
  selectedConnectionId,
  selectedMessageIds,
  selectedParticipantIds,
  selectedFragmentId,
  selectedFloorItems,
  onEditLabel,
  onChangeColor,
  onReplaceShape,
  onDuplicate,
  onDelete,
  onToggleLock,
  onAlignLeft,
  onAlignCenter,
  onSaveComponent,
  onChangeMessageType,
  onMoveMessage,
  onWrapInFragment,
  onFlipDoorSwing,
  onRotateFurniture,
}) => {
  const [showColors, setShowColors] = useState(false);
  const [showReplace, setShowReplace] = useState(false);
  const [showFragments, setShowFragments] = useState(false);

  const hasStandard = selectedObjects.length > 0 || Boolean(selectedConnectionId);
  const hasSequence =
    doc.type === 'sequence' &&
    (selectedMessageIds.length > 0 || selectedParticipantIds.length > 0 || Boolean(selectedFragmentId));
  const hasFloor = doc.type === 'floorplan' && selectedFloorItems.length > 0;

  if (!hasStandard && !hasSequence && !hasFloor) return null;

  const singleObj = selectedObjects.length === 1 ? selectedObjects[0] : null;
  const singleFloorItem = selectedFloorItems.length === 1 ? selectedFloorItems[0] : null;
  const multiCount =
    doc.type === 'sequence'
      ? selectedParticipantIds.length + selectedMessageIds.length
      : doc.type === 'floorplan'
      ? selectedFloorItems.length
      : selectedObjects.length;
  const replaceableItems = getLibraryForType(doc.type).filter((i) => i.category === 'shape');

  return (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 px-2 py-1.5 rounded-xl bg-white/95 dark:bg-[#0C121E]/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-lg dark:shadow-black/50">
      {multiCount >= 2 && (
        <>
          <span className="px-2 text-xs font-medium text-teal-700 dark:text-teal-300 tabular-nums whitespace-nowrap">
            {multiCount} selected
          </span>
          <div className="w-px h-4 bg-slate-200 dark:bg-slate-800 mx-0.5" />
        </>
      )}
      {/* Standard Diagram Contextual Actions */}
      {hasStandard && (
        <>
          {singleObj && (
            <Tooltip
              label="Edit Label"
              description="Rename the selected object inline"
              shortcut="Double-click"
            >
              <button
                type="button"
                onClick={onEditLabel}
                className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap"
              >
                <Type className="w-3.5 h-3.5" />
                <span>Label</span>
              </button>
            </Tooltip>
          )}

          {selectedObjects.length > 0 && (
            <div className="relative">
              <Tooltip
                label="Fill & Stroke Color"
                description="Apply a curated color swatch to all selected objects"
                disabled={showColors}
              >
                <button
                  type="button"
                  onClick={() => {
                    setShowColors((s) => !s);
                    setShowReplace(false);
                  }}
                  className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap"
                >
                  <Palette className="w-3.5 h-3.5" />
                  <span>Color</span>
                </button>
              </Tooltip>
              {showColors && (
                <div className="absolute top-full left-0 mt-2 p-2 rounded-xl bg-white dark:bg-[#0D1422] border border-slate-200 dark:border-slate-800 shadow-xl dark:shadow-black/60 flex gap-1.5 nx-menu-enter">
                  {SWATCH_COLORS.map((sw) => (
                    <Tooltip key={sw.name} label={sw.name} description="Apply swatch color" side="bottom">
                      <button
                        type="button"
                        onClick={() => {
                          onChangeColor(sw.fill, sw.stroke, sw.text);
                          setShowColors(false);
                        }}
                        className="w-6 h-6 rounded-md border-2 hover:scale-110 transition-transform"
                        style={{ backgroundColor: sw.fill, borderColor: sw.stroke }}
                        aria-label={`Apply ${sw.name} color`}
                      />
                    </Tooltip>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Smart Shape Replacement (Scenario G) */}
          {singleObj && singleObj.category === 'shape' && replaceableItems.length > 1 && (
            <div className="relative">
              <Tooltip
                label="Replace Shape"
                description="Swap this component type while keeping its connectors attached"
                disabled={showReplace}
              >
                <button
                  type="button"
                  onClick={() => {
                    setShowReplace((s) => !s);
                    setShowColors(false);
                  }}
                  className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Replace</span>
                </button>
              </Tooltip>
              {showReplace && (
                <div className="absolute top-full left-0 mt-2 w-48 max-h-60 overflow-y-auto p-1.5 rounded-xl bg-white dark:bg-[#0D1422] border border-slate-200 dark:border-slate-800 shadow-xl dark:shadow-black/60 space-y-0.5 nx-menu-enter">
                  {replaceableItems.map((it) => (
                    <button
                      key={it.id}
                      type="button"
                      onClick={() => {
                        onReplaceShape(it.type, it.label);
                        setShowReplace(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 text-xs rounded-md text-slate-700 dark:text-slate-200 hover:bg-teal-50 dark:hover:bg-teal-950/60 hover:text-teal-800 dark:hover:text-teal-300 transition-colors"
                    >
                      {it.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {selectedObjects.length >= 2 && (
            <>
              <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-0.5" />
              <Tooltip
                label="Align Left Edges"
                description="Line up all selected shapes along their leftmost edge"
              >
                <button
                  type="button"
                  onClick={onAlignLeft}
                  className="p-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  aria-label="Align left edges"
                >
                  <AlignStartHorizontal className="w-3.5 h-3.5" />
                </button>
              </Tooltip>
              <Tooltip
                label="Align Horizontal Centers"
                description="Center all selected shapes along a shared vertical axis"
              >
                <button
                  type="button"
                  onClick={onAlignCenter}
                  className="p-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  aria-label="Align horizontal centers"
                >
                  <AlignCenterHorizontal className="w-3.5 h-3.5" />
                </button>
              </Tooltip>
            </>
          )}

          {selectedObjects.length > 0 && (
            <>
              <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-0.5" />
              <Tooltip
                label="Duplicate Selection"
                description="Create an offset copy of all selected items"
                shortcut="⌘D"
              >
                <button
                  type="button"
                  onClick={onDuplicate}
                  className="p-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  aria-label="Duplicate selected"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </Tooltip>
              {singleObj && (
                <>
                  <Tooltip
                    label="Save as Reusable Component"
                    description="Store this styled node in your Saved Components library"
                  >
                    <button
                      type="button"
                      onClick={onSaveComponent}
                      className="p-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      aria-label="Save as reusable component"
                    >
                      <BookmarkPlus className="w-3.5 h-3.5" />
                    </button>
                  </Tooltip>
                  <Tooltip
                    label={singleObj.locked ? 'Unlock Object' : 'Lock Object'}
                    description={
                      singleObj.locked
                        ? 'Allow moving, editing, and deleting this object again'
                        : 'Prevent accidental movement or deletion on the canvas'
                    }
                  >
                    <button
                      type="button"
                      onClick={onToggleLock}
                      className="p-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      aria-label={singleObj.locked ? 'Unlock object' : 'Lock object'}
                    >
                      {singleObj.locked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                    </button>
                  </Tooltip>
                </>
              )}
            </>
          )}
        </>
      )}

      {/* Sequence Diagram Contextual Actions */}
      {hasSequence && selectedMessageIds.length > 0 && (
        <>
          {(
            [
              ['sync', 'Synchronous Call', 'Solid arrow representing a blocking request/call'],
              ['async', 'Asynchronous Message', 'Open arrow for non-blocking events or fire-and-forget calls'],
              ['return', 'Return Response', 'Dashed arrow returning data or status to the caller'],
            ] as const
          ).map(([t, title, desc]) => (
            <Tooltip key={t} label={title} description={desc}>
              <button
                type="button"
                onClick={() => onChangeMessageType(t)}
                className="px-2 py-1 text-xs font-medium rounded-md text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 capitalize whitespace-nowrap"
              >
                {t}
              </button>
            </Tooltip>
          ))}
          <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-0.5" />
          <Tooltip
            label="Move Call Earlier"
            description="Shift the selected call one step earlier in the sequence"
            shortcut="Alt+↑"
          >
            <button
              type="button"
              onClick={() => onMoveMessage(-1)}
              className="p-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Move message earlier"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </Tooltip>
          <Tooltip
            label="Move Call Later"
            description="Shift the selected call one step later in the sequence"
            shortcut="Alt+↓"
          >
            <button
              type="button"
              onClick={() => onMoveMessage(1)}
              className="p-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Move message later"
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
          </Tooltip>
          <div className="relative">
            <Tooltip
              label="Wrap in Combined Fragment"
              description="Group selected calls inside an alt, opt, loop, or par block"
              disabled={showFragments}
            >
              <button
                type="button"
                onClick={() => setShowFragments((s) => !s)}
                className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md text-teal-800 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 dark:hover:bg-teal-900/60 whitespace-nowrap transition-colors"
              >
                <Box className="w-3.5 h-3.5" />
                <span>Wrap in Fragment</span>
              </button>
            </Tooltip>
            {showFragments && (
              <div className="absolute top-full left-0 mt-2 w-40 p-1.5 rounded-xl bg-white dark:bg-[#0D1422] border border-slate-200 dark:border-slate-800 shadow-xl dark:shadow-black/60 space-y-0.5 nx-menu-enter">
                {(['alt', 'opt', 'loop', 'par'] as const).map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => {
                      onWrapInFragment(k);
                      setShowFragments(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 text-xs font-mono rounded-md text-slate-700 dark:text-slate-200 hover:bg-teal-50 dark:hover:bg-teal-950/60 hover:text-teal-800 dark:hover:text-teal-300 transition-colors"
                  >
                    {k} fragment
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Floor Plan Contextual Actions */}
      {hasFloor && singleFloorItem?.kind === 'opening' && (
        <Tooltip
          label="Flip Door Swing"
          description="Reverse whether this door swings inward or outward"
        >
          <button
            type="button"
            onClick={onFlipDoorSwing}
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap"
          >
            <FlipHorizontal className="w-3.5 h-3.5" />
            <span>Flip Swing</span>
          </button>
        </Tooltip>
      )}
      {hasFloor && singleFloorItem?.kind === 'furniture' && (
        <Tooltip
          label="Rotate Item +45°"
          description="Rotate the selected furniture or fixture 45 degrees clockwise"
        >
          <button
            type="button"
            onClick={onRotateFurniture}
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Rotate 45°</span>
          </button>
        </Tooltip>
      )}

      {/* Delete action */}
      <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-0.5" />
      <Tooltip
        label={multiCount >= 2 ? `Delete ${multiCount} Selected Items` : 'Delete Selected'}
        description="Remove the selected elements from the canvas (undoable)"
        shortcut="Del"
      >
        <button
          type="button"
          onClick={onDelete}
          className="flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 whitespace-nowrap"
          aria-label="Delete selected items"
        >
          <Trash2 className="w-3.5 h-3.5" />
          {multiCount >= 2 && <span>Delete ({multiCount})</span>}
        </button>
      </Tooltip>
    </div>
  );
};
