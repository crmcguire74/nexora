import React, { useState } from 'react';
import { Loader2, Sparkles, Wand2, X } from 'lucide-react';
import {
  DiagramConnection,
  DiagramDocument,
  DiagramObject,
  FragmentKind,
  SequenceMessageType,
  SequenceParticipantRole,
} from '../../types/diagram';
import { getLibraryForType } from '../../engine/libraries';
import { applyAutoLayout } from '../../engine/layout';
import { makeId } from '../../engine/templates';
import { PROTOCOL_STYLES } from '../../engine/themes';

interface AiStudioModalProps {
  open: boolean;
  onClose: () => void;
  doc: DiagramDocument;
  onApplyGeneratedDoc: (nextDoc: DiagramDocument) => void;
}

interface AnalysisResult {
  summary: string;
  strengths: string[];
  risksAndGaps: string[];
  suggestions: string[];
}

export const AiStudioModal: React.FC<AiStudioModalProps> = ({
  open,
  onClose,
  doc,
  onApplyGeneratedDoc,
}) => {
  const [mode, setMode] = useState<'generate' | 'analyze'>('generate');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

  if (!open) return null;

  const examplePrompts: Record<string, string> = {
    sequence:
      'Show a user logging in through a React frontend, calling an authentication API, validating credentials against an identity provider, then fetching permissions from PostgreSQL.',
    architecture:
      'Create a cloud architecture with a React web app, API gateway, authentication service, orders microservice, Redis cache, Kafka event bus, and PostgreSQL database inside a Production VPC.',
    flowchart:
      'Design a customer incident escalation flowchart from intake, triage severity decision, automated paging for critical issues, resolution verification, and post-mortem logging.',
    erd: 'Model an e-commerce database with customers, orders, order_items, and products tables.',
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          diagramType: doc.type === 'floorplan' ? 'architecture' : doc.type,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to generate diagram.');
      }

      if (json.diagramType === 'sequence' && json.data) {
        const raw = json.data as {
          title?: string;
          participants?: Array<{ id: string; name: string; role?: string; subtitle?: string }>;
          messages?: Array<{
            fromId: string;
            toId: string;
            label: string;
            type?: string;
            protocol?: string;
            endpoint?: string;
          }>;
          fragments?: Array<{ kind?: string; guard?: string; startIndex?: number; endIndex?: number }>;
        };
        const palette = ['#475569', '#2563EB', '#0284C7', '#DC2626', '#0D9488', '#D97706'];
        const idMap = new Map<string, string>();
        const participants = (raw.participants ?? []).map((p, idx) => {
          const nid = makeId('p');
          idMap.set(p.id, nid);
          return {
            id: nid,
            name: p.name,
            role: (p.role as SequenceParticipantRole) || 'microservice',
            subtitle: p.subtitle,
            color: palette[idx % palette.length],
            order: idx,
          };
        });
        const messages = (raw.messages ?? [])
          .filter((m) => idMap.has(m.fromId) && idMap.has(m.toId))
          .map((m, idx) => ({
            id: makeId('sm'),
            fromId: idMap.get(m.fromId)!,
            toId: idMap.get(m.toId)!,
            label: m.label,
            type: (['sync', 'async', 'return', 'self', 'event'].includes(m.type || '')
              ? m.type
              : 'sync') as SequenceMessageType,
            order: idx,
            protocol: m.protocol,
            endpoint: m.endpoint,
            activateTarget: m.type === 'sync',
          }));
        const fragments = (raw.fragments ?? []).map((f) => ({
          id: makeId('frag'),
          kind: (['alt', 'opt', 'loop', 'par', 'break', 'critical'].includes(f.kind || '')
            ? f.kind
            : 'alt') as FragmentKind,
          guard: f.guard || 'condition',
          startOrder: Math.max(0, Math.min(messages.length - 1, f.startIndex ?? 0)),
          endOrder: Math.max(0, Math.min(messages.length - 1, f.endIndex ?? Math.max(0, messages.length - 1))),
          color: '#0284C7',
        }));

        onApplyGeneratedDoc({
          ...doc,
          title: raw.title || doc.title,
          sequence: {
            viewMode: doc.sequence?.viewMode ?? 'modern',
            autoActivation: true,
            participantSpacing: 205,
            rowSpacing: 64,
            participants,
            messages,
            fragments,
            notes: [],
          },
          updatedAt: new Date().toISOString(),
        });
        onClose();
        return;
      }

      // Standard graph-based diagram generation -> native editable objects
      const raw = json.data as {
        title?: string;
        nodes?: Array<{
          id: string;
          type: string;
          label: string;
          subtitle?: string;
          description?: string;
          technology?: string;
          parentId?: string;
        }>;
        connections?: Array<{
          fromId: string;
          toId: string;
          label?: string;
          protocol?: string;
          style?: string;
        }>;
      };

      const lib = getLibraryForType(doc.type);
      const idMap = new Map<string, string>();
      const nodesRaw = raw.nodes ?? [];
      nodesRaw.forEach((n) => idMap.set(n.id, makeId('obj')));

      const objects: DiagramObject[] = nodesRaw.map((n, idx) => {
        const templateItem = lib.find((l) => l.type === n.type) ?? lib[0];
        const isContainer = templateItem?.isContainer || n.type.includes('container') || n.type.includes('vpc');
        const isErd = n.type === 'erd-entity';
        const parsedFields =
          isErd && n.description
            ? n.description.split(',').map((tok, fi) => {
                const clean = tok.trim();
                const key = clean.startsWith('PK ') ? 'PK' : clean.startsWith('FK ') ? 'FK' : '';
                const rest = clean.replace(/^(PK|FK)\s+/, '');
                const [fname, ftype] = rest.split(':').map((s) => s.trim());
                return { id: `ef_${fi}`, name: fname || `col_${fi}`, type: ftype || 'varchar', key: key as '' | 'PK' | 'FK' };
              })
            : undefined;

        return {
          id: idMap.get(n.id)!,
          type: n.type || templateItem.type,
          category: isContainer ? 'container' : isErd ? 'entity' : 'shape',
          label: n.label,
          x: 120 + idx * 40,
          y: 120 + idx * 40,
          width: templateItem?.defaultWidth ?? 172,
          height: isErd && parsedFields ? Math.max(120, 44 + parsedFields.length * 26) : templateItem?.defaultHeight ?? 72,
          rotation: 0,
          layerId: 'layer-main',
          zIndex: isContainer ? 0 : idx + 2,
          visible: true,
          locked: false,
          parentId: n.parentId ? idMap.get(n.parentId) : undefined,
          style: {
            fill: templateItem?.fill ?? '#FFFFFF',
            stroke: templateItem?.stroke ?? '#2563EB',
            strokeWidth: 1.5,
            textColor: templateItem?.textColor ?? '#0F172A',
            fontSize: 13,
            borderRadius: templateItem?.borderRadius ?? 10,
            opacity: 1,
            dashed: templateItem?.dashed,
            shadow: !isContainer,
          },
          metadata: {
            subtitle: n.subtitle,
            technology: n.technology,
            isContainer,
            environment: 'production',
            fields: parsedFields,
          },
        };
      });

      const connections: DiagramConnection[] = (raw.connections ?? [])
        .filter((c) => idMap.has(c.fromId) && idMap.has(c.toId))
        .map((c) => {
          const protoPreset = c.protocol ? PROTOCOL_STYLES[c.protocol] : undefined;
          return {
            id: makeId('conn'),
            fromId: idMap.get(c.fromId)!,
            toId: idMap.get(c.toId)!,
            fromPort: 'auto',
            toPort: 'auto',
            label: c.label || c.protocol,
            protocol: c.protocol,
            routing: 'orthogonal',
            lineStyle: protoPreset?.lineStyle ?? (c.style === 'dashed' ? 'dashed' : 'solid'),
            color: protoPreset?.color ?? '#475569',
            strokeWidth: 1.75,
            arrowStart: 'none',
            arrowEnd: doc.type === 'erd' ? 'crow' : 'arrow',
          };
        });

      const laidOut = applyAutoLayout(
        {
          ...doc,
          title: raw.title || doc.title,
          objects,
          connections,
        },
        doc.type === 'architecture' || doc.type === 'network' ? 'LR' : 'TB'
      );

      onApplyGeneratedDoc(laidOut);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to generate diagram.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    setAnalysis(null);
    try {
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document: doc }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Analysis request failed.');
      setAnalysis(json as AnalysisResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to analyze diagram.');
    } finally {
      setLoading(false);
    }
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
        aria-label="AI Diagram Studio"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              AI Diagram Assistant
            </h2>
            <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 ml-2">
              <button
                type="button"
                onClick={() => setMode('generate')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md ${
                  mode === 'generate'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Generate
              </button>
              <button
                type="button"
                onClick={() => setMode('analyze')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md ${
                  mode === 'analyze'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Review & Summarize
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

        {mode === 'generate' ? (
          <div className="p-5 space-y-4">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Describe your system, workflow, or call sequence in plain English. Generated diagrams use native, fully editable canvas objects and participate in Undo/Redo.
            </p>
            <textarea
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={examplePrompts[doc.type] || examplePrompts.flowchart}
              className="w-full p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500"
            />
            <button
              type="button"
              onClick={() => setPrompt(examplePrompts[doc.type] || examplePrompts.flowchart)}
              className="text-xs text-blue-600 hover:underline font-medium"
            >
              Use example prompt for {doc.type}
            </button>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loading || !prompt.trim()}
                onClick={handleGenerate}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                <span>{loading ? 'Generating...' : 'Generate Editable Diagram'}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Generate an architecture summary and surface potential missing steps or simplifications. Observations are presented as suggestions only.
            </p>
            <button
              type="button"
              disabled={loading}
              onClick={handleAnalyze}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>{loading ? 'Analyzing...' : 'Analyze Current Diagram'}</span>
            </button>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300">
                {error}
              </div>
            )}

            {analysis && (
              <div className="space-y-3 max-h-72 overflow-y-auto pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                <div>
                  <div className="font-semibold text-slate-900 dark:text-slate-100 mb-1">Summary (AI Suggestion)</div>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{analysis.summary}</p>
                </div>
                {analysis.risksAndGaps.length > 0 && (
                  <div>
                    <div className="font-semibold text-amber-700 dark:text-amber-400 mb-1">Potential Gaps</div>
                    <ul className="list-disc pl-4 space-y-1 text-slate-600 dark:text-slate-300">
                      {analysis.risksAndGaps.map((g, i) => (
                        <li key={i}>{g}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {analysis.suggestions.length > 0 && (
                  <div>
                    <div className="font-semibold text-blue-700 dark:text-blue-400 mb-1">Recommended Improvements</div>
                    <ul className="list-disc pl-4 space-y-1 text-slate-600 dark:text-slate-300">
                      {analysis.suggestions.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
