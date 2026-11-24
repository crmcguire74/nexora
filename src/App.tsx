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
import { OfflineIndicator } from './components/pwa/OfflineIndicator';
import { PWAInstallModal, PWAUninstallModal } from './components/pwa/PWAInstallButton';
import { WorkspaceSettingsModal } from './components/modals/WorkspaceSettingsModal';
import { SplashScreen } from './components/modals/SplashScreen';
import { NexoraBrandLogo } from './components/icons/ShapeIcons';

const SPLASH_HIDE_KEY = 'nexora_hide_splash';

export default function App() {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('pc_theme');
      if (saved === 'light') return false;
      if (saved === 'dark') return true;
      return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
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
  const [activeIsNewDesign, setActiveIsNewDesign] = useState(false);
  const [editorSession, setEditorSession] = useState(0);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [hideSplashOnStartup, setHideSplashOnStartup] = useState<boolean>(() => {
    try {
      return localStorage.getItem(SPLASH_HIDE_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [splashOpen, setSplashOpen] = useState<boolean>(() => {
    try {
      return localStorage.getItem(SPLASH_HIDE_KEY) !== 'true';
    } catch {
      return true;
    }
  });
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
    setActiveIsNewDesign(true);
    setEditorSession((s) => s + 1);
    setActiveDiagram(doc);
  };

  const handleUseTemplate = async (doc: DiagramDocument) => {
    await handleSaveDiagram(doc);
    setActiveDesktopFile({ handle: null, fileName: null });
    setActiveIsNewDesign(true);
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
    setActiveIsNewDesign(false);
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

  const handleDeleteCustomTemplate = async (id: string) => {
    await diagramRepo.deleteCustomTemplate(id);
    await refreshLists();
  };

  const handleUpdateProfile = (next: LocalProfile) => {
    setProfile(next);
    saveLocalProfile(next);
  };

  const handleToggleHideSplash = (hide: boolean) => {
    setHideSplashOnStartup(hide);
    try {
      localStorage.setItem(SPLASH_HIDE_KEY, hide ? 'true' : 'false');
    } catch {
      // ignore
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center gap-3 bg-[#E8EEF4] dark:bg-[#050810]">
        <NexoraBrandLogo className="w-11 h-11" />
        <div className="text-sm font-medium text-slate-600 dark:text-slate-400">
          Loading Nexora workspace...
        </div>
      </div>
    );
  }

  return (
    <>
      {activeDiagram ? (
        <EditorWorkspace
          key={`${activeDiagram.id}_${editorSession}`}
          initialDoc={activeDiagram}
          initialFileHandle={activeDesktopFile.handle}
          initialFileName={activeDesktopFile.fileName}
          isNewDesign={activeIsNewDesign}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode((d) => !d)}
          profile={profile}
          customComponents={customComponents}
          customTemplates={customTemplates}
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
          onDeleteCustomTemplate={handleDeleteCustomTemplate}
          onImportNewDiagram={async (imported) => {
            await handleSaveDiagram(imported);
            setActiveDesktopFile({ handle: null, fileName: null });
            setActiveIsNewDesign(false);
            setEditorSession((s) => s + 1);
            setActiveDiagram(imported);
          }}
          onOpenDesktopDesign={handleOpenDesktopDesign}
          onStartNewDesign={handleCreateBlank}
          onUseTemplate={handleUseTemplate}
          onOpenWorkspaceSettings={() => setSettingsModalOpen(true)}
          onBackHome={async () => {
            setActiveDiagram(null);
            setActiveDesktopFile({ handle: null, fileName: null });
            setActiveIsNewDesign(false);
            await refreshLists();
          }}
          onDiscardAndBackHome={async (id: string) => {
            await handleDeleteDiagram(id);
            setActiveDiagram(null);
            setActiveDesktopFile({ handle: null, fileName: null });
            setActiveIsNewDesign(false);
            await refreshLists();
          }}
        />
      ) : (
        <HomeDashboard
          diagrams={diagrams}
          customTemplates={customTemplates}
          customComponents={customComponents}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode((d) => !d)}
          profile={profile}
          onOpenDiagram={(doc) => {
            setActiveDesktopFile({ handle: null, fileName: null });
            setActiveIsNewDesign(false);
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
          onDeleteCustomTemplate={handleDeleteCustomTemplate}
          onOpenWorkspaceSettings={() => setSettingsModalOpen(true)}
        />
      )}
      <OfflineIndicator />
      <PWAInstallModal />
      <PWAUninstallModal />
      <WorkspaceSettingsModal
        open={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        profile={profile}
        onUpdateProfile={handleUpdateProfile}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode((d) => !d)}
        diagramCount={diagrams.length}
        customTemplateCount={customTemplates.length}
        customComponentCount={customComponents.length}
        showSplashOnStartup={!hideSplashOnStartup}
        onToggleShowSplashOnStartup={(show) => handleToggleHideSplash(!show)}
        onPreviewSplash={() => {
          setSettingsModalOpen(false);
          setSplashOpen(true);
        }}
      />
      <SplashScreen
        open={splashOpen}
        developerName={profile.name}
        hideOnNextStartup={hideSplashOnStartup}
        onToggleHideOnNextStartup={handleToggleHideSplash}
        onUpdateDeveloperName={(name) =>
          handleUpdateProfile({ ...profile, name })
        }
        onClose={() => setSplashOpen(false)}
      />
    </>
  );
}
