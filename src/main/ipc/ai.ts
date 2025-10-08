import { ipcMain, WebContents } from 'electron';
import { randomUUID } from 'crypto';
import { getAIConfigWithSecrets } from '../core/config';
import { providers } from './providers';
import type { LLMRequest } from '../../shared/types';

const ACTIVE_CONTROLLERS = new Map<string, AbortController>();

function sendChunk(wc: WebContents, id: string, data: any) {
  if (!wc.isDestroyed()) {
    wc.send(`ai.stream.${id}`, data);
  }
}

export function registerAiHandlers(): void {
  ipcMain.handle('ai.stream', async (event, payload: LLMRequest) => {
    const wc = event.sender;
    const id = randomUUID();
    const config = await getAIConfigWithSecrets();

    // Validate provider
    const adapter = providers[config.provider];
    if (!adapter) {
      return {
        id,
        error: `Unknown provider: ${config.provider}`,
      };
    }

    const controller = new AbortController();
    ACTIVE_CONTROLLERS.set(id, controller);

    // Set up timeout
    const timeoutMs = payload.system?.includes('timeout:')
      ? parseInt(payload.system.match(/timeout:(\d+)/)?.[1] || '0', 10)
      : config.timeoutMs;

    const timeoutId = setTimeout(() => {
      controller.abort('timeout');
      ACTIVE_CONTROLLERS.delete(id);
      sendChunk(wc, id, { type: 'error', message: 'Request timeout', code: 'timeout' });
    }, timeoutMs);

    // Start streaming asynchronously
    (async () => {
      try {
        await adapter.streamChat(
          {
            messages: payload.messages,
            model: payload.model || config.model,
            temperature: payload.temperature,
            top_p: payload.top_p,
            max_tokens: payload.max_tokens,
            system: payload.system,
            timeoutMs,
          },
          (chunk) => sendChunk(wc, id, chunk),
          controller.signal,
          config  // Pass full config with secrets
        );
      } catch (err: any) {
        console.error('[ai.stream] Unexpected error:', err);
        sendChunk(wc, id, {
          type: 'error',
          message: err.message || 'Unknown error',
          code: 'unexpected_error',
        });
      } finally {
        clearTimeout(timeoutId);
        ACTIVE_CONTROLLERS.delete(id);
      }
    })();

    return { id };
  });

  ipcMain.handle('ai.cancel', async (_event, { id }: { id: string }) => {
    const ctrl = ACTIVE_CONTROLLERS.get(id);
    if (ctrl) {
      ctrl.abort('user-cancel');
      ACTIVE_CONTROLLERS.delete(id);
      return { ok: true };
    }
    return { ok: false, reason: 'not-found' };
  });

  console.log('[ai] Handlers registered');
}
