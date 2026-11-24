import {
  CustomComponent,
  DiagramDocument,
  LocalProfile,
} from '../types/diagram';

const DB_NAME = 'project-canvas-db';
const DB_VERSION = 1;
const STORE_DIAGRAMS = 'diagrams';
const STORE_COMPONENTS = 'components';
const STORE_CUSTOM_TEMPLATES = 'custom_templates';

export interface DiagramRepository {
  listDiagrams(): Promise<DiagramDocument[]>;
  getDiagram(id: string): Promise<DiagramDocument | null>;
  saveDiagram(doc: DiagramDocument): Promise<DiagramDocument>;
  deleteDiagram(id: string): Promise<void>;
  listCustomComponents(): Promise<CustomComponent[]>;
  saveCustomComponent(comp: CustomComponent): Promise<void>;
  deleteCustomComponent(id: string): Promise<void>;
  listCustomTemplates(): Promise<DiagramDocument[]>;
  saveCustomTemplate(doc: DiagramDocument): Promise<void>;
  deleteCustomTemplate(id: string): Promise<void>;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_DIAGRAMS)) {
        db.createObjectStore(STORE_DIAGRAMS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_COMPONENTS)) {
        db.createObjectStore(STORE_COMPONENTS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_CUSTOM_TEMPLATES)) {
        db.createObjectStore(STORE_CUSTOM_TEMPLATES, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function idbGetAll<T>(storeName: string): Promise<T[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.getAll();
    req.onsuccess = () => resolve((req.result as T[]) ?? []);
    req.onerror = () => reject(req.error);
  });
}

async function idbGet<T>(storeName: string, id: string): Promise<T | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.get(id);
    req.onsuccess = () => resolve((req.result as T) ?? null);
    req.onerror = () => reject(req.error);
  });
}

async function idbPut<T>(storeName: string, value: T): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.put(value);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function idbDelete(storeName: string, id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export class IndexedDBDiagramRepository implements DiagramRepository {
  async listDiagrams(): Promise<DiagramDocument[]> {
    try {
      const items = await idbGetAll<DiagramDocument>(STORE_DIAGRAMS);
      return items.sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    } catch {
      const raw = localStorage.getItem('pc_diagrams_fallback');
      return raw ? (JSON.parse(raw) as DiagramDocument[]) : [];
    }
  }

  async getDiagram(id: string): Promise<DiagramDocument | null> {
    try {
      return await idbGet<DiagramDocument>(STORE_DIAGRAMS, id);
    } catch {
      const all = await this.listDiagrams();
      return all.find((d) => d.id === id) ?? null;
    }
  }

  async saveDiagram(doc: DiagramDocument): Promise<DiagramDocument> {
    const updated: DiagramDocument = {
      ...doc,
      schemaVersion: doc.schemaVersion || 1,
      updatedAt: new Date().toISOString(),
    };
    try {
      await idbPut(STORE_DIAGRAMS, updated);
    } catch {
      const all = await this.listDiagrams();
      const idx = all.findIndex((d) => d.id === updated.id);
      if (idx >= 0) all[idx] = updated;
      else all.unshift(updated);
      localStorage.setItem('pc_diagrams_fallback', JSON.stringify(all));
    }
    return updated;
  }

  async deleteDiagram(id: string): Promise<void> {
    try {
      await idbDelete(STORE_DIAGRAMS, id);
    } catch {
      const all = (await this.listDiagrams()).filter((d) => d.id !== id);
      localStorage.setItem('pc_diagrams_fallback', JSON.stringify(all));
    }
  }

  async listCustomComponents(): Promise<CustomComponent[]> {
    try {
      return await idbGetAll<CustomComponent>(STORE_COMPONENTS);
    } catch {
      return [];
    }
  }

  async saveCustomComponent(comp: CustomComponent): Promise<void> {
    try {
      await idbPut(STORE_COMPONENTS, comp);
    } catch {
      // ignore fallback
    }
  }

  async deleteCustomComponent(id: string): Promise<void> {
    try {
      await idbDelete(STORE_COMPONENTS, id);
    } catch {
      // ignore fallback
    }
  }

  async listCustomTemplates(): Promise<DiagramDocument[]> {
    try {
      return await idbGetAll<DiagramDocument>(STORE_CUSTOM_TEMPLATES);
    } catch {
      return [];
    }
  }

  async saveCustomTemplate(doc: DiagramDocument): Promise<void> {
    try {
      await idbPut(STORE_CUSTOM_TEMPLATES, doc);
    } catch {
      // ignore fallback
    }
  }

  async deleteCustomTemplate(id: string): Promise<void> {
    try {
      await idbDelete(STORE_CUSTOM_TEMPLATES, id);
    } catch {
      // ignore fallback
    }
  }
}

export const diagramRepo: DiagramRepository = new IndexedDBDiagramRepository();

export const DEFAULT_LOCAL_PROFILE: LocalProfile = {
  name: 'Christopher R McGuire',
  email: 'christopher.mcguire@nexora.local',
  role: 'owner',
  workspaceName: 'Nexora Visual Workspace',
};

export function loadLocalProfile(): LocalProfile {
  try {
    const raw = localStorage.getItem('pc_local_profile');
    if (raw) return { ...DEFAULT_LOCAL_PROFILE, ...JSON.parse(raw) };
  } catch {
    // ignore
  }
  return DEFAULT_LOCAL_PROFILE;
}

export function saveLocalProfile(profile: LocalProfile): void {
  try {
    localStorage.setItem('pc_local_profile', JSON.stringify(profile));
  } catch {
    // ignore
  }
}
