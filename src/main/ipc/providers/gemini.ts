import type { ProviderAdapter, StreamSender } from './types';
import type { LLMMessage } from '../../../shared/types';

interface GeminiContent {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}

// Cached access token for Vertex AI
let cachedToken: { token: string; expireAt: number } | null = null;

async function getVertexAccessToken(serviceAccountJsonPath: string): Promise<string> {
  const now = Date.now();

  // Return cached token if still valid (with 1 minute buffer)
  if (cachedToken && now < cachedToken.expireAt - 60_000) {
    return cachedToken.token;
  }

  // Dynamically import google-auth-library only when needed
  try {
    const { GoogleAuth } = await import('google-auth-library');

    const auth = new GoogleAuth({
      keyFile: serviceAccountJsonPath,
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });

    const client = await auth.getClient();
    const tokenResponse = await (client as any).getAccessToken();

    // Cache token for ~55 minutes (GCP tokens usually last 1 hour)
    cachedToken = {
      token: tokenResponse.token as string,
      expireAt: now + 55 * 60 * 1000,
    };

    return cachedToken.token;
  } catch (err: any) {
    throw new Error(`Failed to get Vertex access token: ${err.message}`);
  }
}

function convertMessages(messages: LLMMessage[], system?: string): {
  systemInstruction?: { parts: Array<{ text: string }> };
  contents: GeminiContent[];
} {
  const systemMessage = system || messages.find((m) => m.role === 'system')?.content;
  const nonSystemMessages = messages.filter((m) => m.role !== 'system');

  return {
    systemInstruction: systemMessage ? { parts: [{ text: systemMessage }] } : undefined,
    contents: nonSystemMessages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    })),
  };
}

export const geminiAdapter: ProviderAdapter = {
  async streamChat(input, send: StreamSender, abortSignal: AbortSignal, config) {
    const { systemInstruction, contents } = convertMessages(input.messages, input.system);

    let url: string;
    let headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Determine mode: API Key or Vertex
    if (config.gemini.useVertex) {
      // Vertex AI mode
      if (!config.gemini.projectId || !config.gemini.location || !config.gemini.serviceAccountJsonPath) {
        send({
          type: 'error',
          message: 'Gemini Vertex mode requires projectId, location, and serviceAccountJsonPath',
          code: 'config_error',
        });
        return;
      }

      try {
        const accessToken = await getVertexAccessToken(config.gemini.serviceAccountJsonPath);
        headers['Authorization'] = `Bearer ${accessToken}`;

        const { projectId, location } = config.gemini;
        url = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${input.model}:streamGenerateContent`;
      } catch (err: any) {
        send({ type: 'error', message: err.message, code: 'auth_error' });
        return;
      }
    } else {
      // API Key mode
      if (!config.apiKey) {
        send({ type: 'error', message: 'Gemini API key not configured', code: 'config_error' });
        return;
      }

      url = `https://generativelanguage.googleapis.com/v1beta/models/${input.model}:streamGenerateContent?key=${config.apiKey}`;
    }

    const body: any = {
      contents,
      generationConfig: {
        temperature: input.temperature ?? config.temperature ?? 0.7,
        topP: input.top_p ?? 1,
        maxOutputTokens: input.max_tokens ?? config.max_tokens ?? 2048,
      },
    };
 
    if (systemInstruction) {
      body.systemInstruction = systemInstruction;
    }

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        signal: abortSignal,
        headers,
        body: JSON.stringify(body),
      });
    } catch (err: any) {
      if (err.name === 'AbortError') {
        send({ type: 'error', message: 'Request cancelled', code: 'cancelled' });
      } else {
        send({ type: 'error', message: `Network error: ${err.message}`, code: 'network_error' });
      }
      return;
    }

    if (!response.ok || !response.body) {
      let detail = '';
      try {
        detail = await response.text();
      } catch {}
      send({
        type: 'error',
        message: `HTTP ${response.status} ${response.statusText} ${detail}`.trim(),
        code: 'http_error',
      });
      return;
    }

    // Gemini streams as chunked JSON (not SSE)
    const reader = response.body.getReader();
    let buffer = '';

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += new TextDecoder().decode(value, { stream: true });

        // Try to parse JSON chunks
        let parsed = false;
        while (buffer.length > 0) {
          try {
            // Gemini may send multiple JSON objects separated by newlines
            const firstBrace = buffer.indexOf('{');
            if (firstBrace === -1) break;

            buffer = buffer.slice(firstBrace);
            const json = JSON.parse(buffer);

            // Successfully parsed, remove from buffer
            const jsonStr = JSON.stringify(json);
            buffer = buffer.slice(jsonStr.length);
            parsed = true;

            // Extract text from candidates
            const candidate = json.candidates?.[0];
            if (candidate?.content?.parts) {
              for (const part of candidate.content.parts) {
                if (part.text) {
                  send({ type: 'delta', text: part.text });
                }
              }
            }

            // Check if done
            if (candidate?.finishReason) {
              // Extract usage if available
              if (json.usageMetadata) {
                const usage = {
                  prompt_tokens: json.usageMetadata.promptTokenCount || 0,
                  completion_tokens: json.usageMetadata.candidatesTokenCount || 0,
                  total_tokens: json.usageMetadata.totalTokenCount || 0,
                };
                send({ type: 'done', usage });
              } else {
                send({ type: 'done' });
              }
              return;
            }
          } catch (e) {
            // JSON parse failed, wait for more data
            if (!parsed) {
              // If we haven't parsed anything yet, try to find next object boundary
              const nextBrace = buffer.indexOf('{', 1);
              if (nextBrace !== -1) {
                buffer = buffer.slice(nextBrace);
              } else {
                break;
              }
            }
            break;
          }
        }
      }

      send({ type: 'done' });
    } catch (err: any) {
      if (err.name === 'AbortError') {
        send({ type: 'error', message: 'Request cancelled', code: 'cancelled' });
      } else {
        send({ type: 'error', message: `Stream error: ${err.message}`, code: 'stream_error' });
      }
    }
  },
};
