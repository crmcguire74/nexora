import { DiagramDocument } from '../types/diagram';
import { makeId } from './templates';

export const PCANVAS_EXTENSION = '.nexora';
export const PCANVAS_MIME = 'application/vnd.nexora+json';

export interface PCanvasFileEnvelope {
  format: 'nexora' | 'project-canvas';
  formatVersion: 1;
  extension: '.nexora' | '.pcanvas';
  savedAt: string;
  document: DiagramDocument;
}

// Lightweight TypeScript types for File System Access API (when available outside cross-origin iframes)
export interface DesktopFileHandle {
  name: string;
  getFile: () => Promise<File>;
  createWritable: () => Promise<{
    write: (data: string | Blob) => Promise<void>;
    close: () => Promise<void>;
  }>;
}

interface WindowWithFilePickers extends Window {
  showSaveFilePicker?: (options?: {
    suggestedName?: string;
    types?: Array<{
      description?: string;
      accept: Record<string, string[]>;
    }>;
  }) => Promise<DesktopFileHandle>;
  showOpenFilePicker?: (options?: {
    multiple?: boolean;
    types?: Array<{
      description?: string;
      accept: Record<string, string[]>;
    }>;
  }) => Promise<DesktopFileHandle[]>;
}

export function sanitizePCanvasFilename(title: string): string {
  const slug = title
    .trim()
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase()
    .slice(0, 80);
  return `${slug || 'untitled-design'}${PCANVAS_EXTENSION}`;
}

export function serializePCanvasFile(doc: DiagramDocument): string {
  const envelope: PCanvasFileEnvelope = {
    format: 'nexora',
    formatVersion: 1,
    extension: PCANVAS_EXTENSION,
    savedAt: new Date().toISOString(),
    document: {
      ...doc,
      schemaVersion: doc.schemaVersion || 1,
    },
  };
  return JSON.stringify(envelope, null, 2);
}

export function parsePCanvasFile(rawText: string, fallbackFileName?: string): DiagramDocument {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new Error('This file is not valid Nexora (.nexora / .pcanvas) design data.');
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid Nexora design file structure.');
  }

  const obj = parsed as Record<string, unknown>;
  const docCandidate =
    (obj.format === 'nexora' || obj.format === 'project-canvas') &&
    obj.document &&
    typeof obj.document === 'object'
      ? (obj.document as Partial<DiagramDocument>)
      : (obj as Partial<DiagramDocument>);

  if (!docCandidate.type) {
    throw new Error('Unrecognized Nexora file: missing diagram type.');
  }

  const now = new Date().toISOString();
  const baseTitle = fallbackFileName
    ? fallbackFileName.replace(/\.(nexora|pcanvas|canvas\.json|json)$/i, '')
    : 'Opened Design';

  return {
    id: docCandidate.id || makeId('diag'),
    schemaVersion: docCandidate.schemaVersion ?? 1,
    type: docCandidate.type,
    title: docCandidate.title || baseTitle,
    folder: docCandidate.folder || 'Desktop Files',
    tags: Array.isArray(docCandidate.tags) ? docCandidate.tags : [docCandidate.type],
    starred: Boolean(docCandidate.starred),
    objects: Array.isArray(docCandidate.objects) ? docCandidate.objects : [],
    connections: Array.isArray(docCandidate.connections) ? docCandidate.connections : [],
    layers:
      Array.isArray(docCandidate.layers) && docCandidate.layers.length > 0
        ? docCandidate.layers
        : [{ id: 'layer-main', name: 'Primary Layer', visible: true, locked: false }],
    sequence: docCandidate.sequence,
    floorplan: docCandidate.floorplan,
    settings: {
      theme: docCandidate.settings?.theme ?? 'modern',
      showGrid: docCandidate.settings?.showGrid ?? true,
      snapToGrid: docCandidate.settings?.snapToGrid ?? true,
      gridSize: docCandidate.settings?.gridSize ?? 20,
      showSmartGuides: docCandidate.settings?.showSmartGuides ?? true,
      activeEnvironment: docCandidate.settings?.activeEnvironment ?? 'all',
    },
    snapshots: Array.isArray(docCandidate.snapshots) ? docCandidate.snapshots : [],
    createdAt: docCandidate.createdAt || now,
    updatedAt: now,
  };
}

function triggerBrowserDownload(filename: string, content: string): void {
  // Using application/octet-stream prevents browsers from appending .json or .txt onto .pcanvas
  const blob = new Blob([content], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Saves a diagram to a `.pcanvas` file on the user's desktop/filesystem.
 * Uses File System Access API when permitted (supporting direct overwrite to an existing handle),
 * and gracefully falls back to a `.pcanvas` download when inside a sandboxed iframe or non-Chromium browser.
 */
export async function saveDesignToDesktop(
  doc: DiagramDocument,
  options?: {
    existingHandle?: DesktopFileHandle | null;
    saveAs?: boolean;
  }
): Promise<{
  saved: boolean;
  fileName: string;
  handle: DesktopFileHandle | null;
  method: 'fs-access' | 'download';
}> {
  const serialized = serializePCanvasFile(doc);
  const suggestedName = sanitizePCanvasFilename(doc.title);

  // 1. If we already have a writable desktop file handle and this isn't "Save As", write directly in place
  if (options?.existingHandle && !options.saveAs) {
    try {
      const writable = await options.existingHandle.createWritable();
      await writable.write(serialized);
      await writable.close();
      return {
        saved: true,
        fileName: options.existingHandle.name,
        handle: options.existingHandle,
        method: 'fs-access',
      };
    } catch {
      // Fall through to Save As or browser download if permission lapsed
    }
  }

  // 2. Try native Save File Picker (allows choosing Desktop directly)
  const win = window as WindowWithFilePickers;
  if (typeof win.showSaveFilePicker === 'function') {
    try {
      const handle = await win.showSaveFilePicker({
        suggestedName,
        types: [
          {
            description: 'Nexora Design File',
            accept: {
              [PCANVAS_MIME]: [PCANVAS_EXTENSION],
            },
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(serialized);
      await writable.close();
      return {
        saved: true,
        fileName: handle.name,
        handle,
        method: 'fs-access',
      };
    } catch (err: unknown) {
      // User explicitly cancelled the native save dialog
      if (err instanceof DOMException && err.name === 'AbortError') {
        return { saved: false, fileName: suggestedName, handle: options?.existingHandle ?? null, method: 'fs-access' };
      }
      // Cross-origin iframe SecurityError or unsupported browser -> fall back cleanly to download
    }
  }

  // 3. Universal browser download preserving exact `.nexora` extension
  triggerBrowserDownload(suggestedName, serialized);
  return {
    saved: true,
    fileName: suggestedName,
    handle: null,
    method: 'download',
  };
}

/**
 * Opens a `.nexora`, `.pcanvas`, or compatible `.json` design file from the user's computer.
 * Uses File System Access API when permitted (keeping a writable handle for Cmd+S in-place saves),
 * and seamlessly falls back to a native file input dialog when inside an iframe or other browsers.
 */
export async function openDesignFromDesktop(): Promise<{
  doc: DiagramDocument;
  fileName: string;
  handle: DesktopFileHandle | null;
} | null> {
  const win = window as WindowWithFilePickers;

  if (typeof win.showOpenFilePicker === 'function') {
    try {
      const [handle] = await win.showOpenFilePicker({
        multiple: false,
        types: [
          {
            description: 'Nexora Design File',
            accept: {
              [PCANVAS_MIME]: [PCANVAS_EXTENSION, '.pcanvas'],
              'application/json': ['.json'],
            },
          },
        ],
      });
      if (!handle) return null;
      const file = await handle.getFile();
      const text = await file.text();
      const doc = parsePCanvasFile(text, file.name);
      return { doc, fileName: file.name, handle };
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return null;
      }
      // Cross-origin iframe SecurityError -> fall back to <input type="file">
    }
  }

  // Fallback file input dialog
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = `${PCANVAS_EXTENSION},.pcanvas,.json,application/json`;
    input.style.display = 'none';
    document.body.appendChild(input);

    let settled = false;
    const cleanup = () => {
      if (input.parentNode) input.parentNode.removeChild(input);
    };

    input.onchange = async () => {
      settled = true;
      const file = input.files?.[0];
      cleanup();
      if (!file) {
        resolve(null);
        return;
      }
      try {
        const text = await file.text();
        const doc = parsePCanvasFile(text, file.name);
        resolve({ doc, fileName: file.name, handle: null });
      } catch (e) {
        reject(e);
      }
    };

    input.oncancel = () => {
      settled = true;
      cleanup();
      resolve(null);
    };

    // Fallback cleanup if focus returns without triggering change/cancel on older browsers
    const onWindowFocus = () => {
      setTimeout(() => {
        window.removeEventListener('focus', onWindowFocus);
        if (!settled) {
          cleanup();
          resolve(null);
        }
      }, 400);
    };
    window.addEventListener('focus', onWindowFocus);
    input.click();
  });
}

export async function readDroppedPCanvasFile(file: File): Promise<{
  doc: DiagramDocument;
  fileName: string;
}> {
  const text = await file.text();
  const doc = parsePCanvasFile(text, file.name);
  return { doc, fileName: file.name };
}
