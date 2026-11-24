import { GoogleGenAI, Type } from '@google/genai';

function getEnvVar(name: string): string | undefined {
  const proc = (
    globalThis as unknown as {
      process?: { env?: Record<string, string | undefined> };
    }
  ).process;
  return proc?.env?.[name];
}

function getAiClient(): GoogleGenAI {
  const apiKey = getEnvVar('GEMINI_API_KEY');
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in Netlify environment variables.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'nexora-netlify',
      },
    },
  });
}

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname
    .replace(/^\/\.netlify\/functions\/api/, '')
    .replace(/^\/api/, '') || '/';

  if (req.method === 'GET' && path === '/health') {
    return jsonResponse({
      status: 'ok',
      aiAvailable: Boolean(getEnvVar('GEMINI_API_KEY')),
    });
  }

  if (req.method === 'POST' && path === '/ai/generate') {
    try {
      const body = (await req.json()) as {
        prompt?: string;
        diagramType?: string;
      };
      const { prompt, diagramType } = body;

      if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 3) {
        return jsonResponse(
          { error: 'Please provide a clear description of the diagram to generate.' },
          400
        );
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
        return jsonResponse({ diagramType: 'sequence', data: parsed });
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
      return jsonResponse({ diagramType: targetType, data: parsed });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to generate diagram';
      return jsonResponse({ error: message }, 500);
    }
  }

  if (req.method === 'POST' && path === '/ai/analyze') {
    try {
      const body = (await req.json()) as { document?: unknown };
      if (!body.document) {
        return jsonResponse({ error: 'Diagram document payload is required.' }, 400);
      }

      const ai = getAiClient();
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Analyze this diagram document and provide a clear architectural summary, potential gaps or missing steps, and actionable improvement suggestions.\n\nDocument JSON:\n${JSON.stringify(body.document).slice(0, 18000)}`,
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
      return jsonResponse(parsed);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to analyze diagram';
      return jsonResponse({ error: message }, 500);
    }
  }

  return jsonResponse({ error: 'Not found' }, 404);
}
