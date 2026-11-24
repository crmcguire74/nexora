# Nexora — The Visual Workspace

**Nexora** is a local-first, offline-capable Progressive Web Application (PWA) and multi-discipline vector diagramming studio. It unifies four specialized visual workspaces—**Flow**, **Space**, **Sequence**, and **Architect**—under a single precision SVG canvas architecture with IndexedDB auto-persistence, portable `.nexora` file ownership, optional AI-assisted generation, and one-click AI chat schema export.

Developed by **Christopher R McGuire** · © 2026 Christopher R McGuire.

---

## Table of Contents

1. [Product Overview & Design Modules](#1-product-overview--design-modules)
2. [User Workflows & Feature Guide](#2-user-workflows--feature-guide)
3. [AI Chat Engine Schema Workflow](#3-ai-chat-engine-schema-workflow)
4. [System Architecture & Tech Stack](#4-system-architecture--tech-stack)
5. [Codebase Structure & Module Map](#5-codebase-structure--module-map)
6. [Data Model & `.nexora` File Specification](#6-data-model--nexora-file-specification)
7. [Storage & Persistence Architecture](#7-storage--persistence-architecture)
8. [Backend APIs & Serverless Endpoints](#8-backend-apis--serverless-endpoints)
9. [PWA, Local Development & Netlify Deployment](#9-pwa-local-development--netlify-deployment)
10. [Developer Extension Guide](#10-developer-extension-guide)

---

## 1. Product Overview & Design Modules

Nexora categorizes **9 specialized diagram types** across **4 core modules**:

| Module | Diagram Types (`DiagramType`) | Canvas Engine | Key Capabilities |
| :--- | :--- | :--- | :--- |
| **Flow** | `flowchart`, `orgchart`, `journey`, `whiteboard` | `StandardCanvas` | Process & decision branches, swimlanes, reporting trees, UX journey emotions, sticky notes, freehand sketching, auto-layout |
| **Space** | `floorplan` | `FloorPlanCanvas` | Scaled architectural drafting (canonical meters), connected-wall whole-space resizing, single-wall double-click editing, auto-snapping doors/windows, auto-detected room polygons & areas, US Imperial (`ft-in`/`ft`) & Metric (`m`/`cm`/`mm`) live switching, home/business/exterior/interior/garage catalogs |
| **Sequence** | `sequence` | `SequenceCanvas` | Semantic participants & lifelines, drag-to-connect `+` lifeline handles with automatic message shifting, sync/async/return/self arrows, auto activation bars, combined fragments (`alt`/`opt`/`loop`/`par`), Modern & Classic UML views |
| **Architect** | `architecture`, `network`, `erd` | `StandardCanvas` | Icon-native cloud/network/compute nodes (no generic box wrappers), nested VPC/subnet containers, protocol-styled connectors, relational ERD entity tables with `PK`/`FK` fields and crow's-foot cardinality |

---

## 2. User Workflows & Feature Guide

### Startup & Workspace Configuration
- **Startup Splash Screen**: Displays Nexora branding, module overview, layered isometric architectural artwork, developer credit (editable inline or via Settings), and © 2026 notice. Users can dismiss on click/`Esc`/`Enter` or check **"Don't show this splash screen on next login"** (`localStorage` key `nexora_hide_splash`). Re-enable or preview anytime via **Local Workspace & Nexora Settings**.
- **Themes**: Switch between **Crisp Light Studio** and **Obsidian Dark** via the header theme button or Settings (`localStorage` key `pc_theme`).
- **Role Simulation**: Switch local identity between `owner`, `editor`, and read-only `viewer` in Settings to verify locked viewing flows.
- **PWA Installation**: Install Nexora as a standalone offline desktop app from the **Hamburger Menu (≡) → Save / Install as PWA** (or manage/uninstall via **Uninstall PWA**).

### Creating, Opening, Saving & Leaving Designs
- **New Creation / Templates**: Start blank diagrams or curated starter templates from the Home hero **New Creation** button or **Hamburger Menu → New File / New from Template**. Save any active diagram as a personal reusable template via **Save Design as Template**.
- **IndexedDB + Local `.nexora` Backups**: Every canvas change auto-saves to IndexedDB (450 ms debounce). A persistent banner reminds users to save permanent `.nexora` backups to disk (`⌘S / Ctrl+S`), using the File System Access API for in-place saves when supported or standard downloads otherwise.
- **Opening Files**: Press `⌘O / Ctrl+O`, use **Open File (.nexora)**, or drag-and-drop `.nexora`, legacy `.pcanvas`, `.json`, or Mermaid files directly onto the app window.
- **Returning Home Confirmation**: Navigating back to the primary Home view (Nexora logo or **Close Current File**) prompts the user to choose:
  1. **Persist in IndexedDB** — flushes edits and keeps the project in the collapsible **Recent Creations** panel.
  2. **Download Locally (`.nexora`)** — saves to local drive with an optional checkbox to also keep a copy in IndexedDB (unchecked removes it from Recent Creations after saving).
  3. **Delete & Clear Design** — cancels pending autosaves and deletes the design from IndexedDB so temporary drafts never appear in Recent Creations.
- **History & Snapshots**: Capture named document checkpoints and restore prior states from the **History & Snapshots** drawer.
- **Exports**: Export crisp **SVG**, raster **PNG**, **Native JSON**, **Mermaid**, or **`.nexora`** files from the **Export** modal (`⌘E / Ctrl+E`).
- **Contextual Tooltips & Help**: Hovering any toolbar or floating contextual button reveals a styled tooltip describing the button and its shortcut. Open **Hamburger Menu → Help & User Guide** anytime for full user instructions.

### Floor Plan Specific Workflows
- **Draw Connected Walls**: Activate **Draw Wall**, click sequential corner points, and press `Esc` to finish.
- **Whole-Space vs. Single-Wall Editing**: Clicking a wall that is part of a connected structure selects the entire enclosed space so dragging any wall or corner/edge handle resizes the whole room while doors and windows follow proportionally. Double-clicking any wall isolates that single wall segment for endpoint reshaping or thickness editing.
- **US vs. Metric Measurements**: Toggle **US | Metric** directly from the floor plan top toolbar or refine unit precision (`ft-in`, `ft`, `m`, `cm`, `mm`) in the right Properties Panel. All wall dimensions, room areas (`sq ft` / `m²`), scale bar, wall thickness labels, and furniture dimension inputs convert dynamically.

---

## 3. AI Chat Engine Schema Workflow

Nexora includes a built-in **AI Design Schema & Reference Guide** exporter (`src/engine/aiSchemaExport.ts`) accessible from:
- **Hamburger Menu → Export AI Design Schema Guide (.md)**
- **Local Workspace & Nexora Settings → Download Schema Guide (.md)**
- **Help & User Guide → AI Chat Engine Integration**

Downloading `nexora-ai-design-schema.md` gives users a single Markdown specification containing:
1. Strict LLM authoring instructions and RFC 8259 JSON rules.
2. The exact top-level `.nexora` file envelope (`format: "nexora"`, `formatVersion: 1`, `document`).
3. Live-generated component type tables for every one of the 9 design types (synced dynamically with `src/engine/libraries.ts`).
4. Complete, extensive `.nexora` JSON examples for all 9 design types.

Users can upload this file to any external AI chat engine (ChatGPT, Claude, Gemini, etc.), ask it to generate a design conforming to the schema, save the output with a `.nexora` extension, and open or drag-and-drop it straight into Nexora.

---

## 4. System Architecture & Tech Stack

| Layer | Technology | Role |
| :--- | :--- | :--- |
| **UI Framework** | React 19 + TypeScript 5 | Component architecture, state hooks, SVG canvas rendering |
| **Build & Dev Tooling** | Vite 8 (`@vitejs/plugin-react`) | Fast dev HMR/middleware, production asset bundling |
| **Styling** | Tailwind CSS v4 (`@tailwindcss/vite`) | Design tokens, `@custom-variant dark` dual-theme (`Light Studio` + `Obsidian Dark`) |
| **Icons & Motion** | `lucide-react` + custom vector SVG library (`ShapeIcons.tsx`) | UI controls, Nexora brand/module icons, icon-native canvas symbols |
| **PWA Runtime** | `vite-plugin-pwa` (Workbox) | Service worker precaching, offline shell, Web App Manifest, desktop installability |
| **Client Persistence** | IndexedDB (`project-canvas-db`) + `localStorage` | Offline-first document store, custom templates, custom components, preferences |
| **Local File I/O** | File System Access API + Blob fallback (`pcanvasFile.ts`) | Native save/overwrite handles and universal `.nexora` file import/export |
| **Dev & Production Server** | Express 4 (`server.ts`, executed via `tsx`) | Serves Vite middleware in dev, static `dist/` in prod, and `/api/*` Gemini proxy routes |
| **Serverless Deployment** | Netlify (`netlify.toml` + `netlify/functions/api.ts`) | Static SPA hosting + `/api/*` proxy to Netlify Edge/Serverless function |
| **Optional AI Engine** | `@google/genai` (server-side only) | Diagram generation (`/api/ai/generate`) and review (`/api/ai/analyze`) |

### Rendering Pipeline
All three interactive canvases (`StandardCanvas`, `SequenceCanvas`, `FloorPlanCanvas`) are **pure React + SVG engines** with world-space viewport transforms (`translate(vp.x, vp.y) scale(vp.zoom)`):
- Zero external heavy canvas runtime dependencies—every exported SVG/PNG comes directly from the exact rendered DOM `<svg ref={svgRef}>`.
- Command-based undo/redo history stack (up to 50 snapshots in `EditorWorkspace.tsx`).
- Clean keyboard focus hygiene (`LeftLibraryPanel` blurs cards on click and ignores key repeats/Space so Space+Drag panning never collides with sidebar focus).

---

## 5. Codebase Structure & Module Map

```text
/
├── index.html                           # SPA entry, fonts (Plus Jakarta Sans, JetBrains Mono), meta tags
├── metadata.json                        # App metadata & capabilities declaration
├── netlify.toml                         # Netlify build, /api/* redirects, SPA fallback & PWA cache headers
├── package.json                         # Dependencies and scripts (dev, build, start, lint)
├── server.ts                            # Express server (port 3000) mounting Vite middleware & /api/* routes
├── tsconfig.json                        # TypeScript compiler configuration
├── vite.config.ts                       # Vite + Tailwind v4 + VitePWA manifest/workbox configuration
├── netlify/
│   └── functions/
│       └── api.ts                       # Netlify serverless equivalent of Express /api/* endpoints
├── public/
│   ├── icon.svg                         # Nexora vector icon
│   ├── apple-touch-icon.png             # iOS/macOS home screen icon
│   ├── pwa-192x192.png                  # PWA manifest icon (192px)
│   ├── pwa-512x512.png                  # PWA manifest icon (512px)
│   └── pwa-maskable-512x512.png         # PWA maskable icon
└── src/
    ├── main.tsx                         # React root mount + SW registration
    ├── index.css                        # Tailwind v4 import, @custom-variant dark, theme CSS tokens & animations
    ├── App.tsx                          # Top-level state orchestration (theme, profile, IndexedDB sync, modals, splash)
    ├── types/
    │   └── diagram.ts                   # Canonical TypeScript interfaces for all documents, shapes, sequence & floorplan models
    ├── hooks/
    │   └── usePWAInstall.ts             # Global PWA install/uninstall event bus & beforeinstallprompt management
    ├── assets/
    │   └── images/                      # Bundled studio image assets (startup splash hero artwork)
    ├── engine/
    │   ├── storage.ts                   # IndexedDBDiagramRepository + localStorage fallback & LocalProfile persistence
    │   ├── pcanvasFile.ts               # .nexora / .pcanvas envelope serialization, parsing, FS Access API & drag/drop I/O
    │   ├── libraries.ts                 # Module definitions, 9 diagram type catalogs, object/furniture factory helpers
    │   ├── templates.ts                 # Blank diagram factories, 9 rich starter templates & first-visit seed data
    │   ├── geometry.ts                  # Port math, orthogonal/curved routing, smart guides, US/Metric formatting, room polygon detection
    │   ├── layout.ts                    # Auto-layout engine (Top-Down / Left-Right) & diagram structural validator
    │   ├── themes.ts                    # 5 diagram color themes (Minimal, Modern, Technical, Presentation, Blueprint) & swatches
    │   ├── exportImport.ts              # SVG, PNG, native JSON & Mermaid exporters/importers
    │   └── aiSchemaExport.ts            # Dynamic Markdown AI chat engine schema & full 9-type reference exporter
    └── components/
        ├── ui/
        │   └── Tooltip.tsx              # Portal-based instant hover tooltip with label, description & shortcut keycap
        ├── icons/
        │   └── ShapeIcons.tsx           # Nexora logo, module icons, 9 preview illustrations, icon-native SVG node shapes
        ├── navigation/
        │   └── NexoraHamburgerMenu.tsx  # Unified File, Workspace, AI Schema, Help & PWA dropdown menu
        ├── home/
        │   └── HomeDashboard.tsx        # Primary landing view, module launcher, collapsible Recent Creations, templates & components
        ├── modals/
        │   ├── SplashScreen.tsx         # Flagship startup splash screen with inline developer credit & skip-next-login toggle
        │   ├── HelpModal.tsx            # Searchable 8-chapter in-app Help & User Guide
        │   ├── NewDesignModal.tsx       # Create blank / template / clear canvas dialog
        │   └── WorkspaceSettingsModal.tsx # Identity, role, theme, startup splash, IndexedDB stats, AI schema export & PWA controls
        ├── pwa/
        │   ├── PWAInstallButton.tsx     # Install & Uninstall PWA instruction/status modals
        │   └── OfflineIndicator.tsx     # Network offline banner
        ├── canvas/
        │   ├── StandardCanvas.tsx       # Vector engine for Flowchart, Architecture, Network, ERD, Org Chart, Journey, Whiteboard
        │   ├── SequenceCanvas.tsx       # Semantic lifeline/message/fragment engine for Sequence & Call Flow diagrams
        │   └── FloorPlanCanvas.tsx      # Architectural meter-canonical floor plan engine with connected-wall room resizing
        └── editor/
            ├── EditorWorkspace.tsx      # Main editor shell: top bar, autosave bar, undo/redo, shortcuts, leave modal, panels
            ├── LeftLibraryPanel.tsx     # Searchable component library (drag/click), favorites, recents, custom symbols & outline
            ├── RightPropertiesPanel.tsx # Context-sensitive inspector (object, connector, sequence, floorplan US/Metric, settings)
            ├── FloatingToolbar.tsx      # Contextual selection bar with rich hover tooltips
            ├── CommandPalette.tsx       # Cmd+K universal quick command & component launcher
            ├── ExportImportModal.tsx    # Multi-format export (SVG/PNG/JSON/Mermaid/.nexora) & import modal
            └── AiStudioModal.tsx        # Optional Gemini diagram generator & architectural reviewer UI
```

---

## 6. Data Model & `.nexora` File Specification

All persistent and exported designs center on `DiagramDocument` (`src/types/diagram.ts`). Desktop files wrap `DiagramDocument` inside `PCanvasFileEnvelope` (`src/engine/pcanvasFile.ts`):

```ts
interface PCanvasFileEnvelope {
  format: 'nexora' | 'project-canvas';
  formatVersion: 1;
  extension: '.nexora' | '.pcanvas';
  savedAt: string;           // ISO-8601 timestamp
  document: DiagramDocument; // Full diagram payload
}
```

### Key Modeling Conventions
1. **Standard Diagrams** (`flowchart`, `architecture`, `network`, `erd`, `orgchart`, `journey`, `whiteboard`):
   - Stored in `document.objects[]` (pixel `x, y, width, height`) and `document.connections[]`.
   - Containers (`category: 'container'`, `metadata.isContainer: true`) group child nodes via `child.parentId`.
   - Icon-native types (listed in `ICON_NATIVE_OBJECT_TYPES` in `ShapeIcons.tsx`) render pure vector icons on the canvas with floating labels/subtitles rather than enclosing boxes.
   - ERD entities (`type: 'erd-entity'`, `category: 'entity'`) store column schemas in `metadata.fields: ErdField[]`.
2. **Sequence Diagrams** (`type: 'sequence'`):
   - Stored in `document.sequence: SequenceData` (`participants`, `messages`, `fragments`, `notes`, `viewMode`, `autoActivation`, `participantSpacing`, `rowSpacing`).
   - Layout is computed deterministically from 0-based `order` indices.
3. **Floor Plans** (`type: 'floorplan'`):
   - Stored in `document.floorplan: FloorPlanData` (`unit`, `pixelsPerMeter`, `walls`, `openings`, `rooms`, `furniture`).
   - **Canonical Unit Rule**: Every spatial coordinate and dimension is stored in **meters** (`x1, y1, x2, y2, thickness, width, depth, polygon`). Display formatting (`formatLength`, `formatArea`) and inspector inputs (`metersToInputValue`, `inputValueToMeters`) convert dynamically based on `floorplan.unit` (`ft-in`, `ft`, `m`, `cm`, `mm`).

---

## 7. Storage & Persistence Architecture

### IndexedDB (`src/engine/storage.ts`)
- **Database**: `project-canvas-db` (version `1`), encapsulated behind the `DiagramRepository` interface (`IndexedDBDiagramRepository` implementation — designed so a remote cloud adapter can be swapped in without touching UI components).
- **Object Stores**:
  - `diagrams` (`keyPath: 'id'`) — All saved user diagrams (sorted by `updatedAt` descending).
  - `components` (`keyPath: 'id'`) — Reusable custom symbols saved from the floating toolbar.
  - `custom_templates` (`keyPath: 'id'`) — User-saved diagram templates accessible in **New from Template**.
- **Fallback**: Automatically falls back to `localStorage` (`pc_diagrams_fallback`) if IndexedDB is unavailable in restricted contexts.

### `localStorage` Preference Keys
| Key | Purpose |
| :--- | :--- |
| `pc_theme` | `'light'` or `'dark'` UI appearance preference |
| `pc_local_profile` | Serialized `LocalProfile` (`name`, `email`, `role`, `workspaceName`) |
| `pc_fav_shapes` | Array of pinned favorite library item IDs |
| `nexora_hide_splash` | `'true'` when the user disables the startup splash screen |

---

## 8. Backend APIs & Serverless Endpoints

Nexora exposes three lightweight JSON endpoints via **Express (`server.ts`)** in local/Node deployments and identically via **Netlify Functions (`netlify/functions/api.ts`)** in serverless deployments. API keys remain strictly server-side (`process.env.GEMINI_API_KEY`).

### `GET /api/health`
Returns server readiness and whether optional server-side AI assistance is configured.
```json
{ "status": "ok", "aiAvailable": true }
```

### `POST /api/ai/generate`
Generates a structured diagram payload from a natural-language prompt using `@google/genai` structured JSON output (`responseSchema`).
- **Request Body**: `{ "prompt": "string (min 3 chars)", "diagramType": "flowchart | architecture | sequence | network | erd | orgchart | journey" }`
- **Response (`sequence`)**: `{ "diagramType": "sequence", "data": { "title", "participants": [...], "messages": [...], "fragments": [...] } }`
- **Response (other types)**: `{ "diagramType": "<type>", "data": { "title", "nodes": [...], "connections": [...] } }`
- Client-side `AiStudioModal.tsx` maps the response into a full `DiagramDocument` and runs auto-layout.

### `POST /api/ai/analyze`
Reviews an existing `DiagramDocument` and returns structured architectural observations.
- **Request Body**: `{ "document": DiagramDocument }`
- **Response**: `{ "summary": "string", "strengths": string[], "risksAndGaps": string[], "suggestions": string[] }`

---

## 9. PWA, Local Development & Netlify Deployment

### Environment Variables (`.env.example`)
- `GEMINI_API_KEY` *(optional)*: Enables `/api/ai/generate` and `/api/ai/analyze`. Core diagramming, IndexedDB, `.nexora` file I/O, and AI schema export work 100% offline without an API key.
- `PORT` / `DEFAULT_APP_PORT`: Server port (defaults to `3000`).
- `DISABLE_HMR`: Set `'true'` when running in iframe/sandbox environments without HMR WebSockets.

### Local Commands
```bash
npm install        # Install dependencies
npm run dev        # Start Express + Vite dev middleware on port 3000 (tsx server.ts)
npm run lint       # Strict TypeScript check (tsc --noEmit)
npm run build      # Build production SPA + PWA service worker into dist/
NODE_ENV=production npm start  # Serve production dist/ + /api/* via server.ts
```

### Netlify Deployment
Configured out of the box via `netlify.toml`:
- **Build command**: `npm run build`
- **Publish directory**: `dist`
- **Functions directory**: `netlify/functions` (esbuild bundled)
- **Redirects**: `/api/*` → `/.netlify/functions/api/:splat` (`200`), `/*` → `/index.html` (`200`)
- **PWA Cache Headers**: `no-cache, no-store, must-revalidate` on `/sw.js` and `/registerSW.js`; immutable 1-year caching on `/assets/*`.
- Set `GEMINI_API_KEY` in Netlify Site Environment Variables to enable the optional AI Assist routes in production.

---

## 10. Developer Extension Guide

### Adding a New Library Symbol & Canvas Icon
1. Add a `LibraryItem` entry in the appropriate `*_LIBRARY` array inside `src/engine/libraries.ts`.
2. Add its vector icon drawing inside `ShapeIcons.tsx` (`ShapeIconPaths` or `SequenceRoleIconPaths`).
3. If the node should render as a borderless **icon-native** node on the canvas (like cloud/network nodes), add its `type` string to `ICON_NATIVE_OBJECT_TYPES` in `src/components/icons/ShapeIcons.tsx`.
4. Note: `src/engine/aiSchemaExport.ts` reads `getLibraryForType()` dynamically, so the exported AI Design Schema Guide automatically stays in sync with any new symbols you add!

### Adding a New Starter Template
1. Create a factory function returning a `DiagramDocument` in `src/engine/templates.ts`.
2. Register it inside `BUILTIN_TEMPLATES` in `src/engine/templates.ts` (it automatically appears in Home Templates and `NewDesignModal`).

### Swapping Storage to a Remote Database
Implement the `DiagramRepository` interface in `src/engine/storage.ts` and export your implementation as `diagramRepo`—all persistence calls across `App.tsx` and `EditorWorkspace.tsx` program strictly against that interface.
