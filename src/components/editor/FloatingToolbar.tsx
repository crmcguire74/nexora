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
            <button
              type="button"
              onClick={onEditLabel}
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap"
              title="Edit label (Double-click)"
            >
              <Type className="w-3.5 h-3.5" />
              <span>Label</span>
            </button>
          )}

          {selectedObjects.length > 0 && (
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowColors((s) => !s);
                  setShowReplace(false);
                }}
                className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap"
                title="Change color"
              >
                <Palette className="w-3.5 h-3.5" />
                <span>Color</span>
              </button>
              {showColors && (
                <div className="absolute top-full left-0 mt-2 p-2 rounded-xl bg-white dark:bg-[#0D1422] border border-slate-200 dark:border-slate-800 shadow-xl dark:shadow-black/60 flex gap-1.5 nx-menu-enter">
                  {SWATCH_COLORS.map((sw) => (
                    <button
                      key={sw.name}
                      type="button"
                      onClick={() => {
                        onChangeColor(sw.fill, sw.stroke, sw.text);
                        setShowColors(false);
                      }}
                      className="w-6 h-6 rounded-md border-2 hover:scale-110 transition-transform"
                      style={{ backgroundColor: sw.fill, borderColor: sw.stroke }}
                      title={sw.name}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Smart Shape Replacement (Scenario G) */}
          {singleObj && singleObj.category === 'shape' && replaceableItems.length > 1 && (
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowReplace((s) => !s);
                  setShowColors(false);
                }}
                className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap"
                title="Replace shape type while preserving connections"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Replace</span>
              </button>
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
              <button
                type="button"
                onClick={onAlignLeft}
                className="p-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                title="Align left"
              >
                <AlignStartHorizontal className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={onAlignCenter}
                className="p-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                title="Align center"
              >
                <AlignCenterHorizontal className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          {selectedObjects.length > 0 && (
            <>
              <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-0.5" />
              <button
                type="button"
                onClick={onDuplicate}
                className="p-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                title="Duplicate (Ctrl+D)"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              {singleObj && (
                <>
                  <button
                    type="button"
                    onClick={onSaveComponent}
                    className="p-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="Save as reusable component"
                  >
                    <BookmarkPlus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={onToggleLock}
                    className="p-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    title={singleObj.locked ? 'Unlock' : 'Lock'}
                  >
                    {singleObj.locked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                  </button>
                </>
              )}
            </>
          )}
        </>
      )}

      {/* Sequence Diagram Contextual Actions */}
      {hasSequence && selectedMessageIds.length > 0 && (
        <>
          {(['sync', 'async', 'return'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => onChangeMessageType(t)}
              className="px-2 py-1 text-xs font-medium rounded-md text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 capitalize whitespace-nowrap"
            >
              {t}
            </button>
          ))}
          <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-0.5" />
          <button
            type="button"
            onClick={() => onMoveMessage(-1)}
            className="p-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Move earlier (Alt+Up)"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onMoveMessage(1)}
            className="p-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Move later (Alt+Down)"
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowFragments((s) => !s)}
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md text-teal-800 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 dark:hover:bg-teal-900/60 whitespace-nowrap transition-colors"
            >
              <Box className="w-3.5 h-3.5" />
              <span>Wrap in Fragment</span>
            </button>
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
        <button
          type="button"
          onClick={onFlipDoorSwing}
          className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap"
        >
          <FlipHorizontal className="w-3.5 h-3.5" />
          <span>Flip Swing</span>
        </button>
      )}
      {hasFloor && singleFloorItem?.kind === 'furniture' && (
        <button
          type="button"
          onClick={onRotateFurniture}
          className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap"
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span>Rotate 45°</span>
        </button>
      )}

      {/* Delete action */}
      <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-0.5" />
      <button
        type="button"
        onClick={onDelete}
        className="flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 whitespace-nowrap"
        title="Delete selected (Backspace / Delete)"
      >
        <Trash2 className="w-3.5 h-3.5" />
        {multiCount >= 2 && <span>Delete ({multiCount})</span>}
      </button>
    </div>
  );
};
