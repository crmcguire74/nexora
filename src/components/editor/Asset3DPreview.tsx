import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Rotate3d } from 'lucide-react';
import { FloorFurniture } from '../../types/diagram';
import { LibraryItem } from '../../engine/libraries';
import {
  buildFloorAsset3D,
  disposeObject3D,
  renderLibraryItem3DThumbnail,
} from '../../engine/floor3dAssets';

/**
 * Displays a crisp cached 3D studio thumbnail for any Floor Plan LibraryItem.
 */
export const LibraryItem3DThumb: React.FC<{
  item: LibraryItem;
  className?: string;
}> = ({ item, className = 'w-9 h-9' }) => {
  const [src, setSrc] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    const id = window.requestAnimationFrame(() => {
      if (cancelled) return;
      const url = renderLibraryItem3DThumbnail(item);
      if (!cancelled && url) setSrc(url);
    });
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(id);
    };
  }, [item]);

  if (!src) {
    return (
      <div
        className={`${className} rounded-md bg-slate-100 dark:bg-slate-800/70 animate-pulse`}
        aria-hidden="true"
      />
    );
  }

  return (
    <img
      src={src}
      alt={`${item.label} 3D view`}
      className={`${className} object-contain select-none pointer-events-none`}
      draggable={false}
    />
  );
};

/**
 * Interactive rotatable 3D asset stage inside the Right Properties Inspector.
 * Updates live as the user applies colors, textures, or resizes dimensions.
 */
export const InteractiveAsset3DPreview: React.FC<{
  furniture: FloorFurniture;
  darkMode: boolean;
}> = ({ furniture, darkMode }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const angleRef = useRef({ yaw: 0.72, pitch: 0.44 });
  const dragRef = useRef<{ active: boolean; x: number; y: number }>({
    active: false,
    x: 0,
    y: 0,
  });

  const sceneRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    holder: THREE.Group;
    dist: number;
    centerY: number;
    renderNow: () => void;
  } | null>(null);

  // Initialize tiny WebGL viewport once
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 240;
    const height = 148;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'default',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const hemi = new THREE.HemisphereLight('#FFFFFF', '#94A3B8', 1.35);
    scene.add(hemi);
    const key = new THREE.DirectionalLight('#FFF7ED', 1.65);
    key.position.set(4, 7, 5);
    scene.add(key);
    const fill = new THREE.DirectionalLight('#CBD5E1', 0.65);
    fill.position.set(-4, 3, -4);
    scene.add(fill);

    // Subtle circular studio pedestal disc
    const discGeo = new THREE.CylinderGeometry(1.1, 1.15, 0.03, 32);
    const discMat = new THREE.MeshStandardMaterial({
      color: darkMode ? '#1E293B' : '#E2E8F0',
      roughness: 0.7,
      metalness: 0.05,
    });
    const disc = new THREE.Mesh(discGeo, discMat);
    disc.position.y = -0.02;
    scene.add(disc);

    const holder = new THREE.Group();
    scene.add(holder);

    const camera = new THREE.PerspectiveCamera(36, width / height, 0.05, 80);

    const ctxObj = {
      renderer,
      scene,
      camera,
      holder,
      dist: 3.2,
      centerY: 0.5,
      renderNow: () => {
        const { yaw, pitch } = angleRef.current;
        const d = ctxObj.dist;
        camera.position.set(
          Math.sin(yaw) * Math.cos(pitch) * d,
          ctxObj.centerY + Math.sin(pitch) * d,
          Math.cos(yaw) * Math.cos(pitch) * d
        );
        camera.lookAt(0, ctxObj.centerY, 0);
        renderer.render(scene, camera);
      },
    };
    sceneRef.current = ctxObj;

    return () => {
      disposeObject3D(scene);
      renderer.dispose();
      sceneRef.current = null;
    };
  }, [darkMode]);

  // Rebuild asset mesh whenever dimensions/color/texture/type change
  useEffect(() => {
    const ctx = sceneRef.current;
    if (!ctx) return;

    while (ctx.holder.children.length > 0) {
      const ch = ctx.holder.children[0];
      ctx.holder.remove(ch);
      disposeObject3D(ch);
    }

    const model = buildFloorAsset3D(
      { ...furniture, x: 0, y: 0, rotation: 0, elevation: 0 },
      { isSoftwareGl: true }
    );
    ctx.holder.add(model);

    const box = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    // Center horizontally on pedestal
    model.position.set(-center.x, -box.min.y, -center.z);
    const maxDim = Math.max(size.x, size.y, size.z, 0.7);
    ctx.dist = maxDim * 2.15;
    ctx.centerY = size.y * 0.48;
    ctx.renderNow();
  }, [
    furniture.type,
    furniture.width,
    furniture.depth,
    furniture.height,
    furniture.color,
    furniture.texture,
  ]);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current = { active: true, x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.active || !sceneRef.current) return;
    const dx = e.clientX - dragRef.current.x;
    const dy = e.clientY - dragRef.current.y;
    dragRef.current.x = e.clientX;
    dragRef.current.y = e.clientY;
    angleRef.current.yaw -= dx * 0.012;
    angleRef.current.pitch = Math.max(0.12, Math.min(1.25, angleRef.current.pitch + dy * 0.01));
    sceneRef.current.renderNow();
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current.active = false;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  return (
    <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-gradient-to-b from-slate-50 to-slate-100/90 dark:from-[#0B1220] dark:to-[#070B12]">
      <div
        ref={mountRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="w-full h-[148px] cursor-grab active:cursor-grabbing select-none"
        title="Drag to rotate 3D asset preview"
      />
      <div className="absolute bottom-1.5 right-2 pointer-events-none flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/85 dark:bg-[#0D1422]/85 text-[10px] font-medium text-slate-600 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700/70">
        <Rotate3d className="w-3 h-3 text-teal-600 dark:text-teal-400" />
        <span>Drag 3D</span>
      </div>
    </div>
  );
};
