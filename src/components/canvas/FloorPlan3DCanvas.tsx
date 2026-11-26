import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  ChevronDown,
  ChevronUp,
  Compass,
  Eye,
  Footprints,
  Layers,
  Maximize2,
  Moon,
  Orbit,
  PanelLeft,
  PanelRight,
  Sun,
  Sunrise,
} from 'lucide-react';
import {
  DiagramDocument,
  FloorLightingPreset,
  FloorOpening,
  FloorWallVisibility,
  SurfaceTextureId,
} from '../../types/diagram';
import { createFurnitureFromLibraryItem, LibraryItem } from '../../engine/libraries';
import {
  clampOpeningRatioForWall,
  detectRoomsFromWalls,
  formatLength,
  projectPointToWall,
} from '../../engine/geometry';
import { makeId } from '../../engine/templates';
import {
  buildFloorAsset3D,
  buildWallWithOpenings3D,
  disposeObject3D,
  getDefaultAsset3DMetrics,
} from '../../engine/floor3dAssets';
import { createSurfaceMaterial, SURFACE_TEXTURE_MAP } from '../../engine/floor3dMaterials';
import { FloorSelectionItem } from './FloorPlanCanvas';
import { Tooltip } from '../ui/Tooltip';

interface FloorPlan3DCanvasProps {
  doc: DiagramDocument;
  darkMode: boolean;
  activeTool: 'select' | 'pan' | 'wall';
  onSetTool: (tool: 'select' | 'pan' | 'wall') => void;
  selectedItems: FloorSelectionItem[];
  onSelectItems: (items: FloorSelectionItem[]) => void;
  onUpdateDoc: (next: DiagramDocument, recordHistory?: boolean) => void;
  readOnly?: boolean;
  draggingLibraryItem: LibraryItem | null;
  onDropLibraryItemDone: () => void;
  leftOpen: boolean;
  rightOpen: boolean;
  onToggleLeft: () => void;
  onToggleRight: () => void;
  presentationMode?: boolean;
}

type NavMode = 'orbit' | 'walk';

const _vec3A = new THREE.Vector3();
const _vec3B = new THREE.Vector3();
const _rayPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const _mouseNdc = new THREE.Vector2();

function detectSoftwareGl(): boolean {
  try {
    const gl = document.createElement('canvas').getContext('webgl2');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

function computePlanBounds(doc: DiagramDocument): {
  cx: number;
  cz: number;
  span: number;
} {
  const fp = doc.floorplan;
  if (!fp) return { cx: 4, cz: 3, span: 10 };
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  for (const w of fp.walls) {
    minX = Math.min(minX, w.x1, w.x2);
    maxX = Math.max(maxX, w.x1, w.x2);
    minZ = Math.min(minZ, w.y1, w.y2);
    maxZ = Math.max(maxZ, w.y1, w.y2);
  }
  for (const f of fp.furniture) {
    minX = Math.min(minX, f.x - f.width / 2);
    maxX = Math.max(maxX, f.x + f.width / 2);
    minZ = Math.min(minZ, f.y - f.depth / 2);
    maxZ = Math.max(maxZ, f.y + f.depth / 2);
  }
  if (!Number.isFinite(minX)) return { cx: 4, cz: 3, span: 10 };
  const cx = (minX + maxX) / 2;
  const cz = (minZ + maxZ) / 2;
  const span = Math.max(6, maxX - minX, maxZ - minZ);
  return { cx, cz, span };
}

export const FloorPlan3DCanvas: React.FC<FloorPlan3DCanvasProps> = ({
  doc,
  darkMode,
  activeTool,
  onSetTool,
  selectedItems,
  onSelectItems,
  onUpdateDoc,
  readOnly = false,
  draggingLibraryItem,
  onDropLibraryItemDone,
  leftOpen,
  rightOpen,
  onToggleLeft,
  onToggleRight,
  presentationMode = false,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const fp = doc.floorplan!;

  const [navMode, setNavMode] = useState<NavMode>('orbit');
  const [dockCollapsed, setDockCollapsed] = useState(false);
  const [wallStart, setWallStart] = useState<{ x: number; z: number } | null>(null);
  const [wallCursor, setWallCursor] = useState<{ x: number; z: number } | null>(null);

  const lightingPreset: FloorLightingPreset = fp.lightingPreset ?? (darkMode ? 'evening' : 'daylight');
  const wallVisibility: FloorWallVisibility = fp.wallVisibility ?? 'full';
  const defaultWallHeight = fp.wallHeight ?? 2.75;

  // Keep fresh refs so WebGL event handlers never stale-close or force canvas remount
  const docRef = useRef(doc);
  docRef.current = doc;
  const activeToolRef = useRef(activeTool);
  activeToolRef.current = activeTool;
  const navModeRef = useRef(navMode);
  navModeRef.current = navMode;
  const readOnlyRef = useRef(readOnly);
  readOnlyRef.current = readOnly;
  const selectedItemsRef = useRef(selectedItems);
  selectedItemsRef.current = selectedItems;
  const wallStartRef = useRef(wallStart);
  wallStartRef.current = wallStart;
  const onUpdateDocRef = useRef(onUpdateDoc);
  onUpdateDocRef.current = onUpdateDoc;
  const onSelectItemsRef = useRef(onSelectItems);
  onSelectItemsRef.current = onSelectItems;
  const onSetToolRef = useRef(onSetTool);
  onSetToolRef.current = onSetTool;

  // Imperative 3D engine context
  const engineRef = useRef<{
    isSoftwareGl: boolean;
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    controls: OrbitControls;
    raycaster: THREE.Raycaster;
    planGroup: THREE.Group;
    previewGroup: THREE.Group;
    selectionRing: THREE.Mesh;
    hemiLight: THREE.HemisphereLight;
    keyLight: THREE.DirectionalLight;
    fillLight: THREE.DirectionalLight;
    groundGrid: THREE.GridHelper;
    groundPlane: THREE.Mesh;
    requestRender: () => void;
    transitionTarget: {
      pos: THREE.Vector3;
      lookAt: THREE.Vector3;
    } | null;
    walkYaw: number;
    walkPitch: number;
    walkKeys: Set<string>;
    walkLoopActive: boolean;
  } | null>(null);

  const setLightingPreset = useCallback(
    (preset: FloorLightingPreset) => {
      onUpdateDoc(
        {
          ...docRef.current,
          floorplan: { ...docRef.current.floorplan!, lightingPreset: preset },
        },
        false
      );
    },
    [onUpdateDoc]
  );

  const setWallVisibility = useCallback(
    (vis: FloorWallVisibility) => {
      onUpdateDoc(
        {
          ...docRef.current,
          floorplan: { ...docRef.current.floorplan!, wallVisibility: vis },
        },
        false
      );
    },
    [onUpdateDoc]
  );

  // Camera transition helper
  const flyToPreset = useCallback((preset: 'iso' | 'top' | 'low' | 'walk') => {
    const eng = engineRef.current;
    if (!eng) return;
    const { cx, cz, span } = computePlanBounds(docRef.current);

    if (preset === 'walk') {
      setNavMode('walk');
      eng.controls.enabled = false;
      eng.transitionTarget = null;
      // Place eye-level camera inside first room or plan center
      const firstRoom = docRef.current.floorplan?.rooms[0];
      let startX = cx;
      let startZ = cz + span * 0.25;
      if (firstRoom && firstRoom.polygon.length >= 3) {
        startX = firstRoom.polygon.reduce((s, p) => s + p.x, 0) / firstRoom.polygon.length;
        startZ = firstRoom.polygon.reduce((s, p) => s + p.y, 0) / firstRoom.polygon.length;
      }
      eng.camera.position.set(startX, 1.65, startZ);
      eng.walkYaw = 0;
      eng.walkPitch = -0.05;
      eng.camera.rotation.order = 'YXZ';
      eng.camera.rotation.set(eng.walkPitch, eng.walkYaw, 0);
      eng.requestRender();
      return;
    }

    setNavMode('orbit');
    eng.controls.enabled = true;
    eng.camera.rotation.order = 'XYZ';

    const dist = Math.max(8, span * 1.18);
    if (preset === 'iso') {
      eng.transitionTarget = {
        pos: new THREE.Vector3(cx + dist * 0.72, dist * 0.74, cz + dist * 0.78),
        lookAt: new THREE.Vector3(cx, 0.5, cz),
      };
    } else if (preset === 'top') {
      eng.transitionTarget = {
        pos: new THREE.Vector3(cx, dist * 1.38, cz + 0.25),
        lookAt: new THREE.Vector3(cx, 0, cz),
      };
    } else {
      eng.transitionTarget = {
        pos: new THREE.Vector3(cx + dist * 0.65, 2.9, cz + dist * 0.75),
        lookAt: new THREE.Vector3(cx, 1.0, cz),
      };
    }
    eng.requestRender();
  }, []);

  // 1. Initialize Three.js WebGLRenderer, Scene, RoomEnvironment & Controls ONCE
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = detectSoftwareGl();
    const width = container.clientWidth || 960;
    const height = container.clientHeight || 600;

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#DCE7F3');
    scene.fog = new THREE.FogExp2('#DCE7F3', 0.011);

    // Mandatory studio environment reflection (RoomEnvironment)
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = envRT.texture;
    pmrem.dispose();

    const camera = new THREE.PerspectiveCamera(48, width / height, 0.08, 220);
    const { cx, cz, span } = computePlanBounds(docRef.current);
    const initDist = Math.max(8, span * 1.18);
    camera.position.set(cx + initDist * 0.72, initDist * 0.74, cz + initDist * 0.78);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(cx, 0.5, cz);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.08;
    controls.maxPolarAngle = Math.PI / 2 - 0.03;
    controls.minDistance = 1.6;
    controls.maxDistance = 85;
    controls.update();

    // Balanced 3-point warm/cool architectural lighting rig
    const hemiLight = new THREE.HemisphereLight('#F0F7FF', '#CBD5E1', 0.95);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight('#FFF5E6', 1.65);
    keyLight.position.set(cx + 14, 22, cz + 12);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.set(2048, 2048);
    keyLight.shadow.camera.near = 2;
    keyLight.shadow.camera.far = 65;
    keyLight.shadow.camera.left = -22;
    keyLight.shadow.camera.right = 22;
    keyLight.shadow.camera.top = 22;
    keyLight.shadow.camera.bottom = -22;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.025;
    keyLight.target.position.set(cx, 0, cz);
    scene.add(keyLight);
    scene.add(keyLight.target);

    const fillLight = new THREE.DirectionalLight('#C8DCF2', 0.55);
    fillLight.position.set(cx - 14, 10, cz - 12);
    scene.add(fillLight);

    // Subtle exterior terrain ground + architectural drafting grid
    const groundGeo = new THREE.PlaneGeometry(240, 240);
    const groundMat = new THREE.MeshStandardMaterial({
      color: '#D7E0D4',
      roughness: 0.95,
      metalness: 0.0,
    });
    const groundPlane = new THREE.Mesh(groundGeo, groundMat);
    groundPlane.rotation.x = -Math.PI / 2;
    groundPlane.position.y = -0.04;
    groundPlane.receiveShadow = true;
    scene.add(groundPlane);

    const groundGrid = new THREE.GridHelper(100, 100, '#94A3B8', '#CBD5E1');
    groundGrid.position.set(Math.round(cx), -0.018, Math.round(cz));
    (groundGrid.material as THREE.Material).transparent = true;
    (groundGrid.material as THREE.Material).opacity = 0.35;
    scene.add(groundGrid);

    const planGroup = new THREE.Group();
    scene.add(planGroup);

    const previewGroup = new THREE.Group();
    scene.add(previewGroup);

    // Selection highlight ring for selected furniture
    const ringGeo = new THREE.RingGeometry(0.45, 0.52, 48);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: '#14B8A6',
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
    });
    const selectionRing = new THREE.Mesh(ringGeo, ringMat);
    selectionRing.visible = false;
    selectionRing.position.y = 0.03;
    scene.add(selectionRing);

    // Software-WebGL-safe coalesced on-demand render loop
    let frameId = 0;
    let disposed = false;
    let renderBusy = false;
    let renderDirty = false;
    let lastTime = performance.now();

    const afterDraw = (cb: () => void) => {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync?.(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const state = sync ? gl.getSyncParameter(sync, gl.SYNC_STATUS) : gl.SIGNALED;
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 70);
        }
      };
      frameId = window.setTimeout(poll, 5);
    };

    const engineState = {
      isSoftwareGl,
      renderer,
      scene,
      camera,
      controls,
      raycaster: new THREE.Raycaster(),
      planGroup,
      previewGroup,
      selectionRing,
      hemiLight,
      keyLight,
      fillLight,
      groundGrid,
      groundPlane,
      transitionTarget: null as { pos: THREE.Vector3; lookAt: THREE.Vector3 } | null,
      walkYaw: 0,
      walkPitch: -0.04,
      walkKeys: new Set<string>(),
      walkLoopActive: false,
      requestRender: () => {},
    };

    const requestRender = () => {
      if (disposed) return;
      if (renderBusy) {
        renderDirty = true;
        return;
      }
      renderBusy = true;
      frameId = window.requestAnimationFrame(() => {
        if (disposed) return;
        renderDirty = false;
        const now = performance.now();
        const dt = Math.min(0.08, (now - lastTime) / 1000);
        lastTime = now;

        let needsAnotherFrame = false;

        // Smooth camera preset fly-to damping
        if (engineState.transitionTarget && navModeRef.current === 'orbit') {
          const t = engineState.transitionTarget;
          const k = 1 - Math.exp(-7.5 * dt);
          camera.position.lerp(t.pos, k);
          controls.target.lerp(t.lookAt, k);
          if (
            camera.position.distanceTo(t.pos) < 0.04 &&
            controls.target.distanceTo(t.lookAt) < 0.04
          ) {
            camera.position.copy(t.pos);
            controls.target.copy(t.lookAt);
            engineState.transitionTarget = null;
          } else {
            needsAnotherFrame = true;
          }
        }

        // First-Person Walkthrough movement (WASD / Arrow keys)
        if (navModeRef.current === 'walk' && engineState.walkKeys.size > 0) {
          const speed = (engineState.walkKeys.has('ShiftLeft') || engineState.walkKeys.has('ShiftRight') ? 6.2 : 3.4) * dt;
          const fwd =
            (engineState.walkKeys.has('KeyW') || engineState.walkKeys.has('ArrowUp') ? 1 : 0) -
            (engineState.walkKeys.has('KeyS') || engineState.walkKeys.has('ArrowDown') ? 1 : 0);
          const strafe =
            (engineState.walkKeys.has('KeyD') || engineState.walkKeys.has('ArrowRight') ? 1 : 0) -
            (engineState.walkKeys.has('KeyA') || engineState.walkKeys.has('ArrowLeft') ? 1 : 0);
          const elev =
            (engineState.walkKeys.has('KeyE') ? 1 : 0) -
            (engineState.walkKeys.has('KeyQ') ? 1 : 0);

          if (fwd !== 0 || strafe !== 0) {
            const sinY = Math.sin(engineState.walkYaw);
            const cosY = Math.cos(engineState.walkYaw);
            camera.position.x += (-sinY * fwd + cosY * strafe) * speed;
            camera.position.z += (-cosY * fwd - sinY * strafe) * speed;
          }
          if (elev !== 0) {
            camera.position.y = Math.max(0.7, Math.min(4.5, camera.position.y + elev * speed * 0.65));
          }
          needsAnotherFrame = true;
        }

        if (navModeRef.current === 'orbit') {
          const didDamp = controls.update();
          if (didDamp && !isSoftwareGl && controls.enableDamping) {
            // OrbitControls triggers 'change' while damping naturally
          }
        }

        renderer.render(scene, camera);

        const done = () => {
          renderBusy = false;
          if (renderDirty || needsAnotherFrame) {
            requestRender();
          }
        };
        if (isSoftwareGl) afterDraw(done);
        else done();
      });
    };

    engineState.requestRender = requestRender;
    engineRef.current = engineState;

    const onControlStart = () => {
      engineState.transitionTarget = null;
    };
    const onControlChange = () => {
      requestRender();
    };
    controls.addEventListener('start', onControlStart);
    controls.addEventListener('change', onControlChange);

    // ResizeObserver for crisp layout sync when panels open/close
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = Math.max(100, entry.contentRect.width);
        const h = Math.max(100, entry.contentRect.height);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
        requestRender();
      }
    });
    ro.observe(container);

    // Pointer interaction: Select, Drag Furniture in 3D, Draw Walls in 3D, Look in Walk Mode
    const dom = renderer.domElement;
    let pointerDownPos = { x: 0, y: 0 };
    let draggingFurniture: {
      id: string;
      offsetX: number;
      offsetZ: number;
      moved: boolean;
    } | null = null;
    let walkLookDragging = false;
    let walkLastX = 0;
    let walkLastY = 0;

    const getFloorPoint = (clientX: number, clientY: number): { x: number; z: number } | null => {
      const rect = dom.getBoundingClientRect();
      _mouseNdc.set(
        ((clientX - rect.left) / rect.width) * 2 - 1,
        -((clientY - rect.top) / rect.height) * 2 + 1
      );
      engineState.raycaster.setFromCamera(_mouseNdc, camera);
      const hit = engineState.raycaster.ray.intersectPlane(_rayPlane, _vec3A);
      if (!hit) return null;
      const snap = docRef.current.settings.snapToGrid;
      const step = snap ? 0.1 : 0.01;
      return {
        x: Number((Math.round(hit.x / step) * step).toFixed(2)),
        z: Number((Math.round(hit.z / step) * step).toFixed(2)),
      };
    };

    const pickSceneTarget = (clientX: number, clientY: number): FloorSelectionItem | null => {
      const rect = dom.getBoundingClientRect();
      _mouseNdc.set(
        ((clientX - rect.left) / rect.width) * 2 - 1,
        -((clientY - rect.top) / rect.height) * 2 + 1
      );
      engineState.raycaster.setFromCamera(_mouseNdc, camera);
      const hits = engineState.raycaster.intersectObjects(planGroup.children, true);
      for (const hit of hits) {
        let cur: THREE.Object3D | null = hit.object;
        while (cur && cur !== planGroup) {
          if (cur.userData && cur.userData.kind && cur.userData.id) {
            return {
              kind: cur.userData.kind as FloorSelectionItem['kind'],
              id: String(cur.userData.id),
            };
          }
          cur = cur.parent;
        }
      }
      return null;
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      pointerDownPos = { x: e.clientX, y: e.clientY };

      // 3D Wall Drawing Mode
      if (activeToolRef.current === 'wall' && !readOnlyRef.current) {
        const pt = getFloorPoint(e.clientX, e.clientY);
        if (!pt) return;
        const snapPt = (p: { x: number; z: number }) => {
          // Snap to nearby existing wall endpoints within 0.35m for watertight corners!
          for (const w of docRef.current.floorplan?.walls ?? []) {
            if (Math.hypot(p.x - w.x1, p.z - w.y1) < 0.35) return { x: w.x1, z: w.y1 };
            if (Math.hypot(p.x - w.x2, p.z - w.y2) < 0.35) return { x: w.x2, z: w.y2 };
          }
          return p;
        };
        const snapped = snapPt(pt);
        if (!wallStartRef.current) {
          setWallStart(snapped);
          setWallCursor(snapped);
        } else {
          const st = wallStartRef.current;
          if (Math.hypot(snapped.x - st.x, snapped.z - st.z) >= 0.25) {
            const curDoc = docRef.current;
            const curFp = curDoc.floorplan!;
            const newWall = {
              id: makeId('w'),
              x1: st.x,
              y1: st.z,
              x2: snapped.x,
              y2: snapped.z,
              thickness: 0.16,
              kind: 'interior' as const,
              height: curFp.wallHeight ?? 2.75,
              color: '#F5F3EE',
              texture: 'plaster' as SurfaceTextureId,
            };
            const nextWalls = [...curFp.walls, newWall];
            const nextRooms = detectRoomsFromWalls(nextWalls, curFp.rooms);
            onUpdateDocRef.current(
              {
                ...curDoc,
                floorplan: { ...curFp, walls: nextWalls, rooms: nextRooms },
              },
              true
            );
            setWallStart(snapped);
            setWallCursor(snapped);
          }
        }
        return;
      }

      // First-Person Look drag
      if (navModeRef.current === 'walk') {
        walkLookDragging = true;
        walkLastX = e.clientX;
        walkLastY = e.clientY;
        return;
      }

      // Orbit mode: check if clicking on an already-selected or clicked furniture item to drag it directly!
      if (activeToolRef.current === 'select' && !readOnlyRef.current) {
        const picked = pickSceneTarget(e.clientX, e.clientY);
        if (picked && picked.kind === 'furniture') {
          const furn = docRef.current.floorplan?.furniture.find((f) => f.id === picked.id);
          const floorPt = getFloorPoint(e.clientX, e.clientY);
          if (furn && !furn.locked && floorPt) {
            onSelectItemsRef.current([picked]);
            draggingFurniture = {
              id: furn.id,
              offsetX: furn.x - floorPt.x,
              offsetZ: furn.y - floorPt.z,
              moved: false,
            };
            controls.enabled = false;
            dom.style.cursor = 'grabbing';
          }
        }
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (activeToolRef.current === 'wall' && wallStartRef.current) {
        const pt = getFloorPoint(e.clientX, e.clientY);
        if (pt) setWallCursor(pt);
        return;
      }

      if (walkLookDragging && navModeRef.current === 'walk') {
        const dx = e.clientX - walkLastX;
        const dy = e.clientY - walkLastY;
        walkLastX = e.clientX;
        walkLastY = e.clientY;
        engineState.walkYaw -= dx * 0.0045;
        engineState.walkPitch = Math.max(
          -1.05,
          Math.min(1.05, engineState.walkPitch - dy * 0.004)
        );
        camera.rotation.order = 'YXZ';
        camera.rotation.set(engineState.walkPitch, engineState.walkYaw, 0);
        requestRender();
        return;
      }

      if (draggingFurniture && !readOnlyRef.current) {
        const pt = getFloorPoint(e.clientX, e.clientY);
        if (!pt) return;
        const nx = Number((pt.x + draggingFurniture.offsetX).toFixed(2));
        const nz = Number((pt.z + draggingFurniture.offsetZ).toFixed(2));
        draggingFurniture.moved = true;
        const curDoc = docRef.current;
        const curFp = curDoc.floorplan!;
        onUpdateDocRef.current(
          {
            ...curDoc,
            floorplan: {
              ...curFp,
              furniture: curFp.furniture.map((f) =>
                f.id === draggingFurniture!.id ? { ...f, x: nx, y: nz } : f
              ),
            },
          },
          false
        );
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (draggingFurniture) {
        if (draggingFurniture.moved) {
          onUpdateDocRef.current(docRef.current, true);
        }
        draggingFurniture = null;
        controls.enabled = navModeRef.current === 'orbit';
        dom.style.cursor = 'default';
        return;
      }

      if (walkLookDragging) {
        walkLookDragging = false;
      }

      const distMoved = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
      if (distMoved < 6 && activeToolRef.current !== 'wall') {
        const picked = pickSceneTarget(e.clientX, e.clientY);
        if (picked) {
          onSelectItemsRef.current([picked]);
        } else {
          onSelectItemsRef.current([]);
        }
      }
    };

    const onContextMenu = (e: MouseEvent) => {
      if (activeToolRef.current === 'wall' && wallStartRef.current) {
        e.preventDefault();
        setWallStart(null);
        setWallCursor(null);
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')
      ) {
        return;
      }
      if (e.key === 'Escape') {
        if (wallStartRef.current) {
          setWallStart(null);
          setWallCursor(null);
        } else if (activeToolRef.current === 'wall') {
          onSetToolRef.current('select');
        }
        return;
      }
      if (e.key === 'h' || e.key === 'H') {
        setDockCollapsed((c) => !c);
        return;
      }
      if (e.key === 'r' || e.key === 'R') {
        const sel = selectedItemsRef.current;
        if (sel.length === 1 && sel[0].kind === 'furniture' && !readOnlyRef.current) {
          e.preventDefault();
          const curDoc = docRef.current;
          const curFp = curDoc.floorplan!;
          onUpdateDocRef.current(
            {
              ...curDoc,
              floorplan: {
                ...curFp,
                furniture: curFp.furniture.map((f) =>
                  f.id === sel[0].id ? { ...f, rotation: (f.rotation + 45) % 360 } : f
                ),
              },
            },
            true
          );
          return;
        }
      }
      if (navModeRef.current === 'walk') {
        if (
          ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyQ', 'KeyE', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ShiftLeft', 'ShiftRight'].includes(
            e.code
          )
        ) {
          if (e.code.startsWith('Arrow')) e.preventDefault();
          engineState.walkKeys.add(e.code);
          requestRender();
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      engineState.walkKeys.delete(e.code);
    };

    dom.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    dom.addEventListener('contextmenu', onContextMenu);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    requestRender();

    return () => {
      disposed = true;
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(frameId);
      ro.disconnect();
      controls.removeEventListener('start', onControlStart);
      controls.removeEventListener('change', onControlChange);
      controls.dispose();
      dom.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      dom.removeEventListener('contextmenu', onContextMenu);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      envRT.dispose();
      disposeObject3D(scene);
      renderer.dispose();
      engineRef.current = null;
    };
  }, []);

  // 2. Sync Lighting Preset & Sky/Fog
  useEffect(() => {
    const eng = engineRef.current;
    if (!eng) return;

    if (lightingPreset === 'daylight') {
      eng.scene.background = new THREE.Color('#DCE8F4');
      eng.scene.fog = new THREE.FogExp2('#DCE8F4', 0.011);
      eng.hemiLight.color.set('#F5FAFF');
      eng.hemiLight.groundColor.set('#CBD5E1');
      eng.hemiLight.intensity = 1.0;
      eng.keyLight.color.set('#FFF7EB');
      eng.keyLight.intensity = 1.65;
      eng.keyLight.position.set(16, 24, 14);
      eng.fillLight.color.set('#C8DEF5');
      eng.fillLight.intensity = 0.58;
      (eng.groundPlane.material as THREE.MeshStandardMaterial).color.set('#D5DFD2');
    } else if (lightingPreset === 'golden') {
      eng.scene.background = new THREE.Color('#F1D8BE');
      eng.scene.fog = new THREE.FogExp2('#F1D8BE', 0.013);
      eng.hemiLight.color.set('#FFE7C7');
      eng.hemiLight.groundColor.set('#B49B84');
      eng.hemiLight.intensity = 0.88;
      eng.keyLight.color.set('#FFBA75');
      eng.keyLight.intensity = 2.0;
      eng.keyLight.position.set(26, 11, 16);
      eng.fillLight.color.set('#9DB5D6');
      eng.fillLight.intensity = 0.5;
      (eng.groundPlane.material as THREE.MeshStandardMaterial).color.set('#C9C7B3');
    } else {
      // Evening / Architectural Night Showcase
      eng.scene.background = new THREE.Color('#0E1726');
      eng.scene.fog = new THREE.FogExp2('#0E1726', 0.015);
      eng.hemiLight.color.set('#94A3B8');
      eng.hemiLight.groundColor.set('#1E293B');
      eng.hemiLight.intensity = 0.62;
      eng.keyLight.color.set('#FFDCA8');
      eng.keyLight.intensity = 1.15;
      eng.keyLight.position.set(12, 18, 12);
      eng.fillLight.color.set('#38BDF8');
      eng.fillLight.intensity = 0.45;
      (eng.groundPlane.material as THREE.MeshStandardMaterial).color.set('#182230');
    }

    eng.groundGrid.visible = doc.settings.showGrid;
    eng.requestRender();
  }, [lightingPreset, doc.settings.showGrid]);

  // 3. Rebuild 3D Architectural Plan (Rooms, Cut-out Walls + Openings, Furniture) on Doc Changes
  useEffect(() => {
    const eng = engineRef.current;
    if (!eng || !doc.floorplan) return;

    const { planGroup, renderer, isSoftwareGl, selectionRing } = eng;
    const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();

    // Cleanly dispose previous geometry & materials
    while (planGroup.children.length > 0) {
      const child = planGroup.children[0];
      planGroup.remove(child);
      disposeObject3D(child);
    }

    const selWallIds = new Set(
      selectedItems.filter((s) => s.kind === 'wall').map((s) => s.id)
    );
    const selRoomIds = new Set(
      selectedItems.filter((s) => s.kind === 'room').map((s) => s.id)
    );
    const selFurnIds = new Set(
      selectedItems.filter((s) => s.kind === 'furniture').map((s) => s.id)
    );
    const selOpeningId =
      selectedItems.find((s) => s.kind === 'opening')?.id ?? null;

    // A) Rooms (Extruded Floor Slabs with Real PBR Textures!)
    if (fp.showRooms) {
      for (const room of fp.rooms) {
        if (room.polygon.length < 3) continue;
        const shape = new THREE.Shape();
        // Shape uses (x, -y) so rotating -90° around X maps (x, 0, y) cleanly onto XZ!
        shape.moveTo(room.polygon[0].x, -room.polygon[0].y);
        for (let i = 1; i < room.polygon.length; i++) {
          shape.lineTo(room.polygon[i].x, -room.polygon[i].y);
        }
        shape.closePath();

        const geo = new THREE.ShapeGeometry(shape);
        // Normalize UVs in meters so textures tile at true architectural scale
        const posAttr = geo.attributes.position;
        const uvArr = new Float32Array(posAttr.count * 2);
        const texId = (room.floorMaterial || 'hardwood') as SurfaceTextureId;
        const tileM = SURFACE_TEXTURE_MAP[texId]?.tileMeters ?? 1.5;
        for (let i = 0; i < posAttr.count; i++) {
          uvArr[i * 2] = posAttr.getX(i) / tileM;
          uvArr[i * 2 + 1] = posAttr.getY(i) / tileM;
        }
        geo.setAttribute('uv', new THREE.BufferAttribute(uvArr, 2));

        // If room.color is a default very pale 2D pastel, keep texture natural; otherwise tint cleanly
        const mat = createSurfaceMaterial({
          textureId: texId,
          color: room.color || '#FFFFFF',
          maxAnisotropy,
          isSoftwareGl,
          polygonOffset: true,
        });
        if (selRoomIds.has(room.id)) {
          mat.emissive = new THREE.Color('#0D9488');
          mat.emissiveIntensity = 0.2;
        }

        const mesh = new THREE.Mesh(geo, mat);
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.y = 0.005;
        mesh.receiveShadow = true;
        mesh.userData = { kind: 'room', id: room.id };
        planGroup.add(mesh);
      }
    }

    // B) Walls with True Cut-Out Doors & Windows
    const cutaway = wallVisibility === 'cutaway';
    for (const wall of fp.walls) {
      const wallOps = fp.openings.filter((o) => o.wallId === wall.id);
      const wallGroup = buildWallWithOpenings3D(wall, wallOps, {
        defaultWallHeight,
        cutaway,
        maxAnisotropy,
        isSoftwareGl,
        selectedWall: selWallIds.has(wall.id),
        selectedOpeningId: selOpeningId,
      });
      planGroup.add(wallGroup);
    }

    // C) Furniture & Architectural Assets (60+ Composite 3D Models)
    let activeRingItem: { x: number; y: number; r: number } | null = null;
    if (fp.showFurniture) {
      for (const furn of fp.furniture) {
        const isSel = selFurnIds.has(furn.id);
        const model = buildFloorAsset3D(furn, {
          maxAnisotropy,
          isSoftwareGl,
          selected: isSel,
        });
        model.position.set(furn.x, 0.008, furn.y);
        model.rotation.y = (-furn.rotation * Math.PI) / 180;
        model.traverse((child) => {
          child.userData = { kind: 'furniture', id: furn.id };
        });
        planGroup.add(model);

        if (isSel) {
          activeRingItem = {
            x: furn.x,
            y: furn.y,
            r: Math.max(furn.width, furn.depth) * 0.65 + 0.12,
          };
        }
      }
    }

    // Update selection ring
    if (activeRingItem) {
      selectionRing.visible = true;
      selectionRing.position.set(activeRingItem.x, 0.028, activeRingItem.y);
      selectionRing.scale.set(activeRingItem.r * 2, 1, activeRingItem.r * 2);
    } else {
      selectionRing.visible = false;
    }

    eng.requestRender();
  }, [
    fp.walls,
    fp.openings,
    fp.rooms,
    fp.furniture,
    fp.showRooms,
    fp.showFurniture,
    defaultWallHeight,
    wallVisibility,
    selectedItems,
  ]);

  // 4. Live 3D Wall Drawing Preview Ghost
  useEffect(() => {
    const eng = engineRef.current;
    if (!eng) return;
    const { previewGroup } = eng;
    while (previewGroup.children.length > 0) {
      const ch = previewGroup.children[0];
      previewGroup.remove(ch);
      disposeObject3D(ch);
    }

    if (activeTool === 'wall' && wallStart && wallCursor) {
      const dx = wallCursor.x - wallStart.x;
      const dz = wallCursor.z - wallStart.z;
      const len = Math.hypot(dx, dz);
      if (len > 0.08) {
        const h = wallVisibility === 'cutaway' ? 1.25 : defaultWallHeight;
        const geo = new THREE.BoxGeometry(len, h, 0.16);
        const mat = new THREE.MeshStandardMaterial({
          color: '#14B8A6',
          transparent: true,
          opacity: 0.55,
          roughness: 0.4,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set((wallStart.x + wallCursor.x) / 2, h / 2, (wallStart.z + wallCursor.z) / 2);
        mesh.rotation.y = -Math.atan2(dz, dx);
        previewGroup.add(mesh);
      }
      // Corner post marker
      const post = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.1, 0.5, 14),
        new THREE.MeshBasicMaterial({ color: '#0D9488' })
      );
      post.position.set(wallStart.x, 0.25, wallStart.z);
      previewGroup.add(post);
    }

    eng.requestRender();
  }, [activeTool, wallStart, wallCursor, defaultWallHeight, wallVisibility]);

  // 5. Drag & Drop Library Assets directly onto the 3D Floor or Nearest Wall!
  const handleDropIn3D = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (readOnly || !draggingLibraryItem || !engineRef.current) return;

    const eng = engineRef.current;
    const rect = eng.renderer.domElement.getBoundingClientRect();
    _mouseNdc.set(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );
    eng.raycaster.setFromCamera(_mouseNdc, eng.camera);
    const hit = eng.raycaster.ray.intersectPlane(_rayPlane, _vec3B);
    if (!hit) {
      onDropLibraryItemDone();
      return;
    }

    const mx = Number(hit.x.toFixed(2));
    const my = Number(hit.z.toFixed(2));
    const item = draggingLibraryItem;

    if (item.floorItemKind === 'wall') {
      onSetTool('wall');
      onDropLibraryItemDone();
      return;
    }

    if (item.floorItemKind === 'room-rect') {
      const w = item.realWidthM ?? 4;
      const d = item.realDepthM ?? 3.5;
      const x1 = Number((mx - w / 2).toFixed(2));
      const y1 = Number((my - d / 2).toFixed(2));
      const newWalls = [
        { id: makeId('w'), x1, y1, x2: x1 + w, y2: y1, thickness: 0.16, kind: 'interior' as const, height: defaultWallHeight, color: '#F5F3EE', texture: 'plaster' as SurfaceTextureId },
        { id: makeId('w'), x1: x1 + w, y1, x2: x1 + w, y2: y1 + d, thickness: 0.16, kind: 'interior' as const, height: defaultWallHeight, color: '#F5F3EE', texture: 'plaster' as SurfaceTextureId },
        { id: makeId('w'), x1: x1 + w, y1: y1 + d, x2: x1, y2: y1 + d, thickness: 0.16, kind: 'interior' as const, height: defaultWallHeight, color: '#F5F3EE', texture: 'plaster' as SurfaceTextureId },
        { id: makeId('w'), x1, y1: y1 + d, x2: x1, y2: y1, thickness: 0.16, kind: 'interior' as const, height: defaultWallHeight, color: '#F5F3EE', texture: 'plaster' as SurfaceTextureId },
      ];
      const nextWalls = [...fp.walls, ...newWalls];
      const nextRooms = detectRoomsFromWalls(nextWalls, fp.rooms);
      onUpdateDoc({ ...doc, floorplan: { ...fp, walls: nextWalls, rooms: nextRooms } }, true);
      onDropLibraryItemDone();
      return;
    }

    if (
      item.floorItemKind === 'door' ||
      item.floorItemKind === 'double-door' ||
      item.floorItemKind === 'sliding-door' ||
      item.floorItemKind === 'window'
    ) {
      let bestWall = fp.walls[0];
      let bestDist = Infinity;
      let bestRatio = 0.5;
      for (const w of fp.walls) {
        const proj = projectPointToWall(mx, my, w);
        if (proj.dist < bestDist) {
          bestDist = proj.dist;
          bestWall = w;
          bestRatio = proj.ratio;
        }
      }
      if (bestWall) {
        const opWidth = item.realWidthM ?? 0.9;
        const newOp: FloorOpening = {
          id: makeId('op'),
          wallId: bestWall.id,
          kind: item.floorItemKind,
          offsetRatio: clampOpeningRatioForWall(bestRatio, opWidth, bestWall),
          width: opWidth,
          swing: 'right',
          swingInward: true,
        };
        onUpdateDoc({ ...doc, floorplan: { ...fp, openings: [...fp.openings, newOp] } }, true);
        onSelectItems([{ kind: 'opening', id: newOp.id }]);
      }
      onDropLibraryItemDone();
      return;
    }

    const metrics = getDefaultAsset3DMetrics(item.type);
    const furn = {
      ...createFurnitureFromLibraryItem(item, mx, my),
      height: metrics.height,
      texture: metrics.defaultTexture,
    };
    onUpdateDoc({ ...doc, floorplan: { ...fp, furniture: [...fp.furniture, furn] } }, true);
    onSelectItems([{ kind: 'furniture', id: furn.id }]);
    onDropLibraryItemDone();
  };

  const wallPreviewLength = useMemo(() => {
    if (!wallStart || !wallCursor) return null;
    const len = Math.hypot(wallCursor.x - wallStart.x, wallCursor.z - wallStart.z);
    return len > 0.05 ? formatLength(len, fp.unit) : null;
  }, [wallStart, wallCursor, fp.unit]);

  return (
    <div
      className="relative w-full h-full overflow-hidden select-none bg-[#0E1726]"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDropIn3D}
    >
      {/* Dedicated Isolated WebGL Canvas Mount */}
      <div
        ref={mountRef}
        className={`w-full h-full ${activeTool === 'wall' ? 'cursor-crosshair' : 'cursor-default'}`}
        aria-label={`${doc.title} interactive 3D floor plan viewport`}
      />

      {/* Minimal Non-Occluding Top-Left Mode / Wall Drawing Hint Badge (No backdrop-blur over WebGL) */}
      <div className="absolute top-3 left-3 z-20 pointer-events-none flex flex-col gap-1.5">
        {activeTool === 'wall' ? (
          <div className="px-3 py-1.5 rounded-lg bg-[#0D1422]/92 border border-teal-500/60 text-xs text-teal-200 shadow-md flex items-center gap-2">
            <span className="font-semibold text-teal-400">3D Wall Draw</span>
            <span className="text-slate-300">
              {wallPreviewLength
                ? `Length: ${wallPreviewLength} · Click to place, Esc to finish`
                : 'Click floor points to draw walls in 3D'}
            </span>
          </div>
        ) : navMode === 'walk' ? (
          <div className="px-3 py-1.5 rounded-lg bg-[#0D1422]/92 border border-slate-700 text-[11px] text-slate-200 shadow-md flex items-center gap-2">
            <Footprints className="w-3.5 h-3.5 text-teal-400 shrink-0" />
            <span>
              <strong>Walkthrough:</strong> WASD / Arrows to move · Drag to look 360° · Q/E height
            </span>
          </div>
        ) : (
          <div className="px-2.5 py-1 rounded-lg bg-[#0D1422]/85 border border-slate-700/80 text-[11px] text-slate-200 shadow-sm flex items-center gap-1.5">
            <Orbit className="w-3.5 h-3.5 text-teal-400 shrink-0" />
            <span>Drag to orbit · Scroll to zoom · Drag assets on floor · R to rotate</span>
          </div>
        )}
      </div>

      {/* Collapsible Planner 5D Unified Bottom Control Dock (Zero backdrop-blur over WebGL) */}
      <div
        className={`absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center transition-transform duration-200 ${
          dockCollapsed ? 'translate-y-[calc(100%-26px)]' : 'translate-y-0'
        }`}
      >
        <button
          type="button"
          onClick={() => setDockCollapsed((v) => !v)}
          className="mb-1 px-2.5 py-0.5 rounded-t-lg bg-[#0D1422]/92 border border-b-0 border-slate-700/90 text-[10px] font-medium text-slate-300 hover:text-white flex items-center gap-1 shadow-sm"
          title="Hide or show 3D controls (H)"
        >
          {dockCollapsed ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          <span>{dockCollapsed ? '3D Controls' : 'Hide Dock'}</span>
        </button>

        <div className="flex flex-wrap items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#0D1422]/95 border border-slate-700/90 shadow-xl text-slate-200">
          {!presentationMode && (
            <Tooltip
              label={leftOpen ? 'Hide Component Library' : 'Show Component Library'}
              description="Toggle the left 2D/3D asset library"
              side="top"
            >
              <button
                type="button"
                onClick={onToggleLeft}
                className={`p-1.5 rounded-lg transition-colors ${
                  leftOpen ? 'bg-teal-900/70 text-teal-300' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <PanelLeft className="w-3.5 h-3.5" />
              </button>
            </Tooltip>
          )}

          {/* Navigation Mode: Orbit vs First-Person Walkthrough */}
          <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-[#070B12] border border-slate-800">
            <Tooltip
              label="Orbit 3D Dollhouse"
              description="Rotate, pan, and zoom smoothly around the entire 3D floor plan"
              side="top"
            >
              <button
                type="button"
                onClick={() => flyToPreset('iso')}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                  navMode === 'orbit'
                    ? 'bg-teal-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Orbit className="w-3.5 h-3.5" />
                <span>Orbit</span>
              </button>
            </Tooltip>
            <Tooltip
              label="First-Person Walkthrough"
              description="Step inside at eye level and walk through rooms with WASD / Arrow keys"
              side="top"
            >
              <button
                type="button"
                onClick={() => flyToPreset('walk')}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                  navMode === 'walk'
                    ? 'bg-teal-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Footprints className="w-3.5 h-3.5" />
                <span>Walk</span>
              </button>
            </Tooltip>
          </div>

          <div className="w-px h-4 bg-slate-700/80" />

          {/* Wall Cutaway Toggle */}
          <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-[#070B12] border border-slate-800">
            <Tooltip
              label="Full Height Walls"
              description="Display walls at full architectural ceiling height"
              side="top"
            >
              <button
                type="button"
                onClick={() => setWallVisibility('full')}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  wallVisibility === 'full'
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="w-3 h-3" />
                <span>Full Walls</span>
              </button>
            </Tooltip>
            <Tooltip
              label="Dollhouse Cutaway Walls"
              description="Lower walls to half-height for effortless interior viewing & furnishing"
              side="top"
            >
              <button
                type="button"
                onClick={() => setWallVisibility('cutaway')}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  wallVisibility === 'cutaway'
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Eye className="w-3 h-3" />
                <span>Cutaway</span>
              </button>
            </Tooltip>
          </div>

          <div className="w-px h-4 bg-slate-700/80" />

          {/* Lighting Presets */}
          <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-[#070B12] border border-slate-800">
            <Tooltip label="Daylight Studio" description="Bright natural architectural daylight" side="top">
              <button
                type="button"
                onClick={() => setLightingPreset('daylight')}
                className={`p-1.5 rounded-md transition-colors ${
                  lightingPreset === 'daylight'
                    ? 'bg-amber-500/25 text-amber-300'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
              </button>
            </Tooltip>
            <Tooltip label="Golden Hour" description="Warm low-angle sunset light & dramatic shadows" side="top">
              <button
                type="button"
                onClick={() => setLightingPreset('golden')}
                className={`p-1.5 rounded-md transition-colors ${
                  lightingPreset === 'golden'
                    ? 'bg-orange-500/25 text-orange-300'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sunrise className="w-3.5 h-3.5" />
              </button>
            </Tooltip>
            <Tooltip label="Evening Showcase" description="Warm interior light against twilight sky" side="top">
              <button
                type="button"
                onClick={() => setLightingPreset('evening')}
                className={`p-1.5 rounded-md transition-colors ${
                  lightingPreset === 'evening'
                    ? 'bg-sky-500/25 text-sky-300'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
              </button>
            </Tooltip>
          </div>

          <div className="w-px h-4 bg-slate-700/80" />

          {/* Camera Angle Presets */}
          <div className="flex items-center gap-1">
            <Tooltip label="Isometric 3D View" description="Reset camera to classic 3/4 architectural angle" side="top">
              <button
                type="button"
                onClick={() => flyToPreset('iso')}
                className="px-2 py-1 rounded-md text-[11px] font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                Iso
              </button>
            </Tooltip>
            <Tooltip label="Top-Down 3D Plan" description="Look straight down in 3D perspective" side="top">
              <button
                type="button"
                onClick={() => flyToPreset('top')}
                className="px-2 py-1 rounded-md text-[11px] font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                Top
              </button>
            </Tooltip>
            <Tooltip label="Low Interior Angle" description="Dramatic eye-level perspective from outside the space" side="top">
              <button
                type="button"
                onClick={() => flyToPreset('low')}
                className="p-1.5 rounded-md text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                <Compass className="w-3.5 h-3.5" />
              </button>
            </Tooltip>
            <Tooltip label="Fit Plan to View" description="Re-center camera on the full floor plan" side="top">
              <button
                type="button"
                onClick={() => flyToPreset('iso')}
                className="p-1.5 rounded-md text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </Tooltip>
          </div>

          {!presentationMode && (
            <Tooltip
              label={rightOpen ? 'Hide Inspector Panel' : 'Show Inspector Panel'}
              description="Toggle the right materials, colors, and dimensions inspector"
              side="top"
            >
              <button
                type="button"
                onClick={onToggleRight}
                className={`p-1.5 rounded-lg transition-colors ${
                  rightOpen ? 'bg-teal-900/70 text-teal-300' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <PanelRight className="w-3.5 h-3.5" />
              </button>
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  );
};
