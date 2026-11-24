import { useCallback, useEffect, useState } from 'react';
import {
  CustomComponent,
  DiagramDocument,
  DiagramType,
  LocalProfile,
} from './types/diagram';
import {
  diagramRepo,
  loadLocalProfile,
  saveLocalProfile,
} from './engine/storage';
import {
  createBlankDiagram,
  createSeedDiagrams,
  makeId,
} from './engine/templates';
import { DesktopFileHandle } from './engine/pcanvasFile';
import { HomeDashboard } from './components/home/HomeDashboard';
import { EditorWorkspace } from './components/editor/EditorWorkspace';

export default function App() {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('pc_theme') === 'dark';
    } catch {
      return false;
    }
  });

  const [profile, setProfile] = useState<LocalProfile>(() => loadLocalProfile());
  const [diagrams, setDiagrams] = useState<DiagramDocument[]>([]);
  const [customTemplates, setCustomTemplates] = useState<DiagramDocument[]>([]);
  const [customComponents, setCustomComponents] = useState<CustomComponent[]>([]);
  const [activeDiagram, setActiveDiagram] = useState<DiagramDocument | null>(null);
  const [activeDesktopFile, setActiveDesktopFile] = useState<{
    handle: DesktopFileHandle | null;
    fileName: string | null;
  }>({ handle: null, fileName: null });
  const [editorSession, setEditorSession] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    try {
      localStorage.setItem('pc_theme', darkMode ? 'dark' : 'light');
    } catch {
      // ignore
    }
  }, [darkMode]);

  // Load persisted diagrams from IndexedDB (seed curated starter diagrams on first visit)
  useEffect(() => {
    let mounted = true;
    async function init() {
      let existing = await diagramRepo.listDiagrams();
      if (existing.length === 0) {
        const seeded = createSeedDiagrams();
        for (const doc of seeded) {
          await diagramRepo.saveDiagram(doc);
        }
        existing = await diagramRepo.listDiagrams();
      }
      const [comps, tpls] = await Promise.all([
        diagramRepo.listCustomComponents(),
        diagramRepo.listCustomTemplates(),
      ]);
      if (mounted) {
        setDiagrams(existing);
        setCustomComponents(comps);
        setCustomTemplates(tpls);
        setLoading(false);
      }
    }
    init();
    return () => {
      mounted = false;
    };
  }, []);

  const refreshLists = useCallback(async () => {
    const [docs, comps, tpls] = await Promise.all([
      diagramRepo.listDiagrams(),
      diagramRepo.listCustomComponents(),
      diagramRepo.listCustomTemplates(),
    ]);
    setDiagrams(docs);
    setCustomComponents(comps);
    setCustomTemplates(tpls);
  }, []);

  const handleSaveDiagram = useCallback(async (doc: DiagramDocument) => {
    const saved = await diagramRepo.saveDiagram(doc);
    setDiagrams((prev) => {
      const idx = prev.findIndex((d) => d.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next.sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      }
      return [saved, ...prev];
    });
  }, []);

  const handleCreateBlank = async (type: DiagramType) => {
    const doc = createBlankDiagram(type);
    await handleSaveDiagram(doc);
    setActiveDesktopFile({ handle: null, fileName: null });
    setEditorSession((s) => s + 1);
    setActiveDiagram(doc);
  };

  const handleUseTemplate = async (doc: DiagramDocument) => {
    await handleSaveDiagram(doc);
    setActiveDesktopFile({ handle: null, fileName: null });
    setEditorSession((s) => s + 1);
    setActiveDiagram(doc);
  };

  const handleOpenDesktopDesign = async (
    doc: DiagramDocument,
    handle: DesktopFileHandle | null,
    fileName: string
  ) => {
    await handleSaveDiagram(doc);
    setActiveDesktopFile({ handle, fileName });
    setEditorSession((s) => s + 1);
    setActiveDiagram(doc);
  };

  const handleDuplicateDiagram = async (doc: DiagramDocument) => {
    const copy: DiagramDocument = {
      ...structuredClone(doc),
      id: makeId('diag'),
      title: `${doc.title} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await handleSaveDiagram(copy);
  };

  const handleDeleteDiagram = async (id: string) => {
    await diagramRepo.deleteDiagram(id);
    setDiagrams((prev) => prev.filter((d) => d.id !== id));
  };

  const handleToggleStar = async (id: string) => {
    const target = diagrams.find((d) => d.id === id);
    if (!target) return;
    await handleSaveDiagram({ ...target, starred: !target.starred });
  };

  const handleUpdateProfile = (next: LocalProfile) => {
    setProfile(next);
    saveLocalProfile(next);
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-sm font-medium text-slate-500 dark:text-slate-400">
          Loading Project Canvas workspace...
        </div>
      </div>
    );
  }

  if (activeDiagram) {
    return (
      <EditorWorkspace
        key={`${activeDiagram.id}_${editorSession}`}
        initialDoc={activeDiagram}
        initialFileHandle={activeDesktopFile.handle}
        initialFileName={activeDesktopFile.fileName}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode((d) => !d)}
        profile={profile}
        customComponents={customComponents}
        onSaveDiagram={handleSaveDiagram}
        onSaveCustomComponent={async (comp) => {
          await diagramRepo.saveCustomComponent(comp);
          await refreshLists();
        }}
        onDeleteCustomComponent={async (id) => {
          await diagramRepo.deleteCustomComponent(id);
          await refreshLists();
        }}
        onSaveCustomTemplate={async (doc) => {
          await diagramRepo.saveCustomTemplate(doc);
          await refreshLists();
        }}
        onImportNewDiagram={async (imported) => {
          await handleSaveDiagram(imported);
          setActiveDesktopFile({ handle: null, fileName: null });
          setEditorSession((s) => s + 1);
          setActiveDiagram(imported);
        }}
        onOpenDesktopDesign={handleOpenDesktopDesign}
        onStartNewDesign={handleCreateBlank}
        onBackHome={async () => {
          setActiveDiagram(null);
          setActiveDesktopFile({ handle: null, fileName: null });
          await refreshLists();
        }}
      />
    );
  }

  return (
    <HomeDashboard
      diagrams={diagrams}
      customTemplates={customTemplates}
      customComponents={customComponents}
      darkMode={darkMode}
      onToggleDarkMode={() => setDarkMode((d) => !d)}
      profile={profile}
      onUpdateProfile={handleUpdateProfile}
      onOpenDiagram={(doc) => {
        setActiveDesktopFile({ handle: null, fileName: null });
        setEditorSession((s) => s + 1);
        setActiveDiagram(doc);
      }}
      onOpenDesktopFile={handleOpenDesktopDesign}
      onCreateBlank={handleCreateBlank}
      onUseTemplate={handleUseTemplate}
      onDuplicateDiagram={handleDuplicateDiagram}
      onDeleteDiagram={handleDeleteDiagram}
      onToggleStarDiagram={handleToggleStar}
      onDeleteCustomComponent={async (id) => {
        await diagramRepo.deleteCustomComponent(id);
        await refreshLists();
      }}
      onDeleteCustomTemplate={async (id) => {
        await diagramRepo.deleteCustomTemplate(id);
        await refreshLists();
      }}
    />
  );
}
