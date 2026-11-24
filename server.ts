import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function resolveServerPort(): number {
  const portFlagIdx = process.argv.indexOf('--port');
  if (portFlagIdx !== -1 && process.argv[portFlagIdx + 1]) {
    const cliPort = Number(process.argv[portFlagIdx + 1]);
    if (Number.isFinite(cliPort) && cliPort > 0) return cliPort;
  }
  if (process.env.NODE_ENV === 'production') {
    const prodPort = Number(process.env.PORT);
    if (Number.isFinite(prodPort) && prodPort > 0) return prodPort;
    return 3000;
  }
  const devPort = Number(process.env.DEFAULT_APP_PORT) || 3000;
  return devPort;
}

const PORT = resolveServerPort();

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in the server environment.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '4mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', aiAvailable: Boolean(process.env.GEMINI_API_KEY) });
  });

  app.post('/api/ai/generate', async (req, res) => {
    try {
      const { prompt, diagramType } = req.body as {
        prompt?: string;
        diagramType?: string;
      };

      if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 3) {
        return res.status(400).json({ error: 'Please provide a clear description of the diagram to generate.' });
      }

      const ai = getAiClient();
      const targetType = diagramType || 'flowchart';

      if (targetType === 'sequence') {
        const response = await ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: `Create a realistic, well-structured software sequence diagram for the following request:\n"${prompt.trim()}"`,
          config: {
            systemInstruction:
              'You are a senior software architect creating clean, realistic sequence diagrams. Generate 3 to 7 participants with concise names and appropriate participant types (user, browser, mobile, web-ui, api, microservice, auth, cache, database, queue, external). Generate 5 to 14 ordered messages with clear labels, accurate types (sync, async, return, self, event), optional HTTP/protocol tags, and optional endpoint paths. Include 0 to 2 logical combined fragments (alt, opt, loop, par) only when genuinely helpful.',
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                participants: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      name: { type: Type.STRING },
                      role: { type: Type.STRING },
                      subtitle: { type: Type.STRING },
                    },
                    required: ['id', 'name', 'role'],
                  },
                },
                messages: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      fromId: { type: Type.STRING },
                      toId: { type: Type.STRING },
                      label: { type: Type.STRING },
                      type: { type: Type.STRING },
                      protocol: { type: Type.STRING },
                      endpoint: { type: Type.STRING },
                    },
                    required: ['fromId', 'toId', 'label', 'type'],
                  },
                },
                fragments: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      kind: { type: Type.STRING },
                      guard: { type: Type.STRING },
                      startIndex: { type: Type.INTEGER },
                      endIndex: { type: Type.INTEGER },
                    },
                    required: ['kind', 'guard', 'startIndex', 'endIndex'],
                  },
                },
              },
              required: ['title', 'participants', 'messages'],
            },
          },
        });

        const parsed = JSON.parse((response.text ?? '{}').trim());
        return res.json({ diagramType: 'sequence', data: parsed });
      }

      const typeGuidance: Record<string, string> = {
        flowchart:
          'Use node types from: start, process, decision, io, document, database, subprocess, delay, end. Always include a start and end node, and label decision branches clearly (e.g. Yes / No).',
        architecture:
          'Use node types from: arch-user, arch-browser, arch-mobile, arch-cdn, arch-webapp, arch-gateway, arch-api, arch-service, arch-function, arch-auth, arch-db, arch-cache, arch-queue, arch-storage, arch-external, arch-container. Include 1 or 2 logical containers (e.g. Cloud VPC) if helpful, and specify protocols (HTTPS, REST, gRPC, SQL, Event) on connections.',
        network:
          'Use node types from: net-internet, net-firewall, net-router, net-switch, net-server, net-workstation, net-ap, net-subnet. Label connections with protocols or VLANs.',
        erd:
          'Use node type "erd-entity" for all entities. Put comma-separated fields in description (e.g. "PK id: uuid, email: string, FK org_id: uuid"). Label relationships with cardinality like "1:N", "1:1", or "N:M".',
        orgchart:
          'Use node types "org-exec", "org-manager", "org-member", "org-team". Put role title in subtitle.',
        journey:
          'Use node types "journey-stage", "journey-action", "journey-touchpoint", "journey-pain", "journey-opportunity".',
      };

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Generate a structured ${targetType} diagram for:\n"${prompt.trim()}"`,
        config: {
          systemInstruction: `You are a principal visual systems designer. Generate a clean, presentation-ready ${targetType} diagram with 4 to 12 nodes and logical directed connections. ${typeGuidance[targetType] || typeGuidance.flowchart} Keep labels crisp (2 to 5 words).`,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              nodes: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    type: { type: Type.STRING },
                    label: { type: Type.STRING },
                    subtitle: { type: Type.STRING },
                    description: { type: Type.STRING },
                    technology: { type: Type.STRING },
                    parentId: { type: Type.STRING },
                  },
                  required: ['id', 'type', 'label'],
                },
              },
              connections: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    fromId: { type: Type.STRING },
                    toId: { type: Type.STRING },
                    label: { type: Type.STRING },
                    protocol: { type: Type.STRING },
                    style: { type: Type.STRING },
                  },
                  required: ['fromId', 'toId'],
                },
              },
            },
            required: ['title', 'nodes', 'connections'],
          },
        },
      });

      const parsed = JSON.parse((response.text ?? '{}').trim());
      return res.json({ diagramType: targetType, data: parsed });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to generate diagram';
      console.error('AI generation error:', err);
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/ai/analyze', async (req, res) => {
    try {
      const { document } = req.body as { document?: unknown };
      if (!document) {
        return res.status(400).json({ error: 'Diagram document payload is required.' });
      }

      const ai = getAiClient();
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Analyze this diagram document and provide a clear architectural summary, potential gaps or missing steps, and actionable improvement suggestions.\n\nDocument JSON:\n${JSON.stringify(document).slice(0, 18000)}`,
        config: {
          systemInstruction:
            'You are a pragmatic systems architect reviewing a visual diagram. Be concise, concrete, and structured. Clearly label technical observations as suggestions.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
              risksAndGaps: { type: Type.ARRAY, items: { type: Type.STRING } },
              suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ['summary', 'strengths', 'risksAndGaps', 'suggestions'],
          },
        },
      });

      const parsed = JSON.parse((response.text ?? '{}').trim());
      return res.json(parsed);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to analyze diagram';
      console.error('AI analysis error:', err);
      res.status(500).json({ error: message });
    }
  });

  const httpServer = http.createServer(app);
  let viteServer: { close: () => Promise<void> } | null = null;

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const disableHmr = process.env.DISABLE_HMR === 'true';
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        allowedHosts: true,
        hmr: disableHmr ? false : { server: httpServer },
        ws: disableHmr ? false : undefined,
      },
      appType: 'spa',
    });
    viteServer = vite;
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Project Canvas server running on http://0.0.0.0:${PORT}`);
  });

  const shutdown = async () => {
    try {
      if (viteServer) {
        await viteServer.close();
      }
    } catch {
      // ignore close errors during shutdown
    }
    httpServer.close(() => {
      process.exit(0);
    });
    setTimeout(() => process.exit(0), 1500).unref();
  };

  process.once('SIGTERM', shutdown);
  process.once('SIGINT', shutdown);
}

startServer().catch((err) => {
  console.error('Failed to start Project Canvas server:', err);
  process.exit(1);
});
