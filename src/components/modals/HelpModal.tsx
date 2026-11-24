import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  Compass,
  Cpu,
  Download,
  FileCode2,
  FolderOpen,
  GitBranch,
  Home,
  Keyboard,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import { NexoraBrandLogo } from '../icons/ShapeIcons';

interface HelpModalProps {
  open: boolean;
  onClose: () => void;
  onDownloadAiSchema: () => void;
}

type HelpSectionId =
  | 'getting-started'
  | 'workspace-files'
  | 'flow'
  | 'space'
  | 'sequence'
  | 'architect'
  | 'ai-schema'
  | 'shortcuts';

interface HelpSection {
  id: HelpSectionId;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  keywords: string;
}

const HELP_SECTIONS: HelpSection[] = [
  {
    id: 'getting-started',
    title: 'Getting Started & Setup',
    subtitle: 'Local storage, PWA install, themes & roles',
    icon: <Compass className="w-4 h-4" />,
    keywords: 'setup install pwa desktop offline indexeddb dark theme light profile role splash',
  },
  {
    id: 'workspace-files',
    title: 'Workspace & File Workflows',
    subtitle: 'Create, open, save, templates & snapshots',
    icon: <FolderOpen className="w-4 h-4" />,
    keywords: 'file nexora pcanvas template snapshot history export png svg json home discard delete',
  },
  {
    id: 'flow',
    title: 'Flow Module',
    subtitle: 'Flowcharts, Org Charts, Journeys & Whiteboards',
    icon: <GitBranch className="w-4 h-4" />,
    keywords: 'flowchart orgchart user journey whiteboard swimlane auto layout align connector',
  },
  {
    id: 'space',
    title: 'Space Module (Floor Plans)',
    subtitle: 'Walls, room resizing, US/Metric units & furniture',
    icon: <Home className="w-4 h-4" />,
    keywords: 'floorplan walls doors windows rooms resize connected metric us imperial feet meters furniture garage',
  },
  {
    id: 'sequence',
    title: 'Sequence Module (Call Flows)',
    subtitle: 'Participants, lifelines, arrows & fragments',
    icon: <Sparkles className="w-4 h-4" />,
    keywords: 'sequence call flow lifeline participant sync async return activation fragment alt opt loop',
  },
  {
    id: 'architect',
    title: 'Architect Module',
    subtitle: 'Cloud Systems, Network Topologies & ERDs',
    icon: <Cpu className="w-4 h-4" />,
    keywords: 'architecture network erd database vpc subnet container protocol primary key foreign key',
  },
  {
    id: 'ai-schema',
    title: 'AI Chat Engine Integration',
    subtitle: 'Generate .nexora files from external AI chats',
    icon: <FileCode2 className="w-4 h-4" />,
    keywords: 'ai chatgpt claude gemini schema prompt export markdown json generate import',
  },
  {
    id: 'shortcuts',
    title: 'Keyboard Shortcuts',
    subtitle: 'Fast canvas navigation & editing reference',
    icon: <Keyboard className="w-4 h-4" />,
    keywords: 'keyboard shortcut hotkey undo redo zoom pan copy duplicate delete command palette',
  },
];

export const HelpModal: React.FC<HelpModalProps> = ({
  open,
  onClose,
  onDownloadAiSchema,
}) => {
  const [activeId, setActiveId] = useState<HelpSectionId>('getting-started');
  const [search, setSearch] = useState('');

  const filteredSections = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return HELP_SECTIONS;
    return HELP_SECTIONS.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.subtitle.toLowerCase().includes(q) ||
        s.keywords.toLowerCase().includes(q)
    );
  }, [search]);

  if (!open) return null;

  const activeSection =
    filteredSections.find((s) => s.id === activeId) ?? filteredSections[0] ?? HELP_SECTIONS[0];

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Nexora Help and User Guide"
    >
      <div
        className="w-full max-w-5xl h-[86vh] max-h-[780px] rounded-2xl bg-white dark:bg-[#0D1422] border border-slate-200 dark:border-slate-800/90 shadow-2xl overflow-hidden flex flex-col nx-menu-enter"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="shrink-0 flex items-center justify-between gap-4 px-5 py-4 border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/70 dark:bg-[#090F1A]">
          <div className="flex items-center gap-3 min-w-0">
            <NexoraBrandLogo className="w-8 h-8 shrink-0" />
            <div className="min-w-0">
              <h2 className="font-display text-base font-bold text-slate-900 dark:text-white leading-tight truncate">
                Nexora Help &amp; User Guide
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                Setup instructions, user workflows, and complete guides for all four design modules
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-[#141F32] transition-colors"
            aria-label="Close Help"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body: Left Chapter Rail + Right Content */}
        <div className="flex-1 min-h-0 flex flex-col md:flex-row">
          {/* Left Rail */}
          <aside className="md:w-72 shrink-0 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-[#0A101B] flex flex-col">
            <div className="p-3 border-b border-slate-200/80 dark:border-slate-800/70">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search help topics..."
                  aria-label="Search help topics"
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-white dark:bg-[#080D16] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>
            <nav className="flex-1 overflow-y-auto p-2 flex md:flex-col gap-1">
              {filteredSections.map((sec) => {
                const isActive = activeSection.id === sec.id;
                return (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => setActiveId(sec.id)}
                    className={`flex items-start gap-2.5 px-3 py-2.5 rounded-lg text-left transition-colors shrink-0 md:shrink ${
                      isActive
                        ? 'bg-teal-50 dark:bg-teal-950/55 text-teal-900 dark:text-teal-200 border border-teal-200/80 dark:border-teal-800/60'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#141F32]/70 border border-transparent'
                    }`}
                  >
                    <span
                      className={`mt-0.5 shrink-0 ${
                        isActive ? 'text-teal-700 dark:text-teal-400' : 'text-slate-400 dark:text-slate-500'
                      }`}
                    >
                      {sec.icon}
                    </span>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold leading-tight whitespace-nowrap md:whitespace-normal">
                        {sec.title}
                      </div>
                      <div className="hidden md:block text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                        {sec.subtitle}
                      </div>
                    </div>
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* Right Documentation Pane */}
          <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            {activeSection.id === 'getting-started' && (
              <>
                <div>
                  <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white">
                    Getting Started &amp; Workspace Setup
                  </h3>
                  <p className="mt-1.5 text-slate-600 dark:text-slate-400">
                    Nexora is a local-first visual workspace designed for engineering teams, architects, and planners. Every design runs locally in your browser with offline support and desktop file ownership.
                  </p>
                </div>

                <section className="space-y-2.5 pt-2 border-t border-slate-200/80 dark:border-slate-800">
                  <h4 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
                    01. Local-First Auto-Save &amp; Desktop Backups
                  </h4>
                  <p className="text-xs leading-relaxed">
                    Every edit you make is automatically persisted to your browser&apos;s <strong>IndexedDB</strong> storage within half a second so work survives refreshes and offline sessions. Because browser storage can be cleared by system cleanup tools, Nexora includes a persistent reminder bar and <code className="font-mono text-teal-700 dark:text-teal-400">Save .nexora</code> button (<kbd className="font-mono text-[11px]">⌘S / Ctrl+S</kbd>) so you always keep permanent copies on your local drive.
                  </p>
                </section>

                <section className="space-y-2.5 pt-2 border-t border-slate-200/80 dark:border-slate-800">
                  <h4 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
                    02. Installing Nexora as a Desktop App (PWA)
                  </h4>
                  <ol className="list-decimal pl-5 space-y-1.5 text-xs">
                    <li>Open the top-left <strong>Hamburger Menu (≡)</strong> and choose <strong>Save / Install as PWA</strong>.</li>
                    <li>Confirm the browser installation prompt (supported in Chrome, Edge, Arc, and Brave) to pin Nexora as a standalone desktop window with full offline capability.</li>
                    <li>You can check installation status or remove cached offline data anytime via <strong>Uninstall PWA</strong> in the menu or inside <strong>Local Workspace &amp; Nexora Settings</strong>.</li>
                  </ol>
                </section>

                <section className="space-y-2.5 pt-2 border-t border-slate-200/80 dark:border-slate-800">
                  <h4 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
                    03. Customizing Identity, Theme, Roles &amp; Startup Splash
                  </h4>
                  <ul className="list-disc pl-5 space-y-1.5 text-xs">
                    <li><strong>Developer / Owner Name &amp; Workspace Name:</strong> Configure in <strong>Local Workspace &amp; Nexora Settings</strong> (or click the edit icon on the Startup Splash Screen).</li>
                    <li><strong>Permission Role Simulation:</strong> Switch between <em>Owner</em>, <em>Editor</em>, and read-only <em>Viewer</em> mode to preview locked canvases safely.</li>
                    <li><strong>Appearance:</strong> Toggle between <em>Crisp Light Studio</em> and <em>Obsidian Dark</em> from the header theme button or Settings.</li>
                    <li><strong>Startup Splash Screen:</strong> Check <em>Don&apos;t show on next login</em> to skip on future visits, or re-enable and preview it anytime in Settings.</li>
                  </ul>
                </section>
              </>
            )}

            {activeSection.id === 'workspace-files' && (
              <>
                <div>
                  <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white">
                    Workspace &amp; File Management Workflows
                  </h3>
                  <p className="mt-1.5 text-slate-600 dark:text-slate-400">
                    Manage projects seamlessly across browser storage, reusable templates, snapshots, and portable <code className="font-mono text-xs">.nexora</code> files.
                  </p>
                </div>

                <section className="space-y-2 pt-2 border-t border-slate-200/80 dark:border-slate-800 text-xs">
                  <h4 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
                    Starting New Designs &amp; Templates
                  </h4>
                  <ul className="list-disc pl-5 space-y-1.5">
                    <li><strong>New Creation:</strong> Click <em>New Creation</em> on the Home dashboard or <em>New File</em> in the hamburger menu to pick any of the 9 design types across Flow, Space, Sequence, and Architect.</li>
                    <li><strong>Starter &amp; Custom Templates:</strong> Use <em>New from Template</em> to start from curated layouts, or save any active diagram via <em>Save Design as Template</em> in the hamburger menu to reuse it later.</li>
                    <li><strong>Recent Creations Drawer:</strong> Recent IndexedDB projects live inside a collapsible section on the Home view so your workspace stays uncluttered.</li>
                  </ul>
                </section>

                <section className="space-y-2 pt-2 border-t border-slate-200/80 dark:border-slate-800 text-xs">
                  <h4 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
                    Opening, Saving &amp; Returning to Home
                  </h4>
                  <ul className="list-disc pl-5 space-y-1.5">
                    <li><strong>Open Local Files:</strong> Press <kbd className="font-mono">⌘O / Ctrl+O</kbd>, use <em>Open File (.nexora)</em> in the menu, or drag-and-drop any <code className="font-mono">.nexora</code>, legacy <code className="font-mono">.pcanvas</code>, JSON, or Mermaid file directly onto the window.</li>
                    <li><strong>Leaving an Active Design:</strong> Clicking the Nexora logo or <em>Close Current File</em> opens a safety dialog letting you <strong>Persist in IndexedDB</strong>, <strong>Download Locally (.nexora)</strong> (with an option to keep or remove it from Recent Creations), or <strong>Delete &amp; Clear Design</strong> so temporary drafts never clutter Recent Creations.</li>
                    <li><strong>Snapshots &amp; History:</strong> Click the History icon in the top bar (or <em>History &amp; Snapshots</em> in the menu) to save named checkpoints and restore previous versions with one click.</li>
                    <li><strong>Exporting:</strong> Click <em>Export</em> to generate crisp <strong>SVG</strong>, high-resolution <strong>PNG</strong>, <strong>Native JSON</strong>, <strong>Mermaid</strong>, or portable <strong>.nexora</strong> deliverables.</li>
                  </ul>
                </section>
              </>
            )}

            {activeSection.id === 'flow' && (
              <>
                <div>
                  <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white">
                    Flow Module — Flowcharts, Org Charts, Journeys &amp; Whiteboards
                  </h3>
                  <p className="mt-1.5 text-slate-600 dark:text-slate-400">
                    Map business processes, approval workflows, team hierarchies, customer experiences, and freeform ideation on a snappy vector canvas.
                  </p>
                </div>

                <section className="space-y-2 pt-2 border-t border-slate-200/80 dark:border-slate-800 text-xs">
                  <h4 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
                    Core Canvas Workflows
                  </h4>
                  <ul className="list-disc pl-5 space-y-1.5">
                    <li><strong>Add Shapes:</strong> Drag any symbol from the left Library panel onto the canvas, or click it once to insert at the viewport center.</li>
                    <li><strong>Connect Nodes:</strong> Hover any shape to reveal its 4 edge ports, then drag from a port to another shape to create an orthogonal, curved, or straight connector. Double-click any connector or node to edit its label inline.</li>
                    <li><strong>Multi-Select &amp; Floating Toolbar:</strong> Drag across empty canvas space to marquee-select multiple items (or hold <kbd className="font-mono">Shift</kbd> while clicking). Use the floating top toolbar to recolor, swap shapes while preserving links, align left/center, duplicate, lock, or save as a reusable custom component.</li>
                    <li><strong>Auto-Layout:</strong> Use the Right Properties Panel to run one-click Top-Down or Left-Right layout organization.</li>
                    <li><strong>Whiteboard Sketching:</strong> When working on a Whiteboard document, select the <em>Pen</em> tool in the top toolbar for smooth freehand annotations alongside sticky notes and frames.</li>
                  </ul>
                </section>
              </>
            )}

            {activeSection.id === 'space' && (
              <>
                <div>
                  <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white">
                    Space Module — Architectural Floor Plans
                  </h3>
                  <p className="mt-1.5 text-slate-600 dark:text-slate-400">
                    Design scaled residential, commercial, exterior, interior, and garage layouts with live wall measurements, room area calculation, and real-world proportions.
                  </p>
                </div>

                <section className="space-y-2 pt-2 border-t border-slate-200/80 dark:border-slate-800 text-xs">
                  <h4 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
                    Drawing Walls &amp; Resizing Enclosed Spaces
                  </h4>
                  <ul className="list-disc pl-5 space-y-1.5">
                    <li><strong>Draw Connected Walls:</strong> Switch to the <strong>Draw Wall</strong> tool in the top toolbar and click points on the canvas to chain connected walls together. Press <kbd className="font-mono">Esc</kbd> when finished.</li>
                    <li><strong>Resize Whole Enclosed Space (Single-Click):</strong> In Select mode, click any wall that belongs to a connected room/structure to select the entire enclosed space. Drag any wall directly—or drag the edge/corner resize handles—to resize the space smoothly. Attached doors and windows automatically move and stay aligned on their walls.</li>
                    <li><strong>Edit a Single Wall (Double-Click):</strong> Double-click any individual wall to isolate that single segment, drag its endpoints freely, or change its thickness (Exterior vs. Interior Partition) in the right inspector.</li>
                    <li><strong>Doors, Windows &amp; Furniture:</strong> Drag doors, double doors, sliding doors, and windows directly onto walls (they snap automatically). Flip door swing direction or rotate furniture in 45° increments from the floating bar.</li>
                  </ul>
                </section>

                <section className="space-y-2 pt-2 border-t border-slate-200/80 dark:border-slate-800 text-xs">
                  <h4 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
                    Switching Between US (Imperial) &amp; Metric Measurements
                  </h4>
                  <p>
                    Use the <strong>US | Metric</strong> toggle directly in the floor plan top toolbar—or open the right Properties Panel—to switch instantly between US Imperial (<strong>Feet &amp; Inches</strong> / <strong>Decimal Feet</strong>, areas in <code className="font-mono">sq ft</code>) and Metric (<strong>Meters</strong> / <strong>Centimeters</strong> / <strong>Millimeters</strong>, areas in <code className="font-mono">m²</code>). Wall labels, room areas, the scale bar, wall thickness labels, and furniture width/depth inputs all convert automatically.
                  </p>
                </section>
              </>
            )}

            {activeSection.id === 'sequence' && (
              <>
                <div>
                  <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white">
                    Sequence Module — Call Flows &amp; Sequence Diagrams
                  </h3>
                  <p className="mt-1.5 text-slate-600 dark:text-slate-400">
                    Model API calls, authentication handshakes, event pipelines, and microservice interactions with semantic lifelines and automatic activation bars.
                  </p>
                </div>

                <section className="space-y-2 pt-2 border-t border-slate-200/80 dark:border-slate-800 text-xs">
                  <h4 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
                    Building &amp; Editing Call Flows
                  </h4>
                  <ul className="list-disc pl-5 space-y-1.5">
                    <li><strong>Add &amp; Reorder Participants:</strong> Click or drag roles (User, Browser, API Gateway, Microservice, Database, Cache, Queue, External System) from the left library. Drag participant headers horizontally to reorder columns.</li>
                    <li><strong>Insert Calls Between Lifelines:</strong> Hover along any vertical dashed lifeline to reveal the <code className="font-mono">+</code> connection handle, then drag across to another lifeline (or back onto the same lifeline for a self-call). Subsequent messages shift down automatically.</li>
                    <li><strong>Message Styles &amp; Reordering:</strong> Select any message arrow to switch between <em>Sync</em>, <em>Async</em>, and <em>Return</em>, drag vertically to reorder, or use <kbd className="font-mono">Alt + ↑ / ↓</kbd> for step-by-step reordering.</li>
                    <li><strong>Combined Fragments:</strong> Select one or more messages and click <em>Wrap in Fragment</em> in the floating toolbar to enclose them in <code className="font-mono">alt</code>, <code className="font-mono">opt</code>, <code className="font-mono">loop</code>, or <code className="font-mono">par</code> blocks.</li>
                    <li><strong>Modern vs. Classic UML View:</strong> Toggle between Modern Cards and Classic UML notation directly from the top toolbar.</li>
                  </ul>
                </section>
              </>
            )}

            {activeSection.id === 'architect' && (
              <>
                <div>
                  <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white">
                    Architect Module — Systems, Networks &amp; ERDs
                  </h3>
                  <p className="mt-1.5 text-slate-600 dark:text-slate-400">
                    Design technical cloud architectures, enterprise network topologies, and relational database schemas with icon-native notation.
                  </p>
                </div>

                <section className="space-y-2 pt-2 border-t border-slate-200/80 dark:border-slate-800 text-xs">
                  <h4 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
                    Icon-Native Components, Containers &amp; Validation
                  </h4>
                  <ul className="list-disc pl-5 space-y-1.5">
                    <li><strong>Icon-First Canvas Nodes:</strong> Cloud, compute, database, auth, queue, and network items appear as crisp vector icons in both the left library and on the canvas—no generic box wrappers—with floating titles, subtitles, and technology stack tags.</li>
                    <li><strong>Nested Boundaries:</strong> Use <em>VPC / Cloud Region</em> or <em>Network Subnet / VLAN</em> containers to visually group services, subnets, or Kubernetes clusters.</li>
                    <li><strong>Protocol Connectors:</strong> Select any connector to choose protocol presets (HTTPS, REST, gRPC, SQL, Event, Auth, Cache) that automatically style colors and line patterns.</li>
                    <li><strong>Entity Relationship Diagrams (ERDs):</strong> Add <em>Entity Table</em> cards, edit Primary Key (<code className="font-mono">PK</code>) and Foreign Key (<code className="font-mono">FK</code>) columns in the right inspector, and link tables with crow&apos;s-foot cardinality arrows (<code className="font-mono">1:N</code>, <code className="font-mono">1:1</code>, <code className="font-mono">N:M</code>).</li>
                    <li><strong>Architecture Insights:</strong> When nothing is selected, inspect the right panel for automatic diagram validation warnings (e.g., disconnected nodes or missing endpoints).</li>
                  </ul>
                </section>
              </>
            )}

            {activeSection.id === 'ai-schema' && (
              <>
                <div>
                  <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white">
                    Generate Nexora Designs from Any AI Chat Engine
                  </h3>
                  <p className="mt-1.5 text-slate-600 dark:text-slate-400">
                    Export Nexora&apos;s official Design Schema &amp; Reference File so ChatGPT, Claude, Gemini, or any LLM chat can generate valid, ready-to-open <code className="font-mono text-xs">.nexora</code> files for all 9 design types.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-teal-50/70 dark:bg-teal-950/35 border border-teal-200/80 dark:border-teal-800/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="text-xs font-semibold text-teal-900 dark:text-teal-200">
                      Nexora AI Design Schema &amp; Reference Guide
                    </div>
                    <p className="text-[11.5px] text-teal-800/85 dark:text-teal-300/80">
                      Includes the exact <code className="font-mono">.nexora</code> JSON envelope, all valid component catalogs, and complete extensive examples for all 9 design types.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onDownloadAiSchema}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-teal-700 hover:bg-teal-600 text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Schema Guide (.md)</span>
                  </button>
                </div>

                <section className="space-y-2 pt-2 border-t border-slate-200/80 dark:border-slate-800 text-xs">
                  <h4 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
                    3-Step Workflow with External AI Chat Engines
                  </h4>
                  <ol className="list-decimal pl-5 space-y-2">
                    <li>
                      <strong>Download the Schema File:</strong> Click the button above (or choose <em>Export AI Design Schema Guide</em> from the Hamburger Menu or Settings) to save <code className="font-mono">nexora-ai-design-schema.md</code>.
                    </li>
                    <li>
                      <strong>Upload &amp; Prompt Your Chat Engine:</strong> Attach <code className="font-mono">nexora-ai-design-schema.md</code> in your chat engine and ask: <em>&ldquo;Using the uploaded Nexora schema, generate a valid .nexora JSON file for a multi-region AWS architecture / 3-bedroom house floorplan / checkout call flow.&rdquo;</em>
                    </li>
                    <li>
                      <strong>Open in Nexora:</strong> Save the generated JSON with a <code className="font-mono">.nexora</code> extension and drag-and-drop it straight onto Nexora (or use <strong>Open File</strong> in the menu). Everything renders natively and is immediately editable!
                    </li>
                  </ol>
                </section>
              </>
            )}

            {activeSection.id === 'shortcuts' && (
              <>
                <div>
                  <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white">
                    Keyboard Shortcuts Reference
                  </h3>
                  <p className="mt-1.5 text-slate-600 dark:text-slate-400">
                    Speed through diagramming, panning, selection, and file operations across every Nexora canvas.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <table className="w-full text-xs">
                    <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800/80">
                      {[
                        ['Download Design to Local Drive (.nexora)', '⌘ / Ctrl + S'],
                        ['Open Local Design File (.nexora / .pcanvas)', '⌘ / Ctrl + O'],
                        ['Open Universal Command Palette', '⌘ / Ctrl + K'],
                        ['Undo / Redo Last Action', '⌘Z / ⌘⇧Z'],
                        ['Export Diagram (SVG / PNG / JSON / .nexora)', '⌘ / Ctrl + E'],
                        ['Select All Canvas Elements', '⌘ / Ctrl + A'],
                        ['Marquee Multi-Select', 'Drag on Canvas'],
                        ['Additive Multi-Select', 'Shift + Click'],
                        ['Duplicate Selected Items', '⌘ / Ctrl + D'],
                        ['Delete Selected Items', 'Backspace / Delete'],
                        ['Pan Across Canvas', 'Space + Drag'],
                        ['Zoom Around Pointer', 'Mouse Wheel'],
                        ['Nudge Selected Objects', 'Arrow Keys (Shift = 20px)'],
                        ['Reorder Sequence Message Earlier / Later', 'Alt + ↑ / ↓'],
                        ['Edit Label Inline', 'Double-click'],
                        ['Finish Wall Drawing / Exit Presentation', 'Esc'],
                      ].map(([action, keys]) => (
                        <tr key={action} className="bg-white dark:bg-[#0D1422]">
                          <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300">
                            {action}
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <kbd className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-[#141F32] text-slate-700 dark:text-teal-300 border border-slate-200/80 dark:border-slate-700/80 whitespace-nowrap">
                              {keys}
                            </kbd>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 px-5 py-3 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50/70 dark:bg-[#090F1A] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            <BookOpen className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span>Need technical architecture or codebase documentation? See README.md in the project root.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold hover:opacity-90 transition-opacity whitespace-nowrap"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
