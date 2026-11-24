import React, { useMemo, useState } from 'react';
import { Check, Copy, Download, FileCode, Image, Upload, X } from 'lucide-react';
import { DiagramDocument } from '../../types/diagram';
import {
  downloadFile,
  exportDocumentToMermaid,
  exportSvgElementToPngBlob,
  exportSvgElementToSvgString,
  importFromMermaid,
  importFromNativeJson,
} from '../../engine/exportImport';
import { saveDesignToDesktop } from '../../engine/pcanvasFile';

interface ExportImportModalProps {
  open: boolean;
  initialTab?: 'export' | 'import';
  onClose: () => void;
  doc: DiagramDocument;
  darkMode: boolean;
  svgRef: React.RefObject<SVGSVGElement | null>;
  onImportDocument: (imported: DiagramDocument) => void;
}

export const ExportImportModal: React.FC<ExportImportModalProps> = ({
  open,
  initialTab = 'export',
  onClose,
  doc,
  darkMode,
  svgRef,
  onImportDocument,
}) => {
  const [tab, setTab] = useState<'export' | 'import'>(initialTab);
  const [transparentBg, setTransparentBg] = useState(false);
  const [pngScale, setPngScale] = useState<1 | 2 | 3>(2);
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const [copiedMermaid, setCopiedMermaid] = useState(false);

  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);

  const mermaidCode = useMemo(() => exportDocumentToMermaid(doc), [doc]);
  const safeFileName = doc.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'diagram';

  if (!open) return null;

  const bgColor = transparentBg ? 'transparent' : darkMode ? '#0B1120' : '#FFFFFF';

  const handleExportSvg = () => {
    if (!svgRef.current) return;
    const svgStr = exportSvgElementToSvgString(svgRef.current, { background: bgColor });
    downloadFile(`${safeFileName}.svg`, svgStr, 'image/svg+xml;charset=utf-8');
    setExportStatus('Vector SVG downloaded.');
  };

  const handleExportPng = async () => {
    if (!svgRef.current) return;
    try {
      setExportStatus('Rendering high-resolution PNG...');
      const blob = await exportSvgElementToPngBlob(svgRef.current, {
        background: bgColor,
        scale: pngScale,
      });
      downloadFile(`${safeFileName}@${pngScale}x.png`, blob);
      setExportStatus(`PNG (${pngScale}x) downloaded.`);
    } catch (e) {
      setExportStatus(e instanceof Error ? e.message : 'PNG export failed.');
    }
  };

  const handleExportPCanvas = async () => {
    const res = await saveDesignToDesktop(doc, { saveAs: true });
    if (res.saved) {
      setExportStatus(`Saved ${res.fileName} to your computer.`);
    }
  };

  const handleCopyMermaid = async () => {
    try {
      await navigator.clipboard.writeText(mermaidCode);
      setCopiedMermaid(true);
      setTimeout(() => setCopiedMermaid(false), 1800);
    } catch {
      // fallback
    }
  };

  const handleRunImport = () => {
    setImportError(null);
    const trimmed = importText.trim();
    if (!trimmed) {
      setImportError('Paste valid Nexora (.nexora / JSON) or Mermaid diagram code.');
      return;
    }
    try {
      const imported = trimmed.startsWith('{')
        ? importFromNativeJson(trimmed)
        : importFromMermaid(trimmed, 'Imported Mermaid Diagram');
      onImportDocument(imported);
      onClose();
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Failed to parse import content.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImportText(reader.result);
        setImportError(null);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-xs flex items-center justify-center p-4"
      onMouseDown={onClose}
    >
      <div
        className="w-full max-w-xl rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden"
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Export and Import Diagram"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Export & Interoperability
            </h2>
            <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => setTab('export')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  tab === 'export'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Export
              </button>
              <button
                type="button"
                onClick={() => setTab('import')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  tab === 'import'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Import
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {tab === 'export' ? (
          <div className="p-5 space-y-5">
            {/* Options row */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={transparentBg}
                  onChange={(e) => setTransparentBg(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600"
                />
                <span>Transparent background</span>
              </label>

              <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                <span>PNG Scale</span>
                <div className="flex items-center gap-1 p-0.5 rounded-md bg-slate-100 dark:bg-slate-800">
                  {([1, 2, 3] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setPngScale(s)}
                      className={`px-2 py-0.5 rounded text-xs font-mono ${
                        pngScale === s
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                          : 'text-slate-500'
                      }`}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Export Buttons */}
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={handleExportSvg}
                className="flex flex-col items-start gap-1.5 p-3.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-blue-500 hover:bg-blue-50/40 dark:hover:bg-blue-950/30 transition-colors text-left"
              >
                <FileCode className="w-4 h-4 text-blue-600" />
                <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">Vector SVG</div>
                <div className="text-[11px] text-slate-500">Crisp infinite scale</div>
              </button>

              <button
                type="button"
                onClick={handleExportPng}
                className="flex flex-col items-start gap-1.5 p-3.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-blue-500 hover:bg-blue-50/40 dark:hover:bg-blue-950/30 transition-colors text-left"
              >
                <Image className="w-4 h-4 text-blue-600" />
                <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                  Image PNG ({pngScale}x)
                </div>
                <div className="text-[11px] text-slate-500">Ready for slides</div>
              </button>

              <button
                type="button"
                onClick={handleExportPCanvas}
                className="flex flex-col items-start gap-1.5 p-3.5 rounded-lg border border-teal-500/40 bg-teal-50/40 dark:bg-teal-950/30 hover:border-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/50 transition-colors text-left"
              >
                <Download className="w-4 h-4 text-teal-700 dark:text-teal-400" />
                <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                  Nexora File (.nexora)
                </div>
                <div className="text-[11px] text-slate-500">Desktop backup &amp; reopen</div>
              </button>
            </div>

            {exportStatus && (
              <div className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                {exportStatus}
              </div>
            )}

            {/* Mermaid Code Preview */}
            {doc.type !== 'floorplan' && (
              <div className="space-y-1.5 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Mermaid Source
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyMermaid}
                    className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
                  >
                    {copiedMermaid ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedMermaid ? 'Copied' : 'Copy Mermaid'}</span>
                  </button>
                </div>
                <pre className="max-h-40 overflow-auto p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] font-mono text-slate-700 dark:text-slate-300">
                  {mermaidCode}
                </pre>
              </div>
            )}
          </div>
        ) : (
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Load a <span className="font-mono">.nexora</span> / <span className="font-mono">.pcanvas</span> file or paste Nexora JSON / Mermaid syntax.
              </p>
              <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer whitespace-nowrap">
                <Upload className="w-3.5 h-3.5" />
                <span>Open .nexora File</span>
                <input
                  type="file"
                  accept=".nexora,.pcanvas,.json,.mmd,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            <textarea
              rows={8}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder={`sequenceDiagram\n    actor U as User\n    participant API as Auth API\n    U->>API: Submit Credentials\n    API-->>U: Return Session`}
              className="w-full p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500"
            />

            {importError && (
              <div className="text-xs text-red-600 dark:text-red-400">{importError}</div>
            )}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRunImport}
                className="px-4 py-2 text-xs font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              >
                Import into Editable Canvas
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
