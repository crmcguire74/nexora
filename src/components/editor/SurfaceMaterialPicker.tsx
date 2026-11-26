import React, { useMemo } from 'react';
import { SurfaceTextureId } from '../../types/diagram';
import {
  getTextureSwatchDataUrl,
  SURFACE_TEXTURES,
} from '../../engine/floor3dMaterials';

interface SurfaceMaterialPickerProps {
  title?: string;
  target: 'wall' | 'floor' | 'asset';
  selectedTexture: SurfaceTextureId;
  selectedColor: string;
  colorSwatches: Array<{ name: string; hex: string }>;
  disabled?: boolean;
  onChangeTexture: (tex: SurfaceTextureId) => void;
  onChangeColor: (hex: string) => void;
}

export const SurfaceMaterialPicker: React.FC<SurfaceMaterialPickerProps> = ({
  title = 'Surface Finish & Color',
  target,
  selectedTexture,
  selectedColor,
  colorSwatches,
  disabled = false,
  onChangeTexture,
  onChangeColor,
}) => {
  const textures = useMemo(() => {
    return SURFACE_TEXTURES.filter((t) =>
      target === 'wall'
        ? t.forWalls
        : target === 'floor'
        ? t.forFloors
        : t.forAssets
    );
  }, [target]);

  return (
    <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
          {title}
        </span>
        <span className="text-[10px] font-mono text-slate-400 uppercase">
          {selectedTexture}
        </span>
      </div>

      {/* Tactile Texture Swatch Grid */}
      <div>
        <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 block mb-1.5">
          Material Texture
        </span>
        <div className="grid grid-cols-3 gap-1.5 max-h-48 overflow-y-auto pr-0.5">
          {textures.map((tex) => {
            const active = selectedTexture === tex.id;
            const previewUrl = getTextureSwatchDataUrl(tex.id, tex.defaultTint);
            return (
              <button
                key={tex.id}
                type="button"
                disabled={disabled}
                onClick={() => onChangeTexture(tex.id)}
                className={`group flex flex-col items-center p-1 rounded-lg border text-center transition-all ${
                  active
                    ? 'border-teal-500 bg-teal-50/70 dark:bg-teal-950/50 ring-1 ring-teal-500/50'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-[#080D16] hover:border-teal-400/60'
                }`}
              >
                <div
                  className="w-full h-7 rounded-md border border-black/10 dark:border-white/10 bg-cover bg-center"
                  style={{ backgroundImage: `url(${previewUrl})` }}
                />
                <span className="mt-1 text-[10px] font-medium text-slate-700 dark:text-slate-200 truncate w-full leading-tight">
                  {tex.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Paint / Tint Color Swatches + Custom Color Picker */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
            Color / Tint
          </span>
          <label className="inline-flex items-center gap-1 text-[10px] font-mono text-slate-500 dark:text-slate-400 cursor-pointer hover:text-teal-600 dark:hover:text-teal-400">
            <span>{selectedColor.toUpperCase()}</span>
            <input
              type="color"
              value={/^#[0-9a-fA-F]{6}$/.test(selectedColor) ? selectedColor : '#F5F3EE'}
              disabled={disabled}
              onChange={(e) => onChangeColor(e.target.value)}
              className="w-5 h-5 p-0 border-0 rounded cursor-pointer bg-transparent"
              aria-label="Pick custom color"
            />
          </label>
        </div>
        <div className="grid grid-cols-5 gap-1.5">
          {colorSwatches.map((sw) => {
            const active = selectedColor.toLowerCase() === sw.hex.toLowerCase();
            return (
              <button
                key={sw.hex}
                type="button"
                disabled={disabled}
                onClick={() => onChangeColor(sw.hex)}
                title={sw.name}
                className={`h-6 rounded-md border transition-transform hover:scale-105 ${
                  active
                    ? 'border-teal-500 ring-2 ring-teal-500/60'
                    : 'border-slate-300 dark:border-slate-700'
                }`}
                style={{ backgroundColor: sw.hex }}
                aria-label={`Apply ${sw.name} color`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
